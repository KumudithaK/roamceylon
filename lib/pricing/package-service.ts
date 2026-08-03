import "server-only";
import {createAdminClient} from "@/lib/supabase/admin";
import {getRouteEstimate} from "@/lib/journey/route";
import {calculatePackageQuote} from "./package-engine";
import type {AdminPackageQuote,DmcPricingConfig,PackageQuoteRequest,SupplierCost} from "./package-types";
import type {Database} from "@/lib/database.types";

type ConfigRow=Database["public"]["Tables"]["tour_pricing_config"]["Row"];
type CostRow=Database["public"]["Tables"]["pricing_plans"]["Row"];

export class PackagePricingError extends Error{
  constructor(public code:"CONFIGURATION"|"INVALID_SELECTION"|"DATABASE",message:string){super(message);this.name="PackagePricingError"}
}

const numberOrNull=(value:unknown)=>typeof value==="number"&&Number.isFinite(value)?value:null;
const mapConfig=(row:ConfigRow):DmcPricingConfig=>({
  currency:row.currency,
  roomOccupancy:row.room_occupancy,
  childCostFactor:Number(row.child_cost_factor),
  routeDistanceBufferPercent:Number(row.route_distance_buffer_percent),
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
const unitFor=(row:CostRow):SupplierCost["unit"]=>{
  if(["per_night","per_room_night","per_villa"].includes(row.charging_method))return "per_room_night";
  if(["per_person","per_entry"].includes(row.charging_method))return "per_person";
  if(row.charging_method==="per_km")return "per_kilometre";
  if(row.charging_method==="per_airport_transfer")return "per_transfer";
  if(row.entity_type==="vehicle"&&row.charging_method==="per_day")return "per_vehicle_day";
  if(row.entity_type==="guide"&&["half_day","full_day","multi_day"].includes(row.charging_method))return "per_guide_day";
  return "fixed";
};
const mapCost=(row:CostRow):SupplierCost=>({id:row.id,entityType:row.entity_type,entityId:row.entity_id,category:row.name,unit:unitFor(row),amount:Number(row.price),partnerCommissionPercent:null});

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

    const entityIds=[...selection.selectedExperienceIds,...selection.selectedStayIds,...(selection.selectedVehicleId?[selection.selectedVehicleId]:[]),...(selection.selectedGuideId?[selection.selectedGuideId]:[])];
    const costsResult=entityIds.length?await database.from("pricing_plans").select("*").in("entity_id",entityIds).order("sort_order"):{data:[],error:null};
    if(costsResult.error)throw new PackagePricingError("DATABASE",costsResult.error.message);
    const grouped=new Map<string,CostRow[]>();
    const allPlans=costsResult.data??[];
    for(const row of allPlans.filter(item=>item.active)){
      const key=`${row.entity_type}:${row.entity_id}`;
      grouped.set(key,[...(grouped.get(key)??[]),row]);
    }
    const selectedEntities:Array<[SupplierCost["entityType"],string]>=[
      ...selection.selectedStayIds.map((id):[SupplierCost["entityType"],string]=>["accommodation",id]),
      ...selection.selectedExperienceIds.map((id):[SupplierCost["entityType"],string]=>["experience",id]),
      ...(selection.selectedVehicleId?[["vehicle",selection.selectedVehicleId] satisfies [SupplierCost["entityType"],string]]:[]),
      ...(selection.selectedGuideId?[["guide",selection.selectedGuideId] satisfies [SupplierCost["entityType"],string]]:[])
    ];
    for(const [type,id] of selectedEntities){
      const requestedId=selection.selectedPricingPlanIds[`${type}:${id}`];
      if(requestedId&&!allPlans.some(row=>row.id===requestedId&&row.entity_type===type&&row.entity_id===id))throw new PackagePricingError("INVALID_SELECTION","A selected pricing plan does not belong to its journey resource.");
    }
    const selectedPlans=[
      ...selectedEntities.flatMap(([type,id])=>{
        const rows=grouped.get(`${type}:${id}`)??[];
        const requestedId=selection.selectedPricingPlanIds[`${type}:${id}`];
        return requestedId?rows.filter(row=>row.id===requestedId):rows.slice(0,1);
      })
    ];
    const supplierCosts=selectedPlans.map(mapCost);
    const destinations=(destinationsResult.data??[]).map(item=>({...item,latitude:item.latitude===null?null:Number(item.latitude),longitude:item.longitude===null?null:Number(item.longitude)}));
    const route=getRouteEstimate(destinations,selection.selectedDestinationIds);
    const quote=calculatePackageQuote({config:mapConfig(configResult.data),supplierCosts,selection,durationDays:Math.max(1,route.estimatedTravelDays),distanceKm:route.estimatedDistance,adjustments:[]});
    if(quote.public.status==="requires_manual_quote"){
      const activeKeys=new Set(supplierCosts.map(item=>`${item.entityType}:${item.entityId}`));
      const inactiveKeys=new Set(allPlans.filter(item=>!item.active).map(item=>`${item.entity_type}:${item.entity_id}`));
      quote.public.inactiveRatesFor=[...new Set(selectedEntities.filter(([type,id])=>!activeKeys.has(`${type}:${id}`)&&inactiveKeys.has(`${type}:${id}`)).map(([type])=>type))];
    }
    return quote;
  }
}
