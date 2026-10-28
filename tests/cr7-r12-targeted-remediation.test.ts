import assert from "node:assert/strict";
import {existsSync,readFileSync} from "node:fs";
import {createRequire} from "node:module";
import path from "node:path";
import test from "node:test";
import ts from "typescript";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {customerProposalContent,approvedProposalContact} from "../lib/proposals/customer-proposal-content.ts";
import type {ProposalSnapshot} from "../lib/proposals/customer-proposal-types";
import {defaultRolePermissions,type StaffRole} from "../lib/admin/permissions.ts";

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

function fulfilHandler(answer:string|null,ok=true){
  const calls:{url:string;body:Record<string,unknown>}[]=[],saving:boolean[]=[],messages:string[]=[];
  let sessions=0,keys=0,reloads=0;
  const source=read("features/admin/journey-lifecycle-workspace.tsx");
  const handler=source.slice(source.indexOf("  const fulfilAllocation="),source.indexOf("  const proposalAction="));
  const code=ts.transpileModule(handler+"\nreturn fulfilAllocation;",{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
  const run=new Function("window","setSaving","setMessage","createClient","fetch","crypto","enquiry","load",code)(
    {prompt:()=>answer},(v:boolean)=>saving.push(v),(v:string)=>messages.push(v),()=>({auth:{getSession:async()=>{sessions++;return {data:{session:{access_token:"in-memory-only"}}}}}}),
    async(url:string,options:{body:string})=>{calls.push({url,body:JSON.parse(options.body)});return {ok,json:async()=>ok?{}:{error:"Already fulfilled"}}},
    {randomUUID:()=>{keys++;return "test-idempotency-key"}},{id:"test-enquiry"},async()=>{reloads++}
  ) as (id:string)=>Promise<void>;
  return {run,calls,saving,messages,counts:()=>({sessions,keys,reloads})};
}
for(const dismissal of ["Cancel","Escape"])test(`${dismissal}: actual fulfil handler returns before session, key, command or state mutation`,async()=>{
  const h=fulfilHandler(null);await h.run("allocation");assert.deepEqual(h.calls,[]);assert.deepEqual(h.saving,[]);assert.deepEqual(h.messages,[]);assert.deepEqual(h.counts(),{sessions:0,keys:0,reloads:0});
});
for(const [answer,notes] of [["",""],["  ",""],["  CR7 TEST ONLY — simulated  ","CR7 TEST ONLY — simulated"]])test(`submitted note ${JSON.stringify(answer)} preserves optional-note contract`,async()=>{
  const h=fulfilHandler(answer);await h.run("allocation");assert.equal(h.calls.length,1);assert.equal(h.calls[0].url,"/api/admin/journey-allocations");assert.deepEqual(h.calls[0].body,{enquiryId:"test-enquiry",allocationId:"allocation",action:"fulfil",notes,idempotencyKey:"test-idempotency-key"});assert.deepEqual(h.counts(),{sessions:1,keys:1,reloads:1});assert.deepEqual(h.saving,[true,false]);
});
test("duplicate/state rejection remains visible and does not claim successful fulfilment",async()=>{
  const h=fulfilHandler("",false);await h.run("allocation");assert.equal(h.calls.length,1);assert.equal(h.messages.at(-1),"Already fulfilled");assert.equal(h.counts().reloads,0);
});

function snapshot():ProposalSnapshot{return {
  schemaVersion:1,generatedAt:"2026-10-15",proposalReference:"CR7-LOCAL",version:1,
  brand:{name:"Roam Ceylon",line:"Roam Ceylon Atelier",logo:"https://legacy.invalid/logo.png"},
  traveller:{name:"Roam Ceylon Traveller",email:"traveller@example.com",adults:4,children:0,infants:0,total:4,requirements:[]},
  journey:{startDate:"2027-01-17",endDate:"2027-01-29",days:13,nights:12,pickup:"Airport",dropoff:"Airport",route:[{key:"roam_ceylon_legacy_key",name:"Colombo",kind:"destination"}]},
  introduction:"Roam Ceylon Atelier welcomes you. hello@roamceylon.com",terms:"Contact Roam Ceylon at unapproved@example.com",destinations:[],days:[],stays:[],transport:[],guides:[],
  experiences:[{name:"Fortress",destination:"Sigiriya",description:"With Roam Ceylon",admission:"Included",guide:"As stated",thingsToKnow:["Contact Roam Ceylon"],status:"included"}],
  benefits:[{code:"roam_ceylon_test",type:"roam_ceylon_complimentary",scope:"journey",title:"Roam Ceylon privilege",description:"Roam Ceylon care",confidence:"guaranteed_by_roam_ceylon",quantity:1,verifiedSavings:0}],
  inclusions:["Roam Ceylon coordination"],exclusions:["International flights"],optionalItems:[],
  pricing:{currency:"USD",total:100.25,perPerson:25.06,breakdown:[{key:"roam_ceylon_technical_key",label:"Roam Ceylon service",amount:100.25}],allInclusive:true},
  payment:{depositAmount:25,depositDueLabel:"Due on acceptance",balanceAmount:75.25,paidAmount:0,status:"not_started"},importantInformation:[],nextSteps:["Contact Roam Ceylon"],
  contact:{hotline:"unverified",whatsappUrl:"https://unverified.invalid",facebookUrl:"https://unverified.invalid",address:"unverified",email:"hello@roamceylon.com",businessRegistrationNumber:"unverified"}
};}
test("business content uses approved contacts, omits mailboxes, preserves identity, amounts and technical keys",()=>{
  const source=snapshot(),before=JSON.stringify(source),result=customerProposalContent(source);
  assert.equal(JSON.stringify(source),before);assert.deepEqual(result.contact,approvedProposalContact());assert(!("email" in result.contact));assert(!("businessRegistrationNumber" in result.contact));
  assert.equal(result.brand.name,"The Ceylon Edition");assert.equal(result.brand.logo,"");assert.doesNotMatch(result.introduction+result.terms,/roam ceylon|@/i);
  assert.deepEqual(result.traveller,source.traveller);assert.equal(result.journey.route[0].key,"roam_ceylon_legacy_key");assert.equal(result.pricing.breakdown[0].key,"roam_ceylon_technical_key");assert.equal(result.pricing.total,100.25);assert.deepEqual(result.payment,source.payment);
  assert.equal(result.benefits![0].type,"roam_ceylon_complimentary");assert.equal(result.benefits![0].confidence,"guaranteed_by_roam_ceylon");assert.equal(result.benefits![0].code,"roam_ceylon_test");
  assert.equal(result.experiences[0].thingsToKnow[0],"Contact The Ceylon Edition");assert.deepEqual(customerProposalContent(result),result);
});
test("actual customer DTO strips private canaries and normalizes frozen legacy content without mutation",()=>{
  const dto=modules()("lib/proposals/customer-proposal-dto.ts").customerSafeProposalDto as (v:unknown)=>ProposalSnapshot|null;
  const source={...snapshot(),supplier_cost:88,privateNotes:"PRIVATE_CANARY",commercial_snapshot:{internalCost:88},contact:{...snapshot().contact,secret:"PRIVATE_CANARY"}};
  const before=JSON.stringify(source),result=dto(source)!;assert(result);assert.equal(JSON.stringify(source),before);assert.doesNotMatch(JSON.stringify(result),/PRIVATE_CANARY|supplier_cost|commercial_snapshot|hello@roamceylon/);assert.equal(result.traveller.email,"traveller@example.com");assert.equal(dto({schemaVersion:1}),null);
});
test("actual HTML/print view shows approved contacts and public benefit labels, not legacy email or enum wording",()=>{
  const Component=modules()("components/proposal/proposal-document.tsx").ProposalDocument as React.ComponentType<{snapshot:ProposalSnapshot;status:string}>;
  const value=snapshot();value.traveller.name="CR7 TEST ONLY Traveller";
  const html=renderToStaticMarkup(createElement(Component,{snapshot:value,status:"approved"}));
  assert.match(html,/The Ceylon Edition/);assert.match(html,/78 799 7897/);assert.doesNotMatch(html,/hello@|unapproved@|mailto:|Roam Ceylon|roam ceylon complimentary/i);
});
test("composer, PDF, traveller acceptance and print paths retain the shared contact/privacy boundary",()=>{
  const composer=read("lib/proposals/customer-proposal.ts"),pdf=read("lib/proposals/export-proposal-pdf.ts"),service=read("lib/proposals/traveller-proposal-service.ts");
  assert.match(composer,/customerProposalContent\(/);assert.match(composer,/approvedProposalContact\(\)/);assert.doesNotMatch(composer,/business_email|enquiry_email|line\.arrivalInstructions/);assert.match(pdf,/customerProposalContent\(source\)/);assert.match(service,/customerSafeProposalDto/);assert.match(service,/accept_journey_proposal_command/);
});
test("actual PDF exporter draws approved business content without changing the frozen snapshot",async()=>{
  const actualPdf=external("pdf-lib") as typeof import("pdf-lib"),drawn:string[]=[],requests:string[]=[];
  let saved:Uint8Array|undefined,downloaded=false;
  const source=snapshot();source.traveller.name="CR7 TEST ONLY Traveller";const before=JSON.stringify(source);
  const pdfBoundary={...actualPdf,PDFDocument:{create:async()=>{
    const pdf=await actualPdf.PDFDocument.create(),addPage=pdf.addPage.bind(pdf),save=pdf.save.bind(pdf);
    pdf.addPage=((...args:Parameters<typeof addPage>)=>{const page=addPage(...args),draw=page.drawText.bind(page);page.drawText=(text,options)=>{drawn.push(text);draw(text,options)};return page}) as typeof pdf.addPage;
    pdf.save=async(options)=>{saved=await save(options);return saved};return pdf;
  }}};
  const oldFetch=globalThis.fetch,oldCreate=URL.createObjectURL,oldRevoke=URL.revokeObjectURL;
  const oldDocument=Object.getOwnPropertyDescriptor(globalThis,"document"),oldTimeout=globalThis.setTimeout;
  try{
    globalThis.fetch=(async(input)=>{requests.push(String(input));return new Response(null,{status:404})}) as typeof fetch;
    Object.defineProperty(globalThis,"document",{configurable:true,value:{createElement:()=>({click:()=>{downloaded=true},href:"",download:""})}});
    URL.createObjectURL=()=>"blob:local-only";URL.revokeObjectURL=()=>{};
    globalThis.setTimeout=((callback:()=>void)=>{callback();return 0}) as unknown as typeof setTimeout;
    const exporter=modules({"pdf-lib":pdfBoundary})("lib/proposals/export-proposal-pdf.ts").exportProposalPdf as (...args:unknown[])=>Promise<void>;
    await exporter({sent_snapshot:source,proposal_reference:"CR7-LOCAL",version:1},{name:"CR7 TEST ONLY Traveller"});
    assert.equal(JSON.stringify(source),before);assert(downloaded);assert(saved&&saved.length>1000);
    assert.match(Buffer.from(saved!).subarray(0,8).toString(),/^%PDF-/);
    const text=drawn.join("\n");assert.match(text,/THE CEYLON EDITION/);assert.match(text,/78 799 7897/);
    assert.doesNotMatch(text,/hello@|unapproved@|Roam Ceylon|unverified|PRIVATE_/i);
    assert.equal(requests.length,1);assert.match(requests[0],/^https:\/\/api\.qrserver\.com\//);
    assert.equal((await actualPdf.PDFDocument.load(saved!)).getPageCount()>0,true);
  }finally{
    globalThis.fetch=oldFetch;URL.createObjectURL=oldCreate;URL.revokeObjectURL=oldRevoke;globalThis.setTimeout=oldTimeout;
    if(oldDocument)Object.defineProperty(globalThis,"document",oldDocument);else Reflect.deleteProperty(globalThis,"document");
  }
});
test("actual proposal composition/serialization excludes operational instructions, costs and private notes",async()=>{
  const state={selectedDestinationIds:[id],selectedExperienceIds:[id],destinationPreferences:{[id]:{nights:12}},travelDates:{start:"2027-01-17",end:"2027-01-29"},travellerCounts:{adults:4,children:0,infants:0},pickup:{type:"airport",airportCode:"CMB",location:"",time:"10:00"},dropoff:{type:"airport",airportCode:"CMB",location:"",time:"18:00"},accessibilityRequirements:""};
  const rows:Record<string,unknown[]>={destinations:[{id,name:"Colombo",short_description:"Roam Ceylon destination",local_highlights:[],latitude:6.9,longitude:79.8}],experiences:[{id,name:"Experience",short_description:"Roam Ceylon experience",things_to_know:["Ask Roam Ceylon"]}],vehicles:[{id,vehicle_model:"Synthetic vehicle",vehicle_type:"Van"}],journey_accounts:[]};
  const db={from:(name:string)=>{assert.notEqual(name,"website_settings");const data=rows[name]??[];const chain={select:()=>chain,eq:()=>chain,in:()=>chain,maybeSingle:async()=>({data:data[0]??null,error:null}),then:(resolve:(v:unknown)=>unknown)=>Promise.resolve({data,error:null}).then(resolve)};return chain}};
  const composerModule=modules({"@/lib/journey/quotation-handoff":{parseJourneyHandoff:()=>({state})}})("lib/proposals/customer-proposal.ts");
  const compose=composerModule.composeCustomerProposal as (...args:unknown[])=>Promise<ProposalSnapshot>,serialize=composerModule.customerProposalJson as (s:ProposalSnapshot)=>ProposalSnapshot;
  const generated=await compose(db,{id,name:"CR7 TEST ONLY Traveller",email:"traveller@example.com",trip_state:{},traveller_notes:null},null,[{type:"vehicle",resourceId:id,resourceName:"Van",providerName:"Provider",serviceName:"Transfer",serviceDetails:{},supplierCost:12.25,sellingPrice:50.25,confirmationStatus:"confirmed",supplierContact:"PRIVATE_CONTACT",arrivalInstructions:"PRIVATE_ARRIVAL",specialNotes:"PRIVATE_NOTE"}],{totalSellingPrice:100.25},{reference:"CR7-LOCAL",version:1,currency:"USD"},{introduction:"Roam Ceylon welcomes you",terms:"Contact unapproved@example.com"});
  const serialized=serialize(generated);assert.deepEqual(serialized.contact,approvedProposalContact());assert.equal(serialized.pricing.total,100.25);assert.equal(serialized.journey.days,13);assert.equal(serialized.journey.nights,12);assert.doesNotMatch(JSON.stringify(serialized),/PRIVATE_|supplierCost|supplierContact|unapproved@|Roam Ceylon/i);
});
test("actual acceptance service keeps traveller identity and exact token while returning approved customer content",async()=>{
  const calls:{name:string;parameters:Record<string,unknown>}[]=[],value={id,status:"sent",view_count:0,sent_snapshot:snapshot(),customer_snapshot:null,requires_new_version:false};
  const db={from:()=>{const chain={select:()=>chain,eq:()=>chain,maybeSingle:async()=>({data:value,error:null}),single:async()=>({data:{...value,status:"approved"},error:null})};return chain},rpc:async(name:string,parameters:Record<string,unknown>)=>{calls.push({name,parameters});return {error:null}}};
  const accept=modules({"@/lib/supabase/admin":{createAdminClient:()=>db}})("lib/proposals/traveller-proposal-service.ts").acceptTravellerProposal as (token:string,input:unknown)=>Promise<{snapshot:ProposalSnapshot}>;
  await assert.rejects(accept(id,{name:"CR7 TEST ONLY",email:"wrong@example.com",termsAcknowledged:true}),/email address associated/);assert.equal(calls.length,0);
  const result=await accept(id,{name:"CR7 TEST ONLY",email:"traveller@example.com",termsAcknowledged:true});assert.equal(calls.length,1);assert.equal(calls[0].name,"accept_journey_proposal_command");assert.equal(calls[0].parameters.p_public_token,id);assert.equal(result.snapshot.traveller.email,"traveller@example.com");assert(!("email" in result.snapshot.contact));
});

const id="00000000-0000-4000-8000-00000000c712";
function staffHarness(role:StaffRole){
  const calls:string[]=[],allocation={id,supplier_cost:50,pricing_plan_snapshot:{internal:"PRIVATE_COST"},supplier_contact:"PRIVATE_CONTACT",arrival_instructions:"PRIVATE_OPS",special_notes:"PRIVATE_NOTE",service_name:"Service",quantity:1,quantity_label:"trip",confirmation_status:"confirmed",invoice_status:"received",payment_status:"payment_due"};
  const rows:Record<string,unknown[]>={profiles:[{role:role==="super_admin"?"admin":"editor"}],profile_staff_roles:[{role_code:role}],staff_role_permissions:defaultRolePermissions[role].map(permission_code=>({permission_code})),journey_supplier_allocations:[allocation]};
  const db={auth:{getUser:async(token:string)=>token==="valid"?{data:{user:{id}},error:null}:{data:{user:null},error:{message:"Invalid"}}},from:(name:string)=>{
    const data=rows[name]??[];const chain={select:()=>chain,eq:()=>chain,in:()=>chain,order:()=>chain,maybeSingle:async()=>({data:data[0]??null,error:null}),single:async()=>({data:data[0]??null,error:null}),then:(resolve:(v:unknown)=>unknown)=>Promise.resolve({data,error:null}).then(resolve)};return chain;
  },rpc:async(name:string)=>{calls.push(name);return {data:{idempotent:false},error:null}}};
  return {load:modules({"@/lib/supabase/admin":{createAdminClient:()=>db}}),calls};
}
const request=(pathname:string,body?:unknown,token="valid")=>new Request("https://staging.invalid"+pathname,{method:body?"POST":"GET",headers:{...(token?{authorization:`Bearer ${token}`}:{ }),"content-type":"application/json"},...(body?{body:JSON.stringify(body)}:{})});
for(const role of ["journey_designer","finance","operations","super_admin"] as const){
  test(`actual allocation API: ${role} least-privilege projection`,async()=>{
    const h=staffHarness(role),GET=h.load("app/api/admin/journey-allocations/route.ts").GET as (r:Request)=>Promise<Response>;
    const response=await GET(request(`/api/admin/journey-allocations?enquiryId=${id}`));assert.equal(response.status,200);const result=await response.json();const row=result.allocations[0];
    assert.equal(row.supplier_cost,role==="finance"||role==="super_admin"?50:undefined);assert.equal(row.supplier_contact,role==="operations"||role==="super_admin"?"PRIVATE_CONTACT":undefined);
    assert.equal(row.special_notes,role==="operations"||role==="super_admin"?"PRIVATE_NOTE":undefined);assert.deepEqual(h.calls,[]);
  });
  test(`actual fulfilment API: ${role} allowed/denied independently of finance`,async()=>{
    const h=staffHarness(role),PATCH=h.load("app/api/admin/journey-allocations/route.ts").PATCH as (r:Request)=>Promise<Response>;
    const response=await PATCH(request("/api/admin/journey-allocations",{enquiryId:id,allocationId:id,action:"fulfil",notes:"",idempotencyKey:"cr7-local-replay-key"}));
    const allowed=role==="operations"||role==="super_admin";assert.equal(response.status,allowed?200:403);assert.equal(h.calls.includes("fulfil_supplier_allocation_command"),allowed);assert(!h.calls.includes("record_accounting_transaction_command"));
    if(allowed){const body=await response.json();assert.equal(body.allocation.supplier_cost,role==="super_admin"?50:undefined);assert.deepEqual(body.allocation.pricing_plan_snapshot,role==="super_admin"?{internal:"PRIVATE_COST"}:undefined);assert.equal(Object.hasOwn(body.allocation,"supplier_cost"),role==="super_admin");}
  });
  test(`actual payment API: ${role} cross-role boundary`,async()=>{
    const h=staffHarness(role),POST=h.load("app/api/admin/accounting/transactions/route.ts").POST as (r:Request)=>Promise<Response>;
    const response=await POST(request("/api/admin/accounting/transactions",{accountId:id,type:"customer_receipt",amount:1.25,paymentDate:"2027-01-01",idempotencyKey:"cr7-local-receipt-key"}));
    const allowed=role==="finance"||role==="super_admin";assert.equal(response.status,allowed?201:403);assert.equal(h.calls.includes("record_accounting_transaction_command"),allowed);assert(!h.calls.includes("fulfil_supplier_allocation_command"));
  });
}
for(const token of ["","invalid"])test(`anonymous/invalid token ${JSON.stringify(token)} cannot use actual allocation API`,async()=>{
  const h=staffHarness("super_admin"),GET=h.load("app/api/admin/journey-allocations/route.ts").GET as (r:Request)=>Promise<Response>;
  assert.equal((await GET(request(`/api/admin/journey-allocations?enquiryId=${id}`,undefined,token))).status,401);assert.deepEqual(h.calls,[]);
});
test("account migration changes only new-account accepted dates; no ACL, history rewrite or transaction commit",()=>{
  const migration=read("supabase/migrations/202610150001_cr7_account_accepted_dates.sql");
  assert.match(migration,/create or replace function public\.initialize_journey_account_command/);assert.match(migration,/security definer set search_path=''/);assert.match(migration,/finance\.payments\.manage/);assert.match(migration,/if account_row\.id is null then[\s\S]*accepted_start_text:=proposal_row\.sent_snapshot/);assert.match(migration,/accepted_start,accepted_end,/);assert.match(migration,/curated_journey_snapshot#>>'\{travelDates,start\}'/);assert.match(migration,/datetime_field_overflow or invalid_datetime_format/);assert.match(migration,/initial-deposit:/);
  assert.doesNotMatch(migration,/enquiry_row\.travel_start_date|\bCOMMIT\s*;|\bGRANT\b|\bALTER\b|\bDROP\b|UPDATE public\.journey_accounts/i);
});
