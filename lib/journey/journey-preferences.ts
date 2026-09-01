export const stayPreferenceOptions=[
  ["five_star_resorts","5-Star Class Resorts"],
  ["four_star_resorts","4-Star Class Resorts"],
  ["boutique_hotels_villas","Boutique Hotels & Villas"],
  ["guest_houses","Guest Houses"],
  ["homestays","Homestays"],
  ["bungalows","Bungalows"],
  ["eco_lodges_tented_camps","Eco-Lodges & Tented Camps"],
  ["wellness_retreats","Wellness Retreats"],
  ["recommend","Let The Ceylon Edition Recommend"]
] as const;

export const guidePreferenceOptions=[
  ["national_tourist_guide","National Tourist Guide"],
  ["chauffeur_tourist_guide","Chauffeur Tourist Guide"],
  ["area_tourist_guide","Area Tourist Guide"],
  ["site_tourist_guide","Site Tourist Guide"],
  ["wildlife_tracker_safari_guide","Wildlife Tracker / Safari Guide"],
  ["adventure_trekking_guide","Adventure / Trekking Guide"],
  ["no_guide","No Guide"],
  ["recommend","Let The Ceylon Edition Recommend"]
] as const;

export const journeyGuidePreferenceOptions=[
  ["national_tourist_guide","National Tourist Guide"],
  ["chauffeur_tourist_guide","Chauffeur Tourist Guide"],
  ["no_guide","No Guide Required"],
  ["recommend","Let The Ceylon Edition Recommend"]
] as const;

export const guideLanguageOptions=["English","German","French","Spanish","Italian","Japanese","Chinese","Russian","Arabic","Other"] as const;

export const specialistGuideOptionsByDestination:Record<string,readonly (readonly [string,string])[]>={
  sigiriya:[["none","None"],["site_guide","Site Guide"],["archaeological_guide","Archaeological Guide"]],
  kandy:[["none","None"],["temple_specialist","Temple Specialist"]],
  yala:[["none","None"],["wildlife_tracker","Wildlife Tracker"],["birding_guide","Birding Guide"]],
  "horton plains":[["none","None"],["trekking_guide","Trekking Guide"]],
  mirissa:[["none","None"],["whale_watching_naturalist","Whale Watching Naturalist"]],
  "arugam bay":[["none","None"],["surf_coach","Surf Coach"]]
};

export type StayPreference=(typeof stayPreferenceOptions)[number][0];
export type GuidePreference=(typeof guidePreferenceOptions)[number][0];
export type JourneyGuidePreference=(typeof journeyGuidePreferenceOptions)[number][0];
export type GuideLanguage=(typeof guideLanguageOptions)[number];
export type DestinationPreference={stayPreference:StayPreference;guidePreference:GuidePreference;specialistGuidePreference?:string;nights:number|null;notes:string};
export type DestinationPreferences=Record<string,DestinationPreference>;

const stayValues=new Set<string>(stayPreferenceOptions.map(([value])=>value));
const guideValues=new Set<string>(guidePreferenceOptions.map(([value])=>value));
export const defaultDestinationPreference=():DestinationPreference=>({stayPreference:"recommend",guidePreference:"recommend",specialistGuidePreference:"none",nights:null,notes:""});

export function normaliseDestinationPreferences(value:unknown,destinationIds:string[]):DestinationPreferences{
  const source=value&&typeof value==="object"&&!Array.isArray(value)?value as Record<string,unknown>:{};
  return Object.fromEntries(destinationIds.map(destinationId=>{
    const item=source[destinationId]&&typeof source[destinationId]==="object"&&!Array.isArray(source[destinationId])?source[destinationId] as Record<string,unknown>:{};
    return [destinationId,{
      stayPreference:stayValues.has(String(item.stayPreference))?item.stayPreference as StayPreference:"recommend",
      guidePreference:guideValues.has(String(item.guidePreference))?item.guidePreference as GuidePreference:"recommend",
      specialistGuidePreference:typeof item.specialistGuidePreference==="string"?item.specialistGuidePreference:"none",
      nights:item.nights!==null&&item.nights!==undefined&&item.nights!==""&&Number.isFinite(Number(item.nights))&&Number(item.nights)>=0?Math.floor(Number(item.nights)):null,
      notes:typeof item.notes==="string"?item.notes:""
    }];
  }));
}

export const stayPreferenceLabel=(value:StayPreference)=>stayPreferenceOptions.find(([key])=>key===value)?.[1]??"Let The Ceylon Edition Recommend";
export const guidePreferenceLabel=(value:GuidePreference)=>guidePreferenceOptions.find(([key])=>key===value)?.[1]??"Let The Ceylon Edition Recommend";
export const journeyGuidePreferenceLabel=(value:JourneyGuidePreference)=>journeyGuidePreferenceOptions.find(([key])=>key===value)?.[1]??"Let The Ceylon Edition Recommend";
export const specialistGuideOptions=(destinationName:string)=>specialistGuideOptionsByDestination[destinationName.trim().toLowerCase()]??[["none","None"]] as const;
export const specialistGuidePreferenceLabel=(destinationName:string,value:string)=>specialistGuideOptions(destinationName).find(([key])=>key===value)?.[1]??"None";

const journeyGuideValues=new Set<string>(journeyGuidePreferenceOptions.map(([value])=>value));
const languageValues=new Set<string>(guideLanguageOptions);
export const normaliseJourneyGuidePreference=(value:unknown):JourneyGuidePreference=>journeyGuideValues.has(String(value))?value as JourneyGuidePreference:"recommend";
export const normaliseGuideLanguages=(value:unknown):GuideLanguage[]=>Array.isArray(value)?[...new Set(value.filter((item):item is GuideLanguage=>typeof item==="string"&&languageValues.has(item)))]:[];
