"use client";

import {zodResolver} from "@hookform/resolvers/zod";
import {CheckCircle2,X} from "lucide-react";
import {useEffect,useState} from "react";
import {useForm} from "react-hook-form";
import {z} from "zod";
import {Button} from "@/components/ui/button";
import {createClient} from "@/lib/supabase/client";
import {journeyHandoffToJson,type JourneyQuotationHandoff} from "@/lib/journey/quotation-handoff";
import type {PublicPackageQuote} from "@/lib/pricing/package-types";
import type {JourneyState} from "./journey-store";

const schema=z.object({
  name:z.string().trim().min(2,"Please enter your full name."),
  phone:z.string().trim().min(7,"Please enter your WhatsApp number."),
  email:z.email("Please enter a valid email address."),
  country:z.string().trim().optional(),
  arrival:z.string().optional(),
  departure:z.string().optional(),
  notes:z.string().trim().optional()
}).refine(values=>!values.arrival||!values.departure||values.departure>=values.arrival,{message:"Departure must be after arrival.",path:["departure"]});
type FormData=z.infer<typeof schema>;

export function QuotationModal({open,onClose,state,quote}:{open:boolean;onClose:()=>void;state:JourneyState;quote:PublicPackageQuote|null}){
  const [sent,setSent]=useState(false);
  const [submitError,setSubmitError]=useState("");
  const {register,handleSubmit,reset,formState:{errors,isSubmitting}}=useForm<FormData>({
    resolver:zodResolver(schema),
    defaultValues:{arrival:state.travelDates.start,departure:state.travelDates.end}
  });
  useEffect(()=>{if(open){setSent(false);setSubmitError("");reset({name:"",phone:"",email:"",country:"",arrival:state.travelDates.start,departure:state.travelDates.end,notes:""});}},[open,reset,state.travelDates.end,state.travelDates.start]);
  useEffect(()=>{
    if(!open)return;
    const close=(event:KeyboardEvent)=>{if(event.key==="Escape")onClose();};
    document.addEventListener("keydown",close);
    document.body.style.overflow="hidden";
    return()=>{document.removeEventListener("keydown",close);document.body.style.overflow="";};
  },[open,onClose]);
  if(!open)return null;
  const submit=async(values:FormData)=>{
    setSubmitError("");
    const submittedState={...state,travelDates:{start:values.arrival||state.travelDates.start,end:values.departure||state.travelDates.end}};
    const handoff:JourneyQuotationHandoff={version:1,createdAt:new Date().toISOString(),state:submittedState,quote};
    const {error}=await createClient().from("enquiries").insert({
      name:values.name,
      email:values.email,
      phone:values.phone,
      nationality:values.country||null,
      summary:`Final quotation requested.${values.notes?` ${values.notes}`:""}`,
      traveller_notes:values.notes||null,
      status:"new",
      trip_state:journeyHandoffToJson(handoff),
      travel_start_date:submittedState.travelDates.start||null,
      travel_end_date:submittedState.travelDates.end||null,
      adults:submittedState.travellerCounts.adults,
      children:submittedState.travellerCounts.children,
      experience_participants:submittedState.experienceParticipants,
      selected_themes:submittedState.selectedThemeIds,
      selected_destinations:submittedState.selectedDestinationIds,
      selected_experiences:submittedState.selectedExperienceIds,
      selected_stays:Object.values(submittedState.selectedStayIdsByDestination).filter(Boolean),
      selected_vehicle:submittedState.selectedVehicleId,
      selected_guide:submittedState.selectedGuideId
    });
    if(error){setSubmitError("We could not send your quotation request. Please try again.");return}
    setSent(true);
  };
  return <div role="dialog" aria-modal="true" aria-labelledby="quotation-title" className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-slate/70 p-4 backdrop-blur-sm" onMouseDown={event=>{if(event.target===event.currentTarget)onClose();}}>
    <div className="relative my-6 w-full max-w-3xl overflow-hidden rounded-[2rem] bg-ivory shadow-2xl">
      <button onClick={onClose} aria-label="Close quotation form" className="absolute right-5 top-5 z-10 grid size-10 place-items-center rounded-full bg-white/90 text-slate shadow"><X className="size-5"/></button>
      {sent?<div className="grid min-h-[430px] place-items-center p-10 text-center"><div><CheckCircle2 className="mx-auto size-14 text-gold"/><p className="eyebrow mt-6">Request received</p><h2 id="quotation-title" className="mt-3 font-serif text-4xl">Your journey designer is on it.</h2><p className="mx-auto mt-4 max-w-lg text-slate/60">We have received your complete journey plan and will contact you with a personally verified final quotation.</p><Button className="mt-8" onClick={onClose}>Return to my journey</Button></div></div>:
      <form onSubmit={handleSubmit(submit)}>
        <div className="bg-forest px-7 py-8 pr-20 text-ivory md:px-10"><p className="eyebrow text-gold-light">Private, tailor-made travel</p><h2 id="quotation-title" className="mt-2 font-serif text-3xl md:text-4xl">Request your final quotation.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-ivory/65">A Roam Ceylon journey designer will verify availability, supplier rates and every detail of your trip.</p></div>
        <div className="grid gap-5 p-7 md:grid-cols-2 md:p-10">
          {([["name","Full name *","text"],["phone","WhatsApp number *","tel"],["email","Email address *","email"],["country","Country","text"]] as const).map(([name,label,type])=><label key={name} className="grid gap-2 text-sm font-semibold">{label}<input type={type} {...register(name)} className="rounded-xl border border-stone/30 bg-white px-4 py-3 outline-none focus:border-gold"/>{errors[name]&&<small className="text-red-700">{errors[name]?.message}</small>}</label>)}
          <label className="grid gap-2 text-sm font-semibold">Arrival date<input type="date" {...register("arrival")} className="rounded-xl border border-stone/30 bg-white px-4 py-3 outline-none focus:border-gold"/></label>
          <label className="grid gap-2 text-sm font-semibold">Departure date<input type="date" {...register("departure")} className="rounded-xl border border-stone/30 bg-white px-4 py-3 outline-none focus:border-gold"/>{errors.departure&&<small className="text-red-700">{errors.departure.message}</small>}</label>
          <label className="grid gap-2 text-sm font-semibold md:col-span-2">Special requests<textarea rows={4} {...register("notes")} placeholder="Dietary needs, room preferences, mobility considerations or special occasions…" className="rounded-xl border border-stone/30 bg-white px-4 py-3 outline-none focus:border-gold"/></label>
          {submitError&&<p role="alert" className="text-sm text-red-700 md:col-span-2">{submitError}</p>}
          <Button disabled={isSubmitting} type="submit" variant="accent" className="md:col-span-2">{isSubmitting?"Sending your journey…":"Send quotation request"}</Button>
          <p className="text-center text-xs text-stone md:col-span-2">No payment is taken now. Your final price is confirmed personally.</p>
        </div>
      </form>}
    </div>
  </div>;
}
