"use client";

import Link from "next/link";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {ArrowUpRight,Banknote,CircleAlert,CircleCheck,Clock3,Handshake,ImageOff,Inbox,Route,TrendingUp} from "lucide-react";
import {AdminShell} from "./admin-shell";
import {createClient} from "@/lib/supabase/client";
import {enquiryStatusLabels} from "@/lib/enquiries/enquiry-workflow";
import type {EnquiryStatus,Json} from "@/lib/database.types";

type ResourceHealth={label:string;href:string;total:number;published:number;review:number;draft:number;missingImage:number};
type RecentEnquiry={id:string;journey_reference:string;created_at:string;status:EnquiryStatus;traveller_name:string|null;adults:number;children:number;destination_count:number;estimated_price_min:number|null;estimated_price_max:number|null;estimated_price_currency:string|null;estimated_price_basis:string|null};
type JourneySection={newLeads:number;activeQuotes:number;confirmedJourneys:number;openPipelineValue:number;currency:string;pipeline:Array<{status:EnquiryStatus;count:number}>;recent:RecentEnquiry[]};
type DashboardData={
  journeys:JourneySection|null;
  content:{resources:ResourceHealth[]}|null;
  partners:{total:number;pending:number;newSubmissions:number}|null;
  finance:{activeAccounts:number;revenue:number;received:number;refunded:number;supplierPaid:number;currency:string}|null;
  operations:{ready:number;travelling:number;completed:number;pendingFulfilments:number;fulfilledServices:number}|null;
};

const record=(value:unknown):Record<string,unknown>=>value&&typeof value==="object"&&!Array.isArray(value)?value as Record<string,unknown>:{};
const numeric=(value:unknown)=>typeof value==="number"&&Number.isFinite(value)?value:0;
const parseDashboard=(value:Json):DashboardData=>{
  const root=record(value),journeys=root.journeys===null?null:record(root.journeys),content=root.content===null?null:record(root.content),partners=root.partners===null?null:record(root.partners),finance=root.finance===null?null:record(root.finance),operations=root.operations===null?null:record(root.operations);
  return {
    journeys:journeys?{
      newLeads:numeric(journeys.newLeads),activeQuotes:numeric(journeys.activeQuotes),confirmedJourneys:numeric(journeys.confirmedJourneys),openPipelineValue:numeric(journeys.openPipelineValue),currency:String(journeys.currency??"USD"),
      pipeline:Array.isArray(journeys.pipeline)?journeys.pipeline.map(item=>{const row=record(item);return {status:String(row.status) as EnquiryStatus,count:numeric(row.count)}}):[],
      recent:Array.isArray(journeys.recent)?journeys.recent.map(item=>record(item) as unknown as RecentEnquiry):[]
    }:null,
    content:content?{resources:Array.isArray(content.resources)?content.resources.map(item=>record(item) as unknown as ResourceHealth):[]}:null,
    partners:partners?{total:numeric(partners.total),pending:numeric(partners.pending),newSubmissions:numeric(partners.newSubmissions)}:null,
    finance:finance?{activeAccounts:numeric(finance.activeAccounts),revenue:numeric(finance.revenue),received:numeric(finance.received),refunded:numeric(finance.refunded),supplierPaid:numeric(finance.supplierPaid),currency:String(finance.currency??"USD")}:null,
    operations:operations?{ready:numeric(operations.ready),travelling:numeric(operations.travelling),completed:numeric(operations.completed),pendingFulfilments:numeric(operations.pendingFulfilments),fulfilledServices:numeric(operations.fulfilledServices)}:null
  };
};
const shortDate=(value:string)=>new Date(value).toLocaleDateString("en-GB",{day:"numeric",month:"short"});

export function AdminDashboard(){
  const router=useRouter();
  const [data,setData]=useState<DashboardData|null>(null);
  const [loadError,setLoadError]=useState(false);
  useEffect(()=>{void (async()=>{
    const database=createClient();
    const {data:{session}}=await database.auth.getSession();
    if(!session){router.replace("/admin/login");return}
    const result=await database.rpc("read_admin_dashboard");
    if(result.error||!result.data){setLoadError(true);return}
    setData(parseDashboard(result.data));
  })()},[router]);
  if(!data&&!loadError)return <AdminShell requiredPermission="admin.dashboard.view"><div className="grid min-h-[70vh] gap-5 md:grid-cols-2"><div className="animate-pulse rounded-3xl bg-white"/><div className="animate-pulse rounded-3xl bg-white"/></div></AdminShell>;

  const journeys=data?.journeys??null,partners=data?.partners??null,resources=data?.content?.resources??[],finance=data?.finance??null,operations=data?.operations??null;
  const totalContent=resources.reduce((total,item)=>total+item.total,0),publishedContent=resources.reduce((total,item)=>total+item.published,0),reviewContent=resources.reduce((total,item)=>total+item.review,0),draftContent=resources.reduce((total,item)=>total+item.draft,0),missingImages=resources.reduce((total,item)=>total+item.missingImage,0),readiness=totalContent?Math.round((publishedContent/totalContent)*100):0;
  const maxPipeline=Math.max(1,...(journeys?.pipeline??[]).map(item=>item.count));
  return <AdminShell requiredPermission="admin.dashboard.view"><div className="mx-auto max-w-[1500px]">
    <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow mb-3">Roam Ceylon command centre</p><h1 className="font-serif text-4xl md:text-5xl">Welcome back.</h1><p className="mt-3 text-sm text-slate/55">Live activity from the parts of the atelier entrusted to your role.</p></div><div className="flex flex-wrap gap-3">{finance?<Link href="/admin/accounting" className="rounded-full border border-forest/20 bg-white px-5 py-3 text-sm font-bold text-forest">Open accounting</Link>:null}{journeys?<Link href="/admin/enquiries" className="rounded-full bg-gold px-5 py-3 text-sm font-bold text-slate">Open enquiry inbox</Link>:null}{partners?<Link href="/admin/partner-applications" className="rounded-full bg-forest px-5 py-3 text-sm font-bold text-white">Review partners</Link>:null}</div></div>
    {loadError?<div role="alert" className="mt-7 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">Dashboard data is temporarily unavailable. No business totals have been substituted; please refresh or ask an administrator to verify the latest database migration.</div>:null}
    {data?<section className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {journeys?<><HeroMetric icon={Inbox} label="New traveller leads" value={String(journeys.newLeads)} detail={`${journeys.activeQuotes} quotations currently active`} href="/admin/enquiries" tone="gold"/><HeroMetric icon={TrendingUp} label="Open pipeline value" value={journeys.openPipelineValue?`${journeys.currency} ${journeys.openPipelineValue.toLocaleString("en-US",{maximumFractionDigits:0})}`:"No estimates yet"} detail={`${journeys.confirmedJourneys} confirmed journey${journeys.confirmedJourneys===1?"":"s"}`} href="/admin/enquiries" tone="forest"/></>:null}
      {partners?<HeroMetric icon={Handshake} label="Partner actions" value={String(partners.pending)} detail={`${partners.newSubmissions} newly submitted`} href="/admin/partner-applications" tone="ivory"/>:null}
      {resources.length?<HeroMetric icon={CircleCheck} label="Content live" value={`${readiness}%`} detail={`${publishedContent} of ${totalContent} authorized records published`} href={resources[0].href} tone="ivory"/>:null}
      {finance?<HeroMetric icon={Banknote} label="Active journey revenue" value={`${finance.currency} ${finance.revenue.toLocaleString("en-US",{maximumFractionDigits:0})}`} detail={`${finance.activeAccounts} active account${finance.activeAccounts===1?"":"s"}`} href="/admin/accounting" tone="ivory"/>:null}
      {operations?<HeroMetric icon={Route} label="Journeys in motion" value={String(operations.travelling)} detail={`${operations.ready} ready · ${operations.pendingFulfilments} services pending`} href="/admin/enquiries" tone="ivory"/>:null}
    </section>:null}
    {journeys?<section className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
      <div className="overflow-hidden rounded-3xl border border-stone/15 bg-white"><div className="flex items-center justify-between border-b border-stone/15 p-7"><div><p className="eyebrow mb-2">Latest demand</p><h2 className="font-serif text-2xl">Recent traveller enquiries</h2></div><Link href="/admin/enquiries" className="flex items-center gap-1 text-sm font-semibold text-forest">View all <ArrowUpRight className="size-4"/></Link></div>{journeys.recent.length?<div className="divide-y divide-stone/15">{journeys.recent.map(row=>{const estimateLabel=row.estimated_price_min!==null&&row.estimated_price_max!==null?`${row.estimated_price_currency??"USD"} ${row.estimated_price_min.toLocaleString("en-US",{maximumFractionDigits:0})}–${row.estimated_price_max.toLocaleString("en-US",{maximumFractionDigits:0})}${row.estimated_price_basis==="per_person"?" pp":""}`:"Personal quote";return <Link key={row.id} href={`/admin/enquiries/${row.id}`} className="grid gap-3 p-5 transition hover:bg-sand-light md:grid-cols-[1fr_160px_130px] md:items-center"><div><div className="flex flex-wrap items-center gap-2"><strong>{row.traveller_name??row.journey_reference}</strong><span className="rounded-full bg-gold/10 px-2 py-1 text-[.65rem] font-bold uppercase text-gold">{enquiryStatusLabels[row.status]}</span></div><p className="mt-1 text-xs text-stone">{row.journey_reference} · {row.adults+row.children} travellers · {row.destination_count} destinations</p></div><strong className="text-sm text-forest">{estimateLabel}</strong><span className="text-xs text-stone">{shortDate(row.created_at)}</span></Link>})}</div>:<EmptyState text="No traveller enquiries have arrived yet."/>}</div>
      <div className="rounded-3xl bg-forest p-7 text-ivory"><p className="eyebrow mb-3 text-gold-light">Sales movement</p><h2 className="font-serif text-2xl">Quotation pipeline</h2><div className="mt-8 grid gap-5">{journeys.pipeline.map(item=><div key={item.status}><div className="mb-2 flex justify-between text-sm"><span className="text-ivory/65">{enquiryStatusLabels[item.status]}</span><strong>{item.count}</strong></div><div className="h-2 rounded-full bg-white/10"><div className="h-full rounded-full bg-gold transition-all" style={{width:`${Math.max(item.count?8:0,(item.count/maxPipeline)*100)}%`}}/></div></div>)}</div><Link href="/admin/enquiries" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-gold-light">Manage sales pipeline <ArrowUpRight className="size-4"/></Link></div>
    </section>:null}
    {resources.length?<section className="mt-6 grid gap-6 xl:grid-cols-[1fr_.72fr]">
      <div className="rounded-3xl border border-stone/15 bg-white p-7"><div className="flex items-center justify-between"><div><p className="eyebrow mb-2">Publishing</p><h2 className="font-serif text-2xl">Content readiness</h2></div><span className="rounded-full bg-forest/10 px-4 py-2 text-sm font-bold text-forest">{readiness}% live</span></div><div className="mt-7 grid gap-5">{resources.map(resource=>{const percent=resource.total?Math.round((resource.published/resource.total)*100):0;return <Link key={resource.label} href={resource.href} className="group grid gap-3 sm:grid-cols-[130px_1fr_120px] sm:items-center"><strong className="text-sm">{resource.label}</strong><div className="h-2.5 overflow-hidden rounded-full bg-sand"><div className="h-full rounded-full bg-forest transition group-hover:bg-gold" style={{width:`${percent}%`}}/></div><span className="text-right text-xs text-stone">{resource.published}/{resource.total} published</span></Link>})}</div></div>
      <div className="rounded-3xl border border-stone/15 bg-white p-7"><p className="eyebrow mb-2">Action queue</p><h2 className="font-serif text-2xl">What needs attention</h2><div className="mt-6 divide-y divide-stone/15">{journeys?<Action icon={Inbox} value={journeys.newLeads} label="New leads awaiting first contact" href="/admin/enquiries"/>:null}<Action icon={Clock3} value={reviewContent} label="Records awaiting review" href={resources[0].href}/><Action icon={ImageOff} value={missingImages} label="Records missing primary imagery" href="/admin/diagnostics"/><Action icon={CircleAlert} value={draftContent} label="Draft records not yet published" href={resources[0].href}/>{partners?<Action icon={Handshake} value={partners.pending} label="Partner applications in progress" href="/admin/partner-applications"/>:null}</div></div>
    </section>:null}
    {data&&!journeys&&!resources.length&&!partners&&!finance&&!operations?<EmptyState text="Your staff role has dashboard access, but no reporting section has been assigned."/>:null}
  </div></AdminShell>;
}

function HeroMetric({icon:Icon,label,value,detail,href,tone}:{icon:typeof Inbox;label:string;value:string;detail:string;href:string;tone:"gold"|"forest"|"ivory"}){const styles=tone==="forest"?"bg-forest text-ivory":tone==="gold"?"bg-gold text-slate":"border border-stone/15 bg-white text-slate",subtle=tone==="forest"?"text-ivory/55":tone==="gold"?"text-slate/60":"text-stone";return <Link href={href} className={`group rounded-3xl p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-forest/5 ${styles}`}><div className="flex items-start justify-between"><span className={`grid size-11 place-items-center rounded-2xl ${tone==="ivory"?"bg-sand-light":"bg-white/15"}`}><Icon className="size-5"/></span><ArrowUpRight className="size-5 opacity-35 transition group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:opacity-100"/></div><span className={`mt-7 block text-xs font-bold uppercase tracking-widest ${subtle}`}>{label}</span><strong className="mt-2 block font-serif text-3xl">{value}</strong><span className={`mt-2 block text-xs ${subtle}`}>{detail}</span></Link>}
function Action({icon:Icon,value,label,href}:{icon:typeof Inbox;value:number;label:string;href:string}){return <Link href={href} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sand-light"><Icon className="size-4 text-gold"/></span><span className="min-w-0 flex-1 text-sm">{label}</span><strong className="font-serif text-2xl">{value}</strong></Link>}
function EmptyState({text}:{text:string}){return <div className="grid min-h-64 place-items-center p-10 text-center text-sm text-stone">{text}</div>}
