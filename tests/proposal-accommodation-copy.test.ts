import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import ts from "typescript";
import type {ProposalSnapshot} from "../lib/proposals/customer-proposal-types";

const destinationId="00000000-0000-4000-8000-00000000c718";
const pendingNote="Accommodation is subject to confirmation.";
function composeWithAccommodation(confirmationStatus:string|null){
  const state={selectedDestinationIds:[destinationId],selectedExperienceIds:[],
    destinationPreferences:{[destinationId]:{nights:confirmationStatus===null?0:2}},
    travelDates:{start:"2027-01-17",end:"2027-01-19"},travellerCounts:{adults:1,children:0,infants:0},
    pickup:{type:null,time:""},dropoff:{type:null,time:""},accessibilityRequirements:""};
  const contact={hotline:"TEST ONLY",whatsappUrl:"",facebookUrl:"",address:""};
  const overrides:Record<string,unknown>={
    "server-only":{},
    "@/lib/journey/journey-endpoints":{endpointLabel:()=>"Journey endpoint"},
    "@/lib/journey/curated-journey":{normaliseCuratedItinerary:()=>state},
    "@/lib/journey/quotation-handoff":{parseJourneyHandoff:()=>({state})},
    "@/lib/pricing/proposal-payment":{proposalBalance:(total:number,deposit:number|null)=>total-(deposit??0)},
    "@/lib/brand":{brand:{name:"The Ceylon Edition",tagline:"Test only"}},
    "./customer-proposal-content":{approvedProposalContact:()=>contact,customerProposalContent:(value:unknown)=>value}
  };
  const isolatedModule={exports:{} as Record<string,unknown>};
  const code=ts.transpileModule(readFileSync(new URL("../lib/proposals/customer-proposal.ts",import.meta.url),"utf8"),{
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
  }).outputText;
  new Function("require","module","exports",code)((name:string)=>{
    assert(Object.hasOwn(overrides,name),"Unexpected module in isolated composer test: "+name);
    return overrides[name];
  },isolatedModule,isolatedModule.exports);
  const rows:Record<string,unknown[]>={
    destinations:[{id:destinationId,name:"Ahungalla",short_description:"Test destination",local_highlights:[],latitude:6,longitude:80}],
    accommodations:[{id:destinationId,name:"UAT ONLY stay"}],journey_accounts:[]
  };
  const database={from:(name:string)=>{
    const data=rows[name]??[];
    const query={select:()=>query,in:()=>query,eq:()=>query,
      maybeSingle:async()=>({data:data[0]??null,error:null}),
      then:(resolve:(value:unknown)=>unknown)=>Promise.resolve({data,error:null}).then(resolve)};
    return query;
  }};
  const allocation=confirmationStatus===null?[]:[{type:"accommodation",resourceId:destinationId,
    resourceName:"UAT ONLY stay",providerName:"UAT ONLY",destinationName:"Ahungalla",
    serviceName:"UAT room",confirmationStatus,serviceDetails:{nights:2,rooms:1},pricingPlanSnapshot:{}}];
  const compose=isolatedModule.exports.composeCustomerProposal as (...args:unknown[])=>Promise<ProposalSnapshot>;
  return compose(database,{id:destinationId,name:"UAT ONLY traveller",email:"uat@example.test",trip_state:{},
    nationality:null,traveller_notes:"Test only"},null,allocation,{totalSellingPrice:100.25},
    {reference:"UAT-CONTENT",version:1,currency:"USD"},{});
}
test("day-service-only proposal does not imply an unprovided accommodation commitment",async()=>{
  const result=await composeWithAccommodation(null);
  assert.equal(result.stays.length,0);
  assert.equal(result.days.some(day=>day.notes.includes(pendingNote)),false);
  assert.equal(result.pricing.total,100.25);
  assert.equal(result.journey.startDate,"2027-01-17");assert.equal(result.journey.endDate,"2027-01-19");
});
test("cancelled accommodation is not represented as a pending stay",async()=>{
  const result=await composeWithAccommodation("cancelled");
  assert.equal(result.stays.length,0);assert.equal(result.days.some(day=>day.notes.includes(pendingNote)),false);
});
test("confirmed accommodation preserves its confirmed wording without a pending note",async()=>{
  const result=await composeWithAccommodation("confirmed");
  assert.equal(result.stays.length,1);assert.equal(result.stays[0].confirmation,"Confirmed");
  assert.equal(result.days.some(day=>day.notes.includes(pendingNote)),false);
});
test("actual pending accommodation retains its subject-to-confirmation note",async()=>{
  const result=await composeWithAccommodation("pending");
  assert.equal(result.stays.length,1);
  assert.equal(result.days.some(day=>day.notes.includes(pendingNote)),true);
});
