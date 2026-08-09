import type {DmcPricingConfig} from "./package-types";
import type {EstimateFactor,PublicJourneyEstimate} from "./journey-estimate-types";

export type EstimateComponentBound={category:string;minimum:number;maximum:number};
export type EstimateEnvelopeInput={
  currency:string;
  durationDays:number;
  adults:number;
  children:number;
  infants:number;
  components:EstimateComponentBound[];
  operationsCost:number;
  config:DmcPricingConfig;
  factors:EstimateFactor[];
  unavailableInputs:string[];
  estimatedAt?:string;
};

const configured=(value:number|null)=>typeof value==="number"&&Number.isFinite(value);
const tailoredMessage="Your journey includes preferences that require individual pricing. We'll carefully prepare the final cost as part of your Journey Proposal.";
const commercialConfigReady=(config:DmcPricingConfig)=>[config.administrationFixed,config.administrationPercent,config.contingencyPercent,config.serviceFeeFixed,config.serviceFeePercent,config.targetProfitMarginPercent].every(configured);
const sellingPrice=(supplierAndOperations:number,config:DmcPricingConfig)=>{
  const administration=config.administrationFixed!+supplierAndOperations*config.administrationPercent!/100;
  const contingency=(supplierAndOperations+administration)*config.contingencyPercent!/100;
  const internal=supplierAndOperations+administration+contingency;
  const service=config.serviceFeeFixed!+internal*config.serviceFeePercent!/100;
  return (internal+service)/(1-config.targetProfitMarginPercent!/100);
};
const incrementFor=(value:number)=>value>=1000?100:value>=500?50:value>=200?25:value>=100?10:5;
const outwardRange=(minimum:number,maximum:number,travellers:number)=>{
  const perPersonMin=minimum/travellers,perPersonMax=maximum/travellers;
  const increment=incrementFor((perPersonMin+perPersonMax)/2);
  return {
    perPersonMin:Math.floor(perPersonMin/increment)*increment,
    perPersonMax:Math.ceil(perPersonMax/increment)*increment,
    totalMin:Math.floor(minimum/(increment*travellers))*increment*travellers,
    totalMax:Math.ceil(maximum/(increment*travellers))*increment*travellers
  };
};

export function calculateJourneyEstimateRange(input:EstimateEnvelopeInput):PublicJourneyEstimate{
  const estimatedAt=input.estimatedAt??new Date().toISOString();
  const unavailable=[...new Set([
    ...input.unavailableInputs,
    ...(input.adults<1?["adult traveller count"]:[]),
    ...(input.children>0||input.infants>0?["verified child and infant pricing"]:[]),
    ...(!commercialConfigReady(input.config)?["business pricing settings"]:[]),
    ...(!input.components.length?["priced journey components"]:[])
  ])];
  const tailored=(reasons=unavailable):PublicJourneyEstimate=>({status:"tailored",currency:input.currency,basis:"per_person",perPersonMin:null,perPersonMax:null,totalMin:null,totalMax:null,durationDays:input.durationDays,estimatedAt,factors:input.factors,message:tailoredMessage,context:{version:1,pricedComponents:input.components.map(item=>item.category),unavailableInputs:reasons}});
  if(unavailable.length)return tailored();
  const invalid=input.components.some(item=>!Number.isFinite(item.minimum)||!Number.isFinite(item.maximum)||item.minimum<0||item.maximum<item.minimum);
  if(invalid)return tailored(["valid pricing bounds"]);
  const supplierMin=input.components.reduce((sum,item)=>sum+item.minimum,0)+input.operationsCost;
  const supplierMax=input.components.reduce((sum,item)=>sum+item.maximum,0)+input.operationsCost;
  const minimum=sellingPrice(supplierMin,input.config),maximum=sellingPrice(supplierMax,input.config);
  if(!Number.isFinite(minimum)||!Number.isFinite(maximum)||maximum<=minimum)return tailored(["a meaningful supplier price range"]);
  const range=outwardRange(minimum,maximum,input.adults);
  if(range.perPersonMax<=range.perPersonMin)return tailored(["a meaningful supplier price range"]);
  return {status:"estimated_range",currency:input.currency,basis:"per_person",...range,durationDays:input.durationDays,estimatedAt,factors:input.factors,message:"Final pricing will be confirmed in your personalised Journey Proposal after availability and supplier rates are reviewed.",context:{version:1,pricedComponents:input.components.map(item=>item.category),unavailableInputs:[]}};
}

export const journeyEstimateTailoredMessage=tailoredMessage;
