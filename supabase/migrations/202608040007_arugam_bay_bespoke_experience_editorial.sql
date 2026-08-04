begin;

create temporary table arugam_editorial as
select * from jsonb_to_recordset($content$[
  {
    "slug":"arugambay-world-class-point-break-surfing-main-point-elephant-rock-peanut-farm-whi",
    "name":"Arugam Bay Point-Break Surfing",
    "category":"Water Sports",
    "short":"Surf Sri Lanka's celebrated east-coast right-hand breaks, with the day's location selected around swell, wind, ability and the rhythm of each lineup.",
    "story":"Arugam Bay is not one wave but a coastline of distinct breaks. Main Point is the celebrated reference, while Whiskey Point, Peanut Farm and Elephant Rock offer different approaches, crowds and levels of exposure. The right choice depends on conditions and ability; a picturesque name is never a substitute for a local surf assessment.\n\nRoam Ceylon arranges a lesson, guiding session or board hire through a confirmed operator and names the intended format in the proposal. Beginners should not be placed into an advanced lineup, and experienced surfers still benefit from local knowledge of entry points, rocks, currents and etiquette.",
    "duration":"Approximately 1.5–3 hours per guided session",
    "season":"Generally April to October; daily swell, wind and local conditions still determine the break",
    "highlights":["Right-hand point breaks that have shaped Arugam Bay's international surf identity","A break selected for the surfer rather than a one-location promise","Warm-water sessions framed by the dry south-eastern coast","Local guidance on entry, current, rocks and lineup etiquette","Options for first lessons, progression sessions or experienced surf guiding"],
    "unique":["Several recognised breaks allow the experience to adapt to swell and ability","Surf culture is woven into the seasonal life of Arugam Bay rather than staged for visitors","Main Point's reputation is balanced with quieter alternatives when conditions permit","A transparent proposal distinguishes coaching, guiding and simple equipment hire"],
    "included":["Surfboard matched to the confirmed session","Qualified instructor or local surf guide when specified","Safety and break briefing","Roam Ceylon timing and operator coordination","Transport, rash vest, photography or insurance only when explicitly confirmed"],
    "know":["No wave, break or ride length can be guaranteed.","Main Point and other breaks can be crowded; right-of-way and local etiquette must be respected.","Swimming confidence, prior experience, injuries and board requirements must be shared before confirmation.","The instructor or guide may move or cancel a session when conditions are unsuitable."],
    "nearby":["Kottukal Lagoon","Elephant Rock","Muhudu Maha Viharaya","Kumana National Park"],
    "tips":["Describe your real surf level honestly so the operator can choose a suitable break.","Use reef-safe sun protection and a well-fitted rash vest.","Do not enter an unfamiliar break alone simply because other surfers are present.","Keep the schedule flexible enough to follow the better wind and tide window."],
    "badges":["Water Activity","Adventure","Seasonal","Most Popular","Roam Ceylon Recommended"],
    "themes":["adventure","tropical"]
  },
  {
    "slug":"arugambay-kottukal-lagoon-motorboat-safari-and-kayak-expeditions",
    "name":"Kottukal Lagoon Nature Journey",
    "category":"Nature",
    "short":"Move quietly through Kottukal Lagoon by community-operated boat or confirmed kayak arrangement, watching mangroves, waterbirds and the changing light around Pottuvil.",
    "story":"Kottukal offers a calm counterpoint to Arugam Bay's surf. Community-led lagoon journeys move through shallow water, mangrove edges and open reaches where herons, egrets, kingfishers and other wildlife may appear. The strongest departures are not driven by a sightings checklist but by the slow transition between water, fishing landscape and dry-zone habitat.\n\nEarly morning and late afternoon avoid the harshest heat and usually offer more rewarding light. Craft, route and duration vary, so the proposal identifies whether the arrangement is a local boat safari or a genuinely supported kayak journey. Wildlife remains free-ranging and is never guaranteed.",
    "duration":"Usually around 2 hours; longer community routes are available by arrangement",
    "season":"Early morning or late afternoon when operating conditions are suitable",
    "highlights":["A slow passage through the Pottuvil–Kottukal lagoon landscape","Mangrove margins, open water and dry-zone birdlife","Community-led knowledge of the lagoon and its daily rhythms","Soft morning or evening light away from the surf-town bustle","Wildlife observation that values habitat as much as headline sightings"],
    "unique":["The experience is rooted in community-led lagoon tourism developed around local knowledge","It reveals the ecological landscape immediately behind Arugam Bay's coast","Boat and kayak formats create different experiences and are never treated as interchangeable","Its quiet pace makes a meaningful contrast to a surf-led itinerary"],
    "included":["Confirmed boat or kayak arrangement","Local boatman, guide or kayak support as specified","Mandatory buoyancy equipment","Roam Ceylon access and timing coordination"],
    "know":["Wildlife sightings cannot be guaranteed.","There is limited shade on many boats; midday departures are normally less comfortable.","Craft type, child policy, accessibility and kayak support must be confirmed before booking.","Weather and water conditions may alter the route or suspend operation."],
    "nearby":["Pottuvil Point","Muhudu Maha Viharaya","Whiskey Point","Arugam Bay beach"],
    "tips":["Wear muted colours and keep voices low.","Bring binoculars, water and sun protection in a compact bag.","Avoid flash, playback and feeding wildlife.","Use a dry bag for phones and cameras."],
    "badges":["Eco Experience","Wildlife","Water Activity","Photography Spot","Roam Ceylon Recommended"],
    "themes":["nature","wildlife"]
  },
  {
    "slug":"arugambay-sand-dune-atv-quad-riding-and-coastal-camping",
    "name":"Private Coastal Adventure Camp & ATV Experience",
    "category":"Adventure",
    "short":"A privately verified coastal adventure arrangement combining guided ATV riding and an authorised camp, offered only when a suitable operator and permitted site are confirmed.",
    "story":"Sri Lanka's south-eastern coast contains sensitive dunes, scrub and wildlife corridors, so motorised riding and camping cannot be treated as casual access to empty land. This experience exists only as a supplier-specific arrangement: Roam Ceylon must verify the operator, authorised riding area, land permission, safety equipment and camp facilities before presenting it in a proposal.\n\nWhen those conditions are met, the programme is shaped as a controlled ride followed by a low-impact private camp rather than unrestricted dune driving. Route boundaries, noise, waste, fire rules and wildlife movement take precedence over the advertised thrill. If permission or environmental safeguards cannot be demonstrated, the experience is not confirmed.",
    "duration":"Supplier-specific; typically arranged as a half-day ride or private overnight programme",
    "season":"Only when site permission, fire rules, weather and ground conditions allow",
    "highlights":["A private programme built around a named operator and authorised site","Guided ATV instruction before entering the confirmed riding area","A coastal landscape experienced with strict route boundaries","Optional overnight atmosphere only where camping permission is documented","Clear environmental and safety conditions in the proposal"],
    "unique":["The experience is deliberately conditional rather than sold as unrestricted beach access","Supplier, land permission and operating area are verified as one package","Environmental safeguards are treated as part of the product itself","The itinerary can omit either riding or camping if the required standard is not met"],
    "included":["ATV, helmet and operating briefing when confirmed","Specialist ride leader","Authorised route and land-access coordination","Camp equipment and meals only when explicitly listed","Roam Ceylon supplier due diligence"],
    "know":["This experience is not automatically available and requires manual supplier verification.","Riding on public beaches, protected dunes or wildlife habitat without permission is not included.","Licence, minimum age, insurance, medical restrictions and passenger rules vary by operator.","Open fires and overnight camping require explicit site approval and may be prohibited."],
    "nearby":["Arugam Bay","Panama","Kumana landscape","Kottukal Lagoon"],
    "tips":["Request the named site and operator before accepting the proposal.","Wear closed footwear, long trousers and eye protection specified by the operator.","Do not leave the marked route or approach wildlife.","Avoid assuming that a bonfire is included in any coastal camp."],
    "badges":["Adventure","Private Option Available","Advance Booking Recommended"],
    "themes":["adventure","nature"]
  },
  {
    "slug":"arugambay-relaxed-beach-lifestyle-yoga-on-the-beach-and-hammock-lounging",
    "name":"Arugam Bay Beach Yoga & Slow Morning",
    "category":"Wellness",
    "short":"Begin with a privately arranged beach or open-air yoga session, then keep the morning unhurried with breakfast, shade and the easy rhythm of Arugam Bay.",
    "story":"Not every Arugam Bay experience needs a performance target. A quiet yoga practice near the coast can create space between surf sessions and long transfers, especially when timed before the beach becomes hot and busy. The setting is selected with the instructor rather than promised as an isolated stretch of sand.\n\nThe practice is matched to the traveller's experience, mobility and energy. What follows is intentionally simple: time for breakfast, reading or rest rather than a list of staged activities. Roam Ceylon confirms the instructor, location and equipment while leaving the remainder of the morning genuinely free.",
    "duration":"Approximately 60–90 minutes for yoga; unstructured beach time follows at leisure",
    "season":"Most comfortable in the cooler early morning; outdoor practice remains weather-dependent",
    "highlights":["An instructor-led practice adapted to the traveller","Cooler early light and the sound of the coast","A schedule protected from unnecessary rushing","Time for breakfast, reading or rest after the session","An accessible wellness counterpoint to Arugam Bay's surf culture"],
    "unique":["The value lies in deliberately unscheduled time rather than added activities","Practice level and location are confirmed instead of assuming every beach is private or suitable","It integrates recovery into the itinerary without presenting yoga as medical treatment","The experience can remain private when a suitable instructor is available"],
    "included":["Confirmed yoga instructor","Mat when specified","Location and timing coordination","Only refreshments or private venue hire explicitly listed"],
    "know":["Outdoor classes may move or cancel because of rain, wind, heat or beach activity.","Share pregnancy, injuries and mobility concerns directly with the instructor.","Yoga and relaxation services are not substitutes for medical care.","Beach privacy cannot be guaranteed unless a private venue is confirmed."],
    "nearby":["Arugam Bay beach","Elephant Rock","Kottukal Lagoon","Pottuvil"],
    "tips":["Choose the earliest practical session for cooler conditions.","Wear comfortable clothing and avoid a heavy meal immediately beforehand.","Bring water and reef-safe sun protection for time after class.","Keep the following hours lightly scheduled."],
    "badges":["Wellness","Couples Favourite","Private Option Available"],
    "themes":["wellness","tropical"]
  },
  {
    "slug":"arugambay-sunset-viewing-over-elephant-rock-coastal-viewpoint",
    "name":"Elephant Rock Sunset Walk",
    "category":"Photography",
    "short":"Walk to Elephant Rock for a broad sunset view across the coast, accompanied by local guidance where wildlife, access and fading light require care.",
    "story":"Elephant Rock rises above a quieter stretch of coast south of Arugam Bay. The reward is not a long summit trek but a widening view: lagoon country, surf, beach and the last light moving across the south-eastern horizon. Its apparent simplicity can be misleading, particularly close to dusk.\n\nThe surrounding landscape is part of an elephant range, access routes can change and the return happens as daylight disappears. Roam Ceylon therefore treats this as a guided sunset walk rather than an unsupervised photo stop. The guide chooses the approach, keeps a safe distance from wildlife and begins the descent before darkness compromises footing.",
    "duration":"Approximately 1.5–2 hours including approach, sunset and return",
    "season":"Best on a clear, safely accessible evening; sunset time and weather vary through the year",
    "highlights":["An elevated view across beach, lagoon and the Arugam Bay coastline","Changing colour and long shadows during the final light","A short walk with a strong sense of the wider landscape","Photographic compositions beyond the main surf beach","Local guidance for access, wildlife awareness and the return before dark"],
    "unique":["The viewpoint brings Arugam Bay's coast and inland habitat into a single frame","Its brevity does not remove the need for wildlife and access judgement","Every evening changes with cloud, haze and seasonal light","The walk works as a quiet conclusion rather than a crowded attraction checklist"],
    "included":["Local guide when confirmed","Access and sunset timing coordination","Roam Ceylon transport planning","Only refreshments or private transfers explicitly listed"],
    "know":["Wild elephants may move through the wider area; never approach or walk around an animal.","Access and safe routes can change, especially after rain or vegetation growth.","Rock and path surfaces can be uneven and the return occurs in fading light.","Sunset colour and visibility cannot be guaranteed."],
    "nearby":["Peanut Farm surf break","Panama","Arugam Bay beach","Kumana landscape"],
    "tips":["Wear closed shoes and carry a small torch for the return.","Follow the guide immediately if wildlife is reported nearby.","Keep camera equipment compact and protect it from sand.","Arrive early enough to enjoy the view without delaying the descent."],
    "badges":["Sunset Experience","Photography Spot","Eco Experience","Couples Favourite"],
    "themes":["tropical","nature"]
  },
  {
    "slug":"arugambay-nightly-beach-bonfires-and-live-acoustic-music-sessions",
    "name":"Arugam Bay Live Music Evening",
    "category":"Culture",
    "short":"Spend an easy evening at a confirmed local venue with live acoustic music or a responsibly managed beach gathering, selected from the programme available during your stay.",
    "story":"Arugam Bay's evenings change with the season and the weekly rhythm of its venues. Some nights centre on acoustic music and conversation; others are larger social events. There is no reliable promise of a nightly bonfire or a fixed performer, so Roam Ceylon confirms the actual programme close to travel rather than selling an invented recurring show.\n\nThe best version feels connected to the town instead of imposed on the beach. Licensed venues, reasonable sound, safe transport and responsible fire management matter. Travellers can choose a quieter music evening or a more social gathering, with the final recommendation matched to their preferences.",
    "duration":"Flexible evening experience; confirmed programme and transport determine timing",
    "season":"Most active during Arugam Bay's main visitor season; individual events must be reconfirmed",
    "highlights":["A current venue selected from the programme operating during the stay","A choice between quieter live music and a more social evening","The informal seasonal character of Arugam Bay after sunset","Safe return transport arranged where required","No false promise of a nightly performer or beach fire"],
    "unique":["The evening is curated from a changing local programme rather than treated as a permanent attraction","Traveller preferences guide the venue and atmosphere","Responsible beach use and fire rules are considered part of quality","It offers social connection without requiring a large nightlife event"],
    "included":["Current programme and venue recommendation","Reservation where the selected venue accepts one","Roam Ceylon timing and transport coordination","Food, drinks, tickets or private transport only when explicitly listed"],
    "know":["Events, performers and venues change frequently and must be reconfirmed.","A beach bonfire is included only when legally and responsibly managed by the confirmed venue.","Alcohol service follows Sri Lankan licensing rules and restrictions, including relevant public holidays.","Sound level, crowds and finishing time vary by event."],
    "nearby":["Arugam Bay main beach","Pottuvil","Whiskey Point","Kottukal Lagoon"],
    "tips":["Tell your journey designer whether you prefer acoustic music, conversation or a livelier event.","Use arranged transport rather than walking an unfamiliar beach alone late at night.","Carry only essentials and keep valuables secure.","Check the confirmed venue and start time on the day."],
    "badges":["Seasonal","Couples Favourite","Advance Booking Recommended"],
    "themes":["culture","tropical"]
  }
]$content$::jsonb) as x(slug text,name text,category text,short text,story text,duration text,season text,highlights jsonb,"unique" jsonb,included jsonb,know jsonb,nearby jsonb,tips jsonb,badges jsonb,themes jsonb);

update public.experiences e set name=x.name,category=x.category,short_description=x.short,full_description=x.story,
 duration=x.duration,difficulty=null,best_season=x.season,highlights=x.highlights,unique_points=x."unique",included=x.included,
 things_to_know=x.know,nearby_attractions=x.nearby,traveller_tips=x.tips,badges=x.badges,
 seo_title=x.name || ' | Roam Ceylon',seo_description=x.short,status='published',active=true,updated_at=now()
from arugam_editorial x where e.slug=x.slug;

delete from public.experience_destinations ed using arugam_editorial x where ed.experience_id=(select id from public.experiences where slug=x.slug);
insert into public.experience_destinations(experience_id,destination_id)
select e.id,d.id from arugam_editorial x join public.experiences e on e.slug=x.slug join public.destinations d on d.slug='arugambay' on conflict do nothing;

delete from public.experience_themes et using arugam_editorial x where et.experience_id=(select id from public.experiences where slug=x.slug);
insert into public.experience_themes(experience_id,theme_id)
select e.id,t.id from arugam_editorial x cross join lateral jsonb_array_elements_text(x.themes) theme(slug)
join public.experiences e on e.slug=x.slug join public.themes t on t.slug=theme.slug on conflict do nothing;

insert into public.theme_destinations(theme_id,destination_id)
select t.id,d.id from (values ('adventure'),('tropical'),('nature'),('wildlife'),('wellness'),('culture')) wanted(slug)
join public.themes t on t.slug=wanted.slug join public.destinations d on d.slug='arugambay' on conflict do nothing;

do $$ declare c integer; d integer; t integer; begin
 select count(*) into c from public.experiences e join arugam_editorial x on x.slug=e.slug where e.status='published' and e.active and length(e.full_description)>500 and e.duration is not null;
 select count(distinct ed.experience_id) into d from public.experience_destinations ed join public.experiences e on e.id=ed.experience_id join arugam_editorial x on x.slug=e.slug;
 select count(distinct et.experience_id) into t from public.experience_themes et join public.experiences e on e.id=et.experience_id join arugam_editorial x on x.slug=e.slug;
 if c<>6 or d<>6 or t<>6 then raise exception 'Arugam Bay validation failed: content %, destination %, themes %',c,d,t; end if;
 raise notice 'Arugam Bay result: 6 bespoke experiences validated; image fields preserved.';
end $$;

commit;
