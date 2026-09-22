import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

const source=(path:string)=>readFileSync(path,"utf8");
const overview=source("docs/cr5-supplier-network-readiness.md");
const accommodation=source("docs/cr5-accommodation-coverage-matrix.md");
const experience=source("docs/cr5-experience-provider-confirmation.md");
const acquisition=source("docs/cr5-supplier-acquisition-plan.md");
const submission=source("app/api/partner-applications/route.ts");
const onboarding=source("supabase/migrations/202608120012_partner_onboarding_integrity.sql");
const capability=source("supabase/migrations/202608120003_capability_rls_storage_cutover.sql");
const journey=source("features/journey/journey-builder.tsx");
const persistence=source("features/journey/journey-store.tsx");
const cr4=source("docs/cr4-experience-readiness.md");

test("CR5 records sample inventory as non-commercial capability",()=>{
  assert.match(overview,/Accommodations \| 10 \| 0 \| DEMO \/ SEED/);
  assert.match(overview,/Vehicles \| 10 \| 0 \| DEMO \/ SEED/);
  assert.match(overview,/Guides \| 6 \| 0 \| DEMO \/ SEED/);
  assert.match(overview,/public supplier projections return zero rows/);
  assert.doesNotMatch(overview,/current (?:accommodations|vehicles|guides) are verified/i);
});

test("CR5 preserves both controlled Batch 5 applications as submitted fixtures",()=>{
  for(const reference of ["RC-20260916-50681C","RC-20260916-3760D7"]){
    assert.match(overview,new RegExp(reference));
  }
  assert.match(overview,/remain the authoritative fixtures/);
  assert.match(overview,/None may be approved, rejected, converted or deleted/);
});

test("the accommodation matrix covers every active CR3 destination without invented verified supply",()=>{
  const rows=accommodation.split("\n").filter(line=>/^\| [^|-].*\|$/.test(line)&&!line.startsWith("| Destination |"));
  assert.equal(rows.length,29);
  assert.equal((accommodation.match(/\| 0 \|/g)??[]).length,29);
  assert.match(accommodation,/verified coverage is\s+zero across all 29 active destinations/);
});

test("all CR4 questionable and held decisions receive evidence requirements",()=>{
  const questionable=(cr4.match(/\| QUESTIONABLE \|/g)??[]).length;
  const held=(cr4.match(/\| HOLD \/ EXCLUDE \|/g)??[]).length;
  assert.equal(questionable,16);
  assert.equal(held,7);
  const questionableMatrix=experience.split("## Sixteen QUESTIONABLE Experiences")[1].split("## Seven held Experiences")[0];
  const heldMatrix=experience.split("## Seven held Experiences")[1].split("## Sixty-one MINOR FIX dependencies")[0];
  assert.equal((questionableMatrix.match(/^\| [^|-].*\|$/gm)??[]).filter(line=>!line.startsWith("| Experience |")).length,16);
  assert.equal((heldMatrix.match(/^\| [^|-].*\|$/gm)??[]).filter(line=>!line.startsWith("| Held Experience |")).length,7);
  assert.match(experience,/All seven remain excluded from ordinary discovery/);
  assert.match(experience,/zero guide-to-Experience links/);
});

test("public partner submission and onboarding remain bounded and fail-closed",()=>{
  assert.match(submission,/authoritativeKeys/);
  assert.match(submission,/fileMatchesDeclaredType/);
  assert.match(submission,/upsert:false/);
  assert.match(onboarding,/Only an approved partner application can become a catalogue record/);
  assert.match(onboarding,/'draft',false,false,false,application\.id/);
  assert.match(onboarding,/Partner review history is append-only/);
});

test("private supplier evidence stays behind supplier-manager capability",()=>{
  assert.match(onboarding,/partner_storage_reviewer_read/);
  assert.match(onboarding,/private\.has_permission\('suppliers\.manage'\)/);
  assert.match(capability,/partner-application-media','partner-application-documents/);
  assert.doesNotMatch(submission,/getPublicUrl/);
});

test("Journey Builder continues to capture stay preference rather than a supplier choice",()=>{
  assert.match(journey,/Stay preference/);
  assert.match(journey,/stayPreferenceOptions/);
  assert.match(persistence,/selectedStayIdsByDestination:\{\}/);
  assert.match(overview,/Actual stay selection remains an internal Journey Studio allocation decision/);
});

test("founder plan separates supplier inputs from CR6 pricing decisions",()=>{
  assert.match(acquisition,/P0 — required for controlled launch/);
  assert.match(acquisition,/P1 — expand after the first routes are reliable/);
  assert.match(acquisition,/P2 — network depth/);
  assert.match(acquisition,/CR6 owns markup, margins, selling price, deposits, payment schedules and finance/);
  assert.match(acquisition,/LEGAL\s+VERIFICATION REQUIRED/);
});
