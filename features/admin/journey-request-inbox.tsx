"use client";

import {CalendarDays,Mail,MessageCircle,Route,Users} from "lucide-react";
import {useRouter} from "next/navigation";
import {useEffect,useState} from "react";
import {AdminShell} from "./admin-shell";
import {
  JourneyRequestService,
  journeyRequestStatuses,
  type JourneyRequest,
  type JourneyRequestStatus
} from "@/lib/journey-requests/journey-request-service";
import {parseJourneyHandoff} from "@/lib/journey/quotation-handoff";
import {createClient} from "@/lib/supabase/client";

const statusStyles:Record<JourneyRequestStatus,string>={
  new:"border-gold/30 bg-gold/10 text-[#855d17]",
  preparing_proposal:"border-violet-200 bg-violet-50 text-violet-800",
  proposal_sent:"border-sky-200 bg-sky-50 text-sky-800",
  accepted:"border-emerald-200 bg-emerald-50 text-emerald-800",
  cancelled:"border-red-200 bg-red-50 text-red-800"
};

const date=(value:string)=>new Date(value).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"});

function summary(row:JourneyRequest){
  const handoff=parseJourneyHandoff(row.journey_snapshot);
  if(!handoff)return {travellers:"Journey snapshot unavailable",route:"Review the submitted request"};
  const state=handoff.state;
  const travellers=state.travellerCounts.adults+state.travellerCounts.children+state.travellerCounts.infants;
  return {
    travellers:`${travellers} traveller${travellers===1?"":"s"} · ${state.selectedExperienceIds.length} experience${state.selectedExperienceIds.length===1?"":"s"}`,
    route:`${state.selectedDestinationIds.length} destination${state.selectedDestinationIds.length===1?"":"s"} · ${state.travelDates.start||row.arrival_date||"Flexible dates"}`
  };
}

export function JourneyRequestInbox(){
  const router=useRouter();
  const [rows,setRows]=useState<JourneyRequest[]>([]);
  const [loading,setLoading]=useState(true);
  const [message,setMessage]=useState("");
  const [savingId,setSavingId]=useState("");

  useEffect(()=>{void (async()=>{
    const {data:{session}}=await createClient().auth.getSession();
    if(!session){router.replace("/admin/login");return}
    try{setRows(await new JourneyRequestService().list())}
    catch(error){setMessage(error instanceof Error?error.message:"Journey requests could not be loaded.")}
    finally{setLoading(false)}
  })()},[router]);

  const updateStatus=async(row:JourneyRequest,status:JourneyRequestStatus)=>{
    const previous=row.status;
    setMessage("");
    setSavingId(row.id);
    setRows(items=>items.map(item=>item.id===row.id?{...item,status}:item));
    try{await new JourneyRequestService().updateStatus(row.id,status)}
    catch(error){
      setRows(items=>items.map(item=>item.id===row.id?{...item,status:previous}:item));
      setMessage(error instanceof Error?error.message:"The request status could not be updated.");
    }finally{setSavingId("")}
  };

  const newCount=rows.filter(row=>row.status==="new").length;
  return <AdminShell><div className="mx-auto max-w-7xl">
    <div className="flex flex-wrap items-end justify-between gap-5">
      <div><p className="eyebrow mb-3">Journey workflow</p><h1 className="font-serif text-4xl md:text-5xl">Journey Requests</h1><p className="mt-3 max-w-2xl text-slate/60">Personalised journey requests awaiting review and proposal preparation.</p></div>
      <div className="rounded-2xl bg-forest px-6 py-4 text-ivory"><span className="block text-xs text-ivory/55">New requests</span><strong className="font-serif text-3xl">{newCount}</strong></div>
    </div>
    {message&&<div role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{message}</div>}
    <div className="mt-8 overflow-hidden rounded-3xl border border-stone/15 bg-white">
      <div className="hidden grid-cols-[.65fr_1.1fr_1.35fr_.6fr_.8fr] gap-4 border-b border-stone/15 bg-sand-light px-5 py-4 text-[.68rem] font-bold uppercase tracking-[.12em] text-stone lg:grid">
        <span>Journey ID</span><span>Customer</span><span>Journey Summary</span><span>Created</span><span>Status</span>
      </div>
      {loading?<div className="h-72 animate-pulse bg-sand-light"/>:rows.length?<div className="divide-y divide-stone/15">{rows.map(row=>{
        const details=summary(row);
        return <div key={row.id} className="grid gap-5 p-5 lg:grid-cols-[.65fr_1.1fr_1.35fr_.6fr_.8fr] lg:items-center">
          <strong className="text-sm text-forest">{row.journey_reference}</strong>
          <div><strong className="font-serif text-lg">{row.customer_name}</strong><a href={`mailto:${row.email_address}`} className="mt-1 flex items-center gap-2 text-xs text-stone"><Mail className="size-3"/>{row.email_address}</a><a href={`tel:${row.whatsapp_number}`} className="mt-1 flex items-center gap-2 text-xs text-stone"><MessageCircle className="size-3"/>{row.whatsapp_number}</a></div>
          <div className="grid gap-1 text-sm"><span className="flex items-center gap-2"><Users className="size-4 text-gold"/>{details.travellers}</span><span className="flex items-center gap-2 text-xs text-stone"><Route className="size-4"/>{details.route}</span></div>
          <span className="flex items-center gap-2 text-xs text-stone"><CalendarDays className="size-4"/>{date(row.created_at)}</span>
          <select aria-label={`Status for ${row.journey_reference}`} value={row.status} disabled={savingId===row.id} onChange={event=>void updateStatus(row,event.target.value as JourneyRequestStatus)} className={`rounded-full border px-4 py-2 text-xs font-semibold outline-none ${statusStyles[row.status]}`}>{journeyRequestStatuses.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>
        </div>;
      })}</div>:<div className="p-14 text-center"><ClipboardEmpty/></div>}
    </div>
  </div></AdminShell>;
}

function ClipboardEmpty(){
  return <><Route className="mx-auto size-9 text-gold"/><h2 className="mt-4 font-serif text-2xl">No journey requests yet.</h2><p className="mt-2 text-sm text-stone">New personalised journey requests will appear here.</p></>;
}
