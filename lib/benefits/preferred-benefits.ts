import type {BenefitConfidence,BenefitFulfilment,BenefitScope,BenefitType,Database} from "@/lib/database.types";

export type BenefitDefinition=Database["public"]["Tables"]["benefit_definitions"]["Row"];
export type JourneyBenefit=Database["public"]["Tables"]["journey_benefits"]["Row"];

export type CustomerBenefit={
  code:string;
  type:BenefitType;
  scope:BenefitScope;
  title:string;
  description:string;
  confidence:BenefitConfidence;
  scopeLabel?:string;
  quantity:number;
  preferredRate?:number;
  referenceRate?:number;
  currency?:string;
  rateUnit?:string;
  verifiedSavings:number;
};

export const benefitTypeLabels:Record<BenefitType,string>={
  roam_ceylon_complimentary:"Roam Ceylon complimentary",preferred_rate:"Preferred rate",partner_privilege:"Partner privilege",
  complimentary_upgrade:"Complimentary upgrade",meal_benefit:"Meal benefit",arrival_departure_benefit:"Arrival / departure benefit",
  celebration_benefit:"Celebration benefit",experience_benefit:"Experience benefit",roam_ceylon_service_benefit:"Roam Ceylon service",other:"Traveller benefit"
};
export const confidenceLabels:Record<BenefitConfidence,string>={
  guaranteed_by_roam_ceylon:"Guaranteed by Roam Ceylon",confirmed_partner_benefit:"Confirmed partner benefit",subject_to_availability:"Subject to availability"
};
export const fulfilmentLabels:Record<BenefitFulfilment,string>={not_required:"Not required",pending:"Pending",confirmed:"Confirmed",prepared:"Prepared",delivered:"Delivered",unavailable:"Unavailable"};

export function referenceComparison(definition:Pick<BenefitDefinition,"benefit_type"|"comparison_verified"|"reference_rate"|"customer_rate"|"currency"|"rate_unit"|"reference_rate_basis"|"reference_rate_source"|"verification_date"|"occupancy_basis"|"room_category"|"meal_plan"|"applicable_from"|"applicable_to"|"taxes_fees_basis"|"cancellation_terms_basis">){
  const required=[definition.currency,definition.rate_unit,definition.reference_rate_basis,definition.reference_rate_source,definition.verification_date,definition.occupancy_basis,definition.room_category,definition.meal_plan,definition.applicable_from,definition.applicable_to,definition.taxes_fees_basis,definition.cancellation_terms_basis];
  const valid=definition.benefit_type==="preferred_rate"&&definition.comparison_verified&&definition.reference_rate!==null&&definition.customer_rate!==null&&definition.reference_rate>definition.customer_rate&&required.every(value=>typeof value==="string"&&value.trim().length>0);
  return {valid,savingPerUnit:valid?Math.round((Number(definition.reference_rate)-Number(definition.customer_rate))*100)/100:0};
}

export const calculateVerifiedSavings=(definition:BenefitDefinition,quantity:number)=>{
  const comparison=referenceComparison(definition);
  return comparison.valid?Math.round(comparison.savingPerUnit*Math.max(1,quantity)*100)/100:0;
};

export const conditionalBenefitDescription=(description:string,confidence:BenefitConfidence)=>confidence==="subject_to_availability"&&!/subject to availability/i.test(description)
  ?`${description.replace(/[.\s]+$/g,"")}, subject to availability.`
  :description;

export function customerBenefit(definition:BenefitDefinition,assignment:JourneyBenefit,scopeLabel?:string):CustomerBenefit{
  const verified=assignment.comparison_verified&&assignment.reference_rate!==null&&assignment.customer_rate!==null&&assignment.reference_rate>assignment.customer_rate&&assignment.verified_savings>0;
  return {
    code:definition.code,type:definition.benefit_type,scope:assignment.scope_type,title:assignment.customer_title,
    description:conditionalBenefitDescription(assignment.customer_description,assignment.confidence_status),confidence:assignment.confidence_status,
    scopeLabel,quantity:Number(assignment.quantity),preferredRate:assignment.customer_rate??undefined,
    referenceRate:verified?assignment.reference_rate??undefined:undefined,currency:assignment.currency??undefined,rateUnit:assignment.rate_unit??undefined,
    verifiedSavings:verified?Number(assignment.verified_savings):0
  };
}

export const totalVerifiedSavings=(benefits:CustomerBenefit[])=>Math.round(benefits.reduce((sum,item)=>sum+Math.max(0,item.verifiedSavings),0)*100)/100;
