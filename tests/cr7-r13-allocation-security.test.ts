import assert from "node:assert/strict";
import {existsSync,readFileSync} from "node:fs";
import {createRequire} from "node:module";
import path from "node:path";
import {createHash} from "node:crypto";
import test from "node:test";
import ts from "typescript";
import {allocationForStaff,fulfilmentResultForStaff} from "../lib/admin/allocation-projection.ts";
import {defaultRolePermissions,type StaffRole} from "../lib/admin/permissions.ts";
import type {Database} from "../lib/database.types";

type Allocation=Database["public"]["Tables"]["journey_supplier_allocations"]["Row"];
const read=(file:string)=>readFileSync(new URL("../"+file,import.meta.url),"utf8");
const fixture=()=>({id:"allocation",enquiry_id:"enquiry",allocation_type:"experience",service_name:"CR7 LOCAL ONLY",quantity:4,quantity_label:"participants",provider_name:"Synthetic provider",currency:"USD",supplier_cost:50.25,selling_price:80.25,
  service_details:{rooms:2,nights:12,guideRole:"primary",fromLabel:"Airport",toLabel:"Colombo",internalCost:50.25,privateContact:"PRIVATE_CONTACT",nested:{secret:"PRIVATE_NESTED"}},
  pricing_plan_snapshot:{id:"rate",name:"Rate",unitPrice:12.5625,currency:"USD",chargingMethod:"per_person",notes:"PRIVATE_RATE_NOTES",details:{privateContact:"PRIVATE_CONTACT"}},
  supplier_contact:"PRIVATE_CONTACT",arrival_instructions:"PRIVATE_ARRIVAL",special_notes:"PRIVATE_NOTES",fulfilment_notes:"PRIVATE_FULFILMENT",cancellation_reason:"PRIVATE_REASON",confirmation_status:"confirmed",invoice_status:"received",payment_status:"payment_due",future_secret:"PRIVATE_FUTURE"
}) as unknown as Allocation;
for(const role of ["journey_designer","finance","operations","super_admin","partner_manager"] as StaffRole[]){
  test(`${role}: allocation projection preserves legitimate fields and denies unrelated detail`,()=>{
    const source=fixture(),before=JSON.stringify(source),result=allocationForStaff(source,defaultRolePermissions[role]);
    const allocator=role==="super_admin"||role==="partner_manager",costs=allocator||role==="finance",contacts=allocator||role==="operations";
    assert.equal(JSON.stringify(source),before);assert.equal(result.id,"allocation");assert.equal(result.quantity,4);assert.equal(result.service_name,"CR7 LOCAL ONLY");
    assert.equal(result.supplier_cost,costs?50.25:null);assert.equal(result.selling_price,role==="operations"?null:80.25);
    for(const key of ["supplier_contact","arrival_instructions","special_notes","fulfilment_notes","cancellation_reason"] as const)assert.equal(result[key],contacts?source[key]:null);
    assert(!("future_secret" in result));
    if(!allocator){assert.deepEqual(result.service_details,{rooms:2,nights:12,guideRole:"primary",fromLabel:"Airport",toLabel:"Colombo"});assert.doesNotMatch(JSON.stringify(result.pricing_plan_snapshot),/PRIVATE_/);}
    if(!costs)assert.deepEqual(result.pricing_plan_snapshot,{});
    if(role==="finance")assert.deepEqual(result.pricing_plan_snapshot,{id:"rate",name:"Rate",unitPrice:12.5625,currency:"USD",chargingMethod:"per_person"});
  });
}
test("all allocation read/mutation responses use the same server-side projection",()=>{
  const route=read("app/api/admin/journey-allocations/route.ts");
  assert.equal((route.match(/allocationForStaff\(/g)??[]).length,4);
  assert.doesNotMatch(route,/json\(\{allocation:updated[,}]/);assert.doesNotMatch(route,/json\(\{allocations:result\}/);
  assert.match(route,/authenticatedStaff\(request,parsed.data.action==="fulfil"\?"operations.manage":"suppliers.allocate"\)/);
  assert.match(route,/result:fulfilmentResultForStaff\(command.data\)/);
  assert.doesNotMatch(route,/result:command.data/);
});

test("fulfilment receipt allowlists identifiers, status and replay metadata only",()=>{
  assert.deepEqual(fulfilmentResultForStaff({enquiryId:"e",allocationId:"a",status:"fulfilled",idempotent:true,supplier_cost:12,privateNotes:"PRIVATE_RESULT",nested:{secret:"PRIVATE_RESULT"}}),{enquiryId:"e",allocationId:"a",status:"fulfilled",idempotent:true});
  for(const value of [null,[],"PRIVATE_RESULT",false])assert.deepEqual(fulfilmentResultForStaff(value),{});
});

const root=path.resolve(import.meta.dirname,".."),external=createRequire(import.meta.url);
// Run actual routes/authentication/projection; replace only the database/network boundary.
function actualModules(overrides:Record<string,unknown>){
  const cache=new Map<string,Record<string,unknown>>();
  function load(file:string):Record<string,unknown>{
    if(cache.has(file))return cache.get(file)!;
    const output={exports:{} as Record<string,unknown>};cache.set(file,output.exports);
    const require=(id:string):unknown=>{
      if(id in overrides)return overrides[id];
      if(id==="server-only")return {};
      if(id.startsWith("@/")||id.startsWith(".")){
        const base=id.startsWith("@/")?path.join(root,id.slice(2)):path.resolve(path.dirname(file),id);
        const resolved=[base,base+".ts",base+".tsx"].find(candidate=>existsSync(candidate));
        if(!resolved)throw new Error("Unresolved test module "+id);
        return load(resolved);
      }
      return external(id);
    };
    const compiled=ts.transpileModule(readFileSync(file,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
    new Function("require","module","exports",compiled)(require,output,output.exports);
    return output.exports;
  }
  return (file:string)=>load(path.join(root,file));
}
const testId="00000000-0000-4000-8000-00000000c713";
type TestRole=StaffRole|"traveller";
function routeHarness(role:TestRole,options:{replay?:boolean;commandError?:string;financialActivity?:boolean;alreadyFulfilled?:boolean}={}){
  const calls:string[]=[],queries:string[]=[],allocation={...fixture(),id:testId,enquiry_id:testId,review_required:true,fulfilment_status:options.alreadyFulfilled?"fulfilled":"pending"};
  const rows:Record<string,unknown[]>={profiles:[{role:role==="super_admin"?"admin":"editor"}],profile_staff_roles:role==="traveller"?[]:[{role_code:role}],staff_role_permissions:role==="traveller"?[]:defaultRolePermissions[role].map(permission_code=>({permission_code})),journey_supplier_allocations:[allocation],journey_settlements:options.financialActivity?[{amount_paid:1,waived_amount:0}]:[]};
  const db={auth:{getUser:async(token:string)=>token==="staff-session"||token==="traveller-session"?{data:{user:{id:testId}},error:null}:{data:{user:null},error:{message:"Invalid token"}}},from:(table:string)=>{
    queries.push(table);const values=rows[table]??[];
    const chain={select:()=>chain,eq:()=>chain,in:()=>chain,order:()=>chain,maybeSingle:async()=>({data:values[0]??null,error:null}),single:async()=>({data:values[0]??null,error:null}),then:(resolve:(value:unknown)=>unknown)=>Promise.resolve({data:values,error:null}).then(resolve)};
    return chain;
  },rpc:async(name:string)=>{
    calls.push(name);
    if(name==="fulfil_supplier_allocation_command"&&options.alreadyFulfilled)return {data:null,error:{message:"This supplier service is already fulfilled; its evidence is immutable."}};
    if(options.commandError&&name!=="record_staff_authorization_denial")return {data:null,error:{message:options.commandError}};
    return {data:{enquiryId:testId,allocationId:testId,status:"fulfilled",idempotent:Boolean(options.replay),supplier_cost:50.25,privateNotes:"PRIVATE_COMMAND_RESULT"},error:null};
  }};
  const load=actualModules({"@/lib/supabase/admin":{createAdminClient:()=>db},"@/lib/accounting/allocation-accounting":{syncAllocationAccounting:async()=>{calls.push("syncAllocationAccounting")}}});
  return {route:load("app/api/admin/journey-allocations/route.ts") as {GET:(r:Request)=>Promise<Response>;PATCH:(r:Request)=>Promise<Response>},calls,queries};
}
const apiRequest=(body?:Record<string,unknown>,token="staff-session")=>new Request(`https://staging.invalid/api/admin/journey-allocations?enquiryId=${testId}`,{method:body?"PATCH":"GET",headers:{"content-type":"application/json",...(token?{authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{})});
const fulfilPayload={enquiryId:testId,allocationId:testId,action:"fulfil",notes:"",idempotencyKey:"r13-local-only-command"};
for(const role of ["journey_designer","operations","finance","super_admin","partner_manager","traveller"] as TestRole[]){
  test(`actual GET: ${role} authorized projection or denial`,async()=>{
    const h=routeHarness(role),response=await h.route.GET(apiRequest(undefined,role==="traveller"?"traveller-session":"staff-session"));
    assert.equal(response.status,role==="traveller"?403:200);
    if(role==="traveller"){assert(!h.queries.includes("journey_supplier_allocations"));return}
    const body=await response.json(),row=body.allocations[0];
    assert.deepEqual(row,JSON.parse(JSON.stringify(allocationForStaff({...fixture(),id:testId,enquiry_id:testId,review_required:true,fulfilment_status:"pending"} as Allocation,defaultRolePermissions[role]))));
    assert.doesNotMatch(JSON.stringify(body),/PRIVATE_FUTURE/);assert(!("future_secret" in row));
  });
  test(`actual fulfilment PATCH: ${role} operation/finance separation`,async()=>{
    const h=routeHarness(role),response=await h.route.PATCH(apiRequest(fulfilPayload,role==="traveller"?"traveller-session":"staff-session"));
    const allowed=role==="operations"||role==="super_admin";
    assert.equal(response.status,allowed?200:403);assert.equal(h.calls.includes("fulfil_supplier_allocation_command"),allowed);
    assert(!h.calls.includes("syncAllocationAccounting"));assert(!h.calls.includes("record_accounting_transaction_command"));
    const body=await response.json();assert.doesNotMatch(JSON.stringify(body),/PRIVATE_COMMAND_RESULT|future_secret/);
    if(allowed){assert.equal(body.allocation.supplier_cost,role==="super_admin"?50.25:null);assert.equal(body.allocation.selling_price,role==="super_admin"?80.25:null);assert.equal(body.allocation.supplier_contact,"PRIVATE_CONTACT");assert.deepEqual(body.result,{enquiryId:testId,allocationId:testId,status:"fulfilled",idempotent:false});}
  });
}
for(const token of ["","invalid-token","traveller-public-proposal-token"]){
  test(`anonymous/non-session token ${JSON.stringify(token)} denied before allocation access`,async()=>{
    const h=routeHarness("super_admin");assert.equal((await h.route.GET(apiRequest(undefined,token))).status,401);assert.equal((await h.route.PATCH(apiRequest(fulfilPayload,token))).status,401);assert(!h.queries.includes("journey_supplier_allocations"));assert.deepEqual(h.calls,[]);
  });
}
test("actual fulfilment replay preserves idempotent envelope and identical redaction",async()=>{
  const h=routeHarness("operations",{replay:true}),response=await h.route.PATCH(apiRequest(fulfilPayload)),body=await response.json();
  assert.equal(response.status,200);assert.equal(body.result.idempotent,true);assert.equal(body.allocation.supplier_cost,null);assert.deepEqual(body.allocation.pricing_plan_snapshot,{});assert.doesNotMatch(JSON.stringify(body.result),/PRIVATE_|supplier_cost/);
});
test("actual already-fulfilled rejection remains 409 and exposes no row",async()=>{
  const h=routeHarness("operations",{alreadyFulfilled:true}),response=await h.route.PATCH(apiRequest(fulfilPayload)),body=await response.json();
  assert.equal(response.status,409);assert(!("allocation" in body));assert(!h.calls.includes("syncAllocationAccounting"));
});
test("actual retirement preserves financial-activity guard and denies Operations",async()=>{
  const body={allocationId:testId,action:"retire",reason:"Revised design no longer needs this service.",idempotencyKey:"r13-local-only-retire"};
  const denied=routeHarness("operations");assert.equal((await denied.route.PATCH(apiRequest(body))).status,403);assert(!denied.calls.includes("transition_supplier_allocation_command"));
  const protectedRecord=routeHarness("super_admin",{financialActivity:true});assert.equal((await protectedRecord.route.PATCH(apiRequest(body))).status,409);assert(!protectedRecord.calls.includes("transition_supplier_allocation_command"));
  const valid=routeHarness("super_admin"),response=await valid.route.PATCH(apiRequest(body));assert.equal(response.status,200);assert(valid.calls.includes("transition_supplier_allocation_command"));assert(valid.calls.includes("syncAllocationAccounting"));assert(!("future_secret" in (await response.json()).allocation));
});
test("actual invalid allocation action rejects before any business command",async()=>{
  const h=routeHarness("super_admin");assert.equal((await h.route.PATCH(apiRequest({...fulfilPayload,action:"unapproved"}))).status,400);assert.deepEqual(h.calls,[]);
});
test("candidate revokes only the two sensitive read grants, without adding a view, policy or function",()=>{
  const candidate=read("supabase/migrations/202610150002_cr7_allocation_read_boundary.sql").replace(/--[^\n]*/g,"").trim();
  assert.equal(candidate,"REVOKE SELECT ON TABLE public.journey_supplier_allocations,\n  public.journey_supplier_allocation_history FROM PUBLIC, anon, authenticated;");
  assert.doesNotMatch(candidate,/GRANT|CASCADE|DISABLE|ALTER|CREATE|COMMIT|DELETE|INSERT|UPDATE/);
});
test("account-date candidate remains byte-for-byte unchanged and separate",{skip:!existsSync(new URL("../supabase/migrations/202610150001_cr7_account_accepted_dates.sql",import.meta.url))&&"Unrelated account-date candidate is intentionally absent from an isolated security checkout"},()=>{
  assert.equal(createHash("sha256").update(read("supabase/migrations/202610150001_cr7_account_accepted_dates.sql")).digest("hex"),"7e117e9b5da8116de54de91a48f1de6fff1bee06505d15e8648985f7022062a3");
});
test("fresh rehearsal contains the exact candidate, only rollback transaction control and no business DML",()=>{
  const migration=read("supabase/migrations/202610150002_cr7_allocation_read_boundary.sql"),script=read("scripts/sql/cr7-r13-security-rehearsal.sql");
  assert.equal(script.split(migration).length-1,1);assert.match(script,/^BEGIN;/m);assert.match(script,/^ROLLBACK;/m);assert.doesNotMatch(script,/^\s*COMMIT\s*;/im);
  assert.doesNotMatch(script,/^\s*(INSERT|UPDATE|DELETE|TRUNCATE|ALTER)\s/im);assert.doesNotMatch(script,/CREATE (?:OR REPLACE )?FUNCTION|DISABLE (?:TRIGGER|ROW LEVEL SECURITY)/i);
  assert.match(script,/SET LOCAL ROLE authenticated/);assert.match(script,/SET LOCAL ROLE anon/);assert.match(script,/SET LOCAL ROLE service_role/);
  assert.match(script,/before_state-'target_acl'<>after_state-'target_acl'/);assert.match(script,/has_any_column_privilege/);
});
test("browser runtime callers do not select allocation/history base tables",()=>{
  for(const file of ["features/admin/journey-lifecycle-workspace.tsx","features/admin/enquiry-review.tsx","features/admin/journey-account-review.tsx","features/admin/accounting-overview.tsx"]){
    assert.doesNotMatch(read(file),/\.from\("journey_supplier_allocation(?:s|_history)"\)/,file);
  }
  assert.match(read("features/admin/journey-lifecycle-workspace.tsx"),/fetch\(`\/api\/admin\/journey-allocations/);
  assert.match(read("lib/supabase/admin.ts"),/SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(read("lib/admin/authenticated-staff.ts"),/database=createAdminClient\(\)/);
});
test("safe audit index is owner-executed metadata only; no direct snapshot reader is introduced",()=>{
  const source=read("supabase/migrations/202608120014_audit_observability_integrity.sql"),start=source.indexOf("create or replace view public.staff_audit_event_index");
  assert(start>=0);const view=source.slice(start,source.indexOf("revoke all on public.staff_audit_event_index",start));
  assert.match(view,/from public.journey_supplier_allocation_history/);assert.doesNotMatch(view,/new_snapshot|previous_snapshot|supplier_cost|supplier_contact|select \*/i);
});
