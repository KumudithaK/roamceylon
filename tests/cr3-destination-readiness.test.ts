import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import {publicExperienceExcludedSlugs} from "../lib/experience-discovery.ts";

const source=(path:string)=>readFileSync(new URL(`../${path}`,import.meta.url),"utf8");

test("destination catalogue remains database-backed and published-only",()=>{
  const data=source("lib/data.ts");
  const listing=source("app/destinations/page.tsx");
  assert.match(data,/from\(kind\)\.select\("\*"\)\.eq\("status","published"\)\.eq\("active",true\)/);
  assert.match(listing,/listContent\("destinations"\)/);
  assert.doesNotMatch(listing,/const\s+destinations\s*=\s*\[/);
});

test("destination detail preserves canonical slugs and useful journey context",()=>{
  const detail=source("app/destinations/[slug]/page.tsx");
  assert.match(detail,/destination\.slug===slug/);
  assert.match(detail,/alternates:\{canonical:`\/destinations\/\$\{item\.slug\}`\}/);
  assert.match(detail,/editionDisplayName\(theme\)/);
  assert.match(detail,/Experiences in \$\{item\.name\}/);
  assert.match(detail,/Place \{item\.name\} on your route\./);
  assert.match(detail,/journey-builder\?themes=\$\{item\.themeIds\.join\(","\)\}&destination=\$\{item\.id\}&step=1/);
});

test("Journey Builder only receives published Edition-linked destinations",()=>{
  const repository=source("lib/repositories/content.ts");
  const service=source("lib/journey/journey-service.ts");
  assert.match(repository,/Read linked published destinations/);
  assert.match(repository,/\.eq\("status","published"\)\.eq\("active",true\)\.in\("id",ids\)/);
  assert.match(service,/destinations\.getByThemeIds\(themes\.map\(item=>item\.id\)\)/);
});

test("destination Experience discovery keeps the established cricket exclusion",()=>{
  const service=source("lib/journey/journey-service.ts");
  assert.deepEqual(publicExperienceExcludedSlugs,["cricket-with-local-players"]);
  assert.match(service,/publiclyDiscoverableExperiences\(await this\.experiences\.getByDestinationIds/);
});

test("destination surfaces retain responsive contracts and current public brand",()=>{
  const publicDestination=[
    source("app/destinations/page.tsx"),
    source("app/destinations/[slug]/page.tsx"),
    source("components/site/listing-page.tsx")
  ].join("\n");
  assert.match(publicDestination,/md:grid-cols|xl:grid-cols/);
  assert.doesNotMatch(publicDestination,/Roam Ceylon|Private Limited|Pvt Ltd/i);
  assert.doesNotMatch(publicDestination,/mailto:/i);
});

test("CR3 audit records the intentional staging catalogue and its deferrals",()=>{
  const audit=source("docs/cr3-destination-readiness.md");
  assert.match(audit,/32 destination records/);
  assert.match(audit,/29 published and active/);
  assert.match(audit,/3 archived and inactive/);
  assert.match(audit,/CR4 owns individual Experience commercial-readiness issues/);
  assert.match(audit,/CR5 owns accommodation catalogue readiness/);
  assert.match(audit,/No opening hours, fees, travel times, availability, or supplier\s+commitments are introduced/i);
});
