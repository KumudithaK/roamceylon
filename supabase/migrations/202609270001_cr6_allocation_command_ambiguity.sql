-- CR6-R2: disambiguate command locals without changing columns or JSON keys.
-- Preserve the enum/text compatibility repair applied by 202608120009.
-- CREATE OR REPLACE retains the existing owner/ACL; no privilege widening.

create or replace function public.save_supplier_allocations_command(
  p_enquiry_id uuid,p_curated_journey_id uuid,p_allocations jsonb,p_actor_id uuid,p_idempotency_key text
) returns jsonb language plpgsql security definer set search_path='' as $$
declare item jsonb; current_row public.journey_supplier_allocations%rowtype; saved_ids jsonb:='[]'::jsonb;
  allocation_id uuid; desired_status text; request_hash text; receipt public.supplier_allocation_command_receipts%rowtype;
  plan_row public.pricing_plans%rowtype; resource_id uuid; provider text; v_commercial_source text; snapshot jsonb; v_supplier_cost numeric;
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
      if plan_row.id is null or plan_row.entity_type::text<>item->>'allocation_type' or plan_row.entity_id<>resource_id then raise exception using errcode='23514',message='The selected catalogue rate does not belong to this supplier service.';end if;
      v_commercial_source:='catalogue_rate';v_supplier_cost:=round(plan_row.price*(item->>'quantity')::numeric,2);
      snapshot:=jsonb_build_object('id',plan_row.id,'name',plan_row.name,'description',plan_row.description,'unitPrice',plan_row.price,'currency',plan_row.currency,'chargingMethod',plan_row.charging_method,'details',plan_row.details,'notes',plan_row.notes);
    else v_commercial_source:='custom_journey_rate';v_supplier_cost:=nullif(item->>'supplier_cost','')::numeric;snapshot:='{}'::jsonb;end if;
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
        or current_row.pricing_plan_id is distinct from nullif(item->>'pricing_plan_id','')::uuid or current_row.supplier_cost is distinct from v_supplier_cost
        or current_row.quantity is distinct from nullif(item->>'quantity','')::numeric or current_row.currency is distinct from coalesce(plan_row.currency,item->>'currency')
      ) then raise exception using errcode='55000',message='Use the supplier replacement command to change a confirmed allocation.';end if;
      update public.journey_supplier_allocations set
        destination_id=nullif(item->>'destination_id','')::uuid,from_destination_id=nullif(item->>'from_destination_id','')::uuid,to_destination_id=nullif(item->>'to_destination_id','')::uuid,
        from_location_key=nullif(item->>'from_location_key',''),to_location_key=nullif(item->>'to_location_key',''),accommodation_id=nullif(item->>'accommodation_id','')::uuid,
        guide_id=nullif(item->>'guide_id','')::uuid,vehicle_id=nullif(item->>'vehicle_id','')::uuid,experience_id=nullif(item->>'experience_id','')::uuid,
        pricing_plan_id=plan_row.id,pricing_plan_snapshot=snapshot,service_name=coalesce(plan_row.name,nullif(item->>'service_name','')),
        quantity=nullif(item->>'quantity','')::numeric,quantity_label=nullif(item->>'quantity_label',''),service_details=coalesce(item->'service_details','{}'::jsonb),
        provider_name=coalesce(provider,nullif(item->>'provider_name','')),supplier_contact=nullif(item->>'supplier_contact',''),supplier_cost=v_supplier_cost,
        selling_price=nullif(item->>'selling_price','')::numeric,currency=upper(coalesce(plan_row.currency,item->>'currency')),
        confirmation_status=desired_status,confirmed_at=case when desired_status='confirmed' then coalesce(confirmed_at,now()) else null end,
        confirmed_by=case when desired_status='confirmed' then coalesce(confirmed_by,p_actor_id) else null end,
        invoice_status=coalesce(item->>'invoice_status','not_requested'),payment_status=case when payment_status='paid' then 'paid' else coalesce(item->>'payment_status','pending') end,
        arrival_instructions=nullif(item->>'arrival_instructions',''),special_notes=nullif(item->>'special_notes',''),review_required=false,review_reason=null,
        reviewed_at=case when review_required then now() else reviewed_at end,reviewed_by=case when review_required then p_actor_id else reviewed_by end,
        commercial_source=v_commercial_source,updated_by=p_actor_id,updated_at=now()
      where id=allocation_id;
    else
      insert into public.journey_supplier_allocations(enquiry_id,curated_journey_id,allocation_type,destination_id,from_destination_id,to_destination_id,from_location_key,to_location_key,
        accommodation_id,guide_id,vehicle_id,experience_id,pricing_plan_id,pricing_plan_snapshot,service_name,quantity,quantity_label,service_details,provider_name,supplier_contact,
        supplier_cost,selling_price,currency,confirmation_status,invoice_status,payment_status,arrival_instructions,special_notes,commercial_source,created_by,updated_by,confirmed_at,confirmed_by)
      values(p_enquiry_id,p_curated_journey_id,item->>'allocation_type',nullif(item->>'destination_id','')::uuid,nullif(item->>'from_destination_id','')::uuid,nullif(item->>'to_destination_id','')::uuid,
        nullif(item->>'from_location_key',''),nullif(item->>'to_location_key',''),nullif(item->>'accommodation_id','')::uuid,nullif(item->>'guide_id','')::uuid,
        nullif(item->>'vehicle_id','')::uuid,nullif(item->>'experience_id','')::uuid,plan_row.id,snapshot,coalesce(plan_row.name,nullif(item->>'service_name','')),
        nullif(item->>'quantity','')::numeric,nullif(item->>'quantity_label',''),coalesce(item->'service_details','{}'::jsonb),coalesce(provider,nullif(item->>'provider_name','')),
        nullif(item->>'supplier_contact',''),v_supplier_cost,nullif(item->>'selling_price','')::numeric,upper(coalesce(plan_row.currency,item->>'currency')),desired_status,
        coalesce(item->>'invoice_status','not_requested'),coalesce(item->>'payment_status','pending'),nullif(item->>'arrival_instructions',''),nullif(item->>'special_notes',''),v_commercial_source,p_actor_id,p_actor_id,
        case when desired_status='confirmed' then now() end,case when desired_status='confirmed' then p_actor_id end) returning id into allocation_id;
    end if;
    saved_ids:=saved_ids||to_jsonb(allocation_id);
    plan_row:=null;
  end loop;
  insert into public.supplier_allocation_command_receipts(actor_id,enquiry_id,idempotency_key,command_type,request_hash,result)
  values(p_actor_id,p_enquiry_id,p_idempotency_key,'save_batch',request_hash,jsonb_build_object('allocationIds',saved_ids));
  return jsonb_build_object('allocationIds',saved_ids,'idempotent',false);
end $$;

