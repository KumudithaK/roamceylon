begin;

drop policy if exists partner_public_insert on public.partner_applications;
drop policy if exists partner_admin_all on public.partner_applications;

alter table public.partner_applications
  alter column status drop default,
  alter column status type text using (
    case status::text
      when 'pending' then 'submitted'
      when 'needs_changes' then 'needs_information'
      else status::text
    end
  ),
  alter column status set default 'submitted';

alter table public.partner_applications rename column application_type to partner_type;
alter table public.partner_applications
  rename column admin_notes to internal_notes;

alter table public.partner_applications
  add column application_reference text unique not null default (
    'RC-' || to_char(now(),'YYYYMMDD') || '-' ||
    upper(substr(replace(gen_random_uuid()::text,'-',''),1,6))
  ),
  add column preferred_contact_method text,
  add column address text,
  add column district text,
  add column province text,
  add column website text,
  add column social_url text,
  add column introduction text,
  add column submitted_at timestamptz,
  add column reviewed_at timestamptz,
  add column reviewed_by uuid references auth.users(id),
  add constraint partner_application_status_v2 check (
    status in ('submitted','under_review','needs_information','approved','rejected','converted')
  );

update public.partner_applications set submitted_at=created_at where submitted_at is null;

create table public.partner_application_files (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.partner_applications(id) on delete cascade,
  file_type text not null,
  file_name text not null,
  storage_path text not null unique,
  bucket_id text not null check (bucket_id in ('partner-application-media','partner-application-documents')),
  mime_type text not null,
  is_private boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.partner_application_history (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.partner_applications(id) on delete cascade,
  from_status text,
  to_status text not null,
  note text,
  changed_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.partner_commercial_settings (
  id boolean primary key default true check(id),
  application_fee_enabled boolean not null default false,
  application_fee_amount numeric not null default 0 check(application_fee_amount>=0),
  listing_fee_enabled boolean not null default false,
  listing_fee_amount numeric not null default 0 check(listing_fee_amount>=0),
  commission_enabled boolean not null default false,
  commission_percentage numeric not null default 0 check(commission_percentage between 0 and 100),
  featured_placement_enabled boolean not null default false,
  currency text not null default 'USD',
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

insert into public.partner_commercial_settings(id) values(true) on conflict(id) do nothing;

create index partner_application_search_v2_idx on public.partner_applications(status,partner_type,submitted_at desc);
create index partner_application_files_application_idx on public.partner_application_files(application_id,sort_order);
create index partner_application_history_application_idx on public.partner_application_history(application_id,created_at desc);

alter table public.partner_application_files enable row level security;
alter table public.partner_application_history enable row level security;
alter table public.partner_commercial_settings enable row level security;

create policy partner_staff_read on public.partner_applications for select to authenticated
using (private.has_role(array['admin','editor']::public.profile_role[]));
create policy partner_staff_update on public.partner_applications for update to authenticated
using (private.has_role(array['admin','editor']::public.profile_role[]))
with check (private.has_role(array['admin','editor']::public.profile_role[]));
create policy partner_admin_delete on public.partner_applications for delete to authenticated
using (private.has_role(array['admin']::public.profile_role[]));

create policy partner_files_staff_read on public.partner_application_files for select to authenticated
using (private.has_role(array['admin','editor']::public.profile_role[]));
create policy partner_files_staff_manage on public.partner_application_files for all to authenticated
using (private.has_role(array['admin']::public.profile_role[]))
with check (private.has_role(array['admin']::public.profile_role[]));
create policy partner_history_staff_read on public.partner_application_history for select to authenticated
using (private.has_role(array['admin','editor']::public.profile_role[]));
create policy partner_history_staff_insert on public.partner_application_history for insert to authenticated
with check (private.has_role(array['admin','editor']::public.profile_role[]));
create policy partner_settings_staff on public.partner_commercial_settings for all to authenticated
using (private.has_role(array['admin']::public.profile_role[]))
with check (private.has_role(array['admin']::public.profile_role[]));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values
  ('partner-application-media','partner-application-media',false,10485760,array['image/jpeg','image/png','image/webp']),
  ('partner-application-documents','partner-application-documents',false,15728640,array['application/pdf','image/jpeg','image/png'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create policy partner_media_staff_read on storage.objects for select to authenticated
using (bucket_id='partner-application-media' and private.has_role(array['admin','editor']::public.profile_role[]));
create policy partner_documents_staff_read on storage.objects for select to authenticated
using (bucket_id='partner-application-documents' and private.has_role(array['admin','editor']::public.profile_role[]));
create policy partner_storage_admin_manage on storage.objects for all to authenticated
using (bucket_id in ('partner-application-media','partner-application-documents') and private.has_role(array['admin']::public.profile_role[]))
with check (bucket_id in ('partner-application-media','partner-application-documents') and private.has_role(array['admin']::public.profile_role[]));

commit;
