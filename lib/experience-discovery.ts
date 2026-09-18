import {editionDisplayName} from "./brand.ts";
import type {JourneyExperience} from "./types.ts";

export type ExperienceFilters={query:string;edition:string;destination:string};

const words=(value:string|null|undefined)=>value?.trim().toLocaleLowerCase()??"";

export function experienceEditionLabels(experience:JourneyExperience){
  return (experience.themes??[]).map(theme=>editionDisplayName(theme));
}

export function selectSignatureExperience(experiences:JourneyExperience[]){
  return experiences.reduce<JourneyExperience|null>((best,item)=>{
    const score=(candidate:JourneyExperience)=>(candidate.featured?80:0)+(candidate.hero_image_url?36:0)+(candidate.full_description?16:0)+Math.min(candidate.gallery.length,5)*4+(candidate.destinationIds.length?8:0)+(candidate.themeIds.length?8:0)+(candidate.short_description?4:0);
    return !best||score(item)>score(best)?item:best;
  },null);
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
  return [...experienceEditionLabels(experience).slice(0,1),...(experience.destinationNames??[]).slice(0,2)].join(" · ")||experience.category||"Sri Lanka";
}
