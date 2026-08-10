import {NextResponse} from "next/server";
import {z} from "zod";
import {authenticatedStaff} from "@/lib/admin/authenticated-staff";
import {syncAllocationAccounting} from "@/lib/accounting/allocation-accounting";
import {resolveJourneyDesign} from "@/lib/journey/curated-journey-server";
import {completeJourneyLegs} from "@/lib/journey/travel-preferences";
import {completeCustomJourneyRate,usesCustomJourneyRate} from "@/lib/admin/allocation-rate";
import type {Database,Json} from "@/lib/database.types";

const allocationSchema=z.object({
  allocationType:z.enum(["accommodation","guide","vehicle","experience"]),
  destinationId:z.uuid().nullable(),
  fromDestinationId:z.uuid().nullable(),
  toDestinationId:z.uuid().nullable(),
  fromLocationKey:z.string().trim().min(1).max(120).nullable(),
  toLocationKey:z.string().trim().min(1).max(120).nullable(),
  accommodationId:z.uuid().nullable(),
  guideId:z.uuid().nullable(),
  vehicleId:z.uuid().nullable(),
  experienceId:z.uuid().nullable(),
  pricingPlanId:z.uuid().nullable(),
  serviceName:z.string().trim().max(180).nullable(),
  quantity:z.number().positive().max(1000000).nullable(),
  quantityLabel:z.string().trim().max(80).nullable(),
  serviceDetails:z.record(z.string(),z.union([z.string(),z.number(),z.boolean(),z.null()])),
  providerName:z.string().trim().max(160).nullable(),
  supplierContact:z.string().trim().max(500).nullable(),
  supplierCost:z.number().min(0).max(100000000).nullable(),
  sellingPrice:z.number().min(0).max(100000000).nullable(),
  currency:z.string().trim().length(3).transform(value=>value.toUpperCase()),
  confirmationStatus:z.enum(["pending","confirmed","cancelled"]),
  invoiceStatus:z.enum(["not_requested","requested","received","not_required"]),
  paymentStatus:z.enum(["pending","payment_due","cancelled"]),
  arrivalInstructions:z.string().trim().max(2000).nullable(),
  specialNotes:z.string().trim().max(2000).nullable()
});
const requestSchema=z.object({enquiryId:z.uuid(),allocations:z.array(allocationSchema).max(250)});
const ids=(value:Json)=>Array.isArray(value)?value.filter((item):item is string=>typeof item==="string"):[];
const key=(row:z.infer<typeof allocationSchema>)=>row.allocationType==="vehicle"
  ?`vehicle:${row.fromLocationKey}:${row.toLocationKey}`
  :row.allocationType==="experience"?`experience:${row.experienceId}`:row.allocationType==="guide"&&!row.destinationId?"guide:journey":`${row.allocationType}:${row.destinationId}`;

export async function GET(request:Request){
  const actor=await authenticatedStaff(request);
  if(!actor)return NextResponse.json({error:"Unauthorized."},{status:401});
  const allowed=actor.permissions.some(permission=>["suppliers.allocate","journey.proposal.view","operations.view","finance.costs.view","finance.revenue.view"].includes(permission));
  if(!allowed)return NextResponse.json({error:"You do not have permission to view journey allocations."},{status:403});
  const enquiryId=new URL(request.url).searchParams.get("enquiryId");
  if(!z.uuid().safeParse(enquiryId).success)return NextResponse.json({error:"Choose a valid journey."},{status:400});
  const {data,error}=await actor.database.from("journey_supplier_allocations").select("*").eq("enquiry_id",enquiryId!).order("created_at");
  if(error)return NextResponse.json({error:error.message},{status:500});
  const canSeeCosts=actor.permissions.includes("finance.costs.view")||actor.permissions.includes("suppliers.allocate");
  const canSeePayments=actor.permissions.includes("finance.payments.manage")||actor.permissions.includes("operations.view");
  const canSeeContacts=actor.permissions.includes("suppliers.allocate")||actor.permissions.includes("operations.view");
  const commercialCompleteIds=(data??[]).filter(row=>row.confirmation_status==="cancelled"||(row.supplier_cost!==null&&row.service_name&&row.quantity&&row.quantity_label)).map(row=>row.id);
  const allocations=(data??[]).map(row=>canSeeCosts&&canSeePayments&&canSeeContacts?row:{...row,
    supplier_cost:canSeeCosts?row.supplier_cost:null,
    pricing_plan_snapshot:canSeeCosts?row.pricing_plan_snapshot:{},
    supplier_contact:canSeeContacts?row.supplier_contact:null,
    invoice_status:canSeePayments?row.invoice_status:"not_requested" as const,
    payment_status:canSeePayments?row.payment_status:"pending" as const,
    arrival_instructions:canSeeContacts?row.arrival_instructions:null,
    special_notes:canSeeContacts?row.special_notes:null
  });
  return NextResponse.json({allocations,commercialCompleteIds});
}

export async function POST(request:Request){
  const actor=await authenticatedStaff(request,"suppliers.allocate");
  if(!actor)return NextResponse.json({error:"Unauthorized."},{status:401});
  const parsed=requestSchema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:parsed.error.issues[0]?.message??"Check the supplier allocations."},{status:400});
  const {database}=actor;const {enquiryId,allocations}=parsed.data;
  if(new Set(allocations.map(key)).size!==allocations.length)return NextResponse.json({error:"Each destination, route leg, and experience can have only one allocation."},{status:400});
  const {data:enquiry,error:enquiryError}=await database.from("enquiries").select("*").eq("id",enquiryId).maybeSingle();
  if(enquiryError||!enquiry)return NextResponse.json({error:"Traveller enquiry not found."},{status:404});
  const design=await resolveJourneyDesign(database,enquiry);const selectedDestinationIds=design.state?.selectedDestinationIds??ids(enquiry.selected_destinations);const destinationIds=new Set(selectedDestinationIds);const experienceIds=new Set(design.state?.selectedExperienceIds??ids(enquiry.selected_experiences));
  const expectedTransportLegs=completeJourneyLegs(selectedDestinationIds,Boolean(design.state?.pickup.type),Boolean(design.state?.dropoff.type));
  const expectedTransportKeys=new Set(expectedTransportLegs.map(leg=>`${leg.fromLocationKey}:${leg.toLocationKey}`));
  for(const row of allocations){
    if(row.allocationType==="vehicle"){
      const routeKey=`${row.fromLocationKey}:${row.toLocationKey}`;
      const expected=expectedTransportLegs.find(leg=>leg.fromLocationKey===row.fromLocationKey&&leg.toLocationKey===row.toLocationKey);
      if(!row.fromLocationKey||!row.toLocationKey||!expectedTransportKeys.has(routeKey)||!expected||row.fromDestinationId!==expected.fromDestinationId||row.toDestinationId!==expected.toDestinationId||!row.vehicleId)return NextResponse.json({error:"A transport allocation must belong to a valid pickup-to-drop-off journey leg and use an existing vehicle."},{status:400});
    }else if(row.allocationType==="experience"){
      if(!row.destinationId||!destinationIds.has(row.destinationId)||!row.experienceId||!experienceIds.has(row.experienceId)||!row.providerName)return NextResponse.json({error:"An experience allocation requires its selected destination, experience, and provider name."},{status:400});
    }else if(row.allocationType==="accommodation"){
      const selectedId=row.allocationType==="accommodation"?row.accommodationId:row.guideId;
      if(!row.destinationId||!destinationIds.has(row.destinationId)||!selectedId)return NextResponse.json({error:"An accommodation allocation requires a selected destination and supplier."},{status:400});
    }else if(!row.guideId||row.destinationId&&!destinationIds.has(row.destinationId)){
      return NextResponse.json({error:"A guide allocation requires an existing guide and, when destination-specific, a selected destination."},{status:400});
    }
  }
  const accommodationIds=allocations.flatMap(row=>row.accommodationId?[row.accommodationId]:[]);
  const guideIds=allocations.flatMap(row=>row.guideId?[row.guideId]:[]);
  const vehicleIds=allocations.flatMap(row=>row.vehicleId?[row.vehicleId]:[]);
  const resourceIds=[...accommodationIds,...guideIds,...vehicleIds,...[...experienceIds]];
  const [accommodations,guides,vehicles,experienceLinks,pricingPlans,existingResult,accountResult]=await Promise.all([
    accommodationIds.length?database.from("accommodations").select("id,destination_id").in("id",accommodationIds):Promise.resolve({data:[],error:null}),
    guideIds.length?database.from("guides").select("id").in("id",guideIds):Promise.resolve({data:[],error:null}),
    vehicleIds.length?database.from("vehicles").select("id").in("id",vehicleIds):Promise.resolve({data:[],error:null}),
    experienceIds.size?database.from("experience_destinations").select("experience_id,destination_id").in("experience_id",[...experienceIds]):Promise.resolve({data:[],error:null}),
    resourceIds.length?database.from("pricing_plans").select("*").in("entity_id",resourceIds).eq("active",true).order("sort_order"):Promise.resolve({data:[],error:null}),
    database.from("journey_supplier_allocations").select("*").eq("enquiry_id",enquiryId),
    database.from("journey_accounts").select("id,active,quote_snapshot").eq("enquiry_id",enquiryId).maybeSingle()
  ]);
  const firstError=[accommodations,guides,vehicles,experienceLinks,pricingPlans,existingResult,accountResult].find(result=>result.error)?.error;
  if(firstError)return NextResponse.json({error:firstError.message},{status:500});
  if((accommodations.data?.length??0)!==new Set(accommodationIds).size||(guides.data?.length??0)!==new Set(guideIds).size||(vehicles.data?.length??0)!==new Set(vehicleIds).size)return NextResponse.json({error:"One or more selected supplier records no longer exist."},{status:409});
  for(const row of allocations.filter(item=>item.allocationType==="accommodation")){
    const partner=accommodations.data?.find(item=>item.id===row.accommodationId);
    const override=row.serviceDetails.destinationOverrideConfirmed===true;
    if(partner?.destination_id!==row.destinationId&&!override)return NextResponse.json({error:"Confirm the destination override before assigning this accommodation partner."},{status:400});
  }
  for(const row of allocations.filter(item=>item.allocationType==="experience")){
    if(!experienceLinks.data?.some(item=>item.experience_id===row.experienceId&&item.destination_id===row.destinationId))return NextResponse.json({error:"The experience is not mapped to the allocated destination."},{status:400});
  }
  const entityFor=(row:z.infer<typeof allocationSchema>)=>row.allocationType==="accommodation"?row.accommodationId:row.allocationType==="guide"?row.guideId:row.allocationType==="vehicle"?row.vehicleId:row.experienceId;
  const plans=pricingPlans.data??[];
  for(const row of allocations){
    const entityId=entityFor(row);const available=plans.filter(plan=>plan.entity_type===row.allocationType&&plan.entity_id===entityId);
    const plan=row.pricingPlanId?available.find(item=>item.id===row.pricingPlanId):null;
    const customRate=usesCustomJourneyRate(row.serviceDetails);
    if(row.pricingPlanId&&!plan)return NextResponse.json({error:"The selected rate is inactive or does not belong to this supplier."},{status:400});
    if(available.length&&!plan&&!customRate)return NextResponse.json({error:`Choose a saved ${row.allocationType} rate or select Custom journey rate before saving this allocation.`},{status:400});
    if(plan&&!row.quantity)return NextResponse.json({error:`Enter the billable quantity for ${plan.name}.`},{status:400});
    if(!plan&&!completeCustomJourneyRate({serviceName:row.serviceName,quantity:row.quantity,quantityLabel:row.quantityLabel,supplierCost:row.supplierCost}))return NextResponse.json({error:`Enter a custom service name, quantity, billing unit and supplier cost for this ${row.allocationType} allocation.`},{status:400});
  }
  const existing=existingResult.data??[];
  const existingKey=(row:typeof existing[number])=>row.allocation_type==="vehicle"?`vehicle:${row.from_location_key??`destination:${row.from_destination_id}`}:${row.to_location_key??`destination:${row.to_destination_id}`}`:row.allocation_type==="experience"?`experience:${row.experience_id}`:row.allocation_type==="guide"&&!row.destination_id?"guide:journey":`${row.allocation_type}:${row.destination_id}`;
  const allocationAccount=accountResult.data?.active&&accountResult.data.quote_snapshot&&typeof accountResult.data.quote_snapshot==="object"&&!Array.isArray(accountResult.data.quote_snapshot)&&(accountResult.data.quote_snapshot as Record<string,Json|undefined>).source==="supplier_allocations";
  const activeInput=allocations.filter(row=>row.confirmationStatus!=="cancelled");
  if(allocationAccount&&(activeInput.some(row=>row.supplierCost===null)||new Set(activeInput.map(row=>row.currency)).size!==1))return NextResponse.json({error:"An active Accounting account requires complete supplier costs and one currency."},{status:409});
  const existingIds=existing.map(row=>row.id);
  const {data:financialActivity,error:financialError}=existingIds.length
    ?await database.from("journey_settlements").select("allocation_id,amount_paid,waived_amount").in("allocation_id",existingIds)
    :{data:[],error:null};
  if(financialError)return NextResponse.json({error:financialError.message},{status:500});
  const activityByAllocation=new Map((financialActivity??[]).map(row=>[row.allocation_id,(row.amount_paid??0)+(row.waived_amount??0)]));
  for(const row of allocations){
    const current=existing.find(item=>existingKey(item)===key(row));
    const resolved=current?activityByAllocation.get(current.id)??0:0;
    const plan=row.pricingPlanId?plans.find(item=>item.id===row.pricingPlanId):null;
    const supplierCost=plan?Number(plan.price)*(row.quantity??1):row.supplierCost??0;
    if(resolved>0&&supplierCost+0.005<resolved)return NextResponse.json({error:`${current?.provider_name||"A supplier"}: supplier cost cannot be lower than payments and waivers already recorded.`},{status:409});
  }
  for(const row of allocations){
    const current=existing.find(item=>existingKey(item)===key(row));
    const entityId=entityFor(row);const plan=row.pricingPlanId?plans.find(item=>item.id===row.pricingPlanId&&item.entity_id===entityId):null;
    const quantity=row.quantity??(plan?1:null);
    const supplierCost=plan?Number(plan.price)*(quantity??1):row.supplierCost;
    const paymentStatus:Database["public"]["Tables"]["journey_supplier_allocations"]["Row"]["payment_status"]=current?.payment_status==="paid"?"paid":row.paymentStatus;
    const accommodation=accommodations.data?.find(item=>item.id===row.accommodationId);
    const serviceDetails=row.allocationType==="accommodation"&&accommodation?.destination_id!==row.destinationId?{...row.serviceDetails,destinationOverrideConfirmed:true,catalogueDestinationId:accommodation?.destination_id??null}:row.serviceDetails;
    const stored={
      enquiry_id:enquiryId,curated_journey_id:design.curated?.id??current?.curated_journey_id??null,allocation_type:row.allocationType,destination_id:row.destinationId,
      from_destination_id:row.fromDestinationId,to_destination_id:row.toDestinationId,from_location_key:row.fromLocationKey,to_location_key:row.toLocationKey,
      accommodation_id:row.accommodationId,guide_id:row.guideId,vehicle_id:row.vehicleId,experience_id:row.experienceId,
      pricing_plan_id:plan?.id??null,
      pricing_plan_snapshot:plan?{id:plan.id,name:plan.name,description:plan.description,unitPrice:Number(plan.price),currency:plan.currency,chargingMethod:plan.charging_method,details:plan.details,notes:plan.notes}:{} as Json,
      service_name:plan?.name??row.serviceName??null,quantity,quantity_label:row.quantityLabel||null,service_details:serviceDetails as Json,
      provider_name:row.providerName||null,supplier_contact:row.supplierContact||null,
      supplier_cost:supplierCost,selling_price:row.sellingPrice,currency:plan?.currency??row.currency,
      confirmation_status:row.confirmationStatus,invoice_status:row.invoiceStatus,
      payment_status:paymentStatus,
      review_required:false,review_reason:null,reviewed_at:current?.review_required?new Date().toISOString():current?.reviewed_at??null,reviewed_by:current?.review_required?actor.user.id:current?.reviewed_by??null,
      arrival_instructions:row.arrivalInstructions||null,special_notes:row.specialNotes||null,updated_at:new Date().toISOString()
    };
    const result=current?await database.from("journey_supplier_allocations").update(stored).eq("id",current.id):await database.from("journey_supplier_allocations").insert(stored);
    if(result.error)return NextResponse.json({error:result.error.message},{status:500});
  }
  // Allocations outside the current curated scope remain as reviewable history.
  // Journey Studio flags them; staff must explicitly retire or reconfirm them.
  if(design.curated)await database.from("curated_journeys").update({status:"allocation_in_progress",updated_by:actor.user.id}).eq("id",design.curated.id);
  try{await syncAllocationAccounting(enquiryId,actor.user.id)}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Accounting could not be synchronized."},{status:409})}
  const {data:result,error:resultError}=await database.from("journey_supplier_allocations").select("*").eq("enquiry_id",enquiryId).order("created_at");
  if(resultError)return NextResponse.json({error:resultError.message},{status:500});
  return NextResponse.json({allocations:result});
}

const reviewSchema=z.object({allocationId:z.uuid(),action:z.literal("retire")});
export async function PATCH(request:Request){
  const actor=await authenticatedStaff(request,"suppliers.allocate");
  if(!actor)return NextResponse.json({error:"You do not have permission to review supplier allocations."},{status:403});
  const parsed=reviewSchema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Choose a valid allocation review action."},{status:400});
  const {data:allocation,error}=await actor.database.from("journey_supplier_allocations").select("*").eq("id",parsed.data.allocationId).maybeSingle();
  if(error||!allocation)return NextResponse.json({error:"Supplier allocation not found."},{status:404});
  if(!allocation.review_required)return NextResponse.json({error:"This allocation no longer requires review."},{status:409});
  const {data:settlements,error:settlementError}=await actor.database.from("journey_settlements").select("amount_paid,waived_amount").eq("allocation_id",allocation.id);
  if(settlementError)return NextResponse.json({error:settlementError.message},{status:500});
  if((settlements??[]).some(row=>Number(row.amount_paid)+Number(row.waived_amount)>0))return NextResponse.json({error:"This service has financial activity and cannot be retired here. Finance must reverse or resolve it first."},{status:409});
  const {data:updated,error:updateError}=await actor.database.from("journey_supplier_allocations").update({confirmation_status:"cancelled",payment_status:allocation.payment_status==="paid"?"paid":"cancelled",review_required:false,review_reason:`Retired after Journey Studio review. ${allocation.review_reason??""}`.trim(),reviewed_at:new Date().toISOString(),reviewed_by:actor.user.id}).eq("id",allocation.id).select("*").single();
  if(updateError)return NextResponse.json({error:updateError.message},{status:500});
  try{await syncAllocationAccounting(allocation.enquiry_id,actor.user.id)}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Accounting could not be synchronized."},{status:409})}
  return NextResponse.json({allocation:updated});
}
