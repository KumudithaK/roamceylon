"use client";
import Image from "next/image";
import Link from "next/link";
import {useEffect,useState} from "react";
import {BarChart3,BedDouble,CarFront,LayoutDashboard,LogOut,Map,Settings,Sparkles,UsersRound} from "lucide-react";
import {useRouter} from "next/navigation";
import {createClient} from "@/lib/supabase/client";
import {Button} from "@/components/ui/button";
import type {Database} from "@/lib/database.types";

const nav=[
  [LayoutDashboard,"Overview","/admin/dashboard"],
  [Map,"Destinations","/admin/resources/destinations"],
  [Sparkles,"Experiences","/admin/resources/experiences"],
  [BedDouble,"Stays","/admin/resources/stays"],
  [CarFront,"Vehicles","/admin/resources/vehicles"],
  [UsersRound,"Local Guides","/admin/resources/guides"],
  [Settings,"Business Settings","/admin/settings/pricing"]
] as const;
type Metric={label:string;value:number};

export function AdminDashboard(){
  const router=useRouter();
  const [metrics,setMetrics]=useState<Metric[]>([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{const supabase=createClient();void (async()=>{const {data:{session}}=await supabase.auth.getSession();if(!session){router.replace("/admin/login");return}const tables=["themes","destinations","experiences","accommodations","vehicles","guides"] satisfies Array<keyof Database["public"]["Tables"]>;const values=await Promise.all(tables.map(async table=>(await supabase.from(table).select("*",{count:"exact",head:true})).count||0));setMetrics(tables.map((label,index)=>({label:label.replaceAll("_"," "),value:values[index]})));setLoading(false)})()},[router]);
  return <div className="grid min-h-screen bg-[#f4f3ef] lg:grid-cols-[250px_1fr]"><aside className="border-r border-stone/20 bg-slate p-5 text-ivory"><Image src="/assets/logo/roam-ceylon-elephant.png" alt="Roam Ceylon" width={190} height={108} priority className="w-full rounded-2xl bg-ivory p-2"/><nav className="mt-6 grid gap-1">{nav.map(([Icon,label,href],index)=><Link key={label} href={href} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm ${index===0?"bg-white/10 text-white":"text-white/55 hover:bg-white/5 hover:text-white"}`}><Icon className="size-4"/>{label}</Link>)}</nav><Button variant="ghost" className="mt-8 text-ivory/60" onClick={async()=>{await createClient().auth.signOut();router.replace("/admin/login")}}><LogOut/>Sign out</Button></aside><main className="p-6 md:p-10"><div className="flex items-end justify-between"><div><p className="eyebrow mb-2">Content studio</p><h1 className="font-serif text-4xl">Good morning.</h1><p className="mt-2 text-sm text-slate/50">Here is the health of the Roam Ceylon platform.</p></div><Button>New content</Button></div>{loading?<div className="mt-10 h-40 animate-pulse rounded-3xl bg-white"/>:<div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(metric=><article key={metric.label} className="rounded-2xl border border-stone/15 bg-white p-6"><p className="text-xs font-bold uppercase tracking-widest text-stone">{metric.label}</p><strong className="mt-4 block font-serif text-4xl">{metric.value}</strong></article>)}</div>}<section className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_.6fr]"><div className="rounded-3xl border border-stone/15 bg-white p-7"><div className="flex items-center gap-3"><BarChart3 className="text-gold"/><h2 className="font-serif text-2xl">Content health</h2></div><div className="mt-7 grid gap-4"><div className="flex justify-between border-b border-stone/15 pb-4"><span>Records needing review</span><strong>Review queue</strong></div><div className="flex justify-between border-b border-stone/15 pb-4"><span>Missing or duplicated imagery</span><strong>Image library</strong></div><div className="flex justify-between"><span>New traveller enquiries</span><strong>Inbox</strong></div></div></div><div className="rounded-3xl bg-forest p-7 text-ivory"><h2 className="font-serif text-2xl">Launch progress</h2><div className="mt-6 h-2 rounded-full bg-white/10"><div className="h-full w-2/5 rounded-full bg-gold"/></div><p className="mt-4 text-sm text-white/60">Review imagery and marketplace partners before publishing broadly.</p></div></section></main></div>;
}
