import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {calculateVerifiedSavings,conditionalBenefitDescription,customerBenefit,referenceComparison,totalVerifiedSavings} from "../lib/benefits/preferred-benefits.ts";
import type {BenefitDefinition,JourneyBenefit} from "../lib/benefits/preferred-benefits.ts";

const root=new URL("../",import.meta.url);
const source=(path:string)=>readFileSync(new URL(path,root),"utf8");
const definition=(changes:Record<string,unknown>={})=>({
  id:"benefit-1",code:"preferred_stay",name:"Roam Ceylon Preferred Rate",benefit_type:"preferred_rate",confidence_status:"confirmed_partner_benefit",default_scope:"stay",customer_description:"A genuine preferred rate arranged for this stay.",entity_type:"accommodation",entity_id:"hotel-1",valid_from:null,valid_to:null,default_included:false,active:true,customer_rate:250,reference_rate:300,currency:"USD",rate_unit:"per room / night",comparison_verified:true,reference_rate_basis:"Hotel published refundable rate",reference_rate_source:"Internal evidence reference",verification_date:"2026-08-10",occupancy_basis:"Double sharing",room_category:"Deluxe Room",meal_plan:"Half Board",applicable_from:"2027-02-01",applicable_to:"2027-02-28",taxes_fees_basis:"Both rates include taxes and service",cancellation_terms_basis:"Equivalent refundable terms",internal_notes:"private",created_at:"",updated_at:"",created_by:null,updated_by:null,...changes
}) as unknown as BenefitDefinition;
const assignment=(changes:Record<string,unknown>={})=>({id:"journey-benefit-1",enquiry_id:"journey-1",benefit_id:"benefit-1",allocation_id:"allocation-1",included:true,scope_type:"stay",scope_id:null,journey_day:null,customer_title:"Roam Ceylon Preferred Rate",customer_description:"A genuine preferred rate arranged for this stay.",confidence_status:"confirmed_partner_benefit",quantity:2,reference_rate:300,customer_rate:250,currency:"USD",rate_unit:"per room / night",comparison_verified:true,verified_savings:100,fulfilment_status:"pending",fulfilment_details:{},internal_notes:"private",selected_at:"",selected_by:null,updated_at:"",...changes}) as unknown as JourneyBenefit;

test("verified comparable preferred rates calculate savings by billable quantity",()=>{
  assert.deepEqual(referenceComparison(definition()),{valid:true,savingPerUnit:50});
  assert.equal(calculateVerifiedSavings(definition(),2),100);
  assert.equal(totalVerifiedSavings([{...customerBenefit(definition(),assignment()),verifiedSavings:100},{...customerBenefit(definition(),assignment()),verifiedSavings:80}]),180);
});

test("incomplete or materially different comparisons never create a savings claim",()=>{
  const unverified=definition({meal_plan:null,comparison_verified:false});
  assert.equal(referenceComparison(unverified).valid,false);
  assert.equal(calculateVerifiedSavings(unverified,4),0);
  const safe=customerBenefit(unverified,assignment({comparison_verified:false,verified_savings:0,reference_rate:null}));
  assert.equal(safe.referenceRate,undefined);
  assert.equal(safe.verifiedSavings,0);
  assert.equal(safe.preferredRate,250);
});

test("conditional partner benefits remain explicitly subject to availability",()=>{
  assert.match(conditionalBenefitDescription("A room upgrade may be available.","subject_to_availability"),/subject to availability/i);
  assert.equal(conditionalBenefitDescription("A welcome amenity is included.","confirmed_partner_benefit"),"A welcome amenity is included.");
});

test("customer benefit DTO excludes evidence, supplier cost, margin and internal notes",()=>{
  const safe=customerBenefit(definition(),assignment(),"Water Garden Sigiriya");
  const json=JSON.stringify(safe);
  assert.equal(json.includes("reference_rate_source"),false);
  assert.equal(json.includes("supplier"),false);
  assert.equal(json.includes("margin"),false);
  assert.equal(json.includes("private"),false);
  assert.equal(safe.scopeLabel,"Water Garden Sigiriya");
});

test("migration creates the default per-traveller welcome T-shirt and scoped benefit model",()=>{
  const sql=source("supabase/migrations/202608110002_preferred_benefits_and_privileges.sql");
  assert.match(sql,/create table public\.benefit_definitions/);
  assert.match(sql,/create table public\.journey_benefits/);
  assert.match(sql,/roam_ceylon_welcome_tshirt/);
  assert.match(sql,/'traveller'/);
  assert.match(sql,/default_included[\s\S]*true/i);
  assert.match(sql,/reference_rate_source/);
  assert.match(sql,/benefit_verified_comparison_complete/);
  assert.match(sql,/private\.has_permission\('benefits\.assign'\)/);
});

test("proposal versions snapshot benefits and operations can fulfil accepted promises",()=>{
  const service=source("lib/proposals/journey-proposal-service.ts"),api=source("app/api/admin/journey-benefits/route.ts"),panel=source("features/admin/journey-benefits-panel.tsx");
  assert.match(service,/customerBenefitsForProposal/);
  assert.match(service,/customerSnapshot=\{\.\.\.composed,benefits\}/);
  assert.match(api,/status","approved/);
  assert.match(api,/acceptedBenefits/);
  const migration=source("supabase/migrations/202608110002_preferred_benefits_and_privileges.sql");
  for(const status of ["not_required","pending","confirmed","prepared","delivered","unavailable"])assert.match(migration,new RegExp(status));
  assert.match(api,/Child XS/);
  assert.match(panel,/journeyBenefitId/);
});

test("reference rates and verified savings remain isolated from accounting",()=>{
  const accounting=["lib/accounting/allocation-accounting.ts","lib/accounting/post-journey-account.ts","lib/accounting/cancellation.ts"].map(path=>source(path)).join("\n");
  assert.equal(/reference_rate|verified_savings|benefit_definitions|journey_benefits/.test(accounting),false);
  const pdf=source("lib/proposals/export-proposal-pdf.ts"),document=source("components/proposal/proposal-document.tsx");
  assert.match(pdf,/The Roam Ceylon Difference/);
  assert.match(document,/Total verified preferred value/);
});

test("benefit RBAC separates viewing, assignment, management and reference evidence",()=>{
  const permissions=source("lib/admin/permissions.ts");
  for(const permission of ["benefits.view","benefits.manage","benefits.assign","benefits.reference.view","benefits.reference.manage"])assert.match(permissions,new RegExp(permission.replaceAll(".","\\.")));
  assert.match(source("app/api/admin/benefits/route.ts"),/reference_rate_source:null,internal_notes:null/);
});
