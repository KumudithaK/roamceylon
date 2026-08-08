import assert from "node:assert/strict";
import test from "node:test";
import {destinationAllocationKey,hasOwnPreferenceSnapshot,journeyAllocationScopes,vehicleAllocationKey} from "../lib/admin/journey-allocations.ts";

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

test("legacy enquiries are distinguishable from traveller preference snapshots",()=>{
  assert.equal(hasOwnPreferenceSnapshot({state:{selectedDestinationIds:["sigiriya"]}},"destinationPreferences"),false);
  assert.equal(hasOwnPreferenceSnapshot({state:{destinationPreferences:{sigiriya:{stayPreference:"recommend"}}}},"destinationPreferences"),true);
  assert.equal(hasOwnPreferenceSnapshot({travelPreferencesByLeg:{}},"travelPreferencesByLeg"),true);
});
