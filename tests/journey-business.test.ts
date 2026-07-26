import assert from "node:assert/strict";
import test from "node:test";
import {availableDestinations,availableExperiences} from "../lib/journey/journey-selectors.ts";
import {calculateTripPrice,getDurationDays} from "../lib/journey/pricing.ts";
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

test("trip price reacts to travellers and duration",()=>{
  const settings={currency:"USD",accommodationTiers:{boutique:{label:"Boutique",nightlyPerGuest:60}},activityPerGuestUsd:46,routeDistanceFactor:1.3,estimateFactor:.92,guideDefaultDailyRateUsd:null,seasons:{shoulder:{months:[3],label:"Shoulder",multiplier:1}}};
  const price=calculateTripPrice({
    settings,
    experiences:[{price_per_person_usd:25}] as never,
    stays:[{nightly_rate_usd:100,pricing_tier:null}] as never,
    vehicle:{daily_rate_usd:50,per_km_rate_usd:0} as never,
    guide:{daily_rate_usd:30} as never,
    travellers:2,
    durationDays:4,
    distanceKm:0,
    destinationCount:2,
    startDate:"2026-03-01",
    currentMonth:3
  });
  assert.equal(price.knownTotal,616.4);
  assert.equal(price.complete,true);
  assert.equal(getDurationDays("2026-08-01","2026-08-05"),4);
});

test("unknown Supabase prices stay quote-required instead of being invented",()=>{
  const price=calculateTripPrice({
    settings:null,
    experiences:[{price_per_person_usd:null}] as never,
    stays:[],
    vehicle:null,
    guide:null,
    travellers:2,
    durationDays:2,
    distanceKm:0,
    destinationCount:1,
    startDate:"",
    currentMonth:3
  });
  assert.equal(price.complete,false);
  assert.equal(price.knownTotal,0);
});
