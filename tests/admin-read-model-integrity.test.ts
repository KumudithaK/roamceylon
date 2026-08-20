import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

const migration=readFileSync("supabase/migrations/202608120011_admin_read_model_integrity.sql","utf8");
const dashboard=readFileSync("features/admin/dashboard.tsx","utf8");
const permissions=readFileSync("lib/admin/permissions.ts","utf8");

test("Phase 11 reconciles the evidence-backed staff journey summary contract",()=>{
  assert.match(migration,/create or replace view public\.staff_journey_request_summary/);
  assert.match(migration,/with \(security_barrier=true\)/);
  assert.match(migration,/traveller_name/);
  assert.match(migration,/traveller\.pii\.operations\.view/);
  assert.doesNotMatch(migration,/e\.email|e\.phone|e\.internal_notes|e\.trip_state/);
});

test("dashboard reads one capability-checked purpose projection instead of broad client tables",()=>{
  assert.match(dashboard,/rpc\("read_admin_dashboard"\)/);
  assert.doesNotMatch(dashboard,/from\("enquiries"\)|from\("partner_applications"\)|select\("\*"\)/);
  assert.match(dashboard,/No business totals have been substituted/);
  assert.match(permissions,/admin\.dashboard\.view/);
});

test("dashboard read RPC is role-aware, PII-minimized and parameter-free",()=>{
  assert.match(migration,/create or replace function public\.read_admin_dashboard\(\)/);
  assert.match(migration,/stable\s+security definer\s+set search_path=''/);
  for(const capability of ["journey.requests.view","cms.view","suppliers.view","finance.revenue.view","operations.view"])assert.match(migration,new RegExp(capability.replace(".","\\.")));
  assert.match(migration,/revoke all on function public\.read_admin_dashboard\(\) from public,anon/);
  assert.doesNotMatch(migration,/traveller_email|supplier_contact|licence_number|application_data/);
});

test("commercial, accounting and operational aggregates retain authoritative sources",()=>{
  assert.match(migration,/from public\.journey_proposals p/);
  assert.match(migration,/p\.total_selling_price/);
  assert.match(migration,/from public\.journey_accounts a/);
  assert.match(migration,/a\.amount_received/);
  assert.match(migration,/a\.amount_refunded/);
  assert.match(migration,/a\.supplier_paid/);
  assert.match(migration,/allocation\.fulfilment_status='fulfilled'/);
  assert.doesNotMatch(migration,/create table public\.admin_dashboard/);
});

test("dashboard contract exposes no caller-controlled IDs, filters, sorting or SQL",()=>{
  const signature=migration.match(/create or replace function public\.read_admin_dashboard\(([^)]*)\)/)?.[1];
  assert.equal(signature,"");
  assert.doesNotMatch(migration,/execute format|dynamic sql|p_enquiry_id|p_account_id|p_supplier_id|p_sort/);
});
