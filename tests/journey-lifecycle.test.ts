import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

const read=(path:string)=>readFileSync(new URL(path,import.meta.url),"utf8");

test("supplier allocations remain independent from immutable traveller preferences",()=>{
  const route=read("../app/api/admin/journey-allocations/route.ts");
  assert.match(route,/journey_supplier_allocations/);
  assert.doesNotMatch(route,/trip_state\s*:/);
  assert.doesNotMatch(route,/destinationPreferences\s*:/);
});

test("proposal snapshots use allocated suppliers and enforce sent before approval",()=>{
  const service=read("../lib/proposals/journey-proposal-service.ts");
  assert.match(service,/allocationCommercialSnapshot/);
  assert.match(service,/allocation_snapshot/);
  assert.match(service,/proposal\.status!=="sent"/);
  assert.match(service,/"proposal_accepted"/);
});

test("allocation accounting preserves the legacy quote path",()=>{
  const posting=read("../lib/accounting/post-journey-account.ts");
  const allocationAccounting=read("../lib/accounting/allocation-accounting.ts");
  assert.match(posting,/allocationCommercial\.allocations\.length/);
  assert.match(posting,/new PackagePricingService\(\)\.quote/);
  assert.match(posting,/source:"supplier_allocations"/);
  assert.match(allocationAccounting,/status:"pending_deposit"/);
  assert.match(allocationAccounting,/source_key:`allocation:/);
  assert.match(allocationAccounting,/allocation_id:line\.allocationId/);
});

test("migration stores commercial, operational, proposal and reporting relationships",()=>{
  const migration=read("../supabase/migrations/202608080003_journey_proposal_financial_operations.sql");
  for(const field of ["supplier_cost","selling_price","supplier_contact","arrival_instructions","confirmation_status","invoice_status","payment_status","allocation_id","journey_proposals","allocation_snapshot"]){
    assert.match(migration,new RegExp(field));
  }
});

test("admin journey lifecycle exposes the canonical DMC workflow",()=>{
  const workflow=read("../lib/enquiries/enquiry-workflow.ts");
  for(const label of ["Draft","Proposal Ready","Proposal Sent","Traveller Approved","Deposit Received","Supplier Allocation Complete","Ready for Operations","Travelling","Completed","Archived"]){
    assert.match(workflow,new RegExp(label));
  }
});
