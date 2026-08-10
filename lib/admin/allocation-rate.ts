export const customJourneyRateValue="custom_journey_rate";

export const usesCustomJourneyRate=(details:Record<string,unknown>)=>details.customJourneyRate===true;

export const completeCustomJourneyRate=(input:{serviceName:string|null;quantity:number|null;quantityLabel:string|null;supplierCost:number|null})=>Boolean(
  input.serviceName?.trim()&&
  input.quantity!==null&&input.quantity>0&&
  input.quantityLabel?.trim()&&
  input.supplierCost!==null&&input.supplierCost>=0
);
