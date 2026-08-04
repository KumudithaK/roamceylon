begin;

update public.experiences
set
  hero_image_url='https://images.pexels.com/photos/29068270/pexels-photo-29068270.jpeg?auto=compress&cs=tinysrgb&w=1400',
  image_alt='A small passenger boat moving through calm tropical mangrove water',
  gallery='[
    "https://images.pexels.com/photos/29068270/pexels-photo-29068270.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/30288082/pexels-photo-30288082.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/13791362/pexels-photo-13791362.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/2647722/pexels-photo-2647722.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/3217969/pexels-photo-3217969.jpeg?auto=compress&cs=tinysrgb&w=1400"
  ]'::jsonb,
  gallery_alt_texts='[
    "Passenger boat travelling through calm tropical mangrove water",
    "Guided boat journey beneath a dense mangrove canopy",
    "Traditional boat moving along a mangrove-lined waterway",
    "Aerial view of a boat navigating a tropical mangrove river",
    "Working boats resting on calm water beside mangrove habitat"
  ]'::jsonb,
  image_source='Pexels temporary editorial set — exact Gangewadiya photography required for final visual approval',
  image_credit='Shivansh Sharma / Umar Andrabi / Nandhu Kumar / Tom Fisk via Pexels; verify and replace in CMS',
  image_status='needs_review',
  needs_image_review=true,
  image_review_notes=concat_ws(E'\n',nullif(image_review_notes,''),'Published with a clearly relevant royalty-free tropical mangrove placeholder set at the administrator’s request. Replace with verified Gangewadiya imagery and final credits before launch.'),
  status='published',
  active=true,
  updated_at=now()
where slug='kalpitiya-gangewadiya-mangrove-fishing-village-boat-journey';

update public.experiences
set
  hero_image_url='https://images.pexels.com/photos/28961799/pexels-photo-28961799.jpeg?auto=compress&cs=tinysrgb&w=1400',
  image_alt='A guided kayak journey through calm tropical backwaters and palms',
  gallery='[
    "https://images.pexels.com/photos/28961799/pexels-photo-28961799.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/14410853/pexels-photo-14410853.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/12802694/pexels-photo-12802694.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/7508151/pexels-photo-7508151.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/11214435/pexels-photo-11214435.jpeg?auto=compress&cs=tinysrgb&w=1400"
  ]'::jsonb,
  gallery_alt_texts='[
    "Kayaker paddling through calm tropical backwaters and palms",
    "Small group paddling on a tranquil green-edged waterway",
    "Two kayakers crossing calm coastal water",
    "Paddler wearing safety equipment on sheltered water",
    "Solo kayaker moving across calm water in the early light"
  ]'::jsonb,
  image_source='Pexels temporary editorial set — exact Kalpitiya lagoon-kayaking photography required for final visual approval',
  image_credit='K S Aravinda Kashyap / Duc Nguyen / Robert So / Manik Mandal / Maksim Karpiuk via Pexels; verify and replace in CMS',
  image_status='needs_review',
  needs_image_review=true,
  image_review_notes=concat_ws(E'\n',nullif(image_review_notes,''),'Published with a clearly relevant royalty-free tropical kayaking placeholder set at the administrator’s request. Replace with verified Kalpitiya Lagoon imagery and final credits before launch.'),
  status='published',
  active=true,
  updated_at=now()
where slug='kalpitiya-private-lagoon-kayak-mangrove-journey';

do $$
declare
  published_count integer;
begin
  select count(*) into published_count
  from public.experiences
  where slug in (
    'kalpitiya-gangewadiya-mangrove-fishing-village-boat-journey',
    'kalpitiya-private-lagoon-kayak-mangrove-journey'
  )
    and status='published'
    and active
    and image_status='needs_review'
    and needs_image_review
    and nullif(hero_image_url,'') is not null
    and nullif(image_alt,'') is not null
    and jsonb_array_length(gallery)=5
    and jsonb_array_length(gallery_alt_texts)=5;

  if published_count<>2 then
    raise exception 'Kalpitiya lagoon publication failed: % of 2 records are publication-ready',published_count;
  end if;

  raise notice 'Published both new Kalpitiya lagoon experiences with five-image temporary Pexels sets; final destination-specific image review remains open.';
end $$;

commit;
