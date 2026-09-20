import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import {brand,editionDisplayNames,legacyBrandCompatibility,publicBrandText} from "../lib/brand.ts";
import {experienceMerchandising,publicExperienceExcludedSlugs} from "../lib/experience-discovery.ts";
import {approvedPublicContact,journeyLaunchHref,publicNavigation} from "../lib/public-navigation.ts";

const source=(path:string)=>readFileSync(new URL(`../${path}`,import.meta.url),"utf8");

test("root layout keeps the skip target without claiming a global main landmark",()=>{
  const layout=source("app/layout.tsx");
  assert.match(layout,/<div id="content" tabIndex=\{-1\}>/);
  assert.doesNotMatch(layout,/<main id="content"/);
  assert.match(layout,/href="#content"/);
});

test("representative public surfaces own their primary landmark",()=>{
  for(const path of [
    "app/page.tsx",
    "app/about/page.tsx",
    "components/site/listing-page.tsx",
    "components/site/detail-page.tsx",
    "components/site/editorial-page.tsx",
    "features/experiences/experience-public-detail.tsx",
    "features/journey/journey-builder.tsx",
    "app/contact/page.tsx",
    "app/partners/page.tsx",
    "features/partners/partner-application-form.tsx",
    "app/blog/page.tsx",
    "app/not-found.tsx"
  ])assert.match(source(path),/<main\b/,`${path} must own a main landmark`);
});

test("public route-owned main landmarks do not reuse the skip-target id",()=>{
  const publicOwners=[
    "app/page.tsx","app/about/page.tsx","components/site/listing-page.tsx",
    "components/site/detail-page.tsx","components/site/editorial-page.tsx",
    "features/experiences/experience-public-detail.tsx","features/journey/journey-builder.tsx",
    "app/contact/page.tsx","app/partners/page.tsx","features/partners/partner-application-form.tsx",
    "app/partners/application-received/page.tsx","app/blog/page.tsx","app/not-found.tsx"
  ].map(source).join("\n");
  assert.doesNotMatch(publicOwners,/<main[^>]*id="content"/);
});

test("active brand and approved Edition mappings remain exact",()=>{
  assert.equal(brand.name,"The Ceylon Edition");
  assert.equal(brand.tagline,"Bespoke journeys through Sri Lanka.");
  assert.deepEqual(editionDisplayNames,{heritage:"Heritage Edition",wildlife:"Wild Edition",tropical:"Coastal Edition",adventure:"Adventure Edition",wellness:"Wellness Edition",nature:"Nature Edition",culture:"Cultural Edition",sporting:"Sporting Edition"});
});

test("managed public copy is presentation-normalized without touching compatibility identifiers",()=>{
  assert.equal(publicBrandText("Roam Ceylon confirms the details."),"The Ceylon Edition confirms the details.");
  assert.equal(publicBrandText("Roam Ceylon Atelier welcomes you."),"The Ceylon Edition welcomes you.");
  assert.equal(legacyBrandCompatibility.journeyStorageKey,"roam-ceylon-journey-v3");
  assert.match(source("features/experiences/experience-public-detail.tsx"),/publicBrandText/);
});

test("primary journey CTA and public navigation contracts stay consistent",()=>{
  assert.equal(brand.primaryCta,"Plan Your Journey");
  assert.equal(journeyLaunchHref,"/journey-builder?step=0");
  assert.deepEqual(publicNavigation.map(item=>item.label),["Editions","Destinations","Experiences","Our story"]);
  const shell=source("components/site/site-header.tsx")+source("components/site/site-footer.tsx");
  assert.match(shell,/brand\.primaryCta/);
});

test("mobile navigation retains dialog focus, Escape and close semantics",()=>{
  const header=source("components/site/site-header.tsx");
  const dialog=source("components/ui/dialog.tsx");
  assert.match(header,/DialogTrigger asChild/);
  assert.match(header,/DialogClose asChild/);
  assert.match(header,/onOpenChange=\{setOpen\}/);
  assert.match(dialog,/DialogPrimitive\.Content/);
  assert.match(dialog,/DialogPrimitive\.Close/);
});

test("footer exposes only verified contact channels and real editorial/legal routes",()=>{
  const footer=source("components/site/site-footer.tsx");
  assert.equal(approvedPublicContact.phone,"+94 78 799 7897");
  assert.equal(approvedPublicContact.whatsapp,"https://wa.me/message/G2QL7XFYJ5MAP1");
  assert.match(footer,/href:"\/blog"/);
  assert.match(footer,/href="\/privacy"/);
  assert.match(footer,/href="\/terms"/);
  assert.doesNotMatch(footer,/mailto:|hello@|info@/i);
  assert.doesNotMatch(footer,/private limited|pvt\.?\s+ltd/i);
});

test("public vocabulary aliases resolve to canonical active routes",()=>{
  assert.match(source("app/editions/page.tsx"),/permanentRedirect\("\/discover"\)/);
  assert.match(source("app/journal/page.tsx"),/permanentRedirect\("\/blog"\)/);
});

test("not-found is branded, navigable and retains the primary journey action",()=>{
  const notFound=source("app/not-found.tsx");
  assert.match(notFound,/The Ceylon Edition · 404/);
  assert.match(notFound,/journeyLaunchHref/);
  assert.match(notFound,/href="\/"/);
  assert.doesNotMatch(notFound,/Roam Ceylon|Private Limited|Pvt Ltd/i);
});

test("Batch 6 Experience exclusion and explicit merchandising stay intact",()=>{
  assert.deepEqual(publicExperienceExcludedSlugs,["cricket-with-local-players"]);
  assert.equal(experienceMerchandising.signature.slug,"yala-morning-and-evening-4x4-jeep-safaris-in-block-1-world-renowned-leopard-d");
  assert.match(source("lib/homepage-experience-curation.ts"),/publiclyDiscoverableExperiences/);
});

test("Journey Builder and proposal flow contracts remain present",()=>{
  assert.match(source("app/journey-builder/page.tsx"),/JourneyBuilder/);
  const builder=source("features/journey/journey-builder.tsx");
  const primitives=source("components/journey/journey-builder-primitives.tsx");
  assert.match(builder,/Request Journey Proposal/);
  assert.match(primitives,/sticky bottom-0 z-30 mt-12 flex w-full max-w-full/);
  assert.doesNotMatch(primitives,/sticky bottom-0[^"\n]*-mx-/);
  assert.match(source("app/api/enquiries/route.ts"),/enquir/i);
  assert.match(source("app/proposal/[token]/page.tsx"),/TravellerProposal/);
});

test("Partner application remains connected without Batch 7 submissions",()=>{
  assert.match(source("app/partners/apply/page.tsx"),/PartnerApplicationForm/);
  assert.match(source("features/partners/partner-application-form.tsx"),/onClick=\{\(\)=>void submit\(\)\}/);
});

test("public shell retains responsive breakpoints and accessible navigation labels",()=>{
  const header=source("components/site/site-header.tsx");
  const footer=source("components/site/site-footer.tsx");
  assert.match(header,/xl:hidden/);
  assert.match(header,/xl:flex/);
  assert.match(header,/aria-label="Primary"/);
  assert.match(header,/aria-label="Mobile primary"/);
  assert.match(footer,/sm:flex-row/);
  assert.match(footer,/aria-label="Footer"/);
  assert.match(footer,/aria-label="Legal"/);
});

test("Holding Mode and infrastructure contracts are outside the Batch 7 diff",()=>{
  const documentation=source("docs/cr2-batch-7-public-polish.md");
  assert.match(documentation,/Production Holding Mode are unchanged/);
  assert.match(documentation,/database schema, migrations, Storage paths/);
});
