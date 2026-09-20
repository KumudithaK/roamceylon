"use client";

import Image from "next/image";
import {Check,ChevronLeft,ChevronRight} from "lucide-react";
import type {MouseEvent,ReactNode} from "react";
import {Button} from "@/components/ui/button";
import {cn} from "@/lib/utils";

export type JourneyChapterDefinition={label:string;phase:string};

export function JourneyOpening({image}:{image:string|null}){
  return <header className="relative isolate min-h-[34rem] overflow-hidden bg-forest text-ivory md:min-h-[38rem]">
    {image?<Image src={image} alt="Sri Lankan landscape" fill priority sizes="100vw" className="object-cover opacity-65"/>:null}
    <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(11,48,42,.96)_0%,rgba(11,48,42,.76)_48%,rgba(11,48,42,.22)_100%)]"/>
    <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-forest to-transparent"/>
    <div className="shell relative flex min-h-[34rem] items-end py-14 md:min-h-[38rem] md:py-20">
      <div className="max-w-4xl">
        <p className="eyebrow text-gold-light">Private journey design · Sri Lanka</p>
        <h1 className="mt-5 max-w-3xl font-serif text-[clamp(3.4rem,7.5vw,7.25rem)] leading-[.9] tracking-[-.045em] text-balance">Build your journey.</h1>
        <div className="mt-7 grid max-w-3xl gap-6 border-t border-ivory/25 pt-6 md:grid-cols-[1fr_.72fr] md:items-end">
          <p className="text-lg leading-8 text-ivory/78 md:text-xl">Begin with what draws you to Sri Lanka. Shape the places, moments and pace into a journey that feels distinctly yours.</p>
          <p className="text-xs font-semibold uppercase leading-6 tracking-[.18em] text-gold-light">Inspire · Choose · Shape · Refine · Share</p>
        </div>
      </div>
    </div>
  </header>;
}

export function JourneyProgress({chapters,current,onSelect}:{chapters:JourneyChapterDefinition[];current:number;onSelect:(index:number)=>void}){
  return <nav aria-label="Journey design progress" className="border-b border-forest/15 bg-ivory/95 backdrop-blur">
    <div className="shell overflow-x-auto py-5">
      <ol className="flex min-w-[47rem] items-start">
        {chapters.map((chapter,index)=>{
          const complete=index<current,active=index===current,available=index<=current;
          return <li key={chapter.label} className="relative flex-1 pr-3">
            <div aria-hidden="true" className={cn("absolute left-8 right-0 top-[.9rem] h-px",complete?"bg-gold":"bg-forest/20")}/>
            <button type="button" disabled={!available} onClick={()=>onSelect(index)} aria-current={active?"step":undefined} className="group relative grid min-w-0 gap-2 text-left disabled:cursor-default">
              <span className={cn("relative z-10 grid size-7 place-items-center rounded-full border text-[.65rem] font-bold transition",active?"border-gold bg-gold text-forest ring-4 ring-gold/15":complete?"border-forest bg-forest text-ivory":"border-forest/30 bg-ivory text-stone")}>{complete?<Check className="size-3.5"/>:index+1}</span>
              <span className={cn("text-[.6rem] font-bold uppercase tracking-[.16em]",active?"text-gold":"text-stone")}>{chapter.phase}</span>
              <span className={cn("truncate font-serif text-sm",active||complete?"text-slate":"text-stone")}>{chapter.label}</span>
            </button>
          </li>;
        })}
      </ol>
      <p className="sr-only" aria-live="polite">Chapter {current+1} of {chapters.length}: {chapters[current]?.label}</p>
    </div>
  </nav>;
}

export function JourneyChapter({phase,title,intro,children}:{phase:string;title:string;intro:string;children:ReactNode}){
  return <section aria-labelledby="journey-chapter-title">
    <div className="grid gap-6 border-b border-forest/15 pb-8 md:grid-cols-[.42fr_1fr] md:items-end">
      <div><p className="eyebrow">{phase}</p><div className="editorial-rule mt-5"/></div>
      <div><h1 id="journey-chapter-title" className="heading-1 max-w-3xl">{title}</h1><p className="prose-luxury mt-5 max-w-2xl">{intro}</p></div>
    </div>
    {children}
  </section>;
}

export function JourneyNavigation({step,total,onBack,onContinue,onSubmit,submitDisabled=false}:{step:number;total:number;onBack:()=>void;onContinue:()=>void;onSubmit:(event:MouseEvent<HTMLButtonElement>)=>void;submitDisabled?:boolean}){
  const final=step===total-1;
  return <div className="sticky bottom-0 z-30 mt-12 flex w-full max-w-full items-center justify-between gap-4 border-t border-forest/15 bg-ivory/95 py-4 shadow-[0_-16px_40px_rgba(11,48,42,.08)] backdrop-blur md:static md:bg-transparent md:shadow-none">
    <Button variant="ghost" disabled={step===0} onClick={onBack} aria-label="Return to the previous journey chapter"><ChevronLeft/>Back</Button>
    <div className="hidden text-center text-[.65rem] font-bold uppercase tracking-[.16em] text-stone sm:block">Chapter {step+1} of {total}</div>
    {final?<Button onClick={onSubmit} disabled={submitDisabled} variant="accent">Request Journey Proposal</Button>:<Button onClick={onContinue}>Continue<ChevronRight/></Button>}
  </div>;
}
