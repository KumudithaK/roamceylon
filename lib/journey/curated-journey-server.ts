import "server-only";
import type {SupabaseClient} from "@supabase/supabase-js";
import {normaliseCuratedItinerary,curatedItineraryToJourneyState} from "./curated-journey";
import {parseJourneyHandoff} from "./quotation-handoff";
import type {Database} from "@/lib/database.types";

export async function resolveJourneyDesign(database:SupabaseClient<Database>,enquiry:Database["public"]["Tables"]["enquiries"]["Row"]){
  const brief=parseJourneyHandoff(enquiry.trip_state);
  const {data:curated,error}=await database.from("curated_journeys").select("*").eq("enquiry_id",enquiry.id).maybeSingle();
  if(error)throw error;
  if(!brief)return {brief:null,curated,state:null};
  const itinerary=curated?normaliseCuratedItinerary(curated.itinerary,brief.state):null;
  return {brief,curated,itinerary,state:itinerary?curatedItineraryToJourneyState(itinerary,brief.state):brief.state};
}
