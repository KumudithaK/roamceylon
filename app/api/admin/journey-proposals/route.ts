import {NextResponse} from "next/server";
import {z} from "zod";
import {authenticatedStaff} from "@/lib/admin/authenticated-staff";
import {generateJourneyProposal,ProposalError,transitionJourneyProposal} from "@/lib/proposals/journey-proposal-service";
import type {Database,Json} from "@/lib/database.types";

type Proposal=Database["public"]["Tables"]["journey_proposals"]["Row"];

const generateSchema=z.object({
  action:z.literal("generate"),enquiryId:z.uuid(),
  introduction:z.string().trim().max(3000).optional(),terms:z.string().trim().max(5000).optional(),validUntil:z.iso.date().optional(),rangeOverrideReason:z.string().trim().max(1500).optional(),
  commercialOverrides:z.object({
    driverOperations:z.number().min(0).nullable().optional(),fuel:z.number().min(0).nullable().optional(),tolls:z.number().min(0).nullable().optional(),
    parking:z.number().min(0).nullable().optional(),guideAccommodation:z.number().min(0).nullable().optional(),administration:z.number().min(0).nullable().optional(),contingency:z.number().min(0).nullable().optional()
  }).optional()
});
const transitionSchema=z.object({action:z.enum(["sent","approved"]),proposalId:z.uuid()});

const redactProposal=(proposal:Proposal,permissions:string[]):Proposal=>{
  const canSeeCosts=permissions.includes("finance.costs.view"),canSeeMargins=permissions.includes("finance.margin.view"),canSeePayments=permissions.includes("finance.payments.manage");
  const allocationSnapshot=Array.isArray(proposal.allocation_snapshot)?proposal.allocation_snapshot.map(value=>{
    if(!value||typeof value!=="object"||Array.isArray(value))return value;
    const line=value as Record<string,Json|undefined>;
    return {...line,supplierCost:canSeeCosts?line.supplierCost:null,pricingPlanSnapshot:canSeeCosts?line.pricingPlanSnapshot:{},supplierContact:canSeeCosts?line.supplierContact:null,invoiceStatus:canSeePayments?line.invoiceStatus:"not_requested",paymentStatus:canSeePayments?line.paymentStatus:"pending"};
  }):proposal.allocation_snapshot;
  return {...proposal,allocation_snapshot:allocationSnapshot,total_supplier_cost:canSeeCosts?proposal.total_supplier_cost:0,gross_profit:canSeeMargins?proposal.gross_profit:0,profit_margin:canSeeMargins?proposal.profit_margin:0,commercial_snapshot:canSeeMargins?proposal.commercial_snapshot:{}};
};

export async function GET(request:Request){
  const actor=await authenticatedStaff(request,"journey.proposal.view");
  if(!actor)return NextResponse.json({error:"You do not have permission to view proposals."},{status:403});
  const enquiryId=new URL(request.url).searchParams.get("enquiryId");
  if(!z.uuid().safeParse(enquiryId).success)return NextResponse.json({error:"Choose a valid journey."},{status:400});
  const {data,error}=await actor.database.from("journey_proposals").select("*").eq("enquiry_id",enquiryId!).order("version",{ascending:false});
  if(error)return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json({proposals:(data??[]).map(proposal=>redactProposal(proposal,actor.permissions))});
}

export async function POST(request:Request){
  const actor=await authenticatedStaff(request,"journey.proposal.create");
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
    return NextResponse.json({proposal:redactProposal(proposal,actor.permissions)},{status:generate.success?201:200});
  }catch(error){
    const status=error instanceof ProposalError&&error.code==="NOT_FOUND"?404:error instanceof ProposalError&&error.code==="INCOMPLETE"?409:500;
    return NextResponse.json({error:error instanceof Error?error.message:"The proposal could not be updated."},{status});
  }
}
