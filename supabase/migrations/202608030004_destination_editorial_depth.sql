-- Final destination editorial-depth pass.
-- Brings every remaining destination story and local-highlight list to the
-- descriptive benchmark established by Ahungalla, without changing schema or UI.

with enrichment as (
  select * from jsonb_to_recordset($catalog$[
    {
      "slug":"arugambay",
      "story_extension":"Beyond the main bay, the eastern shoreline opens towards Pottuvil, Elephant Rock and the wetlands of Kumana. These contrasting landscapes make it possible to pair active mornings with quiet wildlife observation, village encounters and long stretches of undeveloped coast—without losing the informal character that first made Arugam Bay special.",
      "local_highlights":["Sunrise surf sessions along Main Point’s celebrated right-hand break","Quiet lagoon safaris among mangroves, water birds and watchful crocodiles","Fishing-village mornings followed by relaxed evenings beside the bay","Coastal viewpoints and golden-hour walks around Elephant Rock","A wild east-coast day journey through the wetlands of Kumana"]
    },
    {
      "slug":"balapitiya",
      "story_extension":"The river is most atmospheric before the heat builds, when narrow channels are still and bird calls carry across the water. A thoughtful journey can combine natural history with cinnamon cultivation and island life, revealing Balapitiya as a lived-in estuary rather than simply a boat-trip departure point.",
      "local_highlights":["Early-morning boat journeys through the Madu Ganga’s quieter channels","Mangrove tunnels, river islands and an ever-changing estuarine landscape","Small-scale cinnamon cultivation interpreted by knowledgeable local hosts","Patient birdwatching along mudflats, reed beds and waterside forest","A gentle transition from working river communities to the southern coast"]
    },
    {
      "slug":"bentota",
      "story_extension":"The surrounding area also holds an important chapter of Sri Lankan design. Lunuganga and Brief Garden transform tropical planting, architecture and water into deeply personal landscapes, adding cultural substance to the beach. With careful pacing, Bentota becomes both an elegant retreat and an introduction to the creative south.",
      "local_highlights":["Unhurried walks along a broad sweep of golden southwest-coast beach","Bentota River adventures ranging from watersports to quiet sunset cruises","The layered tropical landscape and architectural legacy of Lunuganga","Sculpture, planting and intimate garden rooms at nearby Brief Garden","Refined coastal stays within comfortable reach of Colombo and Galle"]
    },
    {
      "slug":"hikkaduwa",
      "story_extension":"A more considered stay balances the lively beachfront with time on the water and quieter exploration inland. Early surf, conservation-minded reef visits and an evening away from the main strip reveal a destination with more range than its energetic first impression suggests.",
      "local_highlights":["Guided surf sessions matched carefully to changing conditions and ability","Low-impact reef viewing that respects Hikkaduwa’s fragile coral habitat","Golden-hour beach walks before the town’s lively evening rhythm begins","A culturally rich day journey through the ramparts of Galle Fort","Quiet temple visits and village landscapes beyond the coastal tourism strip"]
    },
    {
      "slug":"kalpitiya",
      "story_extension":"Life here remains closely tied to fishing seasons, weather and water. Time away from the kite centres—at the fort, in a coastal village or watching the lagoon change at dusk—adds human scale to the adventure. Kalpitiya is most rewarding when its wind, wildlife and communities are understood as one connected peninsula.",
      "local_highlights":["Kitesurfing across flat-water lagoons with qualified local instructors","Responsible dolphin watching in the peninsula’s productive offshore waters","Remote sandbars, salt air and working fishing villages at first light","Kalpitiya’s Dutch Fort and the peninsula’s layered maritime history","Slow journeys through a wind-shaped landscape far from resort crowds"]
    },
    {
      "slug":"kalutara",
      "story_extension":"The town also offers small but meaningful encounters with Sri Lankan history and landscape. Richmond Castle’s gardens, the coastal railway and the broad river mouth create moments of discovery between treatments and beach time. Kalutara works best when convenience is paired with genuine local context.",
      "local_highlights":["Kalutara Bodhiya and the luminous white stupa beside the river","Restorative Ayurveda programmes designed around an unhurried coastal stay","Richmond Castle’s unusual architecture and mature tropical garden setting","Soft evening light where the Kalu Ganga reaches the Indian Ocean","Scenic coastal-rail journeys linking Colombo with Sri Lanka’s southern shore"]
    },
    {
      "slug":"mirissa",
      "story_extension":"Mirissa also serves as a convenient base for the Matara coast, with Weligama’s surf, Dondra’s headland and smaller coves all within reach. Choosing quieter hours and responsible marine operators allows travellers to enjoy its popularity without losing sight of the working coastal community beneath it.",
      "local_highlights":["Responsible early-morning whale watching across Sri Lanka’s southern waters","Calm-season swimming within Mirissa’s palm-framed crescent-shaped bay","First light and open-ocean views from Coconut Tree Hill","Gentle surf sessions followed by slow evenings in beachside cafés","Fresh seafood and everyday coastal life around the working harbour"]
    },
    {
      "slug":"mountlavinia",
      "story_extension":"The suburb’s real strength is its position between two worlds. A traveller can spend the morning with Colombo’s museums and markets, then return to the sea as fishing boats gather in the evening light. This contrast makes Mount Lavinia more valuable than a simple airport stopover.",
      "local_highlights":["Wide sunset views stretching along the greater Colombo coastline","Seafood dinners shaped by the day’s catch and evening sea breeze","The storied colonial atmosphere of the Mount Lavinia Hotel","Coastal train journeys with fleeting views between city and ocean","Effortless access to Colombo’s galleries, markets and contemporary restaurants"]
    },
    {
      "slug":"nilaveli",
      "story_extension":"Days here are best kept spacious. A carefully managed reef visit can be followed by an empty stretch of sand, a Tamil seafood lunch or an evening in Trincomalee. Nilaveli offers enough variety for a meaningful stay while preserving the uncluttered quality that defines it.",
      "local_highlights":["Long barefoot walks along one of the east coast’s quietest beaches","Carefully managed snorkelling among Pigeon Island’s reef fish and coral","Calm-season swimming in clear, warm water close to the shore","Open views across the channel towards the protected island landscape","Easy cultural day journeys to Trincomalee’s harbour, fort and temples"]
    },
    {
      "slug":"pasikudah",
      "story_extension":"A richer visit looks beyond the waterline towards Batticaloa’s lagoon, markets and Tamil cultural life. These nearby experiences prevent the bay from feeling enclosed within its resorts and give the stillness of the beach a stronger sense of place.",
      "local_highlights":["Unusually shallow calm-season water suited to gentle family swimming","Spacious beach days with room for rest rather than a crowded itinerary","Soft sunrise light arriving across the open Bay of Bengal","Low-key paddling and watersports when sea conditions are favourable","Slow east-coast journeys connecting the bay with nearby Batticaloa"]
    },
    {
      "slug":"tangalle",
      "story_extension":"The surrounding deep south gives Tangalle its depth. Mulkirigala’s rock temple, Rekawa’s nesting coast and bird-rich lagoons can be explored without sacrificing the restorative quality of the stay. It is a place where seclusion and meaningful excursions can be held in careful balance.",
      "local_highlights":["Hidden coves and long beaches shaped by the deep south’s open ocean","Thoughtfully paced yoga, Ayurveda and wellness beside tropical gardens","Responsible evening encounters within Rekawa’s marine-turtle nesting landscape","Quiet lagoon journeys among water birds, mangroves and fishing canoes","Cultural and wildlife day journeys deeper into Sri Lanka’s southern region"]
    },
    {
      "slug":"trinco",
      "story_extension":"The city’s surrounding coast extends the experience naturally. Nilaveli and Uppuveli bring sand and clear seasonal water, while Kanniya and Seruwila open different cultural perspectives inland. Together they make Trincomalee a strong multi-day destination rather than a brief temple-and-beach stop.",
      "local_highlights":["Koneswaram Temple poised dramatically above the ocean at Swami Rock","Fort Frederick’s layered ramparts, sacred paths and natural-harbour viewpoints","The historic hot springs and community landscape around Kanniya","Tamil seafood, fragrant coastal cooking and lively local market flavours","Restful beach days along the seasonal waters of Uppuveli and Nilaveli"]
    },
    {
      "slug":"weligama",
      "story_extension":"Its location also makes it easy to explore the coast without changing hotels each night. Mirissa, Midigama and Matara bring different surf, food and cultural experiences within a short journey. Returning to Weligama’s broad, welcoming bay gives the itinerary a relaxed centre.",
      "local_highlights":["Beginner-friendly surf lessons across the bay’s long sandy shoreline","Early visits to Weligama’s fish market and working coastal neighbourhoods","Independent cafés, thoughtful restaurants and an evolving creative community","The enigmatic Kushtarajagala figure set quietly beside the main road","Flexible access to Mirissa, Midigama and the wider Matara coast"]
    },
    {
      "slug":"colombo",
      "story_extension":"Each district offers a different lens: Pettah is dense and commercial, Cinnamon Gardens feels composed and institutional, while the ocean edge opens the city to evening air. Travelling with a knowledgeable host turns these contrasts into a coherent story of migration, trade and contemporary ambition.",
      "local_highlights":["A guided walk through Pettah’s markets, shrines and historic trading streets","Sunset gatherings and Indian Ocean views along the Galle Face promenade","Gangaramaya and Seema Malaka interpreted within Colombo’s Buddhist life","Independent galleries, Sri Lankan design and ambitious contemporary dining","The National Museum and tree-lined civic quarter of Cinnamon Gardens"]
    },
    {
      "slug":"dambulla",
      "story_extension":"Outside the caves, the wider district is a landscape of vegetable farms, forest and isolated rock. Sunrise balloon flights, village cycling and nearby wildlife areas can broaden the stay, while the produce market offers a vivid view of Dambulla’s modern importance to the island’s food network.",
      "local_highlights":["Centuries of Buddhist sculpture and painting within Rangiri Dambulla’s caves","Wide dry-zone views from the temple’s elevated rock approach","A well-positioned base for Sigiriya, Pidurangala and elephant country","The colour and movement of Dambulla’s important wholesale produce market","Quiet cycling routes through farms, reservoirs and rural village landscapes"]
    },
    {
      "slug":"galle",
      "story_extension":"Allowing time for smaller details changes the experience: carved doorways, shaded verandas, call to prayer, schoolchildren and residents tending old homes. The fort is not a museum set. Its enduring value comes from the relationship between monumental defences and ordinary life within them.",
      "local_highlights":["A golden-hour walk along bastions overlooking the Indian Ocean","Dutch-era streets, hidden courtyards and carefully interpreted historic buildings","The lighthouse, Point Utrecht and the fort’s powerful maritime silhouette","Southern food, local craft and contemporary design within restored spaces","Early-morning encounters with everyday life inside the inhabited fort"]
    },
    {
      "slug":"jaffna",
      "story_extension":"Food is one of the most direct ways into the region: crab curry, odiyal kool, dosai and palmyrah products express histories of land and sea. A well-paced stay combines these flavours with conversations, sacred places and an island journey, allowing Jaffna’s resilience and creativity to emerge without simplifying its past.",
      "local_highlights":["Nallur Kandaswamy Kovil experienced with respect during daily worship","Jaffna Fort and the restored public library within the city’s layered history","Distinctive northern Tamil cooking, market produce and palmyrah traditions","Patient island journeys across the causeways and ferries towards Delft","Open peninsula roads lined with lagoons, temples and palmyrah silhouettes"]
    },
    {
      "slug":"kandy",
      "story_extension":"The surrounding hills complete the experience. Peradeniya’s botanical collections, Udawattakele’s forest and the temple villages west of the city reveal art and nature beyond the lake. With enough time, Kandy becomes not just a ceremonial stop but a layered highland region.",
      "local_highlights":["Temple of the Sacred Tooth Relic during a respectfully observed ceremony","Quiet dawn and evening walks beside the city’s central lake","Kandyan dance, drumming and craft presented with meaningful cultural context","The Royal Botanic Gardens’ grand avenues and tropical plant collections","Birdlife and shaded walking paths within nearby Udawattakele forest reserve"]
    },
    {
      "slug":"kataragama",
      "story_extension":"The wider landscape strengthens this sense of continuity. Tissamaharama’s reservoirs, Sithulpawwa’s monastic rocks and Yala’s forest place the pilgrimage town within an ancient corridor of movement and belief. A thoughtful itinerary connects these places rather than treating Kataragama as an isolated evening visit.",
      "local_highlights":["Evening offerings, bells and devotional energy within the sacred precinct","The serene white form of Kiri Vehera beneath the night sky","Ritual bathing and quiet reflection beside the Menik Ganga","Buddhist, Hindu, Muslim and Indigenous traditions sharing one pilgrimage landscape","A spiritually rich complement to wildlife journeys through Sri Lanka’s deep south"]
    },
    {
      "slug":"polonnaruwa",
      "story_extension":"The experience gains depth at the archaeological museum and beside the reservoir at day’s end. Together, these places explain how royal power, Buddhist devotion, urban design and water management operated as one system. Polonnaruwa rewards travellers who look beyond individual monuments to the complete medieval landscape.",
      "local_highlights":["Gal Vihara’s serene rock-cut figures viewed in gentle morning light","Royal Palace ruins and the architectural concentration of the Sacred Quadrangle","Lankatilaka’s towering brick sanctuary and the great Rankoth Vehera stupa","Slow cycling between shaded monuments across the medieval garden city","Sunset and birdlife along the vast waters of Parakrama Samudra"]
    },
    {
      "slug":"sigiriya",
      "story_extension":"The surrounding countryside deserves equal attention. Pidurangala offers a separate monastic landscape and a revealing view back towards the citadel, while village reservoirs and dry-zone forest place the rock within its natural setting. A two-night stay allows the region to breathe beyond a single climb.",
      "local_highlights":["Formal water gardens revealing the citadel’s sophisticated geometric planning","Delicate fifth-century frescoes and ancient poetry along the Mirror Wall","The monumental Lion’s Paw terrace before the final summit ascent","Royal foundations and immense views across Sri Lanka’s central plains","A dawn perspective from Pidurangala across forest towards Sigiriya Rock"]
    },
    {
      "slug":"belihuloya",
      "story_extension":"Because the valley is compact yet environmentally varied, a single guided day can move between river shade, cultivated land and open mountain views. Staying longer creates time for village meals and unhurried observation, ensuring the destination feels like a place rather than an activity stop.",
      "local_highlights":["Guided walks moving through wet-zone forest and drier highland habitats","Clear mountain streams, secluded waterfalls and carefully chosen river pools","Expansive viewpoints across layered valleys towards Sri Lanka’s central peaks","Small farming communities and the everyday rhythms of rural highland life","A peaceful base linking Sabaragamuwa’s plains with the upper hill country"]
    },
    {
      "slug":"ella",
      "story_extension":"Ella is also a doorway into Uva’s deeper stories. Estate communities, smaller railway stations, waterfalls and the road towards Wellawaya reveal a more complex region than the village centre. Building these into the itinerary creates a highland stay with substance as well as scenery.",
      "local_highlights":["Nine Arches Bridge at first light before the busiest viewing hours","A gentle climb to Little Adam’s Peak above tea-covered valleys","The more demanding Ella Rock walk with experienced local guidance","Slow railway journeys through cloud forest, tea estates and mountain stations","Ravana Falls and the descending landscapes of Sri Lanka’s Uva region"]
    },
    {
      "slug":"kitulgala",
      "story_extension":"A balanced itinerary alternates adrenaline with close observation. One morning might follow rapids; the next can begin with endemic birds in Makandawa or a walk to Belilena. This contrast is what makes Kitulgala a destination in its own right rather than merely a roadside rafting stop.",
      "local_highlights":["Professionally guided white-water rafting through the Kelani River’s forested rapids","Canyoning journeys combining waterfalls, natural slides and clear jungle pools","Early rainforest birding in search of Sri Lanka’s wet-zone endemic species","Belilena’s vast cave, archaeological story and dramatic forest approach","Village life, kitul-palm traditions and memories of a classic film location"]
    },
    {
      "slug":"minneriya",
      "story_extension":"Daily conditions matter more than a fixed itinerary. Elephants may shift towards Kaudulla or Hurulu according to rain and forage, so a good naturalist reads the wider ecosystem before choosing a route. This flexible approach produces a more ethical and honest wildlife experience.",
      "local_highlights":["Elephant herds moving naturally across reservoir-edge grasslands and forest","Warm late-afternoon light spreading across the ancient Minneriya tank","Water birds, raptors and smaller wildlife observed between elephant encounters","Ancient irrigation engineering continuing to sustain a living dry-zone ecosystem","A flexible safari circuit shaped by conditions in Minneriya and Kaudulla"]
    },
    {
      "slug":"nuwaraeliya",
      "story_extension":"The town is most rewarding when its colonial imagery is balanced with a fuller account of tea. Conversations about labour, land and community add essential depth to factory visits, while early journeys to Horton Plains reveal the fragile high-elevation ecosystems that make this region genuinely exceptional.",
      "local_highlights":["Tea-estate walks and factory visits that respectfully include workers’ perspectives","Hakgala Botanic Gardens beneath misty mountains and old forest","Quiet early hours beside Lake Gregory before the daytime activity begins","Pre-dawn access to Horton Plains and its rare montane grassland ecosystem","Highland farms, seasonal produce and gardens flourishing in the cool climate"]
    },
    {
      "slug":"udawalawe",
      "story_extension":"The destination also fits the island unusually well. It lies between the south coast and central hills, allowing a safari without distorting the route. A visit to the Elephant Transit Home, timed around official viewing and understood as rehabilitation rather than entertainment, adds valuable conservation context.",
      "local_highlights":["Elephants moving through open grassland with clear, respectful viewing space","Reservoir edges animated by water birds, buffalo and changing evening light","Eagles, hawks and other raptors surveying the broad dry-zone plains","Eth Athuru Sevana’s rehabilitation work observed at official feeding times","A naturally placed wildlife stop between southern beaches and hill country"]
    },
    {
      "slug":"wilpattu",
      "story_extension":"Its distance from the main circuits is part of the appeal. Longer drives and fewer vehicles create space to notice tracks, alarm calls and the changing character of each villu. Pairing the park with Anuradhapura or Kalpitiya turns the northwestern journey into a compelling route of wilderness, heritage and coast.",
      "local_highlights":["Natural villu wetlands reflecting forest, sky and passing wildlife","Long unhurried game drives through some of Sri Lanka’s quietest forest","Patient observation within important leopard and sloth-bear habitat","Water birds, raptors and crocodiles around seasonal lakes and clearings","A genuine sense of remoteness across the island’s largest national park"]
    },
    {
      "slug":"yala",
      "story_extension":"Yala’s popularity makes responsible operation especially important. A skilled naturalist can interpret tracks, calls and habitats even when larger animals remain hidden, while quieter blocks or nearby Bundala may offer different rewards. The best safari is measured by understanding, not by the speed of reaching a sighting.",
      "local_highlights":["Leopard habitat woven through granite outcrops, scrub and forest shade","Elephants moving between lagoons, grassland and the park’s dusty tracks","Crocodiles, water birds and raptors concentrated around seasonal wetlands","A powerful wild coastline where protected land meets the Indian Ocean","Sithulpawwa’s ancient monastic landscape rising beyond the wildlife plains"]
    }
  ]$catalog$::jsonb) as c(slug text, story_extension text, local_highlights jsonb)
)
update public.destinations as d
set
  full_description = concat_ws(E'\n\n', nullif(d.full_description, ''), c.story_extension),
  local_highlights = c.local_highlights,
  updated_at = now()
from enrichment as c
where d.slug = c.slug;
