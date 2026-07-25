begin;

create extension if not exists pgcrypto;
create schema if not exists private;

create type public.profile_role as enum ('admin','editor','partner');
create type public.content_status as enum ('draft','published','archived');
create type public.experience_priority as enum ('must-do','popular','hidden-gem','seasonal','optional');
create type public.partner_application_type as enum ('accommodation','vehicle','guide');
create type public.partner_application_status as enum ('pending','approved','rejected','needs_changes');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role public.profile_role not null default 'editor',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.themes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  short_description text,
  hero_image_url text,
  image_alt text,
  icon text,
  display_order integer not null default 0,
  status public.content_status not null default 'draft',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  constraint themes_publish_image check (status <> 'published' or (nullif(hero_image_url,'') is not null and nullif(image_alt,'') is not null))
);

create table public.destinations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  province text,
  region text,
  short_description text,
  full_description text,
  hero_image_url text,
  image_alt text,
  gallery jsonb not null default '[]'::jsonb,
  latitude numeric,
  longitude numeric,
  display_order integer not null default 0,
  coming_soon boolean not null default false,
  status public.content_status not null default 'draft',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  constraint destinations_gallery_array check (jsonb_typeof(gallery)='array'),
  constraint destinations_publish_image check (status <> 'published' or (nullif(hero_image_url,'') is not null and nullif(image_alt,'') is not null))
);

create table public.theme_destinations (
  theme_id uuid not null references public.themes(id) on delete cascade,
  destination_id uuid not null references public.destinations(id) on delete cascade,
  primary key(theme_id,destination_id)
);

create table public.experiences (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  category text,
  short_description text,
  full_description text,
  hero_image_url text,
  image_alt text,
  gallery jsonb not null default '[]'::jsonb,
  duration text,
  difficulty text,
  family_friendly boolean not null default false,
  suitable_for_children boolean not null default false,
  private_option boolean not null default false,
  priority public.experience_priority,
  featured boolean not null default false,
  display_order integer not null default 0,
  status public.content_status not null default 'draft',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  constraint experiences_gallery_array check (jsonb_typeof(gallery)='array'),
  constraint experiences_publish_image check (status <> 'published' or (nullif(hero_image_url,'') is not null and nullif(image_alt,'') is not null))
);

create table public.experience_destinations (
  experience_id uuid not null references public.experiences(id) on delete cascade,
  destination_id uuid not null references public.destinations(id) on delete cascade,
  primary key(experience_id,destination_id)
);

create table public.experience_themes (
  experience_id uuid not null references public.experiences(id) on delete cascade,
  theme_id uuid not null references public.themes(id) on delete cascade,
  primary key(experience_id,theme_id)
);

create table public.accommodations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  destination_id uuid references public.destinations(id),
  property_type text,
  star_rating integer,
  short_description text,
  full_description text,
  hero_image_url text,
  image_alt text,
  gallery jsonb not null default '[]'::jsonb,
  address text,
  price_range text,
  amenities jsonb not null default '[]'::jsonb,
  phone text,
  email text,
  website text,
  verified boolean not null default false,
  featured boolean not null default false,
  status public.content_status not null default 'draft',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint accommodations_star_rating check (star_rating between 1 and 5),
  constraint accommodations_gallery_array check (jsonb_typeof(gallery)='array'),
  constraint accommodations_amenities_array check (jsonb_typeof(amenities)='array'),
  constraint accommodations_publish_image check (status <> 'published' or (nullif(hero_image_url,'') is not null and nullif(image_alt,'') is not null))
);

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  listing_title text not null,
  slug text unique not null,
  vehicle_type text,
  vehicle_model text,
  hero_image_url text,
  image_alt text,
  gallery jsonb not null default '[]'::jsonb,
  passenger_capacity integer,
  luggage_capacity text,
  air_conditioned boolean not null default false,
  driver_included boolean not null default false,
  nationwide boolean not null default true,
  available_destination_ids jsonb not null default '[]'::jsonb,
  price_guide text,
  phone text,
  email text,
  verified boolean not null default false,
  featured boolean not null default false,
  status public.content_status not null default 'draft',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vehicles_gallery_array check (jsonb_typeof(gallery)='array'),
  constraint vehicles_destinations_array check (jsonb_typeof(available_destination_ids)='array'),
  constraint vehicles_publish_image check (status <> 'published' or (nullif(hero_image_url,'') is not null and nullif(image_alt,'') is not null))
);

create table public.guides (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  profile_image_url text,
  image_alt text,
  short_bio text,
  full_bio text,
  languages jsonb not null default '[]'::jsonb,
  years_experience integer,
  specialities jsonb not null default '[]'::jsonb,
  licence_number text,
  phone text,
  email text,
  verified boolean not null default false,
  featured boolean not null default false,
  status public.content_status not null default 'draft',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint guides_languages_array check (jsonb_typeof(languages)='array'),
  constraint guides_specialities_array check (jsonb_typeof(specialities)='array'),
  constraint guides_publish_image check (status <> 'published' or (nullif(profile_image_url,'') is not null and nullif(image_alt,'') is not null))
);

create table public.guide_destinations (
  guide_id uuid not null references public.guides(id) on delete cascade,
  destination_id uuid not null references public.destinations(id) on delete cascade,
  primary key(guide_id,destination_id)
);
create table public.guide_themes (
  guide_id uuid not null references public.guides(id) on delete cascade,
  theme_id uuid not null references public.themes(id) on delete cascade,
  primary key(guide_id,theme_id)
);
create table public.guide_experiences (
  guide_id uuid not null references public.guides(id) on delete cascade,
  experience_id uuid not null references public.experiences(id) on delete cascade,
  primary key(guide_id,experience_id)
);

create table public.partner_applications (
  id uuid primary key default gen_random_uuid(),
  application_type public.partner_application_type not null,
  business_name text,
  applicant_name text not null,
  email text not null,
  phone text,
  destination_ids jsonb not null default '[]'::jsonb,
  application_data jsonb not null default '{}'::jsonb,
  status public.partner_application_status not null default 'pending',
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_destination_ids_array check (jsonb_typeof(destination_ids)='array'),
  constraint partner_application_data_object check (jsonb_typeof(application_data)='object')
);

create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  email text not null,
  phone text,
  nationality text,
  summary text,
  trip_state jsonb not null default '{}'::jsonb,
  status text not null default 'new' check (status in ('new','contacted','planning','booked','closed'))
);

create or replace function private.has_role(allowed_roles public.profile_role[])
returns boolean language sql stable security definer set search_path=''
as $$ select exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role=any(allowed_roles)); $$;
revoke all on function private.has_role(public.profile_role[]) from public;
grant execute on function private.has_role(public.profile_role[]) to authenticated;

create or replace function private.set_updated_at()
returns trigger language plpgsql set search_path=''
as $$ begin new.updated_at=now(); return new; end; $$;

do $$
declare table_name text;
begin
  foreach table_name in array array['profiles','themes','destinations','experiences','accommodations','vehicles','guides','partner_applications','enquiries']
  loop
    execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function private.set_updated_at()',table_name,table_name);
  end loop;
end $$;

create index themes_status_active_order_idx on public.themes(status,active,display_order);
create index themes_featured_order_idx on public.themes(display_order);
create index destinations_status_active_order_idx on public.destinations(status,active,display_order);
create index destinations_featured_idx on public.destinations(coming_soon,display_order);
create index experiences_status_active_order_idx on public.experiences(status,active,display_order);
create index experiences_featured_idx on public.experiences(featured,display_order);
create index accommodations_destination_idx on public.accommodations(destination_id);
create index accommodations_status_active_idx on public.accommodations(status,active);
create index accommodations_featured_idx on public.accommodations(featured);
create index vehicles_status_active_idx on public.vehicles(status,active);
create index vehicles_featured_idx on public.vehicles(featured);
create index guides_status_active_idx on public.guides(status,active);
create index guides_featured_idx on public.guides(featured);
create index theme_destinations_destination_idx on public.theme_destinations(destination_id);
create index experience_destinations_destination_idx on public.experience_destinations(destination_id);
create index experience_themes_theme_idx on public.experience_themes(theme_id);
create index guide_destinations_destination_idx on public.guide_destinations(destination_id);
create index guide_themes_theme_idx on public.guide_themes(theme_id);
create index guide_experiences_experience_idx on public.guide_experiences(experience_id);
create index partner_applications_status_created_idx on public.partner_applications(status,created_at desc);

do $$
declare table_name text;
begin
  foreach table_name in array array['profiles','themes','destinations','theme_destinations','experiences','experience_destinations','experience_themes','accommodations','vehicles','guides','guide_destinations','guide_themes','guide_experiences','partner_applications','enquiries']
  loop execute format('alter table public.%I enable row level security',table_name); end loop;
end $$;

create policy profiles_own_select on public.profiles for select to authenticated using (id=(select auth.uid()) or private.has_role(array['admin']::public.profile_role[]));
create policy profiles_admin_all on public.profiles for all to authenticated using (private.has_role(array['admin']::public.profile_role[])) with check (private.has_role(array['admin']::public.profile_role[]));

do $$
declare table_name text;
begin
  foreach table_name in array array['themes','destinations','experiences','accommodations','vehicles','guides']
  loop
    execute format('create policy %I on public.%I for select to anon,authenticated using ((status=''published'' and active) or private.has_role(array[''admin'',''editor'']::public.profile_role[]))',table_name||'_read',table_name);
    execute format('create policy %I on public.%I for insert to authenticated with check (private.has_role(array[''admin'',''editor'']::public.profile_role[]))',table_name||'_insert',table_name);
    execute format('create policy %I on public.%I for update to authenticated using (private.has_role(array[''admin'',''editor'']::public.profile_role[])) with check (private.has_role(array[''admin'',''editor'']::public.profile_role[]))',table_name||'_update',table_name);
    execute format('create policy %I on public.%I for delete to authenticated using (private.has_role(array[''admin'']::public.profile_role[]))',table_name||'_delete',table_name);
  end loop;
end $$;

create policy theme_destinations_read on public.theme_destinations for select to anon,authenticated
using ((exists(select 1 from public.themes t where t.id=theme_id and t.status='published' and t.active) and exists(select 1 from public.destinations d where d.id=destination_id and d.status='published' and d.active)) or private.has_role(array['admin','editor']::public.profile_role[]));
create policy experience_destinations_read on public.experience_destinations for select to anon,authenticated
using ((exists(select 1 from public.experiences e where e.id=experience_id and e.status='published' and e.active) and exists(select 1 from public.destinations d where d.id=destination_id and d.status='published' and d.active)) or private.has_role(array['admin','editor']::public.profile_role[]));
create policy experience_themes_read on public.experience_themes for select to anon,authenticated
using ((exists(select 1 from public.experiences e where e.id=experience_id and e.status='published' and e.active) and exists(select 1 from public.themes t where t.id=theme_id and t.status='published' and t.active)) or private.has_role(array['admin','editor']::public.profile_role[]));
create policy guide_destinations_read on public.guide_destinations for select to anon,authenticated
using ((exists(select 1 from public.guides g where g.id=guide_id and g.status='published' and g.active) and exists(select 1 from public.destinations d where d.id=destination_id and d.status='published' and d.active)) or private.has_role(array['admin','editor']::public.profile_role[]));
create policy guide_themes_read on public.guide_themes for select to anon,authenticated
using ((exists(select 1 from public.guides g where g.id=guide_id and g.status='published' and g.active) and exists(select 1 from public.themes t where t.id=theme_id and t.status='published' and t.active)) or private.has_role(array['admin','editor']::public.profile_role[]));
create policy guide_experiences_read on public.guide_experiences for select to anon,authenticated
using ((exists(select 1 from public.guides g where g.id=guide_id and g.status='published' and g.active) and exists(select 1 from public.experiences e where e.id=experience_id and e.status='published' and e.active)) or private.has_role(array['admin','editor']::public.profile_role[]));

do $$
declare table_name text;
begin
  foreach table_name in array array['theme_destinations','experience_destinations','experience_themes','guide_destinations','guide_themes','guide_experiences']
  loop
    execute format('create policy %I on public.%I for insert to authenticated with check (private.has_role(array[''admin'',''editor'']::public.profile_role[]))',table_name||'_insert',table_name);
    execute format('create policy %I on public.%I for update to authenticated using (private.has_role(array[''admin'',''editor'']::public.profile_role[])) with check (private.has_role(array[''admin'',''editor'']::public.profile_role[]))',table_name||'_update',table_name);
    execute format('create policy %I on public.%I for delete to authenticated using (private.has_role(array[''admin'']::public.profile_role[]))',table_name||'_delete',table_name);
  end loop;
end $$;

create policy partner_public_insert on public.partner_applications for insert to anon,authenticated with check (status='pending');
create policy partner_admin_all on public.partner_applications for all to authenticated using (private.has_role(array['admin']::public.profile_role[])) with check (private.has_role(array['admin']::public.profile_role[]));
create policy enquiries_public_insert on public.enquiries for insert to anon,authenticated with check (true);
create policy enquiries_staff_read on public.enquiries for select to authenticated using (private.has_role(array['admin','editor']::public.profile_role[]));
create policy enquiries_staff_update on public.enquiries for update to authenticated using (private.has_role(array['admin','editor']::public.profile_role[])) with check (private.has_role(array['admin','editor']::public.profile_role[]));
create policy enquiries_admin_delete on public.enquiries for delete to authenticated using (private.has_role(array['admin']::public.profile_role[]));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('travel-content','travel-content',true,10485760,array['image/jpeg','image/png','image/webp','image/avif'])
on conflict(id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create policy travel_content_public_read on storage.objects for select to anon,authenticated using (bucket_id='travel-content');
create policy travel_content_staff_insert on storage.objects for insert to authenticated with check (bucket_id='travel-content' and private.has_role(array['admin','editor']::public.profile_role[]));
create policy travel_content_staff_update on storage.objects for update to authenticated using (bucket_id='travel-content' and private.has_role(array['admin','editor']::public.profile_role[])) with check (bucket_id='travel-content' and private.has_role(array['admin','editor']::public.profile_role[]));
create policy travel_content_staff_delete on storage.objects for delete to authenticated using (bucket_id='travel-content' and private.has_role(array['admin','editor']::public.profile_role[]));

commit;
