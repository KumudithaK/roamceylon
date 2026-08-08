create table public.journey_supplier_allocations (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null references public.enquiries(id) on delete cascade,
  allocation_type text not null check (allocation_type in ('accommodation','guide','vehicle')),
  destination_id uuid references public.destinations(id) on delete cascade,
  from_destination_id uuid references public.destinations(id) on delete cascade,
  to_destination_id uuid references public.destinations(id) on delete cascade,
  accommodation_id uuid references public.accommodations(id) on delete restrict,
  guide_id uuid references public.guides(id) on delete restrict,
  vehicle_id uuid references public.vehicles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint journey_supplier_allocation_scope check (
    (
      allocation_type='accommodation'
      and destination_id is not null
      and from_destination_id is null and to_destination_id is null
      and accommodation_id is not null and guide_id is null and vehicle_id is null
    ) or (
      allocation_type='guide'
      and destination_id is not null
      and from_destination_id is null and to_destination_id is null
      and accommodation_id is null and guide_id is not null and vehicle_id is null
    ) or (
      allocation_type='vehicle'
      and destination_id is null
      and from_destination_id is not null and to_destination_id is not null
      and from_destination_id <> to_destination_id
      and accommodation_id is null and guide_id is null and vehicle_id is not null
    )
  )
);

create unique index journey_supplier_destination_allocation_unique
on public.journey_supplier_allocations(enquiry_id,allocation_type,destination_id)
where allocation_type in ('accommodation','guide');

create unique index journey_supplier_route_allocation_unique
on public.journey_supplier_allocations(enquiry_id,allocation_type,from_destination_id,to_destination_id)
where allocation_type='vehicle';

create index journey_supplier_allocations_enquiry_idx
on public.journey_supplier_allocations(enquiry_id);

alter table public.journey_supplier_allocations enable row level security;

create policy journey_supplier_allocations_staff_select
on public.journey_supplier_allocations for select to authenticated
using (private.has_role(array['admin','editor']::public.profile_role[]));

create policy journey_supplier_allocations_staff_insert
on public.journey_supplier_allocations for insert to authenticated
with check (private.has_role(array['admin','editor']::public.profile_role[]));

create policy journey_supplier_allocations_staff_update
on public.journey_supplier_allocations for update to authenticated
using (private.has_role(array['admin','editor']::public.profile_role[]))
with check (private.has_role(array['admin','editor']::public.profile_role[]));

create policy journey_supplier_allocations_staff_delete
on public.journey_supplier_allocations for delete to authenticated
using (private.has_role(array['admin','editor']::public.profile_role[]));

revoke all on table public.journey_supplier_allocations from anon;
grant select,insert,update,delete on table public.journey_supplier_allocations to authenticated;

comment on table public.journey_supplier_allocations is
'Internal supplier proposals for a traveller enquiry. Traveller preferences remain immutable in enquiries.trip_state.';
