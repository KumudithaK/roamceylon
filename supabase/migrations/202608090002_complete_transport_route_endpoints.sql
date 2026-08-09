begin;

alter table public.journey_supplier_allocations
  add column if not exists from_location_key text,
  add column if not exists to_location_key text;

update public.journey_supplier_allocations set
  from_location_key=coalesce(from_location_key,'destination:'||from_destination_id::text),
  to_location_key=coalesce(to_location_key,'destination:'||to_destination_id::text)
where allocation_type='vehicle';

drop index if exists public.journey_supplier_route_allocation_unique;
alter table public.journey_supplier_allocations drop constraint if exists journey_supplier_allocation_scope;
alter table public.journey_supplier_allocations add constraint journey_supplier_allocation_scope check (
  (allocation_type='accommodation' and destination_id is not null and from_destination_id is null and to_destination_id is null and from_location_key is null and to_location_key is null and accommodation_id is not null and guide_id is null and vehicle_id is null and experience_id is null)
  or (allocation_type='guide' and from_destination_id is null and to_destination_id is null and from_location_key is null and to_location_key is null and guide_id is not null and accommodation_id is null and vehicle_id is null and experience_id is null)
  or (allocation_type='vehicle' and destination_id is null and from_location_key is not null and to_location_key is not null and from_location_key<>to_location_key and vehicle_id is not null and accommodation_id is null and guide_id is null and experience_id is null)
  or (allocation_type='experience' and destination_id is not null and from_destination_id is null and to_destination_id is null and from_location_key is null and to_location_key is null and experience_id is not null and accommodation_id is null and guide_id is null and vehicle_id is null and nullif(btrim(provider_name),'') is not null)
);

create unique index journey_supplier_route_allocation_unique
on public.journey_supplier_allocations(enquiry_id,allocation_type,from_location_key,to_location_key)
where allocation_type='vehicle';

comment on column public.journey_supplier_allocations.from_location_key is 'Stable route origin key: pickup, dropoff, or destination:<uuid>.';
comment on column public.journey_supplier_allocations.to_location_key is 'Stable route destination key: pickup, dropoff, or destination:<uuid>.';

commit;
