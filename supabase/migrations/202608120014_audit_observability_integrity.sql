begin;

insert into public.permissions(code,description) values
  ('audit.journey.view','Read purpose-limited journey and proposal audit evidence.'),
  ('audit.supplier.view','Read purpose-limited supplier and onboarding audit evidence.'),
  ('audit.finance.view','Read purpose-limited financial audit evidence.'),
  ('audit.operations.view','Read purpose-limited operational audit evidence.'),
  ('audit.security.view','Read staff authority and security-event evidence.')
on conflict(code) do update set description=excluded.description;

insert into public.staff_role_permissions(role_code,permission_code) values
  ('journey_designer','audit.journey.view'),
  ('partner_manager','audit.supplier.view'),
  ('finance','audit.finance.view'),
  ('operations','audit.operations.view')
on conflict do nothing;
insert into public.staff_role_permissions(role_code,permission_code)
select 'super_admin',code from public.permissions where code like 'audit.%'
on conflict do nothing;

create table public.staff_authority_history(
  id uuid primary key default gen_random_uuid(),
  event_type text not null check(event_type in('staff_role_assigned','staff_role_removed','role_permission_granted','role_permission_revoked')),
  actor_id uuid,
  actor_class text not null check(actor_class in('authenticated_staff','service_role','database_owner')),
  target_profile_id uuid,
  target_role_code text not null,
  permission_code text,
  outcome text not null default 'succeeded' check(outcome='succeeded'),
  occurred_at timestamptz not null default now(),
  check((event_type like 'staff_role_%' and target_profile_id is not null and permission_code is null)
    or (event_type like 'role_permission_%' and target_profile_id is null and permission_code is not null))
);
create index staff_authority_history_time_idx on public.staff_authority_history(occurred_at desc);

create table public.staff_security_events(
  id uuid primary key default gen_random_uuid(),
  event_type text not null check(event_type='staff.authorization.denied'),
  actor_id uuid not null,
  actor_class text not null default 'authenticated_staff' check(actor_class='authenticated_staff'),
  resource_type text not null default 'staff_api' check(resource_type='staff_api'),
  outcome text not null default 'denied' check(outcome='denied'),
  reason_class text not null check(reason_class in('missing_profile','missing_capability')),
  correlation_id uuid not null,
  safe_metadata jsonb not null default '{}'::jsonb check(jsonb_typeof(safe_metadata)='object' and pg_column_size(safe_metadata)<=4096),
  occurred_at timestamptz not null default now()
);
create index staff_security_events_time_idx on public.staff_security_events(occurred_at desc);
create index staff_security_events_actor_idx on public.staff_security_events(actor_id,occurred_at desc);

create or replace function private.audit_actor_class()
returns text language sql stable security definer set search_path='' as $$
  select case when auth.uid() is not null then 'authenticated_staff'
    when auth.role()='service_role' then 'service_role' else 'database_owner' end
$$;
revoke all on function private.audit_actor_class() from public,anon,authenticated;

create or replace function private.capture_staff_authority_change()
returns trigger language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();kind text;
begin
  perform set_config('roam.audit_internal','on',true);
  if tg_table_name='profile_staff_roles' then
    kind:=case when tg_op='INSERT' then 'staff_role_assigned' else 'staff_role_removed' end;
    insert into public.staff_authority_history(event_type,actor_id,actor_class,target_profile_id,target_role_code)
    values(kind,actor,private.audit_actor_class(),coalesce(new.profile_id,old.profile_id),coalesce(new.role_code,old.role_code));
  else
    kind:=case when tg_op='INSERT' then 'role_permission_granted' else 'role_permission_revoked' end;
    insert into public.staff_authority_history(event_type,actor_id,actor_class,target_role_code,permission_code)
    values(kind,actor,private.audit_actor_class(),coalesce(new.role_code,old.role_code),coalesce(new.permission_code,old.permission_code));
  end if;
  if tg_op='DELETE' then return old;end if;
  return new;
end $$;
revoke all on function private.capture_staff_authority_change() from public,anon,authenticated;

create or replace function private.guard_phase14_evidence()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if tg_op='INSERT' and current_setting('roam.audit_internal',true)='on' then return new;end if;
  if tg_op='DELETE' and auth.role()='service_role' and current_setting('roam.phase14_synthetic_cleanup',true)='on' then return old;end if;
  raise exception using errcode='42501',message='Audit and security evidence is append-only.';
end $$;
revoke all on function private.guard_phase14_evidence() from public,anon,authenticated;

create trigger staff_authority_history_guard before insert or update or delete on public.staff_authority_history
for each row execute function private.guard_phase14_evidence();
create trigger staff_security_events_guard before insert or update or delete on public.staff_security_events
for each row execute function private.guard_phase14_evidence();
create trigger profile_staff_roles_audit after insert or delete on public.profile_staff_roles
for each row execute function private.capture_staff_authority_change();
create trigger staff_role_permissions_audit after insert or delete on public.staff_role_permissions
for each row execute function private.capture_staff_authority_change();

create or replace function public.record_staff_authorization_denial(
  p_actor_id uuid,p_reason_class text,p_required_permissions text[],p_method text,p_path text,p_correlation_id uuid
) returns uuid language plpgsql security definer set search_path='' as $$
declare event_id uuid;clean_path text:=split_part(coalesce(p_path,''),'?',1);
begin
  if auth.role()<>'service_role' then raise exception using errcode='42501',message='Only the trusted staff API boundary may record security events.';end if;
  if p_actor_id is null or not exists(select 1 from auth.users where id=p_actor_id) then raise exception using errcode='22023',message='A valid authenticated actor is required.';end if;
  if p_reason_class not in('missing_profile','missing_capability') then raise exception using errcode='22023',message='Unknown authorization denial class.';end if;
  if p_method not in('GET','POST','PUT','PATCH','DELETE') or clean_path not like '/api/admin/%' or char_length(clean_path)>240 then raise exception using errcode='22023',message='Unsafe security-event route metadata.';end if;
  if coalesce(array_length(p_required_permissions,1),0) not between 1 and 12
    or exists(select 1 from unnest(p_required_permissions) as required(code) where not exists(select 1 from public.permissions p where p.code=required.code))
  then raise exception using errcode='22023',message='Unknown or excessive authorization requirements.';end if;
  perform set_config('roam.audit_internal','on',true);
  insert into public.staff_security_events(event_type,actor_id,reason_class,correlation_id,safe_metadata)
  values('staff.authorization.denied',p_actor_id,p_reason_class,p_correlation_id,
    jsonb_build_object('method',p_method,'path',clean_path,'requiredPermissions',to_jsonb(p_required_permissions)))
  returning id into event_id;
  return event_id;
end $$;
revoke all on function public.record_staff_authorization_denial(uuid,text,text[],text,text,uuid) from public,anon,authenticated;
grant execute on function public.record_staff_authorization_denial(uuid,text,text[],text,text,uuid) to service_role;

alter table public.staff_authority_history enable row level security;
alter table public.staff_security_events enable row level security;
create policy staff_authority_history_security_read on public.staff_authority_history for select to authenticated using(private.has_permission('audit.security.view'));
create policy staff_security_events_security_read on public.staff_security_events for select to authenticated using(private.has_permission('audit.security.view'));
grant select on public.staff_authority_history,public.staff_security_events to authenticated;
revoke all on public.staff_authority_history,public.staff_security_events from anon;
revoke insert,update,delete on public.staff_authority_history,public.staff_security_events from authenticated;

create or replace view public.staff_audit_event_index with(security_barrier=true) as
select h.id event_id,'journey.lifecycle'::text event_type,h.changed_by actor_id,
  case when h.changed_by is null then 'system' else 'authenticated_staff' end actor_class,
  'enquiry'::text resource_type,h.enquiry_id resource_id,h.action,h.to_status outcome,null::text correlation_reference,h.created_at occurred_at
from public.enquiry_lifecycle_history h where private.has_permission('audit.journey.view') or private.has_permission('audit.operations.view') or private.has_permission('audit.security.view')
union all
select a.id,'proposal.accepted',null,'traveller','proposal',a.proposal_id,'accept','succeeded','version:'||a.proposal_version::text,a.accepted_at
from public.journey_proposal_acceptances a where private.has_permission('audit.journey.view') or private.has_permission('audit.security.view')
union all
select t.id,'finance.transaction',t.created_by,case when t.created_by is null then 'system' else 'authenticated_staff' end,
  'journey_account',t.account_id,t.transaction_type,'posted',case when t.idempotency_key is null then null else md5(t.idempotency_key) end,t.created_at
from public.accounting_transactions t where private.has_permission('audit.finance.view') or private.has_permission('audit.security.view')
union all
select h.id,'supplier.allocation',h.changed_by,case when h.changed_by is null then 'system' else 'authenticated_staff' end,
  'supplier_allocation',h.allocation_id,h.event_type,h.to_status,case when h.idempotency_key is null then null else md5(h.idempotency_key) end,h.created_at
from public.journey_supplier_allocation_history h where private.has_permission('audit.supplier.view') or private.has_permission('audit.finance.view') or private.has_permission('audit.operations.view') or private.has_permission('audit.security.view')
union all
select r.id,'operations.command',r.actor_id,'authenticated_staff','enquiry',r.enquiry_id,r.command_type,'succeeded',r.request_hash,r.created_at
from public.journey_operational_command_receipts r where private.has_permission('audit.operations.view') or private.has_permission('audit.security.view')
union all
select h.id,'partner.lifecycle',h.changed_by,case when h.changed_by is null then 'system' else 'authenticated_staff' end,
  'partner_application',h.application_id,coalesce(h.from_status,'submitted')||' -> '||h.to_status,h.to_status,null,h.created_at
from public.partner_application_history h where private.has_permission('audit.supplier.view') or private.has_permission('audit.security.view')
union all
select h.id,'staff.authority',h.actor_id,h.actor_class,'staff_authority',coalesce(h.target_profile_id,h.id),h.event_type,h.outcome,null,h.occurred_at
from public.staff_authority_history h where private.has_permission('audit.security.view')
union all
select e.id,e.event_type,e.actor_id,e.actor_class,e.resource_type,e.id,e.reason_class,e.outcome,e.correlation_id::text,e.occurred_at
from public.staff_security_events e where private.has_permission('audit.security.view');

revoke all on public.staff_audit_event_index from public,anon;
grant select on public.staff_audit_event_index to authenticated;

comment on view public.staff_audit_event_index is 'Purpose-limited audit index. It deliberately excludes PII, tokens, notes, commercial values, request bodies and mutable snapshots.';
comment on table public.staff_security_events is 'Bounded authenticated-staff authorization denials only; anonymous credential noise is deliberately excluded.';

commit;
