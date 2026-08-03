"use client";

import Link from "next/link";
import {useEffect,useState} from "react";
import {createClient} from "@/lib/supabase/client";

type Check={label:string;value:string;ok:boolean;detail?:string};

export default function DiagnosticsPage(){
  const [checks,setChecks]=useState<Check[]>([]);
  useEffect(()=>{void (async()=>{
    const supabase=createClient();
    const tables=["themes","destinations","experiences","accommodations","vehicles","guides"] as const;
    const counts=await Promise.all(tables.map(async table=>{
      const result=await supabase.from(table).select("*",{count:"exact",head:true});
      return {label:table,value:result.error?"Error":String(result.count??0),ok:!result.error,detail:result.error?.message};
    }));
    const [destinations,destinationLinks,experiences,experienceLinks,hero]=await Promise.all([
      supabase.from("destinations").select("id").eq("status","published").eq("active",true),
      supabase.from("theme_destinations").select("destination_id"),
      supabase.from("experiences").select("id").eq("status","published").eq("active",true),
      supabase.from("experience_destinations").select("experience_id"),
      supabase.from("homepage_content").select("*").eq("id",true).single()
    ]);
    const linkedDestinations=new Set(destinationLinks.data?.map(row=>row.destination_id));
    const linkedExperiences=new Set(experienceLinks.data?.map(row=>row.experience_id));
    const orphanDestinations=destinations.data?.filter(row=>!linkedDestinations.has(row.id)).length??0;
    const orphanExperiences=experiences.data?.filter(row=>!linkedExperiences.has(row.id)).length??0;
    setChecks([
      {label:"Supabase connection",value:counts.some(item=>item.ok)?"Connected":"Blocked",ok:counts.some(item=>item.ok)},
      ...counts,
      {label:"Published destinations without themes",value:String(orphanDestinations),ok:orphanDestinations===0},
      {label:"Published experiences without destinations",value:String(orphanExperiences),ok:orphanExperiences===0},
      {label:"Homepage hero poster",value:hero.data?.hero_video_poster_url||hero.data?.hero_background_image_url?"Configured":"Missing",ok:Boolean(hero.data?.hero_video_poster_url||hero.data?.hero_background_image_url),detail:hero.error?.message}
    ]);
  })()},[]);
  return <main className="min-h-screen bg-sand-light p-6 md:p-12"><div className="mx-auto max-w-5xl"><Link href="/admin/dashboard" className="text-sm font-semibold text-forest">← Admin dashboard</Link><p className="eyebrow mb-3 mt-10">System health</p><h1 className="font-serif text-5xl">Diagnostics</h1><p className="mt-3 text-slate/60">Live checks use your authenticated session. No secret values are displayed.</p><div className="mt-10 grid gap-4">{checks.length?checks.map(check=><article key={check.label} className="rounded-2xl border border-stone/15 bg-white p-5"><div className="flex items-center justify-between gap-4"><h2 className="font-semibold">{check.label}</h2><span className={check.ok?"text-forest":"text-red-700"}>{check.value}</span></div>{check.detail&&<p className="mt-2 text-sm text-red-700">{check.detail}</p>}</article>):<div className="h-40 animate-pulse rounded-3xl bg-white"/>}</div></div></main>;
}
