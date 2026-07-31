"use client";

import {FormEvent,useCallback,useEffect,useState} from "react";
import {AlertTriangle,Check,RefreshCcw,ShieldCheck} from "lucide-react";
import {Button} from "@/components/ui/button";
import {createClient} from "@/lib/supabase/client";
import {calculateCancellationPosition} from "@/lib/accounting/cancellation";
import type {Database} from "@/lib/database.types";

type Account=Database["public"]["Tables"]["journey_accounts"]["Row"];
type Settlement=Database["public"]["Tables"]["journey_settlements"]["Row"];
type Transaction=Database["public"]["Tables"]["accounting_transactions"]["Row"];
type Cancellation=Database["public"]["Tables"]["journey_cancellation_cases"]["Row"];

const resolutions={
  not_reviewed:"Not reviewed",
  cancelled_without_cost:"Cancelled without cost",
  recoverable:"Paid amount recoverable",
  waived:"Waived by supplier",
  non_recoverable:"Non-recoverable cost"
} as const;
const stages=["assessment","calculated","approved","refunded","closed"] as const;
const money=(value:number,currency:string)=>`${currency} ${value.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const today=()=>new Date().toISOString().slice(0,10);

export function CancellationWorkflow({account,settlements,transactions,onUpdated,onRecordRefund}:{account:Account;settlements:Settlement[];transactions:Transaction[];onUpdated:()=>Promise<void>;onRecordRefund:(maximum:number)=>void}){
  const [cancellation,setCancellation]=useState<Cancellation|null>(null);
  const [message,setMessage]=useState("");
  const [saving,setSaving]=useState(false);
  const [recovery,setRecovery]=useState<Settlement|null>(null);
  const load=useCallback(async()=>{
    const {data}=await createClient().from("journey_cancellation_cases").select("*").eq("account_id",account.id).maybeSingle();
    setCancellation(data??null);
  },[account.id]);
  useEffect(()=>{const timer=window.setTimeout(()=>void load(),0);return()=>window.clearTimeout(timer)},[load]);

  const request=async(payload:Record<string,unknown>)=>{
    setSaving(true);setMessage("");
    try{
      const {data:{session}}=await createClient().auth.getSession();
      const response=await fetch("/api/admin/accounting/cancellations",{method:"POST",headers:{"content-type":"application/json",authorization:`Bearer ${session?.access_token??""}`},body:JSON.stringify({accountId:account.id,...payload})});
      const result=await response.json() as {error?:string};
      if(!response.ok)throw new Error(result.error??"The cancellation could not be updated.");
      setMessage("Cancellation record updated.");await load();await onUpdated();
    }catch(error){setMessage(error instanceof Error?error.message:"The cancellation could not be updated.")}
    finally{setSaving(false)}
  };
  const review=async(event:FormEvent<HTMLFormElement>,settlement:Settlement)=>{
    event.preventDefault();const form=new FormData(event.currentTarget);
    await request({action:"review_settlement",settlementId:settlement.id,resolution:String(form.get("resolution")),nonRecoverableAmount:Number(form.get("amount")||0),notes:String(form.get("notes")||"")});
  };
  const calculate=async(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();const form=new FormData(event.currentTarget);
    await request({action:"calculate",cancellationFee:Number(form.get("fee")||0),otherNonRecoverableCost:Number(form.get("other")||0),notes:String(form.get("notes")||"")});
  };
  const recordRecovery=async(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();if(!recovery)return;setSaving(true);setMessage("");
    const form=new FormData(event.currentTarget);
    try{
      const {data:{session}}=await createClient().auth.getSession();
      const response=await fetch("/api/admin/accounting/transactions",{method:"POST",headers:{"content-type":"application/json",authorization:`Bearer ${session?.access_token??""}`},body:JSON.stringify({accountId:account.id,settlementId:recovery.id,type:"supplier_recovery",amount:Number(form.get("amount")),waivedAmount:0,paymentDate:String(form.get("date")),paymentMethod:String(form.get("method")),reference:String(form.get("reference")||""),notes:String(form.get("notes")||"")})});
      const result=await response.json() as {error?:string};if(!response.ok)throw new Error(result.error??"Supplier recovery could not be recorded.");
      setRecovery(null);setMessage("Supplier recovery recorded.");await load();await onUpdated();
    }catch(error){setMessage(error instanceof Error?error.message:"Supplier recovery could not be recorded.")}
    finally{setSaving(false)}
  };

  if(!cancellation)return <section className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900"><strong>Cancellation assessment is being prepared.</strong><p className="mt-1">Refresh after the cancelled Traveller Enquiry has finished updating.</p></section>;

  const grossPaid=transactions.filter(row=>row.transaction_type==="customer_receipt").reduce((total,row)=>total+row.amount,0);
  const supplierCommitments=settlements.reduce((total,row)=>total+row.amount_due,0);
  const supplierPayments=transactions.filter(row=>row.transaction_type==="supplier_payment").reduce((total,row)=>total+row.amount,0);
  const supplierRecoveries=transactions.filter(row=>row.transaction_type==="supplier_recovery").reduce((total,row)=>total+row.amount,0);
  const approved=cancellation.approved_refund;
  const position=calculateCancellationPosition({customerPaid:grossPaid,supplierNonRecoverable:cancellation.supplier_non_recoverable,cancellationFee:cancellation.cancellation_fee,otherNonRecoverableCost:cancellation.other_non_recoverable_cost,approvedRefund:approved??(cancellation.status==="calculated"?cancellation.calculated_refund:null),amountRefunded:account.amount_refunded});
  const refundLiability=position.refundLiability;
  const cancellationResult=position.cancellationProfitLoss;
  const currentStage=cancellation.status==="part_refunded"?"approved":cancellation.status;
  const locked=["approved","part_refunded","refunded","closed"].includes(cancellation.status);
  const allReviewed=settlements.every(row=>row.cancellation_resolution!=="not_reviewed");

  return <section className="mt-6 rounded-3xl border border-orange-200 bg-white p-7">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="eyebrow mb-2 text-orange-700">Cancellation control</p><h2 className="font-serif text-3xl">Refund assessment</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-stone">Confirm what each supplier will charge after cancellation. Commitments alone never reduce the traveller refund.</p></div><span className="rounded-full bg-orange-100 px-4 py-2 text-xs font-bold uppercase text-orange-800">{cancellation.status.replace("_"," ")}</span></div>
    <div className="mt-6 grid gap-2 md:grid-cols-5">{stages.map((stage,index)=>{const reached=stages.indexOf(currentStage as typeof stages[number])>=index;return <div key={stage} className={`flex items-center gap-2 rounded-xl px-3 py-3 text-xs font-bold ${reached?"bg-forest text-white":"bg-sand-light text-stone"}`}>{reached?<Check className="size-4"/>:<span className="grid size-4 place-items-center rounded-full border text-[.55rem]">{index+1}</span>}{stage.replace("_"," ")}</div>})}</div>
    {message&&<p className={`mt-5 rounded-xl p-3 text-sm ${message.includes("updated")||message.includes("recorded")?"bg-emerald-50 text-emerald-800":"bg-red-50 text-red-800"}`}>{message}</p>}

    <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      <Metric label="Journey value" value={money(account.selling_price,account.currency)}/>
      <Metric label="Deposit received" value={money(grossPaid,account.currency)}/>
      <Metric label="Supplier commitments" value={money(supplierCommitments,account.currency)}/>
      <Metric label="Supplier payments made" value={money(supplierPayments,account.currency)} detail={supplierRecoveries?`${money(supplierRecoveries,account.currency)} recovered`:undefined}/>
      <Metric label="Refund liability" value={locked||cancellation.status==="calculated"?money(refundLiability,account.currency):"Pending review"}/>
      <Metric label="Cancellation result" value={locked||cancellation.status==="calculated"?money(cancellationResult,account.currency):"Not calculated"} detail="Final profit / loss forecast"/>
    </div>

    <div className="mt-7"><h3 className="font-serif text-2xl">Supplier recoverability</h3><div className="mt-3 divide-y divide-stone/15 rounded-2xl border border-stone/15">{settlements.length?settlements.map(row=><form key={row.id} onSubmit={event=>void review(event,row)} className="grid gap-3 p-4 lg:grid-cols-[1.1fr_210px_150px_1fr_auto] lg:items-end"><div><strong className="text-sm">{row.payee_name}</strong><span className="mt-1 block text-xs text-stone">{money(row.amount_due,row.currency)} committed · {money(row.amount_paid,row.currency)} currently paid</span></div><label className="grid gap-1 text-xs font-semibold">Outcome<select disabled={locked} name="resolution" defaultValue={row.cancellation_resolution} className="rounded-lg border border-stone/25 bg-white px-3 py-2"><option value="not_reviewed" disabled>Choose outcome</option>{Object.entries(resolutions).filter(([key])=>key!=="not_reviewed").map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label><label className="grid gap-1 text-xs font-semibold">Cost retained ({row.currency})<input disabled={locked} name="amount" type="number" min="0" max={row.amount_due} step=".01" defaultValue={row.cancellation_non_recoverable_amount.toFixed(2)} className="rounded-lg border border-stone/25 px-3 py-2"/></label><label className="grid gap-1 text-xs font-semibold">Supplier confirmation<input disabled={locked} name="notes" defaultValue={row.cancellation_notes??""} placeholder="Reference or notes" className="rounded-lg border border-stone/25 px-3 py-2"/></label><div className="flex gap-2">{!locked&&<button disabled={saving} className="rounded-full border border-forest/20 px-4 py-2 text-xs font-bold">Save</button>}{row.cancellation_resolution==="recoverable"&&row.amount_paid>0&&<button type="button" onClick={()=>setRecovery(row)} className="rounded-full bg-forest px-4 py-2 text-xs font-bold text-white">Recovered</button>}</div></form>):<p className="p-5 text-sm text-stone">No supplier commitments were created for this journey.</p>}</div></div>

    {!locked&&<form onSubmit={event=>void calculate(event)} className="mt-7 grid gap-4 rounded-2xl bg-sand-light p-5 md:grid-cols-2"><div className="md:col-span-2"><h3 className="font-serif text-2xl">Refund calculation</h3><p className="mt-1 text-xs text-stone">The approved refund cannot exceed customer payments after verified non-recoverable costs.</p></div><label className="grid gap-2 text-sm font-semibold">Cancellation fee ({account.currency})<input name="fee" type="number" min="0" step=".01" defaultValue={cancellation.cancellation_fee.toFixed(2)} className="rounded-xl border border-stone/25 px-4 py-3"/></label><label className="grid gap-2 text-sm font-semibold">Other non-recoverable costs ({account.currency})<input name="other" type="number" min="0" step=".01" defaultValue={cancellation.other_non_recoverable_cost.toFixed(2)} className="rounded-xl border border-stone/25 px-4 py-3"/></label><label className="grid gap-2 text-sm font-semibold md:col-span-2">Calculation notes<textarea name="notes" rows={3} defaultValue={cancellation.calculation_notes??""} className="rounded-xl border border-stone/25 px-4 py-3"/></label><div className="flex flex-wrap items-center justify-between gap-3 md:col-span-2"><span className={`text-xs ${allReviewed?"text-emerald-700":"text-orange-700"}`}>{allReviewed?"Every supplier commitment has been reviewed.":"Review every supplier commitment first."}</span><Button disabled={saving||!allReviewed} type="submit">Calculate refund</Button></div></form>}

    {cancellation.status==="calculated"&&<div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gold/30 bg-gold/10 p-5"><div><span className="text-xs font-bold uppercase tracking-widest text-stone">Calculated traveller refund</span><strong className="mt-1 block font-serif text-3xl">{money(cancellation.calculated_refund,account.currency)}</strong></div><Button disabled={saving} onClick={()=>void request({action:"approve"})}><ShieldCheck/>Approve refund</Button></div>}
    {["approved","part_refunded"].includes(cancellation.status)&&<div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-forest p-5 text-white"><div><span className="text-xs font-bold uppercase tracking-widest text-white/55">Approved refund remaining</span><strong className="mt-1 block font-serif text-3xl">{money(refundLiability,account.currency)}</strong></div><Button disabled={saving||refundLiability<=0} onClick={()=>onRecordRefund(refundLiability)}>Record refund payment</Button></div>}
    {cancellation.status==="refunded"&&<div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-emerald-50 p-5 text-emerald-900"><div className="flex gap-3"><ShieldCheck className="size-5"/><div><strong>Approved traveller refund paid</strong><p className="mt-1 text-xs">Close once expected supplier recoveries are complete.</p></div></div><Button disabled={saving} onClick={()=>void request({action:"close"})}>Close cancellation</Button></div>}
    {cancellation.status==="closed"&&<div className="mt-6 flex gap-3 rounded-2xl bg-emerald-50 p-5 text-sm text-emerald-900"><ShieldCheck className="size-5"/><div><strong>Cancellation finances closed</strong><p className="mt-1">The approved refund and supplier recovery review are complete. The audit history remains available below.</p></div></div>}
    {recovery&&<div className="fixed inset-0 z-50 grid place-items-center bg-slate/65 p-4 backdrop-blur-sm"><form onSubmit={event=>void recordRecovery(event)} className="w-full max-w-lg rounded-3xl bg-ivory p-7"><p className="eyebrow mb-2">Supplier recovery</p><h2 className="font-serif text-3xl">Record funds returned</h2><p className="mt-2 text-sm text-stone">{recovery.payee_name} · maximum {money(recovery.amount_paid,recovery.currency)}</p><div className="mt-6 grid gap-4"><label className="grid gap-2 text-sm font-semibold">Amount recovered ({recovery.currency})<input required name="amount" type="number" min=".01" max={recovery.amount_paid} step=".01" defaultValue={recovery.amount_paid.toFixed(2)} className="rounded-xl border border-stone/25 px-4 py-3"/></label><label className="grid gap-2 text-sm font-semibold">Date<input required name="date" type="date" defaultValue={today()} className="rounded-xl border border-stone/25 px-4 py-3"/></label><label className="grid gap-2 text-sm font-semibold">Method<select name="method" className="rounded-xl border border-stone/25 px-4 py-3"><option>Bank transfer</option><option>Card reversal</option><option>Cash</option><option>Other</option></select></label><label className="grid gap-2 text-sm font-semibold">Reference<input name="reference" className="rounded-xl border border-stone/25 px-4 py-3"/></label><label className="grid gap-2 text-sm font-semibold">Notes<textarea name="notes" rows={2} className="rounded-xl border border-stone/25 px-4 py-3"/></label><div className="flex justify-end gap-3"><Button type="button" variant="ghost" onClick={()=>setRecovery(null)}>Cancel</Button><Button disabled={saving}><RefreshCcw/>Record recovery</Button></div></div></form></div>}
    {!allReviewed&&!locked&&<div className="mt-5 flex gap-3 rounded-xl bg-orange-50 p-4 text-xs leading-5 text-orange-900"><AlertTriangle className="size-4 shrink-0"/>Do not promise a refund until every supplier confirms whether its commitment is cancellable, recoverable, waived, or non-recoverable.</div>}
  </section>;
}

function Metric({label,value,detail}:{label:string;value:string;detail?:string}){return <div className="rounded-2xl bg-sand-light p-4"><span className="block text-[.6rem] font-bold uppercase tracking-widest text-stone">{label}</span><strong className="mt-2 block font-serif text-xl">{value}</strong>{detail&&<span className="mt-1 block text-[.65rem] text-stone">{detail}</span>}</div>}
