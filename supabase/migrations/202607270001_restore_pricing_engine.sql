begin;

alter table public.vehicles
  add column if not exists per_km_rate_usd numeric check (per_km_rate_usd >= 0);

alter table public.accommodations
  add column if not exists pricing_tier text
  check (pricing_tier in ('boutique','4star','5star','luxury'));

create table if not exists public.journey_pricing_settings (
  id boolean primary key default true check (id),
  currency text not null default 'USD',
  accommodation_tiers jsonb not null,
  activity_per_guest_usd numeric not null check (activity_per_guest_usd >= 0),
  route_distance_factor numeric not null check (route_distance_factor > 0),
  estimate_factor numeric not null check (estimate_factor > 0),
  guide_default_daily_rate_usd numeric check (guide_default_daily_rate_usd >= 0),
  seasons jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  constraint journey_pricing_tiers_object check (jsonb_typeof(accommodation_tiers)='object'),
  constraint journey_pricing_seasons_object check (jsonb_typeof(seasons)='object')
);

insert into public.journey_pricing_settings (
  id,currency,accommodation_tiers,activity_per_guest_usd,
  route_distance_factor,estimate_factor,guide_default_daily_rate_usd,seasons
) values (
  true,
  'USD',
  '{
    "boutique":{"label":"Boutique & guesthouses","nightlyPerGuest":60},
    "4star":{"label":"4-star comfort","nightlyPerGuest":95},
    "5star":{"label":"5-star hotels","nightlyPerGuest":155},
    "luxury":{"label":"Luxury villas & suites","nightlyPerGuest":270}
  }'::jsonb,
  46,
  1.3,
  0.92,
  null,
  '{
    "peak":{"months":[12,1,2,7,8],"label":"Peak season","multiplier":1.18},
    "shoulder":{"months":[3,4,9,10],"label":"Shoulder season","multiplier":1},
    "value":{"months":[5,6,11],"label":"Value season","multiplier":0.9}
  }'::jsonb
) on conflict (id) do update set
  currency=excluded.currency,
  accommodation_tiers=excluded.accommodation_tiers,
  activity_per_guest_usd=excluded.activity_per_guest_usd,
  route_distance_factor=excluded.route_distance_factor,
  estimate_factor=excluded.estimate_factor,
  seasons=excluded.seasons;

-- Restore the exact rates used by the working pre–multi-page engine for
-- matching imported vehicle slugs. Administrator-entered overrides are kept.
update public.vehicles
set daily_rate_usd=coalesce(daily_rate_usd,case slug
      when 'car' then 45 when 'suv' then 78 when 'van' then 64
      when 'minicoach' then 110 when 'luxurycoach' then 185
      when 'tuktuk' then 28 when 'motorbike' then 24 when 'scooter' then 14
      when 'selfdrive' then 62 when 'airport' then 38 end),
    per_km_rate_usd=coalesce(per_km_rate_usd,case slug
      when 'car' then 0.38 when 'suv' then 0.52 when 'van' then 0.46
      when 'minicoach' then 0.65 when 'luxurycoach' then 0.90
      when 'tuktuk' then 0.24 when 'motorbike' then 0 when 'scooter' then 0
      when 'selfdrive' then 0 when 'airport' then 0 end)
where slug in ('car','suv','van','minicoach','luxurycoach','tuktuk','motorbike','scooter','selfdrive','airport');

update public.accommodations
set pricing_tier=coalesce(pricing_tier,case trim(price_range)
  when '$' then 'boutique'
  when '$$' then '4star'
  when '$$$' then '5star'
  when '$$$$' then 'luxury'
end)
where pricing_tier is null;

alter table public.journey_pricing_settings enable row level security;

create policy journey_pricing_public_read on public.journey_pricing_settings
for select to anon,authenticated using (true);

create policy journey_pricing_staff_insert on public.journey_pricing_settings
for insert to authenticated
with check (private.has_role(array['admin','editor']::public.profile_role[]));

create policy journey_pricing_staff_update on public.journey_pricing_settings
for update to authenticated
using (private.has_role(array['admin','editor']::public.profile_role[]))
with check (private.has_role(array['admin','editor']::public.profile_role[]));

create trigger journey_pricing_updated_at
before update on public.journey_pricing_settings
for each row execute function private.set_updated_at();

commit;
