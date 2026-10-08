import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

const read=(path:string)=>readFileSync(new URL(path,import.meta.url),"utf8");
const migration=read("../supabase/migrations/202610010001_cr7_accepted_journey_integrity.sql");
const proposalService=read("../lib/proposals/journey-proposal-service.ts");
const proposalWorkspace=read("../features/admin/journey-lifecycle-workspace.tsx");

test("accepted curated itinerary and supplier scope cannot silently drift",()=>{
  assert.match(migration,/before update of itinerary on public\.curated_journeys/);
  assert.match(migration,/before insert on public\.journey_supplier_allocations/);
  assert.match(migration,/before insert on public\.journey_proposals/);
  assert.match(migration,/join public\.journey_proposal_acceptances acceptance/);
  assert.match(migration,/An accepted journey itinerary cannot be changed/);
  assert.match(migration,/An accepted journey cannot gain a supplier service/);
  assert.match(migration,/An accepted journey cannot gain a new proposal/);
  assert.match(proposalService,/if\(acceptedCount\)throw new ProposalError\("INCOMPLETE"/);
  assert.match(proposalWorkspace,/open&&!accepted/);
  assert.doesNotMatch(migration,/delete from public\./i);
});

test("operations use accepted design dates and pax, not the immutable original request",()=>{
  const readiness=migration.slice(migration.indexOf("create or replace function private.assert_journey_operational_readiness"));
  assert.match(readiness,/proposal_row\.sent_snapshot#>>'\{journey,startDate\}'/);
  assert.match(readiness,/proposal_row\.sent_snapshot#>>'\{journey,endDate\}'/);
  assert.match(readiness,/proposal_row\.curated_journey_snapshot is distinct from curated_row\.itinerary/);
  assert.match(readiness,/Operational traveller counts must match the accepted proposal/);
  assert.match(readiness,/Every accepted supplier service must be confirmed and current before operational handover/);
  assert.doesNotMatch(readiness,/enquiry_row\.travel_(start|end)_date/);
});

test("migration is transactional and does not broaden command execution",()=>{
  assert.match(migration,/^begin;/);
  assert.match(migration,/commit;\s*$/);
  assert.match(migration,/revoke all on function private\.assert_journey_operational_readiness\(uuid\) from public,anon,authenticated/);
  assert.doesNotMatch(migration,/grant execute .* to anon|grant execute .* to authenticated/i);
});
