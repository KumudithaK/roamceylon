import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";
import test from "node:test";
import ts from "typescript";

const external=createRequire(import.meta.url);
const token="00000000-0000-4000-8000-00000000c718";
const notFound=Symbol("safe-page-not-found");

function harness(row:Record<string,unknown>|null=null,error:{message:string}|null=null){
  const calls:{clients:number;reads:string[];updates:number;renders:number}={clients:0,reads:[],updates:0,renders:0};
  const safeSnapshot={safe:"customer-only"};
  const query={select:()=>query,eq:(field:string,value:string)=>{calls.reads.push(`${field}:${value}`);return query},
    maybeSingle:async()=>({data:row,error}),update:()=>{calls.updates++;return query}};
  const database={from:(table:string)=>{assert.equal(table,"journey_proposals");return query}};
  function load(file:string,overrides:Record<string,unknown>){
    const result={exports:{} as Record<string,unknown>};
    const compiled=ts.transpileModule(readFileSync(new URL("../"+file,import.meta.url),"utf8"),{
      compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}
    }).outputText;
    new Function("require","module","exports",compiled)((id:string)=>id in overrides?overrides[id]:external(id),result,result.exports);
    return result.exports;
  }
  const service=load("lib/proposals/traveller-proposal-service.ts",{
    "server-only":{},"@/lib/supabase/admin":{createAdminClient:()=>{calls.clients++;return database}},
    "./customer-proposal-dto":{customerSafeProposalDto:()=>safeSnapshot}
  }) as {loadTravellerProposal:(value:unknown,options?:{markViewed?:boolean})=>Promise<{proposal:Record<string,unknown>;snapshot:unknown}>};
  const page=load("app/proposal/[token]/page.tsx",{
    "next/navigation":{notFound:()=>{throw notFound}},
    "@/features/proposals/traveller-proposal":{TravellerProposal:()=>{calls.renders++;return null}},
    "@/lib/proposals/traveller-proposal-service":service
  }) as {default:(props:{params:Promise<{token:unknown}>})=>Promise<unknown>};
  return {service,page,calls,safeSnapshot};
}

for(const value of ["not-a-token",""," "+token,token+" ","../../private","<script>alert(1)</script>","x".repeat(10_000),null,42]){
  test(`invalid proposal token is rejected before database access: ${String(value).slice(0,35)}`,async()=>{
    const h=harness();
    await assert.rejects(h.service.loadTravellerProposal(value),error=>error instanceof Error&&"code" in error&&error.code==="NOT_FOUND"&&error.message==="This proposal is unavailable.");
    assert.deepEqual(h.calls,{clients:0,reads:[],updates:0,renders:0});
    await assert.rejects(h.page.default({params:Promise.resolve({token:value})}),error=>error===notFound);
    assert.deepEqual(h.calls,{clients:0,reads:[],updates:0,renders:0});
  });
}

test("well-formed missing token still uses exact-token lookup and safe not-found mapping",async()=>{
  const h=harness();
  await assert.rejects(h.page.default({params:Promise.resolve({token})}),error=>error===notFound);
  assert.equal(h.calls.clients,1);assert.deepEqual(h.calls.reads,[`public_token:${token}`]);assert.equal(h.calls.updates,0);
});

test("valid-format database errors are not misclassified as missing proposals",async()=>{
  const h=harness(null,{message:"controlled database failure"});
  await assert.rejects(h.service.loadTravellerProposal(token),error=>error instanceof Error&&"code" in error&&error.code==="DATABASE");
  assert.equal(h.calls.clients,1);assert.equal(h.calls.updates,0);
});

test("valid visible proposal remains customer-projected and read-only when markViewed is false",async()=>{
  const row={id:token,status:"sent",sent_snapshot:{fixture:true},valid_until:null,access_revoked_at:null};
  const h=harness(row),result=await h.service.loadTravellerProposal(token,{markViewed:false});
  assert.equal(result.proposal,row);assert.equal(result.snapshot,h.safeSnapshot);
  assert.deepEqual(h.calls.reads,[`public_token:${token}`]);assert.equal(h.calls.updates,0);
});

test("revoked and internal proposals retain their existing not-found boundary",async()=>{
  for(const row of [{id:token,status:"sent",access_revoked_at:"2026-10-23T00:00:00Z"},{id:token,status:"draft",access_revoked_at:null}]){
    const h=harness(row);
    await assert.rejects(h.service.loadTravellerProposal(token),error=>error instanceof Error&&"code" in error&&error.code==="NOT_FOUND");
    assert.equal(h.calls.updates,0);
  }
});
