import type {AdminPackageQuote,CostBreakdownLine,DmcPricingConfig,PackagePricingContext,PricingAdjustment,PublicPackageQuote,SupplierCostUnit,SupplierEntityType} from "./package-types";

const money=(value:number)=>Math.round((value+Number.EPSILON)*100)/100;
const configured=(value:number|null)=>typeof value==="number"&&Number.isFinite(value);
const duration=(start:string,end:string,fallback:number)=>{
  const from=new Date(`${start}T00:00:00Z`).getTime();
  const to=new Date(`${end}T00:00:00Z`).getTime();
  return start&&end&&Number.isFinite(from)&&Number.isFinite(to)&&to>from?Math.ceil((to-from)/86_400_000):Math.max(1,fallback);
};
const adjustmentAmount=(base:number,adjustment:PricingAdjustment)=>adjustment.method==="fixed"?adjustment.value:base*adjustment.value/100;
const applyAdjustments=(base:number,adjustments:PricingAdjustment[],stage:PricingAdjustment["stage"])=>adjustments.filter(item=>item.stage===stage).reduce((total,item)=>total+adjustmentAmount(total,item),base);
const publicLabels={accommodation:"Accommodation",transport:"Private transport",experiences:"Experiences",guide:"Local guide"} as const;

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
    ["driverSalaryPerDay",vehicleSelected],
    ["fuelPricePerLitre",vehicleSelected],["vehicleKmPerLitre",vehicleSelected],
    ["tollsPerJourney",vehicleSelected],["parkingPerDay",vehicleSelected],
    ["guideAccommodationPerNight",guideSelected]
  ];
  return required.filter(([key,needed])=>needed&&!configured(config[key] as number|null)).map(([key])=>String(key));
};

export function calculatePackageQuote(context:PackagePricingContext):AdminPackageQuote{
  const {config,selection,supplierCosts}=context;
  const billableSupplierCosts=supplierCosts.filter(item=>item.entityType!=="destination");
  const days=duration(selection.travelDates.start,selection.travelDates.end,Math.max(1,selection.selectedDestinationIds.length));
  const nights=Math.max(0,days-1);
  const travellerUnits=selection.travellerCounts.adults+selection.travellerCounts.children*config.childCostFactor;
  const rooms=Math.max(1,Math.ceil((selection.travellerCounts.adults+selection.travellerCounts.children)/config.roomOccupancy));
  const pricedDistance=context.distanceKm*(1+config.routeDistanceBufferPercent/100);
  const missingInputs=requireConfig(config,Boolean(selection.selectedVehicleId),Boolean(selection.selectedGuideId));
  const requiredEntities=[
    ...selection.selectedStayIds.map(id=>`accommodation:${id}`),
    ...selection.selectedExperienceIds.map(id=>`experience:${id}`),
    ...(selection.selectedVehicleId?[`vehicle:${selection.selectedVehicleId}`]:[]),
    ...(selection.selectedGuideId?[`guide:${selection.selectedGuideId}`]:[])
  ];
  const costEntities=new Set(billableSupplierCosts.map(item=>`${item.entityType}:${item.entityId}`));
  missingInputs.push(...requiredEntities.filter(key=>!costEntities.has(key)).map(key=>`supplierCost:${key}`));

  const quantities={rooms,nights,days,distance:pricedDistance,travellerUnits,stayCount:selection.selectedStayIds.length};
  const quantityForCost=(item:{entityType:SupplierEntityType;entityId:string;unit:SupplierCostUnit})=>{
    const experienceCounts=item.entityType==="experience"?selection.experienceParticipants[item.entityId]:null;
    const itemTravellerUnits=experienceCounts?experienceCounts.adults+experienceCounts.children*config.childCostFactor:travellerUnits;
    return quantityFor(item.unit,{...quantities,travellerUnits:itemTravellerUnits});
  };
  const breakdown:CostBreakdownLine[]=billableSupplierCosts.map(item=>({
    key:`supplier:${item.id}`,
    label:item.category,
    category:"supplier",
    amount:money(item.amount*quantityForCost(item)),
    internal:true
  }));
  const operational:Array<[string,string,number|null,boolean]>=[
    ["driver-salary","Driver salary",configured(config.driverSalaryPerDay)?config.driverSalaryPerDay!*days:null,Boolean(selection.selectedVehicleId)],
    ["fuel","Fuel",configured(config.fuelPricePerLitre)&&configured(config.vehicleKmPerLitre)?pricedDistance/config.vehicleKmPerLitre!*config.fuelPricePerLitre!:null,Boolean(selection.selectedVehicleId)],
    ["tolls","Tolls",config.tollsPerJourney,Boolean(selection.selectedVehicleId)],
    ["parking","Parking",configured(config.parkingPerDay)?config.parkingPerDay!*days:null,Boolean(selection.selectedVehicleId)],
    ["guide-accommodation","Guide accommodation",configured(config.guideAccommodationPerNight)?config.guideAccommodationPerNight!*nights:null,Boolean(selection.selectedGuideId)]
  ];
  breakdown.push(...operational.filter(([, , ,needed])=>needed).filter(([, ,amount])=>amount!==null).map(([key,label,amount])=>({key,label,category:"operations" as const,amount:money(amount!),internal:true})));

  if(missingInputs.length){
    const requiresRatesFor=[...new Set(missingInputs.filter(item=>item.startsWith("supplierCost:")).map(item=>item.split(":")[1] as SupplierEntityType))];
    const publicQuote:PublicPackageQuote={status:"requires_manual_quote",currency:config.currency,totalPackagePrice:null,pricePerPerson:null,estimatedDailyCost:null,requiresRatesFor,configurationPending:missingInputs.some(item=>!item.startsWith("supplierCost:"))};
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
  breakdown.push({key:"service-fee",label:"The Ceylon Edition service fee",category:"service_fee",amount:money(serviceFee),internal:false});
  const beforeMargin=internalCost+serviceFee;
  const sellingBeforeAdjustments=beforeMargin/(1-config.targetProfitMarginPercent!/100);
  const sellingPrice=money(applyAdjustments(sellingBeforeAdjustments,adjustments,"selling_price"));
  const grossProfit=money(sellingPrice-internalCost);
  const profitMargin=sellingPrice?money(grossProfit/sellingPrice*100):0;
  for(const item of adjustments)breakdown.push({key:`adjustment:${item.id}`,label:item.label,category:"adjustment",amount:money(adjustmentAmount(item.stage==="internal_cost"?internalBeforeAdjustments:sellingBeforeAdjustments,item)),internal:item.stage==="internal_cost"});
  const travellers=Math.max(1,selection.travellerCounts.adults+selection.travellerCounts.children+selection.travellerCounts.infants);
  const componentCosts={accommodation:0,transport:0,experiences:0,guide:0};
  for(const item of billableSupplierCosts){
    const amount=item.amount*quantityForCost(item);
    if(item.entityType==="accommodation")componentCosts.accommodation+=amount;
    else if(item.entityType==="vehicle")componentCosts.transport+=amount;
    else if(item.entityType==="guide")componentCosts.guide+=amount;
    else if(item.entityType==="experience")componentCosts.experiences+=amount;
  }
  for(const item of breakdown.filter(line=>line.category==="operations")){
    if(item.key==="guide-accommodation")componentCosts.guide+=item.amount;
    else componentCosts.transport+=item.amount;
  }
  const components=(Object.entries(componentCosts) as Array<[keyof typeof componentCosts,number]>)
    .filter(([,amount])=>amount>0)
    .map(([category,amount])=>({category,label:publicLabels[category],amount:money(amount)}));
  const publicQuote:PublicPackageQuote={status:"ready",currency:config.currency,totalPackagePrice:sellingPrice,pricePerPerson:money(sellingPrice/travellers),estimatedDailyCost:money(sellingPrice/days),components};
  return {public:publicQuote,internalCost,sellingPrice,grossProfit,profitMargin,breakdown,missingInputs:[],durationDays:days,nights,distanceKm:context.distanceKm,travellerUnits};
}
