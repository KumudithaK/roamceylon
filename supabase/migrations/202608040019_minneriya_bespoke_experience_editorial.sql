begin;

create temporary table minneriya_editorial as
select * from jsonb_to_recordset($content$[
  {
    "slug":"minneriya-witnessing-the-elephant-gathering-hundreds-of-wild-elephants-congregate",
    "name":"Minneriya Elephant Gathering Safari",
    "category":"Wildlife",
    "short":"Enter Minneriya with a responsible private jeep team to search for wild elephants around the ancient reservoir, treating the celebrated Gathering as a seasonal possibility—not a guaranteed spectacle.",
    "story":"Minneriya’s dry-season Elephant Gathering is one of Sri Lanka’s signature wildlife phenomena. As the reservoir recedes, fresh grass can draw family groups from the connected forest landscape into the open tank bed, creating an unusual opportunity to observe social behaviour, feeding and movement. The scale changes every year and every day. Rainfall, water management, forage and disturbance influence whether elephants remain in Minneriya or move through the protected corridor towards Kaudulla and the wider Hurulu landscape.\n\nA premium safari begins with current field information, not a promise of ‘hundreds’. Roam Ceylon confirms Minneriya as the booked park, the licensed jeep, entrance category and naturalist arrangement before departure. If recent elephant movement suggests a different protected area, the traveller receives that recommendation before tickets are purchased; no park is silently substituted. Inside Minneriya, the driver keeps distance, avoids surrounding animals and never blocks an elephant’s path for a photograph. The reservoir, forest edge, birds and other wildlife remain part of the experience even when elephant numbers are modest.",
    "duration":"Approximately 3–4 hours inside the safari programme, plus transfers and park-entry procedures",
    "difficulty":"Easy physically, with rough jeep tracks, dust, heat and prolonged vehicle seating",
    "season":"The Gathering is most associated with the dry-season window, broadly July–October; elephants and park conditions must be checked close to travel",
    "highlights":["The possibility of observing wild elephant families beside Minneriya Reservoir","Dry-season grasslands created as reservoir water recedes","Social behaviour interpreted without crowding or pursuit","A protected landscape connecting Minneriya with Kaudulla and Hurulu","Birds, reptiles and dry-zone habitat beyond the headline elephant sighting"],
    "unique":["The Gathering is among Sri Lanka’s most recognisable natural events","Elephants move across a connected landscape rather than belonging to one safari zone","Current field information determines whether Minneriya is the responsible recommendation","A quieter, well-positioned observation is valued above racing between sightings"],
    "included":["Private licensed safari jeep and experienced driver","Minneriya National Park entrance arrangements stated in the proposal","Naturalist or specialist guide only when explicitly included","Roam Ceylon park, timing and transfer coordination"],
    "know":["No elephant number, close approach or other wildlife sighting is guaranteed.","The Gathering’s timing and scale vary with rainfall, reservoir level and elephant movement.","Kaudulla or Hurulu is offered only as a transparent alternative before ticketing, never as an undisclosed substitute.","Standing, feeding wildlife, leaving the vehicle or pressuring a driver to approach closely is unacceptable."],
    "nearby":["Kaudulla National Park","Sigiriya","Polonnaruwa","Habarana"],
    "tips":["Choose the park using current naturalist information rather than an old seasonal calendar alone.","Bring binoculars, neutral clothing and a dust-protected camera.","Keep voices low and allow elephants to choose their own distance.","Avoid making the success of the safari depend on a specific herd size."],
    "badges":["Signature Experience","Wildlife","Seasonal","Family Friendly","Advance Booking Recommended","Roam Ceylon Recommended"],
    "themes":["wildlife","nature"]
  },
  {
    "slug":"minneriya-observing-large-flocks-of-waterbirds-including-painted-storks-and-pelica",
    "name":"Minneriya Reservoir Birding Safari",
    "category":"Nature",
    "short":"Explore Minneriya’s reservoir margins and dry-zone forest with a bird-focused naturalist, reading water level, season and habitat rather than chasing a fixed species checklist.",
    "story":"Minneriya is more than an elephant destination. The ancient reservoir, exposed margins, grassland, scrub and dry-mixed evergreen forest create varied feeding and roosting opportunities for resident and seasonal birds. Painted storks, pelicans and other waterbirds may gather when water and food conditions suit them, while raptors, kingfishers, bee-eaters and forest species broaden the search away from the open tank. Flock size and species composition change continuously and should never be guaranteed from a previous season’s photograph.\n\nThis private safari uses a slower birding pace and a guide who can work with calls, behaviour and habitat. The jeep does not cut across elephant traffic or crowd a sighting simply to reach a bird. Early or later light can improve comfort and observation, but park access and current conditions determine the final route. Playback is avoided around sensitive or breeding birds, nests are never approached, and the guide keeps enough distance for feeding and resting behaviour to continue naturally.",
    "duration":"Approximately 3–4 hours, with departure selected around park access and current bird activity",
    "difficulty":"Easy physically, with rough jeep tracks, heat, dust and extended quiet observation",
    "season":"Year-round; water level, migration, rainfall and time of day change the strongest birding areas",
    "highlights":["Waterbirds using the changing margins of Minneriya Reservoir","Raptors, bee-eaters, kingfishers and dry-zone forest species","Habitat-led interpretation rather than a guaranteed checklist","Patient observation from a responsibly positioned private jeep","The reservoir’s ecological role beyond the Elephant Gathering"],
    "unique":["Birding reveals Minneriya as a multi-habitat protected area","Changing reservoir levels create a different field experience through the year","A specialist pace remains distinct from the headline elephant safari","Ethical distance and quiet observation improve both interpretation and welfare"],
    "included":["Private licensed safari jeep and driver","Bird-focused naturalist when specified","Minneriya National Park entrance arrangements stated in the proposal","Roam Ceylon timing and transfer coordination"],
    "know":["No species, flock size or photographic distance is guaranteed.","Park routes can change with weather, maintenance, wildlife movement and official management.","Playback and nest approach are avoided, particularly during breeding activity.","Elephants and other large wildlife may affect the planned birding route."],
    "nearby":["Kaudulla National Park","Giritale Reservoir","Polonnaruwa","Habarana"],
    "tips":["Bring binoculars and tell us if a specialist spotting scope is important.","Wear muted colours and keep conversation low near feeding birds.","Protect optics from dust and sudden showers.","Share target interests as preferences, not demands for guaranteed species."],
    "badges":["Wildlife","Eco Experience","Photography Spot","Private Option Available","Roam Ceylon Recommended"],
    "themes":["wildlife","nature"]
  }
]$content$::jsonb) as x(slug text,name text,category text,short text,story text,duration text,difficulty text,season text,highlights jsonb,"unique" jsonb,included jsonb,know jsonb,nearby jsonb,tips jsonb,badges jsonb,themes jsonb);

update public.experiences e set
  name=x.name,category=x.category,short_description=x.short,full_description=x.story,
  duration=x.duration,difficulty=x.difficulty,best_season=x.season,highlights=x.highlights,
  unique_points=x."unique",included=x.included,things_to_know=x.know,
  nearby_attractions=x.nearby,traveller_tips=x.tips,badges=x.badges,
  seo_title=x.name || ' | Roam Ceylon',seo_description=x.short,
  status='published',active=true,updated_at=now()
from minneriya_editorial x where e.slug=x.slug;

update public.experiences
set status='archived',active=false,
  image_review_notes=concat_ws(E'\n',nullif(image_review_notes,''),'Archived as a duplicate: the open-top reservoir jeep drive is now the complete Minneriya Elephant Gathering Safari. Historical record and pricing data remain intact.'),
  updated_at=now()
where slug='minneriya-open-top-jeep-safaris-around-minneriya-reservoir';

delete from public.experience_destinations ed using minneriya_editorial x
where ed.experience_id=(select id from public.experiences where slug=x.slug);

insert into public.experience_destinations(experience_id,destination_id)
select e.id,d.id from minneriya_editorial x
join public.experiences e on e.slug=x.slug
join public.destinations d on d.slug='minneriya'
on conflict do nothing;

delete from public.experience_themes et using minneriya_editorial x
where et.experience_id=(select id from public.experiences where slug=x.slug);

insert into public.experience_themes(experience_id,theme_id)
select e.id,t.id from minneriya_editorial x
cross join lateral jsonb_array_elements_text(x.themes) theme(slug)
join public.experiences e on e.slug=x.slug
join public.themes t on t.slug=theme.slug
on conflict do nothing;

insert into public.theme_destinations(theme_id,destination_id)
select t.id,d.id from public.themes t
join public.destinations d on d.slug='minneriya'
where t.slug in ('wildlife','nature')
on conflict do nothing;

do $$
declare content_count integer; destination_count integer; theme_count integer; archived_count integer;
begin
  select count(*) into content_count from public.experiences e
  join minneriya_editorial x on x.slug=e.slug
  where e.status='published' and e.active and length(e.full_description)>900
    and e.duration is not null and e.difficulty is not null;

  select count(distinct ed.experience_id) into destination_count
  from public.experience_destinations ed
  join public.experiences e on e.id=ed.experience_id
  join public.destinations d on d.id=ed.destination_id
  join minneriya_editorial x on x.slug=e.slug where d.slug='minneriya';

  select count(distinct et.experience_id) into theme_count
  from public.experience_themes et
  join public.experiences e on e.id=et.experience_id
  join minneriya_editorial x on x.slug=e.slug;

  select count(*) into archived_count from public.experiences
  where slug='minneriya-open-top-jeep-safaris-around-minneriya-reservoir'
    and status='archived' and not active;

  if content_count<>2 or destination_count<>2 or theme_count<>2 or archived_count<>1 then
    raise exception 'Minneriya validation failed: content %, destination %, themes %, archived %',content_count,destination_count,theme_count,archived_count;
  end if;
  raise notice 'Minneriya result: 2 distinct bespoke wildlife experiences published; duplicate reservoir jeep record archived; imagery and pricing preserved.';
end $$;

commit;
