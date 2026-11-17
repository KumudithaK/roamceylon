"use client";

import {useTranslation} from "@/components/i18n/locale-provider";

import {ArrowUpRight,CheckCircle2,Compass,Lightbulb} from "lucide-react";
import type {JourneyInsightsResult} from "@/lib/journey/journey-insights";
import {cn} from "@/lib/utils";

const severityStyles={
  note:"border-stone/15 bg-white",
  consider:"border-gold/25 bg-gold/[.06]",
  important:"border-forest/20 bg-forest/[.06]"
} as const;


type JourneyMessageTranslator=(source:string,values?:Record<string,string|number>)=>string;
// Translate authored insight templates; interpolated catalogue names stay verbatim.
const insightTemplates=[
  "{detail} does not yet have a selected experience. You can continue as it is, or explore what feels meaningful there.",
  "Your stay style in {detail} is open for ELAVA8 TRAVELS to recommend. You may also choose a preference if you already have one.",
  "Most of your planned nights are in {detail}. You may prefer this slower focus, or you can share the time more evenly across your route.",
  "Your selected experiences currently share a {detail} focus. If variety matters to you, Sri Lanka also offers contrasting cultural, natural and scenic moments.",
  "{detail} may be affected by seasonal conditions during your travel period. Your journey designer will verify the current operating conditions.",
  "{detail} may require additional accessibility planning. ELAVA8 TRAVELS will review access arrangements with you before confirming the journey.",
  "{detail} may need a little extra family planning. Your journey designer will confirm age guidance, timing and practical arrangements."
];
export function translateJourneyInsightMessage(message:string,t:JourneyMessageTranslator){
  for(const template of insightTemplates){
    const [before,after]=template.split("{detail}");
    if(message.startsWith(before)&&message.endsWith(after)&&message.length>=before.length+after.length){
      return t(template,{detail:message.slice(before.length,message.length-after.length)});
    }
  }
  return t(message);
}

export function JourneyInsightsPanel({result,onAction,compact=false}:{result:JourneyInsightsResult;onAction?:(step:number)=>void;compact?:boolean}){
  const {t,locale}=useTranslation();
  return <section className={cn("overflow-hidden rounded-[2rem] border border-stone/15 bg-white",compact?"p-6 md:p-8":"mt-10")}>
    <div className={cn("grid gap-6 bg-forest text-ivory",compact?"rounded-2xl p-6 md:grid-cols-[1fr_auto] md:items-center":"p-7 md:grid-cols-[1fr_230px] md:p-10")}>
      <div><p className="eyebrow text-gold-light">{t("A thoughtful second look")}</p><h2 className="mt-3 font-serif text-3xl md:text-4xl">{t("Journey insights")}</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-ivory/65">{t("A few considered observations to help your journey flow beautifully. They are advisory only—your choices remain entirely yours.")}</p></div>
      <div className="rounded-2xl border border-ivory/15 bg-ivory/[.06] p-5"><div className="flex items-center gap-3"><Compass className="size-5 text-gold-light"/><span className="text-[.65rem] font-bold uppercase tracking-[.18em] text-gold-light">{t("Journey quality")}</span></div><strong className="mt-4 block font-serif text-3xl">{t(result.quality.label)}</strong><span className="mt-2 block text-xs leading-5 text-ivory/55">{t("A completeness guide, never a judgement of your journey.")}</span></div>
    </div>
    <div className={cn("grid gap-4",compact?"mt-5":"p-6 md:p-8")}>
      {result.insights.length?result.insights.map((item,index)=><article key={`${item.ruleId}-${index}`} className={cn("rounded-2xl border p-5",severityStyles[item.severity])}><div className="flex gap-4"><span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-sand-light text-gold"><Lightbulb className="size-4"/></span><div className="min-w-0 flex-1"><p className="text-[.62rem] font-bold uppercase tracking-[.18em] text-gold">{t(item.name)}</p><p lang={locale!=="en"&&translateJourneyInsightMessage(item.message,t)===item.message?"en":undefined} className="mt-2 text-sm leading-6 text-slate/70">{translateJourneyInsightMessage(item.message,t)}</p>{item.suggestedAction&&onAction?<button type="button" onClick={()=>onAction(item.suggestedAction!.targetStep)} className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-forest">{t(item.suggestedAction.label)}<ArrowUpRight className="size-3"/></button>:null}</div></div></article>):<div className="flex gap-4 rounded-2xl bg-sand-light p-6"><CheckCircle2 className="size-6 shrink-0 text-gold"/><div><strong className="font-serif text-xl">{t("Your journey feels thoughtfully complete.")}</strong><p className="mt-2 text-sm leading-6 text-stone">{t("Nothing needs your attention before review. You can still revisit any choice whenever you wish.")}</p></div></div>}
      {!compact?<p className="pt-1 text-center text-xs leading-5 text-stone">{t("You may continue without making any changes. Journey Insights never alters your itinerary.")}</p>:null}
    </div>
  </section>;
}
