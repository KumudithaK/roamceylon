import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

const migration=readFileSync("supabase/migrations/202608120012_partner_onboarding_integrity.sql","utf8");
const submission=readFileSync("app/api/partner-applications/route.ts","utf8");
const reviewApi=readFileSync("app/api/admin/partner-applications/[id]/review/route.ts","utf8");
const conversionApi=readFileSync("app/api/admin/partner-applications/[id]/convert/route.ts","utf8");
const reviewUi=readFileSync("features/admin/partner-application-review.tsx","utf8");

test("public partner submission has an explicit input boundary and fixed lifecycle state",()=>{
  assert.match(submission,/publicApplicationData/);
  assert.match(submission,/authoritativeKeys/);
  assert.match(submission,/status:"submitted"/);
  assert.doesNotMatch(submission,/\.insert\(value\.applicationData\)|\.insert\(parsed\.data\)/);
});

test("review and conversion APIs use capability-checked authoritative commands",()=>{
  assert.match(reviewApi,/authenticatedStaff\(request,"suppliers\.manage"\)/);
  assert.match(reviewApi,/review_partner_application_command/);
  assert.match(conversionApi,/convert_partner_application_command/);
  assert.doesNotMatch(reviewApi,/from\("partner_applications"\)\.update/);
  assert.doesNotMatch(conversionApi,/from\("accommodations"\)\.insert|from\("vehicles"\)\.insert|from\("guides"\)\.insert/);
  assert.doesNotMatch(reviewUi,/from\("partner_applications"\)\.update|partner_application_history"\)\.insert/);
});

test("database commands enforce capability, lifecycle, replay and atomic catalogue provenance",()=>{
  assert.match(migration,/private\.staff_has_permission\(p_actor_id,'suppliers\.manage'\)/);
  assert.match(migration,/pg_advisory_xact_lock/);
  assert.match(migration,/partner_onboarding_command_receipts/);
  assert.match(migration,/The partner application transition is not valid from its current state/);
  assert.match(migration,/The requested catalogue type does not match the application/);
  assert.match(migration,/'status','converted'/);
  assert.match(migration,/onboarding_application_id/);
  assert.match(migration,/status,active,verified,featured,onboarding_application_id/);
  assert.match(migration,/'draft',false,false,false,application\.id/);
});

test("approved evidence and direct lifecycle mutation are protected",()=>{
  assert.match(migration,/Approved partner application evidence is immutable/);
  assert.match(migration,/Partner application changes require the authoritative onboarding command/);
  assert.match(migration,/Partner review history is append-only/);
  assert.match(migration,/revoke insert,update,delete on public\.partner_applications,public\.partner_application_files,public\.partner_application_history from authenticated/);
});

test("private onboarding evidence is limited to supplier managers",()=>{
  assert.match(migration,/partner_applications_reviewer_read/);
  assert.match(migration,/partner_files_reviewer_read/);
  assert.match(migration,/partner_storage_reviewer_read/);
  assert.match(migration,/private\.has_permission\('suppliers\.manage'\)/);
  assert.doesNotMatch(migration,/partner_storage_reviewer_read[\s\S]{0,200}suppliers\.view/);
});

test("Phase 9 allocation checks application-backed supplier eligibility",()=>{
  assert.match(migration,/supplier_is_onboarding_eligible/);
  assert.match(migration,/application\.status='converted'/);
  assert.match(migration,/The supplier is not eligible for journey allocation/);
  assert.match(migration,/journey_supplier_onboarding_eligibility/);
});
