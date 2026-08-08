begin;

-- Sporting products are deliberately separate from Thrill & Adventure and the
-- other journey themes. Remove legacy cross-theme links left by earlier
-- editorial migrations without changing any non-sporting experience.
delete from public.experience_themes et
using public.experiences e,public.themes t
where et.experience_id=e.id
  and et.theme_id=t.id
  and e.slug in (
    'sri-lanka-international-cricket-matchday',
    'cricket-with-local-players',
    'colombo-royal-golf-private-round',
    'victoria-golf-country-resort-experience',
    'nuwara-eliya-golf-club-experience',
    'shangri-la-hambantota-golf-experience',
    'horse-riding-in-nuwara-eliya',
    'private-colombo-sport-fishing-charter'
  )
  and t.slug<>'sporting';

do $$
declare missing_sporting integer; cross_theme_count integer;
begin
  select count(*) into missing_sporting
  from public.experiences e
  where e.slug in (
    'sri-lanka-international-cricket-matchday','cricket-with-local-players',
    'colombo-royal-golf-private-round','victoria-golf-country-resort-experience',
    'nuwara-eliya-golf-club-experience','shangri-la-hambantota-golf-experience',
    'horse-riding-in-nuwara-eliya','private-colombo-sport-fishing-charter'
  ) and not exists (
    select 1 from public.experience_themes et join public.themes t on t.id=et.theme_id
    where et.experience_id=e.id and t.slug='sporting'
  );

  select count(*) into cross_theme_count
  from public.experience_themes et
  join public.experiences e on e.id=et.experience_id
  join public.themes t on t.id=et.theme_id
  where e.slug in (
    'sri-lanka-international-cricket-matchday','cricket-with-local-players',
    'colombo-royal-golf-private-round','victoria-golf-country-resort-experience',
    'nuwara-eliya-golf-club-experience','shangri-la-hambantota-golf-experience',
    'horse-riding-in-nuwara-eliya','private-colombo-sport-fishing-charter'
  ) and t.slug<>'sporting';

  if missing_sporting<>0 or cross_theme_count<>0 then
    raise exception 'Sporting ownership validation failed: missing %, cross-theme %',missing_sporting,cross_theme_count;
  end if;
end $$;

commit;
