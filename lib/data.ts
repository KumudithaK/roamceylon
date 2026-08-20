import "server-only";
import {createPublicClient} from "@/lib/supabase/server";
import type {ContentKind,Destination,Experience,Guide,Stay,Theme,Vehicle} from "@/lib/types";

type Content=Theme|Destination|Experience|Stay|Vehicle|Guide;

export async function listContent(kind:"themes"):Promise<Theme[]>;
export async function listContent(kind:"destinations"):Promise<Destination[]>;
export async function listContent(kind:"experiences"):Promise<Experience[]>;
export async function listContent(kind:"accommodations"):Promise<Stay[]>;
export async function listContent(kind:"vehicles"):Promise<Vehicle[]>;
export async function listContent(kind:"guides"):Promise<Guide[]>;
export async function listContent(kind:ContentKind):Promise<Content[]>{
  const supabase=createPublicClient();
  if(!supabase){
    console.error(`[content:${kind}] Supabase is not configured.`);
    return [];
  }
  const order=kind==="vehicles"?"listing_title":"name";
  const response=kind==="accommodations"
    ?await supabase.from("public_accommodations").select("*").order(order)
    :kind==="vehicles"
      ?await supabase.from("public_vehicles").select("*").order(order)
      :kind==="guides"
        ?await supabase.from("public_guides").select("*").order(order)
        :await supabase.from(kind).select("*").eq("status","published").eq("active",true).order(order);
  const {data,error}=response;
  if(error){
    console.error(`[content:${kind}] ${error.code}: ${error.message}`);
    return [];
  }
  return (data??[]).map(row=>kind==="guides"?{...row,licence_number:null,daily_rate_usd:null}:kind==="vehicles"?{...row,daily_rate_usd:null}:kind==="accommodations"?{...row,nightly_rate_usd:null,pricing_tier:null}:row) as unknown as Content[];
}

export async function getBySlug(kind:ContentKind,slug:string){
  const records=await listContent(kind as never) as unknown as Array<Content&{slug:string}>;
  return records.find(item=>item.slug===slug)||null;
}
