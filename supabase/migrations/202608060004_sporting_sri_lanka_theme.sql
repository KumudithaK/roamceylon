begin;

-- Sports-tourism references reviewed 2026-08-06:
-- https://srilanka.travel/adventure_and_sports
-- https://www.sltda.gov.lk/en/register-with-us
-- https://srilankacricket.lk/
-- The theme reuses canonical experiences through experience_themes. No activity
-- record is duplicated merely to appear under Sporting Sri Lanka.

insert into public.themes(
  name,slug,short_description,hero_image_url,image_alt,icon,display_order,
  status,active,needs_review,image_status,needs_image_review,image_review_notes
)
values(
  'Sporting Sri Lanka',
  'sporting',
  'Cricket occasions, golf, surf, diving, paddling and active island journeys for travellers who come to watch or participate.',
  'https://images.pexels.com/photos/34714750/pexels-photo-34714750.jpeg?auto=compress&cs=tinysrgb&w=1400',
  'Surfer riding an ocean wave, representing active sporting journeys in Sri Lanka',
  'i-trophy',
  8,
  'published',
  true,
  true,
  'needs_review',
  true,
  'Temporary licensed surf image reused from the existing catalogue. Replace with a bespoke Sporting Sri Lanka hero representing both spectator and participation travel before launch.'
)
on conflict (slug) do update set
  name=excluded.name,
  short_description=excluded.short_description,
  icon=excluded.icon,
  display_order=excluded.display_order,
  status='published',
  active=true,
  updated_at=now();

-- One canonical event-led cricket product covers official fixtures around the
-- island. Individual matches become availability/pricing plans, not new cards.
insert into public.experiences(
  name,slug,category,short_description,full_description,duration,difficulty,best_season,
  highlights,unique_points,included,things_to_know,nearby_attractions,traveller_tips,
  badges,family_friendly,suitable_for_children,private_option,priority,featured,
  status,active,seo_title,seo_description,needs_review,image_status,
  needs_image_review,image_review_notes
)
values(
  'Sri Lanka International Cricket Matchday',
  'sri-lanka-international-cricket-matchday',
  'Sports',
  'Build a Sri Lankan cricket occasion around a verified official fixture, legitimate ticket category, safe transfers and the atmosphere of the host city.',
  $story$Cricket can be the reason for travelling to Sri Lanka rather than a spare-time addition. International Tests, One Day Internationals and T20 matches may be staged in Colombo, Galle, Kandy or Dambulla, each producing a very different day: the longer rhythm of a Test, an evening limited-overs fixture, a coastal ground or a hill-country crowd. The experience exists as one canonical event product because fixtures, venues and ticket categories change by series.

Roam Ceylon publishes availability only after the fixture is officially confirmed and tickets can be obtained through an authorised channel. The proposal names the match, format, venue, date, ticket category, seating conditions, transfer plan and every included hospitality element. No speculative fixture, resale ticket or guaranteed player access is offered. Weather, security, schedule changes and competition rules remain outside Roam Ceylon’s control, while transport and traveller communication are actively managed.$story$,
  'Fixture-dependent: approximately 4 hours for many T20 matches, most of a day for an ODI, or one or more selected days of a Test match',
  'Easy seated spectator experience, with heat, crowds, stairs and venue accessibility varying by ground',
  'Only on officially confirmed Sri Lanka cricket fixtures; dates, formats and host venues vary each season',
  '["Admission to a verified official Sri Lanka cricket fixture","A named ticket category and seating area","Pre-match transfer and entry coordination","Local context on the teams, format and ground","Optional hospitality only when officially available"]'::jsonb,
  '["The experience is driven by a real official fixture rather than a permanent attraction","One record supports Tests, ODIs and T20s through dated availability plans","Ticket legitimacy and exact seating are treated as essential product data","The host city becomes part of the sporting journey"]'::jsonb,
  '["Authorised match ticket only when explicitly confirmed","Private return transfer when listed in the proposal","Roam Ceylon fixture, ticket and entry coordination","Hospitality, food and beverages only when itemised"]'::jsonb,
  '["Fixtures, start times and venues can change after announcement.","Tickets are never sourced through an unverified resale channel.","Weather interruptions and match results do not create automatic refunds beyond official organiser policy.","Security rules, prohibited items and re-entry conditions vary by venue."]'::jsonb,
  '["Colombo city experiences","Galle Fort","Kandy","Dambulla Cultural Triangle"]'::jsonb,
  '["Book only after the official fixture and ticket channel are confirmed.","Carry identification matching the ticket requirements.","Use sun protection for daytime seating and a light rain layer where permitted.","Keep the day free from tight onward travel because play and traffic can run late."]'::jsonb,
  '["Sporting Event","Family Friendly","Seasonal","Advance Booking Recommended","Roam Ceylon Recommended"]'::jsonb,
  true,
  true,
  false,
  'must-do',
  true,
  'in_review',
  false,
  'Sri Lanka International Cricket Matchday | Roam Ceylon',
  'Attend a verified Sri Lanka cricket fixture with legitimate tickets, clear seating, safe transfers and host-city planning.',
  true,
  'missing',
  true,
  'Upload one verified cricket hero and exactly five licensed matchday images. Add an authorised ticket supplier and publish dated pricing only after an official fixture is confirmed.'
)
on conflict (slug) do update set
  name=excluded.name,
  category=excluded.category,
  short_description=excluded.short_description,
  full_description=excluded.full_description,
  duration=excluded.duration,
  difficulty=excluded.difficulty,
  best_season=excluded.best_season,
  highlights=excluded.highlights,
  unique_points=excluded.unique_points,
  included=excluded.included,
  things_to_know=excluded.things_to_know,
  nearby_attractions=excluded.nearby_attractions,
  traveller_tips=excluded.traveller_tips,
  badges=excluded.badges,
  seo_title=excluded.seo_title,
  seo_description=excluded.seo_description,
  updated_at=now();

-- Complete the previously agreed locality consolidation. Every experience keeps
-- its original locality relationship and also gains the public parent mapping.
insert into public.experience_destinations(experience_id,destination_id)
select ed.experience_id,parent.id
from public.experience_destinations ed
join public.destinations child on child.id=ed.destination_id
join public.destinations parent on
  (child.slug='nilaveli' and parent.slug='trinco')
  or
  (child.slug='balapitiya' and parent.slug='ahungalla')
on conflict do nothing;

-- Carry every existing child theme relationship to its public parent before the
-- child destination cards are removed from discovery.
insert into public.theme_destinations(theme_id,destination_id)
select td.theme_id,parent.id
from public.theme_destinations td
join public.destinations child on child.id=td.destination_id
join public.destinations parent on
  (child.slug='nilaveli' and parent.slug='trinco')
  or
  (child.slug='balapitiya' and parent.slug='ahungalla')
on conflict do nothing;

delete from public.theme_destinations td
using public.destinations child
where td.destination_id=child.id and child.slug in ('nilaveli','balapitiya');

update public.destinations set status='archived',active=false,updated_at=now()
where slug in ('nilaveli','balapitiya');

-- Destination discovery is deliberately selective. A destination appears only
-- when sport is a credible reason to include it in a journey.
insert into public.theme_destinations(theme_id,destination_id)
select t.id,d.id
from public.themes t
join public.destinations d on d.slug in (
  'colombo','galle','kandy','dambulla',
  'arugambay','weligama','hikkaduwa','kalpitiya','kitulgala','belihuloya',
  'pasikudah','trinco','bentota','nuwaraeliya','ella','ahungalla'
)
where t.slug='sporting'
on conflict do nothing;

-- The cricket record belongs to each possible host destination. It remains
-- unpublished until a real official fixture is attached.
insert into public.experience_destinations(experience_id,destination_id)
select e.id,d.id
from public.experiences e
join public.destinations d on d.slug in ('colombo','galle','kandy','dambulla')
where e.slug='sri-lanka-international-cricket-matchday'
on conflict do nothing;

create temporary table sporting_experience_mapping(slug text primary key) on commit drop;
insert into sporting_experience_mapping(slug) values
  ('sri-lanka-international-cricket-matchday'),
  ('colombo-royal-golf-private-round'),
  ('kitulgala-white-water-rafting-on-the-kelani-river-grade-2-3-rapids'),
  ('kitulgala-sandun-ella-waterfall-abseiling-and-rappelling'),
  ('kitulgala-canyoning-stream-tracking-and-confidence-cliff-jumping'),
  ('belihuloya-canoeing-and-kayaking-across-samanalawewa-reservoir'),
  ('belihuloya-trekking-to-bambarakanda-falls-sri-lankas-tallest-waterfall-and-surathal'),
  ('belihuloya-cross-country-mountain-biking-across-tea-gardens-and-mountain-passes'),
  ('arugambay-world-class-point-break-surfing-main-point-elephant-rock-peanut-farm-whi'),
  ('kalpitiya-kitesurfing-and-windsurfing-across-kalpitiya-lagoon'),
  ('kalpitiya-scuba-diving-and-snorkeling-at-bar-reef-sri-lankas-largest-coral-reef-sy'),
  ('kalpitiya-deep-sea-sport-fishing'),
  ('kalpitiya-private-lagoon-kayak-mangrove-journey'),
  ('hikkaduwa-reef-break-surfing-for-beginners-to-advanced-surfers'),
  ('hikkaduwa-shipwreck-scuba-diving-and-underwater-photography'),
  ('hikkaduwa-snorkeling-with-wild-sea-turtles-at-hikkaduwa-coral-sanctuary'),
  ('galle-swimming-and-stand-up-paddleboarding-at-unawatuna-bay'),
  ('galle-exploring-hidden-coves-and-snorkeling-at-jungle-beach'),
  ('galle-sri-lanka-navy-underwater-museum-certified-dive'),
  ('pasikudah-windsurfing-sea-kayaking-and-jet-skiing-across-tranquil-seas'),
  ('nilaveli-boat-trips-to-pigeon-island-national-park-for-world-class-snorkeling'),
  ('nilaveli-snorkeling-among-blacktip-reef-sharks-sea-turtles-and-colorful-corals'),
  ('bentota-premier-water-sports-hub-parasailing-wakeboarding-banana-boats-jet-skis'),
  ('nuwaraeliya-hiking-in-horton-plains-national-park-to-worlds-end-precipice-and-bakers'),
  ('ella-trekking-little-adams-peak-and-climbing-ella-rock-for-panoramic-views'),
  ('weligama-combined-surfing-fitness-and-yoga-wellness-camps');

insert into public.experience_themes(experience_id,theme_id)
select e.id,t.id
from sporting_experience_mapping m
join public.experiences e on e.slug=m.slug
join public.themes t on t.slug='sporting'
on conflict do nothing;

do $$
declare
  theme_count integer;
  destination_count integer;
  experience_count integer;
  cricket_destination_count integer;
  locality_orphans integer;
  archived_localities integer;
begin
  select count(*) into theme_count from public.themes
  where slug='sporting' and status='published' and active;

  select count(*) into destination_count
  from public.theme_destinations td
  join public.themes t on t.id=td.theme_id
  where t.slug='sporting';

  select count(*) into experience_count
  from public.experience_themes et
  join public.themes t on t.id=et.theme_id
  where t.slug='sporting';

  select count(*) into cricket_destination_count
  from public.experience_destinations ed
  join public.experiences e on e.id=ed.experience_id
  where e.slug='sri-lanka-international-cricket-matchday';

  select count(*) into locality_orphans
  from public.experience_destinations child_link
  join public.destinations child on child.id=child_link.destination_id
  join public.destinations parent on
    (child.slug='nilaveli' and parent.slug='trinco')
    or
    (child.slug='balapitiya' and parent.slug='ahungalla')
  where not exists (
    select 1 from public.experience_destinations parent_link
    where parent_link.experience_id=child_link.experience_id
      and parent_link.destination_id=parent.id
  );

  select count(*) into archived_localities
  from public.destinations
  where slug in ('nilaveli','balapitiya') and status='archived' and not active;

  if theme_count<>1 or destination_count<>16 or experience_count<>26
     or cricket_destination_count<>4 or locality_orphans<>0 or archived_localities<>2 then
    raise exception 'Sporting theme validation failed: theme %, destinations %, experiences %, cricket hosts %, locality orphans %, archived localities %',
      theme_count,destination_count,experience_count,cricket_destination_count,
      locality_orphans,archived_localities;
  end if;

  raise notice 'Sporting Sri Lanka published with 16 curated destinations and 26 canonical experiences; cricket remains in review until a verified fixture, tickets, imagery and pricing are attached.';
end $$;

commit;
