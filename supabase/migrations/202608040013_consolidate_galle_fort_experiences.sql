begin;

update public.experiences
set
  short_description='Read Galle Fort as a living UNESCO city through its ramparts, architecture, religious buildings, creative spaces and layered history, with the route shaped around your interests and preferred light.',
  full_description=full_description || E'\n\nContemporary art, independent design and adaptive reuse are interpreted within this same walk rather than sold as a third overlapping Fort product. When relevant venues are genuinely open, the guide can include a current gallery, studio or carefully adapted interior. Purchases remain optional, antique claims are never authenticated by Roam Ceylon, and private photography or access always requires permission.',
  highlights=highlights || '["Contemporary art, design and adaptive reuse considered within the historic urban fabric"]'::jsonb,
  unique_points=unique_points || '["One flexible private walk replaces overlapping architecture, shopping and sunset products"]'::jsonb,
  things_to_know=things_to_know || '["Gallery and studio inclusion depends on current exhibitions, opening hours and permission.","Roam Ceylon does not certify the origin, age or export legality of objects presented as antiques."]'::jsonb,
  traveller_tips=traveller_tips || '["Share whether architecture, maritime history, religion, contemporary art or design interests you most so the guide can shape one coherent route."]'::jsonb,
  updated_at=now()
where slug='galle-walking-tour-of-galle-dutch-fort-17th-century-unesco-fortified-living-ci';

update public.experiences
set
  status='archived',
  active=false,
  image_review_notes=concat_ws(E'\n',nullif(image_review_notes,''),'Archived as an overlapping Fort product. Art, architecture, design venues and adaptive reuse are now incorporated into the complete Private Galle Fort Living Heritage Walk.'),
  updated_at=now()
where slug='galle-exploring-boutique-art-galleries-antique-shops-and-colonial-architecture';

do $$
declare
  primary_count integer;
  sunset_count integer;
  design_count integer;
begin
  select count(*) into primary_count
  from public.experiences
  where slug='galle-walking-tour-of-galle-dutch-fort-17th-century-unesco-fortified-living-ci'
    and status='published'
    and active
    and length(full_description)>1500;

  select count(*) into sunset_count
  from public.experiences
  where slug='galle-sunset-walking-along-the-historic-galle-fort-ramparts-overlooking-the-oc'
    and status='archived'
    and not active;

  select count(*) into design_count
  from public.experiences
  where slug='galle-exploring-boutique-art-galleries-antique-shops-and-colonial-architecture'
    and status='archived'
    and not active;

  if primary_count<>1 or sunset_count<>1 or design_count<>1 then
    raise exception 'Galle Fort consolidation failed: primary %, sunset %, design %',primary_count,sunset_count,design_count;
  end if;

  raise notice 'Galle Fort corrected: 1 complete living-heritage experience remains public; sunset and art/design duplicates archived.';
end $$;

commit;
