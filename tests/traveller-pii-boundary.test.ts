import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import {financeAccountForStaff,proposalChangeForStaff,proposalForStaff} from "../lib/admin/traveller-pii.ts";
import type {Database} from "../lib/database.types";

const migration=readFileSync(new URL("../supabase/migrations/202608120004_traveller_pii_boundaries.sql",import.meta.url),"utf8");
const proposalRoute=readFileSync(new URL("../app/api/admin/journey-proposals/route.ts",import.meta.url),"utf8");
const studioRoute=readFileSync(new URL("../app/api/admin/journey-studio/route.ts",import.meta.url),"utf8");

test("Phase 5 creates exact purpose capabilities and guarded projections",()=>{
  for(const capability of ["traveller.pii.full.view","traveller.pii.design.view","traveller.pii.operations.view","traveller.pii.finance.view","traveller.context.suppliers.view"]){
    assert.match(migration,new RegExp(capability.replaceAll(".","\\.")));
  }
  for(const view of ["traveller_journey_design","traveller_operations_context","traveller_finance_reference","traveller_supplier_context","traveller_admin_full","finance_journey_accounts"]){
    assert.match(migration,new RegExp(`view public\\.${view}`));
  }
  assert.match(migration,/with \(security_barrier=true\)/);
  assert.match(migration,/revoke select on public\.enquiries from authenticated/);
  assert.match(migration,/grant select\(id,status,internal_notes,updated_at\) on public\.enquiries/);
});

test("Finance and supplier projections do not select forbidden traveller fields",()=>{
  const finance=migration.match(/create or replace view public\.traveller_finance_reference[\s\S]*?from public\.enquiries e[\s\S]*?;/)?.[0]??"";
  const supplier=migration.match(/create or replace view public\.traveller_supplier_context[\s\S]*?from public\.enquiries e[\s\S]*?;/)?.[0]??"";
  for(const field of ["e.email","e.phone","e.traveller_notes","e.internal_notes","e.trip_state","e.estimate_snapshot"]){
    assert.doesNotMatch(finance,new RegExp(field.replace(".","\\.")));
  }
  for(const field of ["e.email","e.phone","e.name","e.traveller_notes","e.internal_notes","e.estimate_snapshot"]){
    assert.doesNotMatch(supplier,new RegExp(field.replace(".","\\.")));
  }
  assert.match(supplier,/preference\.value - 'notes'/);
  assert.match(supplier,/'accessibilityRequirements','\"\"'::jsonb/);
});

test("proposal API applies traveller field shaping and Journey Studio requires design PII",()=>{
  assert.match(proposalRoute,/proposalForStaff/);
  assert.match(proposalRoute,/proposalChangeForStaff/);
  assert.match(studioRoute,/\["journey\.design\.view","traveller\.pii\.design\.view"\]/);
  assert.match(studioRoute,/\["journey\.design\.edit","traveller\.pii\.design\.view"\]/);
});

test("Finance proposal DTO excludes copied traveller identity and contact payloads",()=>{
  const proposal={
    allocation_snapshot:[{serviceDetails:{accessibility:"marker"},arrivalInstructions:"marker",specialNotes:"marker",supplierCost:10,pricingPlanSnapshot:{rate:"supplier"},supplierContact:"supplier marker",invoiceStatus:"requested",paymentStatus:"pending"}],commercial_snapshot:{margin:1},customer_snapshot:{traveller:{email:"marker@example.test"}},sent_snapshot:{traveller:{phone:"marker"}},curated_journey_snapshot:{notes:"marker"},
    total_supplier_cost:10,gross_profit:2,profit_margin:20,accepted_name:"Identity Marker",accepted_email:"marker@example.test",acceptance_metadata:{ip:"marker"},access_revocation_reason:"marker"
  } as unknown as Database["public"]["Tables"]["journey_proposals"]["Row"];
  const safe=proposalForStaff(proposal,["journey.proposal.view","finance.costs.view","finance.margin.view","finance.payments.manage","traveller.pii.finance.view"]);
  for(const field of ["customer_snapshot","sent_snapshot","curated_journey_snapshot","accepted_name","accepted_email","acceptance_metadata","public_token","introduction","terms"]){
    assert.equal(field in safe,false);
  }
  assert.deepEqual(safe.allocation_snapshot,[{serviceDetails:{},arrivalInstructions:null,specialNotes:null,supplierCost:10,pricingPlanSnapshot:{rate:"supplier"},supplierContact:"supplier marker",invoiceStatus:"requested",paymentStatus:"pending"}]);
});

test("Finance change-request and account DTOs exclude contact and free-text traveller data",()=>{
  const change={id:"1",proposal_id:"2",category:"general",message:"Sensitive marker",traveller_name:"Identity",traveller_email:"marker@example.test",status:"new",created_at:"now",reviewed_at:null,reviewed_by:null} as const;
  const safeChange=proposalChangeForStaff(change,["traveller.pii.finance.view"]);
  assert.deepEqual(Object.keys(safeChange).sort(),["category","created_at","id","proposal_id","reviewed_at","reviewed_by","status"].sort());
  const account={traveller_email:"marker@example.test",quote_snapshot:{traveller:{phone:"marker"}},id:"1"} as unknown as Database["public"]["Tables"]["journey_accounts"]["Row"];
  const safeAccount=financeAccountForStaff(account);
  assert.equal("traveller_email" in safeAccount,false);
  assert.equal("quote_snapshot" in safeAccount,false);
});
