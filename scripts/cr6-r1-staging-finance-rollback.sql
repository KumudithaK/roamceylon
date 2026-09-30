-- CR6-R1 database-level verification. STAGING ONLY: hvcggnuptrcsxtrcjnre.
-- Run only after independently verifying the SQL Editor project and baseline.
-- Request claims below are transaction-local command-test context, not Auth configuration.
-- No sequence defaults, external requests, credentials, schema changes or COMMIT.
begin;
set local request.jwt.claim.role = 'service_role';

do $$
declare
  marker text := 'CR6-R1-ROLLBACK-20260927';
  actor uuid; enquiry uuid; proposal uuid; token uuid := gen_random_uuid();
  account uuid := gen_random_uuid(); allocation uuid; settlement uuid;
  experience uuid; destination uuid; allocation_input jsonb; result jsonb;
  v_email text := 'cr6-r1-rollback-20260927@example.com';
  rejected boolean; violated_constraint text; v numeric; seq_before bigint; seq_called boolean;
begin
  if (select count(*) from public.enquiries) <> 0 or
     (select count(*) from public.journey_accounts) <> 0 or
     (select count(*) from public.journey_proposals) <> 0 or
     (select count(*) from public.accounting_transactions) <> 0 or
     (select count(*) from public.journey_supplier_allocations) <> 0 then
    raise exception 'Fresh zero-finance-fixture baseline required';
  end if;
  select last_value,is_called into seq_before,seq_called from public.journey_account_number_seq;
  if (select count(*) from public.profile_staff_roles where role_code='super_admin') <> 1 then
    raise exception 'Exactly one existing staging Super Admin required';
  end if;
  select profile_id into actor from public.profile_staff_roles where role_code='super_admin';
  if exists(select 1 from public.profile_staff_roles where profile_id=actor and role_code='finance') then
    raise exception 'The staging actor already has the Finance role; capability-isolation fixture must be revised';
  end if;
  if not private.staff_has_permission(actor,'finance.payments.manage') or
     not private.staff_has_permission(actor,'finance.settlements.reverse') or
     not private.staff_has_permission(actor,'suppliers.allocate') then
    raise exception 'Existing staging actor lacks required capabilities';
  end if;
  select experience_id,destination_id into experience,destination
  from public.experience_destinations order by experience_id,destination_id limit 1;
  if experience is null then raise exception 'No existing staging experience/destination pair'; end if;

  insert into public.enquiries(name,email,trip_state,status,selected_destinations,selected_experiences)
  values(marker,v_email,jsonb_build_object('synthetic',true,'selectedDestinationIds',jsonb_build_array(destination),'selectedExperienceIds',jsonb_build_array(experience)),
    'proposal_sent',jsonb_build_array(destination),jsonb_build_array(experience)) returning id into enquiry;
  allocation_input := jsonb_build_object('allocation_type','experience','destination_id',destination,
    'experience_id',experience,'provider_name',marker,'service_name',marker,'quantity',1,
    'quantity_label','synthetic service','supplier_cost',60,'selling_price',100,'currency','USD',
    'confirmation_status','pending','service_details',jsonb_build_object('customJourneyRate',true,'synthetic',true));

  -- Bypass HTTP validation via the actual guarded allocation command.
  rejected := false;
  begin
    perform public.save_supplier_allocations_command(enquiry,null,jsonb_build_array(allocation_input||jsonb_build_object('supplier_cost',10.001)),actor,marker||'-allocation-subcent');
  exception when check_violation then
    get stacked diagnostics violated_constraint = constraint_name;
    if violated_constraint <> 'journey_supplier_allocations_supplier_cost_cent_precision' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'Allocation command accepted sub-cent supplier cost'; end if;
  result := public.save_supplier_allocations_command(enquiry,null,jsonb_build_array(allocation_input),actor,marker||'-allocation-valid');
  allocation := (result->'allocationIds'->>0)::uuid;
  if allocation is null then raise exception 'Valid allocation command returned no allocation'; end if;

  insert into public.journey_proposals(enquiry_id,version,proposal_reference,status,currency,
    total_supplier_cost,total_selling_price,gross_profit,profit_margin,allocation_snapshot,
    commercial_snapshot,customer_snapshot,sent_snapshot,internally_approved_at,sent_at,public_token,valid_until)
  values(enquiry,1,marker,'sent','USD',60,1000,940,94,
    jsonb_build_array(jsonb_build_object('allocationId',allocation,'type','experience','resourceId',experience,'supplierCost',60,'currency','USD','confirmationStatus','pending','providerName',marker)),
    jsonb_build_object('summary',jsonb_build_object('internalCost',60,'breakdown','[]'::jsonb),'context',jsonb_build_object('synthetic',true)),
    jsonb_build_object('synthetic',true),jsonb_build_object('traveller',jsonb_build_object('email',v_email),'pricing',jsonb_build_object('total',1000,'currency','USD')),
    now(),now(),token,current_date+30) returning id into proposal;

  -- An allocation change can invalidate a sent version, never rewrite its snapshot.
  result := public.save_supplier_allocations_command(enquiry,null,jsonb_build_array(allocation_input||jsonb_build_object('id',allocation,'supplier_cost',61)),actor,marker||'-allocation-change');
  if not exists(select 1 from public.journey_proposals where id=proposal and requires_new_version and
    (allocation_snapshot->0->>'supplierCost')::numeric=60 and total_supplier_cost=60) then
    raise exception 'Allocation change rewrote or failed to invalidate the sent snapshot';
  end if;
  rejected := false;
  begin
    perform public.accept_journey_proposal_command(token,marker,v_email,'{"synthetic":true}'::jsonb);
  exception when sqlstate '55000' then
    if sqlerrm <> 'This proposal version is out of date.' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'Outdated sent proposal accepted'; end if;

  -- Create a genuinely new proposal version for the changed allocation.
  token := gen_random_uuid();
  insert into public.journey_proposals(enquiry_id,version,proposal_reference,status,currency,
    total_supplier_cost,total_selling_price,gross_profit,profit_margin,allocation_snapshot,
    commercial_snapshot,customer_snapshot,sent_snapshot,internally_approved_at,sent_at,public_token,valid_until)
  values(enquiry,2,marker||'-v2','sent','USD',61,1000,939,93.9,
    jsonb_build_array(jsonb_build_object('allocationId',allocation,'type','experience','resourceId',experience,'supplierCost',61,'currency','USD','confirmationStatus','pending','providerName',marker)),
    jsonb_build_object('summary',jsonb_build_object('internalCost',61,'breakdown','[]'::jsonb),'context',jsonb_build_object('synthetic',true)),
    jsonb_build_object('synthetic',true),jsonb_build_object('traveller',jsonb_build_object('email',v_email),'pricing',jsonb_build_object('total',1000,'currency','USD')),
    now(),now(),token,current_date+30) returning id into proposal;
  perform public.accept_journey_proposal_command(token,marker,v_email,'{"synthetic":true}'::jsonb);
  if (select count(*) from public.journey_proposal_acceptances where proposal_id=proposal) <> 1 or
     (select count(*) from public.journey_accounts) <> 0 or
     (select count(*) from public.accounting_transactions) <> 0 or
     (select count(*) from public.journey_settlements) <> 0 or
     (select status from public.enquiries where id=enquiry) <> 'proposal_accepted' then
    raise exception 'Acceptance did not remain distinct from account/cash creation';
  end if;

  -- Explicit synthetic account number avoids non-transactional nextval consumption.
  insert into public.journey_accounts(id,account_number,enquiry_id,journey_reference,traveller_name,traveller_email,
    status,active,activated_at,currency,selling_price,internal_cost,gross_profit,profit_margin,quote_snapshot,created_by)
  select account,marker,e.id,e.journey_reference,marker,v_email,'active',true,now(),'USD',1000,61,939,93.9,
    jsonb_build_object('source','accepted_proposal','proposalId',proposal,'proposalReference',marker||'-v2','proposalVersion',2,
      'summary',p.commercial_snapshot->'summary','allocations',p.allocation_snapshot),actor
  from public.enquiries e join public.journey_proposals p on p.id=proposal where e.id=enquiry;
  if not exists(select 1 from public.journey_accounts where id=account and amount_received=0 and supplier_paid=0)
     or (select count(*) from public.accounting_transactions where account_id=account) <> 0 then
    raise exception 'Synthetic account fixture fabricated a cash receipt';
  end if;

  -- Direct deposit command must reject fractional cents, not silently round.
  rejected := false;
  begin
    perform public.initialize_journey_account_command(enquiry,actor,10.001,current_date,'Synthetic',marker,'Rollback-only probe');
  exception when check_violation then
    get stacked diagnostics violated_constraint = constraint_name;
    if violated_constraint <> 'accounting_transactions_amount_cent_precision' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'Deposit command accepted sub-cent amount'; end if;
  perform public.initialize_journey_account_command(enquiry,actor,25,current_date,'Synthetic',marker,'Rollback-only probe');
  perform public.initialize_journey_account_command(enquiry,actor,25,current_date,'Synthetic',marker,'Rollback-only replay');
  if (select count(*) from public.accounting_transactions where account_id=account) <> 1 or
     (select amount_received from public.journey_accounts where id=account) <> 25 then
    raise exception 'Deposit replay produced duplicate/mismatched receipt';
  end if;

  foreach v in array array[0.001::numeric,1.999,10.001,99.999] loop
    rejected := false;
    begin
      perform public.record_accounting_transaction_command(account,actor,'customer_receipt',v,0,current_date,'Synthetic',marker,null,null,null,marker||'-receipt-subcent-'||v::text);
    exception when check_violation then
      get stacked diagnostics violated_constraint = constraint_name;
      if violated_constraint <> 'accounting_transactions_amount_cent_precision' then raise; end if;
      rejected := true;
    end;
    if not rejected then raise exception 'Receipt RPC accepted sub-cent amount %',v; end if;
  end loop;
  result := public.record_accounting_transaction_command(account,actor,'customer_receipt',10.10,0,current_date,'Synthetic',marker,null,null,null,marker||'-receipt-valid');
  result := public.record_accounting_transaction_command(account,actor,'customer_receipt',10.10,0,current_date,'Synthetic',marker,null,null,null,marker||'-receipt-valid');
  if not (result->>'idempotent')::boolean or
     (select count(*) from public.accounting_transactions where account_id=account) <> 2 or
     (select amount_received from public.journey_accounts where id=account) <> 35.10 then
    raise exception 'Receipt/idempotency/derived-total invariant failed';
  end if;
  rejected := false;
  begin
    perform public.record_accounting_transaction_command(account,actor,'customer_receipt',11,0,current_date,'Synthetic',marker,null,null,null,marker||'-receipt-valid');
  exception when unique_violation then rejected := true; end;
  if not rejected then raise exception 'Receipt idempotency key accepted a different amount'; end if;
  rejected := false;
  begin
    perform public.record_accounting_transaction_command(account,actor,'customer_receipt',1000,0,current_date,'Synthetic',marker,null,null,null,marker||'-receipt-overpay');
  exception when numeric_value_out_of_range then rejected := true; end;
  if not rejected then raise exception 'Receipt command accepted overpayment'; end if;
  rejected := false;
  begin
    perform public.record_accounting_transaction_command(account,actor,'customer_receipt',-1,0,current_date,'Synthetic',marker,null,null,null,marker||'-receipt-negative');
  exception when invalid_parameter_value then rejected := true; end;
  if not rejected or (select count(*) from public.accounting_transactions where account_id=account) <> 2 then
    raise exception 'Negative receipt changed the ledger';
  end if;

  rejected := false;
  begin
    perform public.create_manual_settlement_command(account,actor,marker,'Synthetic payable',10.001,null,null,marker||'-payable-subcent');
  exception when check_violation then
    get stacked diagnostics violated_constraint = constraint_name;
    if violated_constraint <> 'journey_settlements_amount_due_cent_precision' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'Payable command accepted sub-cent amount'; end if;
  settlement := public.create_manual_settlement_command(account,actor,marker,'Synthetic payable',60,null,null,marker||'-payable-valid');
  if settlement is distinct from public.create_manual_settlement_command(account,actor,marker,'Synthetic payable',60,null,null,marker||'-payable-valid')
     or not exists(select 1 from public.journey_settlements where id=settlement and amount_due=60 and amount_paid=0 and status='pending') then
    raise exception 'Payable creation was conflated with supplier payment';
  end if;
  rejected := false;
  begin
    perform public.record_accounting_transaction_command(account,actor,'supplier_payment',10.001,0,current_date,'Synthetic',marker,null,null,settlement,marker||'-supplier-subcent');
  exception when check_violation then
    get stacked diagnostics violated_constraint = constraint_name;
    if violated_constraint <> 'accounting_transactions_amount_cent_precision' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'Supplier payment command accepted sub-cent amount'; end if;
  result := public.record_accounting_transaction_command(account,actor,'supplier_payment',10.10,0,current_date,'Synthetic',marker,null,null,settlement,marker||'-supplier-valid');
  if not exists(select 1 from public.journey_settlements where id=settlement and amount_due=60 and amount_paid=10.10) then
    raise exception 'Supplier payable and paid totals were conflated';
  end if;
  result := public.record_accounting_transaction_command(account,actor,'supplier_payment',10.10,0,current_date,'Synthetic',marker,null,null,settlement,marker||'-supplier-valid');
  if not (result->>'idempotent')::boolean or
     (select count(*) from public.accounting_transactions where settlement_id=settlement and transaction_type='supplier_payment') <> 1 then
    raise exception 'Supplier-payment replay double-posted';
  end if;
  rejected := false;
  begin
    perform public.record_accounting_transaction_command(account,actor,'supplier_payment',11,0,current_date,'Synthetic',marker,null,null,settlement,marker||'-supplier-valid');
  exception when unique_violation then rejected := true; end;
  if not rejected then raise exception 'Supplier-payment idempotency collision accepted'; end if;
  rejected := false;
  begin
    perform public.record_accounting_transaction_command(account,actor,'supplier_payment',50,0,current_date,'Synthetic',marker,null,null,settlement,marker||'-supplier-overpay');
  exception when numeric_value_out_of_range then rejected := true; end;
  if not rejected then raise exception 'Supplier overpayment accepted'; end if;
  rejected := false;
  begin
    perform public.record_accounting_transaction_command(account,actor,'supplier_payment',-1,0,current_date,'Synthetic',marker,null,null,settlement,marker||'-supplier-negative');
  exception when invalid_parameter_value then rejected := true; end;
  if not rejected or (select amount_paid from public.journey_settlements where id=settlement) <> 10.10 then
    raise exception 'Negative supplier payment changed the payable';
  end if;
  rejected := false;
  begin
    perform public.reverse_supplier_settlement_command(account,settlement,actor,0.001,0,current_date,'Synthetic rollback-only correction',marker||'-reversal-subcent');
  exception when check_violation then
    get stacked diagnostics violated_constraint = constraint_name;
    if violated_constraint <> 'accounting_transactions_amount_cent_precision' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'Reversal command accepted sub-cent amount'; end if;
  result := public.reverse_supplier_settlement_command(account,settlement,actor,5,0,current_date,'Synthetic rollback-only correction',marker||'-reversal-valid');
  if not exists(select 1 from public.journey_settlements where id=settlement and amount_due=60 and amount_paid=5.10) or
     not exists(select 1 from public.accounting_transactions where account_id=account and transaction_type='supplier_payment_reversal' and amount=5 and reverses_transaction_id is not null) or
     not exists(select 1 from public.accounting_lifecycle_history where account_id=account and reason like 'Supplier settlement correction:%') then
    raise exception 'Compensating reversal/audit invariant failed';
  end if;
  result := public.reverse_supplier_settlement_command(account,settlement,actor,5,0,current_date,'Synthetic rollback-only correction',marker||'-reversal-valid');
  if not (result->>'idempotent')::boolean or
     (select count(*) from public.accounting_transactions where settlement_id=settlement and transaction_type='supplier_payment_reversal') <> 1 then
    raise exception 'Repeated reversal changed the ledger';
  end if;
  rejected := false;
  begin
    perform public.reverse_supplier_settlement_command(account,settlement,actor,11,0,current_date,'Synthetic rollback-only correction',marker||'-reversal-excess');
  exception when numeric_value_out_of_range then rejected := true; end;
  if not rejected then raise exception 'Excess supplier-payment reversal accepted'; end if;
  if not exists(select 1 from public.accounting_transactions original join public.accounting_transactions reversal
      on reversal.reverses_transaction_id=original.id
      where original.settlement_id=settlement and original.transaction_type='supplier_payment' and original.amount=10.10
        and reversal.transaction_type='supplier_payment_reversal' and reversal.amount=5) then
    raise exception 'Original supplier payment was erased or unauditable';
  end if;

  -- Transaction-local capability probe: the existing actor temporarily has only
  -- the narrower Finance role. The deliberate exception rolls back both the role
  -- swap and its one synthetic receipt before the outer matrix continues.
  rejected := false;
  begin
    delete from public.profile_staff_roles where profile_id=actor and role_code='super_admin';
    insert into public.profile_staff_roles(profile_id,role_code,assigned_by) values(actor,'finance',actor);
    if not private.staff_has_permission(actor,'finance.payments.manage') or
       private.staff_has_permission(actor,'suppliers.allocate') then
      raise exception 'Finance-only capability fixture is not isolated';
    end if;
    result := public.record_accounting_transaction_command(account,actor,'customer_receipt',1,0,current_date,
      'Synthetic',marker,null,null,null,marker||'-finance-only-receipt');
    if (result->>'idempotent')::boolean or
       (select count(*) from public.accounting_transactions where idempotency_key=marker||'-finance-only-receipt:payment')<>1 then
      raise exception 'Finance-only actor could not post an authorised receipt';
    end if;
    begin
      perform public.save_supplier_allocations_command(enquiry,null,jsonb_build_array(allocation_input||
        jsonb_build_object('id',allocation,'supplier_cost',62)),actor,marker||'-finance-allocation-denied');
      raise exception 'Finance-only actor changed a supplier allocation';
    exception when insufficient_privilege then null; end;
    rejected := true;
    raise exception using errcode='P6R01',message='Rollback transaction-local Finance capability fixture';
  exception when sqlstate 'P6R01' then null; end;
  if not rejected or
     (select count(*) from public.profile_staff_roles where profile_id=actor and role_code='super_admin')<>1 or
     (select count(*) from public.profile_staff_roles where profile_id=actor and role_code='finance')<>0 or
     exists(select 1 from public.accounting_transactions where idempotency_key=marker||'-finance-only-receipt:payment') then
    raise exception 'Finance-only capability fixture was not fully rolled back';
  end if;

  -- The same command rejects a caller with no staff authority.
  rejected := false;
  begin
    perform public.record_accounting_transaction_command(account,null,'customer_receipt',1,0,current_date,'Synthetic',marker,null,null,null,marker||'-unauthorized');
  exception when insufficient_privilege then rejected := true;
  end;
  if not rejected then raise exception 'Unauthorised financial command accepted'; end if;
  rejected := false;
  begin
    update public.accounting_transactions set amount=1 where account_id=account and transaction_type='supplier_payment';
  exception when sqlstate '55000' then rejected := true;
  end;
  if not rejected then raise exception 'Posted financial event was directly rewritten'; end if;
  rejected := false;
  begin
    perform public.save_supplier_allocations_command(enquiry,null,jsonb_build_array(allocation_input||jsonb_build_object('id',allocation,'supplier_cost',62)),actor,marker||'-accepted-allocation-change');
  exception when sqlstate '55000' then rejected := true;
  end;
  if not rejected then raise exception 'Accepted allocation commercial basis was rewritten'; end if;
  if (select (quote_snapshot#>>'{summary,internalCost}')::numeric from public.journey_accounts where id=account) <> 61 or
     (select total_supplier_cost from public.journey_proposals where id=proposal) <> 61 then
    raise exception 'Accepted/account snapshot basis changed';
  end if;

  if (select status from public.enquiries where id=enquiry)<>'deposit_paid' or
     (select status from public.journey_accounts where id=account)<>'part_paid' then
    raise exception 'Operational and partial-financial statuses were conflated';
  end if;
  result := public.record_accounting_transaction_command(account,actor,'supplier_payment',54.90,0,current_date,
    'Synthetic',marker,null,null,settlement,marker||'-supplier-full');
  if (result->>'idempotent')::boolean or
     not exists(select 1 from public.journey_settlements where id=settlement and amount_due=60 and amount_paid=60 and status='paid') or
     not exists(select 1 from public.journey_accounts where id=account and amount_received=35.10 and status='part_paid') then
    raise exception 'Full supplier payment implied traveller payment';
  end if;
  result := public.record_accounting_transaction_command(account,actor,'customer_receipt',964.90,0,current_date,
    'Synthetic',marker,null,null,null,marker||'-traveller-full');
  if (result->>'idempotent')::boolean or
     not exists(select 1 from public.journey_accounts where id=account and amount_received=1000 and supplier_paid=60 and status='closed') or
     (select status from public.enquiries where id=enquiry)<>'deposit_paid' then
    raise exception 'Full financial settlement fabricated operational completion';
  end if;
  rejected := false;
  begin
    perform public.record_accounting_transaction_command(account,actor,'customer_receipt',1,0,current_date,
      'Synthetic',marker,null,null,null,marker||'-closed-account-denied');
  exception when sqlstate '55000' then rejected := true; end;
  if not rejected then raise exception 'Closed financial account accepted another receipt'; end if;
  if (select last_value from public.journey_account_number_seq) <> seq_before or
     (select is_called from public.journey_account_number_seq) is distinct from seq_called then
    raise exception 'Account-number sequence unexpectedly consumed';
  end if;
end $$;

rollback;
select 'CR6_ROLLBACK_FINANCE_MATRIX_PASS' as result,
  (select count(*) from public.enquiries) as enquiries,
  (select count(*) from public.journey_accounts) as accounts,
  (select count(*) from public.journey_proposals) as proposals,
  (select count(*) from public.journey_proposal_acceptances) as acceptances,
  (select count(*) from public.journey_supplier_allocations) as allocations,
  (select count(*) from public.accounting_transactions) as transactions,
  (select count(*) from public.journey_settlements) as settlements;
