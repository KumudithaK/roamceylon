import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";
import test from "node:test";
import ts from "typescript";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {allocationForStaff,allocationSnapshotForStaff,fulfilmentResultForStaff} from "../lib/admin/allocation-projection.ts";
import {proposalForStaff} from "../lib/admin/traveller-pii.ts";
import {defaultRolePermissions,type StaffRole} from "../lib/admin/permissions.ts";
import type {Database,Json} from "../lib/database.types";

type Allocation=Database["public"]["Tables"]["journey_supplier_allocations"]["Row"];
type Proposal=Database["public"]["Tables"]["journey_proposals"]["Row"];
const serialized=<T,>(value:T):T=>JSON.parse(JSON.stringify(value));
const absent=(value:object,keys:string[])=>keys.forEach(key=>assert.equal(Object.hasOwn(value,key),false,`Forbidden property ${key} must not exist`));
const allocation=()=>({id:"synthetic",enquiry_id:"synthetic",allocation_type:"experience",service_name:"Owned local test",quantity:4,quantity_label:"participants",provider_name:"Synthetic",currency:"USD",
  supplier_cost:50.25,selling_price:80.25,supplier_contact:"CONTACT_ONLY",arrival_instructions:"DELIVERY_ONLY",special_notes:"DELIVERY_ONLY",fulfilment_notes:"DELIVERY_ONLY",cancellation_reason:"DELIVERY_ONLY",
  confirmation_status:"confirmed",invoice_status:"received",payment_status:"payment_due",fulfilment_status:"pending",
  service_details:{rooms:2,nights:3,guests:4,participants:4,guideRole:"primary",guideNotes:"DESIGN_PRIVATE",internalCost:50.25,privateContact:"DETAIL_CONTACT_PRIVATE",nested:{supplierCost:50.25},class:{privateContact:"NESTED_PRIVATE"}},
  pricing_plan_snapshot:{id:"rate",name:"Synthetic rate",price:50.25,unitPrice:12.5625,currency:"USD",chargingMethod:"per_person",notes:"RATE_PRIVATE",details:{privateContact:"RATE_CONTACT_PRIVATE"}},
  future_secret:"FUTURE_PRIVATE"
}) as unknown as Allocation;
const snapshotLine=()=>({allocationId:"synthetic",type:"experience",serviceName:"Owned local test",quantity:4,quantityLabel:"participants",currency:"USD",confirmationStatus:"confirmed",
  supplierCost:50.25,sellingPrice:80.25,supplierContact:"CONTACT_ONLY",arrivalInstructions:"DELIVERY_ONLY",specialNotes:"DELIVERY_ONLY",invoiceStatus:"received",paymentStatus:"payment_due",
  serviceDetails:allocation().service_details,pricingPlanSnapshot:allocation().pricing_plan_snapshot,futurePrivate:"FUTURE_PRIVATE"
});
const proposal=()=>({id:"synthetic",enquiry_id:"synthetic",version:1,proposal_reference:"LOCAL_ONLY",status:"approved",currency:"USD",total_supplier_cost:50.25,total_selling_price:80.25,gross_profit:30,profit_margin:37.38,
  allocation_snapshot:[snapshotLine(),"OPAQUE_PRIVATE",null,["OPAQUE_PRIVATE"]],
  commercial_snapshot:{summary:{totalSupplierCost:50.25,totalSellingPrice:80.25,internalCost:50.25,grossProfit:30,profitMargin:37.38,privateContact:"COMMERCIAL_PRIVATE",breakdown:[{key:"supplier",label:"Service",amount:50.25,category:"supplier",internal:true,privateContact:"COMMERCIAL_PRIVATE"}]},context:{days:4,nights:3,distanceKm:25,privateContact:"COMMERCIAL_PRIVATE",config:{targetProfitMarginPercent:30,privateContact:"COMMERCIAL_PRIVATE"},overrides:{fuel:10,privateContact:"COMMERCIAL_PRIVATE"}},rangeReview:{status:"within_range",proposalTotal:80.25,reason:"DESIGN_PII_REASON",privateContact:"COMMERCIAL_PRIVATE"}},
  customer_snapshot:{traveller:{email:"TRAVELLER_PRIVATE"}},sent_snapshot:{traveller:{email:"TRAVELLER_PRIVATE"}},curated_journey_snapshot:{guideNotes:"DESIGN_PRIVATE"},accepted_name:"TRAVELLER_PRIVATE",accepted_email:"TRAVELLER_PRIVATE",acceptance_metadata:{agent:"TRAVELLER_PRIVATE"},public_token:"TOKEN_PRIVATE",introduction:"DESIGN_PRIVATE",terms:"DESIGN_PRIVATE",future_secret:"FUTURE_PRIVATE"
}) as unknown as Proposal;

for(const role of ["journey_designer","finance","operations","super_admin","partner_manager","content_marketing"] as StaffRole[]){
  test(`serialized allocation ${role}: role-specific keys are absent, not null placeholders`,()=>{
    const source=allocation(),before=JSON.stringify(source),result=serialized(allocationForStaff(source,defaultRolePermissions[role]));
    const allocator=role==="super_admin"||role==="partner_manager",costs=allocator||role==="finance",contacts=allocator||role==="operations",payments=role==="super_admin"||role==="finance"||role==="operations";
    if(costs){assert.equal(result.supplier_cost,50.25);assert(result.pricing_plan_snapshot)}else absent(result,["supplier_cost","pricing_plan_snapshot"]);
    if(contacts)assert.equal(result.supplier_contact,"CONTACT_ONLY");else absent(result,["supplier_contact","arrival_instructions","special_notes","fulfilment_notes","cancellation_reason"]);
    if(payments)assert.equal(result.invoice_status,"received");else absent(result,["invoice_status","payment_status"]);
    if(role==="operations"||role==="content_marketing")absent(result,["selling_price"]);
    if(allocator){assert.deepEqual(result.service_details,source.service_details);assert.deepEqual(result.pricing_plan_snapshot,source.pricing_plan_snapshot)}
    else{assert.deepEqual(result.service_details,{rooms:2,nights:3,guests:4,participants:4,guideRole:"primary"});assert.doesNotMatch(JSON.stringify(result),/DETAIL_CONTACT_PRIVATE|NESTED_PRIVATE|RATE_PRIVATE|RATE_CONTACT_PRIVATE|DESIGN_PRIVATE/)}
    absent(result,["future_secret"]);assert.equal(JSON.stringify(source),before);
  });
}

for(const role of ["journey_designer","finance","operations","super_admin"] as StaffRole[]){
  test(`serialized staff proposal ${role}: nested snapshot follows allocation cost/contact policy`,()=>{
    const source=proposal(),before=JSON.stringify(source),result=serialized(proposalForStaff(source,defaultRolePermissions[role]));
    const lines=result.allocation_snapshot as Record<string,Json>[],line=lines[0];assert.equal(lines.length,1);absent(line,["futurePrivate"]);absent(result,["future_secret"]);
    if(role==="journey_designer"||role==="operations"){absent(result,["total_supplier_cost","gross_profit","profit_margin","commercial_snapshot"]);absent(line,["supplierCost","pricingPlanSnapshot"])}
    else{assert.equal(result.total_supplier_cost,50.25);assert.equal(line.supplierCost,50.25);assert.equal(result.gross_profit,30)}
    if(role==="journey_designer"||role==="finance")absent(line,["supplierContact","arrivalInstructions","specialNotes"]);
    else assert.equal(line.supplierContact,"CONTACT_ONLY");
    if(role!=="super_admin"){absent(line.serviceDetails as object,["internalCost","privateContact","nested","guideNotes","class"]);assert.doesNotMatch(JSON.stringify(result.commercial_snapshot??{}),/COMMERCIAL_PRIVATE|DESIGN_PII_REASON/)}
    if(role==="finance")assert.deepEqual(line.pricingPlanSnapshot,{id:"rate",name:"Synthetic rate",price:50.25,unitPrice:12.5625,currency:"USD",chargingMethod:"per_person"});
    if(role==="finance"||role==="operations")absent(result,["customer_snapshot","sent_snapshot","curated_journey_snapshot","accepted_name","accepted_email","acceptance_metadata","public_token","introduction","terms"]);
    else{assert.deepEqual(result.customer_snapshot,source.customer_snapshot);assert.deepEqual(result.sent_snapshot,source.sent_snapshot);assert.equal(result.public_token,"TOKEN_PRIVATE")}
    if(role==="super_admin"){assert.deepEqual(line.serviceDetails,source.allocation_snapshot&&snapshotLine().serviceDetails);assert.deepEqual(line.pricingPlanSnapshot,snapshotLine().pricingPlanSnapshot);assert.equal((result.commercial_snapshot as {rangeReview:{reason:string}}).rangeReview.reason,"DESIGN_PII_REASON")}
    assert.equal(JSON.stringify(source),before);
  });
}

test("independent financial capabilities do not imply contacts, margins, costs or revenue",()=>{
  const costOnly=serialized(proposalForStaff(proposal(),["finance.costs.view"]));
  absent(costOnly,["gross_profit","profit_margin","total_selling_price","public_token"]);
  const costLine=(costOnly.allocation_snapshot as Record<string,Json>[])[0];absent(costLine,["supplierContact","arrivalInstructions","specialNotes","sellingPrice","paymentStatus"]);
  const costCommercial=costOnly.commercial_snapshot as {summary:object;context:{config:object}};absent(costCommercial,["rangeReview"]);absent(costCommercial.summary,["totalSellingPrice","manualSellingFloor","grossProfit","profitMargin"]);absent(costCommercial.context.config,["targetProfitMarginPercent"]);
  const marginOnly=serialized(proposalForStaff(proposal(),["finance.margin.view"]));absent(marginOnly,["total_supplier_cost","total_selling_price"]);
  const commercial=marginOnly.commercial_snapshot as {summary:object;context?:Json};absent(commercial.summary,["internalCost","totalSupplierCost","totalSellingPrice","breakdown"]);absent(commercial,["context","rangeReview"]);
  const none=serialized(allocationForStaff(allocation(),[]));absent(none,["supplier_cost","selling_price","supplier_contact","pricing_plan_snapshot","invoice_status","payment_status"]);
});

test("malformed and inherited nested values fail closed; receipt result remains an explicit allowlist",()=>{
  for(const value of [null,[],"OPAQUE_PRIVATE",3,true])assert.equal(allocationSnapshotForStaff(value,defaultRolePermissions.finance),null);
  const bad={...snapshotLine(),serviceDetails:Object.assign(Object.create({rooms:999}),{participants:2,fromLabel:{privateContact:"PRIVATE"}}),pricingPlanSnapshot:{price:{nested:"PRIVATE"},currency:"USD"}};
  const safe=allocationSnapshotForStaff(bad as Json,defaultRolePermissions.finance) as Record<string,Json>;
  assert.deepEqual(safe.serviceDetails,{participants:2});assert.deepEqual(safe.pricingPlanSnapshot,{currency:"USD"});
  const receipt=serialized(fulfilmentResultForStaff({enquiryId:"e",allocationId:"a",status:"fulfilled",idempotent:true,supplierCost:50,privateContact:"PRIVATE",snapshot:{secret:"PRIVATE"}}));
  assert.deepEqual(receipt,{enquiryId:"e",allocationId:"a",status:"fulfilled",idempotent:true});
});

const workspace=readFileSync(new URL("../features/admin/journey-lifecycle-workspace.tsx",import.meta.url),"utf8");
const compile=(source:string)=>ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
test("actual frontend row conversion handles omitted money without NaN or invented zero",()=>{
  const code=workspace.slice(workspace.indexOf("const rowDraft="),workspace.indexOf("const jsonArray="));
  const convert=new Function(compile(code)+";return rowDraft;")() as (row:unknown)=>Record<string,unknown>;
  for(const role of ["journey_designer","finance","operations","super_admin"] as StaffRole[]){
    const result=convert(serialized(allocationForStaff(allocation(),defaultRolePermissions[role])));
    assert.equal(result.supplierCost,role==="finance"||role==="super_admin"?50.25:null);
    assert.equal(result.sellingPrice,role==="operations"?null:80.25);
    assert(!Object.values(result).some(v=>typeof v==="number"&&Number.isNaN(v)));
  }
});
test("actual status renderer and money formatter tolerate omitted fields",()=>{
  const external=createRequire(import.meta.url),code=workspace.slice(workspace.indexOf("function Status("));
  const Status=new Function("require","exports","CheckCircle2",compile(code)+";return Status;")(external,{},()=>null);
  const html=renderToStaticMarkup(createElement(Status,{label:"Invoice",value:undefined}));assert.match(html,/Not available/);
  const moneyCode=workspace.split("\n").find(line=>line.startsWith("const proposalMoney="))!;
  let called=false;const label=new Function("money",compile(moneyCode)+";return proposalMoney;")(()=>{called=true;return "formatted"}) as (p:object)=>string;
  assert.equal(label({}),"Not available");assert.equal(called,false);assert.equal(label({total_selling_price:0,currency:"USD"}),"formatted");
  assert.match(workspace,/if\(!latest\?\.public_token\)return/);assert.match(workspace,/secureAccessPanel=latest\?\.sent_at&&latest.public_token/);assert.match(workspace,/disabled=\{!customerSnapshot\} onClick=\{\(\)=>void exportProposalPdf/);
});
