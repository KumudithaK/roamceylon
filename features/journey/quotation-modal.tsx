"use client";

import {zodResolver} from "@hookform/resolvers/zod";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {ArrowRight,CheckCircle2,MapPin,ShieldCheck,Sparkles,UsersRound,X} from "lucide-react";
import Link from "next/link";
import {useEffect,useRef,useState} from "react";
import {useForm} from "react-hook-form";
import {z} from "zod";
import {Button} from "@/components/ui/button";
import {FormField,Input,Textarea} from "@/components/ui/form-field";
import {brand,editionDisplayName} from "@/lib/brand";
import {journeyHandoffToJson,type JourneyQuotationHandoff} from "@/lib/journey/quotation-handoff";
import type {JourneyBootstrap} from "@/lib/journey/journey-service";
import {isJourneyEstimate,type PublicJourneyEstimate} from "@/lib/pricing/journey-estimate-types";
import type {PublicPackageQuote} from "@/lib/pricing/package-types";
import type {JourneyState} from "./journey-store";

const schema=z.object({
  name:z.string().trim().min(2,"Please enter your full name.").max(150,"Please keep your name under 150 characters."),
  email:z.email("Please enter a valid email address.").max(254,"Please enter a shorter email address."),
  phone:z.string().trim().max(40,"Please enter a shorter phone number.").refine(value=>!value||value.length>=7,"Please check your phone number."),
  country:z.string().trim().max(100,"Please enter a shorter country name."),
  notes:z.string().trim().max(5000,"Please keep your note under 5,000 characters.")
});
type FormData=z.infer<typeof schema>;

const defaultNotes="Please prepare my personalised Sri Lankan journey proposal.";
const dateLabel=(value:string)=>{
  if(!value)return "Dates not selected";
  const date=new Date(`${value}T00:00:00`);
  return Number.isNaN(date.valueOf())?value:date.toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"});
};
const money=(value:number|null)=>value===null?"—":value.toLocaleString("en-US",{maximumFractionDigits:0});

export function QuotationModal({open,onClose,onSubmitted,state,quote,data}:{
  open:boolean;
  onClose:()=>void;
  onSubmitted:()=>void;
  state:JourneyState;
  quote:PublicJourneyEstimate|PublicPackageQuote|null;
  data:JourneyBootstrap;
}){
  const [sent,setSent]=useState(false);
  const [reference,setReference]=useState("");
  const [submitError,setSubmitError]=useState("");
  const [honeypot,setHoneypot]=useState("");
  const [submissionKey,setSubmissionKey]=useState<string|null>(null);
  const wasOpen=useRef(false);
  const returnFocusRef=useRef<HTMLElement|null>(null);
  const submitErrorRef=useRef<HTMLParagraphElement>(null);
  const successRef=useRef<HTMLHeadingElement>(null);
  const {register,handleSubmit,reset,setFocus,formState:{errors,isSubmitting}}=useForm<FormData>({
    resolver:zodResolver(schema),
    defaultValues:{name:"",email:"",phone:"",country:"",notes:""}
  });

  useEffect(()=>{
    const justOpened=open&&!wasOpen.current;
    wasOpen.current=open;
    if(justOpened){
      setSubmissionKey(crypto.randomUUID());
      setHoneypot("");
      setSent(false);
      setReference("");
      setSubmitError("");
      reset({name:"",email:"",phone:"",country:"",notes:""});
    }
  },[open,reset]);
  useEffect(()=>{if(submitError)submitErrorRef.current?.focus()},[submitError]);
  useEffect(()=>{if(sent)successRef.current?.focus()},[sent]);

  const themes=state.selectedThemeIds.flatMap(id=>{
    const theme=data.themes.find(item=>item.id===id);
    return theme?[editionDisplayName(theme)]:[];
  });
  const destinations=state.selectedDestinationIds.flatMap(id=>{
    const destination=data.destinations.find(item=>item.id===id);
    return destination?[destination.name]:[];
  });
  const travellers=state.travellerCounts.adults+state.travellerCounts.children+state.travellerCounts.infants;
  const estimate=isJourneyEstimate(quote)?quote:null;
  const planningRange=estimate?.status==="estimated_range"
    ?`${estimate.currency} ${money(estimate.perPersonMin)}–${money(estimate.perPersonMax)} per person`
    :"Taking shape — to be reviewed with your request";

  const submit=async(values:FormData)=>{
    setSubmitError("");
    if(state.travellerCounts.adults<1){
      setSubmitError("Please return to Journey Details and add at least one adult traveller.");
      return;
    }
    const handoff:JourneyQuotationHandoff={version:1,createdAt:new Date().toISOString(),state,quote};
    if(!submissionKey){
      setSubmitError("This request is not ready to send. Please close and reopen the form.");
      return;
    }
    try{
      const response=await fetch("/api/enquiries",{
        method:"POST",
        headers:{"content-type":"application/json"},
        body:JSON.stringify({
          submissionKey,
          honeypot,
          source:"journey_builder",
          name:values.name,
          email:values.email,
          phone:values.phone||null,
          nationality:values.country||null,
          notes:values.notes||defaultNotes,
          journey:{
            handoff:journeyHandoffToJson(handoff),
            travelStartDate:state.travelDates.start||null,
            travelEndDate:state.travelDates.end||null,
            travellerCounts:state.travellerCounts,
            selectedThemeIds:state.selectedThemeIds,
            selectedDestinationIds:state.selectedDestinationIds,
            selectedExperienceIds:state.selectedExperienceIds,
            experienceParticipants:state.experienceParticipants,
            selectedStayIds:Object.values(state.selectedStayIdsByDestination).filter(Boolean),
            selectedVehicleId:state.selectedVehicleId,
            selectedGuideId:state.selectedGuideId,
            estimate:estimate?{perPersonMin:estimate.perPersonMin,perPersonMax:estimate.perPersonMax,currency:estimate.currency,basis:estimate.basis,estimatedAt:estimate.estimatedAt,snapshot:estimate}:null
          }
        })
      });
      if(!response.ok){
        setSubmitError(response.status===429
          ?"We cannot accept another request for this email address just now. Your journey remains available; please try again later."
          :"Your request was not sent. Your journey remains available — please check your connection and try again.");
        return;
      }
      const result=await response.json() as {reference?:string};
      setReference(typeof result.reference==="string"?result.reference:"");
      onSubmitted();
      setSent(true);
    }catch{
      setSubmitError("Your request was not sent. Your journey remains available — please check your connection and try again.");
    }
  };

  return <DialogPrimitive.Root open={open} onOpenChange={next=>{if(!next&&!isSubmitting)onClose()}}>
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-[90] bg-forest/75 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in data-[state=closed]:fade-out"/>
      <DialogPrimitive.Content
        className="fixed left-1/2 top-1/2 z-[100] max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-[74rem] -translate-x-1/2 -translate-y-1/2 overflow-y-auto overscroll-contain rounded-[1.75rem] border border-gold/35 bg-ivory text-slate shadow-[0_32px_100px_rgba(4,24,21,.42)] outline-none md:max-h-[calc(100dvh-2rem)] md:w-[calc(100%-2rem)]"
        onOpenAutoFocus={event=>{
          returnFocusRef.current=document.activeElement instanceof HTMLElement?document.activeElement:null;
          event.preventDefault();
          queueMicrotask(()=>setFocus("name"));
        }}
        onCloseAutoFocus={event=>{
          event.preventDefault();
          returnFocusRef.current?.focus();
          returnFocusRef.current=null;
        }}
        onEscapeKeyDown={event=>{if(isSubmitting)event.preventDefault()}}
        onPointerDownOutside={event=>{if(isSubmitting)event.preventDefault()}}
      >
        <DialogPrimitive.Close disabled={isSubmitting} aria-label="Close journey proposal request" className="absolute right-4 top-4 z-20 grid size-11 place-items-center rounded-full border border-current/15 bg-ivory/90 text-forest transition hover:bg-sand focus-ring disabled:opacity-50 md:right-6 md:top-6">
          <X aria-hidden="true" className="size-5"/>
        </DialogPrimitive.Close>

        {sent?<div role="status" aria-live="polite" className="grid min-h-[min(44rem,calc(100dvh-1rem))] lg:grid-cols-[.72fr_1.28fr]">
          <div className="editorial-noise flex min-h-72 flex-col justify-between bg-gold p-8 text-forest md:p-12">
            <div><p className="text-[.68rem] font-bold uppercase tracking-[.24em]">{brand.wordmark}</p><div className="mt-8 h-px w-16 bg-forest/45"/></div>
            <Sparkles aria-hidden="true" className="size-16 stroke-1"/>
            <p className="max-w-xs text-sm leading-7">A private journey begins with the choices that matter to you.</p>
          </div>
          <div className="flex items-center p-8 md:p-12 lg:p-16">
            <div className="max-w-2xl">
              <CheckCircle2 aria-hidden="true" className="size-12 stroke-1.5 text-gold"/>
              <p className="eyebrow mt-7">Journey request received</p>
              <DialogPrimitive.Title asChild><h2 ref={successRef} tabIndex={-1} className="mt-4 font-serif text-4xl leading-[1.05] outline-none md:text-6xl">Your journey is now with The Ceylon Edition.</h2></DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-6 max-w-xl text-base leading-8 text-stone">We have received the places, experiences and preferences you shared. They will form the brief for the next stage of your journey proposal.</DialogPrimitive.Description>
              {reference?<div className="mt-8 border-y border-gold/35 py-5"><p className="text-[.65rem] font-bold uppercase tracking-[.2em] text-gold">Journey reference</p><p className="mt-2 font-serif text-3xl" aria-label={`Journey reference ${reference}`}>{reference}</p><p className="mt-2 text-sm text-stone">Keep this reference with your journey correspondence.</p></div>:null}
              <p className="mt-6 text-sm leading-6 text-stone">This confirms receipt of your request only. No booking, payment or availability has been confirmed.</p>
              <div className="mt-8 flex flex-wrap gap-3"><Button onClick={onClose} variant="accent">Plan another journey</Button><Button asChild variant="outline"><Link href="/">Return to The Ceylon Edition</Link></Button></div>
            </div>
          </div>
        </div>:
        <div className="grid lg:grid-cols-[minmax(18rem,.72fr)_minmax(0,1.28fr)]">
          <aside className="editorial-noise bg-forest p-7 text-ivory md:p-10 lg:min-h-[44rem] lg:p-12">
            <p className="text-[.68rem] font-bold uppercase tracking-[.24em] text-gold-light">{brand.wordmark}</p>
            <div className="mt-10 max-w-md"><p className="eyebrow text-gold-light">Your private journey</p><h2 className="mt-4 font-serif text-4xl leading-[1.04] md:text-5xl">The story so far.</h2><p className="mt-5 text-sm leading-7 text-ivory/68">A concise portrait of the journey you are sharing with us.</p></div>
            <dl className="mt-9 grid gap-0 border-y border-ivory/15">
              <ContextLine label="Editions" value={themes.join(" · ")||"Open to guidance"}/>
              <ContextLine label="Route" value={destinations.join(" → ")||"To be shaped"} icon={<MapPin aria-hidden="true" className="size-4"/>}/>
              <ContextLine label="Dates" value={`${dateLabel(state.travelDates.start)} — ${dateLabel(state.travelDates.end)}`}/>
              <ContextLine label="Travellers" value={`${travellers} traveller${travellers===1?"":"s"}`} icon={<UsersRound aria-hidden="true" className="size-4"/>}/>
              <ContextLine label="Selected moments" value={`${state.selectedExperienceIds.length} experience${state.selectedExperienceIds.length===1?"":"s"}`}/>
              <ContextLine label="Planning range" value={planningRange}/>
            </dl>
            <p className="mt-7 flex gap-3 text-xs leading-6 text-ivory/58"><ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-gold-light"/>Your journey stays available if this request cannot be sent.</p>
          </aside>

          <form noValidate aria-busy={isSubmitting} onSubmit={handleSubmit(submit)} className="p-7 md:p-10 lg:p-12 lg:pt-16">
            <input aria-hidden="true" tabIndex={-1} autoComplete="off" name="website-confirmation" className="hidden" value={honeypot} onChange={event=>setHoneypot(event.target.value)}/>
            <p className="eyebrow">Share your journey</p>
            <DialogPrimitive.Title className="mt-3 max-w-2xl font-serif text-4xl leading-[1.06] md:text-5xl">One final introduction.</DialogPrimitive.Title>
            <DialogPrimitive.Description className="mt-4 max-w-xl text-sm leading-7 text-stone">Tell us how to reach you. Your dates and journey choices are already included, so you do not need to enter them again.</DialogPrimitive.Description>

            <div className="mt-8 grid gap-x-5 gap-y-6 md:grid-cols-2">
              <FormField label="Full name" required error={errors.name?.message}>
                {association=><Input {...register("name")} {...association} type="text" autoComplete="name" aria-required="true"/>}
              </FormField>
              <FormField label="Email address" required error={errors.email?.message}>
                {association=><Input {...register("email")} {...association} type="email" autoComplete="email" inputMode="email" aria-required="true"/>}
              </FormField>
              <FormField label="Phone / WhatsApp" help="Optional" error={errors.phone?.message}>
                {association=><Input {...register("phone")} {...association} type="tel" autoComplete="tel" inputMode="tel"/>}
              </FormField>
              <FormField label="Country" help="Optional" error={errors.country?.message}>
                {association=><Input {...register("country")} {...association} type="text" autoComplete="country-name"/>}
              </FormField>
              <FormField className="md:col-span-2" label="Anything you would like us to consider?" help="Optional — dietary needs, room preferences, accessibility considerations or a special occasion." error={errors.notes?.message}>
                {association=><Textarea {...register("notes")} {...association} rows={4}/>}
              </FormField>
            </div>

            {submitError?<p ref={submitErrorRef} tabIndex={-1} role="alert" className="mt-6 border-l-2 border-error bg-red-50 px-4 py-3 text-sm leading-6 text-error outline-none">{submitError}</p>:null}

            <div className="mt-8 border-t border-stone/20 pt-6">
              <Button disabled={isSubmitting||!submissionKey} aria-busy={isSubmitting} type="submit" variant="accent" size="lg" className="w-full sm:w-auto">{isSubmitting?"Sharing your journey…":<>Request your journey proposal<ArrowRight aria-hidden="true"/></>}</Button>
              <p className="mt-4 max-w-xl text-xs leading-6 text-stone">Submitting creates a journey enquiry for review. No payment is taken when you share this request. It does not confirm a booking or availability.</p>
            </div>
          </form>
        </div>}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>;
}

function ContextLine({label,value,icon}:{label:string;value:string;icon?:React.ReactNode}){
  return <div className="border-b border-ivory/15 py-4 last:border-0"><dt className="text-[.62rem] font-bold uppercase tracking-[.18em] text-gold-light">{label}</dt><dd className="mt-2 flex items-start gap-2 text-sm leading-6 text-ivory/78">{icon}{value}</dd></div>;
}
