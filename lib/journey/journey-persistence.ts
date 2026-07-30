"use client";

import type {JourneyState} from "@/features/journey/journey-store";

export const journeyStorageKey="roam-ceylon-journey-v3";
export const journeyStateEvent="roam-ceylon:journey-state";

export function readJourneyState():JourneyState|null{
  if(typeof window==="undefined")return null;
  try{
    const raw=localStorage.getItem(journeyStorageKey);
    if(!raw)return null;
    const parsed=JSON.parse(raw) as Partial<JourneyState>;
    if(!Array.isArray(parsed.selectedThemeIds)||!Array.isArray(parsed.selectedDestinationIds)||!Array.isArray(parsed.selectedExperienceIds))return null;
    return {
      selectedThemeIds:parsed.selectedThemeIds,
      selectedDestinationIds:parsed.selectedDestinationIds,
      selectedExperienceIds:parsed.selectedExperienceIds,
      selectedStayIdsByDestination:parsed.selectedStayIdsByDestination??{},
      selectedVehicleId:parsed.selectedVehicleId??null,
      selectedGuideId:parsed.selectedGuideId??null,
      travelDates:parsed.travelDates??{start:"",end:""},
      travellerCounts:{adults:Number(parsed.travellerCounts?.adults)||0,children:Number(parsed.travellerCounts?.children)||0,infants:Number(parsed.travellerCounts?.infants)||0},
      experienceParticipants:parsed.experienceParticipants??{},
      budgetPreference:parsed.budgetPreference??"flexible"
    };
  }catch{return null}
}

export function writeJourneyState(state:JourneyState){
  if(typeof window==="undefined")return;
  localStorage.setItem(journeyStorageKey,JSON.stringify(state));
  window.dispatchEvent(new CustomEvent<JourneyState>(journeyStateEvent,{detail:state}));
}

export function subscribeJourneyState(listener:(state:JourneyState)=>void){
  if(typeof window==="undefined")return()=>{};
  const receive=(event:Event)=>{
    if(event instanceof CustomEvent&&event.detail)listener(event.detail as JourneyState);
    else{const state=readJourneyState();if(state)listener(state)}
  };
  window.addEventListener(journeyStateEvent,receive);
  window.addEventListener("storage",receive);
  return()=>{window.removeEventListener(journeyStateEvent,receive);window.removeEventListener("storage",receive)};
}
