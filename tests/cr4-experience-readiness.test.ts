import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import {
  applyPublicExperienceCopy,
  filterExperiences,
  isPubliclyDiscoverableExperience,
  publicExperienceExcludedSlugs,
  publiclyDiscoverableExperiences
} from "../lib/experience-discovery.ts";
import type {JourneyExperience} from "../lib/types.ts";

const source=(path:string)=>readFileSync(new URL(`../${path}`,import.meta.url),"utf8");

const experience=(overrides:Partial<JourneyExperience>={}):JourneyExperience=>({
  id:"00000000-0000-4000-8000-000000000001",
  slug:"ready-experience",
  name:"Ready experience",
  category:"Nature",
  short_description:"A clear experience.",
  full_description:"A clear and responsibly qualified experience.",
  hero_image_url:"https://example.com/experience.jpg",
  image_alt:"Ready experience",
  image_credit:null,
  gallery:[],
  gallery_alt_texts:[],
  duration:null,
  difficulty:null,
  best_season:null,
  highlights:[],
  unique_points:[],
  included:[],
  things_to_know:[],
  nearby_attractions:[],
  traveller_tips:[],
  badges:[],
  family_friendly:true,
  suitable_for_children:true,
  private_option:false,
  priority:null,
  featured:false,
  price_per_person_usd:null,
  destinationIds:["dest-1"],
  destinationNames:["Yala"],
  destinations:[{id:"dest-1",name:"Yala",slug:"yala",latitude:null,longitude:null}],
  themeIds:["theme-1"],
  themes:[{id:"theme-1",name:"Wild Encounters",slug:"wildlife"}],
  pricingPlans:[],
  ...overrides
});

test("CR4 uses one intentional non-destructive discovery hold list",()=>{
  assert.deepEqual(publicExperienceExcludedSlugs,[
    "cricket-with-local-players",
    "nuwaraeliya-boating-pony-riding-and-lakeside-walking-at-gregory-lake",
    "balapitiya-jet-skiing-and-speed-boating-along-madu-ganga-estuary",
    "yala-spotting-sloth-bears-wild-elephants-mugger-crocodiles-and-spotted-deer",
    "wilpattu-tracking-elusive-sri-lankan-leopards-sloth-bears-and-wild-boars-in-dense",
    "nilaveli-snorkeling-among-blacktip-reef-sharks-sea-turtles-and-colorful-corals",
    "hikkaduwa-visiting-local-sea-turtle-hatcheries-and-conservation-centers"
  ]);
  const records=[experience(),...publicExperienceExcludedSlugs.map((slug,index)=>experience({id:`held-${index}`,slug}))];
  assert.deepEqual(publiclyDiscoverableExperiences(records).map(item=>item.slug),["ready-experience"]);
  for(const slug of publicExperienceExcludedSlugs)assert.equal(isPubliclyDiscoverableExperience({slug}),false);
});

test("CR4 public copy removes the unsupported Udawalawe guarantee without changing its slug",()=>{
  const slug="udawalawe-guaranteed-year-round-wild-elephant-sightings-across-open-grasslands";
  const corrected=applyPublicExperienceCopy(experience({slug,name:"Guaranteed year-round wild elephant sightings across open grasslands",short_description:"Guaranteed year-round wild elephant sightings across open grasslands.",full_description:"Guaranteed year-round wild elephant sightings across open grasslands, while sightings are never guaranteed.",image_alt:"Guaranteed year-round wild elephant sightings across open grasslands",highlights:["Guaranteed year-round wild elephant sightings across open grasslands."]}));
  assert.equal(corrected.slug,slug);
  assert.equal(corrected.name,"Udawalawe Wild Elephant Safari");
  assert.match(corrected.short_description??"",/dependent on nature/i);
  assert.doesNotMatch([corrected.name,corrected.short_description,corrected.image_alt,...corrected.highlights].join(" "),/guaranteed year-round/i);
  assert.match(corrected.full_description??"",/never guaranteed/i);
});

test("catalogue discovery still supports search, destination and Edition filters",()=>{
  const yala=experience();
  const coast=experience({id:"coast",slug:"coastal",name:"Coastal paddle",destinationIds:["dest-2"],destinationNames:["Galle"],destinations:[{id:"dest-2",name:"Galle",slug:"galle",latitude:null,longitude:null}],themeIds:["theme-2"],themes:[{id:"theme-2",name:"Tropical Paradise",slug:"tropical"}]});
  assert.deepEqual(filterExperiences([yala,coast],{query:"yala",edition:"",destination:""}).map(item=>item.slug),["ready-experience"]);
  assert.deepEqual(filterExperiences([yala,coast],{query:"",edition:"tropical",destination:"galle"}).map(item=>item.slug),["coastal"]);
});

test("repository excludes archived destination relationships from public Experience data",()=>{
  const repository=source("lib/repositories/content.ts");
  assert.match(repository,/Read published experience destinations/);
  assert.match(repository,/from\("destinations"\)\.select\("id,name,slug,latitude,longitude"\)\.in\("id",destinationIds\)\.eq\("status","published"\)\.eq\("active",true\)/);
  assert.match(repository,/const rowDestinationIds=rowDestinations\.map\(destination=>destination\.id\)/);
  assert.match(repository,/applyPublicExperienceCopy\(row\)/);
});

test("holds stay out of catalogue, homepage, partners and Journey Builder while direct URLs remain compatible",()=>{
  assert.match(source("app/experiences/page.tsx"),/publiclyDiscoverableExperiences\(experiences\)/);
  assert.match(source("lib/homepage-experience-curation.ts"),/publiclyDiscoverableExperiences\(experiences\)/);
  assert.match(source("app/partners/page.tsx"),/publiclyDiscoverableExperiences\(experiences\)/);
  assert.match(source("lib/journey/journey-service.ts"),/publiclyDiscoverableExperiences\(await this\.experiences\.getByDestinationIds/);
  const detail=source("app/experiences/[slug]/page.tsx");
  assert.match(detail,/experiences\.find\(item=>item\.slug===slug\)/);
  assert.match(detail,/robots:isPubliclyDiscoverableExperience\(experience\)\?undefined:\{index:false,follow:false\}/);
});

test("CR2 Experience interaction and progressive-loading contracts remain intact",()=>{
  const catalogue=source("features/experiences/experience-catalogue.tsx");
  const detail=source("features/experiences/experience-public-detail.tsx");
  assert.match(catalogue,/const PAGE_SIZE=18/);
  assert.match(catalogue,/setVisible\(value=>value\+PAGE_SIZE\)/);
  assert.match(catalogue,/Plan Your Journey/);
  assert.match(detail,/Plan this into your journey/);
  assert.match(detail,/writeJourneyState\(next\)/);
});

test("CR4 audit contains all 124 published classifications and the manual image checklist",()=>{
  const audit=source("docs/cr4-experience-readiness.md");
  const checklist=source("docs/cr4-experience-image-checklist.md");
  const classificationRows=audit.split("\n").filter(line=>/^\| .* \| `[^`]+` \| .* \| (READY|MINOR FIX|MAJOR FIX|QUESTIONABLE|HOLD \/ EXCLUDE) \|/.test(line));
  const imageRows=checklist.split("\n").filter(line=>/^\| .* \| `[^`]+` \| .* \| P[012] \|$/.test(line));
  assert.equal(classificationRows.length,124);
  assert.equal(imageRows.length,124);
  assert.match(audit,/123 publicly discoverable records before CR4/);
  assert.match(audit,/117 publicly discoverable records after CR4/);
  assert.match(audit,/READY: 40/);
  assert.match(audit,/MINOR FIX: 61/);
  assert.match(audit,/MAJOR FIX: 0/);
  assert.match(audit,/QUESTIONABLE: 16/);
  assert.match(audit,/HOLD \/ EXCLUDE: 7/);
  assert.match(checklist,/P0 — must replace before launch: 0/);
  assert.match(checklist,/P1 — strongly recommended before launch: 124/);
  assert.match(checklist,/No AI-generated travel image or random web replacement was introduced/);
});

test("CR4 changes introduce no production identity, invented email or pricing promise",()=>{
  const runtimeChanged=[
    source("lib/experience-discovery.ts"),
    source("lib/repositories/content.ts"),
    source("app/experiences/[slug]/page.tsx")
  ].join("\n");
  const allChanged=[
    runtimeChanged,
    source("docs/cr4-experience-readiness.md"),
    source("docs/cr4-experience-image-checklist.md")
  ].join("\n");
  assert.doesNotMatch(allChanged,/fstpfqlgypvktjwdeagu|xnsxmwgyugoqanuoyebh/);
  assert.doesNotMatch(allChanged,/mailto:|@[a-z0-9.-]+\.[a-z]{2,}/i);
  assert.doesNotMatch(runtimeChanged,/best price|instant confirmation|guaranteed admission/i);
});
