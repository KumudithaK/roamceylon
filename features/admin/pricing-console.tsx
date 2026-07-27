"use client";

import Link from "next/link";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {createClient} from "@/lib/supabase/client";
import {Button} from "@/components/ui/button";
import type {AdminPackageQuote,PackageQuoteRequest} from "@/lib/pricing/package-types";
import type {Database} from "@/lib/database.types";
import type {JourneyState} from "@/features/journey/journey-store";

type Config=Database["public"]["Tables"]["tour_pricing_config"]["Row"];
type SupplierInsert=Database["public"]["Tables"]["tour_supplier_costs"]["Insert"];
const configFields=[
  ["room_occupancy","Travellers / room"],["child_cost_factor","Child cost factor"],["route_distance_buffer_percent","Route distance allowance %"],
  ["driver_salary_per_day","Driver salary / day"],["fuel_price_per_litre","Fuel price / litre"],["vehicle_km_per_litre","Vehicle km / litre"],
  ["tolls_per_journey","Tolls / journey"],["parking_per_day","Parking / day"],["guide_accommodation_per_night","Guide accommodation / night"],
  ["airport_transfer_each_way","Airport transfer / way"],["administration_fixed","Administration fixed"],["administration_percent","Administration %"],
  ["contingency_percent","Contingency %"],["service_fee_fixed","Service fee fixed"],["service_fee_percent","Service fee %"],
  ["target_profit_margin_percent","Target profit margin %"]
] as const;

const savedRequest=():PackageQuoteRequest|null=>{
  try{
    const saved=localStorage.getItem("roam-ceylon-journey-v2");if(!saved)return null;
    const state=(JSON.parse(saved) as {state?:JourneyState}).state;if(!state)return null;
    return {selectedDestinationIds:state.selectedDestinationIds,selectedExperienceIds:state.selectedExperienceIds,selectedStayIds:Object.values(state.selectedStayIdsByDestination).filter(Boolean),selectedVehicleId:state.selectedVehicleId,selectedGuideId:state.selectedGuideId,travelDates:state.travelDates,travellerCounts:state.travellerCounts};
  }catch{return null}
};

export function PricingConsole(){
  const router=useRouter();
  const [config,setConfig]=useState<Config|null>(null);
  const [quote,setQuote]=useState<AdminPackageQuote|null>(null);
  const [message,setMessage]=useState("");
  const [supplier,setSupplier]=useState<SupplierInsert>({entity_type:"experience",entity_id:"",cost_category:"Supplier net cost",unit:"per_person",amount:0,currency:"USD",active:true});
  const [costCount,setCostCount]=useState(0);
  useEffect(()=>{void (async()=>{
    const database=createClient();const {data:{session}}=await database.auth.getSession();
    if(!session){router.replace("/admin/login");return}
    const [{data:settings},{count}]=await Promise.all([database.from("tour_pricing_config").select("*").eq("id",true).single(),database.from("tour_supplier_costs").select("*",{count:"exact",head:true})]);
    setConfig(settings);setCostCount(count??0);
    const request=savedRequest();
    if(request?.selectedDestinationIds.length){
      const response=await fetch("/api/admin/quotes",{method:"POST",headers:{"content-type":"application/json",authorization:`Bearer ${session.access_token}`},body:JSON.stringify(request)});
      if(response.ok)setQuote(await response.json());
    }
  })()},[router]);
  const saveConfig=async()=>{if(!config)return;const {error}=await createClient().from("tour_pricing_config").update(config).eq("id",true);setMessage(error?error.message:"Pricing configuration saved.")};
  const addSupplier=async()=>{const {error}=await createClient().from("tour_supplier_costs").insert(supplier);if(error){setMessage(error.message);return}setCostCount(value=>value+1);setMessage("Supplier cost saved.")};
  return <main className="min-h-screen bg-[#f4f3ef] p-6 md:p-10"><div className="mx-auto max-w-6xl"><Link href="/admin/dashboard" className="text-sm font-semibold text-forest">← Admin dashboard</Link><p className="eyebrow mb-3 mt-8">Confidential</p><h1 className="font-serif text-5xl">Tour Package Pricing</h1><p className="mt-3 text-slate/60">Supplier costs and margins are visible only to authorised Roam Ceylon staff.</p>{message&&<p className="mt-5 rounded-xl bg-white p-4 text-sm">{message}</p>}<div className="mt-10 grid gap-6 xl:grid-cols-2"><section className="rounded-3xl bg-white p-7"><h2 className="font-serif text-2xl">Operational configuration</h2>{config?<div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-xs font-bold uppercase tracking-wider text-stone">Currency<input maxLength={3} value={config.currency} onChange={event=>setConfig({...config,currency:event.target.value.toUpperCase()})} className="rounded-xl border border-stone/25 px-4 py-3 text-base font-normal uppercase tracking-normal text-slate"/></label>{configFields.map(([field,label])=><label key={field} className="grid gap-2 text-xs font-bold uppercase tracking-wider text-stone">{label}<input type="number" min="0" step="0.01" value={config[field]??""} onChange={event=>setConfig({...config,[field]:event.target.value===""?null:Number(event.target.value)})} className="rounded-xl border border-stone/25 px-4 py-3 text-base font-normal normal-case tracking-normal text-slate"/></label>)}<Button onClick={saveConfig} className="sm:col-span-2">Save pricing configuration</Button></div>:<p className="mt-6 text-sm text-stone">Apply the DMC pricing migration to configure operational costs.</p>}</section><section className="rounded-3xl bg-white p-7"><h2 className="font-serif text-2xl">Supplier costs</h2><p className="mt-2 text-sm text-stone">{costCount} confidential cost records configured.</p><div className="mt-6 grid gap-4"><select value={supplier.entity_type} onChange={event=>setSupplier({...supplier,entity_type:event.target.value as SupplierInsert["entity_type"]})} className="rounded-xl border border-stone/25 px-4 py-3"><option value="accommodation">Accommodation</option><option value="vehicle">Vehicle</option><option value="guide">Guide</option><option value="experience">Experience</option><option value="destination">Destination ticket</option></select><input value={supplier.entity_id} onChange={event=>setSupplier({...supplier,entity_id:event.target.value})} placeholder="Supabase record UUID" className="rounded-xl border border-stone/25 px-4 py-3"/><input value={supplier.cost_category} onChange={event=>setSupplier({...supplier,cost_category:event.target.value})} placeholder="Cost category" className="rounded-xl border border-stone/25 px-4 py-3"/><select value={supplier.unit} onChange={event=>setSupplier({...supplier,unit:event.target.value as SupplierInsert["unit"]})} className="rounded-xl border border-stone/25 px-4 py-3"><option value="per_room_night">Per room/night</option><option value="per_vehicle_day">Per vehicle/day</option><option value="per_kilometre">Per kilometre</option><option value="per_guide_day">Per guide/day</option><option value="per_person">Per person</option><option value="per_transfer">Per transfer</option><option value="fixed">Fixed</option></select><input type="number" min="0" step=".01" value={supplier.amount??0} onChange={event=>setSupplier({...supplier,amount:Number(event.target.value)})} className="rounded-xl border border-stone/25 px-4 py-3"/><input maxLength={3} value={supplier.currency??""} onChange={event=>setSupplier({...supplier,currency:event.target.value.toUpperCase()})} placeholder="Currency" className="rounded-xl border border-stone/25 px-4 py-3 uppercase"/><Button onClick={addSupplier}>Add supplier cost</Button></div></section></div><section className="mt-6 rounded-3xl bg-slate p-7 text-ivory"><h2 className="font-serif text-2xl">Current saved journey</h2>{quote?<><div className="mt-6 grid gap-4 sm:grid-cols-4"><Metric label="Internal Cost" value={quote.internalCost}/><Metric label="Selling Price" value={quote.sellingPrice}/><Metric label="Gross Profit" value={quote.grossProfit}/><Metric label="Profit Margin" value={quote.profitMargin} suffix="%"/></div><div className="mt-8 grid gap-2">{quote.breakdown.map(line=><div key={line.key} className="flex justify-between border-b border-white/10 py-3 text-sm"><span>{line.label}</span><strong>{quote.public.currency} {line.amount.toFixed(2)}</strong></div>)}</div>{quote.missingInputs.length>0&&<div className="mt-6 rounded-xl bg-amber-400/10 p-4 text-sm text-amber-100">Missing configuration: {quote.missingInputs.join(", ")}</div>}</>:<p className="mt-4 text-sm text-ivory/55">Build and save a journey in this browser to inspect its internal package costing.</p>}</section></div></main>;
}

function Metric({label,value,suffix=""}:{label:string;value:number|null;suffix?:string}){return <div className="rounded-2xl bg-white/5 p-4"><span className="text-xs text-white/50">{label}</span><strong className="mt-2 block font-serif text-2xl">{value===null?"—":`${value.toFixed(2)}${suffix}`}</strong></div>}
