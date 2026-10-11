import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

const migration=readFileSync("supabase/migrations/202610090001_cr7_finance_constraint_boundary.sql","utf8");
const cr6=readFileSync("supabase/migrations/202609230001_cr6_cent_precision.sql","utf8");

test("finance constraint wrapper stays outside the Data API and private schema",()=>{
  assert.match(migration,/create schema constraint_guard authorization postgres;/i);
  assert.match(migration,/revoke all on schema constraint_guard from public;/i);
  assert.match(migration,/grant usage on schema constraint_guard to service_role, authenticated;/i);
  assert.match(migration,/security definer\s+set search_path = pg_catalog, pg_temp/i);
  assert.match(migration,/select private\.finance_snapshot_cent_precise\(\$1\);/i);
  assert.match(migration,/revoke all on function constraint_guard\.finance_snapshot_cent_precise\(jsonb\) from public;/i);
  assert.match(migration,/grant execute on function constraint_guard\.finance_snapshot_cent_precise\(jsonb\)\s+to service_role, authenticated;/i);
  assert.doesNotMatch(migration,/grant\s+\w+\s+on\s+schema\s+private/i);
  assert.doesNotMatch(migration,/\bto\s+anon\b/i);
  assert.doesNotMatch(migration,/\b(?:commit|begin|rollback)\s*;/i);
});

test("only the four CR6 snapshot CHECKs are repointed without changing predicates",()=>{
  const expected:[string,string,string][]=[
    ["enquiries","enquiries_estimate_snapshot_cent_precision","estimate_snapshot"],
    ["journey_supplier_allocations","allocations_rate_snapshot_cent_precision","pricing_plan_snapshot"],
    ["journey_proposals","proposals_financial_snapshots_cent_precision","allocation_snapshot"],
    ["journey_accounts","accounts_quote_snapshot_cent_precision","quote_snapshot"]
  ];
  for(const [table,name,firstSnapshot] of expected){
    assert.match(migration,new RegExp(`alter table public\\.${table}\\s+drop constraint ${name},\\s+add constraint ${name}`));
    assert.match(migration,new RegExp(`constraint_guard\\.finance_snapshot_cent_precise\\(${firstSnapshot}\\)`));
    assert.match(cr6,new RegExp(`add constraint ${name}`));
  }
  for(const snapshot of ["commercial_snapshot","customer_snapshot","sent_snapshot"])
    assert.match(migration,new RegExp(`constraint_guard\\.finance_snapshot_cent_precise\\(${snapshot}\\)`));
  assert.equal((migration.match(/\bdrop constraint\b/g)??[]).length,4);
  assert.equal((migration.match(/\badd constraint\b/g)??[]).length,4);
  assert.doesNotMatch(migration,/\b(?:insert into|update public\.|delete from|alter policy|disable row level security)\b/i);
});
