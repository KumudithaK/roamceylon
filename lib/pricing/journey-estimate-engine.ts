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

const configured=(value:unknown)=>typeof value==="number"&&Number.isFinite(value);
const tailoredMessage="We need a little more journey detail before we can show a dependable planning range. Your journey designer will confirm the final investment in your Journey Proposal.";
const commercialConfigReady=(config:DmcPricingConfig)=>[config.administrationFixed,config.administrationPercent,config.contingencyPercent,config.serviceFeeFixed,config.serviceFeePercent,config.targetProfitMarginPercent,config.estimateLowerBufferPercent,config.estimateUpperBufferPercent].every(configured);
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
    ...(input.infants>0?["verified infant pricing"]:[]),
    ...(!commercialConfigReady(input.config)?["business pricing settings"]:[]),
    ...(!input.components.length?["priced journey components"]:[])
  ])];
  const tailored=(reasons=unavailable):PublicJourneyEstimate=>({status:"tailored",currency:input.currency,basis:"per_person",perPersonMin:null,perPersonMax:null,totalMin:null,totalMax:null,durationDays:input.durationDays,estimatedAt,factors:input.factors,message:tailoredMessage,context:{version:1,pricedComponents:input.components.map(item=>item.category),unavailableInputs:reasons}});
  if(unavailable.length)return tailored();
  const invalid=input.components.some(item=>!Number.isFinite(item.minimum)||!Number.isFinite(item.maximum)||item.minimum<0||item.maximum<item.minimum);
  if(invalid)return tailored(["valid pricing bounds"]);
  const supplierMin=(input.components.reduce((sum,item)=>sum+item.minimum,0)+input.operationsCost)*(1-input.config.estimateLowerBufferPercent!/100);
  const supplierMax=(input.components.reduce((sum,item)=>sum+item.maximum,0)+input.operationsCost)*(1+input.config.estimateUpperBufferPercent!/100);
  const minimum=sellingPrice(supplierMin,input.config),maximum=sellingPrice(supplierMax,input.config);
  if(!Number.isFinite(minimum)||!Number.isFinite(maximum)||maximum<=minimum)return tailored(["a meaningful supplier price range"]);
  const travellerCount=input.adults+input.children;
  const range=outwardRange(minimum,maximum,travellerCount);
  if(range.perPersonMax<=range.perPersonMin)return tailored(["a meaningful supplier price range"]);
  return {status:"estimated_range",currency:input.currency,basis:"per_person",...range,durationDays:input.durationDays,estimatedAt,factors:input.factors,message:"Your final Journey Proposal is expected to remain within this planning range after availability is reviewed. If an exceptional change is needed, your journey designer will explain it clearly.",context:{version:1,pricedComponents:input.components.map(item=>item.category),unavailableInputs:[]}};
}

export const journeyEstimateTailoredMessage=tailoredMessage;
