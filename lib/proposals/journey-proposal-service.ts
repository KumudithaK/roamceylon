import "server-only";
import {createAdminClient} from "@/lib/supabase/admin";
import {allocationCommercialSnapshot} from "@/lib/accounting/allocation-accounting";
import type {AllocationCommercialOverrides} from "@/lib/pricing/allocation-commercial";
import {experienceAllocationKey,hasOwnJourneyGuideSnapshot,journeyAllocationScopes,journeyGuideAllocationKey} from "@/lib/admin/journey-allocations";
import {endpointLabel} from "@/lib/journey/journey-endpoints";
import {parseJourneyHandoff} from "@/lib/journey/quotation-handoff";
import {resolveJourneyDesign} from "@/lib/journey/curated-journey-server";
import {completeJourneyLegs} from "@/lib/journey/travel-preferences";
import {reviewProposalAgainstEstimate} from "./proposal-range-review";
import {composeCustomerProposal,customerProposalJson} from "./customer-proposal";
import {customerBenefitsForProposal} from "@/lib/benefits/journey-benefit-service";
import {validateCustomerProposal} from "./customer-proposal-types";
import {customerSafeProposalDto} from "./customer-proposal-dto";
import type {Database,Json} from "@/lib/database.types";

type Proposal=Database["public"]["Tables"]["journey_proposals"]["Row"];
const ids=(value:Json)=>Array.isArray(value)?value.filter((item):item is string=>typeof item==="string"):[];
const asJson=(value:unknown)=>JSON.parse(JSON.stringify(value)) as Json;
const allocationKey=(row:Database["public"]["Tables"]["journey_supplier_allocations"]["Row"])=>row.allocation_type==="vehicle"
  ?`vehicle:${row.from_location_key??`destination:${row.from_destination_id}`}:${row.to_location_key??`destination:${row.to_destination_id}`}`
  :row.allocation_type==="experience"&&row.experience_id?experienceAllocationKey(row.experience_id):row.allocation_type==="guide"&&!row.destination_id?journeyGuideAllocationKey:`${row.allocation_type}:${row.destination_id}`;

export class ProposalError extends Error{
  constructor(public code:"NOT_FOUND"|"INCOMPLETE"|"DATABASE",message:string){super(message);this.name="ProposalError"}
}

export async function generateJourneyProposal(enquiryId:string,userId:string,details:{introduction?:string;terms?:string;validUntil?:string;rangeOverrideReason?:string;commercialOverrides?:AllocationCommercialOverrides;depositAmount?:number|null;depositDueDate?:string;balanceDueDate?:string;additionalInclusions?:string[];additionalExclusions?:string[];importantInformation?:string[];optionalItems?:Array<{name:string;description:string;price?:number;currency?:string}>}){
  const database=createAdminClient();
  if(!database)throw new ProposalError("DATABASE","Supabase server credentials are unavailable.");
  const {data:enquiry,error}=await database.from("enquiries").select("*").eq("id",enquiryId).maybeSingle();
  if(error)throw new ProposalError("DATABASE",error.message);
  if(!enquiry)throw new ProposalError("NOT_FOUND","Traveller enquiry not found.");
  const design=await resolveJourneyDesign(database,enquiry);
  const destinationIds=design.state?.selectedDestinationIds??ids(enquiry.selected_destinations);const experienceIds=design.state?.selectedExperienceIds??ids(enquiry.selected_experiences);
  if(design.curated&&!["ready_for_allocation","allocation_in_progress","ready_for_proposal"].includes(design.curated.status))throw new ProposalError("INCOMPLETE","Mark the Curated Journey ready for allocation before preparing a proposal.");
  const {data:experienceLinks,error:linkError}=experienceIds.length?await database.from("experience_destinations").select("experience_id,destination_id").in("experience_id",experienceIds):{data:[],error:null};
  if(linkError)throw new ProposalError("DATABASE",linkError.message);
  const experienceScopes=experienceIds.flatMap(experienceId=>{
    const destinationId=destinationIds.find(id=>experienceLinks?.some(link=>link.experience_id===experienceId&&link.destination_id===id));
    return destinationId?[{experienceId,destinationId}]:[];
  });
  if(experienceScopes.length!==experienceIds.length)throw new ProposalError("INCOMPLETE","Every selected experience must have a selected destination relationship before a proposal can be generated.");
  const handoff=parseJourneyHandoff(enquiry.trip_state),effectiveState=design.state??handoff?.state;
  const destinationPreferences=effectiveState?.destinationPreferences;
  const hasGlobalGuide=Boolean(design.curated)||hasOwnJourneyGuideSnapshot(enquiry.trip_state);
  const transportLegs=completeJourneyLegs(destinationIds,Boolean(effectiveState?.pickup.type),Boolean(effectiveState?.dropoff.type));
  const required=journeyAllocationScopes(destinationIds,experienceScopes,{
    nightsByDestination:destinationPreferences?Object.fromEntries(destinationIds.map(id=>[id,destinationPreferences[id]?.nights??null])):undefined,
    guidePreferencesByDestination:!hasGlobalGuide&&destinationPreferences?Object.fromEntries(destinationIds.map(id=>[id,destinationPreferences[id]?.guidePreference??"recommend"])):undefined,
    journeyGuidePreference:hasGlobalGuide?effectiveState?.journeyGuidePreference:undefined,
    specialistGuidePreferencesByDestination:hasGlobalGuide&&destinationPreferences?Object.fromEntries(destinationIds.map(id=>[id,destinationPreferences[id]?.specialistGuidePreference??"none"])):undefined,
    transportLegs
  });
  const {count:reviewCount,error:reviewError}=await database.from("journey_supplier_allocations").select("id",{count:"exact",head:true}).eq("enquiry_id",enquiryId).eq("review_required",true).neq("confirmation_status","cancelled");
  if(reviewError)throw new ProposalError("DATABASE",reviewError.message);
  if(reviewCount)throw new ProposalError("INCOMPLETE",`Review ${reviewCount} supplier allocation${reviewCount===1?"":"s"} affected by the Curated Journey before generating the proposal.`);
  const commercial=await allocationCommercialSnapshot(enquiryId,details.commercialOverrides);
  const active=commercial.allocations.filter(row=>row.confirmation_status!=="cancelled");
  const available=new Set(active.map(allocationKey));
  const missing=required.filter(scope=>!available.has(scope.key));
  if(missing.length){
    const [destinationResult,experienceResult]=await Promise.all([
      destinationIds.length?database.from("destinations").select("id,name").in("id",destinationIds):Promise.resolve({data:[],error:null}),
      experienceIds.length?database.from("experiences").select("id,name").in("id",experienceIds):Promise.resolve({data:[],error:null})
    ]);
    const destinationNames=new Map((destinationResult.data??[]).map(item=>[item.id,item.name]));
    const experienceNames=new Map((experienceResult.data??[]).map(item=>[item.id,item.name]));
    const locationName=(key:string|null)=>key==="pickup"&&effectiveState?endpointLabel(effectiveState.pickup,"pickup"):key==="dropoff"&&effectiveState?endpointLabel(effectiveState.dropoff,"dropoff"):destinationNames.get(key?.replace(/^destination:/,"")??"")??"journey point";
    const label=(scope:typeof missing[number])=>scope.type==="accommodation"?`Stay in ${destinationNames.get(scope.destinationId??"")??"a selected destination"}`:scope.type==="guide"?(scope.guideRole==="specialist"?`${scope.guideSpeciality?.replaceAll("_"," ")??"Specialist guide"} for ${destinationNames.get(scope.destinationId??"")??"a selected destination"}`:"Primary journey guide"):scope.type==="vehicle"?`Transport from ${locationName(scope.fromLocationKey)} to ${locationName(scope.toLocationKey)}`:`Provider for ${experienceNames.get(scope.key.slice("experience:".length))??"a selected experience"}`;
    throw new ProposalError("INCOMPLETE",`Complete and save these allocations first: ${missing.map(label).join("; ")}.`);
  }
  const incompleteServices=active.filter(row=>!row.service_name||!row.quantity||!row.quantity_label||!row.pricing_plan_id&&(!row.pricing_plan_snapshot||typeof row.pricing_plan_snapshot!=="object"));
  if(incompleteServices.length)throw new ProposalError("INCOMPLETE",`Select or record a complete service rate and quantity for ${incompleteServices.length} allocation${incompleteServices.length===1?"":"s"} before generating the proposal.`);
  if(commercial.summary.incompleteLines)throw new ProposalError("INCOMPLETE","Complete supplier cost and selling price for every active allocation before generating the proposal.");
  const currencies=new Set(commercial.snapshot.filter(line=>line.confirmationStatus!=="cancelled").map(line=>line.currency));
  if(currencies.size>1)throw new ProposalError("INCOMPLETE","All proposal allocations must use the same currency.");
  const {data:last,error:lastError}=await database.from("journey_proposals").select("version").eq("enquiry_id",enquiryId).order("version",{ascending:false}).limit(1).maybeSingle();
  if(lastError)throw new ProposalError("DATABASE",lastError.message);
  const version=(last?.version??0)+1;
  const reference=`${enquiry.journey_reference}-P${version}`;
  const activeSnapshot=commercial.snapshot.filter(line=>line.confirmationStatus!=="cancelled");
  const rangeReview=reviewProposalAgainstEstimate(handoff?.quote??enquiry.estimate_snapshot,commercial.summary.totalSellingPrice,details.rangeOverrideReason);
  if(rangeReview.status==="outside_range"&&(!rangeReview.reason||rangeReview.reason.length<10))throw new ProposalError("INCOMPLETE",`This proposal is outside the traveller's submitted planning range (${rangeReview.currency} ${rangeReview.estimateTotalMin?.toLocaleString()}–${rangeReview.estimateTotalMax?.toLocaleString()}). Add a clear internal explanation before generating it.`);
  let customerSnapshot;
  try{const [composed,benefits]=await Promise.all([composeCustomerProposal(database,enquiry,design.curated,activeSnapshot,commercial.summary,{reference,version,currency:activeSnapshot[0]?.currency??"USD"},details),customerBenefitsForProposal(database,enquiryId,userId)]);customerSnapshot={...composed,benefits}}
  catch(error){throw new ProposalError("INCOMPLETE",error instanceof Error?error.message:"The customer-facing proposal could not be prepared.")}
  const readiness=validateCustomerProposal(customerSnapshot);
  if(!readiness.ready)throw new ProposalError("INCOMPLETE",readiness.issues.join(" "));
  const {data:proposal,error:proposalError}=await database.from("journey_proposals").insert({
    enquiry_id:enquiryId,curated_journey_id:design.curated?.id??null,curated_journey_snapshot:design.curated?.itinerary??null,version,proposal_reference:reference,status:"ready",
    currency:activeSnapshot[0]?.currency??"USD",total_supplier_cost:commercial.summary.totalSupplierCost,
    total_selling_price:commercial.summary.totalSellingPrice,gross_profit:commercial.summary.grossProfit,
    profit_margin:commercial.summary.profitMargin,introduction:details.introduction||null,
    terms:details.terms||null,valid_until:details.validUntil||null,
    allocation_snapshot:asJson(activeSnapshot),commercial_snapshot:asJson({summary:commercial.summary,context:commercial.commercialContext,rangeReview}),customer_snapshot:customerProposalJson(customerSnapshot),created_by:userId
  }).select("*").single();
  if(proposalError||!proposal)throw new ProposalError("DATABASE",proposalError?.message??"The proposal could not be generated.");
  const {error:supersedeError}=await database.from("journey_proposals").update({status:"superseded"}).eq("enquiry_id",enquiryId).neq("id",proposal.id).in("status",["ready","internal_approved","sent","viewed","changes_requested"]);
  if(supersedeError){await database.from("journey_proposals").delete().eq("id",proposal.id);throw new ProposalError("DATABASE",supersedeError.message)}
  const {error:statusError}=await database.rpc("execute_enquiry_transition",{p_enquiry_id:enquiryId,p_action:"prepare_proposal",p_actor_id:userId,p_reason:`Proposal ${reference} generated.`});
  if(statusError)throw new ProposalError("DATABASE",statusError.message);
  if(design.curated){const transition=await database.rpc("execute_curated_journey_transition",{p_curated_journey_id:design.curated.id,p_action:"ready_for_proposal",p_actor_id:userId});if(transition.error)throw new ProposalError("DATABASE",transition.error.message)}
  return proposal;
}

export async function transitionJourneyProposal(proposalId:string,action:"internal_approve"|"sent",userId:string){
  const database=createAdminClient();
  if(!database)throw new ProposalError("DATABASE","Supabase server credentials are unavailable.");
  const {data:proposal,error}=await database.from("journey_proposals").select("*").eq("id",proposalId).maybeSingle();
  if(error)throw new ProposalError("DATABASE",error.message);
  if(!proposal)throw new ProposalError("NOT_FOUND","Journey proposal not found.");
  if(proposal.requires_new_version)throw new ProposalError("INCOMPLETE","The curated journey or a supplier allocation changed after this proposal was prepared. Generate and review a new proposal version.");
  if(action==="internal_approve"&&proposal.status!=="ready")throw new ProposalError("INCOMPLETE","Only a ready proposal can be approved internally.");
  if(action==="sent"&&proposal.status!=="internal_approved")throw new ProposalError("INCOMPLETE","Approve the proposal internally before sending it to the traveller.");
  if(action==="internal_approve"||action==="sent"){
    const customer=customerSafeProposalDto(proposal.customer_snapshot);if(!customer)throw new ProposalError("INCOMPLETE","This legacy proposal has no customer-safe Phase 10 snapshot. Create a new proposal version before approval or sending.");
    const readiness=validateCustomerProposal(customer);if(!readiness.ready)throw new ProposalError("INCOMPLETE",readiness.issues.join(" "));
  }
  const transition=await database.rpc("transition_journey_proposal_command",{p_proposal_id:proposalId,p_action:action,p_actor_id:userId});if(transition.error)throw new ProposalError("DATABASE",transition.error.message);
  const {data:updated,error:updateError}=await database.from("journey_proposals").select("*").eq("id",proposalId).single();if(updateError||!updated)throw new ProposalError("DATABASE",updateError?.message??"Proposal status could not be loaded.");
  return updated as Proposal;
}

export async function revokeJourneyProposalAccess(proposalId:string,userId:string,reason:string){
  const database=createAdminClient();if(!database)throw new ProposalError("DATABASE","Supabase server credentials are unavailable.");
  const {data:proposal,error}=await database.from("journey_proposals").select("*").eq("id",proposalId).maybeSingle();
  if(error)throw new ProposalError("DATABASE",error.message);if(!proposal)throw new ProposalError("NOT_FOUND","Journey proposal not found.");
  if(!proposal.sent_at)throw new ProposalError("INCOMPLETE","Only a proposal that has been sent can have its traveller link revoked.");
  if(proposal.access_revoked_at)return proposal;
  const {data:updated,error:updateError}=await database.from("journey_proposals").update({access_revoked_at:new Date().toISOString(),access_revoked_by:userId,access_revocation_reason:reason.trim()}).eq("id",proposalId).select("*").single();
  if(updateError||!updated)throw new ProposalError("DATABASE",updateError?.message??"Traveller access could not be revoked.");
  return updated as Proposal;
}
