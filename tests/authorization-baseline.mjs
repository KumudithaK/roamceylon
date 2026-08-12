import {randomUUID} from "node:crypto";
import {createClient} from "@supabase/supabase-js";

const PRODUCTION_PROJECT_REFS=new Set(["fstpfqlgypvktjwdeagu"]);
const roles=["journey_designer","partner_manager","finance","operations","content_marketing","super_admin"];
const url=process.env.AUTHZ_TEST_SUPABASE_URL??"";
const publishableKey=process.env.AUTHZ_TEST_SUPABASE_PUBLISHABLE_KEY??"";
const declaredRef=process.env.AUTHZ_TEST_PROJECT_REF??"";
const derivedRef=(()=>{try{return new URL(url).hostname.split(".")[0]??""}catch{return ""}})();
const projectRef=declaredRef||derivedRef;
const isolated=process.env.AUTHZ_TEST_ISOLATED_PROJECT==="true";
const mutationsEnabled=process.env.AUTHZ_TEST_ENABLE_MUTATIONS==="true";

const block=(message)=>{console.error(`[BLOCKED] ${message}`);process.exit(2)};
if(!url||!publishableKey)block("Set AUTHZ_TEST_SUPABASE_URL and AUTHZ_TEST_SUPABASE_PUBLISHABLE_KEY for an isolated Supabase project.");
if(!projectRef)block("Set AUTHZ_TEST_PROJECT_REF so the environment can be verified as non-production.");
if(PRODUCTION_PROJECT_REFS.has(projectRef))block("The linked Roam Ceylon project is production-like and is explicitly denied by this harness.");
if(!isolated)block("Set AUTHZ_TEST_ISOLATED_PROJECT=true only after confirming this is a disposable restored/test project.");

const client=()=>createClient(url,publishableKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
const clients={anonymous:client()};
const identityStatus=[];
for(const role of roles){
  const prefix=`AUTHZ_TEST_${role.toUpperCase()}`;
  const email=process.env[`${prefix}_EMAIL`];
  const password=process.env[`${prefix}_PASSWORD`];
  if(!email||!password){identityStatus.push({role,status:"BLOCKED",reason:"credentials_not_configured"});continue}
  const database=client();
  const {error}=await database.auth.signInWithPassword({email,password});
  if(error){identityStatus.push({role,status:"BLOCKED",reason:"sign_in_failed"});continue}
  clients[role]=database;
  identityStatus.push({role,status:"READY"});
}

const fixture={
  theme:process.env.AUTHZ_FIXTURE_THEME_ID,
  guide:process.env.AUTHZ_FIXTURE_GUIDE_ID,
  enquiry:process.env.AUTHZ_FIXTURE_ENQUIRY_ID,
  curatedJourney:process.env.AUTHZ_FIXTURE_CURATED_JOURNEY_ID,
  allocation:process.env.AUTHZ_FIXTURE_ALLOCATION_ID,
  account:process.env.AUTHZ_FIXTURE_ACCOUNT_ID
};

const cases=[
  {role:"anonymous",resource:"published_content",action:"READ",table:"themes",columns:"id",publicFilter:true,current:"ALLOW",target:"ALLOW",audit:"baseline"},
  {role:"anonymous",resource:"supplier_contact_and_licence",action:"READ",table:"guides",columns:"id,phone,email,licence_number",publicFilter:true,current:"ALLOW",target:"DENY",audit:"SEC-003"},
  {role:"anonymous",resource:"website_setup_state",action:"READ",table:"website_settings",columns:"id,setup_checklist,setup_dismissed",current:"ALLOW",target:"DENY",audit:"SEC-013"},
  {role:"journey_designer",resource:"traveller_pii",action:"READ",table:"enquiries",columns:"id,email,phone",fixture:"enquiry",current:"ALLOW",target:"ALLOW",audit:"SEC-008"},
  {role:"finance",resource:"traveller_pii_base_row",action:"READ",table:"enquiries",columns:"id,email,phone,nationality,traveller_notes",fixture:"enquiry",current:"ALLOW",target:"DENY",audit:"SEC-008"},
  {role:"operations",resource:"traveller_pii_base_row",action:"READ",table:"enquiries",columns:"id,email,phone,nationality,traveller_notes",fixture:"enquiry",current:"ALLOW",target:"DENY",audit:"SEC-008"},
  {role:"content_marketing",resource:"supplier_contact_and_licence",action:"READ",table:"guides",columns:"id,phone,email,licence_number",fixture:"guide",current:"ALLOW",target:"DENY",audit:"ARC-001/SEC-001"},
  {role:"partner_manager",resource:"supplier_contact_and_licence",action:"READ",table:"guides",columns:"id,phone,email,licence_number",fixture:"guide",current:"ALLOW",target:"ALLOW",audit:"baseline"},
  {role:"journey_designer",resource:"curated_journey",action:"READ",table:"curated_journeys",columns:"id,enquiry_id,status",fixture:"curatedJourney",current:"ALLOW",target:"ALLOW",audit:"baseline"},
  {role:"partner_manager",resource:"supplier_allocation",action:"READ",table:"journey_supplier_allocations",columns:"id,enquiry_id,supplier_cost",fixture:"allocation",current:"ALLOW",target:"ALLOW",audit:"baseline"},
  {role:"finance",resource:"accounting_account",action:"READ",table:"journey_accounts",columns:"id,enquiry_id,selling_price,internal_cost",fixture:"account",current:"ALLOW",target:"ALLOW",audit:"baseline"},
  {role:"super_admin",resource:"staff_roles",action:"READ",table:"staff_roles",columns:"code,name",current:"ALLOW",target:"ALLOW",audit:"baseline"},
  {role:"journey_designer",resource:"cms_theme",action:"UPDATE",table:"themes",columns:"id,name",fixture:"theme",updateField:"name",current:"ALLOW",target:"DENY",audit:"ARC-001/SEC-001"},
  {role:"journey_designer",resource:"supplier_guide",action:"UPDATE",table:"guides",columns:"id,name",fixture:"guide",updateField:"name",current:"ALLOW",target:"DENY",audit:"ARC-001/SEC-001"},
  {role:"content_marketing",resource:"cms_theme",action:"UPDATE",table:"themes",columns:"id,name",fixture:"theme",updateField:"name",current:"ALLOW",target:"ALLOW",audit:"baseline"},
  {role:"journey_designer",resource:"enquiry_lifecycle",action:"UPDATE",table:"enquiries",columns:"id,status",fixture:"enquiry",updateField:"status",current:"ALLOW",target:"DENY",audit:"SEC-004"},
  {role:"journey_designer",resource:"travel_content",action:"STORAGE_WRITE",bucket:"travel-content",current:"ALLOW",target:"DENY",audit:"ARC-001/SEC-001"},
  {role:"content_marketing",resource:"travel_content",action:"STORAGE_WRITE",bucket:"travel-content",current:"ALLOW",target:"ALLOW",audit:"baseline"}
];

const verifiedFixtures={};
if(clients.super_admin){
  for(const testCase of cases.filter(item=>item.fixture)){
    if(verifiedFixtures[testCase.fixture]!==undefined)continue;
    const id=fixture[testCase.fixture];
    if(!id){verifiedFixtures[testCase.fixture]=false;continue}
    const {data,error}=await clients.super_admin.from(testCase.table).select("id").eq("id",id).maybeSingle();
    verifiedFixtures[testCase.fixture]=Boolean(data&&!error);
  }
}

const resultFor=(testCase,actual,detail)=>({
  role:testCase.role,resource:testCase.resource,action:testCase.action,
  currentExpectation:testCase.current,actualResult:actual,targetExpectation:testCase.target,
  targetVerdict:actual==="BLOCKED"?"BLOCKED":actual===testCase.target?"PASS":"FAIL",
  relatedAuditId:testCase.audit,detail
});

const results=[];
for(const testCase of cases){
  const database=clients[testCase.role];
  if(!database){results.push(resultFor(testCase,"BLOCKED","identity_not_ready"));continue}
  if(testCase.action!=="READ"&&!mutationsEnabled){results.push(resultFor(testCase,"BLOCKED","mutations_not_enabled"));continue}
  if(testCase.fixture&&verifiedFixtures[testCase.fixture]!==true){results.push(resultFor(testCase,"BLOCKED","fixture_not_verified_by_super_admin"));continue}
  if(testCase.action==="READ"){
    let query=database.from(testCase.table).select(testCase.columns).limit(1);
    if(testCase.publicFilter)query=query.eq("status","published").eq("active",true);
    if(testCase.fixture)query=query.eq("id",fixture[testCase.fixture]);
    const {data,error}=await query;
    if(error){results.push(resultFor(testCase,"DENY",`database_error:${error.code??"unknown"}`));continue}
    results.push(resultFor(testCase,data?.length?"ALLOW":"DENY",data?.length?"visible_fixture_or_row":"no_visible_row"));
    continue;
  }
  if(testCase.action==="UPDATE"){
    const id=fixture[testCase.fixture];
    const {data:original,error:readError}=await database.from(testCase.table).select(`id,${testCase.updateField}`).eq("id",id).maybeSingle();
    if(readError||!original){results.push(resultFor(testCase,"DENY",`pre_update_read_denied:${readError?.code??"no_row"}`));continue}
    const {data,error}=await database.from(testCase.table).update({[testCase.updateField]:original[testCase.updateField]}).eq("id",id).select("id");
    results.push(resultFor(testCase,!error&&data?.length?"ALLOW":"DENY",error?`database_error:${error.code??"unknown"}`:"same_value_probe"));
    continue;
  }
  if(testCase.action==="STORAGE_WRITE"){
    const path=`authorization-baseline/${testCase.role}/${randomUUID()}.txt`;
    const {error}=await database.storage.from(testCase.bucket).upload(path,new Blob(["synthetic authorization probe"],{type:"text/plain"}),{upsert:false});
    if(!error)await database.storage.from(testCase.bucket).remove([path]);
    results.push(resultFor(testCase,error?"DENY":"ALLOW",error?`storage_error:${error.statusCode??"unknown"}`:"created_and_removed_synthetic_object"));
  }
}

console.log(JSON.stringify({projectRef,isolated:true,mutationsEnabled,identityStatus,results},null,2));
if(results.some(result=>result.targetVerdict==="FAIL"))process.exitCode=1;
else if(results.some(result=>result.targetVerdict==="BLOCKED"))process.exitCode=2;
