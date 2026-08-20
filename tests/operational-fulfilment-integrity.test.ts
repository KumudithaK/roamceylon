import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

const migration=readFileSync("supabase/migrations/202608120010_operational_fulfilment_integrity.sql","utf8");
const lifecycleApi=readFileSync("app/api/admin/enquiry-lifecycle/route.ts","utf8");
const allocationApi=readFileSync("app/api/admin/journey-allocations/route.ts","utf8");

test("Phase 10 keeps enquiry lifecycle, accepted proposal and allocation as the execution authorities",()=>{
  assert.match(migration,/private\.accepted_operational_proposal/);
  assert.match(migration,/journey_proposal_acceptances/);
  assert.match(migration,/proposal_row\.curated_journey_id/);
  assert.match(migration,/proposal\.allocation_snapshot/);
  assert.match(migration,/Operational dates must match the accepted proposal/);
  assert.doesNotMatch(migration,/create table public\.operational_journeys/);
});

test("Phase 10 derives readiness and completion from authoritative relationships",()=>{
  assert.match(migration,/Every accepted supplier service must be confirmed and current before operational handover/);
  assert.match(migration,/An accepted supplier service does not belong to this journey/);
  assert.match(migration,/Every accepted supplier service must be fulfilled before journey completion/);
  assert.match(migration,/Operational lifecycle changes require the authoritative operational command/);
});

test("Phase 10 fulfilment is explicit, immutable, audited and replay-safe",()=>{
  assert.match(migration,/fulfil_supplier_allocation_command/);
  assert.match(migration,/fulfilment_status='fulfilled'/);
  assert.match(migration,/Fulfilled supplier evidence is immutable/);
  assert.match(migration,/journey_operational_command_receipts/);
  assert.match(migration,/pg_advisory_xact_lock/);
  assert.match(migration,/fulfilment_updated/);
});

test("Phase 10 operational commands are trusted-service and capability constrained",()=>{
  assert.match(migration,/auth\.role\(\)<>'service_role'/);
  assert.match(migration,/private\.staff_has_permission\(p_actor_id,'operations\.manage'\)/);
  assert.match(migration,/revoke all on function public\.execute_operational_journey_command/);
  assert.match(migration,/revoke all on function public\.fulfil_supplier_allocation_command/);
  assert.doesNotMatch(allocationApi,/from\("journey_supplier_allocations"\)\.update\(\{fulfilment_status/);
});

test("Phase 10 APIs whitelist operational command inputs",()=>{
  assert.match(lifecycleApi,/execute_operational_journey_command/);
  assert.match(allocationApi,/action:z\.literal\("fulfil"\)/);
  assert.match(allocationApi,/fulfil_supplier_allocation_command/);
  assert.match(allocationApi,/operations\.manage/);
  assert.doesNotMatch(allocationApi,/\.update\(await request\.json/);
});
