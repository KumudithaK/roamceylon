import "server-only";
import {createAdminClient} from "@/lib/supabase/admin";
import {completeJourneyLegs,effectiveTravelPreference,type TravelPreference} from "@/lib/journey/travel-preferences";
import {endpointRouteLocation} from "@/lib/journey/journey-endpoints";
import {getRouteEstimate,type RouteDestination} from "@/lib/journey/route";
import {mapPricingConfig,PackagePricingError} from "./package-service";
import {calculateJourneyEstimateRange,type EstimateComponentBound} from "./journey-estimate-engine";
import type {JourneyEstimateRequest,PublicJourneyEstimate} from "./journey-estimate-types";
import type {Database,Json} from "@/lib/database.types";

type Plan=Database["public"]["Tables"]["pricing_plans"]["Row"];
type Accommodation=Database["public"]["Tables"]["accommodations"]["Row"];
type Vehicle=Database["public"]["Tables"]["vehicles"]["Row"];
type Guide=Database["public"]["Tables"]["guides"]["Row"];
type Destination=Database["public"]["Tables"]["destinations"]["Row"];
type EstimateBand=Database["public"]["Tables"]["journey_estimate_bands"]["Row"];
const strings=(value:Json)=>Array.isArray(value)?value.filter((item):item is string=>typeof item==="string"):[];
const normal=(value:unknown)=>String(value??"").trim().toLowerCase().replace(/[^a-z0-9]+/g," ");
const includesAny=(value:string,tokens:string[])=>tokens.some(token=>value.includes(token));
const duration=(start:string,end:string)=>{const from=new Date(`${start}T00:00:00Z`).getTime(),to=new Date(`${end}T00:00:00Z`).getTime();return start&&end&&Number.isFinite(from)&&Number.isFinite(to)&&to>from?Math.ceil((to-from)/86_400_000):0};
const bounds=(category:string,values:number[]):EstimateComponentBound|null=>values.length?{category,minimum:Math.min(...values),maximum:Math.max(...values)}:null;
const plansFor=(plans:Plan[],type:Plan["entity_type"],id:string,currency:string)=>plans.filter(plan=>plan.entity_type===type&&plan.entity_id===id&&plan.active&&plan.currency===currency);

const stayMatches=(stay:Accommodation,preference:string)=>{
  if(preference==="recommend")return true;
  if(preference==="five_star_resorts")return stay.star_rating===5;
  if(preference==="four_star_resorts")return stay.star_rating===4;
  const property=normal(stay.property_type);
  const tokens:Record<string,string[]>={boutique_hotels_villas:["boutique","villa"],guest_houses:["guest house","guesthouse"],homestays:["homestay","home stay"],bungalows:["bungalow"],eco_lodges_tented_camps:["eco lodge","ecolodge","tented","camp"],wellness_retreats:["wellness","ayurveda","retreat"]};
  return includesAny(property,tokens[preference]??[]);
};
const vehicleTokens:Record<TravelPreference,string[]>={scenic_train:["train","rail"],private_chauffeur_car_suv:["car","suv","sedan","chauffeur"],high_roof_van:["high roof","van"],mini_coach_bus:["coach","bus"],tuk_tuk:["tuk"],scooter:["scooter","motorbike","motorcycle"],domestic_floatplane:["floatplane","seaplane","air taxi"],self_drive_car:["self drive car","selfdrive car"],self_drive_van:["self drive van","selfdrive van"],self_drive_tuk_tuk:["self drive tuk","selfdrive tuk"],self_drive_scooter:["self drive scooter","selfdrive scooter"],recommend:[]};
const vehicleMatches=(vehicle:Vehicle,preference:TravelPreference,travellers:number)=>{
  if(vehicle.passenger_capacity&&vehicle.passenger_capacity<travellers)return false;
  if(preference==="recommend")return true;
  return includesAny(normal(`${vehicle.vehicle_type} ${vehicle.listing_title}`),vehicleTokens[preference]);
};
const guideMatches=(guide:Guide,preference:string)=>{
  if(preference==="recommend")return guide.nationwide;
  const value=normal(`${guide.name} ${strings(guide.specialities).join(" ")}`);
  const tokens:Record<string,string[]>={national_tourist_guide:["national tourist","national guide"],chauffeur_tourist_guide:["chauffeur tourist","chauffeur guide","driver guide"]};
  return guide.nationwide&&includesAny(value,tokens[preference]??[]);
};

const accommodationCost=(plan:Plan,travellers:number,billableUnits:number,nights:number,occupancy:number)=>{
  const rooms=Math.max(1,Math.ceil(travellers/Math.max(1,Number(plan.maximum_quantity)||occupancy)));
  if(["per_night","per_room_night"].includes(plan.charging_method))return Number(plan.price)*rooms*nights;
  if(plan.charging_method==="per_person")return Number(plan.price)*billableUnits*nights;
  if(plan.charging_method==="per_villa")return Number(plan.price)*nights;
  if(["fixed","private_tour"].includes(plan.charging_method))return Number(plan.price);
  return null;
};
const transportCost=(plan:Plan,distanceKm:number,airportLeg:boolean)=>{
  if(plan.charging_method==="per_km")return Number(plan.price)*distanceKm;
  if(["per_day","per_trip","per_vehicle","fixed"].includes(plan.charging_method))return Number(plan.price);
  if(plan.charging_method==="per_airport_transfer"&&airportLeg)return Number(plan.price);
  return null;
};
const guideCost=(plan:Plan,days:number)=>["full_day","multi_day","per_day"].includes(plan.charging_method)?Number(plan.price)*days:["private_tour","custom_rate","fixed"].includes(plan.charging_method)?Number(plan.price):null;
const experienceCost=(plan:Plan,participants:number)=>["per_person","per_entry"].includes(plan.charging_method)?Number(plan.price)*participants:["private_tour","per_trip","fixed"].includes(plan.charging_method)?Number(plan.price):null;
const bandComponent=(bands:EstimateBand[],key:string,category:string,quantity:number):EstimateComponentBound|null=>{
  const band=bands.find(item=>item.key===key&&item.active&&item.minimum!==null&&item.maximum!==null);
  return band?{category,minimum:Number(band.minimum)*quantity,maximum:Number(band.maximum)*quantity}:null;
};

export class JourneyEstimateService{
  async estimate(request:JourneyEstimateRequest):Promise<PublicJourneyEstimate>{
    const database=createAdminClient();
    if(!database)throw new PackagePricingError("CONFIGURATION","Server-side Supabase credentials are unavailable.");
    const durationDays=duration(request.travelDates.start,request.travelDates.end),tripNights=Math.max(0,durationDays-1),adults=request.travellerCounts.adults,children=request.travellerCounts.children,travellers=adults+children;
    const [configResult,bandsResult,destinationResult,experienceResult,experienceDestinationLinksResult,accommodationResult,vehicleResult,guideResult,vehicleLinksResult,guideDestinationLinksResult,guideExperienceLinksResult]=await Promise.all([
      database.from("tour_pricing_config").select("*").eq("id",true).eq("active",true).single(),
      database.from("journey_estimate_bands").select("*").eq("active",true).order("sort_order"),
      request.selectedDestinationIds.length?database.from("destinations").select("*").in("id",request.selectedDestinationIds).eq("status","published").eq("active",true):Promise.resolve({data:[],error:null}),
      request.selectedExperienceIds.length?database.from("experiences").select("id").in("id",request.selectedExperienceIds).eq("status","published").eq("active",true):Promise.resolve({data:[],error:null}),
      request.selectedExperienceIds.length?database.from("experience_destinations").select("experience_id,destination_id").in("experience_id",request.selectedExperienceIds):Promise.resolve({data:[],error:null}),
      request.selectedDestinationIds.length?database.from("accommodations").select("*").in("destination_id",request.selectedDestinationIds).eq("status","published").eq("active",true).eq("is_sample",false):Promise.resolve({data:[],error:null}),
      database.from("vehicles").select("*").eq("status","published").eq("active",true).eq("is_sample",false),
      database.from("guides").select("*").eq("status","published").eq("active",true).eq("is_sample",false),
      database.from("vehicle_destinations").select("vehicle_id,destination_id"),
      database.from("guide_destinations").select("guide_id,destination_id"),
      database.from("guide_experiences").select("guide_id,experience_id")
    ]);
    const firstError=[configResult,bandsResult,destinationResult,experienceResult,experienceDestinationLinksResult,accommodationResult,vehicleResult,guideResult,vehicleLinksResult,guideDestinationLinksResult,guideExperienceLinksResult].find(result=>result.error)?.error;
    if(firstError)throw new PackagePricingError("DATABASE",firstError.message);
    if(!configResult.data)throw new PackagePricingError("CONFIGURATION","Tour pricing configuration is unavailable.");
    const destinations=(destinationResult.data??[]) as Destination[],experiences=experienceResult.data??[],accommodations=(accommodationResult.data??[]) as Accommodation[],vehicles=(vehicleResult.data??[]) as Vehicle[],guides=(guideResult.data??[]) as Guide[];
    if(destinations.length!==request.selectedDestinationIds.length||experiences.length!==request.selectedExperienceIds.length)throw new PackagePricingError("INVALID_SELECTION","The estimate contains unavailable selections.");
    const supplierIds=[...accommodations.map(item=>item.id),...vehicles.map(item=>item.id),...guides.map(item=>item.id),...request.selectedExperienceIds];
    const plansResult=supplierIds.length?await database.from("pricing_plans").select("*").in("entity_id",supplierIds).eq("active",true).order("sort_order"):({data:[],error:null});
    if(plansResult.error)throw new PackagePricingError("DATABASE",plansResult.error.message);
    const plans=(plansResult.data??[]) as Plan[],bands=(bandsResult.data??[]) as EstimateBand[],config=mapPricingConfig(configResult.data),billableUnits=adults+children*config.childCostFactor,components:EstimateComponentBound[]=[],unavailable:string[]=[];
    if(!durationDays)unavailable.push("complete travel dates");
    const plannedNights=request.selectedDestinationIds.map(id=>request.destinationPreferences[id]?.nights);
    if(plannedNights.some(value=>value===null||value===undefined)||plannedNights.reduce<number>((sum,value)=>sum+Number(value),0)!==tripNights)unavailable.push("nights allocated across the journey");

    for(const destinationId of request.selectedDestinationIds){
      const preference=request.destinationPreferences[destinationId],nights=preference?.nights;
      if(nights===null||nights===undefined||nights===0)continue;
      const candidates=accommodations.filter(item=>item.destination_id===destinationId&&stayMatches(item,preference.stayPreference));
      const values=candidates.flatMap(item=>plansFor(plans,"accommodation",item.id,config.currency).flatMap(plan=>{const value=accommodationCost(plan,travellers,billableUnits,nights,config.roomOccupancy);return value===null?[]:[value]}));
      const component=bounds(`Accommodation in ${destinations.find(item=>item.id===destinationId)?.name??"destination"}`,values);
      const fallback=bandComponent(bands,`stay:${preference.stayPreference}`,`Accommodation in ${destinations.find(item=>item.id===destinationId)?.name??"destination"}`,billableUnits*nights);
      if(component)components.push(component);else if(fallback)components.push(fallback);else unavailable.push(`accommodation planning range for ${preference.stayPreference}`);
    }

    for(const experienceId of request.selectedExperienceIds){
      const active=plansFor(plans,"experience",experienceId,config.currency),selectedId=request.selectedPricingPlanIds[`experience:${experienceId}`];
      const applicable=selectedId?active.filter(plan=>plan.id===selectedId):active.length===1?active:[];
      const counts=request.experienceParticipants[experienceId],participants=counts?counts.adults+counts.children+counts.infants:adults;
      const values=applicable.flatMap(plan=>{const value=experienceCost(plan,participants);return value===null?[]:[value]});
      const component=bounds(`Experience ${experienceId}`,values);
      const fallback=bandComponent(bands,"experience:default",`Experience ${experienceId}`,Math.max(1,participants));
      if(component)components.push(component);else if(fallback)components.push(fallback);else unavailable.push(`selected ticket pricing for ${experienceId}`);
    }

    const destinationMap=new Map(destinations.map(item=>[item.id,item]));
    const pickup=request.pickup.type?endpointRouteLocation(request.pickup,"pickup",destinations):null,dropoff=request.dropoff.type?endpointRouteLocation(request.dropoff,"dropoff",destinations):null;
    const legs=completeJourneyLegs(request.selectedDestinationIds,Boolean(request.pickup.type),Boolean(request.dropoff.type));
    let chauffeurLegs=0,totalRouteDistance=0;
    const stop=(key:string):RouteDestination|null=>key==="pickup"?pickup:key==="dropoff"?dropoff:destinationMap.get(key.replace("destination:",""))??null;
    const vehicleDestinationIds=(vehicleId:string)=>(vehicleLinksResult.data??[]).filter(link=>link.vehicle_id===vehicleId).map(link=>link.destination_id);
    for(const leg of legs){
      const from=stop(leg.fromLocationKey),to=stop(leg.toLocationKey),preference=effectiveTravelPreference(request.travelPreferencesByLeg,leg.key,request.globalTravelPreference);
      if(!from||!to||!Number.isFinite(from.latitude)||!Number.isFinite(from.longitude)||!Number.isFinite(to.latitude)||!Number.isFinite(to.longitude)){unavailable.push(`route distance for ${leg.key}`);continue}
      const distanceKm=getRouteEstimate([from,to],[from.id,to.id]).estimatedDistance;totalRouteDistance+=distanceKm;
      const relevantDestinations=[leg.fromDestinationId,leg.toDestinationId].filter((id):id is string=>Boolean(id));
      const candidates=vehicles.filter(vehicle=>vehicleMatches(vehicle,preference,travellers)&& (vehicle.nationwide||relevantDestinations.every(id=>vehicleDestinationIds(vehicle.id).includes(id))));
      const values=candidates.flatMap(vehicle=>plansFor(plans,"vehicle",vehicle.id,config.currency).flatMap(plan=>{const value=transportCost(plan,distanceKm,leg.fromLocationKey==="pickup"||leg.toLocationKey==="dropoff");return value===null?[]:[value]}));
      const component=bounds(`Transport ${leg.key}`,values);
      const fallback=bandComponent(bands,`transport:${preference}`,`Transport ${leg.key}`,["scenic_train","domestic_floatplane"].includes(preference)?travellers:1);
      if(component)components.push(component);else if(fallback)components.push(fallback);else unavailable.push(`transport planning range for ${preference}`);
      if(["private_chauffeur_car_suv","high_roof_van","mini_coach_bus","tuk_tuk","recommend"].includes(preference))chauffeurLegs+=1;
    }

    const guideDestinationIds=(guideId:string)=>(guideDestinationLinksResult.data??[]).filter(link=>link.guide_id===guideId).map(link=>link.destination_id);
    const guideExperienceIds=(guideId:string)=>(guideExperienceLinksResult.data??[]).filter(link=>link.guide_id===guideId).map(link=>link.experience_id);
    if(request.journeyGuidePreference!=="no_guide"){
      const candidates=guides.filter(guide=>guideMatches(guide,request.journeyGuidePreference));
      const values=candidates.flatMap(guide=>plansFor(plans,"guide",guide.id,config.currency).flatMap(plan=>{const value=guideCost(plan,Math.max(1,durationDays));return value===null?[]:[value]}));
      const component=bounds("Primary guide",values),fallback=bandComponent(bands,`guide:${request.journeyGuidePreference}`,"Primary guide",Math.max(1,durationDays));if(component)components.push(component);else if(fallback)components.push(fallback);else unavailable.push(`guide planning range for ${request.journeyGuidePreference}`);
    }
    for(const destinationId of request.selectedDestinationIds){
      const specialist=request.destinationPreferences[destinationId]?.specialistGuidePreference??"none";
      if(specialist==="none")continue;
      const selectedAtDestination=request.selectedExperienceIds.filter(id=>(experienceDestinationLinksResult.data??[]).some(link=>link.experience_id===id&&link.destination_id===destinationId));
      const candidates=guides.filter(guide=>guide.nationwide||guideDestinationIds(guide.id).includes(destinationId)||guideExperienceIds(guide.id).some(id=>selectedAtDestination.includes(id)));
      const days=Math.max(1,Number(request.destinationPreferences[destinationId]?.nights)||1);
      const values=candidates.flatMap(guide=>plansFor(plans,"guide",guide.id,config.currency).flatMap(plan=>{const value=guideCost(plan,days);return value===null?[]:[value]}));
      const component=bounds(`Specialist guide ${destinationId}`,values),fallback=bandComponent(bands,"guide:specialist",`Specialist guide ${destinationId}`,days);if(component)components.push(component);else if(fallback)components.push(fallback);else unavailable.push(`specialist guide planning range for ${destinationId}`);
    }

    let operationsCost=0;
    if(chauffeurLegs){
      const missing=[config.driverSalaryPerDay,config.fuelPricePerLitre,config.vehicleKmPerLitre,config.tollsPerJourney,config.parkingPerDay].some(value=>value===null);
      if(missing)unavailable.push("transport operating costs");
      else operationsCost+=config.driverSalaryPerDay!*Math.max(1,durationDays)+totalRouteDistance/config.vehicleKmPerLitre!*config.fuelPricePerLitre!+config.tollsPerJourney!+config.parkingPerDay!*Math.max(1,durationDays);
    }
    if(request.journeyGuidePreference!=="no_guide"){
      if(config.guideAccommodationPerNight===null)unavailable.push("guide accommodation costs");else operationsCost+=config.guideAccommodationPerNight*tripNights;
    }
    return calculateJourneyEstimateRange({currency:config.currency,durationDays,adults,children:request.travellerCounts.children,infants:request.travellerCounts.infants,components,operationsCost,config,factors:["Journey duration","Accommodation style","Experiences","Transport preferences","Guide preferences","Number of travellers","Travel period"],unavailableInputs:unavailable});
  }
}
