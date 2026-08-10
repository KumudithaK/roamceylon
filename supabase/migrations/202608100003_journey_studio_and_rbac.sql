begin;

create table public.permissions (
  code text primary key check (code ~ '^[a-z]+(\.[a-z]+)+$'),
  description text not null,
  created_at timestamptz not null default now()
);

create table public.staff_roles (
  code text primary key check (code ~ '^[a-z][a-z0-9_]+$'),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table public.staff_role_permissions (
  role_code text not null references public.staff_roles(code) on delete cascade,
  permission_code text not null references public.permissions(code) on delete cascade,
  primary key(role_code,permission_code)
);

create table public.profile_staff_roles (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role_code text not null references public.staff_roles(code) on delete cascade,
  assigned_at timestamptz not null default now(),
  assigned_by uuid references auth.users(id),
  primary key(profile_id,role_code)
);

insert into public.permissions(code,description) values
('journey.requests.view','View traveller journey requests and immutable briefs'),
('journey.design.view','View curated journeys and their change history'),
('journey.design.edit','Create and edit curated journeys'),
('journey.proposal.view','View journey proposals'),
('journey.proposal.create','Create and progress journey proposals'),
('suppliers.view','View partner and supplier records'),
('suppliers.manage','Create and maintain partner and supplier records'),
('suppliers.allocate','Allocate suppliers to curated journey requirements'),
('suppliers.rates.view','View supplier catalogue rates'),
('operations.view','View accepted-journey operational information'),
('operations.manage','Manage confirmations and operational delivery details'),
('finance.revenue.view','View traveller selling prices and revenue'),
('finance.costs.view','View confidential supplier costs'),
('finance.margin.view','View internal profit and margin information'),
('finance.payments.manage','Manage traveller and supplier payments'),
('cms.view','View CMS content'),
('cms.edit','Create and edit CMS content'),
('users.manage','Manage staff roles and permissions'),
('settings.manage','Manage business-wide settings')
on conflict(code) do update set description=excluded.description;

insert into public.staff_roles(code,name,description) values
('super_admin','Super Admin / Founder','Full Roam Ceylon access.'),
('journey_designer','Journey Designer','Traveller briefs, Journey Studio and proposals.'),
('partner_manager','Partner / Experience Manager','Partners, suppliers, rates and allocation.'),
('operations','Operations','Confirmed journey delivery and supplier confirmations.'),
('finance','Finance','Accounting, payments and financial reporting.'),
('content_marketing','Content / Marketing','Themes, destinations, experiences and editorial content.')
on conflict(code) do update set name=excluded.name,description=excluded.description;

insert into public.staff_role_permissions(role_code,permission_code)
select 'super_admin',code from public.permissions on conflict do nothing;
insert into public.staff_role_permissions(role_code,permission_code) values
('journey_designer','journey.requests.view'),('journey_designer','journey.design.view'),('journey_designer','journey.design.edit'),
('journey_designer','journey.proposal.view'),('journey_designer','journey.proposal.create'),('journey_designer','suppliers.view'),
('partner_manager','journey.requests.view'),('partner_manager','journey.design.view'),('partner_manager','suppliers.view'),
('partner_manager','suppliers.manage'),('partner_manager','suppliers.allocate'),('partner_manager','suppliers.rates.view'),
('operations','journey.requests.view'),('operations','journey.design.view'),('operations','suppliers.view'),
('operations','operations.view'),('operations','operations.manage'),
('finance','journey.requests.view'),('finance','journey.design.view'),('finance','journey.proposal.view'),
('finance','suppliers.view'),('finance','suppliers.rates.view'),('finance','finance.revenue.view'),
('finance','finance.costs.view'),('finance','finance.margin.view'),('finance','finance.payments.manage'),
('content_marketing','cms.view'),('content_marketing','cms.edit')
on conflict do nothing;

insert into public.profile_staff_roles(profile_id,role_code)
select id,'super_admin' from public.profiles where role='admin' on conflict do nothing;
insert into public.profile_staff_roles(profile_id,role_code)
select id,'journey_designer' from public.profiles where role='editor' on conflict do nothing;
insert into public.profile_staff_roles(profile_id,role_code)
select id,'content_marketing' from public.profiles where role='editor' on conflict do nothing;

create or replace function private.has_permission(required_permission text)
returns boolean language sql stable security definer set search_path=''
as $$
  select exists(
    select 1 from public.profiles profile
    where profile.id=(select auth.uid()) and profile.role='admin'
  ) or exists(
    select 1
    from public.profile_staff_roles assignment
    join public.staff_role_permissions permission on permission.role_code=assignment.role_code
    where assignment.profile_id=(select auth.uid()) and permission.permission_code=required_permission
  );
$$;
revoke all on function private.has_permission(text) from public;
grant execute on function private.has_permission(text) to authenticated;

create or replace function public.current_staff_permissions()
returns table(permission_code text) language sql stable security definer set search_path=''
as $$
  select permission.code
  from public.permissions permission
  where private.has_permission(permission.code)
  order by permission.code;
$$;
revoke all on function public.current_staff_permissions() from public;
grant execute on function public.current_staff_permissions() to authenticated;

alter table public.permissions enable row level security;
alter table public.staff_roles enable row level security;
alter table public.staff_role_permissions enable row level security;
alter table public.profile_staff_roles enable row level security;
create policy permissions_staff_read on public.permissions for select to authenticated using (private.has_permission('users.manage'));
create policy staff_roles_staff_read on public.staff_roles for select to authenticated using (private.has_permission('users.manage'));
create policy staff_role_permissions_staff_read on public.staff_role_permissions for select to authenticated using (private.has_permission('users.manage'));
create policy profile_staff_roles_staff_read on public.profile_staff_roles for select to authenticated using (profile_id=(select auth.uid()) or private.has_permission('users.manage'));
create policy staff_roles_admin_manage on public.staff_roles for all to authenticated using (private.has_permission('users.manage')) with check (private.has_permission('users.manage'));
create policy staff_role_permissions_admin_manage on public.staff_role_permissions for all to authenticated using (private.has_permission('users.manage')) with check (private.has_permission('users.manage'));
create policy profile_staff_roles_admin_manage on public.profile_staff_roles for all to authenticated using (private.has_permission('users.manage')) with check (private.has_permission('users.manage'));
grant select on public.permissions,public.staff_roles,public.staff_role_permissions,public.profile_staff_roles to authenticated;
grant insert,update,delete on public.staff_roles,public.staff_role_permissions,public.profile_staff_roles to authenticated;

create table public.curated_journeys (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null unique references public.enquiries(id) on delete restrict,
  status text not null default 'not_started' check (status in ('not_started','designing','ready_for_allocation','allocation_in_progress','ready_for_proposal')),
  itinerary jsonb not null check (jsonb_typeof(itinerary)='object'),
  internal_notes text,
  source_brief_created_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id)
);

create table public.curated_journey_changes (
  id uuid primary key default gen_random_uuid(),
  curated_journey_id uuid not null references public.curated_journeys(id) on delete restrict,
  change_type text not null,
  subject_type text not null,
  subject_id text,
  field_name text,
  previous_value jsonb,
  new_value jsonb,
  summary text not null,
  changed_at timestamptz not null default now(),
  changed_by uuid references auth.users(id)
);

create index curated_journey_changes_journey_idx on public.curated_journey_changes(curated_journey_id,changed_at desc);
create trigger curated_journeys_updated_at before update on public.curated_journeys for each row execute function private.set_updated_at();

alter table public.curated_journeys enable row level security;
alter table public.curated_journey_changes enable row level security;
create policy curated_journeys_view on public.curated_journeys for select to authenticated using (private.has_permission('journey.design.view'));
create policy curated_journeys_insert on public.curated_journeys for insert to authenticated with check (private.has_permission('journey.design.edit'));
create policy curated_journeys_update on public.curated_journeys for update to authenticated using (private.has_permission('journey.design.edit')) with check (private.has_permission('journey.design.edit'));
create policy curated_changes_view on public.curated_journey_changes for select to authenticated using (private.has_permission('journey.design.view'));
revoke insert,update,delete on public.curated_journey_changes from anon,authenticated;
grant select,insert,update on public.curated_journeys to authenticated;
grant select on public.curated_journey_changes to authenticated;

alter table public.journey_supplier_allocations
  add column curated_journey_id uuid references public.curated_journeys(id) on delete restrict,
  add column review_required boolean not null default false,
  add column review_reason text,
  add column reviewed_at timestamptz,
  add column reviewed_by uuid references auth.users(id);
create index journey_allocations_review_idx on public.journey_supplier_allocations(enquiry_id,review_required) where review_required;

alter table public.journey_proposals
  add column curated_journey_id uuid references public.curated_journeys(id) on delete restrict,
  add column curated_journey_snapshot jsonb;

create or replace function private.protect_original_traveller_brief()
returns trigger language plpgsql set search_path=''
as $$
begin
  if new.trip_state is distinct from old.trip_state
    or new.travel_start_date is distinct from old.travel_start_date
    or new.travel_end_date is distinct from old.travel_end_date
    or new.adults is distinct from old.adults
    or new.children is distinct from old.children
    or new.selected_themes is distinct from old.selected_themes
    or new.selected_destinations is distinct from old.selected_destinations
    or new.selected_experiences is distinct from old.selected_experiences
    or new.experience_participants is distinct from old.experience_participants
    or new.selected_stays is distinct from old.selected_stays
    or new.selected_vehicle is distinct from old.selected_vehicle
    or new.selected_guide is distinct from old.selected_guide
    or new.estimated_price_min is distinct from old.estimated_price_min
    or new.estimated_price_max is distinct from old.estimated_price_max
    or new.estimate_snapshot is distinct from old.estimate_snapshot
  then raise exception 'The submitted Traveller Brief is immutable. Create or edit the Curated Journey instead.' using errcode='23514';
  end if;
  return new;
end;
$$;
create trigger enquiries_protect_original_brief before update on public.enquiries for each row execute function private.protect_original_traveller_brief();

-- Replace broad legacy admin/editor reads with capability-based boundaries.
drop policy if exists enquiries_staff_read on public.enquiries;
drop policy if exists enquiries_staff_update on public.enquiries;
create policy enquiries_staff_read on public.enquiries for select to authenticated
using (private.has_permission('journey.requests.view'));
create policy enquiries_staff_update on public.enquiries for update to authenticated
using (private.has_permission('journey.design.edit') or private.has_permission('operations.manage') or private.has_permission('finance.payments.manage'))
with check (private.has_permission('journey.design.edit') or private.has_permission('operations.manage') or private.has_permission('finance.payments.manage'));

drop policy if exists journey_supplier_allocations_staff_select on public.journey_supplier_allocations;
drop policy if exists journey_supplier_allocations_staff_insert on public.journey_supplier_allocations;
drop policy if exists journey_supplier_allocations_staff_update on public.journey_supplier_allocations;
drop policy if exists journey_supplier_allocations_staff_delete on public.journey_supplier_allocations;
create policy journey_supplier_allocations_capability_select on public.journey_supplier_allocations for select to authenticated
using (private.has_permission('suppliers.allocate') or private.has_permission('operations.view') or private.has_permission('finance.costs.view'));
create policy journey_supplier_allocations_capability_insert on public.journey_supplier_allocations for insert to authenticated
with check (private.has_permission('suppliers.allocate'));
create policy journey_supplier_allocations_capability_update on public.journey_supplier_allocations for update to authenticated
using (private.has_permission('suppliers.allocate') or private.has_permission('operations.manage'))
with check (private.has_permission('suppliers.allocate') or private.has_permission('operations.manage'));
create policy journey_supplier_allocations_capability_delete on public.journey_supplier_allocations for delete to authenticated
using (private.has_permission('suppliers.allocate'));

drop policy if exists journey_proposals_staff_read on public.journey_proposals;
create policy journey_proposals_financial_read on public.journey_proposals for select to authenticated
using (private.has_permission('finance.margin.view'));

drop policy if exists journey_accounts_staff_read on public.journey_accounts;
drop policy if exists journey_settlements_staff_read on public.journey_settlements;
drop policy if exists accounting_transactions_staff_read on public.accounting_transactions;
create policy journey_accounts_finance_read on public.journey_accounts for select to authenticated
using (private.has_permission('finance.revenue.view'));
create policy journey_settlements_finance_read on public.journey_settlements for select to authenticated
using (private.has_permission('finance.costs.view') or private.has_permission('finance.payments.manage'));
create policy accounting_transactions_finance_read on public.accounting_transactions for select to authenticated
using (private.has_permission('finance.payments.manage'));

drop policy if exists accounting_attachments_staff_read on public.accounting_attachments;
create policy accounting_attachments_finance_read on public.accounting_attachments for select to authenticated
using (private.has_permission('finance.payments.manage'));
drop policy if exists accounting_receipts_staff_read on storage.objects;
create policy accounting_receipts_finance_read on storage.objects for select to authenticated
using (bucket_id='accounting-receipts' and private.has_permission('finance.payments.manage'));

drop policy if exists journey_cancellation_cases_staff_read on public.journey_cancellation_cases;
create policy journey_cancellation_cases_finance_read on public.journey_cancellation_cases for select to authenticated
using (private.has_permission('finance.payments.manage'));
drop policy if exists supplier_recoverability_history_staff_read on public.supplier_recoverability_history;
create policy supplier_recoverability_history_finance_read on public.supplier_recoverability_history for select to authenticated
using (private.has_permission('finance.payments.manage'));

comment on table public.curated_journeys is 'Editable Roam Ceylon itinerary derived from, but never overwriting, the immutable traveller brief.';
comment on table public.curated_journey_changes is 'Lightweight audit trail for meaningful Journey Studio changes.';
comment on column public.journey_supplier_allocations.review_required is 'True when a curated itinerary change means the saved supplier allocation must be reconfirmed.';
comment on column public.journey_proposals.curated_journey_snapshot is 'Curated itinerary snapshot used by future proposal presentation; does not replace the supplier allocation snapshot.';

commit;
