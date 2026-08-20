begin;

alter table public.accounting_transactions
  add column if not exists reverses_transaction_id uuid references public.accounting_transactions(id) on delete restrict;

create index if not exists accounting_transactions_reversal_source_idx
on public.accounting_transactions(reverses_transaction_id)
where reverses_transaction_id is not null;

create or replace function private.guard_posted_financial_event()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if coalesce(current_setting('roam.phase8_cleanup',true),'')<>'on' then
    raise exception using errcode='55000',message='Posted financial events are immutable; use an authorised reversal command.';
  end if;
  return coalesce(new,old);
end $$;

drop trigger if exists accounting_transactions_immutable on public.accounting_transactions;
create trigger accounting_transactions_immutable before update or delete on public.accounting_transactions
for each row execute function private.guard_posted_financial_event();

drop trigger if exists accounting_attachments_immutable on public.accounting_attachments;
create trigger accounting_attachments_immutable before update or delete on public.accounting_attachments
for each row execute function private.guard_posted_financial_event();

create or replace function private.guard_journey_account_financial_basis()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if coalesce(current_setting('roam.financial_command',true),'')<>'on' and (
    new.enquiry_id is distinct from old.enquiry_id or new.journey_reference is distinct from old.journey_reference
    or new.currency is distinct from old.currency or new.selling_price is distinct from old.selling_price
    or new.internal_cost is distinct from old.internal_cost or new.gross_profit is distinct from old.gross_profit
    or new.profit_margin is distinct from old.profit_margin or new.quote_snapshot is distinct from old.quote_snapshot
    or new.closure_adjustment is distinct from old.closure_adjustment or new.closure_reason is distinct from old.closure_reason
    or new.manually_closed_at is distinct from old.manually_closed_at or new.manually_closed_by is distinct from old.manually_closed_by
  ) then
    raise exception using errcode='42501',message='Journey account financial values may only change through an authorised accounting command.';
  end if;
  return new;
end $$;

drop trigger if exists journey_accounts_guard_financial_basis on public.journey_accounts;
create trigger journey_accounts_guard_financial_basis before update on public.journey_accounts
for each row execute function private.guard_journey_account_financial_basis();

create or replace function private.guard_settlement_financial_basis()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if coalesce(current_setting('roam.financial_command',true),'')<>'on' and (
    new.account_id is distinct from old.account_id or new.allocation_id is distinct from old.allocation_id
    or new.source_key is distinct from old.source_key or new.payee_type is distinct from old.payee_type
    or new.entity_id is distinct from old.entity_id or new.currency is distinct from old.currency
    or new.amount_due is distinct from old.amount_due or new.amount_paid is distinct from old.amount_paid
    or new.waived_amount is distinct from old.waived_amount or new.status is distinct from old.status
  ) then
    raise exception using errcode='42501',message='Settlement financial values may only change through an authorised accounting command.';
  end if;
  return new;
end $$;

drop trigger if exists journey_settlements_guard_financial_basis on public.journey_settlements;
create trigger journey_settlements_guard_financial_basis before update on public.journey_settlements
for each row execute function private.guard_settlement_financial_basis();

create or replace function private.refresh_journey_account()
returns trigger language plpgsql security definer set search_path='' as $$
declare target_account uuid:=coalesce(new.account_id,old.account_id);target_settlement uuid:=coalesce(new.settlement_id,old.settlement_id);
begin
  perform set_config('roam.financial_command','on',true);
  if target_settlement is not null then
    update public.journey_settlements set
      amount_paid=greatest(0,
        coalesce((select sum(amount) from public.accounting_transactions where settlement_id=target_settlement and transaction_type='supplier_payment'),0)
        -coalesce((select sum(amount) from public.accounting_transactions where settlement_id=target_settlement and transaction_type in('supplier_recovery','supplier_payment_reversal')),0)
      ),
      waived_amount=greatest(0,
        coalesce((select sum(amount) from public.accounting_transactions where settlement_id=target_settlement and transaction_type='supplier_waiver'),0)
        -coalesce((select sum(amount) from public.accounting_transactions where settlement_id=target_settlement and transaction_type='supplier_waiver_reversal'),0)
      )
    where id=target_settlement;
  end if;
  perform private.recalculate_journey_account(target_account);return null;
end $$;

create or replace function public.initialize_journey_account_command(
  p_enquiry_id uuid,p_actor_id uuid,p_amount numeric,p_payment_date date,
  p_payment_method text default null,p_reference text default null,p_notes text default null
) returns uuid language plpgsql security definer set search_path='' as $$
declare enquiry_row public.enquiries%rowtype;proposal_row public.journey_proposals%rowtype;
  account_row public.journey_accounts%rowtype;line jsonb;operation jsonb;summary jsonb;
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
    insert into public.journey_accounts(enquiry_id,journey_reference,traveller_name,traveller_email,status,active,activated_at,currency,
      selling_price,internal_cost,gross_profit,profit_margin,travel_start_date,travel_end_date,quote_snapshot,created_by)
    values(enquiry_row.id,enquiry_row.journey_reference,enquiry_row.name,enquiry_row.email,'active',true,now(),proposal_row.currency,
      proposal_row.total_selling_price,internal_cost,proposal_row.gross_profit,proposal_row.profit_margin,
      enquiry_row.travel_start_date,enquiry_row.travel_end_date,
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

create or replace function public.record_accounting_transaction_command(
  p_account_id uuid,p_actor_id uuid,p_type text,p_amount numeric,p_waived_amount numeric,p_payment_date date,
  p_payment_method text,p_reference text,p_notes text,p_waiver_reason text,p_settlement_id uuid,p_idempotency_key text,
  p_transaction_id uuid default gen_random_uuid(),p_attachment jsonb default null
) returns jsonb language plpgsql security definer set search_path='' as $$
declare account_row public.journey_accounts%rowtype;settlement_row public.journey_settlements%rowtype;cancellation_row public.journey_cancellation_cases%rowtype;
  existing public.accounting_transactions%rowtype;payment_id uuid;waiver_id uuid;remaining numeric;key_base text:=btrim(coalesce(p_idempotency_key,''));
begin
  if auth.role()<>'service_role' or p_actor_id is null or not private.staff_has_permission(p_actor_id,'finance.payments.manage') then raise exception using errcode='42501',message='The caller is not authorised to post financial events.';end if;
  if p_type not in('customer_receipt','customer_refund','supplier_payment','supplier_recovery') or char_length(key_base) not between 8 and 180 or p_payment_date is null then raise exception using errcode='22023',message='The financial command is invalid.';end if;
  if coalesce(p_amount,0)<0 or coalesce(p_waived_amount,0)<0 or (coalesce(p_amount,0)+coalesce(p_waived_amount,0))<=0 then raise exception using errcode='22023',message='A positive financial amount is required.';end if;
  if p_type<>'supplier_payment' and coalesce(p_waived_amount,0)<>0 then raise exception using errcode='22023',message='A waiver is valid only with a supplier settlement command.';end if;
  select * into account_row from public.journey_accounts where id=p_account_id for update;
  if account_row.id is null then raise exception using errcode='P0002',message='Journey account not found.';end if;
  if not account_row.active or account_row.status='closed' then raise exception using errcode='55000',message='This account does not accept new financial events.';end if;
  select * into existing from public.accounting_transactions where account_id=p_account_id and idempotency_key in(key_base||':payment',key_base||':waiver') order by created_at limit 1;
  if existing.id is not null then
    if existing.settlement_id is distinct from p_settlement_id then raise exception using errcode='23505',message='The idempotency key is already used for a different financial event.';end if;
    if p_amount>0 and not exists(select 1 from public.accounting_transactions where account_id=p_account_id and idempotency_key=key_base||':payment' and transaction_type=p_type and amount=p_amount) then raise exception using errcode='23505',message='The idempotency key is already used for a different financial event.';end if;
    if p_waived_amount>0 and not exists(select 1 from public.accounting_transactions where account_id=p_account_id and idempotency_key=key_base||':waiver' and transaction_type='supplier_waiver' and amount=p_waived_amount) then raise exception using errcode='23505',message='The idempotency key is already used for a different financial event.';end if;
    return jsonb_build_object('transactionId',(select id from public.accounting_transactions where account_id=p_account_id and idempotency_key=key_base||':payment'),'waiverTransactionId',(select id from public.accounting_transactions where account_id=p_account_id and idempotency_key=key_base||':waiver'),'idempotent',true);
  end if;
  if p_type in('supplier_payment','supplier_recovery') then
    select * into settlement_row from public.journey_settlements where id=p_settlement_id and account_id=p_account_id for update;
    if settlement_row.id is null then raise exception using errcode='23503',message='Supplier settlement not found for this account.';end if;
    if settlement_row.currency<>account_row.currency then raise exception using errcode='22023',message='Settlement currency does not match the journey account.';end if;
    if p_type='supplier_payment' then
      remaining:=settlement_row.amount_due-settlement_row.amount_paid-settlement_row.waived_amount;
      if p_amount+p_waived_amount>remaining+0.005 then raise exception using errcode='22003',message='Payment and waiver exceed the outstanding supplier balance.';end if;
    elsif p_amount>settlement_row.amount_paid+0.005 then raise exception using errcode='22003',message='Recovery exceeds the net amount paid to this supplier.';end if;
  elsif p_settlement_id is not null then raise exception using errcode='22023',message='Traveller payments cannot be linked to a supplier settlement.';
  end if;
  if p_type='customer_receipt' then
    if p_amount>greatest(0,account_row.selling_price-account_row.closure_adjustment-account_row.amount_received)+0.005 then raise exception using errcode='22003',message='Payment exceeds the outstanding traveller balance.';end if;
    if exists(select 1 from public.journey_cancellation_cases where account_id=p_account_id and assessment_locked_at is not null) then raise exception using errcode='55000',message='Customer payments cannot change after the cancellation assessment is completed.';end if;
  elsif p_type='customer_refund' then
    if p_amount>account_row.amount_received+0.005 then raise exception using errcode='22003',message='Refund exceeds the net amount received from the traveller.';end if;
    select * into cancellation_row from public.journey_cancellation_cases where account_id=p_account_id for update;
    if cancellation_row.id is not null and (cancellation_row.outcome is distinct from 'refund' or cancellation_row.status not in('approved','part_refunded') or p_amount>greatest(0,coalesce(cancellation_row.approved_refund,0)-account_row.amount_refunded)+0.005) then raise exception using errcode='55000',message='Refund exceeds the approved refund liability or the cancellation outcome is not Refund.';end if;
  end if;
  perform set_config('roam.financial_command','on',true);
  if p_amount>0 then
    payment_id:=p_transaction_id;
    insert into public.accounting_transactions(id,account_id,settlement_id,transaction_type,amount,currency,payment_date,payment_method,reference,notes,idempotency_key,created_by)
    values(payment_id,p_account_id,p_settlement_id,p_type,p_amount,account_row.currency,p_payment_date,nullif(btrim(p_payment_method),''),nullif(btrim(p_reference),''),nullif(btrim(p_notes),''),key_base||':payment',p_actor_id);
  end if;
  if p_waived_amount>0 then
    waiver_id:=gen_random_uuid();
    insert into public.accounting_transactions(id,account_id,settlement_id,transaction_type,amount,currency,payment_date,payment_method,reference,notes,idempotency_key,created_by)
    values(waiver_id,p_account_id,p_settlement_id,'supplier_waiver',p_waived_amount,account_row.currency,p_payment_date,'Supplier courtesy',nullif(btrim(p_reference),''),nullif(btrim(p_waiver_reason),''),key_base||':waiver',p_actor_id);
    update public.journey_settlements set waiver_reason=concat_ws(E'\n',waiver_reason,nullif(btrim(p_waiver_reason),'')) where id=p_settlement_id;
  end if;
  if p_attachment is not null then
    if payment_id is null or p_type<>'supplier_payment' or jsonb_typeof(p_attachment)<>'object'
      or p_attachment->>'storagePath' !~ ('^journey-accounts/'||p_account_id::text||'/'||p_settlement_id::text||'/'||payment_id::text||'/[A-Za-z0-9._-]+$')
      or p_attachment->>'mimeType' not in('application/pdf','image/jpeg','image/png','image/webp')
      or coalesce((p_attachment->>'fileSize')::integer,0) not between 1 and 10485760 then raise exception using errcode='22023',message='Receipt linkage is invalid.';end if;
    insert into public.accounting_attachments(account_id,settlement_id,transaction_id,file_name,storage_path,mime_type,file_size,created_by)
    values(p_account_id,p_settlement_id,payment_id,left(p_attachment->>'fileName',255),p_attachment->>'storagePath',p_attachment->>'mimeType',(p_attachment->>'fileSize')::integer,p_actor_id);
  end if;
  return jsonb_build_object('transactionId',payment_id,'waiverTransactionId',waiver_id,'idempotent',false);
end $$;

create or replace function public.create_manual_settlement_command(p_account_id uuid,p_actor_id uuid,p_payee_name text,p_description text,p_amount numeric,p_due_date date,p_notes text,p_idempotency_key text)
returns uuid language plpgsql security definer set search_path='' as $$
declare account_row public.journey_accounts%rowtype;result_id uuid;source text:='other:'||btrim(coalesce(p_idempotency_key,''));
begin
  if auth.role()<>'service_role' or p_actor_id is null or not private.staff_has_permission(p_actor_id,'finance.payments.manage') then raise exception using errcode='42501',message='The caller is not authorised to create settlements.';end if;
  if char_length(btrim(coalesce(p_idempotency_key,''))) not between 8 and 180 or p_amount<=0 or char_length(btrim(coalesce(p_payee_name,'')))<2 then raise exception using errcode='22023',message='The settlement command is invalid.';end if;
  select * into account_row from public.journey_accounts where id=p_account_id for update;if account_row.id is null then raise exception using errcode='P0002',message='Journey account not found.';end if;
  if not account_row.active or account_row.status='closed' then raise exception using errcode='55000',message='Liabilities cannot be added to this account.';end if;
  select id into result_id from public.journey_settlements where account_id=p_account_id and source_key=source;
  if result_id is not null then return result_id;end if;
  insert into public.journey_settlements(account_id,source_key,payee_type,payee_name,description,currency,amount_due,due_date,notes)
  values(p_account_id,source,'other',btrim(p_payee_name),btrim(p_description),account_row.currency,p_amount,p_due_date,nullif(btrim(p_notes),'')) returning id into result_id;
  return result_id;
end $$;

create or replace function public.reverse_supplier_settlement_command(p_account_id uuid,p_settlement_id uuid,p_actor_id uuid,p_payment_amount numeric,p_waiver_amount numeric,p_payment_date date,p_reason text,p_idempotency_key text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare account_row public.journey_accounts%rowtype;settlement_row public.journey_settlements%rowtype;payment_source uuid;waiver_source uuid;payment_id uuid;waiver_id uuid;key_base text:=btrim(coalesce(p_idempotency_key,''));
begin
  if auth.role()<>'service_role' or p_actor_id is null or not private.staff_has_permission(p_actor_id,'finance.settlements.reverse') then raise exception using errcode='42501',message='The caller is not authorised to reverse settlements.';end if;
  if char_length(key_base) not between 8 and 180 or p_payment_date is null or char_length(btrim(coalesce(p_reason,'')))<10 or coalesce(p_payment_amount,0)<0 or coalesce(p_waiver_amount,0)<0 or p_payment_amount+p_waiver_amount<=0 then raise exception using errcode='22023',message='The reversal command is invalid.';end if;
  select * into account_row from public.journey_accounts where id=p_account_id for update;
  select * into settlement_row from public.journey_settlements where id=p_settlement_id and account_id=p_account_id for update;
  if account_row.id is null or settlement_row.id is null then raise exception using errcode='P0002',message='Supplier settlement not found.';end if;
  if account_row.status='closed' then raise exception using errcode='55000',message='A closed account cannot be corrected.';end if;
  if exists(select 1 from public.journey_cancellation_cases where account_id=p_account_id and assessment_locked_at is not null) then raise exception using errcode='55000',message='Reopen the completed cancellation assessment before changing supplier settlements.';end if;
  if exists(select 1 from public.accounting_transactions where account_id=p_account_id and idempotency_key in(key_base||':payment-reversal',key_base||':waiver-reversal')) then return jsonb_build_object('idempotent',true);end if;
  if p_payment_amount>settlement_row.amount_paid+0.005 or p_waiver_amount>settlement_row.waived_amount+0.005 then raise exception using errcode='22003',message='Reversal exceeds the posted supplier settlement amount.';end if;
  if p_payment_amount>0 then select original.id into payment_source from public.accounting_transactions original where original.settlement_id=p_settlement_id and original.transaction_type='supplier_payment' and original.amount-coalesce((select sum(r.amount) from public.accounting_transactions r where r.reverses_transaction_id=original.id),0)>=p_payment_amount order by original.created_at limit 1 for update;
    if payment_source is null then raise exception using errcode='55000',message='No reversible supplier payment exists.';end if;end if;
  if p_waiver_amount>0 then select original.id into waiver_source from public.accounting_transactions original where original.settlement_id=p_settlement_id and original.transaction_type='supplier_waiver' and original.amount-coalesce((select sum(r.amount) from public.accounting_transactions r where r.reverses_transaction_id=original.id),0)>=p_waiver_amount order by original.created_at limit 1 for update;
    if waiver_source is null then raise exception using errcode='55000',message='No reversible supplier waiver exists.';end if;end if;
  perform set_config('roam.financial_command','on',true);
  if p_payment_amount>0 then payment_id:=gen_random_uuid();insert into public.accounting_transactions(id,account_id,settlement_id,transaction_type,amount,currency,payment_date,payment_method,notes,idempotency_key,reverses_transaction_id,created_by)
    values(payment_id,p_account_id,p_settlement_id,'supplier_payment_reversal',p_payment_amount,account_row.currency,p_payment_date,'Accounting correction',btrim(p_reason),key_base||':payment-reversal',payment_source,p_actor_id);end if;
  if p_waiver_amount>0 then waiver_id:=gen_random_uuid();insert into public.accounting_transactions(id,account_id,settlement_id,transaction_type,amount,currency,payment_date,payment_method,notes,idempotency_key,reverses_transaction_id,created_by)
    values(waiver_id,p_account_id,p_settlement_id,'supplier_waiver_reversal',p_waiver_amount,account_row.currency,p_payment_date,'Accounting correction',btrim(p_reason),key_base||':waiver-reversal',waiver_source,p_actor_id);end if;
  insert into public.accounting_lifecycle_history(account_id,from_status,to_status,reason,changed_by) values(p_account_id,account_row.status,account_row.status,'Supplier settlement correction: '||btrim(p_reason),p_actor_id);
  return jsonb_build_object('paymentReversalId',payment_id,'waiverReversalId',waiver_id,'idempotent',false);
end $$;

create or replace function public.close_journey_account_command(p_account_id uuid,p_actor_id uuid,p_reason text,p_override_supplier_balance boolean)
returns jsonb language plpgsql security definer set search_path='' as $$
declare account_row public.journey_accounts%rowtype;outstanding numeric;balance numeric;now_at timestamptz:=now();
begin
  if auth.role()<>'service_role' or p_actor_id is null or not private.staff_has_permission(p_actor_id,'finance.accounts.override') then raise exception using errcode='42501',message='The caller is not authorised to override-close accounts.';end if;
  if char_length(btrim(coalesce(p_reason,'')))<10 then raise exception using errcode='22023',message='A documented closure reason is required.';end if;
  select * into account_row from public.journey_accounts where id=p_account_id for update;if account_row.id is null then raise exception using errcode='P0002',message='Journey account not found.';end if;
  if account_row.status='closed' then return jsonb_build_object('adjustment',account_row.closure_adjustment,'supplierOutstanding',0,'idempotent',true);end if;
  perform 1 from public.journey_settlements where account_id=p_account_id for update;
  select coalesce(sum(greatest(0,amount_due-amount_paid-waived_amount)),0) into outstanding from public.journey_settlements where account_id=p_account_id;
  if outstanding>0.005 and not p_override_supplier_balance then raise exception using errcode='55000',message='Supplier commitments remain unresolved.';end if;
  balance:=greatest(0,account_row.selling_price-account_row.closure_adjustment-account_row.amount_received);
  perform set_config('roam.financial_command','on',true);
  update public.journey_accounts set status='closed',active=false,closure_adjustment=closure_adjustment+balance,closure_reason=btrim(p_reason),manually_closed_at=now_at,manually_closed_by=p_actor_id,settled_at=now_at,deactivated_at=now_at where id=p_account_id;
  insert into public.accounting_lifecycle_history(account_id,from_status,to_status,reason,changed_by) values(p_account_id,account_row.status,'closed','Account override-closed with documented adjustment. '||btrim(p_reason),p_actor_id);
  return jsonb_build_object('adjustment',balance,'supplierOutstanding',outstanding,'idempotent',false);
end $$;

revoke insert,update,delete on public.journey_accounts,public.journey_settlements,public.accounting_transactions,public.accounting_attachments,public.accounting_lifecycle_history from anon,authenticated;

revoke all on function public.initialize_journey_account_command(uuid,uuid,numeric,date,text,text,text) from public,anon,authenticated;
revoke all on function public.record_accounting_transaction_command(uuid,uuid,text,numeric,numeric,date,text,text,text,text,uuid,text,uuid,jsonb) from public,anon,authenticated;
revoke all on function public.create_manual_settlement_command(uuid,uuid,text,text,numeric,date,text,text) from public,anon,authenticated;
revoke all on function public.reverse_supplier_settlement_command(uuid,uuid,uuid,numeric,numeric,date,text,text) from public,anon,authenticated;
revoke all on function public.close_journey_account_command(uuid,uuid,text,boolean) from public,anon,authenticated;
grant execute on function public.initialize_journey_account_command(uuid,uuid,numeric,date,text,text,text) to service_role;
grant execute on function public.record_accounting_transaction_command(uuid,uuid,text,numeric,numeric,date,text,text,text,text,uuid,text,uuid,jsonb) to service_role;
grant execute on function public.create_manual_settlement_command(uuid,uuid,text,text,numeric,date,text,text) to service_role;
grant execute on function public.reverse_supplier_settlement_command(uuid,uuid,uuid,numeric,numeric,date,text,text) to service_role;
grant execute on function public.close_journey_account_command(uuid,uuid,text,boolean) to service_role;

comment on function public.initialize_journey_account_command(uuid,uuid,numeric,date,text,text,text) is 'Atomically initializes one journey account and supplier liabilities from the accepted proposal snapshot, records the idempotent first deposit, and advances lifecycle.';
comment on function public.record_accounting_transaction_command(uuid,uuid,text,numeric,numeric,date,text,text,text,text,uuid,text,uuid,jsonb) is 'Atomic, row-locked, idempotent posting command for traveller and supplier financial events with authoritative currency/account linkage.';
comment on column public.accounting_transactions.reverses_transaction_id is 'Immutable link from a compensating supplier reversal to the original posted event.';

commit;
