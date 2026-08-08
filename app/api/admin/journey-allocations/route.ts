import {NextResponse} from "next/server";
import {z} from "zod";
import {authenticatedStaff} from "@/lib/admin/authenticated-staff";
import {syncAllocationAccounting} from "@/lib/accounting/allocation-accounting";
import type {Database,Json} from "@/lib/database.types";

const allocationSchema=z.object({
  allocationType:z.enum(["accommodation","guide","vehicle","experience"]),
  destinationId:z.uuid().nullable(),
  fromDestinationId:z.uuid().nullable(),
  toDestinationId:z.uuid().nullable(),
  accommodationId:z.uuid().nullable(),
  guideId:z.uuid().nullable(),
  vehicleId:z.uuid().nullable(),
  experienceId:z.uuid().nullable(),
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
  ?`vehicle:${row.fromDestinationId}:${row.toDestinationId}`
  :row.allocationType==="experience"?`experience:${row.experienceId}`:`${row.allocationType}:${row.destinationId}`;

export async function POST(request:Request){
  const actor=await authenticatedStaff(request);
  if(!actor)return NextResponse.json({error:"Unauthorized."},{status:401});
  const parsed=requestSchema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:parsed.error.issues[0]?.message??"Check the supplier allocations."},{status:400});
  const {database}=actor;const {enquiryId,allocations}=parsed.data;
  if(new Set(allocations.map(key)).size!==allocations.length)return NextResponse.json({error:"Each destination, route leg, and experience can have only one allocation."},{status:400});
  const {data:enquiry,error:enquiryError}=await database.from("enquiries").select("selected_destinations,selected_experiences").eq("id",enquiryId).maybeSingle();
  if(enquiryError||!enquiry)return NextResponse.json({error:"Traveller enquiry not found."},{status:404});
  const destinationIds=new Set(ids(enquiry.selected_destinations));const experienceIds=new Set(ids(enquiry.selected_experiences));
  for(const row of allocations){
    if(row.allocationType==="vehicle"){
      if(!row.fromDestinationId||!row.toDestinationId||!destinationIds.has(row.fromDestinationId)||!destinationIds.has(row.toDestinationId)||!row.vehicleId)return NextResponse.json({error:"A transport allocation must use two selected destinations and an existing vehicle."},{status:400});
    }else if(row.allocationType==="experience"){
      if(!row.destinationId||!destinationIds.has(row.destinationId)||!row.experienceId||!experienceIds.has(row.experienceId)||!row.providerName)return NextResponse.json({error:"An experience allocation requires its selected destination, experience, and provider name."},{status:400});
    }else{
      const selectedId=row.allocationType==="accommodation"?row.accommodationId:row.guideId;
      if(!row.destinationId||!destinationIds.has(row.destinationId)||!selectedId)return NextResponse.json({error:"Accommodation and guide allocations require a selected destination and supplier."},{status:400});
    }
    if(row.supplierCost!==null&&row.sellingPrice!==null&&row.sellingPrice<row.supplierCost)return NextResponse.json({error:"Selling price cannot be lower than supplier cost. Record any approved loss separately."},{status:400});
  }
  const accommodationIds=allocations.flatMap(row=>row.accommodationId?[row.accommodationId]:[]);
  const guideIds=allocations.flatMap(row=>row.guideId?[row.guideId]:[]);
  const vehicleIds=allocations.flatMap(row=>row.vehicleId?[row.vehicleId]:[]);
  const [accommodations,guides,vehicles,experienceLinks,existingResult,accountResult]=await Promise.all([
    accommodationIds.length?database.from("accommodations").select("id,destination_id").in("id",accommodationIds):Promise.resolve({data:[],error:null}),
    guideIds.length?database.from("guides").select("id").in("id",guideIds):Promise.resolve({data:[],error:null}),
    vehicleIds.length?database.from("vehicles").select("id").in("id",vehicleIds):Promise.resolve({data:[],error:null}),
    experienceIds.size?database.from("experience_destinations").select("experience_id,destination_id").in("experience_id",[...experienceIds]):Promise.resolve({data:[],error:null}),
    database.from("journey_supplier_allocations").select("*").eq("enquiry_id",enquiryId),
    database.from("journey_accounts").select("id,quote_snapshot").eq("enquiry_id",enquiryId).maybeSingle()
  ]);
  const firstError=[accommodations,guides,vehicles,experienceLinks,existingResult,accountResult].find(result=>result.error)?.error;
  if(firstError)return NextResponse.json({error:firstError.message},{status:500});
  if((accommodations.data?.length??0)!==new Set(accommodationIds).size||(guides.data?.length??0)!==new Set(guideIds).size||(vehicles.data?.length??0)!==new Set(vehicleIds).size)return NextResponse.json({error:"One or more selected supplier records no longer exist."},{status:409});
  for(const row of allocations.filter(item=>item.allocationType==="accommodation")){
    if(!accommodations.data?.some(item=>item.id===row.accommodationId&&item.destination_id===row.destinationId))return NextResponse.json({error:"The accommodation partner must belong to the allocated destination."},{status:400});
  }
  for(const row of allocations.filter(item=>item.allocationType==="experience")){
    if(!experienceLinks.data?.some(item=>item.experience_id===row.experienceId&&item.destination_id===row.destinationId))return NextResponse.json({error:"The experience is not mapped to the allocated destination."},{status:400});
  }
  const existing=existingResult.data??[];
  const existingKey=(row:typeof existing[number])=>row.allocation_type==="vehicle"?`vehicle:${row.from_destination_id}:${row.to_destination_id}`:row.allocation_type==="experience"?`experience:${row.experience_id}`:`${row.allocation_type}:${row.destination_id}`;
  const allocationAccount=accountResult.data?.quote_snapshot&&typeof accountResult.data.quote_snapshot==="object"&&!Array.isArray(accountResult.data.quote_snapshot)&&(accountResult.data.quote_snapshot as Record<string,Json|undefined>).source==="supplier_allocations";
  const activeInput=allocations.filter(row=>row.confirmationStatus!=="cancelled");
  if(allocationAccount&&(activeInput.some(row=>row.supplierCost===null||row.sellingPrice===null)||new Set(activeInput.map(row=>row.currency)).size!==1))return NextResponse.json({error:"An active Accounting account requires complete supplier costs, selling prices and one currency."},{status:409});
  const existingIds=existing.map(row=>row.id);
  const {data:financialActivity,error:financialError}=existingIds.length
    ?await database.from("journey_settlements").select("allocation_id,amount_paid,waived_amount").in("allocation_id",existingIds)
    :{data:[],error:null};
  if(financialError)return NextResponse.json({error:financialError.message},{status:500});
  const activityByAllocation=new Map((financialActivity??[]).map(row=>[row.allocation_id,(row.amount_paid??0)+(row.waived_amount??0)]));
  const desiredKeys=new Set(allocations.map(key));
  for(const row of allocations){
    const current=existing.find(item=>existingKey(item)===key(row));
    const resolved=current?activityByAllocation.get(current.id)??0:0;
    if(resolved>0&&(row.supplierCost??0)+0.005<resolved)return NextResponse.json({error:`${current?.provider_name||"A supplier"}: supplier cost cannot be lower than payments and waivers already recorded.`},{status:409});
  }
  for(const stale of existing.filter(row=>!desiredKeys.has(existingKey(row)))){
    if((activityByAllocation.get(stale.id)??0)>0)return NextResponse.json({error:`${stale.provider_name||"A supplier"} has financial activity and cannot be removed. Mark the allocation cancelled instead.`},{status:409});
  }
  for(const row of allocations){
    const current=existing.find(item=>existingKey(item)===key(row));
    const paymentStatus:Database["public"]["Tables"]["journey_supplier_allocations"]["Row"]["payment_status"]=current?.payment_status==="paid"?"paid":row.paymentStatus;
    const stored={
      enquiry_id:enquiryId,allocation_type:row.allocationType,destination_id:row.destinationId,
      from_destination_id:row.fromDestinationId,to_destination_id:row.toDestinationId,
      accommodation_id:row.accommodationId,guide_id:row.guideId,vehicle_id:row.vehicleId,experience_id:row.experienceId,
      provider_name:row.providerName||null,supplier_contact:row.supplierContact||null,
      supplier_cost:row.supplierCost,selling_price:row.sellingPrice,currency:row.currency,
      confirmation_status:row.confirmationStatus,invoice_status:row.invoiceStatus,
      payment_status:paymentStatus,
      arrival_instructions:row.arrivalInstructions||null,special_notes:row.specialNotes||null,updated_at:new Date().toISOString()
    };
    const result=current?await database.from("journey_supplier_allocations").update(stored).eq("id",current.id):await database.from("journey_supplier_allocations").insert(stored);
    if(result.error)return NextResponse.json({error:result.error.message},{status:500});
  }
  for(const stale of existing.filter(row=>!desiredKeys.has(existingKey(row)))){
    const {error}=await database.from("journey_supplier_allocations").delete().eq("id",stale.id);
    if(error)return NextResponse.json({error:error.message},{status:500});
  }
  try{await syncAllocationAccounting(enquiryId,actor.user.id)}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Accounting could not be synchronized."},{status:409})}
  const {data:result,error:resultError}=await database.from("journey_supplier_allocations").select("*").eq("enquiry_id",enquiryId).order("created_at");
  if(resultError)return NextResponse.json({error:resultError.message},{status:500});
  return NextResponse.json({allocations:result});
}
