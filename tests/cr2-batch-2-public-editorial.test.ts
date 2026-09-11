import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import path from "node:path";
import test from "node:test";

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
  assert.match(home,/experiences\.slice/);
  assert.doesNotMatch(home,/Something Extraordinary is Coming|testimonial|award-winning/i);
});

test("catalogue and detail surfaces use image-led editorial composition",()=>{
  const listing=source("components/site/listing-page.tsx");
  const destination=source("app/destinations/[slug]/page.tsx");
  const edition=source("app/discover/[slug]/page.tsx");
  const experiences=source("app/experiences/page.tsx");
  for(const code of [listing,destination,edition,experiences])assert.match(code,/bg-(?:forest|sand)|editorial|image-lift/);
  assert.match(listing,/lg:col-span-7/);
  assert.match(destination,/divide-y divide-forest\/20/);
  assert.match(edition,/Edition highlights/);
  assert.match(experiences,/A considered collection/);
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
