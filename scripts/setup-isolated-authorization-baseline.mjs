#!/usr/bin/env node

import {randomBytes} from "node:crypto";
import {chmod, readFile, rename, writeFile} from "node:fs/promises";
import {createClient} from "@supabase/supabase-js";

const ISOLATED_REF="xnsxmwgyugoqanuoyebh";
const PRODUCTION_REF="fstpfqlgypvktjwdeagu";
const ENV_FILE=new URL("../.env.authz.local",import.meta.url);
const roleCodes=["journey_designer","partner_manager","finance","operations","content_marketing","super_admin"];

const url=process.env.AUTHZ_TEST_SUPABASE_URL??"";
const declaredRef=process.env.AUTHZ_TEST_PROJECT_REF??"";
const derivedRef=(()=>{try{return new URL(url).hostname.split(".")[0]??""}catch{return ""}})();
const projectRef=declaredRef||derivedRef;
const serviceRoleKey=process.env.AUTHZ_TEST_SUPABASE_SERVICE_ROLE_KEY??"";

const block=(message)=>{console.error(`BLOCKED: ${message}`);process.exit(2)};
const fail=(context,error)=>{
  const code=error?.code??error?.status??error?.name??"unknown";
  throw new Error(`${context} failed (${code}). Details withheld.`);
};

if(projectRef!==ISOLATED_REF||url!==`https://${ISOLATED_REF}.supabase.co`)block("isolated project identity did not match the approved target");
if(projectRef===PRODUCTION_REF||url.includes(PRODUCTION_REF))block("production project is explicitly rejected");
if(process.env.AUTHZ_TEST_ISOLATED_PROJECT!=="true")block("AUTHZ_TEST_ISOLATED_PROJECT must be true");
if(!serviceRoleKey)block("isolated service-role key is not configured");

const database=createClient(url,serviceRoleKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
const credentials={};

async function findSyntheticUser(email){
  for(let page=1;page<=20;page+=1){
    const {data,error}=await database.auth.admin.listUsers({page,perPage:100});
    if(error)fail("List synthetic identities",error);
    const match=data.users.find(user=>user.email===email);
    if(match)return match;
    if(data.users.length<100)return null;
  }
  block("synthetic identity lookup exceeded its bounded page limit");
}

async function ensureIdentity(roleCode){
  const email=`phase1-${roleCode.replaceAll("_","-")}@roamceylon.test`;
  const password=randomBytes(32).toString("base64url");
  let user=await findSyntheticUser(email);
  if(user){
    const {data,error}=await database.auth.admin.updateUserById(user.id,{password,user_metadata:{phase1_synthetic:true,role_code:roleCode}});
    if(error)fail(`Update ${roleCode} identity`,error);
    user=data.user;
  }else{
    const {data,error}=await database.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{phase1_synthetic:true,role_code:roleCode}});
    if(error)fail(`Create ${roleCode} identity`,error);
    user=data.user;
  }

  const {error:profileError}=await database.from("profiles").upsert({
    id:user.id,
    email,
    full_name:`Phase 1 ${roleCode.replaceAll("_"," ")}`,
    role:roleCode==="super_admin"?"admin":"editor"
  },{onConflict:"id"});
  if(profileError)fail(`Upsert ${roleCode} profile`,profileError);

  const {error:clearError}=await database.from("profile_staff_roles").delete().eq("profile_id",user.id);
  if(clearError)fail(`Reset ${roleCode} role assignments`,clearError);
  const {error:assignmentError}=await database.from("profile_staff_roles").insert({profile_id:user.id,role_code:roleCode});
  if(assignmentError)fail(`Assign ${roleCode}`,assignmentError);

  credentials[`AUTHZ_TEST_${roleCode.toUpperCase()}_EMAIL`]=email;
  credentials[`AUTHZ_TEST_${roleCode.toUpperCase()}_PASSWORD`]=password;
  return user.id;
}

async function upsertOne(table,payload,onConflict,select="id"){
  const {data,error}=await database.from(table).upsert(payload,{onConflict}).select(select).single();
  if(error)fail(`Upsert synthetic ${table} fixture`,error);
  return data;
}

async function ensureFixtures(superAdminId){
  const theme=await upsertOne("themes",{
    name:"Phase 1 Authorization Theme",
    slug:"phase-1-authorization-theme",
    short_description:"Disposable synthetic authorization fixture.",
    status:"draft",
    active:true,
    created_by:superAdminId,
    updated_by:superAdminId
  },"slug");

  const guide=await upsertOne("guides",{
    name:"Phase 1 Authorization Guide",
    slug:"phase-1-authorization-guide",
    short_bio:"Disposable synthetic authorization fixture.",
    languages:["English"],
    specialities:["Authorization testing"],
    phone:"+94000000000",
    email:"phase1-guide@roamceylon.test",
    status:"draft",
    active:true,
    is_sample:true
  },"slug");

  const enquiry=await upsertOne("enquiries",{
    journey_reference:"RCJ-PHASE1-AUTHZ",
    name:"Phase 1 Synthetic Traveller",
    email:"phase1-traveller@roamceylon.test",
    phone:"+94000000001",
    nationality:"Synthetic",
    summary:"Disposable isolated authorization fixture.",
    trip_state:{synthetic:true,purpose:"phase1_authorization_baseline"},
    status:"new",
    adults:1,
    children:0
  },"journey_reference","id,created_at,journey_reference");

  const curated=await upsertOne("curated_journeys",{
    enquiry_id:enquiry.id,
    status:"not_started",
    itinerary:{version:1,synthetic:true,days:[]},
    internal_notes:"Disposable isolated authorization fixture.",
    source_brief_created_at:enquiry.created_at,
    created_by:superAdminId,
    updated_by:superAdminId
  },"enquiry_id");

  const {data:existingAllocation,error:allocationReadError}=await database
    .from("journey_supplier_allocations")
    .select("id")
    .eq("enquiry_id",enquiry.id)
    .eq("allocation_type","guide")
    .eq("provider_name","Phase 1 Authorization Guide")
    .maybeSingle();
  if(allocationReadError)fail("Read synthetic allocation fixture",allocationReadError);
  let allocation=existingAllocation;
  const allocationPayload={
    enquiry_id:enquiry.id,
    curated_journey_id:curated.id,
    allocation_type:"guide",
    guide_id:guide.id,
    provider_name:"Phase 1 Authorization Guide",
    supplier_cost:1,
    selling_price:1,
    currency:"USD",
    service_name:"Synthetic authorization probe",
    quantity:1,
    quantity_label:"probe",
    pricing_plan_snapshot:{synthetic:true},
    service_details:{synthetic:true}
  };
  if(allocation){
    const {data,error}=await database.from("journey_supplier_allocations").update(allocationPayload).eq("id",allocation.id).select("id").single();
    if(error)fail("Update synthetic allocation fixture",error);
    allocation=data;
  }else{
    const {data,error}=await database.from("journey_supplier_allocations").insert(allocationPayload).select("id").single();
    if(error)fail("Create synthetic allocation fixture",error);
    allocation=data;
  }

  const account=await upsertOne("journey_accounts",{
    enquiry_id:enquiry.id,
    journey_reference:enquiry.journey_reference,
    traveller_name:"Phase 1 Synthetic Traveller",
    traveller_email:"phase1-traveller@roamceylon.test",
    status:"active",
    currency:"USD",
    selling_price:1,
    internal_cost:1,
    gross_profit:0,
    profit_margin:0,
    quote_snapshot:{synthetic:true,purpose:"phase1_authorization_baseline"},
    active:true,
    created_by:superAdminId
  },"enquiry_id");

  return {
    AUTHZ_FIXTURE_THEME_ID:theme.id,
    AUTHZ_FIXTURE_GUIDE_ID:guide.id,
    AUTHZ_FIXTURE_ENQUIRY_ID:enquiry.id,
    AUTHZ_FIXTURE_CURATED_JOURNEY_ID:curated.id,
    AUTHZ_FIXTURE_ALLOCATION_ID:allocation.id,
    AUTHZ_FIXTURE_ACCOUNT_ID:account.id
  };
}

async function updateEnvironment(values){
  const current=await readFile(ENV_FILE,"utf8");
  const keys=new Set(Object.keys(values));
  const retained=current.split(/\r?\n/).filter(line=>line&&!keys.has(line.split("=",1)[0]));
  const additions=Object.entries(values).map(([key,value])=>`${key}=${value}`);
  const temporary=new URL("../.env.authz.local.phase1.tmp",import.meta.url);
  await writeFile(temporary,[...retained,...additions,""].join("\n"),{mode:0o600});
  await chmod(temporary,0o600);
  await rename(temporary,ENV_FILE);
  await chmod(ENV_FILE,0o600);
}

try{
  console.log("Safety check passed: isolated project confirmed.");
  console.log("Preparing six synthetic staff identities...");
  let superAdminId="";
  for(const roleCode of roleCodes){
    const userId=await ensureIdentity(roleCode);
    if(roleCode==="super_admin")superAdminId=userId;
  }
  console.log("Synthetic identities ready: 6.");
  console.log("Preparing minimum disposable authorization fixtures...");
  const fixtures=await ensureFixtures(superAdminId);
  await updateEnvironment({...credentials,...fixtures,AUTHZ_TEST_ENABLE_MUTATIONS:"false"});
  console.log("Synthetic fixtures ready: 6.");
  console.log("Local authorization environment updated without printing secrets.");
  console.log("ISOLATED AUTHORIZATION BASELINE READY.");
}catch(error){
  console.error(error instanceof Error?error.message:"Isolated baseline setup failed. Details withheld.");
  process.exit(1);
}
