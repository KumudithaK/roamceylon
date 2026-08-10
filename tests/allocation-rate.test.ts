import assert from "node:assert/strict";
import test from "node:test";
import {completeCustomJourneyRate,usesCustomJourneyRate} from "../lib/admin/allocation-rate.ts";

test("custom journey rates require a complete auditable service",()=>{
  assert.equal(usesCustomJourneyRate({customJourneyRate:true}),true);
  assert.equal(completeCustomJourneyRate({serviceName:"Private SUV transfer",quantity:1,quantityLabel:"journey leg",supplierCost:145}),true);
  assert.equal(completeCustomJourneyRate({serviceName:"Private SUV transfer",quantity:1,quantityLabel:"",supplierCost:145}),false);
  assert.equal(completeCustomJourneyRate({serviceName:"Private SUV transfer",quantity:1,quantityLabel:"journey leg",supplierCost:null}),false);
});
