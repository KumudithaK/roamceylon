import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const migration=readFileSync(new URL("../supabase/migrations/202608120014_audit_observability_integrity.sql",import.meta.url),"utf8");
const auth=readFileSync(new URL("../lib/admin/authenticated-staff.ts",import.meta.url),"utf8");

test("Phase 14 creates append-only authority and bounded security evidence",()=>{
  assert.match(migration,/create table public\.staff_authority_history/);
  assert.match(migration,/create table public\.staff_security_events/);
  assert.match(migration,/Audit and security evidence is append-only/);
  assert.match(migration,/revoke insert,update,delete on public\.staff_authority_history,public\.staff_security_events from authenticated/);
});

test("unified audit index is purpose-limited and excludes sensitive payload columns",()=>{
  assert.match(migration,/create or replace view public\.staff_audit_event_index with\(security_barrier=true\)/);
  const start=migration.indexOf("create or replace view public.staff_audit_event_index"),end=migration.indexOf("revoke all on public.staff_audit_event_index",start),view=migration.slice(start,end);
  for(const forbidden of ["traveller_email","traveller_name","public_token","safe_metadata","new_snapshot","previous_snapshot","supplier_cost","selling_price","notes"])assert.doesNotMatch(view,new RegExp(`\\b${forbidden}\\b`,`i`));
});

test("staff denial telemetry logs only authenticated admin-path capability denials",()=>{
  assert.match(auth,/if\(!path\.startsWith\("\/api\/admin\/"\)\)return/);
  assert.match(auth,/missing_capability/);
  assert.doesNotMatch(auth,/recordAuthorizationDenial\([^\n]+unauthenticated/);
  assert.doesNotMatch(auth,/request\.json\(|authorization.*safe_metadata/i);
});
