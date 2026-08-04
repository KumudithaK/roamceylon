begin;

create temporary table kitulgala_editorial as
select * from jsonb_to_recordset($content$[
  {
    "slug":"kitulgala-white-water-rafting-on-the-kelani-river-grade-2-3-rapids",
    "name":"Kelani River White-Water Rafting",
    "category":"Adventure",
    "short":"Run Kitulgala’s best-known Kelani River rapids with a registered specialist team, combining a direct safety briefing, qualified raft guide and condition-led river plan.",
    "story":"The Kelani River gives Kitulgala its defining adventure. Forested banks narrow around a sequence of rapids commonly described in the moderate Grade 2–3 range, creating an accessible but genuine white-water experience when river level and release conditions are suitable. Names attached to individual rapids are colourful local shorthand, not a substitute for the guide’s assessment: the character of every run changes with rainfall, flow, obstacles and operating decisions.\n\nRoam Ceylon confirms the rafting company, guide qualifications, public-liability cover, personal equipment and emergency procedure before booking. Sri Lanka Tourism’s rafting guidance requires a direct safety briefing, helmets, flotation devices, rescue equipment, first aid and an operating procedure. Travellers practise paddle commands, defensive swimming and recovery before launching. The guide can shorten, relocate or cancel the run when water conditions, weather or participant readiness make the advertised route inappropriate.",
    "duration":"Approximately 2–3 hours including briefing, equipment fitting and river run",
    "difficulty":"Moderate; swimming confidence, active paddling and the ability to follow immediate safety commands are required",
    "season":"Operates only within safe river levels and weather; the most suitable window is confirmed by the selected operator",
    "highlights":["A sequence of moderate rapids through Kitulgala’s forested river corridor","Direct instruction in paddle commands and river safety","Team-based navigation led by a qualified raft guide","A route shaped by actual flow rather than a fixed marketing promise","Calmer sections that reveal the wider Kelani landscape"],
    "unique":["White-water rafting is Kitulgala’s signature adventure and the river is central to the destination","Changing water level makes professional local judgement essential","National operator guidance defines real equipment and rescue expectations","The experience can be rewarding for first-time rafters without understating risk"],
    "included":["Qualified raft guide and specialist operator","Raft, paddle, helmet and correctly fitted flotation device","Direct safety briefing, rescue support and first-aid provision","Roam Ceylon operator, timing and transfer coordination"],
    "know":["River level, rainfall or official advice can change or cancel the run.","Participants complete the operator’s medical and liability process before launching.","Pregnancy and certain cardiac, neurological, mobility or recent-injury conditions may prevent participation.","Loose items, phones and valuables should not be taken unless secured by the operator."],
    "nearby":["Makandawa Conservation Forest","Beli Lena","Kelani River rainforest corridor","Kitulgala village"],
    "tips":["Wear secure footwear and quick-drying clothing.","Listen closely to the guide’s commands rather than filming through rapids.","Share swimming ability and health information honestly.","Keep the programme flexible after heavy rain so safety—not schedule—sets the departure."],
    "badges":["Signature Experience","Adventure","Water Activity","Advance Booking Recommended","Roam Ceylon Recommended"],
    "themes":["adventure","nature"]
  },
  {
    "slug":"kitulgala-prehistoric-beli-lena-cave-exploration-and-archaeological-trekking",
    "name":"Beli Lena Prehistoric Cave Heritage Walk",
    "category":"History",
    "short":"Walk through wet-zone forest and village country to Beli Lena, where archaeological evidence opens a carefully interpreted window onto Sri Lanka’s prehistoric communities.",
    "story":"Beli Lena is one of the cave sites used by Sri Lankan archaeologists to understand human life in the island’s wet-zone landscape during prehistory. Excavation has contributed evidence connected with microlithic technology, food, burial and changing occupation. The importance lies not in a theatrical cave interior but in the relationship between shelter, forest resources, material remains and the questions researchers can responsibly answer from them.\n\nThe approach can involve village paths, inclines, mud, roots and stream crossings depending on weather and access. A knowledgeable guide distinguishes excavated evidence from folklore and avoids handling, collecting or inventing artefacts for visitors. The cave and surrounding ground are treated as a protected archaeological landscape. Roam Ceylon reconfirms current access, local permissions and route condition, particularly after rain, and never presents unverified dates or ‘Balangoda Man’ claims as a simple certainty.",
    "duration":"Approximately 3–5 hours including the approach, cave interpretation and return",
    "difficulty":"Moderate, with humid forest walking, inclines, mud and potentially slippery rock",
    "season":"Year-round only when trail, stream and slope conditions permit safe access; heavy rain may postpone the walk",
    "highlights":["A significant prehistoric cave within Sri Lanka’s wet-zone landscape","Evidence-led interpretation of shelter, tools, food and burial","A forest-and-village approach that restores the cave’s environmental context","Quiet observation without staged artefacts or exaggerated claims","Connection between modern archaeological research and the visible site"],
    "unique":["Beli Lena expands Kitulgala beyond adventure sport","The site’s value comes from scientific context rather than monumental architecture","The approach helps explain why wet-zone cave shelters mattered","Responsible interpretation makes clear where evidence ends and uncertainty begins"],
    "included":["Knowledgeable local heritage or nature guide","Current route and access confirmation","Basic trail safety briefing","Roam Ceylon timing and transfer coordination"],
    "know":["Do not touch cave deposits, move stones, collect material or enter restricted excavation areas.","The trail can become slippery or impassable after rain.","Leeches, insects and humid conditions are part of the wet-zone environment.","Interpretive infrastructure and local access arrangements may be limited."],
    "nearby":["Kelani River","Makandawa Conservation Forest","Kitulgala village","Belilena waterfall landscape"],
    "tips":["Wear closed trail shoes with grip and carry leech protection.","Bring water and a compact rain layer while keeping hands free.","Choose a guide comfortable discussing archaeological evidence rather than folklore alone.","Move slowly around exposed ground and leave every object exactly where it lies."],
    "badges":["Cultural Heritage","Hidden Gem","Adventure","Advance Booking Recommended","Roam Ceylon Recommended"],
    "themes":["heritage","culture","adventure","nature"]
  },
  {
    "slug":"kitulgala-sandun-ella-waterfall-abseiling-and-rappelling",
    "name":"Private Waterfall Abseiling near Kitulgala",
    "category":"Adventure",
    "short":"Descend a confirmed Kitulgala-area waterfall line with a specialist rope team, using inspected anchors, correctly fitted equipment and a weather-dependent safety plan.",
    "story":"Waterfall abseiling is Kitulgala’s most technical vertical adventure and must be sold by verified site, operator and system—not by a waterfall name alone. Sandun Ella is used in existing activity descriptions, but access, land permission, anchor condition and the exact commercial route require confirmation for every operating partner. Roam Ceylon therefore names the site in the final proposal only after the supplier provides its current operating plan.\n\nParticipants receive a direct equipment and movement demonstration before approaching the edge. The specialist team fits helmet and harness, checks the rope system, controls the descent and manages the wet landing or exit. Rainfall can rapidly change flow, visibility, rock friction and downstream conditions. Sri Lanka Tourism’s abseiling guidance expects trained supervision, suitable equipment, risk assessment and emergency planning; if those conditions are not documented, the activity does not operate.",
    "duration":"Approximately 3–4 hours including approach, rope briefing, descent and exit",
    "difficulty":"Challenging; comfort with heights, mobility on wet rock and strict compliance with rope commands are required",
    "season":"Only during a verified safe-flow window; rainfall and site inspection determine operation",
    "highlights":["A controlled rope descent beside or through a confirmed waterfall line","Hands-on instruction in harness position, braking and guide commands","Technical equipment fitted and checked by a specialist team","A rainforest setting experienced through a focused vertical challenge","Private or very small-group operation when confirmed"],
    "unique":["The product is defined by a verified rope system rather than a dramatic photograph","Waterfall flow makes same-day risk assessment indispensable","Abseiling remains distinct from a multi-element canyoning circuit","Supplier documentation and rescue planning are treated as part of product quality"],
    "included":["Specialist abseiling instructors","Helmet, harness, ropes and activity-specific protective equipment","Site inspection, safety demonstration and managed descent","Roam Ceylon operator, access and transfer coordination"],
    "know":["Operation requires current land access, safe anchors, suitable flow and a documented emergency plan.","Pregnancy, significant height anxiety and certain medical or musculoskeletal conditions may prevent participation.","The named waterfall can change if the selected operator does not hold verified access.","Never attempt the route independently or use unverified anchors."],
    "nearby":["Kelani River","Makandawa Conservation Forest","Kitulgala canyoning streams","Beli Lena"],
    "tips":["Wear secure footwear and clothing that protects skin while wet.","Remove jewellery and secure long hair before equipment fitting.","Tell the instructor immediately if the harness or commands feel unclear.","Accept cancellation after rain as evidence of professional judgement."],
    "badges":["Adventure","Private Option Available","Advance Booking Recommended","Seasonal"],
    "themes":["adventure","nature"]
  },
  {
    "slug":"kitulgala-canyoning-stream-tracking-and-confidence-cliff-jumping",
    "name":"Kitulgala Rainforest Canyoning Circuit",
    "category":"Adventure",
    "short":"Move through a condition-checked rainforest stream circuit using scrambling, natural slides and optional jumps under close specialist supervision.",
    "story":"Canyoning in Kitulgala combines moving water, rock and rainforest into a multi-element route. It is not simply ‘cliff jumping’. A credible operator inspects pools for depth and submerged hazards, evaluates stream flow, defines bypasses and explains how to slide, scramble, float or jump safely. Every optional jump must have a non-jumping alternative; confidence is never created by pressuring a traveller beyond their informed choice.\n\nThe circuit and commercial site are named in the final proposal because local labels and water levels vary. Participants practise body position and communication before entering the more technical sequence. Helmets and flotation devices remain on as directed, while the guide controls spacing and entry order. Heavy rain upstream can change a stream quickly, so the team can shorten or cancel even under clear skies at the base. This product stays distinct from waterfall abseiling: it is a guided journey through several natural obstacles rather than a single rope descent.",
    "duration":"Approximately 2.5–4 hours including forest approach, briefing and stream circuit",
    "difficulty":"Moderate to challenging, with swimming, scrambling, slippery rock and optional height exposure",
    "season":"Operates only after a safe stream-flow and weather assessment by the selected specialist team",
    "highlights":["A sequence of rainforest stream obstacles rather than one staged jump","Natural slides, scrambling and controlled water entries","Every optional jump supported by a safe bypass","Close guide supervision and deliberate participant spacing","A dynamic perspective on Kitulgala’s wet-zone landscape"],
    "unique":["Route decisions change with pool depth, flow and debris","Challenge can be adjusted without shaming participants","The circuit is clearly separated from the technical waterfall-abseil product","Upstream weather awareness is as important as conditions at the launch"],
    "included":["Specialist canyoning guide team","Helmet, flotation device and activity-specific protective equipment","Route inspection and direct safety demonstration","Roam Ceylon operator, access and transfer coordination"],
    "know":["No jump is compulsory; the operator must provide or explain bypasses.","Flash-flow risk can cancel the circuit even when local weather appears calm.","Swimming confidence, mobility and honest medical disclosure are required.","Cuts, bruises, leeches and prolonged wet conditions remain possible despite protective equipment."],
    "nearby":["Kelani River","Makandawa Conservation Forest","Kitulgala waterfall routes","Beli Lena"],
    "tips":["Wear closed shoes with strong wet grip and fitted quick-drying clothing.","Do not wear action cameras where they interfere with helmets or safe movement.","Tell the guide before the circuit if you want to bypass jumps.","Keep hands free and follow the exact entry order at every obstacle."],
    "badges":["Adventure","Water Activity","Advance Booking Recommended","Roam Ceylon Recommended"],
    "themes":["adventure","nature"]
  },
  {
    "slug":"kitulgala-makandawa-rainforest-hiking-and-canopy-canopy-bird-watching",
    "name":"Makandawa Conservation Forest Bird & Nature Walk",
    "category":"Nature",
    "short":"Cross into Makandawa’s wet-zone forest with a knowledgeable naturalist for a patient walk centred on habitat, endemic birdlife and small details beyond the rafting river.",
    "story":"Makandawa Conservation Forest protects a pocket of low-country wet-zone habitat beside Kitulgala’s river landscape. The approach itself can be memorable, sometimes involving a local river crossing before the forest paths begin. Inside, dense vegetation, humidity and layered sound reward slow movement. Birds, butterflies, amphibians, reptiles and forest plants may be encountered, but none can be summoned or guaranteed.\n\nA strong naturalist experience is built around habitat and fieldcraft rather than a checklist. The guide listens for calls, explains why species use different forest layers and keeps the group small enough to reduce noise. ‘Canopy bird watching’ does not imply a constructed canopy platform unless the selected operator confirms one; most observation occurs from established paths and clearings. Rain, leeches and low light are integral to the setting, and current Forest Department access or local crossing arrangements are checked before departure.",
    "duration":"Approximately 3–5 hours; specialist birding departures may begin early and run longer",
    "difficulty":"Moderate, with humid trails, roots, mud, inclines, leeches and possible boat or local river crossing",
    "season":"Year-round; rainfall changes trail condition, while bird activity varies by time, weather and season",
    "highlights":["A protected wet-zone forest immediately connected to the Kelani landscape","Patient listening and observation with a knowledgeable naturalist","Potential endemic and resident birdlife without guaranteed sightings","Butterflies, amphibians, plants and forest structure considered together","A quieter Kitulgala experience beyond high-adrenaline activities"],
    "unique":["Makandawa gives ecological depth to a destination known primarily for rafting","Fieldcraft and habitat interpretation remain valuable on a quiet wildlife morning","The experience corrects the unsupported promise of a canopy platform","A small-group pace protects both sightings and the forest atmosphere"],
    "included":["Knowledgeable naturalist or bird guide when specified","Current forest and crossing access confirmation","Shared binoculars only when explicitly listed","Roam Ceylon timing and transfer coordination"],
    "know":["Bird and wildlife sightings are never guaranteed.","Leeches, rain, insects and slippery surfaces are normal wet-zone conditions.","Forest or river access may change after severe weather.","Playback, feeding, nest approach and collection of plants or animals are not permitted."],
    "nearby":["Kelani River","Beli Lena","Kitulgala village","Rainforest stream circuits"],
    "tips":["Start early, wear muted clothing and keep conversation low.","Bring closed shoes, leech protection, water and a rain cover for optics.","Use binoculars before reaching for a camera.","Allow the guide to protect distance around nesting or distressed wildlife."],
    "badges":["Eco Experience","Wildlife","Photography Spot","Easy Walk","Roam Ceylon Recommended"],
    "themes":["nature","wildlife"]
  }
]$content$::jsonb) as x(slug text,name text,category text,short text,story text,duration text,difficulty text,season text,highlights jsonb,"unique" jsonb,included jsonb,know jsonb,nearby jsonb,tips jsonb,badges jsonb,themes jsonb);

update public.experiences e set
  name=x.name,category=x.category,short_description=x.short,full_description=x.story,
  duration=x.duration,difficulty=x.difficulty,best_season=x.season,highlights=x.highlights,
  unique_points=x."unique",included=x.included,things_to_know=x.know,
  nearby_attractions=x.nearby,traveller_tips=x.tips,badges=x.badges,
  seo_title=x.name || ' | Roam Ceylon',seo_description=x.short,
  status='published',active=true,updated_at=now()
from kitulgala_editorial x where e.slug=x.slug;

delete from public.experience_destinations ed using kitulgala_editorial x
where ed.experience_id=(select id from public.experiences where slug=x.slug);

insert into public.experience_destinations(experience_id,destination_id)
select e.id,d.id from kitulgala_editorial x
join public.experiences e on e.slug=x.slug
join public.destinations d on d.slug='kitulgala'
on conflict do nothing;

delete from public.experience_themes et using kitulgala_editorial x
where et.experience_id=(select id from public.experiences where slug=x.slug);

insert into public.experience_themes(experience_id,theme_id)
select e.id,t.id from kitulgala_editorial x
cross join lateral jsonb_array_elements_text(x.themes) theme(slug)
join public.experiences e on e.slug=x.slug
join public.themes t on t.slug=theme.slug
on conflict do nothing;

insert into public.theme_destinations(theme_id,destination_id)
select t.id,d.id from public.themes t
join public.destinations d on d.slug='kitulgala'
where t.slug in ('adventure','nature','wildlife','heritage','culture')
on conflict do nothing;

do $$
declare content_count integer; destination_count integer; theme_count integer;
begin
  select count(*) into content_count from public.experiences e
  join kitulgala_editorial x on x.slug=e.slug
  where e.status='published' and e.active and length(e.full_description)>800
    and e.duration is not null and e.difficulty is not null;

  select count(distinct ed.experience_id) into destination_count
  from public.experience_destinations ed
  join public.experiences e on e.id=ed.experience_id
  join public.destinations d on d.id=ed.destination_id
  join kitulgala_editorial x on x.slug=e.slug where d.slug='kitulgala';

  select count(distinct et.experience_id) into theme_count
  from public.experience_themes et
  join public.experiences e on e.id=et.experience_id
  join kitulgala_editorial x on x.slug=e.slug;

  if content_count<>5 or destination_count<>5 or theme_count<>5 then
    raise exception 'Kitulgala validation failed: content %, destination %, themes %',content_count,destination_count,theme_count;
  end if;
  raise notice 'Kitulgala result: 5 distinct bespoke experiences published and mapped; imagery and pricing preserved.';
end $$;

commit;
