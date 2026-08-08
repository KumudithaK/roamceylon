import type {EnquiryStatus} from "@/lib/database.types";

export const enquiryWorkflow=[
  ["new","Draft"],
  ["preparing_proposal","Proposal Ready"],
  ["proposal_sent","Proposal Sent"],
  ["proposal_accepted","Traveller Approved"],
  ["deposit_paid","Deposit Received"],
  ["journey_confirmed","Supplier Allocation Complete"],
  ["ready_for_operations","Ready for Operations"],
  ["travelling","Travelling"],
  ["completed","Completed"],
  ["archived","Archived"],
  ["under_review","Under Review · legacy"],
  ["awaiting_traveller_approval","Awaiting Traveller Approval · legacy"],
  ["deposit_requested","Deposit Requested · legacy"],
  ["cancelled","Cancelled"]
] as const satisfies ReadonlyArray<readonly [EnquiryStatus,string]>;

export const enquiryStatusLabels=Object.fromEntries(enquiryWorkflow) as Record<EnquiryStatus,string>;
