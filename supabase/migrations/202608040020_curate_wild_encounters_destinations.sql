begin;

-- Journey themes describe the destination's primary travel character. Individual
-- experiences may still carry the wildlife theme without promoting their entire
-- destination into the Wild Encounters discovery path.
insert into public.theme_destinations(theme_id, destination_id)
select t.id, d.id
from public.themes t
cross join public.destinations d
where t.slug = 'wildlife'
  and d.slug in ('yala', 'minneriya', 'udawalawe', 'wilpattu', 'dambulla')
on conflict do nothing;

delete from public.theme_destinations td
using public.themes t, public.destinations d
where td.theme_id = t.id
  and td.destination_id = d.id
  and t.slug = 'wildlife'
  and d.slug in ('arugambay', 'kalpitiya', 'kandy', 'kitulgala');

do $$
declare
  unexpected_count integer;
  retained_count integer;
begin
  select count(*) into unexpected_count
  from public.theme_destinations td
  join public.themes t on t.id = td.theme_id
  join public.destinations d on d.id = td.destination_id
  where t.slug = 'wildlife'
    and d.slug in ('arugambay', 'kalpitiya', 'kandy', 'kitulgala');

  select count(*) into retained_count
  from public.theme_destinations td
  join public.themes t on t.id = td.theme_id
  join public.destinations d on d.id = td.destination_id
  where t.slug = 'wildlife'
    and d.slug in ('yala', 'minneriya', 'udawalawe', 'wilpattu', 'dambulla');

  if unexpected_count <> 0 then
    raise exception 'Wild Encounters cleanup failed: % unsuitable destination links remain', unexpected_count;
  end if;

  if retained_count <> 5 then
    raise exception 'Wild Encounters validation failed: expected 5 curated destinations, found %', retained_count;
  end if;

  raise notice 'Wild Encounters now contains Yala, Minneriya, Udawalawe, Wilpattu and Dambulla. Experience-level wildlife relationships are unchanged.';
end $$;

commit;
