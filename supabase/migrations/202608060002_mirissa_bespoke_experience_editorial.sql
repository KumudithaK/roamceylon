begin;

-- Editorial verification references (reviewed 2026-08-06):
-- https://www.dwc.gov.lk/?page_id=817
-- https://www.sltda.gov.lk/storage/common_media/GuidelineForWhaleandDolphinWatching.pdf
-- https://www.srilanka.travel/whale-watching
-- https://www.fisheries.gov.lk/web/index.php/en/information/news/1052-deputy-minister-of-fisheries-rathna-gamage-conducts-inspection-visit-to-mirissa-fishing-harbour
-- Existing hero images, galleries and every pricing record are intentionally preserved for manual review.

create temporary table mirissa_editorial as
select * from jsonb_to_recordset($content$[
  {
    "slug":"mirissa-ocean-whale-watching-safaris-from-mirissa-harbor",
    "name":"Responsible Mirissa Whale-Watching Expedition",
    "category":"Wildlife",
    "short":"Leave Mirissa Harbour with a carefully vetted vessel team to search for whales and dolphins responsibly, allowing sea conditions and the animals—not a sighting promise—to shape the morning.",
    "story":"Mirissa is one of Sri Lanka’s principal whale-watching departure points, with the deep southern waters offering the possibility of blue whales, sperm whales, dolphins and other marine life. Possibility is the essential word. These are free-ranging animals in a changing ocean, and no species, number, distance or surfacing behaviour can be guaranteed. A premium expedition begins by choosing the vessel and operating practice with the same care as the destination.\n\nRoam Ceylon confirms the operator, vessel capacity, qualified skipper, current approvals, insurance, life-saving equipment and harbour procedure before the journey is proposed. Every traveller receives a safety and responsible-observation briefing. The vessel approaches slowly, respects the regulated caution and no-approach zones, avoids travelling in front of an animal and never offers swimming or diving with whales or dolphins. If an animal approaches, the skipper—not the camera angle—controls the response.\n\nDeparture depends on current marine forecasts, harbour instructions and the operator’s assessment. A rough or unsafe morning may be delayed or cancelled even during the recognised season. The naturalist or informed crew interprets blows, movement and behaviour while keeping expectations honest. A quieter encounter at responsible distance is considered more valuable than joining a chase, and a no-sighting voyage remains a genuine wildlife outcome rather than a service failure.",
    "duration":"Usually 4–6 hours from early harbour reporting to return; actual duration varies with sea conditions and wildlife location",
    "difficulty":"Easy physically but involves prolonged vessel motion, early departure, sun exposure and possible seasickness",
    "season":"Most commonly planned during calmer south-coast conditions, broadly November–April; every departure requires current marine and harbour confirmation",
    "highlights":["The possibility of observing whales or dolphins in open southern-ocean habitat","A vetted Mirissa Harbour departure with safety and operating details confirmed","Responsible observation shaped around animal behaviour rather than pursuit","Marine interpretation from an informed crew or naturalist when specified","A sunrise departure and wide-water perspective on Sri Lanka’s southern coast"],
    "unique":["Mirissa is officially recognised as one of Sri Lanka’s principal marine-tourism locations","The product is defined by the named vessel and operating standard—not merely a ticket","SLTDA responsible-observation and vessel-safety principles form part of the experience","No-sighting and weather policies are explained before confirmation"],
    "included":["Named compliant whale-watching vessel and qualified operating crew","Approved life jackets, onboard safety equipment and pre-departure briefing","Harbour and marine-tourism arrangements stated in the proposal","Naturalist interpretation, refreshments and transfers only when explicitly listed","Roam Ceylon weather, operator and departure coordination"],
    "know":["No whale, dolphin, turtle or other wildlife sighting is guaranteed.","Sea state, wind, visibility, harbour directions or official warnings can delay or cancel departure.","Swimming, snorkelling, diving or deliberate close interaction with whales and dolphins is not offered.","Pregnancy, back or neck conditions, limited mobility and severe motion sensitivity must be discussed before booking.","The skipper has final authority over navigation, approach distance and safe return."],
    "nearby":["Mirissa Fishery Harbour","Mirissa Beach","Coconut Tree Hill","Weligama Bay"],
    "tips":["Take appropriate motion-sickness advice before departure rather than after the vessel leaves harbour.","Wear secure sun protection and carry a light layer for wind and spray.","Keep cameras strapped and protected; binoculars often provide the most rewarding first view.","Judge the morning by respectful fieldcraft and interpretation, not by demanding a close encounter."],
    "badges":["Signature Experience","Wildlife","Seasonal","Eco Experience","Advance Booking Recommended","Roam Ceylon Recommended"],
    "themes":["wildlife","nature","tropical"]
  },
  {
    "slug":"mirissa-panoramic-photography-from-coconut-tree-hill-and-secret-beach",
    "name":"Mirissa Headlands & Hidden-Cove Photography Walk",
    "category":"Photography",
    "short":"Photograph Mirissa’s palm-lined headlands, changing sea light and smaller coastal coves on a privately paced walk planned around weather, access and the quieter edge of golden hour.",
    "story":"Mirissa’s familiar postcard is only the beginning. Around the bay, laterite headlands, coconut silhouettes, fishing craft and smaller coves create a compact sequence of coastal compositions. Coconut Tree Hill provides the best-known elevated viewpoint, while the place commonly called Secret Beach offers a more enclosed shoreline character when access and sea conditions are suitable. Neither location is promised as empty, private or untouched.\n\nThis is a photographic coastal walk rather than a race between social-media markers. A local host or photographer selects sunrise or late-afternoon timing according to cloud, tide, heat and the traveller’s visual interests. The route can focus on landscape, environmental portraiture, phone photography or considered couple images without asking local people to become uninvited subjects. Time is reserved to observe changing light instead of repeating a fixed pose.\n\nHeadland edges, wet rock, exposed roots and beach approaches require judgement. Access can change with erosion, private-land boundaries, construction, surf and local management, so the guide confirms the route on the day and substitutes another public coastal viewpoint when necessary. Drone operation is not included unless the required Sri Lankan permissions and site conditions have been confirmed separately.",
    "duration":"Approximately 2–3 hours at sunrise or late afternoon, depending on the confirmed route and light",
    "difficulty":"Easy to moderate walking with uneven ground, sand, exposed headland edges and possible slippery coastal approaches",
    "season":"Year-round with daily weather and access checks; the calmer south-coast period often offers more predictable beach conditions",
    "highlights":["Palm silhouettes and open-ocean perspectives from Mirissa’s headlands","A contrast between broad bay views and smaller coastal coves","Golden-hour guidance for camera or smartphone photography","A deliberately unhurried route with time to read changing light","Respectful visual storytelling beyond a checklist of poses"],
    "unique":["Several distinct coastal compositions can be explored within one compact Mirissa route","The experience is adapted to the traveller’s equipment and photographic confidence","Popular viewpoints are presented honestly without invented exclusivity","Access, tide and light determine the route rather than a rigid marketing promise"],
    "included":["Private local host or photography guide when stated in the proposal","Route and timing planned around current access and weather","Practical composition support suited to the traveller’s equipment","Local transfers, professional portraits or specialist equipment only when explicitly included","Roam Ceylon timing and access coordination"],
    "know":["Coconut Tree Hill and the smaller coves can be busy; exclusive access is not implied.","Cliff and headland edges are unguarded in places and must be approached cautiously.","Surf, erosion, rain or access changes may require a different public viewpoint.","Commercial photography and drone use can require separate permissions.","Swimming is not part of the experience and should never be assumed safe from appearance alone."],
    "nearby":["Mirissa Beach","Parrot Rock","Weligama Bay","Mirissa Fishery Harbour"],
    "tips":["Choose sunrise for gentler heat and often quieter public spaces, subject to the forecast.","Carry only equipment you can manage safely over sand and uneven ground.","Use a lens cloth and protect electronics from salt spray and sudden showers.","Ask before photographing residents, fishers or anyone working along the shore."],
    "badges":["Photography Spot","Sunrise Experience","Couples Favourite","Roam Ceylon Recommended"],
    "themes":["tropical","nature"]
  },
  {
    "slug":"mirissa-beachfront-seafood-dining-under-starlit-palm-canopies",
    "name":"Curated Mirissa Seafood Evening",
    "category":"Food",
    "short":"Settle into a carefully selected Mirissa table for an unhurried seafood dinner, with the venue, menu style and dietary needs confirmed instead of leaving the evening to chance.",
    "story":"Mirissa’s identity is inseparable from the sea and its working fishery harbour, but a premium seafood evening should offer more than a table placed on sand. Roam Ceylon selects a restaurant for current food handling, hospitality, atmosphere and suitability to the traveller—not for a generic promise of ‘the day’s catch’. The confirmed venue may be directly beachfront or set just back from the shore when that provides the stronger kitchen and service.\n\nBefore confirmation, the proposal identifies whether dinner is à la carte, a set menu, a privately arranged table or a chef-led upgrade. Available fish and shellfish change with landing, market, season and lawful supply, so no species is guaranteed in advance unless the restaurant has confirmed it for the service. Sri Lankan preparations can include grilled fish, aromatic curry, sambol and coastal accompaniments, while non-seafood and vegetarian alternatives are checked rather than assumed.\n\nThe evening is deliberately flexible enough for conversation and the pace of the kitchen. It is not presented as a cooking class, harbour auction or meeting with fishers unless those elements are separately arranged and consented to. Weather, beach conditions and local operating rules can move an outdoor table under cover. The quality of the meal, sourcing conversation and care of service matter more than an unsupported claim that every ingredient travelled directly from boat to plate.",
    "duration":"Approximately 2–3 hours; reservation time and menu format are confirmed with the selected venue",
    "difficulty":"Easy; step-free access and seating requirements depend on the selected restaurant and must be confirmed",
    "season":"Available year-round through selected venues; outdoor ambience and seafood availability vary with weather, landing and season",
    "highlights":["A restaurant selected for current kitchen quality and hospitality","Menu guidance shaped around Sri Lankan coastal flavours and traveller preferences","A relaxed evening setting beside or close to Mirissa’s shoreline","Dietary requirements discussed with the venue before arrival","Optional private-table or elevated menu arrangements when genuinely available"],
    "unique":["The venue is curated for the specific traveller rather than hardcoded into the experience","Seafood availability is treated honestly as seasonal and market-led","Atmosphere and operational food quality carry equal weight","The experience can scale from an intimate dinner to a confirmed private celebration"],
    "included":["Advance restaurant selection and reservation","Dietary and occasion notes shared with the venue","Menu, beverages, transfers and private setup only when explicitly stated in the proposal","Roam Ceylon dining and timing coordination"],
    "know":["No fish, shellfish or preparation is guaranteed until confirmed by the selected restaurant.","All seafood allergies and cross-contamination concerns must be disclosed before booking.","Beach tables may move indoors or under cover because of rain, wind, tide or local restrictions.","The final bill structure—set menu, minimum spend or à la carte—is stated in the proposal.","Responsible sourcing questions are welcomed, but unsupported catch-origin claims are not made."],
    "nearby":["Mirissa Beach","Mirissa Fishery Harbour","Coconut Tree Hill","Weligama Bay"],
    "tips":["Share allergies, dietary preferences and celebration details before the restaurant is selected.","Ask for the confirmed price format when choosing whole fish or shellfish by weight.","Keep the evening lightly scheduled so weather or kitchen pacing does not feel rushed.","Choose a covered premium venue when guaranteed beachfront placement matters less than comfort and service."],
    "badges":["Couples Favourite","Luxury Upgrade Available","Advance Booking Recommended","Roam Ceylon Recommended"],
    "themes":["tropical","culture"]
  }
]$content$::jsonb) as x(
  slug text,name text,category text,short text,story text,duration text,difficulty text,
  season text,highlights jsonb,"unique" jsonb,included jsonb,know jsonb,nearby jsonb,
  tips jsonb,badges jsonb,themes jsonb
);

update public.experiences e set
  name=x.name,
  category=x.category,
  short_description=x.short,
  full_description=x.story,
  duration=x.duration,
  difficulty=x.difficulty,
  best_season=x.season,
  highlights=x.highlights,
  unique_points=x."unique",
  included=x.included,
  things_to_know=x.know,
  nearby_attractions=x.nearby,
  traveller_tips=x.tips,
  badges=x.badges,
  seo_title=x.name || ' | Roam Ceylon',
  seo_description=x.short,
  status='published',
  active=true,
  updated_at=now()
from mirissa_editorial x
where e.slug=x.slug;

delete from public.experience_destinations ed
using mirissa_editorial x
where ed.experience_id=(select id from public.experiences where slug=x.slug);

insert into public.experience_destinations(experience_id,destination_id)
select e.id,d.id
from mirissa_editorial x
join public.experiences e on e.slug=x.slug
join public.destinations d on d.slug='mirissa'
on conflict do nothing;

delete from public.experience_themes et
using mirissa_editorial x
where et.experience_id=(select id from public.experiences where slug=x.slug);

insert into public.experience_themes(experience_id,theme_id)
select e.id,t.id
from mirissa_editorial x
cross join lateral jsonb_array_elements_text(x.themes) theme(slug)
join public.experiences e on e.slug=x.slug
join public.themes t on t.slug=theme.slug
on conflict do nothing;

-- Mirissa remains a Tropical Paradise destination. Wildlife, nature and culture
-- are experience-level relationships and must not broaden destination discovery.
insert into public.theme_destinations(theme_id,destination_id)
select t.id,d.id
from public.themes t
join public.destinations d on d.slug='mirissa'
where t.slug='tropical'
on conflict do nothing;

delete from public.theme_destinations td
using public.themes t, public.destinations d
where td.theme_id=t.id
  and td.destination_id=d.id
  and d.slug='mirissa'
  and t.slug<>'tropical';

do $$
declare
  content_count integer;
  destination_count integer;
  theme_count integer;
  destination_theme_count integer;
begin
  select count(*) into content_count
  from public.experiences e
  join mirissa_editorial x on x.slug=e.slug
  where e.status='published'
    and e.active
    and length(e.full_description)>900
    and e.duration is not null
    and e.difficulty is not null
    and jsonb_array_length(e.highlights)>=5
    and jsonb_array_length(e.badges)>=3;

  select count(distinct ed.experience_id) into destination_count
  from public.experience_destinations ed
  join public.experiences e on e.id=ed.experience_id
  join public.destinations d on d.id=ed.destination_id
  join mirissa_editorial x on x.slug=e.slug
  where d.slug='mirissa';

  select count(distinct et.experience_id) into theme_count
  from public.experience_themes et
  join public.experiences e on e.id=et.experience_id
  join mirissa_editorial x on x.slug=e.slug;

  select count(*) into destination_theme_count
  from public.theme_destinations td
  join public.destinations d on d.id=td.destination_id
  where d.slug='mirissa';

  if content_count<>3 or destination_count<>3 or theme_count<>3 or destination_theme_count<>1 then
    raise exception 'Mirissa validation failed: content %, destinations %, experience themes %, destination themes %',content_count,destination_count,theme_count,destination_theme_count;
  end if;

  raise notice 'Mirissa result: 3 bespoke coastal experiences published and mapped; imagery and pricing preserved; destination discovery remains Tropical Paradise only.';
end $$;

commit;
