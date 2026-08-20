import {NextResponse} from "next/server";
import {z} from "zod";
import {authenticatedStaff} from "@/lib/admin/authenticated-staff";
import {PackagePricingService} from "@/lib/pricing/package-service";

const quoteSchema=z.object({
  selectedDestinationIds:z.array(z.uuid()).max(40),
  selectedExperienceIds:z.array(z.uuid()).max(100),
  selectedStayIds:z.array(z.uuid()).max(40),
  selectedVehicleId:z.uuid().nullable(),
  selectedGuideId:z.uuid().nullable(),
  selectedPricingPlanIds:z.record(z.string(),z.uuid()).default({}),
  travelDates:z.object({start:z.string().max(10),end:z.string().max(10)}),
  travellerCounts:z.object({adults:z.number().int().min(0).max(100),children:z.number().int().min(0).max(100),infants:z.number().int().min(0).max(100)}),
  experienceParticipants:z.record(z.uuid(),z.object({adults:z.number().int().min(0).max(100),children:z.number().int().min(0).max(100),infants:z.number().int().min(0).max(100)}))
});

export async function POST(request:Request){
  const actor=await authenticatedStaff(request,"journey.proposal.create");
  if(!actor.authorized)return NextResponse.json({error:actor.status===401?"Unauthorized.":"Forbidden."},{status:actor.status});
  const parsed=quoteSchema.strict().safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Invalid quote request."},{status:400});
  try{return NextResponse.json(await new PackagePricingService().quote(parsed.data))}
  catch{return NextResponse.json({error:"Unable to calculate this package."},{status:500})}
}
