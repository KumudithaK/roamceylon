import {NextResponse} from "next/server";
import {z} from "zod";
import {authenticatedStaff} from "@/lib/admin/authenticated-staff";
import {referenceComparison} from "@/lib/benefits/preferred-benefits";
import type {Database} from "@/lib/database.types";

type Definition=Database["public"]["Tables"]["benefit_definitions"]["Row"];
const optionalText=z.string().trim().max(1000).nullable().optional();
const schema=z.object({
  id:z.uuid().optional(),code:z.string().trim().regex(/^[a-z0-9]+([_-][a-z0-9]+)*$/),name:z.string().trim().min(3).max(160),
  benefitType:z.enum(["roam_ceylon_complimentary","preferred_rate","partner_privilege","complimentary_upgrade","meal_benefit","arrival_departure_benefit","celebration_benefit","experience_benefit","roam_ceylon_service_benefit","other"]),
  confidenceStatus:z.enum(["guaranteed_by_roam_ceylon","confirmed_partner_benefit","subject_to_availability"]),defaultScope:z.enum(["journey","traveller","stay","destination","experience","transport","guide","day"]),
  customerDescription:z.string().trim().min(10).max(1000),entityType:z.enum(["accommodation","vehicle","guide","experience","destination"]).nullable(),entityId:z.uuid().nullable(),
  validFrom:z.iso.date().nullable(),validTo:z.iso.date().nullable(),defaultIncluded:z.boolean(),active:z.boolean(),customerRate:z.number().min(0).nullable(),referenceRate:z.number().min(0).nullable(),currency:z.string().trim().length(3).nullable(),rateUnit:optionalText,
  comparisonVerified:z.boolean(),referenceRateBasis:optionalText,referenceRateSource:optionalText,verificationDate:z.iso.date().nullable(),occupancyBasis:optionalText,roomCategory:optionalText,mealPlan:optionalText,applicableFrom:z.iso.date().nullable(),applicableTo:z.iso.date().nullable(),taxesFeesBasis:optionalText,cancellationTermsBasis:optionalText,internalNotes:optionalText
}).refine(value=>(value.entityType===null)===(value.entityId===null),{message:"Choose both the associated resource type and record, or leave both empty."});

const stored=(value:z.infer<typeof schema>,userId:string)=>({code:value.code,name:value.name,benefit_type:value.benefitType,confidence_status:value.confidenceStatus,default_scope:value.defaultScope,customer_description:value.customerDescription,entity_type:value.entityType,entity_id:value.entityId,valid_from:value.validFrom,valid_to:value.validTo,default_included:value.defaultIncluded,active:value.active,customer_rate:value.customerRate,reference_rate:value.referenceRate,currency:value.currency?.toUpperCase()??null,rate_unit:value.rateUnit,comparison_verified:value.comparisonVerified,reference_rate_basis:value.referenceRateBasis,reference_rate_source:value.referenceRateSource,verification_date:value.verificationDate,occupancy_basis:value.occupancyBasis,room_category:value.roomCategory,meal_plan:value.mealPlan,applicable_from:value.applicableFrom,applicable_to:value.applicableTo,taxes_fees_basis:value.taxesFeesBasis,cancellation_terms_basis:value.cancellationTermsBasis,internal_notes:value.internalNotes,updated_by:userId});
const redacted=(row:Definition,canSeeEvidence:boolean)=>canSeeEvidence?row:{...row,reference_rate_source:null,internal_notes:null};

export async function GET(request:Request){
  const actor=await authenticatedStaff(request,"benefits.view");if(!actor.authorized)return NextResponse.json({error:actor.status===401?"Unauthorized.":"You do not have permission to view benefits."},{status:actor.status});
  const {data,error}=await actor.database.from("benefit_definitions").select("*").order("created_at");if(error)return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json({benefits:(data??[]).map(row=>redacted(row,actor.permissions.includes("benefits.reference.view"))),permissions:actor.permissions.filter(value=>value.startsWith("benefits."))});
}

export async function POST(request:Request){
  const actor=await authenticatedStaff(request,"benefits.manage");if(!actor.authorized)return NextResponse.json({error:actor.status===401?"Unauthorized.":"You do not have permission to manage benefits."},{status:actor.status});
  const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:parsed.error.issues[0]?.message??"Check the benefit details."},{status:400});
  if(parsed.data.comparisonVerified&&!actor.permissions.includes("benefits.reference.manage"))return NextResponse.json({error:"You do not have permission to verify reference-rate claims."},{status:403});
  const row=stored(parsed.data,actor.user.id);const comparison=referenceComparison(row as Definition);if(parsed.data.comparisonVerified&&!comparison.valid)return NextResponse.json({error:"A verified comparison requires equivalent rate evidence, dates, occupancy, room, meal plan, taxes and cancellation terms."},{status:400});
  const result=parsed.data.id?await actor.database.from("benefit_definitions").update(row).eq("id",parsed.data.id).select("*").single():await actor.database.from("benefit_definitions").insert({...row,created_by:actor.user.id}).select("*").single();
  if(result.error)return NextResponse.json({error:result.error.message},{status:500});return NextResponse.json({benefit:redacted(result.data,actor.permissions.includes("benefits.reference.view"))},{status:parsed.data.id?200:201});
}
