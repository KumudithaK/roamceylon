import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import path from "node:path";
import test from "node:test";
import {curateHomepageExperiences,homepageExperienceSlugs} from "../lib/homepage-experience-curation.ts";
import type {JourneyExperience} from "../lib/types.ts";

const root=path.resolve(import.meta.dirname,"..");
const source=(file:string)=>readFileSync(path.join(root,file),"utf8");

test("homepage is a cinematic editorial sequence backed by published content",()=>{
  const page=source("app/page.tsx");
  const home=source("components/home/editorial-home.tsx");
  assert.match(page,/ExperienceRepository/);
  assert.match(page,/<EditorialHome themes=\{themes\} destinations=\{destinations\} experiences=\{experiences\}/);
  for(const phrase of ["The Editions","Places worth knowing","Experiences worth travelling for","Why {brand.name}","Your island. Your pace."])assert.ok(home.includes(phrase));
  assert.match(home,/themes\.map/);
  assert.match(home,/destinations\.slice/);
  assert.match(home,/curateHomepageExperiences\(experiences\)/);
  assert.doesNotMatch(home,/Something Extraordinary is Coming|testimonial|award-winning/i);
});

test("homepage experience curation uses three stable, diverse catalogue slugs with safe fallback",()=>{
  const existing=[
    {id:"generic",slug:"generic-experience"},
    {id:"rail",slug:homepageExperienceSlugs[2]},
    {id:"wildlife",slug:homepageExperienceSlugs[0]},
    {id:"heritage",slug:homepageExperienceSlugs[1]},
  ] as JourneyExperience[];
  assert.deepEqual(curateHomepageExperiences(existing).map(item=>item.slug),homepageExperienceSlugs);
  assert.deepEqual(curateHomepageExperiences(existing.slice(0,2)).map(item=>item.slug),[homepageExperienceSlugs[2],"generic-experience"]);
});

test("Edition mosaic gives the four Sri Lanka anchors explicit editorial authority",()=>{
  const home=source("components/home/editorial-home.tsx");
  assert.match(home,/editionMosaicOrder=\["nature","wellness","sporting","heritage","tropical","adventure","culture","wildlife"\]/);
  assert.match(home,/nature:\{tile:"sm:col-span-2 lg:col-span-7 lg:row-span-5"/);
  assert.match(home,/heritage:\{tile:"sm:col-span-2 lg:col-span-5 lg:row-span-6"/);
  assert.match(home,/tropical:\{tile:"sm:col-span-2 lg:col-span-7 lg:row-span-4"/);
  assert.match(home,/wildlife:\{tile:"sm:col-span-2 lg:col-span-12 lg:row-span-5"/);
  for(const slug of ["wellness","sporting","adventure","culture"])assert.match(home,new RegExp(`${slug}:\\{tile:\"(?:lg:|sm:col-span-2 lg:)`));
  assert.match(home,/lg:auto-rows-\[6\.5rem\] lg:grid-cols-12/);
  assert.match(home,/object-\[center_38%\]/);
  assert.doesNotMatch(home,/index===0\|\|index===5/);
});

test("catalogue and detail surfaces use image-led editorial composition",()=>{
  const listing=source("components/site/listing-page.tsx");
  const mediaCard=source("components/site/media-card.tsx");
  const destination=source("app/destinations/[slug]/page.tsx");
  const edition=source("app/discover/[slug]/page.tsx");
  const experiences=source("app/experiences/page.tsx");
  const experienceEditorial=source("features/experiences/experience-editorial.tsx");
  for(const code of [listing,destination,edition,experiences])assert.match(code,/bg-(?:forest|sand)|editorial|image-lift/);
  assert.match(listing,/lg:col-span-7/);
  assert.match(mediaCard,/onError=\{\(\)=>setImageFailed\(true\)\}/);
  assert.match(mediaCard,/Image awaiting review/);
  assert.match(destination,/divide-y divide-forest\/20/);
  assert.match(edition,/Edition highlights/);
  assert.match(experiences,/A considered collection/);
  assert.match(experienceEditorial,/roam ceylon recommended/);
  assert.match(experienceEditorial,/The Ceylon Edition Recommended/);
});

test("contact and Journal stay truthful while receiving editorial presentation",()=>{
  const contact=source("app/contact/page.tsx");
  const journal=source("app/blog/page.tsx");
  assert.match(contact,/approvedPublicContact/);
  assert.doesNotMatch(contact,/mailto:|business_email|enquiry_email|Private Limited|Pvt Ltd/i);
  assert.equal((contact.match(/rel="noopener noreferrer"/g)??[]).length,2);
  assert.match(journal,/Stories are being prepared with care/);
  assert.doesNotMatch(journal,/article|author|publishedAt|testimonial/i);
});

test("Batch 2 does not enter Journey Builder, Admin or compatibility contracts",()=>{
  const status=source("docs/cr2-batch-2-editorial-checkpoint.md");
  assert.match(status,/Journey Builder and Admin remain outside Batch 2/);
  const brand=source("lib/brand.ts");
  for(const key of ["roam-ceylon-journey-v3","roam-ceylon-journey-v2","roam-ceylon-quotation-handoff-v1","roam-ceylon-partner-draft"])assert.ok(brand.includes(key));
});
