begin;

alter table public.journey_supplier_allocations
  add column if not exists lock_version integer not null default 1 check(lock_version>0),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists confirmed_at timestamptz,
  add column if not exists confirmed_by uuid references auth.users(id),
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancelled_by uuid references auth.users(id),
  add column if not exists cancellation_reason text,
  add column if not exists commercial_source text not null default 'legacy'
    check(commercial_source in('legacy','catalogue_rate','custom_journey_rate'));

create table public.journey_supplier_allocation_history(
  id uuid primary key default gen_random_uuid(),
  allocation_id uuid not null references public.journey_supplier_allocations(id) on delete restrict,
  enquiry_id uuid not null references public.enquiries(id) on delete restrict,
  event_type text not null check(event_type in('created','updated','confirmed','cancelled','replaced','fulfilment_updated','review_updated')),
  from_status text,
  to_status text not null,
  previous_snapshot jsonb,
  new_snapshot jsonb not null,
  reason text,
  changed_by uuid references auth.users(id),
  idempotency_key text,
  created_at timestamptz not null default now(),
  check(previous_snapshot is null or jsonb_typeof(previous_snapshot)='object'),
  check(jsonb_typeof(new_snapshot)='object')
);
create index journey_supplier_allocation_history_allocation_idx
  on public.journey_supplier_allocation_history(allocation_id,created_at desc);
create index journey_supplier_allocation_history_enquiry_idx
  on public.journey_supplier_allocation_history(enquiry_id,created_at desc);

create table public.supplier_allocation_command_receipts(
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users(id) on delete restrict,
  enquiry_id uuid not null references public.enquiries(id) on delete restrict,
  idempotency_key text not null,
  command_type text not null check(command_type in('save_batch','confirm','cancel','replace','fulfilment')),
  request_hash text not null,
  result jsonb not null default '{}'::jsonb check(jsonb_typeof(result)='object'),
  created_at timestamptz not null default now(),
  unique(actor_id,idempotency_key)
);

alter table public.journey_supplier_allocation_history enable row level security;
alter table public.supplier_allocation_command_receipts enable row level security;
create policy allocation_history_staff_read on public.journey_supplier_allocation_history for select to authenticated using(
  private.has_permission('suppliers.allocate') or private.has_permission('operations.view') or private.has_permission('finance.costs.view')
);
create policy allocation_receipts_staff_read on public.supplier_allocation_command_receipts for select to authenticated using(
  actor_id=(select auth.uid()) or private.has_permission('users.manage')
);
grant select on public.journey_supplier_allocation_history,public.supplier_allocation_command_receipts to authenticated;
revoke insert,update,delete on public.journey_supplier_allocation_history,public.supplier_allocation_command_receipts from anon,authenticated;

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
    'lockVersion',allocation.lock_version
  )
$$;
revoke all on function private.allocation_audit_snapshot(public.journey_supplier_allocations) from public,anon,authenticated;

create or replace function private.validate_supplier_allocation(allocation public.journey_supplier_allocations)
returns void language plpgsql security definer set search_path='' as $$
declare
  enquiry_row public.enquiries%rowtype; journey_row public.curated_journeys%rowtype;
  itinerary jsonb; destination_ids jsonb; experience_ids jsonb; resource_id uuid;
  plan_row public.pricing_plans%rowtype; expected_cost numeric; expected_provider text;
  start_date date; end_date date; date_key text; date_value text;
begin
  select * into enquiry_row from public.enquiries where id=allocation.enquiry_id;
  if enquiry_row.id is null then raise exception using errcode='23503',message='The supplier allocation enquiry does not exist.';end if;
  if allocation.curated_journey_id is not null then
    select * into journey_row from public.curated_journeys where id=allocation.curated_journey_id;
    if journey_row.id is null or journey_row.enquiry_id<>allocation.enquiry_id then
      raise exception using errcode='23514',message='The Curated Journey does not belong to this enquiry.';
    end if;
    itinerary:=journey_row.itinerary;
  else
    itinerary:=coalesce(enquiry_row.trip_state->'state',enquiry_row.trip_state,'{}'::jsonb);
  end if;
  destination_ids:=coalesce(itinerary->'selectedDestinationIds',enquiry_row.selected_destinations,'[]'::jsonb);
  experience_ids:=coalesce(itinerary->'selectedExperienceIds',enquiry_row.selected_experiences,'[]'::jsonb);
  if jsonb_typeof(destination_ids)<>'array' or jsonb_typeof(experience_ids)<>'array' then
    raise exception using errcode='23514',message='The authoritative journey requirements are invalid.';
  end if;

  if allocation.allocation_type in('accommodation','experience') or (allocation.allocation_type='guide' and allocation.destination_id is not null) then
    if allocation.destination_id is null or not destination_ids ? allocation.destination_id::text then
      raise exception using errcode='23514',message='The supplier allocation destination is not required by this journey.';
    end if;
  end if;
  if allocation.allocation_type='experience' then
    if allocation.experience_id is null or not experience_ids ? allocation.experience_id::text
      or not exists(select 1 from public.experience_destinations link where link.experience_id=allocation.experience_id and link.destination_id=allocation.destination_id) then
      raise exception using errcode='23514',message='The experience is not required at the allocated destination.';
    end if;
  elsif allocation.allocation_type='vehicle' then
    if not exists(
      with points as(
        select 0::bigint as ord,'pickup'::text as key where nullif(itinerary->'pickup'->>'type','') is not null
        union all
        select item.ordinality+(case when nullif(itinerary->'pickup'->>'type','') is null then 0 else 1 end),
          'destination:'||item.value
        from jsonb_array_elements_text(destination_ids) with ordinality item(value,ordinality)
        union all
        select jsonb_array_length(destination_ids)+2,'dropoff' where nullif(itinerary->'dropoff'->>'type','') is not null
      ), legs as(select key,lead(key) over(order by ord) as next_key from points)
      select 1 from legs where key=allocation.from_location_key and next_key=allocation.to_location_key
    ) then raise exception using errcode='23514',message='The transport allocation is not a current journey leg.';end if;
  end if;

  resource_id:=case allocation.allocation_type when 'accommodation' then allocation.accommodation_id when 'guide' then allocation.guide_id when 'vehicle' then allocation.vehicle_id else allocation.experience_id end;
  if allocation.allocation_type='accommodation' then select name into expected_provider from public.accommodations where id=resource_id;
  elsif allocation.allocation_type='guide' then select name into expected_provider from public.guides where id=resource_id;
  elsif allocation.allocation_type='vehicle' then select listing_title into expected_provider from public.vehicles where id=resource_id;
  else select name into expected_provider from public.experiences where id=resource_id;end if;
  if resource_id is null or expected_provider is null then raise exception using errcode='23503',message='The allocated supplier service does not exist.';end if;

  if allocation.pricing_plan_id is not null then
    select * into plan_row from public.pricing_plans where id=allocation.pricing_plan_id and active for share;
    if plan_row.id is null or plan_row.entity_type<>allocation.allocation_type or plan_row.entity_id<>resource_id then
      raise exception using errcode='23514',message='The selected catalogue rate does not belong to this supplier service.';
    end if;
    expected_cost:=round(plan_row.price*allocation.quantity,2);
    if allocation.quantity is null or allocation.quantity<=0 or allocation.supplier_cost is distinct from expected_cost
      or upper(allocation.currency)<>upper(plan_row.currency)
      or allocation.commercial_source<>'catalogue_rate'
      or allocation.pricing_plan_snapshot->>'id' is distinct from plan_row.id::text
      or (allocation.pricing_plan_snapshot->>'unitPrice')::numeric is distinct from plan_row.price then
      raise exception using errcode='23514',message='The allocation commercial snapshot does not match the authoritative catalogue rate.';
    end if;
  elsif allocation.commercial_source<>'custom_journey_rate'
    or allocation.service_details->>'customJourneyRate'<>'true'
    or nullif(btrim(allocation.service_name),'') is null or allocation.quantity is null or allocation.quantity<=0
    or nullif(btrim(allocation.quantity_label),'') is null or allocation.supplier_cost is null or allocation.supplier_cost<0 then
    raise exception using errcode='23514',message='A complete, explicitly identified custom journey rate is required.';
  end if;
  if allocation.selling_price is not null and allocation.selling_price<0 then raise exception using errcode='22023',message='The allocation selling price cannot be negative.';end if;
  if upper(allocation.currency)!~'^[A-Z]{3}$' then raise exception using errcode='22023',message='The allocation currency is invalid.';end if;

  start_date:=coalesce(nullif(itinerary->'travelDates'->>'start','')::date,enquiry_row.travel_start_date);
  end_date:=coalesce(nullif(itinerary->'travelDates'->>'end','')::date,enquiry_row.travel_end_date);
  foreach date_key in array array['checkIn','checkOut','serviceDate','startDate','endDate','pickupDate','dropoffDate'] loop
    date_value:=nullif(allocation.service_details->>date_key,'');
    if date_value is not null and date_value!~'^\d{4}-\d{2}-\d{2}$' then raise exception using errcode='22007',message='An allocation service date is invalid.';end if;
    if date_value is not null and start_date is not null and end_date is not null and date_value::date not between start_date and end_date then
      raise exception using errcode='23514',message='An allocation service date falls outside the Curated Journey.';
    end if;
  end loop;
  if nullif(allocation.service_details->>'checkIn','') is not null and nullif(allocation.service_details->>'checkOut','') is not null
    and (allocation.service_details->>'checkOut')::date<=(allocation.service_details->>'checkIn')::date then
    raise exception using errcode='23514',message='Accommodation check-out must be after check-in.';
  end if;
end $$;
revoke all on function private.validate_supplier_allocation(public.journey_supplier_allocations) from public,anon,authenticated;

create or replace function private.guard_supplier_allocation_integrity()
returns trigger language plpgsql security definer set search_path='' as $$
declare command_mode text:=coalesce(current_setting('roam.allocation_command',true),'');
begin
  if tg_op='DELETE' then
    if command_mode not in('on','cleanup') then raise exception using errcode='42501',message='Supplier allocations may only be removed through an authorised allocation command.';end if;
    if old.confirmation_status<>'pending' or exists(select 1 from public.journey_settlements where allocation_id=old.id) then
      raise exception using errcode='55000',message='A confirmed, cancelled, or financially linked allocation must be retained.';
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

drop trigger if exists journey_supplier_allocations_integrity_guard on public.journey_supplier_allocations;
create trigger journey_supplier_allocations_integrity_guard
before insert or update or delete on public.journey_supplier_allocations
for each row execute function private.guard_supplier_allocation_integrity();

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
  elsif new.invoice_status is distinct from old.invoice_status or new.arrival_instructions is distinct from old.arrival_instructions or new.special_notes is distinct from old.special_notes then event_name:='fulfilment_updated';
  elsif new.review_required is distinct from old.review_required then event_name:='review_updated';else event_name:='updated';end if;
  insert into public.journey_supplier_allocation_history(allocation_id,enquiry_id,event_type,from_status,to_status,previous_snapshot,new_snapshot,reason,changed_by,idempotency_key)
  values(new.id,new.enquiry_id,event_name,case when tg_op='INSERT' then null else old.confirmation_status end,new.confirmation_status,
    case when tg_op='INSERT' then null else private.allocation_audit_snapshot(old) end,private.allocation_audit_snapshot(new),reason,actor_id,command_key);
  return new;
end $$;
drop trigger if exists journey_supplier_allocations_audit on public.journey_supplier_allocations;
create trigger journey_supplier_allocations_audit after insert or update on public.journey_supplier_allocations
for each row execute function private.audit_supplier_allocation_change();

create or replace function public.save_supplier_allocations_command(
  p_enquiry_id uuid,p_curated_journey_id uuid,p_allocations jsonb,p_actor_id uuid,p_idempotency_key text
) returns jsonb language plpgsql security definer set search_path='' as $$
declare item jsonb; current_row public.journey_supplier_allocations%rowtype; saved_ids jsonb:='[]'::jsonb;
  allocation_id uuid; desired_status text; request_hash text; receipt public.supplier_allocation_command_receipts%rowtype;
  plan_row public.pricing_plans%rowtype; resource_id uuid; provider text; commercial_source text; snapshot jsonb; supplier_cost numeric;
begin
  if auth.role()<>'service_role' or p_actor_id is null or not private.staff_has_permission(p_actor_id,'suppliers.allocate') then raise exception using errcode='42501',message='The caller is not authorised to allocate suppliers.';end if;
  if p_idempotency_key is null or char_length(btrim(p_idempotency_key)) not between 8 and 160 then raise exception using errcode='22023',message='A valid allocation command key is required.';end if;
  if jsonb_typeof(p_allocations)<>'array' or jsonb_array_length(p_allocations)>250 then raise exception using errcode='22023',message='The supplier allocation batch is invalid.';end if;
  request_hash:=md5(p_enquiry_id::text||coalesce(p_curated_journey_id::text,'')||p_allocations::text);
  perform pg_advisory_xact_lock(hashtextextended(p_enquiry_id::text,9));
  select * into receipt from public.supplier_allocation_command_receipts where actor_id=p_actor_id and idempotency_key=p_idempotency_key for update;
  if receipt.id is not null then
    if receipt.request_hash<>request_hash then raise exception using errcode='23505',message='The allocation command key was already used for a different request.';end if;
    return receipt.result||jsonb_build_object('idempotent',true);
  end if;
  perform 1 from public.enquiries where id=p_enquiry_id for update;if not found then raise exception using errcode='P0002',message='Traveller enquiry not found.';end if;
  if p_curated_journey_id is not null then perform 1 from public.curated_journeys where id=p_curated_journey_id and enquiry_id=p_enquiry_id for update;if not found then raise exception using errcode='23514',message='The Curated Journey does not belong to this enquiry.';end if;end if;
  perform set_config('roam.allocation_command','on',true);perform set_config('roam.allocation_actor',p_actor_id::text,true);perform set_config('roam.allocation_idempotency_key',p_idempotency_key,true);
  for item in select value from jsonb_array_elements(p_allocations) loop
    allocation_id:=nullif(item->>'id','')::uuid;desired_status:=coalesce(item->>'confirmation_status','pending');
    if desired_status='cancelled' then raise exception using errcode='55000',message='Use the allocation cancellation command to retire a supplier service.';end if;
    resource_id:=coalesce(nullif(item->>'accommodation_id','')::uuid,nullif(item->>'guide_id','')::uuid,nullif(item->>'vehicle_id','')::uuid,nullif(item->>'experience_id','')::uuid);
    if nullif(item->>'pricing_plan_id','') is not null then
      select * into plan_row from public.pricing_plans where id=(item->>'pricing_plan_id')::uuid and active for share;
      if plan_row.id is null or plan_row.entity_type<>item->>'allocation_type' or plan_row.entity_id<>resource_id then raise exception using errcode='23514',message='The selected catalogue rate does not belong to this supplier service.';end if;
      commercial_source:='catalogue_rate';supplier_cost:=round(plan_row.price*(item->>'quantity')::numeric,2);
      snapshot:=jsonb_build_object('id',plan_row.id,'name',plan_row.name,'description',plan_row.description,'unitPrice',plan_row.price,'currency',plan_row.currency,'chargingMethod',plan_row.charging_method,'details',plan_row.details,'notes',plan_row.notes);
    else commercial_source:='custom_journey_rate';supplier_cost:=nullif(item->>'supplier_cost','')::numeric;snapshot:='{}'::jsonb;end if;
    if item->>'allocation_type'='accommodation' then select name into provider from public.accommodations where id=resource_id;
    elsif item->>'allocation_type'='guide' then select name into provider from public.guides where id=resource_id;
    elsif item->>'allocation_type'='vehicle' then select listing_title into provider from public.vehicles where id=resource_id;
    else provider:=nullif(btrim(item->>'provider_name'),'');end if;
    if allocation_id is not null then select * into current_row from public.journey_supplier_allocations where id=allocation_id for update;
      if current_row.id is null or current_row.enquiry_id<>p_enquiry_id or current_row.curated_journey_id is distinct from p_curated_journey_id then raise exception using errcode='23514',message='The allocation does not belong to this journey.';end if;
      if current_row.confirmation_status='cancelled' then raise exception using errcode='55000',message='A cancelled allocation cannot be rewritten.';end if;
      if current_row.allocation_type is distinct from item->>'allocation_type'
        or current_row.destination_id is distinct from nullif(item->>'destination_id','')::uuid
        or current_row.from_destination_id is distinct from nullif(item->>'from_destination_id','')::uuid
        or current_row.to_destination_id is distinct from nullif(item->>'to_destination_id','')::uuid
        or current_row.from_location_key is distinct from nullif(item->>'from_location_key','')
        or current_row.to_location_key is distinct from nullif(item->>'to_location_key','')
        or current_row.experience_id is distinct from nullif(item->>'experience_id','')::uuid then
        raise exception using errcode='55000',message='An existing allocation cannot be moved to another journey requirement.';
      end if;
      if current_row.confirmation_status='confirmed' and desired_status<>'confirmed' then raise exception using errcode='55000',message='A confirmed supplier allocation cannot return to pending.';end if;
      if current_row.confirmation_status='confirmed' and (
        current_row.accommodation_id is distinct from nullif(item->>'accommodation_id','')::uuid or current_row.guide_id is distinct from nullif(item->>'guide_id','')::uuid
        or current_row.vehicle_id is distinct from nullif(item->>'vehicle_id','')::uuid or current_row.experience_id is distinct from nullif(item->>'experience_id','')::uuid
        or current_row.pricing_plan_id is distinct from nullif(item->>'pricing_plan_id','')::uuid or current_row.supplier_cost is distinct from supplier_cost
        or current_row.quantity is distinct from nullif(item->>'quantity','')::numeric or current_row.currency is distinct from coalesce(plan_row.currency,item->>'currency')
      ) then raise exception using errcode='55000',message='Use the supplier replacement command to change a confirmed allocation.';end if;
      update public.journey_supplier_allocations set
        destination_id=nullif(item->>'destination_id','')::uuid,from_destination_id=nullif(item->>'from_destination_id','')::uuid,to_destination_id=nullif(item->>'to_destination_id','')::uuid,
        from_location_key=nullif(item->>'from_location_key',''),to_location_key=nullif(item->>'to_location_key',''),accommodation_id=nullif(item->>'accommodation_id','')::uuid,
        guide_id=nullif(item->>'guide_id','')::uuid,vehicle_id=nullif(item->>'vehicle_id','')::uuid,experience_id=nullif(item->>'experience_id','')::uuid,
        pricing_plan_id=plan_row.id,pricing_plan_snapshot=snapshot,service_name=coalesce(plan_row.name,nullif(item->>'service_name','')),
        quantity=nullif(item->>'quantity','')::numeric,quantity_label=nullif(item->>'quantity_label',''),service_details=coalesce(item->'service_details','{}'::jsonb),
        provider_name=coalesce(provider,nullif(item->>'provider_name','')),supplier_contact=nullif(item->>'supplier_contact',''),supplier_cost=supplier_cost,
        selling_price=nullif(item->>'selling_price','')::numeric,currency=upper(coalesce(plan_row.currency,item->>'currency')),
        confirmation_status=desired_status,confirmed_at=case when desired_status='confirmed' then coalesce(confirmed_at,now()) else null end,
        confirmed_by=case when desired_status='confirmed' then coalesce(confirmed_by,p_actor_id) else null end,
        invoice_status=coalesce(item->>'invoice_status','not_requested'),payment_status=case when payment_status='paid' then 'paid' else coalesce(item->>'payment_status','pending') end,
        arrival_instructions=nullif(item->>'arrival_instructions',''),special_notes=nullif(item->>'special_notes',''),review_required=false,review_reason=null,
        reviewed_at=case when review_required then now() else reviewed_at end,reviewed_by=case when review_required then p_actor_id else reviewed_by end,
        commercial_source=commercial_source,updated_by=p_actor_id,updated_at=now()
      where id=allocation_id;
    else
      insert into public.journey_supplier_allocations(enquiry_id,curated_journey_id,allocation_type,destination_id,from_destination_id,to_destination_id,from_location_key,to_location_key,
        accommodation_id,guide_id,vehicle_id,experience_id,pricing_plan_id,pricing_plan_snapshot,service_name,quantity,quantity_label,service_details,provider_name,supplier_contact,
        supplier_cost,selling_price,currency,confirmation_status,invoice_status,payment_status,arrival_instructions,special_notes,commercial_source,created_by,updated_by,confirmed_at,confirmed_by)
      values(p_enquiry_id,p_curated_journey_id,item->>'allocation_type',nullif(item->>'destination_id','')::uuid,nullif(item->>'from_destination_id','')::uuid,nullif(item->>'to_destination_id','')::uuid,
        nullif(item->>'from_location_key',''),nullif(item->>'to_location_key',''),nullif(item->>'accommodation_id','')::uuid,nullif(item->>'guide_id','')::uuid,
        nullif(item->>'vehicle_id','')::uuid,nullif(item->>'experience_id','')::uuid,plan_row.id,snapshot,coalesce(plan_row.name,nullif(item->>'service_name','')),
        nullif(item->>'quantity','')::numeric,nullif(item->>'quantity_label',''),coalesce(item->'service_details','{}'::jsonb),coalesce(provider,nullif(item->>'provider_name','')),
        nullif(item->>'supplier_contact',''),supplier_cost,nullif(item->>'selling_price','')::numeric,upper(coalesce(plan_row.currency,item->>'currency')),desired_status,
        coalesce(item->>'invoice_status','not_requested'),coalesce(item->>'payment_status','pending'),nullif(item->>'arrival_instructions',''),nullif(item->>'special_notes',''),commercial_source,p_actor_id,p_actor_id,
        case when desired_status='confirmed' then now() end,case when desired_status='confirmed' then p_actor_id end) returning id into allocation_id;
    end if;
    saved_ids:=saved_ids||to_jsonb(allocation_id);
    plan_row:=null;
  end loop;
  insert into public.supplier_allocation_command_receipts(actor_id,enquiry_id,idempotency_key,command_type,request_hash,result)
  values(p_actor_id,p_enquiry_id,p_idempotency_key,'save_batch',request_hash,jsonb_build_object('allocationIds',saved_ids));
  return jsonb_build_object('allocationIds',saved_ids,'idempotent',false);
end $$;

create or replace function public.transition_supplier_allocation_command(p_allocation_id uuid,p_action text,p_actor_id uuid,p_reason text,p_idempotency_key text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare allocation public.journey_supplier_allocations%rowtype;receipt public.supplier_allocation_command_receipts%rowtype;target text;request_hash text;
begin
  if auth.role()<>'service_role' or p_actor_id is null or not private.staff_has_permission(p_actor_id,'suppliers.allocate') then raise exception using errcode='42501',message='The caller is not authorised to transition supplier allocations.';end if;
  if p_action not in('confirm','cancel') then raise exception using errcode='22023',message='Unknown supplier allocation action.';end if;
  if p_action='cancel' and char_length(btrim(coalesce(p_reason,'')))<5 then raise exception using errcode='22023',message='Explain why this supplier allocation is being cancelled.';end if;
  request_hash:=md5(p_allocation_id::text||p_action||coalesce(p_reason,''));
  select * into receipt from public.supplier_allocation_command_receipts where actor_id=p_actor_id and idempotency_key=p_idempotency_key;
  if receipt.id is not null then if receipt.request_hash<>request_hash then raise exception using errcode='23505',message='The allocation command key was already used.';end if;return receipt.result||jsonb_build_object('idempotent',true);end if;
  select * into allocation from public.journey_supplier_allocations where id=p_allocation_id for update;
  if allocation.id is null then raise exception using errcode='P0002',message='Supplier allocation not found.';end if;
  perform pg_advisory_xact_lock(hashtextextended(allocation.enquiry_id::text,9));
  target:=case p_action when 'confirm' then 'confirmed' else 'cancelled' end;
  if allocation.confirmation_status=target then
    insert into public.supplier_allocation_command_receipts(actor_id,enquiry_id,idempotency_key,command_type,request_hash,result) values(p_actor_id,allocation.enquiry_id,p_idempotency_key,p_action,request_hash,jsonb_build_object('allocationId',allocation.id,'status',target));
    return jsonb_build_object('allocationId',allocation.id,'status',target,'idempotent',true);
  end if;
  if allocation.confirmation_status='cancelled' or (p_action='confirm' and allocation.confirmation_status<>'pending') then raise exception using errcode='55000',message='The supplier allocation transition is not valid from its current state.';end if;
  if exists(select 1 from public.journey_proposals p join public.journey_proposal_acceptances a on a.proposal_id=p.id where p.enquiry_id=allocation.enquiry_id) then raise exception using errcode='55000',message='Accepted proposal allocations require an authorised journey amendment.';end if;
  if p_action='cancel' and exists(select 1 from public.journey_settlements where allocation_id=allocation.id and amount_paid+waived_amount>0) then raise exception using errcode='55000',message='Finance must resolve supplier activity before this allocation can be cancelled.';end if;
  perform set_config('roam.allocation_command','on',true);perform set_config('roam.allocation_actor',p_actor_id::text,true);perform set_config('roam.allocation_reason',coalesce(p_reason,''),true);perform set_config('roam.allocation_idempotency_key',p_idempotency_key,true);
  update public.journey_supplier_allocations set confirmation_status=target,
    confirmed_at=case when target='confirmed' then now() else confirmed_at end,confirmed_by=case when target='confirmed' then p_actor_id else confirmed_by end,
    cancelled_at=case when target='cancelled' then now() else null end,cancelled_by=case when target='cancelled' then p_actor_id else null end,
    cancellation_reason=case when target='cancelled' then btrim(p_reason) else null end,payment_status=case when target='cancelled' and payment_status<>'paid' then 'cancelled' else payment_status end,
    updated_by=p_actor_id,updated_at=now() where id=allocation.id;
  insert into public.supplier_allocation_command_receipts(actor_id,enquiry_id,idempotency_key,command_type,request_hash,result)
  values(p_actor_id,allocation.enquiry_id,p_idempotency_key,p_action,request_hash,jsonb_build_object('allocationId',allocation.id,'status',target));
  return jsonb_build_object('allocationId',allocation.id,'status',target,'idempotent',false);
end $$;

create or replace function public.update_supplier_fulfilment_command(p_allocation_id uuid,p_actor_id uuid,p_invoice_status text,p_arrival_instructions text,p_special_notes text,p_idempotency_key text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare allocation public.journey_supplier_allocations%rowtype;request_hash text;receipt public.supplier_allocation_command_receipts%rowtype;
begin
  if auth.role()<>'service_role' or p_actor_id is null or not private.staff_has_permission(p_actor_id,'operations.manage') then raise exception using errcode='42501',message='The caller is not authorised to manage supplier fulfilment.';end if;
  if p_invoice_status not in('not_requested','requested','received','not_required') then raise exception using errcode='22023',message='The supplier invoice status is invalid.';end if;
  request_hash:=md5(p_allocation_id::text||p_invoice_status||coalesce(p_arrival_instructions,'')||coalesce(p_special_notes,''));
  select * into receipt from public.supplier_allocation_command_receipts where actor_id=p_actor_id and idempotency_key=p_idempotency_key;
  if receipt.id is not null then if receipt.request_hash<>request_hash then raise exception using errcode='23505',message='The allocation command key was already used.';end if;return receipt.result||jsonb_build_object('idempotent',true);end if;
  select * into allocation from public.journey_supplier_allocations where id=p_allocation_id for update;if allocation.id is null then raise exception using errcode='P0002',message='Supplier allocation not found.';end if;
  if allocation.confirmation_status<>'confirmed' then raise exception using errcode='55000',message='Only a confirmed supplier allocation can enter operational fulfilment.';end if;
  perform set_config('roam.allocation_command','on',true);perform set_config('roam.allocation_actor',p_actor_id::text,true);perform set_config('roam.allocation_idempotency_key',p_idempotency_key,true);
  update public.journey_supplier_allocations set invoice_status=p_invoice_status,arrival_instructions=nullif(btrim(p_arrival_instructions),''),special_notes=nullif(btrim(p_special_notes),''),updated_by=p_actor_id,updated_at=now() where id=allocation.id;
  insert into public.supplier_allocation_command_receipts(actor_id,enquiry_id,idempotency_key,command_type,request_hash,result) values(p_actor_id,allocation.enquiry_id,p_idempotency_key,'fulfilment',request_hash,jsonb_build_object('allocationId',allocation.id));
  return jsonb_build_object('allocationId',allocation.id,'idempotent',false);
end $$;

create or replace function private.validate_settlement_allocation_linkage()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.allocation_id is not null and not exists(
    select 1 from public.journey_supplier_allocations allocation join public.journey_accounts account on account.id=new.account_id
    where allocation.id=new.allocation_id and allocation.enquiry_id=account.enquiry_id and upper(allocation.currency)=upper(new.currency)
  ) then raise exception using errcode='23514',message='The supplier settlement allocation does not belong to this journey account.';end if;
  return new;
end $$;
drop trigger if exists journey_settlements_validate_allocation_linkage on public.journey_settlements;
create trigger journey_settlements_validate_allocation_linkage before insert or update of account_id,allocation_id,currency on public.journey_settlements
for each row execute function private.validate_settlement_allocation_linkage();

create or replace function private.validate_benefit_allocation_linkage()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.allocation_id is not null and not exists(
    select 1 from public.journey_supplier_allocations allocation
    where allocation.id=new.allocation_id and allocation.enquiry_id=new.enquiry_id and allocation.confirmation_status<>'cancelled'
  ) then raise exception using errcode='23514',message='The preferred benefit allocation does not belong to this journey.';end if;
  return new;
end $$;
drop trigger if exists journey_benefits_validate_allocation_linkage on public.journey_benefits;
create trigger journey_benefits_validate_allocation_linkage before insert or update of enquiry_id,allocation_id on public.journey_benefits
for each row execute function private.validate_benefit_allocation_linkage();

revoke insert,update,delete on public.journey_supplier_allocations from authenticated;
revoke all on function public.save_supplier_allocations_command(uuid,uuid,jsonb,uuid,text) from public,anon,authenticated;
revoke all on function public.transition_supplier_allocation_command(uuid,text,uuid,text,text) from public,anon,authenticated;
revoke all on function public.update_supplier_fulfilment_command(uuid,uuid,text,text,text,text) from public,anon,authenticated;
grant execute on function public.save_supplier_allocations_command(uuid,uuid,jsonb,uuid,text) to service_role;
grant execute on function public.transition_supplier_allocation_command(uuid,text,uuid,text,text) to service_role;
grant execute on function public.update_supplier_fulfilment_command(uuid,uuid,text,text,text,text) to service_role;

comment on table public.journey_supplier_allocation_history is 'Append-only audit evidence for authoritative supplier allocation changes.';
comment on function public.save_supplier_allocations_command(uuid,uuid,jsonb,uuid,text) is 'Atomic, idempotent supplier-allocation batch command using authoritative journey and catalogue relationships.';
comment on column public.journey_supplier_allocations.commercial_source is 'Authoritative commercial origin: saved catalogue rate, explicit custom journey rate, or preserved legacy record.';

commit;
