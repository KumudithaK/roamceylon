import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import test from "node:test";

const read=(path:string)=>readFileSync(path,"utf8");
const historical=read("supabase/migrations/202608120008_supplier_allocation_integrity.sql");
const source=historical.match(/create or replace function public\.save_supplier_allocations_command\([\s\S]*?end \$\$;/)![0];
const applied=source.replace("plan_row.entity_type<>item->>'allocation_type'","plan_row.entity_type::text<>item->>'allocation_type'");
const migration=read("supabase/migrations/202609270001_cr6_allocation_command_ambiguity.sql");
const corrected=migration.slice(migration.indexOf("create or replace function")).trim();
const rehearsal=read("scripts/cr6-r2-staging-allocation-rollback.sql");
const header=(sql:string)=>sql.slice(0,sql.indexOf("declare"));

test("R2 changes only the two ambiguous local names in the effective applied definition",()=>{
  assert.equal(corrected.replaceAll("v_supplier_cost","supplier_cost").replaceAll("v_commercial_source","commercial_source"),applied);
  assert.equal(header(corrected),header(applied));
  assert.match(corrected,/plan_row\.entity_type::text<>item->>'allocation_type'/);
  assert.equal((migration.match(/create or replace function/gi)??[]).length,1);
  assert.doesNotMatch(migration,/\b(?:grant|revoke|drop|alter|notify)\s/i);
});

test("R2 static ambiguity regression fails the old definition and accepts the replacement",()=>{
  const assertUnambiguous=(sql:string)=>{
    assert.doesNotMatch(sql,/supplier_cost\s*=\s*supplier_cost\b/);
    assert.doesNotMatch(sql,/commercial_source\s*=\s*commercial_source\b/);
  };
  assert.throws(()=>assertUnambiguous(applied),assert.AssertionError);
  assertUnambiguous(corrected);
  assert.match(corrected,/supplier_cost=v_supplier_cost/);
  assert.match(corrected,/commercial_source=v_commercial_source/);
  assert.match(rehearsal,/exception when ambiguous_column/);
  assert.match(rehearsal,/Expected original 42702 was not reproduced/);
});

test("R2 keeps immutable migrations byte-identical",()=>{
  for(const [path,hash] of [
    ["supabase/migrations/202608120008_supplier_allocation_integrity.sql","33c7f7f07f3cd0817231d8b4ec14d820e5e3b9f454cc0ad7a48a0d6a0b78a8ca"],
    ["supabase/migrations/202609230001_cr6_cent_precision.sql","4fd6c072efd5262158a41a12bb7b3a9c9f210b011b6f09809ec90207776c257f"]
  ])assert.equal(createHash("sha256").update(readFileSync(path)).digest("hex"),hash);
});

test("R2 rehearsal embeds the exact replacement and always ends with rollback",()=>{
  assert(rehearsal.includes(corrected));
  const executable=rehearsal.replace(/^--.*$/gm,"").trim();
  assert.match(executable,/^begin;/i);
  assert.match(executable,/rollback;$/i);
  // ON COMMIT DROP is transactional temp-table lifetime syntax, not a COMMIT statement.
  assert.doesNotMatch(executable,/(?:^|;)\s*commit\s*;/i);
  assert.doesNotMatch(executable,/\b(?:nextval|setval|pg_notify|dblink|http_post|http_get)\s*\(/i);
  assert.match(executable,/request\.jwt\.claim\.role = 'service_role'/);
  assert.match(executable,/md5\(replace\(replace\(p\.prosrc/);
});

for(const [name,marker] of [
  ["valid-cent INSERT","valid_cent_insert"],
  ["valid-cent supplier-cost UPDATE","valid_cent_supplier_cost_update"],
  ["commercial-source UPDATE","commercial_source_update"],
  ["combined cost/source UPDATE","combined_cost_source_update"],
  ["sub-cent INSERT rejection","subcent_insert_10_001"],
  ["sub-cent UPDATE rejection","subcent_update_10_001"],
  ["unchanged allocation audit/version behaviour","unchanged_allocation_behaviour"],
  ["authorization actor/role/ACL checks","authorization_actor_role_acl"],
  ["history/receipt snapshots","audit_history_receipts"],
  ["idempotency replay/collision","idempotency_replay_collision"],
  ["signature/security/semantic equivalence","signature_security_acl_semantics"]
])test(`R2 SQL regression harness includes executable assertions for ${name}`,()=>{
  assert(rehearsal.includes(`values('${marker}','PASS')`));
});

test("R2 precision and failure atomicity assertions remain strict",()=>{
  assert.equal((rehearsal.match(/violated_constraint<>'journey_supplier_allocations_supplier_cost_cent_precision'/g)??[]).length,2);
  assert.match(rehearsal,/Sub-cent UPDATE\/atomicity failed/);
  assert.match(rehearsal,/Sub-cent INSERT\/atomicity failed/);
  assert.match(rehearsal,/has_function_privilege\('anon'/);
  assert.match(rehearsal,/has_function_privilege\('authenticated'/);
  assert.match(rehearsal,/previous_snapshot->>'commercialSource'='catalogue_rate'/);
  assert.match(rehearsal,/new_snapshot->>'commercialSource'='custom_journey_rate'/);
});
