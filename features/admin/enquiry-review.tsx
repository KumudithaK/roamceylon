"use client";

import {FormEvent,useEffect,useMemo,useState} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import {CalendarDays,CreditCard,FileText,FolderOpen,Handshake,History,Mail,MapPin,Phone,Users,WalletCards,X} from "lucide-react";
import {AdminShell} from "./admin-shell";
import {Button} from "@/components/ui/button";
import {createClient} from "@/lib/supabase/client";
import {enquiryWorkflow} from "@/lib/enquiries/enquiry-workflow";
import {parseJourneyHandoff} from "@/lib/journey/quotation-handoff";
import {pricingPlanKey} from "@/features/journey/journey-store";
import type {Database,EnquiryStatus,Json} from "@/lib/database.types";
import type {ParticipantCounts} from "@/lib/types";

type Enquiry=Database["public"]["Tables"]["enquiries"]["Row"];
type Account=Database["public"]["Tables"]["journey_accounts"]["Row"];
type Named={id:string;name:string};
type SelectionNames={themes:Named[];destinations:Named[];experiences:Named[];stays:Named[];vehicle:string|null;guide:string|null};
const accountStatusLabels:Record<Account["status"],string>={pending_deposit:"Pending Deposit",active:"Active",review_required:"Review Required",part_paid:"Part Paid",fully_paid:"Fully Paid",cancelled:"Cancelled",refund_pending:"Refund Pending",refunded:"Refunded",closed:"Closed"};
const ids=(value:Json)=>Array.isArray(value)?value.filter((item):item is string=>typeof item==="string"):[];
const participantMap=(value:Json):Record<string,ParticipantCounts>=>{
  if(!value||typeof value!=="object"||Array.isArray(value))return {};
  return Object.fromEntries(Object.entries(value).flatMap(([id,counts])=>{
    if(!counts||typeof counts!=="object"||Array.isArray(counts))return[];
    const data=counts as Record<string,Json|undefined>;
    return [[id,{adults:Number(data.adults)||0,children:Number(data.children)||0,infants:Number(data.infants)||0}]];
  }));
};
const emptyNames:SelectionNames={themes:[],destinations:[],experiences:[],stays:[],vehicle:null,guide:null};

export function EnquiryReview({id}:{id:string}){
  const router=useRouter();
  const [enquiry,setEnquiry]=useState<Enquiry|null>(null);
  const [account,setAccount]=useState<Account|null>(null);
  const [selectionNames,setSelectionNames]=useState<SelectionNames>(emptyNames);
  const [pricingPlanNames,setPricingPlanNames]=useState<Record<string,string>>({});
  const [notes,setNotes]=useState("");
  const [message,setMessage]=useState("");
  const [saving,setSaving]=useState(false);
  const [depositOpen,setDepositOpen]=useState(false);
  useEffect(()=>{void (async()=>{
    const database=createClient();
    const {data:{session}}=await database.auth.getSession();
    if(!session){router.replace("/admin/login");return}
    const {data:row,error}=await database.from("enquiries").select("*").eq("id",id).single();
    if(error||!row){setMessage("This enquiry could not be found.");return}
    setEnquiry(row);setNotes(row.internal_notes||"");
    const themeIds=ids(row.selected_themes);const destinationIds=ids(row.selected_destinations);const experienceIds=ids(row.selected_experiences);const stayIds=ids(row.selected_stays);
    const handoff=parseJourneyHandoff(row.trip_state);
    const selectedPlanIds=Object.values(handoff?.state.selectedPricingPlanIds??{});
    const [themes,destinations,experiences,stays,vehicle,guide,pricingPlans,accountResult]=await Promise.all([
      themeIds.length?database.from("themes").select("id,name").in("id",themeIds):Promise.resolve({data:[]}),
      destinationIds.length?database.from("destinations").select("id,name").in("id",destinationIds):Promise.resolve({data:[]}),
      experienceIds.length?database.from("experiences").select("id,name").in("id",experienceIds):Promise.resolve({data:[]}),
      stayIds.length?database.from("accommodations").select("id,name").in("id",stayIds):Promise.resolve({data:[]}),
      row.selected_vehicle?database.from("vehicles").select("listing_title").eq("id",row.selected_vehicle).maybeSingle():Promise.resolve({data:null}),
      row.selected_guide?database.from("guides").select("name").eq("id",row.selected_guide).maybeSingle():Promise.resolve({data:null}),
      selectedPlanIds.length?database.from("pricing_plans").select("id,name").in("id",selectedPlanIds):Promise.resolve({data:[]}),
      database.from("journey_accounts").select("*").eq("enquiry_id",id).maybeSingle()
    ]);
    const order=(values:Named[]|null,orderedIds:string[])=>orderedIds.map(value=>values?.find(item=>item.id===value)).filter((item):item is Named=>Boolean(item));
    setSelectionNames({
      themes:order(themes.data,themeIds),
      destinations:order(destinations.data,destinationIds),
      experiences:order(experiences.data,experienceIds),
      stays:order(stays.data,stayIds),
      vehicle:vehicle.data?.listing_title??null,
      guide:guide.data?.name??null
    });
    setPricingPlanNames(Object.fromEntries((pricingPlans.data??[]).map(plan=>[plan.id,plan.name])));
    setAccount(accountResult.data??null);
  })()},[id,router]);
  const handoff=useMemo(()=>enquiry?parseJourneyHandoff(enquiry.trip_state):null,[enquiry]);
  const quote=handoff?.quote??null;
  const save=async(status:EnquiryStatus|undefined=enquiry?.status)=>{
    if(!enquiry||!status)return;
    if(status==="deposit_paid"&&(!account||account.amount_received<=0)){setDepositOpen(true);return}
    setSaving(true);setMessage("");
    const database=createClient();
    const {error}=await database.from("enquiries").update({status,internal_notes:notes}).eq("id",id);
    setSaving(false);
    if(error){setMessage(error.message);return}
    setEnquiry({...enquiry,status,internal_notes:notes});
    const {data:nextAccount}=await database.from("journey_accounts").select("*").eq("enquiry_id",id).maybeSingle();
    setAccount(nextAccount??null);
    setMessage(status==="completed"?"Journey marked complete. Financial settlement remains independent.":"Enquiry updated.");
  };
  const activateAccounting=async(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();
    if(!enquiry)return;
    setSaving(true);setMessage("");
    const form=new FormData(event.currentTarget);
    const {data:{session}}=await createClient().auth.getSession();
    const response=await fetch("/api/admin/accounting/post",{method:"POST",headers:{"content-type":"application/json",authorization:`Bearer ${session?.access_token??""}`},body:JSON.stringify({
      enquiryId:id,
      depositAmount:Number(form.get("depositAmount")),
      paymentDate:String(form.get("paymentDate")),
      paymentMethod:String(form.get("paymentMethod")||""),
      reference:String(form.get("reference")||""),
      notes:String(form.get("notes")||"")
    })});
    const result=await response.json() as {account?:Account;error?:string};
    setSaving(false);
    if(!response.ok||!result.account){setMessage(result.error??"The deposit could not activate Accounting.");return}
    setAccount(result.account);setEnquiry({...enquiry,status:"deposit_paid"});setDepositOpen(false);
    setMessage("Deposit recorded and Accounting activated.");
  };
  if(!enquiry)return <AdminShell><div className="grid min-h-[60vh] place-items-center text-stone">{message||"Loading enquiry…"}</div></AdminShell>;
  const travellerCounts=handoff?.state.travellerCounts??{adults:enquiry.adults,children:enquiry.children,infants:0};
  const travellers=travellerCounts.adults+travellerCounts.children+travellerCounts.infants;
  const experienceParticipants=participantMap(enquiry.experience_participants);
  const grossCustomerPayments=account?account.amount_received+account.amount_refunded:0;
  const planName=(type:"accommodation"|"vehicle"|"guide"|"experience",entityId:string)=>{
    const planId=handoff?.state.selectedPricingPlanIds[pricingPlanKey(type,entityId)];
    return planId?pricingPlanNames[planId]??null:null;
  };
  return <AdminShell><div className="mx-auto max-w-7xl">
    <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow mb-3">Traveller enquiry · {enquiry.journey_reference}</p><h1 className="font-serif text-4xl md:text-5xl">{enquiry.name}</h1><p className="mt-2 text-sm text-stone">Received {new Date(enquiry.created_at).toLocaleString("en-GB")}</p></div><select value={enquiry.status} onChange={event=>void save(event.target.value as EnquiryStatus)} disabled={saving} className="rounded-full border border-stone/25 bg-white px-5 py-3 text-sm font-semibold">{enquiryWorkflow.map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></div>
    {message&&<p className="mt-5 rounded-xl bg-white p-4 text-sm">{message}</p>}
    <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_360px]"><div className="grid gap-6">
      <Section title="Journey at a glance"><div className="grid gap-4 sm:grid-cols-3"><Metric icon={Users} label="Travellers" value={`${travellers}`} detail={`${travellerCounts.adults} adults · ${travellerCounts.children} children · ${travellerCounts.infants} infants`}/><Metric icon={CalendarDays} label="Travel dates" value={enquiry.travel_start_date||"Flexible"} detail={enquiry.travel_end_date?`to ${enquiry.travel_end_date}`:"Departure not selected"}/><Metric icon={MapPin} label="Destinations" value={`${selectionNames.destinations.length}`} detail={selectionNames.destinations.map(item=>item.name).join(" · ")||"Not selected"}/></div></Section>
      <Section title="Selected journey"><Selection label="Themes" values={selectionNames.themes.map(item=>item.name)}/><Selection label="Destinations and route order" values={selectionNames.destinations.map((item,index)=>`${index+1}. ${item.name}`)}/><Selection label="Experiences" values={selectionNames.experiences.map(item=>{const counts=experienceParticipants[item.id];const count=counts?counts.adults+counts.children+counts.infants:0;const plan=planName("experience",item.id);return `${item.name}${count?` · ${count} participant${count===1?"":"s"}`:""}${plan?` · ${plan}`:""}`})}/><Selection label="Accommodation" values={selectionNames.stays.map(item=>`${item.name}${planName("accommodation",item.id)?` · ${planName("accommodation",item.id)}`:""}`)}/><Selection label="Transport" values={selectionNames.vehicle?[`${selectionNames.vehicle}${enquiry.selected_vehicle&&planName("vehicle",enquiry.selected_vehicle)?` · ${planName("vehicle",enquiry.selected_vehicle)}`:""}`]:[]}/><Selection label="Local guide" values={selectionNames.guide?[`${selectionNames.guide}${enquiry.selected_guide&&planName("guide",enquiry.selected_guide)?` · ${planName("guide",enquiry.selected_guide)}`:""}`]:[]}/></Section>
      <Section title="Traveller notes"><p className="whitespace-pre-wrap text-sm leading-7 text-slate/70">{enquiry.traveller_notes||enquiry.summary||"No additional notes were supplied."}</p></Section>
      <Section title="Customer package estimate">{quote?.status==="ready"?<div><div className="grid gap-4 sm:grid-cols-3"><Price label="Total package" value={`${quote.currency} ${quote.totalPackagePrice?.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`}/><Price label="Per person" value={`${quote.currency} ${quote.pricePerPerson?.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`}/><Price label="Daily estimate" value={`${quote.currency} ${quote.estimatedDailyCost?.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`}/></div>{quote.components?.length?<div className="mt-6 divide-y divide-stone/15">{quote.components.map(item=><div key={item.category} className="flex justify-between py-3 text-sm"><span>{item.label}</span><strong>{quote.currency} {item.amount.toFixed(2)}</strong></div>)}</div>:null}</div>:<p className="text-sm text-stone">A personal quotation is required. No automated estimate was stored with this enquiry.</p>}</Section>
      <Section title="Journey workflow"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"><WorkflowPlaceholder icon={FileText} label="Journey Proposal"/><WorkflowPlaceholder icon={CreditCard} label="Payments"/><WorkflowPlaceholder icon={FolderOpen} label="Journey Documents"/><WorkflowPlaceholder icon={Handshake} label="Supplier Management"/><WorkflowPlaceholder icon={History} label="Timeline"/></div></Section>
    </div><aside className="grid h-fit gap-6">
      <Section title="Contact"><div className="grid gap-3 text-sm"><a href={`mailto:${enquiry.email}`} className="flex items-center gap-2 text-forest"><Mail className="size-4"/>{enquiry.email}</a>{enquiry.phone&&<a href={`tel:${enquiry.phone}`} className="flex items-center gap-2 text-forest"><Phone className="size-4"/>{enquiry.phone}</a>}<span className="text-stone">{enquiry.nationality||"Nationality not provided"}</span></div></Section>
      <Section title="Accounting">{account?<div className="grid gap-4"><div className="flex items-center justify-between gap-4"><span className="flex items-center gap-2 text-sm"><WalletCards className="size-4 text-gold"/>Accounting {account.active?"active":"inactive"}</span><strong className={`rounded-full px-3 py-1 text-xs ${account.status==="review_required"?"bg-red-100 text-red-800":"bg-sand-light text-forest"}`}>{accountStatusLabels[account.status]}</strong></div><div className="grid gap-3 rounded-2xl bg-sand-light p-4 text-sm"><PaymentSummary label="Customer payments" value={grossCustomerPayments} currency={account.currency}/>{account.amount_refunded>0&&<PaymentSummary label="Refunds paid" value={account.amount_refunded} currency={account.currency} negative/>}<div className="border-t border-stone/15 pt-3"><PaymentSummary label="Net customer funds" value={account.amount_received} currency={account.currency} emphasized/></div></div>{account.review_reason&&<p className="rounded-xl bg-red-50 p-3 text-xs leading-5 text-red-800">{account.review_reason}</p>}<Link href={`/admin/accounting/${account.id}`} className="text-sm font-semibold text-forest">Open Accounting account →</Link></div>:<div><p className="text-sm leading-6 text-stone">Accounting has not been activated. Select <strong>Deposit Paid</strong> when the traveller payment is received.</p><p className="mt-3 rounded-xl bg-sand-light p-3 text-xs text-stone">Customer payment: Not recorded</p></div>}</Section>
      <Section title="Internal follow-up notes"><textarea rows={10} value={notes} onChange={event=>setNotes(event.target.value)} placeholder="Record calls, supplier checks, preferences and next actions…" className="w-full rounded-xl border border-stone/25 p-4 text-sm outline-none focus:border-gold"/><Button disabled={saving} className="mt-3 w-full" onClick={()=>void save()}>{saving?"Saving…":"Save enquiry"}</Button></Section>
    </aside></div>
  </div>{depositOpen&&<div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate/65 p-4 backdrop-blur-sm"><form onSubmit={activateAccounting} className="relative my-6 w-full max-w-lg rounded-3xl bg-ivory p-7 shadow-2xl"><button type="button" aria-label="Close deposit form" onClick={()=>setDepositOpen(false)} className="absolute right-5 top-5 grid size-9 place-items-center rounded-full bg-white"><X className="size-4"/></button><p className="eyebrow mb-2">Accounting activation</p><h2 className="font-serif text-3xl">Record traveller deposit</h2><p className="mt-3 text-sm leading-6 text-stone">This creates or activates the account for {enquiry.journey_reference} and records one customer receipt.</p><div className="mt-6 grid gap-4"><label className="grid gap-2 text-sm font-semibold">Deposit amount ({quote?.currency??"USD"})<input required name="depositAmount" type="number" min=".01" step=".01" className="rounded-xl border border-stone/25 px-4 py-3"/></label><label className="grid gap-2 text-sm font-semibold">Payment date<input required name="paymentDate" type="date" defaultValue={new Date().toISOString().slice(0,10)} className="rounded-xl border border-stone/25 px-4 py-3"/></label><label className="grid gap-2 text-sm font-semibold">Payment method<select name="paymentMethod" className="rounded-xl border border-stone/25 px-4 py-3"><option>Bank transfer</option><option>Card</option><option>Cash</option><option>Online payment</option><option>Other</option></select></label><label className="grid gap-2 text-sm font-semibold">Reference<input name="reference" placeholder="Bank reference or receipt number" className="rounded-xl border border-stone/25 px-4 py-3"/></label><label className="grid gap-2 text-sm font-semibold">Notes<textarea name="notes" rows={3} className="rounded-xl border border-stone/25 px-4 py-3"/></label><div className="flex justify-end gap-3"><Button type="button" variant="ghost" onClick={()=>setDepositOpen(false)}>Cancel</Button><Button disabled={saving} type="submit">{saving?"Recording…":"Record deposit & activate"}</Button></div></div></form></div>}</AdminShell>;
}

function Section({title,children}:{title:string;children:React.ReactNode}){return <section className="rounded-3xl border border-stone/15 bg-white p-6 md:p-8"><h2 className="font-serif text-2xl">{title}</h2><div className="mt-6">{children}</div></section>}
function Selection({label,values}:{label:string;values:string[]}){return <div className="border-b border-stone/15 py-5 first:pt-0 last:border-0 last:pb-0"><p className="text-[.65rem] font-bold uppercase tracking-widest text-gold">{label}</p><div className="mt-3 flex flex-wrap gap-2">{values.length?values.map(value=><span key={value} className="rounded-full bg-sand-light px-3 py-2 text-xs">{value}</span>):<span className="text-sm text-stone">Not selected</span>}</div></div>}
function Metric({icon:Icon,label,value,detail}:{icon:typeof Users;label:string;value:string;detail:string}){return <div className="rounded-2xl bg-sand-light p-5"><Icon className="size-5 text-gold"/><span className="mt-4 block text-xs font-bold uppercase tracking-widest text-stone">{label}</span><strong className="mt-1 block font-serif text-3xl">{value}</strong><small className="mt-1 block text-stone">{detail}</small></div>}
function Price({label,value}:{label:string;value:string}){return <div className="rounded-2xl bg-forest p-5 text-ivory"><span className="text-xs text-ivory/55">{label}</span><strong className="mt-2 block font-serif text-2xl">{value}</strong></div>}
function PaymentSummary({label,value,currency,negative=false,emphasized=false}:{label:string;value:number;currency:string;negative?:boolean;emphasized?:boolean}){return <div className="flex items-baseline justify-between gap-4"><span className="text-xs text-stone">{label}</span><strong className={emphasized?"text-base":"text-sm"}>{negative?"− ":""}{currency} {value.toFixed(2)}</strong></div>}
function WorkflowPlaceholder({icon:Icon,label}:{icon:typeof FileText;label:string}){return <div className="rounded-2xl border border-dashed border-stone/25 bg-sand-light p-4"><Icon className="size-5 text-gold"/><strong className="mt-3 block text-sm">{label}</strong><span className="mt-1 block text-xs text-stone">Reserved for the next workflow phase.</span></div>}
