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
  const price=calculateTripPrice({
    experiences:[{price_per_person_usd:25}] as never,
    stays:[{nightly_rate_usd:100}] as never,
    vehicle:{daily_rate_usd:50} as never,
    guide:{daily_rate_usd:30} as never,
    travellers:2,
    durationDays:4
  });
  assert.equal(price.knownTotal,670);
  assert.equal(price.complete,true);
  assert.equal(getDurationDays("2026-08-01","2026-08-05"),4);
});

test("unknown Supabase prices stay quote-required instead of being invented",()=>{
  const price=calculateTripPrice({
    experiences:[{price_per_person_usd:null}] as never,
    stays:[],
    vehicle:null,
    guide:null,
    travellers:2,
    durationDays:2
  });
  assert.equal(price.complete,false);
  assert.equal(price.knownTotal,0);
});
