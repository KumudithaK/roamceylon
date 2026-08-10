import {NextResponse} from "next/server";
import {z} from "zod";
import {acceptTravellerProposal,requestTravellerChanges,TravellerProposalError} from "@/lib/proposals/traveller-proposal-service";

const schema=z.discriminatedUnion("action",[
  z.object({action:z.literal("accept"),name:z.string().trim().min(2).max(150),email:z.email(),termsAcknowledged:z.literal(true)}),
  z.object({action:z.literal("request_changes"),name:z.string().trim().min(2).max(150),email:z.email(),category:z.enum(["general","destination","accommodation","experience","transport","guide","budget","other"]),message:z.string().trim().min(10).max(5000)})
]);

export async function POST(request:Request,{params}:{params:Promise<{token:string}>}){
  const {token}=await params;if(!z.uuid().safeParse(token).success)return NextResponse.json({error:"This proposal link is invalid."},{status:404});
  const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:parsed.error.issues[0]?.message??"Check the information supplied."},{status:400});
  try{
    const result=parsed.data.action==="accept"?await acceptTravellerProposal(token,{...parsed.data,userAgent:request.headers.get("user-agent")??undefined}):await requestTravellerChanges(token,parsed.data);
    return NextResponse.json({status:result.proposal.status});
  }catch(error){const status=error instanceof TravellerProposalError&&error.code==="NOT_FOUND"?404:error instanceof TravellerProposalError&&error.code==="CONFLICT"?409:error instanceof TravellerProposalError&&error.code==="INVALID"?400:500;return NextResponse.json({error:error instanceof Error?error.message:"The proposal could not be updated."},{status})}
}
