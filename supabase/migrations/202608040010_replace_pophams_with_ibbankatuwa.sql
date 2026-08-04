begin;

update public.experiences
set
  slug='dambulla-ibbankatuwa-megalithic-burial-ground-guided-heritage-visit',
  name='Ibbankatuwa Megalithic Burial Ground',
  category='History',
  short_description='Walk through Ibbankatuwa’s protected stone-cist cemetery with considered interpretation of the communities, burial traditions and material culture that preceded Sri Lanka’s written historical kingdoms.',
  full_description=$copy$Ibbankatuwa introduces a chapter of Sri Lankan history that is easily overlooked beside Dambulla’s monumental Buddhist heritage. Set close to Ibbankatuwa Wewa, the protected archaeological landscape contains clusters of rectangular stone-cist burials built from upright slabs and, in some cases, covered by capstones. Excavation has revealed pottery, beads, metal objects and other grave goods that help archaeologists examine life, exchange and funerary practice during the island’s protohistoric period.

The experience is deliberately quiet. There is no towering monument or theatrical reconstruction; the value comes from learning how to read the arrangement of graves and understanding why the cemetery matters within the wider settlement landscape. A knowledgeable guide is strongly preferred because visible stone alone cannot communicate excavation context, dating or the limits of what researchers can responsibly conclude. Roam Ceylon confirms access and interpretation rather than presenting the site as a casual roadside photo stop.$copy$,
  duration='Approximately 1–1.5 hours; allow longer when specialist interpretation is arranged',
  difficulty='Easy, with exposed ground and some uneven walking surfaces',
  best_season='Year-round; morning or later afternoon is more comfortable in the dry-zone heat',
  highlights='["Clusters of stone-cist burials within a protected archaeological landscape","A rare introduction to Sri Lanka’s protohistoric communities","Material evidence including pottery, beads and metal objects explained through excavation context","The relationship between cemetery, settlement and the surrounding Dambulla landscape","A calm heritage experience away from the region’s busiest monuments"]'::jsonb,
  unique_points='["The site expands Dambulla’s story beyond royal and Buddhist monuments","Its archaeological value lies in burial organisation and material evidence rather than monumental scale","Interpretation connects prehistory with the emergence of Sri Lanka’s historical period","The visit rewards careful observation and evidence-led storytelling"]'::jsonb,
  included='["Current access confirmation","Knowledgeable heritage guide when specified","Roam Ceylon timing and transport coordination","Entrance fees only when explicitly listed in the proposal"]'::jsonb,
  things_to_know='["This is a protected mortuary and archaeological landscape and must be treated respectfully.","Do not enter grave structures, move stones, collect objects or step onto exposed archaeological features.","Interpretive facilities and opening arrangements can change and should be reconfirmed.","Some archaeological dates and interpretations remain subject to continuing research."]'::jsonb,
  nearby_attractions='["Dambulla Cave Temple","Ibbankatuwa Wewa","Sigiriya","Nalanda Gedige"]'::jsonb,
  traveller_tips='["Visit with a guide who can distinguish archaeological evidence from speculation.","Wear sun protection and closed shoes for exposed, uneven ground.","Move slowly and look at the relationship between separate grave clusters.","Pair the visit with Dambulla Cave Temple to compare two very different layers of Sri Lankan heritage."]'::jsonb,
  badges='["Cultural Heritage","Easy Walk","Roam Ceylon Recommended"]'::jsonb,
  seo_title='Ibbankatuwa Megalithic Burial Ground | Roam Ceylon',
  seo_description='Explore Ibbankatuwa’s protected protohistoric stone-cist cemetery near Dambulla with careful, evidence-led archaeological interpretation.',
  image_status='needs_review',
  needs_image_review=true,
  image_review_notes=concat_ws(E'\n',nullif(image_review_notes,''),'Replace the former Popham’s Arboretum hero and gallery with verified Ibbankatuwa Megalithic Burial Ground imagery before final visual approval.'),
  status='published',
  active=true,
  updated_at=now()
where slug='dambulla-nature-walks-through-pophams-arboretum-dry-zone-flora-and-fauna';

delete from public.experience_themes
where experience_id=(
  select id
  from public.experiences
  where slug='dambulla-ibbankatuwa-megalithic-burial-ground-guided-heritage-visit'
);

insert into public.experience_themes(experience_id,theme_id)
select e.id,t.id
from public.experiences e
join public.themes t on t.slug in ('heritage','culture')
where e.slug='dambulla-ibbankatuwa-megalithic-burial-ground-guided-heritage-visit'
on conflict do nothing;

insert into public.theme_destinations(theme_id,destination_id)
select t.id,d.id
from public.themes t
join public.destinations d on d.slug='dambulla'
where t.slug in ('heritage','culture')
on conflict do nothing;

do $$
declare
  replacement_count integer;
  old_count integer;
  destination_count integer;
  theme_count integer;
begin
  select count(*) into replacement_count
  from public.experiences
  where slug='dambulla-ibbankatuwa-megalithic-burial-ground-guided-heritage-visit'
    and status='published'
    and active
    and image_status='needs_review'
    and needs_image_review
    and length(full_description)>700;

  select count(*) into old_count
  from public.experiences
  where slug='dambulla-nature-walks-through-pophams-arboretum-dry-zone-flora-and-fauna';

  select count(*) into destination_count
  from public.experience_destinations ed
  join public.experiences e on e.id=ed.experience_id
  join public.destinations d on d.id=ed.destination_id
  where e.slug='dambulla-ibbankatuwa-megalithic-burial-ground-guided-heritage-visit'
    and d.slug='dambulla';

  select count(*) into theme_count
  from public.experience_themes et
  join public.experiences e on e.id=et.experience_id
  where e.slug='dambulla-ibbankatuwa-megalithic-burial-ground-guided-heritage-visit';

  if replacement_count<>1 or old_count<>0 or destination_count<>1 or theme_count<>2 then
    raise exception 'Ibbankatuwa replacement failed: replacement %, old %, destination %, themes %',replacement_count,old_count,destination_count,theme_count;
  end if;

  raise notice 'Ibbankatuwa replaced Popham’s Arboretum in place; identity and pricing preserved; imagery flagged for replacement.';
end $$;

commit;
