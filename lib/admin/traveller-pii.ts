import type {StaffPermission} from "./permissions";
import type {Database,Json} from "@/lib/database.types";
import {allocationAccessForStaff,allocationSnapshotForStaff,pickStaffJson} from "./allocation-projection.ts";

type Proposal=Database["public"]["Tables"]["journey_proposals"]["Row"];
type ChangeRequest=Database["public"]["Tables"]["journey_proposal_change_requests"]["Row"];
type JourneyAccount=Database["public"]["Tables"]["journey_accounts"]["Row"];
export type FinanceJourneyAccount=Database["public"]["Views"]["finance_journey_accounts"]["Row"];

const has=(permissions:readonly StaffPermission[],permission:StaffPermission)=>permissions.includes(permission);
export const canViewDesignTravellerPii=(permissions:readonly StaffPermission[])=>has(permissions,"traveller.pii.design.view")||has(permissions,"traveller.pii.full.view");

export type StaffProposal=Partial<Proposal>&Pick<Proposal,"id"|"enquiry_id"|"curated_journey_id"|"version"|"proposal_reference"|"status"|"currency"|"valid_until"|"allocation_snapshot"|"requires_new_version"|"out_of_date_at"|"created_at"|"updated_at"|"internally_approved_at"|"internally_approved_by"|"sent_at"|"approved_at"|"accepted_at"|"created_by">;

const record=(value:Json|undefined):Record<string,Json|undefined>=>value&&typeof value==="object"&&!Array.isArray(value)?value:{};
const costSummary=["totalSupplierCost","operationsCost","administrationFee","contingency","serviceFee","internalCost","incompleteLines"];
const commercialConfig=["driverSalaryPerDay","fuelPricePerLitre","vehicleKmPerLitre","tollsPerJourney","parkingPerDay","guideAccommodationPerNight","administrationFixed","administrationPercent","contingencyPercent","serviceFeeFixed","serviceFeePercent","targetProfitMarginPercent","routeDistanceBufferPercent"];

function commercialForStaff(value:Json,permissions:readonly StaffPermission[]):Json{
  const {canSeeCosts,canSeeMargins,canSeeRevenue}=allocationAccessForStaff(permissions),source=record(value),summary=record(source.summary),context=record(source.context);
  return {
    summary:{
      ...pickStaffJson(summary,[...(canSeeCosts?costSummary:[]),...(canSeeRevenue?["totalSellingPrice","manualSellingFloor"]:[]),...(canSeeMargins?["grossProfit","profitMargin"]:[])]),
      ...(canSeeCosts&&Array.isArray(summary.breakdown)?{breakdown:summary.breakdown.filter(line=>line&&typeof line==="object"&&!Array.isArray(line)).map(line=>pickStaffJson(line,["key","label","amount","category","internal"]))}:{})
    },
    ...(canSeeCosts?{context:{...pickStaffJson(context,["days","nights","distanceKm"]),config:pickStaffJson(context.config,commercialConfig.filter(key=>canSeeMargins||key!=="targetProfitMarginPercent")),overrides:pickStaffJson(context.overrides,["driverOperations","fuel","tolls","parking","guideAccommodation","administration","contingency"])}}:{}),
    ...(canSeeRevenue?{rangeReview:pickStaffJson(source.rangeReview,["status","currency","estimateTotalMin","estimateTotalMax","proposalTotal",...(canViewDesignTravellerPii(permissions)?["reason"]:[])])}:{})
  };
}

export function proposalForStaff(proposal:Proposal,permissions:readonly StaffPermission[]):StaffProposal{
  const {canSeeCosts,canSeeMargins,canSeeRevenue}=allocationAccessForStaff(permissions);
  const canSeeTraveller=canViewDesignTravellerPii(permissions);
  const allocationSnapshot=Array.isArray(proposal.allocation_snapshot)?proposal.allocation_snapshot.flatMap(value=>{
    const line=allocationSnapshotForStaff(value,permissions);return line===null?[]:[line];
  }):[];
  return {
    id:proposal.id,enquiry_id:proposal.enquiry_id,curated_journey_id:proposal.curated_journey_id,
    version:proposal.version,proposal_reference:proposal.proposal_reference,status:proposal.status,currency:proposal.currency,
    valid_until:proposal.valid_until,allocation_snapshot:allocationSnapshot,
    requires_new_version:proposal.requires_new_version,out_of_date_at:proposal.out_of_date_at,
    created_at:proposal.created_at,updated_at:proposal.updated_at,created_by:proposal.created_by,
    internally_approved_at:proposal.internally_approved_at,internally_approved_by:proposal.internally_approved_by,
    sent_at:proposal.sent_at,approved_at:proposal.approved_at,accepted_at:proposal.accepted_at,
    ...(canSeeCosts?{total_supplier_cost:proposal.total_supplier_cost}:{}),
    ...(canSeeRevenue?{total_selling_price:proposal.total_selling_price}:{}),
    ...(canSeeMargins?{gross_profit:proposal.gross_profit,profit_margin:proposal.profit_margin}:{}),
    ...(canSeeCosts||canSeeMargins?{commercial_snapshot:commercialForStaff(proposal.commercial_snapshot,permissions)}:{}),
    ...(canSeeTraveller?{
      customer_snapshot:proposal.customer_snapshot,sent_snapshot:proposal.sent_snapshot,curated_journey_snapshot:proposal.curated_journey_snapshot,
      accepted_name:proposal.accepted_name,accepted_email:proposal.accepted_email,acceptance_metadata:proposal.acceptance_metadata,
      public_token:proposal.public_token,access_revoked_at:proposal.access_revoked_at,access_revoked_by:proposal.access_revoked_by,access_revocation_reason:proposal.access_revocation_reason,
      first_viewed_at:proposal.first_viewed_at,last_viewed_at:proposal.last_viewed_at,viewed_at:proposal.viewed_at,view_count:proposal.view_count,changes_requested_at:proposal.changes_requested_at,
      introduction:proposal.introduction,terms:proposal.terms
    }:{})
  };
}

export type StaffProposalChange=Pick<ChangeRequest,"id"|"proposal_id"|"category"|"status"|"created_at"|"reviewed_at"|"reviewed_by">&Partial<Pick<ChangeRequest,"message"|"traveller_name"|"traveller_email">>;

export function proposalChangeForStaff(change:ChangeRequest,permissions:readonly StaffPermission[]):StaffProposalChange{
  const safe:StaffProposalChange={id:change.id,proposal_id:change.proposal_id,category:change.category,status:change.status,created_at:change.created_at,reviewed_at:change.reviewed_at,reviewed_by:change.reviewed_by};
  return canViewDesignTravellerPii(permissions)?{...safe,message:change.message,traveller_name:change.traveller_name,traveller_email:change.traveller_email}:safe;
}

export function financeAccountForStaff(account:JourneyAccount):FinanceJourneyAccount{
  const safe={...account} as unknown as Record<string,unknown>;
  delete safe.traveller_email;
  delete safe.quote_snapshot;
  return safe as unknown as FinanceJourneyAccount;
}
