import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

const source=(path:string)=>readFileSync(path,"utf8");
const page=source("app/partners/page.tsx");
const form=source("features/partners/partner-application-form.tsx");
const received=source("app/partners/application-received/page.tsx");
const api=source("app/api/partner-applications/route.ts");

test("partner page is editorial, truthful and connected to the public journey",()=>{
  assert.match(page,/Sri Lanka is experienced through people who know it well/);
  assert.match(page,/It is not a promise of work, publication, rates, availability or a commercial relationship/);
  assert.match(page,/listContent\("themes"\)/);
  assert.match(page,/listContent\("destinations"\)/);
  assert.match(page,/listContent\("experiences"\)/);
  assert.match(page,/editionDisplayName/);
  assert.match(page,/\/journey-builder\?step=0/);
  assert.match(page,/\/partners\/apply/);
  for(const unsupported of ["leading DMC","best DMC","award-winning","trusted by hundreds","guaranteed availability","qualified journey enquiries","long-term partnership"]){
    assert.doesNotMatch(page,new RegExp(unsupported,"i"));
  }
  assert.doesNotMatch(page,/\bThemes?\b/);
});

test("partner form preserves its contract while improving accessible validation",()=>{
  assert.match(form,/sessionStorage\.getItem\("roam-ceylon-partner-draft"\)/);
  assert.match(form,/fetch\("\/api\/partner-applications",\{method:"POST",body\}\)/);
  assert.match(form,/submissionKey\.current\?\?=crypto\.randomUUID\(\)/);
  assert.match(form,/role="alert" aria-live="assertive" tabIndex=\{-1\}/);
  assert.match(form,/if\(error\)errorRef\.current\?\.focus\(\)/);
  assert.match(form,/required=\{required\}/);
  assert.match(form,/Submit for manual review/);
  assert.match(form,/never creates a public listing, account or agreement automatically/);
  assert.doesNotMatch(form,/reply within|within \d+ hours|guaranteed|commission/i);
});

test("success view uses the authoritative server reference without overstating the outcome",()=>{
  assert.match(received,/query\.reference\|\|"Pending"/);
  assert.match(received,/does not create a listing, account, partnership or commercial agreement/);
  assert.doesNotMatch(received,/crypto\.randomUUID|Date\.now|booking confirmed|accepted partner/i);
});

test("server submission boundary, storage privacy and rollback architecture are unchanged",()=>{
  assert.match(api,/schema=z\.object\(/);
  assert.match(api,/\.strict\(\)/);
  assert.match(api,/publicSubmissionDigest/);
  assert.match(api,/public_submission_key:value\.submissionKey/);
  assert.match(api,/status:"submitted"/);
  assert.match(api,/partner-application-media/);
  assert.match(api,/partner-application-documents/);
  assert.match(api,/partner_application_files/);
  assert.match(api,/partner_application_history/);
  assert.match(api,/Promise\.all\(uploaded\.map/);
  assert.match(api,/partner_applications"\)\.delete\(\)\.eq\("id",application\.id\)/);
  assert.doesNotMatch(api,/resend|sendgrid|mailgun|webhook|analytics|gtag|posthog/i);
});
