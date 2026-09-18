import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import {experienceContext,experienceDestinationOptions,experienceEditionLabels,experienceEditionOptions,filterExperiences,selectSignatureExperience} from "../lib/experience-discovery.ts";
import type {JourneyExperience} from "../lib/types.ts";

const source=(path:string)=>readFileSync(new URL(`../${path}`,import.meta.url),"utf8");
const makeExperience=(changes:Partial<JourneyExperience>={}):JourneyExperience=>({
  id:"experience-1",slug:"yala-safari",name:"Morning safari in Yala",category:"Wildlife",short_description:"A considered encounter with Yala's wild landscapes.",full_description:"Travel into Yala with a local specialist and time to observe its landscapes.",hero_image_url:"https://example.com/yala.jpg",image_alt:"Elephant crossing the Yala landscape",image_credit:null,gallery:["https://example.com/yala-2.jpg"],gallery_alt_texts:["Yala landscape"],duration:"Half day",difficulty:null,best_season:"February to July",highlights:["Quiet observation"],unique_points:[],included:[],things_to_know:[],nearby_attractions:[],traveller_tips:[],badges:[],family_friendly:true,suitable_for_children:true,private_option:true,priority:null,featured:false,price_per_person_usd:null,destinationIds:["destination-yala"],destinationNames:["Yala"],destinations:[{id:"destination-yala",slug:"yala",name:"Yala",latitude:null,longitude:null}],themeIds:["theme-wildlife"],themes:[{id:"theme-wildlife",slug:"wildlife",name:"Wild Encounters"}],pricingPlans:[],...changes
});

const experiences=[
  makeExperience(),
  makeExperience({id:"experience-2",slug:"sigiriya-rock",name:"Climb Sigiriya Rock Fortress",category:"Heritage",short_description:"Living history above the plains.",hero_image_url:null,gallery:[],destinationIds:["destination-sigiriya"],destinationNames:["Sigiriya"],destinations:[{id:"destination-sigiriya",slug:"sigiriya",name:"Sigiriya",latitude:null,longitude:null}],themeIds:["theme-heritage"],themes:[{id:"theme-heritage",slug:"heritage",name:"Timeless Heritage"}]}),
  makeExperience({id:"experience-3",slug:"coastal-sailing",name:"Sail the southern coast",category:"Coast",short_description:"A slow morning on the Indian Ocean.",featured:true,destinationIds:["destination-galle"],destinationNames:["Galle"],destinations:[{id:"destination-galle",slug:"galle",name:"Galle",latitude:null,longitude:null}],themeIds:["theme-tropical"],themes:[{id:"theme-tropical",slug:"tropical",name:"Tropical Paradise"}]})
];

test("signature selection resolves from the strongest valid published candidate rather than a fixed slug",()=>{
  assert.equal(selectSignatureExperience(experiences)?.slug,"coastal-sailing");
  assert.equal(selectSignatureExperience([]),null);
});

test("approved technical theme slugs become exact public Edition labels",()=>{
  assert.deepEqual(experienceEditionLabels(experiences[0]),["Wild Edition"]);
  assert.deepEqual(experienceEditionOptions(experiences).map(item=>item.label),["Coastal Edition","Heritage Edition","Wild Edition"]);
});

test("destination discovery options are derived from the full catalogue",()=>{
  assert.deepEqual(experienceDestinationOptions(experiences).map(item=>item.value),["galle","sigiriya","yala"]);
});

test("search matches names, descriptions, destination and Edition context",()=>{
  assert.equal(filterExperiences(experiences,{query:"fortress",edition:"",destination:""})[0].slug,"sigiriya-rock");
  assert.equal(filterExperiences(experiences,{query:"Wild Edition",edition:"",destination:""})[0].slug,"yala-safari");
  assert.equal(filterExperiences(experiences,{query:"galle",edition:"",destination:""})[0].slug,"coastal-sailing");
});

test("Edition and destination filters use reliable relationship slugs",()=>{
  assert.deepEqual(filterExperiences(experiences,{query:"",edition:"heritage",destination:""}).map(item=>item.slug),["sigiriya-rock"]);
  assert.deepEqual(filterExperiences(experiences,{query:"",edition:"",destination:"yala"}).map(item=>item.slug),["yala-safari"]);
});

test("combined filters narrow deterministically and support a zero-result state",()=>{
  assert.equal(filterExperiences(experiences,{query:"safari",edition:"wildlife",destination:"yala"}).length,1);
  assert.equal(filterExperiences(experiences,{query:"safari",edition:"heritage",destination:"sigiriya"}).length,0);
  assert.equal(filterExperiences(experiences,{query:"",edition:"",destination:""}).length,experiences.length);
});

test("sparse optional content keeps useful context without fabricated facts",()=>{
  const sparse=makeExperience({category:null,short_description:null,full_description:null,hero_image_url:null,destinationIds:[],destinationNames:[],destinations:[],themeIds:[],themes:[]});
  assert.equal(experienceContext(sparse),"Sri Lanka");
  assert.deepEqual(filterExperiences([sparse],{query:"imaginary rating",edition:"",destination:""}),[]);
});

test("catalogue is paginated from the actual collection and is not a hardcoded tiny subset",()=>{
  const catalogue=source("features/experiences/experience-catalogue.tsx");
  assert.match(catalogue,/const PAGE_SIZE=18/);
  assert.match(catalogue,/results\.slice\(0,visible\)/);
  assert.match(catalogue,/visible<results\.length/);
  assert.doesNotMatch(catalogue,/\.slice\(0,6\)/);
});

test("catalogue uses navigable Experience links, URL filter state, reset and an editorial empty state",()=>{
  const catalogue=source("features/experiences/experience-catalogue.tsx");
  assert.match(catalogue,/href=\{`\/experiences\/\$\{experience\.slug\}`\}/);
  assert.match(catalogue,/window\.history\.replaceState/);
  assert.match(catalogue,/Clear/);
  assert.match(catalogue,/No published experience matches all three choices yet/);
  assert.match(catalogue,/type="search"/);
});

test("detail route preserves canonical slugs, not-found handling and factual metadata",()=>{
  const route=source("app/experiences/[slug]/page.tsx");
  assert.match(route,/item\.slug===slug/);
  assert.match(route,/if\(!experience\)notFound\(\)/);
  assert.match(route,/alternates:\{canonical:`\/experiences\/\$\{experience\.slug\}`\}/);
  assert.match(route,/ExperiencePublicDetail/);
});

test("detail presentation links destinations, Editions and established Journey planning",()=>{
  const detail=source("features/experiences/experience-public-detail.tsx");
  assert.match(detail,/href=\{`\/destinations\/\$\{destination\.slug\}`\}/);
  assert.match(detail,/href=\{`\/discover\/\$\{theme\.slug\}`\}/);
  assert.match(detail,/includeExperienceSelection/);
  assert.match(detail,/journey-builder\?\$\{query\}/);
  assert.match(source("features/experiences/experience-editorial.tsx"),/"Plan Your Journey"/);
});

test("image fallback and responsive editorial contracts remain present",()=>{
  const media=source("features/experiences/experience-media.tsx");
  const catalogue=source("features/experiences/experience-catalogue.tsx");
  assert.match(media,/A Sri Lankan experience, thoughtfully selected/);
  assert.match(media,/alt=\{alt\}/);
  assert.match(catalogue,/md:grid-cols-2 xl:grid-cols-12/);
  assert.match(catalogue,/min-h-12/);
  assert.doesNotMatch(catalogue,/overflow-x-auto/);
});

test("new public Experience surfaces contain no active legacy brand or marketplace claims",()=>{
  const publicExperience=["app/experiences/page.tsx","app/experiences/[slug]/page.tsx","features/experiences/experience-catalogue.tsx","features/experiences/experience-public-detail.tsx","features/experiences/experience-media.tsx"].map(source).join("\n");
  assert.doesNotMatch(publicExperience,/Roam Ceylon/i);
  assert.doesNotMatch(publicExperience,/book now|instant confirmation|best price|top-rated|review count/i);
  assert.match(publicExperience,/The Ceylon Edition|Plan Your Journey/);
});
