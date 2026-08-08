export type AllocationType="accommodation"|"guide"|"vehicle"|"experience";
export type AllocationScope={
  key:string;
  type:AllocationType;
  destinationId:string|null;
  fromDestinationId:string|null;
  toDestinationId:string|null;
  guideRole:"primary"|"specialist"|"legacy_destination"|null;
  guideSpeciality:string|null;
};

export type AllocationRequirements={
  nightsByDestination?:Record<string,number|null>;
  guidePreferencesByDestination?:Record<string,string|null>;
  journeyGuidePreference?:string|null;
  specialistGuidePreferencesByDestination?:Record<string,string|null>;
};

export const destinationAllocationKey=(type:"accommodation"|"guide",destinationId:string)=>`${type}:${destinationId}`;
export const journeyGuideAllocationKey="guide:journey";
export const vehicleAllocationKey=(fromDestinationId:string,toDestinationId:string)=>`vehicle:${fromDestinationId}:${toDestinationId}`;
export const experienceAllocationKey=(experienceId:string)=>`experience:${experienceId}`;

export function journeyAllocationScopes(destinationIds:string[],experiences:Array<{experienceId:string;destinationId:string}>=[],requirements:AllocationRequirements={}):AllocationScope[]{
  const hasNights=Boolean(requirements.nightsByDestination);
  const hasGuidePreferences=Boolean(requirements.guidePreferencesByDestination);
  const accommodationScopes=destinationIds.filter(destinationId=>!hasNights||requirements.nightsByDestination?.[destinationId]!==0).map(destinationId=>({
    key:destinationAllocationKey("accommodation",destinationId),type:"accommodation" as const,destinationId,fromDestinationId:null,toDestinationId:null,guideRole:null,guideSpeciality:null
  }));
  const hasGlobalGuide=requirements.journeyGuidePreference!==undefined;
  const journeyGuideRequired=hasGlobalGuide?requirements.journeyGuidePreference!=="no_guide":hasGuidePreferences&&destinationIds.some(destinationId=>["national_tourist_guide","chauffeur_tourist_guide"].includes(requirements.guidePreferencesByDestination?.[destinationId]??""));
  const journeyGuideScopes:AllocationScope[]=journeyGuideRequired?[{key:journeyGuideAllocationKey,type:"guide",destinationId:null,fromDestinationId:null,toDestinationId:null,guideRole:"primary",guideSpeciality:null}]:[];
  const destinationGuideScopes=destinationIds.filter(destinationId=>{
    if(hasGlobalGuide)return (requirements.specialistGuidePreferencesByDestination?.[destinationId]??"none")!=="none";
    if(!hasGuidePreferences)return true;
    const preference=requirements.guidePreferencesByDestination?.[destinationId]??"recommend";
    return preference!=="no_guide"&&!["national_tourist_guide","chauffeur_tourist_guide"].includes(preference);
  }).map<AllocationScope>(destinationId=>({
    key:destinationAllocationKey("guide",destinationId),type:"guide" as const,destinationId,fromDestinationId:null,toDestinationId:null,guideRole:hasGlobalGuide?"specialist":"legacy_destination",guideSpeciality:hasGlobalGuide?requirements.specialistGuidePreferencesByDestination?.[destinationId]??null:null
  }));
  const destinationScopes=!hasNights&&!hasGuidePreferences&&!hasGlobalGuide?destinationIds.flatMap(destinationId=>([
    {key:destinationAllocationKey("accommodation",destinationId),type:"accommodation" as const,destinationId,fromDestinationId:null,toDestinationId:null,guideRole:null,guideSpeciality:null},
    {key:destinationAllocationKey("guide",destinationId),type:"guide" as const,destinationId,fromDestinationId:null,toDestinationId:null,guideRole:"legacy_destination" as const,guideSpeciality:null}
  ])):[...accommodationScopes,...journeyGuideScopes,...destinationGuideScopes];
  const vehicleScopes=destinationIds.slice(0,-1).map((fromDestinationId,index)=>({
    key:vehicleAllocationKey(fromDestinationId,destinationIds[index+1]),
    type:"vehicle" as const,
    destinationId:null,
    fromDestinationId,
    toDestinationId:destinationIds[index+1],guideRole:null,guideSpeciality:null
  }));
  const experienceScopes=experiences.map(item=>({
    key:experienceAllocationKey(item.experienceId),type:"experience" as const,
    destinationId:item.destinationId,fromDestinationId:null,toDestinationId:null,guideRole:null,guideSpeciality:null
  }));
  return [...destinationScopes,...vehicleScopes,...experienceScopes];
}

export function hasOwnPreferenceSnapshot(value:unknown,key:"destinationPreferences"|"travelPreferencesByLeg"){
  if(!value||typeof value!=="object"||Array.isArray(value))return false;
  const root=value as Record<string,unknown>;
  const state=root.state&&typeof root.state==="object"&&!Array.isArray(root.state)?root.state as Record<string,unknown>:root;
  return Boolean(state[key]&&typeof state[key]==="object"&&!Array.isArray(state[key]));
}

export function hasOwnJourneyGuideSnapshot(value:unknown){
  if(!value||typeof value!=="object"||Array.isArray(value))return false;
  const root=value as Record<string,unknown>;
  const state=root.state&&typeof root.state==="object"&&!Array.isArray(root.state)?root.state as Record<string,unknown>:root;
  return Object.prototype.hasOwnProperty.call(state,"journeyGuidePreference");
}
