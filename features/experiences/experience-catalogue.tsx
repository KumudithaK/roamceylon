"use client";

import Link from "next/link";
import {ArrowRight,Search,X} from "lucide-react";
import {useEffect,useMemo,useState} from "react";
import {Button} from "@/components/ui/button";
import {ExperienceMedia} from "@/features/experiences/experience-media";
import {experienceContext,experienceDestinationOptions,experienceEditionOptions,filterExperiences,selectSignatureExperience,type ExperienceFilters} from "@/lib/experience-discovery";
import type {JourneyExperience} from "@/lib/types";
import {cn} from "@/lib/utils";

const emptyFilters:ExperienceFilters={query:"",edition:"",destination:""};
const PAGE_SIZE=18;

function readFilters(){
  const query=new URLSearchParams(window.location.search);
  return {query:query.get("q")??"",edition:query.get("edition")??"",destination:query.get("destination")??""};
}

function writeFilters(filters:ExperienceFilters){
  const query=new URLSearchParams();
  if(filters.query)query.set("q",filters.query);
  if(filters.edition)query.set("edition",filters.edition);
  if(filters.destination)query.set("destination",filters.destination);
  window.history.replaceState({},"",`${window.location.pathname}${query.size?`?${query}`:""}`);
}

function Context({experience,className}:{experience:JourneyExperience;className?:string}){
  return <p className={cn("text-[.68rem] font-bold uppercase tracking-[.17em] text-gold",className)}>{experienceContext(experience)}</p>;
}

function EditorialTile({experience,index}:{experience:JourneyExperience;index:number}){
  const pattern=index%7;
  const wide=pattern===0||pattern===5;
  const tall=pattern===2||pattern===3;
  return <article className={cn("group min-w-0",wide?"md:col-span-2 xl:col-span-8":tall?"xl:col-span-4":"xl:col-span-4")}>
    <Link href={`/experiences/${experience.slug}`} className="image-lift block focus-ring">
      <ExperienceMedia src={experience.hero_image_url} alt={experience.image_alt||experience.name} sizes={wide?"(max-width: 768px) 100vw, 70vw":"(max-width: 768px) 100vw, 34vw"} className={cn(wide?"aspect-[16/9]":"aspect-[4/3]",tall&&"xl:aspect-[3/4]")} imageClassName="transition duration-1000 ease-out group-hover:scale-[1.035]"/>
      <div className="border-b border-forest/20 pb-8 pt-5">
        <Context experience={experience}/>
        <h3 className={cn("mt-3 max-w-3xl font-serif leading-[1.08] tracking-[-.02em] text-slate",wide?"text-3xl md:text-5xl":"text-2xl md:text-3xl")}>{experience.name}</h3>
        {experience.short_description?<p className="mt-3 line-clamp-2 max-w-2xl text-sm leading-6 text-muted">{experience.short_description}</p>:null}
        <span className="editorial-link mt-5 text-forest">Explore experience</span>
      </div>
    </Link>
  </article>;
}

function DiscoveryControls({filters,onChange,experiences}:{filters:ExperienceFilters;onChange:(filters:ExperienceFilters)=>void;experiences:JourneyExperience[]}){
  const editions=useMemo(()=>experienceEditionOptions(experiences),[experiences]);
  const destinations=useMemo(()=>experienceDestinationOptions(experiences),[experiences]);
  const active=Boolean(filters.query||filters.edition||filters.destination);
  return <div className="border-y border-forest/20 py-8 md:py-10">
    <div className="grid gap-7 lg:grid-cols-[1fr_.8fr_.8fr_auto] lg:items-end">
      <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-[.15em] text-forest">Find an experience</span><span className="relative block"><Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true"/><input type="search" value={filters.query} onChange={event=>onChange({...filters,query:event.target.value})} placeholder="Search moments, places or Editions" className="form-control pl-11"/></span></label>
      <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-[.15em] text-forest">Explore by Edition</span><select className="form-control" value={filters.edition} onChange={event=>onChange({...filters,edition:event.target.value})}><option value="">Every Edition</option>{editions.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
      <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-[.15em] text-forest">Where in Sri Lanka</span><select className="form-control" value={filters.destination} onChange={event=>onChange({...filters,destination:event.target.value})}><option value="">Every destination</option>{destinations.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
      <button type="button" onClick={()=>onChange(emptyFilters)} disabled={!active} className="inline-flex min-h-12 items-center justify-center gap-2 text-sm font-semibold text-forest underline decoration-gold underline-offset-4 disabled:cursor-not-allowed disabled:opacity-35"><X className="size-4" aria-hidden="true"/>Clear</button>
    </div>
  </div>;
}

export function ExperienceCatalogue({experiences}:{experiences:JourneyExperience[]}){
  const [filters,setFilters]=useState<ExperienceFilters>(emptyFilters);
  const [visible,setVisible]=useState(PAGE_SIZE);
  useEffect(()=>{const sync=()=>setFilters(readFilters());sync();window.addEventListener("popstate",sync);return()=>window.removeEventListener("popstate",sync)},[]);
  const changeFilters=(next:ExperienceFilters)=>{setFilters(next);setVisible(PAGE_SIZE);writeFilters(next)};
  const signature=useMemo(()=>selectSignatureExperience(experiences),[experiences]);
  const supporting=useMemo(()=>experiences.filter(item=>item.id!==signature?.id&&item.hero_image_url).slice(0,4),[experiences,signature]);
  const results=useMemo(()=>filterExperiences(experiences,filters),[experiences,filters]);
  const shown=results.slice(0,visible);
  if(!experiences.length)return <main className="bg-ivory"><section className="shell section min-h-[55svh]"><p className="eyebrow">Experiences</p><h1 className="heading-1 mt-5">The collection is being thoughtfully prepared.</h1><p className="prose-luxury mt-6 max-w-2xl">Please return soon, or begin planning your journey and tell us what draws you to Sri Lanka.</p><Button asChild className="mt-8"><Link href="/journey-builder?step=0">Plan Your Journey</Link></Button></section></main>;
  return <main className="bg-ivory">
    <header className="shell grid gap-10 py-16 md:py-24 lg:grid-cols-[.72fr_1.28fr] lg:items-end"><div><p className="editorial-index">06</p><p className="eyebrow mt-7">Experiences, thoughtfully chosen</p></div><div><h1 className="display max-w-4xl">Meet Sri Lanka through what you do, not what you tick off.</h1><p className="prose-luxury mt-7 max-w-2xl">A considered collection of encounters, traditions and landscapes to shape into a private journey of your own.</p></div></header>
    {signature?<section className="bg-forest py-16 text-ivory md:py-24"><div className="media-shell grid items-center gap-10 lg:grid-cols-[1.45fr_.55fr] lg:gap-16"><Link href={`/experiences/${signature.slug}`} className="image-lift focus-ring block"><ExperienceMedia src={signature.hero_image_url} alt={signature.image_alt||signature.name} priority sizes="(max-width: 1024px) 100vw, 68vw" className="aspect-[4/3] md:aspect-[16/10]" imageClassName="transition duration-1000 ease-out"/></Link><div><p className="eyebrow text-gold-light">Signature experience</p><p className="mt-4 text-xs font-bold uppercase tracking-[.17em] text-ivory/60">{experienceContext(signature)}</p><h2 className="mt-5 font-serif text-4xl leading-[1.05] tracking-[-.02em] md:text-6xl">{signature.name}</h2>{signature.short_description?<p className="mt-6 text-base leading-8 text-ivory/72">{signature.short_description}</p>:null}<Link href={`/experiences/${signature.slug}`} className="editorial-link mt-8 text-gold-light">Explore this experience</Link></div></div></section>:null}
    {supporting.length?<section className="shell section"><div className="grid gap-8 border-b border-forest/20 pb-9 md:grid-cols-[.6fr_1fr]"><p className="eyebrow">Four ways into the island</p><h2 className="heading">A first edit of moments worth travelling for.</h2></div><div className="mt-12 grid gap-x-6 gap-y-12 md:grid-cols-2 lg:grid-cols-12">{supporting.map((experience,index)=><article key={experience.id} className={index===0||index===3?"lg:col-span-7":"lg:col-span-5"}><Link href={`/experiences/${experience.slug}`} className="image-lift group block focus-ring"><ExperienceMedia src={experience.hero_image_url} alt={experience.image_alt||experience.name} sizes="(max-width: 768px) 100vw, 55vw" className={index===0||index===3?"aspect-[16/10]":"aspect-[4/3]"} imageClassName="transition duration-1000 ease-out group-hover:scale-[1.035]"/><Context experience={experience} className="mt-5"/><h3 className="mt-3 font-serif text-3xl leading-tight md:text-4xl">{experience.name}</h3></Link></article>)}</div></section>:null}
    <section className="shell pb-20 pt-8 md:pb-28"><div className="grid gap-7 pb-10 md:grid-cols-[.55fr_1fr]"><p className="eyebrow">The full collection</p><div><h2 className="heading">Find the experience that changes the shape of your journey.</h2><p className="mt-4 max-w-2xl leading-7 text-muted">Discover by Edition, place or a detail already on your mind. Every experience is considered as part of a wider journey, subject to confirmation.</p></div></div><DiscoveryControls filters={filters} onChange={changeFilters} experiences={experiences}/><div className="flex items-baseline justify-between gap-4 py-8" aria-live="polite"><p className="font-serif text-2xl">{results.length} {results.length===1?"experience":"experiences"}</p><p className="text-sm text-muted">Showing {Math.min(shown.length,results.length)} of {results.length}</p></div>
      {results.length?<div className="grid grid-cols-1 gap-x-7 gap-y-14 md:grid-cols-2 xl:grid-cols-12">{shown.map((experience,index)=><EditorialTile key={experience.id} experience={experience} index={index}/>)}</div>:<div className="border-y border-forest/20 py-20 text-center"><p className="eyebrow">A different path may be waiting</p><h3 className="mx-auto mt-4 max-w-2xl font-serif text-4xl leading-tight">No published experience matches all three choices yet.</h3><p className="mx-auto mt-5 max-w-xl leading-7 text-muted">Clear a filter to keep discovering, or share what you have in mind when you plan your journey.</p><button type="button" onClick={()=>changeFilters(emptyFilters)} className="editorial-link mt-7 text-forest">Reset discovery</button></div>}
      {visible<results.length?<div className="mt-14 text-center"><Button variant="outline" size="lg" onClick={()=>setVisible(value=>value+PAGE_SIZE)}>Discover more experiences<ArrowRight className="size-4"/></Button></div>:null}
    </section>
    <section className="bg-sand"><div className="shell grid items-center gap-8 py-16 md:grid-cols-[1fr_auto] md:py-20"><div><p className="eyebrow">Your journey, not a checklist</p><h2 className="mt-4 max-w-3xl font-serif text-4xl leading-tight md:text-6xl">Bring the moments that move you into one considered journey.</h2></div><Button asChild size="lg"><Link href="/journey-builder?step=0">Plan Your Journey<ArrowRight/></Link></Button></div></section>
  </main>;
}
