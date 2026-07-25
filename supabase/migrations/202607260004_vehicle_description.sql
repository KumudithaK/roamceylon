alter table public.vehicles add column short_description text;

update public.vehicles
set short_description=left(vehicle_model,160)
where is_sample=true
  and nullif(vehicle_model,'') is not null
  and short_description is null;

comment on column public.vehicles.short_description is
  'Concise traveller-facing card description, recommended maximum 160 characters.';
