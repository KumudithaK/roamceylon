begin;

create type public.supplier_entity_type as enum (
  'accommodation','vehicle','guide','experience','destination'
);
create type public.supplier_cost_unit as enum (
  'per_room_night','per_vehicle_day','per_kilometre',
  'per_guide_day','per_person','per_transfer','fixed'
);

create table public.tour_pricing_config (
  id boolean primary key default true check (id),
  currency text not null default 'USD',
  room_occupancy integer not null default 2 check (room_occupancy > 0),
  child_cost_factor numeric not null default 1 check (child_cost_factor between 0 and 1),
  driver_salary_per_day numeric check (driver_salary_per_day >= 0),
  fuel_price_per_litre numeric check (fuel_price_per_litre >= 0),
  vehicle_km_per_litre numeric check (vehicle_km_per_litre > 0),
  tolls_per_journey numeric check (tolls_per_journey >= 0),
  parking_per_day numeric check (parking_per_day >= 0),
  guide_accommodation_per_night numeric check (guide_accommodation_per_night >= 0),
  airport_transfer_each_way numeric check (airport_transfer_each_way >= 0),
  administration_fixed numeric check (administration_fixed >= 0),
  administration_percent numeric check (administration_percent between 0 and 100),
  contingency_percent numeric check (contingency_percent between 0 and 100),
  service_fee_fixed numeric check (service_fee_fixed >= 0),
  service_fee_percent numeric check (service_fee_percent between 0 and 100),
  target_profit_margin_percent numeric check (target_profit_margin_percent >= 0 and target_profit_margin_percent < 100),
  seasonal_rules jsonb not null default '[]'::jsonb check (jsonb_typeof(seasonal_rules)='array'),
  active boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

create table public.tour_supplier_costs (
  id uuid primary key default gen_random_uuid(),
  entity_type public.supplier_entity_type not null,
  entity_id uuid not null,
  cost_category text not null,
  unit public.supplier_cost_unit not null,
  amount numeric not null check (amount >= 0),
  currency text not null default 'USD',
  valid_from date,
  valid_to date,
  seasonal_rules jsonb not null default '[]'::jsonb check (jsonb_typeof(seasonal_rules)='array'),
  partner_commission_percent numeric check (partner_commission_percent between 0 and 100),
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  unique(entity_type,entity_id,cost_category,unit,valid_from)
);

create index tour_supplier_costs_lookup_idx
on public.tour_supplier_costs(entity_type,entity_id,active);

insert into public.tour_pricing_config(id,currency,room_occupancy,child_cost_factor)
values(true,'USD',2,1)
on conflict(id) do nothing;

create trigger tour_pricing_config_updated_at before update on public.tour_pricing_config
for each row execute function private.set_updated_at();
create trigger tour_supplier_costs_updated_at before update on public.tour_supplier_costs
for each row execute function private.set_updated_at();

alter table public.tour_pricing_config enable row level security;
alter table public.tour_supplier_costs enable row level security;

-- The legacy calculator settings are superseded by the confidential DMC model.
-- Remove their anonymous read path so operational assumptions cannot leak.
drop policy if exists journey_pricing_public_read on public.journey_pricing_settings;
revoke select on public.journey_pricing_settings from anon;

-- Deliberately no anonymous policy: these tables contain confidential DMC costs.
create policy tour_pricing_config_staff_read on public.tour_pricing_config
for select to authenticated
using (private.has_role(array['admin','editor']::public.profile_role[]));
create policy tour_pricing_config_staff_insert on public.tour_pricing_config
for insert to authenticated
with check (private.has_role(array['admin','editor']::public.profile_role[]));
create policy tour_pricing_config_staff_update on public.tour_pricing_config
for update to authenticated
using (private.has_role(array['admin','editor']::public.profile_role[]))
with check (private.has_role(array['admin','editor']::public.profile_role[]));

create policy tour_supplier_costs_staff_read on public.tour_supplier_costs
for select to authenticated
using (private.has_role(array['admin','editor']::public.profile_role[]));
create policy tour_supplier_costs_staff_insert on public.tour_supplier_costs
for insert to authenticated
with check (private.has_role(array['admin','editor']::public.profile_role[]));
create policy tour_supplier_costs_staff_update on public.tour_supplier_costs
for update to authenticated
using (private.has_role(array['admin','editor']::public.profile_role[]))
with check (private.has_role(array['admin','editor']::public.profile_role[]));
create policy tour_supplier_costs_admin_delete on public.tour_supplier_costs
for delete to authenticated
using (private.has_role(array['admin']::public.profile_role[]));

comment on table public.tour_pricing_config is
  'Confidential DMC operational costs, overheads, fees and target margins. Never expose through public clients.';
comment on table public.tour_supplier_costs is
  'Confidential supplier net costs. Read only from trusted server code or authenticated staff tools.';

commit;
