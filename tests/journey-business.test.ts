import assert from "node:assert/strict";
import test from "node:test";
import {availableDestinations,availableExperiences} from "../lib/journey/journey-selectors.ts";
import {calculatePackageQuote} from "../lib/pricing/package-engine.ts";
import type {SupplierCost} from "../lib/pricing/package-types.ts";
import {getNearbyDestinations,getRouteEstimate} from "../lib/journey/route.ts";
import {includeExperienceSelection,removeExperienceSelection} from "../lib/journey/journey-selection.ts";

test("external experience selection maps its parent theme and destination",()=>{
  const state={selectedThemeIds:["wellness"],selectedDestinationIds:[],selectedExperienceIds:[],selectedStayIdsByDestination:{},selectedVehicleId:null,selectedGuideId:null,selectedPricingPlanIds:{},travelDates:{start:"",end:""},travellerCounts:{adults:0,children:0,infants:0},experienceParticipants:{},budgetPreference:"flexible"};
  const experience={id:"tea-walk",themeIds:["nature"],destinationIds:["ella","nuwara-eliya"]};
  const selected=includeExperienceSelection(state as never,experience as never,{adults:2,children:0,infants:0},{adults:3,children:0,infants:0},"tea-private-rate");
  assert.deepEqual(selected.selectedThemeIds,["wellness","nature"]);
  assert.deepEqual(selected.selectedDestinationIds,["ella"]);
  assert.deepEqual(selected.selectedExperienceIds,["tea-walk"]);
  assert.deepEqual(selected.experienceParticipants["tea-walk"],{adults:2,children:0,infants:0});
  assert.equal(selected.selectedPricingPlanIds["experience:tea-walk"],"tea-private-rate");
  const removed=removeExperienceSelection(selected,"tea-walk");
  assert.deepEqual(removed.selectedExperienceIds,[]);
  assert.equal(removed.experienceParticipants["tea-walk"],undefined);
  assert.equal(removed.selectedPricingPlanIds["experience:tea-walk"],undefined);
});

test("theme selection returns the destination union without duplicates",()=>{
  const destinations=[
    {id:"ella",name:"Ella",themeIds:["nature"],display_order:0},
    {id:"kandy",name:"Kandy",themeIds:["culture","nature"],display_order:0}
  ];
  const result=availableDestinations(destinations as never,["nature","culture"]);
  assert.deepEqual(result.map(item=>item.id),["ella","kandy"]);
});

test("theme and destination selection returns only their intersecting experience union",()=>{
  const experiences=[
    {id:"train",name:"Train",destinationIds:["ella"],themeIds:["nature"]},
    {id:"tea",name:"Tea",destinationIds:["ella","kandy"],themeIds:["nature","culture"]},
    {id:"cricket",name:"Cricket",destinationIds:["kandy"],themeIds:["sporting"]},
    {id:"temple",name:"Temple",destinationIds:["kandy"],themeIds:["culture"]}
  ];
  const result=availableExperiences(experiences as never,["ella","kandy"],["nature"]);
  assert.deepEqual(result.map(item=>item.id),["tea","train"]);
  assert.deepEqual(result[0].matchedDestinationIds,["ella","kandy"]);
});

test("Sporting Sri Lanka never leaks unrelated experiences from its destinations",()=>{
  const experiences=[
    {id:"colombo-cricket",name:"Colombo Cricket",destinationIds:["colombo"],themeIds:["sporting"]},
    {id:"galle-golf",name:"Galle Golf",destinationIds:["galle"],themeIds:["sporting"]},
    {id:"colombo-food",name:"Colombo Food Walk",destinationIds:["colombo"],themeIds:["food"]},
    {id:"galle-fort",name:"Galle Fort Walk",destinationIds:["galle"],themeIds:["heritage"]},
    {id:"kandy-rafting",name:"Kandy Rafting",destinationIds:["kandy"],themeIds:["adventure"]}
  ];
  const sporting=availableExperiences(experiences as never,["colombo","galle","kandy"],["sporting"]);
  assert.deepEqual(sporting.map(item=>item.id),["colombo-cricket","galle-golf"]);
});

test("experience discovery stays hidden until both a theme and destination are selected",()=>{
  const experiences=[{id:"cricket",name:"Cricket",destinationIds:["colombo"],themeIds:["sporting"]}];
  assert.deepEqual(availableExperiences(experiences as never,["colombo"],[]),[]);
  assert.deepEqual(availableExperiences(experiences as never,[],["sporting"]),[]);
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

test("destination discovery returns the nearest places without the current destination",()=>{
  const destinations=[
    {id:"ahungalla",slug:"ahungalla",name:"Ahungalla",latitude:6.3152,longitude:80.0303},
    {id:"bentota",slug:"bentota",name:"Bentota",latitude:6.4189,longitude:79.9971},
    {id:"galle",slug:"galle",name:"Galle",latitude:6.0329,longitude:80.2168},
    {id:"missing",slug:"missing",name:"Missing",latitude:null,longitude:null}
  ];
  const nearby=getNearbyDestinations(destinations,"ahungalla",2);
  assert.deepEqual(nearby.map(item=>item.id),["bentota","galle"]);
  assert(nearby.every(item=>item.estimatedDistance>0));
});

test("DMC package price includes supplier, operational, overhead and margin costs",()=>{
  const config={currency:"USD",roomOccupancy:2,childCostFactor:.5,routeDistanceBufferPercent:0,driverSalaryPerDay:40,fuelPricePerLitre:2,vehicleKmPerLitre:10,tollsPerJourney:10,parkingPerDay:5,guideAccommodationPerNight:25,airportTransferEachWay:30,administrationFixed:20,administrationPercent:5,contingencyPercent:10,serviceFeeFixed:10,serviceFeePercent:5,targetProfitMarginPercent:20};
  const selection={selectedDestinationIds:["d1"],selectedExperienceIds:["e1"],selectedStayIds:["a1"],selectedVehicleId:"v1",selectedGuideId:"g1",selectedPricingPlanIds:{},travelDates:{start:"2026-08-01",end:"2026-08-05"},travellerCounts:{adults:2,children:1,infants:0},experienceParticipants:{e1:{adults:2,children:1,infants:0}}};
  const supplierCosts:SupplierCost[]=[
    {id:"1",entityType:"accommodation",entityId:"a1",category:"Accommodation",unit:"per_room_night",amount:100,partnerCommissionPercent:null},
    {id:"2",entityType:"vehicle",entityId:"v1",category:"Vehicle rental",unit:"per_vehicle_day",amount:50,partnerCommissionPercent:null},
    {id:"3",entityType:"vehicle",entityId:"v1",category:"Vehicle distance",unit:"per_kilometre",amount:.5,partnerCommissionPercent:null},
    {id:"4",entityType:"guide",entityId:"g1",category:"Guide fee",unit:"per_guide_day",amount:30,partnerCommissionPercent:null},
    {id:"5",entityType:"experience",entityId:"e1",category:"Experience",unit:"per_person",amount:20,partnerCommissionPercent:null}
  ];
  const quote=calculatePackageQuote({config,supplierCosts,selection,durationDays:2,distanceKm:100});
  assert.equal(quote.public.status,"ready");
  assert.equal(quote.internalCost,1529.28);
  assert.equal(quote.sellingPrice,2019.68);
  assert.equal(quote.public.totalPackagePrice,2019.68);
  assert.equal(quote.public.pricePerPerson,673.23);
  assert.equal(quote.public.components?.reduce((total,item)=>total+item.amount,0),1305);
  assert.deepEqual(quote.public.components?.map(item=>item.label),["Accommodation","Private transport","Experiences","Local guide"]);
  assert.equal(quote.public.components?.find(item=>item.category==="experiences")?.amount,50);
  assert(!JSON.stringify(quote.public).includes("Driver salary"));
  assert(!JSON.stringify(quote.public).includes("Profit"));
  assert(!quote.breakdown.some(line=>line.label==="Airport transfers"));
  assert(quote.breakdown.some(line=>line.label==="Fuel"));
  assert(quote.breakdown.some(line=>line.label==="Roam Ceylon service fee"));
  const buffered=calculatePackageQuote({config:{...config,routeDistanceBufferPercent:30},supplierCosts,selection,durationDays:2,distanceKm:100});
  assert(buffered.sellingPrice!>quote.sellingPrice!);
  assert.equal(buffered.breakdown.find(line=>line.label==="Vehicle distance")?.amount,65);
  assert.equal(buffered.breakdown.find(line=>line.label==="Fuel")?.amount,26);
});

test("missing confidential inputs require a manual quote instead of inventing costs",()=>{
  const config={currency:"USD",roomOccupancy:2,childCostFactor:1,routeDistanceBufferPercent:0,driverSalaryPerDay:null,fuelPricePerLitre:null,vehicleKmPerLitre:null,tollsPerJourney:null,parkingPerDay:null,guideAccommodationPerNight:null,airportTransferEachWay:null,administrationFixed:null,administrationPercent:null,contingencyPercent:null,serviceFeeFixed:null,serviceFeePercent:null,targetProfitMarginPercent:null};
  const selection={selectedDestinationIds:["d1"],selectedExperienceIds:["e1"],selectedStayIds:[],selectedVehicleId:null,selectedGuideId:null,selectedPricingPlanIds:{},travelDates:{start:"",end:""},travellerCounts:{adults:2,children:0,infants:0},experienceParticipants:{e1:{adults:2,children:0,infants:0}}};
  const quote=calculatePackageQuote({config,supplierCosts:[],selection,durationDays:1,distanceKm:0});
  assert.equal(quote.public.status,"requires_manual_quote");
  assert.equal(quote.public.totalPackagePrice,null);
  assert(quote.missingInputs.includes("supplierCost:experience:e1"));
});

test("experience pricing uses that experience's participants, not the whole journey",()=>{
  const config={currency:"USD",roomOccupancy:2,childCostFactor:.5,routeDistanceBufferPercent:0,driverSalaryPerDay:null,fuelPricePerLitre:null,vehicleKmPerLitre:null,tollsPerJourney:null,parkingPerDay:null,guideAccommodationPerNight:null,airportTransferEachWay:0,administrationFixed:0,administrationPercent:0,contingencyPercent:0,serviceFeeFixed:0,serviceFeePercent:0,targetProfitMarginPercent:0};
  const selection={selectedDestinationIds:[],selectedExperienceIds:["e1"],selectedStayIds:[],selectedVehicleId:null,selectedGuideId:null,selectedPricingPlanIds:{},travelDates:{start:"2026-08-01",end:"2026-08-02"},travellerCounts:{adults:4,children:0,infants:0},experienceParticipants:{e1:{adults:2,children:0,infants:0}}};
  const supplierCosts:SupplierCost[]=[{id:"experience-plan",entityType:"experience",entityId:"e1",category:"Experience",unit:"per_person",amount:25,partnerCommissionPercent:null}];
  const quote=calculatePackageQuote({config,supplierCosts,selection,durationDays:1,distanceKm:0});
  assert.equal(quote.breakdown.find(line=>line.label==="Experience")?.amount,50);
  assert.equal(quote.public.totalPackagePrice,50);
  const updated=calculatePackageQuote({config,supplierCosts,selection:{...selection,experienceParticipants:{e1:{adults:1,children:0,infants:0}}},durationDays:1,distanceKm:0});
  assert.equal(updated.breakdown.find(line=>line.label==="Experience")?.amount,25);
  assert.equal(updated.public.totalPackagePrice,25);
});

test("public experience total is the exact sum of every selected experience and its participants",()=>{
  const config={currency:"USD",roomOccupancy:2,childCostFactor:.5,routeDistanceBufferPercent:0,driverSalaryPerDay:null,fuelPricePerLitre:null,vehicleKmPerLitre:null,tollsPerJourney:null,parkingPerDay:null,guideAccommodationPerNight:null,airportTransferEachWay:30,administrationFixed:20,administrationPercent:5,contingencyPercent:10,serviceFeeFixed:10,serviceFeePercent:5,targetProfitMarginPercent:20};
  const selection={selectedDestinationIds:[],selectedExperienceIds:["perahera","boat"],selectedStayIds:[],selectedVehicleId:null,selectedGuideId:null,selectedPricingPlanIds:{},travelDates:{start:"2026-08-01",end:"2026-08-02"},travellerCounts:{adults:4,children:1,infants:0},experienceParticipants:{perahera:{adults:2,children:0,infants:0},boat:{adults:1,children:1,infants:0}}};
  const supplierCosts:SupplierCost[]=[
    {id:"perahera-plan",entityType:"experience",entityId:"perahera",category:"Perahera tickets",unit:"per_person",amount:100,partnerCommissionPercent:null},
    {id:"boat-plan",entityType:"experience",entityId:"boat",category:"Boat tickets",unit:"per_person",amount:40,partnerCommissionPercent:null}
  ];
  const quote=calculatePackageQuote({config,supplierCosts,selection,durationDays:1,distanceKm:0});
  assert.equal(quote.breakdown.find(line=>line.label==="Perahera tickets")?.amount,200);
  assert.equal(quote.breakdown.find(line=>line.label==="Boat tickets")?.amount,60);
  assert.equal(quote.public.components?.find(item=>item.category==="experiences")?.amount,260);
  assert(quote.public.totalPackagePrice!>260);
  assert(!quote.breakdown.some(line=>line.label==="Airport transfers"));
});

test("destination pricing records never charge a journey",()=>{
  const config={currency:"USD",roomOccupancy:2,childCostFactor:1,routeDistanceBufferPercent:0,driverSalaryPerDay:null,fuelPricePerLitre:null,vehicleKmPerLitre:null,tollsPerJourney:null,parkingPerDay:null,guideAccommodationPerNight:null,airportTransferEachWay:0,administrationFixed:0,administrationPercent:0,contingencyPercent:0,serviceFeeFixed:0,serviceFeePercent:0,targetProfitMarginPercent:0};
  const selection={selectedDestinationIds:["kandy"],selectedExperienceIds:["perahera"],selectedStayIds:[],selectedVehicleId:null,selectedGuideId:null,selectedPricingPlanIds:{},travelDates:{start:"2026-08-01",end:"2026-08-02"},travellerCounts:{adults:2,children:0,infants:0},experienceParticipants:{perahera:{adults:2,children:0,infants:0}}};
  const supplierCosts:SupplierCost[]=[
    {id:"perahera-plan",entityType:"experience",entityId:"perahera",category:"Perahera tickets",unit:"per_person",amount:100,partnerCommissionPercent:null},
    {id:"legacy-destination-fee",entityType:"destination",entityId:"kandy",category:"Destination entry fee",unit:"per_person",amount:53,partnerCommissionPercent:null}
  ];
  const quote=calculatePackageQuote({config,supplierCosts,selection,durationDays:1,distanceKm:0});
  assert.equal(quote.public.totalPackagePrice,200);
  assert.equal(quote.public.components?.find(item=>item.category==="experiences")?.amount,200);
  assert(!quote.breakdown.some(line=>line.label==="Destination entry fee"));
});
