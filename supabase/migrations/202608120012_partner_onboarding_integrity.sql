begin;

alter table public.partner_applications
  add column if not exists decision_snapshot jsonb,
  add column if not exists converted_catalogue jsonb not null default '[]'::jsonb,
  add constraint partner_applications_decision_snapshot_object
    check(decision_snapshot is null or jsonb_typeof(decision_snapshot)='object'),
  add constraint partner_applications_converted_catalogue_array
    check(jsonb_typeof(converted_catalogue)='array');

alter table public.accommodations add column if not exists onboarding_application_id uuid references public.partner_applications(id) on delete restrict;
alter table public.vehicles add column if not exists onboarding_application_id uuid references public.partner_applications(id) on delete restrict;
alter table public.guides add column if not exists onboarding_application_id uuid references public.partner_applications(id) on delete restrict;
create index if not exists accommodations_onboarding_application_idx on public.accommodations(onboarding_application_id) where onboarding_application_id is not null;
create index if not exists vehicles_onboarding_application_idx on public.vehicles(onboarding_application_id) where onboarding_application_id is not null;
create index if not exists guides_onboarding_application_idx on public.guides(onboarding_application_id) where onboarding_application_id is not null;

create table if not exists public.partner_onboarding_command_receipts(
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users(id) on delete restrict,
  application_id uuid not null references public.partner_applications(id) on delete restrict,
  idempotency_key text not null,
  command_type text not null,
  request_hash text not null,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(actor_id,idempotency_key)
);
alter table public.partner_onboarding_command_receipts enable row level security;
create policy partner_onboarding_receipts_reviewer_read on public.partner_onboarding_command_receipts for select to authenticated
using(private.has_permission('suppliers.manage'));
grant select on public.partner_onboarding_command_receipts to authenticated;
revoke insert,update,delete on public.partner_onboarding_command_receipts from anon,authenticated;

create or replace function private.partner_application_snapshot(application public.partner_applications)
returns jsonb language sql stable security definer set search_path='' as $$
  select jsonb_build_object(
    'applicationId',application.id,'reference',application.application_reference,'partnerType',application.partner_type,
    'applicantName',application.applicant_name,'businessName',application.business_name,'email',application.email,
    'phone',application.phone,'preferredContactMethod',application.preferred_contact_method,'address',application.address,
    'district',application.district,'province',application.province,'website',application.website,'socialUrl',application.social_url,
    'introduction',application.introduction,'destinationIds',application.destination_ids,'applicationData',application.application_data,
    'submittedAt',application.submitted_at
  )
$$;
revoke all on function private.partner_application_snapshot(public.partner_applications) from public,anon,authenticated;

create or replace function private.guard_partner_application_integrity()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if tg_op='INSERT' then
    if new.status<>'submitted' or new.reviewed_at is not null or new.reviewed_by is not null
      or new.decision_snapshot is not null or new.converted_catalogue<>'[]'::jsonb then
      raise exception using errcode='42501',message='A new partner application may only enter the submitted state.';
    end if;
    return new;
  elsif tg_op='DELETE' then
    if auth.role()='service_role' and current_setting('roam.phase12_synthetic_cleanup',true)='on' then return old;end if;
    if auth.role()='service_role' and old.status='submitted'
      and not exists(select 1 from public.partner_application_history where application_id=old.id) then return old;end if;
    raise exception using errcode='42501',message='Partner application evidence cannot be deleted.';
  end if;
  if current_setting('roam.partner_onboarding_command',true)<>'on' then
    raise exception using errcode='42501',message='Partner application changes require the authoritative onboarding command.';
  end if;
  if old.status in('approved','converted') and (
    new.partner_type is distinct from old.partner_type or new.applicant_name is distinct from old.applicant_name
    or new.business_name is distinct from old.business_name or new.email is distinct from old.email
    or new.phone is distinct from old.phone or new.preferred_contact_method is distinct from old.preferred_contact_method
    or new.address is distinct from old.address or new.district is distinct from old.district or new.province is distinct from old.province
    or new.website is distinct from old.website or new.social_url is distinct from old.social_url
    or new.introduction is distinct from old.introduction or new.destination_ids is distinct from old.destination_ids
    or new.application_data is distinct from old.application_data or new.submitted_at is distinct from old.submitted_at
    or new.decision_snapshot is distinct from old.decision_snapshot
  ) then raise exception using errcode='55000',message='Approved partner application evidence is immutable.';end if;
  return new;
end $$;
drop trigger if exists partner_applications_integrity_guard on public.partner_applications;
create trigger partner_applications_integrity_guard before insert or update or delete on public.partner_applications
for each row execute function private.guard_partner_application_integrity();

create or replace function private.guard_partner_application_history()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if auth.role()='service_role' and current_setting('roam.phase12_synthetic_cleanup',true)='on' then
    if tg_op='DELETE' then return old;else return new;end if;
  end if;
  if tg_op<>'INSERT' then raise exception using errcode='42501',message='Partner review history is append-only.';end if;
  if current_setting('roam.partner_onboarding_command',true)='on' then return new;end if;
  if auth.role()='service_role' and new.from_status is null and new.to_status='submitted'
    and exists(select 1 from public.partner_applications where id=new.application_id and status='submitted') then return new;end if;
  raise exception using errcode='42501',message='Partner review history requires the authoritative onboarding command.';
end $$;
drop trigger if exists partner_application_history_integrity_guard on public.partner_application_history;
create trigger partner_application_history_integrity_guard before insert or update or delete on public.partner_application_history
for each row execute function private.guard_partner_application_history();

create or replace function private.guard_catalogue_onboarding_link()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if tg_op='INSERT' and new.onboarding_application_id is not null and auth.role()<>'service_role'
    and current_setting('roam.partner_onboarding_command',true)<>'on' then
    raise exception using errcode='42501',message='Application provenance can only be established by the onboarding command.';
  end if;
  if tg_op='UPDATE' and new.onboarding_application_id is distinct from old.onboarding_application_id then
    raise exception using errcode='42501',message='Supplier onboarding provenance is immutable.';
  end if;
  return new;
end $$;
drop trigger if exists accommodations_onboarding_link_guard on public.accommodations;
create trigger accommodations_onboarding_link_guard before insert or update on public.accommodations for each row execute function private.guard_catalogue_onboarding_link();
drop trigger if exists vehicles_onboarding_link_guard on public.vehicles;
create trigger vehicles_onboarding_link_guard before insert or update on public.vehicles for each row execute function private.guard_catalogue_onboarding_link();
drop trigger if exists guides_onboarding_link_guard on public.guides;
create trigger guides_onboarding_link_guard before insert or update on public.guides for each row execute function private.guard_catalogue_onboarding_link();

create or replace function public.review_partner_application_command(
  p_application_id uuid,p_action text,p_actor_id uuid,p_note text,p_idempotency_key text
) returns jsonb language plpgsql security definer set search_path='' as $$
declare application public.partner_applications%rowtype;receipt public.partner_onboarding_command_receipts%rowtype;
  target text;request_hash text;result jsonb;allowed boolean:=false;
begin
  if auth.role()<>'service_role' or p_actor_id is null or not private.staff_has_permission(p_actor_id,'suppliers.manage') then
    raise exception using errcode='42501',message='The caller is not authorised to review partner applications.';end if;
  if p_action not in('start_review','request_information','approve','reject','save_notes') then raise exception using errcode='22023',message='Unknown partner review action.';end if;
  if char_length(btrim(coalesce(p_idempotency_key,''))) not between 8 and 160 then raise exception using errcode='22023',message='A valid partner review command key is required.';end if;
  if p_action in('request_information','reject') and char_length(btrim(coalesce(p_note,'')))<3 then raise exception using errcode='22023',message='A review explanation is required.';end if;
  request_hash:=md5(p_application_id::text||p_action||coalesce(p_note,''));
  select * into receipt from public.partner_onboarding_command_receipts where actor_id=p_actor_id and idempotency_key=p_idempotency_key for update;
  if receipt.id is not null then
    if receipt.request_hash<>request_hash then raise exception using errcode='23505',message='The partner review command key was already used for another request.';end if;
    return receipt.result||jsonb_build_object('idempotent',true);
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_application_id::text,12));
  select * into application from public.partner_applications where id=p_application_id for update;
  if application.id is null then raise exception using errcode='P0002',message='Partner application not found.';end if;
  if p_action='save_notes' then
    if application.status='converted' then raise exception using errcode='55000',message='Converted application evidence cannot be edited.';end if;
    perform set_config('roam.partner_onboarding_command','on',true);
    update public.partner_applications set internal_notes=nullif(btrim(p_note),''),updated_at=now() where id=application.id;
    target:=application.status;allowed:=true;
  else
    target:=case p_action when 'start_review' then 'under_review' when 'request_information' then 'needs_information' when 'approve' then 'approved' else 'rejected' end;
    if target=application.status then allowed:=true;
    elsif application.status='submitted' and target in('under_review','rejected') then allowed:=true;
    elsif application.status='under_review' and target in('needs_information','approved','rejected') then allowed:=true;
    elsif application.status='needs_information' and target in('under_review','rejected') then allowed:=true;
    end if;
    if not allowed then raise exception using errcode='55000',message='The partner application transition is not valid from its current state.';end if;
    if p_action='approve' and (nullif(btrim(application.applicant_name),'') is null or nullif(btrim(application.email),'') is null
      or nullif(btrim(application.phone),'') is null or nullif(btrim(application.introduction),'') is null) then
      raise exception using errcode='23514',message='Required partner application evidence is incomplete.';end if;
    if target<>application.status then
      perform set_config('roam.partner_onboarding_command','on',true);
      update public.partner_applications set status=target,internal_notes=coalesce(nullif(btrim(p_note),''),internal_notes),reviewed_at=now(),reviewed_by=p_actor_id,
        decision_snapshot=case when target in('approved','rejected') then private.partner_application_snapshot(application)||jsonb_build_object('decision',target,'decidedAt',now(),'decidedBy',p_actor_id) else decision_snapshot end,
        updated_at=now() where id=application.id;
      insert into public.partner_application_history(application_id,from_status,to_status,note,changed_by)
      values(application.id,application.status,target,nullif(btrim(p_note),''),p_actor_id);
    end if;
  end if;
  result:=jsonb_build_object('applicationId',application.id,'status',target,'idempotent',target=application.status);
  insert into public.partner_onboarding_command_receipts(actor_id,application_id,idempotency_key,command_type,request_hash,result)
  values(p_actor_id,application.id,p_idempotency_key,p_action,request_hash,result);
  return result;
end $$;

create or replace function public.convert_partner_application_command(
  p_application_id uuid,p_actor_id uuid,p_expected_partner_type text,p_idempotency_key text
) returns jsonb language plpgsql security definer set search_path='' as $$
declare application public.partner_applications%rowtype;receipt public.partner_onboarding_command_receipts%rowtype;
  request_hash text;result jsonb;created_ids jsonb:='[]'::jsonb;created_id uuid;entry jsonb;item_index integer:=0;
  base_slug text;entries jsonb;
begin
  if auth.role()<>'service_role' or p_actor_id is null or not private.staff_has_permission(p_actor_id,'suppliers.manage') then
    raise exception using errcode='42501',message='The caller is not authorised to convert partner applications.';end if;
  if char_length(btrim(coalesce(p_idempotency_key,''))) not between 8 and 160 then raise exception using errcode='22023',message='A valid conversion command key is required.';end if;
  request_hash:=md5(p_application_id::text||coalesce(p_expected_partner_type,''));
  select * into receipt from public.partner_onboarding_command_receipts where actor_id=p_actor_id and idempotency_key=p_idempotency_key for update;
  if receipt.id is not null then
    if receipt.request_hash<>request_hash then raise exception using errcode='23505',message='The conversion command key was already used for another application.';end if;
    return receipt.result||jsonb_build_object('idempotent',true);
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_application_id::text,12));
  select * into application from public.partner_applications where id=p_application_id for update;
  if application.id is null then raise exception using errcode='P0002',message='Partner application not found.';end if;
  if p_expected_partner_type is not null and p_expected_partner_type<>application.partner_type::text then raise exception using errcode='23514',message='The requested catalogue type does not match the application.';end if;
  if application.status='converted' then
    result:=jsonb_build_object('applicationId',application.id,'status','converted','entityType',application.partner_type,'entityIds',application.converted_catalogue,'idempotent',true);
  elsif application.status<>'approved' then raise exception using errcode='55000',message='Only an approved partner application can become a catalogue record.';
  else
    base_slug:=trim(both '-' from regexp_replace(lower(coalesce(application.business_name,application.applicant_name)),'[^a-z0-9]+','-','g'))||'-'||substr(application.id::text,1,6);
    perform set_config('roam.partner_onboarding_command','on',true);
    if application.partner_type='accommodation' then
      insert into public.accommodations(name,slug,property_type,short_description,address,email,phone,status,active,verified,featured,onboarding_application_id)
      values(coalesce(application.business_name,application.applicant_name),base_slug,nullif(application.application_data->>'propertyType',''),application.introduction,application.address,application.email,application.phone,'draft',false,false,false,application.id)
      returning id into created_id;created_ids:=created_ids||to_jsonb(created_id);
    elsif application.partner_type='guide' then
      insert into public.guides(name,slug,short_bio,languages,years_experience,specialities,email,phone,status,active,verified,featured,onboarding_application_id)
      values(coalesce(application.business_name,application.applicant_name),base_slug,application.introduction,
        to_jsonb(string_to_array(coalesce(application.application_data->>'languages',''),',')),nullif(application.application_data->>'yearsExperience','')::integer,
        to_jsonb(string_to_array(coalesce(application.application_data->>'specialistKnowledge',''),',')),application.email,application.phone,'draft',false,false,false,application.id)
      returning id into created_id;created_ids:=created_ids||to_jsonb(created_id);
    else
      entries:=application.application_data->'entries';if jsonb_typeof(entries)<>'array' or jsonb_array_length(entries)=0 then entries:=jsonb_build_array('{}'::jsonb);end if;
      if jsonb_array_length(entries)>50 then raise exception using errcode='22023',message='The vehicle application contains too many catalogue entries.';end if;
      for entry in select value from jsonb_array_elements(entries) loop item_index:=item_index+1;
        insert into public.vehicles(listing_title,slug,vehicle_type,vehicle_model,passenger_capacity,short_description,email,phone,status,active,verified,featured,onboarding_application_id)
        values(coalesce(nullif(entry->>'model',''),application.business_name,application.applicant_name),base_slug||'-'||item_index,
          nullif(entry->>'category',''),nullif(entry->>'model',''),nullif(entry->>'capacity','')::integer,application.introduction,application.email,application.phone,'draft',false,false,false,application.id)
        returning id into created_id;created_ids:=created_ids||to_jsonb(created_id);
      end loop;
    end if;
    update public.partner_applications set status='converted',converted_catalogue=created_ids,reviewed_at=now(),reviewed_by=p_actor_id,updated_at=now() where id=application.id;
    insert into public.partner_application_history(application_id,from_status,to_status,note,changed_by)
    values(application.id,'approved','converted','Created inactive draft catalogue record(s).',p_actor_id);
    result:=jsonb_build_object('applicationId',application.id,'status','converted','entityType',application.partner_type,'entityIds',created_ids,'idempotent',false);
  end if;
  insert into public.partner_onboarding_command_receipts(actor_id,application_id,idempotency_key,command_type,request_hash,result)
  values(p_actor_id,application.id,p_idempotency_key,'convert',request_hash,result);
  return result;
end $$;

create or replace function private.supplier_is_onboarding_eligible(p_entity_type text,p_entity_id uuid)
returns boolean language plpgsql stable security definer set search_path='' as $$
declare application_id uuid;
begin
  if p_entity_type='accommodation' then select onboarding_application_id into application_id from public.accommodations where id=p_entity_id;
  elsif p_entity_type='vehicle' then select onboarding_application_id into application_id from public.vehicles where id=p_entity_id;
  elsif p_entity_type='guide' then select onboarding_application_id into application_id from public.guides where id=p_entity_id;
  elsif p_entity_type='experience' then return exists(select 1 from public.experiences where id=p_entity_id);
  else return false;end if;
  if not found then return false;end if;
  return application_id is null or exists(
    select 1 from public.partner_applications application
    where application.id=application_id and application.status='converted'
      and application.converted_catalogue ? p_entity_id::text
      and application.partner_type::text=p_entity_type
  );
end $$;
revoke all on function private.supplier_is_onboarding_eligible(text,uuid) from public,anon,authenticated;

create or replace function private.guard_supplier_onboarding_eligibility()
returns trigger language plpgsql security definer set search_path='' as $$
declare resource_id uuid;
begin
  resource_id:=case new.allocation_type when 'accommodation' then new.accommodation_id when 'guide' then new.guide_id when 'vehicle' then new.vehicle_id else new.experience_id end;
  if resource_id is not null and not private.supplier_is_onboarding_eligible(new.allocation_type,resource_id) then
    raise exception using errcode='23514',message='The supplier is not eligible for journey allocation.';end if;
  return new;
end $$;
drop trigger if exists journey_supplier_onboarding_eligibility on public.journey_supplier_allocations;
create trigger journey_supplier_onboarding_eligibility before insert or update of accommodation_id,guide_id,vehicle_id,experience_id,allocation_type on public.journey_supplier_allocations
for each row execute function private.guard_supplier_onboarding_eligibility();

drop policy if exists partner_applications_staff_read on public.partner_applications;
drop policy if exists partner_applications_staff_insert on public.partner_applications;
drop policy if exists partner_applications_staff_update on public.partner_applications;
drop policy if exists partner_applications_staff_delete on public.partner_applications;
create policy partner_applications_reviewer_read on public.partner_applications for select to authenticated using(private.has_permission('suppliers.manage'));

drop policy if exists partner_files_staff_read on public.partner_application_files;
drop policy if exists partner_files_staff_manage on public.partner_application_files;
create policy partner_files_reviewer_read on public.partner_application_files for select to authenticated using(private.has_permission('suppliers.manage'));

drop policy if exists partner_history_staff_read on public.partner_application_history;
drop policy if exists partner_history_staff_insert on public.partner_application_history;
create policy partner_history_reviewer_read on public.partner_application_history for select to authenticated using(private.has_permission('suppliers.manage'));

revoke insert,update,delete on public.partner_applications,public.partner_application_files,public.partner_application_history from authenticated;
revoke all on function public.review_partner_application_command(uuid,text,uuid,text,text) from public,anon,authenticated;
revoke all on function public.convert_partner_application_command(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.review_partner_application_command(uuid,text,uuid,text,text) to service_role;
grant execute on function public.convert_partner_application_command(uuid,uuid,text,text) to service_role;

drop policy if exists partner_storage_staff_read on storage.objects;
drop policy if exists partner_storage_staff_insert on storage.objects;
drop policy if exists partner_storage_staff_update on storage.objects;
drop policy if exists partner_storage_staff_delete on storage.objects;
create policy partner_storage_reviewer_read on storage.objects for select to authenticated
using(bucket_id in('partner-application-media','partner-application-documents') and private.has_permission('suppliers.manage'));
create policy partner_storage_reviewer_insert on storage.objects for insert to authenticated
with check(bucket_id in('partner-application-media','partner-application-documents') and private.has_permission('suppliers.manage') and name like 'partner-applications/%' and name!~ '(^|/)\.\.(/|$)');
create policy partner_storage_reviewer_update on storage.objects for update to authenticated
using(bucket_id in('partner-application-media','partner-application-documents') and private.has_permission('suppliers.manage'))
with check(bucket_id in('partner-application-media','partner-application-documents') and private.has_permission('suppliers.manage') and name like 'partner-applications/%' and name!~ '(^|/)\.\.(/|$)');
create policy partner_storage_reviewer_delete on storage.objects for delete to authenticated
using(bucket_id in('partner-application-media','partner-application-documents') and private.has_permission('suppliers.manage'));

comment on function public.review_partner_application_command(uuid,text,uuid,text,text) is 'Authoritative, capability-checked and idempotent partner application review command.';
comment on function public.convert_partner_application_command(uuid,uuid,text,text) is 'Atomically converts approved application evidence into inactive draft catalogue records with immutable provenance.';
comment on column public.partner_applications.decision_snapshot is 'Immutable evidence captured when an application is approved or rejected.';
comment on column public.partner_applications.converted_catalogue is 'Catalogue UUIDs created atomically from this approved application.';
notify pgrst,'reload schema';
commit;
