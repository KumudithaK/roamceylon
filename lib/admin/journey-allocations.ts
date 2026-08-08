export type AllocationType="accommodation"|"guide"|"vehicle"|"experience";
export type AllocationScope={
  key:string;
  type:AllocationType;
  destinationId:string|null;
  fromDestinationId:string|null;
  toDestinationId:string|null;
};

export const destinationAllocationKey=(type:"accommodation"|"guide",destinationId:string)=>`${type}:${destinationId}`;
export const vehicleAllocationKey=(fromDestinationId:string,toDestinationId:string)=>`vehicle:${fromDestinationId}:${toDestinationId}`;
export const experienceAllocationKey=(experienceId:string)=>`experience:${experienceId}`;

export function journeyAllocationScopes(destinationIds:string[],experiences:Array<{experienceId:string;destinationId:string}>=[]):AllocationScope[]{
  const destinationScopes=destinationIds.flatMap(destinationId=>([
    {key:destinationAllocationKey("accommodation",destinationId),type:"accommodation" as const,destinationId,fromDestinationId:null,toDestinationId:null},
    {key:destinationAllocationKey("guide",destinationId),type:"guide" as const,destinationId,fromDestinationId:null,toDestinationId:null}
  ]));
  const vehicleScopes=destinationIds.slice(0,-1).map((fromDestinationId,index)=>({
    key:vehicleAllocationKey(fromDestinationId,destinationIds[index+1]),
    type:"vehicle" as const,
    destinationId:null,
    fromDestinationId,
    toDestinationId:destinationIds[index+1]
  }));
  const experienceScopes=experiences.map(item=>({
    key:experienceAllocationKey(item.experienceId),type:"experience" as const,
    destinationId:item.destinationId,fromDestinationId:null,toDestinationId:null
  }));
  return [...destinationScopes,...vehicleScopes,...experienceScopes];
}

export function hasOwnPreferenceSnapshot(value:unknown,key:"destinationPreferences"|"travelPreferencesByLeg"){
  if(!value||typeof value!=="object"||Array.isArray(value))return false;
  const root=value as Record<string,unknown>;
  const state=root.state&&typeof root.state==="object"&&!Array.isArray(root.state)?root.state as Record<string,unknown>:root;
  return Boolean(state[key]&&typeof state[key]==="object"&&!Array.isArray(state[key]));
}
