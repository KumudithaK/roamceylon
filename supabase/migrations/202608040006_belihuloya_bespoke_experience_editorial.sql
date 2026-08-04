begin;

-- Bespoke Belihuloya editorial. Photography remains fully administrator-managed.
update public.experiences set
  name='Samanalawewa Reservoir Canoeing & Kayaking',
  category='Water Sports',
  short_description='Paddle across the calm reaches of Samanalawewa, where open water, wooded shores and the folds of the southern highlands create a quietly cinematic journey.',
  full_description=$copy$Samanalawewa offers a gentler expression of Belihuloya's adventurous landscape. Leaving the shore by canoe or kayak, the scale of the reservoir gradually becomes clear: broad water, forested inlets and mountain contours that change as the craft moves away from land. Short sessions introduce basic paddling, while longer arrangements can explore quieter coves or the meeting point of the Belihul Oya and the reservoir.

This is not sold as an unrestricted crossing. Water level, wind, launch access and the selected operator determine the safe route, craft and group size. A well-paced departure leaves room to stop paddling, watch the shoreline and appreciate Samanalawewa as both a highland landscape and a working reservoir.$copy$,
  duration='From approximately 1 hour to a half-day, depending on the confirmed route',
  difficulty=null,
  best_season='Available when wind, water level and launch conditions are suitable',
  highlights=jsonb_build_array(
    'Calm-water paddling framed by the southern highlands',
    'A choice between an introductory session and a longer exploratory route',
    'Quiet coves and changing perspectives unavailable from the road',
    'Time to observe birds, butterflies and the reservoir''s wooded margins',
    'A restorative counterpoint to Belihuloya''s rougher mountain adventures'
  ),
  unique_points=jsonb_build_array(
    'Samanalawewa combines the openness of a large reservoir with an intimate human-powered journey',
    'The route can be shaped around experience level without turning the lake into a fixed circuit',
    'Mountain scenery and still water create a distinctly different mood from coastal or river paddling',
    'Longer sessions can reveal where the Belihul Oya enters the reservoir, when access permits'
  ),
  included=jsonb_build_array(
    'Canoe or kayak appropriate to the confirmed arrangement',
    'Paddle and correctly fitted buoyancy aid',
    'Local instructor or guide and a pre-launch safety briefing',
    'Roam Ceylon timing, access and supplier coordination',
    'Only transfers, refreshments or dry storage explicitly listed in the proposal'
  ),
  things_to_know=jsonb_build_array(
    'The operator has final authority over route, launch point and cancellation when wind or water conditions are unsafe.',
    'Craft type, participant age, swimming requirements and guide ratios must be confirmed before travel.',
    'Reservoir levels and shoreline access can change, so the exact route is not guaranteed in advance.',
    'This experience should use a recognised local operator; independent paddling is not included.'
  ),
  nearby_attractions=jsonb_build_array('Baker''s Bend and Nonpareil Estate','Belihul Oya nature trails','Pahanthudawa Waterfall','Bambarakanda Falls'),
  traveller_tips=jsonb_build_array(
    'Choose lightweight quick-drying clothing and secure sun protection.',
    'Carry only essential items in a dry bag and leave loose valuables ashore.',
    'An early or later session often offers softer light and a calmer atmosphere, subject to local conditions.',
    'Tell the instructor about swimming confidence before the craft is assigned.'
  ),
  badges=jsonb_build_array('Water Activity','Adventure','Eco Experience','Photography Spot','Advance Booking Recommended'),
  seo_title='Samanalawewa Canoeing & Kayaking | Roam Ceylon',
  seo_description='A guided canoe or kayak journey across the calm waters and mountain-framed coves of Samanalawewa Reservoir near Belihuloya.',
  status='published',active=true,updated_at=now()
where slug='belihuloya-canoeing-and-kayaking-across-samanalawewa-reservoir';

update public.experiences set
  name='Bambarakanda & Surathali Waterfall Journey',
  category='Adventure',
  short_description='Explore two contrasting highland waterfalls: the slender 263-metre drop of Bambarakanda and forest-framed Surathali, each approached at a pace shaped by weather and trail conditions.',
  full_description=$copy$Bambarakanda and Surathali reveal two different faces of the highlands around Belihuloya. Near Kalupahana, Bambarakanda falls in a narrow 263-metre ribbon from the escarpment, making it Sri Lanka's tallest waterfall. The final approach leaves the main road for a narrower mountain road and a short walk through pine and mixed vegetation, with optional higher paths requiring substantially more care.

Surathali is closer to the A4 road but feels enclosed by dense forest as its water descends in stages. Combining both falls creates a fuller landscape journey rather than a race between viewpoints. The exact walking sections, vehicle access and swimming advice must be confirmed locally: rain can make rock and earth slippery, and beauty is never evidence that a natural pool is safe.$copy$,
  duration='Approximately a full day when both waterfalls are combined',
  difficulty=null,
  best_season='Choose settled weather; heavy rain can make access roads, trails and rock surfaces unsafe',
  highlights=jsonb_build_array(
    'The immense vertical scale of Sri Lanka''s 263-metre Bambarakanda Falls',
    'A mountain approach through pine, forest and the Kalupahana landscape',
    'The more intimate, multi-stage character of Surathali Falls',
    'Two contrasting waterfall settings within one carefully paced day',
    'Photographic stops that respect local access and safe trail boundaries'
  ),
  unique_points=jsonb_build_array(
    'The journey pairs Sri Lanka''s tallest waterfall with a quieter forest cascade rather than reducing the day to one viewpoint',
    'Road conditions and short trail sections make local route knowledge genuinely valuable',
    'Changing rainfall transforms both the visual power and the practical risk of the landscape',
    'The experience connects Belihuloya with the dramatic escarpment around Kalupahana'
  ),
  included=jsonb_build_array(
    'Private vehicle appropriate to the confirmed access route',
    'Local guide for the walking sections specified in the proposal',
    'Roam Ceylon route, timing and access coordination',
    'Only entrance arrangements, meals or refreshments explicitly confirmed in the proposal'
  ),
  things_to_know=jsonb_build_array(
    'The road towards Bambarakanda is narrow and can be rough; vehicle suitability must be reconfirmed.',
    'Higher trails and wet rock require more care than the standard base viewpoint and may be omitted after rain.',
    'Do not swim or climb near either waterfall unless the local guide has specifically confirmed current conditions.',
    'The two-waterfall programme depends on travel pace, daylight and access; a shortened route may be safer on some days.'
  ),
  nearby_attractions=jsonb_build_array('Kalupahana','Devil''s Staircase','Baker''s Bend and Nonpareil Estate','Samanalawewa Reservoir'),
  traveller_tips=jsonb_build_array(
    'Start early so mountain weather and daylight do not compress the walking time.',
    'Wear closed footwear with reliable wet-surface grip and carry a light rain layer.',
    'Bring drinking water and keep the daypack compact for narrow paths.',
    'Photograph from established safe ground rather than moving towards an exposed edge for a wider frame.'
  ),
  badges=jsonb_build_array('Adventure','Eco Experience','Photography Spot','Roam Ceylon Recommended'),
  seo_title='Bambarakanda & Surathali Waterfall Journey | Roam Ceylon',
  seo_description='A carefully paced Belihuloya journey combining Sri Lanka''s tallest waterfall at Bambarakanda with forest-framed Surathali Falls.',
  status='published',active=true,updated_at=now()
where slug='belihuloya-trekking-to-bambarakanda-falls-sri-lankas-tallest-waterfall-and-surathal';

update public.experiences set
  name='Belihuloya Tea-Country Mountain Biking',
  category='Adventure',
  short_description='Ride from cool tea country towards remote villages, forest edges and mountain passes on a privately selected Belihuloya route matched to your confidence and fitness.',
  full_description=$copy$Belihuloya sits at a transition between ecological zones, giving mountain-bike journeys unusual variety within a relatively compact region. A ride may follow quieter estate roads, descend towards rural valleys or take on more demanding routes in the direction of Kalupahana, Kalthota or the high mountain tracks. Tea, forest, grassland and distant reservoir views replace the repetition of a purpose-built circuit.

There is no honest single difficulty label for this experience. Distance, total descent, climbing, surface and vehicle support must be selected for the individual group. Roam Ceylon therefore confirms a named route, capable cycle, helmet, guide and support plan in the proposal. Working estates and villages are approached respectfully; they are part of the lived landscape, not scenery arranged for riders.$copy$,
  duration='Approximately 3–5 hours for a selected half-day route; longer journeys are available by arrangement',
  difficulty=null,
  best_season='Route-dependent; heavy rain can make estate roads and mountain tracks unsuitable',
  highlights=jsonb_build_array(
    'A route chosen around the rider rather than a generic one-size-fits-all circuit',
    'Tea gardens, forest margins, villages and broad mountain viewpoints',
    'Long, flowing descents where the selected route and conditions permit',
    'Local guidance through junctions and changing estate-road surfaces',
    'Optional vehicle support or e-bike arrangements when specifically confirmed'
  ),
  unique_points=jsonb_build_array(
    'Belihuloya''s ecological transition creates unusually varied scenery within a single ride',
    'Routes can range from approachable rural riding to serious mountain descents',
    'The experience moves through working landscapes rather than remaining inside a recreational park',
    'A named route and equipment specification make the proposal transparent before travel'
  ),
  included=jsonb_build_array(
    'Maintained mountain bike appropriate to the confirmed route',
    'Correctly fitted helmet and basic repair equipment',
    'Experienced local cycling guide',
    'Roam Ceylon route, timing and supplier coordination',
    'Vehicle support, e-bike, snacks or transfers only when explicitly listed in the proposal'
  ),
  things_to_know=jsonb_build_array(
    'The exact route, distance, elevation profile and surface must be confirmed before the journey.',
    'Rain, estate operations and road damage can require a route change.',
    'Riders should disclose cycling experience, fitness, height and relevant medical conditions before equipment is assigned.',
    'Traffic cannot be excluded from public-road sections; the guide''s road-safety instructions must be followed.'
  ),
  nearby_attractions=jsonb_build_array('Baker''s Bend and Nonpareil Estate','Bambarakanda Falls','Samanalawewa Reservoir','Belihul Oya river valley'),
  traveller_tips=jsonb_build_array(
    'Ask for the proposed distance, climbing and surface—not merely the words “easy” or “moderate.”',
    'Wear padded cycling shorts if preferred and use closed shoes with a stable sole.',
    'Carry sun protection and a light rain shell; conditions change quickly between valley and pass.',
    'Slow down around homes, workers, animals and blind estate-road bends.'
  ),
  badges=jsonb_build_array('Adventure','Eco Experience','Photography Spot','Private Option Available','Advance Booking Recommended'),
  seo_title='Belihuloya Tea-Country Mountain Biking | Roam Ceylon',
  seo_description='A privately selected guided mountain-bike journey through Belihuloya''s tea country, villages, forest edges and highland passes.',
  status='published',active=true,updated_at=now()
where slug='belihuloya-cross-country-mountain-biking-across-tea-gardens-and-mountain-passes';

delete from public.experience_destinations where experience_id in (
  select id from public.experiences where slug in (
    'belihuloya-canoeing-and-kayaking-across-samanalawewa-reservoir',
    'belihuloya-trekking-to-bambarakanda-falls-sri-lankas-tallest-waterfall-and-surathal',
    'belihuloya-cross-country-mountain-biking-across-tea-gardens-and-mountain-passes'
  )
);
insert into public.experience_destinations(experience_id,destination_id)
select e.id,d.id from public.experiences e join public.destinations d on d.slug='belihuloya'
where e.slug in (
  'belihuloya-canoeing-and-kayaking-across-samanalawewa-reservoir',
  'belihuloya-trekking-to-bambarakanda-falls-sri-lankas-tallest-waterfall-and-surathal',
  'belihuloya-cross-country-mountain-biking-across-tea-gardens-and-mountain-passes'
) on conflict do nothing;

delete from public.experience_themes where experience_id in (
  select id from public.experiences where slug in (
    'belihuloya-canoeing-and-kayaking-across-samanalawewa-reservoir',
    'belihuloya-trekking-to-bambarakanda-falls-sri-lankas-tallest-waterfall-and-surathal',
    'belihuloya-cross-country-mountain-biking-across-tea-gardens-and-mountain-passes'
  )
);
insert into public.experience_themes(experience_id,theme_id)
select e.id,t.id from (values
  ('belihuloya-canoeing-and-kayaking-across-samanalawewa-reservoir','adventure'),
  ('belihuloya-canoeing-and-kayaking-across-samanalawewa-reservoir','nature'),
  ('belihuloya-trekking-to-bambarakanda-falls-sri-lankas-tallest-waterfall-and-surathal','adventure'),
  ('belihuloya-trekking-to-bambarakanda-falls-sri-lankas-tallest-waterfall-and-surathal','nature'),
  ('belihuloya-cross-country-mountain-biking-across-tea-gardens-and-mountain-passes','adventure'),
  ('belihuloya-cross-country-mountain-biking-across-tea-gardens-and-mountain-passes','nature')
) as mapping(experience_slug,theme_slug)
join public.experiences e on e.slug=mapping.experience_slug
join public.themes t on t.slug=mapping.theme_slug
on conflict do nothing;

insert into public.theme_destinations(theme_id,destination_id)
select t.id,d.id from (values ('adventure'),('nature')) as wanted(theme_slug)
join public.themes t on t.slug=wanted.theme_slug
join public.destinations d on d.slug='belihuloya'
on conflict do nothing;

do $$
declare content_count integer; destination_count integer; theme_count integer;
begin
  select count(*) into content_count from public.experiences where slug in (
    'belihuloya-canoeing-and-kayaking-across-samanalawewa-reservoir',
    'belihuloya-trekking-to-bambarakanda-falls-sri-lankas-tallest-waterfall-and-surathal',
    'belihuloya-cross-country-mountain-biking-across-tea-gardens-and-mountain-passes'
  ) and status='published' and active and length(coalesce(full_description,''))>500
    and duration is not null and jsonb_array_length(highlights)>=5 and jsonb_array_length(unique_points)>=4;
  select count(distinct ed.experience_id) into destination_count from public.experience_destinations ed
  join public.experiences e on e.id=ed.experience_id join public.destinations d on d.id=ed.destination_id
  where e.slug like 'belihuloya-%' and d.slug='belihuloya';
  select count(distinct et.experience_id) into theme_count from public.experience_themes et
  join public.experiences e on e.id=et.experience_id where e.slug in (
    'belihuloya-canoeing-and-kayaking-across-samanalawewa-reservoir',
    'belihuloya-trekking-to-bambarakanda-falls-sri-lankas-tallest-waterfall-and-surathal',
    'belihuloya-cross-country-mountain-biking-across-tea-gardens-and-mountain-passes'
  );
  if content_count<>3 or destination_count<>4 or theme_count<>3 then
    raise exception 'Belihuloya editorial validation failed: content %, destination %, theme %',content_count,destination_count,theme_count;
  end if;
  raise notice 'Belihuloya result: 3 bespoke records enriched; 4 destination experiences and all theme mappings validated; image fields preserved.';
end $$;

commit;
