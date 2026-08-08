"use client";

import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {Building2,CarFront,CheckCircle2,ExternalLink,FileCheck2,FileText,MapPin,Save,UserRoundCheck} from "lucide-react";
import {Button} from "@/components/ui/button";
import {createClient} from "@/lib/supabase/client";
import {allocationFinancialSummary} from "@/lib/admin/allocation-financials";
import {destinationAllocationKey,experienceAllocationKey,hasOwnPreferenceSnapshot,journeyAllocationScopes,vehicleAllocationKey} from "@/lib/admin/journey-allocations";
import {guidePreferenceLabel,stayPreferenceLabel} from "@/lib/journey/journey-preferences";
import {journeyLegKey,travelPreferenceLabel} from "@/lib/journey/travel-preferences";
import type {JourneyQuotationHandoff} from "@/lib/journey/quotation-handoff";
import type {Database,Json} from "@/lib/database.types";

type Enquiry=Database["public"]["Tables"]["enquiries"]["Row"];
type Account=Database["public"]["Tables"]["journey_accounts"]["Row"];
type Allocation=Database["public"]["Tables"]["journey_supplier_allocations"]["Row"];
type Proposal=Database["public"]["Tables"]["journey_proposals"]["Row"];
type Settlement=Database["public"]["Tables"]["journey_settlements"]["Row"];
type Named={id:string;name:string};
type SupplierOption={id:string;name:string;status:string;active:boolean;nationwide:boolean;destinationIds:string[]};
type SupplierDirectory={accommodations:SupplierOption[];guides:SupplierOption[];vehicles:SupplierOption[]};
type Draft={
  type:Allocation["allocation_type"];destinationId:string|null;fromDestinationId:string|null;toDestinationId:string|null;resourceId:string;
  providerName:string;supplierContact:string;supplierCost:number|null;sellingPrice:number|null;currency:string;
  confirmationStatus:Allocation["confirmation_status"];invoiceStatus:Allocation["invoice_status"];paymentStatus:Allocation["payment_status"];
  arrivalInstructions:string;specialNotes:string;
};
type Props={enquiry:Enquiry;handoff:JourneyQuotationHandoff|null;destinations:Named[];experiences:Named[];experienceDestinations:Record<string,string[]>;legacySelections:string[];account:Account|null};
const emptySuppliers:SupplierDirectory={accommodations:[],guides:[],vehicles:[]};
const money=(value:number,currency:string)=>`${currency} ${value.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const emptyDraft=(type:Draft["type"],destinationId:string|null=null,fromDestinationId:string|null=null,toDestinationId:string|null=null):Draft=>({type,destinationId,fromDestinationId,toDestinationId,resourceId:"",providerName:"",supplierContact:"",supplierCost:null,sellingPrice:null,currency:"USD",confirmationStatus:"pending",invoiceStatus:"not_requested",paymentStatus:"pending",arrivalInstructions:"",specialNotes:""});
const rowKey=(row:Allocation)=>row.allocation_type==="vehicle"&&row.from_destination_id&&row.to_destination_id?vehicleAllocationKey(row.from_destination_id,row.to_destination_id):row.allocation_type==="experience"&&row.experience_id?experienceAllocationKey(row.experience_id):row.destination_id?destinationAllocationKey(row.allocation_type as "accommodation"|"guide",row.destination_id):"";
const rowDraft=(row:Allocation):Draft=>({
  type:row.allocation_type,destinationId:row.destination_id,fromDestinationId:row.from_destination_id,toDestinationId:row.to_destination_id,
  resourceId:row.accommodation_id??row.guide_id??row.vehicle_id??row.experience_id??"",providerName:row.provider_name??"",supplierContact:row.supplier_contact??"",
  supplierCost:row.supplier_cost===null?null:Number(row.supplier_cost),sellingPrice:row.selling_price===null?null:Number(row.selling_price),currency:row.currency,
  confirmationStatus:row.confirmation_status,invoiceStatus:row.invoice_status,paymentStatus:row.payment_status,
  arrivalInstructions:row.arrival_instructions??"",specialNotes:row.special_notes??""
});
const jsonArray=<T,>(value:Json):T[]=>Array.isArray(value)?value as T[]:[];

export function JourneyLifecycleWorkspace({enquiry,handoff,destinations,experiences,experienceDestinations,legacySelections,account:initialAccount}:Props){
  const [suppliers,setSuppliers]=useState<SupplierDirectory>(emptySuppliers);
  const [allocations,setAllocations]=useState<Allocation[]>([]);
  const [drafts,setDrafts]=useState<Record<string,Draft>>({});
  const [proposals,setProposals]=useState<Proposal[]>([]);
  const [account,setAccount]=useState<Account|null>(initialAccount);
  const [settlements,setSettlements]=useState<Settlement[]>([]);
  const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState("");
  const [proposalOpen,setProposalOpen]=useState(false);
  const destinationIds=useMemo(()=>destinations.map(item=>item.id),[destinations]);
  const experienceScopes=useMemo(()=>experiences.flatMap(experience=>{
    const destinationId=destinationIds.find(id=>experienceDestinations[experience.id]?.includes(id));
    return destinationId?[{experienceId:experience.id,destinationId}]:[];
  }),[destinationIds,experienceDestinations,experiences]);
  const scopes=useMemo(()=>journeyAllocationScopes(destinationIds,experienceScopes),[destinationIds,experienceScopes]);
  const initialiseDrafts=(rows:Allocation[],directory:SupplierDirectory=suppliers)=>{
    const next=Object.fromEntries(scopes.map(scope=>[scope.key,{...emptyDraft(scope.type,scope.destinationId,scope.fromDestinationId,scope.toDestinationId),resourceId:scope.type==="experience"?scope.key.slice("experience:".length):""}]));
    for(const row of rows){const key=rowKey(row);if(key)next[key]=rowDraft(row)}
    if(!rows.length){
      const legacyStayIds=new Set(jsonArray<string>(enquiry.selected_stays));
      for(const destination of destinations){
        const stay=directory.accommodations.find(item=>legacyStayIds.has(item.id)&&item.destinationIds.includes(destination.id));
        if(stay)next[destinationAllocationKey("accommodation",destination.id)].resourceId=stay.id;
        if(enquiry.selected_guide)next[destinationAllocationKey("guide",destination.id)].resourceId=enquiry.selected_guide;
      }
      if(enquiry.selected_vehicle){for(const scope of scopes.filter(item=>item.type==="vehicle"))next[scope.key].resourceId=enquiry.selected_vehicle}
    }
    setDrafts(next);
  };
  const load=async()=>{
    const database=createClient();
    const {data:{session}}=await database.auth.getSession();
    if(!session)return;
    const [allocationResult,accommodationOptions,guideOptions,vehicleOptions,guideLinks,vehicleLinks,proposalResult,accountResult]=await Promise.all([
      database.from("journey_supplier_allocations").select("*").eq("enquiry_id",enquiry.id).order("created_at"),
      database.from("accommodations").select("id,name,destination_id,status,active,is_sample").neq("status","archived").eq("is_sample",false).order("name"),
      database.from("guides").select("id,name,status,active,nationwide,is_sample").neq("status","archived").eq("is_sample",false).order("name"),
      database.from("vehicles").select("id,listing_title,status,active,nationwide,is_sample").neq("status","archived").eq("is_sample",false).order("listing_title"),
      database.from("guide_destinations").select("guide_id,destination_id"),database.from("vehicle_destinations").select("vehicle_id,destination_id"),
      database.from("journey_proposals").select("*").eq("enquiry_id",enquiry.id).order("version",{ascending:false}),
      database.from("journey_accounts").select("*").eq("enquiry_id",enquiry.id).maybeSingle()
    ]);
    const rows=(allocationResult.data??[]) as Allocation[];setAllocations(rows);
    const guideDestinationIds=(guideId:string)=>(guideLinks.data??[]).filter(item=>item.guide_id===guideId).map(item=>item.destination_id);
    const vehicleDestinationIds=(vehicleId:string)=>(vehicleLinks.data??[]).filter(item=>item.vehicle_id===vehicleId).map(item=>item.destination_id);
    const directory:SupplierDirectory={
      accommodations:(accommodationOptions.data??[]).map(item=>({id:item.id,name:item.name,status:item.status,active:item.active,nationwide:false,destinationIds:item.destination_id?[item.destination_id]:[]})),
      guides:(guideOptions.data??[]).map(item=>({id:item.id,name:item.name,status:item.status,active:item.active,nationwide:item.nationwide,destinationIds:guideDestinationIds(item.id)})),
      vehicles:(vehicleOptions.data??[]).map(item=>({id:item.id,name:item.listing_title,status:item.status,active:item.active,nationwide:item.nationwide,destinationIds:vehicleDestinationIds(item.id)}))
    };setSuppliers(directory);initialiseDrafts(rows,directory);
    setProposals((proposalResult.data??[]) as Proposal[]);const freshAccount=accountResult.data??null;setAccount(freshAccount);
    if(freshAccount){const {data}=await database.from("journey_settlements").select("*").eq("account_id",freshAccount.id);setSettlements((data??[]) as Settlement[])}else setSettlements([]);
  };
  useEffect(()=>{const timer=window.setTimeout(()=>void load(),0);return()=>window.clearTimeout(timer)},[enquiry.id,initialAccount?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const update=(key:string,changes:Partial<Draft>)=>setDrafts(current=>({...current,[key]:{...current[key],...changes}}));
  const populated=useMemo(()=>scopes.flatMap(scope=>{const draft=drafts[scope.key];if(!draft)return[];return draft.type==="experience"?(draft.providerName.trim()?[draft]:[]):draft.resourceId?[draft]:[]}),[drafts,scopes]);
  const financial=allocationFinancialSummary(populated.map(item=>({supplier_cost:item.supplierCost,selling_price:item.sellingPrice,confirmation_status:item.confirmationStatus})));
  const save=async()=>{
    setSaving(true);setMessage("");
    const {data:{session}}=await createClient().auth.getSession();
    const response=await fetch("/api/admin/journey-allocations",{method:"POST",headers:{"content-type":"application/json",authorization:`Bearer ${session?.access_token??""}`},body:JSON.stringify({enquiryId:enquiry.id,allocations:populated.map(draft=>({
      allocationType:draft.type,destinationId:draft.destinationId,fromDestinationId:draft.fromDestinationId,toDestinationId:draft.toDestinationId,
      accommodationId:draft.type==="accommodation"?draft.resourceId:null,guideId:draft.type==="guide"?draft.resourceId:null,vehicleId:draft.type==="vehicle"?draft.resourceId:null,experienceId:draft.type==="experience"?draft.resourceId:null,
      providerName:draft.providerName||null,supplierContact:draft.supplierContact||null,supplierCost:draft.supplierCost,sellingPrice:draft.sellingPrice,currency:draft.currency,
      confirmationStatus:draft.confirmationStatus,invoiceStatus:draft.invoiceStatus,paymentStatus:draft.paymentStatus==="paid"?"pending":draft.paymentStatus,
      arrivalInstructions:draft.arrivalInstructions||null,specialNotes:draft.specialNotes||null
    }))})});
    const result=await response.json() as {allocations?:Allocation[];error?:string};setSaving(false);
    if(!response.ok||!result.allocations){setMessage(result.error??"Supplier allocations could not be saved.");return}
    setAllocations(result.allocations);initialiseDrafts(result.allocations);setMessage("Allocations, commercial details and operations notes saved. Traveller preferences remain unchanged.");await load();
  };
  const proposalAction=async(action:"generate"|"sent"|"approved",proposalId?:string,form?:FormData)=>{
    setSaving(true);setMessage("");const {data:{session}}=await createClient().auth.getSession();
    const body=action==="generate"?{action,enquiryId:enquiry.id,introduction:String(form?.get("introduction")||""),terms:String(form?.get("terms")||""),validUntil:String(form?.get("validUntil")||"")||undefined}:{action,proposalId};
    const response=await fetch("/api/admin/journey-proposals",{method:"POST",headers:{"content-type":"application/json",authorization:`Bearer ${session?.access_token??""}`},body:JSON.stringify(body)});
    const result=await response.json() as {proposal?:Proposal;error?:string};setSaving(false);
    if(!response.ok||!result.proposal){setMessage(result.error??"The proposal could not be updated.");return}
    setProposalOpen(false);setMessage(action==="generate"?"A new proposal version is ready.":action==="sent"?"Proposal marked as sent.":"Traveller approval recorded.");await load();
  };
  const latest=proposals.find(item=>!["superseded","cancelled"].includes(item.status))??proposals[0]??null;
  const supplierOutstanding=account?settlements.reduce((total,row)=>total+Math.max(0,row.amount_due-row.amount_paid-row.waived_amount),0):financial.totalSupplierCost;
  const hasDestinationPreferences=hasOwnPreferenceSnapshot(enquiry.trip_state,"destinationPreferences");
  const hasTravelPreferences=hasOwnPreferenceSnapshot(enquiry.trip_state,"travelPreferencesByLeg");
  return <>
    <section className="rounded-3xl border border-stone/15 bg-white p-6 md:p-8"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="font-serif text-2xl">Traveller preferences & supplier allocation</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-stone">Traveller intent stays read-only. Roam Ceylon&apos;s supplier, commercial and operational decisions are stored separately.</p></div><Button onClick={()=>void save()} disabled={saving||!destinations.length}><Save className="size-4"/>{saving?"Saving…":"Save allocations"}</Button></div>
      {message&&<p className={`mt-5 rounded-xl p-4 text-sm ${message.includes("saved")||message.includes("ready")||message.includes("recorded")||message.includes("sent")?"bg-forest/10 text-forest":"bg-red-50 text-red-800"}`}>{message}</p>}
      {legacySelections.length?<div className="mt-6 rounded-2xl border border-gold/25 bg-gold/5 p-5"><p className="text-xs font-bold uppercase tracking-widest text-gold">Existing direct selections · preserved</p><p className="mt-2 text-sm leading-6 text-slate/70">{legacySelections.join(" · ")}. These historical choices remain intact and are not overwritten by the new allocation model.</p></div>:null}
      <div className="mt-7 grid gap-6">{destinations.length?destinations.map((destination,index)=>{
        const next=destinations[index+1]??null;const preference=handoff?.state.destinationPreferences?.[destination.id];const leg=next?handoff?.state.travelPreferencesByLeg?.[journeyLegKey(destination.id,next.id)]:null;
        const destinationExperiences=experiences.filter(item=>experienceScopes.some(scope=>scope.experienceId===item.id&&scope.destinationId===destination.id));
        return <DestinationWorkspace key={destination.id} index={index} destination={destination} next={next} experiences={destinationExperiences}
          stayPreference={hasDestinationPreferences&&preference?stayPreferenceLabel(preference.stayPreference):null} guidePreference={hasDestinationPreferences&&preference?guidePreferenceLabel(preference.guidePreference):null}
          notes={hasDestinationPreferences?preference?.notes??"":null} travelPreference={hasTravelPreferences&&leg?travelPreferenceLabel(leg.travelPreference):null}
          suppliers={suppliers} drafts={drafts} update={update}/>;
      }):<p className="rounded-2xl border border-dashed border-stone/25 p-8 text-center text-sm text-stone">No destinations were selected.</p>}</div>
    </section>
    <section className="rounded-3xl bg-forest p-6 text-ivory md:p-8"><p className="eyebrow text-gold-light">Commercial position</p><h2 className="mt-2 font-serif text-3xl">Financial summary</h2><div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><FinancialMetric label="Supplier cost" value={money(financial.totalSupplierCost,populated[0]?.currency??"USD")}/><FinancialMetric label="Selling price" value={money(financial.totalSellingPrice,populated[0]?.currency??"USD")}/><FinancialMetric label="Estimated gross profit" value={money(financial.grossProfit,populated[0]?.currency??"USD")}/><FinancialMetric label="Journey margin" value={`${financial.profitMargin.toFixed(2)}%`}/><FinancialMetric label="Deposit received" value={money(account?.amount_received??0,account?.currency??populated[0]?.currency??"USD")}/><FinancialMetric label="Traveller outstanding" value={money(Math.max(0,financial.totalSellingPrice-(account?.amount_received??0)),account?.currency??populated[0]?.currency??"USD")}/><FinancialMetric label="Supplier payments outstanding" value={money(supplierOutstanding,account?.currency??populated[0]?.currency??"USD")}/><FinancialMetric label="Commercial readiness" value={financial.incompleteLines?`${financial.incompleteLines} incomplete`:populated.length?"Ready":"Not allocated"}/></div>{financial.incompleteLines?<p className="mt-5 text-sm text-gold-light">Complete supplier cost and selling price before generating a proposal or recording a deposit.</p>:null}</section>
    <ProposalWorkspace latest={latest} enquiry={enquiry} saving={saving} open={proposalOpen} setOpen={setProposalOpen} action={proposalAction}/>
    <OperationsWorkspace allocations={allocations} suppliers={suppliers} experiences={experiences} destinations={destinations}/>
  </>;
}

function DestinationWorkspace({index,destination,next,experiences,stayPreference,guidePreference,notes,travelPreference,suppliers,drafts,update}:{index:number;destination:Named;next:Named|null;experiences:Named[];stayPreference:string|null;guidePreference:string|null;notes:string|null;travelPreference:string|null;suppliers:SupplierDirectory;drafts:Record<string,Draft>;update:(key:string,changes:Partial<Draft>)=>void}){
  const accommodationKey=destinationAllocationKey("accommodation",destination.id),guideKey=destinationAllocationKey("guide",destination.id),vehicleKey=next?vehicleAllocationKey(destination.id,next.id):null;
  return <article className="overflow-hidden rounded-3xl border border-stone/15 bg-sand-light/55"><header className="flex items-center gap-4 bg-forest px-6 py-5 text-ivory"><span className="grid size-9 place-items-center rounded-full bg-gold font-serif text-lg text-forest">{index+1}</span><div><p className="text-[.62rem] font-bold uppercase tracking-[.22em] text-gold">Destination</p><h3 className="font-serif text-2xl">{destination.name}</h3></div></header><div className="grid lg:grid-cols-[.8fr_1.2fr]"><div className="border-b border-stone/15 p-6 lg:border-b-0 lg:border-r"><p className="text-xs font-bold uppercase tracking-widest text-gold">Traveller preferences</p><div className="mt-5 grid gap-4"><PreferenceLine icon={Building2} label="Stay" value={stayPreference??"Not captured — legacy enquiry"}/><PreferenceLine icon={UserRoundCheck} label="Guide" value={guidePreference??"Not captured — legacy enquiry"}/><PreferenceLine icon={MapPin} label="Experiences" value={experiences.map(item=>item.name).join(" · ")||"None selected"}/><PreferenceLine icon={FileText} label="Notes" value={notes===null?"Not captured — legacy enquiry":notes||"No destination notes"}/>{next?<PreferenceLine icon={CarFront} label={`Travel to ${next.name}`} value={travelPreference??"Not captured — legacy enquiry"}/>:null}</div></div><div className="grid gap-5 bg-white p-6"><p className="text-xs font-bold uppercase tracking-widest text-forest">Internal · Roam Ceylon allocation</p><AllocationEditor label="Accommodation partner" icon={Building2} draft={drafts[accommodationKey]??emptyDraft("accommodation",destination.id)} options={suppliers.accommodations} matches={option=>option.destinationIds.includes(destination.id)} matchedLabel={`Partners in ${destination.name}`} onChange={changes=>update(accommodationKey,changes)} addHref="/admin/resources/stays"/>
      <AllocationEditor label="Guide partner" icon={UserRoundCheck} draft={drafts[guideKey]??emptyDraft("guide",destination.id)} options={suppliers.guides} matches={option=>option.nationwide||option.destinationIds.includes(destination.id)} matchedLabel={`Guides covering ${destination.name}`} onChange={changes=>update(guideKey,changes)} addHref="/admin/resources/guides"/>
      {next&&vehicleKey?<AllocationEditor label={`Transport · ${destination.name} to ${next.name}`} icon={CarFront} draft={drafts[vehicleKey]??emptyDraft("vehicle",null,destination.id,next.id)} options={suppliers.vehicles} matches={option=>option.nationwide||(option.destinationIds.includes(destination.id)&&option.destinationIds.includes(next.id))} matchedLabel="Suitable route coverage" onChange={changes=>update(vehicleKey,changes)} addHref="/admin/resources/vehicles" showProvider/>:null}
      {experiences.length?<div className="border-t border-stone/15 pt-5"><p className="text-xs font-bold uppercase tracking-widest text-gold">Experience providers</p><div className="mt-4 grid gap-4">{experiences.map(experience=>{const key=experienceAllocationKey(experience.id);const draft=drafts[key]??{...emptyDraft("experience",destination.id),resourceId:experience.id};return <ExperienceAllocationEditor key={experience.id} experience={experience} draft={draft} onChange={changes=>update(key,{resourceId:experience.id,...changes})}/>})}</div></div>:null}</div></div></article>;
}

function AllocationEditor({label,icon:Icon,draft,options,matches,matchedLabel,onChange,addHref,showProvider=false}:{label:string;icon:typeof Building2;draft:Draft;options:SupplierOption[];matches:(option:SupplierOption)=>boolean;matchedLabel:string;onChange:(changes:Partial<Draft>)=>void;addHref:string;showProvider?:boolean}){
  const matched=options.filter(matches),others=options.filter(option=>!matches(option));const optionLabel=(option:SupplierOption)=>`${option.name}${option.status==="published"&&option.active?"":` · ${option.active?option.status:"inactive"}`}`;
  return <div className="rounded-2xl border border-stone/15 p-4"><label className="grid gap-2 text-sm font-semibold"><span className="flex items-center gap-2"><Icon className="size-4 text-gold"/>{label}</span><select value={draft.resourceId} onChange={event=>onChange({resourceId:event.target.value})} className="rounded-xl border border-stone/25 bg-white px-4 py-3 font-normal"><option value="">Not allocated yet</option>{matched.length?<optgroup label={matchedLabel}>{matched.map(option=><option key={option.id} value={option.id}>{optionLabel(option)}</option>)}</optgroup>:null}{others.length?<optgroup label="Other supplier records">{others.map(option=><option key={option.id} value={option.id}>{optionLabel(option)}</option>)}</optgroup>:null}</select></label><Link href={addHref} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-gold">Add new partner using existing Admin flow<ExternalLink className="size-3"/></Link>{draft.resourceId?<CommercialOperationsFields draft={draft} onChange={onChange} showProvider={showProvider}/>:null}</div>;
}

function ExperienceAllocationEditor({experience,draft,onChange}:{experience:Named;draft:Draft;onChange:(changes:Partial<Draft>)=>void}){return <div className="rounded-2xl border border-stone/15 p-4"><strong className="font-serif text-lg">{experience.name}</strong><label className="mt-3 grid gap-2 text-xs font-bold uppercase tracking-widest text-stone">Experience provider<input value={draft.providerName} onChange={event=>onChange({providerName:event.target.value})} placeholder="Named operator or supplier" className="rounded-xl border border-stone/25 px-4 py-3 text-sm font-normal normal-case tracking-normal"/></label>{draft.providerName?<CommercialOperationsFields draft={draft} onChange={onChange}/>:null}</div>}

function CommercialOperationsFields({draft,onChange,showProvider=false}:{draft:Draft;onChange:(changes:Partial<Draft>)=>void;showProvider?:boolean}){return <details className="mt-4 rounded-xl bg-sand-light p-4"><summary className="cursor-pointer text-xs font-bold uppercase tracking-widest text-forest">Commercial & operations details</summary><div className="mt-4 grid gap-3 md:grid-cols-2">{showProvider?<Field label="Transport partner"><input value={draft.providerName} onChange={event=>onChange({providerName:event.target.value})} placeholder="Optional fleet / operator name"/></Field>:null}<Field label="Supplier contact"><input value={draft.supplierContact} onChange={event=>onChange({supplierContact:event.target.value})} placeholder="Phone, email or contact person"/></Field><Field label="Supplier cost"><input type="number" min="0" step=".01" value={draft.supplierCost??""} onChange={event=>onChange({supplierCost:event.target.value===""?null:Number(event.target.value)})}/></Field><Field label="Selling price"><input type="number" min="0" step=".01" value={draft.sellingPrice??""} onChange={event=>onChange({sellingPrice:event.target.value===""?null:Number(event.target.value)})}/></Field><Field label="Currency"><input value={draft.currency} maxLength={3} onChange={event=>onChange({currency:event.target.value.toUpperCase()})}/></Field><Field label="Confirmation"><select value={draft.confirmationStatus} onChange={event=>onChange({confirmationStatus:event.target.value as Draft["confirmationStatus"]})}><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="cancelled">Cancelled</option></select></Field><Field label="Invoice"><select value={draft.invoiceStatus} onChange={event=>onChange({invoiceStatus:event.target.value as Draft["invoiceStatus"]})}><option value="not_requested">Not requested</option><option value="requested">Requested</option><option value="received">Invoice received</option><option value="not_required">Not required</option></select></Field><Field label="Payment"><select value={draft.paymentStatus} disabled={draft.paymentStatus==="paid"} onChange={event=>onChange({paymentStatus:event.target.value as Draft["paymentStatus"]})}><option value="pending">Pending</option><option value="payment_due">Payment due</option>{draft.paymentStatus==="paid"?<option value="paid">Paid through Accounting</option>:null}<option value="cancelled">Cancelled</option></select></Field><Field label="Arrival instructions" wide><textarea rows={2} value={draft.arrivalInstructions} onChange={event=>onChange({arrivalInstructions:event.target.value})}/></Field><Field label="Special notes" wide><textarea rows={2} value={draft.specialNotes} onChange={event=>onChange({specialNotes:event.target.value})}/></Field></div></details>}

function ProposalWorkspace({latest,enquiry,saving,open,setOpen,action}:{latest:Proposal|null;enquiry:Enquiry;saving:boolean;open:boolean;setOpen:(value:boolean)=>void;action:(action:"generate"|"sent"|"approved",proposalId?:string,form?:FormData)=>Promise<void>}){
  const lines=latest?jsonArray<Record<string,Json>>(latest.allocation_snapshot):[];
  return <section className="rounded-3xl border border-stone/15 bg-white p-6 md:p-8">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="eyebrow mb-2">Curated for the traveller</p><h2 className="font-serif text-3xl">Journey proposal</h2><p className="mt-2 text-sm text-stone">The proposal is a versioned snapshot of allocated suppliers. Later allocation changes never silently rewrite a proposal already sent.</p></div><Button onClick={()=>setOpen(!open)} disabled={saving}><FileCheck2 className="size-4"/>{latest?"Create new version":"Generate proposal"}</Button></div>
    {open?<form className="mt-6 grid gap-4 rounded-2xl bg-sand-light p-5" onSubmit={event=>{event.preventDefault();void action("generate",undefined,new FormData(event.currentTarget))}}><Field label="Proposal introduction" wide><textarea name="introduction" rows={4} defaultValue={`A private Sri Lankan journey, thoughtfully shaped for ${enquiry.name} by Roam Ceylon Atelier.`}/></Field><Field label="Terms and booking notes" wide><textarea name="terms" rows={4} placeholder="Availability, payment schedule, cancellation terms and important inclusions…"/></Field><Field label="Valid until"><input name="validUntil" type="date"/></Field><div><Button type="submit" disabled={saving}>{saving?"Generating…":"Generate proposal version"}</Button></div></form>:null}
    {latest?<div className="mt-7 overflow-hidden rounded-3xl border border-gold/25"><div className="bg-forest p-6 text-ivory"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-[.62rem] font-bold uppercase tracking-[.22em] text-gold-light">{latest.proposal_reference}</p><h3 className="mt-2 font-serif text-3xl">Your curated Roam Ceylon journey</h3><p className="mt-3 max-w-2xl text-sm leading-6 text-ivory/70">{latest.introduction||"A considered island journey, matched with carefully selected local partners."}</p></div><span className="rounded-full bg-white/10 px-3 py-2 text-xs font-bold uppercase">{latest.status}</span></div></div><div className="p-6"><div className="grid gap-3">{lines.map((line,index)=><div key={String(line.allocationId??index)} className="flex flex-wrap items-start justify-between gap-3 border-b border-stone/15 pb-3 last:border-0"><div><strong className="block">{String(line.providerName??line.resourceName??"Roam Ceylon partner")}</strong><span className="text-xs capitalize text-stone">{String(line.type??"")} · {String(line.resourceName??"")}{line.fromDestinationName?` · ${String(line.fromDestinationName)} to ${String(line.toDestinationName)}`:line.destinationName?` · ${String(line.destinationName)}`:""}</span></div><strong>{latest.currency} {Number(line.sellingPrice??0).toFixed(2)}</strong></div>)}</div><div className="mt-6 flex items-end justify-between border-t border-stone/20 pt-5"><span className="text-sm text-stone">Total journey proposal</span><strong className="font-serif text-3xl">{money(latest.total_selling_price,latest.currency)}</strong></div>{latest.terms?<p className="mt-5 whitespace-pre-wrap text-xs leading-6 text-stone">{latest.terms}</p>:null}<div className="mt-6 flex flex-wrap gap-3">{latest.status==="ready"?<Button onClick={()=>void action("sent",latest.id)} disabled={saving}>Mark proposal sent</Button>:null}{latest.status==="sent"?<Button variant="outline" onClick={()=>void action("approved",latest.id)} disabled={saving}>Record traveller approval</Button>:null}</div></div></div>:<div className="mt-6 rounded-2xl border border-dashed border-stone/25 p-8 text-center text-sm text-stone">Save complete supplier allocations, then generate the first proposal.</div>}
  </section>;
}

function OperationsWorkspace({allocations,suppliers,experiences,destinations}:{allocations:Allocation[];suppliers:SupplierDirectory;experiences:Named[];destinations:Named[]}){
  const name=(row:Allocation)=>row.provider_name||suppliers.accommodations.find(item=>item.id===row.accommodation_id)?.name||suppliers.guides.find(item=>item.id===row.guide_id)?.name||suppliers.vehicles.find(item=>item.id===row.vehicle_id)?.name||experiences.find(item=>item.id===row.experience_id)?.name||"Supplier";
  const place=(id:string|null)=>destinations.find(item=>item.id===id)?.name??"";
  return <section className="rounded-3xl border border-stone/15 bg-white p-6 md:p-8"><p className="eyebrow mb-2">Delivery desk</p><h2 className="font-serif text-3xl">Operations</h2><p className="mt-2 text-sm text-stone">This view is built only from saved supplier allocations—not traveller preference fields.</p><div className="mt-6 grid gap-4">{allocations.filter(row=>row.confirmation_status!=="cancelled").length?allocations.filter(row=>row.confirmation_status!=="cancelled").map(row=><article key={row.id} className="grid gap-4 rounded-2xl bg-sand-light p-5 lg:grid-cols-[1.2fr_.8fr_1fr]"><div><span className="text-[.62rem] font-bold uppercase tracking-widest text-gold">{row.allocation_type}</span><strong className="mt-1 block font-serif text-xl">{name(row)}</strong><p className="mt-1 text-xs text-stone">{row.allocation_type==="vehicle"?`${place(row.from_destination_id)} → ${place(row.to_destination_id)}`:place(row.destination_id)}</p>{row.supplier_contact?<p className="mt-3 text-xs font-semibold">{row.supplier_contact}</p>:null}</div><div className="grid content-start gap-2 text-xs"><Status label="Confirmation" value={row.confirmation_status}/><Status label="Invoice" value={row.invoice_status}/><Status label="Payment" value={row.payment_status}/></div><div className="text-xs leading-6 text-stone"><strong className="block text-slate">Arrival instructions</strong>{row.arrival_instructions||"Not recorded"}<strong className="mt-2 block text-slate">Special notes</strong>{row.special_notes||"None"}</div></article>):<p className="rounded-2xl border border-dashed border-stone/25 p-8 text-center text-sm text-stone">No saved supplier allocations are available for Operations yet.</p>}</div></section>;
}

function FinancialMetric({label,value}:{label:string;value:string}){return <div className="rounded-2xl bg-white/8 p-4"><span className="text-xs text-ivory/55">{label}</span><strong className="mt-2 block font-serif text-xl">{value}</strong></div>}
function PreferenceLine({icon:Icon,label,value}:{icon:typeof Building2;label:string;value:string}){return <div className="grid grid-cols-[1.5rem_1fr] gap-3"><Icon className="mt-0.5 size-4 text-gold"/><div><span className="block text-[.62rem] font-bold uppercase tracking-widest text-stone">{label}</span><strong className="mt-1 block text-sm font-semibold leading-6 text-slate">{value}</strong></div></div>}
function Field({label,children,wide=false}:{label:string;children:React.ReactNode;wide?:boolean}){return <label className={`grid gap-2 text-xs font-bold uppercase tracking-widest text-stone ${wide?"md:col-span-2":""}`}>{label}<span className="[&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-stone/25 [&_input]:bg-white [&_input]:px-3 [&_input]:py-2.5 [&_input]:text-sm [&_input]:font-normal [&_input]:normal-case [&_input]:tracking-normal [&_select]:w-full [&_select]:rounded-xl [&_select]:border [&_select]:border-stone/25 [&_select]:bg-white [&_select]:px-3 [&_select]:py-2.5 [&_select]:text-sm [&_select]:font-normal [&_select]:normal-case [&_select]:tracking-normal [&_textarea]:w-full [&_textarea]:rounded-xl [&_textarea]:border [&_textarea]:border-stone/25 [&_textarea]:bg-white [&_textarea]:px-3 [&_textarea]:py-2.5 [&_textarea]:text-sm [&_textarea]:font-normal [&_textarea]:normal-case [&_textarea]:tracking-normal">{children}</span></label>}
function Status({label,value}:{label:string;value:string}){return <div className="flex items-center justify-between gap-3"><span className="text-stone">{label}</span><span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 font-bold capitalize"><CheckCircle2 className="size-3 text-gold"/>{value.replaceAll("_"," ")}</span></div>}
