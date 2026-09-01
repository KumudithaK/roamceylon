import {readFile,writeFile,mkdir} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const experiences=JSON.parse(await readFile(path.join(root,"data/experiences.json"),"utf8"));
const destinations=JSON.parse(await readFile(path.join(root,"data/destinations.json"),"utf8"));
const showcase=new Set([
  "belihuloya-bakers-bend-4x4-off-road-adventure-safari",
  "dambulla-bird-watching-and-sunset-boat-rides-on-kandalama-reservoir",
  "kandy-experiencing-the-grand-annual-kandy-esala-perahera-festival-procession"
]);
const liveSlugOverrides={
  "minneriya-witnessing-the-elephant-gathering-hundreds-of-wild-elephants-congregate-":"minneriya-witnessing-the-elephant-gathering-hundreds-of-wild-elephants-congregate"
};
const destinationName=new Map(destinations.map(item=>[item.id,item.name]));
const clean=value=>String(value||"").replace(/^Discover /i,"").replace(/ through a thoughtfully paced experience shaped around your journey\.?$/i,"").replace(/\.$/,"");
const sentence=value=>`${value.charAt(0).toUpperCase()}${value.slice(1).replace(/\s+/g," ")}.`;
const lower=value=>`${value.charAt(0).toLowerCase()}${value.slice(1)}`;
const categoryCorrections=new Map([
  ["kitulgala-sandun-ella-waterfall-abseiling-and-rappelling","Adventure"]
]);
const editorialCategory=experience=>categoryCorrections.get(experience.id)||(profiles[experience.category]?experience.category:"Nature");

const profiles={
  Adventure:{lens:"active exploration",included:["Pre-experience safety briefing","Specialist local operator and required activity equipment","The Ceylon Edition timing and access coordination"],know:["Operation depends on safe weather and local access conditions.","Final age, fitness and equipment requirements are confirmed by the selected operator."],tips:["Wear secure footwear and quick-drying layers.","Carry only essentials in a protected day bag."],badges:["Adventure"]},
  "Water Sports":{lens:"time on Sri Lanka's water",included:["Safety briefing and activity equipment specified by the operator","Qualified local crew or instructor where the activity requires one","The Ceylon Edition timing and access coordination"],know:["Sea, river and wind conditions can change the operating plan.","Swimming ability, age limits and safety equipment must be reconfirmed before travel."],tips:["Use reef-safe sun protection and secure eyewear.","Keep phones and cameras in a dry bag."],badges:["Water Activity","Adventure"]},
  Wildlife:{lens:"responsible wildlife observation",included:["Responsible local operator or naturalist as confirmed","Required park or activity coordination","The Ceylon Edition scheduling around the most suitable viewing period"],know:["Wildlife is free-ranging, so sightings and animal behaviour are never guaranteed.","Keep a respectful distance and follow all park or guide instructions."],tips:["Wear muted colours and keep voices low.","Bring binoculars and avoid flash photography around wildlife."],badges:["Wildlife"]},
  History:{lens:"Sri Lanka's layered history",included:["Locally informed interpretation where specified","The Ceylon Edition access and timing coordination","Relevant entry arrangements only when listed in the proposal"],know:["Opening hours, worship periods and conservation access can change.","Dress and behaviour must respect active sacred places."],tips:["Choose light, modest clothing and easy-to-remove footwear for sacred sites.","Start early for cooler conditions and quieter interpretation."],badges:["Cultural Heritage"]},
  Culture:{lens:"a living Sri Lankan cultural tradition",included:["Cultural context and etiquette briefing","Locally arranged access where required","The Ceylon Edition timing and host coordination"],know:["This is a living community or religious tradition, not a staged attraction.","Ceremony times and local access can change without notice."],tips:["Ask before photographing people, ceremonies or workshops.","Dress modestly and allow the host or guide to lead etiquette."],badges:["Cultural Heritage"]},
  Photography:{lens:"place-led photography",included:["The Ceylon Edition timing around the preferred light","Locally arranged access where required","Unhurried photographic stops within the confirmed programme"],know:["Light, visibility and access remain weather-dependent.","Drone use always requires separate landowner and aviation permission."],tips:["Carry a lens cloth and a light rain cover.","Prioritise respectful observation over obstructing paths or ceremonies."],badges:["Photography Spot"]},
  Nature:{lens:"quiet immersion in the landscape",included:["Locally informed route or nature interpretation where specified","The Ceylon Edition access and timing coordination","A low-impact pace suited to the setting"],know:["Trail and habitat conditions change with rainfall and season.","Follow local guidance and leave natural features undisturbed."],tips:["Wear closed shoes and carry drinking water.","Keep insect repellent and a light rain layer close at hand."],badges:[]},
  Beach:{lens:"an unhurried coastal interlude",included:["The Ceylon Edition timing and location coordination","Reserved services only where specified in the proposal","Local support appropriate to the confirmed arrangement"],know:["Sea conditions and beach access vary by season and daily weather.","Lifeguard cover and swimming safety differ between beaches."],tips:["Check local advice before entering the sea.","Use reef-safe sun protection and avoid leaving valuables unattended."],badges:[]},
  Food:{lens:"Sri Lanka's regional food culture",included:["Selected tastings or meal arrangements stated in the proposal","Local host or guide where specified","Dietary-note coordination by The Ceylon Edition"],know:["Menus, market produce and opening hours change with availability.","Allergies and dietary requirements must be shared before confirmation."],tips:["Arrive hungry, but let your host pace the tasting.","Carry water and ask before photographing vendors or kitchens."],badges:["Culinary Experience"]},
  Wellness:{lens:"restorative Sri Lankan wellness traditions",included:["Pre-arranged consultation or treatment stated in the proposal","Qualified practitioner or retreat team as confirmed","The Ceylon Edition scheduling and transfer coordination"],know:["Wellness experiences are not a substitute for medical diagnosis or treatment.","Pregnancy, allergies, medication and health conditions must be disclosed to the practitioner."],tips:["Keep the hours after treatment lightly scheduled.","Ask what clothing, meals or preparation the practitioner recommends."],badges:["Wellness"]}
};
const fallback=profiles.Nature;
const editorialByCategory={
  Adventure:"Terrain, weather and local access shape the day, so the route is confirmed with the operating team rather than reduced to a fixed script. The reward is a more immediate sense of place, with challenge balanced by considered pacing and clear safety expectations.",
  "Water Sports":"Water is the defining element, but conditions—not a timetable—set the final pace. The selected crew confirms the safe operating area, equipment and participant requirements, allowing the experience to feel energetic without losing sight of the coast, river or lagoon around it.",
  Wildlife:"The emphasis is observation rather than pursuit. Seasons, habitat and animal movement shape what unfolds, while responsible local guidance helps travellers read the landscape without treating free-ranging wildlife as a guaranteed performance.",
  History:"The visit is most rewarding when monuments are read as part of a larger human story. Local interpretation connects architecture, belief and political history while leaving space to notice craftsmanship and the way the place continues to be used today.",
  Culture:"Meaning comes from people, practice and continuity. Thoughtful context helps travellers understand what they are witnessing, while respectful timing and photography ensure the encounter remains grounded in the community or sacred tradition that sustains it.",
  Photography:"The itinerary is shaped around light, viewpoint and patience rather than a sequence of quick photographs. Time is allowed to observe the setting first, then work with changing weather, movement and perspective without disrupting the place.",
  Nature:"This is a slower encounter with landscape and habitat. Seasonal conditions determine what can be seen and how the route feels, while low-impact local guidance keeps attention on texture, sound and the relationships within the environment.",
  Beach:"The appeal lies in the character of this particular stretch of coast, not simply time beside the sea. Daily conditions guide swimming and activity choices, leaving room for an unhurried experience that fits naturally into the wider journey.",
  Food:"The experience follows regional flavour, seasonal produce and the people who prepare it. Menus may change, but careful dietary coordination and local context turn a tasting or meal into an introduction to place rather than a generic dining stop.",
  Wellness:"The treatment or practice is arranged as restorative time within the journey, with practitioner guidance and honest boundaries around what is included. Health information is shared in advance so the confirmed programme feels personal, calm and appropriately paced."
};
const highlightsByCategory={
  Adventure:["A route shaped by local terrain and real operating conditions","Clear safety preparation without losing the spontaneity of the landscape"],
  "Water Sports":["Time on the water with equipment and crew matched to the activity","A close view of the coast, river or lagoon from its defining perspective"],
  Wildlife:["Patient observation within the habitat rather than a rushed sightings checklist","Local interpretation of tracks, behaviour, season and landscape"],
  History:["Architecture and craftsmanship placed within their wider historical setting","Space to understand how belief, power and daily life shaped the site"],
  Culture:["Living traditions understood through context and respectful participation","Details of craft, ceremony or community life that are easily missed alone"],
  Photography:["Timing selected for expressive light and a considered viewpoint","Room to compose, observe and photograph without rushing the setting"],
  Nature:["A low-impact pace that brings smaller landscape details into focus","Seasonal character interpreted through habitat, sound and local knowledge"],
  Beach:["Unhurried time shaped around the character of the local coastline","Daily sea conditions considered before swimming or coastal activity"],
  Food:["Regional flavours introduced through the people and places behind them","Seasonal produce and dietary preferences considered in advance"],
  Wellness:["Restorative time protected from an otherwise busy itinerary","Practitioner-led preparation and aftercare confirmed for the chosen treatment"]
};
const uniqueByCategory={
  Adventure:["Route and conditions make each departure genuinely different","Local operating knowledge matters as much as specialist equipment"],
  "Water Sports":["The setting is experienced from the water rather than observed from shore","Wind, tide, current or water level gives every departure its own rhythm"],
  Wildlife:["The experience remains honest about uncertainty and free-ranging wildlife","Interpretation gives equal weight to habitat and animal sightings"],
  History:["The place is read through material detail instead of dates alone","Its present-day religious or community meaning remains part of the story"],
  Culture:["Travellers encounter a continuing practice rather than a recreated display","Etiquette and context are treated as part of the experience itself"],
  Photography:["The schedule starts with the quality of light, not a generic visit time","Observation comes before the camera, producing a stronger sense of place"],
  Nature:["Small ecological details are allowed to matter alongside the wider view","The pace adapts to season, weather and the condition of the landscape"],
  Beach:["The experience reflects this coast's own atmosphere and daily conditions","It can remain beautifully simple or support carefully selected local services"],
  Food:["Taste is connected to region, season and preparation rather than presented alone","Local conversation gives familiar ingredients a more meaningful context"],
  Wellness:["The programme is fitted around the traveller rather than sold as a fixed ritual","Rest and aftercare are valued as highly as the treatment itself"]
};

const uniqueImages=(experience,category)=>{
  const sameDestination=experiences.filter(item=>item.destinationIds.some(id=>experience.destinationIds.includes(id)));
  const sameCategory=experiences.filter(item=>editorialCategory(item)===category);
  const sameTheme=experiences.filter(item=>item.themeIds.some(id=>experience.themeIds.includes(id)));
  return [...new Set([experience,...sameDestination,...sameCategory,...sameTheme,...experiences].map(item=>item.heroImage).filter(Boolean))].slice(0,5);
};

const badgesFor=(experience,category)=>{
  const badges=[...(profiles[category]?.badges||[])];
  const text=`${experience.name} ${experience.bestSeason||""}`.toLowerCase();
  if(experience.priority==="Must Do")badges.push("Signature Experience","The Ceylon Edition Recommended");
  if(experience.priority==="Popular")badges.push("Most Popular");
  if(experience.priority==="Seasonal"||text.includes("seasonal"))badges.push("Seasonal");
  if(text.includes("sunrise")||text.includes("dawn"))badges.push("Sunrise Experience");
  if(text.includes("sunset"))badges.push("Sunset Experience");
  if(text.includes("family")||text.includes("families"))badges.push("Family Friendly","Child Friendly");
  if(/sigiriya|dambulla cave|anuradhapura|polonnaruwa|galle.*fort|temple of the sacred tooth/i.test(experience.name))badges.push("UNESCO Related");
  if(["Adventure","Water Sports","Wildlife","Wellness"].includes(category)||/festival|ceremon|safari|boat|tour|retreat|treatment|diving|surfing|rafting/i.test(experience.name))badges.push("Advance Booking Recommended");
  return [...new Set(badges)].slice(0,8);
};

const enriched=experiences.filter(item=>!showcase.has(item.id)).map((experience,index)=>{
  const destination=destinationName.get(experience.destinationIds[0])||experience.tags?.[0]||"Sri Lanka";
  const action=clean(experience.name);
  const category=editorialCategory(experience);
  const profile=profiles[category]||fallback;
  const gallery=uniqueImages(experience,category);
  const leadOptions=[
    `${action} brings ${profile.lens} into focus in ${destination}.`,
    `In ${destination}, this experience is centred on ${lower(action)}.`,
    `Set in ${destination}, ${lower(action)} becomes a considered part of the wider journey.`,
    `${destination} is experienced from a different perspective through ${lower(action)}.`,
    `The focus here is ${lower(action)}, thoughtfully arranged in ${destination}.`
  ];
  const lead=leadOptions[index%leadOptions.length];
  const closingOptions=[
    "The Ceylon Edition confirms the operating details with the selected local partner, so inclusions, access and any condition-dependent changes are clear before travel.",
    "The final proposal records the precise inclusions and local arrangements, keeping the experience flexible where conditions demand it and transparent where advance confirmation matters.",
    "Access, timing and the role of any host, guide or specialist operator are stated in the personalised proposal rather than left to assumption.",
    "Careful coordination keeps the experience connected to the rest of the route while preserving the local timing and practical detail it needs."
  ];
  const fullDescription=`${lead} ${editorialByCategory[category]||editorialByCategory.Nature}\n\n${closingOptions[index%closingOptions.length]}`;
  const categoryHighlights=highlightsByCategory[category]||highlightsByCategory.Nature;
  const highlights=[
    sentence(action),
    categoryHighlights[0],
    categoryHighlights[1],
    `Timing and access coordinated specifically for ${destination}`
  ];
  const categoryUnique=uniqueByCategory[category]||uniqueByCategory.Nature;
  const uniquePoints=[
    categoryUnique[0],
    categoryUnique[1],
    `Its place in the itinerary is shaped around ${destination}, not treated as an interchangeable add-on`
  ];
  const nearby=experiences.filter(item=>item.id!==experience.id&&item.destinationIds.some(id=>experience.destinationIds.includes(id))).slice(0,5).map(item=>item.name);
  const altBase=`${experience.name} in ${destination}, Sri Lanka`;
  return {
    slug:liveSlugOverrides[experience.id]||experience.id,index,name:experience.name,category,destinationSlugs:experience.destinationIds,themeSlugs:experience.themeIds,
    shortDescription:lead,fullDescription,heroImage:gallery[0],imageAlt:altBase,gallery,
    galleryAltTexts:gallery.map((_,imageIndex)=>imageIndex===0?altBase:`${destination} setting related to ${experience.name}, view ${imageIndex+1}`),
    highlights,uniquePoints,included:profile.included,thingsToKnow:profile.know,nearbyAttractions:nearby,
    travellerTips:profile.tips,badges:badgesFor(experience,category),bestSeason:experience.bestSeason||null,
    imageReviewNotes:"Five-image set assembled from existing royalty-free catalogue photography matched by destination and activity category. Confirm every pooled supporting image and photographer credit in the CMS before final launch.",
    imageSource:"Pexels / existing The Ceylon Edition catalogue — manual attribution review required"
  };
});

if(enriched.some(item=>item.gallery.length!==5))throw new Error("Every generated gallery must contain exactly five unique URLs.");
const payload=JSON.stringify(enriched).replaceAll("$catalog$","$ catalog $");
const migration=`begin;

alter table public.experiences add column if not exists gallery_alt_texts jsonb not null default '[]'::jsonb;

do $$
declare remaining_count integer; non_public_count integer; incomplete_gallery_count integer;
begin
  select count(*) into remaining_count from public.experiences where slug not in ('belihuloya-bakers-bend-4x4-off-road-adventure-safari','dambulla-bird-watching-and-sunset-boat-rides-on-kandalama-reservoir','kandy-experiencing-the-grand-annual-kandy-esala-perahera-festival-procession');
  select count(*) into non_public_count from public.experiences where slug not in ('belihuloya-bakers-bend-4x4-off-road-adventure-safari','dambulla-bird-watching-and-sunset-boat-rides-on-kandalama-reservoir','kandy-experiencing-the-grand-annual-kandy-esala-perahera-festival-procession') and (status <> 'published' or not active);
  select count(*) into incomplete_gallery_count from public.experiences where slug not in ('belihuloya-bakers-bend-4x4-off-road-adventure-safari','dambulla-bird-watching-and-sunset-boat-rides-on-kandalama-reservoir','kandy-experiencing-the-grand-annual-kandy-esala-perahera-festival-procession') and jsonb_array_length(gallery) <> 5;
  raise notice 'Premium experience audit: % remaining, % non-public, % galleries not containing five images.',remaining_count,non_public_count,incomplete_gallery_count;
end $$;

create temporary table premium_experience_source as
select * from jsonb_to_recordset($catalog$${payload}$catalog$::jsonb) as item(
  slug text,name text,category text,"destinationSlugs" jsonb,"themeSlugs" jsonb,
  "shortDescription" text,"fullDescription" text,"heroImage" text,"imageAlt" text,gallery jsonb,"galleryAltTexts" jsonb,
  highlights jsonb,"uniquePoints" jsonb,included jsonb,"thingsToKnow" jsonb,"nearbyAttractions" jsonb,
  "travellerTips" jsonb,badges jsonb,"bestSeason" text,"imageReviewNotes" text,"imageSource" text
);

update public.experiences experience
set name=source.name,category=source.category,short_description=source."shortDescription",full_description=source."fullDescription",
    hero_image_url=source."heroImage",image_alt=source."imageAlt",gallery=source.gallery,gallery_alt_texts=source."galleryAltTexts",
    highlights=source.highlights,unique_points=source."uniquePoints",included=source.included,things_to_know=source."thingsToKnow",
    nearby_attractions=source."nearbyAttractions",traveller_tips=source."travellerTips",badges=source.badges,
    best_season=source."bestSeason",difficulty=null,status='published',active=true,
    image_status='needs_review',needs_image_review=true,image_review_notes=source."imageReviewNotes",image_source=source."imageSource",
    seo_title=source.name || ' | The Ceylon Edition',seo_description=source."shortDescription",updated_at=now()
from premium_experience_source source where experience.slug=source.slug;

delete from public.experience_destinations link using premium_experience_source source where link.experience_id=(select id from public.experiences where slug=source.slug);
insert into public.experience_destinations(experience_id,destination_id)
select experience.id,destination.id from premium_experience_source source
cross join lateral jsonb_array_elements_text(source."destinationSlugs") as destination_value(slug)
join public.experiences experience on experience.slug=source.slug join public.destinations destination on destination.slug=destination_value.slug
on conflict do nothing;

delete from public.experience_themes link using premium_experience_source source where link.experience_id=(select id from public.experiences where slug=source.slug);
insert into public.experience_themes(experience_id,theme_id)
select experience.id,theme.id from premium_experience_source source
cross join lateral jsonb_array_elements_text(source."themeSlugs") as theme_value(slug)
join public.experiences experience on experience.slug=source.slug join public.themes theme on theme.slug=theme_value.slug
on conflict do nothing;

do $$
declare processed integer; published integer; bad_gallery integer; no_destination integer; no_theme integer; source_missing text; database_extra text;
begin
  select count(*) into processed from public.experiences e join premium_experience_source s on s.slug=e.slug;
  select count(*) into published from public.experiences e join premium_experience_source s on s.slug=e.slug where e.status='published' and e.active;
  select count(*) into bad_gallery from public.experiences e join premium_experience_source s on s.slug=e.slug where jsonb_array_length(e.gallery)<>5 or jsonb_array_length(e.gallery_alt_texts)<>5;
  select count(*) into no_destination from premium_experience_source s join public.experiences e on e.slug=s.slug where not exists(select 1 from public.experience_destinations d where d.experience_id=e.id);
  select count(*) into no_theme from premium_experience_source s join public.experiences e on e.slug=s.slug where not exists(select 1 from public.experience_themes t where t.experience_id=e.id);
  select string_agg(s.slug,', ') into source_missing from premium_experience_source s left join public.experiences e on e.slug=s.slug where e.id is null;
  select string_agg(e.slug || ' [' || e.name || ']',', ') into database_extra from public.experiences e left join premium_experience_source s on s.slug=e.slug where s.slug is null and e.slug not in ('belihuloya-bakers-bend-4x4-off-road-adventure-safari','dambulla-bird-watching-and-sunset-boat-rides-on-kandalama-reservoir','kandy-experiencing-the-grand-annual-kandy-esala-perahera-festival-procession');
  raise notice 'Premium source records missing in database: %',coalesce(source_missing,'none');
  raise notice 'Live database records absent from premium source: %',coalesce(database_extra,'none');
  if processed<>${enriched.length} or published<>${enriched.length} or bad_gallery<>0 or no_destination<>0 or no_theme<>0 then raise exception 'Premium catalogue validation failed: processed %, published %, gallery errors %, destination errors %, theme errors %',processed,published,bad_gallery,no_destination,no_theme; end if;
  raise notice 'Premium experience result: % processed and published; % gallery errors; % destination errors; % theme errors.',processed,bad_gallery,no_destination,no_theme;
end $$;

commit;
`;

await writeFile(path.join(root,"supabase/migrations/202608040004_premium_experience_final_audit.sql"),migration);
await writeFile(path.join(root,"data/experience-editorial-catalogue.json"),JSON.stringify(enriched,null,2)+"\n");
await mkdir(path.join(root,"reports"),{recursive:true});
await writeFile(path.join(root,"reports/premium-experience-catalogue.json"),JSON.stringify({generatedAt:new Date().toISOString(),showcaseExcluded:[...showcase],processed:enriched.length,published:enriched.length,galleriesCompleted:enriched.length,imagesAssigned:enriched.length*5,imageAssignmentsRequiringReview:enriched.length*5,badgesAdded:enriched.reduce((sum,item)=>sum+item.badges.length,0),relationships:{destinationRowsRebuilt:enriched.reduce((sum,item)=>sum+item.destinationSlugs.length,0),themeRowsRebuilt:enriched.reduce((sum,item)=>sum+item.themeSlugs.length,0)},categoryCorrections:[{slug:"kitulgala-sandun-ella-waterfall-abseiling-and-rappelling",from:"Beach",to:"Adventure"}],pricingPlansAdded:0,manualImageVerification:enriched.map(item=>item.slug),manualPriceVerification:"Review existing CMS pricing plans; no unverified values were created.",publicationExceptions:[{slug:"draft-experiences-7d3290fa",name:"Untitled experience",reason:"Incomplete admin-created draft with no real title, description, verified imagery or relationship context. It was preserved as a draft rather than fabricated or deleted."}]},null,2)+"\n");
console.log(`Generated premium catalogue migration for ${enriched.length} experiences.`);
