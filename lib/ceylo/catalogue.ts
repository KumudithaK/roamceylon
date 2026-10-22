import {applyPublicExperienceCopy,isPubliclyDiscoverableExperience} from "../experience-discovery.ts";

export type CeyloPlace={id:string;slug:string;name:string;summary:string;region:string;season:string};
export type CeyloExperience={id:string;slug:string;name:string;summary:string;category:string;season:string;familyFriendly:boolean;childSuitable:boolean;destinationIds:string[]};
export type CeyloCatalogue={destinations:CeyloPlace[];experiences:CeyloExperience[]};
type Row=Record<string,unknown>;
const uuid=/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;
const slug=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const clean=(value:unknown,max=260)=>typeof value==="string"?value.replace(/<[^>]*>/g,"").replace(/[\u0000-\u001f]/g," ").replace(/\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/gi,"").replace(/\+?\d[\d ()-]{7,}\d/g,"").replace(/\s+/g," ").trim().slice(0,max):"";
const valid=(r:Row)=>r.status==="published"&&r.active===true&&typeof r.id==="string"&&uuid.test(r.id)&&typeof r.slug==="string"&&slug.test(r.slug)&&typeof r.name==="string"&&Boolean(r.name.trim());

/** Explicit public DTO: never spread repository rows into client assistant context. */
export function createCeyloCatalogue(destinations:Row[],experiences:Row[],links:Row[]):CeyloCatalogue{
  const places=destinations.filter(r=>valid(r)&&r.coming_soon!==true).slice(0,100).map(r=>({id:r.id as string,slug:r.slug as string,name:clean(r.name,160),summary:clean(r.short_description),region:clean(r.region||r.province,80),season:clean(r.best_time_to_visit,160)}));
  const allowedPlaces=new Set(places.map(p=>p.id));
  const moments=experiences.filter(r=>valid(r)&&isPubliclyDiscoverableExperience({slug:r.slug as string})).slice(0,300).flatMap(r=>{
    const destinationIds=[...new Set(links.filter(l=>l.experience_id===r.id&&typeof l.destination_id==="string"&&allowedPlaces.has(l.destination_id)).map(l=>l.destination_id as string))];
    if(!destinationIds.length)return [];
    const copy=applyPublicExperienceCopy({slug:r.slug as string,name:r.name as string,short_description:typeof r.short_description==="string"?r.short_description:null,full_description:null,image_alt:null,highlights:[]});
    return [{id:r.id as string,slug:r.slug as string,name:clean(copy.name,180),summary:clean(copy.short_description),category:clean(r.category,80),season:clean(r.best_season,160),familyFriendly:r.family_friendly===true,childSuitable:r.suitable_for_children===true,destinationIds}];
  });
  return {destinations:places,experiences:moments};
}

export const emptyCeyloCatalogue=():CeyloCatalogue=>({destinations:[],experiences:[]});
export const ceyloSuggestions=["Best beaches in December?","Where can I see elephants?","What should I do in Ella?","Plan a romantic honeymoon","Family-friendly destinations"] as const;
