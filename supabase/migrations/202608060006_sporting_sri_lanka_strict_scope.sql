begin;

-- Final strict scope for Sporting Sri Lanka. The theme is intentionally limited
-- to five destinations and never inherits general adventure activities.
delete from public.theme_destinations
where theme_id=(select id from public.themes where slug='sporting');

insert into public.theme_destinations(theme_id,destination_id)
select t.id,d.id
from public.themes t
cross join public.destinations d
where t.slug='sporting'
  and d.slug in ('colombo','kandy','galle','hambantota','nuwaraeliya');

update public.themes set
  short_description='Experience Sri Lanka through its rich sporting culture, iconic venues and world-class sporting experiences.',
  highlights='["International cricket at landmark grounds in Colombo, Kandy, Galle and Hambantota","Private golf days across Colombo, Kandy, Nuwara Eliya and the southern coast","A responsibly arranged Colombo-region sport-fishing charter","A hosted local cricket session shaped around people rather than performance","High-country horse riding arranged with an approved local operator"]'::jsonb,
  badges='["Cricket Culture","Iconic Venues","Golf Journeys","Sport Fishing","Sporting Heritage","Roam Ceylon Recommended"]'::jsonb,
  updated_at=now()
where slug='sporting';

insert into public.experiences(
  name,slug,category,short_description,full_description,hero_image_url,image_alt,
  gallery,gallery_alt_texts,duration,difficulty,best_season,highlights,
  unique_points,included,things_to_know,nearby_attractions,traveller_tips,
  badges,family_friendly,suitable_for_children,private_option,priority,featured,
  status,active,seo_title,seo_description,image_source,image_credit,image_status,
  needs_image_review,image_review_notes
)
values(
  'Private Colombo Sport-Fishing Charter',
  'private-colombo-sport-fishing-charter',
  'Sport Fishing',
  'Set out from the Colombo region with a named skipper and properly equipped private vessel for a condition-led sporting day on Sri Lanka’s western waters.',
  $story$This private charter is shaped around the sea rather than a promise of a trophy catch. The selected skipper considers season, weather, water conditions and legal target species before confirming the fishing plan, whether the day is suited to trolling, jigging or another permitted technique.

Roam Ceylon records the vessel, passenger capacity, safety equipment, tackle, departure point and catch policy in the Journey Proposal. Protected, restricted or undersized species are never targeted or retained, and responsible release is expected whenever appropriate. A catch is never guaranteed; the quality of the experience rests in good seamanship, honest local knowledge and a carefully prepared day on the water.$story$,
  'https://images.pexels.com/photos/35269341/pexels-photo-35269341.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'A sport-fishing charter at sea, representing the private Colombo-region fishing experience',
  '["https://images.pexels.com/photos/35269341/pexels-photo-35269341.jpeg?auto=compress&cs=tinysrgb&w=1600","https://images.pexels.com/photos/29068270/pexels-photo-29068270.jpeg?auto=compress&cs=tinysrgb&w=1600","https://images.pexels.com/photos/2647722/pexels-photo-2647722.jpeg?auto=compress&cs=tinysrgb&w=1600","https://images.pexels.com/photos/3217969/pexels-photo-3217969.jpeg?auto=compress&cs=tinysrgb&w=1600","https://images.pexels.com/photos/13791362/pexels-photo-13791362.jpeg?auto=compress&cs=tinysrgb&w=1600"]'::jsonb,
  '["Private sport-fishing charter on Sri Lankan waters","Charter vessel and open-water departure","Life on Sri Lanka’s western coastal waters","A quiet moment aboard the private vessel","Coastal conditions surrounding the sporting charter"]'::jsonb,
  'Half-day or full-day private charter, according to the confirmed vessel and fishing plan',
  'Moderate; prolonged boat motion, sun exposure and active handling of tackle are involved',
  'Seasonal and condition dependent; the skipper confirms the viable plan close to travel',
  '["A private charter planned around current sea conditions","Named vessel, skipper and agreed fishing plan","Tackle matched to the permitted target species","Transparent catch, release and retention policy","A flexible format for first-time or experienced anglers"]'::jsonb,
  '["The experience is specified by vessel and skipper rather than sold as an undefined boat trip","Responsible fishing and safe vessel operation matter more than catch size","The plan changes honestly when offshore conditions are unsuitable"]'::jsonb,
  '["Named vessel, skipper and crew","Safety equipment and tackle stated in the proposal","Bait and refreshments only when explicitly listed","Roam Ceylon departure and transfer coordination"]'::jsonb,
  '["A catch is never guaranteed.","All fishing must follow current fisheries, protected-species and maritime rules.","The skipper has final authority over weather, grounds and vessel safety.","Retention or preparation of catch is included only when lawful and explicitly confirmed."]'::jsonb,
  '["Colombo","Mount Lavinia","Galle Face Green"]'::jsonb,
  '["Share angling experience and preferred techniques before vessel selection.","Wear non-slip footwear and secure sun protection.","Discuss motion-sickness precautions before departure.","Support careful release practices."]'::jsonb,
  '["Sport Fishing","Private Option Available","Seasonal","Advance Booking Recommended"]'::jsonb,
  false,false,true,'popular',true,'published',true,
  'Private Colombo Sport-Fishing Charter | Roam Ceylon',
  'A responsible private sport-fishing charter from the Colombo region with a named skipper, clear vessel details and condition-led planning.',
  'Pexels / existing Roam Ceylon catalogue','Complete per-image photographer attribution before production launch',
  'needs_review',true,
  'Replace the supporting editorial references with five vessel-specific licensed images after the operating charter partner is contracted.'
)
on conflict(slug) do update set
  name=excluded.name,category=excluded.category,short_description=excluded.short_description,
  full_description=excluded.full_description,hero_image_url=excluded.hero_image_url,
  image_alt=excluded.image_alt,gallery=excluded.gallery,gallery_alt_texts=excluded.gallery_alt_texts,
  duration=excluded.duration,difficulty=excluded.difficulty,best_season=excluded.best_season,
  highlights=excluded.highlights,unique_points=excluded.unique_points,included=excluded.included,
  things_to_know=excluded.things_to_know,nearby_attractions=excluded.nearby_attractions,
  traveller_tips=excluded.traveller_tips,badges=excluded.badges,private_option=true,
  priority=excluded.priority,featured=true,status='published',active=true,
  seo_title=excluded.seo_title,seo_description=excluded.seo_description,
  image_status='needs_review',needs_image_review=true,image_review_notes=excluded.image_review_notes,
  updated_at=now();

delete from public.experience_destinations
where experience_id=(select id from public.experiences where slug='private-colombo-sport-fishing-charter');
insert into public.experience_destinations(experience_id,destination_id)
select e.id,d.id from public.experiences e cross join public.destinations d
where e.slug='private-colombo-sport-fishing-charter' and d.slug='colombo';

delete from public.experience_themes
where experience_id=(select id from public.experiences where slug='private-colombo-sport-fishing-charter');
insert into public.experience_themes(experience_id,theme_id)
select e.id,t.id from public.experiences e cross join public.themes t
where e.slug='private-colombo-sport-fishing-charter' and t.slug='sporting';

-- Remove every non-sporting legacy relationship introduced by the earlier
-- broad migration while preserving each experience's correct original themes.
delete from public.experience_themes et
using public.themes t,public.experiences e
where et.theme_id=t.id and et.experience_id=e.id and t.slug='sporting'
and e.slug not in (
  'sri-lanka-international-cricket-matchday','cricket-with-local-players',
  'colombo-royal-golf-private-round','victoria-golf-country-resort-experience',
  'nuwara-eliya-golf-club-experience','shangri-la-hambantota-golf-experience',
  'horse-riding-in-nuwara-eliya','private-colombo-sport-fishing-charter'
);

do $$
declare destinations_count integer; invalid_count integer;
begin
  select count(*) into destinations_count from public.theme_destinations td join public.themes t on t.id=td.theme_id where t.slug='sporting';
  select count(*) into invalid_count from public.experience_themes et join public.themes t on t.id=et.theme_id join public.experiences e on e.id=et.experience_id where t.slug='sporting' and e.slug not in ('sri-lanka-international-cricket-matchday','cricket-with-local-players','colombo-royal-golf-private-round','victoria-golf-country-resort-experience','nuwara-eliya-golf-club-experience','shangri-la-hambantota-golf-experience','horse-riding-in-nuwara-eliya','private-colombo-sport-fishing-charter');
  if destinations_count<>5 or invalid_count<>0 then raise exception 'Sporting strict-scope validation failed: destinations %, invalid experiences %',destinations_count,invalid_count; end if;
end $$;

commit;
