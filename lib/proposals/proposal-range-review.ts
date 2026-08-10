import {isJourneyEstimate,type PublicJourneyEstimate} from "../pricing/journey-estimate-types.ts";

export type ProposalRangeReview={
  status:"within_range"|"outside_range"|"not_available";
  currency:string|null;
  estimateTotalMin:number|null;
  estimateTotalMax:number|null;
  proposalTotal:number;
  reason:string|null;
};

export function reviewProposalAgainstEstimate(quote:unknown,proposalTotal:number,reason?:string):ProposalRangeReview{
  const estimate=isJourneyEstimate(quote)?quote as PublicJourneyEstimate:null;
  if(!estimate||estimate.status!=="estimated_range"||estimate.totalMin===null||estimate.totalMax===null)return {status:"not_available",currency:null,estimateTotalMin:null,estimateTotalMax:null,proposalTotal,reason:null};
  const within=proposalTotal>=estimate.totalMin&&proposalTotal<=estimate.totalMax;
  return {status:within?"within_range":"outside_range",currency:estimate.currency,estimateTotalMin:estimate.totalMin,estimateTotalMax:estimate.totalMax,proposalTotal,reason:within?null:reason?.trim()||null};
}
