import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";
import test from "node:test";
import ts from "typescript";

const source=readFileSync(new URL("../features/admin/accounting-overview.tsx",import.meta.url),"utf8");
const external=createRequire(import.meta.url);
const flush=()=>new Promise<void>(resolve=>setImmediate(resolve));
type QueryResult={data:Record<string,unknown>[];error:{message:string}|null};
const empty:QueryResult={data:[],error:null};

function harness(options:{session?:boolean;error?:string;waitForSession?:Promise<unknown>;waitForRows?:Promise<QueryResult>;account?:boolean}={}){
  let effect:(()=>void|(()=>void))|undefined,slot=0;
  const updates:{slot:number;value:unknown}[]=[],queries:string[]=[],redirects:string[]=[];
  const db={auth:{getSession:async()=>{await options.waitForSession;return {data:{session:options.session===false?null:{user:{id:"in-process-only"}}}}}},from:(table:string)=>{
    queries.push(table);
    const result=options.waitForRows??Promise.resolve({data:table==="finance_journey_accounts"&&options.account?[{enquiry_id:"owned-in-process-id"}]:[],error:options.error?{message:options.error}:null});
    const chain={select:()=>chain,order:()=>chain,in:()=>chain,then:(resolve:(value:QueryResult)=>unknown)=>result.then(resolve)};
    return chain;
  }};
  const require=(id:string):unknown=>{
    if(id==="react")return {useState:(initial:unknown)=>{const index=slot++;return [initial,(value:unknown)=>updates.push({slot:index,value})]},useEffect:(callback:typeof effect)=>{effect=callback}};
    if(id==="next/navigation")return {useRouter:()=>({replace:(path:string)=>redirects.push(path)})};
    if(id==="@/lib/supabase/client")return {createClient:()=>db};
    if(id==="./admin-shell")return {AdminShell:()=>null};
    if(id==="@/lib/enquiries/enquiry-workflow")return {enquiryStatusLabels:{}};
    return external(id);
  };
  const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  const compiledModule={exports:{} as {AccountingOverview?:()=>unknown}};
  new Function("require","module","exports",compiled)(require,compiledModule,compiledModule.exports);
  compiledModule.exports.AccountingOverview!();
  assert(effect);
  const cleanup=effect();
  assert.equal(typeof cleanup,"function");
  return {updates,queries,redirects,cleanup:cleanup as ()=>void};
}

test("accounting effect retains the existing read-only finance views and reference lookup",async()=>{
  const h=harness({account:true});await flush();
  assert.deepEqual(h.queries,["finance_journey_accounts","journey_settlements","traveller_finance_reference"]);
  assert.deepEqual(h.redirects,[]);assert.deepEqual(h.updates.map(item=>item.slot),[0,1,2,3]);
  assert.deepEqual(h.updates.at(-1),{slot:3,value:false});h.cleanup();
});
test("accounting effect redirects an absent session without querying financial records",async()=>{
  const h=harness({session:false});await flush();
  assert.deepEqual(h.redirects,["/admin/login"]);assert.deepEqual(h.queries,[]);assert.deepEqual(h.updates,[]);h.cleanup();
});
test("accounting effect preserves error display and does not publish partial financial state",async()=>{
  const h=harness({error:"Owned in-process failure"});await flush();
  assert.deepEqual(h.updates,[{slot:4,value:"Owned in-process failure"},{slot:3,value:false}]);h.cleanup();
});
test("unmount during session lookup prevents both redirect and subsequent queries",async()=>{
  let release!:()=>void;const pending=new Promise<void>(resolve=>{release=resolve});
  const h=harness({session:false,waitForSession:pending});h.cleanup();release();await flush();
  assert.deepEqual(h.redirects,[]);assert.deepEqual(h.queries,[]);assert.deepEqual(h.updates,[]);
});
test("unmount during finance reads prevents reference fetch and state updates",async()=>{
  let release!:(value:QueryResult)=>void;const pending=new Promise<QueryResult>(resolve=>{release=resolve});
  const h=harness({waitForRows:pending});await flush();h.cleanup();release({...empty,data:[{enquiry_id:"owned-in-process-id"}]});await flush();
  assert.deepEqual(h.queries,["finance_journey_accounts","journey_settlements"]);assert.deepEqual(h.updates,[]);
});
