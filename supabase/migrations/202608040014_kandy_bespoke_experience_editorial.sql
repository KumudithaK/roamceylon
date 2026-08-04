begin;

-- Replace the generic resort placeholder in place so existing journey references and
-- pricing history remain attached to the same experience identity.
update public.experiences
set
  slug='kandy-udawattakele-forest-reserve-guided-nature-walk',
  image_status='needs_review',
  needs_image_review=true,
  image_review_notes=concat_ws(E'\n',nullif(image_review_notes,''),'Replace the former generic eco-resort imagery with verified Udawattakele Forest Reserve photography before final visual approval.'),
  updated_at=now()
where slug='kandy-mountain-eco-resort-holistic-retreats-surrounded-by-rainforest-flora';

create temporary table kandy_editorial as
select * from jsonb_to_recordset($content$[
  {
    "slug":"kandy-visiting-the-temple-of-the-sacred-tooth-relic-sri-dalada-maligawa",
    "name":"Temple of the Sacred Tooth & Royal Palace Precinct",
    "category":"History",
    "short":"Enter Kandy’s living sacred heart with considered interpretation of the Temple of the Tooth, royal precinct and rituals that still shape Sri Lankan Buddhist life.",
    "story":"The Temple of the Sacred Tooth Relic is not simply Kandy’s most recognisable monument. It is an active place of pilgrimage built beside the former royal palace, within the sacred city inscribed by UNESCO in 1988. The relic’s custodianship was historically bound to sovereignty, making the precinct inseparable from the story of the last Sinhala kingdom and from Buddhist devotion that continues every day.\n\nA thoughtful visit moves at the rhythm of the temple rather than treating it as an architectural checklist. Drumming, offerings and the movement of worshippers give meaning to the audience hall, moat, octagon and inner shrine. The relic itself is protected within nested caskets and is not displayed as a museum object. When opening conditions permit, the experience can extend through accessible parts of the former palace precinct and the National Museum; those spaces are confirmed separately because worship, ceremonies and museum operations can alter access without notice.",
    "duration":"Approximately 2–3 hours; allow longer when the National Museum extension is confirmed",
    "difficulty":"Easy to moderate, with barefoot temple surfaces, steps, crowds and prolonged standing",
    "season":"Year-round; ritual periods and Poya days are especially atmospheric but considerably busier",
    "highlights":["A living Buddhist pilgrimage site within the UNESCO Sacred City of Kandy","The historic relationship between the Tooth Relic, kingship and the former royal palace","Kandyan architecture, drumming and daily ritual understood in context","Respectful observation of worship rather than a rushed monument visit","Optional National Museum extension when current opening conditions permit"],
    "unique":["Sacred practice remains the centre of the precinct rather than a performance for visitors","Religious, royal and architectural histories meet within one compact ensemble","The experience explains why the relic matters without claiming it is placed on public display","A private guide can interpret visible spaces while preserving moments of quiet devotion"],
    "included":["Knowledgeable licensed guide when specified","Current temple and museum access confirmation","Temple admission and museum ticket only when explicitly listed","Roam Ceylon timing, dress guidance and transfer coordination"],
    "know":["Dress modestly with shoulders and knees covered; hats and footwear are removed before entering temple interiors.","Photography is restricted in sensitive areas and must never interrupt worship.","The relic is enshrined within protective caskets and should not be described as routinely visible.","Ceremonies, security procedures and museum opening arrangements can change the route."],
    "nearby":["Kandy Lake","Udawattakele Forest Reserve","British Garrison Cemetery","Devale precincts"],
    "tips":["Approach the visit as a place of worship first and a heritage site second.","Carry socks if hot or wet stone is uncomfortable underfoot.","Choose a quieter hour unless observing a puja is central to your interest.","Ask the guide to distinguish the temple’s living tradition from the separate museum collection."],
    "badges":["Signature Experience","Cultural Heritage","UNESCO Related","Advance Booking Recommended","Roam Ceylon Recommended"],
    "themes":["heritage","culture"]
  },
  {
    "slug":"kandy-scenic-walks-around-kandy-lake-and-visiting-the-british-garrison-cemeter",
    "name":"Kandy Lake & Garrison Cemetery Story Walk",
    "category":"History",
    "short":"Trace Kandy’s royal, colonial and everyday city stories between the lake shore and the secluded British Garrison Cemetery behind the sacred precinct.",
    "story":"Kandy Lake creates the calm foreground of the sacred city, yet its apparent serenity conceals a layered urban history. Constructed during the reign of Sri Wickrama Rajasinghe, the last king of Kandy, the lake sits beside the royal and temple precinct and remains part of the city’s daily rhythm. A guided walk reads its island, retaining walls, viewpoints and changing relationship with traffic, worship and public life rather than reducing it to a scenic circuit.\n\nBehind the Temple precinct, the British Garrison Cemetery introduces the upheaval that followed the kingdom’s fall in 1815. Its memorials record colonial officials, soldiers and family members, including people whose lives intersected with the administration of nineteenth-century Ceylon. The interpretation neither celebrates empire nor treats graves as curiosities. Instead, it uses individual inscriptions to discuss mortality, disease, power and the uneven encounter between a conquered kingdom and its new rulers. Cemetery access and caretaker availability are reconfirmed before every visit.",
    "duration":"Approximately 2–2.5 hours at an unhurried walking pace",
    "difficulty":"Easy to moderate, with city pavements, inclines, heat and uneven cemetery ground",
    "season":"Year-round; early morning or later afternoon is usually more comfortable",
    "highlights":["The lake as part of Kandy’s final royal landscape","Quiet viewpoints towards the sacred precinct and surrounding hills","Human stories read from nineteenth-century cemetery memorials","A balanced discussion of the transition from Kandyan kingdom to British rule","Everyday city life beyond Kandy’s headline monuments"],
    "unique":["Royal and colonial histories are considered within the same walk","The cemetery offers intimate evidence rather than a catalogue of famous names","Interpretation avoids romanticising either monarchy or empire","The slower route reveals how a World Heritage city continues to function today"],
    "included":["Private city storyteller or heritage guide when specified","Current cemetery access confirmation","Roam Ceylon route and timing coordination","Donations or paid access only when explicitly listed"],
    "know":["The cemetery is a protected burial place and must be visited quietly and respectfully.","Opening and caretaker arrangements may change at short notice.","Kandy Lake pavements can be busy and traffic noise is part of the contemporary city.","Rain can make cemetery paths and stone surfaces slippery."],
    "nearby":["Temple of the Sacred Tooth","National Museum of Kandy","Udawattakele Forest Reserve","Kandy viewpoint"],
    "tips":["Wear comfortable shoes and carry a compact rain layer.","Do not sit on, touch or lean equipment against memorials.","Ask about the lake’s royal construction as well as its modern ecological pressures.","Pair the walk with the temple precinct at a different pace rather than rushing both."],
    "badges":["Cultural Heritage","Easy Walk","Hidden Gem","Photography Spot"],
    "themes":["heritage","culture"]
  },
  {
    "slug":"kandy-attending-traditional-kandyan-dance-and-fire-walking-performances",
    "name":"Kandyan Dance & Drum Performance",
    "category":"Culture",
    "short":"Experience the athletic movement, ritual vocabulary, costume and live percussion of Sri Lanka’s high-country performance traditions at a confirmed Kandy venue.",
    "story":"Kandyan dance belongs to a far deeper tradition than the short cultural programmes commonly presented to travellers. Its movement vocabulary, percussion and ceremonial costume developed through the high-country’s ritual and courtly worlds. The distinctive ves costume and geta bera drum are not decorative props; they sit within disciplines learned through years of training and are connected to traditions that remain visible in ceremonies and the Esala Perahera.\n\nRoam Ceylon confirms the performing company, venue, running time and seating before proposing the evening. Programmes may bring Kandyan items together with low-country and Sabaragamuwa forms, and the guide or host should identify those differences rather than calling every item ‘Kandyan’. Fire performance or fire-walking is mentioned only when the confirmed programme includes it. This is a staged introduction, not a substitute for witnessing a full ritual in its community and religious context.",
    "duration":"Usually 1–1.5 hours, depending on the confirmed company and programme",
    "difficulty":"Easy for spectators; venues may involve steps, heat, close seating and loud percussion",
    "season":"Year-round subject to the selected company’s performance calendar",
    "highlights":["Live geta bera drumming and the athletic vocabulary of high-country dance","The form, movement and symbolism of the ves costume","Clear distinction between Kandyan, low-country and Sabaragamuwa programme items","An accessible introduction before encountering ceremonial performance elsewhere","Optional fire sequence only when confirmed by the venue"],
    "unique":["The experience names the company rather than selling an interchangeable generic show","Interpretation separates living tradition from a condensed stage presentation","Costume, rhythm and movement are understood as connected disciplines","A private or specialist introduction can be arranged when a suitable practitioner is available"],
    "included":["Reserved performance ticket in the selected category","Confirmed venue and programme information","Brief cultural orientation when specified","Roam Ceylon timing and transfer coordination"],
    "know":["Programmes, companies and artistic quality vary; the venue is stated in the proposal.","Fire-walking is not guaranteed unless explicitly confirmed for that performance.","Flash photography can distract performers and may be prohibited.","Some venues are not fully accessible; mobility requirements must be checked in advance."],
    "nearby":["Kandy Lake","Temple of the Sacred Tooth","Kandy city centre","Peradeniya"],
    "tips":["Arrive early enough to settle without interrupting the opening drumming.","Ask which regional tradition each programme item represents.","Choose seats for a clear full-body view rather than proximity alone.","Treat performers and sacred symbolism with the same respect as at a ceremonial event."],
    "badges":["Cultural Heritage","Family Friendly","Advance Booking Recommended","Roam Ceylon Recommended"],
    "themes":["culture","heritage"]
  },
  {
    "slug":"kandy-visiting-artisan-centers-for-woodcarving-brassware-and-batik-crafts",
    "name":"Private Kandyan Artisan Studio Encounter",
    "category":"Culture",
    "short":"Meet a confirmed Kandyan maker and follow one craft in depth—from material and motif to patient handwork—without turning the encounter into a compulsory shopping stop.",
    "story":"The central highlands sustain craft traditions connected to temples, homes, ritual objects and royal-era design. Woodcarving, brasswork and batik require different materials, tools and expertise, so an authentic encounter should not pretend that one anonymous showroom represents them all. Roam Ceylon builds the visit around a named artisan, studio or credible workshop available during the journey, selecting the discipline that best matches the traveller’s interest.\n\nA brass workshop near Pilimatalawa might reveal moulds, hammering, finishing and the making of oil lamps; a woodcarver can explain grain, chisels and the disciplined repetition of Kandyan motifs; a batik artist can trace wax-resist work through dye stages. The host determines what can safely be demonstrated or attempted. Purchases remain optional, pricing is transparent, and the maker’s knowledge—not a commission-driven retail stop—is the centre of the experience.",
    "duration":"Approximately 1.5–2.5 hours, depending on the confirmed craft and artisan",
    "difficulty":"Easy; hands-on participation depends on the studio, tools and traveller age",
    "season":"Year-round by advance appointment with a confirmed maker or workshop",
    "highlights":["Direct conversation with a named artisan or specialist workshop","One craft explored properly rather than several rushed showroom demonstrations","Materials, tools, motifs and production stages explained in context","Optional supervised participation when the maker considers it safe","A transparent opportunity to support skilled local production"],
    "unique":["The craft and host are identified before confirmation","The encounter values process and inherited knowledge over souvenir volume","Wood, brass and batik are treated as distinct disciplines","Commercial arrangements never require the traveller to purchase"],
    "included":["Confirmed artisan or studio appointment","Host-led demonstration and interpretation","Participation materials only when explicitly offered","Roam Ceylon timing and transport coordination"],
    "know":["Artisan availability and working processes vary, so the exact encounter is supplier-specific.","Tools, heat, dyes and machinery may limit hands-on participation.","Photography and recording require the maker’s permission.","Custom work can take days or weeks and should not be promised for immediate collection."],
    "nearby":["Pilimatalawa","Embekke Devalaya","Lankatilaka Vihara","Gadaladeniya Vihara"],
    "tips":["Choose the craft that genuinely interests you before the visit.","Ask about material sourcing and the time required to finish a piece.","Avoid bargaining in a way that dismisses skilled labour.","Keep receipts and verify export rules for antiques or protected materials."],
    "badges":["Cultural Heritage","Private Option Available","Advance Booking Recommended","Roam Ceylon Recommended"],
    "themes":["culture","heritage"]
  },
  {
    "slug":"kandy-udawattakele-forest-reserve-guided-nature-walk",
    "name":"Udawattakele Forest Reserve Guided Walk",
    "category":"Nature",
    "short":"Step from Kandy’s sacred precinct into Udawattakele’s protected hillside forest for a quiet, guide-led walk shaped around trees, birds and the city’s natural setting.",
    "story":"Udawattakele rises immediately behind Kandy’s former royal and temple precinct, making the transition from dense city to protected forest unusually abrupt. The reserve forms part of the natural setting long associated with the Sacred City of Kandy and is managed as a conservation forest. Its shaded roads and smaller paths offer a restorative counterpoint to the lake and temples below, with mature vegetation, birdlife and occasional glimpses across the hills.\n\nThis is a forest walk, not a wildlife-sighting guarantee. A knowledgeable guide adjusts the route to rain, fallen branches, leeches, fitness and current Forest Department access. Interpretation can consider plant communities, urban biodiversity and the pressures of protecting a forest beside a growing city. The experience avoids invented ‘rainforest retreat’ promises and keeps the focus on a genuine public conservation landscape that can be visited responsibly in a morning or afternoon.",
    "duration":"Approximately 2–3 hours, adjusted to route, weather and forest access",
    "difficulty":"Easy to moderate, with inclines, uneven or muddy surfaces and humid conditions",
    "season":"Year-round; rain can improve the forest atmosphere but increases leeches and slippery ground",
    "highlights":["A protected forest immediately above Kandy’s sacred urban core","Shaded walking among mature vegetation and high-country birdlife","The relationship between forest, royal precinct and modern city","A route adapted to weather and traveller fitness","Calm nature time without leaving Kandy for a full day"],
    "unique":["Few heritage cities hold a conservation forest this close to their sacred centre","The walk connects natural setting with Kandy’s cultural landscape","Interpretation values habitat even when animals remain unseen","The former generic resort product becomes a verifiable place-based experience"],
    "included":["Knowledgeable nature guide when specified","Current Forest Department access confirmation","Entrance ticket only when explicitly listed","Roam Ceylon timing and transfer coordination"],
    "know":["Wildlife and bird sightings are never guaranteed.","Leeches, mosquitoes, rain and slippery paths are possible.","Forest closures or route restrictions may follow severe weather or maintenance.","Do not feed wildlife, collect plants or leave marked paths without authorised guidance."],
    "nearby":["Temple of the Sacred Tooth","Kandy Lake","British Garrison Cemetery","Royal Palace precinct"],
    "tips":["Wear closed shoes with grip and carry socks or leech protection in wet periods.","Bring water, insect repellent and a compact rain layer.","Keep voices low for a better chance of noticing birds.","Choose early morning for cooler walking and stronger bird activity, without expecting specific sightings."],
    "badges":["Eco Experience","Wildlife","Easy Walk","Roam Ceylon Recommended"],
    "themes":["nature","wildlife"]
  },
  {
    "slug":"kandy-herbal-bath-therapies-plant-body-wraps-and-meditation-workshops",
    "name":"Private Sri Lankan Herbal Wellness Ritual",
    "category":"Wellness",
    "short":"Pause for a supplier-specific herbal wellness ritual in Kandy, arranged with a qualified practitioner and defined clearly as relaxation or clinical Ayurveda before booking.",
    "story":"Sri Lankan herbal wellness can range from a restorative spa ritual to a consultation-led Ayurvedic treatment, and those are not interchangeable. Roam Ceylon confirms the establishment, practitioner credentials, treatment room and exact sequence before presenting this experience. A non-clinical programme might combine a herbal bath, plant-based body application, quiet rest and guided breathing; a treatment described as Ayurveda should take place through an appropriately registered provider and follow a practitioner’s assessment.\n\nThe experience is deliberately personal rather than a fixed promise of transformation. Ingredients, heat, pressure and duration are adjusted only within the confirmed provider’s professional scope. Meditation may be included as a gentle guided practice, not as a guaranteed religious teaching or medical intervention. No detoxification, cure, weight-loss or disease claim is made, and travellers with health concerns are asked to seek suitable medical advice before confirming any treatment.",
    "duration":"Approximately 1.5–3 hours, depending on consultation and the confirmed ritual",
    "difficulty":"Gentle, but suitability depends on health, mobility, allergies and treatment conditions",
    "season":"Year-round by advance appointment with a vetted wellness provider",
    "highlights":["A private ritual defined around the actual provider and treatment sequence","Herbal bathing or plant-based body care only when genuinely included","Time for quiet rest or guided breathing away from Kandy’s busy centre","Clear distinction between spa relaxation and clinical Ayurveda","Provider credentials and contraindications checked before confirmation"],
    "unique":["The experience avoids vague wellness promises and invented medical benefits","Treatments are supplier-specific rather than copied from a generic menu","A practitioner-led programme can be adapted responsibly after consultation","The pace complements Kandy’s cultural experiences without presenting wellness as spectacle"],
    "included":["Confirmed consultation or wellness ritual as described in the proposal","Treatment materials and private room when specified","Qualified practitioner or therapist appropriate to the service","Roam Ceylon appointment and transfer coordination"],
    "know":["Declare pregnancy, allergies, recent surgery, medication and relevant health conditions before treatment.","Ayurvedic treatment should be supplied through an appropriately registered establishment and practitioner.","Ingredients and techniques can vary; request the exact sequence before confirming.","This travel experience does not replace diagnosis or care from your medical professional."],
    "nearby":["Kandy Lake","Udawattakele Forest Reserve","Peradeniya","Hanthana hills"],
    "tips":["Avoid a heavy meal or alcohol immediately before the appointment.","Ask whether the programme is a spa ritual or consultation-led Ayurvedic treatment.","Allow quiet time after the session rather than scheduling a rushed departure.","Stop the treatment and speak to the practitioner if anything feels uncomfortable."],
    "badges":["Wellness","Private Option Available","Advance Booking Recommended","Luxury Upgrade Available"],
    "themes":["wellness"]
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
from kandy_editorial x
where e.slug=x.slug;

-- This record overlaps the complete Temple and Royal Palace precinct experience.
-- It is archived, never deleted, so historical references remain intact.
update public.experiences
set
  status='archived',
  active=false,
  image_review_notes=concat_ws(E'\n',nullif(image_review_notes,''),'Archived as an overlapping product: Royal Palace and National Museum context is now an optional extension within the complete Temple of the Sacred Tooth & Royal Palace Precinct experience.'),
  updated_at=now()
where slug='kandy-touring-the-kandy-royal-palace-complex-and-national-museum';

delete from public.experience_destinations ed
using kandy_editorial x
where ed.experience_id=(select id from public.experiences where slug=x.slug);

insert into public.experience_destinations(experience_id,destination_id)
select e.id,d.id
from kandy_editorial x
join public.experiences e on e.slug=x.slug
join public.destinations d on d.slug='kandy'
on conflict do nothing;

delete from public.experience_themes et
using kandy_editorial x
where et.experience_id=(select id from public.experiences where slug=x.slug);

insert into public.experience_themes(experience_id,theme_id)
select e.id,t.id
from kandy_editorial x
cross join lateral jsonb_array_elements_text(x.themes) theme(slug)
join public.experiences e on e.slug=x.slug
join public.themes t on t.slug=theme.slug
on conflict do nothing;

insert into public.theme_destinations(theme_id,destination_id)
select t.id,d.id
from (values ('heritage'),('culture'),('nature'),('wildlife'),('wellness')) wanted(slug)
join public.themes t on t.slug=wanted.slug
join public.destinations d on d.slug='kandy'
on conflict do nothing;

do $$
declare
  content_count integer;
  destination_count integer;
  theme_count integer;
  archived_count integer;
  perahera_count integer;
  forest_count integer;
begin
  select count(*) into content_count
  from public.experiences e
  join kandy_editorial x on x.slug=e.slug
  where e.status='published'
    and e.active
    and length(e.full_description)>600
    and e.duration is not null
    and e.difficulty is not null;

  select count(distinct ed.experience_id) into destination_count
  from public.experience_destinations ed
  join public.experiences e on e.id=ed.experience_id
  join public.destinations d on d.id=ed.destination_id
  join kandy_editorial x on x.slug=e.slug
  where d.slug='kandy';

  select count(distinct et.experience_id) into theme_count
  from public.experience_themes et
  join public.experiences e on e.id=et.experience_id
  join kandy_editorial x on x.slug=e.slug;

  select count(*) into archived_count
  from public.experiences
  where slug='kandy-touring-the-kandy-royal-palace-complex-and-national-museum'
    and status='archived'
    and not active;

  select count(*) into perahera_count
  from public.experiences
  where slug='kandy-experiencing-the-grand-annual-kandy-esala-perahera-festival-procession'
    and status='published'
    and active;

  select count(*) into forest_count
  from public.experiences
  where slug='kandy-udawattakele-forest-reserve-guided-nature-walk'
    and image_status='needs_review'
    and needs_image_review;

  if content_count<>6 or destination_count<>6 or theme_count<>6 or archived_count<>1 or perahera_count<>1 or forest_count<>1 then
    raise exception 'Kandy validation failed: content %, destination %, themes %, archived %, Perahera %, forest %',content_count,destination_count,theme_count,archived_count,perahera_count,forest_count;
  end if;

  raise notice 'Kandy result: 6 bespoke experiences published and mapped; Perahera preserved; 1 overlapping palace record archived; Udawattakele imagery flagged for review.';
end $$;

commit;
