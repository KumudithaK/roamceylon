"use client";

import Link from "next/link";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {ArrowUpRight,Banknote,Building2,CircleDollarSign,Landmark,RefreshCw,TrendingUp,WalletCards} from "lucide-react";
import {AdminShell} from "./admin-shell";
import {createClient} from "@/lib/supabase/client";
import type {Database} from "@/lib/database.types";

type Account=Database["public"]["Tables"]["journey_accounts"]["Row"];
type Settlement=Database["public"]["Tables"]["journey_settlements"]["Row"];
type Enquiry=Pick<Database["public"]["Tables"]["enquiries"]["Row"],"id"|"status">;
const statusLabels={open:"Awaiting payment",part_paid:"Part paid",paid:"Customer paid",settled:"Fully settled",void:"Void"} as const;
const statusStyles={open:"bg-amber-100 text-amber-800",part_paid:"bg-sky-100 text-sky-800",paid:"bg-indigo-100 text-indigo-800",settled:"bg-emerald-100 text-emerald-800",void:"bg-stone/15 text-stone"} as const;
const payeeLabels={accommodation:"Hotels & stays",vehicle:"Fleet partners",guide:"Local guides",experience:"Experiences",destination:"Destination fees",operations:"Journey operations",other:"Other payments"} as const;
const money=(value:number,currency="USD")=>`${currency} ${value.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`;

export function AccountingOverview(){
  const router=useRouter();
  const [accounts,setAccounts]=useState<Account[]>([]);
  const [settlements,setSettlements]=useState<Settlement[]>([]);
  const [closed,setClosed]=useState<Enquiry[]>([]);
  const [loading,setLoading]=useState(true);
  const [syncing,setSyncing]=useState(false);
  const [message,setMessage]=useState("");
  const load=async()=>{
    const database=createClient();
    const {data:{session}}=await database.auth.getSession();
    if(!session){router.replace("/admin/login");return}
    const [accountResult,settlementResult,closedResult]=await Promise.all([
      database.from("journey_accounts").select("*").order("posted_at",{ascending:false}),
      database.from("journey_settlements").select("*").order("due_date",{ascending:true}),
      database.from("enquiries").select("id,status").eq("status","closed")
    ]);
    const error=accountResult.error||settlementResult.error||closedResult.error;
    if(error){setMessage(error.message.includes("journey_accounts")?"Apply the latest Supabase migration to activate Accounting.":error.message);setLoading(false);return}
    setAccounts(accountResult.data??[]);setSettlements(settlementResult.data??[]);setClosed(closedResult.data??[]);setLoading(false);
  };
  useEffect(()=>{void (async()=>{
    const database=createClient();
    const {data:{session}}=await database.auth.getSession();
    if(!session){router.replace("/admin/login");return}
    const [accountResult,settlementResult,closedResult]=await Promise.all([
      database.from("journey_accounts").select("*").order("posted_at",{ascending:false}),
      database.from("journey_settlements").select("*").order("due_date",{ascending:true}),
      database.from("enquiries").select("id,status").eq("status","closed")
    ]);
    const error=accountResult.error||settlementResult.error||closedResult.error;
    if(error){setMessage(error.message.includes("journey_accounts")?"Apply the latest Supabase migration to activate Accounting.":error.message);setLoading(false);return}
    setAccounts(accountResult.data??[]);setSettlements(settlementResult.data??[]);setClosed(closedResult.data??[]);setLoading(false);
  })()},[router]);
  const sync=async()=>{
    setSyncing(true);setMessage("");
    const {data:{session}}=await createClient().auth.getSession();
    const response=await fetch("/api/admin/accounting/post",{method:"POST",headers:{"content-type":"application/json",authorization:`Bearer ${session?.access_token??""}`},body:"{}"});
    const result=await response.json() as {posted?:string[];skipped?:Array<{reason:string}>;error?:string};
    setSyncing(false);
    if(!response.ok){setMessage(result.error??"Closed journeys could not be posted.");return}
    setMessage(`${result.posted?.length??0} closed journey${result.posted?.length===1?"":"s"} posted.${result.skipped?.length?` ${result.skipped.length} require pricing attention.`:""}`);
    await load();
  };
  const unposted=closed.filter(row=>!accounts.some(account=>account.enquiry_id===row.id)).length;
  const currency=accounts[0]?.currency??"USD";
  const revenue=accounts.filter(row=>row.status!=="void").reduce((total,row)=>total+row.selling_price,0);
  const received=accounts.filter(row=>row.status!=="void").reduce((total,row)=>total+row.amount_received,0);
  const projectedProfit=accounts.filter(row=>row.status!=="void").reduce((total,row)=>total+row.gross_profit,0);
  const savings=accounts.filter(row=>row.status!=="void").reduce((total,row)=>total+row.supplier_savings,0);
  const realizedProfit=projectedProfit+savings;
  const due=settlements.reduce((total,row)=>total+row.amount_due,0);
  const paid=settlements.reduce((total,row)=>total+row.amount_paid,0);
  const outstanding=Math.max(0,due-paid-savings);
  const cashPosition=received-paid;
  const typeTotals=Object.keys(payeeLabels).map(type=>{
    const rows=settlements.filter(row=>row.payee_type===type);
    return {type:type as keyof typeof payeeLabels,due:rows.reduce((sum,row)=>sum+row.amount_due,0),paid:rows.reduce((sum,row)=>sum+row.amount_paid,0),waived:rows.reduce((sum,row)=>sum+row.waived_amount,0)};
  }).filter(item=>item.due>0);
  if(loading)return <AdminShell><div className="min-h-[70vh] animate-pulse rounded-3xl bg-white"/></AdminShell>;
  return <AdminShell><div className="mx-auto max-w-[1500px]">
    <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow mb-3">Financial control</p><h1 className="font-serif text-4xl md:text-5xl">Journey accounting</h1><p className="mt-3 max-w-2xl text-sm text-slate/55">Revenue, customer receipts, supplier obligations and profitability for every closed journey.</p></div><button onClick={()=>void sync()} disabled={syncing} className="inline-flex items-center gap-2 rounded-full bg-forest px-5 py-3 text-sm font-bold text-white disabled:opacity-50"><RefreshCw className={`size-4 ${syncing?"animate-spin":""}`}/>{syncing?"Posting journeys…":unposted?`Post ${unposted} closed journey${unposted===1?"":"s"}`:"Accounts up to date"}</button></div>
    {message&&<div className="mt-6 rounded-2xl border border-gold/25 bg-gold/10 p-4 text-sm text-slate">{message}</div>}
    <section className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <Metric icon={CircleDollarSign} label="Journey revenue" value={money(revenue,currency)} detail={`${accounts.length} journey account${accounts.length===1?"":"s"}`} tone="gold"/>
      <Metric icon={Banknote} label="Customer receipts" value={money(received,currency)} detail={`${revenue?Math.round(received/revenue*100):0}% collected`} tone="forest"/>
      <Metric icon={Building2} label="Supplier outstanding" value={money(outstanding,currency)} detail={`${settlements.filter(row=>["pending","part_paid"].includes(row.status)).length} open settlements`} tone="light"/>
      <Metric icon={TrendingUp} label="Realized gross profit" value={money(realizedProfit,currency)} detail={`${money(savings,currency)} supplier savings added`} tone="light"/>
      <Metric icon={WalletCards} label="Cash position" value={money(cashPosition,currency)} detail="Receipts less supplier payments" tone={cashPosition>=0?"light":"danger"}/>
    </section>
    <section className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
      <div className="overflow-hidden rounded-3xl border border-stone/15 bg-white"><div className="flex items-center justify-between border-b border-stone/15 p-7"><div><p className="eyebrow mb-2">Journey ledger</p><h2 className="font-serif text-2xl">Closed journey accounts</h2></div><span className="text-xs text-stone">{accounts.length} total</span></div>{accounts.length?<div className="divide-y divide-stone/15">{accounts.map(account=>{
        const balance=Math.max(0,account.selling_price-account.amount_received);
        return <Link href={`/admin/accounting/${account.id}`} key={account.id} className="grid gap-4 p-5 transition hover:bg-sand-light lg:grid-cols-[1.2fr_.8fr_.7fr_.5fr] lg:items-center"><div><strong className="font-serif text-xl">{account.traveller_name}</strong><p className="mt-1 text-xs text-stone">{account.account_number} · {account.travel_start_date||"Flexible dates"}</p></div><div><span className={`rounded-full px-3 py-1 text-[.65rem] font-bold uppercase ${statusStyles[account.status]}`}>{statusLabels[account.status]}</span></div><div><span className="block text-xs text-stone">Balance to collect</span><strong className="text-sm text-forest">{money(balance,account.currency)}</strong></div><ArrowUpRight className="size-5 text-stone"/></Link>
      })}</div>:<Empty text="No journey accounts yet. Close a fully priced enquiry, then post it to Accounting."/>}</div>
      <div className="rounded-3xl bg-forest p-7 text-ivory"><p className="eyebrow mb-3 text-gold-light">Settlement control</p><h2 className="font-serif text-2xl">Supplier exposure</h2><div className="mt-7 grid gap-5">{typeTotals.length?typeTotals.map(item=>{const resolved=item.paid+item.waived;const progress=item.due?Math.min(100,resolved/item.due*100):0;return <div key={item.type}><div className="mb-2 flex justify-between gap-3 text-sm"><span className="text-ivory/65">{payeeLabels[item.type]}</span><strong>{money(Math.max(0,item.due-resolved),currency)}</strong></div><div className="h-2 rounded-full bg-white/10"><div className="h-full rounded-full bg-gold" style={{width:`${progress}%`}}/></div><p className="mt-1 text-[.65rem] text-ivory/40">{Math.round(progress)}% resolved · {money(item.waived,currency)} waived</p></div>}):<p className="text-sm leading-6 text-ivory/55">Supplier obligations will appear when a priced journey is posted.</p>}</div><div className="mt-8 border-t border-white/10 pt-6"><div className="flex justify-between text-sm"><span className="text-ivory/55">Total committed</span><strong>{money(due,currency)}</strong></div><div className="mt-2 flex justify-between text-sm"><span className="text-ivory/55">Already paid</span><strong>{money(paid,currency)}</strong></div><div className="mt-2 flex justify-between text-sm text-gold-light"><span>Courtesy savings</span><strong>{money(savings,currency)}</strong></div></div></div>
    </section>
    <section className="mt-6 rounded-3xl border border-stone/15 bg-white p-7"><div className="flex items-center gap-3"><Landmark className="text-gold"/><div><p className="eyebrow mb-1">How it works</p><h2 className="font-serif text-2xl">One commercial truth per journey</h2></div></div><div className="mt-6 grid gap-4 md:grid-cols-4">{["Close a fully priced traveller enquiry.","Freeze revenue, internal cost and margin.","Track customer receipts and supplier dues.","Finish when customer and partners are settled."].map((text,index)=><div key={text} className="rounded-2xl bg-sand-light p-5"><span className="font-serif text-3xl text-gold">0{index+1}</span><p className="mt-3 text-sm leading-6 text-slate/65">{text}</p></div>)}</div></section>
  </div></AdminShell>;
}

function Metric({icon:Icon,label,value,detail,tone}:{icon:typeof Banknote;label:string;value:string;detail:string;tone:"gold"|"forest"|"light"|"danger"}){
  const style=tone==="gold"?"bg-gold text-slate":tone==="forest"?"bg-forest text-ivory":tone==="danger"?"bg-red-950 text-white":"border border-stone/15 bg-white text-slate";
  const subtle=tone==="forest"||tone==="danger"?"text-white/55":"text-stone";
  return <article className={`rounded-3xl p-6 shadow-sm ${style}`}><span className={`grid size-11 place-items-center rounded-2xl ${tone==="light"?"bg-sand-light":"bg-white/15"}`}><Icon className="size-5"/></span><span className={`mt-6 block text-[.65rem] font-bold uppercase tracking-widest ${subtle}`}>{label}</span><strong className="mt-2 block font-serif text-2xl">{value}</strong><span className={`mt-2 block text-xs ${subtle}`}>{detail}</span></article>;
}
function Empty({text}:{text:string}){return <div className="grid min-h-64 place-items-center p-10 text-center text-sm text-stone">{text}</div>}
