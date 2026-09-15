import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

const source=(path:string)=>readFileSync(new URL(`../${path}`,import.meta.url),"utf8");

test("Batch 4 preserves the established public enquiry and journey handoff contracts",()=>{
  const modal=source("features/journey/quotation-modal.tsx");
  const api=source("app/api/enquiries/route.ts");
  const handoff=source("lib/journey/quotation-handoff.ts");
  assert.match(modal,/fetch\("\/api\/enquiries"/);
  assert.match(modal,/source:"journey_builder"/);
  for(const field of ["selectedThemeIds","selectedDestinationIds","selectedExperienceIds","experienceParticipants","selectedStayIds","selectedVehicleId","selectedGuideId"]){
    assert.match(modal,new RegExp(field));
  }
  assert.match(modal,/journeyHandoffToJson\(handoff\)/);
  assert.match(handoff,/quotationHandoffKey="roam-ceylon-quotation-handoff-v1"/);
  assert.match(api,/public_submission_key/);
  assert.match(api,/journey_reference/);
  assert.match(api,/status:"new"/);
});

test("contact collection is minimal and completed journey dates remain authoritative",()=>{
  const modal=source("features/journey/quotation-modal.tsx");
  assert.match(modal,/name:z\.string\(\)\.trim\(\)\.min\(2/);
  assert.match(modal,/email:z\.email/);
  assert.match(modal,/phone:z\.string\(\)\.trim/);
  assert.match(modal,/Phone \/ WhatsApp[\s\S]*?help="Optional"/);
  assert.match(modal,/Country[\s\S]*?help="Optional"/);
  assert.match(modal,/Anything you would like us to consider\?[\s\S]*?help="Optional/);
  assert.doesNotMatch(modal,/register\("arrival"\)/);
  assert.doesNotMatch(modal,/register\("departure"\)/);
  assert.match(modal,/travelStartDate:state\.travelDates\.start\|\|null/);
  assert.match(modal,/travelEndDate:state\.travelDates\.end\|\|null/);
});

test("validation, failure and submission states are accessible and retain the journey",()=>{
  const modal=source("features/journey/quotation-modal.tsx");
  assert.match(modal,/FormField label="Full name" required error=\{errors\.name\?\.message\}/);
  assert.match(modal,/FormField label="Email address" required error=\{errors\.email\?\.message\}/);
  assert.match(modal,/role="alert"/);
  assert.match(modal,/submitErrorRef\.current\?\.focus\(\)/);
  assert.match(modal,/Your request was not sent\. Your journey remains available/);
  assert.match(modal,/disabled=\{isSubmitting\|\|!submissionKey\}/);
  assert.match(modal,/aria-busy=\{isSubmitting\}/);
  assert.match(modal,/setSubmissionKey\(crypto\.randomUUID\(\)\)/);
  assert.doesNotMatch(modal,/onSubmitted\(\)[\s\S]*?if\(!response\.ok\)/);
});

test("idempotent retry and duplicate-click protections remain layered",()=>{
  const modal=source("features/journey/quotation-modal.tsx");
  const api=source("app/api/enquiries/route.ts");
  const migration=source("supabase/migrations/202608120013_public_api_boundary_integrity.sql");
  assert.match(modal,/submissionKey,/);
  assert.match(modal,/disabled=\{isSubmitting\|\|!submissionKey\}/);
  assert.match(api,/publicSubmissionDigest/);
  assert.match(api,/replayed:true/);
  assert.match(api,/status:409/);
  assert.match(migration,/enquiries_public_submission_key_unique/);
});

test("the editorial dialog supplies focus containment, restoration and responsive composition",()=>{
  const modal=source("features/journey/quotation-modal.tsx");
  assert.match(modal,/@radix-ui\/react-dialog/);
  assert.match(modal,/DialogPrimitive\.Root/);
  assert.match(modal,/DialogPrimitive\.Title/);
  assert.match(modal,/DialogPrimitive\.Description/);
  assert.match(modal,/onOpenAutoFocus/);
  assert.match(modal,/returnFocusRef\.current=document\.activeElement/);
  assert.match(modal,/onCloseAutoFocus/);
  assert.match(modal,/returnFocusRef\.current\?\.focus\(\)/);
  assert.match(modal,/setFocus\("name"\)/);
  assert.match(modal,/successRef\.current\?\.focus\(\)/);
  assert.match(modal,/max-h-\[calc\(100dvh-1rem\)\]/);
  assert.match(modal,/lg:grid-cols-/);
  assert.match(modal,/w-full sm:w-auto/);
});

test("journey context and truthful tailored pricing remain visible at the handoff",()=>{
  const modal=source("features/journey/quotation-modal.tsx");
  assert.match(modal,/ContextLine label="Editions"/);
  assert.match(modal,/ContextLine label="Route"/);
  assert.match(modal,/ContextLine label="Dates"/);
  assert.match(modal,/ContextLine label="Travellers"/);
  assert.match(modal,/ContextLine label="Selected moments"/);
  assert.match(modal,/ContextLine label="Planning range"/);
  assert.match(modal,/Taking shape — to be reviewed with your request/);
  assert.doesNotMatch(modal,/hardcoded price|within 24 hours|guaranteed availability/i);
});

test("success uses only the server reference and makes no booking or response-time promise",()=>{
  const modal=source("features/journey/quotation-modal.tsx");
  assert.match(modal,/setReference\(typeof result\.reference==="string"\?result\.reference:""\)/);
  assert.match(modal,/Journey reference/);
  assert.match(modal,/No booking, payment or availability has been confirmed/);
  assert.doesNotMatch(modal,/within 24 hours|confirmed booking|guaranteed quotation/i);
  assert.doesNotMatch(modal,/searchParams|URLSearchParams|window\.location/);
});

test("the server boundary remains strict, bounded and anonymous-abuse aware",()=>{
  const api=source("app/api/enquiries/route.ts");
  assert.match(api,/readBoundedJson\(request,160_000\)/);
  assert.match(api,/honeypot:z\.literal\(""\)/);
  assert.match(api,/publicAttemptLimited\("enquiry",value\.email,5,60\*60\*1000\)/);
  assert.match(api,/schema\.safeParse/);
  assert.match(api,/createAdminClient/);
  assert.doesNotMatch(api,/sendEmail|resend|webhook|analytics|track\(/i);
});

test("Admin enquiry and Journey Studio readers continue to consume the established record",()=>{
  const inbox=source("features/admin/enquiry-inbox.tsx");
  const review=source("features/admin/enquiry-review.tsx");
  const studio=source("app/api/admin/journey-studio/route.ts");
  assert.match(inbox,/staff_journey_request_summary/);
  assert.match(review,/enquiry\.email/);
  assert.match(studio,/parseJourneyHandoff\(enquiry\.trip_state\)/);
  assert.match(studio,/database\.from\("enquiries"\)/);
  assert.match(studio,/database\.from\("curated_journeys"\)/);
});
