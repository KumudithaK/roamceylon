import {NextResponse} from "next/server";
import {z} from "zod";
import {authenticatedStaff,type StaffRequirement} from "@/lib/admin/authenticated-staff";
import {proposalChangeForStaff,proposalForStaff} from "@/lib/admin/traveller-pii";
import {generateJourneyProposal,ProposalError,revokeJourneyProposalAccess,transitionJourneyProposal} from "@/lib/proposals/journey-proposal-service";
import {isCentPrecise} from "@/lib/pricing/money-precision";
import {journeyCommercialConfigKeys} from "@/lib/pricing/allocation-commercial";

const moneyInput=z.number().min(0).refine(isCentPrecise,"Enter a cent-precise monetary amount.");
const percentageInput=z.number().min(0).max(100).refine(isCentPrecise,"Enter a percentage with at most two decimal places.");
const targetMarginInput=z.number().min(0).lt(100).refine(isCentPrecise,"Enter a percentage with at most two decimal places.");

const generateSchema=z.object({
  action:z.literal("generate"),enquiryId:z.uuid(),
  introduction:z.string().trim().max(3000).optional(),terms:z.string().trim().max(5000).optional(),validUntil:z.iso.date().optional(),rangeOverrideReason:z.string().trim().max(1500).optional(),
  depositAmount:moneyInput.nullable().optional(),depositDueDate:z.iso.date().optional(),balanceDueDate:z.iso.date().optional(),
  additionalInclusions:z.array(z.string().trim().min(2).max(300)).max(30).optional(),additionalExclusions:z.array(z.string().trim().min(2).max(300)).max(30).optional(),importantInformation:z.array(z.string().trim().min(2).max(500)).max(30).optional(),
  optionalItems:z.array(z.object({name:z.string().trim().min(2).max(200),description:z.string().trim().min(2).max(500),price:moneyInput.optional(),currency:z.string().length(3).optional()})).max(20).optional(),
  commercialOverrides:z.object({
    driverOperations:moneyInput.nullable().optional(),fuel:moneyInput.nullable().optional(),tolls:moneyInput.nullable().optional(),
    parking:moneyInput.nullable().optional(),guideAccommodation:moneyInput.nullable().optional(),administration:moneyInput.nullable().optional(),contingency:moneyInput.nullable().optional(),
    serviceFeeFixed:moneyInput.nullable().optional(),serviceFeePercent:percentageInput.nullable().optional(),targetProfitMarginPercent:targetMarginInput.nullable().optional()
  }).optional()
});
const transitionSchema=z.object({action:z.enum(["internal_approve","sent"]),proposalId:z.uuid()});
const revokeSchema=z.object({action:z.literal("revoke"),proposalId:z.uuid(),reason:z.string().trim().min(5).max(500)});

export async function GET(request:Request){
  const actor=await authenticatedStaff(request,"journey.proposal.view");
  if(!actor.authorized)return NextResponse.json({error:actor.status===401?"Unauthorized.":"You do not have permission to view proposals."},{status:actor.status});
  const enquiryId=new URL(request.url).searchParams.get("enquiryId");
  if(!z.uuid().safeParse(enquiryId).success)return NextResponse.json({error:"Choose a valid journey."},{status:400});
  const {data,error}=await actor.database.from("journey_proposals").select("*").eq("enquiry_id",enquiryId!).order("version",{ascending:false});
  if(error)return NextResponse.json({error:error.message},{status:500});
  const proposalIds=(data??[]).map(proposal=>proposal.id);
  const changes=proposalIds.length?await actor.database.from("journey_proposal_change_requests").select("*").in("proposal_id",proposalIds).order("created_at",{ascending:false}):{data:[],error:null};
  if(changes.error)return NextResponse.json({error:changes.error.message},{status:500});
  return NextResponse.json({proposals:(data??[]).map(proposal=>proposalForStaff(proposal,actor.permissions)),changeRequests:(changes.data??[]).map(change=>proposalChangeForStaff(change,actor.permissions))});
}

export async function POST(request:Request){
  const body=await request.json().catch(()=>null);
  const generate=generateSchema.safeParse(body);
  const transition=transitionSchema.safeParse(body);
  const revoke=revokeSchema.safeParse(body);
  if(!generate.success&&!transition.success&&!revoke.success)return NextResponse.json({error:"Invalid proposal action."},{status:400});
  const suppliedConfigOverride=generate.success&&journeyCommercialConfigKeys.some(key=>Object.hasOwn(generate.data.commercialOverrides??{},key));
  const required:StaffRequirement=suppliedConfigOverride?["journey.proposal.create","settings.manage"]:generate.success||transition.success&&transition.data.action==="internal_approve"
    ?"journey.proposal.create"
    :transition.success&&transition.data.action==="sent"?"journey.proposal.send":"journey.proposal.manage";
  const actor=await authenticatedStaff(request,required);
  if(!actor.authorized)return NextResponse.json({error:actor.status===401?"Unauthorized.":"You do not have permission to perform this proposal action."},{status:actor.status});
  try{
    const proposal=generate.success
      ?await generateJourneyProposal(generate.data.enquiryId,actor.user.id,generate.data)
      :transition.success?await transitionJourneyProposal(transition.data.proposalId,transition.data.action,actor.user.id)
      :revoke.success?await revokeJourneyProposalAccess(revoke.data.proposalId,actor.user.id,revoke.data.reason):null;
    if(!proposal)return NextResponse.json({error:"Invalid proposal action."},{status:400});
    return NextResponse.json({proposal:proposalForStaff(proposal,actor.permissions)},{status:generate.success?201:200});
  }catch(error){
    const status=error instanceof ProposalError&&error.code==="NOT_FOUND"?404:error instanceof ProposalError&&error.code==="INCOMPLETE"?409:500;
    return NextResponse.json({error:error instanceof Error?error.message:"The proposal could not be updated."},{status});
  }
}
