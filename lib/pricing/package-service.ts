import "server-only";
import {createAdminClient} from "@/lib/supabase/admin";
import {getRouteEstimate} from "@/lib/journey/route";
import {calculatePackageQuote} from "./package-engine";
import type {AdminPackageQuote,DmcPricingConfig,PackageQuoteRequest,SupplierCost} from "./package-types";
import type {Database} from "@/lib/database.types";

type ConfigRow=Database["public"]["Tables"]["tour_pricing_config"]["Row"];
type CostRow=Database["public"]["Tables"]["tour_supplier_costs"]["Row"];

export class PackagePricingError extends Error{
  constructor(public code:"CONFIGURATION"|"INVALID_SELECTION"|"DATABASE",message:string){super(message);this.name="PackagePricingError"}
}

const numberOrNull=(value:unknown)=>typeof value==="number"&&Number.isFinite(value)?value:null;
const mapConfig=(row:ConfigRow):DmcPricingConfig=>({
  currency:row.currency,
  roomOccupancy:row.room_occupancy,
  childCostFactor:Number(row.child_cost_factor),
  driverSalaryPerDay:numberOrNull(row.driver_salary_per_day),
  fuelPricePerLitre:numberOrNull(row.fuel_price_per_litre),
  vehicleKmPerLitre:numberOrNull(row.vehicle_km_per_litre),
  tollsPerJourney:numberOrNull(row.tolls_per_journey),
  parkingPerDay:numberOrNull(row.parking_per_day),
  guideAccommodationPerNight:numberOrNull(row.guide_accommodation_per_night),
  airportTransferEachWay:numberOrNull(row.airport_transfer_each_way),
  administrationFixed:numberOrNull(row.administration_fixed),
  administrationPercent:numberOrNull(row.administration_percent),
  contingencyPercent:numberOrNull(row.contingency_percent),
  serviceFeeFixed:numberOrNull(row.service_fee_fixed),
  serviceFeePercent:numberOrNull(row.service_fee_percent),
  targetProfitMarginPercent:numberOrNull(row.target_profit_margin_percent)
});
const mapCost=(row:CostRow):SupplierCost=>({id:row.id,entityType:row.entity_type,entityId:row.entity_id,category:row.cost_category,unit:row.unit,amount:Number(row.amount),partnerCommissionPercent:numberOrNull(row.partner_commission_percent)});

export class PackagePricingService{
  async quote(selection:PackageQuoteRequest):Promise<AdminPackageQuote>{
    const database=createAdminClient();
    if(!database)throw new PackagePricingError("CONFIGURATION","Server-side Supabase credentials are not configured.");
    const [configResult,destinationsResult,experiencesResult,staysResult,vehicleResult,guideResult]=await Promise.all([
      database.from("tour_pricing_config").select("*").eq("id",true).eq("active",true).single(),
      selection.selectedDestinationIds.length?database.from("destinations").select("id,slug,name,latitude,longitude").in("id",selection.selectedDestinationIds).eq("status","published").eq("active",true):Promise.resolve({data:[],error:null}),
      selection.selectedExperienceIds.length?database.from("experiences").select("id").in("id",selection.selectedExperienceIds).eq("status","published").eq("active",true):Promise.resolve({data:[],error:null}),
      selection.selectedStayIds.length?database.from("accommodations").select("id").in("id",selection.selectedStayIds).eq("status","published").eq("active",true).eq("is_sample",false):Promise.resolve({data:[],error:null}),
      selection.selectedVehicleId?database.from("vehicles").select("id").eq("id",selection.selectedVehicleId).eq("status","published").eq("active",true).eq("is_sample",false).maybeSingle():Promise.resolve({data:null,error:null}),
      selection.selectedGuideId?database.from("guides").select("id").eq("id",selection.selectedGuideId).eq("status","published").eq("active",true).eq("is_sample",false).maybeSingle():Promise.resolve({data:null,error:null})
    ]);
    const firstError=[configResult,destinationsResult,experiencesResult,staysResult,vehicleResult,guideResult].find(result=>result.error)?.error;
    if(firstError)throw new PackagePricingError("DATABASE",firstError.message);
    if(!configResult.data)throw new PackagePricingError("CONFIGURATION","Tour pricing configuration is unavailable.");
    const invalid=
      (destinationsResult.data?.length??0)!==selection.selectedDestinationIds.length||
      (experiencesResult.data?.length??0)!==selection.selectedExperienceIds.length||
      (staysResult.data?.length??0)!==selection.selectedStayIds.length||
      Boolean(selection.selectedVehicleId)!==Boolean(vehicleResult.data)||
      Boolean(selection.selectedGuideId)!==Boolean(guideResult.data);
    if(invalid)throw new PackagePricingError("INVALID_SELECTION","The quote contains unavailable or unpublished selections.");

    const entityIds=[...selection.selectedDestinationIds,...selection.selectedExperienceIds,...selection.selectedStayIds,...(selection.selectedVehicleId?[selection.selectedVehicleId]:[]),...(selection.selectedGuideId?[selection.selectedGuideId]:[])];
    const costsResult=entityIds.length?await database.from("tour_supplier_costs").select("*").in("entity_id",entityIds).eq("active",true):{data:[],error:null};
    if(costsResult.error)throw new PackagePricingError("DATABASE",costsResult.error.message);
    const today=new Date().toISOString().slice(0,10);
    const supplierCosts=(costsResult.data??[]).filter(row=>(!row.valid_from||row.valid_from<=today)&&(!row.valid_to||row.valid_to>=today)).map(mapCost);
    const destinations=(destinationsResult.data??[]).map(item=>({...item,latitude:item.latitude===null?null:Number(item.latitude),longitude:item.longitude===null?null:Number(item.longitude)}));
    const route=getRouteEstimate(destinations,selection.selectedDestinationIds);
    return calculatePackageQuote({config:mapConfig(configResult.data),supplierCosts,selection,durationDays:Math.max(1,route.estimatedTravelDays),distanceKm:route.estimatedDistance,adjustments:[]});
  }
}
