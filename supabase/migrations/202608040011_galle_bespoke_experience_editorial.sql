begin;

create temporary table galle_editorial as
select * from jsonb_to_recordset($content$[
  {
    "slug":"galle-swimming-and-stand-up-paddleboarding-at-unawatuna-bay",
    "name":"Private Stand-Up Paddleboarding on Unawatuna Bay",
    "category":"Water Sports",
    "short":"Learn or refine stand-up paddleboarding in Unawatuna Bay with a confirmed water-sports operator, matching the session to sea conditions, confidence and experience.",
    "story":"Unawatuna’s curved bay can offer a sheltered setting for paddleboarding, but calm-looking water is never an automatic guarantee of safe conditions. Wind, swell, boat movement and seasonal change all affect the session. A credible operator checks the bay on the day, provides suitable buoyancy equipment and keeps beginners within a controlled area rather than promising a fixed offshore route.\n\nThe experience begins with stance, paddle technique, turning and recovery close to shore. Confident participants may explore a little farther only when the instructor considers it appropriate. Swimming can follow in the approved area, but it is not treated as supervised instruction unless explicitly confirmed. Roam Ceylon names the operator and inclusions in the proposal so equipment hire is never confused with a guided session.",
    "duration":"Approximately 1.5–2 hours including briefing and water time",
    "difficulty":"Beginner-friendly when conditions are calm; swimming confidence is required",
    "season":"Only when wind, swell, visibility and local marine activity permit safe operation",
    "highlights":["Paddle instruction in the curved setting of Unawatuna Bay","A session adjusted to confidence and current sea conditions","Warm-water perspective back towards the southern coast","Time to practise balance, turning and controlled recovery","A private or small-group format when confirmed"],
    "unique":["The bay can support a gentler introduction than an exposed open-coast session","Instruction and simple board rental are clearly distinguished","Daily marine conditions determine the route rather than a marketing promise","The session can be paced for couples, families or first-time paddlers when operator rules allow"],
    "included":["Stand-up paddleboard and paddle","Personal flotation device","Safety briefing and instructor when specified","Roam Ceylon operator and timing coordination"],
    "know":["The operator may shorten, relocate or cancel the session when conditions are unsuitable.","Share swimming ability, age, medical concerns and prior paddling experience before confirmation.","Swimming after the session is at the approved location and only under the supervision stated in the proposal.","Water clarity and calm conditions cannot be guaranteed."],
    "nearby":["Rumassala","Jungle Beach","Galle Fort","Dalawella coast"],
    "tips":["Wear secure swimwear and reef-safe sun protection.","Bring a strap for prescription glasses and leave unnecessary valuables ashore.","Follow the instructor’s defined operating area.","Choose an early session when local conditions are often more settled, subject to the day’s assessment."],
    "badges":["Water Activity","Adventure","Private Option Available","Advance Booking Recommended"],
    "themes":["tropical","adventure"]
  },
  {
    "slug":"galle-exploring-hidden-coves-and-snorkeling-at-jungle-beach",
    "name":"Rumassala & Jungle Beach Coastal Walk with Conditional Snorkelling",
    "category":"Nature",
    "short":"Follow Rumassala’s coastal landscape towards Jungle Beach, adding guided snorkelling only when visibility, water movement and reef conditions meet a safe standard.",
    "story":"Jungle Beach sits beneath the wooded slopes of Rumassala, where a short land approach reveals one of the small coves east of Galle. The experience is richer when the walk, coastal vegetation and marine setting are considered together rather than treating the beach as an isolated ‘hidden’ location. It is now well known and can become busy, so timing and expectations matter.\n\nSnorkelling is conditional. Rumassala and Unawatuna form part of a sensitive fringing-reef environment, and water quality, visibility, current and vessel activity change. A confirmed local operator chooses the entry point and can replace the water session with a coastal nature walk when conditions are poor. No coral, fish or turtle sighting is guaranteed, and responsible practice means never standing on reef, feeding wildlife or collecting marine material.",
    "duration":"Approximately 2.5–3.5 hours including the coastal approach and optional water session",
    "difficulty":"Moderate; uneven paths, heat and open-water confidence must be considered",
    "season":"Snorkelling operates only during locally assessed calm, clear and safe conditions",
    "highlights":["The transition from Rumassala’s wooded slope to a small coastal cove","A quieter nature-led perspective on the Galle–Unawatuna coast","Conditional guided snorkelling over a sensitive fringing-reef environment","Interpretation that values habitat even when visibility is limited","A land-based alternative when entering the water is inappropriate"],
    "unique":["The walk and marine environment are designed as one experience","Snorkelling is never guaranteed merely because equipment is available","Reef protection and visitor carrying pressure are discussed honestly","The programme remains worthwhile without promising wildlife encounters"],
    "included":["Local coastal guide","Mask, snorkel, fins and buoyancy aid when snorkelling is confirmed","Water-safety and reef-conduct briefing","Roam Ceylon access and operator coordination"],
    "know":["Jungle Beach is no longer secluded and can be crowded.","Snorkelling may be cancelled because of current, swell, poor visibility or marine traffic.","Never touch, stand on or remove coral and never feed marine animals.","The path and beach access may be slippery after rain and are not fully accessible."],
    "nearby":["Japanese Peace Pagoda","Unawatuna Bay","Galle Harbour","Galle Fort"],
    "tips":["Wear closed walking shoes and carry water for the land approach.","Use reef-safe sun protection before entering the water.","Keep a respectful distance from all marine life.","Accept the guide’s decision when the day is better suited to a coastal walk than snorkelling."],
    "badges":["Eco Experience","Water Activity","Adventure","Advance Booking Recommended"],
    "themes":["tropical","nature","adventure"]
  },
  {
    "slug":"galle-rope-swinging-and-photo-ops-at-dalawella-beach-palm-tree-swing",
    "name":"Dalawella Coast & Responsible Sunset Walk",
    "category":"Nature",
    "short":"Slow the pace along Dalawella’s reef-fringed coast at sunset, observing the shoreline responsibly and treating any palm swing or turtle encounter as optional—not staged wildlife entertainment.",
    "story":"Dalawella’s appeal lies in its compact coves, reef-shaped shoreline and evening light rather than a single social-media prop. The walk follows the coast at a pace that allows for beach conditions, local activity and the possibility of seeing marine turtles in the water. Sightings are never guaranteed, and turtles must not be touched, fed, surrounded or encouraged towards people.\n\nThe well-known palm swings are privately operated and can change or disappear. If a traveller chooses to use one, the operator, condition, fee and personal risk must be assessed on the day; it is not automatically included by Roam Ceylon. The experience therefore remains valuable without a swing photograph, ending with sunset from a safe section of beach selected around tide and sea state.",
    "duration":"Approximately 1.5–2 hours around the final light",
    "difficulty":"Easy, with sand, reef rock and tide-dependent footing",
    "season":"Year-round when tide, sea state and weather allow a safe shoreline walk",
    "highlights":["Golden-hour light across Dalawella’s small coves","Reef, rock and beach textures along a compact coastal walk","A chance—not a promise—to observe marine turtles from a respectful distance","Sunset paced around tide and safe access","Clear separation between the landscape experience and privately operated photo props"],
    "unique":["The coast is valued beyond its famous palm-swing image","Responsible turtle behaviour is built into the experience","The route changes with tide and beach conditions","A quiet evening can be rewarding even without wildlife or staged photographs"],
    "included":["Local coastal host or guide when specified","Sunset and tide-aware timing","Roam Ceylon transfer coordination","Palm-swing use, food and drinks only when explicitly confirmed"],
    "know":["Never touch, feed or crowd a turtle, whether it is in the water or nesting.","Palm swings are independently operated and their construction and availability can change.","Reef rock can be sharp or slippery and waves may cross apparently dry areas.","Sunset colour and wildlife sightings cannot be guaranteed."],
    "nearby":["Unawatuna Bay","Wijaya Beach","Mihiripenna","Galle Fort"],
    "tips":["Wear footwear suitable for sand and wet rock.","Keep at least several metres from wildlife and use a longer camera lens.","Do not buy food to attract turtles.","Enjoy the setting without making a swing photograph the measure of the experience."],
    "badges":["Sunset Experience","Eco Experience","Photography Spot","Couples Favourite"],
    "themes":["tropical","nature"]
  },
  {
    "slug":"galle-sunset-walking-along-the-historic-galle-fort-ramparts-overlooking-the-oc",
    "name":"Galle Fort Sunset Ramparts Walk",
    "category":"Photography",
    "short":"Walk Galle Fort’s seaward ramparts through the final light, reading bastions, harbour and ocean as one living World Heritage landscape.",
    "story":"Sunset changes the scale of Galle Fort. Heat leaves the stone, families and walkers gather along the ramparts, and the line between fortified city and Indian Ocean becomes more visible. Beginning before the final light allows the route to move between bastions without rushing, with time to understand why the walls follow the rocky promontory rather than a perfect European geometry.\n\nThis is not a substitute for the full heritage walk. It is a shorter, atmosphere-led experience centred on seaward defence, public life and photography. The guide chooses a safe route around weather, crowds and any conservation restrictions. The city remains lived-in, so residents, worshippers and private homes are treated with the same respect as the World Heritage fabric.",
    "duration":"Approximately 1.5–2 hours around sunset",
    "difficulty":"Easy, with steps, uneven rampart surfaces and exposed edges",
    "season":"Year-round; the route adapts to rain, wind, cloud and sunset time",
    "highlights":["Final light across bastions, lighthouse and the Indian Ocean","The relationship between the ramparts and Galle’s rocky promontory","Everyday life continuing within a World Heritage city","Changing viewpoints towards harbour and open sea","Unhurried architectural and coastal photography"],
    "unique":["The experience focuses on atmosphere and the seaward fortification line","It reveals Galle as a living city rather than an empty monument","Cloud and monsoon weather can be visually compelling even without a clear sunset","The shorter format pairs naturally with a separate daytime heritage walk"],
    "included":["Knowledgeable Fort guide when specified","Sunset route and timing planning","Roam Ceylon transfer coordination","Only refreshments or private access explicitly listed"],
    "know":["Rampart edges and some bastions have limited barriers.","Stone can become slippery in rain and strong wind can affect exposed sections.","Drone use and commercial photography require the appropriate permissions.","Sunset colour and visibility cannot be guaranteed."],
    "nearby":["Galle Lighthouse","Flag Rock Bastion","Dutch Reformed Church","Galle Harbour"],
    "tips":["Begin well before sunset rather than arriving for the final minute.","Use shoes with grip and supervise children closely on the ramparts.","Carry a compact rain layer during unsettled weather.","Stay after the sun drops briefly for softer blue-hour light when conditions are safe."],
    "badges":["Sunset Experience","Photography Spot","UNESCO Related","Couples Favourite"],
    "themes":["heritage","tropical"]
  },
  {
    "slug":"galle-walking-tour-of-galle-dutch-fort-17th-century-unesco-fortified-living-ci",
    "name":"Private Galle Fort Living Heritage Walk",
    "category":"History",
    "short":"Read Galle Fort as a living UNESCO city through its street plan, ramparts, religious buildings, houses and layers of Portuguese, Dutch, British and Sri Lankan life.",
    "story":"Galle Fort cannot be understood from its lighthouse alone. Founded as a fortified town by the Portuguese and developed extensively under the Dutch before British rule, it is significant because European planning and military engineering were adapted to South Asian climate, materials, craftsmanship and social life. Verandas, courtyards, narrow plots, drainage, bastions and the street grid reveal that interaction at human scale.\n\nA private walk connects the ramparts with civic buildings, the Dutch Reformed Church, mosque, lighthouse precinct, former hospital and residential streets, adjusting the route to opening hours and active worship. The story also continues beyond colonial administration: families, schools, businesses and religious communities keep the Fort alive. Roam Ceylon avoids romanticising empire and uses the city’s architecture to discuss trade, power, adaptation, conservation and contemporary life.",
    "duration":"Approximately 2.5–3.5 hours; museum or specialist extensions require additional time",
    "difficulty":"Easy, with extended walking, heat and some uneven paving",
    "season":"Year-round; morning or later afternoon offers more comfortable walking conditions",
    "highlights":["A UNESCO World Heritage urban ensemble still used as a living city","Ramparts and bastions adapted to the natural coastal promontory","Dutch-period street planning shaped by South Asian climate and craftsmanship","Religious, civic, commercial and residential layers within the walls","Interpretation that addresses both architectural achievement and colonial power"],
    "unique":["Galle’s value lies in the interaction of European forms and South Asian traditions","The Fort retains residential and public life rather than functioning only as a monument","A private guide can connect architecture with communities and conservation choices","The walk incorporates the lighthouse, former hospital and churches without duplicating them as separate checklist products"],
    "included":["Private heritage guide","Route adjusted to interests and opening conditions","Roam Ceylon timing and transfer coordination","Museum tickets, donations and private interiors only when explicitly listed"],
    "know":["Places of worship may restrict access during services and require modest dress.","Many historic houses remain private and must be viewed from public space.","Museum and interior opening hours can change without notice.","The walk discusses colonial history critically and respectfully rather than as decorative nostalgia."],
    "nearby":["Galle National Museum","National Maritime Museum","Galle Harbour","Unawatuna"],
    "tips":["Choose an early or late departure to reduce heat.","Dress so shoulders and knees can be covered for religious interiors.","Tell the guide whether architecture, maritime history, religion or contemporary life interests you most.","Pair this detailed walk with the shorter sunset ramparts experience on a different evening."],
    "badges":["Signature Experience","Cultural Heritage","UNESCO Related","Easy Walk","Roam Ceylon Recommended"],
    "themes":["heritage","culture"]
  },
  {
    "slug":"galle-observing-traditional-beeralu-lace-making-and-gem-cutting-workshops",
    "name":"Southern Beeralu Lace Artisan Encounter",
    "category":"Culture",
    "short":"Meet a confirmed southern artisan to understand beeralu bobbin lace through the movement, counting and inherited knowledge behind this delicate living craft.",
    "story":"Beeralu lace belongs to the cultural history of Sri Lanka’s southern coast. European bobbin-lace traditions arrived during the Portuguese period and were reshaped over generations by local makers, particularly around Galle and Matara. The apparent delicacy of a finished piece conceals disciplined work: threads are wound around bobbins, crossed and twisted over a pattern, and held by pins as the design grows.\n\nThis experience is arranged around a named artisan or credible workshop, not a staged retail demonstration. The host sets the pace and decides whether visitors may try a simple sequence. Gem cutting is not automatically bundled into the visit because it is a separate craft with different expertise and sourcing questions. Any purchase is made directly and transparently, with respect for the time required to produce handmade lace.",
    "duration":"Approximately 1.5–2 hours, depending on the artisan and workshop format",
    "difficulty":"Easy; hands-on participation depends on the host and traveller dexterity",
    "season":"Year-round by advance appointment with a confirmed artisan",
    "highlights":["A close view of bobbins, pattern, pins and thread working together","The southern history of beeralu as an adapted living craft","Conversation with a named maker or workshop host","Optional introduction to a simple lace sequence when offered","Transparent opportunity to support handmade production directly"],
    "unique":["The maker’s knowledge—not a souvenir display—is the centre of the visit","The experience distinguishes beeralu from unrelated gem-cutting demonstrations","Time and labour behind each piece become visible","A supplier-specific appointment protects authenticity and avoids invented availability"],
    "included":["Confirmed artisan or workshop appointment","Host-led demonstration and interpretation","Basic participation materials only when offered","Roam Ceylon timing and transport coordination"],
    "know":["Artisan availability is not guaranteed without advance confirmation.","Photography, handling and participation require the maker’s permission.","Purchases are optional and are not included in the experience price.","Complex pieces require substantial time; avoid bargaining that dismisses skilled labour."],
    "nearby":["Galle Fort","Matara craft communities","Galle National Museum","Unawatuna"],
    "tips":["Ask before photographing the artisan or close details of original patterns.","Allow the maker to demonstrate before attempting the bobbins.","Choose pieces for workmanship rather than demanding rapid custom production.","Confirm whether the encounter is in the Fort or elsewhere on the southern coast."],
    "badges":["Cultural Heritage","Advance Booking Recommended","Roam Ceylon Recommended"],
    "themes":["culture","heritage"]
  },
  {
    "slug":"galle-exploring-boutique-art-galleries-antique-shops-and-colonial-architecture",
    "name":"Galle Fort Art, Architecture & Design Walk",
    "category":"Culture",
    "short":"Explore how artists, designers and independent spaces work within Galle Fort’s historic fabric, with a route curated from venues genuinely operating during your stay.",
    "story":"Galle Fort’s contemporary identity is not separate from its architecture. Galleries, studios, small design businesses and carefully adapted interiors occupy the same narrow plots, verandas and courtyards that define the World Heritage townscape. A considered walk looks at how new uses fit within protected fabric and where design choices either respect or compete with the place.\n\nThe route is curated close to travel because galleries change exhibitions, shops move and private interiors may not accept walk-ins. It can include contemporary art, textiles, publishing, photography or adaptive reuse according to the traveller’s interests. Antique claims are treated cautiously: Roam Ceylon does not authenticate objects, facilitate restricted cultural-property exports or present shopping as heritage interpretation.",
    "duration":"Approximately 2–3 hours, shaped around current venues and opening times",
    "difficulty":"Easy, with extended walking and some steps inside adapted buildings",
    "season":"Year-round; the final route depends on exhibitions, appointments and venue opening days",
    "highlights":["Contemporary creative practice inside a protected historic city","Courtyards, verandas and narrow plots adapted for modern use","A route selected from galleries and studios actually operating during the stay","Conversation around conservation and adaptive reuse","Optional time with a curator, artist or designer when confirmed"],
    "unique":["The walk connects living creativity with the Fort’s architectural fabric","Content changes with exhibitions rather than remaining a fixed shopping list","Traveller interests can shape the medium and venues selected","Cultural-property and antique purchases are approached with legal and ethical caution"],
    "included":["Curated public-space route","Local creative host or specialist guide when specified","Appointments confirmed in the proposal","Purchases, refreshments and paid exhibitions only when explicitly listed"],
    "know":["Venues and exhibitions can change at short notice.","Many shops and galleries are commercial spaces; purchases are always optional.","Roam Ceylon does not certify age, origin or export legality of antiques.","Private photography may be restricted by artists, owners or exhibitions."],
    "nearby":["Galle Fort ramparts","Galle National Museum","Dutch Reformed Church","Galle Lighthouse"],
    "tips":["Share whether you prefer contemporary art, textiles, architecture or independent design.","Ask before photographing artwork or private interiors.","Keep receipts and verify export requirements before buying objects presented as antique.","Leave part of the route flexible for a strong current exhibition."],
    "badges":["Cultural Heritage","Easy Walk","Private Option Available"],
    "themes":["culture","heritage"]
  }
]$content$::jsonb) as x(slug text,name text,category text,short text,story text,duration text,difficulty text,season text,highlights jsonb,"unique" jsonb,included jsonb,know jsonb,nearby jsonb,tips jsonb,badges jsonb,themes jsonb);

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
from galle_editorial x
where e.slug=x.slug;

update public.experiences
set
  status='archived',
  active=false,
  image_review_notes=concat_ws(E'\n',nullif(image_review_notes,''),'Archived as a duplicate: the Dutch Hospital, lighthouse and historic churches are now interpreted within the complete Private Galle Fort Living Heritage Walk.'),
  updated_at=now()
where slug='galle-exploring-the-old-dutch-hospital-galle-lighthouse-and-historic-churches';

delete from public.experience_destinations ed
using galle_editorial x
where ed.experience_id=(select id from public.experiences where slug=x.slug);

insert into public.experience_destinations(experience_id,destination_id)
select e.id,d.id
from galle_editorial x
join public.experiences e on e.slug=x.slug
join public.destinations d on d.slug='galle'
on conflict do nothing;

delete from public.experience_themes et
using galle_editorial x
where et.experience_id=(select id from public.experiences where slug=x.slug);

insert into public.experience_themes(experience_id,theme_id)
select e.id,t.id
from galle_editorial x
cross join lateral jsonb_array_elements_text(x.themes) theme(slug)
join public.experiences e on e.slug=x.slug
join public.themes t on t.slug=theme.slug
on conflict do nothing;

insert into public.theme_destinations(theme_id,destination_id)
select t.id,d.id
from (values ('adventure'),('tropical'),('nature'),('heritage'),('culture')) wanted(slug)
join public.themes t on t.slug=wanted.slug
join public.destinations d on d.slug='galle'
on conflict do nothing;

do $$
declare
  content_count integer;
  destination_count integer;
  theme_count integer;
  archived_count integer;
begin
  select count(*) into content_count
  from public.experiences e
  join galle_editorial x on x.slug=e.slug
  where e.status='published'
    and e.active
    and length(e.full_description)>600
    and e.duration is not null
    and e.difficulty is not null;

  select count(distinct ed.experience_id) into destination_count
  from public.experience_destinations ed
  join public.experiences e on e.id=ed.experience_id
  join public.destinations d on d.id=ed.destination_id
  join galle_editorial x on x.slug=e.slug
  where d.slug='galle';

  select count(distinct et.experience_id) into theme_count
  from public.experience_themes et
  join public.experiences e on e.id=et.experience_id
  join galle_editorial x on x.slug=e.slug;

  select count(*) into archived_count
  from public.experiences
  where slug='galle-exploring-the-old-dutch-hospital-galle-lighthouse-and-historic-churches'
    and status='archived'
    and not active;

  if content_count<>7 or destination_count<>7 or theme_count<>7 or archived_count<>1 then
    raise exception 'Galle validation failed: content %, destination %, themes %, archived %',content_count,destination_count,theme_count,archived_count;
  end if;

  raise notice 'Galle result: 7 bespoke experiences published and mapped; 1 redundant Fort landmark record archived; images and pricing preserved.';
end $$;

commit;
