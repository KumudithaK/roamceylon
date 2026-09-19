import {editionDisplayName} from "./brand.ts";
import type {JourneyExperience} from "./types.ts";

export type ExperienceFilters={query:string;edition:string;destination:string};

export const publicExperienceExcludedSlugs=["cricket-with-local-players"] as const;

export const experienceMerchandising={
  signature:{slug:"yala-morning-and-evening-4x4-jeep-safaris-in-block-1-world-renowned-leopard-d",imageClassName:"object-[center_42%]"},
  supporting:[
    {slug:"sigiriya-climbing-the-5th-century-sigiriya-rock-fortress-lion-rock",imageClassName:"object-center"},
    {slug:"kitulgala-white-water-rafting-on-the-kelani-river-grade-2-3-rapids",imageClassName:"object-center"},
    {slug:"arugambay-relaxed-beach-lifestyle-yoga-on-the-beach-and-hammock-lounging",imageClassName:"object-center"},
    {slug:"kalpitiya-gangewadiya-mangrove-fishing-village-boat-journey",imageClassName:"object-center"},
    {slug:"ella-photography-at-the-world-famous-nine-arches-railway-bridge",imageClassName:"object-center"}
  ]
} as const;

const words=(value:string|null|undefined)=>value?.trim().toLocaleLowerCase()??"";
const excludedSlugs=new Set<string>(publicExperienceExcludedSlugs);

export function isPubliclyDiscoverableExperience<T extends {slug:string}>(experience:T){
  return !excludedSlugs.has(experience.slug);
}

export function publiclyDiscoverableExperiences<T extends {slug:string}>(experiences:T[]){
  return experiences.filter(isPubliclyDiscoverableExperience);
}

export function experienceEditionLabels(experience:JourneyExperience){
  return (experience.themes??[]).map(theme=>editionDisplayName(theme));
}

export function experiencePlace(experience:JourneyExperience){
  return experience.destinationNames?.slice(0,2).join(" · ")||"Sri Lanka";
}

export function selectExperienceMerchandising(experiences:JourneyExperience[]){
  const discoverable=publiclyDiscoverableExperiences(experiences);
  const bySlug=new Map(discoverable.map(experience=>[experience.slug,experience]));
  const signature=bySlug.get(experienceMerchandising.signature.slug)??discoverable.find(experience=>Boolean(experience.hero_image_url))??discoverable[0]??null;
  const preferred=experienceMerchandising.supporting.flatMap(slot=>{
    const experience=bySlug.get(slot.slug);
    return experience&&experience.id!==signature?.id?[experience]:[];
  });
  const preferredIds=new Set(preferred.map(experience=>experience.id));
  const fallback=discoverable.filter(experience=>experience.id!==signature?.id&&!preferredIds.has(experience.id)&&experience.hero_image_url);
  return {signature,supporting:[...preferred,...fallback].slice(0,experienceMerchandising.supporting.length)};
}

export function merchandisingImageClass(experience:JourneyExperience){
  if(experience.slug===experienceMerchandising.signature.slug)return experienceMerchandising.signature.imageClassName;
  return experienceMerchandising.supporting.find(item=>item.slug===experience.slug)?.imageClassName??"object-center";
}

export function filterExperiences(experiences:JourneyExperience[],filters:ExperienceFilters){
  const query=words(filters.query);
  return experiences.filter(experience=>{
    const matchesEdition=!filters.edition||(experience.themes??[]).some(theme=>theme.slug===filters.edition);
    const matchesDestination=!filters.destination||(experience.destinations??[]).some(destination=>destination.slug===filters.destination);
    const searchable=[experience.name,experience.category,experience.short_description,experience.full_description,...(experience.destinationNames??[]),...experienceEditionLabels(experience)].map(words).join(" ");
    return matchesEdition&&matchesDestination&&(!query||searchable.includes(query));
  });
}

export function experienceEditionOptions(experiences:JourneyExperience[]){
  const options=new Map<string,string>();
  for(const experience of experiences)for(const theme of experience.themes??[])options.set(theme.slug,editionDisplayName(theme));
  return [...options].map(([value,label])=>({value,label})).sort((a,b)=>a.label.localeCompare(b.label));
}

export function experienceDestinationOptions(experiences:JourneyExperience[]){
  const options=new Map<string,string>();
  for(const experience of experiences)for(const destination of experience.destinations??[])options.set(destination.slug,destination.name);
  return [...options].map(([value,label])=>({value,label})).sort((a,b)=>a.label.localeCompare(b.label));
}

export function experienceContext(experience:JourneyExperience){
  return [experiencePlace(experience),...experienceEditionLabels(experience).slice(0,1)].filter(Boolean).join(" · ")||experience.category||"Sri Lanka";
}
