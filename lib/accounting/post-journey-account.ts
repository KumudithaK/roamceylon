import "server-only";
import {createAdminClient} from "@/lib/supabase/admin";
import {PackagePricingService} from "@/lib/pricing/package-service";
import type {AdminPackageQuote,PackageQuoteRequest,SupplierEntityType} from "@/lib/pricing/package-types";
import type {Database,Json} from "@/lib/database.types";
import {parseJourneyHandoff} from "@/lib/journey/quotation-handoff";
import type {ParticipantCounts} from "@/lib/types";

type Enquiry=Database["public"]["Tables"]["enquiries"]["Row"];
type Plan=Database["public"]["Tables"]["pricing_plans"]["Row"];
type Account=Database["public"]["Tables"]["journey_accounts"]["Row"];
type SettlementInsert=Database["public"]["Tables"]["journey_settlements"]["Insert"];
export type DepositPayment={
  amount:number;
  paymentDate:string;
  paymentMethod?:string;
  reference?:string;
  notes?:string;
};

export class AccountingPostError extends Error{
  constructor(public code:"NOT_FOUND"|"PRICING"|"DATABASE",message:string){super(message);this.name="AccountingPostError"}
}

const ids=(value:Json)=>Array.isArray(value)?value.filter((item):item is string=>typeof item==="string"):[];
const participantMap=(value:Json)=>{
  if(!value||typeof value!=="object"||Array.isArray(value))return {};
  return Object.fromEntries(Object.entries(value).flatMap(([id,counts])=>{
    if(!counts||typeof counts!=="object"||Array.isArray(counts))return[];
    const record=counts as Record<string,Json|undefined>;
    return [[id,{adults:Number(record.adults)||0,children:Number(record.children)||0,infants:Number(record.infants)||0} satisfies ParticipantCounts]];
  }));
};
const selectionFrom=(row:Enquiry):PackageQuoteRequest=>{
  const handoff=parseJourneyHandoff(row.trip_state);
  return {
  selectedDestinationIds:ids(row.selected_destinations),
  selectedExperienceIds:ids(row.selected_experiences),
  selectedStayIds:ids(row.selected_stays),
  selectedVehicleId:row.selected_vehicle,
  selectedGuideId:row.selected_guide,
  travelDates:{start:row.travel_start_date??"",end:row.travel_end_date??""},
  travellerCounts:handoff?.state.travellerCounts??{adults:row.adults,children:row.children,infants:0},
  experienceParticipants:participantMap(row.experience_participants),
  selectedPricingPlanIds:handoff?.state.selectedPricingPlanIds??{}
  };
};
const asJson=(value:unknown)=>JSON.parse(JSON.stringify(value)) as Json;

async function resourceNames(plans:Plan[]){
  const database=createAdminClient();
  if(!database)throw new AccountingPostError("DATABASE","Supabase server credentials are unavailable.");
  const grouped=(type:SupplierEntityType)=>[...new Set(plans.filter(plan=>plan.entity_type===type).map(plan=>plan.entity_id))];
  const accommodationIds=grouped("accommodation"),vehicleIds=grouped("vehicle"),guideIds=grouped("guide"),experienceIds=grouped("experience"),destinationIds=grouped("destination");
  const [accommodations,vehicles,guides,experiences,destinations]=await Promise.all([
    accommodationIds.length?database.from("accommodations").select("id,name").in("id",accommodationIds):Promise.resolve({data:[],error:null}),
    vehicleIds.length?database.from("vehicles").select("id,listing_title").in("id",vehicleIds):Promise.resolve({data:[],error:null}),
    guideIds.length?database.from("guides").select("id,name").in("id",guideIds):Promise.resolve({data:[],error:null}),
    experienceIds.length?database.from("experiences").select("id,name").in("id",experienceIds):Promise.resolve({data:[],error:null}),
    destinationIds.length?database.from("destinations").select("id,name").in("id",destinationIds):Promise.resolve({data:[],error:null})
  ]);
  const firstError=[accommodations,vehicles,guides,experiences,destinations].find(result=>result.error)?.error;
  if(firstError)throw new AccountingPostError("DATABASE",firstError.message);
  const names=new Map<string,string>();
  for(const item of accommodations.data??[])names.set(`accommodation:${item.id}`,item.name);
  for(const item of vehicles.data??[])names.set(`vehicle:${item.id}`,item.listing_title);
  for(const item of guides.data??[])names.set(`guide:${item.id}`,item.name);
  for(const item of experiences.data??[])names.set(`experience:${item.id}`,item.name);
  for(const item of destinations.data??[])names.set(`destination:${item.id}`,item.name);
  return names;
}

async function settlementsFor(account:Account,quote:AdminPackageQuote):Promise<SettlementInsert[]>{
  const database=createAdminClient();
  if(!database)throw new AccountingPostError("DATABASE","Supabase server credentials are unavailable.");
  const planIds=quote.breakdown
    .filter(line=>line.category==="supplier"&&line.key.startsWith("supplier:"))
    .map(line=>line.key.slice("supplier:".length));
  const {data:plans,error}=planIds.length
    ?await database.from("pricing_plans").select("*").in("id",planIds)
    :{data:[],error:null};
  if(error)throw new AccountingPostError("DATABASE",error.message);
  const planMap=new Map((plans??[]).map(plan=>[plan.id,plan]));
  const names=await resourceNames(plans??[]);
  const supplierLines=quote.breakdown.filter(line=>line.category==="supplier").map(line=>{
    const plan=planMap.get(line.key.slice("supplier:".length));
    const type:SupplierEntityType|"other"=plan?.entity_type??"other";
    return {
      account_id:account.id,
      source_key:line.key,
      payee_type:type,
      entity_id:plan?.entity_id??null,
      payee_name:plan?names.get(`${type}:${plan.entity_id}`)??plan.name:line.label,
      description:plan?.name??line.label,
      currency:account.currency,
      amount_due:line.amount,
      status:"pending" as const
    };
  });
  const operations=quote.breakdown.filter(line=>line.category==="operations").map(line=>({
    account_id:account.id,
    source_key:line.key,
    payee_type:"operations" as const,
    entity_id:null,
    payee_name:{
      "driver-salary":"Driver and crew",
      fuel:"Fuel supplier",
      tolls:"Road tolls",
      parking:"Parking",
      "guide-accommodation":"Guide accommodation",
      "airport-transfers":"Airport transfer operations"
    }[line.key]??"Journey operations",
    description:line.label,
    currency:account.currency,
    amount_due:line.amount,
    status:"pending" as const
  }));
  return [...supplierLines,...operations];
}

export async function activateJourneyAccount(enquiryId:string,userId:string,deposit:DepositPayment):Promise<Account>{
  const database=createAdminClient();
  if(!database)throw new AccountingPostError("DATABASE","Supabase server credentials are unavailable.");
  const {data:enquiry,error:enquiryError}=await database.from("enquiries").select("*").eq("id",enquiryId).maybeSingle();
  if(enquiryError)throw new AccountingPostError("DATABASE",enquiryError.message);
  if(!enquiry)throw new AccountingPostError("NOT_FOUND","The traveller enquiry could not be found.");
  let {data:account,error:accountLookupError}=await database.from("journey_accounts").select("*").eq("enquiry_id",enquiryId).maybeSingle();
  if(accountLookupError)throw new AccountingPostError("DATABASE",accountLookupError.message);
  let created=false;
  if(!account){
    let quote:AdminPackageQuote;
    try{quote=await new PackagePricingService().quote(selectionFrom(enquiry))}
    catch(error){throw new AccountingPostError("PRICING",error instanceof Error?error.message:"The package could not be priced.")}
    if(quote.public.status!=="ready"||quote.sellingPrice===null||quote.internalCost===null||quote.grossProfit===null||quote.profitMargin===null){
      throw new AccountingPostError("PRICING","Complete all journey supplier rates and DMC pricing settings before recording the deposit.");
    }
    if(deposit.amount>quote.sellingPrice+0.005)throw new AccountingPostError("DATABASE","Deposit exceeds the package selling price.");
    const {data:createdAccount,error:accountError}=await database.from("journey_accounts").insert({
      enquiry_id:enquiry.id,
      journey_reference:enquiry.journey_reference,
      traveller_name:enquiry.name,
      traveller_email:enquiry.email,
      status:"active",
      active:true,
      activated_at:new Date().toISOString(),
      currency:quote.public.currency,
      selling_price:quote.sellingPrice,
      internal_cost:quote.internalCost,
      gross_profit:quote.grossProfit,
      profit_margin:quote.profitMargin,
      travel_start_date:enquiry.travel_start_date,
      travel_end_date:enquiry.travel_end_date,
      quote_snapshot:asJson(quote),
      created_by:userId
    }).select("*").single();
    if(accountError||!createdAccount)throw new AccountingPostError("DATABASE",accountError?.message??"The journey account could not be created.");
    account=createdAccount;created=true;
    const settlements=await settlementsFor(account,quote);
    if(settlements.length){
      const {error:settlementError}=await database.from("journey_settlements").insert(settlements);
      if(settlementError){
        await database.from("journey_accounts").delete().eq("id",account.id);
        throw new AccountingPostError("DATABASE",settlementError.message);
      }
    }
  }
  const idempotencyKey=`initial-deposit:${enquiry.id}`;
  const {data:existingDeposit,error:depositLookupError}=await database.from("accounting_transactions").select("id").eq("account_id",account.id).eq("idempotency_key",idempotencyKey).maybeSingle();
  if(depositLookupError)throw new AccountingPostError("DATABASE",depositLookupError.message);
  if(!existingDeposit){
    const remaining=Math.max(0,account.selling_price-account.amount_received);
    if(deposit.amount>remaining+0.005)throw new AccountingPostError("DATABASE","Deposit exceeds the outstanding customer balance.");
    const beforeStatus=account.status;
    const {error:activateError}=await database.from("journey_accounts").update({active:true,deactivated_at:null,activated_at:account.activated_at??new Date().toISOString(),review_reason:null,status:account.status==="pending_deposit"?"active":account.status}).eq("id",account.id);
    if(activateError)throw new AccountingPostError("DATABASE",activateError.message);
    const {error:depositError}=await database.from("accounting_transactions").insert({
      account_id:account.id,
      transaction_type:"customer_receipt",
      amount:deposit.amount,
      currency:account.currency,
      payment_date:deposit.paymentDate,
      payment_method:deposit.paymentMethod||null,
      reference:deposit.reference||null,
      notes:deposit.notes||"Initial traveller deposit",
      idempotency_key:idempotencyKey,
      created_by:userId
    });
    if(depositError){
      if(created)await database.from("journey_accounts").delete().eq("id",account.id);
      throw new AccountingPostError("DATABASE",depositError.message);
    }
    const {data:afterDeposit}=await database.from("journey_accounts").select("status").eq("id",account.id).single();
    await database.from("accounting_lifecycle_history").insert({
      account_id:account.id,
      from_status:beforeStatus,
      to_status:afterDeposit?.status??"part_paid",
      enquiry_status:"deposit_paid",
      reason:"Initial traveller deposit recorded.",
      changed_by:userId
    });
  }
  const {error:statusError}=await database.from("enquiries").update({status:"deposit_paid"}).eq("id",enquiry.id);
  if(statusError)throw new AccountingPostError("DATABASE",statusError.message);
  const {data:result,error:resultError}=await database.from("journey_accounts").select("*").eq("id",account.id).single();
  if(resultError||!result)throw new AccountingPostError("DATABASE",resultError?.message??"The activated journey account could not be loaded.");
  return result;
}
