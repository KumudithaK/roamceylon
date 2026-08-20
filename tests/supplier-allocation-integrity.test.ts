import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

const migration=readFileSync(new URL("../supabase/migrations/202608120008_supplier_allocation_integrity.sql",import.meta.url),"utf8");
const api=readFileSync(new URL("../app/api/admin/journey-allocations/route.ts",import.meta.url),"utf8");

test("Phase 9 allocation writes use guarded commands instead of generic DML",()=>{
  assert.match(api,/save_supplier_allocations_command/);
  assert.match(api,/transition_supplier_allocation_command/);
  assert.doesNotMatch(api,/from\("journey_supplier_allocations"\)\.insert\(/);
  assert.doesNotMatch(api,/from\("journey_supplier_allocations"\)\.update\(/);
  assert.match(migration,/revoke insert,update,delete on public\.journey_supplier_allocations from authenticated/);
  assert.match(migration,/Supplier allocation changes require an explicit authorised command/);
});

test("Phase 9 validates authoritative journey, service, rate and settlement relationships",()=>{
  assert.match(migration,/The Curated Journey does not belong to this enquiry/);
  assert.match(migration,/The supplier allocation destination is not required by this journey/);
  assert.match(migration,/The experience is not required at the allocated destination/);
  assert.match(migration,/The transport allocation is not a current journey leg/);
  assert.match(migration,/The selected catalogue rate does not belong to this supplier service/);
  assert.match(migration,/commercial snapshot does not match the authoritative catalogue rate/);
  assert.match(migration,/settlement allocation does not belong to this journey account/);
  assert.match(migration,/preferred benefit allocation does not belong to this journey/);
});

test("Phase 9 preserves lifecycle, accepted-commercial and audit invariants",()=>{
  assert.match(migration,/A confirmed supplier allocation cannot return to pending/);
  assert.match(migration,/Accepted proposal supplier allocations are immutable/);
  assert.match(migration,/Finance must resolve supplier activity before this allocation can be cancelled/);
  assert.match(migration,/journey_supplier_allocation_history/);
  assert.match(migration,/supplier_allocation_command_receipts/);
  assert.match(migration,/pg_advisory_xact_lock/);
  assert.match(migration,/idempotent/);
});

test("Phase 9 keeps Operations separate from supplier commercial authority",()=>{
  assert.match(migration,/update_supplier_fulfilment_command/);
  assert.match(migration,/private\.staff_has_permission\(p_actor_id,'operations\.manage'\)/);
  assert.match(migration,/Only a confirmed supplier allocation can enter operational fulfilment/);
  assert.match(migration,/private\.staff_has_permission\(p_actor_id,'suppliers\.allocate'\)/);
});
