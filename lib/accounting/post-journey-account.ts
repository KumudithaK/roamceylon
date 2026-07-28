import "server-only";
import {createAdminClient} from "@/lib/supabase/admin";
import {PackagePricingService} from "@/lib/pricing/package-service";
import type {AdminPackageQuote,PackageQuoteRequest,SupplierEntityType} from "@/lib/pricing/package-types";
import type {Database,Json} from "@/lib/database.types";

type Enquiry=Database["public"]["Tables"]["enquiries"]["Row"];
type Plan=Database["public"]["Tables"]["pricing_plans"]["Row"];
type Account=Database["public"]["Tables"]["journey_accounts"]["Row"];
type SettlementInsert=Database["public"]["Tables"]["journey_settlements"]["Insert"];

export class AccountingPostError extends Error{
  constructor(public code:"NOT_FOUND"|"PRICING"|"DATABASE",message:string){super(message);this.name="AccountingPostError"}
}

const ids=(value:Json)=>Array.isArray(value)?value.filter((item):item is string=>typeof item==="string"):[];
const selectionFrom=(row:Enquiry):PackageQuoteRequest=>({
  selectedDestinationIds:ids(row.selected_destinations),
  selectedExperienceIds:ids(row.selected_experiences),
  selectedStayIds:ids(row.selected_stays),
  selectedVehicleId:row.selected_vehicle,
  selectedGuideId:row.selected_guide,
  travelDates:{start:row.travel_start_date??"",end:row.travel_end_date??""},
  travellerCounts:{adults:row.adults,children:row.children}
});
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

export async function postJourneyToAccounts(enquiryId:string,userId:string):Promise<Account>{
  const database=createAdminClient();
  if(!database)throw new AccountingPostError("DATABASE","Supabase server credentials are unavailable.");
  const {data:existing}=await database.from("journey_accounts").select("*").eq("enquiry_id",enquiryId).maybeSingle();
  if(existing){
    if((await database.from("enquiries").update({status:"closed"}).eq("id",enquiryId)).error)throw new AccountingPostError("DATABASE","The journey account exists but the enquiry could not be closed.");
    return existing;
  }
  const {data:enquiry,error:enquiryError}=await database.from("enquiries").select("*").eq("id",enquiryId).maybeSingle();
  if(enquiryError)throw new AccountingPostError("DATABASE",enquiryError.message);
  if(!enquiry)throw new AccountingPostError("NOT_FOUND","The traveller enquiry could not be found.");
  let quote:AdminPackageQuote;
  try{quote=await new PackagePricingService().quote(selectionFrom(enquiry))}
  catch(error){throw new AccountingPostError("PRICING",error instanceof Error?error.message:"The package could not be priced.")}
  if(quote.public.status!=="ready"||quote.sellingPrice===null||quote.internalCost===null||quote.grossProfit===null||quote.profitMargin===null){
    throw new AccountingPostError("PRICING","Complete all journey supplier rates and DMC pricing settings before closing this journey.");
  }
  const {data:account,error:accountError}=await database.from("journey_accounts").insert({
    enquiry_id:enquiry.id,
    traveller_name:enquiry.name,
    traveller_email:enquiry.email,
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
  if(accountError||!account)throw new AccountingPostError("DATABASE",accountError?.message??"The journey account could not be created.");
  const settlements=await settlementsFor(account,quote);
  if(settlements.length){
    const {error:settlementError}=await database.from("journey_settlements").insert(settlements);
    if(settlementError){
      await database.from("journey_accounts").delete().eq("id",account.id);
      throw new AccountingPostError("DATABASE",settlementError.message);
    }
  }
  const {error:closeError}=await database.from("enquiries").update({status:"closed"}).eq("id",enquiry.id);
  if(closeError)throw new AccountingPostError("DATABASE",closeError.message);
  return account;
}
