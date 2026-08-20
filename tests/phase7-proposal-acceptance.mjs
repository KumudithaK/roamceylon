import {randomUUID} from "node:crypto";
import {createClient} from "@supabase/supabase-js";

const ISOLATED_REF="xnsxmwgyugoqanuoyebh",PRODUCTION_REF="fstpfqlgypvktjwdeagu";
const url=process.env.AUTHZ_TEST_SUPABASE_URL??"",serviceKey=process.env.AUTHZ_TEST_SUPABASE_SERVICE_ROLE_KEY??"",projectRef=process.env.AUTHZ_TEST_PROJECT_REF??"";
const block=message=>{console.error(`[BLOCKED] ${message}`);process.exit(2)};
if(projectRef!==ISOLATED_REF||url!==`https://${ISOLATED_REF}.supabase.co`||process.env.AUTHZ_TEST_ISOLATED_PROJECT!=="true"||url.includes(PRODUCTION_REF))block("isolated-project safety gate failed");
const admin=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
const enquiryIds=[],curatedIds=[],proposalIds=[],results=[];
const record=(probe,actual,target,detail)=>results.push({probe,actual,target,detail,targetVerdict:actual===target?"PASS":"FAIL"});
const isoDate=offset=>{const date=new Date();date.setUTCDate(date.getUTCDate()+offset);return date.toISOString().slice(0,10)};

async function scenario(options={}){
  const marker=randomUUID(),email=`phase7-${marker}@roamceylon.test`;
  const enquiry=await admin.from("enquiries").insert({name:"Phase Seven Synthetic",email,trip_state:{synthetic:true},status:options.enquiryStatus??"proposal_sent"}).select("id").single();
  if(enquiry.error)block(`synthetic enquiry creation failed (${enquiry.error.code})`);enquiryIds.push(enquiry.data.id);
  let curatedId=null;
  if(options.curated!==false){const curated=await admin.from("curated_journeys").insert({enquiry_id:enquiry.data.id,status:"ready_for_proposal",itinerary:{synthetic:true},source_brief_created_at:new Date().toISOString()}).select("id").single();if(curated.error)block(`synthetic Curated Journey creation failed (${curated.error.code})`);curatedId=curated.data.id;curatedIds.push(curatedId)}
  const snapshot={schemaVersion:1,traveller:{name:"Phase Seven Synthetic",email},pricing:{total:125,currency:"USD"},benefits:[{name:"Synthetic accepted benefit"}]};
  const proposal=await admin.from("journey_proposals").insert({
    enquiry_id:enquiry.data.id,curated_journey_id:curatedId,curated_journey_snapshot:curatedId?{synthetic:true}:null,
    version:options.version??1,proposal_reference:`RCJ-PHASE7-${marker}`,status:options.status??"sent",
    currency:"USD",total_supplier_cost:80,total_selling_price:125,gross_profit:45,profit_margin:36,
    allocation_snapshot:[{synthetic:true,supplierCost:80,sellingPrice:125}],commercial_snapshot:{summary:{totalSellingPrice:125,internalCost:80}},
    customer_snapshot:snapshot,sent_snapshot:options.sentSnapshot===false?null:snapshot,
    internally_approved_at:options.internalApproval===false?null:new Date().toISOString(),sent_at:options.sent===false?null:new Date().toISOString(),
    valid_until:options.expired?isoDate(-1):isoDate(30),requires_new_version:Boolean(options.requiresNew),out_of_date_at:options.requiresNew?new Date().toISOString():null,
    access_revoked_at:options.revoked?new Date().toISOString():null,access_revocation_reason:options.revoked?"Synthetic Phase 7 probe":null
  }).select("id,public_token").single();
  if(proposal.error)block(`synthetic proposal creation failed (${proposal.error.code})`);proposalIds.push(proposal.data.id);
  return {enquiryId:enquiry.data.id,curatedId,proposalId:proposal.data.id,token:proposal.data.public_token,email,snapshot};
}

const accept=(fixture,overrides={})=>admin.rpc("accept_journey_proposal_command",{p_public_token:fixture.token,p_name:"Synthetic Traveller",p_email:overrides.email??fixture.email,p_metadata:{synthetic:true}});
try{
  const valid=await scenario(),validResult=await accept(valid);
  const [validAcceptance,validProposal,validEnquiry,validJourneyCount,validAccountCount]=await Promise.all([
    admin.from("journey_proposal_acceptances").select("proposal_version,accepted_total,currency",{count:"exact"}).eq("proposal_id",valid.proposalId),
    admin.from("journey_proposals").select("status,total_selling_price,currency").eq("id",valid.proposalId).single(),
    admin.from("enquiries").select("status").eq("id",valid.enquiryId).single(),
    admin.from("curated_journeys").select("id",{count:"exact",head:true}).eq("enquiry_id",valid.enquiryId),
    admin.from("journey_accounts").select("id",{count:"exact",head:true}).eq("enquiry_id",valid.enquiryId)
  ]);
  record("valid exact-token acceptance",!validResult.error&&validAcceptance.count===1&&validAcceptance.data?.[0]?.accepted_total===125&&validProposal.data?.status==="approved"&&validEnquiry.data?.status==="proposal_accepted"?"ALLOW":"DENY","ALLOW","one acceptance and matching proposal/enquiry state");
  record("dependent record integrity",validJourneyCount.count===1&&validAccountCount.count===0?"PASS":"FAIL","PASS","pre-existing Curated Journey preserved; Accounting remains deposit-created");
  const duplicate=await accept(valid),duplicateCount=await admin.from("journey_proposal_acceptances").select("id",{count:"exact",head:true}).eq("proposal_id",valid.proposalId);
  record("duplicate acceptance",duplicate.error&&duplicateCount.count===1?"SAFE":"UNSAFE","SAFE","conflict without duplicate records");
  const acceptanceRow=await admin.from("journey_proposal_acceptances").select("id").eq("proposal_id",valid.proposalId).single();
  const acceptanceRewrite=await admin.from("journey_proposal_acceptances").update({accepted_total:1}).eq("id",acceptanceRow.data?.id??"");
  const proposalRewrite=await admin.from("journey_proposals").update({accepted_email:"changed@roamceylon.test"}).eq("id",valid.proposalId);
  record("accepted agreement immutability",acceptanceRewrite.error&&proposalRewrite.error?"DENY":"ALLOW","DENY","acceptance and accepted proposal evidence cannot be rewritten");

  const concurrent=await scenario(),attempts=await Promise.all([accept(concurrent),accept(concurrent)]),concurrentAcceptances=await admin.from("journey_proposal_acceptances").select("id",{count:"exact",head:true}).eq("proposal_id",concurrent.proposalId);
  record("concurrent acceptance",attempts.filter(item=>!item.error).length===1&&concurrentAcceptances.count===1?"SAFE":"UNSAFE","SAFE","one business outcome");

  for(const [probe,options] of [
    ["expired proposal",{expired:true}],
    ["revoked proposal",{revoked:true}],
    ["unapproved draft proposal",{status:"ready",internalApproval:false,sent:false}],
    ["proposal requiring a new version",{requiresNew:true}]
  ]){const fixture=await scenario(options),result=await accept(fixture),count=await admin.from("journey_proposal_acceptances").select("id",{count:"exact",head:true}).eq("proposal_id",fixture.proposalId);record(probe,result.error&&count.count===0?"DENY":"ALLOW","DENY","no acceptance persisted")}

  const outdated=await scenario();
  const newer=await admin.from("journey_proposals").insert({enquiry_id:outdated.enquiryId,curated_journey_id:outdated.curatedId,curated_journey_snapshot:{synthetic:true},version:2,proposal_reference:`RCJ-PHASE7-${randomUUID()}`,status:"ready",currency:"USD",total_supplier_cost:80,total_selling_price:125,gross_profit:45,profit_margin:36,allocation_snapshot:[],commercial_snapshot:{summary:{totalSellingPrice:125}},customer_snapshot:outdated.snapshot}).select("id").single();
  if(newer.error)block(`newer proposal fixture failed (${newer.error.code})`);proposalIds.push(newer.data.id);
  const outdatedResult=await accept(outdated);record("outdated proposal version",outdatedResult.error?"DENY":"ALLOW","DENY","newer version exists for the same enquiry");

  const wrongEmail=await scenario(),wrongEmailResult=await accept(wrongEmail,{email:"other@roamceylon.test"});record("token for different traveller identity",wrongEmailResult.error?"DENY":"ALLOW","DENY","authoritative sent-snapshot email enforced");
  const invalidToken=await admin.rpc("accept_journey_proposal_command",{p_public_token:randomUUID(),p_name:"Synthetic Traveller",p_email:"nobody@roamceylon.test",p_metadata:{synthetic:true}});record("invalid public token",invalidToken.error?"DENY":"ALLOW","DENY","no proposal identified");
  const idSubstitution=await admin.rpc("accept_journey_proposal_command",{p_proposal_id:wrongEmail.proposalId,p_name:"Synthetic Traveller",p_email:wrongEmail.email,p_metadata:{synthetic:true}});record("proposal ID substitution",idSubstitution.error?"DENY":"ALLOW","DENY","ID-shaped RPC payload has no matching command");
  const priceTamper=await admin.rpc("accept_journey_proposal_command",{p_public_token:wrongEmail.token,p_name:"Synthetic Traveller",p_email:wrongEmail.email,p_metadata:{synthetic:true},p_total_selling_price:1,p_supplier_cost:1,p_currency:"LKR"});record("commercial payload tampering",priceTamper.error?"DENY":"ALLOW","DENY","commercial arguments are not accepted by the command");

  const rollback=await scenario({enquiryStatus:"new"}),rollbackResult=await accept(rollback);
  const [rollbackAcceptance,rollbackProposal,rollbackEnquiry]=await Promise.all([
    admin.from("journey_proposal_acceptances").select("id",{count:"exact",head:true}).eq("proposal_id",rollback.proposalId),
    admin.from("journey_proposals").select("status").eq("id",rollback.proposalId).single(),
    admin.from("enquiries").select("status").eq("id",rollback.enquiryId).single()
  ]);
  record("downstream failure rollback",rollbackResult.error&&rollbackAcceptance.count===0&&rollbackProposal.data?.status==="sent"&&rollbackEnquiry.data?.status==="new"?"PASS":"FAIL","PASS","acceptance insert and proposal update rolled back when lifecycle transition failed");

  const directStatus=await admin.from("enquiries").update({status:"completed"}).eq("id",wrongEmail.enquiryId);record("Phase 6 direct lifecycle regression",directStatus.error?"DENY":"ALLOW","DENY","generic status guard preserved");
  const anonymous=createClient(url,process.env.AUTHZ_TEST_SUPABASE_PUBLISHABLE_KEY??"",{auth:{persistSession:false}});
  const [publicProjection,privateSupplier,privateProposal]=await Promise.all([anonymous.from("public_accommodations").select("id").limit(1),anonymous.from("accommodations").select("*").limit(1),anonymous.from("journey_proposals").select("*").limit(1)]);
  record("Phase 2 public projection",publicProjection.error?"DENY":"ALLOW","ALLOW","public content remains available");
  record("Phase 2 supplier boundary",!privateSupplier.error&&privateSupplier.data?.length?"ALLOW":"DENY","DENY","private supplier data remains protected");
  record("Phase 5 proposal PII boundary",!privateProposal.error&&privateProposal.data?.length?"ALLOW":"DENY","DENY","proposal base rows remain private");
}finally{
  for(const proposalId of proposalIds.reverse()){await admin.from("journey_proposal_acceptances").delete().eq("proposal_id",proposalId);await admin.from("journey_proposals").delete().eq("id",proposalId)}
  for(const curatedId of curatedIds.reverse())await admin.from("curated_journeys").delete().eq("id",curatedId);
  for(const enquiryId of enquiryIds.reverse())await admin.from("enquiries").delete().eq("id",enquiryId);
}
const failures=results.filter(item=>item.targetVerdict==="FAIL");
console.log(JSON.stringify({projectRef,results,cleanup:{syntheticRecordsRemoved:true},summary:{total:results.length,passed:results.length-failures.length,failed:failures.length}},null,2));
if(failures.length)process.exit(1);
