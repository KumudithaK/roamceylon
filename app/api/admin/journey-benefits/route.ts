import {NextResponse} from "next/server";
import {z} from "zod";
import {authenticatedStaff} from "@/lib/admin/authenticated-staff";
import {benefitContext} from "@/lib/benefits/journey-benefit-service";
import {calculateVerifiedSavings,referenceComparison} from "@/lib/benefits/preferred-benefits";
import {customerSafeProposalDto} from "@/lib/proposals/customer-proposal-dto";
import type {Database,Json} from "@/lib/database.types";

type Allocation=Database["public"]["Tables"]["journey_supplier_allocations"]["Row"];
const resourceId=(row:Allocation)=>row.accommodation_id??row.vehicle_id??row.guide_id??row.experience_id;
const assignmentSchema=z.object({action:z.literal("assign"),enquiryId:z.uuid(),benefitId:z.uuid(),allocationId:z.uuid().nullable(),included:z.boolean(),quantity:z.number().positive().max(10000).default(1),scopeType:z.enum(["journey","traveller","stay","destination","experience","transport","guide","day"]),scopeId:z.uuid().nullable().default(null),journeyDay:z.number().int().positive().nullable().default(null)});
const fulfilmentSchema=z.object({action:z.literal("fulfilment"),journeyBenefitId:z.uuid(),status:z.enum(["not_required","pending","confirmed","prepared","delivered","unavailable"]),details:z.object({sizes:z.array(z.object({traveller:z.string().trim().min(2).max(120),size:z.enum(["Child XS","Child S","Child M","Child L","XS","S","M","L","XL","XXL"]),quantity:z.number().int().positive().max(10)})).max(50).optional(),note:z.string().trim().max(500).optional()})});

export async function GET(request:Request){
  const actor=await authenticatedStaff(request,"benefits.view");if(!actor)return NextResponse.json({error:"You do not have permission to view journey benefits."},{status:403});
  const enquiryId=new URL(request.url).searchParams.get("enquiryId");if(!z.uuid().safeParse(enquiryId).success)return NextResponse.json({error:"Choose a valid journey."},{status:400});
  try{const [context,acceptedResult]=await Promise.all([benefitContext(actor.database,enquiryId!),actor.database.from("journey_proposals").select("sent_snapshot,customer_snapshot").eq("enquiry_id",enquiryId!).eq("status","approved").order("version",{ascending:false}).limit(1).maybeSingle()]);if(acceptedResult.error)throw acceptedResult.error;const accepted=acceptedResult.data?customerSafeProposalDto(acceptedResult.data.sent_snapshot??acceptedResult.data.customer_snapshot):null;const canSeeReference=actor.permissions.includes("benefits.reference.view");return NextResponse.json({definitions:context.definitions.map(row=>canSeeReference?row:{...row,reference_rate_source:null,internal_notes:null}),assignments:context.assignments.map(row=>actor.permissions.includes("operations.view")?row:{...row,fulfilment_details:{},internal_notes:null}),allocations:context.allocations.map(row=>({id:row.id,type:row.allocation_type,resourceId:resourceId(row),destinationId:row.destination_id,providerName:row.provider_name||row.service_name||row.allocation_type,quantity:row.quantity})),resolved:context.resolved.map(item=>item.customer),acceptedBenefits:accepted?.benefits??[],travellers:context.travellers,permissions:actor.permissions.filter(value=>value.startsWith("benefits.")||value.startsWith("operations."))})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Journey benefits could not be loaded."},{status:500})}
}

export async function POST(request:Request){
  const body=await request.json().catch(()=>null),assignment=assignmentSchema.safeParse(body),fulfilment=fulfilmentSchema.safeParse(body);
  if(fulfilment.success){
    const actor=await authenticatedStaff(request,"operations.manage");if(!actor)return NextResponse.json({error:"You do not have permission to update benefit fulfilment."},{status:403});
    const {data,error}=await actor.database.from("journey_benefits").update({fulfilment_status:fulfilment.data.status,fulfilment_details:fulfilment.data.details as Json}).eq("id",fulfilment.data.journeyBenefitId).select("*").single();
    if(error)return NextResponse.json({error:error.message},{status:500});return NextResponse.json({assignment:data});
  }
  if(!assignment.success)return NextResponse.json({error:"Check the journey benefit selection."},{status:400});
  const actor=await authenticatedStaff(request,"benefits.assign");if(!actor)return NextResponse.json({error:"You do not have permission to assign benefits."},{status:403});
  const context=await benefitContext(actor.database,assignment.data.enquiryId);const definition=context.definitions.find(item=>item.id===assignment.data.benefitId);if(!definition)return NextResponse.json({error:"This benefit is inactive or not applicable to the allocated journey."},{status:409});
  const allocation=assignment.data.allocationId?context.allocations.find(item=>item.id===assignment.data.allocationId):null;if(assignment.data.allocationId&&!allocation)return NextResponse.json({error:"The selected supplier allocation does not belong to this journey."},{status:400});
  if(definition.entity_type==="destination"&&definition.entity_id&&!context.allocations.some(row=>row.destination_id===definition.entity_id))return NextResponse.json({error:"This destination benefit does not belong to the journey."},{status:400});
  if(definition.entity_id&&definition.entity_type!=="destination"&&(!allocation||definition.entity_type!==allocation.allocation_type||definition.entity_id!==resourceId(allocation)))return NextResponse.json({error:"This partner benefit does not belong to the selected supplier allocation."},{status:400});
  const {data:enquiry,error:enquiryError}=await actor.database.from("enquiries").select("travel_start_date,travel_end_date").eq("id",assignment.data.enquiryId).single();if(enquiryError)return NextResponse.json({error:enquiryError.message},{status:500});
  const comparison=referenceComparison(definition),applies=comparison.valid&&Boolean(enquiry.travel_start_date&&enquiry.travel_end_date&&definition.applicable_from&&definition.applicable_to&&enquiry.travel_start_date>=definition.applicable_from&&enquiry.travel_end_date<=definition.applicable_to);
  const values={included:assignment.data.included,allocation_id:assignment.data.allocationId,scope_type:assignment.data.scopeType,scope_id:assignment.data.scopeId,journey_day:assignment.data.journeyDay,customer_title:definition.name,customer_description:definition.customer_description,confidence_status:definition.confidence_status,quantity:assignment.data.quantity,reference_rate:applies?definition.reference_rate:null,customer_rate:definition.customer_rate,currency:definition.currency,rate_unit:definition.rate_unit,comparison_verified:applies,verified_savings:applies?calculateVerifiedSavings(definition,assignment.data.quantity):0,selected_by:actor.user.id};
  const existing=context.assignments.find(row=>!row.id.startsWith("default:")&&row.benefit_id===definition.id&&row.allocation_id===assignment.data.allocationId);const result=existing?await actor.database.from("journey_benefits").update(values).eq("id",existing.id).select("*").single():await actor.database.from("journey_benefits").insert({...values,enquiry_id:assignment.data.enquiryId,benefit_id:definition.id}).select("*").single();
  if(result.error)return NextResponse.json({error:result.error.message},{status:500});return NextResponse.json({assignment:result.data});
}
