"use client";

import Link from "next/link";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {CircleCheck,Info} from "lucide-react";
import {Button} from "@/components/ui/button";
import {createClient} from "@/lib/supabase/client";
import type {Database} from "@/lib/database.types";

type Config=Database["public"]["Tables"]["tour_pricing_config"]["Row"];
type EstimateBand=Database["public"]["Tables"]["journey_estimate_bands"]["Row"];
type NumericKey=Exclude<{
  [Key in keyof Config]:Config[Key] extends number|null?Key:never
}[keyof Config],undefined>;
type Section="calculation"|"operations"|"fees"|"estimates";

const sections:Array<{id:Section;label:string;description:string}>=[
  {id:"calculation",label:"Calculation",description:"Currency, occupancy and route assumptions"},
  {id:"operations",label:"Operations",description:"Internal transport and guide costs"},
  {id:"fees",label:"Fees & Margin",description:"Overheads, contingency and selling margin"},
  {id:"estimates",label:"Public Estimates",description:"Planning ranges shown during journey design"}
];

const requiredFields:NumericKey[]=[
  "driver_salary_per_day","fuel_price_per_litre","vehicle_km_per_litre",
  "tolls_per_journey","parking_per_day","guide_accommodation_per_night",
  "airport_transfer_each_way","administration_fixed","administration_percent",
  "contingency_percent","service_fee_fixed","service_fee_percent",
  "target_profit_margin_percent"
];

export function BusinessPricingSettings(){
  const router=useRouter();
  const [config,setConfig]=useState<Config|null>(null);
  const [bands,setBands]=useState<EstimateBand[]>([]);
  const [section,setSection]=useState<Section>("calculation");
  const [message,setMessage]=useState("");
  const [saving,setSaving]=useState(false);

  useEffect(()=>{void (async()=>{
    const database=createClient();
    const {data:{session}}=await database.auth.getSession();
    if(!session){router.replace("/admin/login");return}
    const [{data,error},{data:bandData,error:bandError}]=await Promise.all([database.from("tour_pricing_config").select("*").eq("id",true).maybeSingle(),database.from("journey_estimate_bands").select("*").order("sort_order")]);
    if(error||bandError){setMessage(error?.message??bandError?.message??"Pricing settings could not be loaded.");return}
    if(!data){setMessage("Business pricing has not been initialized. Apply the latest Supabase migrations first.");return}
    setConfig(data);
    setBands(bandData??[]);
  })()},[router]);

  const setNumber=(key:NumericKey,input:string)=>{
    if(!config)return;
    setConfig({...config,[key]:input===""?null:Number(input)});
  };
  const save=async()=>{
    if(!config)return;
    const missing=requiredFields.filter(key=>config[key]===null||!Number.isFinite(config[key]));
    if(missing.length){setMessage("Complete every required business pricing field before saving.");return}
    if(!/^[A-Z]{3}$/.test(config.currency)){setMessage("Currency must be a three-letter code such as USD or LKR.");return}
    if(config.room_occupancy<1){setMessage("Room occupancy must be at least 1.");return}
    if(config.child_cost_factor<0||config.child_cost_factor>1){setMessage("Child cost factor must be between 0 and 1.");return}
    if(config.target_profit_margin_percent!>=100){setMessage("Target profit margin must be below 100%.");return}
    if(config.estimate_lower_buffer_percent<0||config.estimate_lower_buffer_percent>=100||config.estimate_upper_buffer_percent<0){setMessage("Estimate buffers must be valid non-negative percentages; the lower buffer must remain below 100%.");return}
    const invalidBand=bands.find(item=>item.active&&(item.minimum===null||item.maximum===null||item.minimum<0||item.maximum<item.minimum));
    if(invalidBand){setMessage(`Complete a valid minimum and maximum for ${invalidBand.label}.`);return}
    setSaving(true);setMessage("");
    const database=createClient();
    const {data:{user}}=await database.auth.getUser();
    const {id,updated_at,updated_by,...changes}=config;void id;void updated_at;void updated_by;
    const {data,error}=await database.from("tour_pricing_config").update({...changes,active:true,updated_by:user?.id??null}).eq("id",true).select("*").single();
    const bandChanges=bands.map(band=>({key:band.key,category:band.category,label:band.label,minimum:band.minimum,maximum:band.maximum,unit:band.unit,active:band.active,sort_order:band.sort_order,notes:band.notes,updated_by:user?.id??band.updated_by}));
    const {error:bandsError}=error?{error:null}:await database.from("journey_estimate_bands").upsert(bandChanges,{onConflict:"key"});
    setSaving(false);
    if(error||bandsError){setMessage(error?.message??bandsError?.message??"Pricing settings could not be saved.");return}
    setConfig(data);setMessage("Business pricing and public planning assumptions saved.");
  };

  if(!config)return <main className="grid min-h-screen place-items-center bg-[#f4f3ef]"><p className="max-w-xl px-6 text-center text-stone">{message||"Loading business pricing…"}</p></main>;
  const complete=requiredFields.every(key=>config[key]!==null&&Number.isFinite(config[key]));
  return <main className="min-h-screen bg-[#f4f3ef] p-6 md:p-10"><div className="mx-auto max-w-6xl">
    <Link href="/admin/dashboard" className="text-sm font-semibold text-forest">← Admin dashboard</Link>
    <div className="mt-8 flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow mb-3">Business settings</p><h1 className="font-serif text-4xl md:text-5xl">Pricing</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate/60">Set Roam Ceylon’s confidential operating costs and selling rules. Hotel, vehicle, guide and experience rates remain inside their own editors.</p></div><Button onClick={()=>void save()} disabled={saving}>{saving?"Saving…":"Save settings"}</Button></div>
    {message&&<p className={`mt-5 rounded-xl p-4 text-sm ${message.includes("saved")?"bg-forest/10 text-forest":"bg-white text-red-700"}`}>{message}</p>}
    <div className="mt-8 grid gap-6 lg:grid-cols-[260px_1fr]"><aside className="h-fit rounded-3xl border border-stone/15 bg-white p-3">{sections.map(item=><button key={item.id} onClick={()=>setSection(item.id)} className={`w-full rounded-2xl p-4 text-left transition ${section===item.id?"bg-forest text-ivory":"hover:bg-sand-light"}`}><strong className="block text-sm">{item.label}</strong><span className={`mt-1 block text-xs ${section===item.id?"text-ivory/60":"text-stone"}`}>{item.description}</span></button>)}<div className={`mt-3 flex items-start gap-2 rounded-2xl p-4 text-xs leading-5 ${complete?"bg-forest/10 text-forest":"bg-gold/10 text-slate"}`}>{complete?<CircleCheck className="mt-0.5 size-4 shrink-0"/>:<Info className="mt-0.5 size-4 shrink-0"/>}{complete?"All required business settings are complete.":"Complete all required fields to enable automatic package prices."}</div></aside>
      <section className="rounded-3xl border border-stone/15 bg-white p-6 md:p-8">
        {section==="calculation"&&<Calculation config={config} setConfig={setConfig} setNumber={setNumber}/>}
        {section==="operations"&&<Operations config={config} setNumber={setNumber}/>}
        {section==="fees"&&(
          <Fees config={config} setNumber={setNumber}/>
        )}
        {section==="estimates"&&(
          <PublicEstimates config={config} setNumber={setNumber} bands={bands} setBands={setBands}/>
        )}
      </section>
    </div>
  </div></main>;
}

type NumbersProps={config:Config;setNumber:(key:NumericKey,input:string)=>void};
function Calculation({config,setConfig,setNumber}:NumbersProps&{setConfig:(value:Config)=>void}){
  return <><Heading title="Calculation assumptions" text="These values determine traveller quantities and route-related costs."/><Grid><Field label="Selling currency" help="Three-letter currency code used for package prices."><input maxLength={3} value={config.currency} onChange={event=>setConfig({...config,currency:event.target.value.toUpperCase()})}/></Field><Field label="Guests per room"><input type="number" min="1" step="1" value={config.room_occupancy} onChange={event=>setNumber("room_occupancy",event.target.value)}/></Field><Field label="Child cost factor" help="Use 1 for full adult cost or 0.5 for half cost."><input type="number" min="0" max="1" step=".05" value={config.child_cost_factor} onChange={event=>setNumber("child_cost_factor",event.target.value)}/></Field><Field label="Route distance buffer (%)" help="Allows for local driving beyond the mapped route."><input type="number" min="0" step=".5" value={config.route_distance_buffer_percent} onChange={event=>setNumber("route_distance_buffer_percent",event.target.value)}/></Field></Grid></>;
}
function Operations({config,setNumber}:NumbersProps){
  return <><Heading title="Operational costs" text="Internal DMC costs used only by the secure pricing engine. Travellers never see this breakdown."/><Grid><Money label="Driver salary per day" field="driver_salary_per_day" {...{config,setNumber}}/><Money label="Fuel price per litre" field="fuel_price_per_litre" {...{config,setNumber}}/><Field label="Vehicle efficiency (km/litre)"><input type="number" min=".1" step=".1" value={config.vehicle_km_per_litre??""} onChange={event=>setNumber("vehicle_km_per_litre",event.target.value)}/></Field><Money label="Tolls per journey" field="tolls_per_journey" {...{config,setNumber}}/><Money label="Parking per day" field="parking_per_day" {...{config,setNumber}}/><Money label="Guide accommodation per night" field="guide_accommodation_per_night" {...{config,setNumber}}/><Money label="Airport transfer each way" field="airport_transfer_each_way" {...{config,setNumber}}/></Grid></>;
}
function Fees({config,setNumber}:NumbersProps){
  return <><Heading title="Fees and target margin" text="Combine fixed and percentage amounts to match Roam Ceylon’s commercial model. Enter 0 when a fee does not apply."/><Grid><Money label="Administration fee (fixed)" field="administration_fixed" {...{config,setNumber}}/><Percent label="Administration fee (%)" field="administration_percent" {...{config,setNumber}}/><Percent label="Contingency (%)" field="contingency_percent" {...{config,setNumber}}/><Money label="Roam Ceylon service fee (fixed)" field="service_fee_fixed" {...{config,setNumber}}/><Percent label="Roam Ceylon service fee (%)" field="service_fee_percent" {...{config,setNumber}}/><Percent label="Target profit margin (%)" field="target_profit_margin_percent" max={99.99} {...{config,setNumber}}/></Grid></>;
}
function PublicEstimates({config,setNumber,bands,setBands}:NumbersProps&{bands:EstimateBand[];setBands:(value:EstimateBand[])=>void}){
  const update=(key:string,changes:Partial<EstimateBand>)=>setBands(bands.map(item=>item.key===key?{...item,...changes}:item));
  const groups:Array<{category:EstimateBand["category"];title:string;description:string}>=[
    {category:"stay",title:"Stay preferences",description:"Cost per billable traveller, per night."},
    {category:"transport",title:"Travel preferences",description:"Private transport is per journey leg; train and floatplane bands are per billable traveller per leg."},
    {category:"guide",title:"Guide preferences",description:"Cost per guide service day."},
    {category:"experience",title:"Experience fallback",description:"Cost per participant when a selected ticket does not yet have a usable rate."}
  ];
  return <><Heading title="Public journey estimates" text="These confidential planning assumptions fill ordinary catalogue gaps while the traveller designs a journey. Published supplier rates are always preferred. They do not set proposal or Accounting prices."/>
    <div className="mt-6 rounded-2xl border border-gold/20 bg-sand-light p-5"><strong className="font-serif text-xl">Planning envelope</strong><p className="mt-2 text-xs leading-5 text-stone">A modest envelope keeps a live estimate honest while availability is still unconfirmed.</p><Grid><Percent label="Lower range buffer (%)" field="estimate_lower_buffer_percent" max={99.99} {...{config,setNumber}}/><Percent label="Upper range buffer (%)" field="estimate_upper_buffer_percent" {...{config,setNumber}}/></Grid></div>
    <div className="mt-7 grid gap-6">{groups.map(group=><section key={group.category}><div><h3 className="font-serif text-xl">{group.title}</h3><p className="mt-1 text-xs text-stone">{group.description}</p></div><div className="mt-3 overflow-hidden rounded-2xl border border-stone/15">{bands.filter(item=>item.category===group.category).map(item=><div key={item.key} className="grid gap-3 border-b border-stone/15 p-4 last:border-0 md:grid-cols-[1.4fr_.8fr_.8fr_auto] md:items-end"><div><strong className="block text-sm">{item.label}</strong><span className="text-xs text-stone">{item.unit.replaceAll("_"," ")} · {config.currency}</span></div><Field label="Minimum"><input type="number" min="0" step=".01" value={item.minimum??""} onChange={event=>update(item.key,{minimum:event.target.value===""?null:Number(event.target.value)})}/></Field><Field label="Maximum"><input type="number" min="0" step=".01" value={item.maximum??""} onChange={event=>update(item.key,{maximum:event.target.value===""?null:Number(event.target.value)})}/></Field><label className="flex items-center gap-2 pb-3 text-sm font-semibold"><input type="checkbox" checked={item.active} onChange={event=>update(item.key,{active:event.target.checked})}/> Use fallback</label></div>)}</div></section>)}</div>
  </>;
}

function Money({label,field,config,setNumber}:{label:string;field:NumericKey}&NumbersProps){return <Field label={label} help={`Amount in ${config.currency}.`}><input type="number" min="0" step=".01" value={config[field]??""} onChange={event=>setNumber(field,event.target.value)}/></Field>}
function Percent({label,field,config,setNumber,max=100}:{label:string;field:NumericKey;max?:number}&NumbersProps){return <Field label={label}><input type="number" min="0" max={max} step=".01" value={config[field]??""} onChange={event=>setNumber(field,event.target.value)}/></Field>}
function Heading({title,text}:{title:string;text:string}){return <div><h2 className="font-serif text-2xl">{title}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-stone">{text}</p></div>}
function Grid({children}:{children:React.ReactNode}){return <div className="mt-7 grid gap-5 md:grid-cols-2">{children}</div>}
function Field({label,help,children}:{label:string;help?:string;children:React.ReactNode}){return <label className="grid gap-2 text-sm font-semibold">{label}<span className="[&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-stone/25 [&_input]:bg-white [&_input]:px-4 [&_input]:py-3 [&_input]:outline-none [&_input]:focus:border-gold">{children}</span>{help&&<span className="text-xs font-normal leading-5 text-stone">{help}</span>}</label>}
