begin;

insert into public.permissions(code,description) values
('benefits.view','View configured traveller benefits and journey privileges'),
('benefits.manage','Create and maintain reusable traveller benefits'),
('benefits.assign','Select benefits for a specific journey'),
('benefits.reference.view','View reference-rate evidence and comparison details'),
('benefits.reference.manage','Create and maintain verified reference-rate comparisons')
on conflict(code) do update set description=excluded.description;

insert into public.staff_role_permissions(role_code,permission_code) values
('journey_designer','benefits.view'),('journey_designer','benefits.assign'),
('partner_manager','benefits.view'),('partner_manager','benefits.manage'),('partner_manager','benefits.assign'),('partner_manager','benefits.reference.view'),('partner_manager','benefits.reference.manage'),
('operations','benefits.view'),('operations','benefits.assign'),
('finance','benefits.view'),('finance','benefits.reference.view')
on conflict do nothing;

insert into public.staff_role_permissions(role_code,permission_code)
select 'super_admin',code from public.permissions where code like 'benefits.%'
on conflict do nothing;

create table public.benefit_definitions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9]+([_-][a-z0-9]+)*$'),
  name text not null check (char_length(trim(name)) between 3 and 160),
  benefit_type text not null check (benefit_type in ('roam_ceylon_complimentary','preferred_rate','partner_privilege','complimentary_upgrade','meal_benefit','arrival_departure_benefit','celebration_benefit','experience_benefit','roam_ceylon_service_benefit','other')),
  confidence_status text not null check (confidence_status in ('guaranteed_by_roam_ceylon','confirmed_partner_benefit','subject_to_availability')),
  default_scope text not null default 'journey' check (default_scope in ('journey','traveller','stay','destination','experience','transport','guide','day')),
  customer_description text not null check (char_length(trim(customer_description)) between 10 and 1000),
  entity_type text check (entity_type is null or entity_type in ('accommodation','vehicle','guide','experience','destination')),
  entity_id uuid,
  valid_from date,
  valid_to date,
  default_included boolean not null default false,
  active boolean not null default true,
  customer_rate numeric(14,2) check (customer_rate is null or customer_rate >= 0),
  reference_rate numeric(14,2) check (reference_rate is null or reference_rate >= 0),
  currency text check (currency is null or currency ~ '^[A-Z]{3}$'),
  rate_unit text,
  comparison_verified boolean not null default false,
  reference_rate_basis text,
  reference_rate_source text,
  verification_date date,
  occupancy_basis text,
  room_category text,
  meal_plan text,
  applicable_from date,
  applicable_to date,
  taxes_fees_basis text,
  cancellation_terms_basis text,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  constraint benefit_entity_pair check ((entity_type is null)=(entity_id is null)),
  constraint benefit_validity_window check (valid_to is null or valid_from is null or valid_to >= valid_from),
  constraint benefit_comparison_period check (applicable_to is null or applicable_from is null or applicable_to >= applicable_from),
  constraint benefit_verified_comparison_complete check (
    not comparison_verified or (
      benefit_type='preferred_rate' and reference_rate is not null and customer_rate is not null and reference_rate > customer_rate
      and currency is not null and nullif(trim(rate_unit),'') is not null
      and nullif(trim(reference_rate_basis),'') is not null and nullif(trim(reference_rate_source),'') is not null
      and verification_date is not null and nullif(trim(occupancy_basis),'') is not null
      and nullif(trim(room_category),'') is not null and nullif(trim(meal_plan),'') is not null
      and applicable_from is not null and applicable_to is not null
      and nullif(trim(taxes_fees_basis),'') is not null and nullif(trim(cancellation_terms_basis),'') is not null
    )
  )
);

create trigger benefit_definitions_updated_at before update on public.benefit_definitions
for each row execute function private.set_updated_at();
create index benefit_definitions_entity_idx on public.benefit_definitions(entity_type,entity_id,active);

create table public.journey_benefits (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null references public.enquiries(id) on delete restrict,
  benefit_id uuid not null references public.benefit_definitions(id) on delete restrict,
  allocation_id uuid references public.journey_supplier_allocations(id) on delete restrict,
  included boolean not null default true,
  scope_type text not null check (scope_type in ('journey','traveller','stay','destination','experience','transport','guide','day')),
  scope_id uuid,
  journey_day integer check (journey_day is null or journey_day > 0),
  customer_title text not null,
  customer_description text not null,
  confidence_status text not null check (confidence_status in ('guaranteed_by_roam_ceylon','confirmed_partner_benefit','subject_to_availability')),
  quantity numeric(12,2) not null default 1 check (quantity > 0),
  reference_rate numeric(14,2),
  customer_rate numeric(14,2),
  currency text,
  rate_unit text,
  comparison_verified boolean not null default false,
  verified_savings numeric(14,2) not null default 0 check (verified_savings >= 0),
  fulfilment_status text not null default 'pending' check (fulfilment_status in ('not_required','pending','confirmed','prepared','delivered','unavailable')),
  fulfilment_details jsonb not null default '{}'::jsonb check (jsonb_typeof(fulfilment_details)='object'),
  internal_notes text,
  selected_at timestamptz not null default now(),
  selected_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  unique(enquiry_id,benefit_id,allocation_id),
  constraint journey_benefit_verified_saving check (
    (comparison_verified and reference_rate is not null and customer_rate is not null and reference_rate > customer_rate and currency is not null and verified_savings=round((reference_rate-customer_rate)*quantity,2))
    or (not comparison_verified and verified_savings=0)
  )
);

create trigger journey_benefits_updated_at before update on public.journey_benefits
for each row execute function private.set_updated_at();
create index journey_benefits_enquiry_idx on public.journey_benefits(enquiry_id,included);
create index journey_benefits_allocation_idx on public.journey_benefits(allocation_id);
create unique index journey_benefits_scope_unique on public.journey_benefits(enquiry_id,benefit_id,coalesce(allocation_id,'00000000-0000-0000-0000-000000000000'::uuid));

alter table public.benefit_definitions enable row level security;
alter table public.journey_benefits enable row level security;

create policy benefit_definitions_view on public.benefit_definitions for select to authenticated
using (private.has_permission('benefits.view'));
create policy benefit_definitions_manage on public.benefit_definitions for all to authenticated
using (private.has_permission('benefits.manage'))
with check (private.has_permission('benefits.manage'));
create policy journey_benefits_view on public.journey_benefits for select to authenticated
using (private.has_permission('benefits.view'));
create policy journey_benefits_assign on public.journey_benefits for insert to authenticated
with check (private.has_permission('benefits.assign'));
create policy journey_benefits_update on public.journey_benefits for update to authenticated
using (private.has_permission('benefits.assign') or private.has_permission('operations.manage'))
with check (private.has_permission('benefits.assign') or private.has_permission('operations.manage'));

revoke all on public.benefit_definitions,public.journey_benefits from anon;
grant select,insert,update,delete on public.benefit_definitions to authenticated;
grant select,insert,update on public.journey_benefits to authenticated;

drop trigger if exists mark_proposal_after_benefit_insert on public.journey_benefits;
create trigger mark_proposal_after_benefit_insert after insert on public.journey_benefits
for each row execute function private.mark_active_proposal_out_of_date();
drop trigger if exists mark_proposal_after_benefit_change on public.journey_benefits;
create trigger mark_proposal_after_benefit_change
after update of included,scope_type,scope_id,journey_day,customer_title,customer_description,confidence_status,quantity,reference_rate,customer_rate,currency,rate_unit,comparison_verified,verified_savings
on public.journey_benefits for each row execute function private.mark_active_proposal_out_of_date();

insert into public.benefit_definitions(
  code,name,benefit_type,confidence_status,default_scope,customer_description,default_included,active,internal_notes
) values (
  'roam_ceylon_welcome_tshirt','Complimentary Roam Ceylon Welcome T-Shirt','roam_ceylon_complimentary','guaranteed_by_roam_ceylon','traveller',
  'A complimentary Roam Ceylon printed white T-shirt for every traveller, presented on arrival as a small welcome from us to you.',true,true,
  'One T-shirt per traveller. Sizes may be collected after proposal acceptance; no inventory module is required in Phase 10.2.'
) on conflict(code) do update set
  name=excluded.name,customer_description=excluded.customer_description,confidence_status=excluded.confidence_status,
  default_scope=excluded.default_scope,default_included=excluded.default_included,active=excluded.active,internal_notes=excluded.internal_notes;

comment on table public.benefit_definitions is 'Reusable Roam Ceylon and partner benefits. Reference rates are informational and never accounting values.';
comment on table public.journey_benefits is 'Journey-specific benefit selections, promises, verified savings and lightweight fulfilment state.';
comment on column public.benefit_definitions.reference_rate_source is 'Internal evidence only. Never serialize this field to a traveller.';
comment on column public.journey_benefits.verified_savings is 'Customer-facing informational saving from a verified comparable rate; never accounting revenue or cost.';

commit;
