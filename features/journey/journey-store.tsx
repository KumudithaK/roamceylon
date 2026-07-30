"use client";

import {createContext,useContext,useMemo,useReducer} from "react";
import type {JourneyBootstrap} from "@/lib/journey/journey-service";
import {availableDestinations,availableExperiences} from "@/lib/journey/journey-selectors";
import type {ParticipantCounts} from "@/lib/types";

export type JourneyState={
  selectedThemeIds:string[];
  selectedDestinationIds:string[];
  selectedExperienceIds:string[];
  selectedStayIdsByDestination:Record<string,string>;
  selectedVehicleId:string|null;
  selectedGuideId:string|null;
  travelDates:{start:string;end:string};
  travellerCounts:ParticipantCounts;
  experienceParticipants:Record<string,ParticipantCounts>;
  budgetPreference:string;
};
type Action=
  |{type:"toggle";field:"selectedThemeIds"|"selectedDestinationIds"|"selectedExperienceIds";id:string}
  |{type:"stay";destinationId:string;stayId:string}
  |{type:"vehicle"|"guide";id:string|null}
  |{type:"dates";start:string;end:string}
  |{type:"travellers";counts:ParticipantCounts}
  |{type:"experienceParticipants";experienceId:string;counts:ParticipantCounts}
  |{type:"includeExperience";experienceId:string;counts:ParticipantCounts}
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
const initial:JourneyState={selectedThemeIds:[],selectedDestinationIds:[],selectedExperienceIds:[],selectedStayIdsByDestination:{},selectedVehicleId:null,selectedGuideId:null,travelDates:{start:"",end:""},travellerCounts:emptyParticipants,experienceParticipants:{},budgetPreference:"flexible"};

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
      result={...result,selectedDestinationIds,selectedExperienceIds,experienceParticipants:keepParticipants(state.experienceParticipants,selectedExperienceIds),selectedStayIdsByDestination:Object.fromEntries(Object.entries(state.selectedStayIdsByDestination).filter(([id])=>validDestinations.has(id)))};
    }
    if(action.field==="selectedDestinationIds"){
      const validExperiences=new Set(availableExperiences(data.experiences,next).map(item=>item.id));
      const selectedExperienceIds=state.selectedExperienceIds.filter(id=>validExperiences.has(id));
      result={...result,selectedExperienceIds,experienceParticipants:keepParticipants(state.experienceParticipants,selectedExperienceIds),selectedStayIdsByDestination:Object.fromEntries(Object.entries(state.selectedStayIdsByDestination).filter(([id])=>next.includes(id)))};
    }
    if(action.field==="selectedExperienceIds"&&!next.includes(action.id))result={...result,experienceParticipants:keepParticipants(state.experienceParticipants,next)};
    return result;
  }
  if(action.type==="stay")return {...state,selectedStayIdsByDestination:{...state.selectedStayIdsByDestination,[action.destinationId]:action.stayId}};
  if(action.type==="vehicle")return {...state,selectedVehicleId:action.id};
  if(action.type==="guide")return {...state,selectedGuideId:action.id};
  if(action.type==="dates")return {...state,travelDates:{start:action.start,end:action.end}};
  if(action.type==="travellers"){
    const requested=normaliseCounts(action.counts);
    const minimum=maximumParticipants(state.experienceParticipants);
    return {...state,travellerCounts:{adults:Math.max(requested.adults,minimum.adults),children:Math.max(requested.children,minimum.children),infants:Math.max(requested.infants,minimum.infants)}};
  }
  if(action.type==="experienceParticipants")return {...state,experienceParticipants:{...state.experienceParticipants,[action.experienceId]:fitWithinTrip(normaliseCounts(action.counts,true),state.travellerCounts)}};
  if(action.type==="includeExperience"){
    const selectedExperienceIds=state.selectedExperienceIds.includes(action.experienceId)?state.selectedExperienceIds:[...state.selectedExperienceIds,action.experienceId];
    return {...state,selectedExperienceIds,experienceParticipants:{...state.experienceParticipants,[action.experienceId]:fitWithinTrip(normaliseCounts(action.counts,true),state.travellerCounts)}};
  }
  if(action.type==="budget")return {...state,budgetPreference:action.value};
  return state;
}

const Context=createContext<{state:JourneyState;dispatch:React.Dispatch<Action>}|null>(null);

export type JourneyInitialSelection={themeId?:string|null;experienceId?:string|null;travellers?:ParticipantCounts;experienceParticipants?:ParticipantCounts};
export function JourneyProvider({data,initialSelection,children}:{data:JourneyBootstrap;initialSelection?:JourneyInitialSelection;children:React.ReactNode}){
  const startingState=useMemo<JourneyState>(()=>{
    const experience=initialSelection?.experienceId?data.experiences.find(item=>item.id===initialSelection.experienceId):null;
    const destinationId=experience?.destinationIds[0];
    const destination=destinationId?data.destinations.find(item=>item.id===destinationId):null;
    const themeId=initialSelection?.themeId&&data.themes.some(theme=>theme.id===initialSelection.themeId)?initialSelection.themeId:experience?.themeIds[0]||destination?.themeIds[0];
    return {
      ...initial,
      selectedThemeIds:themeId?[themeId]:[],
      selectedDestinationIds:destinationId?[destinationId]:[],
      travellerCounts:initialSelection?.travellers?normaliseCounts(initialSelection.travellers):emptyParticipants,
      selectedExperienceIds:experience?[experience.id]:[],
      experienceParticipants:experience&&initialSelection?.experienceParticipants?{[experience.id]:normaliseCounts(initialSelection.experienceParticipants,true)}:{}
    };
  },[data.destinations,data.experiences,data.themes,initialSelection]);
  const [state,dispatch]=useReducer((current:JourneyState,action:Action)=>reducer(data,current,action),startingState);
  const value=useMemo(()=>({state,dispatch}),[state]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useJourney(){
  const value=useContext(Context);
  if(!value)throw new Error("useJourney must be used inside JourneyProvider");
  return value;
}
