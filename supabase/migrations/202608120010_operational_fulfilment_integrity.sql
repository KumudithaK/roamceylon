begin;

alter table public.journey_supplier_allocations
  add column fulfilment_status text not null default 'pending'
    check(fulfilment_status in('pending','fulfilled')),
  add column fulfilled_at timestamptz,
  add column fulfilled_by uuid references auth.users(id),
  add column fulfilment_notes text,
  add constraint journey_supplier_allocations_fulfilment_evidence check(
    (fulfilment_status='pending' and fulfilled_at is null and fulfilled_by is null)
    or (fulfilment_status='fulfilled' and fulfilled_at is not null and fulfilled_by is not null)
  );

create table public.journey_operational_command_receipts(
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users(id) on delete restrict,
  enquiry_id uuid not null references public.enquiries(id) on delete restrict,
  idempotency_key text not null,
  command_type text not null check(command_type in('prepare_operations','start_travel','complete_journey','fulfil_allocation')),
  request_hash text not null,
  result jsonb not null default '{}'::jsonb check(jsonb_typeof(result)='object'),
  created_at timestamptz not null default now(),
  unique(actor_id,idempotency_key)
);
create index journey_operational_receipts_enquiry_idx
  on public.journey_operational_command_receipts(enquiry_id,created_at desc);
alter table public.journey_operational_command_receipts enable row level security;
create policy journey_operational_receipts_staff_read on public.journey_operational_command_receipts
  for select to authenticated using(
    actor_id=(select auth.uid()) or private.has_permission('operations.view') or private.has_permission('users.manage')
  );
grant select on public.journey_operational_command_receipts to authenticated;
revoke insert,update,delete on public.journey_operational_command_receipts from anon,authenticated;

create or replace function private.allocation_audit_snapshot(allocation public.journey_supplier_allocations)
returns jsonb language sql stable security definer set search_path='' as $$
  select jsonb_build_object(
    'allocationType',allocation.allocation_type,'destinationId',allocation.destination_id,
    'fromLocationKey',allocation.from_location_key,'toLocationKey',allocation.to_location_key,
    'accommodationId',allocation.accommodation_id,'guideId',allocation.guide_id,
    'vehicleId',allocation.vehicle_id,'experienceId',allocation.experience_id,
    'pricingPlanId',allocation.pricing_plan_id,'serviceName',allocation.service_name,
    'quantity',allocation.quantity,'quantityLabel',allocation.quantity_label,
    'supplierCost',allocation.supplier_cost,'sellingPrice',allocation.selling_price,
    'currency',allocation.currency,'commercialSource',allocation.commercial_source,
    'confirmationStatus',allocation.confirmation_status,'invoiceStatus',allocation.invoice_status,
    'paymentStatus',allocation.payment_status,'reviewRequired',allocation.review_required,
    'fulfilmentStatus',allocation.fulfilment_status,'fulfilledAt',allocation.fulfilled_at,
    'fulfilledBy',allocation.fulfilled_by,'lockVersion',allocation.lock_version
  )
$$;
revoke all on function private.allocation_audit_snapshot(public.journey_supplier_allocations) from public,anon,authenticated;

create or replace function private.guard_supplier_allocation_integrity()
returns trigger language plpgsql security definer set search_path='' as $$
declare command_mode text:=coalesce(current_setting('roam.allocation_command',true),'');
begin
  if tg_op='DELETE' then
    if command_mode not in('on','cleanup') then raise exception using errcode='42501',message='Supplier allocations may only be removed through an authorised allocation command.';end if;
    if command_mode='cleanup' and coalesce(current_setting('roam.phase10_cleanup',true),'')='on' then return old;end if;
    if old.confirmation_status<>'pending' or old.fulfilment_status='fulfilled' or exists(select 1 from public.journey_settlements where allocation_id=old.id) then
      raise exception using errcode='55000',message='A confirmed, fulfilled, cancelled, or financially linked allocation must be retained.';
    end if;
    return old;
  end if;
  if tg_op='INSERT' and command_mode<>'on' then raise exception using errcode='42501',message='Supplier allocations may only be created through an authorised allocation command.';end if;
  if tg_op='UPDATE' and command_mode<>'on' then
    if coalesce(current_setting('roam.financial_command',true),'')='on'
      and new.payment_status is distinct from old.payment_status
      and (to_jsonb(new)-'payment_status'-'updated_at')=(to_jsonb(old)-'payment_status'-'updated_at') then return new;end if;
    if (to_jsonb(new)-'review_required'-'review_reason'-'reviewed_at'-'reviewed_by'-'updated_at')
       =(to_jsonb(old)-'review_required'-'review_reason'-'reviewed_at'-'reviewed_by'-'updated_at') then return new;end if;
    raise exception using errcode='42501',message='Supplier allocation changes require an explicit authorised command.';
  end if;
  if tg_op='UPDATE' and old.fulfilment_status='fulfilled'
    and (to_jsonb(new)-'updated_at') is distinct from (to_jsonb(old)-'updated_at') then
    raise exception using errcode='55000',message='Fulfilled supplier evidence is immutable; no correction workflow is currently modelled.';
  end if;
  if tg_op='UPDATE' and (
    new.enquiry_id is distinct from old.enquiry_id or new.curated_journey_id is distinct from old.curated_journey_id
    or new.allocation_type is distinct from old.allocation_type or new.destination_id is distinct from old.destination_id
    or new.from_destination_id is distinct from old.from_destination_id or new.to_destination_id is distinct from old.to_destination_id
    or new.from_location_key is distinct from old.from_location_key or new.to_location_key is distinct from old.to_location_key
    or new.accommodation_id is distinct from old.accommodation_id or new.guide_id is distinct from old.guide_id
    or new.vehicle_id is distinct from old.vehicle_id or new.experience_id is distinct from old.experience_id
    or new.pricing_plan_id is distinct from old.pricing_plan_id or new.pricing_plan_snapshot is distinct from old.pricing_plan_snapshot
    or new.service_name is distinct from old.service_name or new.quantity is distinct from old.quantity
    or new.quantity_label is distinct from old.quantity_label or new.supplier_cost is distinct from old.supplier_cost
    or new.selling_price is distinct from old.selling_price or new.currency is distinct from old.currency
  ) and exists(
    select 1 from public.journey_proposals proposal join public.journey_proposal_acceptances acceptance on acceptance.proposal_id=proposal.id
    where proposal.enquiry_id=old.enquiry_id
  ) then raise exception using errcode='55000',message='Accepted proposal supplier allocations are immutable; create an authorised journey amendment.';end if;
  perform private.validate_supplier_allocation(new);
  if tg_op='UPDATE' then new.lock_version:=old.lock_version+1;end if;
  return new;
end $$;

create or replace function private.audit_supplier_allocation_change()
returns trigger language plpgsql security definer set search_path='' as $$
declare event_name text; actor_id uuid; reason text; command_key text;
begin
  actor_id:=nullif(current_setting('roam.allocation_actor',true),'')::uuid;
  reason:=nullif(current_setting('roam.allocation_reason',true),'');
  command_key:=nullif(current_setting('roam.allocation_idempotency_key',true),'');
  if tg_op='INSERT' then event_name:='created';
  elsif current_setting('roam.allocation_replacement',true)='on' then event_name:='replaced';
  elsif new.confirmation_status='confirmed' and old.confirmation_status<>'confirmed' then event_name:='confirmed';
  elsif new.confirmation_status='cancelled' and old.confirmation_status<>'cancelled' then event_name:='cancelled';
  elsif new.fulfilment_status is distinct from old.fulfilment_status
    or new.invoice_status is distinct from old.invoice_status
    or new.arrival_instructions is distinct from old.arrival_instructions
    or new.special_notes is distinct from old.special_notes then event_name:='fulfilment_updated';
  elsif new.review_required is distinct from old.review_required then event_name:='review_updated';else event_name:='updated';end if;
  insert into public.journey_supplier_allocation_history(allocation_id,enquiry_id,event_type,from_status,to_status,previous_snapshot,new_snapshot,reason,changed_by,idempotency_key)
  values(new.id,new.enquiry_id,event_name,case when tg_op='INSERT' then null else old.confirmation_status end,new.confirmation_status,
    case when tg_op='INSERT' then null else private.allocation_audit_snapshot(old) end,private.allocation_audit_snapshot(new),reason,actor_id,command_key);
  return new;
end $$;

create or replace function private.accepted_operational_proposal(p_enquiry_id uuid)
returns public.journey_proposals language plpgsql stable security definer set search_path='' as $$
declare proposal_row public.journey_proposals%rowtype;
begin
  select proposal.* into proposal_row
  from public.journey_proposals proposal
  join public.journey_proposal_acceptances acceptance on acceptance.proposal_id=proposal.id
  where proposal.enquiry_id=p_enquiry_id and proposal.status='approved'
    and not proposal.requires_new_version
    and not exists(select 1 from public.journey_proposals newer where newer.enquiry_id=proposal.enquiry_id and newer.version>proposal.version)
  order by proposal.version desc limit 1;
  if proposal_row.id is null then raise exception using errcode='55000',message='An accepted current proposal is required before operational handover.';end if;
  return proposal_row;
end $$;
revoke all on function private.accepted_operational_proposal(uuid) from public,anon,authenticated;

create or replace function private.assert_journey_operational_readiness(p_enquiry_id uuid)
returns uuid language plpgsql stable security definer set search_path='' as $$
declare enquiry_row public.enquiries%rowtype; proposal_row public.journey_proposals%rowtype; line jsonb; allocation public.journey_supplier_allocations%rowtype; start_date date;end_date date;
begin
  select * into enquiry_row from public.enquiries where id=p_enquiry_id;
  if enquiry_row.id is null then raise exception using errcode='P0002',message='Traveller enquiry not found.';end if;
  proposal_row:=private.accepted_operational_proposal(p_enquiry_id);
  if proposal_row.curated_journey_id is null or not exists(select 1 from public.curated_journeys journey where journey.id=proposal_row.curated_journey_id and journey.enquiry_id=p_enquiry_id) then
    raise exception using errcode='23514',message='The accepted Curated Journey does not belong to this enquiry.';
  end if;
  start_date:=enquiry_row.travel_start_date;end_date:=enquiry_row.travel_end_date;
  if start_date is null or end_date is null or end_date<start_date then raise exception using errcode='23514',message='Valid accepted journey dates are required for operational handover.';end if;
  if nullif(proposal_row.sent_snapshot#>>'{journey,startDate}','')::date is distinct from start_date
    or nullif(proposal_row.sent_snapshot#>>'{journey,endDate}','')::date is distinct from end_date then
    raise exception using errcode='23514',message='Operational dates must match the accepted proposal.';
  end if;
  if jsonb_typeof(proposal_row.allocation_snapshot) is distinct from 'array' or jsonb_array_length(proposal_row.allocation_snapshot)=0 then
    raise exception using errcode='55000',message='The accepted proposal has no authoritative supplier services.';
  end if;
  for line in select value from jsonb_array_elements(proposal_row.allocation_snapshot) loop
    if nullif(line->>'allocationId','') is null then raise exception using errcode='23514',message='The accepted proposal contains an invalid supplier allocation reference.';end if;
    select * into allocation from public.journey_supplier_allocations where id=(line->>'allocationId')::uuid;
    if allocation.id is null or allocation.enquiry_id<>p_enquiry_id or allocation.curated_journey_id is distinct from proposal_row.curated_journey_id then
      raise exception using errcode='23514',message='An accepted supplier service does not belong to this journey.';
    end if;
    if allocation.confirmation_status<>'confirmed' or allocation.review_required then
      raise exception using errcode='55000',message='Every accepted supplier service must be confirmed and current before operational handover.';
    end if;
  end loop;
  return proposal_row.id;
end $$;
revoke all on function private.assert_journey_operational_readiness(uuid) from public,anon,authenticated;

create or replace function public.execute_enquiry_transition(p_enquiry_id uuid,p_action text,p_actor_id uuid default null,p_reason text default null)
returns table(status text,previous_status text,changed boolean)
language plpgsql security definer set search_path='' as $$
declare current_status text;target_status text;actor_id uuid;required_permission text;allowed_sources text[];
begin
  if auth.role()='service_role' then actor_id:=p_actor_id;else actor_id:=auth.uid();end if;
  target_status:=case p_action
    when 'start_review' then 'under_review' when 'prepare_proposal' then 'preparing_proposal' when 'request_changes' then 'preparing_proposal'
    when 'mark_proposal_sent' then 'proposal_sent' when 'accept_proposal' then 'proposal_accepted'
    when 'request_deposit' then 'deposit_requested' when 'record_deposit' then 'deposit_paid'
    when 'confirm_journey' then 'journey_confirmed' when 'prepare_operations' then 'ready_for_operations'
    when 'start_travel' then 'travelling' when 'complete_journey' then 'completed'
    when 'cancel_journey' then 'cancelled' when 'archive_journey' then 'archived' else null end;
  if target_status is null then raise exception 'Unknown journey lifecycle action.';end if;
  if p_action in('prepare_operations','start_travel','complete_journey') and coalesce(current_setting('roam.operational_command',true),'')<>'on' then
    raise exception using errcode='42501',message='Operational lifecycle changes require the authoritative operational command.';
  end if;
  required_permission:=case
    when p_action in('prepare_operations','start_travel','complete_journey') then 'operations.manage'
    when p_action='record_deposit' then 'finance.payments.manage'
    when p_action in('cancel_journey','archive_journey') then 'journey.lifecycle.override'
    when p_action in('accept_proposal','request_changes') and auth.role()='service_role' and actor_id is null then null
    else 'journey.lifecycle.manage' end;
  if required_permission is not null and(actor_id is null or not private.staff_has_permission(actor_id,required_permission)) then raise exception using errcode='42501',message='The caller is not authorised for this journey lifecycle action.';end if;
  allowed_sources:=case p_action
    when 'start_review' then array['new'] when 'prepare_proposal' then array['new','under_review'] when 'request_changes' then array['proposal_sent','awaiting_traveller_approval']
    when 'mark_proposal_sent' then array['preparing_proposal'] when 'accept_proposal' then array['proposal_sent','awaiting_traveller_approval']
    when 'request_deposit' then array['proposal_accepted'] when 'record_deposit' then array['proposal_accepted','deposit_requested']
    when 'confirm_journey' then array['deposit_paid'] when 'prepare_operations' then array['journey_confirmed']
    when 'start_travel' then array['ready_for_operations'] when 'complete_journey' then array['travelling']
    when 'cancel_journey' then array['new','under_review','preparing_proposal','proposal_sent','awaiting_traveller_approval','proposal_accepted','deposit_requested','deposit_paid','journey_confirmed','ready_for_operations','travelling']
    when 'archive_journey' then array['completed','cancelled'] end;
  select e.status into current_status from public.enquiries e where e.id=p_enquiry_id for update;
  if not found then raise exception 'Traveller enquiry not found.';end if;
  if current_status=target_status then return query select current_status,current_status,false;return;end if;
  if not current_status=any(allowed_sources) then raise exception 'Invalid journey lifecycle transition from % using action %.',current_status,p_action;end if;
  perform set_config('roam.workflow_command','enquiry',true);
  update public.enquiries set status=target_status where id=p_enquiry_id;
  insert into public.enquiry_lifecycle_history(enquiry_id,from_status,to_status,action,reason,changed_by) values(p_enquiry_id,current_status,target_status,p_action,nullif(btrim(p_reason),''),actor_id);
  return query select target_status,current_status,true;
end $$;

create or replace function public.execute_operational_journey_command(p_enquiry_id uuid,p_action text,p_actor_id uuid,p_reason text,p_idempotency_key text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare receipt public.journey_operational_command_receipts%rowtype;request_hash text;transition record;proposal_id uuid;incomplete_count integer;result jsonb;
begin
  if auth.role()<>'service_role' or p_actor_id is null or not private.staff_has_permission(p_actor_id,'operations.manage') then raise exception using errcode='42501',message='The caller is not authorised to execute journey operations.';end if;
  if p_action not in('prepare_operations','start_travel','complete_journey') then raise exception using errcode='22023',message='The operational journey action is invalid.';end if;
  if p_idempotency_key is null or char_length(btrim(p_idempotency_key)) not between 8 and 160 then raise exception using errcode='22023',message='A valid operational command key is required.';end if;
  request_hash:=md5(p_enquiry_id::text||p_action||coalesce(p_reason,''));
  perform pg_advisory_xact_lock(hashtextextended(p_enquiry_id::text,10));
  select * into receipt from public.journey_operational_command_receipts where actor_id=p_actor_id and idempotency_key=p_idempotency_key for update;
  if receipt.id is not null then if receipt.request_hash<>request_hash then raise exception using errcode='23505',message='The operational command key was already used for a different request.';end if;return receipt.result||jsonb_build_object('idempotent',true);end if;
  proposal_id:=private.assert_journey_operational_readiness(p_enquiry_id);
  if p_action='complete_journey' then
    select count(*) into incomplete_count
    from jsonb_array_elements((select allocation_snapshot from public.journey_proposals where id=proposal_id)) line
    left join public.journey_supplier_allocations allocation on allocation.id=(line->>'allocationId')::uuid
    where allocation.fulfilment_status is distinct from 'fulfilled';
    if incomplete_count>0 then raise exception using errcode='55000',message='Every accepted supplier service must be fulfilled before journey completion.';end if;
  end if;
  perform set_config('roam.operational_command','on',true);
  select * into transition from public.execute_enquiry_transition(p_enquiry_id,p_action,p_actor_id,p_reason);
  result:=jsonb_build_object('enquiryId',p_enquiry_id,'proposalId',proposal_id,'status',transition.status,'changed',transition.changed);
  insert into public.journey_operational_command_receipts(actor_id,enquiry_id,idempotency_key,command_type,request_hash,result)
  values(p_actor_id,p_enquiry_id,p_idempotency_key,p_action,request_hash,result);
  return result||jsonb_build_object('idempotent',false);
end $$;

create or replace function public.fulfil_supplier_allocation_command(p_enquiry_id uuid,p_allocation_id uuid,p_actor_id uuid,p_notes text,p_idempotency_key text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare allocation public.journey_supplier_allocations%rowtype;receipt public.journey_operational_command_receipts%rowtype;request_hash text;result jsonb;proposal_id uuid;
begin
  if auth.role()<>'service_role' or p_actor_id is null or not private.staff_has_permission(p_actor_id,'operations.manage') then raise exception using errcode='42501',message='The caller is not authorised to fulfil supplier services.';end if;
  if p_idempotency_key is null or char_length(btrim(p_idempotency_key)) not between 8 and 160 then raise exception using errcode='22023',message='A valid fulfilment command key is required.';end if;
  if p_notes is not null and char_length(p_notes)>2000 then raise exception using errcode='22023',message='Fulfilment notes are too long.';end if;
  request_hash:=md5(p_enquiry_id::text||p_allocation_id::text||coalesce(p_notes,''));
  perform pg_advisory_xact_lock(hashtextextended(p_allocation_id::text,10));
  select * into receipt from public.journey_operational_command_receipts where actor_id=p_actor_id and idempotency_key=p_idempotency_key for update;
  if receipt.id is not null then if receipt.request_hash<>request_hash then raise exception using errcode='23505',message='The fulfilment command key was already used for a different request.';end if;return receipt.result||jsonb_build_object('idempotent',true);end if;
  select * into allocation from public.journey_supplier_allocations where id=p_allocation_id for update;
  if allocation.id is null then raise exception using errcode='P0002',message='Supplier allocation not found.';end if;
  if allocation.enquiry_id<>p_enquiry_id then raise exception using errcode='23514',message='The supplier allocation does not belong to this journey.';end if;
  proposal_id:=private.assert_journey_operational_readiness(p_enquiry_id);
  if not exists(select 1 from public.journey_proposals proposal,jsonb_array_elements(proposal.allocation_snapshot) line where proposal.id=proposal_id and line->>'allocationId'=allocation.id::text) then
    raise exception using errcode='23514',message='The supplier allocation is not part of the accepted journey.';
  end if;
  if allocation.confirmation_status<>'confirmed' or allocation.review_required then raise exception using errcode='55000',message='Only a confirmed current supplier allocation can be fulfilled.';end if;
  if (select status from public.enquiries where id=p_enquiry_id)<>'travelling' then raise exception using errcode='55000',message='Supplier services can be fulfilled only while the journey is travelling.';end if;
  if allocation.fulfilment_status='fulfilled' then raise exception using errcode='55000',message='This supplier service is already fulfilled; its evidence is immutable.';end if;
  perform set_config('roam.allocation_command','on',true);perform set_config('roam.allocation_actor',p_actor_id::text,true);
  perform set_config('roam.allocation_reason','Supplier service fulfilled.',true);perform set_config('roam.allocation_idempotency_key',p_idempotency_key,true);
  update public.journey_supplier_allocations set fulfilment_status='fulfilled',fulfilled_at=now(),fulfilled_by=p_actor_id,fulfilment_notes=nullif(btrim(p_notes),''),updated_by=p_actor_id,updated_at=now() where id=allocation.id;
  result:=jsonb_build_object('enquiryId',p_enquiry_id,'allocationId',allocation.id,'status','fulfilled');
  insert into public.journey_operational_command_receipts(actor_id,enquiry_id,idempotency_key,command_type,request_hash,result)
  values(p_actor_id,p_enquiry_id,p_idempotency_key,'fulfil_allocation',request_hash,result);
  return result||jsonb_build_object('idempotent',false);
end $$;

revoke all on function public.execute_operational_journey_command(uuid,text,uuid,text,text) from public,anon,authenticated;
revoke all on function public.fulfil_supplier_allocation_command(uuid,uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.execute_operational_journey_command(uuid,text,uuid,text,text) to service_role;
grant execute on function public.fulfil_supplier_allocation_command(uuid,uuid,uuid,text,text) to service_role;

comment on column public.journey_supplier_allocations.fulfilment_status is 'Authoritative operational delivery fact for an accepted supplier allocation; fulfilled evidence is immutable.';
comment on function public.execute_operational_journey_command(uuid,text,uuid,text,text) is 'Atomic, idempotent operational readiness, journey-start and journey-completion command derived from accepted proposal and confirmed service state.';
comment on function public.fulfil_supplier_allocation_command(uuid,uuid,uuid,text,text) is 'Atomic, idempotent supplier-service fulfilment command with journey, accepted-proposal and allocation linkage validation.';
comment on table public.journey_operational_command_receipts is 'Append-only replay receipts for high-value operational commands.';

commit;
