import {notFound} from "next/navigation";
import {TravellerProposal} from "@/features/proposals/traveller-proposal";
import {loadTravellerProposal,TravellerProposalError} from "@/lib/proposals/traveller-proposal-service";

export const dynamic="force-dynamic";
export default async function Page({params}:{params:Promise<{token:string}>}){
  const {token}=await params;
  let loaded:Awaited<ReturnType<typeof loadTravellerProposal>>;
  try{loaded=await loadTravellerProposal(token)}catch(error){if(error instanceof TravellerProposalError&&error.code==="NOT_FOUND")notFound();throw error}
  return <TravellerProposal token={token} snapshot={loaded.snapshot} initialStatus={loaded.proposal.status} requiresNewVersion={loaded.proposal.requires_new_version}/>;
}
