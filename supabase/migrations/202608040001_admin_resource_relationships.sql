-- Pre-launch CMS consolidation: destination ownership is editorial, not chargeable.
delete from public.pricing_plans where entity_type = 'destination';
delete from public.tour_supplier_costs where entity_type = 'destination';

create or replace function public.sync_content_relationships(
  resource_type text,
  resource_id uuid,
  theme_ids uuid[] default '{}'::uuid[],
  destination_ids uuid[] default '{}'::uuid[],
  experience_ids uuid[] default '{}'::uuid[]
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not private.has_role(array['admin','editor']::public.profile_role[]) then
    raise exception 'Only content administrators and editors can manage relationships.';
  end if;

  case resource_type
    when 'destinations' then
      delete from public.theme_destinations where destination_id = resource_id;
      insert into public.theme_destinations(theme_id,destination_id)
      select distinct value,resource_id from unnest(coalesce(theme_ids,'{}'::uuid[])) value
      on conflict do nothing;
    when 'experiences' then
      delete from public.experience_themes where experience_id = resource_id;
      delete from public.experience_destinations where experience_id = resource_id;
      insert into public.experience_themes(experience_id,theme_id)
      select resource_id,distinct_themes.value from (select distinct value from unnest(coalesce(theme_ids,'{}'::uuid[])) value) distinct_themes
      on conflict do nothing;
      insert into public.experience_destinations(experience_id,destination_id)
      select resource_id,distinct_destinations.value from (select distinct value from unnest(coalesce(destination_ids,'{}'::uuid[])) value) distinct_destinations
      on conflict do nothing;
    when 'vehicles' then
      delete from public.vehicle_destinations where vehicle_id = resource_id;
      insert into public.vehicle_destinations(vehicle_id,destination_id)
      select resource_id,distinct_destinations.value from (select distinct value from unnest(coalesce(destination_ids,'{}'::uuid[])) value) distinct_destinations
      on conflict do nothing;
    when 'guides' then
      delete from public.guide_themes where guide_id = resource_id;
      delete from public.guide_destinations where guide_id = resource_id;
      delete from public.guide_experiences where guide_id = resource_id;
      insert into public.guide_themes(guide_id,theme_id)
      select resource_id,distinct_themes.value from (select distinct value from unnest(coalesce(theme_ids,'{}'::uuid[])) value) distinct_themes
      on conflict do nothing;
      insert into public.guide_destinations(guide_id,destination_id)
      select resource_id,distinct_destinations.value from (select distinct value from unnest(coalesce(destination_ids,'{}'::uuid[])) value) distinct_destinations
      on conflict do nothing;
      insert into public.guide_experiences(guide_id,experience_id)
      select resource_id,distinct_experiences.value from (select distinct value from unnest(coalesce(experience_ids,'{}'::uuid[])) value) distinct_experiences
      on conflict do nothing;
    else
      raise exception 'Unsupported relationship resource type: %', resource_type;
  end case;
end;
$$;

revoke all on function public.sync_content_relationships(text,uuid,uuid[],uuid[],uuid[]) from public;
grant execute on function public.sync_content_relationships(text,uuid,uuid[],uuid[],uuid[]) to authenticated;

comment on function public.sync_content_relationships(text,uuid,uuid[],uuid[],uuid[]) is
  'Atomically replaces CMS relationship mappings for destinations, experiences, vehicles and guides.';
