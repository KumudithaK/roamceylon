import type {StaffPermission} from "./permissions";
import type {Database,Json} from "@/lib/database.types";

type Proposal=Database["public"]["Tables"]["journey_proposals"]["Row"];
type ChangeRequest=Database["public"]["Tables"]["journey_proposal_change_requests"]["Row"];
type JourneyAccount=Database["public"]["Tables"]["journey_accounts"]["Row"];
export type FinanceJourneyAccount=Database["public"]["Views"]["finance_journey_accounts"]["Row"];

const has=(permissions:readonly StaffPermission[],permission:StaffPermission)=>permissions.includes(permission);
export const canViewDesignTravellerPii=(permissions:readonly StaffPermission[])=>has(permissions,"traveller.pii.design.view")||has(permissions,"traveller.pii.full.view");

export type StaffProposal=Partial<Proposal>&Pick<Proposal,"id"|"enquiry_id"|"version"|"proposal_reference"|"status"|"currency"|"total_supplier_cost"|"total_selling_price"|"gross_profit"|"profit_margin"|"allocation_snapshot"|"commercial_snapshot"|"created_at"|"updated_at">;

export function proposalForStaff(proposal:Proposal,permissions:readonly StaffPermission[]):StaffProposal{
  const canSeeCosts=has(permissions,"finance.costs.view");
  const canSeeMargins=has(permissions,"finance.margin.view");
  const canSeePayments=has(permissions,"finance.payments.manage");
  const canSeeTraveller=canViewDesignTravellerPii(permissions);
  const allocationSnapshot=Array.isArray(proposal.allocation_snapshot)?proposal.allocation_snapshot.map(value=>{
    if(!value||typeof value!=="object"||Array.isArray(value))return value;
    const line=value as Record<string,Json|undefined>;
    return {...line,
      supplierCost:canSeeCosts?line.supplierCost:null,
      pricingPlanSnapshot:canSeeCosts?line.pricingPlanSnapshot:{},
      supplierContact:canSeeCosts?line.supplierContact:null,
      invoiceStatus:canSeePayments?line.invoiceStatus:"not_requested",
      paymentStatus:canSeePayments?line.paymentStatus:"pending"
    };
  }):proposal.allocation_snapshot;
  const shaped:StaffProposal={...proposal,
    allocation_snapshot:allocationSnapshot,
    total_supplier_cost:canSeeCosts?proposal.total_supplier_cost:0,
    gross_profit:canSeeMargins?proposal.gross_profit:0,
    profit_margin:canSeeMargins?proposal.profit_margin:0,
    commercial_snapshot:canSeeMargins?proposal.commercial_snapshot:{},
    customer_snapshot:canSeeTraveller?proposal.customer_snapshot:{},
    sent_snapshot:canSeeTraveller?proposal.sent_snapshot:null,
    curated_journey_snapshot:canSeeTraveller?proposal.curated_journey_snapshot:{},
    accepted_name:canSeeTraveller?proposal.accepted_name:null,
    accepted_email:canSeeTraveller?proposal.accepted_email:null,
    acceptance_metadata:canSeeTraveller?proposal.acceptance_metadata:{},
    access_revocation_reason:canSeeTraveller?proposal.access_revocation_reason:null
  };
  if(canSeeTraveller)return shaped;
  const safe=shaped as Record<string,unknown>;
  for(const field of [
    "customer_snapshot","sent_snapshot","curated_journey_snapshot","accepted_name","accepted_email",
    "acceptance_metadata","public_token","access_revoked_at","access_revoked_by","access_revocation_reason",
    "first_viewed_at","last_viewed_at","viewed_at","view_count","changes_requested_at","introduction","terms"
  ])delete safe[field];
  safe.allocation_snapshot=Array.isArray(allocationSnapshot)?allocationSnapshot.map(value=>{
    if(!value||typeof value!=="object"||Array.isArray(value))return value;
    return {...value,serviceDetails:{},arrivalInstructions:null,specialNotes:null};
  }):allocationSnapshot;
  return safe as StaffProposal;
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
