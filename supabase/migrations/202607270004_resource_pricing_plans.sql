begin;

create type public.pricing_entity_type as enum (
  'accommodation','vehicle','guide','experience','destination'
);

create table public.pricing_plans (
  id uuid primary key default gen_random_uuid(),
  entity_type public.pricing_entity_type not null,
  entity_id uuid not null,
  name text not null,
  description text,
  price numeric not null check (price >= 0),
  currency text not null default 'USD' check (char_length(currency)=3),
  charging_method text not null check (charging_method in (
    'per_night','per_room_night','per_person','per_villa',
    'per_day','per_trip','per_airport_transfer','per_km',
    'half_day','full_day','multi_day','private_tour','custom_rate',
    'per_entry','per_vehicle','fixed'
  )),
  minimum_quantity numeric check (minimum_quantity is null or minimum_quantity >= 0),
  maximum_quantity numeric check (maximum_quantity is null or maximum_quantity >= minimum_quantity),
  image_url text,
  notes text,
  details jsonb not null default '{}'::jsonb check (jsonb_typeof(details)='object'),
  seasonal_rules jsonb not null default '[]'::jsonb check (jsonb_typeof(seasonal_rules)='array'),
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id)
);

create index pricing_plans_entity_idx
on public.pricing_plans(entity_type,entity_id,active,sort_order);

create trigger pricing_plans_updated_at before update on public.pricing_plans
for each row execute function private.set_updated_at();

alter table public.pricing_plans enable row level security;

-- Prices are confidential supplier inputs. Public package quotes are produced
-- only by the trusted server-side pricing service.
create policy pricing_plans_staff_read on public.pricing_plans
for select to authenticated
using (private.has_role(array['admin','editor']::public.profile_role[]));
create policy pricing_plans_staff_insert on public.pricing_plans
for insert to authenticated
with check (private.has_role(array['admin','editor']::public.profile_role[]));
create policy pricing_plans_staff_update on public.pricing_plans
for update to authenticated
using (private.has_role(array['admin','editor']::public.profile_role[]))
with check (private.has_role(array['admin','editor']::public.profile_role[]));
create policy pricing_plans_staff_delete on public.pricing_plans
for delete to authenticated
using (private.has_role(array['admin','editor']::public.profile_role[]));

-- Preserve and migrate every existing supplier cost. The legacy table remains
-- intact as an audit trail and rollback source.
insert into public.pricing_plans (
  entity_type,entity_id,name,price,currency,charging_method,notes,
  seasonal_rules,active,created_at,updated_at,created_by,updated_by
)
select
  entity_type::text::public.pricing_entity_type,
  entity_id,
  cost_category,
  amount,
  currency,
  case unit::text
    when 'per_room_night' then 'per_room_night'
    when 'per_vehicle_day' then 'per_day'
    when 'per_kilometre' then 'per_km'
    when 'per_guide_day' then 'full_day'
    when 'per_person' then 'per_person'
    when 'per_transfer' then 'per_airport_transfer'
    else 'fixed'
  end,
  notes,
  seasonal_rules,
  active,
  created_at,
  updated_at,
  created_by,
  updated_by
from public.tour_supplier_costs;

comment on table public.pricing_plans is
  'Reusable confidential pricing plans owned by accommodations, vehicles, guides, experiences, and destinations.';

commit;
