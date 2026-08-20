import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

const migration=readFileSync(new URL("../supabase/migrations/202608120003_capability_rls_storage_cutover.sql",import.meta.url),"utf8");

test("Phase 4 protected policies use capabilities and not the legacy editor helper",()=>{
  assert.match(migration,/create or replace function private\.has_permission\(required_permission text\)/);
  assert.match(migration,/profile\.role='admin'/);
  assert.doesNotMatch(migration,/private\.has_role\s*\(/);
  assert.doesNotMatch(migration,/profile\.role='editor'/);
  for(const capability of [
    "cms.edit","suppliers.manage","suppliers.allocate","journey.design.edit",
    "journey.proposal.send","operations.manage","finance.payments.manage",
    "finance.settlements.reverse","finance.accounts.override","users.manage"
  ])assert.match(migration,new RegExp(`private\\.has_permission\\('${capability.replaceAll(".","\\.")}'\\)`));
});

test("anonymous grants are reset before narrow public content grants are restored",()=>{
  assert.match(migration,/revoke all on table public\.%I from anon,authenticated/);
  assert.match(migration,/grant select on public\.themes,public\.destinations,public\.experiences,public\.homepage_content/);
  assert.match(migration,/grant insert on public\.enquiries to anon/);
  assert.match(migration,/revoke all on sequence public\.journey_account_number_seq from anon,authenticated/);
  assert.doesNotMatch(migration,/grant (?:select|insert|update|delete|all)[^;]*public\.(?:accommodations|vehicles|guides|website_settings)[^;]* to anon/i);
});

test("staff access and sensitive finance fields have database-level anti-escalation guards",()=>{
  for(const table of ["permissions","staff_roles","staff_role_permissions","profile_staff_roles"]){
    assert.match(migration,new RegExp(`create policy ${table.replace("staff_role_permissions","staff_role_permissions").replace("profile_staff_roles","profile_staff_roles")}[^;]*private\\.has_permission\\('users\\.manage'\\)`));
  }
  assert.match(migration,/enforce_journey_account_override_capability/);
  assert.match(migration,/finance\.accounts\.override/);
  assert.match(migration,/enforce_allocation_identity_capability/);
  assert.match(migration,/suppliers\.allocate/);
});

test("relationship RPC and all four Storage buckets enforce exact capabilities",()=>{
  assert.match(migration,/security definer[\s\S]*CMS edit capability is required/);
  assert.match(migration,/Supplier management capability is required/);
  assert.match(migration,/bucket_id='travel-content' and private\.has_permission\('cms\.edit'\)/);
  assert.match(migration,/bucket_id in \('partner-application-media','partner-application-documents'\) and private\.has_permission\('suppliers\.manage'\)/);
  assert.match(migration,/bucket_id='accounting-receipts' and private\.has_permission\('finance\.payments\.manage'\)/);
  assert.match(migration,/name!~ '\(\^\|\/\)\\\.\\\.\(\/\|\$\)'/);
});
