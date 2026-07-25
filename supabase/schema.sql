create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  phone text,
  nationality text,
  summary text,
  trip_state jsonb not null default '{}'::jsonb,
  status text not null default 'new' check (status in ('new','contacted','planning','booked','closed'))
);

alter table public.enquiries enable row level security;

create policy "public can create enquiries"
on public.enquiries for insert
to anon
with check (true);

create policy "authenticated staff can read enquiries"
on public.enquiries for select
to authenticated
using (true);
