import type {Json} from "@/lib/database.types";

export type AllocationCommercialConfig={
  driverSalaryPerDay:number;fuelPricePerLitre:number;vehicleKmPerLitre:number;tollsPerJourney:number;parkingPerDay:number;
  guideAccommodationPerNight:number;administrationFixed:number;administrationPercent:number;contingencyPercent:number;
  serviceFeeFixed:number;serviceFeePercent:number;targetProfitMarginPercent:number;routeDistanceBufferPercent:number;
};
export type AllocationCommercialLine={type:"accommodation"|"guide"|"vehicle"|"experience";supplierCost:number|null;sellingPrice:number|null;pricingPlanSnapshot:Json;serviceDetails:Json;confirmationStatus:string};
export type AllocationCommercialBreakdown={key:string;label:string;amount:number;category:"supplier"|"operations"|"administration"|"contingency"|"service_fee"|"commercial_floor";internal:boolean};
export type AllocationCommercialResult={totalSupplierCost:number;manualSellingFloor:number;operationsCost:number;administrationFee:number;contingency:number;serviceFee:number;internalCost:number;totalSellingPrice:number;grossProfit:number;profitMargin:number;incompleteLines:number;breakdown:AllocationCommercialBreakdown[]};
export type AllocationCommercialOverrides={
  driverOperations?:number|null;fuel?:number|null;tolls?:number|null;parking?:number|null;guideAccommodation?:number|null;
  administration?:number|null;contingency?:number|null;
};

const money=(value:number)=>Math.round((value+1e-9)*100)/100;
const record=(value:Json):Record<string,Json|undefined>=>value&&typeof value==="object"&&!Array.isArray(value)?value:{};
const flag=(value:Json,key:string)=>record(value)[key]===true;

export function calculateAllocationCommercials(lines:AllocationCommercialLine[],config:AllocationCommercialConfig,context:{days:number;nights:number;distanceKm:number},overrides:AllocationCommercialOverrides={}):AllocationCommercialResult{
  const active=lines.filter(line=>line.confirmationStatus!=="cancelled");
  const totalSupplierCost=money(active.reduce((sum,line)=>sum+(line.supplierCost??0),0));
  const manualSellingFloor=money(active.reduce((sum,line)=>sum+(line.sellingPrice??0),0));
  const incompleteLines=active.filter(line=>line.supplierCost===null).length;
  const vehicles=active.filter(line=>line.type==="vehicle");
  const guides=active.filter(line=>line.type==="guide");
  const days=Math.max(1,context.days),nights=Math.max(0,context.nights);
  const distance=Math.max(0,context.distanceKm)*(1+Math.max(0,config.routeDistanceBufferPercent)/100);
  const vehicleIncludes=(key:string)=>vehicles.length>0&&vehicles.every(line=>{
    const details=record(line.pricingPlanSnapshot).details;
    return flag(details??{},key)||flag(line.serviceDetails,key);
  });
  const amount=(override:number|null|undefined,fallback:number)=>override===null||override===undefined?fallback:Math.max(0,override);
  const operations:Array<[string,string,number,boolean]>=[
    ["driver-salary","Driver operations",amount(overrides.driverOperations,config.driverSalaryPerDay*days),vehicles.length>0&&!vehicleIncludes("driverIncluded")||overrides.driverOperations!==null&&overrides.driverOperations!==undefined],
    ["fuel","Journey fuel",amount(overrides.fuel,config.vehicleKmPerLitre>0?distance/config.vehicleKmPerLitre*config.fuelPricePerLitre:0),vehicles.length>0&&!vehicleIncludes("fuelIncluded")||overrides.fuel!==null&&overrides.fuel!==undefined],
    ["tolls","Road tolls",amount(overrides.tolls,config.tollsPerJourney),vehicles.length>0&&!vehicleIncludes("tollsIncluded")||overrides.tolls!==null&&overrides.tolls!==undefined],
    ["parking","Journey parking",amount(overrides.parking,config.parkingPerDay*days),vehicles.length>0&&!vehicleIncludes("parkingIncluded")||overrides.parking!==null&&overrides.parking!==undefined],
    ["guide-accommodation","Guide accommodation",amount(overrides.guideAccommodation,config.guideAccommodationPerNight*nights),guides.length>0&&!guides.every(line=>flag(line.serviceDetails,"accommodationIncluded"))||overrides.guideAccommodation!==null&&overrides.guideAccommodation!==undefined]
  ];
  const breakdown:AllocationCommercialBreakdown[]=[{key:"supplier",label:"Allocated supplier services",amount:totalSupplierCost,category:"supplier",internal:true}];
  for(const [key,label,amount,needed] of operations)if(needed&&amount>0)breakdown.push({key,label,amount:money(amount),category:"operations",internal:true});
  const operationsCost=money(breakdown.filter(line=>line.category==="operations").reduce((sum,line)=>sum+line.amount,0));
  const direct=totalSupplierCost+operationsCost;
  const administrationFee=money(amount(overrides.administration,config.administrationFixed+direct*config.administrationPercent/100));
  const contingency=money(amount(overrides.contingency,(direct+administrationFee)*config.contingencyPercent/100));
  const internalCost=money(direct+administrationFee+contingency);
  const serviceFee=money(config.serviceFeeFixed+internalCost*config.serviceFeePercent/100);
  const margin=Math.min(99.99,Math.max(0,config.targetProfitMarginPercent));
  const calculatedSelling=money((internalCost+serviceFee)/(1-margin/100));
  const totalSellingPrice=money(Math.max(calculatedSelling,manualSellingFloor));
  const floorAdjustment=money(Math.max(0,manualSellingFloor-calculatedSelling));
  breakdown.push({key:"administration",label:"Administration",amount:administrationFee,category:"administration",internal:true});
  breakdown.push({key:"contingency",label:"Journey contingency",amount:contingency,category:"contingency",internal:true});
  breakdown.push({key:"service-fee",label:"Roam Ceylon service fee",amount:serviceFee,category:"service_fee",internal:false});
  if(floorAdjustment)breakdown.push({key:"commercial-floor",label:"Approved commercial uplift",amount:floorAdjustment,category:"commercial_floor",internal:false});
  const grossProfit=money(totalSellingPrice-internalCost);
  return {totalSupplierCost,manualSellingFloor,operationsCost,administrationFee,contingency,serviceFee,internalCost,totalSellingPrice,grossProfit,profitMargin:totalSellingPrice?money(grossProfit/totalSellingPrice*100):0,incompleteLines,breakdown};
}
