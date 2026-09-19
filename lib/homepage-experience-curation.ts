import {publiclyDiscoverableExperiences} from "./experience-discovery.ts";
import type {JourneyExperience} from "./types.ts";

export const homepageExperienceSlugs=[
  "yala-morning-and-evening-4x4-jeep-safaris-in-block-1-world-renowned-leopard-d",
  "sigiriya-climbing-the-5th-century-sigiriya-rock-fortress-lion-rock",
  "ella-photography-at-the-world-famous-nine-arches-railway-bridge",
] as const;

export function curateHomepageExperiences(experiences:JourneyExperience[]){
  const discoverable=publiclyDiscoverableExperiences(experiences);
  const bySlug=new Map(discoverable.map(experience=>[experience.slug,experience]));
  const selected=homepageExperienceSlugs.flatMap(slug=>{
    const experience=bySlug.get(slug);
    return experience?[experience]:[];
  });
  if(selected.length===homepageExperienceSlugs.length)return selected;
  const selectedIds=new Set(selected.map(experience=>experience.id));
  return [...selected,...discoverable.filter(experience=>!selectedIds.has(experience.id))].slice(0,homepageExperienceSlugs.length);
}
