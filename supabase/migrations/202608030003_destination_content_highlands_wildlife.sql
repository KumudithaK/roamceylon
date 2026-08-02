-- Premium destination editorial catalogue: highlands, rivers and wildlife landscapes.
-- Content only: optional story fields remain null where they would add no traveller value.

with catalog as (
  select * from jsonb_to_recordset($catalog$[
    {
      "slug":"belihuloya",
      "short_description":"A quiet highland valley of rivers, waterfalls and forest trails where Sri Lanka’s wet and dry zones begin to meet.",
      "full_description":"Belihul Oya is a landscape rather than a conventional town stop. Mountain water gathers in clear streams, forest paths rise towards open viewpoints and small villages sit between several ecological zones. The reward is a slower, lightly travelled highland experience shaped around walking, water and simple outdoor days.",
      "why_visit":"Choose Belihul Oya for uncrowded trails, waterfall landscapes and an intimate alternative to Sri Lanka’s busier hill-country bases.",
      "historical_importance":null,
      "cultural_significance":"Farming villages and small religious sites give the valley a grounded rural character. Guided walks can connect the landscape with the communities who live within it.",
      "unesco_information":null,
      "nature_wildlife":"The area lies near a transition between climatic zones, creating varied forest, grassland and river habitats with strong bird and butterfly diversity.",
      "best_time_to_visit":"January to March often offers clearer walking weather. Waterfall conditions vary with rainfall; trails should be reassessed after heavy showers.",
      "weather":"Mild to warm by day and cooler at night, roughly 18–28°C depending on elevation. Rain and mist can develop quickly in the hills.",
      "local_highlights":["Guided walks through changing ecological zones","Waterfalls and river pools","Mountain viewpoints around the valley","Village landscapes and small-scale agriculture","A quiet base between the plains and hill country"],
      "nearby_attractions":["Samanalawewa","Bambarakanda Falls","Horton Plains approach","Haputale","Udawalawe"],
      "travel_tips":["Use a knowledgeable guide for longer or less-defined trails.","Wear footwear with grip and carry rain protection.","Never enter fast water after heavy rain.","Keep evenings free for the slower pace that makes the valley special."]
    },
    {
      "slug":"ella",
      "short_description":"A dramatic hill-country village of tea slopes, railway landmarks and panoramic walks above the Uva valleys.",
      "full_description":"Ella’s appeal lies in how easily the landscape can be entered. Paths lead from the village towards viewpoints, tea gardens and Nine Arches Bridge, while the railway curves through cloud and forest. It is deservedly popular, so the most memorable version begins early, leaves the busiest paths when possible and makes room for the wider Uva country.",
      "why_visit":"Come for accessible highland walking, Sri Lanka’s most celebrated railway scenery and an easy-going base with expansive views.",
      "historical_importance":"The railway and plantation landscape reflect the transformation of the central highlands under British colonial rule and the enduring importance of tea to the region.",
      "cultural_significance":"Tamil plantation communities are central to the hill country’s tea culture. Responsible estate experiences should present their labour, history and contemporary lives with dignity.",
      "unesco_information":null,
      "nature_wildlife":"Montane forest fragments, tea estates, waterfalls and valley edges support rich birdlife. Popular viewpoints are sensitive to erosion and litter pressure.",
      "best_time_to_visit":"January to March often brings clearer mornings, while July to September can also be favourable. Clouds and showers remain part of the highland character in every season.",
      "weather":"Mild and changeable, usually 16–27°C. Mornings may be bright before cloud, mist or rain builds over the hills.",
      "local_highlights":["Nine Arches Bridge in the early morning","Little Adam’s Peak","Ella Rock with a local guide","Tea-country railway journeys","Ravana Falls and the wider Uva landscape"],
      "nearby_attractions":["Haputale","Lipton’s Seat","Buduruwagala","Diyaluma Falls","Badulla"],
      "travel_tips":["Begin popular walks early and remain on established paths.","Use a guide for Ella Rock if unfamiliar with the route.","Keep clear of railway tracks and tunnels.","Carry rain protection and a warm layer even on bright mornings."]
    },
    {
      "slug":"kitulgala",
      "short_description":"A rainforest river town where Kelani rapids, canyon water and forest trails create Sri Lanka’s most concentrated adventure base.",
      "full_description":"Kitulgala is shaped by water. The Kelani River drives white-water journeys, tributaries cut through forested canyons and rain keeps the surrounding landscape intensely green. Adventure is the headline, but birding, cave exploration and the town’s film history give the destination more texture than a single rafting stop.",
      "why_visit":"Visit for professionally guided river adventure within a rich lowland-rainforest setting, close enough to fit naturally between Colombo and the hills.",
      "historical_importance":"The area became internationally known as a principal filming location for The Bridge on the River Kwai, adding a distinctive layer to its modern visitor story.",
      "cultural_significance":"Forest-edge villages and the tradition of tapping kitul palms connect the destination to rural livelihoods beyond adventure tourism.",
      "unesco_information":null,
      "nature_wildlife":"The Kelani Valley’s wet-zone forest supports endemic birds, amphibians and butterflies. River levels change rapidly, so responsible operation and habitat protection are essential.",
      "best_time_to_visit":"January to April is often preferred for settled outdoor conditions, although rafting can operate across different seasons when river levels are professionally assessed.",
      "weather":"Warm, humid and notably wet, generally 23–30°C. Heavy tropical rain can arrive quickly and alter river and trail conditions.",
      "local_highlights":["White-water rafting on the Kelani River","Canyoning and natural rock slides","Rainforest birding","Belilena cave","Film-location and village stories"],
      "nearby_attractions":["Belilena Cave","Makandawa forest","Adam’s Peak approach","Laxapana Falls","Hatton"],
      "travel_tips":["Use licensed operators with helmets, buoyancy aids and trained guides.","Disclose swimming ability and medical considerations before activities.","Expect leeches on wet forest trails and dress accordingly.","Never enter a river or canyon after unassessed heavy rain."]
    },
    {
      "slug":"minneriya",
      "short_description":"A dry-zone reservoir landscape renowned for seasonal elephant gatherings and wide grasslands beneath an enormous sky.",
      "full_description":"Minneriya is built around water. The ancient tank sustains grasslands and forest that draw elephants from the wider region as seasonal levels fall. A safari here is most powerful when it is not reduced to numbers: changing light, birdlife, herd behaviour and the scale of the reservoir landscape are equally important.",
      "why_visit":"Come for one of Sri Lanka’s most celebrated elephant landscapes and a wildlife experience that pairs naturally with Sigiriya and Polonnaruwa.",
      "historical_importance":"The Minneriya tank is traditionally associated with King Mahasen and demonstrates the enduring importance of ancient irrigation to the dry-zone landscape.",
      "cultural_significance":"The reservoir continues to support farming communities beyond the park, linking wildlife conservation with the island’s long hydraulic tradition.",
      "unesco_information":null,
      "nature_wildlife":"Elephants move between Minneriya, Kaudulla and surrounding forests according to water, forage and weather. The park also supports deer, macaques, reptiles and abundant water birds.",
      "best_time_to_visit":"The famous gathering is usually associated with the drier months, often July to October, but elephant movements vary each year. Kaudulla or another nearby park may be better on a given day.",
      "weather":"Hot and often dry, generally 26–34°C. Rainfall increases with the northeast monsoon, changing reservoir levels and animal distribution.",
      "local_highlights":["Elephant herds along the reservoir grasslands","Golden late-afternoon light","Water birds and raptors","Ancient irrigation within a living ecosystem","A flexible safari circuit with Kaudulla"],
      "nearby_attractions":["Sigiriya","Kaudulla National Park","Habarana","Polonnaruwa","Dambulla"],
      "travel_tips":["Ask which nearby park has the best current conditions rather than insisting on one location.","Choose drivers who keep distance and never block elephants.","Carry water, sun protection and a dust covering.","Wildlife sightings and herd sizes are never guaranteed."]
    },
    {
      "slug":"nuwaraeliya",
      "short_description":"Sri Lanka’s high garden city, wrapped in tea estates, cool mist and landscapes shaped by mountain climate and colonial history.",
      "full_description":"Nuwara Eliya offers a different Sri Lanka: crisp mornings, vegetable farms, clipped gardens and tea-covered slopes beneath shifting cloud. Colonial-era architecture remains visible, but the deeper story belongs to the highland environment and the Tamil communities whose labour built the tea economy. It is both a restful base and a gateway to Horton Plains.",
      "why_visit":"Visit for cool-climate beauty, tea-country encounters and access to some of the island’s most distinctive montane landscapes.",
      "historical_importance":"The town developed as a British colonial hill station and administrative retreat, with plantations transforming the surrounding highlands during the nineteenth century.",
      "cultural_significance":"Tea remains central to local identity and economy. Meaningful estate visits should include the histories and present-day perspectives of Tamil plantation communities.",
      "unesco_information":null,
      "nature_wildlife":"Montane forest, grassland and wetlands around Nuwara Eliya support endemic birds and plants. Nearby Horton Plains forms part of the UNESCO-listed Central Highlands of Sri Lanka, though Nuwara Eliya town itself is not the World Heritage property.",
      "best_time_to_visit":"January to April often brings clearer mornings, with the April season particularly lively. Horton Plains should be entered early before cloud closes in.",
      "weather":"Cool and changeable, commonly 10–22°C. Mist, rain and sharp evening temperature drops are possible throughout the year.",
      "local_highlights":["Tea-estate landscapes and considered factory visits","Hakgala Botanic Gardens","Lake Gregory at a quiet hour","Early access to Horton Plains","Highland produce and cool-climate gardens"],
      "nearby_attractions":["Horton Plains National Park","Hakgala","Ambewela","Ramboda","Hatton tea country"],
      "travel_tips":["Carry a warm layer and rain protection in every season.","Start Horton Plains before sunrise and stay on marked trails.","Choose tea experiences that represent workers respectfully.","Expect slower road journeys in fog or heavy rain."]
    },
    {
      "slug":"udawalawe",
      "short_description":"Open grassland, reservoir edges and year-round elephant country create one of Sri Lanka’s most rewarding first safaris.",
      "full_description":"Udawalawe’s broad landscapes make wildlife easier to read. Elephants move between grassland, scrub and water, raptors survey the plains and the reservoir opens long views towards distant hills. The park is often chosen for reliable elephant encounters, but a patient drive reveals a fuller dry-zone ecosystem.",
      "why_visit":"Choose Udawalawe for an accessible, spacious safari with strong elephant possibilities and a natural link between the south coast and hill country.",
      "historical_importance":null,
      "cultural_significance":"The reservoir and surrounding settlements reflect modern irrigation and resettlement as well as conservation, shaping a landscape shared by people and wildlife.",
      "unesco_information":null,
      "nature_wildlife":"The park supports elephants, water buffalo, deer, crocodiles, jackals and abundant raptors and water birds. The Elephant Transit Home rehabilitates orphaned calves for release rather than visitor interaction.",
      "best_time_to_visit":"Wildlife viewing is rewarding throughout the year. Dry periods concentrate animals near water, while greener months bring dramatic skies and active birdlife.",
      "weather":"Warm to hot, generally 25–33°C. Short intense rain is possible, with stronger rainfall influence later in the year.",
      "local_highlights":["Elephants in open grassland","Reservoir-edge birdlife","Raptors and dry-zone scenery","Eth Athuru Sevana viewing times","A natural route between coast and hills"],
      "nearby_attractions":["Elephant Transit Home","Sankapala temple","Belihul Oya","Tangalle","Sinharaja approaches"],
      "travel_tips":["Use ethical drivers who do not crowd or chase animals.","Visit the transit home only at official public viewing times.","Carry binoculars for birds and distant wildlife.","Treat every sighting as uncertain and allow the landscape to be part of the experience."]
    },
    {
      "slug":"wilpattu",
      "short_description":"Sri Lanka’s largest national park, a remote mosaic of forest and natural lakes known for leopard, sloth bear and deep quiet.",
      "full_description":"Wilpattu feels expansive and secretive. Forest tracks connect natural rain-filled basins known as villus, where animals emerge at their own pace and long periods of stillness are part of the experience. The park asks for patience, rewarding travellers who value wilderness atmosphere as much as headline sightings.",
      "why_visit":"Come for a quieter, more immersive safari landscape with exceptional habitat variety and a strong sense of remoteness.",
      "historical_importance":"The wider region contains ancient settlements and is associated with early chronicles of the island, adding archaeological depth to the wilderness corridor.",
      "cultural_significance":null,
      "unesco_information":null,
      "nature_wildlife":"Wilpattu supports leopards, sloth bears, elephants, deer, crocodiles and rich birdlife. Its defining villu wetlands create a distinctive ecosystem within the dry-zone forest.",
      "best_time_to_visit":"February to October is often favoured, though conditions and sightings vary. Drier months can improve visibility around water while rain transforms the forest.",
      "weather":"Hot and dry for long periods, generally 26–34°C, with rain most influential during the northeast monsoon and inter-monsoons.",
      "local_highlights":["Natural villu wetlands","Long, quiet forest drives","Leopard and sloth-bear habitat","Water birds and raptors","A remote wilderness atmosphere"],
      "nearby_attractions":["Anuradhapura","Kalpitiya","Puttalam Lagoon","Thanthirimale","Mannar route"],
      "travel_tips":["Allow a full day or more; the park’s scale does not suit rushed visits.","Choose an experienced naturalist and responsible driver.","Carry food and water while leaving no waste.","Accept quiet periods as an essential part of ethical wildlife watching."]
    },
    {
      "slug":"yala",
      "short_description":"A celebrated southern wilderness where leopard country, ancient sacred sites, lagoons and a wild ocean meet.",
      "full_description":"Yala is visually dramatic: granite outcrops rise above scrub forest, lagoons attract birds and elephants, and the park’s eastern edge reaches the sea. It holds one of the world’s best-known leopard populations, yet its richness extends to sloth bears, crocodiles, deer and layers of monastic history. The quality of a visit depends greatly on patient, responsible guiding.",
      "why_visit":"Visit for Sri Lanka’s most iconic safari landscape and an exceptional intersection of wildlife, coast and ancient sacred history.",
      "historical_importance":"Rock monasteries, inscriptions and the nearby sacred landscapes of Sithulpawwa and Magul Maha Viharaya show that people have moved through and revered this region for centuries.",
      "cultural_significance":"The wider Yala–Kataragama landscape remains spiritually significant, linking Buddhist monastic sites with multi-faith pilgrimage routes.",
      "unesco_information":null,
      "nature_wildlife":"Yala supports leopard, elephant, sloth bear, crocodile, deer and exceptional bird diversity across scrub, forest, wetland and marine habitats.",
      "best_time_to_visit":"February to July often brings drier conditions and wildlife around water, but the park is rewarding in greener periods too. Individual blocks may close seasonally for management.",
      "weather":"Hot and generally dry, around 25–33°C. Rain comes mainly with the northeast monsoon and inter-monsoon storms, while coastal sections can be windy.",
      "local_highlights":["Leopard habitat among granite outcrops","Elephants beside lagoons and tracks","Water birds, raptors and crocodiles","The wild coastline","Sithulpawwa’s sacred landscape"],
      "nearby_attractions":["Kataragama","Tissamaharama","Sithulpawwa","Bundala National Park","Kirinda"],
      "travel_tips":["Choose guides who refuse to speed, crowd or block wildlife.","Never demand a leopard sighting; enjoy the complete ecosystem.","Confirm which park blocks are open before travel.","Carry sun protection and secure all food and waste."]
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
