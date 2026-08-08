"use client";

import {ArrowUpRight,CheckCircle2,Compass,Lightbulb} from "lucide-react";
import type {JourneyInsightsResult} from "@/lib/journey/journey-insights";
import {cn} from "@/lib/utils";

const severityStyles={
  note:"border-stone/15 bg-white",
  consider:"border-gold/25 bg-gold/[.06]",
  important:"border-forest/20 bg-forest/[.06]"
} as const;

export function JourneyInsightsPanel({result,onAction,compact=false}:{result:JourneyInsightsResult;onAction?:(step:number)=>void;compact?:boolean}){
  return <section className={cn("overflow-hidden rounded-[2rem] border border-stone/15 bg-white",compact?"p-6 md:p-8":"mt-10")}>
    <div className={cn("grid gap-6 bg-forest text-ivory",compact?"rounded-2xl p-6 md:grid-cols-[1fr_auto] md:items-center":"p-7 md:grid-cols-[1fr_230px] md:p-10")}>
      <div><p className="eyebrow text-gold-light">A thoughtful second look</p><h2 className="mt-3 font-serif text-3xl md:text-4xl">Journey insights</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-ivory/65">A few considered observations to help your journey flow beautifully. They are advisory only—your choices remain entirely yours.</p></div>
      <div className="rounded-2xl border border-ivory/15 bg-ivory/[.06] p-5"><div className="flex items-center gap-3"><Compass className="size-5 text-gold-light"/><span className="text-[.65rem] font-bold uppercase tracking-[.18em] text-gold-light">Journey quality</span></div><strong className="mt-4 block font-serif text-3xl">{result.quality.label}</strong><span className="mt-2 block text-xs leading-5 text-ivory/55">A completeness guide, never a judgement of your journey.</span></div>
    </div>
    <div className={cn("grid gap-4",compact?"mt-5":"p-6 md:p-8")}>
      {result.insights.length?result.insights.map((item,index)=><article key={`${item.ruleId}-${index}`} className={cn("rounded-2xl border p-5",severityStyles[item.severity])}><div className="flex gap-4"><span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-sand-light text-gold"><Lightbulb className="size-4"/></span><div className="min-w-0 flex-1"><p className="text-[.62rem] font-bold uppercase tracking-[.18em] text-gold">{item.name}</p><p className="mt-2 text-sm leading-6 text-slate/70">{item.message}</p>{item.suggestedAction&&onAction?<button type="button" onClick={()=>onAction(item.suggestedAction!.targetStep)} className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-forest">{item.suggestedAction.label}<ArrowUpRight className="size-3"/></button>:null}</div></div></article>):<div className="flex gap-4 rounded-2xl bg-sand-light p-6"><CheckCircle2 className="size-6 shrink-0 text-gold"/><div><strong className="font-serif text-xl">Your journey feels thoughtfully complete.</strong><p className="mt-2 text-sm leading-6 text-stone">Nothing needs your attention before review. You can still revisit any choice whenever you wish.</p></div></div>}
      {!compact?<p className="pt-1 text-center text-xs leading-5 text-stone">You may continue without making any changes. Journey Insights never alters your itinerary.</p>:null}
    </div>
  </section>;
}
