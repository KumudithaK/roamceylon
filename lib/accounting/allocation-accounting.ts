import "server-only";
import {createAdminClient} from "@/lib/supabase/admin";
import {allocationFinancialSummary} from "@/lib/admin/allocation-financials";
import type {Database,Json} from "@/lib/database.types";

type Allocation=Database["public"]["Tables"]["journey_supplier_allocations"]["Row"];
type Account=Database["public"]["Tables"]["journey_accounts"]["Row"];
type Settlement=Database["public"]["Tables"]["journey_settlements"]["Row"];

export type AllocationSnapshotLine={
  allocationId:string;
  type:Allocation["allocation_type"];
  destinationId:string|null;
  destinationName:string|null;
  fromDestinationId:string|null;
  fromDestinationName:string|null;
  toDestinationId:string|null;
  toDestinationName:string|null;
  resourceId:string|null;
  resourceName:string;
  pricingPlanId:string|null;
  pricingPlanSnapshot:Json;
  serviceName:string|null;
  quantity:number|null;
  quantityLabel:string|null;
  serviceDetails:Json;
  providerName:string;
  supplierContact:string|null;
  supplierCost:number|null;
  sellingPrice:number|null;
  currency:string;
  confirmationStatus:Allocation["confirmation_status"];
  invoiceStatus:Allocation["invoice_status"];
  paymentStatus:Allocation["payment_status"];
  arrivalInstructions:string|null;
  specialNotes:string|null;
};

const asJson=(value:unknown)=>JSON.parse(JSON.stringify(value)) as Json;
const resourceId=(row:Allocation)=>row.accommodation_id??row.guide_id??row.vehicle_id??row.experience_id;

export async function allocationCommercialSnapshot(enquiryId:string){
  const database=createAdminClient();
  if(!database)throw new Error("Supabase server credentials are unavailable.");
  const {data:rows,error}=await database.from("journey_supplier_allocations").select("*").eq("enquiry_id",enquiryId).order("created_at");
  if(error)throw new Error(error.message);
  const allocations=(rows??[]) as Allocation[];
  const destinationIds=[...new Set(allocations.flatMap(row=>[row.destination_id,row.from_destination_id,row.to_destination_id]).filter((value):value is string=>Boolean(value)))];
  const accommodationIds=allocations.flatMap(row=>row.accommodation_id?[row.accommodation_id]:[]);
  const guideIds=allocations.flatMap(row=>row.guide_id?[row.guide_id]:[]);
  const vehicleIds=allocations.flatMap(row=>row.vehicle_id?[row.vehicle_id]:[]);
  const experienceIds=allocations.flatMap(row=>row.experience_id?[row.experience_id]:[]);
  const [destinations,accommodations,guides,vehicles,experiences]=await Promise.all([
    destinationIds.length?database.from("destinations").select("id,name").in("id",destinationIds):Promise.resolve({data:[],error:null}),
    accommodationIds.length?database.from("accommodations").select("id,name").in("id",accommodationIds):Promise.resolve({data:[],error:null}),
    guideIds.length?database.from("guides").select("id,name").in("id",guideIds):Promise.resolve({data:[],error:null}),
    vehicleIds.length?database.from("vehicles").select("id,listing_title").in("id",vehicleIds):Promise.resolve({data:[],error:null}),
    experienceIds.length?database.from("experiences").select("id,name").in("id",experienceIds):Promise.resolve({data:[],error:null})
  ]);
  const firstError=[destinations,accommodations,guides,vehicles,experiences].find(result=>result.error)?.error;
  if(firstError)throw new Error(firstError.message);
  const destinationNames=new Map((destinations.data??[]).map(item=>[item.id,item.name]));
  const names=new Map<string,string>();
  for(const item of accommodations.data??[])names.set(item.id,item.name);
  for(const item of guides.data??[])names.set(item.id,item.name);
  for(const item of vehicles.data??[])names.set(item.id,item.listing_title);
  for(const item of experiences.data??[])names.set(item.id,item.name);
  const snapshot:AllocationSnapshotLine[]=allocations.map(row=>{
    const id=resourceId(row);
    const name=id?names.get(id)??"Supplier allocation":"Supplier allocation";
    return {
      allocationId:row.id,type:row.allocation_type,
      destinationId:row.destination_id,destinationName:row.destination_id?destinationNames.get(row.destination_id)??null:null,
      fromDestinationId:row.from_destination_id,fromDestinationName:row.from_destination_id?destinationNames.get(row.from_destination_id)??null:null,
      toDestinationId:row.to_destination_id,toDestinationName:row.to_destination_id?destinationNames.get(row.to_destination_id)??null:null,
      resourceId:id,resourceName:name,providerName:row.provider_name?.trim()||name,
      pricingPlanId:row.pricing_plan_id,pricingPlanSnapshot:row.pricing_plan_snapshot,
      serviceName:row.service_name,quantity:row.quantity===null?null:Number(row.quantity),quantityLabel:row.quantity_label,serviceDetails:row.service_details,
      supplierContact:row.supplier_contact,supplierCost:row.supplier_cost===null?null:Number(row.supplier_cost),sellingPrice:row.selling_price===null?null:Number(row.selling_price),currency:row.currency,
      confirmationStatus:row.confirmation_status,invoiceStatus:row.invoice_status,paymentStatus:row.payment_status,
      arrivalInstructions:row.arrival_instructions,specialNotes:row.special_notes
    };
  });
  return {allocations,snapshot,summary:allocationFinancialSummary(allocations)};
}

const isAllocationAccount=(account:Account)=>{
  const snapshot=account.quote_snapshot;
  return Boolean(snapshot&&typeof snapshot==="object"&&!Array.isArray(snapshot)&&(snapshot as Record<string,Json|undefined>).source==="supplier_allocations");
};

export async function syncAllocationAccounting(enquiryId:string,userId?:string){
  void userId;
  const database=createAdminClient();
  if(!database)throw new Error("Supabase server credentials are unavailable.");
  const {data:existingAccount,error}=await database.from("journey_accounts").select("*").eq("enquiry_id",enquiryId).maybeSingle();
  if(error)throw new Error(error.message);
  const commercial=await allocationCommercialSnapshot(enquiryId);
  const account=existingAccount;
  if(account&&!isAllocationAccount(account))return {account,synced:false};
  if(!account||!account.active)return {account,synced:false};
  if(commercial.summary.incompleteLines)throw new Error("Complete supplier cost and selling price for every active allocation before Accounting can be updated.");
  const active=commercial.snapshot.filter(line=>line.confirmationStatus!=="cancelled");
  const {error:accountError}=await database.from("journey_accounts").update({
    currency:active[0]?.currency??account.currency,
    selling_price:commercial.summary.totalSellingPrice,
    internal_cost:commercial.summary.totalSupplierCost,
    gross_profit:commercial.summary.grossProfit,
    profit_margin:commercial.summary.profitMargin,
    quote_snapshot:asJson({source:"supplier_allocations",summary:commercial.summary,allocations:active})
  }).eq("id",account.id);
  if(accountError)throw new Error(accountError.message);
  const {data:settlementRows,error:settlementError}=await database.from("journey_settlements").select("*").eq("account_id",account.id).not("allocation_id","is",null);
  if(settlementError)throw new Error(settlementError.message);
  const settlements=(settlementRows??[]) as Settlement[];
  for(const line of active){
    const existing=settlements.find(item=>item.allocation_id===line.allocationId);
    const amountDue=line.supplierCost??0;
    if(existing&&amountDue+0.005<existing.amount_paid+existing.waived_amount)throw new Error(`${line.providerName}: supplier cost cannot be lower than payments and waivers already recorded.`);
    const guideDetails=line.type==="guide"&&line.serviceDetails&&typeof line.serviceDetails==="object"&&!Array.isArray(line.serviceDetails)?line.serviceDetails as Record<string,Json>:null;
    const guideDescription=guideDetails?(guideDetails.guideRole==="specialist"?`${String(guideDetails.guideSpeciality??"Specialist guide").replaceAll("_"," ")} · ${line.serviceName??line.resourceName}`:`Primary journey guide · ${line.serviceName??line.resourceName}`):null;
    const payload={
      account_id:account.id,allocation_id:line.allocationId,source_key:`allocation:${line.allocationId}`,
      payee_type:line.type,entity_id:line.resourceId,payee_name:line.providerName,
      description:guideDescription??line.serviceName??line.resourceName,currency:line.currency,amount_due:amountDue,
      status:existing?.status??"pending",notes:line.specialNotes
    };
    const result=existing
      ?await database.from("journey_settlements").update(payload).eq("id",existing.id)
      :await database.from("journey_settlements").insert(payload);
    if(result.error)throw new Error(result.error.message);
  }
  const activeIds=new Set(active.map(line=>line.allocationId));
  for(const settlement of settlements.filter(item=>item.allocation_id&&!activeIds.has(item.allocation_id))){
    if(settlement.amount_paid>0||settlement.waived_amount>0){
      await database.from("journey_accounts").update({status:"review_required",review_reason:`Allocated supplier ${settlement.payee_name} was cancelled after financial activity.`}).eq("id",account.id);
    }else{
      const {error:deleteError}=await database.from("journey_settlements").delete().eq("id",settlement.id);
      if(deleteError)throw new Error(deleteError.message);
    }
  }
  const {data:updated}=await database.from("journey_accounts").select("*").eq("id",account.id).single();
  return {account:updated??account,synced:true};
}
