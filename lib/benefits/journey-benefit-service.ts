import "server-only";
import type {SupabaseClient} from "@supabase/supabase-js";
import type {Database} from "@/lib/database.types";
import {parseJourneyHandoff} from "@/lib/journey/quotation-handoff";
import {calculateVerifiedSavings,customerBenefit,referenceComparison,type BenefitDefinition,type CustomerBenefit,type JourneyBenefit} from "./preferred-benefits";

type Allocation=Database["public"]["Tables"]["journey_supplier_allocations"]["Row"];
const resourceId=(row:Allocation)=>row.accommodation_id??row.vehicle_id??row.guide_id??row.experience_id;
const allocationLabel=(row:Allocation)=>row.provider_name||row.service_name||row.allocation_type.replaceAll("_"," ");
const definitionApplies=(definition:BenefitDefinition,allocations:Allocation[])=>!definition.entity_type||allocations.some(row=>(definition.entity_type==="destination"?row.destination_id===definition.entity_id:row.allocation_type===definition.entity_type&&resourceId(row)===definition.entity_id)&&row.confirmation_status!=="cancelled");
const validNow=(definition:BenefitDefinition)=>{const today=new Date().toISOString().slice(0,10);return (!definition.valid_from||definition.valid_from<=today)&&(!definition.valid_to||definition.valid_to>=today)};
const comparisonApplies=(definition:BenefitDefinition,start:string|null,end:string|null)=>{const base=referenceComparison(definition);return base.valid&&Boolean(start&&end&&definition.applicable_from&&definition.applicable_to&&start>=definition.applicable_from&&end<=definition.applicable_to)};

export async function benefitContext(database:SupabaseClient<Database>,enquiryId:string,{persistDefaults=false,actorId=null}:{persistDefaults?:boolean;actorId?:string|null}={}){
  const [definitionResult,assignmentResult,allocationResult,enquiryResult]=await Promise.all([
    database.from("benefit_definitions").select("*").eq("active",true).order("created_at"),
    database.from("journey_benefits").select("*").eq("enquiry_id",enquiryId).order("selected_at"),
    database.from("journey_supplier_allocations").select("*").eq("enquiry_id",enquiryId),
    database.from("enquiries").select("adults,children,trip_state,travel_start_date,travel_end_date").eq("id",enquiryId).maybeSingle()
  ]);
  const error=definitionResult.error??assignmentResult.error??allocationResult.error??enquiryResult.error;if(error)throw error;
  const allocations=(allocationResult.data??[]).filter(row=>row.confirmation_status!=="cancelled") as Allocation[];
  const assignments=(assignmentResult.data??[]) as JourneyBenefit[];
  const definitions=(definitionResult.data??[]).filter(item=>(item.active&&validNow(item)&&definitionApplies(item,allocations))||assignments.some(row=>row.benefit_id===item.id&&row.included)) as BenefitDefinition[];
  const handoff=enquiryResult.data?parseJourneyHandoff(enquiryResult.data.trip_state):null;
  const travellers=Math.max(1,handoff?handoff.state.travellerCounts.adults+handoff.state.travellerCounts.children+handoff.state.travellerCounts.infants:Number(enquiryResult.data?.adults??0)+Number(enquiryResult.data?.children??0));
  if(persistDefaults){
    for(const definition of definitions.filter(item=>item.default_included&&!assignments.some(row=>row.benefit_id===item.id&&row.allocation_id===null))){
      const quantity=definition.default_scope==="traveller"?travellers:1;
      const verified=comparisonApplies(definition,enquiryResult.data?.travel_start_date??null,enquiryResult.data?.travel_end_date??null);
      const {data,error:insertError}=await database.from("journey_benefits").insert({
        enquiry_id:enquiryId,benefit_id:definition.id,allocation_id:null,included:true,scope_type:definition.default_scope,
        customer_title:definition.name,customer_description:definition.customer_description,confidence_status:definition.confidence_status,quantity,
        reference_rate:verified?definition.reference_rate:null,customer_rate:definition.customer_rate,currency:definition.currency,rate_unit:definition.rate_unit,
        comparison_verified:verified,verified_savings:verified?calculateVerifiedSavings(definition,quantity):0,
        fulfilment_status:"pending",fulfilment_details:{travellers:quantity,sizes:[]},selected_by:actorId
      }).select("*").single();
      if(insertError&&insertError.code!=="23505")throw insertError;if(data)assignments.push(data as JourneyBenefit);
    }
  }
  const virtualDefaults=definitions.filter(item=>item.default_included&&!assignments.some(row=>row.benefit_id===item.id)).map(definition=>{
    const quantity=definition.default_scope==="traveller"?travellers:1;const verified=comparisonApplies(definition,enquiryResult.data?.travel_start_date??null,enquiryResult.data?.travel_end_date??null);
    return {id:`default:${definition.id}`,enquiry_id:enquiryId,benefit_id:definition.id,allocation_id:null,included:true,scope_type:definition.default_scope,scope_id:null,journey_day:null,customer_title:definition.name,customer_description:definition.customer_description,confidence_status:definition.confidence_status,quantity,reference_rate:verified?definition.reference_rate:null,customer_rate:definition.customer_rate,currency:definition.currency,rate_unit:definition.rate_unit,comparison_verified:verified,verified_savings:verified?calculateVerifiedSavings(definition,quantity):0,fulfilment_status:"pending",fulfilment_details:{travellers:quantity,sizes:[]},internal_notes:null,selected_at:new Date().toISOString(),selected_by:null,updated_at:new Date().toISOString()} as JourneyBenefit;
  });
  const allAssignments=[...assignments,...virtualDefaults];
  const resolved=allAssignments.filter(row=>row.included).flatMap(row=>{const definition=definitions.find(item=>item.id===row.benefit_id);if(!definition)return[];const allocation=row.allocation_id?allocations.find(item=>item.id===row.allocation_id):null;return [{definition,assignment:row,customer:customerBenefit(definition,row,allocation?allocationLabel(allocation):undefined)}]});
  return {definitions,assignments:allAssignments,allocations,travellers,resolved};
}

export async function customerBenefitsForProposal(database:SupabaseClient<Database>,enquiryId:string,actorId:string|null):Promise<CustomerBenefit[]>{
  const context=await benefitContext(database,enquiryId,{persistDefaults:true,actorId});
  return context.resolved.map(item=>item.customer);
}
