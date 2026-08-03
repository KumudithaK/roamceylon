begin;

-- Bespoke editorial pass for Kitulgala. Image and gallery fields are deliberately
-- untouched so administrator-curated photography remains authoritative.
update public.experiences set
  category='Adventure',
  short_description='Paddle the Kelani River through a lively sequence of Grade II and III rapids, with rainforest on both banks and a trained river crew setting the pace.',
  full_description=$copy$Kitulgala's identity is inseparable from the Kelani River. On the standard commercial run, calm water used for instruction gives way to a succession of Grade II and III rapids, where coordinated paddling matters more than previous rafting experience. Between the faster sections, the river opens into quieter reaches beneath dense wet-zone forest.

This is an adventure that should feel well managed rather than improvised. The selected operator confirms water conditions, fits helmets and buoyancy aids, explains commands and decides whether the river is suitable on the day. Roam Ceylon places the run carefully within the wider route, leaving time to change, recover and enjoy Kitulgala beyond the raft.$copy$,
  duration='Approximately 1.5–3 hours, depending on route and river conditions',
  difficulty=null,
  best_season='Operates across much of the year; every departure remains subject to safe river levels and weather',
  highlights=jsonb_build_array(
    'A guided run through the Kelani River''s established Grade II and III rafting section',
    'Rainforest views alternating with rapids, eddies and calmer water',
    'Practical paddle instruction and a full safety briefing before launch',
    'Teamwork through the river''s more energetic sections',
    'A natural fit between Colombo, Kandy and Sri Lanka''s central highlands'
  ),
  unique_points=jsonb_build_array(
    'Kitulgala is Sri Lanka''s best-established white-water base, with the river shaping the entire destination',
    'The standard route balances approachable rapids with a genuine sense of moving through wet-zone wilderness',
    'Water level changes the character of every run, so local river judgement remains essential',
    'The experience can stand alone or anchor a fuller day of rainforest and canyon activities'
  ),
  included=jsonb_build_array(
    'Raft, paddle, helmet and correctly fitted buoyancy aid',
    'Qualified river guide and pre-departure safety briefing',
    'Local transfers between the operating base, launch and take-out when specified',
    'Roam Ceylon timing and supplier coordination',
    'Only the refreshments, changing facilities or photographs explicitly confirmed in the proposal'
  ),
  things_to_know=jsonb_build_array(
    'The operator has final authority to alter or cancel a run when rainfall, river level or visibility is unsafe.',
    'Minimum age, swimming requirements and medical restrictions vary by operator and must be confirmed before booking.',
    'Pregnancy and certain heart, back, neck or mobility conditions may make rafting unsuitable.',
    'Do not carry loose valuables on the river; secure storage and waterproofing differ between operating bases.'
  ),
  nearby_attractions=jsonb_build_array('Makandawa Forest Reserve','Beli Lena prehistoric cave','Kitulgala film-location riverbank','Sandun Ella waterfall'),
  traveller_tips=jsonb_build_array(
    'Wear secure footwear and quick-drying clothes rather than flip-flops.',
    'Bring a dry change of clothes and leave jewellery and unnecessary electronics behind.',
    'Listen closely during the paddle demonstration; coordinated responses make the run safer and more enjoyable.',
    'Allow unhurried time after rafting instead of scheduling an immediate long transfer.'
  ),
  badges=jsonb_build_array('Adventure','Water Activity','Advance Booking Recommended','Most Popular','Roam Ceylon Recommended'),
  seo_title='White-Water Rafting on the Kelani River | Roam Ceylon',
  seo_description='A professionally guided Grade II and III white-water rafting journey through Kitulgala''s rainforest-lined Kelani River.',
  status='published',active=true,updated_at=now()
where slug='kitulgala-white-water-rafting-on-the-kelani-river-grade-2-3-rapids';

update public.experiences set
  category='History',
  short_description='Walk through Kitulgala''s wet-zone forest to Beli Lena, a vast rock shelter whose archaeological layers preserve an exceptional record of Sri Lanka''s prehistoric life.',
  full_description=$copy$Beli Lena is more than a cave at the end of a forest walk. Archaeological excavation has revealed a long sequence of human occupation extending deep into Sri Lanka's prehistory, including evidence associated with the island's Balangoda culture. The scale of the shelter becomes apparent only on arrival, when its high overhang frames the wooded Kelani Valley below.

The approach is part of the experience: humid forest, village paths, uneven ground and changing weather slow the journey to an appropriate pace. A knowledgeable guide helps distinguish verified archaeological context from local legend and explains why caves such as Beli Lena transformed understanding of human adaptation in tropical South Asia. Nothing should be removed or disturbed; this remains a protected archaeological place rather than an adventure playground.$copy$,
  duration='Approximately half a day, depending on trail access and walking pace',
  difficulty=null,
  best_season='Best in comparatively settled weather; the trail can become slippery after heavy rain',
  highlights=jsonb_build_array(
    'A forest approach to one of Sri Lanka''s most important prehistoric rock shelters',
    'Archaeological context spanning Late Pleistocene and later occupation',
    'The immense natural overhang and elevated view across the surrounding wet zone',
    'A chance to understand Balangoda culture beyond museum displays',
    'Quiet walking through the rural landscape above Kitulgala'
  ),
  unique_points=jsonb_build_array(
    'Few Sri Lankan experiences connect an active forest walk with archaeological evidence of such depth',
    'The cave is interpreted as a lived prehistoric environment, not simply a geological formation',
    'Its archaeological sequence contributes to the wider story of early modern humans in tropical South Asia',
    'The journey rewards travellers who value evidence, landscape and patient interpretation'
  ),
  included=jsonb_build_array(
    'Locally informed guide for the confirmed trail',
    'Roam Ceylon access and timing coordination',
    'Archaeological and cultural context briefing',
    'Only entrance arrangements or refreshments explicitly listed in the proposal'
  ),
  things_to_know=jsonb_build_array(
    'Trail conditions vary and may include mud, roots, steep sections and stream crossings.',
    'Beli Lena is an archaeological site: never touch deposits, climb sensitive surfaces or remove natural or cultural material.',
    'Leeches and sudden rain are normal wet-zone conditions, particularly after rainfall.',
    'Claims about dates and discoveries should be interpreted through archaeological evidence rather than repeated folklore.'
  ),
  nearby_attractions=jsonb_build_array('Makandawa Forest Reserve','Kelani River','Sandun Ella waterfall','Kitulgala film-location riverbank'),
  traveller_tips=jsonb_build_array(
    'Wear closed shoes with dependable grip and carry a light rain layer.',
    'Use long, lightweight trousers and bring leech protection in wet conditions.',
    'Carry drinking water but take every item of waste back with you.',
    'Ask the guide to separate archaeological findings, current research and local oral tradition.'
  ),
  badges=jsonb_build_array('Cultural Heritage','Adventure','Eco Experience','Advance Booking Recommended','Roam Ceylon Recommended'),
  seo_title='Beli Lena Prehistoric Cave Walk | Roam Ceylon',
  seo_description='A guided forest walk to Kitulgala''s Beli Lena rock shelter, interpreted through its important prehistoric archaeological record.',
  status='published',active=true,updated_at=now()
where slug='kitulgala-prehistoric-beli-lena-cave-exploration-and-archaeological-trekking';

update public.experiences set
  category='Adventure',
  short_description='Approach Sandun Ella through Kitulgala''s green interior, then descend beside the falling water under the control of a specialist rope team.',
  full_description=$copy$Sandun Ella turns a rainforest waterfall into a vertical journey. After the approach and equipment fitting, the rope team explains body position, braking and communication before each participant moves onto the descent. Water, rock and height create the drama, but the quality of the experience depends on calm instruction and careful management at the top and base of the falls.

Operators use different sections and describe different descent lengths, so Roam Ceylon does not sell a generic measurement or promise a fixed route. The exact waterfall section, equipment, transfer, age requirement and operating window must be confirmed with the selected specialist. Heavy rain can change flow quickly; the guide's decision always takes precedence over the itinerary.$copy$,
  duration='Approximately 2–4 hours; route and transfer dependent',
  difficulty=null,
  best_season='Potentially year-round, subject to rainfall, water flow and the rope team''s safety assessment',
  highlights=jsonb_build_array(
    'A controlled rope descent in the spray and sound of Sandun Ella',
    'A forest approach that builds gradually towards the waterfall',
    'Close instruction on equipment, body position and descent technique',
    'A powerful perspective on Kitulgala''s water-shaped landscape',
    'Small-group pacing governed by the specialist team rather than a rushed timetable'
  ),
  unique_points=jsonb_build_array(
    'The waterfall is experienced vertically rather than watched from a viewpoint',
    'Changing flow means every safe descent has a different texture and intensity',
    'Confidence is built through instruction and controlled movement, not manufactured bravado',
    'It pairs naturally with Beli Lena or other Kitulgala adventures when conditions allow'
  ),
  included=jsonb_build_array(
    'Helmet, harness, ropes and technical equipment specified by the operator',
    'Specialist rope guides and full activity briefing',
    'Local activity transfers when specified by the selected operator',
    'Roam Ceylon supplier and timing coordination',
    'Only insurance, refreshments or photographs explicitly confirmed in the proposal'
  ),
  things_to_know=jsonb_build_array(
    'The specialist guide may suspend the activity when flow, weather, rock conditions or visibility are unsafe.',
    'Minimum age, maximum weight and health restrictions vary by route and operator.',
    'Participants must be comfortable following instructions at height and should disclose relevant medical conditions.',
    'Published descent measurements differ between operators; the confirmed proposal identifies the actual route being sold.'
  ),
  nearby_attractions=jsonb_build_array('Beli Lena prehistoric cave','Makandawa Forest Reserve','Kelani River rafting','Kitulgala village'),
  traveller_tips=jsonb_build_array(
    'Wear secure water shoes or strapped footwear and quick-drying clothing.',
    'Bring a complete change of clothes and protect medication from water.',
    'Do not attach a camera unless the rope team approves the mounting method.',
    'Keep the remainder of the day flexible in case water conditions change the operating time.'
  ),
  badges=jsonb_build_array('Adventure','Water Activity','Advance Booking Recommended'),
  seo_title='Sandun Ella Waterfall Abseiling | Roam Ceylon',
  seo_description='A specialist-guided waterfall abseiling experience at Sandun Ella in Kitulgala, subject to safe water and weather conditions.',
  status='published',active=true,updated_at=now()
where slug='kitulgala-sandun-ella-waterfall-abseiling-and-rappelling';

update public.experiences set
  category='Adventure',
  short_description='Follow a rainforest stream through rock pools, natural slides and carefully selected confidence jumps on a specialist-led Kitulgala canyon journey.',
  full_description=$copy$Kitulgala's smaller waterways offer a more intimate form of adventure than the broad Kelani River. Canyoning combines walking, scrambling, wading and swimming as the route follows a forest stream through sculpted rock and clear natural pools. Slides and confidence jumps may form part of the journey, but only where the guide has checked depth, flow and the participant's comfort.

The experience is deliberately progressive. A capable team introduces each movement, explains how to enter the water and provides an alternative when a feature is unsuitable. Rainfall upstream can transform a gentle channel rapidly, so the confirmed route is always conditional. Roam Ceylon treats flexibility as part of responsible planning, not as a reduction in value.$copy$,
  duration='Approximately half a day; chosen canyon and water conditions determine timing',
  difficulty=null,
  best_season='Subject to safe rainfall and stream flow; the operator confirms the route on the day',
  highlights=jsonb_build_array(
    'Moving through a living rainforest stream by foot and in the water',
    'Natural rock slides and pools selected after a guide safety check',
    'Progressive confidence challenges rather than compulsory high jumps',
    'A close, sensory encounter with Kitulgala''s wet-zone landscape',
    'Specialist instruction adapted to the group and current conditions'
  ),
  unique_points=jsonb_build_array(
    'The stream itself becomes the trail, changing how the forest is experienced',
    'Every feature is conditional on depth, current and the guide''s inspection',
    'Participants can build confidence without being pressured into an unsuitable jump',
    'The combination of scrambling, swimming and natural movement differs from a fixed adventure course'
  ),
  included=jsonb_build_array(
    'Helmet, buoyancy aid and specialist safety equipment required for the confirmed route',
    'Qualified canyon guide and activity briefing',
    'Local transfers where specified by the operator',
    'Roam Ceylon supplier and timing coordination'
  ),
  things_to_know=jsonb_build_array(
    'Canyon routes can close at short notice after rainfall or when upstream flow changes.',
    'Jumping is never guaranteed and should never be compulsory; the guide confirms safe alternatives.',
    'Participants need confidence moving over wet, uneven rock and entering natural water.',
    'Age, swimming ability and medical restrictions must be confirmed for the selected route.'
  ),
  nearby_attractions=jsonb_build_array('Kelani River rafting','Makandawa Forest Reserve','Sandun Ella waterfall','Beli Lena prehistoric cave'),
  traveller_tips=jsonb_build_array(
    'Choose footwear with strong wet-rock grip and secure fastenings.',
    'Wear close-fitting quick-dry clothing that will not snag while scrambling.',
    'Leave valuables at the operating base and use only guide-approved camera attachments.',
    'Tell the guide honestly about swimming confidence and previous injuries.'
  ),
  badges=jsonb_build_array('Adventure','Water Activity','Advance Booking Recommended'),
  seo_title='Rainforest Canyoning in Kitulgala | Roam Ceylon',
  seo_description='A specialist-led canyoning journey through Kitulgala''s rainforest streams, natural pools, slides and condition-dependent confidence jumps.',
  status='published',active=true,updated_at=now()
where slug='kitulgala-canyoning-stream-tracking-and-confidence-cliff-jumping';

update public.experiences set
  name='Makandawa Rainforest Walk & Endemic Birdwatching',
  category='Wildlife',
  short_description='Enter Kitulgala''s wet-zone forest with a local naturalist, listening for endemic birds and reading the smaller details of a richly layered rainforest.',
  full_description=$copy$Makandawa rewards a different pace from Kitulgala's river adventures. Beneath the wet-zone canopy, visibility is often limited and sound becomes the first guide: a call moving through the trees, wingbeats above a stream or a mixed feeding flock passing through several layers of foliage. Species may include Sri Lanka endemics, but sightings can never be scheduled.

An early start and a guide who recognises calls make the greatest difference. The walk is as much about habitat as a bird list—ferns, palms, amphibians, insects and the forest's relationship with the Kelani catchment all add context. Roam Ceylon favours quiet, low-impact visits and avoids playback or behaviour that places pressure on wildlife.$copy$,
  duration='Approximately 2–4 hours; specialist birding walks may be longer',
  difficulty=null,
  best_season='Year-round wet-zone forest; early morning is generally the most rewarding birding period',
  highlights=jsonb_build_array(
    'Early-morning listening and observation beneath a dense wet-zone canopy',
    'A chance to encounter endemic and range-restricted Sri Lankan birds',
    'Naturalist interpretation of habitat, calls and mixed-species feeding activity',
    'Forest streams, amphibians, butterflies and plant life beyond the bird list',
    'A quiet ecological counterpoint to Kitulgala''s faster river experiences'
  ),
  unique_points=jsonb_build_array(
    'Makandawa places productive wet-zone birding close to Kitulgala''s established journey route',
    'Dense forest makes listening and local field knowledge as important as eyesight',
    'The experience values the whole habitat rather than presenting birds as guaranteed sightings',
    'It can be shaped for curious beginners or slower specialist observation'
  ),
  included=jsonb_build_array(
    'Local nature guide or specialist bird guide as stated in the proposal',
    'Roam Ceylon access and early-start coordination',
    'Habitat and responsible-wildlife briefing',
    'Only entrance arrangements or binocular provision explicitly confirmed in the proposal'
  ),
  things_to_know=jsonb_build_array(
    'Wildlife is free-ranging; no individual species or number of sightings can be guaranteed.',
    'Rain, humidity, leeches and slippery roots are normal features of this forest environment.',
    'Playback, flash and crowding can disturb birds and should be avoided.',
    'Trail length and accessibility must be matched to the traveller before confirmation.'
  ),
  nearby_attractions=jsonb_build_array('Kelani River','Beli Lena prehistoric cave','Kitulgala film-location riverbank','Sandun Ella waterfall'),
  traveller_tips=jsonb_build_array(
    'Start early, wear muted colours and keep conversation low.',
    'Bring binoculars, a rain cover and a lens cloth for humid conditions.',
    'Wear closed shoes and long lightweight trousers; carry leech protection after rain.',
    'Let the guide locate birds by call before moving or raising a camera.'
  ),
  badges=jsonb_build_array('Wildlife','Eco Experience','Photography Spot','Roam Ceylon Recommended'),
  seo_title='Makandawa Rainforest Birdwatching | Roam Ceylon',
  seo_description='A quiet naturalist-led walk through Makandawa''s wet-zone rainforest in search of endemic birds and the wider forest ecosystem.',
  status='published',active=true,updated_at=now()
where slug='kitulgala-makandawa-rainforest-hiking-and-canopy-canopy-bird-watching';

-- Rebuild relationships only for this researched batch.
delete from public.experience_destinations where experience_id in (
  select id from public.experiences where slug like 'kitulgala-%'
);
insert into public.experience_destinations(experience_id,destination_id)
select e.id,d.id from public.experiences e join public.destinations d on d.slug='kitulgala'
where e.slug in (
  'kitulgala-white-water-rafting-on-the-kelani-river-grade-2-3-rapids',
  'kitulgala-prehistoric-beli-lena-cave-exploration-and-archaeological-trekking',
  'kitulgala-sandun-ella-waterfall-abseiling-and-rappelling',
  'kitulgala-canyoning-stream-tracking-and-confidence-cliff-jumping',
  'kitulgala-makandawa-rainforest-hiking-and-canopy-canopy-bird-watching'
) on conflict do nothing;

delete from public.experience_themes where experience_id in (
  select id from public.experiences where slug like 'kitulgala-%'
);
insert into public.experience_themes(experience_id,theme_id)
select e.id,t.id from (values
  ('kitulgala-white-water-rafting-on-the-kelani-river-grade-2-3-rapids','adventure'),
  ('kitulgala-white-water-rafting-on-the-kelani-river-grade-2-3-rapids','nature'),
  ('kitulgala-prehistoric-beli-lena-cave-exploration-and-archaeological-trekking','heritage'),
  ('kitulgala-prehistoric-beli-lena-cave-exploration-and-archaeological-trekking','nature'),
  ('kitulgala-prehistoric-beli-lena-cave-exploration-and-archaeological-trekking','adventure'),
  ('kitulgala-sandun-ella-waterfall-abseiling-and-rappelling','adventure'),
  ('kitulgala-sandun-ella-waterfall-abseiling-and-rappelling','nature'),
  ('kitulgala-canyoning-stream-tracking-and-confidence-cliff-jumping','adventure'),
  ('kitulgala-canyoning-stream-tracking-and-confidence-cliff-jumping','nature'),
  ('kitulgala-makandawa-rainforest-hiking-and-canopy-canopy-bird-watching','wildlife'),
  ('kitulgala-makandawa-rainforest-hiking-and-canopy-canopy-bird-watching','nature')
) as mapping(experience_slug,theme_slug)
join public.experiences e on e.slug=mapping.experience_slug
join public.themes t on t.slug=mapping.theme_slug
on conflict do nothing;

insert into public.theme_destinations(theme_id,destination_id)
select t.id,d.id from (values ('adventure'),('nature'),('heritage'),('wildlife')) as wanted(theme_slug)
join public.themes t on t.slug=wanted.theme_slug
join public.destinations d on d.slug='kitulgala'
on conflict do nothing;

do $$
declare content_count integer; destination_count integer; theme_count integer;
begin
  select count(*) into content_count from public.experiences
  where slug like 'kitulgala-%' and status='published' and active
    and length(coalesce(full_description,''))>500
    and jsonb_array_length(highlights)>=5
    and jsonb_array_length(unique_points)>=4;
  select count(distinct ed.experience_id) into destination_count from public.experience_destinations ed
  join public.experiences e on e.id=ed.experience_id join public.destinations d on d.id=ed.destination_id
  where e.slug like 'kitulgala-%' and d.slug='kitulgala';
  select count(distinct et.experience_id) into theme_count from public.experience_themes et
  join public.experiences e on e.id=et.experience_id where e.slug like 'kitulgala-%';
  if content_count<>5 or destination_count<>5 or theme_count<>5 then
    raise exception 'Kitulgala editorial validation failed: content %, destination %, theme %',content_count,destination_count,theme_count;
  end if;
  raise notice 'Kitulgala editorial result: 5 bespoke records; all destination and theme mappings validated; image fields preserved.';
end $$;

commit;
