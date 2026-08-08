import test from "node:test";
import assert from "node:assert/strict";
import {calculateAllocationCommercials} from "../lib/pricing/allocation-commercial.ts";
import {proposalLinePresentation} from "../lib/proposals/proposal-presentation.ts";
import {accommodationBillableQuantity} from "../lib/pricing/allocation-quantity.ts";

const config={driverSalaryPerDay:20,fuelPricePerLitre:1.5,vehicleKmPerLitre:10,tollsPerJourney:5,parkingPerDay:2,guideAccommodationPerNight:15,administrationFixed:10,administrationPercent:5,contingencyPercent:3,serviceFeeFixed:5,serviceFeePercent:2,targetProfitMarginPercent:20,routeDistanceBufferPercent:10};

test("allocation commercials apply DMC operations fees and target margin",()=>{
  const result=calculateAllocationCommercials([{type:"vehicle",supplierCost:100,sellingPrice:null,pricingPlanSnapshot:{details:{driverIncluded:false,fuelIncluded:false}},serviceDetails:{},confirmationStatus:"confirmed"}],config,{days:2,nights:1,distanceKm:100});
  assert.equal(result.totalSupplierCost,100);
  assert.equal(result.operationsCost,65.5);
  assert.equal(result.administrationFee,18.28);
  assert.equal(result.totalSellingPrice,247.6);
  assert.equal(result.incompleteLines,0);
});

test("manual traveller subtotals are a floor and are not marked up again",()=>{
  const result=calculateAllocationCommercials([{type:"accommodation",supplierCost:600,sellingPrice:1200,pricingPlanSnapshot:{},serviceDetails:{},confirmationStatus:"confirmed"}],{...config,driverSalaryPerDay:0,fuelPricePerLitre:0,tollsPerJourney:0,parkingPerDay:0,guideAccommodationPerNight:0},{days:3,nights:2,distanceKm:0});
  assert.equal(result.totalSellingPrice,1200);
  assert.ok(result.breakdown.some(line=>line.category==="commercial_floor"));
});

test("proposal wording describes a per-person accommodation rate clearly",()=>{
  const line=proposalLinePresentation({type:"accommodation",resourceName:"Anuradhapura Heritage Villa",serviceName:"Heritage stay",destinationName:"Anuradhapura",pricingPlanSnapshot:{chargingMethod:"per_person"},serviceDetails:{guests:4,nights:2}});
  assert.equal(line.title,"Anuradhapura Heritage Villa");
  assert.equal(line.subtitle,"Heritage stay · 4 guests × 2 nights · Anuradhapura");
});

test("per-person accommodation rates multiply guests by nights",()=>{
  const quantity=accommodationBillableQuantity("per_person",{rooms:2,nights:2,guests:4});
  assert.equal(quantity,8);
  assert.equal(quantity*150,1200);
});
