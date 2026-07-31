begin;

create table public.journey_requests (
  id uuid primary key default gen_random_uuid(),
  journey_reference text not null unique default (
    'RCJ-' || to_char(current_date,'YYYY') || '-' ||
    upper(substr(replace(gen_random_uuid()::text,'-',''),1,8))
  ),
  customer_name text not null,
  whatsapp_number text not null,
  email_address text not null,
  country text,
  arrival_date date,
  departure_date date,
  special_requests text,
  journey_snapshot jsonb not null default '{}'::jsonb,
  status text not null default 'new'
    check (status in ('new','preparing_proposal','proposal_sent','accepted','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint journey_requests_customer_name_required check (char_length(trim(customer_name)) >= 2),
  constraint journey_requests_whatsapp_required check (char_length(trim(whatsapp_number)) >= 7),
  constraint journey_requests_email_required check (position('@' in email_address) > 1),
  constraint journey_requests_snapshot_object check (jsonb_typeof(journey_snapshot) = 'object'),
  constraint journey_requests_dates_ordered check (
    arrival_date is null or departure_date is null or departure_date >= arrival_date
  )
);

create trigger set_journey_requests_updated_at
before update on public.journey_requests
for each row execute function private.set_updated_at();

create index journey_requests_status_created_idx
on public.journey_requests(status,created_at desc);

alter table public.journey_requests enable row level security;

create policy journey_requests_public_insert
on public.journey_requests
for insert to anon,authenticated
with check (status = 'new');

create policy journey_requests_staff_read
on public.journey_requests
for select to authenticated
using (private.has_role(array['admin','editor']::public.profile_role[]));

create policy journey_requests_staff_update
on public.journey_requests
for update to authenticated
using (private.has_role(array['admin','editor']::public.profile_role[]))
with check (private.has_role(array['admin','editor']::public.profile_role[]));

create policy journey_requests_admin_delete
on public.journey_requests
for delete to authenticated
using (private.has_role(array['admin']::public.profile_role[]));

comment on table public.journey_requests is
'Traveller requests that begin the journey proposal, invoice, payment and booking workflow.';
comment on column public.journey_requests.journey_snapshot is
'Versioned Journey Builder state and customer-facing package estimate captured at submission time.';

commit;
