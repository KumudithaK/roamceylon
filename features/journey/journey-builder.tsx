"use client";

import Image from "next/image";
import {AnimatePresence,motion} from "motion/react";
import {Check,ChevronLeft,ChevronRight,Download,MapPin,Sparkles,X} from "lucide-react";
import {useMemo,useState} from "react";
import {Button} from "@/components/ui/button";
import {UnescoBadge} from "@/components/destinations/unesco-badge";
import {SriLankaMap} from "@/components/map/sri-lanka-map";
import {PricingPlanChoices,pricingPlanMeta} from "@/components/journey/pricing-plan-choices";
import {ExperienceDiscovery} from "@/features/experiences/experience-editorial";
import type {JourneyBootstrap} from "@/lib/journey/journey-service";
import {availableDestinations,availableExperiences,availableStays} from "@/lib/journey/journey-selectors";
import {exportJourneyPdf} from "@/lib/journey/export-journey-pdf";
import {getRouteEstimate} from "@/lib/journey/route";
import {usePackageQuote} from "@/lib/pricing/use-package-quote";
import type {JourneyGuide,JourneyStay,JourneyVehicle,ParticipantCounts} from "@/lib/types";
import {cn} from "@/lib/utils";
import {JourneyProvider,pricingPlanKey,useJourney,type JourneyInitialSelection} from "./journey-store";
import {QuotationModal} from "./quotation-modal";

const steps=["Theme","Destination","Experience","Plan"] as const;
type Card={id:string;name:string;hero_image_url:string|null;short_description:string|null;category?:string|null;unesco_information?:string|null};

function ChoiceCard({item,selected,onClick}:{item:Card;selected:boolean;onClick:()=>void}){
  return <button onClick={onClick} className={cn("group overflow-hidden rounded-3xl border bg-white text-left transition",selected?"border-gold ring-2 ring-gold/25":"border-stone/15 hover:-translate-y-1")}>
    <div className="relative aspect-[16/9] bg-sand">{item.hero_image_url&&<Image src={item.hero_image_url} alt={item.name} fill sizes="50vw" className="object-cover transition duration-700 group-hover:scale-105"/>}{item.unesco_information&&<UnescoBadge className="absolute bottom-4 left-4"/>}<span className={cn("absolute right-4 top-4 grid size-8 place-items-center rounded-full border backdrop-blur",selected?"border-gold bg-gold text-white":"border-white/50 bg-slate/30 text-white")}>{selected&&<Check className="size-4"/>}</span></div>
    <div className="p-5">{item.category&&<p className="text-xs font-bold uppercase tracking-widest text-gold">{item.category}</p>}<h2 className="mt-2 font-serif text-2xl">{item.name}</h2><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate/60">{item.short_description}</p></div>
  </button>;
}

function PlanOptionCard({title,meta,image,alt,selected,onClick}:{title:string;meta:string;image:string|null;alt:string|null;selected:boolean;onClick:()=>void}){
  return <button onClick={onClick} className={cn("group flex min-h-28 overflow-hidden rounded-2xl border bg-white text-left transition",selected?"border-gold ring-2 ring-gold/25":"border-stone/20 hover:-translate-y-0.5 hover:shadow-lg")}>
    <div className="relative w-28 shrink-0 bg-sand sm:w-36">{image&&<Image src={image} alt={alt||title} fill sizes="144px" className="object-cover transition duration-500 group-hover:scale-105"/>}</div>
    <div className="flex min-w-0 flex-1 items-center justify-between gap-3 p-4"><div className="min-w-0"><strong className="line-clamp-2 font-serif text-lg leading-snug">{title}</strong><span className="mt-2 line-clamp-2 block text-xs leading-5 text-stone">{meta}</span></div><span className={cn("grid size-7 shrink-0 place-items-center rounded-full border",selected?"border-gold bg-gold text-white":"border-stone/30 text-transparent")}><Check className="size-4"/></span></div>
  </button>;
}

type PlanPreview={kind:"stay";item:JourneyStay}|{kind:"vehicle";item:JourneyVehicle}|{kind:"guide";item:JourneyGuide};
function PlanSelectionModal({preview,selected,selectedPlanId,onPlanChange,onClose,onConfirm,onRemove}:{preview:PlanPreview|null;selected:boolean;selectedPlanId:string;onPlanChange:(id:string)=>void;onClose:()=>void;onConfirm:()=>void;onRemove:()=>void}){
  if(!preview)return null;
  const {kind,item}=preview;
  const title=kind==="vehicle"?item.listing_title:item.name;
  const image=kind==="guide"?item.profile_image_url:item.hero_image_url;
  const alt=item.image_alt||title;
  const gallery=[image,...item.gallery].filter((value,index,values):value is string=>Boolean(value)&&values.indexOf(value)===index);
  const description=kind==="guide"?item.short_bio:item.short_description;
  const details=kind==="stay"
    ?[item.property_type,item.amenities.length?item.amenities.slice(0,6).join(" · "):null]
    :kind==="vehicle"
      ?[item.vehicle_type,item.passenger_capacity?`${item.passenger_capacity} passengers`:null,item.luggage_capacity,item.driver_included?"Driver included":null]
      :[item.languages.length?item.languages.join(" · "):null,item.years_experience?`${item.years_experience} years of experience`:null,item.specialities.length?item.specialities.join(" · "):null];
  return <div role="dialog" aria-modal="true" aria-labelledby="plan-preview-title" className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-slate/70 p-4 backdrop-blur-sm" onMouseDown={event=>{if(event.target===event.currentTarget)onClose();}}>
    <div className="relative my-6 w-full max-w-3xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
      <button onClick={onClose} aria-label="Close details" className="absolute right-5 top-5 z-10 grid size-10 place-items-center rounded-full bg-white/90 shadow"><X className="size-5"/></button>
      <div className="relative aspect-[16/7] bg-sand">{image&&<Image src={image} alt={alt} fill sizes="768px" className="object-cover"/>}{gallery.length>1&&<div className="absolute bottom-4 left-4 flex gap-2">{gallery.slice(1,4).map((src,index)=><div key={src} className="relative size-14 overflow-hidden rounded-lg border-2 border-white bg-sand shadow"><Image src={src} alt={`${title} gallery ${index+2}`} fill sizes="56px" className="object-cover"/></div>)}</div>}</div>
      <div className="p-7 md:p-10"><p className="eyebrow">{kind==="stay"?"Accommodation":kind==="vehicle"?"Private transport":"Local guide"}</p><h2 id="plan-preview-title" className="mt-2 font-serif text-4xl">{title}</h2>{description&&<p className="mt-4 max-w-2xl leading-7 text-slate/65">{description}</p>}<div className="mt-6 flex flex-wrap gap-2">{details.filter(Boolean).map(detail=><span key={detail} className="rounded-full bg-sand-light px-4 py-2 text-xs font-semibold text-slate/70">{detail}</span>)}</div><PricingPlanChoices plans={item.pricingPlans} value={selectedPlanId} onChange={onPlanChange}/><div className="mt-8 flex flex-wrap justify-end gap-3">{selected&&<Button variant="ghost" onClick={onRemove}>Remove from journey</Button>}<Button variant="ghost" onClick={onClose}>Keep browsing</Button><Button variant="accent" disabled={item.pricingPlans.length>0&&!selectedPlanId} onClick={onConfirm}>{selected?"Update selection":kind==="stay"?"Select accommodation":kind==="vehicle"?"Select vehicle":"Select guide"}</Button></div></div>
    </div>
  </div>;
}

function PlanStep({data}:{data:JourneyBootstrap}){
  const {state,dispatch}=useJourney();
  const [planTab,setPlanTab]=useState("Stay");
  const [preview,setPreview]=useState<PlanPreview|null>(null);
  const [previewPlanId,setPreviewPlanId]=useState("");
  const stays=useMemo(()=>availableStays(data.stays,state.selectedDestinationIds),[data.stays,state.selectedDestinationIds]);
  const vehicles=data.vehicles.filter(item=>item.nationwide||item.destinationIds.some(id=>state.selectedDestinationIds.includes(id)));
  const guides=data.guides.map(item=>({...item,relevance:item.destinationIds.filter(id=>state.selectedDestinationIds.includes(id)).length*4+item.themeIds.filter(id=>state.selectedThemeIds.includes(id)).length*2+item.experienceIds.filter(id=>state.selectedExperienceIds.includes(id)).length*3+(item.verified?1:0)})).filter(item=>item.nationwide||item.relevance>0).sort((a,b)=>b.relevance-a.relevance);
  const minimumTravellers=Object.values(state.experienceParticipants).reduce((maximum,counts)=>({adults:Math.max(maximum.adults,counts.adults),children:Math.max(maximum.children,counts.children),infants:Math.max(maximum.infants,counts.infants)}),{adults:0,children:0,infants:0});
  const setTraveller=(key:keyof ParticipantCounts,value:number)=>dispatch({type:"travellers",counts:{...state.travellerCounts,[key]:value}});
  const openPreview=(next:PlanPreview)=>{
    const type=next.kind==="stay"?"accommodation":next.kind;
    setPreview(next);
    setPreviewPlanId(state.selectedPricingPlanIds[pricingPlanKey(type,next.item.id)]||next.item.pricingPlans[0]?.id||"");
  };
  return <div className="mt-10">
    <div className="mb-5 grid gap-4 rounded-2xl bg-sand-light p-5 md:grid-cols-2">
      <label className="grid gap-2 text-sm font-semibold">Arrival date<input type="date" value={state.travelDates.start} onChange={event=>dispatch({type:"dates",start:event.target.value,end:state.travelDates.end})} className="rounded-xl border border-stone/30 bg-white px-4 py-3"/></label>
      <label className="grid gap-2 text-sm font-semibold">Departure date<input type="date" min={state.travelDates.start||undefined} value={state.travelDates.end} onChange={event=>dispatch({type:"dates",start:state.travelDates.start,end:event.target.value})} className="rounded-xl border border-stone/30 bg-white px-4 py-3"/></label>
      {(["adults","children","infants"] as const).map(key=><label key={key} className="grid gap-2 text-sm font-semibold">{key[0].toUpperCase()+key.slice(1)}<input type="number" min={minimumTravellers[key]} value={state.travellerCounts[key]} onChange={event=>setTraveller(key,Number(event.target.value))} className="rounded-xl border border-stone/30 bg-white px-4 py-3"/>{minimumTravellers[key]>0&&<small className="font-normal text-stone">Minimum {minimumTravellers[key]} — already joining selected experiences.</small>}</label>)}
    </div>
    <div className="flex gap-2 rounded-2xl bg-sand-light p-2">{["Stay","Getting Around","Local Guides"].map(tab=><button onClick={()=>setPlanTab(tab)} key={tab} className={cn("flex-1 rounded-xl px-3 py-3 text-sm font-bold",tab===planTab?"bg-white shadow-sm":"text-slate/50")}>{tab}</button>)}</div>
    <div className="mt-5 grid gap-4 md:grid-cols-2">
      {planTab==="Stay"?(stays.length?stays.map(item=>{const selected=state.selectedStayIdsByDestination[item.destinationId]===item.id;return <PlanOptionCard key={item.id} title={item.name} meta={`${item.property_type||"Accommodation"} · ${pricingPlanMeta(item.pricingPlans,state.selectedPricingPlanIds[pricingPlanKey("accommodation",item.id)])}`} image={item.hero_image_url} alt={item.image_alt} selected={selected} onClick={()=>openPreview({kind:"stay",item})}/>;}):<Empty text="No published stays are available for your selected destinations yet."/>):null}
      {planTab==="Getting Around"?(vehicles.length?vehicles.map(item=>{const selected=state.selectedVehicleId===item.id;return <PlanOptionCard key={item.id} title={item.listing_title} meta={`${item.vehicle_type||"Private transport"} · ${item.passenger_capacity||"Flexible"} guests · ${pricingPlanMeta(item.pricingPlans,state.selectedPricingPlanIds[pricingPlanKey("vehicle",item.id)])}`} image={item.hero_image_url} alt={item.image_alt} selected={selected} onClick={()=>openPreview({kind:"vehicle",item})}/>;}):<Empty text="No published vehicle partners match this journey yet."/>):null}
      {planTab==="Local Guides"?(guides.length?guides.map(item=>{const selected=state.selectedGuideId===item.id;return <PlanOptionCard key={item.id} title={item.name} meta={`${item.languages.join(" · ")||"Local guide"} · ${pricingPlanMeta(item.pricingPlans,state.selectedPricingPlanIds[pricingPlanKey("guide",item.id)])}`} image={item.profile_image_url} alt={item.image_alt} selected={selected} onClick={()=>openPreview({kind:"guide",item})}/>;}):<Empty text="No matching published local guides are currently available."/>):null}
    </div>
    {state.selectedDestinationIds.length>0&&<div className="mt-8"><SriLankaMap destinations={data.destinations} selectedIds={state.selectedDestinationIds}/></div>}
    <PlanSelectionModal preview={preview} selected={preview?.kind==="stay"?state.selectedStayIdsByDestination[preview.item.destinationId]===preview.item.id:preview?.kind==="vehicle"?state.selectedVehicleId===preview.item.id:preview?.kind==="guide"?state.selectedGuideId===preview.item.id:false} selectedPlanId={previewPlanId} onPlanChange={setPreviewPlanId} onClose={()=>setPreview(null)} onRemove={()=>{if(!preview)return;if(preview.kind==="stay")dispatch({type:"stay",destinationId:preview.item.destinationId,stayId:""});else if(preview.kind==="vehicle")dispatch({type:"vehicle",id:null});else dispatch({type:"guide",id:null});setPreview(null)}} onConfirm={()=>{if(!preview)return;if(preview.kind==="stay")dispatch({type:"stay",destinationId:preview.item.destinationId,stayId:preview.item.id,pricingPlanId:previewPlanId});else if(preview.kind==="vehicle")dispatch({type:"vehicle",id:preview.item.id,pricingPlanId:previewPlanId});else dispatch({type:"guide",id:preview.item.id,pricingPlanId:previewPlanId});setPreview(null)}}/>
  </div>;
}

function Builder({data}:{data:JourneyBootstrap}){
  const {state,dispatch}=useJourney();
  const step=state.currentStep;
  const setStep=(value:number)=>dispatch({type:"step",value});
  const [quotationOpen,setQuotationOpen]=useState(false);
  const destinations=useMemo(()=>availableDestinations(data.destinations,state.selectedThemeIds),[data.destinations,state.selectedThemeIds]);
  const experiences=useMemo(()=>availableExperiences(data.experiences,state.selectedDestinationIds),[data.experiences,state.selectedDestinationIds]);
  const current=step===0?data.themes:destinations;
  const selected=step===0?state.selectedThemeIds:state.selectedDestinationIds;
  const field=step===0?"selectedThemeIds":"selectedDestinationIds";
  const selectedStays=data.stays.filter(item=>Object.values(state.selectedStayIdsByDestination).includes(item.id));
  const quoteRequest={selectedDestinationIds:state.selectedDestinationIds,selectedExperienceIds:state.selectedExperienceIds,selectedStayIds:selectedStays.map(item=>item.id),selectedVehicleId:state.selectedVehicleId,selectedGuideId:state.selectedGuideId,selectedPricingPlanIds:state.selectedPricingPlanIds,travelDates:state.travelDates,travellerCounts:state.travellerCounts,experienceParticipants:state.experienceParticipants};
  const packageQuote=usePackageQuote(quoteRequest);
  return <><div className="shell grid gap-8 py-12 lg:grid-cols-[1fr_340px]">
    <section>
      <div className="mb-10 flex gap-2 overflow-x-auto">{steps.map((label,index)=><button key={label} onClick={()=>index<=step&&setStep(index)} className={cn("flex min-w-fit items-center gap-2 rounded-full px-4 py-2 text-xs font-bold",index===step?"bg-forest text-ivory":index<step?"bg-sand text-forest":"bg-stone/10 text-stone")}>{index<step?<Check className="size-3"/>:index+1} {label}</button>)}</div>
      <AnimatePresence mode="wait"><motion.div key={step} initial={{opacity:0,x:22}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-18}}>
        <p className="eyebrow mb-3">Step {step+1} of 4</p>
        <h1 className="font-serif text-4xl md:text-6xl">{["What kind of journey draws you in?","Where would you like to wake up?","Choose the moments that matter.","Complete your journey."][step]}</h1>
        <p className="mt-4 max-w-2xl text-slate/60">{step===1&&!state.selectedThemeIds.length?"Choose a theme to reveal its linked destinations.":step===2&&!state.selectedDestinationIds.length?"Choose a destination to reveal its linked experiences.":"Shape each choice as you move through your journey."}</p>
        {step<2?<><div className="mt-10 grid gap-5 md:grid-cols-2">{current.map(item=><ChoiceCard key={item.id} item={item} selected={selected.includes(item.id)} onClick={()=>dispatch({type:"toggle",field,id:item.id})}/>)}</div>{step===1&&<div className="mt-10"><SriLankaMap destinations={destinations} selectedIds={state.selectedDestinationIds} onSelect={id=>dispatch({type:"toggle",field:"selectedDestinationIds",id})}/></div>}</>:null}
        {step===2?<ExperienceDiscovery compact experiences={experiences} globalTravellers={state.travellerCounts} selectedIds={state.selectedExperienceIds} participantsByExperience={state.experienceParticipants} selectedPricingPlanIds={state.selectedPricingPlanIds} onInclude={(experience,participants,travellers,pricingPlanId)=>{dispatch({type:"travellers",counts:travellers});dispatch({type:"includeExperience",experienceId:experience.id,counts:participants,pricingPlanId})}} onRemove={experience=>dispatch({type:"removeExperience",experienceId:experience.id})} onParticipantsChange={(experience,participants,pricingPlanId)=>dispatch({type:"experienceParticipants",experienceId:experience.id,counts:participants,pricingPlanId})}/>:null}
        {step===3?<PlanStep data={data}/>:null}
        <div className="mt-10 flex justify-between"><Button variant="ghost" disabled={step===0} onClick={()=>setStep(step-1)}><ChevronLeft/>Back</Button>{step<3?<Button onClick={()=>setStep(step+1)}>Continue<ChevronRight/></Button>:<Button onClick={()=>setQuotationOpen(true)} disabled={!state.selectedDestinationIds.length} variant="accent">Request Journey Proposal</Button>}</div>
      </motion.div></AnimatePresence>
    </section>
    <Summary data={data} quoteState={packageQuote} onQuotation={()=>setQuotationOpen(true)}/>
  </div><QuotationModal open={quotationOpen} onClose={()=>setQuotationOpen(false)} state={state} quote={packageQuote.quote}/></>;
}

function Empty({text}:{text:string}){return <div className="rounded-2xl border border-dashed border-stone/30 p-8 text-sm text-stone">{text}</div>}

function Summary({data,quoteState,onQuotation}:{data:JourneyBootstrap;quoteState:ReturnType<typeof usePackageQuote>;onQuotation:()=>void}){
  const {state}=useJourney();
  const [exporting,setExporting]=useState(false);
  const selectedStays=data.stays.filter(item=>Object.values(state.selectedStayIdsByDestination).includes(item.id));
  const vehicle=data.vehicles.find(item=>item.id===state.selectedVehicleId)||null;
  const guide=data.guides.find(item=>item.id===state.selectedGuideId)||null;
  const selectedPlanName=(type:"accommodation"|"vehicle"|"guide"|"experience",item:{id:string;pricingPlans:JourneyStay["pricingPlans"]})=>item.pricingPlans.find(plan=>plan.id===state.selectedPricingPlanIds[pricingPlanKey(type,item.id)])?.name||item.pricingPlans[0]?.name||null;
  const route=getRouteEstimate(data.destinations,state.selectedDestinationIds);
  const {quote,loading,error}=quoteState;
  const travellers=state.travellerCounts.adults+state.travellerCounts.children+state.travellerCounts.infants;
  const exportPdf=async()=>{
    setExporting(true);
    try{
      const selectedDestinations=state.selectedDestinationIds.map(id=>data.destinations.find(item=>item.id===id)).filter((item):item is JourneyBootstrap["destinations"][number]=>Boolean(item));
      await exportJourneyPdf({
        themes:state.selectedThemeIds.map(id=>data.themes.find(item=>item.id===id)?.name).filter((name):name is string=>Boolean(name)),
        destinations:selectedDestinations.map(item=>item.name),
        routeCoordinates:selectedDestinations.filter(item=>Number.isFinite(item.latitude)&&Number.isFinite(item.longitude)).map(item=>({name:item.name,latitude:Number(item.latitude),longitude:Number(item.longitude)})),
        experiences:state.selectedExperienceIds.map(id=>{
          const item=data.experiences.find(experience=>experience.id===id);if(!item)return null;
          const plan=selectedPlanName("experience",item);
          const counts=state.experienceParticipants[item.id];
          const participants=counts?counts.adults+counts.children+counts.infants:0;
          return `${item.name}${participants?` - ${participants} participant${participants===1?"":"s"}`:""}${plan?` - ${plan}`:""}`;
        }).filter((name):name is string=>Boolean(name)),
        accommodations:selectedStays.map(item=>`${item.name}${selectedPlanName("accommodation",item)?` - ${selectedPlanName("accommodation",item)}`:""}`),
        vehicle:vehicle?`${vehicle.listing_title}${selectedPlanName("vehicle",vehicle)?` - ${selectedPlanName("vehicle",vehicle)}`:""}`:null,
        guide:guide?`${guide.name}${selectedPlanName("guide",guide)?` - ${selectedPlanName("guide",guide)}`:""}`:null,
        travelDates:state.travelDates,
        travellerCounts:state.travellerCounts,
        estimatedDistance:route.estimatedDistance,
        estimatedTravelDays:route.estimatedTravelDays,
        quote
      });
    }finally{setExporting(false)}
  };
  const ready=quote?.status==="ready";
  const rateLabels={accommodation:"accommodation",vehicle:"vehicle",guide:"guide",experience:"experiences",destination:"destination fees"};
  const inactive=new Set(quote?.inactiveRatesFor??[]);
  const missingRates=quote?.requiresRatesFor?.filter(item=>!inactive.has(item))??[];
  const pricingMessages=[missingRates.length?`Add active rates for the selected ${missingRates.map(item=>rateLabels[item]).join(", ")}.`:"",inactive.size?`Activate the saved ${[...inactive].map(item=>rateLabels[item]).join(", ")} rate${inactive.size===1?"":"s"}.`:"",quote?.configurationPending?"Complete the DMC business pricing settings.":""].filter(Boolean);
  const manualMessage=pricingMessages.length?pricingMessages.join(" "):"A personal quotation is required for this journey.";
  return <aside className="h-fit rounded-3xl bg-forest p-7 text-ivory lg:sticky lg:top-28">
    <div className="mb-6 flex items-center gap-3"><Sparkles className="text-gold-light"/><h2 className="font-serif text-2xl">Your journey</h2></div>
    {[[state.selectedThemeIds,data.themes,"Themes"],[state.selectedDestinationIds,data.destinations,"Destinations"]].map(([ids,items,label])=><div className="border-t border-ivory/10 py-5" key={label as string}><p className="mb-3 text-[.65rem] font-bold uppercase tracking-widest text-gold-light">{label as string}</p><div className="flex flex-wrap gap-2">{(ids as string[]).length?(ids as string[]).map(id=><span key={id} className="rounded-full bg-ivory/10 px-3 py-1 text-xs">{(items as Card[]).find(item=>item.id===id)?.name}</span>):<span className="text-sm text-ivory/40">Nothing selected yet</span>}</div></div>)}
    <div className="border-t border-ivory/10 py-5"><p className="mb-3 text-[.65rem] font-bold uppercase tracking-widest text-gold-light">Experiences</p><div className="flex flex-wrap gap-2">{state.selectedExperienceIds.length?state.selectedExperienceIds.map(id=>{const item=data.experiences.find(experience=>experience.id===id);const counts=state.experienceParticipants[id];const plan=item?selectedPlanName("experience",item):null;return <span key={id} className="rounded-full bg-ivory/10 px-3 py-1 text-xs">{item?.name}{counts?` · ${counts.adults+counts.children+counts.infants}`:""}{plan?` · ${plan}`:""}</span>}):<span className="text-sm text-ivory/40">Nothing selected yet</span>}</div></div>
    <div className="border-t border-ivory/10 py-5"><p className="mb-3 text-[.65rem] font-bold uppercase tracking-widest text-gold-light">Plan</p><div className="grid gap-2 text-sm text-ivory/70">{selectedStays.map(item=><span key={item.id}>{item.name}{selectedPlanName("accommodation",item)?` · ${selectedPlanName("accommodation",item)}`:""}</span>)}{vehicle&&<span>{vehicle.listing_title}{selectedPlanName("vehicle",vehicle)?` · ${selectedPlanName("vehicle",vehicle)}`:""}</span>}{guide&&<span>{guide.name}{selectedPlanName("guide",guide)?` · ${selectedPlanName("guide",guide)}`:""}</span>}{!selectedStays.length&&!vehicle&&!guide&&<span className="text-ivory/40">Nothing selected yet</span>}</div></div>
    <div className="border-t border-ivory/10 py-5"><div className="flex justify-between text-sm"><span>{travellers?`${travellers} travellers`:"Travellers not set"}</span><span>{route.estimatedDistance} km</span></div>{loading?<p className="mt-4 text-sm text-ivory/50">Calculating your package…</p>:ready?<div className="mt-4 grid gap-3"><div className="flex items-end justify-between"><span className="text-xs text-ivory/50">Estimated Package Price</span><strong className="font-serif text-2xl">{quote.currency} {quote.totalPackagePrice?.toFixed(2)}</strong></div><div className="flex justify-between text-xs text-ivory/60"><span>Price Per Person</span><span>{quote.currency} {quote.pricePerPerson?.toFixed(2)}</span></div><div className="flex justify-between text-xs text-ivory/60"><span>Estimated Daily Cost</span><span>{quote.currency} {quote.estimatedDailyCost?.toFixed(2)}</span></div>{quote.components?.length?<div className="mt-2 grid gap-2 border-t border-ivory/10 pt-3">{quote.components.map(item=><div key={item.category} className="flex justify-between text-xs text-ivory/70"><span>{item.label}</span><span>{quote.currency} {item.amount.toFixed(2)}</span></div>)}</div>:null}<p className="border-t border-ivory/10 pt-3 text-[.7rem] leading-5 text-ivory/45">Estimated package price. Subject to availability and final confirmation.</p></div>:state.selectedDestinationIds.length?<p className="mt-4 text-sm leading-6 text-ivory/60">{error||manualMessage}</p>:<p className="mt-4 text-sm text-ivory/40">Select destinations to calculate your package.</p>}</div>
    <Button onClick={onQuotation} disabled={!state.selectedDestinationIds.length} variant="accent" className="mb-3 w-full">Request Journey Proposal</Button>
    <Button onClick={exportPdf} disabled={!state.selectedDestinationIds.length||exporting} variant="outline" className="w-full border-ivory/20 text-ivory hover:bg-ivory/10"><Download/>{exporting?"Preparing PDF...":"Export Journey Summary"}</Button>
    <div className="mt-4 flex items-center gap-2 text-xs text-ivory/55"><MapPin className="size-4"/>Review and revise every choice before requesting your quote.</div>
  </aside>;
}

export function JourneyBuilder({data,initialSelection}:{data:JourneyBootstrap;initialSelection?:JourneyInitialSelection}){
  return <JourneyProvider data={data} initialSelection={initialSelection}><Builder data={data}/></JourneyProvider>;
}
