import assert from "node:assert/strict";
import test from "node:test";
import {evaluateJourneyInsights,journeyInsightRules,type JourneyInsightsContext} from "../lib/journey/journey-insights.ts";
import type {JourneyDestination,JourneyExperience} from "../lib/types.ts";

const destination=(id:string,name=id,latitude=0,longitude=0)=>({id,name,latitude,longitude,themeIds:[]} as unknown as JourneyDestination);
const experience=(id:string,destinationIds:string[],category="Culture",overrides:Record<string,unknown>={})=>({id,name:id,category,destinationIds,themeIds:[],things_to_know:[],badges:[],best_season:null,difficulty:null,...overrides} as unknown as JourneyExperience);
const context=(changes:Partial<JourneyInsightsContext>={}):JourneyInsightsContext=>({
  selectedDestinationIds:["a","b"],selectedExperienceIds:["ea","eb"],
  destinations:[destination("a"),destination("b")],
  experiences:[experience("ea",["a"],"Culture"),experience("eb",["b"],"Nature")],
  destinationPreferences:{a:{stayPreference:"boutique_hotels_villas",guidePreference:"recommend",nights:2,notes:""},b:{stayPreference:"four_star_resorts",guidePreference:"recommend",nights:2,notes:""}},
  travelPreferencesByLeg:{"a:b":{fromDestinationId:"a",toDestinationId:"b",travelPreference:"scenic_train"}},
  travelDates:{start:"2026-12-01",end:"2026-12-05"},travellerCounts:{adults:2,children:0,infants:0},
  budgetPreference:"balanced",travelPace:"balanced",accessibilityRequirements:"",...changes
} as JourneyInsightsContext);

test("journey insight rules use the required independent rule contract",()=>{
  assert.equal(journeyInsightRules.length,10);
  for(const rule of journeyInsightRules){assert(rule.id);assert(rule.name);assert.equal(typeof rule.evaluate,"function")}
});

test("insights are advisory and never mutate traveller selections",()=>{
  const input=context({selectedDestinationIds:["a","b","c","d"],destinations:[destination("a","A",0,0),destination("b","B",0,3),destination("c","C",0,1),destination("d","D",0,4)],travelDates:{start:"2026-12-01",end:"2026-12-05"}});
  const before=JSON.stringify(input);const result=evaluateJourneyInsights(input);
  assert.equal(JSON.stringify(input),before);
  assert(result.insights.every(item=>item.ruleId&&item.name&&item.severity&&item.message));
});

test("duration and route rules gently identify rushed journeys and backtracking",()=>{
  const input=context({selectedDestinationIds:["a","b","c","d"],destinations:[destination("a","A",0,0),destination("b","B",0,3),destination("c","C",0,1),destination("d","D",0,4)],travelDates:{start:"2026-12-01",end:"2026-12-05"}});
  const ids=evaluateJourneyInsights(input).insights.map(item=>item.ruleId);
  assert(ids.includes("journey-duration"));assert(ids.includes("route-optimisation"));
});

test("destination and night-balance rules retain destination-specific context",()=>{
  const input=context({selectedExperienceIds:["ea"],experiences:[experience("ea",["a"])],destinationPreferences:{a:{stayPreference:"boutique_hotels_villas",guidePreference:"recommend",nights:9,notes:""},b:{stayPreference:"recommend",guidePreference:"recommend",nights:1,notes:""}}});
  const result=evaluateJourneyInsights(input).insights;
  assert(result.some(item=>item.ruleId==="destination-completeness"&&item.message.includes("b")));
  assert(result.some(item=>item.ruleId==="journey-balance"&&item.message.includes("a")));
});

test("experience diversity and verified seasonal metadata produce informative advice",()=>{
  const input=context({selectedExperienceIds:["ea","eb"],experiences:[experience("ea",["a"],"Beach",{best_season:"December to April"}),experience("eb",["b"],"Beach")],travelDates:{start:"2026-06-10",end:"2026-06-18"}});
  const ids=evaluateJourneyInsights(input).insights.map(item=>item.ruleId);
  assert(ids.includes("experience-balance"));assert(ids.includes("seasonality"));
});

test("budget and pace rules compare intent without calculating prices",()=>{
  const input=context({budgetPreference:"value_conscious",travelPace:"relaxed",travelDates:{start:"2026-12-01",end:"2026-12-04"},destinationPreferences:{a:{stayPreference:"five_star_resorts",guidePreference:"recommend",nights:1,notes:""},b:{stayPreference:"four_star_resorts",guidePreference:"recommend",nights:2,notes:""}}});
  const ids=evaluateJourneyInsights(input).insights.map(item=>item.ruleId);
  assert(ids.includes("budget-consistency"));assert(ids.includes("travel-pace"));
});

test("accessibility and family rules only activate when relevant traveller context exists",()=>{
  const challenging=experience("ea",["a"],"Nature",{difficulty:"Challenging",things_to_know:["A steep climb with a minimum age applies"]});
  const input=context({selectedExperienceIds:["ea"],experiences:[challenging],travellerCounts:{adults:2,children:1,infants:0},accessibilityRequirements:"Limited stair access, please."});
  const ids=evaluateJourneyInsights(input).insights.map(item=>item.ruleId);
  assert(ids.includes("accessibility-planning"));assert(ids.includes("family-suitability"));
});

test("journey quality measures completeness and displays the advisory label",()=>{
  const result=evaluateJourneyInsights(context());
  assert.deepEqual(result.quality,{score:100,label:"Excellent"});
  const empty=evaluateJourneyInsights(context({selectedDestinationIds:[],selectedExperienceIds:[],destinations:[],experiences:[],destinationPreferences:{},travelPreferencesByLeg:{}}));
  assert.deepEqual(empty.quality,{score:0,label:"Needs Review"});
});
