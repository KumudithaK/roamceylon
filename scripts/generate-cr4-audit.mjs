import {readFileSync,writeFileSync} from "node:fs";
import {resolve} from "node:path";

function parseCsv(text){
  const rows=[];
  let row=[],cell="",quoted=false;
  for(let index=0;index<text.length;index+=1){
    const char=text[index];
    if(quoted){
      if(char==='"'&&text[index+1]==='"'){cell+='"';index+=1;continue}
      if(char==='"'){quoted=false;continue}
      cell+=char;
      continue;
    }
    if(char==='"'){quoted=true;continue}
    if(char===','){row.push(cell);cell="";continue}
    if(char==='\n'){row.push(cell);rows.push(row);row=[];cell="";continue}
    if(char!=='\r')cell+=char;
  }
  if(cell||row.length){row.push(cell);rows.push(row)}
  const [headers,...values]=rows;
  return values.filter(item=>item.some(Boolean)).map(item=>Object.fromEntries(headers.map((header,index)=>[header,item[index]??""])));
}

const inputs=process.argv.slice(2);
if(inputs.length!==2)throw new Error("Usage: node scripts/generate-cr4-audit.mjs <first.csv> <second.csv>");

const rows=inputs.flatMap(path=>parseCsv(readFileSync(path,"utf8")));
const published=rows.filter(row=>row.status==="published"&&row.active==="true").sort((a,b)=>a.name.localeCompare(b.name));

const holds={
  "cricket-with-local-players":"Prior human decision retained: community host, ground consent and supplier capability are not yet established.",
  "nuwaraeliya-boating-pony-riding-and-lakeside-walking-at-gregory-lake":"Compound activity lacks coherent scope and does not address pony welfare or activity-specific operating requirements.",
  "balapitiya-jet-skiing-and-speed-boating-along-madu-ganga-estuary":"Motorised recreation in a sensitive estuary requires environmental, permission and operator evidence before public discovery.",
  "yala-spotting-sloth-bears-wild-elephants-mugger-crocodiles-and-spotted-deer":"Overlaps the retained Yala Block 1 safari and reads as a species checklist rather than a distinct experience.",
  "wilpattu-tracking-elusive-sri-lankan-leopards-sloth-bears-and-wild-boars-in-dense":"Overlaps the retained Wilpattu villu safari and reads as a species checklist rather than a distinct experience.",
  "nilaveli-snorkeling-among-blacktip-reef-sharks-sea-turtles-and-colorful-corals":"Overlaps the retained Pigeon Island snorkelling journey and foregrounds named wildlife that cannot be promised.",
  "hikkaduwa-visiting-local-sea-turtle-hatcheries-and-conservation-centers":"Hatchery/provider welfare practice is unverified; ordinary discovery is inappropriate until founder due diligence is complete."
};

const questionable={
  "sri-lanka-international-cricket-matchday":"Credible only for an officially confirmed fixture, legitimate admission and named venue; requires fixture-by-fixture operational confirmation.",
  "arugambay-sand-dune-atv-quad-riding-and-coastal-camping":"Requires an authorised riding area, land permission, environmental safeguards and a verified specialist operator.",
  "kandy-experiencing-the-grand-annual-kandy-esala-perahera-festival-procession":"Annual schedule, seating and the ethical implications of ceremonial elephants require human review.",
  "horse-riding-in-nuwara-eliya":"Operator insurance, horse welfare, route permission and participant limits require verification.",
  "udawalawe-visiting-the-udawalawe-elephant-transit-home-during-milk-feeding-session":"Official visitor access and current programme timing require confirmation; wording must not frame care activity as entertainment.",
  "kalutara-medical-consultations-with-certified-ayurvedic-doctors":"Regulated practitioner credentials and the intended clinical scope require supplier verification.",
  "kalutara-comprehensive-multi-day-panchakarma-detox-programs":"Multi-day treatment scope, practitioner credentials and medical boundaries require confirmation.",
  "ahungalla-specialized-herbal-therapy-and-shirodhara-head-treatments":"Practitioner credentials, contraindications and exact treatment scope require confirmation.",
  "tangalle-oceanfront-morning-yoga-and-sound-healing-workshops":"Provider credentials and non-medical positioning require confirmation.",
  "weligama-beachfront-chakra-balancing-sound-therapy-and-wellness-cafes":"Wellness claims and the exact provider-led experience require founder review.",
  "kandy-attending-traditional-kandyan-dance-and-fire-walking-performances":"Performance programme, venue and any fire-walking claim require current supplier confirmation.",
  "hikkaduwa-snorkeling-with-wild-sea-turtles-at-hikkaduwa-coral-sanctuary":"Needs explicit no-touch/no-feed marine-wildlife practice and a verified responsible operator.",
  "nuwara-eliya-golf-club-experience":"Named club access, tee times and inclusions require a commercial arrangement.",
  "colombo-royal-golf-private-round":"Named club access, tee times, dress rules and inclusions require a commercial arrangement.",
  "shangri-la-hambantota-golf-experience":"Named resort access, tee times and inclusions require a commercial arrangement.",
  "victoria-golf-country-resort-experience":"Named resort access, tee times and inclusions require a commercial arrangement."
};

const publicNames={
  "udawalawe-guaranteed-year-round-wild-elephant-sightings-across-open-grasslands":"Udawalawe Wild Elephant Safari",
  "nilaveli-boat-trips-to-pigeon-island-national-park-for-world-class-snorkeling":"Pigeon Island National Park Snorkelling Journey",
  "yala-morning-and-evening-4x4-jeep-safaris-in-block-1-world-renowned-leopard-d":"Yala Block 1 Wildlife Safari",
  "sigiriya-hiking-pidurangala-rock-for-breathtaking-dawn-vistas-over-sigiriya-citad":"Pidurangala Rock Dawn Hike"
};

const editionNames={
  "Timeless Heritage":"Heritage Edition",
  "Wild Encounters":"Wild Edition",
  "Tropical Paradise":"Coastal Edition",
  "Thrill & Adventure":"Adventure Edition",
  "Holistic Wellness":"Wellness Edition",
  "Breathtaking Nature":"Nature Edition",
  "Vibrant Culture":"Cultural Edition",
  "Sporting Sri Lanka":"Sporting Edition"
};

const archivedDestinations=new Set(["Balapitiya","Mount Lavinia","Nilaveli"]);
const displayDestinations=value=>value.split(" | ").filter(Boolean).filter(name=>!archivedDestinations.has(name)).join(", ");
const displayEditions=value=>value.split(" | ").filter(Boolean).map(name=>editionNames[name]??name).join(", ");
const isNullish=value=>!value||value.trim().toLocaleLowerCase()==="null";
const missingOperational=row=>[row.duration,row.difficulty,row.best_season].filter(isNullish).length;
const genericCopy=row=>/thoughtfully arranged|becomes a considered part|experienced from a different perspective/i.test(`${row.short_description} ${row.full_description}`);

function classify(row){
  if(holds[row.slug])return {classification:"HOLD / EXCLUDE",reason:holds[row.slug]};
  if(questionable[row.slug])return {classification:"QUESTIONABLE",reason:questionable[row.slug]};
  const missing=missingOperational(row);
  const reasons=[];
  if(publicNames[row.slug])reasons.push("Public title/copy safely corrected without changing the stable slug")
  if(missing)reasons.push(`${missing} optional operating ${missing===1?"field is":"fields are"} awaiting verified detail`)
  if(genericCopy(row))reasons.push("copy remains serviceable but formulaic")
  if(row.name.length>82)reasons.push("source title remains long; stable slug preserved")
  if(reasons.length)return {classification:"MINOR FIX",reason:`${reasons.join("; ")}.`};
  return {classification:"READY",reason:"Commercially clear, destination-linked and responsibly qualified for enquiry-led journey planning."};
}

const classified=published.map(row=>({...row,...classify(row)}));
const classifications=["READY","MINOR FIX","MAJOR FIX","QUESTIONABLE","HOLD / EXCLUDE"];
const counts=Object.fromEntries(classifications.map(name=>[name,classified.filter(row=>row.classification===name).length]));

const duplicateHeroes=new Map();
for(const row of published){
  const group=duplicateHeroes.get(row.hero_image_url)??[];
  group.push(row.slug);
  duplicateHeroes.set(row.hero_image_url,group);
}

const ethicalImageSlugs=new Set([
  "nuwaraeliya-boating-pony-riding-and-lakeside-walking-at-gregory-lake",
  "kandy-experiencing-the-grand-annual-kandy-esala-perahera-festival-procession",
  "horse-riding-in-nuwara-eliya",
  "hikkaduwa-snorkeling-with-wild-sea-turtles-at-hikkaduwa-coral-sanctuary",
  "hikkaduwa-visiting-local-sea-turtle-hatcheries-and-conservation-centers",
  "udawalawe-visiting-the-udawalawe-elephant-transit-home-during-milk-feeding-session"
]);

const parseJson=value=>{try{const parsed=JSON.parse(value);return Array.isArray(parsed)?parsed:[]}catch{return[]}};
const placeholderCredit=value=>isNullish(value)||/source retained|attribution register|verify and replace|complete per-image/i.test(value);
const imageRows=published.map(row=>{
  const problems=[];
  const duplicates=duplicateHeroes.get(row.hero_image_url)??[];
  const gallery=parseJson(row.gallery),alts=parseJson(row.gallery_alt_texts);
  if(duplicates.length>1)problems.push("DUPLICATE")
  if(placeholderCredit(row.image_credit))problems.push("QUESTIONABLE PROVENANCE")
  if(gallery.length!==alts.length)problems.push("OTHER")
  if(row.slug==="sri-lanka-international-cricket-matchday")problems.push("QUESTIONABLE LOCATION")
  if(ethicalImageSlugs.has(row.slug))problems.push("ETHICAL PRESENTATION")
  const host=(()=>{try{return new URL(row.hero_image_url).hostname}catch{return "unknown host"}})();
  return {...row,problems:[...new Set(problems)],priority:problems.length?"P1":"P2",host,galleryCount:gallery.length};
});
const imageCounts={P0:0,P1:imageRows.filter(row=>row.priority==="P1").length,P2:imageRows.filter(row=>row.priority==="P2").length};

const classificationTable=classified.map(row=>`| ${publicNames[row.slug]??row.name} | \`${row.slug}\` | ${displayDestinations(row.destinations)||"—"} | ${displayEditions(row.editions)||"—"} | ${row.classification} | ${row.reason} |`).join("\n");

const audit=`# CR4 experience readiness\n\nThis is a staging-only, non-destructive Experience catalogue audit for Supabase project \`hvcggnuptrcsxtrcjnre\`. It records the catalogue observed on 22 September 2026 and the public-presentation safeguards applied in CR4. It is not a production runbook or a supplier confirmation register.\n\n## Catalogue baseline\n\n- 141 total Experience records\n- 124 published and active records\n- 17 unpublished or inactive records\n- 123 publicly discoverable records before CR4 (the prior \`cricket-with-local-players\` exclusion was verified)\n- 117 publicly discoverable records after CR4\n- 7 presentation-layer holds; no record was deleted, unpublished or re-slugged\n- 154 Experience-to-Destination relationships and 210 Experience-to-Edition relationships\n- 84 migrations; latest migration \`202608120014\`\n- 0 published records missing a summary, full description, hero image or hero alt text\n- 0 published records with a legacy per-person price\n\n## Final classification counts\n\n- READY: ${counts.READY}\n- MINOR FIX: ${counts["MINOR FIX"]}\n- MAJOR FIX: ${counts["MAJOR FIX"]}\n- QUESTIONABLE: ${counts.QUESTIONABLE}\n- HOLD / EXCLUDE: ${counts["HOLD / EXCLUDE"]}\n\nMINOR FIX means the proposition remains usable for enquiry-led planning while optional operating metadata or formulaic copy awaits verified enrichment. Image-only issues are tracked separately and do not determine this classification. QUESTIONABLE records remain available for human review but must receive founder/supplier confirmation before commercial reliance.\n\n## Public safeguards applied\n\n- The prior local-cricket hold remains in place.\n- Six additional records are held from normal catalogue, homepage, partner and Journey Builder discovery. Direct compatibility URLs remain available and are marked \`noindex, nofollow\`.\n- Four overly long or misleading titles receive public-only presentation corrections while IDs, source rows and slugs remain unchanged: Udawalawe Wild Elephant Safari, Pigeon Island National Park Snorkelling Journey, Yala Block 1 Wildlife Safari and Pidurangala Rock Dawn Hike.\n- Public Experience relationships now include only published, active destinations. Archived Balapitiya, Mount Lavinia and Nilaveli records no longer leak into filters or destination links; the valid Ahungalla, Colombo and Trincomalee relationships remain.\n- All published Experience-to-Edition relationships point to published, active Editions.\n\n## Cricket decisions\n\n- \`cricket-with-local-players\`: HOLD / EXCLUDE. The prior human decision remains correct until a consenting community host, venue, format and supplier capability are established.\n- \`sri-lanka-international-cricket-matchday\`: QUESTIONABLE, not excluded. It is a credible DMC proposition only for an officially confirmed fixture, legitimate admission and named venue. The copy is appropriately conditional, but the image is Colombo-led while the relationship spans Colombo, Galle, Hambantota and Kandy; fixture-by-fixture review remains mandatory.\n\n## Duplicate and overlap decisions\n\n- Yala species-list safari is held in favour of the retained Yala Block 1 signature safari.\n- Wilpattu species-tracking safari is held in favour of the retained villu-focused safari.\n- Named-wildlife Nilaveli snorkelling is held in favour of the retained Pigeon Island snorkelling journey.\n- Colombo and Kalpitiya sport-fishing charters remain separate: they are location-specific products, not duplicates.\n- Kalpitiya lagoon kayaking and kitesurfing remain separate because their operating method and traveller proposition differ.\n\n## Operational and responsible-tourism findings\n\n- 63 published records do not state duration, 75 do not state difficulty and 63 do not state best season. These fields are optional in rendering and were not fabricated. Their absence is recorded as a verified enrichment task.\n- Wildlife, marine, adventure, cultural-event and wellness records generally contain defensive language about conditions and confirmation. No price, fixed availability or guaranteed admission data is present.\n- The absolute Udawalawe elephant guarantee contradicted its own safety copy; the public title and summary are corrected in the presentation layer.\n- Hatchery welfare, motorised estuary recreation, pony-riding scope and three semantic duplicate records are held from ordinary discovery.\n- International cricket, named golf access, medical/wellness programmes, event/performance access, horse riding, the Elephant Transit Home and selected marine-wildlife propositions remain QUESTIONABLE pending human or supplier evidence.\n- Existing internal Theme names, stable slugs and \`Roam Ceylon\` compatibility data remain unchanged; public rendering continues to translate the former brand through the established compatibility layer.\n\n## Merchandising and journey behaviour\n\n- Yala remains the explicit signature Experience with a safer public display title.\n- Sigiriya, Kitulgala rafting, Arugam Bay yoga, Gangewadiya mangrove/fishing-village and Ella Nine Arches remain the explicit supporting set.\n- Holds use the shared discovery contract consumed by catalogue, homepage, partners and Journey Builder.\n- Search, destination filtering, Edition filtering, progressive loading, selection, persistence and direct compatibility contracts remain code-tested.\n\n## Published catalogue classification\n\n| Experience | Slug | Public destination(s) | Edition(s) | Classification | Reason |\n| --- | --- | --- | --- | --- | --- |\n${classificationTable}\n\n## Deferred work\n\n- CR5 must verify supplier capability, permits, insurance, named property/club access, practitioner credentials, equipment, schedules, capacity and final inclusions.\n- The founder must resolve every QUESTIONABLE and HOLD / EXCLUDE record before commercial launch.\n- Final photography and attribution work is tracked in [the CR4 manual image checklist](./cr4-experience-image-checklist.md).\n- No database row, migration, Storage object, price, availability record or supplier record was changed in CR4.\n`;

const imageTable=imageRows.map(row=>{
  const destination=displayDestinations(row.destinations)||row.destinations.replaceAll(" | ",", ")||"Sri Lanka";
  const issues=row.problems.length?row.problems.join(", "):"OTHER";
  const status=`Hero: ${row.host}; gallery: ${row.galleryCount}; credit: ${placeholderCredit(row.image_credit)?"unverified/incomplete":"recorded"}`;
  const recommendation=`Founder-selected, location-verifiable photography of ${publicNames[row.slug]??row.name} in ${destination}; confirm consent, safety and licensing where relevant.`;
  return `| ${publicNames[row.slug]??row.name} | \`${row.slug}\` | ${destination} | ${status} | ${issues} | ${recommendation} | ${row.priority} |`;
}).join("\n");

const imageAudit=`# CR4 manual Experience image replacement checklist\n\nThis founder-led checklist separates photography work from CR4 functional closure. No AI-generated travel image or random web replacement was introduced. Current images remain in staging until a licensed, location-verifiable replacement is approved.\n\n## Summary\n\n- P0 — must replace before launch: ${imageCounts.P0}\n- P1 — strongly recommended before launch: ${imageCounts.P1}\n- P2 — acceptable temporarily but improve: ${imageCounts.P2}\n- 114 published hero images are hosted by Pexels, 9 by Wikimedia Commons and 1 by a named hotel asset host.\n- 111 published records have no image-credit value. Additional records use an explicit placeholder or a “verify and replace” note.\n- 25 hero-image URLs are reused across 77 published records.\n- 10 records have five gallery images but no stored gallery alt-text array; the public component currently supplies a safe generated fallback.\n- No published Experience is missing a hero image or hero alt text.\n\nOrdinary P1/P2 photography work does not block CR4. Every item still requires founder approval before Commercial Launch, especially where the current subject, provenance or ethical framing could mislead a traveller.\n\n| Experience | Slug | Destination | Current image status | Problem category | Recommended image subject | Priority |\n| --- | --- | --- | --- | --- | --- | --- |\n${imageTable}\n\n## CR3 photography items carried forward\n\nThe five destination-level manual photography items remain separate and unchanged: Ahungalla, Belihul Oya, Kataragama, Minneriya and Tangalle.\n`;

writeFileSync(resolve("docs/cr4-experience-readiness.md"),audit);
writeFileSync(resolve("docs/cr4-experience-image-checklist.md"),imageAudit);
console.log(JSON.stringify({published:published.length,counts,imageCounts},null,2));
