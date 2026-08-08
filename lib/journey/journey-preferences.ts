export const stayPreferenceOptions=[
  ["five_star_resorts","5-Star Class Resorts"],
  ["four_star_resorts","4-Star Class Resorts"],
  ["boutique_hotels_villas","Boutique Hotels & Villas"],
  ["guest_houses","Guest Houses"],
  ["homestays","Homestays"],
  ["bungalows","Bungalows"],
  ["eco_lodges_tented_camps","Eco-Lodges & Tented Camps"],
  ["wellness_retreats","Wellness Retreats"],
  ["recommend","Let Roam Ceylon Recommend"]
] as const;

export const guidePreferenceOptions=[
  ["national_tourist_guide","National Tourist Guide"],
  ["chauffeur_tourist_guide","Chauffeur Tourist Guide"],
  ["area_tourist_guide","Area Tourist Guide"],
  ["site_tourist_guide","Site Tourist Guide"],
  ["wildlife_tracker_safari_guide","Wildlife Tracker / Safari Guide"],
  ["adventure_trekking_guide","Adventure / Trekking Guide"],
  ["no_guide","No Guide"],
  ["recommend","Let Roam Ceylon Recommend"]
] as const;

export type StayPreference=(typeof stayPreferenceOptions)[number][0];
export type GuidePreference=(typeof guidePreferenceOptions)[number][0];
export type DestinationPreference={stayPreference:StayPreference;guidePreference:GuidePreference;notes:string};
export type DestinationPreferences=Record<string,DestinationPreference>;

const stayValues=new Set<string>(stayPreferenceOptions.map(([value])=>value));
const guideValues=new Set<string>(guidePreferenceOptions.map(([value])=>value));
export const defaultDestinationPreference=():DestinationPreference=>({stayPreference:"recommend",guidePreference:"recommend",notes:""});

export function normaliseDestinationPreferences(value:unknown,destinationIds:string[]):DestinationPreferences{
  const source=value&&typeof value==="object"&&!Array.isArray(value)?value as Record<string,unknown>:{};
  return Object.fromEntries(destinationIds.map(destinationId=>{
    const item=source[destinationId]&&typeof source[destinationId]==="object"&&!Array.isArray(source[destinationId])?source[destinationId] as Record<string,unknown>:{};
    return [destinationId,{
      stayPreference:stayValues.has(String(item.stayPreference))?item.stayPreference as StayPreference:"recommend",
      guidePreference:guideValues.has(String(item.guidePreference))?item.guidePreference as GuidePreference:"recommend",
      notes:typeof item.notes==="string"?item.notes:""
    }];
  }));
}

export const stayPreferenceLabel=(value:StayPreference)=>stayPreferenceOptions.find(([key])=>key===value)?.[1]??"Let Roam Ceylon Recommend";
export const guidePreferenceLabel=(value:GuidePreference)=>guidePreferenceOptions.find(([key])=>key===value)?.[1]??"Let Roam Ceylon Recommend";
