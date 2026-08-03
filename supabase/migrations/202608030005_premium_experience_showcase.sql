begin;

-- Editorial showcase: intentionally limited to the three validated experiences.
update public.experiences
set
  name = 'Baker''s Bend 4x4 Off-Road Adventure Safari',
  category = 'Adventure',
  short_description = 'Climb through Nonpareil Estate by private 4x4 to Baker''s Bend, a horseshoe-shaped highland viewpoint above Belihul Oya with immense valley and reservoir views.',
  full_description = $copy$Leaving Belihul Oya, the journey rises into the working tea country of Nonpareil Estate. The estate road becomes part of the experience: rough bends, changing forest, cool highland air and widening views accompany the climb towards the distinctive horseshoe curve known as Baker's Bend.

The viewpoint lies around the road's twenty-third bend and looks across the southern highlands towards distant plains and reservoirs. This is a landscape-led off-road journey rather than a conventional wildlife safari. Estate permission, local access knowledge and suitable weather are essential, which keeps the experience intimate and carefully paced.$copy$,
  hero_image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/The_Bakers_Bend.jpg/1280px-The_Bakers_Bend.jpg',
  image_alt = 'The horseshoe curve and mountain panorama at Baker''s Bend above Belihul Oya',
  gallery = jsonb_build_array(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/The_Bakers_Bend.jpg/1280px-The_Bakers_Bend.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Belihuloya_mountain_range.jpg/1280px-Belihuloya_mountain_range.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Sri_Lanka_Belihuloya.jpg/1280px-Sri_Lanka_Belihuloya.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Belihuloya_Waterfall%2C_SriLanka.jpg/1280px-Belihuloya_Waterfall%2C_SriLanka.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Lanka_ella%2C_Belihuloya%2C_SriLanka.jpg/1280px-Lanka_ella%2C_Belihuloya%2C_SriLanka.jpg'
  ),
  duration = 'Half day; final timing depends on estate access',
  difficulty = 'Moderate — rough 4x4 road and uneven viewpoints',
  best_season = 'Drier periods; access is weather-dependent',
  highlights = jsonb_build_array(
    'A private 4x4 ascent through the working landscape of Nonpareil Estate',
    'The distinctive horseshoe bend reached around the estate road''s twenty-third curve',
    'Expansive views towards the southern plains and distant reservoirs',
    'A dramatic transition from Belihul Oya''s valley to cool upper tea country',
    'Unhurried photographic stops wherever estate conditions allow safe access'
  ),
  unique_points = jsonb_build_array(
    'The route itself is the experience, with every bend revealing a different highland perspective',
    'Access crosses a working estate and must be arranged rather than treated as a casual drive-in viewpoint',
    'It offers an intimate alternative to Sri Lanka''s busier mountain lookouts',
    'A local driver''s knowledge matters as much as the vehicle when weather and road conditions change'
  ),
  included = jsonb_build_array(
    'Private 4x4 vehicle with an experienced local driver',
    'Pre-arranged estate access coordination',
    'Roam Ceylon route planning and local briefing',
    'Photographic stops subject to safe estate access'
  ),
  things_to_know = jsonb_build_array(
    'Permission from Nonpareil Estate is compulsory and must be reconfirmed before departure.',
    'The road is steep and rough; heavy rain or estate operations can alter or suspend access.',
    'Tell your journey designer about mobility, back or neck concerns before confirming the 4x4 journey.',
    'Exact pickup, refreshments and any additional stops are confirmed in the personalised proposal.'
  ),
  nearby_attractions = jsonb_build_array(
    'Samanalawewa Reservoir viewpoints',
    'Pahanthudawa Waterfall',
    'Belihul Oya river and nature trails',
    'Bambarakanda Falls',
    'Lanka Ella Falls'
  ),
  traveller_tips = jsonb_build_array(
    'Choose an early departure for clearer mountain views before afternoon cloud gathers.',
    'Wear closed shoes and carry a light layer; the upper estate can feel markedly cooler.',
    'Keep camera equipment compact and protected from dust or sudden rain.',
    'Do not fly a drone without explicit estate and aviation permission.',
    'Move quietly around workers and homes: Nonpareil is a living estate, not a staged attraction.'
  ),
  badges = jsonb_build_array('Adventure','Photography Spot','Advance Booking Recommended','Roam Ceylon Recommended'),
  family_friendly = false,
  suitable_for_children = false,
  private_option = true,
  priority = 'hidden-gem',
  featured = true,
  seo_title = 'Baker''s Bend 4x4 Adventure Safari | Roam Ceylon',
  seo_description = 'A privately arranged 4x4 ascent through Nonpareil Estate to the dramatic Baker''s Bend viewpoint above Belihul Oya.',
  image_status = 'approved',
  needs_image_review = false,
  image_review_notes = 'Five location-specific Baker''s Bend and Belihul Oya images reviewed; nearby waterfall photographs provide regional context and do not imply itinerary inclusion.',
  image_source = 'Wikimedia Commons',
  image_credit = 'Baker''s Bend: Sajith Sri (CC BY-SA 4.0); Belihuloya mountain range: Waruna Sanjaya Kannangara (CC BY-SA 4.0); Belihuloya: Dilshan071 (CC BY-SA 4.0); Belihuloya Waterfall and Lanka Ella: Chamrith (CC BY-SA 4.0).',
  updated_at = now()
where slug = 'belihuloya-bakers-bend-4x4-off-road-adventure-safari';

update public.experiences
set
  name = 'Bird Watching & Sunset Boat Ride on Kandalama Reservoir',
  category = 'Nature',
  short_description = 'A quiet, low-impact boat journey across Kandalama Reservoir, timed for evening light and interpreted through the lake''s resident and migratory birdlife.',
  full_description = $copy$Kandalama Reservoir creates a calm natural counterpoint to the Cultural Triangle's celebrated monuments. Moving gently across the water, travellers can watch forested shores, reflections and open sky while looking for kingfishers, waterbirds, raptors and the lake's smaller seasonal visitors.

The experience is at its most atmospheric as the heat softens and sunset gathers over the reservoir. Birdlife changes with water level, season and weather, so the journey is never presented as a guaranteed checklist. It is an invitation to slow down, listen and see Kandalama as a living wetland landscape.$copy$,
  hero_image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Sun_setting_over_Kandalama_Lake%2C_Sri_Lanka.jpg/1280px-Sun_setting_over_Kandalama_Lake%2C_Sri_Lanka.jpg',
  image_alt = 'Sunset light spreading across Kandalama Reservoir in Dambulla',
  gallery = jsonb_build_array(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Sun_setting_over_Kandalama_Lake%2C_Sri_Lanka.jpg/1280px-Sun_setting_over_Kandalama_Lake%2C_Sri_Lanka.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Kandalama_Lake.jpg/1280px-Kandalama_Lake.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Kandalama_Lake_in_Dambulla_DSC496.jpg/1280px-Kandalama_Lake_in_Dambulla_DSC496.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Kandalama_Lake%2C_Sri_Lanka.jpg/1280px-Kandalama_Lake%2C_Sri_Lanka.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Male_Purple-rumped_sunbird_in_sri_lanka.jpg/1280px-Male_Purple-rumped_sunbird_in_sri_lanka.jpg'
  ),
  duration = 'Approximately 1–2 hours; operator and water level dependent',
  difficulty = 'Easy — seated boat experience',
  best_season = 'Year-round for residents; November to April for migratory birdlife',
  highlights = jsonb_build_array(
    'A slow evening passage across Kandalama Reservoir in changing golden light',
    'Opportunities to observe waterbirds, kingfishers, raptors and forest-edge species',
    'Wide, uncluttered views of the reservoir and its wooded shoreline',
    'Quiet nature interpretation instead of a rushed wildlife checklist',
    'Sunset reflections and silhouettes that reward patient photography'
  ),
  unique_points = jsonb_build_array(
    'It pairs naturally with Dambulla and Sigiriya while revealing a gentler side of the Cultural Triangle',
    'Low-noise travel on the water gives birdlife space and allows the landscape to set the pace',
    'Every departure changes with season, water level, weather and the movement of birds',
    'The experience works equally well as thoughtful nature time or an intimate sunset moment'
  ),
  included = jsonb_build_array(
    'Boat and trained crew for the confirmed operating period',
    'Mandatory safety equipment, including life jackets',
    'Roam Ceylon timing and access coordination',
    'Wildlife interpretation when specified in the confirmed arrangement'
  ),
  things_to_know = jsonb_build_array(
    'Operation is subject to safe weather, sufficient water level and the local operator''s assessment.',
    'Wildlife is free-ranging, so species sightings and numbers can never be guaranteed.',
    'Craft type, naturalist service, child minimum age and accessibility must be reconfirmed with the selected operator.',
    'Exact departure point and all final inclusions appear in the personalised proposal.'
  ),
  nearby_attractions = jsonb_build_array(
    'Dambulla Royal Cave Temple and Golden Temple',
    'Popham''s Arboretum',
    'Sigiriya Rock Fortress',
    'Kaludiya Pokuna forest monastery',
    'Minneriya National Park'
  ),
  traveller_tips = jsonb_build_array(
    'Wear muted colours and keep voices low so birds are less likely to be disturbed.',
    'Bring compact binoculars and a lens suited to low evening light.',
    'Avoid flash photography, feeding wildlife or playing audio calls.',
    'Carry a small dry bag for phones and cameras.',
    'Arrive early enough for the safety briefing; sunset departures cannot wait without losing their best light.'
  ),
  badges = jsonb_build_array('Eco Experience','Wildlife','Photography Spot','Sunset Experience','Water Activity','Couples Favourite','Advance Booking Recommended','Roam Ceylon Recommended'),
  family_friendly = false,
  suitable_for_children = false,
  private_option = true,
  priority = 'popular',
  featured = true,
  seo_title = 'Kandalama Bird Watching & Sunset Boat Ride | Roam Ceylon',
  seo_description = 'A quiet sunset boat journey across Kandalama Reservoir with considered birdwatching and nature interpretation near Dambulla.',
  image_status = 'approved',
  needs_image_review = false,
  image_review_notes = 'Five Kandalama-specific reservoir and bird images reviewed; the Purple-rumped Sunbird photograph is geotagged/described at Kandalama.',
  image_source = 'Wikimedia Commons',
  image_credit = 'Kandalama sunset: Steve Weaver (CC BY 2.0); Kandalama Lake: Manoj Samarakoon (CC BY-SA 4.0); Kandalama Lake in Dambulla: Shakir Jamaldeen (CC BY-SA 4.0); Kandalama Lake: Anuradha Dullewe Wijeyeratne (public domain); Purple-rumped Sunbird at Kandalama: Gihan Jayaweera (CC BY-SA 3.0).',
  updated_at = now()
where slug = 'dambulla-bird-watching-and-sunset-boat-rides-on-kandalama-reservoir';

update public.experiences
set
  name = 'Experiencing the Grand Annual Kandy Esala Perahera Festival Procession',
  category = 'Culture',
  short_description = 'Witness Kandy''s sacred annual procession from a carefully arranged vantage point as drummers, dancers, torchbearers and ceremonial traditions move through the historic city.',
  full_description = $copy$The Kandy Esala Perahera is first a sacred religious observance and only then a visual spectacle. Held in honour of the Sacred Tooth Relic, its annual sequence brings together temple traditions, Kandyan drumming and dance, torchlight and ceremonial processions through Kandy's historic streets.

Each procession night has its own place in the official calendar, building from the Kumbal Perahera towards the later Randoli processions. A carefully planned visit helps travellers understand what they are seeing, arrive through road closures and watch with the respect owed to a living tradition rather than consuming it as a performance.$copy$,
  hero_image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Elephants_of_Kandy_Esala_Perahera.jpg/1280px-Elephants_of_Kandy_Esala_Perahera.jpg',
  image_alt = 'Illuminated ceremonial procession during the Kandy Esala Perahera',
  gallery = jsonb_build_array(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Elephants_of_Kandy_Esala_Perahera.jpg/1280px-Elephants_of_Kandy_Esala_Perahera.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Fire_spinning_show_at_Kandy_Esala_Perahera_in_Sri_Lanka.jpg/1280px-Fire_spinning_show_at_Kandy_Esala_Perahera_in_Sri_Lanka.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Fire_spirals_was_captured_at_Kandy_Esala_Perahera_in_Sri_Lanka.jpg/1280px-Fire_spirals_was_captured_at_Kandy_Esala_Perahera_in_Sri_Lanka.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Wheel_on_Fire_at_Kandy_Esala_Perahera.jpg/1280px-Wheel_on_Fire_at_Kandy_Esala_Perahera.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Pere_hare_festival_-_panoramio.jpg/1280px-Pere_hare_festival_-_panoramio.jpg'
  ),
  duration = 'Evening experience; duration varies by procession night',
  difficulty = 'Easy physically, with long evening hours and dense crowds',
  best_season = 'Seasonal — official dates vary annually in July or August',
  highlights = jsonb_build_array(
    'The measured power of Kandyan drumming and traditional dance ensembles',
    'Torchbearers and fire performers illuminating Kandy''s night streets',
    'The ceremonial rhythm of an observance shaped by temple traditions',
    'A historic city transformed by sound, light, devotion and anticipation',
    'Context from a local host so the procession is understood, not merely photographed'
  ),
  unique_points = jsonb_build_array(
    'It is a living religious tradition connected to the Temple of the Sacred Tooth Relic',
    'The experience unfolds within Kandy''s UNESCO-listed sacred-city setting, although the procession is not separately UNESCO-inscribed',
    'No two nights are identical: the official sequence develops from Kumbal to Randoli processions',
    'Meaning comes from ceremony and continuity as much as scale and pageantry'
  ),
  included = jsonb_build_array(
    'Roam Ceylon verification of the official annual schedule and route',
    'Pre-event cultural and etiquette briefing',
    'Arrival and departure planning around city road closures',
    'Viewing arrangement exactly as specified in the personalised proposal',
    'Reserved seating only when explicitly listed and confirmed'
  ),
  things_to_know = jsonb_build_array(
    'This is a sacred Buddhist observance; dress modestly and follow instructions from temple, police and event officials.',
    'Official dates, procession routes and start times can change and must be checked for the travel year.',
    'Reserved seating is sold by third parties and is not the same as admission to the public street route.',
    'Expect road closures, dense crowds, a long evening and limited access to facilities once seated.',
    'The procession traditionally includes ceremonial elephants; ask your journey designer for context if this affects your decision.'
  ),
  nearby_attractions = jsonb_build_array(
    'Temple of the Sacred Tooth Relic',
    'Kandy Lake promenade',
    'International Buddhist Museum and Kandy National Museum',
    'Udawattakele Forest Reserve',
    'Royal Botanic Gardens, Peradeniya'
  ),
  traveller_tips = jsonb_build_array(
    'Plan months ahead, especially for later Randoli procession nights and confirmed reserved seating.',
    'Ask your journey designer to explain the difference between Kumbal and Randoli nights before choosing.',
    'Carry only essentials, water and a light rain layer; large bags make crowd movement difficult.',
    'Use flash sparingly and never where event officials or religious etiquette prohibit it.',
    'Agree on a post-procession meeting point in advance because mobile coverage and road access can become difficult.'
  ),
  badges = jsonb_build_array('Seasonal','Cultural Heritage','UNESCO Related','Photography Spot','Advance Booking Recommended','Most Popular','Roam Ceylon Recommended'),
  family_friendly = false,
  suitable_for_children = false,
  private_option = false,
  priority = 'seasonal',
  featured = true,
  seo_title = 'Kandy Esala Perahera Festival Experience | Roam Ceylon',
  seo_description = 'Experience Kandy''s sacred annual Esala Perahera with considered planning, cultural context and a confirmed viewing arrangement.',
  image_status = 'approved',
  needs_image_review = false,
  image_review_notes = 'Five images from the Wikimedia Commons Kandy Esala Perahera collection reviewed; all depict the named festival in Kandy.',
  image_source = 'Wikimedia Commons',
  image_credit = 'Kandy Esala Perahera and Wheel on Fire: Daniel Liabeuf (CC BY-SA 3.0); fire spinning: Richard Shaw (CC BY 2.0); fire spirals: Sachin Kaveesha Fernando (CC BY-SA 4.0); festival procession: Omar AV (CC BY 3.0).',
  updated_at = now()
where slug = 'kandy-experiencing-the-grand-annual-kandy-esala-perahera-festival-procession';

-- Rebuild only the relationships owned by the three showcase records.
delete from public.experience_destinations
where experience_id in (
  select id from public.experiences where slug in (
    'belihuloya-bakers-bend-4x4-off-road-adventure-safari',
    'dambulla-bird-watching-and-sunset-boat-rides-on-kandalama-reservoir',
    'kandy-experiencing-the-grand-annual-kandy-esala-perahera-festival-procession'
  )
);

insert into public.experience_destinations (experience_id,destination_id)
select e.id,d.id
from (values
  ('belihuloya-bakers-bend-4x4-off-road-adventure-safari','belihuloya'),
  ('dambulla-bird-watching-and-sunset-boat-rides-on-kandalama-reservoir','dambulla'),
  ('kandy-experiencing-the-grand-annual-kandy-esala-perahera-festival-procession','kandy')
) as mapping(experience_slug,destination_slug)
join public.experiences e on e.slug=mapping.experience_slug
join public.destinations d on d.slug=mapping.destination_slug
on conflict do nothing;

delete from public.experience_themes
where experience_id in (
  select id from public.experiences where slug in (
    'belihuloya-bakers-bend-4x4-off-road-adventure-safari',
    'dambulla-bird-watching-and-sunset-boat-rides-on-kandalama-reservoir',
    'kandy-experiencing-the-grand-annual-kandy-esala-perahera-festival-procession'
  )
);

insert into public.experience_themes (experience_id,theme_id)
select e.id,t.id
from (values
  ('belihuloya-bakers-bend-4x4-off-road-adventure-safari','adventure'),
  ('belihuloya-bakers-bend-4x4-off-road-adventure-safari','nature'),
  ('dambulla-bird-watching-and-sunset-boat-rides-on-kandalama-reservoir','nature'),
  ('dambulla-bird-watching-and-sunset-boat-rides-on-kandalama-reservoir','wildlife'),
  ('kandy-experiencing-the-grand-annual-kandy-esala-perahera-festival-procession','culture'),
  ('kandy-experiencing-the-grand-annual-kandy-esala-perahera-festival-procession','heritage')
) as mapping(experience_slug,theme_slug)
join public.experiences e on e.slug=mapping.experience_slug
join public.themes t on t.slug=mapping.theme_slug
on conflict do nothing;

commit;
