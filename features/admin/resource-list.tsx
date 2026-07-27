"use client";

import Image from "next/image";
import Link from "next/link";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {createClient} from "@/lib/supabase/client";
import type {ResourceConfig} from "@/lib/admin/resources";

type Row=Record<string,unknown>;

export function ResourceList({config}:{config:ResourceConfig}){
  const router=useRouter();
  const [rows,setRows]=useState<Row[]>([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{void (async()=>{
    const database=createClient();const {data:{session}}=await database.auth.getSession();
    if(!session){router.replace("/admin/login");return}
    const {data}=await database.from(config.table).select("*").order(config.nameField);
    setRows((data??[]) as unknown as Row[]);setLoading(false);
  })()},[config,router]);
  const article=/^[aeiou]/i.test(config.singular)?"an":"a";
  return <main className="min-h-screen bg-[#f4f3ef] p-6 md:p-10"><div className="mx-auto max-w-6xl"><Link href="/admin/dashboard" className="text-sm font-semibold text-forest">← Admin dashboard</Link><p className="eyebrow mb-3 mt-8">Content</p><h1 className="font-serif text-5xl">{config.label}</h1><p className="mt-3 text-slate/60">Open {article} {config.singular.toLowerCase()} to manage its content and pricing in one place.</p><div className="mt-10 overflow-hidden rounded-3xl border border-stone/15 bg-white">{loading?<div className="h-56 animate-pulse bg-sand-light"/>:rows.length?<div className="divide-y divide-stone/15">{rows.map(row=><Link key={String(row.id)} href={`/admin/resources/${config.type}/${row.id}`} className="flex items-center gap-5 p-5 transition hover:bg-sand-light"><div className="relative size-16 overflow-hidden rounded-xl bg-sand">{typeof row[config.imageField]==="string"&&row[config.imageField]?<Image src={String(row[config.imageField])} alt="" fill sizes="64px" className="object-cover"/>:null}</div><div className="min-w-0 flex-1"><strong className="block truncate font-serif text-xl">{String(row[config.nameField]||"Untitled")}</strong><span className="text-sm capitalize text-stone">{String(row.status||"draft").replaceAll("_"," ")}</span></div><span className="text-sm font-semibold text-forest">Edit →</span></Link>)}</div>:<div className="p-12 text-center text-stone">No {config.label.toLowerCase()} found.</div>}</div></div></main>;
}
