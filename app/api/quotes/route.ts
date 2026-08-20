import {NextResponse} from "next/server";
import {z} from "zod";
import {PackagePricingError,PackagePricingService} from "@/lib/pricing/package-service";
import {PublicInputError,readBoundedJson} from "@/lib/security/public-input";

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
  let raw:unknown;try{raw=await readBoundedJson(request,100_000)}catch(error){return NextResponse.json({error:error instanceof PublicInputError&&error.code==="PAYLOAD_TOO_LARGE"?"The quote request is too large.":"Invalid quote request."},{status:error instanceof PublicInputError&&error.code==="PAYLOAD_TOO_LARGE"?413:400})}
  const parsed=quoteSchema.strict().safeParse(raw);
  if(!parsed.success)return NextResponse.json({error:"Invalid quote request."},{status:400});
  try{
    const quote=await new PackagePricingService().quote(parsed.data);
    return NextResponse.json(quote.public);
  }catch(error){
    if(error instanceof PackagePricingError){
      const status=error.code==="INVALID_SELECTION"?400:error.code==="CONFIGURATION"?503:500;
      return NextResponse.json({error:error.code==="CONFIGURATION"?"Package pricing is being configured.":"Unable to calculate this package."},{status});
    }
    return NextResponse.json({error:"Unable to calculate this package."},{status:500});
  }
}
