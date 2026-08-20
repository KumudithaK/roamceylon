begin;

-- Phase 2: public catalogue projections. These views intentionally contain only
-- traveller-facing presentation data. Supplier contact, licence, commercial,
-- partner-account and workflow fields remain on the protected base tables.
create or replace view public.public_accommodations
with (security_barrier=true)
as
select
  id,
  slug,
  name,
  destination_id,
  property_type,
  star_rating,
  short_description,
  full_description,
  hero_image_url,
  image_alt,
  gallery,
  address,
  location,
  latitude,
  longitude,
  price_range,
  amenities,
  verified,
  featured
from public.accommodations
where status='published' and active and not is_sample;

create or replace view public.public_vehicles
with (security_barrier=true)
as
select
  id,
  slug,
  listing_title,
  vehicle_type,
  vehicle_model,
  short_description,
  hero_image_url,
  image_alt,
  gallery,
  passenger_capacity,
  luggage_capacity,
  air_conditioned,
  driver_included,
  nationwide,
  available_destination_ids,
  price_guide,
  verified,
  featured
from public.vehicles
where status='published' and active and not is_sample;

create or replace view public.public_guides
with (security_barrier=true)
as
select
  id,
  slug,
  name,
  profile_image_url,
  image_alt,
  gallery,
  short_bio,
  full_bio,
  languages,
  years_experience,
  specialities,
  nationwide,
  verified,
  featured
from public.guides
where status='published' and active and not is_sample;

-- Public site settings are deliberately separated from maintenance flags,
-- setup progress, administrative ownership and registration metadata.
create or replace view public.website_public_settings
with (security_barrier=true)
as
select
  id,
  website_name,
  logo_url,
  favicon_url,
  contact_phone,
  whatsapp_url,
  enquiry_email,
  business_email,
  business_address,
  facebook_url,
  website_url,
  social_links,
  default_seo_title,
  default_seo_description,
  default_social_image_url,
  currency,
  supported_languages
from public.website_settings;

revoke all on public.public_accommodations from public;
revoke all on public.public_vehicles from public;
revoke all on public.public_guides from public;
revoke all on public.website_public_settings from public;
grant select on public.public_accommodations to anon, authenticated;
grant select on public.public_vehicles to anon, authenticated;
grant select on public.public_guides to anon, authenticated;
grant select on public.website_public_settings to anon, authenticated;

-- The base tables are not public APIs. Anonymous access is removed even when a
-- future policy is accidentally broadened; authenticated staff remain governed
-- by the explicit staff-only policies below.
revoke select on public.accommodations from anon;
revoke select on public.vehicles from anon;
revoke select on public.guides from anon;
revoke select on public.website_settings from anon;

drop policy if exists accommodations_read on public.accommodations;
drop policy if exists vehicles_read on public.vehicles;
drop policy if exists guides_read on public.guides;
drop policy if exists website_settings_public_read on public.website_settings;

create policy accommodations_staff_read_phase2
on public.accommodations for select to authenticated
using (
  private.has_role(array['admin','editor']::public.profile_role[])
  or private.has_permission('suppliers.view')
);

create policy vehicles_staff_read_phase2
on public.vehicles for select to authenticated
using (
  private.has_role(array['admin','editor']::public.profile_role[])
  or private.has_permission('suppliers.view')
);

create policy guides_staff_read_phase2
on public.guides for select to authenticated
using (
  private.has_role(array['admin','editor']::public.profile_role[])
  or private.has_permission('suppliers.view')
);

create policy website_settings_staff_read_phase2
on public.website_settings for select to authenticated
using (
  private.has_role(array['admin','editor']::public.profile_role[])
  or private.has_permission('settings.manage')
  or private.has_permission('cms.view')
);

comment on view public.public_accommodations is 'Anonymous-safe published accommodation catalogue; excludes supplier contact, commercial and workflow data.';
comment on view public.public_vehicles is 'Anonymous-safe published vehicle catalogue; excludes provider contact, commercial and workflow data.';
comment on view public.public_guides is 'Anonymous-safe published guide catalogue; excludes contact, licence, commercial and workflow data.';
comment on view public.website_public_settings is 'Anonymous-safe public business and contact settings; excludes setup and administrative state.';
notify pgrst, 'reload schema';

commit;
