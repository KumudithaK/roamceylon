alter table public.tour_pricing_config
  add column if not exists estimate_lower_buffer_percent numeric(7,2) not null default 10 check (estimate_lower_buffer_percent >= 0 and estimate_lower_buffer_percent < 100),
  add column if not exists estimate_upper_buffer_percent numeric(7,2) not null default 20 check (estimate_upper_buffer_percent >= 0);

create table if not exists public.journey_estimate_bands (
  key text primary key,
  category text not null check (category in ('stay','transport','guide','experience')),
  label text not null,
  minimum numeric(12,2),
  maximum numeric(12,2),
  unit text not null check (unit in ('per_person_night','per_leg','per_day','per_person')),
  active boolean not null default false,
  sort_order integer not null default 0,
  notes text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  constraint journey_estimate_bands_values check (
    (minimum is null and maximum is null)
    or (minimum is not null and maximum is not null and minimum >= 0 and maximum >= minimum)
  )
);

drop trigger if exists journey_estimate_bands_updated_at on public.journey_estimate_bands;
create trigger journey_estimate_bands_updated_at before update on public.journey_estimate_bands
for each row execute function private.set_updated_at();

alter table public.journey_estimate_bands enable row level security;

drop policy if exists journey_estimate_bands_staff_read on public.journey_estimate_bands;
create policy journey_estimate_bands_staff_read on public.journey_estimate_bands
for select to authenticated using (private.has_role(array['admin','editor']::public.profile_role[]));
drop policy if exists journey_estimate_bands_staff_insert on public.journey_estimate_bands;
create policy journey_estimate_bands_staff_insert on public.journey_estimate_bands
for insert to authenticated with check (private.has_role(array['admin','editor']::public.profile_role[]));
drop policy if exists journey_estimate_bands_staff_update on public.journey_estimate_bands;
create policy journey_estimate_bands_staff_update on public.journey_estimate_bands
for update to authenticated using (private.has_role(array['admin','editor']::public.profile_role[])) with check (private.has_role(array['admin','editor']::public.profile_role[]));

insert into public.journey_estimate_bands(key,category,label,unit,sort_order) values
  ('stay:five_star_resorts','stay','5-Star Class Resorts','per_person_night',10),
  ('stay:four_star_resorts','stay','4-Star Class Resorts','per_person_night',20),
  ('stay:boutique_hotels_villas','stay','Boutique Hotels & Villas','per_person_night',30),
  ('stay:guest_houses','stay','Guest Houses','per_person_night',40),
  ('stay:homestays','stay','Homestays','per_person_night',50),
  ('stay:bungalows','stay','Bungalows','per_person_night',60),
  ('stay:eco_lodges_tented_camps','stay','Eco-Lodges & Tented Camps','per_person_night',70),
  ('stay:wellness_retreats','stay','Wellness Retreats','per_person_night',80),
  ('stay:recommend','stay','Let Roam Ceylon Recommend','per_person_night',90),
  ('transport:scenic_train','transport','Scenic Train','per_leg',110),
  ('transport:private_chauffeur_car_suv','transport','Private Chauffeur Car / SUV','per_leg',120),
  ('transport:high_roof_van','transport','High-Roof Van','per_leg',130),
  ('transport:mini_coach_bus','transport','Mini Coach / Bus','per_leg',140),
  ('transport:tuk_tuk','transport','Tuk-Tuk','per_leg',150),
  ('transport:scooter','transport','Scooter','per_leg',160),
  ('transport:domestic_floatplane','transport','Domestic Floatplane','per_leg',170),
  ('transport:self_drive_car','transport','Self-Drive Car','per_leg',180),
  ('transport:self_drive_van','transport','Self-Drive Van','per_leg',190),
  ('transport:self_drive_tuk_tuk','transport','Self-Drive Tuk-Tuk','per_leg',200),
  ('transport:self_drive_scooter','transport','Self-Drive Scooter','per_leg',210),
  ('transport:recommend','transport','Let Roam Ceylon Recommend','per_leg',220),
  ('guide:national_tourist_guide','guide','National Tourist Guide','per_day',310),
  ('guide:chauffeur_tourist_guide','guide','Chauffeur Tourist Guide','per_day',320),
  ('guide:recommend','guide','Let Roam Ceylon Recommend','per_day',330),
  ('guide:specialist','guide','Destination Specialist Guide','per_day',340),
  ('experience:default','experience','Experience planning allowance','per_person',410)
on conflict (key) do update set category=excluded.category,label=excluded.label,unit=excluded.unit,sort_order=excluded.sort_order;

comment on table public.journey_estimate_bands is 'Confidential public-planning estimate assumptions used only when no suitable published supplier range exists. They never determine proposal or accounting prices.';
comment on column public.tour_pricing_config.estimate_lower_buffer_percent is 'Downward planning envelope applied to the verified estimate base before public rounding.';
comment on column public.tour_pricing_config.estimate_upper_buffer_percent is 'Upward planning envelope applied to the verified estimate base before public rounding.';
