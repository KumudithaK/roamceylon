import type {Json} from "@/lib/database.types";
import type {PublicPackageQuote} from "@/lib/pricing/package-types";
import type {PublicJourneyEstimate} from "@/lib/pricing/journey-estimate-types";
import type {JourneyState} from "@/features/journey/journey-store";
import {normaliseDestinationPreferences,normaliseGuideLanguages,normaliseJourneyGuidePreference} from "@/lib/journey/journey-preferences";
import {completeJourneyLegs,normaliseCompleteTravelPreferences} from "@/lib/journey/travel-preferences";
import {normaliseJourneyEndpoint} from "@/lib/journey/journey-endpoints";

export const quotationHandoffKey="roam-ceylon-quotation-handoff-v1";

export type JourneyQuotationHandoff={
  version:1;
  createdAt:string;
  state:JourneyState;
  quote:PublicJourneyEstimate|PublicPackageQuote|null;
};

const isJourneyState=(value:unknown):value is JourneyState=>{
  if(!value||typeof value!=="object"||Array.isArray(value))return false;
  const state=value as Partial<JourneyState>;
  return Array.isArray(state.selectedThemeIds)
    &&Array.isArray(state.selectedDestinationIds)
    &&Array.isArray(state.selectedExperienceIds)
    &&Boolean(state.selectedStayIdsByDestination)
    &&Boolean(state.travellerCounts)
    &&Boolean(state.travelDates);
};
const normaliseState=(state:JourneyState):JourneyState=>{
  const pickup=normaliseJourneyEndpoint(state.pickup,state.travelDates.start);
  const dropoff=normaliseJourneyEndpoint(state.dropoff,state.travelDates.end);
  const legs=completeJourneyLegs(state.selectedDestinationIds,Boolean(pickup.type),Boolean(dropoff.type));
  return {...state,
  currentStep:Math.min(6,Math.max(0,Number(state.currentStep)||0)),
  destinationPreferences:normaliseDestinationPreferences(state.destinationPreferences,state.selectedDestinationIds),
  journeyGuidePreference:normaliseJourneyGuidePreference(state.journeyGuidePreference),
  journeyGuideLanguages:normaliseGuideLanguages(state.journeyGuideLanguages),
  journeyGuideNotes:typeof state.journeyGuideNotes==="string"?state.journeyGuideNotes:"",
  pickup,
  dropoff,
  globalTravelPreference:state.globalTravelPreference??"recommend",
  travelPreferencesByLeg:normaliseCompleteTravelPreferences(state.travelPreferencesByLeg,legs),
  travellerCounts:{adults:Number(state.travellerCounts.adults)||0,children:Number(state.travellerCounts.children)||0,infants:Number(state.travellerCounts.infants)||0},
  experienceParticipants:state.experienceParticipants??{},
  selectedPricingPlanIds:state.selectedPricingPlanIds??{},
  budgetPreference:state.budgetPreference??"flexible",
  travelPace:state.travelPace??"balanced",
  accessibilityRequirements:state.accessibilityRequirements??""
  };
};

export function saveJourneyHandoff(state:JourneyState,quote:PublicJourneyEstimate|PublicPackageQuote|null){
  if(typeof window==="undefined")return;
  const payload:JourneyQuotationHandoff={version:1,createdAt:new Date().toISOString(),state,quote};
  sessionStorage.setItem(quotationHandoffKey,JSON.stringify(payload));
}

export function readJourneyHandoff():JourneyQuotationHandoff|null{
  if(typeof window==="undefined")return null;
  try{
    const saved=sessionStorage.getItem(quotationHandoffKey);
    if(saved){
      const parsed=JSON.parse(saved) as Partial<JourneyQuotationHandoff>;
      if(parsed.version===1&&isJourneyState(parsed.state)){
        return {version:1,createdAt:parsed.createdAt||new Date().toISOString(),state:normaliseState(parsed.state),quote:parsed.quote??null};
      }
    }
    const legacy=localStorage.getItem("roam-ceylon-journey-v2");
    if(!legacy)return null;
    const parsed=JSON.parse(legacy) as {version?:number;state?:unknown};
    return parsed.version===2&&isJourneyState(parsed.state)
      ?{version:1,createdAt:new Date().toISOString(),state:normaliseState(parsed.state),quote:null}
      :null;
  }catch{
    return null;
  }
}

export function clearJourneyHandoff(){
  if(typeof window!=="undefined")sessionStorage.removeItem(quotationHandoffKey);
}

export function journeyHandoffToJson(handoff:JourneyQuotationHandoff|null):Json{
  return handoff?JSON.parse(JSON.stringify(handoff)) as Json:{};
}

export function parseJourneyHandoff(value:Json):JourneyQuotationHandoff|null{
  if(!value||typeof value!=="object"||Array.isArray(value))return null;
  const record=value as Record<string,Json|undefined>;
  if(record.version===1&&isJourneyState(record.state)){
    return {
      version:1,
      createdAt:typeof record.createdAt==="string"?record.createdAt:"",
      state:normaliseState(record.state),
      quote:record.quote as PublicJourneyEstimate|PublicPackageQuote|null
    };
  }
  return isJourneyState(value)
    ?{version:1,createdAt:"",state:normaliseState(value),quote:null}
    :null;
}
