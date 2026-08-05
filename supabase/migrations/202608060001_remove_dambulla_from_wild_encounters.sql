begin;

-- Dambulla remains connected to its heritage, nature and adventure themes. Its
-- Kandalama birding experience can retain an experience-level wildlife tag
-- without making the whole destination part of Wild Encounters discovery.
delete from public.theme_destinations td
using public.themes t, public.destinations d
where td.theme_id = t.id
  and td.destination_id = d.id
  and t.slug = 'wildlife'
  and d.slug = 'dambulla';

do $$
declare
  dambulla_count integer;
  core_count integer;
begin
  select count(*) into dambulla_count
  from public.theme_destinations td
  join public.themes t on t.id = td.theme_id
  join public.destinations d on d.id = td.destination_id
  where t.slug = 'wildlife' and d.slug = 'dambulla';

  select count(*) into core_count
  from public.theme_destinations td
  join public.themes t on t.id = td.theme_id
  join public.destinations d on d.id = td.destination_id
  where t.slug = 'wildlife'
    and d.slug in ('yala', 'minneriya', 'udawalawe', 'wilpattu');

  if dambulla_count <> 0 or core_count <> 4 then
    raise exception 'Wild Encounters validation failed: Dambulla %, core destinations %', dambulla_count, core_count;
  end if;

  raise notice 'Dambulla removed from Wild Encounters. Core wildlife destinations remain unchanged.';
end $$;

commit;
