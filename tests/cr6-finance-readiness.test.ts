import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import {calculateAllocationCommercials,missingAllocationCommercialConfig,type AllocationCommercialConfig,type AllocationCommercialLine,type IncompleteAllocationCommercialConfig} from "../lib/pricing/allocation-commercial.ts";
import {proposalBalance,validateProposalPaymentTerms} from "../lib/pricing/proposal-payment.ts";

const source=(path:string)=>readFileSync(path,"utf8");
const config:AllocationCommercialConfig={driverSalaryPerDay:0,fuelPricePerLitre:0,vehicleKmPerLitre:10,tollsPerJourney:0,parkingPerDay:0,guideAccommodationPerNight:0,administrationFixed:0,administrationPercent:0,contingencyPercent:0,serviceFeeFixed:0,serviceFeePercent:0,targetProfitMarginPercent:20,routeDistanceBufferPercent:0};
const line=(supplierCost:number,sellingPrice:number|null=null):AllocationCommercialLine=>({type:"accommodation",supplierCost,sellingPrice,pricingPlanSnapshot:{},serviceDetails:{},confirmationStatus:"confirmed"});
const context={days:3,nights:2,distanceKm:0};

test("multiple supplier costs produce a cent-precise total and distinguish margin from markup",()=>{
  const result=calculateAllocationCommercials([line(100),line(200)],config,context);
  assert.equal(result.totalSupplierCost,300);
  assert.equal(result.totalSellingPrice,375);
  assert.equal(result.grossProfit,75);
  assert.equal(result.profitMargin,20);
  assert.equal(result.grossProfit/result.internalCost*100,25);
});

test("manual service price changes profit without relabelling it as target margin",()=>{
  const result=calculateAllocationCommercials([line(300,330)],config,context);
  assert.equal(result.totalSellingPrice,330);
  assert.equal(result.grossProfit,30);
  assert.equal(result.profitMargin,9.09);
  assert.equal(result.manualSellingFloor,330);
});

test("floating input aggregation rounds at the existing two-decimal boundary",()=>{
  const result=calculateAllocationCommercials([line(0.1),line(0.2)],{...config,targetProfitMarginPercent:0},context);
  assert.equal(result.totalSupplierCost,0.3);
  assert.equal(result.totalSellingPrice,0.3);
  assert.equal(result.grossProfit,0);
});

test("missing commercial settings cannot silently become zero-valued pricing inputs",()=>{
  const absent=Object.fromEntries(Object.keys(config).map(key=>[key,null])) as IncompleteAllocationCommercialConfig;
  absent.routeDistanceBufferPercent=0;
  assert.deepEqual(missingAllocationCommercialConfig([line(300)],absent),[
    "administrationFixed","administrationPercent","contingencyPercent","serviceFeeFixed","serviceFeePercent","targetProfitMarginPercent"
  ]);
  assert.deepEqual(missingAllocationCommercialConfig([line(300)],config),[]);
  const vehicle:AllocationCommercialLine={...line(100),type:"vehicle"};
  assert(missingAllocationCommercialConfig([vehicle],{...config,driverSalaryPerDay:null}).includes("driverSalaryPerDay"));
  assert(!missingAllocationCommercialConfig([{...vehicle,serviceDetails:{driverIncluded:true}},{...vehicle,confirmationStatus:"cancelled"}],{...config,driverSalaryPerDay:null}).includes("driverSalaryPerDay"));
  assert(!missingAllocationCommercialConfig([vehicle],{...config,driverSalaryPerDay:null},{driverOperations:0}).includes("driverSalaryPerDay"));
});

test("deposit and balance reconcile exactly at cents, including partial and full payment positions",()=>{
  assert.equal(validateProposalPaymentTerms(1000,250,"2027-01-01","2027-02-01"),null);
  assert.equal(proposalBalance(1000,250),750);
  assert.equal(250+proposalBalance(1000,250)!,1000);
  assert.equal(1000-250,750);
  assert.equal(1000-1000,0);
  assert.equal(proposalBalance(0.6,0.3),0.3);
});

test("invalid deposit, excessive discount-like amount and reversed dates fail before a proposal snapshot",()=>{
  assert.match(validateProposalPaymentTerms(1000,1000.001)??"",/cent-precise/);
  assert.match(validateProposalPaymentTerms(1000,1000.01)??"",/no greater/);
  assert.match(validateProposalPaymentTerms(-1,0)??"",/positive/);
  assert.match(validateProposalPaymentTerms(1000,null,"2027-01-01")??"",/positive deposit/);
  assert.match(validateProposalPaymentTerms(1000,250,"2027-02-01","2027-01-01")??"",/cannot precede/);
  assert.doesNotMatch(source("lib/proposals/customer-proposal.ts"),/Math\.min\(details\.depositAmount/);
});

test("an unsupported discount cannot enter the active proposal API",()=>{
  const route=source("app/api/admin/journey-proposals/route.ts");
  const service=source("lib/proposals/journey-proposal-service.ts");
  assert.doesNotMatch(route,/discountAmount|discountPercent|pricingAdjustments/);
  assert.match(service,/validateProposalPaymentTerms/);
  assert.match(service,/currencies\.size>1/);
});

test("accepted proposal snapshots remain the accounting basis after allocation changes",()=>{
  const proposal=source("supabase/migrations/202608120006_proposal_acceptance_integrity.sql");
  const accounting=source("supabase/migrations/202608120007_accounting_integrity.sql");
  const sync=source("lib/accounting/allocation-accounting.ts");
  assert.match(proposal,/snapshot_total is distinct from proposal_row\.total_selling_price/);
  assert.match(accounting,/join public\.journey_proposal_acceptances/);
  assert.match(accounting,/proposal_row\.commercial_snapshot->'summary'/);
  assert.match(sync,/if\(account&&isAcceptedProposalAccount\(account\)\)return \{account,synced:false\}/);
});

test("posted payments, supplier payables and confidential finance data retain their existing guards",()=>{
  const accounting=source("supabase/migrations/202608120007_accounting_integrity.sql");
  const roles=source("lib/admin/permissions.ts");
  const publicProposal=source("lib/proposals/customer-proposal-dto.ts");
  assert.match(accounting,/accounting_transactions_immutable/);
  assert.match(accounting,/idempotency_key=key_base\|\|':payment'/);
  assert.match(accounting,/Payment and waiver exceed the outstanding supplier balance/);
  assert.match(accounting,/Refund exceeds the net amount received/);
  assert.match(accounting,/settlement_row\.currency<>account_row\.currency/);
  assert.match(roles,/"finance\.payments\.manage"/);
  assert.doesNotMatch(publicProposal,/supplierCost|grossProfit|profitMargin|paymentReference|bankDetails/);
});
