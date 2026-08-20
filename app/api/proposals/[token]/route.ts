import {NextResponse} from "next/server";
import {z} from "zod";
import {acceptTravellerProposal,requestTravellerChanges,TravellerProposalError} from "@/lib/proposals/traveller-proposal-service";
import {PublicInputError,publicAttemptLimited,readBoundedJson} from "@/lib/security/public-input";

const schema=z.discriminatedUnion("action",[
  z.object({action:z.literal("accept"),name:z.string().trim().min(2).max(150),email:z.email(),termsAcknowledged:z.literal(true)}).strict(),
  z.object({action:z.literal("request_changes"),name:z.string().trim().min(2).max(150),email:z.email(),category:z.enum(["general","destination","accommodation","experience","transport","guide","dates","budget","other"]),message:z.string().trim().min(10).max(5000)}).strict()
]);

export async function POST(request:Request,{params}:{params:Promise<{token:string}>}){
  const {token}=await params;if(!z.uuid().safeParse(token).success)return NextResponse.json({error:"This proposal link is invalid."},{status:404});
  let raw:unknown;try{raw=await readBoundedJson(request,16_000)}catch(error){return NextResponse.json({error:error instanceof PublicInputError&&error.code==="PAYLOAD_TOO_LARGE"?"The request is too large.":"Check the information supplied."},{status:error instanceof PublicInputError&&error.code==="PAYLOAD_TOO_LARGE"?413:400})}
  const parsed=schema.safeParse(raw);if(!parsed.success)return NextResponse.json({error:"Check the information supplied."},{status:400});
  if(publicAttemptLimited("proposal-action",`${token}:${parsed.data.email}`,10,60*60*1000))return NextResponse.json({error:"This proposal request cannot be processed right now. Please try again later."},{status:429});
  try{
    const result=parsed.data.action==="accept"?await acceptTravellerProposal(token,{...parsed.data,userAgent:request.headers.get("user-agent")??undefined}):await requestTravellerChanges(token,parsed.data);
    return NextResponse.json({status:result.proposal.status});
  }catch(error){const status=error instanceof TravellerProposalError&&error.code==="NOT_FOUND"?404:error instanceof TravellerProposalError&&error.code==="CONFLICT"?409:error instanceof TravellerProposalError&&error.code==="INVALID"?400:500;const message=status===404?"This proposal is unavailable.":status===409?"This proposal can no longer be updated.":status===400?"The proposal details could not be verified.":"The proposal could not be updated.";return NextResponse.json({error:message},{status})}
}
