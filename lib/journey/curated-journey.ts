import {normaliseDestinationPreferences,type DestinationPreferences,type GuideLanguage,type JourneyGuidePreference} from "./journey-preferences.ts";
import {completeJourneyLegs,normaliseCompleteTravelPreferences,type TravelPreference,type TravelPreferencesByLeg} from "./travel-preferences.ts";
import {normaliseJourneyEndpoint,type JourneyEndpoint} from "./journey-endpoints.ts";
import type {JourneyState} from "@/features/journey/journey-store";
import type {ParticipantCounts} from "@/lib/types";
import type {Json} from "@/lib/database.types";

export type CuratedOrigin="traveller"|"roam_ceylon";
export type CuratedJourneyStatus="not_started"|"designing"|"ready_for_allocation"|"allocation_in_progress"|"ready_for_proposal";
export type CuratedItinerary={
  version:1;
  selectedDestinationIds:string[];
  selectedExperienceIds:string[];
  destinationPreferences:DestinationPreferences;
  experienceParticipants:Record<string,ParticipantCounts>;
  selectedPricingPlanIds:Record<string,string>;
  destinationOrigins:Record<string,CuratedOrigin>;
  experienceOrigins:Record<string,CuratedOrigin>;
  experienceNotes:Record<string,string>;
  pickup:JourneyEndpoint;
  dropoff:JourneyEndpoint;
  travelDates:{start:string;end:string};
  travellerCounts:ParticipantCounts;
  globalTravelPreference:TravelPreference;
  travelPreferencesByLeg:TravelPreferencesByLeg;
  journeyGuidePreference:JourneyGuidePreference;
  journeyGuideLanguages:GuideLanguage[];
  journeyGuideNotes:string;
  budgetPreference:string;
  travelPace:"relaxed"|"balanced"|"fast_paced";
  accessibilityRequirements:string;
};

export type CuratedChange={changeType:string;subjectType:string;subjectId:string|null;fieldName:string|null;previousValue:Json;newValue:Json;summary:string};

const record=(value:unknown)=>value&&typeof value==="object"&&!Array.isArray(value)?value as Record<string,unknown>:{};
const strings=(value:unknown)=>Array.isArray(value)?[...new Set(value.filter((item):item is string=>typeof item==="string"&&Boolean(item)))]:[];
const counts=(value:unknown,requireAdult=true):ParticipantCounts=>{const item=record(value);return {adults:Math.max(requireAdult?1:0,Math.floor(Number(item.adults)||0)),children:Math.max(0,Math.floor(Number(item.children)||0)),infants:Math.max(0,Math.floor(Number(item.infants)||0))}};
const stringRecord=(value:unknown)=>Object.fromEntries(Object.entries(record(value)).flatMap(([key,item])=>typeof item==="string"?[[key,item]]:[]));
const participantRecord=(value:unknown)=>Object.fromEntries(Object.entries(record(value)).map(([key,item])=>[key,counts(item,false)]));
const originRecord=(value:unknown,ids:string[],fallback:CuratedOrigin)=>{const source=record(value);return Object.fromEntries(ids.map(id=>[id,source[id]==="roam_ceylon"?"roam_ceylon":fallback])) as Record<string,CuratedOrigin>};
const json=(value:unknown):Json=>JSON.parse(JSON.stringify(value??null)) as Json;
const same=(left:unknown,right:unknown)=>JSON.stringify(left)===JSON.stringify(right);

export function createCuratedItinerary(state:JourneyState):CuratedItinerary{
  const destinations=[...state.selectedDestinationIds],experiences=[...state.selectedExperienceIds];
  return {
    version:1,selectedDestinationIds:destinations,selectedExperienceIds:experiences,
    destinationPreferences:normaliseDestinationPreferences(state.destinationPreferences,destinations),
    experienceParticipants:Object.fromEntries(experiences.map(id=>[id,state.experienceParticipants[id]??{adults:state.travellerCounts.adults,children:0,infants:0}])),
    selectedPricingPlanIds:Object.fromEntries(Object.entries(state.selectedPricingPlanIds).filter(([key])=>key.startsWith("experience:"))),
    destinationOrigins:originRecord({},destinations,"traveller"),experienceOrigins:originRecord({},experiences,"traveller"),experienceNotes:{},
    pickup:normaliseJourneyEndpoint(state.pickup,state.travelDates.start),dropoff:normaliseJourneyEndpoint(state.dropoff,state.travelDates.end),travelDates:{...state.travelDates},travellerCounts:counts(state.travellerCounts),
    globalTravelPreference:state.globalTravelPreference,travelPreferencesByLeg:normaliseCompleteTravelPreferences(state.travelPreferencesByLeg,completeJourneyLegs(destinations,Boolean(state.pickup.type),Boolean(state.dropoff.type))),
    journeyGuidePreference:state.journeyGuidePreference,journeyGuideLanguages:[...state.journeyGuideLanguages],journeyGuideNotes:state.journeyGuideNotes,
    budgetPreference:state.budgetPreference,travelPace:state.travelPace,accessibilityRequirements:state.accessibilityRequirements
  };
}

export function normaliseCuratedItinerary(value:unknown,brief:JourneyState):CuratedItinerary{
  const source=record(value),destinationIds=strings(source.selectedDestinationIds),experienceIds=strings(source.selectedExperienceIds);
  if(source.version!==1||!destinationIds.length)return createCuratedItinerary(brief);
  const travelDates=record(source.travelDates),pickup=normaliseJourneyEndpoint(source.pickup,String(travelDates.start??brief.travelDates.start)),dropoff=normaliseJourneyEndpoint(source.dropoff,String(travelDates.end??brief.travelDates.end));
  const legs=completeJourneyLegs(destinationIds,Boolean(pickup.type),Boolean(dropoff.type));
  const guideLanguages=strings(source.journeyGuideLanguages).filter(value=>["English","German","French","Spanish","Italian","Japanese","Chinese","Russian","Arabic","Other"].includes(value)) as GuideLanguage[];
  const journeyGuidePreference=["national_tourist_guide","chauffeur_tourist_guide","no_guide","recommend"].includes(String(source.journeyGuidePreference))?source.journeyGuidePreference as JourneyGuidePreference:"recommend";
  const globalTravelPreference=(source.globalTravelPreference??"recommend") as TravelPreference;
  return {
    version:1,selectedDestinationIds:destinationIds,selectedExperienceIds:experienceIds,
    destinationPreferences:normaliseDestinationPreferences(source.destinationPreferences,destinationIds),experienceParticipants:participantRecord(source.experienceParticipants),
    selectedPricingPlanIds:stringRecord(source.selectedPricingPlanIds),destinationOrigins:originRecord(source.destinationOrigins,destinationIds,"traveller"),experienceOrigins:originRecord(source.experienceOrigins,experienceIds,"traveller"),experienceNotes:stringRecord(source.experienceNotes),
    pickup,dropoff,travelDates:{start:String(travelDates.start??pickup.date??""),end:String(travelDates.end??dropoff.date??"")},travellerCounts:counts(source.travellerCounts),
    globalTravelPreference,travelPreferencesByLeg:normaliseCompleteTravelPreferences(source.travelPreferencesByLeg,legs),journeyGuidePreference,journeyGuideLanguages:guideLanguages,journeyGuideNotes:String(source.journeyGuideNotes??""),
    budgetPreference:String(source.budgetPreference??"flexible"),travelPace:["relaxed","fast_paced"].includes(String(source.travelPace))?source.travelPace as CuratedItinerary["travelPace"]:"balanced",accessibilityRequirements:String(source.accessibilityRequirements??"")
  };
}

export const curatedJourneyNights=(itinerary:CuratedItinerary)=>itinerary.selectedDestinationIds.reduce((total,id)=>total+(itinerary.destinationPreferences[id]?.nights??0),0);
export const curatedJourneyDuration=(itinerary:CuratedItinerary)=>{const start=new Date(`${itinerary.travelDates.start}T00:00:00Z`).getTime(),end=new Date(`${itinerary.travelDates.end}T00:00:00Z`).getTime();return Number.isFinite(start)&&Number.isFinite(end)&&end>start?Math.ceil((end-start)/86_400_000):0};
export function validateCuratedJourney(itinerary:CuratedItinerary){
  const duration=curatedJourneyDuration(itinerary),plannedNights=curatedJourneyNights(itinerary),availableNights=Math.max(0,duration-1),errors:string[]=[],warnings:string[]=[];
  if(!duration)errors.push("Choose valid journey start and end dates.");
  if(!itinerary.selectedDestinationIds.length)errors.push("Add at least one destination.");
  if(plannedNights>availableNights)errors.push(`Planned stays use ${plannedNights} nights, but the journey has ${availableNights}.`);
  if(duration&&plannedNights<availableNights)warnings.push(`${availableNights-plannedNights} journey night${availableNights-plannedNights===1?" is":"s are"} still open for planning.`);
  return {duration,availableNights,plannedNights,errors,warnings};
}

export function curatedJourneyChanges(previous:CuratedItinerary,next:CuratedItinerary,names:{destinations:Record<string,string>;experiences:Record<string,string>}):CuratedChange[]{
  const changes:CuratedChange[]=[],destinationName=(id:string)=>names.destinations[id]??id,experienceName=(id:string)=>names.experiences[id]??id;
  for(const id of next.selectedDestinationIds.filter(id=>!previous.selectedDestinationIds.includes(id)))changes.push({changeType:"destination_added",subjectType:"destination",subjectId:id,fieldName:null,previousValue:null,newValue:id,summary:`Destination added: ${destinationName(id)}`});
  for(const id of previous.selectedDestinationIds.filter(id=>!next.selectedDestinationIds.includes(id)))changes.push({changeType:"destination_removed",subjectType:"destination",subjectId:id,fieldName:null,previousValue:id,newValue:null,summary:`Destination removed: ${destinationName(id)}`});
  if(!same(previous.selectedDestinationIds,next.selectedDestinationIds))changes.push({changeType:"route_changed",subjectType:"journey",subjectId:null,fieldName:"destination_order",previousValue:json(previous.selectedDestinationIds),newValue:json(next.selectedDestinationIds),summary:"Destination route order changed"});
  for(const id of next.selectedDestinationIds.filter(id=>previous.selectedDestinationIds.includes(id))){
    const before=previous.destinationPreferences[id],after=next.destinationPreferences[id];
    for(const field of ["nights","stayPreference","specialistGuidePreference","notes"] as const)if(!same(before?.[field],after?.[field]))changes.push({changeType:"destination_requirement_changed",subjectType:"destination",subjectId:id,fieldName:field,previousValue:json(before?.[field]),newValue:json(after?.[field]),summary:`${destinationName(id)} ${field.replaceAll("Preference","").replaceAll(/([A-Z])/g," $1").toLowerCase()} changed`});
  }
  for(const id of next.selectedExperienceIds.filter(id=>!previous.selectedExperienceIds.includes(id)))changes.push({changeType:"experience_added",subjectType:"experience",subjectId:id,fieldName:null,previousValue:null,newValue:id,summary:`Experience added: ${experienceName(id)}`});
  for(const id of previous.selectedExperienceIds.filter(id=>!next.selectedExperienceIds.includes(id)))changes.push({changeType:"experience_removed",subjectType:"experience",subjectId:id,fieldName:null,previousValue:id,newValue:null,summary:`Experience removed: ${experienceName(id)}`});
  if(!same(previous.selectedExperienceIds,next.selectedExperienceIds))changes.push({changeType:"experience_order_changed",subjectType:"journey",subjectId:null,fieldName:"experience_order",previousValue:json(previous.selectedExperienceIds),newValue:json(next.selectedExperienceIds),summary:"Experience order changed"});
  for(const id of next.selectedExperienceIds.filter(id=>previous.selectedExperienceIds.includes(id))){
    if(!same(previous.experienceNotes[id],next.experienceNotes[id]))changes.push({changeType:"experience_note_changed",subjectType:"experience",subjectId:id,fieldName:"notes",previousValue:json(previous.experienceNotes[id]),newValue:json(next.experienceNotes[id]),summary:`Experience note changed: ${experienceName(id)}`});
    if(!same(previous.experienceParticipants[id],next.experienceParticipants[id]))changes.push({changeType:"experience_participants_changed",subjectType:"experience",subjectId:id,fieldName:"participants",previousValue:json(previous.experienceParticipants[id]),newValue:json(next.experienceParticipants[id]),summary:`Experience participants changed: ${experienceName(id)}`});
  }
  for(const field of ["pickup","dropoff","globalTravelPreference","travelPreferencesByLeg","journeyGuidePreference","journeyGuideLanguages","journeyGuideNotes","travelDates"] as const)if(!same(previous[field],next[field]))changes.push({changeType:`${field}_changed`,subjectType:"journey",subjectId:null,fieldName:field,previousValue:json(previous[field]),newValue:json(next[field]),summary:`${field.replaceAll(/([A-Z])/g," $1").toLowerCase()} changed`});
  return changes;
}

export function allocationReviewReason(allocation:{allocation_type:string;destination_id:string|null;experience_id:string|null;from_location_key:string|null;to_location_key:string|null},previous:CuratedItinerary,next:CuratedItinerary){
  const destinationChanged=(id:string|null)=>Boolean(id&&(!next.selectedDestinationIds.includes(id)||!same(previous.destinationPreferences[id],next.destinationPreferences[id])));
  if(allocation.allocation_type==="accommodation"&&destinationChanged(allocation.destination_id))return "Destination stay requirements changed in Journey Studio.";
  if(allocation.allocation_type==="guide"&&(destinationChanged(allocation.destination_id)||!same(previous.journeyGuidePreference,next.journeyGuidePreference)||!same(previous.journeyGuideLanguages,next.journeyGuideLanguages)))return "Guide requirements changed in Journey Studio.";
  if(allocation.allocation_type==="experience"&&allocation.experience_id&&(!next.selectedExperienceIds.includes(allocation.experience_id)||!same(previous.experienceParticipants[allocation.experience_id],next.experienceParticipants[allocation.experience_id])))return "The allocated experience or its participant requirement changed in Journey Studio.";
  if(allocation.allocation_type==="vehicle"){
    const keys=new Set(completeJourneyLegs(next.selectedDestinationIds,Boolean(next.pickup.type),Boolean(next.dropoff.type)).map(leg=>`${leg.fromLocationKey}:${leg.toLocationKey}`));
    if(!keys.has(`${allocation.from_location_key}:${allocation.to_location_key}`)||!same(previous.travelPreferencesByLeg,next.travelPreferencesByLeg)||!same(previous.globalTravelPreference,next.globalTravelPreference)||!same(previous.pickup,next.pickup)||!same(previous.dropoff,next.dropoff))return "The curated route or transport preference changed.";
  }
  return null;
}

export const curatedItineraryToJson=(itinerary:CuratedItinerary)=>json(itinerary);

export function curatedItineraryToJourneyState(itinerary:CuratedItinerary,brief:JourneyState):JourneyState{return {
  ...brief,currentStep:6,selectedDestinationIds:[...itinerary.selectedDestinationIds],selectedExperienceIds:[...itinerary.selectedExperienceIds],destinationPreferences:itinerary.destinationPreferences,
  journeyGuidePreference:itinerary.journeyGuidePreference,journeyGuideLanguages:[...itinerary.journeyGuideLanguages],journeyGuideNotes:itinerary.journeyGuideNotes,pickup:itinerary.pickup,dropoff:itinerary.dropoff,
  globalTravelPreference:itinerary.globalTravelPreference,travelPreferencesByLeg:itinerary.travelPreferencesByLeg,selectedStayIdsByDestination:{},selectedVehicleId:null,selectedGuideId:null,
  selectedPricingPlanIds:itinerary.selectedPricingPlanIds,travelDates:itinerary.travelDates,travellerCounts:itinerary.travellerCounts,experienceParticipants:itinerary.experienceParticipants,
  budgetPreference:itinerary.budgetPreference,travelPace:itinerary.travelPace,accessibilityRequirements:itinerary.accessibilityRequirements
}}
