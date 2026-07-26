"use client";

import {createContext,useContext,useEffect,useMemo,useReducer} from "react";
import type {JourneyBootstrap} from "@/lib/journey/journey-service";
import {availableDestinations,availableExperiences} from "@/lib/journey/journey-selectors";

export type JourneyState={
  selectedThemeIds:string[];
  selectedDestinationIds:string[];
  selectedExperienceIds:string[];
  selectedStayIdsByDestination:Record<string,string>;
  selectedVehicleId:string|null;
  selectedGuideId:string|null;
  travelDates:{start:string;end:string};
  travellerCounts:{adults:number;children:number};
  budgetPreference:string;
};
type Action=
  |{type:"toggle";field:"selectedThemeIds"|"selectedDestinationIds"|"selectedExperienceIds";id:string}
  |{type:"stay";destinationId:string;stayId:string}
  |{type:"vehicle"|"guide";id:string|null}
  |{type:"hydrate";state:JourneyState};

const initial:JourneyState={selectedThemeIds:[],selectedDestinationIds:[],selectedExperienceIds:[],selectedStayIdsByDestination:{},selectedVehicleId:null,selectedGuideId:null,travelDates:{start:"",end:""},travellerCounts:{adults:2,children:0},budgetPreference:"flexible"};
const storageKey="roam-ceylon-journey-v2";

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
      result={...result,selectedDestinationIds,selectedExperienceIds:state.selectedExperienceIds.filter(id=>validExperiences.has(id)),selectedStayIdsByDestination:Object.fromEntries(Object.entries(state.selectedStayIdsByDestination).filter(([id])=>validDestinations.has(id)))};
    }
    if(action.field==="selectedDestinationIds"){
      const validExperiences=new Set(availableExperiences(data.experiences,next).map(item=>item.id));
      result={...result,selectedExperienceIds:state.selectedExperienceIds.filter(id=>validExperiences.has(id)),selectedStayIdsByDestination:Object.fromEntries(Object.entries(state.selectedStayIdsByDestination).filter(([id])=>next.includes(id)))};
    }
    return result;
  }
  if(action.type==="stay")return {...state,selectedStayIdsByDestination:{...state.selectedStayIdsByDestination,[action.destinationId]:action.stayId}};
  if(action.type==="vehicle")return {...state,selectedVehicleId:action.id};
  if(action.type==="guide")return {...state,selectedGuideId:action.id};
  return state;
}

const Context=createContext<{state:JourneyState;dispatch:React.Dispatch<Action>}|null>(null);

export function JourneyProvider({data,children}:{data:JourneyBootstrap;children:React.ReactNode}){
  const loadInitial=():JourneyState=>{
    if(typeof window==="undefined")return initial;
    try{
      const saved=localStorage.getItem(storageKey);
      if(saved){
        const parsed=JSON.parse(saved) as {version?:number;state?:JourneyState};
        if(parsed.version===2&&parsed.state)return {...initial,...parsed.state};
        else localStorage.removeItem(storageKey);
      }
    }catch{localStorage.removeItem(storageKey)}
    return initial;
  };
  const [state,dispatch]=useReducer((current:JourneyState,action:Action)=>reducer(data,current,action),initial,loadInitial);
  useEffect(()=>{localStorage.setItem(storageKey,JSON.stringify({version:2,state}))},[state]);
  const value=useMemo(()=>({state,dispatch}),[state]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useJourney(){
  const value=useContext(Context);
  if(!value)throw new Error("useJourney must be used inside JourneyProvider");
  return value;
}
