-- CR7-R12: new-account service dates use the immutable accepted proposal design.
-- Preserve function signature, ACL, security boundary and money commands.
-- No historical account backfill. Rehearse under explicit ROLLBACK.
create or replace function public.initialize_journey_account_command(
  p_enquiry_id uuid,p_actor_id uuid,p_amount numeric,p_payment_date date,
  p_payment_method text default null,p_reference text default null,p_notes text default null
) returns uuid language plpgsql security definer set search_path='' as $$
declare enquiry_row public.enquiries%rowtype;proposal_row public.journey_proposals%rowtype;
  account_row public.journey_accounts%rowtype;line jsonb;operation jsonb;summary jsonb;
  accepted_start date;accepted_end date;accepted_start_text text;accepted_end_text text;
  internal_cost numeric;line_cost numeric;line_currency text;line_type text;line_allocation_id uuid;deposit_key text;
begin
  if auth.role()<>'service_role' or p_actor_id is null or not private.staff_has_permission(p_actor_id,'finance.payments.manage') then
    raise exception using errcode='42501',message='The caller is not authorised to initialize Accounting.';
  end if;
  if p_amount is null or p_amount<=0 or p_payment_date is null then raise exception using errcode='22023',message='A positive deposit and payment date are required.';end if;
  perform pg_advisory_xact_lock(hashtextextended(p_enquiry_id::text,8));
  select * into enquiry_row from public.enquiries where id=p_enquiry_id for update;
  if enquiry_row.id is null then raise exception using errcode='P0002',message='Traveller enquiry not found.';end if;
  select proposal.* into proposal_row from public.journey_proposals proposal
  join public.journey_proposal_acceptances acceptance on acceptance.proposal_id=proposal.id
  where proposal.enquiry_id=p_enquiry_id and proposal.status='approved'
  order by proposal.version desc limit 1 for update of proposal;
  if proposal_row.id is null then raise exception using errcode='55000',message='An accepted proposal is required before Accounting can be initialized.';end if;
  summary:=proposal_row.commercial_snapshot->'summary';
  if jsonb_typeof(summary) is distinct from 'object' or jsonb_typeof(proposal_row.allocation_snapshot) is distinct from 'array' then raise exception using errcode='55000',message='The accepted proposal commercial basis is incomplete.';end if;
  internal_cost:=coalesce((summary->>'internalCost')::numeric,proposal_row.total_supplier_cost);
  if p_amount>proposal_row.total_selling_price+0.005 then raise exception using errcode='22003',message='Deposit exceeds the accepted proposal selling price.';end if;
  perform set_config('roam.financial_command','on',true);
  select * into account_row from public.journey_accounts where enquiry_id=p_enquiry_id for update;
  if account_row.id is null then
    -- Only new accounts take the immutable accepted design, never the original request.
    accepted_start_text:=proposal_row.sent_snapshot#>>'{journey,startDate}';
    accepted_end_text:=proposal_row.sent_snapshot#>>'{journey,endDate}';
    if accepted_start_text is null or accepted_end_text is null
      or accepted_start_text !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
      or accepted_end_text !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
      raise exception using errcode='23514',message='Valid accepted journey dates are required before Accounting can be initialized.';
    end if;
    begin
      accepted_start:=accepted_start_text::date;
      accepted_end:=accepted_end_text::date;
    exception when datetime_field_overflow or invalid_datetime_format then
      raise exception using errcode='23514',message='Valid accepted journey dates are required before Accounting can be initialized.';
    end;
    if accepted_end<=accepted_start
      or to_char(accepted_start,'YYYY-MM-DD')<>accepted_start_text
      or to_char(accepted_end,'YYYY-MM-DD')<>accepted_end_text
      or proposal_row.curated_journey_snapshot#>>'{travelDates,start}' is distinct from accepted_start_text
      or proposal_row.curated_journey_snapshot#>>'{travelDates,end}' is distinct from accepted_end_text then
      raise exception using errcode='23514',message='Accounting dates must match the valid accepted journey design.';
    end if;
    insert into public.journey_accounts(enquiry_id,journey_reference,traveller_name,traveller_email,status,active,activated_at,currency,
      selling_price,internal_cost,gross_profit,profit_margin,travel_start_date,travel_end_date,quote_snapshot,created_by)
    values(enquiry_row.id,enquiry_row.journey_reference,enquiry_row.name,enquiry_row.email,'active',true,now(),proposal_row.currency,
      proposal_row.total_selling_price,internal_cost,proposal_row.gross_profit,proposal_row.profit_margin,
      accepted_start,accepted_end,
      jsonb_build_object('source','accepted_proposal','proposalId',proposal_row.id,'proposalReference',proposal_row.proposal_reference,
        'proposalVersion',proposal_row.version,'summary',summary,'commercialContext',proposal_row.commercial_snapshot->'context','allocations',proposal_row.allocation_snapshot),p_actor_id)
    returning * into account_row;
    for line in select value from jsonb_array_elements(proposal_row.allocation_snapshot) loop
      if coalesce(line->>'confirmationStatus','pending')<>'cancelled' then
        line_cost:=coalesce((line->>'supplierCost')::numeric,0);line_currency:=upper(coalesce(nullif(line->>'currency',''),proposal_row.currency));
        line_type:=line->>'type';
        if line_type is null or line_type not in('accommodation','vehicle','guide','experience','destination')
          or coalesce(line->>'allocationId','') !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$'
          or line_currency<>upper(proposal_row.currency) or line_cost<0 then
          raise exception using errcode='22023',message='The accepted supplier allocation snapshot is invalid.';
        end if;
        line_allocation_id:=(line->>'allocationId')::uuid;
        insert into public.journey_settlements(account_id,allocation_id,source_key,payee_type,entity_id,payee_name,description,currency,amount_due,notes)
        values(account_row.id,case when exists(select 1 from public.journey_supplier_allocations where id=line_allocation_id) then line_allocation_id else null end,'proposal-allocation:'||(line->>'allocationId'),line_type,
          nullif(line->>'resourceId','')::uuid,coalesce(nullif(btrim(line->>'providerName'),''),nullif(btrim(line->>'resourceName'),''),'Supplier'),
          coalesce(line->>'serviceName',line->>'resourceName'),proposal_row.currency,line_cost,line->>'specialNotes');
      end if;
    end loop;
    if jsonb_typeof(summary->'breakdown')='array' then
      for operation in select value from jsonb_array_elements(summary->'breakdown') loop
        if operation->>'category'='operations' and coalesce((operation->>'amount')::numeric,0)>0 then
          insert into public.journey_settlements(account_id,source_key,payee_type,payee_name,description,currency,amount_due,notes)
          values(account_row.id,'business-operation:'||(operation->>'key'),'operations',coalesce(operation->>'label','Journey operations'),
            'Accepted proposal operational allowance',proposal_row.currency,(operation->>'amount')::numeric,'Generated from the accepted proposal commercial snapshot.');
        end if;
      end loop;
    end if;
  elsif account_row.quote_snapshot->>'proposalReference' is distinct from proposal_row.proposal_reference
     and account_row.quote_snapshot->>'source'='accepted_proposal' then
    raise exception using errcode='55000',message='The existing account belongs to a different accepted commercial basis.';
  end if;
  if account_row.status='closed' then raise exception using errcode='55000',message='A closed account cannot receive a deposit.';end if;
  deposit_key:='initial-deposit:'||p_enquiry_id::text;
  if not exists(select 1 from public.accounting_transactions where account_id=account_row.id and idempotency_key=deposit_key) then
    if p_amount>greatest(0,account_row.selling_price-account_row.closure_adjustment-account_row.amount_received)+0.005 then raise exception using errcode='22003',message='Deposit exceeds the outstanding traveller balance.';end if;
    insert into public.accounting_transactions(account_id,transaction_type,amount,currency,payment_date,payment_method,reference,notes,idempotency_key,created_by)
    values(account_row.id,'customer_receipt',p_amount,account_row.currency,p_payment_date,nullif(btrim(p_payment_method),''),nullif(btrim(p_reference),''),coalesce(nullif(btrim(p_notes),''),'Initial traveller deposit'),deposit_key,p_actor_id);
    insert into public.accounting_lifecycle_history(account_id,from_status,to_status,enquiry_status,reason,changed_by)
    values(account_row.id,'active','part_paid','deposit_paid','Initial traveller deposit recorded.',p_actor_id);
    perform public.execute_enquiry_transition(p_enquiry_id,'record_deposit',p_actor_id,'Initial traveller deposit recorded.');
  end if;
  return account_row.id;
end $$;
