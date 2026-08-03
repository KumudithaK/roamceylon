import type {EnquiryStatus} from "@/lib/database.types";

export const enquiryWorkflow=[
  ["new","New Enquiry"],
  ["under_review","Under Review"],
  ["preparing_proposal","Preparing Proposal"],
  ["proposal_sent","Proposal Sent"],
  ["awaiting_traveller_approval","Awaiting Traveller Approval"],
  ["proposal_accepted","Proposal Accepted"],
  ["deposit_requested","Deposit Requested"],
  ["deposit_paid","Deposit Paid"],
  ["journey_confirmed","Journey Confirmed"],
  ["travelling","Travelling"],
  ["completed","Completed"],
  ["cancelled","Cancelled"]
] as const satisfies ReadonlyArray<readonly [EnquiryStatus,string]>;

export const enquiryStatusLabels=Object.fromEntries(enquiryWorkflow) as Record<EnquiryStatus,string>;
