begin;

-- Editorial verification references (reviewed 2026-08-06):
-- https://www.colombocitytours.com/
-- https://www.srilanka.travel/colombo-city-tour
-- https://www.museum.gov.lk/v1/places-visit
-- https://gangaramaya.com/about/
-- https://geoffreybawa.com/visitor-guidelines
-- https://geoffreybawa.com/mission
-- https://colombolotustower.lk/
-- https://www.colombo.mc.gov.lk/colombo.php
-- Existing imagery and every pricing record are preserved for manual review.

create temporary table colombo_existing as
select * from jsonb_to_recordset($content$[
  {
    "slug":"colombo-exploring-gangaramaya-temple-and-seema-malaka-on-beira-lake",
    "name":"Gangaramaya Temple & Seema Malaka Sacred Journey",
    "category":"Culture",
    "short":"Enter two contrasting Buddhist spaces beside Beira Lake with a private guide who places Colombo’s living religious culture before its visual spectacle.",
    "story":"Gangaramaya is one of Colombo’s most important Buddhist institutions, established in the late nineteenth century and developed as a temple, centre of learning and place of public service. Its layered rooms contain devotional images and collections gathered across generations. Nearby, Seema Malaka sits more quietly over Beira Lake, creating a very different relationship between sacred architecture, water and the modern city.\n\nThis is a respectfully paced religious and cultural visit rather than a rapid photo circuit. A knowledgeable guide explains the history, ritual objects and contemporary role of the temple while leaving room for worshippers. Festival days, ceremonies and opening conditions can alter access. Roam Ceylon confirms current arrangements and ensures that dress, photography and conduct are discussed before arrival.",
    "duration":"Approximately 1.5–2.5 hours; longer during festivals or when combined with a private city journey",
    "difficulty":"Easy, with walking, steps and shoe removal at sacred areas",
    "season":"Year-round, subject to temple ceremonies, festivals and current visitor access",
    "highlights":["Gangaramaya’s richly layered sacred interiors and collections","The serene over-water setting of Seema Malaka","Interpretation of Buddhism within contemporary Colombo","Beira Lake and the surrounding city skyline","A visit paced around worship rather than photography alone"],
    "unique":["Two very different expressions of Buddhist architecture are experienced together","The temple remains an active religious and social institution","Colombo’s modern cityscape becomes part of the sacred setting","Interpretation distinguishes verified history from popular anecdote"],
    "included":["Private cultural host or licensed guide when stated in the proposal","Current access and timing coordination","Temple etiquette briefing","Entry contributions and transfers only when explicitly listed"],
    "know":["Shoulders and knees must be covered and shoes removed where requested.","Ceremonies and festival preparations can restrict access without notice.","Photography is secondary to worship and may be limited in some spaces.","Visitors should never pose with their backs toward a Buddha image."],
    "nearby":["Beira Lake","Colombo Lotus Tower","Viharamahadevi Park","Galle Face Green"],
    "tips":["Visit earlier in the day for a quieter and cooler experience.","Carry socks if walking barefoot is uncomfortable.","Ask before photographing monks, worshippers or ritual activity.","Allow the guide to adjust the sequence around active ceremonies."],
    "badges":["Cultural Heritage","Roam Ceylon Recommended","Advance Booking Recommended"],
    "themes":["culture","heritage"]
  },
  {
    "slug":"colombo-guided-street-food-tours-through-pettah-market-and-red-mosque-jami-ul-al",
    "name":"Pettah Markets, Red Mosque & Old Colombo Walk",
    "category":"History",
    "short":"Read Colombo’s mercantile history through Pettah’s trading streets, the Red Mosque and the surviving fabric of the old port city—without turning the walk into a food tour.",
    "story":"Pettah is best understood as a working commercial district shaped by port trade, migration, faith and enterprise. Its streets shift character block by block, moving between textiles, produce, hardware, religious buildings and family businesses. The red-and-white Jami Ul-Alfar Mosque is the most immediately recognisable landmark, but the value of the walk lies in understanding the wider urban network around it.\n\nA private host navigates the crowded streets at a deliberate pace, using public viewpoints and confirmed visitor access. The mosque is an active place of worship, not a guaranteed interior stop, and market traders are never treated as scenery. Food tasting is not included in this product. Travellers who want refreshments can pause at a vetted establishment separately without duplicating the experience as another food card.",
    "duration":"Approximately 2–3 hours; an express version can be arranged for business travellers",
    "difficulty":"Moderate urban walking through heat, crowds, uneven pavements and active traffic",
    "season":"Year-round; avoid the hottest hours and confirm religious observances and market conditions",
    "highlights":["Pettah’s dense network of specialist trading streets","Exterior interpretation of the Jami Ul-Alfar Red Mosque","Layers of colonial and post-colonial port-city history","Living examples of Colombo’s mercantile communities","A guided route through an otherwise overwhelming district"],
    "unique":["The market is interpreted as a functioning economic landscape","Religious architecture and commercial history are connected without forcing access","The route changes intelligently with crowds, closures and trading activity","The experience avoids staged encounters and unsolicited portrait photography"],
    "included":["Private Colombo host or licensed guide","A route adapted to current street and worship conditions","Cultural and photography etiquette briefing","Transfers or refreshments only when explicitly listed"],
    "know":["The Red Mosque is active; interior visitor access, dress rules and prayer times must be respected.","Pettah is crowded and traffic can be intense.","Ask before photographing traders, customers or worshippers.","Secure valuables discreetly and follow the guide at road crossings."],
    "nearby":["Colombo Fort","Old Town Hall","Dutch Museum","Colombo Harbour district"],
    "tips":["Wear light clothing and closed walking shoes.","Carry minimal valuables and a small bottle of water.","Choose morning for active markets with less afternoon heat.","Let the guide handle route changes rather than expecting a rigid checklist."],
    "badges":["Cultural Heritage","Photography Spot","Roam Ceylon Recommended"],
    "themes":["culture","heritage"]
  },
  {
    "slug":"colombo-evening-walks-and-street-food-sampling-at-galle-face-green",
    "name":"Galle Face Sunset & Colombo Street Flavours",
    "category":"Food",
    "short":"Join Colombo at its oceanfront meeting place for sunset, sea air and a carefully hosted introduction to the street flavours enjoyed along Galle Face Green.",
    "story":"Galle Face Green is Colombo’s great public seafront: a ribbon of open space where families, office workers, kite flyers and visitors gather as the heat softens. The experience begins as a city walk rather than a tasting checklist, reading the shoreline, historic hotel frontage and changing skyline before sampling selected snacks from vendors whose current preparation and handling have been reviewed.\n\nThe menu is never guaranteed in advance because stalls, weather and availability change. A host explains ingredients and helps travellers choose portions without presenting every item as suitable for every dietary need. The evening can end with a reserved drink or dinner nearby when specified, but the public energy of Galle Face remains the centre of the experience.",
    "duration":"Approximately 2–2.5 hours around sunset",
    "difficulty":"Easy walking on open ground, with crowds, wind and limited seating",
    "season":"Year-round when weather permits; rain, strong coastal wind or public events can alter the route",
    "highlights":["Sunset beside Colombo’s most important public seafront","A changing view of the historic and contemporary skyline","Selected street snacks introduced by a local host","Kite-flying, family life and after-work Colombo","Optional continuation to a confirmed nearby venue"],
    "unique":["The experience captures Colombo as residents use it rather than as a monument circuit","Tastings support atmosphere and interpretation instead of becoming a quantity challenge","Vendor selection is reviewed for the specific evening","The route works naturally for a short business-travel window"],
    "included":["Private or small-group local host when specified","A defined number of tastings stated in the proposal","Dietary discussion before the experience","Reserved continuation, beverages and transfers only when listed"],
    "know":["Street-food allergens and cross-contamination cannot always be eliminated.","Stall availability and the exact menu change daily.","Public events, rain or security arrangements can restrict sections of the Green.","The coastline is for walking and viewing; swimming is not part of this experience."],
    "nearby":["Galle Face Hotel","Old Parliament","Colombo Fort","Port City waterfront"],
    "tips":["Arrive hungry, but share dietary restrictions before vendor selection.","Carry a light layer during windy evenings.","Keep the schedule flexible around sunset and rain.","Choose the optional seated finish when travelling with young children or limited mobility."],
    "badges":["Sunset Experience","Family Friendly","Most Popular","Roam Ceylon Recommended"],
    "themes":["culture","tropical"]
  },
  {
    "slug":"colombo-touring-the-national-museum-of-colombo-and-art-galleries",
    "name":"Colombo National Museum & Curated Art Journey",
    "category":"History",
    "short":"Explore Sri Lanka’s national collections with expert context, then continue into a carefully selected Colombo art space whose current exhibition has been verified.",
    "story":"The Colombo National Museum provides essential context for an island journey, bringing together archaeology, royal heritage, religious art and material culture from different regions and periods. A focused visit is more rewarding than trying to absorb every gallery. The guide selects objects that connect directly with the traveller’s route—Anuradhapura, Polonnaruwa, Kandy, the coast or another chosen destination.\n\nThe second chapter responds to Colombo’s changing art calendar. Rather than naming a permanent gallery circuit that may be closed or between exhibitions, Roam Ceylon confirms one appropriate public museum, gallery, studio or curatorial programme for the date. Viharamahadevi Park can provide a quiet transition when timing permits. Museum tickets, exhibition access and guide credentials are confirmed before proposal.",
    "duration":"Approximately 3–4 hours; a focused museum-only version takes about 2 hours",
    "difficulty":"Easy to moderate indoor walking, with seating and accessibility checked for the selected venues",
    "season":"Year-round, subject to museum opening days, public holidays and the current exhibition calendar",
    "highlights":["A focused reading of Sri Lanka’s principal national collection","Objects connected to the traveller’s wider island route","A current Colombo exhibition selected after curatorial review","Time for questions rather than a rushed gallery checklist","Optional pause through Viharamahadevi Park"],
    "unique":["National history and contemporary creative practice are placed in conversation","The museum route is tailored to the journey already being designed","The art venue is verified for the actual travel date","The experience can be led by a specialist rather than a general transfer guide"],
    "included":["Specialist cultural guide when specified","Museum and gallery schedule verification","Entry tickets only when listed in the proposal","Private transfers and refreshments only when included"],
    "know":["The National Museum and galleries can close on public holidays or for maintenance.","Some collections or exhibition rooms may be temporarily unavailable.","Photography rules vary by institution and exhibition.","Accessibility must be checked for every additional gallery or studio."],
    "nearby":["Viharamahadevi Park","Independence Square","Nelum Pokuna Theatre","Colombo 07 design district"],
    "tips":["Tell the guide which destinations you will visit so the museum route can be personalised.","Allow time for one strong contemporary venue rather than several hurried stops.","Carry a light layer for air-conditioned galleries.","Confirm specialist interests such as textiles, Buddhism or modern architecture in advance."],
    "badges":["Cultural Heritage","Photography Spot","Private Option Available","Roam Ceylon Recommended"],
    "themes":["culture","heritage"]
  },
  {
    "slug":"mountlavinia-colonial-heritage-dining-at-the-historic-mount-lavinia-hotel",
    "name":"Mount Lavinia Heritage Dining Evening",
    "category":"Food",
    "short":"Pair the layered history of Mount Lavinia’s landmark hotel with a confirmed dining experience overlooking Colombo’s southern coast.",
    "story":"Mount Lavinia’s best-known historic hotel occupies a dramatic headland south of central Colombo and carries stories from the island’s British colonial period. A premium evening should distinguish documented history from romance repeated as legend. The experience therefore combines a hosted architectural introduction, where available, with a restaurant reservation chosen for the traveller’s occasion, dietary needs and preferred atmosphere.\n\nThe exact restaurant, table location and menu format are confirmed before booking; an ocean-facing table is requested but never guaranteed. Outdoor dining can move under cover because of rain or wind. This is retained as a distinct heritage-and-hospitality product, separate from the more informal Mount Lavinia beach and seafood journey.",
    "duration":"Approximately 2.5–3.5 hours, depending on the confirmed dining plan",
    "difficulty":"Easy; step-free routing and table access require advance confirmation",
    "season":"Year-round; outdoor arrangements depend on weather, hotel operations and private events",
    "highlights":["A landmark headland setting overlooking the Indian Ocean","Context on Mount Lavinia’s colonial-era development","A dining plan selected for the traveller rather than a generic buffet promise","Optional sunset timing when conditions and availability align","A refined final evening within the wider Colombo stay"],
    "unique":["Historic setting and contemporary hospitality are curated as one evening","Documented history is separated from popular romantic legend","The table and menu are confirmed rather than implied","The experience can suit couples, families or private business hosting"],
    "included":["Advance restaurant reservation","Hosted heritage introduction only when confirmed","Dietary and occasion notes shared with the venue","Menu, beverages and transfers only when explicitly listed"],
    "know":["A particular table, sunset or outdoor setup cannot be guaranteed.","Private events can alter access to heritage spaces.","The final menu format and payment inclusions are stated in the proposal.","Smart-casual or venue-specific dress may apply."],
    "nearby":["Mount Lavinia Beach","Dehiwala","Colombo city centre","Attidiya wetlands"],
    "tips":["Share celebration, dietary and accessibility needs before the venue is confirmed.","Request sunset timing early but keep expectations weather-aware.","Choose a set menu for hosted business dining and à la carte for a more flexible evening.","Allow extra road time during Colombo’s evening peak."],
    "badges":["Cultural Heritage","Couples Favourite","Luxury Upgrade Available","Advance Booking Recommended"],
    "themes":["culture","tropical"]
  },
  {
    "slug":"mountlavinia-sunset-beach-walks-and-coastal-promenade-dining-near-colombo",
    "name":"Mount Lavinia Sunset, Beach Walk & Seafood Table",
    "category":"Food",
    "short":"Follow Colombo’s southern shoreline into sunset before settling at a vetted Mount Lavinia seafood table selected for quality, comfort and the traveller’s dietary needs.",
    "story":"Mount Lavinia offers a softer coastal counterpoint to central Colombo. The experience begins with a privately paced beach walk shaped by tide, weather and the mobility of the group, observing the railway edge, fishing activity and evening life without promising an empty or resort-exclusive shore. A local host provides context and keeps the route within safe public access.\n\nDinner follows at a currently vetted restaurant. Available fish and shellfish vary with supply, season and lawful sourcing, so no species is guaranteed until confirmed. The venue may sit directly on the beach or slightly inland when that provides the stronger kitchen and service. This record absorbs the former generic seafood listing so travellers see one complete coastal evening rather than overlapping cards.",
    "duration":"Approximately 3–4 hours including the walk and dinner",
    "difficulty":"Easy to moderate walking on sand; restaurant accessibility is confirmed separately",
    "season":"Year-round with same-day coastal checks; the southwest monsoon can bring rain and rougher seas",
    "highlights":["A sunset-paced walk along Mount Lavinia’s lived-in shoreline","Local context beyond a generic beach stop","A seafood venue selected for current kitchen and service quality","Menu guidance based on actual availability","An easy coastal evening within a Colombo itinerary"],
    "unique":["Beach atmosphere and dining are combined without duplicating two weak products","Venue choice follows the traveller, dietary needs and current quality","The shoreline is presented honestly as public and urban-adjacent","The plan works well after meetings or on a Colombo arrival day"],
    "included":["Local host for the beach walk when specified","Advance restaurant selection and reservation","Dietary notes shared with the venue","Dinner, beverages and transfers only when stated in the proposal"],
    "know":["Swimming is not included and sea conditions must be assessed independently.","Seafood allergies and cross-contamination risks must be disclosed.","Beach access, weather and railway-side conditions can change the walking route.","The final bill format is confirmed before booking."],
    "nearby":["Mount Lavinia Hotel","Dehiwala","Attidiya wetlands","Colombo city centre"],
    "tips":["Wear footwear suitable for sand and a restaurant setting.","Tell Roam Ceylon whether atmosphere or a particular menu style matters more.","Keep electronics protected from salt spray and sudden showers.","Allow road time from central Colombo during the evening peak."],
    "badges":["Sunset Experience","Couples Favourite","Family Friendly","Roam Ceylon Recommended"],
    "themes":["tropical","culture"]
  }
]$content$::jsonb) as x(
  slug text,name text,category text,short text,story text,duration text,difficulty text,
  season text,highlights jsonb,"unique" jsonb,included jsonb,know jsonb,nearby jsonb,
  tips jsonb,badges jsonb,themes jsonb
);

update public.experiences e set
  name=x.name,category=x.category,short_description=x.short,full_description=x.story,
  duration=x.duration,difficulty=x.difficulty,best_season=x.season,highlights=x.highlights,
  unique_points=x."unique",included=x.included,things_to_know=x.know,
  nearby_attractions=x.nearby,traveller_tips=x.tips,badges=x.badges,
  seo_title=x.name || ' | Roam Ceylon',seo_description=x.short,
  status='published',active=true,updated_at=now()
from colombo_existing x where e.slug=x.slug;

-- The third Mount Lavinia food record duplicated the complete sunset-and-seafood product above.
update public.experiences set status='archived',active=false,updated_at=now()
where slug='mountlavinia-sampling-authentic-local-street-food-and-fresh-seafood-along-the-shore';

create temporary table colombo_new as
select * from jsonb_to_recordset($content$[
  {
    "slug":"colombo-private-old-new-city-journey","name":"Private Old & New Colombo City Journey","category":"Culture",
    "short":"Understand Colombo as a living port city through a privately paced route connecting Fort, civic landmarks, Independence Square and the contemporary waterfront.",
    "story":"Colombo rewards travellers who can see its layers rather than chase isolated landmarks. This private city journey connects the old commercial Fort, civic architecture, public seafront and greener residential quarters, explaining how a colonial port became Sri Lanka’s principal commercial city. The route may include exterior views of Old Parliament, the Fort clock tower, the Dutch Hospital precinct, Town Hall and Independence Memorial Hall, with stops chosen for current access and the traveller’s interests.\n\nTraffic, security arrangements and public events make a rigid circuit poor DMC practice. Roam Ceylon therefore confirms a realistic route and duration for the day, using an air-conditioned private vehicle and guided walking segments. An express plan serves business travellers with limited time; half-day and full-day plans remain rate options attached to this one canonical experience rather than duplicate cards.",
    "duration":"Express 2-hour, private half-day or full-day plan; the confirmed route reflects traffic and interests","difficulty":"Easy to moderate, combining private transport with optional walking","season":"Year-round, with route changes for traffic, security restrictions, public holidays and weather",
    "highlights":["Colombo Fort and its port-city history","Old Parliament and the Galle Face civic waterfront","Independence Memorial Hall and the greener city quarters","Dutch Hospital precinct and surviving commercial architecture","A route tailored to business, architecture, history or first-time orientation"],
    "unique":["One flexible canonical product replaces several repetitive city-tour cards","The itinerary is shaped around real traffic and access","Express and extended plans use pricing options rather than duplicated experiences","The guide connects Colombo with the traveller’s wider Sri Lankan journey"],
    "included":["Private air-conditioned vehicle and professional driver","Licensed or specialist city guide when specified","Route and access planning","Admissions, refreshments and parking only when listed"],
    "know":["Colombo traffic can significantly change the order and number of stops.","Government and port-adjacent buildings may permit exterior viewing only.","Religious sites are included only when agreed and appropriately dressed.","A full list of drive-by landmarks is not a promise of entry."],
    "nearby":["Colombo Fort","Galle Face Green","Independence Square","Viharamahadevi Park"],
    "tips":["Choose the express plan after meetings and the half-day plan for a first visit.","Share architecture, shopping or history interests before routing.","Avoid scheduling an airport transfer immediately after the tour.","Use walking sections selectively during the hottest hours."],
    "badges":["Signature Experience","Private Option Available","Family Friendly","Roam Ceylon Recommended"],"themes":["culture","heritage"]
  },
  {
    "slug":"colombo-open-deck-double-decker-city-sightseeing","name":"Colombo Open-Deck Double-Decker Sightseeing Journey","category":"Culture",
    "short":"See Colombo from the upper deck of Sri Lanka’s recognised open-deck city sightseeing service, with operating dates and the exact route confirmed before booking.",
    "story":"The open-deck double-decker offers a distinctive elevated view of Colombo’s boulevards, civic buildings, temples, commercial quarters and oceanfront. Sri Lanka Tourism and Ebert Silva Holidays identify Colombo City Tour as the country’s open-deck city sightseeing service. The experience is valuable for first-time visitors, families and business travellers who want broad orientation without a long walking programme.\n\nThis is not sold against an old timetable. Operating days, departure point, route, vehicle type, weather policy and seat availability must be reconfirmed for the actual travel date. Roam Ceylon books the current service when operating and provides a private city alternative when it is unavailable. The public bus format is distinct from the bespoke Old & New Colombo journey and is clearly described before confirmation.",
    "duration":"Typically a scheduled city circuit; exact duration and departure time require current operator confirmation","difficulty":"Easy seated sightseeing, with stair access to the upper deck and exposure to sun, wind or rain","season":"Subject to current operator schedule and suitable weather; no historic timetable is treated as current",
    "highlights":["An elevated open-air perspective over Colombo","A broad first orientation to the city’s districts and landmarks","The character of a classic double-decker sightseeing journey","A low-walking option for limited city time","Commentary or hosting as provided by the confirmed service"],
    "unique":["The format is different from a private vehicle tour","The recognised operator is verified before every booking","No obsolete schedule or price is hardcoded","A private fallback can be proposed without pretending it is the same product"],
    "included":["Confirmed seat on the operating city-tour service","Operator-provided commentary or host only when confirmed","Roam Ceylon departure-point coordination","Hotel transfers and refreshments only when listed"],
    "know":["The service may not operate daily and can change without notice.","Upper-deck seating is weather-exposed and reached by stairs.","Routes can change because of traffic, security or public events.","Seat location and uninterrupted landmark views cannot be guaranteed."],
    "nearby":["Colombo Fort","Galle Face Green","Independence Square","Gangaramaya Temple"],
    "tips":["Keep a private-city alternative available until operation is confirmed.","Use sun protection and secure hats or loose belongings upstairs.","Choose a lower-deck seat if stairs or weather exposure are unsuitable.","Do not build a tight onward connection around a traffic-dependent return time."],
    "badges":["Family Friendly","Photography Spot","Advance Booking Recommended","Roam Ceylon Recommended"],"themes":["culture"]
  },
  {
    "slug":"colombo-geoffrey-bawa-tropical-modernism","name":"Geoffrey Bawa & Colombo Tropical Modernism","category":"Architecture",
    "short":"Enter Geoffrey Bawa’s carefully preserved Colombo world through a pre-booked Number 11 visit and a privately interpreted architectural journey.",
    "story":"Number 11, Geoffrey Bawa’s former Colombo home, is one of the most intimate places through which to understand tropical modernism. Rooms, courtyards, collected art and calibrated light reveal ideas that cannot be reduced to a drive-by list of buildings. The Geoffrey Bawa Trust controls visits and group sizes, and guests follow the curator or guide throughout the property.\n\nRoam Ceylon anchors the experience around an officially confirmed Number 11 appointment, then adds only architectural context that is publicly accessible or separately approved. The route may discuss Colombo buildings associated with Bawa and his contemporaries without implying private entry. This is a specialist experience for design-minded travellers, architects and premium incentive groups.",
    "duration":"Approximately 2.5–4 hours, centred on a pre-booked Number 11 visit","difficulty":"Easy to moderate; heritage-property stairs and accessibility require confirmation","season":"Year-round, strictly subject to Geoffrey Bawa Trust appointments and property conditions",
    "highlights":["A curated visit to Geoffrey Bawa’s Number 11 residence","Courtyards, collections and spatial sequences experienced at human scale","Specialist interpretation of tropical modernism","Selected public architectural context across Colombo","A small-format experience protected from mass-tour pacing"],
    "unique":["The experience is anchored by the Trust-managed historic property","Interior access is never implied without an appointment","Architecture is interpreted through space, climate and daily life","It offers specialist depth for design and cultural travellers"],
    "included":["Confirmed Number 11 reservation","Specialist architectural host when stated","Private transfers between agreed points","Admissions and refreshments only when listed"],
    "know":["Advance booking and the Trust’s visitor rules are mandatory.","Group sizes and photography are controlled by the property.","Some areas may not be accessible to travellers with limited mobility.","Additional buildings are usually viewed from public areas unless permission is confirmed."],
    "nearby":["Colombo 03","Colombo National Museum","Independence Square","Colombo design district"],
    "tips":["Book early and share professional architecture interests in advance.","Carry minimal bags and follow the curator’s photography rules.","Allow the home to be experienced slowly rather than adding too many stops.","Pair with Lunuganga on another day for a deeper Bawa journey."],
    "badges":["Signature Experience","Cultural Heritage","Advance Booking Recommended","Roam Ceylon Recommended"],"themes":["culture","heritage"]
  },
  {
    "slug":"colombo-curated-ceylon-tea-tasting","name":"Curated Ceylon Tea Tasting in Colombo","category":"Food",
    "short":"Taste Sri Lanka’s principal tea-growing regions side by side with a specialist who connects elevation, manufacture and flavour to the landscapes beyond Colombo.",
    "story":"Colombo has long been central to the commercial story of Ceylon tea, even though the gardens lie beyond the city. A specialist tasting allows travellers to compare teas from different elevations and regions before or after visiting the hill country. The session focuses on leaf, manufacture, water, aroma and flavour rather than on souvenir shopping alone.\n\nRoam Ceylon selects a current tea specialist, tasting room or private host and confirms the exact flight of teas. Estate names, harvests and grades depend on availability. A premium upgrade may include food pairing or a private session, but retail purchasing remains optional and transparent.",
    "duration":"Approximately 1.5–2 hours; private pairing sessions may run longer","difficulty":"Easy seated experience","season":"Year-round, subject to specialist availability and the confirmed tasting collection",
    "highlights":["A comparative tasting across Sri Lankan tea regions","Guidance on elevation, processing and grade","A direct connection between cup and hill-country landscape","Practical insight into brewing and buying tea","Optional private food pairing when confirmed"],
    "unique":["The experience is educational rather than a disguised retail stop","Tea regions are compared in one controlled tasting","The content complements a future or completed plantation visit","The tasting flight is confirmed rather than generically promised"],
    "included":["Hosted tasting with a defined tea flight","Water and palate accompaniments as specified","Private room or pairing only when listed","Transfers and retail purchases excluded unless stated"],
    "know":["The exact estates, seasons and grades vary with stock.","Caffeine sensitivity should be discussed before the session.","Retail purchases are optional and priced separately.","Accessibility depends on the selected venue."],
    "nearby":["Colombo Fort","Colombo 07","National Museum","Galle Face"],
    "tips":["Avoid strong coffee or perfume immediately before tasting.","Share existing tea knowledge so the host can set the right depth.","Take notes on regions you will later visit.","Request a private pairing early for business hosting or celebrations."],
    "badges":["Roam Ceylon Recommended","Private Option Available","Luxury Upgrade Available"],"themes":["culture"]
  },
  {
    "slug":"colombo-lotus-tower-twilight-panorama","name":"Lotus Tower Twilight Panorama","category":"Photography",
    "short":"Rise above Colombo near twilight for a 360-degree reading of the city, Beira Lake and the Indian Ocean from Sri Lanka’s tallest tower.",
    "story":"Colombo Lotus Tower has become the city’s defining contemporary landmark. Its observation level offers a broad view across the port, ocean, Beira Lake, dense commercial districts and the greener city beyond. Scheduled around late afternoon, the experience follows the change from daylight geography to the illuminated city rather than treating the tower as a quick elevator ride.\n\nOfficial opening hours, ticket categories and access can change, particularly around events and maintenance. Roam Ceylon confirms the current visitor product and admission before proposal; published prices are never copied permanently into the experience. Pixel Bloom or another tower attraction is included only when specified.",
    "duration":"Approximately 1.5–2.5 hours including entry and unhurried observation time","difficulty":"Easy, with high-speed lift travel; medical and accessibility guidance must be reviewed","season":"Year-round, with visibility, weather, events and tower operations affecting the experience",
    "highlights":["A 360-degree perspective over Colombo and the Indian Ocean","The transition from daylight to the illuminated city","Beira Lake, port and urban geography read from above","Photography from Sri Lanka’s tallest tower","Optional additional tower attraction when confirmed"],
    "unique":["The view explains Colombo’s scale more clearly than street level","Twilight gives two visual experiences in one visit","Official ticket and operational conditions are checked each time","The experience works naturally after a business day"],
    "included":["Confirmed observation-deck admission","Timed arrival planning","Additional attraction only when listed","Private transfers and refreshments only when specified"],
    "know":["Visibility and sunset colour cannot be guaranteed.","Hours and ticket inclusions can change without notice.","The high-speed lift may be unsuitable for some medical conditions.","Professional photography requires separate permission."],
    "nearby":["Beira Lake","Gangaramaya Temple","Pettah","Colombo Fort"],
    "tips":["Arrive before sunset rather than at the advertised sunset minute.","Keep lenses close to glass to reduce reflections.","Check haze and rain expectations without demanding perfect visibility.","Allow time after meetings for Colombo traffic."],
    "badges":["Sunset Experience","Photography Spot","Family Friendly","Most Popular"],"themes":["culture"]
  },
  {
    "slug":"colombo-after-dark-rooftop-dining-live-music","name":"Colombo After Dark: Rooftops, Dining & Live Music","category":"Food",
    "short":"Discover contemporary Colombo after dark through a reserved progression of skyline drinks, a strong kitchen and live music selected for the actual night.",
    "story":"Colombo’s evening scene changes constantly, making a fixed list of fashionable venues the quickest route to an outdated product. Roam Ceylon curates this experience for the specific travel date, selecting a rooftop or view-led opening, a restaurant with current kitchen quality and a live-music or cultural venue only when its programme is confirmed.\n\nThe experience can be intimate, social or suitable for hosted business travellers. The proposal identifies every confirmed venue, dress expectation, reservation and included item. It never guarantees nightlife atmosphere, a particular performer or uninterrupted skyline views without verification.",
    "duration":"Approximately 4–5 hours; a shorter dinner-and-rooftop plan is available","difficulty":"Easy, with venue accessibility and late-night transport confirmed","season":"Year-round; venue schedules, weather and entertainment programmes require date-specific verification",
    "highlights":["A rooftop or skyline-led beginning","Dinner at a restaurant selected for current quality","Live music or cultural entertainment when confirmed","Private safe transport between venues","A plan shaped for couples, friends or business hosting"],
    "unique":["The itinerary is curated for the date rather than frozen in website copy","Every inclusion and reservation is explicit","The tone can be elegant without becoming a generic nightclub crawl","Transport and pacing are managed as part of the product"],
    "included":["Date-specific venue research and reservations","Private evening transport","Host when specified","Food, beverages, cover charges and gratuities only when listed"],
    "know":["Venues, performers and opening hours can change.","Dress codes and age restrictions may apply.","Alcohol is optional and never required for the experience.","Outdoor rooftops may close because of rain or wind."],
    "nearby":["Galle Face","Colombo Fort","Colombo 03","Beira Lake"],
    "tips":["Share music, cuisine and atmosphere preferences before curation.","Carry identification where venues require it.","Use the shorter plan after a full business day.","Confirm dietary needs and preferred spending level early."],
    "badges":["Couples Favourite","Luxury Upgrade Available","Advance Booking Recommended"],"themes":["culture"]
  },
  {
    "slug":"colombo-contemporary-design-artisan-journey","name":"Contemporary Colombo Design & Artisan Journey","category":"Culture",
    "short":"Meet Colombo through independent design, handloom, batik and contemporary craft at a small selection of studios and retailers chosen for provenance rather than sales pressure.",
    "story":"Colombo brings together designers, makers and retailers working with Sri Lankan textiles, craft traditions and contemporary form. A private journey can reveal how handloom, batik, jewellery, ceramics and modern design move between heritage and present-day city life. The experience is curated around the traveller’s interests and the availability of meaningful access.\n\nThis is not a commission-led shopping circuit. Roam Ceylon discloses any commercial relationship, favours registered and reputable businesses, and never guarantees meeting a designer unless an appointment is confirmed. Purchases remain optional. Gem and jewellery visits are included only with appropriately registered businesses and clear certification practices.",
    "duration":"Approximately 3–4 hours; specialist studio appointments may require a longer private plan","difficulty":"Easy, with private transport and venue accessibility confirmed","season":"Year-round, subject to studio opening days and appointments",
    "highlights":["A curated view of contemporary Sri Lankan design","Handloom, batik and craft interpreted beyond souvenirs","Optional studio or designer appointment when confirmed","Transparent, pressure-free purchasing","A private route adapted to textile, jewellery or interiors interests"],
    "unique":["Curation is based on provenance and design quality","Commercial relationships are disclosed","Shopping remains optional rather than the hidden purpose of a city tour","The route can serve collectors, designers and business gifting needs"],
    "included":["Private design-aware host when specified","Appointment and route coordination","Private transport between agreed venues","Purchases, shipping and certification charges excluded unless stated"],
    "know":["Designer meetings and workshop access require confirmation.","Gem and jewellery purchases should use registered sellers and documented certification.","Opening hours can differ from standard retail hours.","International shipping and customs remain separate services."],
    "nearby":["Colombo 03","Colombo 07","National Museum","Independence Square"],
    "tips":["Share sizes, materials, budget and design interests before curation.","Ask for provenance and care information before purchasing.","Avoid scheduling too many stores; three strong visits are more valuable.","Request business-gifting support well before departure."],
    "badges":["Private Option Available","Luxury Upgrade Available","Roam Ceylon Recommended"],"themes":["culture"]
  },
  {
    "slug":"colombo-royal-golf-private-round","name":"Private Colombo Golf Experience","category":"Sports",
    "short":"Arrange a professionally coordinated round at an established Colombo golf club, with visitor access, tee time, equipment and club rules verified before confirmation.",
    "story":"A round of golf can turn a Colombo business stay into a meaningful sporting day, but availability depends on club policy, competitions, maintenance, handicap requirements and member commitments. Roam Ceylon approaches an appropriate established Colombo club—such as the Royal Colombo Golf Club when visitor play is available—and confirms every operational detail before presenting the experience.\n\nThe proposal states the named course, holes, tee time, green fee, caddie arrangement, equipment hire, dress code and transport. No historic visitor rate is reused. The experience can be arranged for an individual traveller, private group or corporate hosting, subject to the club’s approval.",
    "duration":"Approximately 4–6 hours for 18 holes including arrival and preparation; shorter formats require confirmation","difficulty":"Active; golf experience, walking/cart needs and club requirements must be discussed","season":"Year-round subject to course condition, competitions, maintenance and tee-time availability",
    "highlights":["A confirmed round at a named Colombo course","Tee-time and club-rule coordination","Caddie, cart and equipment arrangements stated clearly","Private transfers suitable for business travellers","Optional corporate or hosted format when approved"],
    "unique":["The product is built around actual club confirmation","Every fee and requirement is separated transparently","It serves both dedicated golf travellers and business-trip extensions","No claim of access is made before the club accepts the booking"],
    "included":["Tee-time request and club coordination","Private return transfer when listed","Green fee, caddie, cart and rental equipment only as itemised","Hosted play only when explicitly confirmed"],
    "know":["Visitor access and tee times are not guaranteed.","Handicap evidence, dress rules and footwear requirements may apply.","Weather and course maintenance can interrupt play.","All club charges must be reconfirmed before quotation."],
    "nearby":["Colombo 07","Independence Square","National Museum","Central Colombo"],
    "tips":["Provide handicap, handedness and equipment needs early.","Keep a flexible tee-time window around business commitments.","Pack or confirm compliant golf attire.","Choose a shorter format only after the club confirms availability."],
    "badges":["Advance Booking Recommended","Private Option Available","Luxury Upgrade Available"],"themes":["adventure"]
  },
  {
    "slug":"colombo-family-natural-history-park-discovery","name":"Family Colombo: Natural History & Park Discovery","category":"Nature",
    "short":"Give younger travellers an accessible introduction to Sri Lanka’s wildlife and city life through the Natural History Museum and a relaxed park-based discovery.",
    "story":"Colombo’s National Museum of Natural History and neighbouring green spaces can provide a useful first chapter for families before encountering the island’s ecosystems in the field. A family-aware guide selects age-appropriate stories around animals, geology and conservation rather than attempting every display. Time outdoors in Viharamahadevi Park allows children to reset between indoor visits.\n\nThe experience is adjusted to age, attention span and weather. Museum opening, display access and park conditions are confirmed before travel. It does not replace a wildlife safari or promise interactive exhibits that may not be available.",
    "duration":"Approximately 2.5–3.5 hours, adapted to children’s ages and energy","difficulty":"Easy; stroller and step-free access require current confirmation","season":"Year-round, with outdoor time adjusted for heat and rain",
    "highlights":["Age-aware natural-history interpretation","A gentle introduction to wildlife before an island journey","Time outdoors in central Colombo","Flexible pacing for families","Connections to later national-park and coastal experiences"],
    "unique":["The route is built around attention span rather than adult museum pacing","Indoor learning and outdoor reset are balanced","Content connects directly to destinations selected in the journey","The experience avoids overpromising interactive facilities"],
    "included":["Family-aware guide when specified","Opening and access confirmation","Entry tickets only when listed","Snacks and private transfers only when included"],
    "know":["Displays and galleries can close temporarily.","Children must remain supervised in museums and public parks.","Heat or rain can shorten outdoor time.","Accessibility should be reconfirmed for the travel date."],
    "nearby":["Viharamahadevi Park","Colombo National Museum","Nelum Pokuna Theatre","Independence Square"],
    "tips":["Share ages and interests before the guide plans the route.","Choose morning for cooler outdoor time.","Carry water and a light snack for young travellers.","Keep the remainder of the day lightly scheduled."],
    "badges":["Family Friendly","Child Friendly","Easy Walk"],"themes":["nature","culture"]
  },
  {
    "slug":"colombo-greater-city-wetlands-birdlife","name":"Greater Colombo Wetlands & Urban Birdlife","category":"Nature",
    "short":"Step beyond the commercial centre into Greater Colombo’s wetland edge with a naturalist who selects a suitable public site for season, access and water conditions.",
    "story":"Greater Colombo contains important urban wetland landscapes that support waterbirds, reptiles, butterflies and flood regulation alongside a dense metropolitan region. A private naturalist-led visit may use an appropriate managed public site such as Beddagana or Diyasaru when current opening, habitat and access conditions are suitable. The exact location is named in the final proposal.\n\nThis is quiet urban nature observation rather than a guaranteed species hunt. The guide controls distance, avoids playback where inappropriate and adjusts the route for rain, heat and water level. It works particularly well for business travellers who cannot add a distant national park but still want responsible ecological context.",
    "duration":"Approximately 2.5–4 hours including central Colombo transfers","difficulty":"Easy to moderate walking on managed paths that can be wet or uneven","season":"Year-round, with bird activity, heat, rainfall and water levels changing seasonally",
    "highlights":["Wetland ecology within the Greater Colombo metropolitan region","Seasonal waterbirds and smaller urban wildlife","Naturalist interpretation of habitat and flood regulation","A quiet counterpoint to the commercial city","A short nature option for business travellers"],
    "unique":["The city is understood as an ecological as well as commercial landscape","The exact site is chosen from current field conditions","Wildlife observation remains non-intrusive","The product offers nature without pretending to be a national-park safari"],
    "included":["Private naturalist when specified","Current site and access confirmation","Basic binocular support only when listed","Admissions and transfers only as stated"],
    "know":["No bird or wildlife sighting is guaranteed.","Paths can be wet, exposed or temporarily closed.","Mosquitoes, heat and sudden rain are normal wetland conditions.","Playback, feeding and close approach to wildlife are not part of the experience."],
    "nearby":["Sri Jayawardenepura Kotte","Diyatha Uyana","Independence Square","Central Colombo"],
    "tips":["Choose early morning for cooler conditions and greater bird activity.","Wear muted clothing and closed shoes.","Carry insect repellent and rain protection.","Keep binoculars ready before reaching open water."],
    "badges":["Eco Experience","Wildlife","Photography Spot","Easy Walk"],"themes":["nature","wildlife"]
  },
  {
    "slug":"colombo-port-city-waterfront-preview","name":"Colombo Port City Waterfront Preview","category":"Architecture",
    "short":"Explore Colombo’s emerging reclaimed waterfront through public areas that are confirmed open, with honest context on a district still developing.",
    "story":"Port City Colombo is reshaping the capital’s western edge, but it remains an evolving urban development rather than a finished attraction. A credible experience must describe what is actually public on the travel date, identify the accessible waterfront or event area, and avoid promising buildings, marinas or entertainment that have not opened.\n\nRoam Ceylon treats this as a specialist contemporary-city preview. It may be combined with Galle Face or an architecture journey only after current public access, security, events and walking conditions are confirmed. Until a stable visitor product and verified imagery are available, the record remains in review rather than appearing publicly.",
    "duration":"Approximately 1.5–2.5 hours when a meaningful public route is confirmed","difficulty":"Easy to moderate exposed waterfront walking","season":"Subject entirely to current public access, construction, events, security and weather",
    "highlights":["A current view of Colombo’s expanding western waterfront","Context on reclamation and contemporary urban development","Public spaces verified for the actual date","A visual connection to Galle Face and the historic port","Specialist architecture or investment context when requested"],
    "unique":["The experience is explicit about a district still under development","Only genuinely open public areas enter the route","It can support architecture and business delegations without promotional exaggeration","Publication is withheld until the visitor product is operationally verified"],
    "included":["Specialist host when confirmed","Current public-access research","Walking route and timing coordination","Private transfers and event admission only when listed"],
    "know":["Construction and security can change access quickly.","Future master-plan elements are not current attractions.","Shade and visitor facilities may be limited.","Commercial or professional photography may need permission."],
    "nearby":["Galle Face Green","Colombo Fort","Old Parliament","Colombo Harbour"],
    "tips":["Confirm the exact open route shortly before travel.","Carry sun protection and water.","Combine with Galle Face only when the public connection is practical.","Treat architectural renderings as future plans, not current visitor promises."],
    "badges":["Photography Spot","Advance Booking Recommended"],"themes":["culture"]
  }
]$content$::jsonb) as x(
  slug text,name text,category text,short text,story text,duration text,difficulty text,
  season text,highlights jsonb,"unique" jsonb,included jsonb,know jsonb,nearby jsonb,
  tips jsonb,badges jsonb,themes jsonb
);

insert into public.experiences(
  name,slug,category,short_description,full_description,duration,difficulty,best_season,
  highlights,unique_points,included,things_to_know,nearby_attractions,traveller_tips,badges,
  family_friendly,suitable_for_children,private_option,priority,featured,status,active,
  seo_title,seo_description,needs_review,image_status,needs_image_review,image_review_notes
)
select
  x.name,x.slug,x.category,x.short,x.story,x.duration,x.difficulty,x.season,
  x.highlights,x."unique",x.included,x.know,x.nearby,x.tips,x.badges,
  x.badges ? 'Family Friendly',x.badges ? 'Child Friendly',true,
  case when x.badges ? 'Signature Experience' then 'must-do'::public.experience_priority else 'popular'::public.experience_priority end,
  x.badges ? 'Signature Experience','in_review',false,
  x.name || ' | Roam Ceylon',x.short,true,'missing',true,
  'Editorial content and relationships are complete. Upload one verified Colombo hero and exactly five licensed, experience-specific gallery images; add supplier and pricing details before publication.'
from colombo_new x
on conflict (slug) do update set
  name=excluded.name,category=excluded.category,short_description=excluded.short_description,
  full_description=excluded.full_description,duration=excluded.duration,difficulty=excluded.difficulty,
  best_season=excluded.best_season,highlights=excluded.highlights,unique_points=excluded.unique_points,
  included=excluded.included,things_to_know=excluded.things_to_know,
  nearby_attractions=excluded.nearby_attractions,traveller_tips=excluded.traveller_tips,
  badges=excluded.badges,seo_title=excluded.seo_title,seo_description=excluded.seo_description,
  updated_at=now();

-- Colombo is the parent public destination; Mount Lavinia remains as a preserved
-- locality record so existing foreign keys and historical journey selections remain valid.
insert into public.experience_destinations(experience_id,destination_id)
select e.id,d.id from public.experiences e cross join public.destinations d
where d.slug='colombo'
  and e.slug in (select slug from colombo_existing union select slug from colombo_new)
on conflict do nothing;

insert into public.experience_destinations(experience_id,destination_id)
select e.id,d.id from public.experiences e cross join public.destinations d
where d.slug='mountlavinia'
  and e.slug in (
    'mountlavinia-colonial-heritage-dining-at-the-historic-mount-lavinia-hotel',
    'mountlavinia-sunset-beach-walks-and-coastal-promenade-dining-near-colombo'
  )
on conflict do nothing;

delete from public.experience_themes et
where et.experience_id in (
  select e.id from public.experiences e
  where e.slug in (select slug from colombo_existing union select slug from colombo_new)
);

insert into public.experience_themes(experience_id,theme_id)
select e.id,t.id
from (
  select slug,themes from colombo_existing
  union all
  select slug,themes from colombo_new
) x
cross join lateral jsonb_array_elements_text(x.themes) m(theme_slug)
join public.experiences e on e.slug=x.slug
join public.themes t on t.slug=m.theme_slug
on conflict do nothing;

-- Public discovery now presents Mount Lavinia as part of Colombo, not as a competing city card.
update public.destinations set status='archived',active=false,updated_at=now()
where slug='mountlavinia';

insert into public.theme_destinations(theme_id,destination_id)
select t.id,d.id from public.themes t cross join public.destinations d
where d.slug='colombo' and t.slug in ('culture','heritage','tropical')
on conflict do nothing;

delete from public.theme_destinations td using public.destinations d
where td.destination_id=d.id and d.slug='mountlavinia';

do $$
declare
  enriched_count integer;
  new_count integer;
  parent_mapped_count integer;
  archived_duplicate integer;
  archived_locality integer;
begin
  select count(*) into enriched_count
  from public.experiences e join colombo_existing x on x.slug=e.slug
  where e.status='published' and e.active and length(e.full_description)>700
    and jsonb_array_length(e.highlights)>=5 and jsonb_array_length(e.badges)>=3;

  select count(*) into new_count
  from public.experiences e join colombo_new x on x.slug=e.slug
  where e.status='in_review' and not e.active and e.image_status='missing'
    and length(e.full_description)>600 and jsonb_array_length(e.highlights)>=5;

  select count(distinct ed.experience_id) into parent_mapped_count
  from public.experience_destinations ed
  join public.experiences e on e.id=ed.experience_id
  join public.destinations d on d.id=ed.destination_id
  where d.slug='colombo'
    and e.slug in (select slug from colombo_existing union select slug from colombo_new);

  select count(*) into archived_duplicate from public.experiences
  where slug='mountlavinia-sampling-authentic-local-street-food-and-fresh-seafood-along-the-shore'
    and status='archived' and not active;

  select count(*) into archived_locality from public.destinations
  where slug='mountlavinia' and status='archived' and not active;

  if enriched_count<>6 or new_count<>11 or parent_mapped_count<>17
     or archived_duplicate<>1 or archived_locality<>1 then
    raise exception 'Colombo validation failed: enriched %, new %, mapped %, duplicate %, locality %',
      enriched_count,new_count,parent_mapped_count,archived_duplicate,archived_locality;
  end if;

  raise notice 'Colombo result: 6 existing experiences enriched, 11 new editorial records prepared for imagery/supplier review, 1 duplicate archived, and Mount Lavinia consolidated beneath Colombo.';
end $$;

commit;
