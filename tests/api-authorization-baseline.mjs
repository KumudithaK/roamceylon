import {spawn} from "node:child_process";
import {closeSync,cpSync,mkdirSync,mkdtempSync,openSync,rmSync,symlinkSync} from "node:fs";
import {tmpdir} from "node:os";
import {dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {createClient} from "@supabase/supabase-js";
import {defaultRolePermissions} from "../lib/admin/permissions.ts";

const ISOLATED_REF="xnsxmwgyugoqanuoyebh";
const PRODUCTION_REF="fstpfqlgypvktjwdeagu";
const roles=["journey_designer","partner_manager","finance","operations","content_marketing","super_admin"];
const repository=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const url=process.env.AUTHZ_TEST_SUPABASE_URL??"";
const key=process.env.AUTHZ_TEST_SUPABASE_PUBLISHABLE_KEY??"";
const serviceKey=process.env.AUTHZ_TEST_SUPABASE_SERVICE_ROLE_KEY??"";
const projectRef=process.env.AUTHZ_TEST_PROJECT_REF??"";
const block=message=>{console.error(`[BLOCKED] ${message}`);process.exit(2)};
if(projectRef!==ISOLATED_REF||url!==`https://${ISOLATED_REF}.supabase.co`)block("isolated target did not match the approved project");
if(projectRef===PRODUCTION_REF||url.includes(PRODUCTION_REF))block("production is explicitly rejected");
if(process.env.AUTHZ_TEST_ISOLATED_PROJECT!=="true")block("isolated flag is not true");
if(!key||!serviceKey)block("isolated API keys are not configured");

const sessions={anonymous:null};
const clients={anonymous:createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}})};
for(const role of roles){
  const prefix=`AUTHZ_TEST_${role.toUpperCase()}`;
  const email=process.env[`${prefix}_EMAIL`];
  const password=process.env[`${prefix}_PASSWORD`];
  if(!email?.endsWith("@roamceylon.test")||!password)block(`${role} is not a verified synthetic identity`);
  const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  const {data,error}=await client.auth.signInWithPassword({email,password});
  if(error||!data.session)block(`${role} synthetic sign-in failed`);
  sessions[role]=data.session.access_token;
  clients[role]=client;
}

const capabilityResults=[];
for(const [role,client] of Object.entries(clients)){
  const {data,error}=await client.rpc("current_staff_permissions",{});
  if(error&&role!=="anonymous")block(`${role} capability inventory could not be read`);
  const actual=(error?[]:(data??[]).map(item=>item.permission_code)).sort();
  const target=role==="anonymous"?[]:[...defaultRolePermissions[role]].sort();
  capabilityResults.push({role,actual,target,targetVerdict:JSON.stringify(actual)===JSON.stringify(target)?"PASS":"FAIL"});
}

const port=3199;
const baseUrl=`http://127.0.0.1:${port}`;
const diagnostics="/tmp/roam-stabilization-phase3/api-baseline.log";
const temporaryRoot=mkdtempSync(resolve(tmpdir(),"roam-phase1-api-"));
const temporaryRepository=resolve(temporaryRoot,"roamceylon");
mkdirSync(dirname(diagnostics),{recursive:true,mode:0o700});
const log=openSync(diagnostics,"w",0o600);
cpSync(repository,temporaryRepository,{recursive:true,filter:source=>{
  const relative=source.slice(repository.length).replace(/^\//,"");
  if(!relative)return true;
  const first=relative.split("/",1)[0];
  return ![".git",".next","node_modules","tmp"].includes(first)&&!first.startsWith(".env");
}});
symlinkSync(resolve(repository,"node_modules"),resolve(temporaryRepository,"node_modules"),"dir");
const serverEnvironment={...process.env};
for(const variable of Object.keys(serverEnvironment)){
  if(variable.startsWith("AUTHZ_TEST_")||variable.startsWith("AUTHZ_FIXTURE_"))delete serverEnvironment[variable];
}
Object.assign(serverEnvironment,{
  NEXT_PUBLIC_SUPABASE_URL:url,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:key,
  SUPABASE_SERVICE_ROLE_KEY:serviceKey
});
const server=spawn(resolve(repository,"node_modules/.bin/next"),["dev","--webpack","-p",String(port)],{
  cwd:temporaryRepository,
  env:serverEnvironment,
  stdio:["ignore",log,log]
});
closeSync(log);

async function stopServer(){
  if(server.exitCode!==null)return;
  server.kill("SIGTERM");
  await Promise.race([
    new Promise(resolveExit=>server.once("exit",resolveExit)),
    new Promise(resolveTimeout=>setTimeout(()=>{server.kill("SIGKILL");resolveTimeout();},5000))
  ]);
}

async function waitUntilReady(){
  for(let attempt=0;attempt<90;attempt+=1){
    if(server.exitCode!==null)throw new Error("Isolated API server exited before readiness; private diagnostics retained no secrets.");
    try{
      const response=await fetch(`${baseUrl}/api/admin/quotes`,{method:"POST",headers:{"content-type":"application/json"},body:"{}"});
      if(response.status===401)return;
    }catch{}
    await new Promise(resolveWait=>setTimeout(resolveWait,1000));
  }
  throw new Error("Isolated API server did not become ready within 90 seconds; private diagnostics retained no secrets.");
}

const cases=[
  {name:"legacy_admin_quote",path:"/api/admin/quotes",allowed:new Set(["journey_designer","super_admin"]),body:{}},
  {name:"legacy_partner_conversion",path:"/api/admin/partner-applications/00000000-0000-0000-0000-000000000000/convert",allowed:new Set(["partner_manager","super_admin"]),body:{}},
  {name:"journey_design_edit",path:"/api/admin/journey-studio",allowed:new Set(["journey_designer","super_admin"]),body:{}},
  {name:"supplier_allocation",path:"/api/admin/journey-allocations",allowed:new Set(["partner_manager","super_admin"]),body:{}},
  {name:"benefit_management",path:"/api/admin/benefits",allowed:new Set(["partner_manager","super_admin"]),body:{}},
  {name:"proposal_send",path:"/api/admin/journey-proposals",allowed:new Set(["journey_designer","super_admin"]),body:{action:"sent",proposalId:"00000000-0000-0000-0000-000000000000"}},
  {name:"settlement_reversal",path:"/api/admin/accounting/reversals",allowed:new Set(["finance","super_admin"]),body:{}},
  {name:"account_override_close",path:"/api/admin/accounting/close",allowed:new Set(["super_admin"]),body:{accountId:"00000000-0000-0000-0000-000000000000",reason:"Synthetic authorization probe only"}}
];
const results=[];
let executionError=null;
try{
  await waitUntilReady();
  for(const testCase of cases){
    for(const [role,token] of Object.entries(sessions)){
      const headers={"content-type":"application/json"};
      if(token)headers.authorization=`Bearer ${token}`;
      const response=await fetch(`${baseUrl}${testCase.path}`,{method:"POST",headers,body:JSON.stringify(testCase.body)});
      const actual=[401,403].includes(response.status)?"DENY":"ALLOW";
      const target=testCase.allowed.has(role)?"ALLOW":"DENY";
      results.push({api:testCase.name,role,actual,target,targetVerdict:actual===target?"PASS":"FAIL",httpStatus:response.status});
    }
  }
}catch(error){
  executionError=error;
}finally{
  await stopServer();
  rmSync(temporaryRoot,{recursive:true,force:true});
  if(!executionError)rmSync(diagnostics,{force:true});
}

if(executionError){
  console.error(`[BLOCKED] ${executionError instanceof Error?executionError.message:"Isolated API baseline could not execute."}`);
  process.exit(2);
}
console.log(JSON.stringify({projectRef,syntheticOnly:true,nonMutatingInputsOnly:true,capabilityResults,results},null,2));
if(capabilityResults.some(result=>result.targetVerdict==="FAIL")||results.some(result=>result.targetVerdict==="FAIL"))process.exitCode=1;
