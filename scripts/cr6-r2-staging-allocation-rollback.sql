-- CR6-R2 rollback-only allocation rehearsal. STAGING ONLY: hvcggnuptrcsxtrcjnre.
-- Do not run unless the SQL Editor project and fresh 85/202609230001 baseline match.
-- Synthetic rates below are TEST FIXTURES, not verified commercial supplier data.
-- No sequence defaults, Auth/Storage writes, external calls or permanent migration record.
begin;
set local request.jwt.claim.role = 'service_role';
create temporary table cr6_r2_results(name text primary key, result text) on commit drop;
create temporary table cr6_r2_contract on commit drop as
select oid,proowner,proacl,prosecdef,proconfig,proargtypes,prorettype,md5(prosrc) as source_md5
from pg_proc where oid='public.save_supplier_allocations_command(uuid,uuid,jsonb,uuid,text)'::regprocedure;

do $precheck$
declare actor uuid; enquiry uuid; experience uuid; destination uuid; allocation uuid;
  input jsonb; result jsonb; reproduced boolean:=false;
begin
  if (select count(*) from supabase_migrations.schema_migrations)<>85 or
     (select max(version) from supabase_migrations.schema_migrations)<>'202609230001' or
     (select source_md5 from cr6_r2_contract)<>'3b04ac7c79c9496ee6550861fb5f1e3b' then
    raise exception 'CR6-R2 HOLD: staging schema/function baseline changed';
  end if;
  if (select count(*) from public.enquiries)<>0 or
     (select count(*) from public.journey_supplier_allocations)<>0 or
     (select count(*) from public.pricing_plans)<>0 or
     (select count(*) from public.journey_supplier_allocation_history)<>0 or
     (select count(*) from public.supplier_allocation_command_receipts)<>0 then
    raise exception 'CR6-R2 HOLD: zero isolated-fixture baseline required';
  end if;
  if (select count(*) from public.profile_staff_roles where role_code='super_admin')<>1 then
    raise exception 'Exactly one existing staging Super Admin required';
  end if;
  select profile_id into actor from public.profile_staff_roles where role_code='super_admin';
  if not private.staff_has_permission(actor,'suppliers.allocate') then raise exception 'Missing existing allocation capability';end if;
  select experience_id,destination_id into experience,destination from public.experience_destinations order by experience_id,destination_id limit 1;
  if experience is null then raise exception 'No existing staging experience/destination pair';end if;
  -- This exception block rolls back its entire fixture, including audit/receipts.
  begin
    insert into public.enquiries(name,email,trip_state,status,selected_destinations,selected_experiences)
    values('CR6-R2 OLD-DEFINITION TEST','cr6-r2-old-definition@example.com',
      jsonb_build_object('synthetic',true,'selectedDestinationIds',jsonb_build_array(destination),'selectedExperienceIds',jsonb_build_array(experience)),
      'new',jsonb_build_array(destination),jsonb_build_array(experience)) returning id into enquiry;
    input:=jsonb_build_object('allocation_type','experience','destination_id',destination,'experience_id',experience,
      'provider_name','CR6-R2 TEST ONLY','service_name','CR6-R2 TEST ONLY','quantity',1,'quantity_label','synthetic service',
      'supplier_cost',60,'selling_price',100,'currency','USD','confirmation_status','pending',
      'service_details',jsonb_build_object('customJourneyRate',true,'synthetic',true));
    result:=public.save_supplier_allocations_command(enquiry,null,jsonb_build_array(input),actor,'CR6-R2-old-insert');
    allocation:=(result->'allocationIds'->>0)::uuid;
    perform public.save_supplier_allocations_command(enquiry,null,jsonb_build_array(input||jsonb_build_object('id',allocation,'supplier_cost',61)),actor,'CR6-R2-old-update');
  exception when ambiguous_column then
    if sqlerrm not like '%supplier_cost%' then raise;end if;
    reproduced:=true;
  end;
  if not reproduced then raise exception 'Expected original 42702 was not reproduced';end if;
  insert into cr6_r2_results values('old_definition_42702','PASS');
end $precheck$;

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

do $proof$
declare
  marker text:='CR6-R2-ROLLBACK-20260927'; actor uuid; enquiry uuid; experience uuid; destination uuid;
  allocation uuid; plan uuid; input jsonb; result jsonb; rejected boolean; violated_constraint text;
  history_count bigint; receipt_count bigint; lock_before integer;
begin
  select profile_id into actor from public.profile_staff_roles where role_code='super_admin';
  select experience_id,destination_id into experience,destination from public.experience_destinations order by experience_id,destination_id limit 1;
  if not exists(select 1 from pg_proc p join cr6_r2_contract c on c.oid=p.oid
    where p.proowner=c.proowner and p.proacl is not distinct from c.proacl and p.prosecdef=c.prosecdef
      and p.proconfig is not distinct from c.proconfig and p.proargtypes=c.proargtypes and p.prorettype=c.prorettype
      and md5(replace(replace(p.prosrc,'v_supplier_cost','supplier_cost'),'v_commercial_source','commercial_source'))=c.source_md5) then
    raise exception 'Function contract/security or non-rename semantics changed';
  end if;
  insert into cr6_r2_results values('signature_security_acl_semantics','PASS');
  insert into public.enquiries(name,email,trip_state,status,selected_destinations,selected_experiences)
  values(marker,'cr6-r2-rollback-20260927@example.com',
    jsonb_build_object('synthetic',true,'selectedDestinationIds',jsonb_build_array(destination),'selectedExperienceIds',jsonb_build_array(experience)),
    'new',jsonb_build_array(destination),jsonb_build_array(experience)) returning id into enquiry;
  input:=jsonb_build_object('allocation_type','experience','destination_id',destination,'experience_id',experience,
    'provider_name',marker,'service_name',marker,'quantity',1,'quantity_label','synthetic service',
    'supplier_cost',60,'selling_price',100,'currency','USD','confirmation_status','pending',
    'service_details',jsonb_build_object('customJourneyRate',true,'synthetic',true));
  rejected:=false;
  begin
    perform public.save_supplier_allocations_command(enquiry,null,jsonb_build_array(input||jsonb_build_object('supplier_cost',10.001)),actor,marker||'-invalid-insert');
  exception when check_violation then
    get stacked diagnostics violated_constraint=constraint_name;
    if violated_constraint<>'journey_supplier_allocations_supplier_cost_cent_precision' then raise;end if;
    rejected:=true;
  end;
  if not rejected or (select count(*) from public.journey_supplier_allocations)<>0 or
     (select count(*) from public.journey_supplier_allocation_history)<>0 or
     (select count(*) from public.supplier_allocation_command_receipts)<>0 then raise exception 'Sub-cent INSERT/atomicity failed';end if;
  insert into cr6_r2_results values('subcent_insert_10_001','PASS');

  result:=public.save_supplier_allocations_command(enquiry,null,jsonb_build_array(input),actor,marker||'-insert');
  allocation:=(result->'allocationIds'->>0)::uuid;
  if not exists(select 1 from public.journey_supplier_allocations where id=allocation and supplier_cost=60 and commercial_source='custom_journey_rate') or
     result->>'idempotent'<>'false' then raise exception 'Valid INSERT contract failed';end if;
  insert into cr6_r2_results values('valid_cent_insert','PASS');
  result:=public.save_supplier_allocations_command(enquiry,null,jsonb_build_array(input||jsonb_build_object('id',allocation,'supplier_cost',61)),actor,marker||'-cost-update');
  if not exists(select 1 from public.journey_supplier_allocations where id=allocation and supplier_cost=61 and commercial_source='custom_journey_rate') then
    raise exception 'Valid supplier_cost UPDATE failed';end if;
  insert into cr6_r2_results values('valid_cent_supplier_cost_update','PASS');

  -- Explicitly synthetic catalogue rate, existing resource identity read-only.
  insert into public.pricing_plans(entity_type,entity_id,name,price,currency,charging_method,active,details)
  values('experience',experience,marker,61,'USD','fixed',true,'{"synthetic":true}'::jsonb) returning id into plan;
  result:=public.save_supplier_allocations_command(enquiry,null,jsonb_build_array(input||jsonb_build_object('id',allocation,'pricing_plan_id',plan)),actor,marker||'-source-update');
  if not exists(select 1 from public.journey_supplier_allocations where id=allocation and supplier_cost=61 and
    commercial_source='catalogue_rate' and pricing_plan_id=plan and (pricing_plan_snapshot->>'unitPrice')::numeric=61) then
    raise exception 'commercial_source UPDATE failed';end if;
  insert into cr6_r2_results values('commercial_source_update','PASS');
  input:=input||jsonb_build_object('id',allocation,'supplier_cost',62);
  result:=public.save_supplier_allocations_command(enquiry,null,jsonb_build_array(input),actor,marker||'-combined-update');
  if not exists(select 1 from public.journey_supplier_allocations where id=allocation and supplier_cost=62 and
    commercial_source='custom_journey_rate' and pricing_plan_id is null and pricing_plan_snapshot='{}'::jsonb) then
    raise exception 'Combined supplier_cost/commercial_source UPDATE failed';end if;
  insert into cr6_r2_results values('combined_cost_source_update','PASS');

  select count(*) into history_count from public.journey_supplier_allocation_history;
  select count(*) into receipt_count from public.supplier_allocation_command_receipts;
  rejected:=false;
  begin
    perform public.save_supplier_allocations_command(enquiry,null,jsonb_build_array(input||jsonb_build_object('supplier_cost',10.001)),actor,marker||'-invalid-update');
  exception when check_violation then
    get stacked diagnostics violated_constraint=constraint_name;
    if violated_constraint<>'journey_supplier_allocations_supplier_cost_cent_precision' then raise;end if;
    rejected:=true;
  end;
  if not rejected or (select supplier_cost from public.journey_supplier_allocations where id=allocation)<>62 or
     (select count(*) from public.journey_supplier_allocation_history)<>history_count or
     (select count(*) from public.supplier_allocation_command_receipts)<>receipt_count then
    raise exception 'Sub-cent UPDATE/atomicity failed';end if;
  insert into cr6_r2_results values('subcent_update_10_001','PASS');

  select lock_version into lock_before from public.journey_supplier_allocations where id=allocation;
  result:=public.save_supplier_allocations_command(enquiry,null,jsonb_build_array(input),actor,marker||'-unchanged');
  if not exists(select 1 from public.journey_supplier_allocations where id=allocation and supplier_cost=62 and
    commercial_source='custom_journey_rate' and lock_version=lock_before+1) or
     (select count(*) from public.journey_supplier_allocation_history)<>history_count+1 then
    raise exception 'Unchanged command audit/version behaviour changed';end if;
  insert into cr6_r2_results values('unchanged_allocation_behaviour','PASS');
  select count(*) into history_count from public.journey_supplier_allocation_history;
  select count(*) into receipt_count from public.supplier_allocation_command_receipts;
  result:=public.save_supplier_allocations_command(enquiry,null,jsonb_build_array(input),actor,marker||'-unchanged');
  if result->>'idempotent'<>'true' or (result->'allocationIds'->>0)::uuid<>allocation or
     (select count(*) from public.journey_supplier_allocation_history)<>history_count or
     (select count(*) from public.supplier_allocation_command_receipts)<>receipt_count then raise exception 'Idempotent replay duplicated effects';end if;
  rejected:=false;
  begin
    perform public.save_supplier_allocations_command(enquiry,null,jsonb_build_array(input||jsonb_build_object('supplier_cost',63)),actor,marker||'-unchanged');
  exception when unique_violation then rejected:=true;end;
  if not rejected then raise exception 'Idempotency collision accepted';end if;
  insert into cr6_r2_results values('idempotency_replay_collision','PASS');

  rejected:=false;
  begin
    perform public.save_supplier_allocations_command(enquiry,null,jsonb_build_array(input),null,marker||'-unauthorized-actor');
  exception when insufficient_privilege then rejected:=true;end;
  if not rejected then raise exception 'Missing actor authorized';end if;
  perform set_config('request.jwt.claim.role','authenticated',true);
  rejected:=false;
  begin
    perform public.save_supplier_allocations_command(enquiry,null,jsonb_build_array(input),actor,marker||'-unauthorized-role');
  exception when insufficient_privilege then rejected:=true;end;
  perform set_config('request.jwt.claim.role','service_role',true);
  if not rejected then raise exception 'Non-service caller authorized';end if;
  if has_function_privilege('anon','public.save_supplier_allocations_command(uuid,uuid,jsonb,uuid,text)','EXECUTE') or
     has_function_privilege('authenticated','public.save_supplier_allocations_command(uuid,uuid,jsonb,uuid,text)','EXECUTE') then
    raise exception 'Execution grants broadened';end if;
  insert into cr6_r2_results values('authorization_actor_role_acl','PASS');

  if (select count(*) from public.journey_supplier_allocation_history where allocation_id=allocation)<>5 or
     (select count(*) from public.supplier_allocation_command_receipts where enquiry_id=enquiry)<>5 or
     not exists(select 1 from public.journey_supplier_allocation_history where allocation_id=allocation and event_type='created' and changed_by=actor) or
     not exists(select 1 from public.journey_supplier_allocation_history where idempotency_key=marker||'-combined-update' and
       previous_snapshot->>'commercialSource'='catalogue_rate' and new_snapshot->>'commercialSource'='custom_journey_rate' and
       (previous_snapshot->>'supplierCost')::numeric=61 and (new_snapshot->>'supplierCost')::numeric=62 and changed_by=actor) then
    raise exception 'Audit/receipt snapshots not preserved';end if;
  insert into cr6_r2_results values('audit_history_receipts','PASS');
  if (select count(*) from public.journey_accounts)<>0 or (select count(*) from public.journey_proposals)<>0 or
     (select count(*) from public.accounting_transactions)<>0 or (select count(*) from public.journey_settlements)<>0 or
     (select last_value from public.journey_account_number_seq)<>1 or
     (select is_called from public.journey_account_number_seq) then raise exception 'Unexpected finance/sequence effects';end if;
end $proof$;
select jsonb_object_agg(name,result) as cr6_r2_inside_transaction_proof from cr6_r2_results;
rollback;
