import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

const source=(path:string)=>readFileSync(new URL(`../${path}`,import.meta.url),"utf8");

test("Batch 3 keeps every Journey Builder persistence and submission contract",()=>{
  const store=source("features/journey/journey-store.tsx");
  const persistence=source("lib/journey/journey-persistence.ts");
  const modal=source("features/journey/quotation-modal.tsx");
  const api=source("app/api/enquiries/route.ts");
  assert.match(persistence,/roam-ceylon-journey-v3/);
  assert.match(persistence,/roam-ceylon:journey-state/);
  assert.match(store,/mergeJourneyRestoreState/);
  assert.match(modal,/journeyHandoffToJson/);
  assert.match(modal,/POST/);
  assert.match(modal,/\/api\/enquiries/);
  assert.match(api,/journey_reference/);
  assert.match(api,/public_submission_key/);
});

test("Batch 3 presents an editorial chapter journey instead of technical wizard pills",()=>{
  const builder=source("features/journey/journey-builder.tsx");
  const primitives=source("components/journey/journey-builder-primitives.tsx");
  for(const primitive of ["JourneyOpening","JourneyProgress","JourneyChapter","JourneyNavigation"]){
    assert.match(builder,new RegExp(primitive));
    assert.match(primitives,new RegExp(`function ${primitive}`));
  }
  for(const phase of ["Inspire","Choose","Shape","Refine","Share"])assert.match(builder,new RegExp(phase));
  assert.match(primitives,/aria-label="Journey design progress"/);
  assert.match(primitives,/aria-current=\{active\?"step":undefined\}/);
  assert.match(primitives,/aria-live="polite"/);
  assert.match(primitives,/sticky bottom-0/);
});

test("Edition and destination choices remain native accessible multi-select buttons",()=>{
  const builder=source("features/journey/journey-builder.tsx");
  assert.match(builder,/type="button" aria-pressed=\{selected\}/);
  assert.match(builder,/const field=step===0\?"selectedThemeIds":"selectedDestinationIds"/);
  assert.match(builder,/editionDisplayName/);
  assert.match(builder,/SriLankaMap/);
});

test("submission success shows the returned reference without an unsupported response-time promise",()=>{
  const modal=source("features/journey/quotation-modal.tsx");
  assert.match(modal,/setReference\(typeof result\.reference==="string"\?result\.reference:""\)/);
  assert.match(modal,/Journey reference/);
  assert.doesNotMatch(modal,/within 24 hours/i);
  assert.match(modal,/No payment is taken when you share this request/);
});

test("responsive and reduced-motion foundations remain explicit",()=>{
  const primitives=source("components/journey/journey-builder-primitives.tsx");
  const globals=source("app/globals.css");
  assert.match(primitives,/overflow-x-auto/);
  assert.match(primitives,/sm:block/);
  assert.match(primitives,/md:grid-cols/);
  assert.match(globals,/prefers-reduced-motion:reduce/);
});

test("destination preferences use landscape editorial media and defer the side summary until wide screens",()=>{
  const builder=source("features/journey/journey-builder.tsx");
  assert.match(builder,/Destination \{String\(index\+1\)\.padStart\(2,"0"\)\}/);
  assert.match(builder,/aspect-\[16\/9\]/);
  assert.match(builder,/md:aspect-\[16\/7\]/);
  assert.match(builder,/quality=\{88\}/);
  assert.doesNotMatch(builder,/md:grid-cols-\[220px_1fr\]/);
  assert.match(builder,/xl:grid-cols-\[minmax\(0,1fr\)_minmax\(20rem,23rem\)\]/);
  assert.match(builder,/xl:sticky xl:top-28/);
});
