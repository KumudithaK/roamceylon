import assert from "node:assert/strict";
import {existsSync,readFileSync} from "node:fs";
import test from "node:test";
import {brand,editionDisplayName,editionDisplayNames,legacyBrandCompatibility} from "../lib/brand.ts";

const root=new URL("../",import.meta.url);
const source=(path:string)=>readFileSync(new URL(path,root),"utf8");

test("central presentation configuration defines the approved public brand",()=>{
  assert.deepEqual(brand,{
    name:"The Ceylon Edition",
    wordmark:"THE CEYLON EDITION",
    tagline:"Bespoke journeys through Sri Lanka.",
    canonicalUrl:"https://theceylonedition.com",
    primaryCta:"Plan Your Journey",
    journalName:"The Ceylon Journal"
  });
});

test("the approved eight technical theme slugs map to their exact Edition labels",()=>{
  assert.deepEqual(editionDisplayNames,{
    heritage:"Heritage Edition",
    wildlife:"Wild Edition",
    tropical:"Coastal Edition",
    adventure:"Adventure Edition",
    wellness:"Wellness Edition",
    nature:"Nature Edition",
    culture:"Cultural Edition",
    sporting:"Sporting Edition"
  });
  assert.equal(editionDisplayName({slug:"heritage",name:"Timeless Heritage"}),"Heritage Edition");
  assert.equal(editionDisplayName({id:"wildlife",name:"Wild Encounters"}),"Wild Edition");
  assert.equal(editionDisplayName({slug:"future-theme",name:"Future Theme"}),"Future Theme");
});

test("Edition presentation preserves journey persistence and handoff compatibility keys",()=>{
  const persistence=source("lib/journey/journey-persistence.ts");
  const handoff=source("lib/journey/quotation-handoff.ts");
  assert.match(persistence,new RegExp(`journeyStorageKey="${legacyBrandCompatibility.journeyStorageKey}"`));
  assert.match(persistence,/journeyStateEvent="roam-ceylon:journey-state"/);
  assert.match(handoff,new RegExp(`quotationHandoffKey="${legacyBrandCompatibility.quotationHandoffKey}"`));
  assert.match(handoff,new RegExp(`localStorage\\.getItem\\("${legacyBrandCompatibility.legacyJourneyStorageKey}"\\)`));
  assert.equal(legacyBrandCompatibility.legacyJourneyStorageKey,"roam-ceylon-journey-v2");
  assert.equal(legacyBrandCompatibility.partnerDraftKey,"roam-ceylon-partner-draft");
  assert.match(source("features/partners/partner-application-form.tsx"),/sessionStorage\.getItem\("roam-ceylon-partner-draft"\)/);
});

test("Edition presentation preserves theme state, query and enquiry payload contracts",()=>{
  const builder=source("features/journey/journey-builder.tsx");
  const page=source("app/journey-builder/page.tsx");
  const search=source("components/home/journey-search.tsx");
  const enquiryRoute=source("app/api/enquiries/route.ts");
  assert.match(builder,/selectedThemeIds/);
  assert.doesNotMatch(builder,/selectedEditionIds/);
  assert.match(page,/theme\?:string;themes\?:string/);
  assert.match(page,/themeId:query\.theme,themeIds:query\.themes/);
  assert.match(search,/name="theme"/);
  assert.match(search,/journey-builder\?theme=/);
  assert.match(enquiryRoute,/selectedThemeIds/);
  assert.match(enquiryRoute,/selected_themes/);
});

test("technical routes and internal benefit codes remain unchanged",()=>{
  for(const path of ["app/blog/page.tsx","app/discover/page.tsx","app/discover/[slug]/page.tsx","app/journey-builder/page.tsx"]){
    assert.equal(existsSync(new URL(path,root)),true,path);
  }
  const benefits=source("lib/benefits/preferred-benefits.ts");
  assert.match(benefits,/guaranteed_by_roam_ceylon/);
  const migration=source("supabase/migrations/202608110002_preferred_benefits_and_privileges.sql");
  for(const code of ["roam_ceylon","roam_ceylon_complimentary","roam_ceylon_service_benefit","guaranteed_by_roam_ceylon"]){
    assert.match(migration,new RegExp(code));
  }
});

test("new journey and proposal documents use presentation branding without rewriting snapshot identity",()=>{
  const journeyPdf=source("lib/journey/export-journey-pdf.ts");
  const proposalComposer=source("lib/proposals/customer-proposal.ts");
  const proposalDocument=source("components/proposal/proposal-document.tsx");
  const proposalPdf=source("lib/proposals/export-proposal-pdf.ts");
  assert.match(journeyPdf,/the-ceylon-edition-personal-journey\.pdf/);
  assert.match(journeyPdf,/drawListSection\("Editions",details\.themes\)/);
  assert.match(proposalComposer,/brand:\{name:brand\.name,line:brand\.tagline,logo:""\}/);
  assert.match(proposalDocument,/snapshot\.brand\.logo\?/);
  assert.match(proposalDocument,/snapshot\.brand\.name/);
  assert.match(proposalPdf,/snapshot\.brand\.name/);
});

test("application-owned external identification uses the new brand and canonical domain",()=>{
  const weather=source("lib/weather/met-norway.ts");
  assert.match(weather,/TheCeylonEdition\/2\.0/);
  assert.match(weather,/https:\/\/theceylonedition\.com/);
  assert.doesNotMatch(weather,/@theceylonedition\.com/);
});

test("active public and proposal presentation makes no incorporated-company claim",()=>{
  const activePresentation=[
    "app/about/page.tsx",
    "features/about/about-page.tsx",
    "lib/proposals/customer-proposal.ts",
    "components/proposal/proposal-document.tsx",
    "lib/proposals/export-proposal-pdf.ts"
  ];
  const incorporatedClaim=/Roam Ceylon Atelier|The Ceylon Edition\s*\((?:Private|Pvt)\)\s*(?:Limited|Ltd)|\bPrivate Limited\b|\b\(Pvt\) Ltd\b/i;
  for(const path of activePresentation){
    assert.doesNotMatch(source(path),incorporatedClaim,path);
  }

  const aboutMetadata=source("app/about/page.tsx");
  assert.doesNotMatch(aboutMetadata,/legalName\s*:/);
  assert.doesNotMatch(aboutMetadata,/"PostalAddress"/);
  assert.doesNotMatch(aboutMetadata,/Destination Management Company/);

  const aboutPage=source("features/about/about-page.tsx");
  assert.match(aboutPage,/Brand information/);
  assert.doesNotMatch(aboutPage,/\["Legal entity"/);
});

test("active About fallback uses the approved public contact number",()=>{
  const aboutPage=source("app/about/page.tsx");
  assert.match(aboutPage,/telephone:"\+94 78 799 7897"/);
  assert.doesNotMatch(aboutPage,/\+94 71 307 7989/);
});
