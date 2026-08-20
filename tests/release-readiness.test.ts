import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync,readdirSync} from "node:fs";
import {basename,resolve} from "node:path";
import test from "node:test";

const root=resolve(import.meta.dirname,"..");
const source=(path:string)=>readFileSync(resolve(root,path),"utf8");
const migrations=readdirSync(resolve(root,"supabase/migrations")).filter(name=>name.endsWith(".sql")).sort();
const manifest=(path:string)=>source(path).trim().split("\n").map(line=>{
  const match=line.match(/^([a-f0-9]{64})\s+(.+)$/);
  assert.ok(match,`invalid checksum manifest line in ${path}`);
  return {checksum:match[1],path:match[2]};
});

test("Phase 16 freezes the complete unique migration chain by checksum",()=>{
  const repository=manifest("repository-migration-manifest.sha256");
  const stabilization=manifest("stabilization-migration-manifest.sha256");
  assert.equal(migrations.length,84);
  assert.equal(repository.length,migrations.length);
  assert.equal(new Set(migrations.map(name=>name.slice(0,12))).size,migrations.length);
  for(const entry of repository){
    assert.equal(createHash("sha256").update(source(entry.path)).digest("hex"),entry.checksum);
    assert.ok(migrations.includes(basename(entry.path)));
  }
  assert.equal(stabilization.length,14);
  assert.deepEqual(stabilization.map(entry=>basename(entry.path)),migrations.filter(name=>/^2026081200(0[1-9]|1[0-4])_/.test(name)));
});

test("Phase 16 release runner is isolated, production-rejecting and clean-room based",()=>{
  const runner=source("scripts/run-isolated-phase16-release-readiness.sh");
  assert.match(runner,/xnsxmwgyugoqanuoyebh/);
  assert.match(runner,/fstpfqlgypvktjwdeagu/);
  assert.match(runner,/application relations=0/);
  assert.match(runner,/db reset --local --no-seed/);
  assert.match(runner,/202607260005_v2_data_relationship_repair\.sql/);
  assert.match(runner,/IMPORT_REPORT_PATH=.*cleanroom-import-report\.json/);
  assert.match(runner,/migration up --local --include-all/);
  assert.match(runner,/clean_migration_count[\s\S]*84/);
  assert.match(runner,/phase16-schema-fingerprint\.sql/);
  assert.match(runner,/run-isolated-phase15-end-to-end-integrity\.sh/);
  assert.doesNotMatch(runner,/db push|migration repair|db reset --linked/);
});

test("Phase 16 schema fingerprint explicitly casts PostgreSQL internal char fields",()=>{
  const fingerprint=source("scripts/sql/phase16-schema-fingerprint.sql");
  for(const field of ["c.relkind","a.attidentity","a.attgenerated","con.contype","p.prokind","p.provolatile"]){
    assert.match(fingerprint,new RegExp(`${field.replace(".","\\.")}::text`));
    assert.doesNotMatch(fingerprint,new RegExp(`\\|\\|${field.replace(".","\\.")}\\|\\|`));
  }
});

test("Phase 16 fingerprints the canonical staff role identity and definition",()=>{
  const fingerprint=source("scripts/sql/phase16-schema-fingerprint.sql");
  assert.ok(fingerprint.includes("select code||'|'||name||'|'||coalesce(description,'') as value from public.staff_roles"));
  assert.doesNotMatch(fingerprint,/select role_code\|\|'\|'\|name as value from public\.staff_roles/);
});

test("Phase 16 fingerprints logical enum order rather than physical sort positions",()=>{
  const fingerprint=source("scripts/sql/phase16-schema-fingerprint.sql");
  assert.match(fingerprint,/row_number\(\) over\(partition by t\.oid order by e\.enumsortorder\) as logical_position/);
  assert.ok(fingerprint.includes("logical_position::text||'|'||enumlabel"));
  assert.doesNotMatch(fingerprint,/typname\|\|'\|'\|e\.enumsortorder\|\|/);
});

test("clean-room bootstrap uses the canonical importer without changing its normal report path",()=>{
  const importer=source("scripts/import-json-to-supabase.mjs");
  const runner=source("scripts/run-isolated-phase16-release-readiness.sh");
  const projectConfig=source("supabase/config.toml");
  assert.match(importer,/process\.env\.IMPORT_REPORT_PATH/);
  assert.match(importer,/reports','latest-import-report\.json/);
  assert.match(importer,/--confirm-import/);
  assert.match(projectConfig,/# auto_expose_new_tables = true/);
  assert.doesNotMatch(projectConfig,/^auto_expose_new_tables = true/m);
  assert.match(runner,/s\/# auto_expose_new_tables = true\/auto_expose_new_tables = true\//);
  assert.match(runner,/clean_root.*supabase\/config\.toml/);
});

test("browser responses carry a production security baseline and proposal privacy controls",()=>{
  const config=source("next.config.ts");
  for(const header of ["Content-Security-Policy","Referrer-Policy","X-Content-Type-Options","X-Frame-Options","Permissions-Policy","Cross-Origin-Opener-Policy","Strict-Transport-Security"])assert.match(config,new RegExp(header));
  assert.match(config,/object-src 'none'/);
  assert.match(config,/frame-ancestors 'none'/);
  assert.match(config,/private, no-store, max-age=0/);
  assert.match(config,/noindex, nofollow, noarchive/);
});

test("environment contract keeps privileged credentials server-only",()=>{
  const example=source(".env.example");
  assert.match(example,/NEXT_PUBLIC_SUPABASE_URL=/);
  assert.match(example,/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=/);
  assert.match(example,/NEXT_PUBLIC_SITE_URL=https:\/\/theroamceylon\.com/);
  assert.match(example,/SUPABASE_SERVICE_ROLE_KEY=/);
  assert.doesNotMatch(example,/NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY/);
  for(const directory of ["app","components","features"]){
    const files:string[]=[];
    const walk=(path:string)=>{for(const entry of readdirSync(path,{withFileTypes:true})){const child=resolve(path,entry.name);if(entry.isDirectory())walk(child);else if(/\.(ts|tsx)$/.test(entry.name))files.push(child);}};
    walk(resolve(root,directory));
    for(const file of files)assert.doesNotMatch(readFileSync(file,"utf8"),/SUPABASE_SERVICE_ROLE_KEY/,file);
  }
});

test("browser drafts avoid durable partner PII and auth errors fail closed",()=>{
  const partner=source("features/partners/partner-application-form.tsx");
  const login=source("features/admin/login-form.tsx");
  assert.match(partner,/sessionStorage/);
  assert.doesNotMatch(partner,/localStorage/);
  assert.match(login,/We could not sign you in with those details/);
  assert.doesNotMatch(login,/setError\(error\.message\)/);
});

test("journey bootstrap diagnostics do not emit raw caught errors",()=>{
  const service=source("lib/journey/journey-service.ts");
  assert.match(service,/reportBootstrapFailure/);
  assert.doesNotMatch(service,/console\.error\([^\n]+,error\)/);
  assert.doesNotMatch(service,/console\.error\([^\n]+,result\.reason\)/);
});

test("production cutover artifacts keep real data and production behind human gates",()=>{
  for(const file of ["production-cutover-plan.md","production-smoke-test-checklist.md","real-data-entry-readiness.md"]){
    const document=source(file);
    assert.match(document,/production/i);
    assert.match(document,/synthetic|real data/i);
  }
  assert.match(source("production-cutover-plan.md"),/Database backup protects Storage metadata, not the underlying files/);
  assert.match(source("real-data-entry-readiness.md"),/not ready|NO/i);
});
