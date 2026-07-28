"use client";

import {zodResolver} from "@hookform/resolvers/zod";
import {useState} from "react";
import {useForm} from "react-hook-form";
import {z} from "zod";
import {Button} from "@/components/ui/button";
import {createClient} from "@/lib/supabase/client";
import {clearJourneyHandoff,journeyHandoffToJson,readJourneyHandoff} from "@/lib/journey/quotation-handoff";

const schema=z.object({name:z.string().min(2),email:z.email(),phone:z.string().optional(),nationality:z.string().optional(),notes:z.string().min(10)});
type FormData=z.infer<typeof schema>;

export function ContactForm({quotation=false}:{quotation?:boolean}){
  const [sent,setSent]=useState(false);
  const [submitError,setSubmitError]=useState("");
  const {register,handleSubmit,formState:{errors,isSubmitting}}=useForm<FormData>({resolver:zodResolver(schema)});
  const submit=async(values:FormData)=>{
    setSubmitError("");
    const handoff=readJourneyHandoff();
    const journey=handoff?.state??null;
    const supabase=createClient();
    const {error}=await supabase.from("enquiries").insert({
      name:values.name,
      email:values.email,
      phone:values.phone||null,
      nationality:values.nationality||null,
      summary:quotation?`Final quotation requested. ${values.notes}`:values.notes,
      traveller_notes:values.notes,
      status:"new",
      trip_state:journeyHandoffToJson(handoff),
      travel_start_date:journey?.travelDates.start||null,
      travel_end_date:journey?.travelDates.end||null,
      adults:journey?.travellerCounts.adults??1,
      children:journey?.travellerCounts.children??0,
      selected_themes:journey?.selectedThemeIds??[],
      selected_destinations:journey?.selectedDestinationIds??[],
      selected_experiences:journey?.selectedExperienceIds??[],
      selected_stays:journey?Object.values(journey.selectedStayIdsByDestination).filter(Boolean):[],
      selected_vehicle:journey?.selectedVehicleId||null,
      selected_guide:journey?.selectedGuideId||null
    });
    if(error){setSubmitError("We could not submit your enquiry. Please check your connection and try again.");return}
    clearJourneyHandoff();
    setSent(true);
  };
  if(sent)return <div className="rounded-3xl bg-sand-light p-10"><p className="eyebrow mb-3">Received</p><h2 className="font-serif text-4xl">{quotation?"Your quotation is being prepared.":"Your journey starts here."}</h2><p className="mt-4 text-slate/60">A Roam Ceylon journey designer will review your selections and be in touch shortly.</p></div>;
  return <form onSubmit={handleSubmit(submit)} className="grid gap-5 rounded-3xl border border-stone/20 bg-white p-7 md:grid-cols-2 md:p-10">{[["name","Full name"],["email","Email"],["phone","Phone / WhatsApp"],["nationality","Nationality"]].map(([name,label])=><label key={name} className="grid gap-2 text-sm font-semibold">{label}<input {...register(name as keyof FormData)} className="rounded-xl border border-stone/30 px-4 py-3 outline-none focus:border-gold"/>{errors[name as keyof FormData]&&<small className="text-red-700">Please check this field.</small>}</label>)}<label className="grid gap-2 text-sm font-semibold md:col-span-2">{quotation?"Anything we should consider before confirming your quotation?":"Tell us what you are imagining"}<textarea {...register("notes")} rows={6} className="rounded-xl border border-stone/30 px-4 py-3 outline-none focus:border-gold" placeholder={quotation?"Dietary needs, room preferences, mobility considerations or special occasions…":"Places, pace, occasion, travel dates or anything else that matters…"}/>{errors.notes&&<small className="text-red-700">Please share at least a few details.</small>}</label>{submitError&&<p role="alert" className="text-sm text-red-700 md:col-span-2">{submitError}</p>}<Button disabled={isSubmitting} type="submit" className="md:col-span-2">{isSubmitting?"Sending…":quotation?"Request Final Quotation":"Speak with a journey designer"}</Button></form>;
}
