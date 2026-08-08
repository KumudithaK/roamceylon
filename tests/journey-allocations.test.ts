import assert from "node:assert/strict";
import test from "node:test";
import {destinationAllocationKey,hasOwnPreferenceSnapshot,journeyAllocationScopes,vehicleAllocationKey} from "../lib/admin/journey-allocations.ts";
import {allocationFinancialSummary} from "../lib/admin/allocation-financials.ts";

test("supplier allocation scopes follow destinations and consecutive route legs",()=>{
  const scopes=journeyAllocationScopes(["sigiriya","kandy","ella"]);
  assert.deepEqual(scopes.map(scope=>scope.key),[
    destinationAllocationKey("accommodation","sigiriya"),
    destinationAllocationKey("guide","sigiriya"),
    destinationAllocationKey("accommodation","kandy"),
    destinationAllocationKey("guide","kandy"),
    destinationAllocationKey("accommodation","ella"),
    destinationAllocationKey("guide","ella"),
    vehicleAllocationKey("sigiriya","kandy"),
    vehicleAllocationKey("kandy","ella")
  ]);
});

test("experience providers become independent allocation scopes",()=>{
  const scopes=journeyAllocationScopes(["sigiriya","kandy"],[{experienceId:"perahera",destinationId:"kandy"}]);
  assert(scopes.some(scope=>scope.key==="experience:perahera"&&scope.destinationId==="kandy"));
});

test("allocation financials calculate supplier cost, selling price and margin",()=>{
  const summary=allocationFinancialSummary([
    {supplier_cost:900,selling_price:1200,confirmation_status:"confirmed"},
    {supplier_cost:300,selling_price:450,confirmation_status:"pending"},
    {supplier_cost:100,selling_price:200,confirmation_status:"cancelled"}
  ]);
  assert.deepEqual(summary,{totalSupplierCost:1200,totalSellingPrice:1650,grossProfit:450,profitMargin:27.27,incompleteLines:0});
});

test("legacy enquiries are distinguishable from traveller preference snapshots",()=>{
  assert.equal(hasOwnPreferenceSnapshot({state:{selectedDestinationIds:["sigiriya"]}},"destinationPreferences"),false);
  assert.equal(hasOwnPreferenceSnapshot({state:{destinationPreferences:{sigiriya:{stayPreference:"recommend"}}}},"destinationPreferences"),true);
  assert.equal(hasOwnPreferenceSnapshot({travelPreferencesByLeg:{}},"travelPreferencesByLeg"),true);
});
