"use client";

import Link from "next/link";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {ArrowUpRight,CircleAlert,CircleCheck,Clock3,Handshake,ImageOff,Inbox,TrendingUp} from "lucide-react";
import {AdminShell} from "./admin-shell";
import {createClient} from "@/lib/supabase/client";
import {parseJourneyHandoff} from "@/lib/journey/quotation-handoff";
import type {Database} from "@/lib/database.types";

type Enquiry=Database["public"]["Tables"]["enquiries"]["Row"];
type PartnerApplication=Database["public"]["Tables"]["partner_applications"]["Row"];
type ResourceHealth={label:string;href:string;total:number;published:number;review:number;draft:number;missingImage:number};
type DashboardData={
  resources:ResourceHealth[];
  enquiries:Enquiry[];
  partnerApplications:PartnerApplication[];
};
const resourceDefinitions=[
  {label:"Themes",table:"themes",href:"/admin/diagnostics",imageField:"hero_image_url"},
  {label:"Destinations",table:"destinations",href:"/admin/resources/destinations",imageField:"hero_image_url"},
  {label:"Experiences",table:"experiences",href:"/admin/resources/experiences",imageField:"hero_image_url"},
  {label:"Stays",table:"accommodations",href:"/admin/resources/stays",imageField:"hero_image_url"},
  {label:"Vehicles",table:"vehicles",href:"/admin/resources/vehicles",imageField:"hero_image_url"},
  {label:"Guides",table:"guides",href:"/admin/resources/guides",imageField:"profile_image_url"}
] as const;
const pipeline=[["new","New"],["contacted","Contacted"],["quote_preparing","Preparing"],["quote_sent","Sent"],["confirmed","Confirmed"]] as const;
const statusLabel:Record<string,string>={new:"New lead",contacted:"Contacted",quote_preparing:"Preparing quote",quote_sent:"Quote sent",confirmed:"Confirmed",closed:"Closed",cancelled:"Cancelled"};

const shortDate=(value:string)=>new Date(value).toLocaleDateString("en-GB",{day:"numeric",month:"short"});

export function AdminDashboard(){
  const router=useRouter();
  const [data,setData]=useState<DashboardData|null>(null);
  const [loadError,setLoadError]=useState("");
  useEffect(()=>{void (async()=>{
    const database=createClient();
    const {data:{session}}=await database.auth.getSession();
    if(!session){router.replace("/admin/login");return}
    const [resourceResults,enquiryResult,partnerResult]=await Promise.all([
      Promise.all(resourceDefinitions.map(definition=>database.from(definition.table).select(`id,status,${definition.imageField}`))),
      database.from("enquiries").select("*").order("created_at",{ascending:false}).limit(100),
      database.from("partner_applications").select("*").order("submitted_at",{ascending:false}).limit(100)
    ]);
    const firstError=resourceResults.find(result=>result.error)?.error||enquiryResult.error||partnerResult.error;
    if(firstError){setLoadError(firstError.message);return}
    const resources=resourceDefinitions.map((definition,index)=>{
      const rows=(resourceResults[index].data??[]) as unknown as Array<Record<string,unknown>>;
      return {
        label:definition.label,
        href:definition.href,
        total:rows.length,
        published:rows.filter(row=>row.status==="published").length,
        review:rows.filter(row=>row.status==="in_review").length,
        draft:rows.filter(row=>row.status==="draft").length,
        missingImage:rows.filter(row=>!row[definition.imageField]).length
      };
    });
    setData({resources,enquiries:enquiryResult.data??[],partnerApplications:partnerResult.data??[]});
  })()},[router]);
  if(!data&&!loadError)return <AdminShell><div className="grid min-h-[70vh] gap-5 md:grid-cols-2"><div className="animate-pulse rounded-3xl bg-white"/><div className="animate-pulse rounded-3xl bg-white"/></div></AdminShell>;

  const enquiries=data?.enquiries??[];
  const partners=data?.partnerApplications??[];
  const resources=data?.resources??[];
  const newLeads=enquiries.filter(row=>row.status==="new").length;
  const activeQuotes=enquiries.filter(row=>["contacted","quote_preparing","quote_sent"].includes(row.status)).length;
  const confirmed=enquiries.filter(row=>row.status==="confirmed").length;
  const pendingPartners=partners.filter(row=>["submitted","under_review","needs_information"].includes(row.status)).length;
  const totalContent=resources.reduce((total,item)=>total+item.total,0);
  const publishedContent=resources.reduce((total,item)=>total+item.published,0);
  const reviewContent=resources.reduce((total,item)=>total+item.review,0);
  const draftContent=resources.reduce((total,item)=>total+item.draft,0);
  const missingImages=resources.reduce((total,item)=>total+item.missingImage,0);
  const readiness=totalContent?Math.round((publishedContent/totalContent)*100):0;
  const pipelineValue=enquiries.filter(row=>!["closed","cancelled"].includes(row.status)).reduce((total,row)=>{
    const quote=parseJourneyHandoff(row.trip_state)?.quote;
    return total+(quote?.status==="ready"&&quote.totalPackagePrice?quote.totalPackagePrice:0);
  },0);
  const maxPipeline=Math.max(1,...pipeline.map(([status])=>enquiries.filter(row=>row.status===status).length));
  return <AdminShell><div className="mx-auto max-w-[1500px]">
    <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow mb-3">Roam Ceylon command centre</p><h1 className="font-serif text-4xl md:text-5xl">Welcome back.</h1><p className="mt-3 text-sm text-slate/55">Live commercial activity, traveller demand and publishing readiness.</p></div><div className="flex gap-3"><Link href="/admin/enquiries" className="rounded-full bg-gold px-5 py-3 text-sm font-bold text-slate">Open enquiry inbox</Link><Link href="/admin/partner-applications" className="rounded-full bg-forest px-5 py-3 text-sm font-bold text-white">Review partners</Link></div></div>
    {loadError&&<div role="alert" className="mt-7 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">Dashboard data could not be loaded: {loadError}</div>}
    <section className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <HeroMetric icon={Inbox} label="New traveller leads" value={String(newLeads)} detail={`${activeQuotes} quotations currently active`} href="/admin/enquiries" tone="gold"/>
      <HeroMetric icon={TrendingUp} label="Open pipeline value" value={pipelineValue?`USD ${pipelineValue.toLocaleString("en-US",{maximumFractionDigits:0})}`:"No estimates yet"} detail={`${confirmed} confirmed journey${confirmed===1?"":"s"}`} href="/admin/enquiries" tone="forest"/>
      <HeroMetric icon={Handshake} label="Partner actions" value={String(pendingPartners)} detail={`${partners.filter(row=>row.status==="submitted").length} newly submitted`} href="/admin/partner-applications" tone="ivory"/>
      <HeroMetric icon={CircleCheck} label="Content live" value={`${readiness}%`} detail={`${publishedContent} of ${totalContent} records published`} href="/admin/resources/destinations" tone="ivory"/>
    </section>
    <section className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
      <div className="overflow-hidden rounded-3xl border border-stone/15 bg-white"><div className="flex items-center justify-between border-b border-stone/15 p-7"><div><p className="eyebrow mb-2">Latest demand</p><h2 className="font-serif text-2xl">Recent traveller enquiries</h2></div><Link href="/admin/enquiries" className="flex items-center gap-1 text-sm font-semibold text-forest">View all <ArrowUpRight className="size-4"/></Link></div>{enquiries.length?<div className="divide-y divide-stone/15">{enquiries.slice(0,5).map(row=>{
        const handoff=parseJourneyHandoff(row.trip_state);
        const quote=handoff?.quote;
        const destinationCount=Array.isArray(row.selected_destinations)?row.selected_destinations.length:0;
        return <Link key={row.id} href={`/admin/enquiries/${row.id}`} className="grid gap-3 p-5 transition hover:bg-sand-light md:grid-cols-[1fr_160px_130px] md:items-center"><div><div className="flex flex-wrap items-center gap-2"><strong>{row.name}</strong><span className="rounded-full bg-gold/10 px-2 py-1 text-[.65rem] font-bold uppercase text-gold">{statusLabel[row.status]||row.status}</span></div><p className="mt-1 text-xs text-stone">{row.adults+row.children} travellers · {destinationCount} destinations · {row.nationality||"Nationality open"}</p></div><strong className="text-sm text-forest">{quote?.status==="ready"?`${quote.currency} ${quote.totalPackagePrice?.toLocaleString("en-US",{maximumFractionDigits:0})}`:"Personal quote"}</strong><span className="text-xs text-stone">{shortDate(row.created_at)}</span></Link>;
      })}</div>:<EmptyState text="No traveller enquiries have arrived yet."/>}</div>
      <div className="rounded-3xl bg-forest p-7 text-ivory"><p className="eyebrow mb-3 text-gold-light">Sales movement</p><h2 className="font-serif text-2xl">Quotation pipeline</h2><div className="mt-8 grid gap-5">{pipeline.map(([status,label])=>{const count=enquiries.filter(row=>row.status===status).length;return <div key={status}><div className="mb-2 flex justify-between text-sm"><span className="text-ivory/65">{label}</span><strong>{count}</strong></div><div className="h-2 rounded-full bg-white/10"><div className="h-full rounded-full bg-gold transition-all" style={{width:`${Math.max(count?8:0,(count/maxPipeline)*100)}%`}}/></div></div>})}</div><Link href="/admin/enquiries" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-gold-light">Manage sales pipeline <ArrowUpRight className="size-4"/></Link></div>
    </section>
    <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_.72fr]">
      <div className="rounded-3xl border border-stone/15 bg-white p-7"><div className="flex items-center justify-between"><div><p className="eyebrow mb-2">Publishing</p><h2 className="font-serif text-2xl">Content readiness</h2></div><span className="rounded-full bg-forest/10 px-4 py-2 text-sm font-bold text-forest">{readiness}% live</span></div><div className="mt-7 grid gap-5">{resources.map(resource=>{const percent=resource.total?Math.round((resource.published/resource.total)*100):0;return <Link key={resource.label} href={resource.href} className="group grid gap-3 sm:grid-cols-[130px_1fr_120px] sm:items-center"><strong className="text-sm">{resource.label}</strong><div className="h-2.5 overflow-hidden rounded-full bg-sand"><div className="h-full rounded-full bg-forest transition group-hover:bg-gold" style={{width:`${percent}%`}}/></div><span className="text-right text-xs text-stone">{resource.published}/{resource.total} published</span></Link>})}</div></div>
      <div className="rounded-3xl border border-stone/15 bg-white p-7"><p className="eyebrow mb-2">Action queue</p><h2 className="font-serif text-2xl">What needs attention</h2><div className="mt-6 divide-y divide-stone/15"><Action icon={Inbox} value={newLeads} label="New leads awaiting first contact" href="/admin/enquiries"/><Action icon={Clock3} value={reviewContent} label="Content records awaiting review" href="/admin/resources/destinations"/><Action icon={ImageOff} value={missingImages} label="Records missing primary imagery" href="/admin/diagnostics"/><Action icon={CircleAlert} value={draftContent} label="Draft content not yet published" href="/admin/resources/destinations"/><Action icon={Handshake} value={pendingPartners} label="Partner applications in progress" href="/admin/partner-applications"/></div></div>
    </section>
  </div></AdminShell>;
}

function HeroMetric({icon:Icon,label,value,detail,href,tone}:{icon:typeof Inbox;label:string;value:string;detail:string;href:string;tone:"gold"|"forest"|"ivory"}){
  const styles=tone==="forest"?"bg-forest text-ivory":tone==="gold"?"bg-gold text-slate":"border border-stone/15 bg-white text-slate";
  const subtle=tone==="forest"?"text-ivory/55":tone==="gold"?"text-slate/60":"text-stone";
  return <Link href={href} className={`group rounded-3xl p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-forest/5 ${styles}`}><div className="flex items-start justify-between"><span className={`grid size-11 place-items-center rounded-2xl ${tone==="ivory"?"bg-sand-light":"bg-white/15"}`}><Icon className="size-5"/></span><ArrowUpRight className="size-5 opacity-35 transition group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:opacity-100"/></div><span className={`mt-7 block text-xs font-bold uppercase tracking-widest ${subtle}`}>{label}</span><strong className="mt-2 block font-serif text-3xl">{value}</strong><span className={`mt-2 block text-xs ${subtle}`}>{detail}</span></Link>;
}
function Action({icon:Icon,value,label,href}:{icon:typeof Inbox;value:number;label:string;href:string}){return <Link href={href} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sand-light"><Icon className="size-4 text-gold"/></span><span className="min-w-0 flex-1 text-sm">{label}</span><strong className="font-serif text-2xl">{value}</strong></Link>}
function EmptyState({text}:{text:string}){return <div className="grid min-h-64 place-items-center p-10 text-center text-sm text-stone">{text}</div>}
