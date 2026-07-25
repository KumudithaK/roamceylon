begin;

create type public.image_review_status as enum ('approved','needs_review','missing','broken','duplicate','unrelated');

do $$
declare table_name text;
begin
  foreach table_name in array array['themes','destinations','experiences','accommodations','vehicles'] loop
    execute format('alter table public.%I
      add column seo_title text,
      add column seo_description text,
      add column needs_review boolean not null default false,
      add column image_status public.image_review_status not null default ''needs_review'',
      add column image_review_notes text,
      add column needs_image_review boolean not null default true,
      add column image_source text,
      add column image_credit text,
      add column image_focal_x numeric not null default 50 check (image_focal_x between 0 and 100),
      add column image_focal_y numeric not null default 50 check (image_focal_y between 0 and 100)',table_name);
  end loop;
end $$;

alter table public.guides
  add column seo_title text,
  add column seo_description text,
  add column needs_review boolean not null default false,
  add column image_status public.image_review_status not null default 'needs_review',
  add column image_review_notes text,
  add column needs_image_review boolean not null default true,
  add column image_source text,
  add column image_credit text,
  add column image_focal_x numeric not null default 50 check (image_focal_x between 0 and 100),
  add column image_focal_y numeric not null default 50 check (image_focal_y between 0 and 100);

alter table public.accommodations
  add column location text,
  add column latitude numeric,
  add column longitude numeric,
  add column booking_url text,
  add column sponsored boolean not null default false,
  add column partner_account_id uuid references auth.users(id),
  add column subscription_plan text,
  add column is_sample boolean not null default false;

alter table public.vehicles
  add column provider_name text,
  add column model_year integer check (model_year between 1900 and 2200),
  add column fuel_included boolean not null default false,
  add column daily_price_guide text,
  add column transfer_price_guide text,
  add column website text,
  add column sponsored boolean not null default false,
  add column partner_account_id uuid references auth.users(id),
  add column subscription_plan text,
  add column is_sample boolean not null default false;

alter table public.guides
  add column sponsored boolean not null default false,
  add column partner_account_id uuid references auth.users(id),
  add column subscription_plan text,
  add column is_sample boolean not null default false;

update public.accommodations set status='draft',is_sample=true,verified=false,featured=false where status='published';
update public.vehicles set status='draft',is_sample=true,verified=false,featured=false where status='published';
update public.guides set status='draft',is_sample=true,verified=false,featured=false where status='published';

alter table public.themes add constraint themes_safe_image_publish check (status <> 'published' or image_status not in ('missing','broken','unrelated'));
alter table public.destinations add constraint destinations_safe_image_publish check (status <> 'published' or image_status not in ('missing','broken','unrelated'));
alter table public.experiences add constraint experiences_safe_image_publish check (status <> 'published' or image_status not in ('missing','broken','unrelated'));
alter table public.accommodations add constraint accommodations_real_publish check (status <> 'published' or (not is_sample and image_status not in ('missing','broken','unrelated') and (email is not null or phone is not null)));
alter table public.vehicles add constraint vehicles_real_publish check (status <> 'published' or (not is_sample and image_status not in ('missing','broken','unrelated') and (email is not null or phone is not null)));
alter table public.guides add constraint guides_real_publish check (status <> 'published' or (not is_sample and image_status not in ('missing','broken','unrelated') and (email is not null or phone is not null)));

alter table public.enquiries
  add column travel_start_date date,
  add column travel_end_date date,
  add column adults integer not null default 1 check (adults > 0),
  add column children integer not null default 0 check (children >= 0),
  add column selected_themes jsonb not null default '[]'::jsonb,
  add column selected_destinations jsonb not null default '[]'::jsonb,
  add column selected_experiences jsonb not null default '[]'::jsonb,
  add column selected_stays jsonb not null default '[]'::jsonb,
  add column selected_vehicle text,
  add column selected_guide text,
  add column traveller_notes text,
  add column internal_notes text;

alter table public.enquiries drop constraint if exists enquiries_status_check;
alter table public.enquiries add constraint enquiries_status_check
  check (status in ('new','contacted','quote_preparing','quote_sent','confirmed','closed','cancelled'));

drop policy if exists enquiries_public_insert on public.enquiries;
create policy enquiries_public_insert on public.enquiries for insert to anon,authenticated
  with check (status='new' and internal_notes is null);

create table public.website_settings (
  id boolean primary key default true check (id),
  website_name text not null default 'Roam Ceylon',
  logo_url text,
  favicon_url text,
  contact_phone text,
  whatsapp_number text,
  enquiry_email text,
  business_address text,
  social_links jsonb not null default '{}'::jsonb check (jsonb_typeof(social_links)='object'),
  default_seo_title text,
  default_seo_description text,
  default_social_image_url text,
  currency text not null default 'USD',
  supported_languages jsonb not null default '["English"]'::jsonb check (jsonb_typeof(supported_languages)='array'),
  maintenance_mode boolean not null default false,
  partner_registration_available boolean not null default true,
  setup_checklist jsonb not null default '{}'::jsonb check (jsonb_typeof(setup_checklist)='object'),
  setup_dismissed boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

create table public.homepage_content (
  id boolean primary key default true check (id),
  hero_title text,
  hero_subtitle text,
  hero_background_image_url text,
  hero_image_alt text,
  primary_cta jsonb not null default '{}'::jsonb,
  secondary_cta jsonb not null default '{}'::jsonb,
  featured_theme_ids jsonb not null default '[]'::jsonb,
  featured_destination_ids jsonb not null default '[]'::jsonb,
  featured_experience_ids jsonb not null default '[]'::jsonb,
  featured_stay_ids jsonb not null default '[]'::jsonb,
  featured_vehicle_ids jsonb not null default '[]'::jsonb,
  featured_guide_ids jsonb not null default '[]'::jsonb,
  why_content jsonb not null default '[]'::jsonb,
  traveller_stories jsonb not null default '[]'::jsonb,
  partner_cta jsonb not null default '{}'::jsonb,
  footer_content jsonb not null default '{}'::jsonb,
  status public.content_status not null default 'draft',
  active boolean not null default true,
  needs_review boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

create table public.content_import_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  report jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create index themes_review_idx on public.themes(needs_review,needs_image_review,image_status);
create index destinations_review_idx on public.destinations(needs_review,needs_image_review,image_status,province);
create index experiences_review_idx on public.experiences(needs_review,needs_image_review,image_status,category,priority);
create index accommodations_review_idx on public.accommodations(needs_review,needs_image_review,is_sample);
create index vehicles_review_idx on public.vehicles(needs_review,needs_image_review,is_sample);
create index guides_review_idx on public.guides(needs_review,needs_image_review,is_sample);
create index enquiries_status_created_v2_idx on public.enquiries(status,created_at desc);

create trigger website_settings_updated_at before update on public.website_settings for each row execute function private.set_updated_at();
create trigger homepage_content_updated_at before update on public.homepage_content for each row execute function private.set_updated_at();

alter table public.website_settings enable row level security;
alter table public.homepage_content enable row level security;
alter table public.content_import_runs enable row level security;

create policy website_settings_public_read on public.website_settings for select to anon,authenticated using (true);
create policy website_settings_staff_insert on public.website_settings for insert to authenticated with check (private.has_role(array['admin','editor']::public.profile_role[]));
create policy website_settings_staff_update on public.website_settings for update to authenticated using (private.has_role(array['admin','editor']::public.profile_role[])) with check (private.has_role(array['admin','editor']::public.profile_role[]));
create policy website_settings_admin_delete on public.website_settings for delete to authenticated using (private.has_role(array['admin']::public.profile_role[]));

create policy homepage_public_read on public.homepage_content for select to anon,authenticated
  using ((status='published' and active) or private.has_role(array['admin','editor']::public.profile_role[]));
create policy homepage_staff_insert on public.homepage_content for insert to authenticated with check (private.has_role(array['admin','editor']::public.profile_role[]));
create policy homepage_staff_update on public.homepage_content for update to authenticated using (private.has_role(array['admin','editor']::public.profile_role[])) with check (private.has_role(array['admin','editor']::public.profile_role[]));
create policy homepage_admin_delete on public.homepage_content for delete to authenticated using (private.has_role(array['admin']::public.profile_role[]));

create policy import_runs_admin_all on public.content_import_runs for all to authenticated
  using (private.has_role(array['admin']::public.profile_role[]))
  with check (private.has_role(array['admin']::public.profile_role[]));

drop policy if exists theme_destinations_delete on public.theme_destinations;
drop policy if exists experience_destinations_delete on public.experience_destinations;
drop policy if exists experience_themes_delete on public.experience_themes;
drop policy if exists guide_destinations_delete on public.guide_destinations;
drop policy if exists guide_themes_delete on public.guide_themes;
drop policy if exists guide_experiences_delete on public.guide_experiences;
create policy theme_destinations_delete on public.theme_destinations for delete to authenticated using (private.has_role(array['admin','editor']::public.profile_role[]));
create policy experience_destinations_delete on public.experience_destinations for delete to authenticated using (private.has_role(array['admin','editor']::public.profile_role[]));
create policy experience_themes_delete on public.experience_themes for delete to authenticated using (private.has_role(array['admin','editor']::public.profile_role[]));
create policy guide_destinations_delete on public.guide_destinations for delete to authenticated using (private.has_role(array['admin','editor']::public.profile_role[]));
create policy guide_themes_delete on public.guide_themes for delete to authenticated using (private.has_role(array['admin','editor']::public.profile_role[]));
create policy guide_experiences_delete on public.guide_experiences for delete to authenticated using (private.has_role(array['admin','editor']::public.profile_role[]));

insert into public.website_settings (
  id,website_name,contact_phone,whatsapp_number,enquiry_email,default_seo_title,
  default_seo_description,currency,supported_languages,setup_checklist
) values (
  true,'Roam Ceylon','+94 71 307 7989','+94 71 307 7989','hello@roamceylon.com',
  'Roam Ceylon — Build Your Sri Lanka',
  'Design a private, tailor-made Sri Lanka journey with local experts, handpicked stays, guides and transport.',
  'USD','["English"]',
  '{"themes":false,"destinations":false,"experiences":false,"images":false,"stays":false,"vehicles":false,"guides":false,"contact":false,"homepage":false,"publish":false}'
) on conflict (id) do nothing;

insert into public.homepage_content (
  id,hero_title,hero_subtitle,primary_cta,secondary_cta,why_content,traveller_stories,partner_cta,
  footer_content,status,active,needs_review
) values (
  true,
  'Stop browsing itineraries. Build yours.',
  'Pick the places and experiences that pull at you. We will shape them into a private, tailor-made Sri Lanka journey.',
  '{"label":"Start building your trip","href":"#builder"}',
  '{"label":"See how it works","href":"#how"}',
  '[{"title":"Fair, transparent pricing","description":"One quote, clearly broken down — no inflated package mark-ups."},{"title":"Planned by locals","description":"Our consultants and guides grew up on this island. It shows in the details."},{"title":"A named consultant","description":"One person who knows your trip from first message to landing."},{"title":"24-hour support","description":"A real number to call if anything changes while you are on the road."},{"title":"Flexible and fair terms","description":"Sensible terms explained upfront in plain English."},{"title":"Secure booking","description":"A written itinerary before a payment changes hands."}]',
  '[]','{"label":"Partner with Roam Ceylon","href":"#marketplace"}',
  '{"copyright":"Roam Ceylon","tagline":"Journeys that connect"}',
  'published',true,true
) on conflict (id) do nothing;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('travel-content','travel-content',true,10485760,array['image/jpeg','image/png','image/webp','image/avif'])
on conflict(id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

commit;
