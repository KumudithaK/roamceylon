import assert from "node:assert/strict";
import {existsSync,readFileSync} from "node:fs";
import path from "node:path";
import {spawnSync} from "node:child_process";
import test from "node:test";
import ts from "typescript";
import {overnightJourneyDuration,departureDateIssue} from "../lib/journey/journey-dates.ts";
import {createCuratedItinerary,curatedJourneyDuration,normaliseCuratedItinerary,validateCuratedJourney} from "../lib/journey/curated-journey.ts";
import {calculateJourneyEstimateRange,type EstimateEnvelopeInput} from "../lib/pricing/journey-estimate-engine.ts";
import type {JourneyState} from "../features/journey/journey-store.ts";
import type {JourneyEstimateRequest,PublicJourneyEstimate} from "../lib/pricing/journey-estimate-types.ts";

const cases:[string,string,number][]=[
  ["2027-01-10","2027-01-11",1],
  ["2027-01-17","2027-01-29",12],
  ["2027-01-31","2027-02-02",2],
  ["2027-12-31","2028-01-02",2],
  ["2028-02-28","2028-03-01",2],
  ["2027-02-28","2027-03-01",1],
  ["2027-03-13","2027-03-15",2],
  ["2027-11-06","2027-11-08",2]
];
for(const [start,end,nights] of cases)test(`calendar duration ${start} to ${end}: ${nights+1} days / ${nights} nights`,()=>{
  assert.deepEqual(overnightJourneyDuration(start,end),{days:nights+1,nights});
});

test("same-date overnight rejection remains separate from the public departure-date rule",()=>{
  assert.equal(overnightJourneyDuration("2027-01-17","2027-01-17"),null);
  assert.equal(departureDateIssue("2027-01-17","2027-01-17"),"");
  const validation=validateCuratedJourney(createCuratedItinerary(brief("2027-01-17","2027-01-17",[0])));
  assert.equal(validation.duration,0);
  assert.match(validation.errors.join(" "),/valid journey start and end/);
});

test("missing, malformed, impossible and reversed calendar dates remain invalid",()=>{
  for(const [start,end] of [
    ["","2027-01-29"],["2027-01-17",""],["2027-1-17","2027-01-29"],
    ["2027-01-17T00:00:00Z","2027-01-29"],["2027-02-29","2027-03-02"],
    ["2028-02-30","2028-03-02"],["2027-13-01","2028-01-02"],
    ["2027-01-17","2027-01-00"],["2027-01-29","2027-01-17"]
  ]){
    assert.equal(overnightJourneyDuration(start,end),null,`${start} → ${end}`);
    assert(validateCuratedJourney(createCuratedItinerary(brief(start,end,[0]))).errors.includes("Choose valid journey start and end dates."));
  }
});

test("duration does not depend on the process timezone or daylight-saving changes",()=>{
  const url=new URL("../lib/journey/journey-dates.ts",import.meta.url).href;
  const code=`import {overnightJourneyDuration} from ${JSON.stringify(url)};console.log(JSON.stringify([overnightJourneyDuration('2027-03-13','2027-03-15'),overnightJourneyDuration('2027-11-06','2027-11-08')]));`;
  for(const zone of ["Asia/Colombo","America/New_York","Pacific/Auckland"]){
    const result=spawnSync(process.execPath,["--input-type=module","-e",code],{env:{...process.env,TZ:zone},encoding:"utf8"});
    assert.equal(result.status,0,result.stderr);
    assert.deepEqual(JSON.parse(result.stdout),[{days:3,nights:2},{days:3,nights:2}],zone);
  }
});

function brief(start="2027-01-17",end="2027-01-29",nights=[1,3,2,3,3]):JourneyState{
  const destinations=["colombo","sigiriya","kandy","ella","galle"].slice(0,nights.length);
  return {
    currentStep:6,selectedThemeIds:["heritage"],selectedDestinationIds:destinations,selectedExperienceIds:[],
    destinationPreferences:Object.fromEntries(destinations.map((id,index)=>[id,{nights:nights[index],stayPreference:"recommend",guidePreference:"recommend",specialistGuidePreference:"none",notes:""}])),
    journeyGuidePreference:"national_tourist_guide",journeyGuideLanguages:["English"],journeyGuideNotes:"",
    pickup:{type:"airport",airportCode:"CMB",location:"",date:start,time:"10:00",flightNumber:""},
    dropoff:{type:"airport",airportCode:"CMB",location:"",date:end,time:"18:00",flightNumber:""},
    globalTravelPreference:"high_roof_van",travelPreferencesByLeg:{},selectedStayIdsByDestination:{},
    selectedVehicleId:null,selectedGuideId:null,selectedPricingPlanIds:{},travelDates:{start,end},
    travellerCounts:{adults:4,children:0,infants:0},experienceParticipants:{},budgetPreference:"balanced",travelPace:"balanced",accessibilityRequirements:""
  };
}

test("the reproduced 2027 five-stop 12-night itinerary passes with 13 calendar days",()=>{
  const itinerary=createCuratedItinerary(brief()),result=validateCuratedJourney(itinerary);
  assert.equal(curatedJourneyDuration(itinerary),13);
  assert.deepEqual(result,{duration:13,availableNights:12,plannedNights:12,errors:[],warnings:[]});
});

test("one-night journeys accept a full stay allocation",()=>{
  assert.deepEqual(validateCuratedJourney(createCuratedItinerary(brief("2027-01-10","2027-01-11",[1]))),{duration:2,availableNights:1,plannedNights:1,errors:[],warnings:[]});
});

test("genuinely overallocated nights still block progression",()=>{
  const result=validateCuratedJourney(createCuratedItinerary(brief("2027-01-17","2027-01-29",[1,3,2,3,4])));
  assert.equal(result.availableNights,12);
  assert.deepEqual(result.errors,["Planned stays use 13 nights, but the journey has 12."]);
});

test("underallocated nights remain advisory and accurately report the open night",()=>{
  const result=validateCuratedJourney(createCuratedItinerary(brief("2027-01-17","2027-01-29",[1,3,2,3,2])));
  assert.deepEqual(result.errors,[]);
  assert.deepEqual(result.warnings,["1 journey night is still open for planning."]);
});

test("revising design dates preserves the immutable original request",()=>{
  const original=brief("2027-01-10","2027-01-22"),before=JSON.stringify(original),design=createCuratedItinerary(original);
  const revised=normaliseCuratedItinerary({...design,travelDates:{start:"2027-01-17",end:"2027-01-29"},pickup:{...design.pickup,date:"2027-01-17"},dropoff:{...design.dropoff,date:"2027-01-29"}},original);
  assert.equal(JSON.stringify(original),before);
  assert.deepEqual(validateCuratedJourney(revised).errors,[]);
  assert.equal(curatedJourneyDuration(revised),13);
  assert.deepEqual(design.travelDates,{start:"2027-01-10",end:"2027-01-22"});
});

const root=path.resolve(import.meta.dirname,"..");
// Execute the actual estimate service with a read-only in-memory catalogue.
// Only the server marker and database client are replaced; pricing/date logic is real.
function estimateService(bandsAvailable=true){
  const captured:EstimateEnvelopeInput[]=[],cache=new Map<string,Record<string,unknown>>();
  const rows:Record<string,unknown[]>={
    tour_pricing_config:[{currency:"USD",room_occupancy:2,child_cost_factor:.5,route_distance_buffer_percent:0,driver_salary_per_day:25,fuel_price_per_litre:1,vehicle_km_per_litre:10,tolls_per_journey:0,parking_per_day:5,guide_accommodation_per_night:2,airport_transfer_each_way:0,administration_fixed:0,administration_percent:0,contingency_percent:0,service_fee_fixed:0,service_fee_percent:0,target_profit_margin_percent:0,estimate_lower_buffer_percent:0,estimate_upper_buffer_percent:0}],
    journey_estimate_bands:bandsAvailable?[
      {key:"stay:recommend",active:true,minimum:100,maximum:150},
      {key:"guide:national_tourist_guide",active:true,minimum:10,maximum:20},
      {key:"transport:high_roof_van",active:true,minimum:50,maximum:70}
    ]:[],
    destinations:[{id:"colombo",name:"Synthetic Colombo",latitude:6.9,longitude:79.8}],
    accommodations:[],vehicles:[],guides:[],vehicle_destinations:[],guide_destinations:[],guide_experiences:[]
  };
  const database={from(table:string){
    assert(table in rows,`Unexpected database surface: ${table}`);
    const result=Promise.resolve({data:rows[table],error:null});
    return {select(){return this},eq(){return this},in(){return this},order(){return this},single(){return Promise.resolve({data:rows[table][0]??null,error:null})},then:result.then.bind(result)};
  }};
  function load(filename:string):Record<string,unknown>{
    if(cache.has(filename))return cache.get(filename)!;
    const code=ts.transpileModule(readFileSync(filename,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
    const loaded={exports:{} as Record<string,unknown>};cache.set(filename,loaded.exports);
    const require=(id:string)=>{
      if(id==="server-only")return {};
      if(id==="@/lib/supabase/admin")return {createAdminClient:()=>database};
      if(id==="./journey-estimate-engine")return {calculateJourneyEstimateRange:(input:EstimateEnvelopeInput)=>{captured.push(input);return calculateJourneyEstimateRange(input)}};
      const base=id.startsWith("@/")?path.join(root,id.slice(2)):path.resolve(path.dirname(filename),id);
      const resolved=[base,base+".ts",base+".tsx"].find(existsSync);
      assert(resolved,`Unresolved test import: ${id}`);
      return load(resolved);
    };
    new Function("require","module","exports",code)(require,loaded,loaded.exports);
    return loaded.exports;
  }
  const Service=load(path.join(root,"lib/pricing/journey-estimate-service.ts")).JourneyEstimateService as new()=>{estimate(request:JourneyEstimateRequest):Promise<PublicJourneyEstimate>};
  return {service:new Service(),captured};
}

function estimateRequest(start="2027-01-17",end="2027-01-29",nights=12,withTransport=false):JourneyEstimateRequest{
  const state=brief(start,end,[nights]);
  return {...state,travellerCounts:{adults:2,children:0,infants:0},pickup:{...state.pickup,type:withTransport?"airport":null},dropoff:{...state.dropoff,type:withTransport?"airport":null}};
}

test("actual planning-estimate service matches curated days and accommodation/guide nights",async()=>{
  const {service,captured}=estimateService(),request=estimateRequest(),result=await service.estimate(request);
  assert.equal(result.status,"estimated_range");
  assert.equal(result.durationDays,13);
  assert.equal(result.durationDays,validateCuratedJourney(createCuratedItinerary(brief())).duration);
  assert.deepEqual(captured[0].unavailableInputs,[]);
  assert.deepEqual(captured[0].components,[{category:"Accommodation in Synthetic Colombo",minimum:2400,maximum:3600},{category:"Primary guide",minimum:130,maximum:260}]);
  assert.equal(captured[0].operationsCost,24);
});

test("daily guide, driver and parking costs include the departure calendar day",async()=>{
  const {service,captured}=estimateService();
  await service.estimate(estimateRequest("2027-01-17","2027-01-29",12,true));
  assert.equal(captured[0].durationDays,13);
  const guide=captured[0].components.find(item=>item.category==="Primary guide");
  assert.deepEqual(guide,{category:"Primary guide",minimum:130,maximum:260});
  // 13 driver/parking days + 12 guide-accommodation nights + actual buffered route fuel.
  const {getRouteEstimate}=await import("../lib/journey/route.ts");
  const airport={id:"airport:CMB",slug:"",name:"",latitude:7.1808,longitude:79.8841},stop={id:"colombo",slug:"",name:"",latitude:6.9,longitude:79.8};
  const distance=getRouteEstimate([airport,stop],[airport.id,stop.id]).estimatedDistance+getRouteEstimate([stop,airport],[stop.id,airport.id]).estimatedDistance;
  assert.equal(captured[0].operationsCost,13*(25+5)+12*2+distance/10);
});

test("estimate rejects excess nights but preserves honest open-night allowances",async()=>{
  const over=estimateService(),overResult=await over.service.estimate(estimateRequest("2027-01-17","2027-01-29",13));
  assert.equal(overResult.status,"tailored");
  assert(overResult.context.unavailableInputs.includes("planned nights within the journey duration"));
  const under=estimateService(),underResult=await under.service.estimate(estimateRequest("2027-01-17","2027-01-29",11));
  assert.equal(underResult.status,"estimated_range");
  assert.deepEqual(under.captured[0].components.find(item=>item.category==="Accommodation nights open for recommendation"),{category:"Accommodation nights open for recommendation",minimum:200,maximum:300});
});

test("estimate boundaries share the calendar utility and invalid dates remain unpriced",async()=>{
  for(const [start,end,nights] of cases){
    const {service}=estimateService(),result=await service.estimate(estimateRequest(start,end,nights));
    assert.equal(result.status,"estimated_range");assert.equal(result.durationDays,nights+1);
  }
  for(const [start,end] of [["2027-01-17","2027-01-17"],["2027-01-29","2027-01-17"],["2027-02-30","2027-03-03"],["","2027-01-29"]]){
    const {service}=estimateService(),result=await service.estimate(estimateRequest(start,end,0));
    assert.equal(result.status,"tailored");assert.equal(result.durationDays,0);
    assert(result.context.unavailableInputs.includes("complete travel dates"));
  }
});

test("correct duration does not manufacture a price when verified pricing is absent",async()=>{
  const {service}=estimateService(false),result=await service.estimate(estimateRequest());
  assert.equal(result.durationDays,13);
  assert.equal(result.status,"tailored");
  assert(result.context.unavailableInputs.includes("accommodation planning range for recommend"));
  assert.equal(result.totalMin,null);assert.equal(result.totalMax,null);
});
