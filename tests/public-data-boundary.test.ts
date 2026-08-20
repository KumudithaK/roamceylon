import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=(path:string)=>readFileSync(new URL(`../${path}`,import.meta.url),"utf8");
const migration=read("supabase/migrations/202608120001_public_data_boundaries.sql");

test("public supplier projections are explicit and anonymous base-table reads are revoked",()=>{
  for(const view of ["public_accommodations","public_vehicles","public_guides"]){
    assert.match(migration,new RegExp(`create or replace view public\\.${view}`));
    assert.match(migration,new RegExp(`grant select on public\\.${view} to anon, authenticated`));
  }
  for(const table of ["accommodations","vehicles","guides"]){
    assert.match(migration,new RegExp(`revoke select on public\\.${table} from anon`));
  }
  assert.doesNotMatch(migration,/create or replace view public\.public_(?:accommodations|vehicles|guides)[\s\S]*?select\s+\*/i);
});

test("website public settings exclude setup and administrative state",()=>{
  const view=migration.match(/create or replace view public\.website_public_settings[\s\S]*?from public\.website_settings;/i)?.[0]??"";
  assert.ok(view);
  for(const field of ["setup_checklist","setup_dismissed","maintenance_mode","partner_registration_available","updated_by","business_registration_number","sltda_registration_number"]){
    assert.doesNotMatch(view,new RegExp(`\\b${field}\\b`));
  }
  assert.match(migration,/revoke select on public\.website_settings from anon/);
});

test("public website consumers use only the safe projections",()=>{
  const publicConsumers=[
    "lib/data.ts",
    "lib/repositories/content.ts",
    "components/site/site-footer.tsx",
    "app/about/page.tsx",
    "app/contact/page.tsx"
  ].map(read).join("\n");
  assert.match(publicConsumers,/public_accommodations/);
  assert.match(publicConsumers,/public_vehicles/);
  assert.match(publicConsumers,/public_guides/);
  assert.match(publicConsumers,/website_public_settings/);
  assert.doesNotMatch(publicConsumers,/from\("website_settings"\)/);
});
