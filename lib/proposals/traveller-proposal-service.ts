import "server-only";
import {createHash} from "node:crypto";
import {createAdminClient} from "@/lib/supabase/admin";
import {customerSafeProposalDto} from "./customer-proposal-dto";
import type {Database,Json} from "@/lib/database.types";

type Proposal=Database["public"]["Tables"]["journey_proposals"]["Row"];
type ProposalUpdate=Database["public"]["Tables"]["journey_proposals"]["Update"];
const visibleStatuses:Proposal["status"][]=["sent","viewed","changes_requested","approved","expired","superseded","cancelled"];
const safeMetadata=(userAgent:string|undefined)=>({userAgent:userAgent?.slice(0,500)??null,confirmationFingerprint:createHash("sha256").update(userAgent||"unknown").digest("hex").slice(0,20)}) as Json;

export class TravellerProposalError extends Error{constructor(public code:"NOT_FOUND"|"INVALID"|"CONFLICT"|"DATABASE",message:string){super(message);this.name="TravellerProposalError"}}

export async function loadTravellerProposal(token:string,{markViewed=true}:{markViewed?:boolean}={}){
  const database=createAdminClient();if(!database)throw new TravellerProposalError("DATABASE","Proposal service is unavailable.");
  const {data,error}=await database.from("journey_proposals").select("*").eq("public_token",token).maybeSingle();
  if(error)throw new TravellerProposalError("DATABASE",error.message);if(!data||data.access_revoked_at||!visibleStatuses.includes(data.status))throw new TravellerProposalError("NOT_FOUND","This proposal is unavailable.");
  const snapshot=customerSafeProposalDto(data.sent_snapshot??data.customer_snapshot);if(!snapshot)throw new TravellerProposalError("NOT_FOUND","This proposal version is not ready for viewing.");
  const expired=Boolean(data.valid_until&&new Date(`${data.valid_until}T23:59:59Z`).getTime()<Date.now()&&!['approved','expired'].includes(data.status));
  let proposal=data;const now=new Date().toISOString();
  if(expired||markViewed){const changes:ProposalUpdate={};if(expired)changes.status="expired";else if(data.status==="sent"){changes.status="viewed";changes.viewed_at=data.viewed_at??now}if(markViewed){changes.first_viewed_at=data.first_viewed_at??now;changes.last_viewed_at=now;changes.view_count=data.view_count+1}const result=await database.from("journey_proposals").update(changes).eq("id",data.id).select("*").single();if(result.error)throw new TravellerProposalError("DATABASE",result.error.message);proposal=result.data}
  return {proposal,snapshot};
}

export async function acceptTravellerProposal(token:string,input:{name:string;email:string;termsAcknowledged:boolean;userAgent?:string}){
  const database=createAdminClient();if(!database)throw new TravellerProposalError("DATABASE","Proposal service is unavailable.");
  const loaded=await loadTravellerProposal(token,{markViewed:false}),{proposal,snapshot}=loaded;
  if(proposal.requires_new_version)throw new TravellerProposalError("CONFLICT","This journey has been refined since this proposal was prepared. Roam Ceylon is preparing a new version for you.");
  if(!["sent","viewed"].includes(proposal.status))throw new TravellerProposalError("CONFLICT",proposal.status==="approved"?"This proposal version has already been accepted.":"This proposal version can no longer be accepted.");
  if(!input.termsAcknowledged)throw new TravellerProposalError("INVALID","Please confirm that you have reviewed this proposal and its terms.");
  if(input.email.trim().toLowerCase()!==snapshot.traveller.email.trim().toLowerCase())throw new TravellerProposalError("INVALID","Use the email address associated with this journey proposal.");
  const metadata=safeMetadata(input.userAgent);
  const {error:acceptanceError}=await database.rpc("accept_journey_proposal_command",{p_public_token:token,p_name:input.name.trim(),p_email:input.email.trim().toLowerCase(),p_metadata:metadata});
  if(acceptanceError){const conflict=["23505","40001","55000"].includes(acceptanceError.code);const invalid=acceptanceError.code==="22023";throw new TravellerProposalError(conflict?"CONFLICT":invalid?"INVALID":"DATABASE",acceptanceError.code==="23505"?"This journey already has an accepted proposal.":acceptanceError.message)}
  const {data:updated,error:updateError}=await database.from("journey_proposals").select("*").eq("id",proposal.id).single();if(updateError||!updated)throw new TravellerProposalError("DATABASE",updateError?.message??"The acceptance could not be loaded.");
  return {proposal:updated,snapshot};
}

export async function requestTravellerChanges(token:string,input:{name:string;email:string;category:Database["public"]["Tables"]["journey_proposal_change_requests"]["Row"]["category"];message:string}){
  const database=createAdminClient();if(!database)throw new TravellerProposalError("DATABASE","Proposal service is unavailable.");
  const {proposal,snapshot}=await loadTravellerProposal(token,{markViewed:false});
  if(proposal.requires_new_version)throw new TravellerProposalError("CONFLICT","This journey has been refined since this proposal was prepared. Roam Ceylon is preparing a new version for you.");
  if(!["sent","viewed"].includes(proposal.status))throw new TravellerProposalError("CONFLICT","This proposal version is no longer open for change requests.");
  if(input.email.trim().toLowerCase()!==snapshot.traveller.email.trim().toLowerCase())throw new TravellerProposalError("INVALID","Use the email address associated with this journey proposal.");
  const now=new Date().toISOString();
  const {error}=await database.rpc("request_journey_proposal_changes_command",{p_proposal_id:proposal.id,p_category:input.category,p_message:input.message.trim(),p_name:input.name.trim(),p_email:input.email.trim().toLowerCase()});if(error)throw new TravellerProposalError("DATABASE",error.message);
  return {proposal:{...proposal,status:"changes_requested" as const,changes_requested_at:now},snapshot};
}
