import type {AdminPackageQuote,CostBreakdownLine,DmcPricingConfig,PackagePricingContext,PricingAdjustment,PublicPackageQuote,SupplierCostUnit} from "./package-types";

const money=(value:number)=>Math.round((value+Number.EPSILON)*100)/100;
const configured=(value:number|null)=>typeof value==="number"&&Number.isFinite(value);
const duration=(start:string,end:string,fallback:number)=>{
  const from=new Date(`${start}T00:00:00Z`).getTime();
  const to=new Date(`${end}T00:00:00Z`).getTime();
  return start&&end&&Number.isFinite(from)&&Number.isFinite(to)&&to>from?Math.ceil((to-from)/86_400_000):Math.max(1,fallback);
};
const adjustmentAmount=(base:number,adjustment:PricingAdjustment)=>adjustment.method==="fixed"?adjustment.value:base*adjustment.value/100;
const applyAdjustments=(base:number,adjustments:PricingAdjustment[],stage:PricingAdjustment["stage"])=>adjustments.filter(item=>item.stage===stage).reduce((total,item)=>total+adjustmentAmount(total,item),base);

const quantityFor=(unit:SupplierCostUnit,{rooms,nights,days,distance,travellerUnits,stayCount}:{rooms:number;nights:number;days:number;distance:number;travellerUnits:number;stayCount:number})=>({
  per_room_night:rooms*nights/Math.max(1,stayCount),
  per_vehicle_day:days,
  per_kilometre:distance,
  per_guide_day:days,
  per_person:travellerUnits,
  per_transfer:2,
  fixed:1
})[unit];

const requireConfig=(config:DmcPricingConfig,vehicleSelected:boolean,guideSelected:boolean)=>{
  const required:Array<[keyof DmcPricingConfig,boolean]>=[
    ["administrationFixed",true],["administrationPercent",true],["contingencyPercent",true],
    ["serviceFeeFixed",true],["serviceFeePercent",true],["targetProfitMarginPercent",true],
    ["airportTransferEachWay",true],["driverSalaryPerDay",vehicleSelected],
    ["fuelPricePerLitre",vehicleSelected],["vehicleKmPerLitre",vehicleSelected],
    ["tollsPerJourney",vehicleSelected],["parkingPerDay",vehicleSelected],
    ["guideAccommodationPerNight",guideSelected]
  ];
  return required.filter(([key,needed])=>needed&&!configured(config[key] as number|null)).map(([key])=>String(key));
};

export function calculatePackageQuote(context:PackagePricingContext):AdminPackageQuote{
  const {config,selection,supplierCosts}=context;
  const days=duration(selection.travelDates.start,selection.travelDates.end,Math.max(1,selection.selectedDestinationIds.length));
  const nights=Math.max(0,days-1);
  const travellerUnits=selection.travellerCounts.adults+selection.travellerCounts.children*config.childCostFactor;
  const rooms=Math.max(1,Math.ceil((selection.travellerCounts.adults+selection.travellerCounts.children)/config.roomOccupancy));
  const missingInputs=requireConfig(config,Boolean(selection.selectedVehicleId),Boolean(selection.selectedGuideId));
  const requiredEntities=[
    ...selection.selectedStayIds.map(id=>`accommodation:${id}`),
    ...selection.selectedExperienceIds.map(id=>`experience:${id}`),
    ...(selection.selectedVehicleId?[`vehicle:${selection.selectedVehicleId}`]:[]),
    ...(selection.selectedGuideId?[`guide:${selection.selectedGuideId}`]:[])
  ];
  const costEntities=new Set(supplierCosts.map(item=>`${item.entityType}:${item.entityId}`));
  missingInputs.push(...requiredEntities.filter(key=>!costEntities.has(key)).map(key=>`supplierCost:${key}`));

  const quantities={rooms,nights,days,distance:context.distanceKm,travellerUnits,stayCount:selection.selectedStayIds.length};
  const breakdown:CostBreakdownLine[]=supplierCosts.map(item=>({
    key:`supplier:${item.id}`,
    label:item.category,
    category:"supplier",
    amount:money(item.amount*quantityFor(item.unit,quantities)),
    internal:true
  }));
  const operational:Array<[string,string,number|null,boolean]>=[
    ["driver-salary","Driver salary",configured(config.driverSalaryPerDay)?config.driverSalaryPerDay!*days:null,Boolean(selection.selectedVehicleId)],
    ["fuel","Fuel",configured(config.fuelPricePerLitre)&&configured(config.vehicleKmPerLitre)?context.distanceKm/config.vehicleKmPerLitre!*config.fuelPricePerLitre!:null,Boolean(selection.selectedVehicleId)],
    ["tolls","Tolls",config.tollsPerJourney,Boolean(selection.selectedVehicleId)],
    ["parking","Parking",configured(config.parkingPerDay)?config.parkingPerDay!*days:null,Boolean(selection.selectedVehicleId)],
    ["guide-accommodation","Guide accommodation",configured(config.guideAccommodationPerNight)?config.guideAccommodationPerNight!*nights:null,Boolean(selection.selectedGuideId)],
    ["airport-transfers","Airport transfers",configured(config.airportTransferEachWay)?config.airportTransferEachWay!*2:null,true]
  ];
  breakdown.push(...operational.filter(([, , ,needed])=>needed).filter(([, ,amount])=>amount!==null).map(([key,label,amount])=>({key,label,category:"operations" as const,amount:money(amount!),internal:true})));

  if(missingInputs.length){
    const publicQuote:PublicPackageQuote={status:"requires_manual_quote",currency:config.currency,totalPackagePrice:null,pricePerPerson:null,estimatedDailyCost:null};
    return {public:publicQuote,internalCost:null,sellingPrice:null,grossProfit:null,profitMargin:null,breakdown,missingInputs:[...new Set(missingInputs)],durationDays:days,nights,distanceKm:context.distanceKm,travellerUnits};
  }

  const directCost=breakdown.reduce((total,line)=>total+line.amount,0);
  const adminFee=config.administrationFixed!+directCost*config.administrationPercent!/100;
  breakdown.push({key:"administration",label:"Administration fee",category:"administration",amount:money(adminFee),internal:true});
  const contingency=(directCost+adminFee)*config.contingencyPercent!/100;
  breakdown.push({key:"contingency",label:"Contingency",category:"contingency",amount:money(contingency),internal:true});
  const internalBeforeAdjustments=directCost+adminFee+contingency;
  const adjustments=context.adjustments??[];
  const internalCost=money(applyAdjustments(internalBeforeAdjustments,adjustments,"internal_cost"));
  const serviceFee=config.serviceFeeFixed!+internalCost*config.serviceFeePercent!/100;
  breakdown.push({key:"service-fee",label:"Roam Ceylon service fee",category:"service_fee",amount:money(serviceFee),internal:false});
  const beforeMargin=internalCost+serviceFee;
  const sellingBeforeAdjustments=beforeMargin/(1-config.targetProfitMarginPercent!/100);
  const sellingPrice=money(applyAdjustments(sellingBeforeAdjustments,adjustments,"selling_price"));
  const grossProfit=money(sellingPrice-internalCost);
  const profitMargin=sellingPrice?money(grossProfit/sellingPrice*100):0;
  for(const item of adjustments)breakdown.push({key:`adjustment:${item.id}`,label:item.label,category:"adjustment",amount:money(adjustmentAmount(item.stage==="internal_cost"?internalBeforeAdjustments:sellingBeforeAdjustments,item)),internal:item.stage==="internal_cost"});
  const travellers=Math.max(1,selection.travellerCounts.adults+selection.travellerCounts.children);
  const publicQuote:PublicPackageQuote={status:"ready",currency:config.currency,totalPackagePrice:sellingPrice,pricePerPerson:money(sellingPrice/travellers),estimatedDailyCost:money(sellingPrice/days)};
  return {public:publicQuote,internalCost,sellingPrice,grossProfit,profitMargin,breakdown,missingInputs:[],durationDays:days,nights,distanceKm:context.distanceKm,travellerUnits};
}
