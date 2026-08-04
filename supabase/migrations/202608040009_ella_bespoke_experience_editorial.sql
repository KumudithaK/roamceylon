begin;

create temporary table ella_editorial as
select * from jsonb_to_recordset($content$[
  {
    "slug":"ella-photography-at-the-world-famous-nine-arches-railway-bridge",
    "name":"Nine Arches Bridge Dawn Railway Walk",
    "category":"Photography",
    "short":"Approach Ella's Nine Arches Bridge in the softer morning light, with time to understand the railway landscape and photograph it without turning an active line into a stage.",
    "story":"Nine Arches Bridge is most memorable when it is approached as part of Ella's living railway landscape rather than as a single photograph. The walk passes tea, village paths and steep green contours before the masonry viaduct comes into view between Ella and Demodara. Early light usually gives the scene more atmosphere and a gentler pace, although mist, rain and rail operations shape every visit.\n\nThis is an active railway environment. Trains do not appear on demand, published timings can change and no photograph is worth standing in an unsafe position. A locally informed guide selects suitable viewpoints, keeps the group clear of the line and can extend the walk towards Demodara when the route, weather and traveller mobility allow.",
    "duration":"Approximately 2–3 hours; a Demodara extension requires additional time",
    "difficulty":"Easy to moderate, with steps, slopes and potentially slippery village paths",
    "season":"Year-round; early morning is usually quieter, while rain and mist can change access and visibility",
    "highlights":["The nine-arch masonry viaduct framed by Ella's tea-country landscape","Soft dawn light and changing hill-country mist","A village-path approach rather than a hurried roadside stop","Context on the railway between Ella and Demodara","Patient photography from safe, guide-approved viewpoints"],
    "unique":["The bridge is understood as working railway infrastructure within a lived landscape","Light, mist and rail movement make every visit visually different","The experience rewards observation even when no train passes","A longer arrangement can connect the bridge with Demodara's railway loop story"],
    "included":["Locally informed walking guide when specified","Safe route and viewpoint planning","Roam Ceylon timing and transfer coordination","Demodara extension only when explicitly included in the proposal"],
    "know":["The railway remains operational and trains can arrive with limited warning.","Never stand, sit or pose on the rails or inside the clearance of the line.","Train times, visibility and a train appearing during the visit cannot be guaranteed.","Paths and steps can be slippery after rain, and some approaches are not step-free."],
    "nearby":["Little Adam's Peak","Demodara Railway Loop","Ella town","Ravana Falls"],
    "tips":["Begin early for softer light and fewer visitors.","Wear shoes with reliable grip rather than sandals.","Keep lenses and valuables compact for the walk.","Photograph from established viewpoints and follow railway-safety instructions immediately."],
    "badges":["Signature Experience","Photography Spot","Easy Walk","Roam Ceylon Recommended"],
    "themes":["nature","heritage"]
  },
  {
    "slug":"ella-trekking-little-adams-peak-and-climbing-ella-rock-for-panoramic-views",
    "name":"Ella Rock & Little Adam's Peak Guided Hiking Day",
    "category":"Adventure",
    "short":"Experience Ella's two contrasting viewpoints in one carefully paced hiking day: the accessible ridgeline of Little Adam's Peak and the longer, more demanding ascent of Ella Rock.",
    "story":"Little Adam's Peak and Ella Rock are often spoken of together, but they are not the same walk. Little Adam's Peak offers a shorter approach through the Passara-side landscape and a stepped final rise to open views. Ella Rock is a substantially longer outing, with route-finding through railway, village, plantation and forest terrain before the final ascent.\n\nCombining both creates a full hiking day and is suitable only when fitness, daylight and trail conditions support it. The guide may reverse the order, shorten the programme or recommend choosing one summit. Roam Ceylon treats that judgement as part of the experience: clear views are welcome, but safe pacing and an honest understanding of each trail matter more than completing a checklist.",
    "duration":"Approximately 6–8 hours for both viewpoints; either hike can be arranged separately",
    "difficulty":"Moderate to challenging; Ella Rock requires sustained walking and confident footing",
    "season":"Possible year-round when trails are safe; heavy rain, mist and reduced daylight may require a shorter route",
    "highlights":["Two distinct perspectives across the Ella Gap and Uva highlands","A gentler ridgeline walk followed by a more substantial mountain route","Tea, village, railway and forest landscapes within one day","A locally guided route through sections where navigation is not always obvious","A flexible plan that can become a single-summit experience when conditions demand"],
    "unique":["The day makes the contrast between Ella's best-known viewpoints clear","It is a genuine full-day hike rather than two short photo stops","Local route knowledge is especially valuable on the Ella Rock approach","The experience can be tailored without pretending both summits suit every traveller"],
    "included":["Local hiking guide","Route, weather and daylight assessment","Roam Ceylon transfer and timing coordination","Drinking water, packed food or private transfers only when explicitly listed"],
    "know":["Completing both viewpoints requires appropriate fitness and an early start.","Ella Rock includes uneven, steep and sometimes confusing trail sections.","Rain can make clay, rock, roots and railway-side approaches slippery.","Views are weather-dependent, and the guide may shorten or cancel a summit attempt."],
    "nearby":["Nine Arches Bridge","Demodara Railway Loop","Ravana Falls","Ella town"],
    "tips":["Tell the journey designer your recent hiking experience rather than relying on a generic fitness label.","Wear broken-in walking shoes and carry a light rain layer.","Start with water and sufficient trail food instead of depending on vendors.","Choose one summit if a slower, more immersive day would suit you better."],
    "badges":["Adventure","Photography Spot","Sunrise Experience","Advance Booking Recommended","Roam Ceylon Recommended"],
    "themes":["adventure","nature"]
  },
  {
    "slug":"ella-chasing-waterfalls-at-diyaluma-falls-ravana-falls-and-bambaragala",
    "name":"Upper Diyaluma Falls Guided Walk & Ravana Falls Stop",
    "category":"Nature",
    "short":"Travel beyond Ella for a guided approach to Upper Diyaluma's dramatic escarpment, with Ravana Falls included as a separate roadside landscape stop when conditions allow.",
    "story":"Diyaluma is a destination in its own right, not one of several waterfalls to be rushed through. The journey towards Koslanda reveals a drier, more open side of Uva before a local approach leads towards the upper cascades and the edge of the 220-metre fall. Water level, rock condition and the route chosen by the guide determine how close the group can safely go.\n\nRavana Falls, historically also referred to as Bambaragala Falls in some sources, is treated as one stop rather than duplicated in the itinerary. It lies beside the Ella–Wellawaya road and offers a very different experience from Upper Diyaluma. Swimming is never promised at either location: currents, sudden runoff, wet rock and unprotected drops require conservative decisions, particularly after rain.",
    "duration":"Approximately 5–7 hours including road transfers and the guided Upper Diyaluma walk",
    "difficulty":"Moderate, with uneven approaches, exposed rock and steep unprotected terrain",
    "season":"Only when rainfall, water level, visibility and trail conditions allow a safe approach",
    "highlights":["The scale of Diyaluma's 220-metre escarpment and upper cascades","A locally guided walk through the Koslanda-side landscape","Changing views across dry Uva valleys and distant hills","Ravana Falls encountered as a distinct roadside cascade","Time for the landscape without advertising unsafe infinity-pool poses"],
    "unique":["The day connects two geologically and visually different waterfall settings","Ravana and Bambaragala are not sold as duplicate attractions","Access is shaped around current water and trail conditions rather than a fixed social-media shot","The journey beyond Ella reveals the transition towards lower, drier Uva country"],
    "included":["Local guide for the Upper Diyaluma approach","Current access and weather assessment","Roam Ceylon vehicle and timing coordination","Entrance, food or specialist equipment only when explicitly listed"],
    "know":["There are exposed drops and sections without protective barriers at Upper Diyaluma.","Swimming and access to particular pools are never guaranteed.","Flash rain upstream can change water conditions quickly even when the immediate sky appears clear.","Ravana Falls is viewed from a busy road environment and may be omitted when stopping is unsafe."],
    "nearby":["Koslanda","Buduruwagala","Ella Rock","Ravana Cave"],
    "tips":["Wear closed shoes with strong wet-rock grip.","Follow the guide's turnaround point without pressure to recreate online photographs.","Carry water, sun protection and a dry layer for the return.","Keep the day flexible; cancellation is the correct decision when water conditions are unsafe."],
    "badges":["Adventure","Eco Experience","Photography Spot","Seasonal","Advance Booking Recommended"],
    "themes":["adventure","nature"]
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
from ella_editorial x
where e.slug=x.slug;

delete from public.experience_destinations ed
using ella_editorial x
where ed.experience_id=(select id from public.experiences where slug=x.slug);

insert into public.experience_destinations(experience_id,destination_id)
select e.id,d.id
from ella_editorial x
join public.experiences e on e.slug=x.slug
join public.destinations d on d.slug='ella'
on conflict do nothing;

delete from public.experience_themes et
using ella_editorial x
where et.experience_id=(select id from public.experiences where slug=x.slug);

insert into public.experience_themes(experience_id,theme_id)
select e.id,t.id
from ella_editorial x
cross join lateral jsonb_array_elements_text(x.themes) theme(slug)
join public.experiences e on e.slug=x.slug
join public.themes t on t.slug=theme.slug
on conflict do nothing;

insert into public.theme_destinations(theme_id,destination_id)
select t.id,d.id
from (values ('adventure'),('nature'),('heritage')) wanted(slug)
join public.themes t on t.slug=wanted.slug
join public.destinations d on d.slug='ella'
on conflict do nothing;

do $$
declare
  content_count integer;
  destination_count integer;
  theme_count integer;
begin
  select count(*) into content_count
  from public.experiences e
  join ella_editorial x on x.slug=e.slug
  where e.status='published'
    and e.active
    and length(e.full_description)>500
    and e.duration is not null
    and e.difficulty is not null;

  select count(distinct ed.experience_id) into destination_count
  from public.experience_destinations ed
  join public.experiences e on e.id=ed.experience_id
  join public.destinations d on d.id=ed.destination_id
  join ella_editorial x on x.slug=e.slug
  where d.slug='ella';

  select count(distinct et.experience_id) into theme_count
  from public.experience_themes et
  join public.experiences e on e.id=et.experience_id
  join ella_editorial x on x.slug=e.slug;

  if content_count<>3 or destination_count<>3 or theme_count<>3 then
    raise exception 'Ella validation failed: content %, destination %, themes %',content_count,destination_count,theme_count;
  end if;

  raise notice 'Ella result: 3 bespoke experiences validated; mappings corrected; image and pricing fields preserved.';
end $$;

commit;
