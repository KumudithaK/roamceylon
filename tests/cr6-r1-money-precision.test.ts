import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import {isCentPrecise} from "../lib/pricing/money-precision.ts";
import {validateProposalPaymentTerms} from "../lib/pricing/proposal-payment.ts";

const migration=readFileSync("supabase/migrations/202609230001_cr6_cent_precision.sql","utf8");
const route=(path:string)=>readFileSync(`app/api/admin/${path}/route.ts`,"utf8");

test("launch-currency money accepts cents, including signed accounting differences",()=>{
  for(const value of [0,0.01,1,10.1,99.99,1000,100000000.01,-0.01,-1000])assert.equal(isCentPrecise(value),true,String(value));
});

test("launch-currency money rejects sub-cents and non-finite input",()=>{
  for(const value of [0.001,1.999,10.001,99.999,10.0000000005,-0.001,NaN,Infinity,-Infinity])assert.equal(isCentPrecise(value),false,String(value));
  assert.match(validateProposalPaymentTerms(100,0.001)??"",/cent-precise/);
});

test("durable constraints include supplier, proposal, acceptance, receipt, settlement and snapshot fields",()=>{
  for(const field of [
    "journey_supplier_allocations.supplier_cost","journey_supplier_allocations.selling_price",
    "journey_proposals.total_selling_price","journey_proposal_acceptances.accepted_total",
    "accounting_transactions.amount","journey_settlements.amount_due",
    "journey_settlements.amount_paid","journey_accounts.amount_received",
    "journey_cancellation_cases.approved_refund","pricing_plans.price"
  ])assert(migration.includes(field),field);
  for(const snapshot of ["estimate_snapshot","pricing_plan_snapshot","allocation_snapshot","commercial_snapshot","customer_snapshot","sent_snapshot","quote_snapshot"])
    assert(migration.includes(`finance_snapshot_cent_precise(${snapshot})`),snapshot);
  assert.match(migration,/add constraint %I check \(%I::text not in/);
  assert.match(migration,/%I = round\(%I, 2\)/);
  assert.doesNotMatch(migration,/\bupdate public\./i);
});

test("staff money write paths reject invalid precision before the database",()=>{
  for(const path of [
    "journey-allocations","journey-proposals","benefits", "accounting/post",
    "accounting/transactions","accounting/settlements","accounting/reversals", "accounting/cancellations"
  ])assert.match(route(path),/isCentPrecise/,path);
  assert.match(readFileSync("app/api/enquiries/route.ts","utf8"),/perPersonMin:[^\n]*refine\(isCentPrecise/);
});
