"use client";

import Link from "next/link";
import {ArrowLeft,ArrowRight,Compass,MapPin,Sparkles} from "lucide-react";
import {useEffect,useState} from "react";
import {Button} from "@/components/ui/button";
import {ExperienceFooterCTA} from "@/features/experiences/experience-editorial";
import {ExperienceMedia} from "@/features/experiences/experience-media";
import {emptyJourneyState,pricingPlanKey,type JourneyState} from "@/features/journey/journey-store";
import {editionDisplayName} from "@/lib/brand";
import {experienceContext,experienceEditionLabels,experiencePlace} from "@/lib/experience-discovery";
import {readJourneyState,subscribeJourneyState,writeJourneyState} from "@/lib/journey/journey-persistence";
import {includeExperienceSelection} from "@/lib/journey/journey-selection";
import type {JourneyExperience,ParticipantCounts} from "@/lib/types";

function Narrative({eyebrow,title,copy}:{eyebrow:string;title:string;copy:string|null}){
  if(!copy)return null;
  return <section className="shell grid gap-8 border-t border-forest/20 py-14 md:grid-cols-[.55fr_1fr] md:py-24"><div><p className="eyebrow">{eyebrow}</p><h2 className="mt-4 max-w-md font-serif text-4xl leading-tight md:text-5xl">{title}</h2></div><div className="reading-measure whitespace-pre-line text-lg leading-9 text-muted">{copy}</div></section>;
}

function EditorialList({eyebrow,title,items}:{eyebrow:string;title:string;items:string[]}){
  if(!items.length)return null;
  return <section className="shell grid gap-8 border-t border-forest/20 py-14 md:grid-cols-[.55fr_1fr] md:py-20"><div><p className="eyebrow">{eyebrow}</p><h2 className="mt-4 max-w-md font-serif text-4xl leading-tight">{title}</h2></div><ul className="divide-y divide-forest/15 border-y border-forest/15">{items.map(item=><li key={item} className="flex gap-4 py-5 leading-7 text-muted"><Sparkles className="mt-1 size-4 shrink-0 text-gold" aria-hidden="true"/><span>{item}</span></li>)}</ul></section>;
}

function DetailGallery({experience}:{experience:JourneyExperience}){
  const images=[experience.hero_image_url,...experience.gallery].filter((value,index,values):value is string=>Boolean(value)&&values.indexOf(value)===index).slice(0,5);
  if(images.length<2)return null;
  return <section className="media-shell py-8 md:py-20"><div className="grid gap-4 md:grid-cols-12">{images.map((image,index)=><ExperienceMedia key={image} src={image} alt={experience.gallery_alt_texts[index]||`${experience.name}, view ${index+1}`} sizes={index===0?"(max-width: 768px) 100vw, 66vw":"(max-width: 768px) 100vw, 34vw"} className={index===0?"aspect-[4/3] md:col-span-8 md:row-span-2 md:aspect-auto md:min-h-[42rem]":"aspect-[4/3] md:col-span-4"}/>)}</div>{experience.image_credit?<p className="mt-4 text-xs leading-5 text-muted">Image credits: {experience.image_credit}</p>:null}</section>;
}

function PlaceAndEdition({experience}:{experience:JourneyExperience}){
  const themes=experience.themes??[];
  const destinations=experience.destinations??[];
  if(!themes.length&&!destinations.length)return null;
  return <section className="bg-sand"><div className="shell grid gap-10 py-14 md:grid-cols-2 md:py-20">
    {destinations.length?<div><MapPin className="size-6 text-gold" aria-hidden="true"/><p className="eyebrow mt-5">Where it belongs</p><h2 className="mt-4 font-serif text-4xl">Build this into your time in {destinations.map(item=>item.name).join(" and ")}.</h2><div className="mt-7 flex flex-wrap gap-3">{destinations.map(destination=><Link key={destination.id} href={`/destinations/${destination.slug}`} className="inline-flex min-h-11 items-center gap-2 border-b border-forest text-sm font-semibold">Explore {destination.name}<ArrowRight className="size-4"/></Link>)}</div></div>:null}
    {themes.length?<div><Compass className="size-6 text-gold" aria-hidden="true"/><p className="eyebrow mt-5">Journey inspiration</p><h2 className="mt-4 font-serif text-4xl">Connect it with the Editions that match your way of travelling.</h2><div className="mt-7 flex flex-wrap gap-3">{themes.map(theme=><Link key={theme.id} href={`/discover/${theme.slug}`} className="inline-flex min-h-11 items-center border border-forest/30 px-4 py-2 text-sm font-semibold transition hover:border-forest hover:bg-ivory">{editionDisplayName(theme)}</Link>)}</div></div>:null}
  </div></section>;
}

function RelatedExperiences({experiences}:{experiences:JourneyExperience[]}){
  if(!experiences.length)return null;
  return <section className="shell py-16 md:py-24"><div className="grid gap-7 border-b border-forest/20 pb-8 md:grid-cols-[.55fr_1fr]"><p className="eyebrow">Continue planning</p><h2 className="heading">More experiences to consider for your journey.</h2></div><div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-4">{experiences.slice(0,4).map(experience=><article key={experience.id}><Link href={`/experiences/${experience.slug}`} className="image-lift group block focus-ring"><ExperienceMedia src={experience.hero_image_url} alt={experience.image_alt||experience.name} sizes="(max-width: 768px) 100vw, 25vw" className="aspect-[4/3]" imageClassName="transition duration-1000 group-hover:scale-[1.035]"/><p className="mt-5 text-[.65rem] font-bold uppercase tracking-[.16em] text-gold">{experienceContext(experience)}</p><h3 className="mt-3 font-serif text-2xl leading-tight">{experience.name}</h3><span className="editorial-link mt-4 text-forest">Explore</span></Link></article>)}</div></section>;
}

export function ExperiencePublicDetail({experience,related}:{experience:JourneyExperience;related:JourneyExperience[]}){
  const [journey,setJourney]=useState<JourneyState>(emptyJourneyState);
  useEffect(()=>{const frame=requestAnimationFrame(()=>{const saved=readJourneyState();if(saved)setJourney(saved)});const unsubscribe=subscribeJourneyState(setJourney);return()=>{cancelAnimationFrame(frame);unsubscribe()}},[]);
  const selected=journey.selectedExperienceIds.includes(experience.id);
  const persist=(next:JourneyState)=>{setJourney(next);writeJourneyState(next)};
  const include=(participants:ParticipantCounts,journeyTravellers:ParticipantCounts,pricingPlanId?:string)=>{
    persist(includeExperienceSelection(journey,experience,participants,journeyTravellers,pricingPlanId));
    const query=new URLSearchParams({experience:experience.id,step:"2",adults:String(journeyTravellers.adults),children:String(journeyTravellers.children),infants:String(journeyTravellers.infants),experienceAdults:String(participants.adults),experienceChildren:String(participants.children),experienceInfants:String(participants.infants)});
    window.location.assign(`/journey-builder?${query}`);
  };
  const update=(participants:ParticipantCounts,pricingPlanId?:string)=>{
    persist({...journey,experienceParticipants:{...journey.experienceParticipants,[experience.id]:participants},selectedPricingPlanIds:pricingPlanId?{...journey.selectedPricingPlanIds,[pricingPlanKey("experience",experience.id)]:pricingPlanId}:journey.selectedPricingPlanIds});
    window.location.assign("/journey-builder?step=2");
  };
  const facts=[["Place",experiencePlace(experience)],["Duration",experience.duration],["Best considered",experience.best_season],["Experience",experience.category]].filter((item):item is [string,string]=>Boolean(item[1]));
  const editions=experienceEditionLabels(experience);
  return <article className="bg-ivory text-slate">
    <div className="shell py-4"><Link href="/experiences" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted hover:text-forest"><ArrowLeft className="size-4"/>All experiences</Link></div>
    <header className="relative isolate min-h-[64svh] overflow-hidden bg-forest text-ivory"><ExperienceMedia src={experience.hero_image_url} alt={experience.image_alt||experience.name} priority sizes="100vw" className="absolute inset-0" imageClassName="object-[center_45%]"/><div className="absolute inset-0 bg-gradient-to-t from-forest via-forest/35 to-forest/10"/><div className="shell relative flex min-h-[64svh] items-end py-12 md:py-16"><div className="max-w-5xl"><p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[.17em] text-gold-light"><MapPin className="size-4" aria-hidden="true"/>{experiencePlace(experience)}</p>{editions.length?<p className="mt-3 text-[.68rem] font-bold uppercase tracking-[.17em] text-ivory/65">{editions.slice(0,2).join(" · ")}</p>:null}<h1 className="mt-5 max-w-5xl font-serif text-[clamp(2.65rem,5.4vw,5.3rem)] leading-[.98] tracking-[-.035em]">{experience.name}</h1>{experience.short_description?<p className="mt-6 max-w-2xl text-lg leading-8 text-ivory/82">{experience.short_description}</p>:null}<Button asChild variant="accent" size="lg" className="mt-8"><Link href="#plan-this-experience">Plan this into your journey<ArrowRight/></Link></Button></div></div></header>
    <section className="shell grid gap-10 py-14 md:grid-cols-[1.25fr_.75fr] md:py-24"><div><p className="eyebrow">How it fits your journey</p><h2 className="mt-5 max-w-3xl font-serif text-4xl leading-tight md:text-6xl">A distinctive experience, arranged as part of a journey that flows.</h2><p className="mt-6 max-w-2xl text-base leading-8 text-muted">Tell us what draws you to it. We’ll consider timing, routing and the other places that make sense around it.</p></div>{facts.length?<dl className="divide-y divide-forest/20 border-y border-forest/20">{facts.map(([label,value])=><div key={label} className="grid grid-cols-[.7fr_1.3fr] gap-4 py-4"><dt className="text-xs font-bold uppercase tracking-[.14em] text-forest">{label}</dt><dd className="text-sm leading-6 text-muted">{value}</dd></div>)}</dl>:null}</section>
    <Narrative eyebrow="The experience" title="What you can look forward to." copy={experience.full_description||experience.short_description}/>
    <DetailGallery experience={experience}/>
    <EditorialList eyebrow="The moments" title="What stays with you." items={experience.highlights}/>
    <EditorialList eyebrow="Distinctly this place" title="What makes it different." items={experience.unique_points}/>
    <PlaceAndEdition experience={experience}/>
    <EditorialList eyebrow="Thoughtfully arranged" title="What is included." items={experience.included}/>
    <EditorialList eyebrow="Before you go" title="Useful things to know." items={experience.things_to_know}/>
    <EditorialList eyebrow="Local perspective" title="A little guidance." items={experience.traveller_tips}/>
    <div id="plan-this-experience" className="scroll-mt-24"><ExperienceFooterCTA experience={experience} globalTravellers={journey.travellerCounts} initialParticipants={journey.experienceParticipants[experience.id]} initialPricingPlanId={journey.selectedPricingPlanIds[pricingPlanKey("experience",experience.id)]} included={selected} onInclude={include} onParticipantsChange={update}/></div>
    <RelatedExperiences experiences={related}/>
  </article>;
}
