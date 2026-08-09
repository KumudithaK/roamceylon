import type {DestinationPreferences} from "./journey-preferences";
import type {TravelPreferencesByLeg} from "./travel-preferences";
import {endpointRouteLocation,type JourneyEndpoint} from "./journey-endpoints.ts";
import type {TravelPreference} from "./travel-preferences";
import type {JourneyDestination,JourneyExperience,ParticipantCounts} from "@/lib/types";

export type JourneyInsightSeverity="note"|"consider"|"important";
export type JourneyInsightAction={label:string;targetStep:1|2|3|4};
export type JourneyInsight={ruleId:string;name:string;severity:JourneyInsightSeverity;message:string;suggestedAction?:JourneyInsightAction};
export type JourneyQualityLabel="Excellent"|"Very Good"|"Good"|"Needs Review";
export type JourneyInsightsResult={insights:JourneyInsight[];quality:{score:number;label:JourneyQualityLabel}};

export type JourneyInsightsContext={
  selectedDestinationIds:string[];
  selectedExperienceIds:string[];
  destinations:JourneyDestination[];
  experiences:JourneyExperience[];
  destinationPreferences:DestinationPreferences;
  travelPreferencesByLeg:TravelPreferencesByLeg;
  pickup?:JourneyEndpoint;
  dropoff?:JourneyEndpoint;
  globalTravelPreference?:TravelPreference;
  travelDates:{start:string;end:string};
  travellerCounts:ParticipantCounts;
  budgetPreference:string;
  travelPace:"relaxed"|"balanced"|"fast_paced";
  accessibilityRequirements:string;
};

export type JourneyInsightRule={id:string;name:string;evaluate:(context:JourneyInsightsContext)=>JourneyInsight[]};

const insight=(rule:JourneyInsightRule,severity:JourneyInsightSeverity,message:string,suggestedAction?:JourneyInsightAction):JourneyInsight=>({ruleId:rule.id,name:rule.name,severity,message,suggestedAction});
const selectedDestinations=(context:JourneyInsightsContext)=>context.selectedDestinationIds.map(id=>context.destinations.find(item=>item.id===id)).filter((item):item is JourneyDestination=>Boolean(item));
const selectedExperiences=(context:JourneyInsightsContext)=>context.selectedExperienceIds.map(id=>context.experiences.find(item=>item.id===id)).filter((item):item is JourneyExperience=>Boolean(item));
const tripNights=(context:JourneyInsightsContext)=>{
  const start=new Date(`${context.travelDates.start}T00:00:00Z`),end=new Date(`${context.travelDates.end}T00:00:00Z`);
  if(!Number.isFinite(start.getTime())||!Number.isFinite(end.getTime())||end<=start)return null;
  return Math.round((end.getTime()-start.getTime())/86_400_000);
};
const radians=(value:number)=>value*Math.PI/180;
type LocatedInsightStop={latitude:number|null;longitude:number|null};
const distance=(a:LocatedInsightStop,b:LocatedInsightStop)=>{
  if(!Number.isFinite(a.latitude)||!Number.isFinite(a.longitude)||!Number.isFinite(b.latitude)||!Number.isFinite(b.longitude))return 0;
  const latitude=radians(Number(b.latitude)-Number(a.latitude)),longitude=radians(Number(b.longitude)-Number(a.longitude));
  const value=Math.sin(latitude/2)**2+Math.cos(radians(Number(a.latitude)))*Math.cos(radians(Number(b.latitude)))*Math.sin(longitude/2)**2;
  return 6371*2*Math.asin(Math.sqrt(value));
};
const routeDistance=(route:LocatedInsightStop[])=>route.slice(1).reduce((total,item,index)=>total+distance(route[index],item),0);
const efficientRouteDistance=(route:LocatedInsightStop[])=>{
  if(route.length<3)return routeDistance(route);
  const remaining=route.slice(1),ordered=[route[0]];
  while(remaining.length){
    const current=ordered[ordered.length-1];
    const nearest=remaining.reduce((best,item)=>distance(current,item)<distance(current,best)?item:best,remaining[0]);
    ordered.push(nearest);remaining.splice(remaining.indexOf(nearest),1);
  }
  return routeDistance(ordered);
};

const durationRule:JourneyInsightRule={id:"journey-duration",name:"Journey duration",evaluate(context){
  const nights=tripNights(context),destinations=context.selectedDestinationIds.length;
  if(!nights||!destinations)return [];
  if(destinations>=4&&nights<destinations*1.5)return [insight(this,"important","You may enjoy your journey more by allowing additional time at each destination.",{label:"Review destinations",targetStep:1})];
  if(nights>=destinations*4+3)return [insight(this,"note","You have generous time available. You may wish to enjoy a slower rhythm or explore another part of the island.",{label:"Explore destinations",targetStep:1})];
  return [];
}};

const routeRule:JourneyInsightRule={id:"route-optimisation",name:"Route flow",evaluate(context){
  const destinations=selectedDestinations(context);
  const route=[...(context.pickup?.type?[endpointRouteLocation(context.pickup,"pickup",context.destinations)]:[]),...destinations,...(context.dropoff?.type?[endpointRouteLocation(context.dropoff,"dropoff",context.destinations)]:[])];
  if(route.length<4||route.some(item=>!Number.isFinite(item.latitude)||!Number.isFinite(item.longitude)))return [];
  const current=routeDistance(route),efficient=efficientRouteDistance(route);
  return current>efficient*1.18&&current-efficient>70?[insight(this,"consider","We found a destination sequence that may reduce backtracking and make your time on the road feel easier.",{label:"Review route order",targetStep:1})]:[];
}};

const destinationCompletenessRule:JourneyInsightRule={id:"destination-completeness",name:"Destination completeness",evaluate(context){
  if(!context.selectedDestinationIds.length)return [insight(this,"important","Your journey is still waiting for its first destination. Choose any place that draws you in, then return whenever you are ready.",{label:"Choose destinations",targetStep:1})];
  return selectedDestinations(context).flatMap(destination=>{
    const results:JourneyInsight[]=[];
    if(!selectedExperiences(context).some(experience=>experience.destinationIds.includes(destination.id)))results.push(insight(this,"consider",`${destination.name} does not yet have a selected experience. You can continue as it is, or explore what feels meaningful there.`,{label:"Explore experiences",targetStep:2}));
    if(!context.destinationPreferences[destination.id]||context.destinationPreferences[destination.id].stayPreference==="recommend")results.push(insight(this,"note",`Your stay style in ${destination.name} is open for Roam Ceylon to recommend. You may also choose a preference if you already have one.`,{label:"Review stay preferences",targetStep:3}));
    return results;
  });
}};

const journeyBalanceRule:JourneyInsightRule={id:"journey-balance",name:"Journey balance",evaluate(context){
  const allocations=context.selectedDestinationIds.flatMap(id=>{const nights=context.destinationPreferences[id]?.nights;return nights===null||nights===undefined?[]:[{id,nights}]});
  const total=allocations.reduce((sum,item)=>sum+item.nights,0);
  if(allocations.length<2||!total)return [];
  const dominant=allocations.find(item=>item.nights/total>=.7&&total>=5);
  const destination=dominant?context.destinations.find(item=>item.id===dominant.id):null;
  return destination?[insight(this,"consider",`Most of your planned nights are in ${destination.name}. You may prefer this slower focus, or you can share the time more evenly across your route.`,{label:"Review planned nights",targetStep:3})]:[];
}};

const experienceBalanceRule:JourneyInsightRule={id:"experience-balance",name:"Experience balance",evaluate(context){
  const experiences=selectedExperiences(context),categories=new Set(experiences.map(item=>item.category?.trim().toLowerCase()).filter(Boolean));
  if(experiences.length<2||categories.size!==1)return [];
  const category=experiences[0].category?.toLowerCase()||"similar";
  return [insight(this,"note",`Your selected experiences currently share a ${category} focus. If variety matters to you, Sri Lanka also offers contrasting cultural, natural and scenic moments.`,{label:"Explore experience themes",targetStep:2})];
}};

const monthNames=["january","february","march","april","may","june","july","august","september","october","november","december"];
const seasonalMonths=(description:string)=>{
  const lower=description.toLowerCase();
  if(/year[ -]?round|all year|throughout the year/.test(lower))return null;
  const found=[...lower.matchAll(new RegExp(monthNames.join("|"),"g"))].map(match=>monthNames.indexOf(match[0])).filter((month,index,values)=>values.indexOf(month)===index);
  if(found.length===2){const [start,end]=found;const result=new Set<number>();for(let month=start;;month=(month+1)%12){result.add(month);if(month===end)break}return result}
  return found.length?new Set(found):null;
};
const seasonalityRule:JourneyInsightRule={id:"seasonality",name:"Seasonal conditions",evaluate(context){
  if(!context.travelDates.start)return [];
  const month=new Date(`${context.travelDates.start}T00:00:00Z`).getUTCMonth();
  return selectedExperiences(context).flatMap(experience=>{
    const months=experience.best_season?seasonalMonths(experience.best_season):null;
    return months&&!months.has(month)?[insight(this,"consider",`${experience.name} may be affected by seasonal conditions during your travel period. Your journey designer will verify the current operating conditions.`)]:[];
  });
}};

const budgetRule:JourneyInsightRule={id:"budget-consistency",name:"Budget consistency",evaluate(context){
  if(context.budgetPreference!=="value_conscious")return [];
  const luxuryStay=context.selectedDestinationIds.some(id=>context.destinationPreferences[id]?.stayPreference==="five_star_resorts");
  const premiumTravel=context.globalTravelPreference==="domestic_floatplane"||Object.values(context.travelPreferencesByLeg).some(item=>item.travelPreference==="domestic_floatplane");
  return luxuryStay||premiumTravel?[insight(this,"consider","Some selected preferences may sit above a value-conscious journey style. Your journey designer can help keep the final proposal aligned with your priorities.",{label:"Review preferences",targetStep:3})]:[];
}};

const paceRule:JourneyInsightRule={id:"travel-pace",name:"Travel pace",evaluate(context){
  const nights=tripNights(context),destinations=context.selectedDestinationIds.length;
  if(!nights||destinations<2)return [];
  if(context.travelPace==="relaxed"&&nights/destinations<2.5)return [insight(this,"important","This route may feel lively for a relaxed travel style. A little more time at each stop may create the gentler rhythm you selected.",{label:"Review journey details",targetStep:4})];
  if(context.travelPace==="fast_paced"&&nights/destinations>5)return [insight(this,"note","Your itinerary currently leaves generous time in each place for a fast-paced travel style. You may prefer the extra breathing room, and no change is required.",{label:"Review journey details",targetStep:4})];
  return [];
}};

const planningText=(experience:JourneyExperience)=>[experience.difficulty,...experience.things_to_know,...experience.badges].filter(Boolean).join(" ").toLowerCase();
const accessibilityRule:JourneyInsightRule={id:"accessibility-planning",name:"Accessibility planning",evaluate(context){
  if(!context.accessibilityRequirements.trim())return [];
  const affected=selectedExperiences(context).filter(item=>/(challenging|difficult|steep|stairs|uneven|climb|trek|mobility)/.test(planningText(item)));
  return affected.length?[insight(this,"important",`${affected.slice(0,2).map(item=>item.name).join(" and ")} may require additional accessibility planning. Roam Ceylon will review access arrangements with you before confirming the journey.`)]:[insight(this,"note","Your accessibility requirements have been noted for the journey designer to review carefully with every local partner.")];
}};

const familyRule:JourneyInsightRule={id:"family-suitability",name:"Family suitability",evaluate(context){
  if(context.travellerCounts.children<=0&&context.travellerCounts.infants<=0)return [];
  const affected=selectedExperiences(context).filter(item=>/(minimum age|age limit|challenging|difficult|steep|long walk|late evening)/.test(planningText(item)));
  return affected.length?[insight(this,"consider",`${affected.slice(0,2).map(item=>item.name).join(" and ")} may need a little extra family planning. Your journey designer will confirm age guidance, timing and practical arrangements.`)]:[];
}};

export const journeyInsightRules:JourneyInsightRule[]=[durationRule,routeRule,destinationCompletenessRule,journeyBalanceRule,experienceBalanceRule,seasonalityRule,budgetRule,paceRule,accessibilityRule,familyRule];

const qualityLabel=(score:number):JourneyQualityLabel=>score>=90?"Excellent":score>=75?"Very Good":score>=55?"Good":"Needs Review";

export function evaluateJourneyInsights(context:JourneyInsightsContext):JourneyInsightsResult{
  const insights=journeyInsightRules.flatMap(rule=>rule.evaluate(context));
  const experiences=selectedExperiences(context);
  const coveredDestinations=context.selectedDestinationIds.filter(id=>experiences.some(item=>item.destinationIds.includes(id))).length;
  const destinationCoverage=context.selectedDestinationIds.length?coveredDestinations/context.selectedDestinationIds.length:0;
  const stayCoverage=context.selectedDestinationIds.length?context.selectedDestinationIds.filter(id=>Boolean(context.destinationPreferences[id]?.stayPreference)).length/context.selectedDestinationIds.length:0;
  const issue=(id:string)=>insights.some(item=>item.ruleId===id);
  const completeness=Math.round(destinationCoverage*25+stayCoverage*15);
  const route=issue("route-optimisation")?6:15;
  const pace=issue("travel-pace")?6:15;
  const budget=issue("budget-consistency")?5:10;
  const balance=20-["journey-duration","journey-balance","experience-balance"].filter(issue).length*5;
  const score=context.selectedDestinationIds.length?Math.max(0,Math.min(100,completeness+route+pace+budget+balance)):0;
  return {insights,quality:{score,label:qualityLabel(score)}};
}
