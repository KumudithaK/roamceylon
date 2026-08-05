"use client";

import {createContext,useContext,useEffect,useMemo,useReducer,useState} from "react";
import type {JourneyBootstrap} from "@/lib/journey/journey-service";
import {availableDestinations,availableExperiences} from "@/lib/journey/journey-selectors";
import type {ParticipantCounts} from "@/lib/types";
import {clearJourneyLaunchParameters,readJourneyState,writeJourneyState} from "@/lib/journey/journey-persistence";

export type JourneyState={
  currentStep:number;
  selectedThemeIds:string[];
  selectedDestinationIds:string[];
  selectedExperienceIds:string[];
  selectedStayIdsByDestination:Record<string,string>;
  selectedVehicleId:string|null;
  selectedGuideId:string|null;
  selectedPricingPlanIds:Record<string,string>;
  travelDates:{start:string;end:string};
  travellerCounts:ParticipantCounts;
  experienceParticipants:Record<string,ParticipantCounts>;
  budgetPreference:string;
};
type Action=
  |{type:"toggle";field:"selectedThemeIds"|"selectedDestinationIds"|"selectedExperienceIds";id:string}
  |{type:"stay";destinationId:string;stayId:string;pricingPlanId?:string}
  |{type:"vehicle"|"guide";id:string|null;pricingPlanId?:string}
  |{type:"dates";start:string;end:string}
  |{type:"travellers";counts:ParticipantCounts}
  |{type:"experienceParticipants";experienceId:string;counts:ParticipantCounts;pricingPlanId?:string}
  |{type:"includeExperience";experienceId:string;counts:ParticipantCounts;pricingPlanId?:string}
  |{type:"removeExperience";experienceId:string}
  |{type:"step";value:number}
  |{type:"budget";value:string}
  |{type:"hydrate";state:JourneyState};

const emptyParticipants:ParticipantCounts={adults:0,children:0,infants:0};
const normaliseCounts=(counts:ParticipantCounts,requireAdult=false):ParticipantCounts=>({
  adults:Math.max(requireAdult?1:0,Math.floor(counts.adults||0)),
  children:Math.max(0,Math.floor(counts.children||0)),
  infants:Math.max(0,Math.floor(counts.infants||0))
});
const maximumParticipants=(participants:Record<string,ParticipantCounts>):ParticipantCounts=>Object.values(participants).reduce((maximum,counts)=>({
  adults:Math.max(maximum.adults,counts.adults),
  children:Math.max(maximum.children,counts.children),
  infants:Math.max(maximum.infants,counts.infants)
}),emptyParticipants);
const fitWithinTrip=(counts:ParticipantCounts,trip:ParticipantCounts):ParticipantCounts=>totalParticipants(trip)?{
  adults:Math.min(counts.adults,trip.adults),
  children:Math.min(counts.children,trip.children),
  infants:Math.min(counts.infants,trip.infants)
}:counts;
const totalParticipants=(counts:ParticipantCounts)=>counts.adults+counts.children+counts.infants;
const keepParticipants=(participants:Record<string,ParticipantCounts>,ids:string[])=>Object.fromEntries(Object.entries(participants).filter(([id])=>ids.includes(id)));
export const pricingPlanKey=(type:"accommodation"|"vehicle"|"guide"|"experience",id:string)=>`${type}:${id}`;
const withoutPlan=(plans:Record<string,string>,type:"accommodation"|"vehicle"|"guide"|"experience",id:string|null)=>{
  if(!id)return plans;
  const {[pricingPlanKey(type,id)]:removed,...next}=plans;
  void removed;
  return next;
};
const withPlan=(plans:Record<string,string>,type:"accommodation"|"vehicle"|"guide"|"experience",id:string,planId?:string)=>{
  const next=withoutPlan(plans,type,id);
  return planId?{...next,[pricingPlanKey(type,id)]:planId}:next;
};
const keepPlans=(plans:Record<string,string>,type:"accommodation"|"experience",ids:string[])=>Object.fromEntries(Object.entries(plans).filter(([key])=>!key.startsWith(`${type}:`)||ids.includes(key.slice(type.length+1))));
export const emptyJourneyState:JourneyState={currentStep:0,selectedThemeIds:[],selectedDestinationIds:[],selectedExperienceIds:[],selectedStayIdsByDestination:{},selectedVehicleId:null,selectedGuideId:null,selectedPricingPlanIds:{},travelDates:{start:"",end:""},travellerCounts:emptyParticipants,experienceParticipants:{},budgetPreference:"flexible"};

function reducer(data:JourneyBootstrap,state:JourneyState,action:Action):JourneyState{
  if(action.type==="hydrate")return action.state;
  if(action.type==="toggle"){
    const values=state[action.field];
    const next=values.includes(action.id)?values.filter(id=>id!==action.id):[...values,action.id];
    let result={...state,[action.field]:next};
    if(action.field==="selectedThemeIds"){
      const validDestinations=new Set(availableDestinations(data.destinations,next).map(item=>item.id));
      const selectedDestinationIds=state.selectedDestinationIds.filter(id=>validDestinations.has(id));
      const validExperiences=new Set(availableExperiences(data.experiences,selectedDestinationIds).map(item=>item.id));
      const selectedExperienceIds=state.selectedExperienceIds.filter(id=>validExperiences.has(id));
      const selectedStayIdsByDestination=Object.fromEntries(Object.entries(state.selectedStayIdsByDestination).filter(([id])=>validDestinations.has(id)));
      const selectedPricingPlanIds=keepPlans(keepPlans(state.selectedPricingPlanIds,"experience",selectedExperienceIds),"accommodation",Object.values(selectedStayIdsByDestination));
      result={...result,selectedDestinationIds,selectedExperienceIds,experienceParticipants:keepParticipants(state.experienceParticipants,selectedExperienceIds),selectedStayIdsByDestination,selectedPricingPlanIds};
    }
    if(action.field==="selectedDestinationIds"){
      const validExperiences=new Set(availableExperiences(data.experiences,next).map(item=>item.id));
      const selectedExperienceIds=state.selectedExperienceIds.filter(id=>validExperiences.has(id));
      const selectedStayIdsByDestination=Object.fromEntries(Object.entries(state.selectedStayIdsByDestination).filter(([id])=>next.includes(id)));
      const selectedPricingPlanIds=keepPlans(keepPlans(state.selectedPricingPlanIds,"experience",selectedExperienceIds),"accommodation",Object.values(selectedStayIdsByDestination));
      result={...result,selectedExperienceIds,experienceParticipants:keepParticipants(state.experienceParticipants,selectedExperienceIds),selectedStayIdsByDestination,selectedPricingPlanIds};
    }
    if(action.field==="selectedExperienceIds"&&!next.includes(action.id))result={...result,experienceParticipants:keepParticipants(state.experienceParticipants,next),selectedPricingPlanIds:withoutPlan(state.selectedPricingPlanIds,"experience",action.id)};
    return result;
  }
  if(action.type==="stay"){
    const previous=state.selectedStayIdsByDestination[action.destinationId]||null;
    const selectedStayIdsByDestination={...state.selectedStayIdsByDestination};
    if(action.stayId)selectedStayIdsByDestination[action.destinationId]=action.stayId;
    else delete selectedStayIdsByDestination[action.destinationId];
    return {...state,selectedStayIdsByDestination,selectedPricingPlanIds:action.stayId?withPlan(withoutPlan(state.selectedPricingPlanIds,"accommodation",previous),"accommodation",action.stayId,action.pricingPlanId):withoutPlan(state.selectedPricingPlanIds,"accommodation",previous)};
  }
  if(action.type==="vehicle")return {...state,selectedVehicleId:action.id,selectedPricingPlanIds:action.id?withPlan(withoutPlan(state.selectedPricingPlanIds,"vehicle",state.selectedVehicleId),"vehicle",action.id,action.pricingPlanId):withoutPlan(state.selectedPricingPlanIds,"vehicle",state.selectedVehicleId)};
  if(action.type==="guide")return {...state,selectedGuideId:action.id,selectedPricingPlanIds:action.id?withPlan(withoutPlan(state.selectedPricingPlanIds,"guide",state.selectedGuideId),"guide",action.id,action.pricingPlanId):withoutPlan(state.selectedPricingPlanIds,"guide",state.selectedGuideId)};
  if(action.type==="dates")return {...state,travelDates:{start:action.start,end:action.end}};
  if(action.type==="travellers"){
    const requested=normaliseCounts(action.counts);
    const minimum=maximumParticipants(state.experienceParticipants);
    return {...state,travellerCounts:{adults:Math.max(requested.adults,minimum.adults),children:Math.max(requested.children,minimum.children),infants:Math.max(requested.infants,minimum.infants)}};
  }
  if(action.type==="experienceParticipants")return {...state,experienceParticipants:{...state.experienceParticipants,[action.experienceId]:fitWithinTrip(normaliseCounts(action.counts,true),state.travellerCounts)},selectedPricingPlanIds:withPlan(state.selectedPricingPlanIds,"experience",action.experienceId,action.pricingPlanId)};
  if(action.type==="includeExperience"){
    const selectedExperienceIds=state.selectedExperienceIds.includes(action.experienceId)?state.selectedExperienceIds:[...state.selectedExperienceIds,action.experienceId];
    return {...state,selectedExperienceIds,experienceParticipants:{...state.experienceParticipants,[action.experienceId]:fitWithinTrip(normaliseCounts(action.counts,true),state.travellerCounts)},selectedPricingPlanIds:withPlan(state.selectedPricingPlanIds,"experience",action.experienceId,action.pricingPlanId)};
  }
  if(action.type==="removeExperience"){
    const selectedExperienceIds=state.selectedExperienceIds.filter(id=>id!==action.experienceId);
    return {...state,selectedExperienceIds,experienceParticipants:keepParticipants(state.experienceParticipants,selectedExperienceIds),selectedPricingPlanIds:withoutPlan(state.selectedPricingPlanIds,"experience",action.experienceId)};
  }
  if(action.type==="step")return {...state,currentStep:Math.min(3,Math.max(0,action.value))};
  if(action.type==="budget")return {...state,budgetPreference:action.value};
  return state;
}

const Context=createContext<{state:JourneyState;dispatch:React.Dispatch<Action>}|null>(null);

export type JourneyInitialSelection={themeId?:string|null;themeIds?:string[];destinationIds?:string[];experienceId?:string|null;travellers?:ParticipantCounts;experienceParticipants?:ParticipantCounts;step?:number};
export function JourneyProvider({data,initialSelection,children}:{data:JourneyBootstrap;initialSelection?:JourneyInitialSelection;children:React.ReactNode}){
  const startingState=useMemo<JourneyState>(()=>{
    const experience=initialSelection?.experienceId?data.experiences.find(item=>item.id===initialSelection.experienceId):null;
    const destinationId=experience?.destinationIds[0];
    const destination=destinationId?data.destinations.find(item=>item.id===destinationId):null;
    const explicitThemes=[...(initialSelection?.themeIds??[]),...(initialSelection?.themeId?[initialSelection.themeId]:[])].filter(id=>data.themes.some(theme=>theme.id===id));
    const themeIds=explicitThemes.length?explicitThemes:experience?.themeIds.length?experience.themeIds:destination?.themeIds??[];
    const destinationIds=[...(initialSelection?.destinationIds??[]),...(destinationId?[destinationId]:[])].filter((id,index,values)=>data.destinations.some(item=>item.id===id)&&values.indexOf(id)===index);
    return {
      ...emptyJourneyState,
      currentStep:Math.min(3,Math.max(0,initialSelection?.step??(experience?2:0))),
      selectedThemeIds:themeIds,
      selectedDestinationIds:destinationIds,
      travellerCounts:initialSelection?.travellers?normaliseCounts(initialSelection.travellers):emptyParticipants,
      selectedExperienceIds:experience?[experience.id]:[],
      experienceParticipants:experience&&initialSelection?.experienceParticipants?{[experience.id]:normaliseCounts(initialSelection.experienceParticipants,true)}:{}
    };
  },[data.destinations,data.experiences,data.themes,initialSelection]);
  const [state,dispatch]=useReducer((current:JourneyState,action:Action)=>reducer(data,current,action),startingState);
  const [hydrated,setHydrated]=useState(false);
  useEffect(()=>{
    const restore=()=>{
      const saved=readJourneyState();
      if(!saved)return;
      const hasLaunchParameters=Boolean(initialSelection?.themeId||initialSelection?.themeIds?.length||initialSelection?.destinationIds?.length||initialSelection?.experienceId||initialSelection?.step!==undefined);
      dispatch({type:"hydrate",state:hasLaunchParameters?{
        ...saved,
        selectedThemeIds:[...new Set([...saved.selectedThemeIds,...startingState.selectedThemeIds])],
        selectedDestinationIds:[...new Set([...saved.selectedDestinationIds,...startingState.selectedDestinationIds])],
        selectedExperienceIds:[...new Set([...saved.selectedExperienceIds,...startingState.selectedExperienceIds])],
        currentStep:initialSelection?.step??saved.currentStep,
        travellerCounts:initialSelection?.travellers??saved.travellerCounts,
        experienceParticipants:{...saved.experienceParticipants,...startingState.experienceParticipants}
      }:saved});
    };
    restore();
    setHydrated(true);
    const resume=(event:PageTransitionEvent)=>{if(event.persisted)restore()};
    const visible=()=>{if(document.visibilityState==="visible")restore()};
    window.addEventListener("pageshow",resume);
    document.addEventListener("visibilitychange",visible);
    return()=>{window.removeEventListener("pageshow",resume);document.removeEventListener("visibilitychange",visible)};
  },[initialSelection,startingState]);
  useEffect(()=>{if(hydrated){writeJourneyState(state);clearJourneyLaunchParameters()}},[hydrated,state]);
  const value=useMemo(()=>({state,dispatch}),[state]);
  if(!hydrated)return <div className="shell grid min-h-[60svh] place-items-center py-20"><div className="text-center"><div className="mx-auto size-10 animate-spin rounded-full border-2 border-gold/25 border-t-gold"/><p className="eyebrow mt-6">Restoring your journey</p><p className="mt-2 text-sm text-stone">Bringing back your latest selections…</p></div></div>;
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useJourney(){
  const value=useContext(Context);
  if(!value)throw new Error("useJourney must be used inside JourneyProvider");
  return value;
}
