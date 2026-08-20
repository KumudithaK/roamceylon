import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import {fileMatchesDeclaredType,readBoundedJson,safeHttpUrlSchema} from "../lib/security/public-input.ts";

const enquiryApi=readFileSync("app/api/enquiries/route.ts","utf8");
const enquiryForm=readFileSync("features/contact/contact-form.tsx","utf8");
const quotationForm=readFileSync("features/journey/quotation-modal.tsx","utf8");
const partnerApi=readFileSync("app/api/partner-applications/route.ts","utf8");
const proposalApi=readFileSync("app/api/proposals/[token]/route.ts","utf8");
const migration=readFileSync("supabase/migrations/202608120013_public_api_boundary_integrity.sql","utf8");
const phase13Runner=readFileSync("scripts/run-isolated-phase13-public-api-boundary.sh","utf8");
const phase13Matrix=readFileSync("tests/phase13-public-api-boundary.mjs","utf8");

test("public enquiries use one strict privileged server boundary instead of anonymous table insert",()=>{
  assert.match(enquiryForm,/fetch\("\/api\/enquiries"/);assert.match(quotationForm,/fetch\("\/api\/enquiries"/);
  assert.doesNotMatch(enquiryForm,/from\("enquiries"\)\.insert/);assert.doesNotMatch(quotationForm,/from\("enquiries"\)\.insert/);
  assert.match(enquiryApi,/schema=z\.object[\s\S]*?\.strict\(\)/);assert.match(enquiryApi,/status:"new"/);assert.match(enquiryApi,/public_submission_hash/);
  assert.match(migration,/drop policy if exists enquiries_public_insert/);assert.match(migration,/revoke insert on public\.enquiries from anon,authenticated/);
});

test("public submission replay is payload-bound and authoritative fields are not accepted",()=>{
  assert.match(enquiryApi,/submissionKey:z\.uuid\(\)/);assert.match(enquiryApi,/publicSubmissionDigest/);assert.match(enquiryApi,/public_submission_key/);
  for(const field of ["internal_notes","assigned_to","approved_by","supplier_id","account_id","accepted_at"])assert.doesNotMatch(enquiryApi,new RegExp(`${field}:z\\.`));
  assert.match(partnerApi,/submissionKey:z\.uuid\(\)/);assert.match(partnerApi,/public_submission_hash/);assert.match(partnerApi,/status:"submitted"/);
});

test("bounded JSON rejects an oversized declared body and an oversized streamed body",async()=>{
  await assert.rejects(()=>readBoundedJson(new Request("http://local",{method:"POST",headers:{"content-length":"101"},body:"{}"}),100),/too large/i);
  await assert.rejects(()=>readBoundedJson(new Request("http://local",{method:"POST",body:JSON.stringify({value:"x".repeat(200)})}),100),/too large/i);
});

test("external URLs allow only http and https schemes",()=>{
  assert.equal(safeHttpUrlSchema.safeParse("https://example.com/path").success,true);
  assert.equal(safeHttpUrlSchema.safeParse("http://example.com").success,true);
  assert.equal(safeHttpUrlSchema.safeParse("javascript:alert(1)").success,false);
  assert.equal(safeHttpUrlSchema.safeParse("data:text/html,test").success,false);
});

test("upload MIME checks require matching file signatures",async()=>{
  assert.equal(await fileMatchesDeclaredType(new File([new Uint8Array([0xff,0xd8,0xff,0xd9])],"safe.jpg",{type:"image/jpeg"})),true);
  assert.equal(await fileMatchesDeclaredType(new File(["not an image"],"spoofed.jpg",{type:"image/jpeg"})),false);
  assert.match(partnerApi,/fileMatchesDeclaredType/);assert.match(partnerApi,/200\*1024\*1024/);
  assert.match(partnerApi,/replace\(\/\\\.\+\/g,"-"\)/);assert.doesNotMatch(partnerApi,/\[\^a-z0-9\._-\]/);
});

test("publicly rendered external links discard unsafe schemes",()=>{
  const links=readFileSync("app/contact/page.tsx","utf8"),helper=readFileSync("lib/security/safe-url.ts","utf8");
  assert.match(links,/safeExternalUrl/);assert.match(helper,/url\.protocol==="http:"\|\|url\.protocol==="https:"/);
});

test("proposal errors and public inputs fail closed without database message leakage",()=>{
  assert.match(proposalApi,/readBoundedJson\(request,16_000\)/);assert.match(proposalApi,/publicAttemptLimited/);
  assert.doesNotMatch(proposalApi,/error instanceof Error\?error\.message/);assert.match(proposalApi,/This proposal is unavailable/);
});

test("legacy authoritative boundaries remain command and capability based",()=>{
  const staff=readFileSync("lib/admin/authenticated-staff.ts","utf8"),acceptance=readFileSync("supabase/migrations/202608120006_proposal_acceptance_integrity.sql","utf8");
  assert.match(staff,/database\.auth\.getUser\(token\)/);assert.match(staff,/profile_staff_roles/);assert.doesNotMatch(staff,/profile\.role==="editor"/);
  assert.match(acceptance,/accept_journey_proposal_command/);assert.match(acceptance,/auth\.role\(\)<>'service_role'/);
});

test("Phase 13 regression gates use the real Phase 2 public interfaces",()=>{
  assert.doesNotMatch(phase13Runner,/to_regclass\('public\.published_content'\)/);
  for(const name of ["public_accommodations","public_vehicles","public_guides","website_public_settings"])assert.match(phase13Runner,new RegExp(name));
  assert.match(phase13Runner,/themes_public_read/);assert.match(phase13Runner,/forbidden private column/);
  assert.match(phase13Matrix,/anonymous\.from\("themes"\)[\s\S]*?eq\("status","published"\)[\s\S]*?eq\("active",true\)/);
  assert.doesNotMatch(phase13Matrix,/from\("published_content"\)/);
});

test("Phase 13 regression gates use the canonical Phase 5 purpose views and executable role boundaries",()=>{
  assert.doesNotMatch(phase13Runner,/traveller_supplier_context\(uuid\)/);
  for(const view of ["traveller_journey_design","traveller_operations_context","traveller_finance_reference","traveller_supplier_context","traveller_admin_full"])assert.match(phase13Runner,new RegExp(view));
  assert.match(phase13Runner,/authenticated complete enquiry base-row SELECT has been restored/);
  assert.match(phase13Runner,/supplier context exposes a forbidden identity, contact, note, or estimate field/);
  for(const role of ["journey_designer","partner_manager","finance","operations","content_marketing","super_admin"])assert.match(phase13Matrix,new RegExp(role));
  assert.match(phase13Matrix,/complete enquiry base row/);
  assert.match(phase13Matrix,/traveller_supplier_context/);
});

test("Phase 13 public proposal probes use a schema-valid sent snapshot and classify persisted effects",()=>{
  for(const field of ["generatedAt","proposalReference","brand","journey","destinations","days","stays","transport","guides","experiences","inclusions","exclusions","optionalItems","payment","importantInformation","nextSteps","contact"])assert.match(phase13Matrix,new RegExp(field));
  assert.match(phase13Matrix,/HTTP \$\{validProposal\.status\}; acceptance rows=/);
  assert.match(phase13Matrix,/HTTP \$\{acceptanceReplay\.status\}; acceptance rows=/);
  assert.match(phase13Matrix,/HTTP \$\{travellerSubstitution\.status\}; acceptance rows=/);
});
