begin;

alter table public.experiences
  add column if not exists price_per_person_usd numeric check (price_per_person_usd >= 0);

alter table public.accommodations
  add column if not exists nightly_rate_usd numeric check (nightly_rate_usd >= 0);

alter table public.vehicles
  add column if not exists daily_rate_usd numeric check (daily_rate_usd >= 0);

alter table public.guides
  add column if not exists daily_rate_usd numeric check (daily_rate_usd >= 0);

comment on column public.experiences.price_per_person_usd is
  'Optional public estimate per traveller. Null means a quote is required.';
comment on column public.accommodations.nightly_rate_usd is
  'Optional public estimate per room/night. Null means a quote is required.';
comment on column public.vehicles.daily_rate_usd is
  'Optional public estimate per vehicle/day. Null means a quote is required.';
comment on column public.guides.daily_rate_usd is
  'Optional public estimate per guide/day. Null means a quote is required.';

-- Preserve existing administrator-entered figures where the text begins with
-- a clear numeric value. Ambiguous ranges and records without prices stay null.
update public.accommodations
set nightly_rate_usd=(regexp_match(price_range,'([0-9]+(?:\.[0-9]+)?)'))[1]::numeric
where nightly_rate_usd is null
  and price_range ~ '[0-9]';

update public.vehicles
set daily_rate_usd=(regexp_match(coalesce(daily_price_guide,price_guide),'([0-9]+(?:\.[0-9]+)?)'))[1]::numeric
where daily_rate_usd is null
  and coalesce(daily_price_guide,price_guide) ~ '[0-9]';

commit;
