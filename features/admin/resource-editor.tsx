"use client";

import Link from "next/link";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {createClient} from "@/lib/supabase/client";
import type {Database} from "@/lib/database.types";
import type {ResourceConfig,ResourceField} from "@/lib/admin/resources";
import {PricingPlans} from "./pricing-plans";

type RecordData=Record<string,unknown>;
type Plan=Database["public"]["Tables"]["pricing_plans"]["Row"];

export function ResourceEditor({config,id}:{config:ResourceConfig;id:string}){
  const router=useRouter();
  const [record,setRecord]=useState<RecordData|null>(null);
  const [plans,setPlans]=useState<Plan[]>([]);
  const [tab,setTab]=useState(config.tabs[0].id);
  const [message,setMessage]=useState("");
  useEffect(()=>{void (async()=>{
    const database=createClient();const {data:{session}}=await database.auth.getSession();
    if(!session){router.replace("/admin/login");return}
    const [{data:item,error},{data:pricing}]=await Promise.all([
      database.from(config.table).select("*").eq("id",id).single(),
      database.from("pricing_plans").select("*").eq("entity_type",config.entityType).eq("entity_id",id).order("sort_order")
    ]);
    if(error){setMessage("This resource could not be loaded.");return}
    setRecord(item as unknown as RecordData);setPlans(pricing??[]);
  })()},[config,id,router]);
  const save=async()=>{if(!record)return;const {id:recordId,created_at,updated_at,...changes}=record;void recordId;void created_at;void updated_at;const {error}=await createClient().from(config.table).update(changes as never).eq("id",id);setMessage(error?error.message:`${config.singular} saved.`)};
  const current=config.tabs.find(item=>item.id===tab)!;
  if(!record)return <main className="grid min-h-screen place-items-center bg-[#f4f3ef]"><p className="text-stone">{message||`Loading ${config.singular.toLowerCase()}…`}</p></main>;
  return <main className="min-h-screen bg-[#f4f3ef] p-6 md:p-10"><div className="mx-auto max-w-6xl"><Link href={`/admin/resources/${config.type}`} className="text-sm font-semibold text-forest">← {config.label}</Link><div className="mt-8 flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow mb-3">{config.singular} editor</p><h1 className="font-serif text-4xl md:text-5xl">{String(record[config.nameField]||"Untitled")}</h1></div><Button onClick={()=>void save()}>Save changes</Button></div>{message&&<p className="mt-5 rounded-xl bg-white p-4 text-sm">{message}</p>}<nav className="mt-9 flex gap-1 overflow-x-auto border-b border-stone/20" aria-label={`${config.singular} editor sections`}>{config.tabs.map(item=><button key={item.id} onClick={()=>setTab(item.id)} className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold ${tab===item.id?"border-gold text-forest":"border-transparent text-stone hover:text-slate"}`}>{item.label}</button>)}</nav><section className="mt-7 rounded-3xl border border-stone/15 bg-white p-6 md:p-8">{tab==="pricing"?<PricingPlans entityType={config.entityType} entityId={id} initialPlans={plans}/>:<div className="grid gap-5 md:grid-cols-2">{current.fields.map(field=><EditorField key={field.key} field={field} value={record[field.key]} onChange={value=>setRecord({...record,[field.key]:value})}/>)}</div>}</section></div></main>;
}

function EditorField({field,value,onChange}:{field:ResourceField;value:unknown;onChange:(value:unknown)=>void}){
  const classes="rounded-xl border border-stone/25 bg-white px-4 py-3 outline-none focus:border-gold";
  if(field.kind==="boolean")return <label className="flex items-center gap-3 rounded-xl border border-stone/15 p-4 text-sm font-semibold"><input type="checkbox" checked={Boolean(value)} onChange={event=>onChange(event.target.checked)}/>{field.label}</label>;
  if(field.kind==="textarea")return <label className="grid gap-2 text-sm font-semibold md:col-span-2">{field.label}<textarea rows={6} value={String(value??"")} onChange={event=>onChange(event.target.value)} className={classes}/></label>;
  if(field.kind==="list")return <label className="grid gap-2 text-sm font-semibold md:col-span-2">{field.label}<textarea rows={4} value={Array.isArray(value)?value.join("\n"):""} onChange={event=>onChange(event.target.value.split("\n").map(item=>item.trim()).filter(Boolean))} className={classes}/><span className="text-xs font-normal text-stone">One item per line</span></label>;
  return <label className="grid gap-2 text-sm font-semibold">{field.label}<input type={field.kind==="number"?"number":"text"} value={String(value??"")} onChange={event=>onChange(field.kind==="number"?(event.target.value===""?null:Number(event.target.value)):event.target.value)} className={classes}/></label>;
}
