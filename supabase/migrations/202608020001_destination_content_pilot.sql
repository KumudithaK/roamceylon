-- Premium destination editorial pilot: Ahungalla and Anuradhapura.
-- This updates content only; no schema or relationship changes are made.

update public.destinations
set
  short_description = 'A quiet stretch of Sri Lanka’s southwest coast where palm-fringed beaches, considered Ayurveda and lagoon country invite a slower rhythm.',
  full_description = 'Ahungalla is a place to exhale. Its broad, palm-lined shore feels removed from the busier beach towns, with long sunset walks, warm Indian Ocean light and an easy coastal pace shaping each day. Thoughtful wellness stays make it especially suited to travellers who want rest to be part of the journey rather than an afterthought.\n\nBeyond the beach, Ahungalla sits close to the waterways, village life and craft traditions of the southern coast. Madu Ganga’s mangrove landscape, Kosgoda’s turtle conservation work and Ambalangoda’s mask-making heritage can all be explored without losing the calm of a seaside base.',
  why_visit = 'Choose Ahungalla for unhurried beach time, restorative wellness and easy access to the softer side of Sri Lanka’s southern coast. It works beautifully as a gentle first stop after arrival or as a quiet conclusion to a longer island journey.',
  historical_importance = null,
  cultural_significance = 'The surrounding coast is shaped by fishing communities, Buddhist village life, Ayurveda and the mask-carving traditions associated with nearby Ambalangoda. Experiences are most rewarding when approached quietly and with respect for the communities that keep these traditions alive.',
  unesco_information = null,
  nature_wildlife = 'The beach is complemented by nearby wetland and estuarine habitats. Madu Ganga supports mangroves, water birds and small islands, while the Kosgoda coast is associated with marine-turtle conservation. Wildlife visits should favour responsible operators that minimise handling and disturbance.',
  best_time_to_visit = 'December to April usually brings the calmest beach conditions and brighter days. Ahungalla remains rewarding year-round for wellness stays, although tropical showers and rougher seas are more likely during the southwest monsoon.',
  weather = 'Warm and humid throughout the year, commonly around 26–31°C by day. Coastal breezes soften the heat; short, heavy showers are possible in any season, with wetter conditions generally from May to September and again around October–November.',
  local_highlights = jsonb_build_array(
    'Quiet palm-fringed beach walks at sunrise and sunset',
    'Restorative Ayurveda and thoughtfully paced wellness stays',
    'Madu Ganga mangrove and lagoon journeys from nearby Balapitiya',
    'Responsible sea-turtle conservation visits around Kosgoda',
    'Traditional mask carving and coastal craft culture in Ambalangoda'
  ),
  nearby_attractions = jsonb_build_array(
    'Balapitiya and the Madu Ganga estuary',
    'Kosgoda sea-turtle conservation centres',
    'Ambalangoda mask workshops and museums',
    'Bentota beach and river experiences',
    'Galle Fort for a longer cultural day trip'
  ),
  travel_tips = jsonb_build_array(
    'Swim only where local conditions are confirmed safe; currents can change with the season.',
    'Reserve Ayurveda programmes in advance, particularly when planning a multi-day treatment.',
    'Carry light clothing, sun protection and a compact rain layer.',
    'Choose wildlife visits that do not encourage touching, holding or releasing turtles for photographs.'
  ),
  updated_at = now()
where slug = 'ahungalla';

update public.destinations
set
  short_description = 'Sri Lanka’s first great capital: a living sacred landscape of monumental stupas, ancient reservoirs and more than two millennia of Buddhist tradition.',
  full_description = 'Anuradhapura is not simply an archaeological city. It remains a place of pilgrimage and devotion, where immense white stupas rise above ancient monastic grounds and families gather beneath the branches of the Jaya Sri Maha Bodhi. Dawn and evening bring the city into its most memorable rhythm: temple flowers, quiet prayer and warm light across stone and water.\n\nThe scale rewards time. Ruwanwelisaya, Jetavanaramaya and Abhayagiri reveal extraordinary ambition in brick, while reservoirs and landscaped monastic precincts show how spiritual life, engineering and the dry-zone environment were woven together. A knowledgeable local guide adds essential context and helps visitors move through the sacred city with sensitivity.',
  why_visit = 'Visit Anuradhapura to encounter Sri Lankan history as a living tradition. Its sacred monuments, monastic ruins and ancient water landscapes offer depth beyond sightseeing, especially when explored slowly at the cooler edges of the day.',
  historical_importance = 'Anuradhapura became an early political and religious capital of Sri Lanka and flourished for roughly 1,300 years. Its surviving palaces, monasteries, stupas and reservoirs record the development of an influential ancient kingdom and a sophisticated tradition of urban planning, hydraulic engineering and Buddhist learning.',
  cultural_significance = 'The sacred city remains one of Sri Lanka’s most important Buddhist pilgrimage centres. The Jaya Sri Maha Bodhi, grown from a cutting associated with the Buddha’s tree of enlightenment and brought to the island in the 3rd century BCE, continues to be venerated alongside Ruwanwelisaya and the wider Atamasthana sacred places.',
  unesco_information = 'The Sacred City of Anuradhapura was inscribed on the UNESCO World Heritage List in 1982 under cultural criteria (ii), (iii) and (vi). UNESCO recognises the city’s long role as a political and religious capital and its exceptional ensemble of palaces, monasteries and monuments centred on the sacred Bodhi tree tradition.',
  nature_wildlife = 'Anuradhapura lies in Sri Lanka’s dry zone, where ancient reservoirs such as Tissa Wewa and Nuwara Wewa soften the landscape and attract water birds. Mature trees, monastic woodland and nearby protected areas make the city a rewarding bridge between cultural heritage and the island’s northern plains.',
  best_time_to_visit = 'January to March is often comfortable for extended exploration. June to September is generally drier but hotter. In every season, begin around sunrise, rest through the strongest midday heat and return in the late afternoon.',
  weather = 'Hot, sunny and comparatively dry for much of the year, with typical daytime temperatures around 29–34°C. The main rainfall influence arrives later in the year; brief storms can still occur outside that period, and exposed archaeological areas feel considerably hotter at midday.',
  local_highlights = jsonb_build_array(
    'Jaya Sri Maha Bodhi and the living pilgrimage traditions around it',
    'Ruwanwelisaya at the quieter edges of the day',
    'Jetavanaramaya and Abhayagiri monastic complexes',
    'Thuparamaya, Isurumuniya and the wider Atamasthana sacred places',
    'Ancient reservoirs, shaded cycling routes and archaeological museums'
  ),
  nearby_attractions = jsonb_build_array(
    'Mihintale, approximately 11 km from the sacred city',
    'Ritigala forest monastery',
    'Aukana Buddha statue',
    'Wilpattu National Park',
    'Kala Wewa reservoir landscape'
  ),
  travel_tips = jsonb_build_array(
    'Dress respectfully at sacred places, covering shoulders and knees; remove hats and footwear when requested.',
    'Carry socks for hot stone surfaces, drinking water and reliable sun protection.',
    'Plan the major monuments across two cooler sessions rather than rushing through the midday heat.',
    'A licensed guide is strongly recommended for historical context and respectful navigation of active worship areas.',
    'Keep voices low and avoid photographing people at prayer without permission.'
  ),
  updated_at = now()
where slug = 'anuradhapura';
