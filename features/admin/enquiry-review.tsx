"use client";

import {useEffect,useMemo,useState} from "react";
import {useRouter} from "next/navigation";
import {CalendarDays,Mail,MapPin,Phone,Users} from "lucide-react";
import {AdminShell} from "./admin-shell";
import {Button} from "@/components/ui/button";
import {createClient} from "@/lib/supabase/client";
import {parseJourneyHandoff} from "@/lib/journey/quotation-handoff";
import type {Database,Json} from "@/lib/database.types";
import type {ParticipantCounts} from "@/lib/types";

type Enquiry=Database["public"]["Tables"]["enquiries"]["Row"];
type Named={id:string;name:string};
type SelectionNames={themes:Named[];destinations:Named[];experiences:Named[];stays:Named[];vehicle:string|null;guide:string|null};
const statuses=[["new","New lead"],["contacted","Contacted"],["quote_preparing","Quotation preparing"],["quote_sent","Quotation sent"],["confirmed","Confirmed"],["closed","Closed"],["cancelled","Cancelled"]] as const;
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
  const [selectionNames,setSelectionNames]=useState<SelectionNames>(emptyNames);
  const [notes,setNotes]=useState("");
  const [message,setMessage]=useState("");
  const [saving,setSaving]=useState(false);
  useEffect(()=>{void (async()=>{
    const database=createClient();
    const {data:{session}}=await database.auth.getSession();
    if(!session){router.replace("/admin/login");return}
    const {data:row,error}=await database.from("enquiries").select("*").eq("id",id).single();
    if(error||!row){setMessage("This enquiry could not be found.");return}
    setEnquiry(row);setNotes(row.internal_notes||"");
    const themeIds=ids(row.selected_themes);const destinationIds=ids(row.selected_destinations);const experienceIds=ids(row.selected_experiences);const stayIds=ids(row.selected_stays);
    const [themes,destinations,experiences,stays,vehicle,guide]=await Promise.all([
      themeIds.length?database.from("themes").select("id,name").in("id",themeIds):Promise.resolve({data:[]}),
      destinationIds.length?database.from("destinations").select("id,name").in("id",destinationIds):Promise.resolve({data:[]}),
      experienceIds.length?database.from("experiences").select("id,name").in("id",experienceIds):Promise.resolve({data:[]}),
      stayIds.length?database.from("accommodations").select("id,name").in("id",stayIds):Promise.resolve({data:[]}),
      row.selected_vehicle?database.from("vehicles").select("listing_title").eq("id",row.selected_vehicle).maybeSingle():Promise.resolve({data:null}),
      row.selected_guide?database.from("guides").select("name").eq("id",row.selected_guide).maybeSingle():Promise.resolve({data:null})
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
  })()},[id,router]);
  const handoff=useMemo(()=>enquiry?parseJourneyHandoff(enquiry.trip_state):null,[enquiry]);
  const quote=handoff?.quote??null;
  const save=async(status=enquiry?.status)=>{
    if(!enquiry||!status)return;
    setSaving(true);setMessage("");
    const database=createClient();
    if(status==="closed"){
      const {error:notesError}=await database.from("enquiries").update({internal_notes:notes}).eq("id",id);
      if(notesError){setSaving(false);setMessage(notesError.message);return}
      const {data:{session}}=await database.auth.getSession();
      const response=await fetch("/api/admin/accounting/post",{method:"POST",headers:{"content-type":"application/json",authorization:`Bearer ${session?.access_token??""}`},body:JSON.stringify({enquiryId:id})});
      const result=await response.json() as {error?:string};
      setSaving(false);
      if(!response.ok){setMessage(result.error??"The journey could not be posted to Accounting.");return}
      setEnquiry({...enquiry,status,internal_notes:notes});
      setMessage("Journey closed and posted to Accounting.");
      return;
    }
    const {error}=await database.from("enquiries").update({status,internal_notes:notes}).eq("id",id);
    setSaving(false);
    if(error){setMessage(error.message);return}
    setEnquiry({...enquiry,status,internal_notes:notes});
    setMessage("Enquiry updated.");
  };
  if(!enquiry)return <AdminShell><div className="grid min-h-[60vh] place-items-center text-stone">{message||"Loading enquiry…"}</div></AdminShell>;
  const travellerCounts=handoff?.state.travellerCounts??{adults:enquiry.adults,children:enquiry.children,infants:0};
  const travellers=travellerCounts.adults+travellerCounts.children+travellerCounts.infants;
  const experienceParticipants=participantMap(enquiry.experience_participants);
  return <AdminShell><div className="mx-auto max-w-7xl">
    <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow mb-3">Traveller enquiry</p><h1 className="font-serif text-4xl md:text-5xl">{enquiry.name}</h1><p className="mt-2 text-sm text-stone">Received {new Date(enquiry.created_at).toLocaleString("en-GB")}</p></div><select value={enquiry.status} onChange={event=>void save(event.target.value)} disabled={saving} className="rounded-full border border-stone/25 bg-white px-5 py-3 text-sm font-semibold">{statuses.map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></div>
    {message&&<p className="mt-5 rounded-xl bg-white p-4 text-sm">{message}</p>}
    <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_360px]"><div className="grid gap-6">
      <Section title="Journey at a glance"><div className="grid gap-4 sm:grid-cols-3"><Metric icon={Users} label="Travellers" value={`${travellers}`} detail={`${travellerCounts.adults} adults · ${travellerCounts.children} children · ${travellerCounts.infants} infants`}/><Metric icon={CalendarDays} label="Travel dates" value={enquiry.travel_start_date||"Flexible"} detail={enquiry.travel_end_date?`to ${enquiry.travel_end_date}`:"Departure not selected"}/><Metric icon={MapPin} label="Destinations" value={`${selectionNames.destinations.length}`} detail={selectionNames.destinations.map(item=>item.name).join(" · ")||"Not selected"}/></div></Section>
      <Section title="Selected journey"><Selection label="Themes" values={selectionNames.themes.map(item=>item.name)}/><Selection label="Destinations and route order" values={selectionNames.destinations.map((item,index)=>`${index+1}. ${item.name}`)}/><Selection label="Experiences" values={selectionNames.experiences.map(item=>{const counts=experienceParticipants[item.id];const count=counts?counts.adults+counts.children+counts.infants:0;return `${item.name}${count?` · ${count} participant${count===1?"":"s"}`:""}`})}/><Selection label="Accommodation" values={selectionNames.stays.map(item=>item.name)}/><Selection label="Transport" values={selectionNames.vehicle?[selectionNames.vehicle]:[]}/><Selection label="Local guide" values={selectionNames.guide?[selectionNames.guide]:[]}/></Section>
      <Section title="Traveller notes"><p className="whitespace-pre-wrap text-sm leading-7 text-slate/70">{enquiry.traveller_notes||enquiry.summary||"No additional notes were supplied."}</p></Section>
      <Section title="Customer package estimate">{quote?.status==="ready"?<div><div className="grid gap-4 sm:grid-cols-3"><Price label="Total package" value={`${quote.currency} ${quote.totalPackagePrice?.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`}/><Price label="Per person" value={`${quote.currency} ${quote.pricePerPerson?.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`}/><Price label="Daily estimate" value={`${quote.currency} ${quote.estimatedDailyCost?.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`}/></div>{quote.components?.length?<div className="mt-6 divide-y divide-stone/15">{quote.components.map(item=><div key={item.category} className="flex justify-between py-3 text-sm"><span>{item.label}</span><strong>{quote.currency} {item.amount.toFixed(2)}</strong></div>)}</div>:null}</div>:<p className="text-sm text-stone">A personal quotation is required. No automated estimate was stored with this enquiry.</p>}</Section>
    </div><aside className="grid h-fit gap-6">
      <Section title="Contact"><div className="grid gap-3 text-sm"><a href={`mailto:${enquiry.email}`} className="flex items-center gap-2 text-forest"><Mail className="size-4"/>{enquiry.email}</a>{enquiry.phone&&<a href={`tel:${enquiry.phone}`} className="flex items-center gap-2 text-forest"><Phone className="size-4"/>{enquiry.phone}</a>}<span className="text-stone">{enquiry.nationality||"Nationality not provided"}</span></div></Section>
      <Section title="Internal follow-up notes"><textarea rows={10} value={notes} onChange={event=>setNotes(event.target.value)} placeholder="Record calls, supplier checks, preferences and next actions…" className="w-full rounded-xl border border-stone/25 p-4 text-sm outline-none focus:border-gold"/><Button disabled={saving} className="mt-3 w-full" onClick={()=>void save()}>{saving?"Saving…":"Save enquiry"}</Button></Section>
    </aside></div>
  </div></AdminShell>;
}

function Section({title,children}:{title:string;children:React.ReactNode}){return <section className="rounded-3xl border border-stone/15 bg-white p-6 md:p-8"><h2 className="font-serif text-2xl">{title}</h2><div className="mt-6">{children}</div></section>}
function Selection({label,values}:{label:string;values:string[]}){return <div className="border-b border-stone/15 py-5 first:pt-0 last:border-0 last:pb-0"><p className="text-[.65rem] font-bold uppercase tracking-widest text-gold">{label}</p><div className="mt-3 flex flex-wrap gap-2">{values.length?values.map(value=><span key={value} className="rounded-full bg-sand-light px-3 py-2 text-xs">{value}</span>):<span className="text-sm text-stone">Not selected</span>}</div></div>}
function Metric({icon:Icon,label,value,detail}:{icon:typeof Users;label:string;value:string;detail:string}){return <div className="rounded-2xl bg-sand-light p-5"><Icon className="size-5 text-gold"/><span className="mt-4 block text-xs font-bold uppercase tracking-widest text-stone">{label}</span><strong className="mt-1 block font-serif text-3xl">{value}</strong><small className="mt-1 block text-stone">{detail}</small></div>}
function Price({label,value}:{label:string;value:string}){return <div className="rounded-2xl bg-forest p-5 text-ivory"><span className="text-xs text-ivory/55">{label}</span><strong className="mt-2 block font-serif text-2xl">{value}</strong></div>}
