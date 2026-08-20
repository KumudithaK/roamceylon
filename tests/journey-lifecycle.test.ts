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

test("proposal snapshots use allocated suppliers and require internal approval before sending",()=>{
  const service=read("../lib/proposals/journey-proposal-service.ts");
  const workflowMigration=read("../supabase/migrations/202608120005_workflow_transition_integrity.sql");
  const workspace=read("../features/admin/journey-lifecycle-workspace.tsx");
  assert.match(service,/allocationCommercialSnapshot/);
  assert.match(service,/allocation_snapshot/);
  assert.match(service,/proposal\.status!=="internal_approved"/);
  assert.match(workflowMigration,/sent_snapshot=customer_snapshot/);
  assert.match(service,/customer_snapshot:customerProposalJson/);
  assert.match(service,/transition_journey_proposal_command/);
  assert.match(workspace,/action==="sent"\?"proposal_sent":"preparing_proposal"/);
});

test("phase ten preserves sent versions and provides traveller acceptance and changes",()=>{
  const migration=read("../supabase/migrations/202608100005_premium_journey_proposals.sql");
  const guards=read("../supabase/migrations/202608100006_proposal_snapshot_guards.sql");
  const travellerService=read("../lib/proposals/traveller-proposal-service.ts");
  const workflowMigration=read("../supabase/migrations/202608120005_workflow_transition_integrity.sql");
  const document=read("../components/proposal/proposal-document.tsx");
  for(const field of ["public_token","customer_snapshot","sent_snapshot","journey_proposal_change_requests","journey_proposal_acceptances"])assert.match(migration,new RegExp(field));
  assert.match(travellerService,/accept_journey_proposal_command/);
  assert.match(workflowMigration,/proposal_row\.version/);
  assert.match(workflowMigration,/proposal_row\.total_selling_price/);
  assert.match(travellerService,/status:"changes_requested"/);
  assert.match(guards,/protect_sent_proposal_snapshot/);
  assert.match(guards,/requires_new_version=true/);
  assert.match(guards,/mark_proposal_after_curated_change/);
  assert.match(guards,/mark_proposal_after_allocation_change/);
  assert.match(document,/What your journey includes/);
  assert.match(document,/Your journey investment/);
  assert.match(document,/Payment schedule/);
  assert.doesNotMatch(document,/supplierCost|grossProfit|profitMargin|commission/i);
});

test("allocation accounting remains a reconciliation service while activation uses the accepted proposal command",()=>{
  const posting=read("../lib/accounting/post-journey-account.ts");
  const allocationAccounting=read("../lib/accounting/allocation-accounting.ts");
  assert.match(posting,/initialize_journey_account_command/);
  assert.doesNotMatch(posting,/PackagePricingService|allocationCommercialSnapshot/);
  assert.match(allocationAccounting,/!account\|\|!account\.active/);
  assert.doesNotMatch(allocationAccounting,/journey_accounts"\)\.insert/);
  assert.match(allocationAccounting,/source_key:`allocation:/);
  assert.match(allocationAccounting,/allocation_id:line\.allocationId/);
});

test("migration stores commercial, operational, proposal and reporting relationships",()=>{
  const migration=read("../supabase/migrations/202608080003_journey_proposal_financial_operations.sql");
  const rateMigration=read("../supabase/migrations/202608080004_allocation_rate_snapshots.sql");
  for(const field of ["supplier_cost","selling_price","supplier_contact","arrival_instructions","confirmation_status","invoice_status","payment_status","allocation_id","journey_proposals","allocation_snapshot"]){
    assert.match(migration,new RegExp(field));
  }
  for(const field of ["pricing_plan_id","pricing_plan_snapshot","service_name","quantity","quantity_label","service_details"]){
    assert.match(rateMigration,new RegExp(field));
  }
});

test("phase eight migration supports endpoint transport legs without changing supplier entities",()=>{
  const migration=read("../supabase/migrations/202608090002_complete_transport_route_endpoints.sql");
  assert.match(migration,/from_location_key/);
  assert.match(migration,/to_location_key/);
  assert.match(migration,/destination:/);
  assert.match(migration,/allocation_type='vehicle'/);
});

test("CMS relationship sync runs with scoped elevated permissions",()=>{
  const migration=read("../supabase/migrations/202608090003_fix_relationship_sync_permissions.sql");
  assert.match(migration,/sync_content_relationships/);
  assert.match(migration,/security definer/);
  assert.match(migration,/revoke all .* from anon/);
  assert.match(migration,/grant execute .* to authenticated/);
  assert.doesNotMatch(migration,/grant usage on schema private/);
});

test("admin journey lifecycle exposes the canonical DMC workflow",()=>{
  const workflow=read("../lib/enquiries/enquiry-workflow.ts");
  for(const label of ["Draft","Proposal Ready","Proposal Sent","Traveller Approved","Deposit Received","Supplier Allocation Complete","Ready for Operations","Travelling","Completed","Archived"]){
    assert.match(workflow,new RegExp(label));
  }
});

test("allocation editors initialise complete controlled drafts before matching saved rates",()=>{
  const workspace=read("../features/admin/journey-lifecycle-workspace.tsx");
  assert.match(workspace,/const base=current\[key\]\?\?\(scope\?draftFromScope\(scope\):emptyDraft/);
  assert.match(workspace,/plan\.entity_type===draft\.type&&plan\.entity_id===draft\.resourceId/);
  assert.match(workspace,/value=\{draft\.providerName\?\?""\}/);
  assert.match(workspace,/value=\{draft\.currency\?\?"USD"\}/);
});

test("saved suppliers can use a one-off journey rate without changing catalogue pricing",()=>{
  const route=read("../app/api/admin/journey-allocations/route.ts");
  const workspace=read("../features/admin/journey-lifecycle-workspace.tsx");
  assert.match(route,/usesCustomJourneyRate/);
  assert.match(route,/completeCustomJourneyRate/);
  assert.match(workspace,/Custom journey rate/);
  assert.match(workspace,/does not change the supplier&apos;s catalogue pricing/);
});
