import {spawn} from "node:child_process";
import {closeSync,cpSync,mkdirSync,mkdtempSync,openSync,rmSync,symlinkSync} from "node:fs";
import {tmpdir} from "node:os";
import {dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {randomUUID} from "node:crypto";
import {createClient} from "@supabase/supabase-js";

const ISOLATED_REF="xnsxmwgyugoqanuoyebh",PRODUCTION_REF="fstpfqlgypvktjwdeagu";
const roles=["journey_designer","partner_manager","finance","operations","content_marketing","super_admin"];
const url=process.env.AUTHZ_TEST_SUPABASE_URL??"",key=process.env.AUTHZ_TEST_SUPABASE_PUBLISHABLE_KEY??"",serviceKey=process.env.AUTHZ_TEST_SUPABASE_SERVICE_ROLE_KEY??"",projectRef=process.env.AUTHZ_TEST_PROJECT_REF??"";
const block=message=>{console.error(`[BLOCKED] ${message}`);process.exit(2)};
if(projectRef!==ISOLATED_REF||url!==`https://${ISOLATED_REF}.supabase.co`||process.env.AUTHZ_TEST_ISOLATED_PROJECT!=="true")block("isolated target did not match the approved project");
if(projectRef===PRODUCTION_REF||url.includes(PRODUCTION_REF))block("production is explicitly rejected");
if(!key||!serviceKey)block("isolated API keys are not configured");

const makeClient=secret=>createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
const admin=makeClient(serviceKey),clients={},sessions={};
for(const role of roles){
  const prefix=`AUTHZ_TEST_${role.toUpperCase()}`,email=process.env[`${prefix}_EMAIL`],password=process.env[`${prefix}_PASSWORD`];
  if(!email?.endsWith("@roamceylon.test")||!password)block(`${role} is not a verified synthetic identity`);
  const client=makeClient(key),{data,error}=await client.auth.signInWithPassword({email,password});
  if(error||!data.session)block(`${role} synthetic sign-in failed`);
  clients[role]=client;sessions[role]=data.session.access_token;
}

const runId=randomUUID(),results=[];
const record=(role,resource,action,actual,target,fields=[])=>results.push({role,resource,action,actual,target,targetVerdict:actual===target?"PASS":"FAIL",fields});
const allow=(data,error)=>!error&&Array.isArray(data)&&data.length===1;
let enquiryId="",curatedId="",proposalId="",accountId="",changeId="";
let server=null,temporaryRoot="";

async function projection(role,table,target,required=[],forbidden=[]){
  const {data,error}=await clients[role].from(table).select("*").eq("id",enquiryId);
  const permitted=allow(data,error),fields=permitted?Object.keys(data[0]).sort():[];
  const fieldSafe=permitted&&required.every(field=>fields.includes(field))&&forbidden.every(field=>!fields.includes(field));
  record(role,table,"FIELD_SET",permitted&&fieldSafe?"ALLOW":"DENY",target,fields);
}

async function stopServer(){if(!server||server.exitCode!==null)return;server.kill("SIGTERM");await Promise.race([new Promise(done=>server.once("exit",done)),new Promise(done=>setTimeout(()=>{server.kill("SIGKILL");done();},5000))]);}

try{
  const {data:enquiry,error:enquiryError}=await admin.from("enquiries").insert({
    name:"Phase Five Identity Marker",email:`phase5-${runId}@roamceylon.test`,phone:"+94000000000",nationality:"Synthetic",
    summary:"Synthetic travel requirement marker",trip_state:{version:1,createdAt:"",state:{currentStep:6,selectedThemeIds:[],selectedDestinationIds:[],selectedExperienceIds:[],destinationPreferences:{},journeyGuidePreference:"recommend",journeyGuideLanguages:[],journeyGuideNotes:"Sensitive guide marker",pickup:{},dropoff:{},globalTravelPreference:"recommend",travelPreferencesByLeg:{},selectedStayIdsByDestination:{},selectedVehicleId:null,selectedGuideId:null,selectedPricingPlanIds:{},travelDates:{start:"2027-01-01",end:"2027-01-03"},travellerCounts:{adults:2,children:0,infants:0},experienceParticipants:{},budgetPreference:"flexible",travelPace:"balanced",accessibilityRequirements:"Sensitive accessibility marker"},quote:null},
    status:"journey_confirmed",travel_start_date:"2027-01-01",travel_end_date:"2027-01-03",adults:2,children:0,
    traveller_notes:"Sensitive traveller note marker",internal_notes:"Sensitive internal note marker"
  }).select("id,journey_reference,created_at").single();
  if(enquiryError||!enquiry)block(`synthetic enquiry could not be created (${enquiryError?.code??"unknown"})`);enquiryId=enquiry.id;
  const {data:curated,error:curatedError}=await admin.from("curated_journeys").insert({enquiry_id:enquiryId,status:"designing",itinerary:{synthetic:true},internal_notes:"Sensitive operational marker",source_brief_created_at:enquiry.created_at}).select("id").single();
  if(curatedError||!curated)block(`synthetic curated journey could not be created (${curatedError?.code??"unknown"})`);curatedId=curated.id;
  const {data:proposal,error:proposalError}=await admin.from("journey_proposals").insert({enquiry_id:enquiryId,curated_journey_id:curatedId,version:1,proposal_reference:`RCJ-PHASE5-${runId}`,status:"ready",currency:"USD",total_supplier_cost:50,total_selling_price:75,gross_profit:25,profit_margin:33.33,allocation_snapshot:[],curated_journey_snapshot:{privateNote:"Sensitive marker"},commercial_snapshot:{synthetic:true},customer_snapshot:{traveller:{name:"Phase Five Identity Marker",email:`phase5-${runId}@roamceylon.test`}}}).select("id").single();
  if(proposalError||!proposal)block(`synthetic proposal could not be created (${proposalError?.code??"unknown"})`);proposalId=proposal.id;
  const {data:change,error:changeError}=await admin.from("journey_proposal_change_requests").insert({proposal_id:proposalId,category:"general",message:"Sensitive traveller request marker",traveller_name:"Phase Five Identity Marker",traveller_email:`phase5-${runId}@roamceylon.test`}).select("id").single();
  if(changeError||!change)block(`synthetic change request could not be created (${changeError?.code??"unknown"})`);changeId=change.id;
  const {data:account,error:accountError}=await admin.from("journey_accounts").insert({enquiry_id:enquiryId,journey_reference:enquiry.journey_reference,traveller_name:"Phase Five Identity Marker",traveller_email:`phase5-${runId}@roamceylon.test`,status:"active",active:true,currency:"USD",selling_price:75,internal_cost:50,gross_profit:25,profit_margin:33.33,quote_snapshot:{traveller:{email:`phase5-${runId}@roamceylon.test`}}}).select("id").single();
  if(accountError||!account)block(`synthetic account could not be created (${accountError?.code??"unknown"})`);accountId=account.id;

  for(const role of roles){
    const {data,error}=await clients[role].from("enquiries").select("*").eq("id",enquiryId);
    record(role,"enquiries","COMPLETE_BASE_ROW",allow(data,error)?"ALLOW":"DENY","DENY");
  }
  await projection("journey_designer","traveller_journey_design","ALLOW",["name","email","phone","trip_state","traveller_notes"],[]);
  await projection("finance","traveller_finance_reference","ALLOW",["name","journey_reference"],["email","phone","trip_state","traveller_notes","internal_notes"]);
  await projection("operations","traveller_operations_context","ALLOW",["name","phone","operational_brief"],["email","internal_notes","estimate_snapshot"]);
  await projection("partner_manager","traveller_supplier_context","ALLOW",["journey_reference","supplier_brief"],["name","email","phone","traveller_notes","internal_notes"]);
  await projection("content_marketing","traveller_journey_design","DENY",[],[]);
  await projection("content_marketing","traveller_finance_reference","DENY",[],[]);
  await projection("content_marketing","traveller_operations_context","DENY",[],[]);
  await projection("content_marketing","traveller_supplier_context","DENY",[],[]);
  await projection("content_marketing","traveller_admin_full","DENY",[],[]);
  await projection("content_marketing","staff_journey_request_summary","DENY",[],[]);
  await projection("super_admin","traveller_admin_full","ALLOW",["name","email","phone","trip_state","internal_notes"],[]);
  const {data:partnerSummary,error:partnerSummaryError}=await clients.partner_manager.from("staff_journey_request_summary").select("*").eq("id",enquiryId);
  const partnerSummarySafe=allow(partnerSummary,partnerSummaryError)&&partnerSummary[0].traveller_name===null;
  record("partner_manager","staff_journey_request_summary","VALUE_MINIMIZATION",partnerSummarySafe?"ALLOW":"DENY","ALLOW",partnerSummarySafe?Object.keys(partnerSummary[0]).sort():[]);

  for(const role of roles){
    const {data,error}=await clients[role].from("journey_proposals").select("*").eq("id",proposalId);
    record(role,"journey_proposals","COMPLETE_BASE_ROW",allow(data,error)?"ALLOW":"DENY","DENY");
  }
  const {data:financeAccounts,error:financeAccountError}=await clients.finance.from("finance_journey_accounts").select("*").eq("id",accountId);
  const financeAccountFields=allow(financeAccounts,financeAccountError)?Object.keys(financeAccounts[0]).sort():[];
  record("finance","finance_journey_accounts","FIELD_SET",allow(financeAccounts,financeAccountError)&&!financeAccountFields.includes("traveller_email")&&!financeAccountFields.includes("quote_snapshot")?"ALLOW":"DENY","ALLOW",financeAccountFields);
  const {data:baseAccount,error:baseAccountError}=await clients.finance.from("journey_accounts").select("*").eq("id",accountId);
  record("finance","journey_accounts","COMPLETE_BASE_ROW",allow(baseAccount,baseAccountError)?"ALLOW":"DENY","DENY");

  for(const role of ["journey_designer","finance","operations","partner_manager","content_marketing"]){
    const {data,error}=await clients[role].from("curated_journeys").select("id,enquiries(*)").eq("id",curatedId);
    const leaked=!error&&Array.isArray(data)&&data.some(row=>row.enquiries&&Object.keys(row.enquiries).some(field=>["email","phone","trip_state","traveller_notes","internal_notes"].includes(field)));
    record(role,"curated_journeys.enquiries","NESTED_BYPASS",leaked?"ALLOW":"DENY","DENY");
  }

  const repository=resolve(dirname(fileURLToPath(import.meta.url)),".."),port=3205,baseUrl=`http://127.0.0.1:${port}`,diagnostics="/tmp/roam-stabilization-phase5/api.log";
  temporaryRoot=mkdtempSync(resolve(tmpdir(),"roam-phase5-api-"));const temporaryRepository=resolve(temporaryRoot,"roamceylon");mkdirSync(dirname(diagnostics),{recursive:true,mode:0o700});
  cpSync(repository,temporaryRepository,{recursive:true,filter:source=>{const relative=source.slice(repository.length).replace(/^\//,"");if(!relative)return true;const first=relative.split("/",1)[0];return ![".git",".next","node_modules","tmp"].includes(first)&&!first.startsWith(".env")}});symlinkSync(resolve(repository,"node_modules"),resolve(temporaryRepository,"node_modules"),"dir");
  const log=openSync(diagnostics,"w",0o600),environment={...process.env,NEXT_PUBLIC_SUPABASE_URL:url,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:key,SUPABASE_SERVICE_ROLE_KEY:serviceKey};for(const variable of Object.keys(environment))if(variable.startsWith("AUTHZ_TEST_")||variable.startsWith("AUTHZ_FIXTURE_"))delete environment[variable];
  server=spawn(resolve(repository,"node_modules/.bin/next"),["dev","--webpack","-p",String(port)],{cwd:temporaryRepository,env:environment,stdio:["ignore",log,log]});closeSync(log);
  let ready=false;for(let attempt=0;attempt<90;attempt++){if(server.exitCode!==null)break;try{const response=await fetch(`${baseUrl}/api/admin/quotes`,{method:"POST",headers:{"content-type":"application/json"},body:"{}"});if(response.status===401){ready=true;break}}catch{}await new Promise(done=>setTimeout(done,500))}if(!ready)block("isolated API server did not become ready; private diagnostics retained");
  for(const role of ["journey_designer","finance","partner_manager"]){
    const response=await fetch(`${baseUrl}/api/admin/journey-proposals?enquiryId=${enquiryId}`,{headers:{authorization:`Bearer ${sessions[role]}`}}),payload=await response.json();
    if(role==="journey_designer")record(role,"journey_proposals_api","FIELD_SET",response.ok&&payload.proposals?.[0]?.customer_snapshot?.traveller&&payload.changeRequests?.[0]?.traveller_email?"ALLOW":"DENY","ALLOW",response.ok?Object.keys(payload.proposals?.[0]??{}).sort():[]);
    else if(role==="finance")record(role,"journey_proposals_api","FIELD_SET",response.ok&&!["customer_snapshot","sent_snapshot","curated_journey_snapshot","accepted_name","accepted_email","acceptance_metadata","public_token","introduction","terms"].some(field=>Object.hasOwn(payload.proposals?.[0]??{},field))&&!Object.hasOwn(payload.changeRequests?.[0]??{},"traveller_email")&&!Object.hasOwn(payload.changeRequests?.[0]??{},"message")?"ALLOW":"DENY","ALLOW",response.ok?Object.keys(payload.proposals?.[0]??{}).sort():[]);
    else record(role,"journey_proposals_api","HTTP",response.status===403?"DENY":"ALLOW","DENY");
  }
  for(const role of ["journey_designer","partner_manager","finance","content_marketing"]){
    const response=await fetch(`${baseUrl}/api/admin/journey-studio?enquiryId=${enquiryId}`,{headers:{authorization:`Bearer ${sessions[role]}`}});
    record(role,"journey_studio_api","HTTP",response.ok?"ALLOW":"DENY",role==="journey_designer"?"ALLOW":"DENY");
  }

  // Focused Phase 4 anti-escalation regression.
  const {data:escalation,error:escalationError}=await clients.finance.from("profile_staff_roles").insert({profile_id:(await clients.finance.auth.getUser()).data.user.id,role_code:"super_admin"}).select("role_code");
  record("finance","self_role_assignment","CREATE",!escalationError&&escalation?.length?"ALLOW":"DENY","DENY");
}finally{
  await stopServer();if(temporaryRoot)rmSync(temporaryRoot,{recursive:true,force:true});
  if(accountId)await admin.from("journey_accounts").delete().eq("id",accountId);
  if(changeId)await admin.from("journey_proposal_change_requests").delete().eq("id",changeId);
  if(proposalId)await admin.from("journey_proposals").delete().eq("id",proposalId);
  if(curatedId)await admin.from("curated_journeys").delete().eq("id",curatedId);
  if(enquiryId)await admin.from("enquiries").delete().eq("id",enquiryId);
}

const failures=results.filter(result=>result.targetVerdict!=="PASS");
console.log(JSON.stringify({projectRef,results,cleanup:{syntheticRecordsRemoved:true},summary:{total:results.length,passed:results.length-failures.length,failed:failures.length}},null,2));
if(failures.length)process.exit(1);
