"use client";

import Image from "next/image";
import {AnimatePresence,motion} from "motion/react";
import {BedDouble,Check,ChevronLeft,ChevronRight,Download,MapPin,NotebookPen,Sparkles,UsersRound,X} from "lucide-react";
import {useMemo,useState} from "react";
import {Button} from "@/components/ui/button";
import {UnescoBadge} from "@/components/destinations/unesco-badge";
import {SriLankaMap} from "@/components/map/sri-lanka-map";
import {PricingPlanChoices,pricingPlanMeta} from "@/components/journey/pricing-plan-choices";
import {ExperienceDiscovery} from "@/features/experiences/experience-editorial";
import {guidePreferenceLabel,guidePreferenceOptions,stayPreferenceLabel,stayPreferenceOptions} from "@/lib/journey/journey-preferences";
import type {JourneyBootstrap} from "@/lib/journey/journey-service";
import {availableDestinations,availableExperiences} from "@/lib/journey/journey-selectors";
import {exportJourneyPdf} from "@/lib/journey/export-journey-pdf";
import {getRouteEstimate} from "@/lib/journey/route";
import {usePackageQuote} from "@/lib/pricing/use-package-quote";
import type {JourneyPricingPlan,JourneyVehicle,ParticipantCounts} from "@/lib/types";
import {cn} from "@/lib/utils";
import {emptyJourneyState,JourneyProvider,pricingPlanKey,useJourney,type JourneyInitialSelection} from "./journey-store";
import {QuotationModal} from "./quotation-modal";

const steps=["Theme","Destination","Experience","Journey Preferences","Journey Details","Review"] as const;
const stepTitles=["What kind of journey draws you in?","Where would you like to wake up?","Choose the moments that matter.","Shape each place around you.","Add the practical details.","Review the journey taking shape."] as const;
type Card={id:string;name:string;hero_image_url:string|null;short_description:string|null;category?:string|null;unesco_information?:string|null};

function ChoiceCard({item,selected,onClick}:{item:Card;selected:boolean;onClick:()=>void}){
  return <button onClick={onClick} className={cn("group overflow-hidden rounded-3xl border bg-white text-left transition",selected?"border-gold ring-2 ring-gold/25":"border-stone/15 hover:-translate-y-1")}>
    <div className="relative aspect-[16/9] bg-sand">{item.hero_image_url&&<Image src={item.hero_image_url} alt={item.name} fill sizes="50vw" className="object-cover transition duration-700 group-hover:scale-105"/>}{item.unesco_information&&<UnescoBadge className="absolute bottom-4 left-4"/>}<span className={cn("absolute right-4 top-4 grid size-8 place-items-center rounded-full border backdrop-blur",selected?"border-gold bg-gold text-white":"border-white/50 bg-slate/30 text-white")}>{selected&&<Check className="size-4"/>}</span></div>
    <div className="p-5">{item.category&&<p className="text-xs font-bold uppercase tracking-widest text-gold">{item.category}</p>}<h2 className="mt-2 font-serif text-2xl">{item.name}</h2><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate/60">{item.short_description}</p></div>
  </button>;
}

function JourneyPreferencesStep({data}:{data:JourneyBootstrap}){
  const {state,dispatch}=useJourney();
  const selectedDestinations=state.selectedDestinationIds.map(id=>data.destinations.find(item=>item.id===id)).filter((item):item is JourneyBootstrap["destinations"][number]=>Boolean(item));
  if(!selectedDestinations.length)return <Empty text="Choose at least one destination before adding journey preferences."/>;
  return <div className="mt-10 grid gap-6">
    {selectedDestinations.map((destination,index)=>{
      const preference=state.destinationPreferences[destination.id];
      const experiences=state.selectedExperienceIds.map(id=>data.experiences.find(item=>item.id===id)).filter((item):item is JourneyBootstrap["experiences"][number]=>item!==undefined&&item.destinationIds.includes(destination.id));
      return <article key={destination.id} className="overflow-hidden rounded-[2rem] border border-stone/15 bg-white shadow-[0_18px_55px_rgba(27,48,43,.08)]">
        <div className="grid md:grid-cols-[220px_1fr]">
          <div className="relative min-h-52 bg-sand md:min-h-full">{destination.hero_image_url&&<Image src={destination.hero_image_url} alt={destination.image_alt||destination.name} fill sizes="220px" className="object-cover"/>}<div className="absolute inset-0 bg-gradient-to-t from-slate/65 via-transparent to-transparent"/><span className="absolute bottom-5 left-5 rounded-full bg-ivory/90 px-3 py-1 text-[.65rem] font-bold uppercase tracking-[.18em] text-forest">Stop {index+1}</span></div>
          <div className="p-6 md:p-8">
            <p className="eyebrow">Preferences in {destination.province||"Sri Lanka"}</p><h2 className="mt-2 font-serif text-3xl">{destination.name}</h2>
            <div className="mt-6 border-y border-stone/15 py-5"><p className="mb-3 text-[.65rem] font-bold uppercase tracking-[.18em] text-gold">Selected experiences</p><div className="flex flex-wrap gap-2">{experiences.length?experiences.map(experience=>{const counts=state.experienceParticipants[experience.id];const total=counts?counts.adults+counts.children+counts.infants:0;return <span key={experience.id} className="rounded-full bg-sand-light px-3 py-2 text-xs text-slate/75">{experience.name}{total?` · ${total} guest${total===1?"":"s"}`:""}</span>}):<span className="text-sm text-stone">No experiences selected for this destination.</span>}</div></div>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold"><span className="flex items-center gap-2"><BedDouble className="size-4 text-gold"/>Stay preference</span><select aria-label={`Stay preference for ${destination.name}`} value={preference?.stayPreference||"recommend"} onChange={event=>dispatch({type:"stayPreference",destinationId:destination.id,value:event.target.value as typeof stayPreferenceOptions[number][0]})} className="rounded-xl border border-stone/25 bg-ivory px-4 py-3 outline-none focus:border-gold">{stayPreferenceOptions.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
              <label className="grid gap-2 text-sm font-semibold"><span className="flex items-center gap-2"><UsersRound className="size-4 text-gold"/>Guide preference</span><select aria-label={`Guide preference for ${destination.name}`} value={preference?.guidePreference||"recommend"} onChange={event=>dispatch({type:"guidePreference",destinationId:destination.id,value:event.target.value as typeof guidePreferenceOptions[number][0]})} className="rounded-xl border border-stone/25 bg-ivory px-4 py-3 outline-none focus:border-gold">{guidePreferenceOptions.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
              <label className="grid gap-2 text-sm font-semibold md:col-span-2"><span className="flex items-center gap-2"><NotebookPen className="size-4 text-gold"/>Notes for {destination.name} <span className="font-normal text-stone">(optional)</span></span><textarea aria-label={`Notes for ${destination.name}`} rows={3} value={preference?.notes||""} onChange={event=>dispatch({type:"destinationNotes",destinationId:destination.id,value:event.target.value})} placeholder="Room style, pace, accessibility, celebrations or anything your journey designer should consider…" className="rounded-xl border border-stone/25 bg-ivory px-4 py-3 leading-6 outline-none focus:border-gold"/></label>
            </div>
          </div>
        </div>
      </article>;
    })}
  </div>;
}

function VehicleCard({item,selected,onClick,selectedPlanId}:{item:JourneyVehicle;selected:boolean;onClick:()=>void;selectedPlanId:string}){
  return <button onClick={onClick} className={cn("group flex min-h-28 overflow-hidden rounded-2xl border bg-white text-left transition",selected?"border-gold ring-2 ring-gold/25":"border-stone/20 hover:-translate-y-0.5 hover:shadow-lg")}><div className="relative w-28 shrink-0 bg-sand sm:w-36">{item.hero_image_url&&<Image src={item.hero_image_url} alt={item.image_alt||item.listing_title} fill sizes="144px" className="object-cover transition duration-500 group-hover:scale-105"/>}</div><div className="flex min-w-0 flex-1 items-center justify-between gap-3 p-4"><div className="min-w-0"><strong className="line-clamp-2 font-serif text-lg leading-snug">{item.listing_title}</strong><span className="mt-2 line-clamp-2 block text-xs leading-5 text-stone">{item.vehicle_type||"Private transport"} · {item.passenger_capacity||"Flexible"} guests · {pricingPlanMeta(item.pricingPlans,selectedPlanId)}</span></div><span className={cn("grid size-7 shrink-0 place-items-center rounded-full border",selected?"border-gold bg-gold text-white":"border-stone/30 text-transparent")}><Check className="size-4"/></span></div></button>;
}

function VehicleSelectionModal({item,selected,selectedPlanId,onPlanChange,onClose,onConfirm,onRemove}:{item:JourneyVehicle|null;selected:boolean;selectedPlanId:string;onPlanChange:(id:string)=>void;onClose:()=>void;onConfirm:()=>void;onRemove:()=>void}){
  if(!item)return null;
  const gallery=[item.hero_image_url,...item.gallery].filter((value,index,values):value is string=>Boolean(value)&&values.indexOf(value)===index);
  const details=[item.vehicle_type,item.passenger_capacity?`${item.passenger_capacity} passengers`:null,item.luggage_capacity,item.driver_included?"Driver included":null];
  return <div role="dialog" aria-modal="true" aria-labelledby="vehicle-preview-title" className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-slate/70 p-4 backdrop-blur-sm" onMouseDown={event=>{if(event.target===event.currentTarget)onClose();}}><div className="relative my-6 w-full max-w-3xl overflow-hidden rounded-[2rem] bg-white shadow-2xl"><button onClick={onClose} aria-label="Close vehicle details" className="absolute right-5 top-5 z-10 grid size-10 place-items-center rounded-full bg-white/90 shadow"><X className="size-5"/></button><div className="relative aspect-[16/7] bg-sand">{item.hero_image_url&&<Image src={item.hero_image_url} alt={item.image_alt||item.listing_title} fill sizes="768px" className="object-cover"/>}{gallery.length>1&&<div className="absolute bottom-4 left-4 flex gap-2">{gallery.slice(1,4).map((src,index)=><div key={src} className="relative size-14 overflow-hidden rounded-lg border-2 border-white bg-sand shadow"><Image src={src} alt={`${item.listing_title} gallery ${index+2}`} fill sizes="56px" className="object-cover"/></div>)}</div>}</div><div className="p-7 md:p-10"><p className="eyebrow">Private transport</p><h2 id="vehicle-preview-title" className="mt-2 font-serif text-4xl">{item.listing_title}</h2>{item.short_description&&<p className="mt-4 max-w-2xl leading-7 text-slate/65">{item.short_description}</p>}<div className="mt-6 flex flex-wrap gap-2">{details.filter(Boolean).map(detail=><span key={detail} className="rounded-full bg-sand-light px-4 py-2 text-xs font-semibold text-slate/70">{detail}</span>)}</div><PricingPlanChoices plans={item.pricingPlans} value={selectedPlanId} onChange={onPlanChange}/><div className="mt-8 flex flex-wrap justify-end gap-3">{selected&&<Button variant="ghost" onClick={onRemove}>Remove from journey</Button>}<Button variant="ghost" onClick={onClose}>Keep browsing</Button><Button variant="accent" disabled={item.pricingPlans.length>0&&!selectedPlanId} onClick={onConfirm}>{selected?"Update selection":"Select vehicle"}</Button></div></div></div></div>;
}

function JourneyDetailsStep({data}:{data:JourneyBootstrap}){
  const {state,dispatch}=useJourney();
  const [preview,setPreview]=useState<JourneyVehicle|null>(null);
  const [previewPlanId,setPreviewPlanId]=useState("");
  const vehicles=data.vehicles.filter(item=>item.nationwide||item.destinationIds.some(id=>state.selectedDestinationIds.includes(id)));
  const minimumTravellers=Object.values(state.experienceParticipants).reduce((maximum,counts)=>({adults:Math.max(maximum.adults,counts.adults),children:Math.max(maximum.children,counts.children),infants:Math.max(maximum.infants,counts.infants)}),{adults:0,children:0,infants:0});
  const setTraveller=(key:keyof ParticipantCounts,value:number)=>dispatch({type:"travellers",counts:{...state.travellerCounts,[key]:value}});
  const openPreview=(item:JourneyVehicle)=>{setPreview(item);setPreviewPlanId(state.selectedPricingPlanIds[pricingPlanKey("vehicle",item.id)]||item.pricingPlans[0]?.id||"")};
  return <div className="mt-10">
    <div className="grid gap-4 rounded-2xl bg-sand-light p-5 md:grid-cols-2"><label className="grid gap-2 text-sm font-semibold">Arrival date<input type="date" value={state.travelDates.start} onChange={event=>dispatch({type:"dates",start:event.target.value,end:state.travelDates.end})} className="rounded-xl border border-stone/30 bg-white px-4 py-3"/></label><label className="grid gap-2 text-sm font-semibold">Departure date<input type="date" min={state.travelDates.start||undefined} value={state.travelDates.end} onChange={event=>dispatch({type:"dates",start:state.travelDates.start,end:event.target.value})} className="rounded-xl border border-stone/30 bg-white px-4 py-3"/></label>{(["adults","children","infants"] as const).map(key=><label key={key} className="grid gap-2 text-sm font-semibold">{key[0].toUpperCase()+key.slice(1)}<input type="number" min={minimumTravellers[key]} value={state.travellerCounts[key]} onChange={event=>setTraveller(key,Number(event.target.value))} className="rounded-xl border border-stone/30 bg-white px-4 py-3"/>{minimumTravellers[key]>0&&<small className="font-normal text-stone">Minimum {minimumTravellers[key]} — already joining selected experiences.</small>}</label>)}</div>
    <div className="mt-8 flex items-end justify-between gap-4"><div><p className="eyebrow">Getting around</p><h2 className="mt-2 font-serif text-3xl">Private transport</h2><p className="mt-2 text-sm text-stone">Choose from the existing journey-level transport options.</p></div></div>
    <div className="mt-5 grid gap-4 md:grid-cols-2">{vehicles.length?vehicles.map(item=><VehicleCard key={item.id} item={item} selected={state.selectedVehicleId===item.id} selectedPlanId={state.selectedPricingPlanIds[pricingPlanKey("vehicle",item.id)]||""} onClick={()=>openPreview(item)}/>):<Empty text="No published vehicle partners match this journey yet."/>}</div>
    {state.selectedDestinationIds.length>0&&<div className="mt-8"><SriLankaMap destinations={data.destinations} selectedIds={state.selectedDestinationIds}/></div>}
    <VehicleSelectionModal item={preview} selected={Boolean(preview&&state.selectedVehicleId===preview.id)} selectedPlanId={previewPlanId} onPlanChange={setPreviewPlanId} onClose={()=>setPreview(null)} onRemove={()=>{dispatch({type:"vehicle",id:null});setPreview(null)}} onConfirm={()=>{if(!preview)return;dispatch({type:"vehicle",id:preview.id,pricingPlanId:previewPlanId});setPreview(null)}}/>
  </div>;
}

function ReviewStep({data}:{data:JourneyBootstrap}){
  const {state}=useJourney();
  const vehicle=data.vehicles.find(item=>item.id===state.selectedVehicleId)||null;
  return <div className="mt-10 grid gap-6">
    {state.selectedDestinationIds.map((destinationId,index)=>{const destination=data.destinations.find(item=>item.id===destinationId);if(!destination)return null;const preference=state.destinationPreferences[destinationId];const experiences=state.selectedExperienceIds.map(id=>data.experiences.find(item=>item.id===id)).filter((item):item is JourneyBootstrap["experiences"][number]=>item!==undefined&&item.destinationIds.includes(destinationId));return <article key={destinationId} className="rounded-3xl border border-stone/15 bg-white p-6 md:p-8"><div className="flex items-start justify-between gap-4"><div><p className="eyebrow">Stop {index+1}</p><h2 className="mt-2 font-serif text-3xl">{destination.name}</h2></div><MapPin className="text-gold"/></div><div className="mt-6 grid gap-5 border-t border-stone/15 pt-6 md:grid-cols-2"><ReviewItem label="Stay preference" value={stayPreferenceLabel(preference?.stayPreference||"recommend")}/><ReviewItem label="Guide preference" value={guidePreferenceLabel(preference?.guidePreference||"recommend")}/><div className="md:col-span-2"><p className="text-[.65rem] font-bold uppercase tracking-widest text-gold">Experiences</p><div className="mt-2 flex flex-wrap gap-2">{experiences.length?experiences.map(item=><span key={item.id} className="rounded-full bg-sand-light px-3 py-2 text-xs">{item.name}</span>):<span className="text-sm text-stone">No experiences selected.</span>}</div></div>{preference?.notes&&<div className="md:col-span-2"><ReviewItem label="Destination notes" value={preference.notes}/></div>}</div></article>})}
    <article className="rounded-3xl bg-forest p-6 text-ivory md:p-8"><p className="eyebrow text-gold-light">Journey details</p><div className="mt-5 grid gap-5 md:grid-cols-3"><ReviewItem label="Travel dates" value={state.travelDates.start&&state.travelDates.end?`${state.travelDates.start} to ${state.travelDates.end}`:"To be decided"} dark/><ReviewItem label="Travellers" value={`${state.travellerCounts.adults+state.travellerCounts.children+state.travellerCounts.infants||"Not set"}`} dark/><ReviewItem label="Transport" value={vehicle?vehicle.listing_title:"Not selected"} dark/></div></article>
  </div>;
}

function ReviewItem({label,value,dark=false}:{label:string;value:string;dark?:boolean}){return <div><p className={cn("text-[.65rem] font-bold uppercase tracking-widest",dark?"text-gold-light":"text-gold")}>{label}</p><p className={cn("mt-2 text-sm leading-6",dark?"text-ivory/75":"text-slate/70")}>{value}</p></div>}

function Builder({data}:{data:JourneyBootstrap}){
  const {state,dispatch}=useJourney();
  const step=state.currentStep;
  const setStep=(value:number)=>dispatch({type:"step",value});
  const [quotationOpen,setQuotationOpen]=useState(false);
  const destinations=useMemo(()=>availableDestinations(data.destinations,state.selectedThemeIds),[data.destinations,state.selectedThemeIds]);
  const experiences=useMemo(()=>availableExperiences(data.experiences,state.selectedDestinationIds,state.selectedThemeIds),[data.experiences,state.selectedDestinationIds,state.selectedThemeIds]);
  const current=step===0?data.themes:destinations;
  const selected=step===0?state.selectedThemeIds:state.selectedDestinationIds;
  const field=step===0?"selectedThemeIds":"selectedDestinationIds";
  const quoteRequest={selectedDestinationIds:state.selectedDestinationIds,selectedExperienceIds:state.selectedExperienceIds,selectedStayIds:[],selectedVehicleId:state.selectedVehicleId,selectedGuideId:null,selectedPricingPlanIds:state.selectedPricingPlanIds,travelDates:state.travelDates,travellerCounts:state.travellerCounts,experienceParticipants:state.experienceParticipants};
  const packageQuote=usePackageQuote(quoteRequest);
  return <><div className="shell grid gap-8 py-12 lg:grid-cols-[1fr_340px]">
    <section>
      <div className="mb-10 flex gap-2 overflow-x-auto">{steps.map((label,index)=><button key={label} onClick={()=>index<=step&&setStep(index)} className={cn("flex min-w-fit items-center gap-2 rounded-full px-4 py-2 text-xs font-bold",index===step?"bg-forest text-ivory":index<step?"bg-sand text-forest":"bg-stone/10 text-stone")}>{index<step?<Check className="size-3"/>:index+1} {label}</button>)}</div>
      <AnimatePresence mode="wait"><motion.div key={step} initial={{opacity:0,x:22}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-18}}>
        <p className="eyebrow mb-3">Step {step+1} of {steps.length}</p><h1 className="font-serif text-4xl md:text-6xl">{stepTitles[step]}</h1><p className="mt-4 max-w-2xl text-slate/60">{step===1&&!state.selectedThemeIds.length?"Choose a theme to reveal its linked destinations.":step===2&&!state.selectedDestinationIds.length?"Choose a destination to reveal its linked experiences.":step===3?"Tell us what feels right in each destination. Your journey designer will choose the individual partners later.":step===4?"Travel dates, party size and transport remain shared across your complete journey.":step===5?"Check every preference before asking us to shape the proposal.":"Shape each choice as you move through your journey."}</p>
        {step<2?<><div className="mt-10 grid gap-5 md:grid-cols-2">{current.map(item=><ChoiceCard key={item.id} item={item} selected={selected.includes(item.id)} onClick={()=>dispatch({type:"toggle",field,id:item.id})}/>)}</div>{step===1&&<div className="mt-10"><SriLankaMap destinations={destinations} selectedIds={state.selectedDestinationIds} onSelect={id=>dispatch({type:"toggle",field:"selectedDestinationIds",id})}/></div>}</>:null}
        {step===2?<ExperienceDiscovery compact experiences={experiences} globalTravellers={state.travellerCounts} selectedIds={state.selectedExperienceIds} participantsByExperience={state.experienceParticipants} selectedPricingPlanIds={state.selectedPricingPlanIds} onInclude={(experience,participants,travellers,pricingPlanId)=>{dispatch({type:"travellers",counts:travellers});dispatch({type:"includeExperience",experienceId:experience.id,counts:participants,pricingPlanId})}} onRemove={experience=>dispatch({type:"removeExperience",experienceId:experience.id})} onParticipantsChange={(experience,participants,pricingPlanId)=>dispatch({type:"experienceParticipants",experienceId:experience.id,counts:participants,pricingPlanId})}/>:null}
        {step===3?<JourneyPreferencesStep data={data}/>:null}{step===4?<JourneyDetailsStep data={data}/>:null}{step===5?<ReviewStep data={data}/>:null}
        <div className="mt-10 flex justify-between"><Button variant="ghost" disabled={step===0} onClick={()=>setStep(step-1)}><ChevronLeft/>Back</Button>{step<steps.length-1?<Button onClick={()=>setStep(step+1)}>Continue<ChevronRight/></Button>:<Button onClick={()=>setQuotationOpen(true)} disabled={!state.selectedDestinationIds.length} variant="accent">Request Journey Proposal</Button>}</div>
      </motion.div></AnimatePresence>
    </section>
    <Summary data={data} quoteState={packageQuote} onQuotation={()=>setQuotationOpen(true)}/>
  </div><QuotationModal open={quotationOpen} onClose={()=>setQuotationOpen(false)} onSubmitted={()=>dispatch({type:"hydrate",state:emptyJourneyState})} state={state} quote={packageQuote.quote}/></>;
}

function Empty({text}:{text:string}){return <div className="rounded-2xl border border-dashed border-stone/30 p-8 text-sm text-stone">{text}</div>}

function Summary({data,quoteState,onQuotation}:{data:JourneyBootstrap;quoteState:ReturnType<typeof usePackageQuote>;onQuotation:()=>void}){
  const {state}=useJourney();
  const [exporting,setExporting]=useState(false);
  const vehicle=data.vehicles.find(item=>item.id===state.selectedVehicleId)||null;
  const selectedPlanName=(type:"vehicle"|"experience",item:{id:string;pricingPlans:JourneyPricingPlan[]})=>item.pricingPlans.find(plan=>plan.id===state.selectedPricingPlanIds[pricingPlanKey(type,item.id)])?.name||item.pricingPlans[0]?.name||null;
  const route=getRouteEstimate(data.destinations,state.selectedDestinationIds);
  const {quote,loading,error}=quoteState;
  const travellers=state.travellerCounts.adults+state.travellerCounts.children+state.travellerCounts.infants;
  const selectedDestinations=state.selectedDestinationIds.map(id=>data.destinations.find(item=>item.id===id)).filter((item):item is JourneyBootstrap["destinations"][number]=>Boolean(item));
  const exportPdf=async()=>{setExporting(true);try{await exportJourneyPdf({themes:state.selectedThemeIds.map(id=>data.themes.find(item=>item.id===id)?.name).filter((name):name is string=>Boolean(name)),destinations:selectedDestinations.map(item=>item.name),routeCoordinates:selectedDestinations.filter(item=>Number.isFinite(item.latitude)&&Number.isFinite(item.longitude)).map(item=>({name:item.name,latitude:Number(item.latitude),longitude:Number(item.longitude)})),experiences:state.selectedExperienceIds.map(id=>{const item=data.experiences.find(experience=>experience.id===id);if(!item)return null;const plan=selectedPlanName("experience",item);const counts=state.experienceParticipants[item.id];const participants=counts?counts.adults+counts.children+counts.infants:0;return `${item.name}${participants?` - ${participants} participant${participants===1?"":"s"}`:""}${plan?` - ${plan}`:""}`}).filter((name):name is string=>Boolean(name)),accommodations:selectedDestinations.map(item=>`${item.name} - ${stayPreferenceLabel(state.destinationPreferences[item.id]?.stayPreference||"recommend")}`),vehicle:vehicle?`${vehicle.listing_title}${selectedPlanName("vehicle",vehicle)?` - ${selectedPlanName("vehicle",vehicle)}`:""}`:null,guide:selectedDestinations.map(item=>`${item.name} - ${guidePreferenceLabel(state.destinationPreferences[item.id]?.guidePreference||"recommend")}`).join("; ")||null,travelDates:state.travelDates,travellerCounts:state.travellerCounts,estimatedDistance:route.estimatedDistance,estimatedTravelDays:route.estimatedTravelDays,quote});}finally{setExporting(false)}};
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
    <div className="border-t border-ivory/10 py-5"><p className="mb-3 text-[.65rem] font-bold uppercase tracking-widest text-gold-light">Preferences & plan</p><div className="grid gap-3 text-sm text-ivory/70">{selectedDestinations.map(item=>{const preference=state.destinationPreferences[item.id];return <div key={item.id}><strong className="text-ivory">{item.name}</strong><span className="mt-1 block text-xs">{stayPreferenceLabel(preference?.stayPreference||"recommend")} · {guidePreferenceLabel(preference?.guidePreference||"recommend")}</span></div>})}{vehicle&&<span className="border-t border-ivory/10 pt-3">{vehicle.listing_title}{selectedPlanName("vehicle",vehicle)?` · ${selectedPlanName("vehicle",vehicle)}`:""}</span>}{!selectedDestinations.length&&!vehicle&&<span className="text-ivory/40">Nothing selected yet</span>}</div></div>
    <div className="border-t border-ivory/10 py-5"><div className="flex justify-between text-sm"><span>{travellers?`${travellers} travellers`:"Travellers not set"}</span><span>{route.estimatedDistance} km</span></div>{loading?<p className="mt-4 text-sm text-ivory/50">Calculating your package…</p>:ready?<div className="mt-4 grid gap-3"><div className="flex items-end justify-between"><span className="text-xs text-ivory/50">Estimated Package Price</span><strong className="font-serif text-2xl">{quote.currency} {quote.totalPackagePrice?.toFixed(2)}</strong></div><div className="flex justify-between text-xs text-ivory/60"><span>Price Per Person</span><span>{quote.currency} {quote.pricePerPerson?.toFixed(2)}</span></div><div className="flex justify-between text-xs text-ivory/60"><span>Estimated Daily Cost</span><span>{quote.currency} {quote.estimatedDailyCost?.toFixed(2)}</span></div>{quote.components?.length?<div className="mt-2 grid gap-2 border-t border-ivory/10 pt-3">{quote.components.map(item=><div key={item.category} className="flex justify-between text-xs text-ivory/70"><span>{item.label}</span><span>{quote.currency} {item.amount.toFixed(2)}</span></div>)}</div>:null}<p className="border-t border-ivory/10 pt-3 text-[.7rem] leading-5 text-ivory/45">Estimated package price. Subject to availability and final confirmation.</p></div>:state.selectedDestinationIds.length?<p className="mt-4 text-sm leading-6 text-ivory/60">{error||manualMessage}</p>:<p className="mt-4 text-sm text-ivory/40">Select destinations to calculate your package.</p>}</div>
    <Button onClick={onQuotation} disabled={!state.selectedDestinationIds.length||state.currentStep<steps.length-1} variant="accent" className="mb-3 w-full">{state.currentStep<steps.length-1?"Review journey to continue":"Request Journey Proposal"}</Button>
    <Button onClick={exportPdf} disabled={!state.selectedDestinationIds.length||exporting} variant="outline" className="w-full border-ivory/20 text-ivory hover:bg-ivory/10"><Download/>{exporting?"Preparing PDF...":"Export Journey Summary"}</Button>
    <div className="mt-4 flex items-center gap-2 text-xs text-ivory/55"><MapPin className="size-4"/>Review and revise every choice before requesting your quote.</div>
  </aside>;
}

export function JourneyBuilder({data,initialSelection}:{data:JourneyBootstrap;initialSelection?:JourneyInitialSelection}){return <JourneyProvider data={data} initialSelection={initialSelection}><Builder data={data}/></JourneyProvider>}
