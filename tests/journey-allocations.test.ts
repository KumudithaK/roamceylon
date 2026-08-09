import assert from "node:assert/strict";
import test from "node:test";
import {destinationAllocationKey,hasOwnJourneyGuideSnapshot,hasOwnPreferenceSnapshot,journeyAllocationScopes,journeyGuideAllocationKey,vehicleAllocationKey} from "../lib/admin/journey-allocations.ts";
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
    vehicleAllocationKey("destination:sigiriya","destination:kandy"),
    vehicleAllocationKey("destination:kandy","destination:ella")
  ]);
});

test("complete route allocations include pickup and drop-off without treating endpoints as destinations",()=>{
  const transportLegs=[
    {fromLocationKey:"pickup",toLocationKey:"destination:sigiriya",fromDestinationId:null,toDestinationId:"sigiriya"},
    {fromLocationKey:"destination:sigiriya",toLocationKey:"destination:kandy",fromDestinationId:"sigiriya",toDestinationId:"kandy"},
    {fromLocationKey:"destination:kandy",toLocationKey:"dropoff",fromDestinationId:"kandy",toDestinationId:null}
  ];
  const vehicles=journeyAllocationScopes(["sigiriya","kandy"],[],{transportLegs}).filter(scope=>scope.type==="vehicle");
  assert.deepEqual(vehicles.map(scope=>scope.key),[
    vehicleAllocationKey("pickup","destination:sigiriya"),
    vehicleAllocationKey("destination:sigiriya","destination:kandy"),
    vehicleAllocationKey("destination:kandy","dropoff")
  ]);
  assert.equal(vehicles[0].fromDestinationId,null);
  assert.equal(vehicles[2].toDestinationId,null);
});

test("experience providers become independent allocation scopes",()=>{
  const scopes=journeyAllocationScopes(["sigiriya","kandy"],[{experienceId:"perahera",destinationId:"kandy"}]);
  assert(scopes.some(scope=>scope.key==="experience:perahera"&&scope.destinationId==="kandy"));
});

test("zero-night destinations do not require accommodation allocations",()=>{
  const scopes=journeyAllocationScopes(["sigiriya","anuradhapura"],[],{
    nightsByDestination:{sigiriya:2,anuradhapura:0},
    guidePreferencesByDestination:{sigiriya:"no_guide",anuradhapura:"no_guide"}
  });
  assert(scopes.some(scope=>scope.key===destinationAllocationKey("accommodation","sigiriya")));
  assert(!scopes.some(scope=>scope.key===destinationAllocationKey("accommodation","anuradhapura")));
});

test("national and chauffeur guide preferences create one journey-wide allocation",()=>{
  const scopes=journeyAllocationScopes(["sigiriya","anuradhapura"],[],{
    guidePreferencesByDestination:{sigiriya:"national_tourist_guide",anuradhapura:"chauffeur_tourist_guide"}
  });
  assert.equal(scopes.filter(scope=>scope.type==="guide").length,1);
  assert(scopes.some(scope=>scope.key===journeyGuideAllocationKey&&scope.destinationId===null));
});

test("specialist guides remain destination-specific and no-guide destinations are omitted",()=>{
  const scopes=journeyAllocationScopes(["sigiriya","anuradhapura"],[],{
    guidePreferencesByDestination:{sigiriya:"site_tourist_guide",anuradhapura:"no_guide"}
  });
  assert.deepEqual(scopes.filter(scope=>scope.type==="guide").map(scope=>scope.key),[destinationAllocationKey("guide","sigiriya")]);
});

test("global guide model creates one primary guide and multiple requested specialists",()=>{
  const scopes=journeyAllocationScopes(["sigiriya","kandy","galle"],[],{
    journeyGuidePreference:"national_tourist_guide",
    specialistGuidePreferencesByDestination:{sigiriya:"archaeological_guide",kandy:"temple_specialist",galle:"none"}
  });
  const guides=scopes.filter(scope=>scope.type==="guide");
  assert.equal(guides.length,3);
  assert.deepEqual(guides.map(scope=>scope.key),[journeyGuideAllocationKey,destinationAllocationKey("guide","sigiriya"),destinationAllocationKey("guide","kandy")]);
  assert.equal(guides[0].guideRole,"primary");
  assert.equal(guides[1].guideRole,"specialist");
  assert.equal(guides[1].guideSpeciality,"archaeological_guide");
});

test("no primary guide still permits a destination specialist",()=>{
  const scopes=journeyAllocationScopes(["yala"],[],{journeyGuidePreference:"no_guide",specialistGuidePreferencesByDestination:{yala:"wildlife_tracker"}});
  assert.deepEqual(scopes.filter(scope=>scope.type==="guide").map(scope=>scope.key),[destinationAllocationKey("guide","yala")]);
});

test("chauffeur and recommendation preferences each require one journey guide",()=>{
  for(const journeyGuidePreference of ["chauffeur_tourist_guide","recommend"]){
    const scopes=journeyAllocationScopes(["kandy","galle"],[],{journeyGuidePreference,specialistGuidePreferencesByDestination:{}});
    assert.deepEqual(scopes.filter(scope=>scope.type==="guide").map(scope=>scope.key),[journeyGuideAllocationKey]);
  }
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
  assert.equal(hasOwnJourneyGuideSnapshot({state:{destinationPreferences:{}}}),false);
  assert.equal(hasOwnJourneyGuideSnapshot({state:{journeyGuidePreference:"no_guide"}}),true);
});
