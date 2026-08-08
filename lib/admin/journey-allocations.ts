import {journeyLegs} from "../journey/travel-preferences.ts";

export type AllocationType="accommodation"|"guide"|"vehicle";
export type AllocationScope={
  key:string;
  type:AllocationType;
  destinationId:string|null;
  fromDestinationId:string|null;
  toDestinationId:string|null;
};

export const destinationAllocationKey=(type:"accommodation"|"guide",destinationId:string)=>`${type}:${destinationId}`;
export const vehicleAllocationKey=(fromDestinationId:string,toDestinationId:string)=>`vehicle:${fromDestinationId}:${toDestinationId}`;

export function journeyAllocationScopes(destinationIds:string[]):AllocationScope[]{
  const destinationScopes=destinationIds.flatMap(destinationId=>([
    {key:destinationAllocationKey("accommodation",destinationId),type:"accommodation" as const,destinationId,fromDestinationId:null,toDestinationId:null},
    {key:destinationAllocationKey("guide",destinationId),type:"guide" as const,destinationId,fromDestinationId:null,toDestinationId:null}
  ]));
  const vehicleScopes=journeyLegs(destinationIds).map(leg=>({
    key:vehicleAllocationKey(leg.fromDestinationId,leg.toDestinationId),
    type:"vehicle" as const,
    destinationId:null,
    fromDestinationId:leg.fromDestinationId,
    toDestinationId:leg.toDestinationId
  }));
  return [...destinationScopes,...vehicleScopes];
}

export function hasOwnPreferenceSnapshot(value:unknown,key:"destinationPreferences"|"travelPreferencesByLeg"){
  if(!value||typeof value!=="object"||Array.isArray(value))return false;
  const root=value as Record<string,unknown>;
  const state=root.state&&typeof root.state==="object"&&!Array.isArray(root.state)?root.state as Record<string,unknown>:root;
  return Boolean(state[key]&&typeof state[key]==="object"&&!Array.isArray(state[key]));
}
