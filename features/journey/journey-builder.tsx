"use client";

import Image from "next/image";
import Link from "next/link";
import {AnimatePresence,motion} from "motion/react";
import {Check,ChevronLeft,ChevronRight,Download,MapPin,Sparkles} from "lucide-react";
import {useMemo,useState} from "react";
import {Button} from "@/components/ui/button";
import {cn} from "@/lib/utils";
import type {JourneyBootstrap} from "@/lib/journey/journey-service";
import {availableDestinations,availableExperiences,availableStays} from "@/lib/journey/journey-selectors";
import {usePackageQuote} from "@/lib/pricing/use-package-quote";
import {JourneyProvider,useJourney} from "./journey-store";
import {SriLankaMap} from "@/components/map/sri-lanka-map";
import {getRouteEstimate} from "@/lib/journey/route";
import {useHydrated} from "@/lib/hooks/use-hydrated";

const steps=["Theme","Destination","Experience","Plan"] as const;
type Card={id:string;name:string;hero_image_url:string|null;short_description:string|null;category?:string|null};

function Builder({data}:{data:JourneyBootstrap}){
  const {state,dispatch}=useJourney();
  const [step,setStep]=useState(0);
  const [planTab,setPlanTab]=useState("Stay");
  const destinations=useMemo(()=>availableDestinations(data.destinations,state.selectedThemeIds),[data.destinations,state.selectedThemeIds]);
  const experiences=useMemo(()=>availableExperiences(data.experiences,state.selectedDestinationIds),[data.experiences,state.selectedDestinationIds]);
  const stays=useMemo(()=>availableStays(data.stays,state.selectedDestinationIds),[data.stays,state.selectedDestinationIds]);
  const vehicles=data.vehicles.filter(item=>item.nationwide||item.destinationIds.some(id=>state.selectedDestinationIds.includes(id)));
  const guides=data.guides.map(item=>({...item,relevance:item.destinationIds.filter(id=>state.selectedDestinationIds.includes(id)).length*4+item.themeIds.filter(id=>state.selectedThemeIds.includes(id)).length*2+item.experienceIds.filter(id=>state.selectedExperienceIds.includes(id)).length*3+(item.verified?1:0)})).filter(item=>item.nationwide||item.relevance>0).sort((a,b)=>b.relevance-a.relevance);
  const current=[data.themes,destinations,experiences][step] as Card[]|undefined;
  const selected=[state.selectedThemeIds,state.selectedDestinationIds,state.selectedExperienceIds][step]||[];
  const fields=["selectedThemeIds","selectedDestinationIds","selectedExperienceIds"] as const;
  const card=(item:Card)=><button key={item.id} onClick={()=>dispatch({type:"toggle",field:fields[step],id:item.id})} className={cn("group overflow-hidden rounded-3xl border bg-white text-left transition",selected.includes(item.id)?"border-gold ring-2 ring-gold/25":"border-stone/15 hover:-translate-y-1")}><div className="relative aspect-[16/9] bg-sand">{item.hero_image_url&&<Image src={item.hero_image_url} alt={item.name} fill sizes="50vw" className="object-cover transition duration-700 group-hover:scale-105"/>}<span className={cn("absolute right-4 top-4 grid size-8 place-items-center rounded-full border backdrop-blur",selected.includes(item.id)?"border-gold bg-gold text-white":"border-white/50 bg-slate/30 text-white")}>{selected.includes(item.id)&&<Check className="size-4"/>}</span></div><div className="p-5">{item.category&&<p className="text-xs font-bold uppercase tracking-widest text-gold">{item.category}</p>}<h2 className="mt-2 font-serif text-2xl">{item.name}</h2><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate/60">{item.short_description}</p></div></button>;

  return <div className="shell grid gap-8 py-12 lg:grid-cols-[1fr_340px]"><section><div className="mb-10 flex gap-2 overflow-x-auto">{steps.map((label,index)=><button key={label} onClick={()=>index<=step&&setStep(index)} className={cn("flex min-w-fit items-center gap-2 rounded-full px-4 py-2 text-xs font-bold",index===step?"bg-forest text-ivory":index<step?"bg-sand text-forest":"bg-stone/10 text-stone")}>{index<step?<Check className="size-3"/>:index+1} {label}</button>)}</div><AnimatePresence mode="wait"><motion.div key={step} initial={{opacity:0,x:22}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-18}}><p className="eyebrow mb-3">Step {step+1} of 4</p><h1 className="font-serif text-4xl md:text-6xl">{["What kind of journey draws you in?","Where would you like to wake up?","Choose the moments that matter.","Complete your journey."][step]}</h1><p className="mt-4 max-w-2xl text-slate/60">{step===1&&!state.selectedThemeIds.length?"Choose a theme to reveal its linked destinations.":step===2&&!state.selectedDestinationIds.length?"Choose a destination to reveal its linked experiences.":"Your choices are saved on this device as you build."}</p>{step<3?<><div className="mt-10 grid gap-5 md:grid-cols-2">{current?.map(card)}</div>{step===1&&<div className="mt-10"><SriLankaMap destinations={destinations} selectedIds={state.selectedDestinationIds} onSelect={id=>dispatch({type:"toggle",field:"selectedDestinationIds",id})}/></div>}</>:<div className="mt-10"><div className="mb-5 grid gap-4 rounded-2xl bg-sand-light p-5 md:grid-cols-2"><label className="grid gap-2 text-sm font-semibold">Arrival date<input type="date" value={state.travelDates.start} onChange={event=>dispatch({type:"dates",start:event.target.value,end:state.travelDates.end})} className="rounded-xl border border-stone/30 bg-white px-4 py-3"/></label><label className="grid gap-2 text-sm font-semibold">Departure date<input type="date" min={state.travelDates.start||undefined} value={state.travelDates.end} onChange={event=>dispatch({type:"dates",start:state.travelDates.start,end:event.target.value})} className="rounded-xl border border-stone/30 bg-white px-4 py-3"/></label><label className="grid gap-2 text-sm font-semibold">Adults<input type="number" min="1" value={state.travellerCounts.adults} onChange={event=>dispatch({type:"travellers",adults:Number(event.target.value),children:state.travellerCounts.children})} className="rounded-xl border border-stone/30 bg-white px-4 py-3"/></label><label className="grid gap-2 text-sm font-semibold">Children<input type="number" min="0" value={state.travellerCounts.children} onChange={event=>dispatch({type:"travellers",adults:state.travellerCounts.adults,children:Number(event.target.value)})} className="rounded-xl border border-stone/30 bg-white px-4 py-3"/></label></div><div className="flex gap-2 rounded-2xl bg-sand-light p-2">{["Stay","Getting Around","Local Guides"].map(tab=><button onClick={()=>setPlanTab(tab)} key={tab} className={cn("flex-1 rounded-xl px-3 py-3 text-sm font-bold",tab===planTab?"bg-white shadow-sm":"text-slate/50")}>{tab}</button>)}</div><div className="mt-5 grid gap-4">{planTab==="Stay"?(stays.length?stays.map(item=>{const selectedStay=state.selectedStayIdsByDestination[item.destinationId]===item.id;return <button key={item.id} onClick={()=>dispatch({type:"stay",destinationId:item.destinationId,stayId:selectedStay?"":item.id})} className={cn("rounded-2xl border bg-white p-5 text-left",selectedStay?"border-gold ring-2 ring-gold/25":"border-stone/20")}><strong>{item.name}</strong><span className="block text-sm text-stone">{item.property_type}{item.nightly_rate_usd!==null?` · $${item.nightly_rate_usd}/night`:" · Price on request"}</span></button>}):<Empty text="No published stays are available for your selected destinations yet."/>):planTab==="Getting Around"?(vehicles.length?vehicles.map(item=>{const isSelected=state.selectedVehicleId===item.id;return <button key={item.id} onClick={()=>dispatch({type:"vehicle",id:isSelected?null:item.id})} className={cn("rounded-2xl border bg-white p-5 text-left",isSelected?"border-gold ring-2 ring-gold/25":"border-stone/20")}><strong>{item.listing_title}</strong><span className="block text-sm text-stone">{item.vehicle_type} · {item.passenger_capacity||"Flexible"} guests{item.daily_rate_usd!==null?` · $${item.daily_rate_usd}/day`:" · Price on request"}</span></button>}):<Empty text="No published vehicle partners match this journey yet."/>):(guides.length?guides.map(item=>{const isSelected=state.selectedGuideId===item.id;return <button key={item.id} onClick={()=>dispatch({type:"guide",id:isSelected?null:item.id})} className={cn("rounded-2xl border bg-white p-5 text-left",isSelected?"border-gold ring-2 ring-gold/25":"border-stone/20")}><strong>{item.name}</strong><span className="block text-sm text-stone">{item.languages.join(" · ")}{item.daily_rate_usd!==null?` · $${item.daily_rate_usd}/day`:" · Price on request"}</span></button>}):<Empty text="No matching published local guides are currently available."/>)}</div>{state.selectedDestinationIds.length>0&&<div className="mt-8"><SriLankaMap destinations={data.destinations} selectedIds={state.selectedDestinationIds}/></div>}</div>}<div className="mt-10 flex justify-between"><Button variant="ghost" disabled={step===0} onClick={()=>setStep(value=>value-1)}><ChevronLeft/>Back</Button>{step<3?<Button onClick={()=>setStep(value=>value+1)}>Continue<ChevronRight/></Button>:<Button asChild variant="accent"><Link href={{pathname:"/contact",query:{journey:"1",quotation:"1"}}}>Request Final Quotation</Link></Button>}</div></motion.div></AnimatePresence></section><Summary data={data}/></div>;
}

function Empty({text}:{text:string}){return <div className="rounded-2xl border border-dashed border-stone/30 p-8 text-sm text-stone">{text}</div>}

function Summary({data}:{data:JourneyBootstrap}){
  const {state}=useJourney();
  const selectedStays=data.stays.filter(item=>Object.values(state.selectedStayIdsByDestination).includes(item.id));
  const vehicle=data.vehicles.find(item=>item.id===state.selectedVehicleId)||null;
  const guide=data.guides.find(item=>item.id===state.selectedGuideId)||null;
  const route=getRouteEstimate(data.destinations,state.selectedDestinationIds);
  const quoteRequest={selectedDestinationIds:state.selectedDestinationIds,selectedExperienceIds:state.selectedExperienceIds,selectedStayIds:selectedStays.map(item=>item.id),selectedVehicleId:state.selectedVehicleId,selectedGuideId:state.selectedGuideId,travelDates:state.travelDates,travellerCounts:state.travellerCounts};
  const {quote,loading,error}=usePackageQuote(quoteRequest);
  const travellers=state.travellerCounts.adults+state.travellerCounts.children;
  const exportPdf=async()=>{
    const {PDFDocument,StandardFonts,rgb}=await import("pdf-lib");
    const pdf=await PDFDocument.create();
    const page=pdf.addPage([595,842]);
    const regular=await pdf.embedFont(StandardFonts.Helvetica);
    const bold=await pdf.embedFont(StandardFonts.HelveticaBold);
    const logoBytes=await fetch("/assets/logo/roam-ceylon-elephant.png").then(response=>response.arrayBuffer());
    const logo=await pdf.embedPng(logoBytes);
    const logoSize=logo.scale(.14);
    page.drawImage(logo,{x:45,y:742,width:logoSize.width,height:logoSize.height});
    const names=(ids:string[],items:Card[])=>ids.map(id=>items.find(item=>item.id===id)?.name).filter(Boolean).join(", ")||"None";
    const lines=[
      "Roam Ceylon - Journey Summary",
      `Themes: ${names(state.selectedThemeIds,data.themes)}`,
      `Destinations: ${names(state.selectedDestinationIds,data.destinations)}`,
      `Experiences: ${names(state.selectedExperienceIds,data.experiences)}`,
      `Accommodation: ${selectedStays.map(item=>item.name).join(", ")||"None"}`,
      `Vehicle: ${vehicle?.listing_title||"None"}`,
      `Guide: ${guide?.name||"None"}`,
      `Dates: ${state.travelDates.start||"Not set"} to ${state.travelDates.end||"Not set"}`,
      `Travellers: ${state.travellerCounts.adults} adults, ${state.travellerCounts.children} children`,
      `Estimated route: ${route.estimatedDistance} km / ${route.estimatedTravelDays} travel days`,
      quote?.status==="ready"?`Total package price: ${quote.currency} ${quote.totalPackagePrice?.toFixed(2)}`:"Package price: Personal quotation required"
    ];
    page.drawText(lines[0],{x:180,y:790,size:20,font:bold,color:rgb(.07,.24,.2)});
    let y=720;
    for(const line of lines.slice(1)){
      const words=line.replace(/[^\x20-\x7E]/g," ").split(/\s+/);let row="";
      for(const word of words){const candidate=row?`${row} ${word}`:word;if(regular.widthOfTextAtSize(candidate,11)>500){page.drawText(row,{x:45,y,size:11,font:regular});y-=18;row=word}else row=candidate}
      if(row){page.drawText(row,{x:45,y,size:11,font:regular});y-=24}
    }
    const bytes=await pdf.save();const blob=new Blob([new Uint8Array(bytes)],{type:"application/pdf"});const url=URL.createObjectURL(blob);const link=document.createElement("a");link.href=url;link.download="roam-ceylon-journey.pdf";link.click();URL.revokeObjectURL(url);
  };
  const ready=quote?.status==="ready";
  const rateLabels={accommodation:"accommodation",vehicle:"vehicle",guide:"guide",experience:"experiences",destination:"destination fees"};
  const inactive=new Set(quote?.inactiveRatesFor??[]);
  const missingRates=quote?.requiresRatesFor?.filter(item=>!inactive.has(item))??[];
  const pricingMessages=[
    missingRates.length?`Add active rates for the selected ${missingRates.map(item=>rateLabels[item]).join(", ")}.`:"",
    inactive.size?`Activate the saved ${[...inactive].map(item=>rateLabels[item]).join(", ")} rate${inactive.size===1?"":"s"}.`:"",
    quote?.configurationPending?"Complete the DMC business pricing settings.":""
  ].filter(Boolean);
  const manualMessage=pricingMessages.length?pricingMessages.join(" "):"A personal quotation is required for this journey.";
  return <aside className="h-fit rounded-3xl bg-forest p-7 text-ivory lg:sticky lg:top-28"><div className="mb-6 flex items-center gap-3"><Sparkles className="text-gold-light"/><h2 className="font-serif text-2xl">Your journey</h2></div>{[[state.selectedThemeIds,data.themes,"Themes"],[state.selectedDestinationIds,data.destinations,"Destinations"],[state.selectedExperienceIds,data.experiences,"Experiences"]].map(([ids,items,label])=><div className="border-t border-ivory/10 py-5" key={label as string}><p className="mb-3 text-[.65rem] font-bold uppercase tracking-widest text-gold-light">{label as string}</p><div className="flex flex-wrap gap-2">{(ids as string[]).length?(ids as string[]).map(id=><span key={id} className="rounded-full bg-ivory/10 px-3 py-1 text-xs">{(items as Card[]).find(item=>item.id===id)?.name}</span>):<span className="text-sm text-ivory/40">Nothing selected yet</span>}</div></div>)}<div className="border-t border-ivory/10 py-5"><p className="mb-3 text-[.65rem] font-bold uppercase tracking-widest text-gold-light">Plan</p><div className="grid gap-2 text-sm text-ivory/70">{selectedStays.map(item=><span key={item.id}>{item.name}</span>)}{vehicle&&<span>{vehicle.listing_title}</span>}{guide&&<span>{guide.name}</span>}{!selectedStays.length&&!vehicle&&!guide&&<span className="text-ivory/40">Nothing selected yet</span>}</div></div><div className="border-t border-ivory/10 py-5"><div className="flex justify-between text-sm"><span>{travellers} travellers</span><span>{route.estimatedDistance} km</span></div>{loading?<p className="mt-4 text-sm text-ivory/50">Calculating your package…</p>:ready?<div className="mt-4 grid gap-3"><div className="flex items-end justify-between"><span className="text-xs text-ivory/50">Estimated Package Price</span><strong className="font-serif text-2xl">{quote.currency} {quote.totalPackagePrice?.toFixed(2)}</strong></div><div className="flex justify-between text-xs text-ivory/60"><span>Price Per Person</span><span>{quote.currency} {quote.pricePerPerson?.toFixed(2)}</span></div><div className="flex justify-between text-xs text-ivory/60"><span>Estimated Daily Cost</span><span>{quote.currency} {quote.estimatedDailyCost?.toFixed(2)}</span></div>{quote.components?.length?<div className="mt-2 grid gap-2 border-t border-ivory/10 pt-3">{quote.components.map(item=><div key={item.category} className="flex justify-between text-xs text-ivory/70"><span>{item.label}</span><span>{quote.currency} {item.amount.toFixed(2)}</span></div>)}</div>:null}<p className="border-t border-ivory/10 pt-3 text-[.7rem] leading-5 text-ivory/45">Estimated package price. Subject to availability and final confirmation.</p></div>:state.selectedDestinationIds.length?<p className="mt-4 text-sm leading-6 text-ivory/60">{error||manualMessage}</p>:<p className="mt-4 text-sm text-ivory/40">Select destinations to calculate your package.</p>}</div><Button asChild variant="accent" className={cn("mb-3 w-full",!state.selectedDestinationIds.length&&"pointer-events-none opacity-50")}><Link aria-disabled={!state.selectedDestinationIds.length} href={state.selectedDestinationIds.length?{pathname:"/contact",query:{journey:"1",quotation:"1"}}:"#"}>Request Final Quotation</Link></Button><Button onClick={exportPdf} disabled={!state.selectedDestinationIds.length} variant="outline" className="w-full border-ivory/20 text-ivory hover:bg-ivory/10"><Download/>Export Journey Summary</Button><div className="mt-4 flex items-center gap-2 text-xs text-ivory/55"><MapPin className="size-4"/>Selections persist after refresh.</div></aside>;
}

export function JourneyBuilder({data}:{data:JourneyBootstrap}){
  const hydrated=useHydrated();
  if(!hydrated)return <div className="shell grid gap-8 py-12 lg:grid-cols-[1fr_340px]" aria-label="Loading saved journey"><div className="grid h-[38rem] animate-pulse place-items-center rounded-3xl bg-sand-light"><Image src="/assets/logo/roam-ceylon-elephant.png" alt="Loading Roam Ceylon" width={220} height={125} priority className="h-auto w-[220px] rounded-2xl bg-white p-3"/></div><div className="h-80 animate-pulse rounded-3xl bg-forest/90"/></div>;
  return <JourneyProvider data={data}><Builder data={data}/></JourneyProvider>;
}
