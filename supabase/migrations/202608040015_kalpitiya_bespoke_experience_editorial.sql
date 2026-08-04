begin;

create temporary table kalpitiya_editorial as
select * from jsonb_to_recordset($content$[
  {
    "slug":"kalpitiya-kitesurfing-and-windsurfing-across-kalpitiya-lagoon",
    "name":"Private Kitesurfing on Kalpitiya Lagoon",
    "category":"Water Sports",
    "short":"Harness Kalpitiya’s celebrated wind with a qualified instructor on the lagoon, from first controlled body-drags to private progression sessions for experienced riders.",
    "story":"Kalpitiya is Sri Lanka’s anchor kitesurfing destination because the peninsula places a broad lagoon beside the open Indian Ocean and receives strong seasonal wind. The lagoon can offer relatively flat water for learning, while experienced riders may use different launches or downwind routes only when a qualified local operator considers the conditions, equipment and ability appropriate. Windsurfing is not automatically bundled because tuition, equipment and suitable operating areas differ.\n\nEvery session begins with an honest assessment. Beginners work through kite control, safety release, body-dragging and board starts rather than being promised independent riding in a single lesson. Returning riders can focus on transitions or controlled progression. Roam Ceylon names the school, instructor level, lesson format, radio support and rescue arrangements in the proposal. Wind remains natural and variable, so timing can move and an unsuitable day may require rescheduling rather than forcing a session.",
    "duration":"Introductory sessions usually 2–3 hours; multi-day progression is recommended for beginners",
    "difficulty":"Active; swimming confidence, mobility and adherence to instructor safety commands are required",
    "season":"Two operating periods are commonly used around the peninsula; exact wind window and launch are confirmed by the selected school",
    "highlights":["Flat-water learning conditions when the lagoon and wind align","Private or small-group coaching matched to actual riding level","A progressive safety-first introduction rather than a rushed board-start promise","Advanced sessions or downwind routes only after operator assessment","Kalpitiya’s wind-shaped lagoon landscape experienced from the water"],
    "unique":["Kalpitiya is recognised nationally as Sri Lanka’s principal kitesurfing hub","The lagoon and ocean provide different conditions within one peninsula","Lesson goals are based on competence rather than marketing claims","Named-school, equipment and rescue details make the product operationally transparent"],
    "included":["Qualified instructor and confirmed lesson format","Kite, board, harness, helmet and flotation equipment appropriate to the session","Safety briefing and rescue provision stated by the operator","Roam Ceylon school, timing and transfer coordination"],
    "know":["Wind strength and direction can delay, relocate or cancel a session.","Final minimum age, swimming ability, weight range and medical requirements come from the selected school.","Independent riding areas are not appropriate for unsupervised beginners.","Damage waivers, insurance and equipment liability are confirmed before participation."],
    "nearby":["Kalpitiya Lagoon","Dutch Bay","Bar Reef Marine Sanctuary","Puttalam Lagoon"],
    "tips":["Book more than one lesson day if becoming independently mobile is your goal.","Use secure sun protection and avoid loose jewellery.","Tell the school your exact experience level and recent riding history.","Keep the day flexible enough to follow the safest wind window."],
    "badges":["Signature Experience","Adventure","Water Activity","Advance Booking Recommended","Roam Ceylon Recommended"],
    "themes":["adventure","tropical"]
  },
  {
    "slug":"kalpitiya-scuba-diving-and-snorkeling-at-bar-reef-sri-lankas-largest-coral-reef-sy",
    "name":"Bar Reef Marine Sanctuary Dive or Snorkel",
    "category":"Nature",
    "short":"Explore Kalpitiya’s protected Bar Reef with a licensed marine operator only when visibility, sea state and the selected reef site support a responsible dive or snorkel.",
    "story":"Bar Reef Marine Sanctuary lies west of the Kalpitiya Peninsula and protects Sri Lanka’s largest marine sanctuary, encompassing coral habitat and a significant diversity of reef-associated fish. Its importance does not mean every section is pristine. The reef has suffered major bleaching and other pressures, and current marine-tourism planning recognises the need for restoration, stronger protection and careful visitor management. A premium experience must therefore be honest about condition rather than promising a postcard reef on every departure.\n\nThe operator selects the site after assessing wind, swell, current, visibility and recent reef reports. Certified divers receive a dive matched to qualification and logged experience; snorkellers use a separate, surface-appropriate plan with flotation support where required. The two activities are never treated as interchangeable. No coral, turtle or named fish sighting is guaranteed, and the guide can replace the water session when conditions would compromise safety or the sanctuary.",
    "duration":"Usually a half day including boat transfer, briefing and one or more confirmed water sessions",
    "difficulty":"Snorkelling requires water confidence; scuba requirements depend on certification, depth and selected site",
    "season":"Generally considered during calmer west-coast conditions; every departure remains subject to a same-day marine assessment",
    "highlights":["A protected marine landscape west of the Kalpitiya Peninsula","Reef interpretation that acknowledges both biodiversity and bleaching pressure","Separate plans for certified divers and surface snorkellers","A site selected around real visibility, current and reef condition","Low-impact conduct within a sensitive marine sanctuary"],
    "unique":["Bar Reef is Sri Lanka’s largest marine sanctuary, not simply a generic snorkelling stop","Conservation condition is discussed transparently rather than hidden","The experience remains operator- and site-specific","Cancelling an unsuitable departure is treated as responsible management"],
    "included":["Compliant marine operator and boat arrangement","Activity-specific briefing and safety equipment","Scuba equipment or snorkelling set only as listed in the selected plan","Roam Ceylon weather, operator and transfer coordination"],
    "know":["Reef condition, visibility and wildlife vary substantially and cannot be guaranteed.","Scuba certification cards and recent experience may be required; refresher or medical clearance rules come from the dive centre.","Never touch, stand on, collect or feed anything within the reef environment.","Marine conditions or conservation restrictions can cancel or relocate the trip."],
    "nearby":["Kalpitiya Lagoon","Dutch Bay","Puttalam Lagoon","Wilpattu National Park"],
    "tips":["Use reef-safe sun protection and avoid applying it immediately before entering the water.","Bring certification evidence and disclose the date of your last dive.","Maintain excellent buoyancy and follow the guide’s no-contact route.","Judge the experience by responsible interpretation, not by demanding guaranteed sightings."],
    "badges":["Eco Experience","Water Activity","Wildlife","Advance Booking Recommended"],
    "themes":["nature","wildlife","adventure","tropical"]
  },
  {
    "slug":"kalpitiya-ocean-safaris-for-spinner-dolphin-pods-and-seasonal-whale-watching",
    "name":"Responsible Kalpitiya Dolphin Ocean Safari",
    "category":"Wildlife",
    "short":"Search respectfully for Kalpitiya’s spinner dolphins with a vetted boat team, maintaining distance and allowing the animals—not the vessel—to shape each encounter.",
    "story":"Kalpitiya is best known for spinner dolphins that can gather in large offshore groups during suitable periods, while other cetaceans may occasionally be encountered. This is wildlife observation, not a performance. Group size, location and behaviour change from day to day, and a responsible skipper avoids racing, surrounding or repeatedly cutting across travelling animals. Whale watching is described as a possibility only during relevant conditions; it is never used to guarantee a more dramatic safari.\n\nDeparture time, vessel, passenger capacity, life-saving equipment and operator registration are checked before confirmation. The naturalist or informed crew helps travellers read surfacing, direction and social behaviour from a respectful position. Rough seas, poor visibility or official warnings can cancel the trip even when sightings were reported the previous day. Roam Ceylon prioritises a safe, low-pressure encounter over the number of boats gathered around a pod.",
    "duration":"Approximately 3–4 hours, varying with sea conditions and wildlife location",
    "difficulty":"Easy physically but unsuitable for some travellers prone to seasickness or affected by small-boat motion",
    "season":"Most reliable during the calmer northwest-coast window, commonly around late-year to early-year months; exact operation is confirmed locally",
    "highlights":["The possibility of observing spinner dolphins in their open-ocean habitat","Naturalist-led attention to behaviour rather than pursuit","A small-vessel perspective on Kalpitiya’s marine landscape","Whale encounters treated as an occasional possibility, never a promise","Operator and safety details confirmed before departure"],
    "unique":["Large spinner-dolphin groups are closely associated with Kalpitiya’s marine identity","The animals determine the encounter’s pace and direction","Responsible distance and vessel behaviour are part of the product quality","A no-sighting morning remains an authentic wildlife outcome"],
    "included":["Vetted whale-and-dolphin-watching operator","Life jackets and required vessel safety equipment","Informed crew or naturalist interpretation when specified","Roam Ceylon weather, departure and transfer coordination"],
    "know":["No dolphin, whale, turtle or other wildlife sighting is guaranteed.","The skipper may cancel because of wind, swell, visibility or official marine advice.","Boats must not chase, encircle or separate animals from their group.","Pregnancy, back conditions and severe motion sensitivity should be discussed before booking."],
    "nearby":["Bar Reef Marine Sanctuary","Kalpitiya Lagoon","Dutch Bay","Alankuda coast"],
    "tips":["Choose the earliest suitable departure when seas are often calmer, subject to local advice.","Take motion-sickness precautions in advance after consulting a suitable professional.","Use a camera strap and keep equipment protected from spray.","Let the guide decide when approaching wildlife would be intrusive."],
    "badges":["Signature Experience","Wildlife","Seasonal","Eco Experience","Advance Booking Recommended","Roam Ceylon Recommended"],
    "themes":["wildlife","nature","tropical"]
  },
  {
    "slug":"kalpitiya-deep-sea-sport-fishing",
    "name":"Private Kalpitiya Sport-Fishing Charter",
    "category":"Water Sports",
    "short":"Charter a properly equipped Kalpitiya vessel with an experienced local skipper for a condition-led offshore fishing session governed by current fisheries rules and responsible handling.",
    "story":"Kalpitiya’s fishing culture and access to deeper northwest-coast water can support a private sport-fishing charter, but the experience cannot be sold responsibly as an assured trophy catch. Species, grounds and techniques change with season, water temperature, bait movement and regulation. The selected skipper explains the proposed trolling, jigging or other legal method, while Roam Ceylon records vessel capacity, safety equipment, trip limits and what happens to any catch.\n\nThe charter operates within current Sri Lankan fisheries and maritime requirements. Protected, undersized or restricted species are never targeted or retained, and catch-and-release handling should minimise stress whenever release is appropriate. Weather, official warnings or mechanical concerns override the itinerary. Travellers seeking a purely recreational day can request a shorter inshore format, while serious anglers receive a supplier-specific plan rather than a generic ‘deep-sea’ label.",
    "duration":"Half-day or full-day private charter according to the confirmed vessel and fishing plan",
    "difficulty":"Moderate; prolonged boat motion, sun exposure and active handling of tackle are involved",
    "season":"Species and sea conditions are seasonal; the operator confirms the viable fishing plan close to travel",
    "highlights":["A private charter planned around current grounds and conditions","Local skipper knowledge of the northwest-coast fishery","Tackle and technique matched to the agreed legal target species","Transparent catch, release and retention policy","A flexible format for first-time participants or experienced anglers"],
    "unique":["The charter is specified by vessel and skipper rather than sold as an undefined boat trip","Success is measured through safe, responsible fishing—not guaranteed catch size","Current regulation and species handling are built into the briefing","The plan can be adjusted honestly when offshore conditions are unsuitable"],
    "included":["Named vessel, skipper and crew","Safety equipment and fishing tackle stated in the charter plan","Bait, refreshments and fish handling only when explicitly listed","Roam Ceylon weather, harbour and transfer coordination"],
    "know":["A catch is never guaranteed and advertised species may not be present.","All activity must comply with current fisheries, protected-species and maritime rules.","The skipper has final authority on weather, fishing grounds and safe vessel operation.","Retention, preparation or transport of catch is not included unless explicitly confirmed and lawful."],
    "nearby":["Kalpitiya Lagoon","Bar Reef Marine Sanctuary","Dutch Bay","Puttalam Lagoon"],
    "tips":["Share angling experience and preferred techniques before the vessel is selected.","Bring polarised eyewear, secure sun protection and non-slip footwear.","Discuss motion-sickness precautions before the charter.","Support careful release practices and never pressure the crew to retain an unsuitable fish."],
    "badges":["Adventure","Private Option Available","Advance Booking Recommended","Seasonal"],
    "themes":["adventure","tropical"]
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
from kalpitiya_editorial x
where e.slug=x.slug;

delete from public.experience_destinations ed
using kalpitiya_editorial x
where ed.experience_id=(select id from public.experiences where slug=x.slug);

insert into public.experience_destinations(experience_id,destination_id)
select e.id,d.id
from kalpitiya_editorial x
join public.experiences e on e.slug=x.slug
join public.destinations d on d.slug='kalpitiya'
on conflict do nothing;

delete from public.experience_themes et
using kalpitiya_editorial x
where et.experience_id=(select id from public.experiences where slug=x.slug);

insert into public.experience_themes(experience_id,theme_id)
select e.id,t.id
from kalpitiya_editorial x
cross join lateral jsonb_array_elements_text(x.themes) theme(slug)
join public.experiences e on e.slug=x.slug
join public.themes t on t.slug=theme.slug
on conflict do nothing;

insert into public.theme_destinations(theme_id,destination_id)
select t.id,d.id
from (values ('adventure'),('tropical'),('nature'),('wildlife')) wanted(slug)
join public.themes t on t.slug=wanted.slug
join public.destinations d on d.slug='kalpitiya'
on conflict do nothing;

do $$
declare
  content_count integer;
  destination_count integer;
  theme_count integer;
begin
  select count(*) into content_count
  from public.experiences e
  join kalpitiya_editorial x on x.slug=e.slug
  where e.status='published'
    and e.active
    and length(e.full_description)>700
    and e.duration is not null
    and e.difficulty is not null;

  select count(distinct ed.experience_id) into destination_count
  from public.experience_destinations ed
  join public.experiences e on e.id=ed.experience_id
  join public.destinations d on d.id=ed.destination_id
  join kalpitiya_editorial x on x.slug=e.slug
  where d.slug='kalpitiya';

  select count(distinct et.experience_id) into theme_count
  from public.experience_themes et
  join public.experiences e on e.id=et.experience_id
  join kalpitiya_editorial x on x.slug=e.slug;

  if content_count<>4 or destination_count<>4 or theme_count<>4 then
    raise exception 'Kalpitiya validation failed: content %, destination %, themes %',content_count,destination_count,theme_count;
  end if;

  raise notice 'Kalpitiya result: 4 distinct bespoke marine experiences published and mapped; imagery and pricing preserved.';
end $$;

commit;
