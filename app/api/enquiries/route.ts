import {NextResponse} from "next/server";
import {z} from "zod";
import {createAdminClient} from "@/lib/supabase/admin";
import type {Json} from "@/lib/database.types";
import {PublicInputError,publicAttemptLimited,publicSubmissionDigest,readBoundedJson} from "@/lib/security/public-input";

export const runtime="nodejs";
const counts=z.object({adults:z.number().int().min(0).max(100),children:z.number().int().min(0).max(100),infants:z.number().int().min(0).max(100)}).strict();
const uuidArray=(maximum:number)=>z.array(z.uuid()).max(maximum);
const journey=z.object({
  handoff:z.record(z.string(),z.unknown()).refine(value=>JSON.stringify(value).length<=100_000,"Journey details are too large."),
  travelStartDate:z.iso.date().nullable(),travelEndDate:z.iso.date().nullable(),travellerCounts:counts,
  selectedThemeIds:uuidArray(20),selectedDestinationIds:uuidArray(40),selectedExperienceIds:uuidArray(100),
  experienceParticipants:z.record(z.uuid(),counts),selectedStayIds:uuidArray(40),selectedVehicleId:z.uuid().nullable(),selectedGuideId:z.uuid().nullable(),
  estimate:z.object({perPersonMin:z.number().min(0).max(100_000_000).nullable(),perPersonMax:z.number().min(0).max(100_000_000).nullable(),currency:z.string().length(3),basis:z.enum(["per_person","total"]),estimatedAt:z.iso.datetime(),snapshot:z.record(z.string(),z.unknown())}).strict().nullable()
}).strict().superRefine((value,context)=>{
  if(value.travelStartDate&&value.travelEndDate&&value.travelEndDate<value.travelStartDate)context.addIssue({code:"custom",message:"Departure must be after arrival."});
  if(value.travellerCounts.adults<1)context.addIssue({code:"custom",message:"At least one adult traveller is required."});
  if(value.estimate&&value.estimate.perPersonMin!==null&&value.estimate.perPersonMax!==null&&value.estimate.perPersonMax<value.estimate.perPersonMin)context.addIssue({code:"custom",message:"The estimate range is invalid."});
});
const schema=z.object({
  submissionKey:z.uuid(),honeypot:z.literal(""),source:z.enum(["contact","contact_quotation","journey_builder"]),
  name:z.string().trim().min(2).max(150),email:z.email().max(254),phone:z.string().trim().max(40).nullable(),nationality:z.string().trim().max(100).nullable(),notes:z.string().trim().min(10).max(5000),journey:journey.nullable()
}).strict();

export async function POST(request:Request){
  let raw:unknown;try{raw=await readBoundedJson(request,160_000)}catch(error){return NextResponse.json({error:error instanceof PublicInputError&&error.code==="PAYLOAD_TOO_LARGE"?"The enquiry is too large.":"Invalid enquiry."},{status:error instanceof PublicInputError&&error.code==="PAYLOAD_TOO_LARGE"?413:400})}
  const parsed=schema.safeParse(raw);if(!parsed.success)return NextResponse.json({error:"Please check the enquiry details."},{status:400});
  const database=createAdminClient();if(!database)return NextResponse.json({error:"Enquiries are temporarily unavailable."},{status:503});
  const value=parsed.data,digest=publicSubmissionDigest(value);
  const existing=await database.from("enquiries").select("journey_reference,public_submission_hash").eq("public_submission_key",value.submissionKey).maybeSingle();
  if(existing.error)return NextResponse.json({error:"We could not submit your enquiry."},{status:500});
  if(existing.data)return existing.data.public_submission_hash===digest
    ?NextResponse.json({reference:existing.data.journey_reference,replayed:true})
    :NextResponse.json({error:"This submission could not be verified. Please refresh and try again."},{status:409});
  if(publicAttemptLimited("enquiry",value.email,5,60*60*1000))return NextResponse.json({error:"We have already received several requests for this email address. Please try again later."},{status:429});
  const selected=value.journey,estimate=selected?.estimate;
  const row={
    public_submission_key:value.submissionKey,public_submission_hash:digest,name:value.name,email:value.email.toLowerCase(),phone:value.phone||null,nationality:value.nationality||null,
    summary:value.source==="journey_builder"?"Personalised journey requested.":value.source==="contact_quotation"?`Final quotation requested. ${value.notes}`:value.notes,
    traveller_notes:value.notes,status:"new" as const,trip_state:(selected?.handoff??{}) as Json,travel_start_date:selected?.travelStartDate??null,travel_end_date:selected?.travelEndDate??null,
    adults:selected?.travellerCounts.adults??1,children:selected?.travellerCounts.children??0,experience_participants:(selected?.experienceParticipants??{}) as Json,
    selected_themes:(selected?.selectedThemeIds??[]) as Json,selected_destinations:(selected?.selectedDestinationIds??[]) as Json,selected_experiences:(selected?.selectedExperienceIds??[]) as Json,
    selected_stays:(selected?.selectedStayIds??[]) as Json,selected_vehicle:selected?.selectedVehicleId??null,selected_guide:selected?.selectedGuideId??null,
    estimated_price_min:estimate?.perPersonMin??null,estimated_price_max:estimate?.perPersonMax??null,estimated_price_currency:estimate?.currency??null,estimated_price_basis:estimate?.basis??null,
    estimated_at:estimate?.estimatedAt??null,estimate_snapshot:(estimate?.snapshot??{}) as Json
  };
  const result=await database.from("enquiries").insert(row).select("journey_reference").single();
  if(result.error)return result.error.code==="23505"?NextResponse.json({error:"This request has already been received."},{status:409}):NextResponse.json({error:"We could not submit your enquiry."},{status:500});
  return NextResponse.json({reference:result.data.journey_reference,replayed:false},{status:201});
}
