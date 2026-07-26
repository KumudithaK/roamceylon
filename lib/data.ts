import "server-only";
import {createPublicClient} from "@/lib/supabase/server";
import themesJson from "@/data/themes.json";
import destinationsJson from "@/data/destinations.json";
import experiencesJson from "@/data/experiences.json";
import staysJson from "@/data/accommodations.json";
import vehiclesJson from "@/data/vehicles.json";
import guidesJson from "@/data/guides.json";
import type {ContentKind,Destination,Experience,Guide,Stay,Theme,Vehicle} from "@/lib/types";

const fallback={
  themes:themesJson.map((x)=>({id:x.id,slug:x.id,name:x.name,short_description:x.description,hero_image_url:x.heroImage,image_alt:x.name,icon:x.icon})),
  destinations:destinationsJson.map((x)=>({id:x.id,slug:x.id,name:x.name,province:x.province,region:null,short_description:x.shortDescription,full_description:null,hero_image_url:x.heroImage,image_alt:x.name,gallery:[],latitude:x.coordinates.lat,longitude:x.coordinates.lon,coming_soon:x.comingSoon})),
  experiences:experiencesJson.map((x)=>({id:x.id,slug:x.id,name:x.name,category:x.category,short_description:x.shortDescription,full_description:null,hero_image_url:x.heroImage,image_alt:x.name,gallery:x.gallery,duration:x.duration,difficulty:x.difficulty,family_friendly:false,priority:x.priority?.toLowerCase().replaceAll(" ","-")||null,featured:x.featured})),
  accommodations:staysJson.map((x)=>({id:x.id,slug:x.id,name:x.name,property_type:x.type,short_description:x.description,hero_image_url:x.heroImage,image_alt:x.name,price_range:x.priceRange,amenities:x.amenities,featured:x.featured})),
  vehicles:vehiclesJson.map((x)=>({id:x.id,slug:x.id,listing_title:x.name,vehicle_type:x.type,short_description:x.description,hero_image_url:x.heroImage,image_alt:x.name,passenger_capacity:Number(x.capacity.match(/\d+/)?.[0]||0),driver_included:x.driverIncluded,featured:x.featured})),
  guides:guidesJson.map((x)=>({id:x.id,slug:x.id,name:x.name,short_bio:x.description,profile_image_url:x.heroImage,image_alt:x.name,languages:x.languages,years_experience:x.experience,specialities:x.specialities,featured:x.featured}))
};

export async function listContent(kind:"themes"):Promise<Theme[]>;
export async function listContent(kind:"destinations"):Promise<Destination[]>;
export async function listContent(kind:"experiences"):Promise<Experience[]>;
export async function listContent(kind:"accommodations"):Promise<Stay[]>;
export async function listContent(kind:"vehicles"):Promise<Vehicle[]>;
export async function listContent(kind:"guides"):Promise<Guide[]>;
export async function listContent(kind:ContentKind){
  const supabase=createPublicClient();
  if(supabase){
    const order=kind==="vehicles"?"listing_title":"name";
    const {data,error}=await supabase.from(kind).select("*").eq("status","published").eq("active",true).order(order);
    if(!error&&data?.length)return data;
  }
  return fallback[kind];
}

export async function getBySlug(kind:ContentKind,slug:string){
  const records=await listContent(kind as never) as unknown as Array<{slug:string}>;
  return records.find(item=>item.slug===slug)||null;
}

export async function getJourneyData(){
  const supabase=createPublicClient();
  if(supabase){
    const [{data:themes},{data:destinations},{data:experiences}]=await Promise.all([
      supabase.from("themes").select("*,theme_destinations(destination:destinations(slug))").eq("status","published").eq("active",true).order("display_order"),
      supabase.from("destinations").select("*,theme_destinations(theme:themes(slug))").eq("status","published").eq("active",true).order("display_order"),
      supabase.from("experiences").select("*,experience_destinations(destination:destinations(slug)),experience_themes(theme:themes(slug))").eq("status","published").eq("active",true).order("display_order")
    ]);
    if(themes?.length&&destinations?.length&&experiences?.length)return {
      themes:themes.map(x=>({...x,destinationIds:(x.theme_destinations||[]).map((r:{destination:{slug:string}|null})=>r.destination?.slug).filter(Boolean)})),
      destinations:destinations.map(x=>({...x,themeIds:(x.theme_destinations||[]).map((r:{theme:{slug:string}|null})=>r.theme?.slug).filter(Boolean)})),
      experiences:experiences.map(x=>({...x,destinationIds:(x.experience_destinations||[]).map((r:{destination:{slug:string}|null})=>r.destination?.slug).filter(Boolean),themeIds:(x.experience_themes||[]).map((r:{theme:{slug:string}|null})=>r.theme?.slug).filter(Boolean)}))
    };
  }
  return {
    themes:fallback.themes.map((x,i)=>({...x,destinationIds:themesJson[i].destinations})),
    destinations:fallback.destinations.map((x,i)=>({...x,themeIds:destinationsJson[i].themeIds})),
    experiences:fallback.experiences.map((x,i)=>({...x,destinationIds:experiencesJson[i].destinationIds,themeIds:experiencesJson[i].themeIds}))
  };
}
