import assert from "node:assert/strict";
import {existsSync,readFileSync,mkdirSync,writeFileSync} from "node:fs";
import {createRequire} from "node:module";
import path from "node:path";
import test from "node:test";
import ts from "typescript";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {presentationSnapshot} from "./fixtures/proposal-presentation-snapshot.ts";
import {proposalGreetingName,proposalDayDisplay,proposalStayDisplay,proposalExperienceTiming} from "../lib/proposals/proposal-display.ts";
import type {ProposalSnapshot} from "../lib/proposals/customer-proposal-types";

const root=path.resolve(import.meta.dirname,".."),external=createRequire(import.meta.url);
const read=(file:string)=>readFileSync(path.join(root,file),"utf8");
// Run actual application modules. Only I/O boundaries and the server marker are replaced.
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
        if(!resolved)throw Error("Unresolved test module "+id);return load(resolved);
      }
      return external(id);
    };
    const code=ts.transpileModule(readFileSync(file,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
    new Function("require","module","exports",code)(require,out,out.exports);return out.exports;
  }
  return (file:string)=>load(path.join(root,file));
}

test("demo greeting uses the personal name without modifying traveller identity",()=>{
  assert.equal(proposalGreetingName("STAGING DEMO — Alex Morgan"),"Alex");
  assert.equal(proposalGreetingName("STAGING DEMO - Alex Morgan"),"Alex");
  assert.equal(proposalGreetingName("Alex Morgan"),"Alex");
  assert.equal(proposalGreetingName("Stagington Fernando"),"Stagington");
});
test("room and meal-plan duplicates collapse without guessing meals or dropping distinct facts",()=>{
  const value=presentationSnapshot();
  assert.deepEqual(proposalStayDisplay(value.stays[0]),{room:value.stays[0].room,roomLabel:"Room & meal plan",mealPlan:""});
  assert.deepEqual(proposalDayDisplay(value.days[0]),{room:value.stays[0].room,meals:[]});
  const distinct={...value.stays[0],room:"Deluxe room",mealPlan:"Breakfast included"};
  assert.equal(proposalStayDisplay(distinct).mealPlan,"Breakfast included");
  assert.deepEqual(proposalDayDisplay({...value.days[0],room:"Deluxe room",meals:["Breakfast included"]}).meals,["Breakfast included"]);
});
test("flexible timing is explicit without rewriting a fixed schedule",()=>{
  assert.equal(proposalExperienceTiming("Flexible timing"),"Flexible day & time");
  assert.equal(proposalExperienceTiming("09:00 confirmed"),"09:00 confirmed");
});
test("actual HTML and print renderer preserves frozen identity, dates and money while clarifying presentation",()=>{
  const source=presentationSnapshot(),before=JSON.stringify(source);
  const Component=modules()("components/proposal/proposal-document.tsx").ProposalDocument as React.ComponentType<{snapshot:ProposalSnapshot;status:string}>;
  const html=renderToStaticMarkup(createElement(Component,{snapshot:source,status:"approved"}));
  assert.match(html,/Dear Alex,/);assert.match(html,/STAGING DEMO — Alex Morgan/);
  assert.doesNotMatch(html,/Dear STAGING|with breakfast · STAGING DEMO double room with breakfast/);
  assert.match(html,/Room &amp; meal plan/);assert.match(html,/Flexible day &amp; time/);assert.match(html,/indicative and remain to be agreed/);
  assert.match(html,/USD 2,367.50/);assert.match(html,/USD 700.00/);assert.match(html,/USD 1,667.50/);
  assert.equal(JSON.stringify(source),before);
  if(process.env.CEYLON_PRESENTATION_EVIDENCE){mkdirSync(process.env.CEYLON_PRESENTATION_EVIDENCE,{recursive:true});writeFileSync(path.join(process.env.CEYLON_PRESENTATION_EVIDENCE,"proposal-body.html"),html)}
});
test("actual PDF exporter applies the same labels and retains frozen snapshot and amounts",async()=>{
  const actualPdf=external("pdf-lib") as typeof import("pdf-lib"),drawn:string[]=[];
  let saved:Uint8Array|undefined,downloaded=false;
  const source=presentationSnapshot(),before=JSON.stringify(source);
  const pdfBoundary={...actualPdf,PDFDocument:{create:async()=>{
    const pdf=await actualPdf.PDFDocument.create(),addPage=pdf.addPage.bind(pdf),save=pdf.save.bind(pdf);
    pdf.addPage=((...args:Parameters<typeof addPage>)=>{const page=addPage(...args),draw=page.drawText.bind(page);page.drawText=(text,options)=>{drawn.push(text);draw(text,options)};return page}) as typeof pdf.addPage;
    pdf.save=async(options)=>{saved=await save(options);return saved};return pdf;
  }}};
  const oldFetch=globalThis.fetch,oldCreate=URL.createObjectURL,oldRevoke=URL.revokeObjectURL;
  const oldDocument=Object.getOwnPropertyDescriptor(globalThis,"document"),oldTimeout=globalThis.setTimeout;
  try{
    globalThis.fetch=(async()=>new Response(null,{status:404})) as typeof fetch;
    Object.defineProperty(globalThis,"document",{configurable:true,value:{createElement:()=>({click:()=>{downloaded=true},href:"",download:""})}});
    URL.createObjectURL=()=>"blob:offline";URL.revokeObjectURL=()=>{};
    globalThis.setTimeout=((callback:()=>void)=>{callback();return 0}) as unknown as typeof setTimeout;
    const exporter=modules({"pdf-lib":pdfBoundary})("lib/proposals/export-proposal-pdf.ts").exportProposalPdf as (...args:unknown[])=>Promise<void>;
    await exporter({sent_snapshot:source,proposal_reference:source.proposalReference,version:1},{name:source.traveller.name});
    const text=drawn.join("\n");assert.match(text,/Dear Alex,/);assert.match(text,/Flexible day & time/);assert.match(text,/indicative and remain to be agreed/);
    assert.doesNotMatch(text,/Dear STAGING|with breakfast \| STAGING DEMO double room with breakfast/);
    for(const value of ["USD 2,367.50","USD 700.00","USD 1,667.50"])assert(text.includes(value));
    assert.equal(JSON.stringify(source),before);assert(downloaded);assert(saved&&saved.length>1000);
    assert((await actualPdf.PDFDocument.load(saved!)).getPageCount()>0);
    if(process.env.CEYLON_PRESENTATION_EVIDENCE)writeFileSync(path.join(process.env.CEYLON_PRESENTATION_EVIDENCE,"admin-export-local.pdf"),saved!);
  }finally{
    globalThis.fetch=oldFetch;URL.createObjectURL=oldCreate;URL.revokeObjectURL=oldRevoke;globalThis.setTimeout=oldTimeout;
    if(oldDocument)Object.defineProperty(globalThis,"document",oldDocument);else Reflect.deleteProperty(globalThis,"document");
  }
});
