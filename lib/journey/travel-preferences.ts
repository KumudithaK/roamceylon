export const travelPreferenceOptions=[
  ["scenic_train","Scenic Train"],
  ["private_chauffeur_car_suv","Private Chauffeur Car / SUV"],
  ["high_roof_van","High-Roof Van"],
  ["mini_coach_bus","Mini Coach / Bus"],
  ["tuk_tuk","Tuk-Tuk"],
  ["scooter","Scooter"],
  ["domestic_floatplane","Domestic Floatplane"],
  ["self_drive_car","Self-Drive Car"],
  ["self_drive_van","Self-Drive Van"],
  ["self_drive_tuk_tuk","Self-Drive Tuk-Tuk"],
  ["self_drive_scooter","Self-Drive Scooter"],
  ["recommend","Let Roam Ceylon Recommend"]
] as const;

export type TravelPreference=(typeof travelPreferenceOptions)[number][0];
export type JourneyLegPreference={fromDestinationId:string;toDestinationId:string;travelPreference:TravelPreference};
export type TravelPreferencesByLeg=Record<string,JourneyLegPreference>;

const travelValues=new Set<string>(travelPreferenceOptions.map(([value])=>value));
export const journeyLegKey=(fromDestinationId:string,toDestinationId:string)=>`${fromDestinationId}:${toDestinationId}`;
export const journeyLegs=(destinationIds:string[])=>destinationIds.slice(0,-1).map((fromDestinationId,index)=>({fromDestinationId,toDestinationId:destinationIds[index+1],key:journeyLegKey(fromDestinationId,destinationIds[index+1])}));

export function normaliseTravelPreferences(value:unknown,destinationIds:string[]):TravelPreferencesByLeg{
  const source=value&&typeof value==="object"&&!Array.isArray(value)?value as Record<string,unknown>:{};
  return Object.fromEntries(journeyLegs(destinationIds).map(leg=>{
    const item=source[leg.key]&&typeof source[leg.key]==="object"&&!Array.isArray(source[leg.key])?source[leg.key] as Record<string,unknown>:{};
    return [leg.key,{fromDestinationId:leg.fromDestinationId,toDestinationId:leg.toDestinationId,travelPreference:travelValues.has(String(item.travelPreference))?item.travelPreference as TravelPreference:"recommend"}];
  }));
}

export const travelPreferenceLabel=(value:TravelPreference)=>travelPreferenceOptions.find(([key])=>key===value)?.[1]??"Let Roam Ceylon Recommend";

export function recommendedTravelPreferences(travellers:number):TravelPreference[]{
  if(travellers>=16)return ["mini_coach_bus"];
  if(travellers>=7)return ["high_roof_van","mini_coach_bus"];
  if(travellers>=3)return ["private_chauffeur_car_suv","high_roof_van","scenic_train"];
  if(travellers>=1)return ["private_chauffeur_car_suv","scenic_train","tuk_tuk"];
  return [];
}
