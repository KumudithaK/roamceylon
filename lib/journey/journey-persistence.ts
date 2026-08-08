"use client";

import type {JourneyState} from "@/features/journey/journey-store";
import {normaliseDestinationPreferences} from "@/lib/journey/journey-preferences";
import {normaliseTravelPreferences} from "@/lib/journey/travel-preferences";

export const journeyStorageKey="roam-ceylon-journey-v3";
export const journeyStateEvent="roam-ceylon:journey-state";
const launchParameters=["theme","themes","destination","experience","step","adults","children","infants","experienceAdults","experienceChildren","experienceInfants"];

export function readJourneyState():JourneyState|null{
  if(typeof window==="undefined")return null;
  try{
    const raw=localStorage.getItem(journeyStorageKey);
    if(!raw)return null;
    const parsed=JSON.parse(raw) as Partial<JourneyState>;
    if(!Array.isArray(parsed.selectedThemeIds)||!Array.isArray(parsed.selectedDestinationIds)||!Array.isArray(parsed.selectedExperienceIds))return null;
    return {
      currentStep:Math.min(6,Math.max(0,Number(parsed.currentStep)||0)),
      selectedThemeIds:parsed.selectedThemeIds,
      selectedDestinationIds:parsed.selectedDestinationIds,
      selectedExperienceIds:parsed.selectedExperienceIds,
      destinationPreferences:normaliseDestinationPreferences(parsed.destinationPreferences,parsed.selectedDestinationIds),
      travelPreferencesByLeg:normaliseTravelPreferences(parsed.travelPreferencesByLeg,parsed.selectedDestinationIds),
      selectedStayIdsByDestination:{},
      selectedVehicleId:null,
      selectedGuideId:null,
      selectedPricingPlanIds:Object.fromEntries(Object.entries(parsed.selectedPricingPlanIds??{}).filter(([key])=>!key.startsWith("accommodation:")&&!key.startsWith("guide:")&&!key.startsWith("vehicle:"))),
      travelDates:parsed.travelDates??{start:"",end:""},
      travellerCounts:{adults:Number(parsed.travellerCounts?.adults)||0,children:Number(parsed.travellerCounts?.children)||0,infants:Number(parsed.travellerCounts?.infants)||0},
      experienceParticipants:parsed.experienceParticipants??{},
      budgetPreference:parsed.budgetPreference??"flexible",
      travelPace:parsed.travelPace??"balanced",
      accessibilityRequirements:parsed.accessibilityRequirements??""
    };
  }catch{return null}
}

export function writeJourneyState(state:JourneyState){
  if(typeof window==="undefined")return;
  try{
    localStorage.setItem(journeyStorageKey,JSON.stringify(state));
    window.dispatchEvent(new CustomEvent<JourneyState>(journeyStateEvent,{detail:state}));
  }catch{
    // The journey remains usable in memory when private browsing blocks storage.
  }
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

export function clearJourneyLaunchParameters(){
  if(typeof window==="undefined")return;
  const url=new URL(window.location.href);
  let changed=false;
  for(const parameter of launchParameters){
    if(url.searchParams.has(parameter)){url.searchParams.delete(parameter);changed=true}
  }
  if(changed)window.history.replaceState(window.history.state,"",`${url.pathname}${url.search}${url.hash}`);
}
