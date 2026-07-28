"use client";

import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {useRouter} from "next/navigation";
import {CalendarDays,Mail,Search,Users} from "lucide-react";
import {AdminShell} from "./admin-shell";
import {createClient} from "@/lib/supabase/client";
import {parseJourneyHandoff} from "@/lib/journey/quotation-handoff";
import type {Database,Json} from "@/lib/database.types";

type Enquiry=Database["public"]["Tables"]["enquiries"]["Row"];
const filters=[["all","All"],["new","New"],["contacted","Contacted"],["quote_preparing","Preparing"],["quote_sent","Quote sent"],["confirmed","Confirmed"],["closed","Closed"],["cancelled","Cancelled"]] as const;
const statusLabels:Record<string,string>={new:"New lead",contacted:"Contacted",quote_preparing:"Quotation preparing",quote_sent:"Quotation sent",confirmed:"Confirmed",closed:"Closed",cancelled:"Cancelled"};
const statusStyle:Record<string,string>={new:"bg-gold/15 text-[#855d17]",contacted:"bg-sky-100 text-sky-800",quote_preparing:"bg-violet-100 text-violet-800",quote_sent:"bg-indigo-100 text-indigo-800",confirmed:"bg-emerald-100 text-emerald-800",closed:"bg-stone/15 text-stone",cancelled:"bg-red-100 text-red-800"};

const ids=(value:Json)=>Array.isArray(value)?value.filter((item):item is string=>typeof item==="string"):[];
const money=(row:Enquiry)=>{
  const quote=parseJourneyHandoff(row.trip_state)?.quote;
  return quote?.status==="ready"&&quote.totalPackagePrice!==null
    ?`${quote.currency} ${quote.totalPackagePrice.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`
    :"Personal quotation";
};

export function EnquiryInbox(){
  const router=useRouter();
  const [rows,setRows]=useState<Enquiry[]>([]);
  const [filter,setFilter]=useState("all");
  const [search,setSearch]=useState("");
  const [loading,setLoading]=useState(true);
  const [loadError,setLoadError]=useState("");
  useEffect(()=>{void (async()=>{
    const database=createClient();
    const {data:{session}}=await database.auth.getSession();
    if(!session){router.replace("/admin/login");return}
    const {data,error}=await database.from("enquiries").select("*").order("created_at",{ascending:false});
    if(error){setLoadError(error.message);setLoading(false);return}
    setRows(data??[]);
    setLoading(false);
  })()},[router]);
  const visible=useMemo(()=>rows.filter(row=>(filter==="all"||row.status===filter)&&`${row.name} ${row.email} ${row.phone||""} ${row.nationality||""}`.toLowerCase().includes(search.toLowerCase())),[rows,filter,search]);
  const openCount=rows.filter(row=>!["confirmed","closed","cancelled"].includes(row.status)).length;
  return <AdminShell><div className="mx-auto max-w-7xl">
    <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow mb-3">Sales pipeline</p><h1 className="font-serif text-4xl md:text-5xl">Traveller enquiries</h1><p className="mt-3 max-w-2xl text-slate/60">Every quotation request, its complete journey and the next follow-up action in one place.</p></div><div className="rounded-2xl bg-forest px-6 py-4 text-ivory"><span className="block text-xs text-ivory/55">Open opportunities</span><strong className="font-serif text-3xl">{openCount}</strong></div></div>
    {loadError&&<div role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">Enquiries could not be loaded: {loadError}</div>}
    <div className="mt-8 flex flex-wrap gap-2">{filters.map(([key,label])=><button key={key} onClick={()=>setFilter(key)} className={`rounded-full px-4 py-2 text-xs font-semibold ${filter===key?"bg-forest text-white":"bg-white text-stone"}`}>{label}{key!=="all"&&<span className="ml-2 opacity-60">{rows.filter(row=>row.status===key).length}</span>}</button>)}</div>
    <label className="mt-5 flex max-w-xl items-center gap-3 rounded-2xl border border-stone/15 bg-white px-4"><Search className="size-4 text-stone"/><input value={search} onChange={event=>setSearch(event.target.value)} placeholder="Search traveller name, email, phone or nationality…" className="w-full bg-transparent py-4 text-sm outline-none"/></label>
    <div className="mt-7 overflow-hidden rounded-3xl border border-stone/15 bg-white">{loading?<div className="h-72 animate-pulse bg-sand-light"/>:visible.length?<div className="divide-y divide-stone/15">{visible.map(row=>{
      const destinationCount=ids(row.selected_destinations).length;
      const travellers=row.adults+row.children;
      return <Link key={row.id} href={`/admin/enquiries/${row.id}`} className="grid gap-4 p-5 transition hover:bg-sand-light lg:grid-cols-[1.3fr_.8fr_.7fr_.55fr] lg:items-center">
        <div><div className="flex flex-wrap items-center gap-2"><strong className="font-serif text-xl">{row.name}</strong><span className={`rounded-full px-2.5 py-1 text-[.65rem] font-bold uppercase ${statusStyle[row.status]||statusStyle.closed}`}>{statusLabels[row.status]||row.status}</span></div><p className="mt-1 flex items-center gap-2 text-sm text-stone"><Mail className="size-3"/>{row.email}</p></div>
        <div className="grid gap-1 text-sm"><span className="flex items-center gap-2"><Users className="size-4 text-gold"/>{travellers} traveller{travellers===1?"":"s"} · {destinationCount} destination{destinationCount===1?"":"s"}</span><span className="flex items-center gap-2 text-xs text-stone"><CalendarDays className="size-4"/>{row.travel_start_date||"Dates not selected"}</span></div>
        <strong className="text-sm text-forest">{money(row)}</strong>
        <span className="text-xs text-stone">{new Date(row.created_at).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}</span>
      </Link>;
    })}</div>:<div className="p-14 text-center text-stone">No traveller enquiries match these filters.</div>}</div>
  </div></AdminShell>;
}
