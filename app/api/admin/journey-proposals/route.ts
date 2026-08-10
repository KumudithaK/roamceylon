import {NextResponse} from "next/server";
import {z} from "zod";
import {authenticatedStaff} from "@/lib/admin/authenticated-staff";
import {generateJourneyProposal,ProposalError,transitionJourneyProposal} from "@/lib/proposals/journey-proposal-service";

const generateSchema=z.object({
  action:z.literal("generate"),enquiryId:z.uuid(),
  introduction:z.string().trim().max(3000).optional(),terms:z.string().trim().max(5000).optional(),validUntil:z.iso.date().optional(),rangeOverrideReason:z.string().trim().max(1500).optional(),
  commercialOverrides:z.object({
    driverOperations:z.number().min(0).nullable().optional(),fuel:z.number().min(0).nullable().optional(),tolls:z.number().min(0).nullable().optional(),
    parking:z.number().min(0).nullable().optional(),guideAccommodation:z.number().min(0).nullable().optional(),administration:z.number().min(0).nullable().optional(),contingency:z.number().min(0).nullable().optional()
  }).optional()
});
const transitionSchema=z.object({action:z.enum(["sent","approved"]),proposalId:z.uuid()});

export async function POST(request:Request){
  const actor=await authenticatedStaff(request);
  if(!actor)return NextResponse.json({error:"Unauthorized."},{status:401});
  const body=await request.json().catch(()=>null);
  const generate=generateSchema.safeParse(body);
  const transition=transitionSchema.safeParse(body);
  if(!generate.success&&!transition.success)return NextResponse.json({error:"Invalid proposal action."},{status:400});
  try{
    const proposal=generate.success
      ?await generateJourneyProposal(generate.data.enquiryId,actor.user.id,generate.data)
      :transition.success?await transitionJourneyProposal(transition.data.proposalId,transition.data.action):null;
    if(!proposal)return NextResponse.json({error:"Invalid proposal action."},{status:400});
    return NextResponse.json({proposal},{status:generate.success?201:200});
  }catch(error){
    const status=error instanceof ProposalError&&error.code==="NOT_FOUND"?404:error instanceof ProposalError&&error.code==="INCOMPLETE"?409:500;
    return NextResponse.json({error:error instanceof Error?error.message:"The proposal could not be updated."},{status});
  }
}
