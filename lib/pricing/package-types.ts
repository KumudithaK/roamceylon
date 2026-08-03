import type {ParticipantCounts} from "@/lib/types";

export type PackageQuoteRequest={
  selectedDestinationIds:string[];
  selectedExperienceIds:string[];
  selectedStayIds:string[];
  selectedVehicleId:string|null;
  selectedGuideId:string|null;
  selectedPricingPlanIds:Record<string,string>;
  travelDates:{start:string;end:string};
  travellerCounts:ParticipantCounts;
  experienceParticipants:Record<string,ParticipantCounts>;
};

export type SupplierEntityType="accommodation"|"vehicle"|"guide"|"experience"|"destination";
export type SupplierCostUnit="per_room_night"|"per_vehicle_day"|"per_kilometre"|"per_guide_day"|"per_person"|"per_transfer"|"fixed";
export type SupplierCost={
  id:string;
  entityType:SupplierEntityType;
  entityId:string;
  category:string;
  unit:SupplierCostUnit;
  amount:number;
  partnerCommissionPercent:number|null;
};

export type DmcPricingConfig={
  currency:string;
  roomOccupancy:number;
  childCostFactor:number;
  routeDistanceBufferPercent:number;
  driverSalaryPerDay:number|null;
  fuelPricePerLitre:number|null;
  vehicleKmPerLitre:number|null;
  tollsPerJourney:number|null;
  parkingPerDay:number|null;
  guideAccommodationPerNight:number|null;
  airportTransferEachWay:number|null;
  administrationFixed:number|null;
  administrationPercent:number|null;
  contingencyPercent:number|null;
  serviceFeeFixed:number|null;
  serviceFeePercent:number|null;
  targetProfitMarginPercent:number|null;
};

export type PricingAdjustment={
  id:string;
  label:string;
  stage:"internal_cost"|"selling_price";
  method:"fixed"|"percent";
  value:number;
  kind:"seasonal"|"discount"|"coupon"|"partner_commission"|"other";
};

export type CostBreakdownLine={
  key:string;
  label:string;
  category:"supplier"|"operations"|"administration"|"contingency"|"service_fee"|"adjustment";
  amount:number;
  internal:boolean;
};

export type PublicPackageQuote={
  status:"ready"|"requires_manual_quote";
  currency:string;
  totalPackagePrice:number|null;
  pricePerPerson:number|null;
  estimatedDailyCost:number|null;
  components?:Array<{
    category:"accommodation"|"transport"|"experiences"|"guide";
    label:string;
    amount:number;
  }>;
  requiresRatesFor?:SupplierEntityType[];
  inactiveRatesFor?:SupplierEntityType[];
  configurationPending?:boolean;
};

export type AdminPackageQuote={
  public:PublicPackageQuote;
  internalCost:number|null;
  sellingPrice:number|null;
  grossProfit:number|null;
  profitMargin:number|null;
  breakdown:CostBreakdownLine[];
  missingInputs:string[];
  durationDays:number;
  nights:number;
  distanceKm:number;
  travellerUnits:number;
};

export type PackagePricingContext={
  config:DmcPricingConfig;
  supplierCosts:SupplierCost[];
  adjustments?:PricingAdjustment[];
  selection:PackageQuoteRequest;
  durationDays:number;
  distanceKm:number;
};
