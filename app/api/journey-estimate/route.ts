import {NextResponse} from "next/server";
import {z} from "zod";
import {JourneyEstimateService} from "@/lib/pricing/journey-estimate-service";
import {PackagePricingError} from "@/lib/pricing/package-service";

const counts=z.object({adults:z.number().int().min(0).max(100),children:z.number().int().min(0).max(100),infants:z.number().int().min(0).max(100)});
const endpoint=z.object({type:z.enum(["airport","other"]).nullable(),airportCode:z.string().max(10),location:z.string().max(300),date:z.string().max(10),time:z.string().max(8),flightNumber:z.string().max(40)});
const travelPreference=z.enum(["scenic_train","private_chauffeur_car_suv","high_roof_van","mini_coach_bus","tuk_tuk","scooter","domestic_floatplane","self_drive_car","self_drive_van","self_drive_tuk_tuk","self_drive_scooter","recommend"]);
const stayPreference=z.enum(["five_star_resorts","four_star_resorts","boutique_hotels_villas","guest_houses","homestays","bungalows","eco_lodges_tented_camps","wellness_retreats","recommend"]);
const guidePreference=z.enum(["national_tourist_guide","chauffeur_tourist_guide","area_tourist_guide","site_tourist_guide","wildlife_tracker_safari_guide","adventure_trekking_guide","no_guide","recommend"]);
const preference=z.object({stayPreference,guidePreference,specialistGuidePreference:z.string().max(100).optional(),nights:z.number().int().min(0).max(60).nullable(),notes:z.string().max(2000)});
const estimateSchema=z.object({
  selectedDestinationIds:z.array(z.uuid()).max(40),selectedExperienceIds:z.array(z.uuid()).max(100),selectedPricingPlanIds:z.record(z.string(),z.uuid()).default({}),
  destinationPreferences:z.record(z.uuid(),preference),journeyGuidePreference:z.enum(["national_tourist_guide","chauffeur_tourist_guide","no_guide","recommend"]),
  pickup:endpoint,dropoff:endpoint,globalTravelPreference:travelPreference,travelPreferencesByLeg:z.record(z.string(),z.object({fromDestinationId:z.string(),toDestinationId:z.string(),travelPreference})),
  travelDates:z.object({start:z.string().max(10),end:z.string().max(10)}),travellerCounts:counts,experienceParticipants:z.record(z.uuid(),counts)
});

export async function POST(request:Request){
  const parsed=estimateSchema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Invalid journey estimate request."},{status:400});
  try{return NextResponse.json(await new JourneyEstimateService().estimate(parsed.data as Parameters<JourneyEstimateService["estimate"]>[0]));}
  catch(error){
    if(error instanceof PackagePricingError){const status=error.code==="INVALID_SELECTION"?400:error.code==="CONFIGURATION"?503:500;return NextResponse.json({error:error.code==="CONFIGURATION"?"Journey estimates are being configured.":"Unable to estimate this journey."},{status});}
    return NextResponse.json({error:"Unable to estimate this journey."},{status:500});
  }
}
