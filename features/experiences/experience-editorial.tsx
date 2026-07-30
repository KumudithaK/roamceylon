"use client";

import Image from "next/image";
import Link from "next/link";
import {AnimatePresence,motion} from "motion/react";
import {ArrowLeft,CalendarDays,Check,Clock,MapPin,Minus,Plus,Sparkles,X} from "lucide-react";
import {useEffect,useMemo,useState} from "react";
import {Button} from "@/components/ui/button";
import type {JourneyExperience,ParticipantCounts} from "@/lib/types";
import {cn} from "@/lib/utils";
import {emptyJourneyState,type JourneyState} from "@/features/journey/journey-store";
import {readJourneyState,subscribeJourneyState,writeJourneyState} from "@/lib/journey/journey-persistence";
import {includeExperienceSelection,removeExperienceSelection} from "@/lib/journey/journey-selection";

const emptyCounts:ParticipantCounts={adults:0,children:0,infants:0};
const total=(counts:ParticipantCounts)=>counts.adults+counts.children+counts.infants;
const withinTrip=(participants:ParticipantCounts,travellers:ParticipantCounts)=>participants.adults<=travellers.adults&&participants.children<=travellers.children&&participants.infants<=travellers.infants;
const teaser=(value:string|null)=>value?.split(/[.!?]\s/)[0]?.trim()||"A remarkable Sri Lankan moment, thoughtfully discovered.";
const experienceBadges=(experience:JourneyExperience)=>[
  ...experience.badges,
  ...(experience.family_friendly||experience.suitable_for_children?["Family friendly"]:[]),
  ...(experience.private_option?["Private"]:[]),
  ...(experience.featured?["Signature experience"]:[])
].filter((value,index,values)=>value&&values.indexOf(value)===index).slice(0,3);

export function ExperienceCard({experience,onOpen,onRemove,compact=false,selected=false}:{experience:JourneyExperience;onOpen:()=>void;onRemove?:()=>void;compact?:boolean;selected?:boolean}){
  return <motion.article layout whileHover={{y:-6}} className={cn("group overflow-hidden rounded-[2rem] border-2 bg-white text-left transition",selected?"border-gold shadow-[0_24px_70px_rgba(193,140,45,.2)]":"border-transparent shadow-[0_24px_70px_rgba(26,40,35,.09)] hover:shadow-[0_30px_90px_rgba(26,40,35,.16)]")}>
    <button type="button" onClick={onOpen} className="block w-full text-left">
      <div className={cn("relative overflow-hidden bg-sand",compact?"aspect-[16/10]":"aspect-[4/3]")}>
      {experience.hero_image_url&&<Image src={experience.hero_image_url} alt={experience.image_alt||experience.name} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover transition duration-1000 ease-out group-hover:scale-[1.045]"/>}
      <div className="absolute inset-0 bg-gradient-to-t from-slate/55 via-transparent to-transparent"/>
      {selected&&<span className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-gold px-3 py-2 text-[.65rem] font-bold uppercase tracking-[.12em] text-slate shadow-lg"><Check className="size-4"/>In your journey</span>}
      <div className="absolute bottom-5 left-5 flex flex-wrap gap-2">{experienceBadges(experience).map(badge=><span key={badge} className="rounded-full border border-white/25 bg-slate/25 px-3 py-1 text-[.62rem] font-bold uppercase tracking-[.16em] text-white backdrop-blur-md">{badge}</span>)}</div>
      </div>
      <div className={compact?"p-5":"p-6 md:p-8"}>
        <div className="flex items-center justify-between gap-4 text-[.68rem] font-bold uppercase tracking-[.18em] text-gold-dark"><span>{experience.category||"Experience"}</span><span className="flex items-center gap-1 text-stone"><MapPin className="size-3"/>{experience.destinationNames?.join(" · ")||"Sri Lanka"}</span></div>
        <h2 className={cn("mt-4 font-serif leading-tight text-slate",compact?"text-2xl":"text-3xl md:text-[2.15rem]")}>{experience.name}</h2>
        <p className="mt-3 line-clamp-1 text-sm leading-7 text-stone">{teaser(experience.short_description)}</p>
        <div className="mt-6 flex flex-wrap gap-5 border-t border-stone/15 pt-5 text-xs text-slate/60">
          {experience.duration&&<span className="flex items-center gap-2"><Clock className="size-4 text-gold"/>{experience.duration}</span>}
          {experience.best_season&&<span className="flex items-center gap-2"><CalendarDays className="size-4 text-gold"/>{experience.best_season}</span>}
        </div>
      </div>
    </button>
    {selected&&onRemove?<div className="border-t border-gold/20 px-5 py-4"><button type="button" onClick={onRemove} className="flex w-full items-center justify-center gap-2 rounded-full border border-gold/50 px-4 py-3 text-xs font-bold text-gold-dark transition hover:bg-gold hover:text-slate"><X className="size-4"/>Remove from journey</button></div>:null}
  </motion.article>;
}

export function ExperienceHero({experience,onClose}:{experience:JourneyExperience;onClose?:()=>void}){
  return <header className="relative min-h-[72svh] overflow-hidden bg-slate text-ivory">
    {experience.hero_image_url&&<Image src={experience.hero_image_url} alt={experience.image_alt||experience.name} fill priority sizes="100vw" className="object-cover"/>}
    <div className="absolute inset-0 bg-gradient-to-t from-slate via-slate/30 to-slate/20"/>
    {onClose&&<button onClick={onClose} aria-label="Close experience" className="absolute right-5 top-5 z-10 grid size-12 place-items-center rounded-full border border-white/25 bg-slate/25 backdrop-blur-md transition hover:bg-slate/50"><X/></button>}
    <div className="shell relative flex min-h-[72svh] items-end pb-14 pt-28 md:pb-20">
      <div className="max-w-4xl">
        <p className="eyebrow mb-5 text-gold-light">{experience.category||"Experience"} · {experience.destinationNames?.join(" · ")||"Sri Lanka"}</p>
        <h1 className="max-w-4xl font-serif text-5xl leading-[.98] md:text-8xl">{experience.name}</h1>
        {experience.short_description&&<p className="mt-6 max-w-2xl text-lg leading-8 text-ivory/80 md:text-xl">{experience.short_description}</p>}
        <div className="mt-7 flex flex-wrap gap-3">{experienceBadges(experience).map(badge=><span key={badge} className="rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold backdrop-blur">{badge}</span>)}</div>
      </div>
    </div>
  </header>;
}

export function ExperienceGallery({experience}:{experience:JourneyExperience}){
  const images=[experience.hero_image_url,...experience.gallery].filter((value,index,values):value is string=>Boolean(value)&&values.indexOf(value)===index);
  if(images.length<2)return null;
  return <section className="shell py-16 md:py-24"><p className="eyebrow mb-5">In pictures</p><div className="grid auto-rows-[210px] gap-4 md:grid-cols-12 md:auto-rows-[260px]">{images.slice(0,5).map((image,index)=><div key={image} className={cn("relative overflow-hidden rounded-[1.75rem] bg-sand",index===0?"md:col-span-7 md:row-span-2":"md:col-span-5")}><Image src={image} alt={`${experience.name} — view ${index+1}`} fill sizes={index===0?"60vw":"40vw"} className="object-cover transition duration-700 hover:scale-[1.03]"/></div>)}</div></section>;
}

function EditorialSection({eyebrow,title,copy,items}:{eyebrow:string;title:string;copy?:string|null;items?:string[]}){
  if(!copy&&!items?.length)return null;
  return <section className="shell grid gap-8 border-t border-stone/15 py-16 md:grid-cols-[.72fr_1.28fr] md:py-24"><div><p className="eyebrow">{eyebrow}</p><h2 className="mt-4 max-w-md font-serif text-4xl leading-tight md:text-5xl">{title}</h2></div><div>{copy&&<div className="max-w-3xl whitespace-pre-line text-lg leading-9 text-slate/70">{copy}</div>}{items?.length?<div className="grid gap-4 sm:grid-cols-2">{items.map(item=><div key={item} className="flex gap-3 border-b border-stone/15 pb-4 text-base leading-7 text-slate/75"><Sparkles className="mt-1 size-4 shrink-0 text-gold"/><span>{item}</span></div>)}</div>:null}</div></section>;
}

export function ExperienceStory({experience}:{experience:JourneyExperience}){return <EditorialSection eyebrow="The story" title="About the experience" copy={experience.full_description||experience.short_description}/>}
export function ExperienceHighlights({experience}:{experience:JourneyExperience}){return <EditorialSection eyebrow="The moments" title="Highlights worth remembering" items={experience.highlights}/>}
export function ExperienceIncluded({experience}:{experience:JourneyExperience}){return <EditorialSection eyebrow="Thoughtfully arranged" title="What’s included" items={experience.included}/>}
export function ExperienceTips({experience}:{experience:JourneyExperience}){return <EditorialSection eyebrow="Local perspective" title="Traveller tips" items={experience.traveller_tips}/>}

export function ExperienceInfo({experience}:{experience:JourneyExperience}){
  const facts=[["Duration",experience.duration],["Best time to visit",experience.best_season],["Where",experience.destinationNames?.join(" · ")]].filter((item):item is [string,string]=>Boolean(item[1]));
  if(!facts.length&&!experience.things_to_know.length)return null;
  return <section className="bg-sand-light py-16 md:py-24"><div className="shell"><div className="grid gap-8 md:grid-cols-3">{facts.map(([label,value])=><div key={label}><p className="eyebrow">{label}</p><p className="mt-3 font-serif text-2xl">{value}</p></div>)}</div>{experience.things_to_know.length?<div className="mt-14 grid gap-5 border-t border-stone/15 pt-10 md:grid-cols-3">{experience.things_to_know.map(item=><p key={item} className="leading-7 text-slate/65">{item}</p>)}</div>:null}</div></section>;
}

function Counter({label,detail,value,onChange,dark}:{label:string;detail:string;value:number;onChange:(value:number)=>void;dark:boolean}){
  return <div className={cn("flex items-center justify-between border-b py-4",dark?"border-white/15":"border-stone/20")}><span><strong className="block">{label}</strong><small className={dark?"text-ivory/55":"text-stone"}>{detail}</small></span><div className="flex items-center gap-4"><button type="button" onClick={()=>onChange(Math.max(0,value-1))} className={cn("grid size-9 place-items-center rounded-full border",dark?"border-white/25":"border-stone/30 bg-white text-slate")} aria-label={`Remove one ${label}`}><Minus className="size-4"/></button><strong className="w-5 text-center">{value}</strong><button type="button" onClick={()=>onChange(value+1)} className={cn("grid size-9 place-items-center rounded-full border",dark?"border-white/25":"border-stone/30 bg-white text-slate")} aria-label={`Add one ${label}`}><Plus className="size-4"/></button></div></div>;
}

export function ExperienceParticipants({counts,onChange,dark=true}:{counts:ParticipantCounts;onChange:(counts:ParticipantCounts)=>void;dark?:boolean}){
  const labels:{[K in keyof ParticipantCounts]:[string,string]}={adults:["Adults","13 years and over"],children:["Children","2–12 years"],infants:["Infants","Under 2 years"]};
  return <div className={cn("rounded-[1.75rem] p-6",dark?"bg-white/8 text-ivory":"bg-sand-light text-slate")}><p className="mb-2 text-xs font-bold uppercase tracking-[.18em] opacity-60">Participants</p>{(["adults","children","infants"] as const).map(key=><Counter key={key} label={labels[key][0]} detail={labels[key][1]} dark={dark} value={counts[key]} onChange={value=>onChange({...counts,[key]:value})}/>)}</div>;
}

function JourneyTravellersModal({open,initial,minimum,onCancel,onConfirm}:{open:boolean;initial:ParticipantCounts;minimum:ParticipantCounts;onCancel:()=>void;onConfirm:(counts:ParticipantCounts)=>void}){
  const [counts,setCounts]=useState(initial);
  useEffect(()=>{if(open)setCounts({adults:Math.max(initial.adults,minimum.adults,1),children:Math.max(initial.children,minimum.children),infants:Math.max(initial.infants,minimum.infants)})},[initial,minimum,open]);
  const valid=withinTrip(minimum,counts);
  return <AnimatePresence>{open&&<motion.div className="fixed inset-0 z-[90] grid place-items-center bg-slate/70 p-4 backdrop-blur-sm" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onMouseDown={onCancel}><motion.div role="dialog" aria-modal="true" aria-labelledby="travellers-title" onMouseDown={event=>event.stopPropagation()} initial={{opacity:0,y:24,scale:.98}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:14}} className="w-full max-w-lg rounded-[2rem] bg-ivory p-7 text-slate shadow-2xl md:p-10"><p className="eyebrow">Whole trip</p><h2 id="travellers-title" className="mt-3 font-serif text-4xl">How many people are travelling on this trip?</h2><p className="mt-3 text-sm leading-6 text-slate/65">Enter everyone travelling with Roam Ceylon, including people who may skip this particular experience.</p><div className="mt-5 rounded-2xl border border-gold/25 bg-gold/10 p-4 text-sm leading-6"><strong className="block text-forest">Trip travellers and experience participants are different.</strong>Your whole-trip numbers must include everyone selected for this experience.</div><div className="mt-6"><ExperienceParticipants counts={counts} onChange={setCounts} dark={false}/></div>{!valid&&<p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm leading-6 text-red-800">The whole-trip traveller count cannot be lower than the participants already selected for this experience.</p>}<div className="mt-7 flex justify-end gap-3"><Button variant="ghost" onClick={onCancel}>Not now</Button><Button disabled={total(counts)===0||!valid} onClick={()=>onConfirm(counts)}>Save trip travellers</Button></div></motion.div></motion.div>}</AnimatePresence>;
}

export function ExperienceFooterCTA({experience,globalTravellers=emptyCounts,initialParticipants,onInclude,onParticipantsChange,included=false}:{experience:JourneyExperience;globalTravellers?:ParticipantCounts;initialParticipants?:ParticipantCounts;onInclude?:(participants:ParticipantCounts,journeyTravellers:ParticipantCounts)=>void;onParticipantsChange?:(participants:ParticipantCounts)=>void;included?:boolean}){
  const [participants,setParticipants]=useState<ParticipantCounts>(initialParticipants&&total(initialParticipants)?initialParticipants:globalTravellers);
  const [askingTravellers,setAskingTravellers]=useState(false);
  const [updated,setUpdated]=useState(false);
  useEffect(()=>{if(!total(participants)&&total(globalTravellers))setParticipants(globalTravellers)},[globalTravellers,participants]);
  useEffect(()=>{if(initialParticipants&&total(initialParticipants))setParticipants(initialParticipants)},[initialParticipants]);
  const validForTrip=!total(globalTravellers)||withinTrip(participants,globalTravellers);
  const include=()=>{if(!total(globalTravellers)){setAskingTravellers(true);return}if(total(participants)&&validForTrip)onInclude?.(participants,globalTravellers)};
  const changeParticipants=(counts:ParticipantCounts)=>{setUpdated(false);setParticipants(counts)};
  const updateParticipants=()=>{if(!validForTrip||!total(participants))return;onParticipantsChange?.(participants);setUpdated(true)};
  return <section className="bg-forest py-16 text-ivory md:py-24"><div className="shell grid items-center gap-10 md:grid-cols-[1.1fr_.9fr]"><div><p className="eyebrow text-gold-light">Make it part of your story</p><h2 className="mt-4 max-w-xl font-serif text-4xl leading-tight md:text-6xl">{included?"Update experience participants.":"Design my journey with this experience."}</h2><p className="mt-5 max-w-xl leading-8 text-ivory/65">{included?"Adjust who will take part, then save the updated participant numbers. You can remove this experience directly from its selected card.":"Choose who will take part. This can be different from the total number travelling with you."}</p></div><div><ExperienceParticipants counts={participants} onChange={changeParticipants}/>{!validForTrip&&<p role="alert" className="mt-4 rounded-xl border border-gold-light/30 bg-gold/10 p-4 text-sm leading-6 text-gold-light">Experience participants cannot exceed your whole-trip travellers. Reduce these participants or increase the traveller count in the Plan step.</p>}<Button variant={included?"outline":"accent"} size="lg" className={cn("mt-6 w-full",included&&"border-gold-light/50 text-gold-light hover:bg-white/10")} disabled={total(participants)===0||!validForTrip} onClick={included?updateParticipants:include}>{included?"Update participants":"Include this experience in my journey"}</Button>{included&&<p aria-live="polite" className={cn("mt-3 text-center text-xs font-semibold transition",updated?"text-gold-light":"text-ivory/45")}>{updated?<><Check className="mr-1 inline size-4"/>Participant numbers updated in your journey.</>:"Changes are saved when you select Update participants."}</p>}</div></div><JourneyTravellersModal open={askingTravellers} initial={globalTravellers} minimum={participants} onCancel={()=>setAskingTravellers(false)} onConfirm={counts=>{setAskingTravellers(false);const next=total(participants)?participants:counts;setParticipants(next);onInclude?.(next,counts)}}/></section>;
}

export function ExperienceRelated({experiences,onOpen}:{experiences:JourneyExperience[];onOpen?:(experience:JourneyExperience)=>void}){
  if(!experiences.length)return null;
  return <section className="shell py-14 md:py-20"><p className="eyebrow">Continue discovering</p><h2 className="mt-3 font-serif text-4xl md:text-5xl">You may also like</h2><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{experiences.slice(0,4).map(experience=>onOpen?<button key={experience.id} onClick={()=>onOpen(experience)} className="group overflow-hidden rounded-2xl bg-white text-left shadow-[0_14px_40px_rgba(26,40,35,.08)] transition hover:-translate-y-1"><RelatedMiniCard experience={experience}/></button>:<Link key={experience.id} href={`/experiences/${experience.slug}`} className="group overflow-hidden rounded-2xl bg-white shadow-[0_14px_40px_rgba(26,40,35,.08)] transition hover:-translate-y-1"><RelatedMiniCard experience={experience}/></Link>)}</div></section>;
}

function RelatedMiniCard({experience}:{experience:JourneyExperience}){
  return <><div className="relative aspect-[16/10] overflow-hidden bg-sand">{experience.hero_image_url&&<Image src={experience.hero_image_url} alt={experience.image_alt||experience.name} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover transition duration-700 group-hover:scale-105"/>}</div><div className="p-4"><p className="text-[.62rem] font-bold uppercase tracking-[.16em] text-gold-dark">{experience.category||"Experience"}</p><h3 className="mt-2 line-clamp-2 font-serif text-lg leading-snug">{experience.name}</h3><p className="mt-2 line-clamp-1 text-xs text-stone">{experience.destinationNames?.join(" · ")||"Sri Lanka"}</p></div></>;
}

function DetailContents({experience,related,onClose,globalTravellers,initialParticipants,onInclude,onParticipantsChange,included,onRelatedOpen}:{experience:JourneyExperience;related:JourneyExperience[];onClose?:()=>void;globalTravellers?:ParticipantCounts;initialParticipants?:ParticipantCounts;onInclude?:(participants:ParticipantCounts,journeyTravellers:ParticipantCounts)=>void;onParticipantsChange?:(participants:ParticipantCounts)=>void;included?:boolean;onRelatedOpen?:(experience:JourneyExperience)=>void}){
  return <article className="bg-ivory text-slate"><ExperienceHero experience={experience} onClose={onClose}/><ExperienceStory experience={experience}/><ExperienceGallery experience={experience}/><ExperienceHighlights experience={experience}/><EditorialSection eyebrow="Distinctly this place" title="What makes it unique" items={experience.unique_points}/><ExperienceInfo experience={experience}/><ExperienceIncluded experience={experience}/><EditorialSection eyebrow="Close by" title="Nearby attractions" items={experience.nearby_attractions}/><ExperienceTips experience={experience}/><ExperienceFooterCTA experience={experience} globalTravellers={globalTravellers} initialParticipants={initialParticipants} onInclude={onInclude} onParticipantsChange={onParticipantsChange} included={included}/><ExperienceRelated experiences={related} onOpen={onRelatedOpen}/></article>;
}

export function ExperienceDiscovery({experiences,globalTravellers=emptyCounts,selectedIds=[],participantsByExperience={},onInclude,onRemove,onParticipantsChange,compact=false}:{experiences:JourneyExperience[];globalTravellers?:ParticipantCounts;selectedIds?:string[];participantsByExperience?:Record<string,ParticipantCounts>;onInclude?:(experience:JourneyExperience,participants:ParticipantCounts,journeyTravellers:ParticipantCounts)=>void;onRemove?:(experience:JourneyExperience)=>void;onParticipantsChange?:(experience:JourneyExperience,participants:ParticipantCounts)=>void;compact?:boolean}){
  const [active,setActive]=useState<JourneyExperience|null>(null);
  useEffect(()=>{document.body.style.overflow=active?"hidden":"";return()=>{document.body.style.overflow=""}},[active]);
  const related=useMemo(()=>active?experiences.filter(item=>item.id!==active.id&&(item.category===active.category||item.destinationIds.some(id=>active.destinationIds.includes(id)))).slice(0,4):[],[active,experiences]);
  if(!experiences.length)return <div className="mt-10 rounded-[2rem] bg-sand-light px-7 py-16 text-center text-stone">Choose a destination to discover its experiences.</div>;
  return <><motion.div layout className={cn("mt-10 grid",compact?"gap-5 md:grid-cols-2":"gap-7 md:grid-cols-2")}>{experiences.map(experience=>{const selected=selectedIds.includes(experience.id);return <ExperienceCard key={experience.id} experience={experience} compact={compact} selected={selected} onOpen={()=>setActive(experience)} onRemove={selected?()=>onRemove?.(experience):undefined}/>})}</motion.div><AnimatePresence>{active&&<motion.div className="fixed inset-0 z-[70] overflow-y-auto bg-ivory" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><DetailContents experience={active} related={related} onClose={()=>setActive(null)} globalTravellers={globalTravellers} initialParticipants={participantsByExperience[active.id]} included={selectedIds.includes(active.id)} onInclude={(participants,journeyTravellers)=>{const selectedExperience=active;setActive(null);onInclude?.(selectedExperience,participants,journeyTravellers)}} onParticipantsChange={participants=>{const selectedExperience=active;setActive(null);onParticipantsChange?.(selectedExperience,participants)}} onRelatedOpen={setActive}/></motion.div>}</AnimatePresence></>;
}

export function ExperienceCatalogue({experiences}:{experiences:JourneyExperience[]}){
  const [journey,setJourney]=useState<JourneyState>(emptyJourneyState);
  useEffect(()=>{const saved=readJourneyState();if(saved)setJourney(saved);return subscribeJourneyState(setJourney)},[]);
  const persist=(next:JourneyState)=>{setJourney(next);writeJourneyState(next)};
  const include=(experience:JourneyExperience,participants:ParticipantCounts,travellers:ParticipantCounts)=>{
    persist(includeExperienceSelection(journey,experience,participants,travellers));
    const query=new URLSearchParams({experience:experience.id,step:"2",adults:String(travellers.adults),children:String(travellers.children),infants:String(travellers.infants),experienceAdults:String(participants.adults),experienceChildren:String(participants.children),experienceInfants:String(participants.infants)});
    window.location.assign(`/journey-builder?${query.toString()}`);
  };
  return <ExperienceDiscovery experiences={experiences} globalTravellers={journey.travellerCounts} selectedIds={journey.selectedExperienceIds} participantsByExperience={journey.experienceParticipants} onInclude={include} onRemove={experience=>persist(removeExperienceSelection(journey,experience.id))} onParticipantsChange={(experience,participants)=>{persist({...journey,experienceParticipants:{...journey.experienceParticipants,[experience.id]:participants}});window.location.assign("/journey-builder?step=2")}}/>;
}

export function ExperienceEditorialPage({experience,related}:{experience:JourneyExperience;related:JourneyExperience[]}){
  const [journey,setJourney]=useState<JourneyState>(emptyJourneyState);
  useEffect(()=>{const saved=readJourneyState();if(saved)setJourney(saved);return subscribeJourneyState(setJourney)},[]);
  const selected=journey.selectedExperienceIds.includes(experience.id);
  const persist=(next:JourneyState)=>{setJourney(next);writeJourneyState(next)};
  const include=(participants:ParticipantCounts,journeyTravellers:ParticipantCounts)=>{
    const next=includeExperienceSelection(journey,experience,participants,journeyTravellers);
    persist(next);
    const query=new URLSearchParams({experience:experience.id,step:"2",adults:String(journeyTravellers.adults),children:String(journeyTravellers.children),infants:String(journeyTravellers.infants),experienceAdults:String(participants.adults),experienceChildren:String(participants.children),experienceInfants:String(participants.infants)});
    window.location.assign(`/journey-builder?${query.toString()}`);
  };
  const updateParticipants=(participants:ParticipantCounts)=>{
    persist({...journey,experienceParticipants:{...journey.experienceParticipants,[experience.id]:participants}});
    window.location.assign("/journey-builder?step=2");
  };
  return <><div className="shell py-5"><Link href="/experiences" className="inline-flex items-center gap-2 text-sm font-semibold text-slate/65 hover:text-slate"><ArrowLeft className="size-4"/>All experiences</Link></div><DetailContents experience={experience} related={related} globalTravellers={journey.travellerCounts} initialParticipants={journey.experienceParticipants[experience.id]} included={selected} onInclude={include} onParticipantsChange={updateParticipants}/></>;
}
