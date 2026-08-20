import {randomUUID} from "node:crypto";
import {spawn} from "node:child_process";
import {closeSync,cpSync,mkdirSync,mkdtempSync,openSync,rmSync,symlinkSync} from "node:fs";
import {tmpdir} from "node:os";
import {dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {createClient} from "@supabase/supabase-js";

const ISOLATED_REF="xnsxmwgyugoqanuoyebh",PRODUCTION_REF="fstpfqlgypvktjwdeagu",roles=["journey_designer","partner_manager","finance","operations","content_marketing","super_admin"];
const url=process.env.AUTHZ_TEST_SUPABASE_URL??"",key=process.env.AUTHZ_TEST_SUPABASE_PUBLISHABLE_KEY??"",serviceKey=process.env.AUTHZ_TEST_SUPABASE_SERVICE_ROLE_KEY??"",projectRef=process.env.AUTHZ_TEST_PROJECT_REF??"";
const block=message=>{console.error(`[BLOCKED] ${message}`);process.exit(2)};
if(projectRef!==ISOLATED_REF||url!==`https://${ISOLATED_REF}.supabase.co`||process.env.AUTHZ_TEST_ISOLATED_PROJECT!=="true"||url.includes(PRODUCTION_REF))block("isolated-project safety gate failed");
const client=secret=>createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}}),admin=client(serviceKey),clients={},sessions={};
for(const role of roles){const prefix=`AUTHZ_TEST_${role.toUpperCase()}`,email=process.env[`${prefix}_EMAIL`],password=process.env[`${prefix}_PASSWORD`];if(!email?.endsWith("@roamceylon.test")||!password)block(`${role} synthetic identity is unavailable`);const instance=client(key),login=await instance.auth.signInWithPassword({email,password});if(login.error||!login.data.session)block(`${role} synthetic sign-in failed`);clients[role]=instance;sessions[role]=login.data.session.access_token}
const ids=[],proposalIds=[],results=[];let server=null,temporaryRoot="";const record=(role,probe,actual,target)=>results.push({role,probe,actual,target,targetVerdict:actual===target?"PASS":"FAIL"});
const make=async status=>{const result=await admin.from("enquiries").insert({name:"Phase Six Synthetic",email:`phase6-${randomUUID()}@roamceylon.test`,trip_state:{synthetic:true},status}).select("id").single();if(result.error)block(`synthetic enquiry failed (${result.error.code})`);ids.push(result.data.id);return result.data.id};
const action=async(role,id,name)=>{const result=await clients[role].rpc("execute_enquiry_transition",{p_enquiry_id:id,p_action:name,p_actor_id:null,p_reason:"synthetic Phase 6 probe"});return !result.error};
const stopServer=async()=>{if(!server||server.exitCode!==null)return;server.kill("SIGTERM");await Promise.race([new Promise(done=>server.once("exit",done)),new Promise(done=>setTimeout(()=>{server.kill("SIGKILL");done();},5000))])};
try{
  let id=await make("new");record("journey_designer","legitimate new -> under_review",await action("journey_designer",id,"start_review")?"ALLOW":"DENY","ALLOW");
  id=await make("new");record("journey_designer","invalid new -> completed",await action("journey_designer",id,"complete_journey")?"ALLOW":"DENY","DENY");
  id=await make("under_review");record("journey_designer","repeated start-review replay",await action("journey_designer",id,"start_review")?"SAFE":"UNSAFE","SAFE");
  id=await make("preparing_proposal");record("journey_designer","backwards transition",await action("journey_designer",id,"start_review")?"ALLOW":"DENY","DENY");
  id=await make("new");record("journey_designer","unknown transition action",await action("journey_designer",id,"invented_target")?"ALLOW":"DENY","DENY");
  id=await make("new");const direct=await clients.journey_designer.from("enquiries").update({status:"completed"}).eq("id",id).select("id");record("journey_designer","direct arbitrary status update",!direct.error&&direct.data?.length?"ALLOW":"DENY","DENY");
  id=await make("journey_confirmed");record("operations","legitimate journey_confirmed -> ready_for_operations",await action("operations",id,"prepare_operations")?"ALLOW":"DENY","ALLOW");
  id=await make("new");record("operations","unrelated review transition",await action("operations",id,"start_review")?"ALLOW":"DENY","DENY");
  id=await make("journey_confirmed");const operationsDirect=await clients.operations.from("enquiries").update({status:"completed"}).eq("id",id).select("id");record("operations","direct arbitrary status update",!operationsDirect.error&&operationsDirect.data?.length?"ALLOW":"DENY","DENY");
  for(const role of ["partner_manager","finance","content_marketing"]){id=await make("new");record(role,"general lifecycle transition",await action(role,id,"start_review")?"ALLOW":"DENY","DENY")}
  id=await make("new");record("super_admin","valid start review",await action("super_admin",id,"start_review")?"ALLOW":"DENY","ALLOW");
  id=await make("new");record("super_admin","invalid lifecycle corruption",await action("super_admin",id,"complete_journey")?"ALLOW":"DENY","DENY");
  const acceptanceEnquiry=await make("proposal_sent"),reference=`RCJ-PHASE6-${randomUUID()}`;
  const proposal=await admin.from("journey_proposals").insert({enquiry_id:acceptanceEnquiry,version:1,proposal_reference:reference,status:"sent",currency:"USD",total_supplier_cost:50,total_selling_price:75,gross_profit:25,profit_margin:33.33,allocation_snapshot:[],customer_snapshot:{synthetic:true},sent_snapshot:{synthetic:true}}).select("id").single();if(proposal.error)block(`synthetic proposal failed (${proposal.error.code})`);proposalIds.push(proposal.data.id);
  const accept=()=>admin.rpc("accept_journey_proposal_command",{p_proposal_id:proposal.data.id,p_name:"Synthetic Traveller",p_email:"phase6@roamceylon.test",p_metadata:{synthetic:true}});
  const concurrent=await Promise.all([accept(),accept()]),successes=concurrent.filter(item=>!item.error).length;
  const acceptances=await admin.from("journey_proposal_acceptances").select("id",{count:"exact"}).eq("proposal_id",proposal.data.id);
  record("traveller_service","concurrent proposal acceptance",successes===1&&acceptances.count===1?"SAFE":"UNSAFE","SAFE");
  const replay=await accept();record("traveller_service","proposal acceptance replay",replay.error?"DENY":"ALLOW","DENY");
  const apiEnquiry=await make("new"),repository=resolve(dirname(fileURLToPath(import.meta.url)),".."),port=3206,baseUrl=`http://127.0.0.1:${port}`;
  temporaryRoot=mkdtempSync(resolve(tmpdir(),"roam-phase6-api-"));const temporaryRepository=resolve(temporaryRoot,"roamceylon");cpSync(repository,temporaryRepository,{recursive:true,filter:source=>{const relative=source.slice(repository.length).replace(/^\//,"");if(!relative)return true;const first=relative.split("/",1)[0];return ![".git",".next","node_modules","tmp"].includes(first)&&!first.startsWith(".env")}});symlinkSync(resolve(repository,"node_modules"),resolve(temporaryRepository,"node_modules"),"dir");mkdirSync("/tmp/roam-stabilization-phase6",{recursive:true,mode:0o700});const log=openSync("/tmp/roam-stabilization-phase6/api.log","w",0o600),environment={...process.env,NEXT_PUBLIC_SUPABASE_URL:url,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:key,SUPABASE_SERVICE_ROLE_KEY:serviceKey};for(const variable of Object.keys(environment))if(variable.startsWith("AUTHZ_TEST_"))delete environment[variable];server=spawn(resolve(repository,"node_modules/.bin/next"),["dev","--webpack","-p",String(port)],{cwd:temporaryRepository,env:environment,stdio:["ignore",log,log]});closeSync(log);
  let ready=false;for(let attempt=0;attempt<90;attempt++){if(server.exitCode!==null)break;try{const response=await fetch(`${baseUrl}/api/admin/enquiry-lifecycle`,{method:"POST",headers:{"content-type":"application/json"},body:"{}"});if(response.status===400||response.status===401){ready=true;break}}catch{}await new Promise(done=>setTimeout(done,500))}if(!ready)block("isolated API server did not become ready; private diagnostics retained");
  const call=(role,body)=>fetch(`${baseUrl}/api/admin/enquiry-lifecycle`,{method:"POST",headers:{"content-type":"application/json",authorization:`Bearer ${sessions[role]}`},body:JSON.stringify(body)});
  let response=await call("journey_designer",{enquiryId:apiEnquiry,action:"start_review",status:"completed"});record("journey_designer","API mass-assignment status injection",response.status===400?"DENY":"ALLOW","DENY");
  response=await call("content_marketing",{enquiryId:apiEnquiry,action:"start_review"});record("content_marketing","API lifecycle action",response.status===403?"DENY":"ALLOW","DENY");
  response=await call("journey_designer",{enquiryId:apiEnquiry,action:"start_review"});record("journey_designer","API legitimate lifecycle action",response.ok?"ALLOW":"DENY","ALLOW");
  const anonymous=client(key),publicContent=await anonymous.from("public_accommodations").select("id").limit(1),privateContent=await anonymous.from("accommodations").select("*").limit(1),publicSettings=await anonymous.from("website_public_settings").select("id").limit(1),privateSettings=await anonymous.from("website_settings").select("setup_checklist").limit(1);
  record("anonymous","Phase 2 public supplier projection",publicContent.error?"DENY":"ALLOW","ALLOW");record("anonymous","Phase 2 private supplier data",!privateContent.error&&privateContent.data?.length?"ALLOW":"DENY","DENY");record("anonymous","Phase 2 website public projection",publicSettings.error?"DENY":"ALLOW","ALLOW");record("anonymous","Phase 2 internal setup state",!privateSettings.error&&privateSettings.data?.length?"ALLOW":"DENY","DENY");
  const financeUser=(await clients.finance.auth.getUser()).data.user,escalation=await clients.finance.from("profile_staff_roles").insert({profile_id:financeUser.id,role_code:"super_admin"}).select("role_code");record("finance","Phase 3/4 self escalation",!escalation.error&&escalation.data?.length?"ALLOW":"DENY","DENY");
  const designProjection=await clients.journey_designer.from("traveller_journey_design").select("id").eq("id",apiEnquiry),contentProjection=await clients.content_marketing.from("traveller_admin_full").select("id").eq("id",apiEnquiry);record("journey_designer","Phase 5 design-purpose projection",!designProjection.error&&designProjection.data?.length===1?"ALLOW":"DENY","ALLOW");record("content_marketing","Phase 5 traveller PII",!contentProjection.error&&contentProjection.data?.length?"ALLOW":"DENY","DENY");
}finally{
  await stopServer();if(temporaryRoot)rmSync(temporaryRoot,{recursive:true,force:true});
  for(const proposalId of proposalIds){await admin.from("journey_proposal_acceptances").delete().eq("proposal_id",proposalId);await admin.from("journey_proposals").delete().eq("id",proposalId)}
  for(const id of ids)await admin.from("enquiries").delete().eq("id",id);
}
const failures=results.filter(item=>item.targetVerdict==="FAIL");console.log(JSON.stringify({projectRef,results,cleanup:{syntheticRecordsRemoved:true},summary:{total:results.length,passed:results.length-failures.length,failed:failures.length}},null,2));if(failures.length)process.exit(1);
