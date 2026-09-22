import {editionDisplayName} from "./brand.ts";
import type {JourneyExperience} from "./types.ts";

export type ExperienceFilters={query:string;edition:string;destination:string};

/**
 * Published records that remain available by their stable direct URL but must
 * not appear in normal discovery, merchandising or Journey Builder selection.
 * CR4 keeps this presentation-layer hold non-destructive while the founder
 * reviews operational, ethical or overlap concerns.
 */
export const publicExperienceExcludedSlugs=[
  "cricket-with-local-players",
  "nuwaraeliya-boating-pony-riding-and-lakeside-walking-at-gregory-lake",
  "balapitiya-jet-skiing-and-speed-boating-along-madu-ganga-estuary",
  "yala-spotting-sloth-bears-wild-elephants-mugger-crocodiles-and-spotted-deer",
  "wilpattu-tracking-elusive-sri-lankan-leopards-sloth-bears-and-wild-boars-in-dense",
  "nilaveli-snorkeling-among-blacktip-reef-sharks-sea-turtles-and-colorful-corals",
  "hikkaduwa-visiting-local-sea-turtle-hatcheries-and-conservation-centers"
] as const;

const publicExperienceTitleReplacements={
  "udawalawe-guaranteed-year-round-wild-elephant-sightings-across-open-grasslands":{
    from:"Guaranteed year-round wild elephant sightings across open grasslands",
    to:"Udawalawe Wild Elephant Safari",
    summary:"Explore Udawalawe's open grasslands with a responsibly arranged safari, where free-ranging elephant and other wildlife sightings remain entirely dependent on nature."
  },
  "nilaveli-boat-trips-to-pigeon-island-national-park-for-world-class-snorkeling":{
    from:"Boat trips to Pigeon Island National Park for world-class snorkeling",
    to:"Pigeon Island National Park Snorkelling Journey"
  },
  "yala-morning-and-evening-4x4-jeep-safaris-in-block-1-world-renowned-leopard-d":{
    from:"Morning and evening 4x4 jeep safaris in Block 1 (world-renowned leopard density)",
    to:"Yala Block 1 Wildlife Safari"
  },
  "sigiriya-hiking-pidurangala-rock-for-breathtaking-dawn-vistas-over-sigiriya-citad":{
    from:"Hiking Pidurangala Rock for breathtaking dawn vistas over Sigiriya Citadel",
    to:"Pidurangala Rock Dawn Hike"
  }
} as const;

type PublicExperienceCopy={
  slug:string;
  name:string;
  short_description:string|null;
  full_description:string|null;
  image_alt:string|null;
  highlights:unknown;
};

function replaceCopy(value:string|null,from:string,to:string){
  return value?.replaceAll(from,to).replaceAll(from.toLocaleLowerCase(),to)??value;
}

/**
 * Applies a deliberately small public-display correction without rewriting the
 * staging catalogue or changing compatibility slugs. Admin and historical data
 * retain the source record; all public repository consumers receive the safer
 * traveller-facing copy.
 */
export function applyPublicExperienceCopy<T extends PublicExperienceCopy>(experience:T):T{
  const replacement=publicExperienceTitleReplacements[experience.slug as keyof typeof publicExperienceTitleReplacements];
  if(!replacement)return experience;
  const highlights=Array.isArray(experience.highlights)?experience.highlights.map(item=>typeof item==="string"?replaceCopy(item,replacement.from,replacement.to):item):experience.highlights;
  return {...experience,name:replacement.to,short_description:"summary" in replacement?replacement.summary:replaceCopy(experience.short_description,replacement.from,replacement.to),full_description:replaceCopy(experience.full_description,replacement.from,replacement.to),image_alt:replaceCopy(experience.image_alt,replacement.from,replacement.to),highlights} as T;
}

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
