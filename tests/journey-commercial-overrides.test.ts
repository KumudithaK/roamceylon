import assert from "node:assert/strict";
import {existsSync,readFileSync} from "node:fs";
import {createRequire} from "node:module";
import path from "node:path";
import test from "node:test";
import ts from "typescript";
import {calculateAllocationCommercials,missingAllocationCommercialConfig,resolveAllocationCommercialConfig,type AllocationCommercialConfig,type AllocationCommercialOverrides,type AllocationCommercialLine,type IncompleteAllocationCommercialConfig} from "../lib/pricing/allocation-commercial.ts";
import {proposalForStaff} from "../lib/admin/traveller-pii.ts";
import {defaultRolePermissions,type StaffPermission} from "../lib/admin/permissions.ts";
import type {Database,Json} from "../lib/database.types";

const root=path.resolve(import.meta.dirname,".."),external=createRequire(import.meta.url);
const read=(file:string)=>readFileSync(path.join(root,file),"utf8");
function modules(overrides:Record<string,unknown>={}){
  const cache=new Map<string,Record<string,unknown>>();
  function load(file:string):Record<string,unknown>{
    if(cache.has(file))return cache.get(file)!;
    const out={exports:{} as Record<string,unknown>};cache.set(file,out.exports);
    const require=(id:string):unknown=>{
      if(id in overrides)return overrides[id];
      if(id==="server-only")return {};
      if(id.startsWith("@/")||id.startsWith(".")){
        const base=id.startsWith("@/")?path.join(root,id.slice(2)):path.resolve(path.dirname(file),id);
        const resolved=[base,base+".ts",base+".tsx",base+"/index.ts"].find(p=>existsSync(p)&&/\.[cm]?[jt]sx?$/.test(p));
        if(!resolved)throw Error("Unresolved offline test module "+id);return load(resolved);
      }
      return external(id);
    };
    const code=ts.transpileModule(readFileSync(file,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
    new Function("require","module","exports",code)(require,out,out.exports);return out.exports;
  }
  return (file:string)=>load(path.join(root,file));
}

const config:AllocationCommercialConfig={driverSalaryPerDay:20,fuelPricePerLitre:1.5,vehicleKmPerLitre:10,tollsPerJourney:5,parkingPerDay:2,guideAccommodationPerNight:15,administrationFixed:10,administrationPercent:5,contingencyPercent:3,serviceFeeFixed:5,serviceFeePercent:2,targetProfitMarginPercent:20,routeDistanceBufferPercent:10};
const line:AllocationCommercialLine={type:"experience",supplierCost:240,sellingPrice:null,pricingPlanSnapshot:{},serviceDetails:{},confirmationStatus:"confirmed"};
const operations:AllocationCommercialOverrides={driverOperations:0,fuel:0,tolls:0,parking:0,guideAccommodation:0,administration:0,contingency:0};
const uatOverrides:AllocationCommercialOverrides={...operations,serviceFeeFixed:25,serviceFeePercent:5,targetProfitMarginPercent:20};
const emptyConfig=()=>Object.fromEntries(Object.keys(config).map(key=>[key,null])) as IncompleteAllocationCommercialConfig;

test("journey fee/margin resolution copies config, preserves zero and falls back only for null/undefined",()=>{
  const source=Object.freeze({...config}),before=JSON.stringify(source);
  const fallback=resolveAllocationCommercialConfig(source,{serviceFeeFixed:null,serviceFeePercent:undefined});
  assert.deepEqual(fallback,config);assert.notEqual(fallback,source);
  const zero=resolveAllocationCommercialConfig(source,{serviceFeeFixed:0,serviceFeePercent:0,targetProfitMarginPercent:0});
  assert.equal(zero.serviceFeeFixed,0);assert.equal(zero.serviceFeePercent,0);assert.equal(zero.targetProfitMarginPercent,0);
  assert.equal(JSON.stringify(source),before);
  assert.deepEqual(resolveAllocationCommercialConfig(source,{fuel:100,administration:0}),source);
});

test("journey-local values satisfy only their own missing settings without changing the baseline",()=>{
  const source=Object.freeze(emptyConfig()),before=JSON.stringify(source);
  assert.deepEqual(missingAllocationCommercialConfig([line],source,operations),["serviceFeeFixed","serviceFeePercent","targetProfitMarginPercent"]);
  assert.deepEqual(missingAllocationCommercialConfig([line],source,uatOverrides),[]);
  assert.deepEqual(missingAllocationCommercialConfig([line],source,{...operations,serviceFeeFixed:0,serviceFeePercent:0,targetProfitMarginPercent:0}),[]);
  assert.deepEqual(missingAllocationCommercialConfig([line],source,{...operations,serviceFeeFixed:null}),["serviceFeeFixed","serviceFeePercent","targetProfitMarginPercent"]);
  assert.equal(JSON.stringify(source),before);
});

for(const key of ["serviceFeeFixed","serviceFeePercent","targetProfitMarginPercent"] as const){
  test(`${key}: pure pricing boundary rejects malformed values rather than clamping or coercing`,()=>{
    for(const value of [-1,0.001,NaN,Infinity,-Infinity,"25",true,{}]){
      const overrides={[key]:value} as AllocationCommercialOverrides;
      assert.throws(()=>resolveAllocationCommercialConfig(config,overrides),RangeError);
      assert.throws(()=>missingAllocationCommercialConfig([line],emptyConfig(),overrides),RangeError);
      assert.throws(()=>calculateAllocationCommercials([line],config,{days:1,nights:0,distanceKm:0},overrides),RangeError);
    }
  });
}
test("fee percent permits 100 while target margin must remain below 100",()=>{
  assert.equal(resolveAllocationCommercialConfig(config,{serviceFeePercent:100,targetProfitMarginPercent:99.99}).serviceFeePercent,100);
  assert.throws(()=>resolveAllocationCommercialConfig(config,{serviceFeePercent:100.01}),RangeError);
  assert.throws(()=>resolveAllocationCommercialConfig(config,{targetProfitMarginPercent:100}),RangeError);
});

test("fictional UAT fee/margin produces exact customer total, internal cost and deposit balance",()=>{
  const source=Object.freeze({...config}),overrides=Object.freeze({...uatOverrides}),before=JSON.stringify({source,overrides,line});
  const result=calculateAllocationCommercials([line],source,{days:3,nights:2,distanceKm:0},overrides);
  assert.equal(result.totalSupplierCost,240);assert.equal(result.internalCost,240);assert.equal(result.serviceFee,37);
  assert.equal(result.totalSellingPrice,346.25);assert.equal(result.grossProfit,106.25);assert.equal(result.profitMargin,30.69);
  assert.equal(result.operationsCost,0);assert.equal(result.administrationFee,0);assert.equal(result.contingency,0);
  assert.equal(result.totalSellingPrice-100.25,246);assert.equal(result.manualSellingFloor,0);
  assert.equal(JSON.stringify({source,overrides,line}),before);
});

const id="00000000-0000-4000-8000-00000000aa17";
const proposal=()=>({id,enquiry_id:id,status:"ready",currency:"USD",allocation_snapshot:[],commercial_snapshot:{summary:{totalSellingPrice:346.25,internalCost:240,grossProfit:106.25},context:{config:{serviceFeeFixed:25,serviceFeePercent:5,targetProfitMarginPercent:20,privateContact:"PRIVATE_CONFIG"},overrides:{...uatOverrides,privateContact:"PRIVATE_OVERRIDE"}}},customer_snapshot:{pricing:{currency:"USD",total:346.25},traveller:{name:"Fictional UAT Traveller"}}}) as unknown as Database["public"]["Tables"]["journey_proposals"]["Row"];

test("effective pricing snapshot keeps existing role confidentiality and omits nested unexpected fields",()=>{
  const source=proposal(),before=JSON.stringify(source);
  for(const role of ["journey_designer","operations"] as const){
    const result=proposalForStaff(source,defaultRolePermissions[role]);
    assert.equal(Object.hasOwn(result,"commercial_snapshot"),false);
    assert.doesNotMatch(JSON.stringify(result),/serviceFeeFixed|serviceFeePercent|targetProfitMarginPercent|PRIVATE_CONFIG|PRIVATE_OVERRIDE/);
  }
  const finance=proposalForStaff(source,defaultRolePermissions.finance).commercial_snapshot as {context:{config:Record<string,Json>;overrides:Record<string,Json>}};
  assert.deepEqual(finance.context.config,{serviceFeeFixed:25,serviceFeePercent:5,targetProfitMarginPercent:20});
  for(const key of ["serviceFeeFixed","serviceFeePercent","targetProfitMarginPercent","privateContact"])assert.equal(Object.hasOwn(finance.context.overrides,key),false);
  const costOnly=proposalForStaff(source,["finance.costs.view"]).commercial_snapshot as {context:{config:Record<string,Json>}};
  assert.equal(Object.hasOwn(costOnly.context.config,"targetProfitMarginPercent"),false);
  const admin=proposalForStaff(source,defaultRolePermissions.super_admin).commercial_snapshot as {context:{config:Record<string,Json>}};
  assert.equal(admin.context.config.targetProfitMarginPercent,20);
  assert.equal(JSON.stringify(source),before);
});

function routeHarness(permissions:StaffPermission[],authenticated=true){
  const audits:{name:string;parameters:Record<string,unknown>}[]=[],generated:unknown[]=[],authCalls:string[]=[];
  const db={auth:{getUser:async(token:string)=>{authCalls.push(token);return {data:{user:authenticated?{id}:null},error:null}}},from:(name:string)=>{
    const rows=name==="profiles"?[{role:"editor"}]:name==="profile_staff_roles"?[{role_code:"local_test_role"}]:name==="staff_role_permissions"?permissions.map(permission_code=>({permission_code})):[];
    const chain={select:()=>chain,eq:()=>chain,in:()=>chain,maybeSingle:async()=>({data:rows[0]??null,error:null}),then:(resolve:(value:unknown)=>unknown)=>Promise.resolve({data:rows,error:null}).then(resolve)};return chain;
  },rpc:async(name:string,parameters:Record<string,unknown>)=>{audits.push({name,parameters});return {error:null}}};
  class ProposalError extends Error{}
  const route=modules({"@/lib/supabase/admin":{createAdminClient:()=>db},"@/lib/proposals/journey-proposal-service":{ProposalError,generateJourneyProposal:async(...args:unknown[])=>{generated.push(args);return proposal()}}})("app/api/admin/journey-proposals/route.ts");
  const postRaw=(body:string)=>(route.POST as (r:Request)=>Promise<Response>)(new Request("https://staging.invalid/api/admin/journey-proposals",{method:"POST",headers:{authorization:"Bearer offline-only","content-type":"application/json"},body}));
  const post=async(overrides?:unknown)=>{
    const body={action:"generate",enquiryId:id,...(overrides===undefined?{}:{commercialOverrides:overrides})};
    return postRaw(JSON.stringify(body));
  };
  return {post,postRaw,audits,generated,authCalls};
}

for(const key of ["serviceFeeFixed","serviceFeePercent","targetProfitMarginPercent"] as const){
  test(`${key}: supplied value, zero or null requires both permissions through one audited authorization`,async()=>{
    for(const value of [25,0,null])for(const permissions of [["journey.proposal.create"],["settings.manage"]] as StaffPermission[][]){
      const h=routeHarness(permissions),response=await h.post({[key]:value});
      assert.equal(response.status,403);assert.equal(h.generated.length,0);assert.equal(h.authCalls.length,1);
      assert.equal(h.audits.length,1);assert.equal(h.audits[0].name,"record_staff_authorization_denial");
      assert.deepEqual(h.audits[0].parameters.p_required_permissions,["journey.proposal.create","settings.manage"]);
    }
  });
}
test("authorized fee/margin request forwards explicit values and no global pricing operation",async()=>{
  const h=routeHarness(["journey.proposal.create","settings.manage"]),response=await h.post(uatOverrides);
  assert.equal(response.status,201);assert.equal(h.authCalls.length,1);assert.equal(h.audits.length,0);assert.equal(h.generated.length,1);
  const args=h.generated[0] as [string,string,{commercialOverrides:AllocationCommercialOverrides}];
  assert.equal(args[0],id);assert.equal(args[1],id);assert.deepEqual(args[2].commercialOverrides,uatOverrides);
});
test("old seven overrides and absent new keys preserve the Designer proposal-creation contract",async()=>{
  for(const overrides of [undefined,operations]){
    const h=routeHarness(["journey.proposal.create"]),response=await h.post(overrides);
    assert.equal(response.status,201);assert.equal(h.generated.length,1);assert.equal(h.authCalls.length,1);assert.deepEqual(h.audits,[]);
  }
});
test("unauthenticated request is 401 with no proposal or denial write",async()=>{
  const h=routeHarness([],false),response=await h.post(uatOverrides);
  assert.equal(response.status,401);assert.deepEqual(h.generated,[]);assert.deepEqual(h.audits,[]);
});
test("API rejects wrong types, non-cent values and invalid ranges before authorization or service calls",async()=>{
  const invalid=[{serviceFeeFixed:"25"},{serviceFeeFixed:-1},{serviceFeeFixed:1.001},{serviceFeePercent:100.01},{serviceFeePercent:true},{serviceFeePercent:0.001},{targetProfitMarginPercent:100},{targetProfitMarginPercent:-0.01},{targetProfitMarginPercent:20.001}];
  for(const value of invalid){const h=routeHarness(["journey.proposal.create","settings.manage"]),response=await h.post(value);assert.equal(response.status,400);assert.deepEqual(h.generated,[]);assert.deepEqual(h.authCalls,[]);assert.deepEqual(h.audits,[])}
  for(const literal of ["1e309","-1e309","NaN"]){
    const h=routeHarness(["journey.proposal.create","settings.manage"]),response=await h.postRaw(`{"action":"generate","enquiryId":"${id}","commercialOverrides":{"serviceFeeFixed":${literal}}}`);
    assert.equal(response.status,400);assert.deepEqual(h.generated,[]);assert.deepEqual(h.authCalls,[]);assert.deepEqual(h.audits,[]);
  }
});

test("actual allocation snapshot uses effective owned config without changing shared pricing or historical records",async()=>{
  const pricing=Object.freeze({id:true,active:true,driver_salary_per_day:null,fuel_price_per_litre:null,vehicle_km_per_litre:null,tolls_per_journey:null,parking_per_day:null,guide_accommodation_per_night:null,administration_fixed:null,administration_percent:null,contingency_percent:null,service_fee_fixed:null,service_fee_percent:null,target_profit_margin_percent:null,route_distance_buffer_percent:null});
  const enquiry=Object.freeze({id,travel_start_date:"2027-01-10",travel_end_date:"2027-01-12",selected_destinations:[id],trip_state:{}});
  const allocation=Object.freeze({id,enquiry_id:id,allocation_type:"experience",experience_id:id,destination_id:id,from_destination_id:null,to_destination_id:null,accommodation_id:null,guide_id:null,vehicle_id:null,supplier_cost:240,selling_price:null,provider_name:"Fictional UAT Provider",service_name:"Fictional UAT Experience",service_details:{},pricing_plan_snapshot:{},confirmation_status:"confirmed",quantity:4,currency:"USD"});
  const records:Record<string,unknown[]>={tour_pricing_config:[pricing],enquiries:[enquiry],journey_supplier_allocations:[allocation],destinations:[{id,name:"Local destination",latitude:1,longitude:1}],experiences:[{id,name:"Fictional UAT Experience"}]};
  const before=JSON.stringify(records),writes:string[]=[],queries:string[]=[];
  const db={from:(name:string)=>{
    queries.push(name);const rows=records[name]??[],forbidden=()=>{writes.push(name);throw Error("Offline snapshot must not write")};
    const chain={select:()=>chain,eq:()=>chain,in:()=>chain,order:()=>chain,maybeSingle:async()=>({data:rows[0]??null,error:null}),then:(resolve:(value:unknown)=>unknown)=>Promise.resolve({data:rows,error:null}).then(resolve),insert:forbidden,update:forbidden,delete:forbidden,upsert:forbidden};return chain;
  }};
  const load=modules({"@/lib/supabase/admin":{createAdminClient:()=>db},"@/lib/journey/route":{getRouteEstimate:()=>({estimatedDistance:0})},"@/lib/journey/journey-endpoints":{endpointRouteLocation:()=>null},"@/lib/journey/quotation-handoff":{parseJourneyHandoff:()=>null},"@/lib/journey/curated-journey-server":{resolveJourneyDesign:async()=>({state:null})}});
  const snapshot=load("lib/accounting/allocation-accounting.ts").allocationCommercialSnapshot as (id:string,overrides:AllocationCommercialOverrides)=>Promise<{summary:{totalSellingPrice:number};commercialContext:{config:AllocationCommercialConfig;overrides:AllocationCommercialOverrides}}>;
  const result=await snapshot(id,Object.freeze({...uatOverrides}));
  assert.equal(result.summary.totalSellingPrice,346.25);assert.equal(result.commercialContext.config.serviceFeeFixed,25);assert.equal(result.commercialContext.config.serviceFeePercent,5);assert.equal(result.commercialContext.config.targetProfitMarginPercent,20);
  assert.deepEqual(result.commercialContext.overrides,uatOverrides);assert.deepEqual(writes,[]);assert.equal(queries.filter(name=>name==="tour_pricing_config").length,1);assert.equal(JSON.stringify(records),before);
  assert.match(read("lib/proposals/journey-proposal-service.ts"),/commercial_snapshot:asJson\(\{summary:commercial.summary,context:commercial.commercialContext,rangeReview\}\)/);
});

for(const [label,account] of [
  ["no account",null],
  ["inactive allocation account",{id,active:false,quote_snapshot:{source:"supplier_allocations"}}],
  ["unrelated historical account",{id,active:true,quote_snapshot:{source:"historical_quote",protectedValue:100.25}}],
  ["accepted proposal account",{id,active:true,quote_snapshot:{source:"accepted_proposal",protectedValue:346.25}}]
] as const){
  test(`${label}: allocation save no-sync branch does not require pricing or rewrite accounting history`,async()=>{
    const protectedAccount=account?Object.freeze(account):null,before=JSON.stringify(protectedAccount),queries:string[]=[],writes:string[]=[];
    const db={from:(name:string)=>{
      queries.push(name);assert(["journey_accounts","journey_proposals"].includes(name),"No-sync must return before pricing/allocation reads");
      const forbidden=()=>{writes.push(name);throw Error("No-sync branch cannot write")};
      const chain={select:()=>chain,eq:()=>chain,order:()=>chain,limit:()=>chain,maybeSingle:async()=>({data:name==="journey_accounts"?protectedAccount:null,error:null}),update:forbidden,insert:forbidden,delete:forbidden};return chain;
    }};
    const load=modules({"@/lib/supabase/admin":{createAdminClient:()=>db},"@/lib/journey/route":{},"@/lib/journey/journey-endpoints":{},"@/lib/journey/quotation-handoff":{},"@/lib/journey/curated-journey-server":{}});
    const sync=load("lib/accounting/allocation-accounting.ts").syncAllocationAccounting as (id:string)=>Promise<{account:unknown;synced:boolean}>;
    const result=await sync(id);assert.equal(result.account,protectedAccount);assert.equal(result.synced,false);assert.deepEqual(queries,["journey_accounts","journey_proposals"]);assert.deepEqual(writes,[]);assert.equal(JSON.stringify(protectedAccount),before);
  });
}
test("active mutable allocation account still enforces Business Pricing before any accounting write",async()=>{
  const account=Object.freeze({id,active:true,quote_snapshot:{source:"supplier_allocations"}}),queries:string[]=[],writes:string[]=[];
  const db={from:(name:string)=>{
    queries.push(name);const value=name==="journey_accounts"?account:name==="enquiries"?{id}:null;
    const forbidden=()=>{writes.push(name);throw Error("Incomplete pricing must not write")};
    const chain={select:()=>chain,eq:()=>chain,order:()=>chain,limit:()=>chain,maybeSingle:async()=>({data:value,error:null}),then:(resolve:(value:unknown)=>unknown)=>Promise.resolve({data:[],error:null}).then(resolve),update:forbidden,insert:forbidden,delete:forbidden};return chain;
  }};
  const load=modules({"@/lib/supabase/admin":{createAdminClient:()=>db},"@/lib/journey/route":{},"@/lib/journey/journey-endpoints":{},"@/lib/journey/quotation-handoff":{},"@/lib/journey/curated-journey-server":{}});
  const sync=load("lib/accounting/allocation-accounting.ts").syncAllocationAccounting as (id:string)=>Promise<unknown>;
  await assert.rejects(sync(id),/Complete the active Business Pricing settings/);assert.equal(queries.filter(name=>name==="tour_pricing_config").length,1);assert.deepEqual(writes,[]);
});

test("UI both hides privileged fields and omits their request keys unless both capabilities exist",()=>{
  const workspace=read("features/admin/journey-lifecycle-workspace.tsx");
  assert.match(workspace,/canOverrideCommercialConfig=permissionSet.has\("settings.manage"\)&&permissionSet.has\("journey.proposal.create"\)/);
  assert.match(workspace,/\.\.\.\(canOverrideCommercialConfig\?\{serviceFeeFixed:optionalFormNumber/);
  assert.match(workspace,/\{canOverrideCommercialConfig\?<div[^\n]+name="serviceFeeFixed"[^\n]+name="serviceFeePercent"[^\n]+name="targetProfitMarginPercent"/);
  assert.match(workspace,/name="targetProfitMarginPercent" type="number" min="0" max="99.99" step=".01"/);
});
