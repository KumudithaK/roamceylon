import assert from "node:assert/strict";
import test from "node:test";
import {availableDestinations,availableExperiences} from "../lib/journey/journey-selectors.ts";
import {calculatePackageQuote} from "../lib/pricing/package-engine.ts";
import type {SupplierCost} from "../lib/pricing/package-types.ts";
import {getRouteEstimate} from "../lib/journey/route.ts";

test("theme selection returns the destination union without duplicates",()=>{
  const destinations=[
    {id:"ella",name:"Ella",themeIds:["nature"],display_order:0},
    {id:"kandy",name:"Kandy",themeIds:["culture","nature"],display_order:0}
  ];
  const result=availableDestinations(destinations as never,["nature","culture"]);
  assert.deepEqual(result.map(item=>item.id),["ella","kandy"]);
});

test("destination selection returns the experience union",()=>{
  const experiences=[
    {id:"train",name:"Train",destinationIds:["ella"],themeIds:[]},
    {id:"tea",name:"Tea",destinationIds:["ella","kandy"],themeIds:[]}
  ];
  const result=availableExperiences(experiences as never,["ella","kandy"]);
  assert.deepEqual(result.map(item=>item.id),["tea","train"]);
  assert.deepEqual(result[0].matchedDestinationIds,["ella","kandy"]);
});

test("route estimate preserves selection order and computes distance",()=>{
  const destinations=[
    {id:"kandy",slug:"kandy",name:"Kandy",latitude:7.2906,longitude:80.6337},
    {id:"ella",slug:"ella",name:"Ella",latitude:6.8667,longitude:81.0466}
  ];
  const result=getRouteEstimate(destinations,["kandy","ella"]);
  assert.deepEqual(result.route.map(item=>item.id),["kandy","ella"]);
  assert(result.estimatedDistance>60);
  assert(result.estimatedTravelDays>=1);
});

test("DMC package price includes supplier, operational, overhead and margin costs",()=>{
  const config={currency:"USD",roomOccupancy:2,childCostFactor:.5,routeDistanceBufferPercent:0,driverSalaryPerDay:40,fuelPricePerLitre:2,vehicleKmPerLitre:10,tollsPerJourney:10,parkingPerDay:5,guideAccommodationPerNight:25,airportTransferEachWay:30,administrationFixed:20,administrationPercent:5,contingencyPercent:10,serviceFeeFixed:10,serviceFeePercent:5,targetProfitMarginPercent:20};
  const selection={selectedDestinationIds:["d1"],selectedExperienceIds:["e1"],selectedStayIds:["a1"],selectedVehicleId:"v1",selectedGuideId:"g1",travelDates:{start:"2026-08-01",end:"2026-08-05"},travellerCounts:{adults:2,children:1,infants:0},experienceParticipants:{e1:{adults:2,children:1,infants:0}}};
  const supplierCosts:SupplierCost[]=[
    {id:"1",entityType:"accommodation",entityId:"a1",category:"Accommodation",unit:"per_room_night",amount:100,partnerCommissionPercent:null},
    {id:"2",entityType:"vehicle",entityId:"v1",category:"Vehicle rental",unit:"per_vehicle_day",amount:50,partnerCommissionPercent:null},
    {id:"3",entityType:"vehicle",entityId:"v1",category:"Vehicle distance",unit:"per_kilometre",amount:.5,partnerCommissionPercent:null},
    {id:"4",entityType:"guide",entityId:"g1",category:"Guide fee",unit:"per_guide_day",amount:30,partnerCommissionPercent:null},
    {id:"5",entityType:"experience",entityId:"e1",category:"Experience",unit:"per_person",amount:20,partnerCommissionPercent:null},
    {id:"6",entityType:"destination",entityId:"d1",category:"Entrance tickets",unit:"per_person",amount:10,partnerCommissionPercent:null}
  ];
  const quote=calculatePackageQuote({config,supplierCosts,selection,durationDays:2,distanceKm:100});
  assert.equal(quote.public.status,"ready");
  assert.equal(quote.internalCost,1627.45);
  assert.equal(quote.sellingPrice,2148.53);
  assert.equal(quote.public.totalPackagePrice,2148.53);
  assert.equal(quote.public.pricePerPerson,716.18);
  assert.equal(quote.public.components?.reduce((total,item)=>total+item.amount,0),quote.public.totalPackagePrice);
  assert.deepEqual(quote.public.components?.map(item=>item.label),["Accommodation","Private transport","Experiences & entry fees","Local guide"]);
  assert(!JSON.stringify(quote.public).includes("Driver salary"));
  assert(!JSON.stringify(quote.public).includes("Profit"));
  assert(quote.breakdown.some(line=>line.label==="Fuel"));
  assert(quote.breakdown.some(line=>line.label==="Roam Ceylon service fee"));
  const buffered=calculatePackageQuote({config:{...config,routeDistanceBufferPercent:30},supplierCosts,selection,durationDays:2,distanceKm:100});
  assert(buffered.sellingPrice!>quote.sellingPrice!);
  assert.equal(buffered.breakdown.find(line=>line.label==="Vehicle distance")?.amount,65);
  assert.equal(buffered.breakdown.find(line=>line.label==="Fuel")?.amount,26);
});

test("missing confidential inputs require a manual quote instead of inventing costs",()=>{
  const config={currency:"USD",roomOccupancy:2,childCostFactor:1,routeDistanceBufferPercent:0,driverSalaryPerDay:null,fuelPricePerLitre:null,vehicleKmPerLitre:null,tollsPerJourney:null,parkingPerDay:null,guideAccommodationPerNight:null,airportTransferEachWay:null,administrationFixed:null,administrationPercent:null,contingencyPercent:null,serviceFeeFixed:null,serviceFeePercent:null,targetProfitMarginPercent:null};
  const selection={selectedDestinationIds:["d1"],selectedExperienceIds:["e1"],selectedStayIds:[],selectedVehicleId:null,selectedGuideId:null,travelDates:{start:"",end:""},travellerCounts:{adults:2,children:0,infants:0},experienceParticipants:{e1:{adults:2,children:0,infants:0}}};
  const quote=calculatePackageQuote({config,supplierCosts:[],selection,durationDays:1,distanceKm:0});
  assert.equal(quote.public.status,"requires_manual_quote");
  assert.equal(quote.public.totalPackagePrice,null);
  assert(quote.missingInputs.includes("supplierCost:experience:e1"));
});

test("experience pricing uses that experience's participants, not the whole journey",()=>{
  const config={currency:"USD",roomOccupancy:2,childCostFactor:.5,routeDistanceBufferPercent:0,driverSalaryPerDay:null,fuelPricePerLitre:null,vehicleKmPerLitre:null,tollsPerJourney:null,parkingPerDay:null,guideAccommodationPerNight:null,airportTransferEachWay:0,administrationFixed:0,administrationPercent:0,contingencyPercent:0,serviceFeeFixed:0,serviceFeePercent:0,targetProfitMarginPercent:0};
  const selection={selectedDestinationIds:[],selectedExperienceIds:["e1"],selectedStayIds:[],selectedVehicleId:null,selectedGuideId:null,travelDates:{start:"2026-08-01",end:"2026-08-02"},travellerCounts:{adults:4,children:0,infants:0},experienceParticipants:{e1:{adults:2,children:0,infants:0}}};
  const supplierCosts:SupplierCost[]=[{id:"experience-plan",entityType:"experience",entityId:"e1",category:"Experience",unit:"per_person",amount:25,partnerCommissionPercent:null}];
  const quote=calculatePackageQuote({config,supplierCosts,selection,durationDays:1,distanceKm:0});
  assert.equal(quote.breakdown.find(line=>line.label==="Experience")?.amount,50);
});
