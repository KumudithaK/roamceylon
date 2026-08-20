import {randomUUID} from "node:crypto";
import {createClient} from "@supabase/supabase-js";

const ISOLATED_REF="xnsxmwgyugoqanuoyebh";
const PRODUCTION_REF="fstpfqlgypvktjwdeagu";
const roles=["journey_designer","partner_manager","finance","operations","content_marketing","super_admin"];
const url=process.env.AUTHZ_TEST_SUPABASE_URL??"";
const key=process.env.AUTHZ_TEST_SUPABASE_PUBLISHABLE_KEY??"";
const serviceKey=process.env.AUTHZ_TEST_SUPABASE_SERVICE_ROLE_KEY??"";
const projectRef=process.env.AUTHZ_TEST_PROJECT_REF??"";
const block=message=>{console.error(`[BLOCKED] ${message}`);process.exit(2)};
if(projectRef!==ISOLATED_REF||url!==`https://${ISOLATED_REF}.supabase.co`)block("isolated target did not match the approved project");
if(projectRef===PRODUCTION_REF||url.includes(PRODUCTION_REF))block("production is explicitly rejected");
if(process.env.AUTHZ_TEST_ISOLATED_PROJECT!=="true")block("isolated-project confirmation is not true");
if(!key||!serviceKey)block("isolated API keys are not configured");

const makeClient=secret=>createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
const admin=makeClient(serviceKey);
const clients={anonymous:makeClient(key)};
const userIds={};
for(const role of roles){
  const prefix=`AUTHZ_TEST_${role.toUpperCase()}`;
  const email=process.env[`${prefix}_EMAIL`];
  const password=process.env[`${prefix}_PASSWORD`];
  if(!email?.endsWith("@roamceylon.test")||!password)block(`${role} is not a verified synthetic identity`);
  const client=makeClient(key);
  const {data,error}=await client.auth.signInWithPassword({email,password});
  if(error||!data.user)block(`${role} synthetic sign-in failed`);
  clients[role]=client;
  userIds[role]=data.user.id;
}

const fixture={
  theme:process.env.AUTHZ_FIXTURE_THEME_ID,
  guide:process.env.AUTHZ_FIXTURE_GUIDE_ID,
  enquiry:process.env.AUTHZ_FIXTURE_ENQUIRY_ID,
  curatedJourney:process.env.AUTHZ_FIXTURE_CURATED_JOURNEY_ID,
  allocation:process.env.AUTHZ_FIXTURE_ALLOCATION_ID,
  account:process.env.AUTHZ_FIXTURE_ACCOUNT_ID
};
if(Object.values(fixture).some(value=>!value))block("one or more synthetic fixture identifiers are missing");

const runId=randomUUID();
const cleanup=[];
const results=[];
const record=(role,resource,action,actual,target,detail)=>results.push({role,resource,action,actual,target,targetVerdict:actual===target?"PASS":"FAIL",detail});
const allowedRows=(data,error)=>!error&&Array.isArray(data)&&data.length>0;

async function readById(role,resource,table,id,target){
  const {data,error}=await clients[role].from(table).select("id").eq("id",id);
  record(role,resource,"READ",allowedRows(data,error)?"ALLOW":"DENY",target,error?`database_error:${error.code??"unknown"}`:"fixture_visibility");
}

async function sameValueUpdate(role,resource,table,id,field,target){
  const {data:original,error:readError}=await admin.from(table).select(`id,${field}`).eq("id",id).single();
  if(readError)block(`service role could not verify ${resource} fixture`);
  const {data,error}=await clients[role].from(table).update({[field]:original[field]}).eq("id",id).select("id");
  record(role,resource,"UPDATE",allowedRows(data,error)?"ALLOW":"DENY",target,error?`database_error:${error.code??"unknown"}`:"same_value_probe");
}

async function insertProbe(role,resource,table,payload,target,cleanupTable=table){
  const {data,error}=await clients[role].from(table).insert(payload).select("id");
  const allowed=allowedRows(data,error);
  if(allowed)cleanup.push({table:cleanupTable,id:data[0].id});
  record(role,resource,"CREATE",allowed?"ALLOW":"DENY",target,error?`database_error:${error.code??"unknown"}`:"synthetic_row_created");
  return allowed?data[0]:null;
}

async function deleteById(role,resource,table,id,target){
  const {data,error}=await clients[role].from(table).delete().eq("id",id).select("id");
  const allowed=allowedRows(data,error);
  if(allowed){
    const index=cleanup.findIndex(item=>item.table===table&&item.id===id);
    if(index>=0)cleanup.splice(index,1);
  }
  record(role,resource,"DELETE",allowed?"ALLOW":"DENY",target,error?`database_error:${error.code??"unknown"}`:"synthetic_row_delete");
}

let proposal;
let settlement;
try{
  const proposalVersion=900000+Math.floor(Math.random()*90000);
  const {data:proposalData,error:proposalError}=await admin.from("journey_proposals").insert({
    enquiry_id:fixture.enquiry,
    curated_journey_id:fixture.curatedJourney,
    version:proposalVersion,
    proposal_reference:`RCJ-PHASE4-${runId}`,
    status:"ready",
    currency:"USD",
    total_supplier_cost:1,
    total_selling_price:1,
    gross_profit:0,
    profit_margin:0,
    allocation_snapshot:[],
    curated_journey_snapshot:{synthetic:true,purpose:"phase4_authorization"},
    commercial_snapshot:{synthetic:true,purpose:"phase4_authorization"}
  }).select("id").single();
  if(proposalError)block(`could not create synthetic proposal fixture (${proposalError.code??"unknown"})`);
  proposal=proposalData;
  cleanup.push({table:"journey_proposals",id:proposal.id});

  const {data:settlementData,error:settlementError}=await admin.from("journey_settlements").insert({
    account_id:fixture.account,
    source_key:`phase4-${runId}`,
    payee_type:"other",
    payee_name:"Phase 4 Synthetic Supplier",
    description:"Disposable isolated authorization fixture.",
    currency:"USD",
    amount_due:1
  }).select("id").single();
  if(settlementError)block(`could not create synthetic settlement fixture (${settlementError.code??"unknown"})`);
  settlement=settlementData;
  cleanup.push({table:"journey_settlements",id:settlement.id});

  // Direct SELECT matrix.
  await readById("journey_designer","curated_journey","curated_journeys",fixture.curatedJourney,"ALLOW");
  await readById("journey_designer","proposal","journey_proposals",proposal.id,"ALLOW");
  await readById("journey_designer","supplier_guide","guides",fixture.guide,"ALLOW");
  await readById("journey_designer","journey_account","journey_accounts",fixture.account,"DENY");

  await readById("partner_manager","supplier_guide","guides",fixture.guide,"ALLOW");
  await readById("partner_manager","supplier_allocation","journey_supplier_allocations",fixture.allocation,"ALLOW");
  await readById("partner_manager","journey_account","journey_accounts",fixture.account,"DENY");

  await readById("finance","journey_account","journey_accounts",fixture.account,"ALLOW");
  await readById("finance","settlement","journey_settlements",settlement.id,"ALLOW");
  await readById("operations","supplier_allocation","journey_supplier_allocations",fixture.allocation,"ALLOW");
  await readById("operations","journey_account","journey_accounts",fixture.account,"DENY");
  await readById("content_marketing","cms_theme","themes",fixture.theme,"ALLOW");
  await readById("content_marketing","supplier_private_data","guides",fixture.guide,"DENY");
  await readById("content_marketing","traveller_private_data","enquiries",fixture.enquiry,"DENY");
  await readById("super_admin","journey_account","journey_accounts",fixture.account,"ALLOW");
  const {data:permissionRows,error:permissionReadError}=await clients.super_admin.from("permissions").select("code").eq("code","cms.edit");
  record("super_admin","staff_permission","READ",allowedRows(permissionRows,permissionReadError)?"ALLOW":"DENY","ALLOW",permissionReadError?`database_error:${permissionReadError.code??"unknown"}`:"fixture_visibility");

  // Direct UPDATE matrix and foreign-key/commercial re-parenting guard.
  await sameValueUpdate("journey_designer","curated_journey","curated_journeys",fixture.curatedJourney,"internal_notes","ALLOW");
  await sameValueUpdate("journey_designer","cms_theme","themes",fixture.theme,"name","DENY");
  await sameValueUpdate("journey_designer","supplier_guide","guides",fixture.guide,"name","DENY");
  await sameValueUpdate("journey_designer","journey_account","journey_accounts",fixture.account,"selling_price","DENY");
  await sameValueUpdate("partner_manager","supplier_guide","guides",fixture.guide,"name","ALLOW");
  await sameValueUpdate("partner_manager","curated_journey","curated_journeys",fixture.curatedJourney,"internal_notes","DENY");
  await sameValueUpdate("partner_manager","cms_theme","themes",fixture.theme,"name","DENY");
  await sameValueUpdate("partner_manager","journey_account","journey_accounts",fixture.account,"selling_price","DENY");
  await sameValueUpdate("content_marketing","cms_theme","themes",fixture.theme,"name","ALLOW");
  await sameValueUpdate("content_marketing","curated_journey","curated_journeys",fixture.curatedJourney,"internal_notes","DENY");
  await sameValueUpdate("finance","cms_theme","themes",fixture.theme,"name","DENY");
  await sameValueUpdate("finance","supplier_guide","guides",fixture.guide,"name","DENY");
  await sameValueUpdate("finance","curated_journey","curated_journeys",fixture.curatedJourney,"internal_notes","DENY");
  await sameValueUpdate("operations","allocation_delivery","journey_supplier_allocations",fixture.allocation,"special_notes","ALLOW");
  await sameValueUpdate("operations","supplier_guide","guides",fixture.guide,"name","DENY");
  await sameValueUpdate("operations","cms_theme","themes",fixture.theme,"name","DENY");
  await sameValueUpdate("operations","curated_journey","curated_journeys",fixture.curatedJourney,"internal_notes","DENY");
  await sameValueUpdate("super_admin","cms_theme","themes",fixture.theme,"name","ALLOW");
  await sameValueUpdate("super_admin","supplier_guide","guides",fixture.guide,"name","ALLOW");
  await sameValueUpdate("super_admin","curated_journey","curated_journeys",fixture.curatedJourney,"internal_notes","ALLOW");
  await sameValueUpdate("super_admin","journey_account","journey_accounts",fixture.account,"selling_price","ALLOW");

  const {data:allocationOriginal,error:allocationReadError}=await admin.from("journey_supplier_allocations").select("id,curated_journey_id").eq("id",fixture.allocation).single();
  if(allocationReadError)block("could not verify synthetic allocation linkage");
  const {data:reparented,error:reparentError}=await clients.operations.from("journey_supplier_allocations").update({curated_journey_id:null}).eq("id",fixture.allocation).select("id");
  const reparentAllowed=allowedRows(reparented,reparentError);
  if(reparentAllowed)await admin.from("journey_supplier_allocations").update({curated_journey_id:allocationOriginal.curated_journey_id}).eq("id",fixture.allocation);
  record("operations","allocation_foreign_key","UPDATE",reparentAllowed?"ALLOW":"DENY","DENY",reparentError?`database_error:${reparentError.code??"unknown"}`:"foreign_key_reparent_probe");

  const {data:overrideRows,error:overrideError}=await clients.finance.from("journey_accounts").update({closure_reason:"Phase 4 unauthorized override probe"}).eq("id",fixture.account).select("id");
  const overrideAllowed=allowedRows(overrideRows,overrideError);
  if(overrideAllowed)await admin.from("journey_accounts").update({closure_reason:null}).eq("id",fixture.account);
  record("finance","account_force_close_fields","UPDATE",overrideAllowed?"ALLOW":"DENY","DENY",overrideError?`database_error:${overrideError.code??"unknown"}`:"override_field_probe");
  const {data:accountOriginal,error:accountReadError}=await admin.from("journey_accounts").select("id,status").eq("id",fixture.account).single();
  if(accountReadError)block("could not verify synthetic account lifecycle");
  const {data:closedRows,error:closeError}=await clients.finance.from("journey_accounts").update({status:"closed"}).eq("id",fixture.account).select("id");
  const closeAllowed=allowedRows(closedRows,closeError);
  if(closeAllowed)await admin.from("journey_accounts").update({status:accountOriginal.status}).eq("id",fixture.account);
  record("finance","account_force_close_status","UPDATE",closeAllowed?"ALLOW":"DENY","DENY",closeError?`database_error:${closeError.code??"unknown"}`:"force_close_probe");

  // CREATE and DELETE command differences use disposable rows only.
  const contentTheme=await insertProbe("content_marketing","cms_theme","themes",{
    name:"Phase 4 Disposable Theme",
    slug:`phase-4-${runId}`,
    short_description:"Disposable isolated authorization fixture.",
    status:"draft",
    active:true,
    created_by:userIds.content_marketing,
    updated_by:userIds.content_marketing
  },"ALLOW");
  if(contentTheme)await deleteById("content_marketing","cms_theme","themes",contentTheme.id,"ALLOW");

  const partnerGuide=await insertProbe("partner_manager","supplier_guide","guides",{
    name:"Phase 4 Disposable Guide",
    slug:`phase-4-${runId}`,
    short_bio:"Disposable isolated authorization fixture.",
    languages:["English"],
    specialities:["Authorization testing"],
    status:"draft",
    active:true,
    is_sample:true
  },"ALLOW");
  if(partnerGuide)await deleteById("partner_manager","supplier_guide","guides",partnerGuide.id,"ALLOW");

  const change=await insertProbe("journey_designer","journey_change","curated_journey_changes",{
    curated_journey_id:fixture.curatedJourney,
    change_type:"phase4_probe",
    subject_type:"authorization",
    summary:"Disposable isolated authorization fixture.",
    changed_by:userIds.journey_designer
  },"ALLOW");
  if(change)await deleteById("journey_designer","journey_change","curated_journey_changes",change.id,"DENY");

  const transaction=await insertProbe("finance","accounting_transaction","accounting_transactions",{
    account_id:fixture.account,
    transaction_type:"customer_receipt",
    amount:0.01,
    currency:"USD",
    reference:"Phase 4 disposable authorization fixture",
    idempotency_key:`phase4-${runId}`,
    created_by:userIds.finance
  },"ALLOW");
  if(transaction)await deleteById("finance","accounting_transaction","accounting_transactions",transaction.id,"ALLOW");

  // Sensitive RPCs enforce exact capabilities internally.
  for(const rpcCase of [
    {role:"content_marketing",resource:"cms_relationship_rpc",type:"destinations",target:"ALLOW"},
    {role:"journey_designer",resource:"cms_relationship_rpc",type:"destinations",target:"DENY"},
    {role:"partner_manager",resource:"supplier_relationship_rpc",type:"guides",target:"ALLOW"},
    {role:"content_marketing",resource:"supplier_relationship_rpc",type:"guides",target:"DENY"}
  ]){
    const {error}=await clients[rpcCase.role].rpc("sync_content_relationships",{
      resource_type:rpcCase.type,
      resource_id:randomUUID(),
      theme_ids:[],destination_ids:[],experience_ids:[]
    });
    record(rpcCase.role,rpcCase.resource,"RPC",error?"DENY":"ALLOW",rpcCase.target,error?`database_error:${error.code??"unknown"}`:"capability_checked_rpc");
  }

  // Ordinary staff cannot grant themselves roles/capabilities or restore the
  // legacy editor shortcut. Super Admin can perform legitimate staff access work.
  for(const role of ["journey_designer","partner_manager","finance"]){
    const {data:assignment,error:assignmentError}=await clients[role].from("profile_staff_roles").insert({profile_id:userIds[role],role_code:"super_admin",assigned_by:userIds[role]}).select("role_code");
    const assignmentAllowed=allowedRows(assignment,assignmentError);
    if(assignmentAllowed)await admin.from("profile_staff_roles").delete().eq("profile_id",userIds[role]).eq("role_code","super_admin");
    record(role,"self_role_assignment","CREATE",assignmentAllowed?"ALLOW":"DENY","DENY",assignmentError?`database_error:${assignmentError.code??"unknown"}`:"self_escalation_probe");

    const {data:permission,error:permissionError}=await clients[role].from("staff_role_permissions").insert({role_code:role,permission_code:"users.manage"}).select("role_code");
    const permissionAllowed=allowedRows(permission,permissionError);
    if(permissionAllowed)await admin.from("staff_role_permissions").delete().eq("role_code",role).eq("permission_code","users.manage");
    record(role,"self_capability_assignment","CREATE",permissionAllowed?"ALLOW":"DENY","DENY",permissionError?`database_error:${permissionError.code??"unknown"}`:"self_escalation_probe");

    const {data:profile,error:profileError}=await clients[role].from("profiles").update({role:"admin"}).eq("id",userIds[role]).select("id");
    const profileAllowed=allowedRows(profile,profileError);
    if(profileAllowed)await admin.from("profiles").update({role:"editor"}).eq("id",userIds[role]);
    record(role,"legacy_profile_role","UPDATE",profileAllowed?"ALLOW":"DENY","DENY",profileError?`database_error:${profileError.code??"unknown"}`:"legacy_role_escalation_probe");
  }

  await admin.from("profile_staff_roles").delete().eq("profile_id",userIds.content_marketing).eq("role_code","partner_manager");
  const {data:adminAssignment,error:adminAssignmentError}=await clients.super_admin.from("profile_staff_roles").insert({
    profile_id:userIds.content_marketing,
    role_code:"partner_manager",
    assigned_by:userIds.super_admin
  }).select("role_code");
  const adminAssignmentAllowed=allowedRows(adminAssignment,adminAssignmentError);
  if(adminAssignmentAllowed)await clients.super_admin.from("profile_staff_roles").delete().eq("profile_id",userIds.content_marketing).eq("role_code","partner_manager");
  record("super_admin","staff_role_assignment","CREATE_DELETE",adminAssignmentAllowed?"ALLOW":"DENY","ALLOW",adminAssignmentError?`database_error:${adminAssignmentError.code??"unknown"}`:"legitimate_staff_management_probe");
}finally{
  for(const item of cleanup.reverse())await admin.from(item.table).delete().eq("id",item.id);
}

console.log(JSON.stringify({projectRef,syntheticOnly:true,results},null,2));
if(results.some(result=>result.targetVerdict==="FAIL"))process.exitCode=1;
