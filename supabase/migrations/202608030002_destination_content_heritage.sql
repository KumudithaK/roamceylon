-- Premium destination editorial catalogue: cities, culture and sacred heritage.
-- UNESCO wording follows the official World Heritage property names and inscription years.

with catalog as (
  select * from jsonb_to_recordset($catalog$[
    {
      "slug":"colombo",
      "short_description":"Sri Lanka’s energetic capital: a layered city of oceanfront promenades, sacred spaces, markets, galleries and ambitious dining.",
      "full_description":"Colombo rewards curiosity. Colonial civic buildings sit beside towers and trading streets; temples, kovils, churches and mosques reveal the city’s many communities; and a new generation of chefs and designers is reinterpreting Sri Lankan identity. Rather than rushing through, spend a considered day moving between old quarters, contemporary culture and the sea.",
      "why_visit":"Visit to understand modern Sri Lanka—cosmopolitan, creative and deeply connected to centuries of Indian Ocean trade.",
      "historical_importance":"Colombo’s natural harbour and position on maritime routes drew Arab, Portuguese, Dutch and British interests. Fort and Pettah still reflect its evolution from trading port to commercial capital.",
      "cultural_significance":"Buddhist, Hindu, Muslim and Christian places of worship share the city with markets, clubs, galleries and neighbourhood food traditions, expressing Sri Lanka’s plural urban culture.",
      "unesco_information":null,
      "nature_wildlife":"The ocean edge, Beira Lake and nearby wetlands provide green and blue pauses within the city. The urban wetland system around greater Colombo supports notable birdlife.",
      "best_time_to_visit":"December to March is often drier, but Colombo works year-round. Plan walking and market visits for morning or late afternoon and reserve indoor culture for the hottest hours.",
      "weather":"Hot and humid throughout the year, generally 27–32°C. Short heavy showers are possible in any month, with wetter periods around the southwest monsoon and inter-monsoons.",
      "local_highlights":["Pettah’s trading streets and markets","Galle Face at sunset","Gangaramaya and Seema Malaka","Sri Lankan art, design and contemporary dining","Colombo National Museum and the Cinnamon Gardens quarter"],
      "nearby_attractions":["Sri Jayawardenepura Kotte","Mount Lavinia","Kelaniya Temple","Negombo","Muthurajawela wetland"],
      "travel_tips":["Group neighbourhood visits to reduce time in traffic.","Dress modestly for religious sites and remove footwear when requested.","Use a local host for a more meaningful market or food walk.","Carry a light rain layer even in the drier months."]
    },
    {
      "slug":"dambulla",
      "short_description":"A Cultural Triangle crossroads where an extraordinary painted cave sanctuary rises above markets, farms and dry-zone hills.",
      "full_description":"Dambulla’s cave temple is a place of accumulated devotion. Within five principal caves, murals and Buddha images create an intimate sacred world formed over many centuries. The town below is a practical gateway to Sigiriya, Minneriya and rural Matale, making Dambulla a strong base for combining heritage with landscapes and wildlife.",
      "why_visit":"Come for one of Sri Lanka’s most remarkable sacred interiors and an efficient base at the heart of the Cultural Triangle.",
      "historical_importance":"The cave sanctuary has a long association with Buddhist patronage and royal history, with artistic layers developed and renewed over many centuries.",
      "cultural_significance":"Rangiri Dambulla remains an active Buddhist pilgrimage site. Its paintings, statues and ritual use demonstrate the continuity of Sri Lankan Buddhist art and devotion.",
      "unesco_information":"Rangiri Dambulla Cave Temple was inscribed on the UNESCO World Heritage List in 1991. The property is recognised for its exceptional cave-sanctuary ensemble, extensive murals and religious sculpture, and the continuity of its sacred tradition.",
      "nature_wildlife":"Rock outcrops, dry-zone woodland and nearby protected areas connect Dambulla to elephant country and rich birdlife. Macaques live around the temple approach and should never be fed.",
      "best_time_to_visit":"January to March is often comfortable, while the middle of the year is generally drier but hotter. Visit early morning or later afternoon to reduce heat on the climb.",
      "weather":"Warm and often dry, generally 25–33°C. The northeast monsoon has the strongest rainfall influence, while exposed rock and steps become hot around midday.",
      "local_highlights":["The painted interiors of Rangiri Dambulla Cave Temple","Views across the dry-zone plains","A central base for Sigiriya and Minneriya","Dambulla’s produce market","Rural cycling and village landscapes"],
      "nearby_attractions":["Sigiriya","Pidurangala","Minneriya National Park","Nalanda Gedige","Matale"],
      "travel_tips":["Cover shoulders and knees and remove footwear before entering the caves.","Carry water and socks for warm stone surfaces.","Do not feed or approach macaques.","Check official ticket arrangements before climbing."]
    },
    {
      "slug":"galle",
      "short_description":"A living fortified city where centuries of Indian Ocean history unfold through coral-stone ramparts, courtyards and sea light.",
      "full_description":"Galle Fort is at its best before the day becomes busy or as evening gathers along the ramparts. Inside the walls, homes, mosques, churches, museums, cafés and hotels occupy an urban fabric shaped by several colonial periods and generations of local life. Beyond the postcard view, Galle is compelling because it remains inhabited and evolving.",
      "why_visit":"Visit for Sri Lanka’s most atmospheric historic townscape, combining architecture, food, craft and an unforgettable walk above the sea.",
      "historical_importance":"The fortified town developed through Portuguese, Dutch and British periods on a site long connected to Indian Ocean trade. Its street plan, bastions and civic buildings preserve that layered history.",
      "cultural_significance":"Galle Fort is a multicultural living quarter, with Buddhist, Muslim and Christian heritage embedded in its buildings, food and community life.",
      "unesco_information":"The Old Town of Galle and its Fortifications was inscribed on the UNESCO World Heritage List in 1988. UNESCO recognises the fortified city as an outstanding example of European architecture adapted through South Asian traditions and conditions.",
      "nature_wildlife":"The ramparts meet an exposed marine environment, while nearby beaches, lagoons and lowland wetlands add coastal biodiversity to a cultural stay.",
      "best_time_to_visit":"December to April usually brings the driest southwest-coast weather. The fort remains rewarding year-round, especially early morning and around sunset.",
      "weather":"Warm, humid and coastal, usually 26–31°C. Sea breezes help, but showers can be sudden and the southwest monsoon brings wetter conditions from May to September.",
      "local_highlights":["Sunset along the fort ramparts","Dutch-era streets, courtyards and museums","The lighthouse and Point Utrecht bastion","Local craft, design and southern cuisine","Early-morning life inside the living fort"],
      "nearby_attractions":["Unawatuna","Rumassala","Hikkaduwa","Koggala","Weligama"],
      "travel_tips":["Explore early and late when the streets are cooler and quieter.","Respect homes, schools and places of worship inside the living fort.","Keep back from unguarded rampart edges in wind or rain.","Use an accredited guide to uncover the city beyond its façades."]
    },
    {
      "slug":"jaffna",
      "short_description":"A singular northern city of Tamil heritage, luminous temples, island journeys and a cuisine found nowhere else on the island.",
      "full_description":"Jaffna feels distinct in landscape, language and flavour. Palmyrah silhouettes line the road, temple towers rise above compact neighbourhoods and the islands of the peninsula stretch towards the Palk Strait. Its story includes ancient kingdoms, colonial rule, conflict and renewal; travelling with sensitivity opens a deeply rewarding view of northern Sri Lanka.",
      "why_visit":"Come for powerful Tamil cultural traditions, memorable food and a northern landscape unlike any other part of the country.",
      "historical_importance":"The Jaffna kingdom, Portuguese and Dutch rule, and the more recent civil conflict all shaped the peninsula. Jaffna Fort and the public library are important points for understanding this layered past.",
      "cultural_significance":"Hindu temple life, Catholic pilgrimage, Tamil literature, music and palmyrah traditions define the region. Nallur Kandaswamy Kovil is among its most significant living sacred places.",
      "unesco_information":null,
      "nature_wildlife":"The dry peninsula, lagoons and low-lying islands support migratory birds and distinctive coastal habitats. Delft’s open landscape includes feral horses associated with the island’s colonial past.",
      "best_time_to_visit":"January to September can be rewarding, with February to August generally drier. The Nallur festival season brings exceptional cultural energy but requires advance planning.",
      "weather":"Hot, dry and breezy for much of the year, commonly 28–34°C. The northeast monsoon brings the main rains from roughly October to January.",
      "local_highlights":["Nallur Kandaswamy Kovil","Jaffna Fort and the public library","Northern Tamil cuisine and market produce","Island journeys to Delft or Nagadeepa","Palmyrah landscapes and coastal roads"],
      "nearby_attractions":["Delft Island","Nagadeepa and Nainativu","Keerimalai","Point Pedro","Casuarina Beach"],
      "travel_tips":["Dress conservatively and follow temple-specific entry guidance.","Ask before photographing worshippers or conflict-related sites.","Plan island ferries around weather and local schedules.","Try regional dishes with a local host who can explain their context."]
    },
    {
      "slug":"kandy",
      "short_description":"Sri Lanka’s sacred hill capital, where royal memory, living Buddhist ritual and green highland culture gather around a lake.",
      "full_description":"Kandy’s identity is inseparable from the Temple of the Sacred Tooth Relic and the lake beside it, yet the city’s depth extends into dance, craft, gardens and forested hills. As the last capital of the Sinhala kings, it holds a powerful place in national memory. Early mornings and ceremonial evenings reveal a more intimate city beyond its busy streets.",
      "why_visit":"Visit for living sacred tradition, Kandyan arts and a graceful transition between the lowlands and tea country.",
      "historical_importance":"Kandy was the last capital of the Sinhala kingdom before British rule in 1815. Its royal palace complex and sacred institutions preserve that political and religious legacy.",
      "cultural_significance":"The Temple of the Sacred Tooth Relic is one of Buddhism’s most revered sites. Kandyan dance, drumming, craft and the annual Esala Perahera remain central expressions of regional identity.",
      "unesco_information":"The Sacred City of Kandy was inscribed on the UNESCO World Heritage List in 1988. The property is recognised for its exceptional association with the final royal capital and the Temple of the Sacred Tooth Relic, a continuing focus of Buddhist pilgrimage.",
      "nature_wildlife":"Udawattakele’s forest reserve rises close to the city, while the lake and Royal Botanic Gardens at Peradeniya provide habitat for birds, butterflies and tropical plant life.",
      "best_time_to_visit":"January to April is often comparatively dry. July or August may coincide with the Esala Perahera, when the city is vivid but accommodation and viewing arrangements require early planning.",
      "weather":"Warm and humid with cooler evenings than the coast, generally 20–29°C. Rain can occur throughout the year and is more frequent during monsoon and inter-monsoon periods.",
      "local_highlights":["Temple of the Sacred Tooth Relic","Kandy Lake at dawn or dusk","Kandyan dance and drumming","Royal Botanic Gardens, Peradeniya","Udawattakele forest reserve"],
      "nearby_attractions":["Peradeniya","Gadaladeniya","Lankatilaka","Embekke","Knuckles foothills"],
      "travel_tips":["Cover shoulders and knees and remove footwear at the temple.","Attend ceremonies quietly and avoid obstructing worshippers.","Reserve Perahera-period stays well in advance.","Allow additional road time because central Kandy can be congested."]
    },
    {
      "slug":"kataragama",
      "short_description":"A profound pilgrimage town where Buddhist, Hindu, Muslim and Indigenous traditions meet in shared devotion.",
      "full_description":"Kataragama is most affecting after dusk, when offerings, bells and prayer animate the sacred precinct beside the Menik Ganga. The town cannot be understood as a conventional attraction: it is an active pilgrimage landscape, meaningful to several faiths and to the Vedda community. Entering with humility is essential.",
      "why_visit":"Visit to witness one of Sri Lanka’s most distinctive living pilgrimage traditions and to add spiritual depth to a southern wildlife journey.",
      "historical_importance":"Kataragama’s sanctity is rooted in long pilgrimage traditions and associations with the deity Skanda-Murugan. Its importance developed across religious and ethnic communities over centuries.",
      "cultural_significance":"The sacred complex brings together the Kataragama shrine, Buddhist Kiri Vehera, a mosque and Vedda traditions. The annual festival and pada yatra pilgrimage express this unusual shared devotion.",
      "unesco_information":null,
      "nature_wildlife":"The Menik Ganga and surrounding dry-zone woodland connect the town to the wider Yala landscape. Monkeys and other animals around the precinct should not be fed.",
      "best_time_to_visit":"The main festival usually falls in July or August and is intensely atmospheric but crowded. Outside festival time, evening puja offers a quieter introduction.",
      "weather":"Hot and dry for much of the year, generally 25–33°C. Rainfall is more likely during the northeast monsoon and inter-monsoon periods.",
      "local_highlights":["Evening ritual in the sacred precinct","Kiri Vehera","The Menik Ganga","Multi-faith pilgrimage traditions","A natural pairing with Yala and the deep south"],
      "nearby_attractions":["Yala National Park","Tissamaharama","Sithulpawwa","Bundala National Park","Lunugamvehera"],
      "travel_tips":["Dress modestly and behave as a guest in an active sacred place.","Ask before photographing rituals or pilgrims.","Expect crowds and road controls during the annual festival.","Do not feed monkeys or leave food exposed."]
    },
    {
      "slug":"polonnaruwa",
      "short_description":"A remarkably coherent medieval capital of sculpted stone, monumental reservoirs and shaded routes made for slow exploration.",
      "full_description":"Polonnaruwa offers one of Sri Lanka’s most legible ancient landscapes. Royal precincts, monasteries and the serene figures of Gal Vihara unfold across a relatively compact area, while Parakrama Samudra gives the city an expansive horizon. Bicycle or carefully paced vehicle exploration allows the architecture and hydraulic ambition to be understood together.",
      "why_visit":"Come for an ancient capital that feels spacious, coherent and deeply connected to the water engineering of the dry zone.",
      "historical_importance":"Polonnaruwa became Sri Lanka’s second great capital after Anuradhapura and flourished especially in the eleventh and twelfth centuries. Its monuments reflect major royal, religious and engineering achievements.",
      "cultural_significance":"Buddhist monasteries and Hindu monuments show the cultural connections that shaped the medieval capital. Gal Vihara remains one of the island’s most revered sculptural ensembles.",
      "unesco_information":"The Ancient City of Polonnaruwa was inscribed on the UNESCO World Heritage List in 1982. UNESCO recognises the exceptional monumental remains of Sri Lanka’s medieval capital, including its royal, religious and garden-city landscape.",
      "nature_wildlife":"Parakrama Samudra and surrounding dry-zone habitats attract water birds and support farming communities. Macaques are common among the ruins and should not be fed.",
      "best_time_to_visit":"January to March is often comfortable. June to September is generally drier but can be very hot, making an early start and midday rest essential.",
      "weather":"Hot and relatively dry, usually 27–34°C. The strongest rains tend to arrive with the northeast monsoon later in the year.",
      "local_highlights":["Gal Vihara’s rock-cut Buddha figures","The Royal Palace and Quadrangle","Lankatilaka and Rankoth Vehera","Cycling between archaeological precincts","Sunset beside Parakrama Samudra"],
      "nearby_attractions":["Minneriya National Park","Kaudulla National Park","Medirigiriya","Dimbulagala","Sigiriya"],
      "travel_tips":["Start early and carry ample water and sun protection.","Dress modestly at sacred monuments and never pose with your back to a Buddha image.","Use a guide or museum visit to understand the site’s chronology.","Keep food secured around macaques."]
    },
    {
      "slug":"sigiriya",
      "short_description":"An extraordinary fifth-century rock citadel where architecture, water gardens, art and engineering rise above the central plains.",
      "full_description":"Sigiriya is more than the climb to a dramatic summit. The experience begins in symmetrical water gardens, passes mirror-smooth walls and surviving frescoes, and culminates among the foundations of a royal complex high above the forest. Seeing the entire composition—landscape, engineering and theatre—is what makes the site exceptional.",
      "why_visit":"Visit for one of Asia’s most imaginative ancient urban ensembles and a panoramic encounter with Sri Lanka’s Cultural Triangle.",
      "historical_importance":"The citadel is principally associated with King Kassapa I in the fifth century CE, though the rock landscape also carries earlier and later monastic history.",
      "cultural_significance":"Sigiriya’s frescoes, poetry, garden design and water engineering hold an exceptional place in Sri Lankan art and cultural memory.",
      "unesco_information":"The Ancient City of Sigiriya was inscribed on the UNESCO World Heritage List in 1982. UNESCO recognises its outstanding concentration of fifth-century urban planning, architecture, gardens, hydraulic engineering and art.",
      "nature_wildlife":"Dry-zone forest surrounds the rock and supports birds, monkeys and other wildlife. The wider area connects naturally with Minneriya and Kaudulla’s elephant landscapes.",
      "best_time_to_visit":"January to March is often comfortable. In any season, enter at opening time or later in the afternoon to avoid the strongest heat and larger groups.",
      "weather":"Warm and often humid, usually 25–33°C. Rain is more frequent toward the end of the year; exposed stairways can become hot, wet or windy.",
      "local_highlights":["The formal water gardens","The frescoes and Mirror Wall","Lion’s Paw terrace","Summit palace foundations and views","A dawn perspective from nearby Pidurangala"],
      "nearby_attractions":["Pidurangala","Dambulla Cave Temple","Minneriya National Park","Hiriwadunna village landscape","Polonnaruwa"],
      "travel_tips":["Arrive at opening time and carry water.","Use caution on exposed metal stairways and follow site instructions.","Photography restrictions apply around the frescoes.","Do not disturb hornet nests or wildlife and obey temporary closures."]
    }
  ]$catalog$::jsonb) as c(
    slug text, short_description text, full_description text, why_visit text,
    historical_importance text, cultural_significance text, unesco_information text,
    nature_wildlife text, best_time_to_visit text, weather text,
    local_highlights jsonb, nearby_attractions jsonb, travel_tips jsonb
  )
)
update public.destinations as d
set
  short_description=c.short_description,
  full_description=c.full_description,
  why_visit=c.why_visit,
  historical_importance=c.historical_importance,
  cultural_significance=c.cultural_significance,
  unesco_information=c.unesco_information,
  nature_wildlife=c.nature_wildlife,
  best_time_to_visit=c.best_time_to_visit,
  weather=c.weather,
  local_highlights=c.local_highlights,
  nearby_attractions=c.nearby_attractions,
  travel_tips=c.travel_tips,
  updated_at=now()
from catalog as c
where d.slug=c.slug;
