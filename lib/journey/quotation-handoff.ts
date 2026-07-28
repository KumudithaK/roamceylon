import type {Json} from "@/lib/database.types";
import type {PublicPackageQuote} from "@/lib/pricing/package-types";
import type {JourneyState} from "@/features/journey/journey-store";

export const quotationHandoffKey="roam-ceylon-quotation-handoff-v1";

export type JourneyQuotationHandoff={
  version:1;
  createdAt:string;
  state:JourneyState;
  quote:PublicPackageQuote|null;
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

export function saveJourneyHandoff(state:JourneyState,quote:PublicPackageQuote|null){
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
        return {version:1,createdAt:parsed.createdAt||new Date().toISOString(),state:parsed.state,quote:parsed.quote??null};
      }
    }
    const legacy=localStorage.getItem("roam-ceylon-journey-v2");
    if(!legacy)return null;
    const parsed=JSON.parse(legacy) as {version?:number;state?:unknown};
    return parsed.version===2&&isJourneyState(parsed.state)
      ?{version:1,createdAt:new Date().toISOString(),state:parsed.state,quote:null}
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
      state:record.state,
      quote:record.quote as PublicPackageQuote|null
    };
  }
  return isJourneyState(value)
    ?{version:1,createdAt:"",state:value,quote:null}
    :null;
}
