import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

const read=(path:string)=>readFileSync(new URL(path,import.meta.url),"utf8");

test("acceptance is an exact-token database transaction, not an ID-selected client update",()=>{
  const migration=read("../supabase/migrations/202608120006_proposal_acceptance_integrity.sql");
  const service=read("../lib/proposals/traveller-proposal-service.ts");
  const route=read("../app/api/proposals/[token]/route.ts");
  const acceptanceService=service.slice(service.indexOf("export async function acceptTravellerProposal"),service.indexOf("export async function requestTravellerChanges"));
  assert.match(migration,/where public_token=p_public_token/);
  assert.match(migration,/pg_advisory_xact_lock/);
  assert.match(acceptanceService,/p_public_token:token/);
  assert.doesNotMatch(acceptanceService,/p_proposal_id:proposal\.id/);
  assert.match(route,/\.strict\(\)/);
  assert.doesNotMatch(route,/proposalId|enquiryId|journeyId|sellingPrice|supplierCost/);
});

test("the database validates current version, approval, expiry, revocation and authoritative identity",()=>{
  const migration=read("../supabase/migrations/202608120006_proposal_acceptance_integrity.sql");
  for(const evidence of [
    /access_revoked_at is not null/,
    /valid_until<current_date/,
    /requires_new_version or proposal_row\.out_of_date_at is not null/,
    /status not in\('sent','viewed'\)/,
    /internally_approved_at is null/,
    /sent_at is null/,
    /select max\(candidate\.version\)/,
    /sent_snapshot#>>'\{traveller,email\}'/
  ])assert.match(migration,evidence);
});

test("commercial values are derived from and checked against the immutable sent proposal",()=>{
  const migration=read("../supabase/migrations/202608120006_proposal_acceptance_integrity.sql");
  assert.match(migration,/sent_snapshot#>'\{pricing,total\}'/);
  assert.match(migration,/snapshot_total is distinct from proposal_row\.total_selling_price/);
  assert.match(migration,/proposal_row\.total_selling_price,proposal_row\.currency/);
  assert.match(migration,/proposal_row\.commercial_snapshot='\{\}'::jsonb/);
  assert.match(migration,/journey_proposal_acceptances_immutable/);
  assert.match(migration,/journey_proposals_guard_accepted_agreement/);
});

test("acceptance side effects remain atomic and use the Phase 6 lifecycle command",()=>{
  const migration=read("../supabase/migrations/202608120006_proposal_acceptance_integrity.sql");
  const acceptanceInsert=migration.indexOf("insert into public.journey_proposal_acceptances");
  const proposalUpdate=migration.indexOf("update public.journey_proposals set",acceptanceInsert);
  const enquiryTransition=migration.indexOf("perform public.execute_enquiry_transition",proposalUpdate);
  assert.ok(acceptanceInsert>0&&proposalUpdate>acceptanceInsert&&enquiryTransition>proposalUpdate);
  assert.match(migration,/begin;/);
  assert.match(migration,/commit;/);
  assert.match(migration,/where id=proposal_row\.id and status in\('sent','viewed'\)/);
});

test("journey and account creation remain correctly outside proposal acceptance",()=>{
  const migration=read("../supabase/migrations/202608120006_proposal_acceptance_integrity.sql");
  const accounting=read("../lib/accounting/post-journey-account.ts");
  const phase8=read("../supabase/migrations/202608120007_accounting_integrity.sql");
  assert.doesNotMatch(migration,/insert into public\.curated_journeys/);
  assert.doesNotMatch(migration,/insert into public\.journey_accounts/);
  assert.match(accounting,/initialize_journey_account_command/);
  assert.match(phase8,/insert into public\.journey_accounts/);
  assert.match(phase8,/initial-deposit:/);
});
