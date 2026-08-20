import {NextResponse} from "next/server";
import {z} from "zod";
import type {SupabaseClient} from "@supabase/supabase-js";
import {authenticatedStaff} from "@/lib/admin/authenticated-staff";
import {allocationReviewReason,createCuratedItinerary,curatedItineraryToJson,curatedJourneyChanges,normaliseCuratedItinerary,validateCuratedJourney} from "@/lib/journey/curated-journey";
import {parseJourneyHandoff} from "@/lib/journey/quotation-handoff";
import {emptyJourneyEndpoint} from "@/lib/journey/journey-endpoints";
import type {JourneyState} from "@/features/journey/journey-store";
import type {Database,Json} from "@/lib/database.types";

type Enquiry=Database["public"]["Tables"]["enquiries"]["Row"];
type Curated=Database["public"]["Tables"]["curated_journeys"]["Row"];
const ids=(value:Json)=>Array.isArray(value)?value.filter((item):item is string=>typeof item==="string"):[];
const requestSchema=z.object({enquiryId:z.uuid(),action:z.enum(["initialise","save","ready_for_allocation"]),itinerary:z.unknown().optional(),internalNotes:z.string().max(10000).optional()}).strict();

const legacyState=(enquiry:Enquiry):JourneyState=>({
  currentStep:6,selectedThemeIds:ids(enquiry.selected_themes),selectedDestinationIds:ids(enquiry.selected_destinations),selectedExperienceIds:ids(enquiry.selected_experiences),destinationPreferences:{},journeyGuidePreference:"recommend",journeyGuideLanguages:[],journeyGuideNotes:"",pickup:emptyJourneyEndpoint(),dropoff:emptyJourneyEndpoint(),globalTravelPreference:"recommend",travelPreferencesByLeg:{},selectedStayIdsByDestination:{},selectedVehicleId:null,selectedGuideId:null,selectedPricingPlanIds:{},travelDates:{start:enquiry.travel_start_date??"",end:enquiry.travel_end_date??""},travellerCounts:{adults:Math.max(1,enquiry.adults),children:enquiry.children,infants:0},experienceParticipants:{},budgetPreference:"flexible",travelPace:"balanced",accessibilityRequirements:""
});
const briefState=(enquiry:Enquiry)=>parseJourneyHandoff(enquiry.trip_state)?.state??legacyState(enquiry);

async function load(database:SupabaseClient<Database>,enquiryId:string){
  const [enquiryResult,curatedResult,destinationsResult,experiencesResult,linksResult]=await Promise.all([
    database.from("enquiries").select("*").eq("id",enquiryId).maybeSingle(),
    database.from("curated_journeys").select("*").eq("enquiry_id",enquiryId).maybeSingle(),
    database.from("destinations").select("id,slug,name,province,region,latitude,longitude").eq("status","published").eq("active",true).order("name"),
    database.from("experiences").select("id,name,category").eq("status","published").eq("active",true).order("name"),
    database.from("experience_destinations").select("experience_id,destination_id")
  ]);
  const error=enquiryResult.error??curatedResult.error??destinationsResult.error??experiencesResult.error??linksResult.error;
  if(error)throw new Error(error.message);
  if(!enquiryResult.data)throw new Error("Traveller enquiry not found.");
  const changes=curatedResult.data?await database.from("curated_journey_changes").select("*").eq("curated_journey_id",curatedResult.data.id).order("changed_at",{ascending:false}).limit(100):{data:[],error:null};
  if(changes.error)throw new Error(changes.error.message);
  return {enquiry:enquiryResult.data,briefItinerary:curatedItineraryToJson(createCuratedItinerary(briefState(enquiryResult.data))),curated:curatedResult.data as Curated|null,destinations:destinationsResult.data??[],experiences:experiencesResult.data??[],experienceDestinations:linksResult.data??[],changes:changes.data??[]};
}

export async function GET(request:Request){
  const actor=await authenticatedStaff(request,["journey.design.view","traveller.pii.design.view"]);
  if(!actor.authorized)return NextResponse.json({error:actor.status===401?"Unauthorized.":"You do not have permission to view Journey Studio."},{status:actor.status});
  const enquiryId=new URL(request.url).searchParams.get("enquiryId");
  if(!enquiryId||!z.uuid().safeParse(enquiryId).success)return NextResponse.json({error:"A valid journey request is required."},{status:400});
  try{return NextResponse.json(await load(actor.database,enquiryId))}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Journey Studio could not be loaded."},{status:500})}
}

export async function POST(request:Request){
  const actor=await authenticatedStaff(request,["journey.design.edit","traveller.pii.design.view"]);
  if(!actor.authorized)return NextResponse.json({error:actor.status===401?"Unauthorized.":"You do not have permission to edit Journey Studio."},{status:actor.status});
  const parsed=requestSchema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:parsed.error.issues[0]?.message??"Check the curated journey."},{status:400});
  const {database,user}=actor;
  try{
    const context=await load(database,parsed.data.enquiryId),brief=briefState(context.enquiry);
    if(parsed.data.action==="initialise"){
      if(context.curated)return NextResponse.json({curated:context.curated,changes:context.changes,validation:validateCuratedJourney(normaliseCuratedItinerary(context.curated.itinerary,brief))});
      const itinerary=createCuratedItinerary(brief);
      const {data,error}=await database.from("curated_journeys").insert({enquiry_id:context.enquiry.id,status:"not_started",itinerary:curatedItineraryToJson(itinerary),source_brief_created_at:context.enquiry.created_at,created_by:user.id,updated_by:user.id}).select("*").single();
      if(error)throw error;
      await database.from("curated_journey_changes").insert({curated_journey_id:data.id,change_type:"initialised",subject_type:"journey",summary:"Curated Journey created from the immutable Traveller Brief",previous_value:null,new_value:curatedItineraryToJson(itinerary),changed_by:user.id});
      return NextResponse.json({curated:data,validation:validateCuratedJourney(itinerary)});
    }
    if(!context.curated)return NextResponse.json({error:"Create the Curated Journey before editing it."},{status:409});
    if(parsed.data.action==="ready_for_allocation"){
      const itinerary=normaliseCuratedItinerary(context.curated.itinerary,brief),validation=validateCuratedJourney(itinerary);
      if(validation.errors.length)return NextResponse.json({error:validation.errors.join(" "),validation},{status:400});
      const {error}=await database.rpc("execute_curated_journey_transition",{p_curated_journey_id:context.curated.id,p_action:"ready_for_allocation",p_actor_id:user.id});if(error)throw error;
      const refreshed=await database.from("curated_journeys").select("*").eq("id",context.curated.id).single();if(refreshed.error)throw refreshed.error;
      return NextResponse.json({curated:refreshed.data,validation});
    }
    const next=normaliseCuratedItinerary(parsed.data.itinerary,brief),previous=normaliseCuratedItinerary(context.curated.itinerary,brief),validation=validateCuratedJourney(next);
    const destinationIds=new Set((context.destinations??[]).map(item=>item.id)),experienceIds=new Set((context.experiences??[]).map(item=>item.id));
    if(next.selectedDestinationIds.some(id=>!destinationIds.has(id))||next.selectedExperienceIds.some(id=>!experienceIds.has(id)))return NextResponse.json({error:"The curated journey contains an unavailable destination or experience."},{status:400});
    const validExperienceLinks=new Set(context.experienceDestinations.map(link=>`${link.experience_id}:${link.destination_id}`));
    if(next.selectedExperienceIds.some(experienceId=>!next.selectedDestinationIds.some(destinationId=>validExperienceLinks.has(`${experienceId}:${destinationId}`))))return NextResponse.json({error:"Every curated experience must belong to a selected destination."},{status:400});
    const destinationNames=Object.fromEntries(context.destinations.map(item=>[item.id,item.name])),experienceNames=Object.fromEntries(context.experiences.map(item=>[item.id,item.name]));
    const changes=curatedJourneyChanges(previous,next,{destinations:destinationNames,experiences:experienceNames});
    const {data,error}=await database.from("curated_journeys").update({itinerary:curatedItineraryToJson(next),internal_notes:parsed.data.internalNotes??context.curated.internal_notes,updated_by:user.id}).eq("id",context.curated.id).select("*").single();if(error)throw error;
    if(context.curated.status==="not_started"){const transition=await database.rpc("execute_curated_journey_transition",{p_curated_journey_id:context.curated.id,p_action:"start_designing",p_actor_id:user.id});if(transition.error)throw transition.error;data.status="designing"}
    if(changes.length){const {error:changeError}=await database.from("curated_journey_changes").insert(changes.map(change=>({curated_journey_id:context.curated!.id,change_type:change.changeType,subject_type:change.subjectType,subject_id:change.subjectId,field_name:change.fieldName,previous_value:change.previousValue,new_value:change.newValue,summary:change.summary,changed_by:user.id})));if(changeError)throw changeError}
    const {data:allocations,error:allocationError}=await database.from("journey_supplier_allocations").select("*").eq("enquiry_id",context.enquiry.id);if(allocationError)throw allocationError;
    for(const allocation of allocations??[]){const reason=allocationReviewReason(allocation,previous,next);if(reason){const {error:reviewError}=await database.from("journey_supplier_allocations").update({review_required:true,review_reason:reason,reviewed_at:null,reviewed_by:null}).eq("id",allocation.id);if(reviewError)throw reviewError}}
    return NextResponse.json({curated:data,validation,changesRecorded:changes.length});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Journey Studio could not save the curated journey."},{status:500})}
}
