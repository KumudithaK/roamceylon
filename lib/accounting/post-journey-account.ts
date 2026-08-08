import "server-only";
import {createAdminClient} from "@/lib/supabase/admin";
import {PackagePricingService} from "@/lib/pricing/package-service";
import type {AdminPackageQuote,PackageQuoteRequest,SupplierEntityType} from "@/lib/pricing/package-types";
import type {Database,Json} from "@/lib/database.types";
import {parseJourneyHandoff} from "@/lib/journey/quotation-handoff";
import {allocationCommercialSnapshot,syncAllocationAccounting} from "@/lib/accounting/allocation-accounting";
import type {ParticipantCounts} from "@/lib/types";

type Enquiry=Database["public"]["Tables"]["enquiries"]["Row"];
type Plan=Database["public"]["Tables"]["pricing_plans"]["Row"];
type Account=Database["public"]["Tables"]["journey_accounts"]["Row"];
type Proposal=Database["public"]["Tables"]["journey_proposals"]["Row"];
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
  const {data:existingAccount,error:accountLookupError}=await database.from("journey_accounts").select("*").eq("enquiry_id",enquiryId).maybeSingle();
  let account=existingAccount;
  if(accountLookupError)throw new AccountingPostError("DATABASE",accountLookupError.message);
  const allocationCommercial=await allocationCommercialSnapshot(enquiry.id);
  let approvedProposal:Proposal|null=null;
  if(allocationCommercial.allocations.length){
    const {data:approved,error:proposalError}=await database.from("journey_proposals").select("*").eq("enquiry_id",enquiry.id).eq("status","approved").order("version",{ascending:false}).limit(1).maybeSingle();
    if(proposalError)throw new AccountingPostError("DATABASE",proposalError.message);
    if(!approved)throw new AccountingPostError("PRICING","The traveller must accept an approved journey proposal before a deposit can activate Accounting.");
    approvedProposal=approved as Proposal;
  }
  let created=false;
  if(!account){
    let financial:{currency:string;sellingPrice:number;internalCost:number;grossProfit:number;profitMargin:number;snapshot:Json};
    let legacyQuote:AdminPackageQuote|null=null;
    if(allocationCommercial.allocations.length){
      if(allocationCommercial.summary.incompleteLines)throw new AccountingPostError("PRICING","Complete supplier cost for every active allocation before recording the deposit.");
      const active=allocationCommercial.snapshot.filter(line=>line.confirmationStatus!=="cancelled");
      if(!active.length||allocationCommercial.summary.totalSellingPrice<=0)throw new AccountingPostError("PRICING","At least one active, priced supplier allocation is required before recording the deposit.");
      const currencies=new Set(active.map(line=>line.currency));
      if(currencies.size!==1)throw new AccountingPostError("PRICING","All supplier allocations must use the same currency before recording the deposit.");
      const commercialSnapshot=approvedProposal?.commercial_snapshot&&typeof approvedProposal.commercial_snapshot==="object"&&!Array.isArray(approvedProposal.commercial_snapshot)?approvedProposal.commercial_snapshot as Record<string,Json|undefined>:null;
      const summary=commercialSnapshot?.summary&&typeof commercialSnapshot.summary==="object"&&!Array.isArray(commercialSnapshot.summary)?commercialSnapshot.summary as Record<string,Json|undefined>:null;
      const internalCost=summary&&typeof summary.internalCost==="number"?summary.internalCost:allocationCommercial.summary.internalCost;
      financial={currency:approvedProposal?.currency??active[0].currency,sellingPrice:approvedProposal?.total_selling_price??allocationCommercial.summary.totalSellingPrice,internalCost,grossProfit:approvedProposal?.gross_profit??allocationCommercial.summary.grossProfit,profitMargin:approvedProposal?.profit_margin??allocationCommercial.summary.profitMargin,snapshot:asJson({source:"supplier_allocations",proposalReference:approvedProposal?.proposal_reference??null,summary:summary??allocationCommercial.summary,commercialContext:commercialSnapshot?.context??allocationCommercial.commercialContext,allocations:approvedProposal?.allocation_snapshot??active})};
    }else{
      try{legacyQuote=await new PackagePricingService().quote(selectionFrom(enquiry))}
      catch(error){throw new AccountingPostError("PRICING",error instanceof Error?error.message:"The package could not be priced.")}
      if(legacyQuote.public.status!=="ready"||legacyQuote.sellingPrice===null||legacyQuote.internalCost===null||legacyQuote.grossProfit===null||legacyQuote.profitMargin===null){
        throw new AccountingPostError("PRICING","Complete all journey supplier rates and DMC pricing settings before recording the deposit.");
      }
      financial={currency:legacyQuote.public.currency,sellingPrice:legacyQuote.sellingPrice,internalCost:legacyQuote.internalCost,grossProfit:legacyQuote.grossProfit,profitMargin:legacyQuote.profitMargin,snapshot:asJson(legacyQuote)};
    }
    if(deposit.amount>financial.sellingPrice+0.005)throw new AccountingPostError("DATABASE","Deposit exceeds the package selling price.");
    const {data:createdAccount,error:accountError}=await database.from("journey_accounts").insert({
      enquiry_id:enquiry.id,
      journey_reference:enquiry.journey_reference,
      traveller_name:enquiry.name,
      traveller_email:enquiry.email,
      status:"active",
      active:true,
      activated_at:new Date().toISOString(),
      currency:financial.currency,
      selling_price:financial.sellingPrice,
      internal_cost:financial.internalCost,
      gross_profit:financial.grossProfit,
      profit_margin:financial.profitMargin,
      travel_start_date:enquiry.travel_start_date,
      travel_end_date:enquiry.travel_end_date,
      quote_snapshot:financial.snapshot,
      created_by:userId
    }).select("*").single();
    if(accountError||!createdAccount)throw new AccountingPostError("DATABASE",accountError?.message??"The journey account could not be created.");
    account=createdAccount;created=true;
    if(allocationCommercial.allocations.length){
      try{await syncAllocationAccounting(enquiry.id)}catch(error){
        await database.from("journey_accounts").delete().eq("id",account.id);
        throw new AccountingPostError("DATABASE",error instanceof Error?error.message:"Allocation Accounting could not be created.");
      }
    }else if(legacyQuote){
      const settlements=await settlementsFor(account,legacyQuote);
      if(settlements.length){
        const {error:settlementError}=await database.from("journey_settlements").insert(settlements);
        if(settlementError){
          await database.from("journey_accounts").delete().eq("id",account.id);
          throw new AccountingPostError("DATABASE",settlementError.message);
        }
      }
    }
  }else if(!account.active&&allocationCommercial.allocations.length){
    if(allocationCommercial.summary.incompleteLines)throw new AccountingPostError("PRICING","Complete supplier cost for every active allocation before recording the deposit.");
    const active=allocationCommercial.snapshot.filter(line=>line.confirmationStatus!=="cancelled");
    const currencies=new Set(active.map(line=>line.currency));
    if(!active.length||allocationCommercial.summary.totalSellingPrice<=0||currencies.size!==1)throw new AccountingPostError("PRICING","Complete the accepted proposal commercial details before recording the deposit.");
    const commercialSnapshot=approvedProposal?.commercial_snapshot&&typeof approvedProposal.commercial_snapshot==="object"&&!Array.isArray(approvedProposal.commercial_snapshot)?approvedProposal.commercial_snapshot as Record<string,Json|undefined>:null;
    const summary=commercialSnapshot?.summary&&typeof commercialSnapshot.summary==="object"&&!Array.isArray(commercialSnapshot.summary)?commercialSnapshot.summary as Record<string,Json|undefined>:null;
    const approvedInternalCost=summary&&typeof summary.internalCost==="number"?summary.internalCost:allocationCommercial.summary.internalCost;
    const {data:refreshed,error:refreshError}=await database.from("journey_accounts").update({
      currency:approvedProposal?.currency??active[0].currency,selling_price:approvedProposal?.total_selling_price??allocationCommercial.summary.totalSellingPrice,
      internal_cost:approvedInternalCost,gross_profit:approvedProposal?.gross_profit??allocationCommercial.summary.grossProfit,
      profit_margin:approvedProposal?.profit_margin??allocationCommercial.summary.profitMargin,
      quote_snapshot:asJson({source:"supplier_allocations",proposalReference:approvedProposal?.proposal_reference??null,summary:summary??allocationCommercial.summary,commercialContext:commercialSnapshot?.context??allocationCommercial.commercialContext,allocations:approvedProposal?.allocation_snapshot??active})
    }).eq("id",account.id).select("*").single();
    if(refreshError||!refreshed)throw new AccountingPostError("DATABASE",refreshError?.message??"The accepted proposal could not be prepared for Accounting.");
    account=refreshed;
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
