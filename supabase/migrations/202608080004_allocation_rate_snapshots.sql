begin;

alter table public.journey_supplier_allocations
  add column pricing_plan_id uuid references public.pricing_plans(id) on delete restrict,
  add column pricing_plan_snapshot jsonb not null default '{}'::jsonb
    check (jsonb_typeof(pricing_plan_snapshot) = 'object'),
  add column service_name text,
  add column quantity numeric check (quantity is null or quantity > 0),
  add column quantity_label text,
  add column service_details jsonb not null default '{}'::jsonb
    check (jsonb_typeof(service_details) = 'object');

alter table public.journey_supplier_allocations
  drop constraint if exists journey_supplier_allocation_scope,
  add constraint journey_supplier_allocation_scope check (
    (
      allocation_type='accommodation'
      and destination_id is not null
      and from_destination_id is null and to_destination_id is null
      and accommodation_id is not null and guide_id is null and vehicle_id is null and experience_id is null
    ) or (
      allocation_type='guide'
      and from_destination_id is null and to_destination_id is null
      and accommodation_id is null and guide_id is not null and vehicle_id is null and experience_id is null
    ) or (
      allocation_type='vehicle'
      and destination_id is null
      and from_destination_id is not null and to_destination_id is not null
      and from_destination_id <> to_destination_id
      and accommodation_id is null and guide_id is null and vehicle_id is not null and experience_id is null
    ) or (
      allocation_type='experience'
      and destination_id is not null
      and from_destination_id is null and to_destination_id is null
      and accommodation_id is null and guide_id is null and vehicle_id is null and experience_id is not null
      and nullif(btrim(provider_name),'') is not null
    )
  );

create unique index journey_supplier_journey_guide_unique
on public.journey_supplier_allocations(enquiry_id,allocation_type)
where allocation_type='guide' and destination_id is null;

create index journey_supplier_allocations_pricing_plan_idx
on public.journey_supplier_allocations(pricing_plan_id)
where pricing_plan_id is not null;

comment on column public.journey_supplier_allocations.pricing_plan_id is
'The current supplier catalogue rate selected while preparing the allocation.';
comment on column public.journey_supplier_allocations.pricing_plan_snapshot is
'Immutable rate name, basis, unit price, currency and descriptive details captured when the allocation is saved.';
comment on column public.journey_supplier_allocations.quantity is
'Billable quantity for the selected rate, such as room nights, people, days, kilometres or trips.';
comment on column public.journey_supplier_allocations.service_details is
'Journey-specific service facts such as rooms, nights, occupancy, meal basis and service dates.';

commit;
