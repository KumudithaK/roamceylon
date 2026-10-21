import "server-only";
import {createPublicClient} from "../supabase/server";
import {createCeyloCatalogue,emptyCeyloCatalogue} from "./catalogue";

/** Publishable client only. No admin client, private tables, rates or RPCs. */
export async function loadCeyloCatalogue(){
  const client=createPublicClient();
  if(!client)return emptyCeyloCatalogue();
  try{
    const [destinations,experiences]=await Promise.all([
      client.from("destinations").select("id,slug,name,status,active,coming_soon,region,province,short_description,best_time_to_visit").eq("status","published").eq("active",true).order("name").limit(100),
      client.from("experiences").select("id,slug,name,status,active,short_description,category,best_season,family_friendly,suitable_for_children").eq("status","published").eq("active",true).order("name").limit(300)
    ]);
    if(destinations.error||experiences.error)throw new Error("Catalogue unavailable");
    const ids=(experiences.data??[]).map(r=>r.id);
    if(!ids.length)return createCeyloCatalogue(destinations.data??[],[],[]);
    const links=await client.from("experience_destinations").select("experience_id,destination_id").in("experience_id",ids).limit(1000);
    if(links.error)throw new Error("Catalogue unavailable");
    return createCeyloCatalogue(destinations.data??[],experiences.data??[],links.data??[]);
  }catch{
    console.warn("[ceylo:catalogue] Published travel content is unavailable.");
    return emptyCeyloCatalogue();
  }
}
