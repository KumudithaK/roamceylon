"use client";

import {zodResolver} from "@hookform/resolvers/zod";
import {useState} from "react";
import {useForm} from "react-hook-form";
import {z} from "zod";
import {Button} from "@/components/ui/button";
import {FormField,Input,Textarea} from "@/components/ui/form-field";
import {Feedback} from "@/components/ui/feedback";
import {clearJourneyHandoff,journeyHandoffToJson,readJourneyHandoff} from "@/lib/journey/quotation-handoff";

const schema=z.object({name:z.string().min(2),email:z.email(),phone:z.string().optional(),nationality:z.string().optional(),notes:z.string().min(10)});
type FormData=z.infer<typeof schema>;

export function ContactForm({quotation=false}:{quotation?:boolean}){
  const [sent,setSent]=useState(false);
  const [submitError,setSubmitError]=useState("");
  const [honeypot,setHoneypot]=useState("");
  const [submissionKey,setSubmissionKey]=useState<string|null>(null);
  const {register,handleSubmit,formState:{errors,isSubmitting}}=useForm<FormData>({resolver:zodResolver(schema)});
  const submit=async(values:FormData)=>{
    setSubmitError("");
    const handoff=readJourneyHandoff();
    const journey=handoff?.state??null;
    const stableSubmissionKey=submissionKey??crypto.randomUUID();
    if(!submissionKey)setSubmissionKey(stableSubmissionKey);
    const response=await fetch("/api/enquiries",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({
      submissionKey:stableSubmissionKey,honeypot,source:quotation?"contact_quotation":"contact",name:values.name,email:values.email,phone:values.phone||null,nationality:values.nationality||null,notes:values.notes,
      journey:journey?{handoff:journeyHandoffToJson(handoff),travelStartDate:journey.travelDates.start||null,travelEndDate:journey.travelDates.end||null,travellerCounts:journey.travellerCounts,
        selectedThemeIds:journey.selectedThemeIds,selectedDestinationIds:journey.selectedDestinationIds,selectedExperienceIds:journey.selectedExperienceIds,experienceParticipants:journey.experienceParticipants,
        selectedStayIds:Object.values(journey.selectedStayIdsByDestination).filter(Boolean),selectedVehicleId:journey.selectedVehicleId||null,selectedGuideId:journey.selectedGuideId||null,estimate:null}:null
    })});
    if(!response.ok){setSubmitError("We could not submit your enquiry. Please check your connection and try again.");return}
    clearJourneyHandoff();
    setSent(true);
  };
  if(sent)return <div role="status" className="border-y border-forest/20 py-10"><p className="eyebrow mb-3">Received</p><h2 className="heading">{quotation?"Your quotation is being prepared.":"Your journey starts here."}</h2><p className="mt-4 text-base leading-7 text-muted">A journey designer from The Ceylon Edition will review your selections and be in touch shortly.</p></div>;
  return <form onSubmit={handleSubmit(submit)} className="grid gap-6 border-t border-forest/25 pt-8 md:grid-cols-2 lg:pt-10">
    <input aria-hidden="true" tabIndex={-1} autoComplete="off" name="website-confirmation" className="hidden" value={honeypot} onChange={event=>setHoneypot(event.target.value)}/>
    {([
      {name:"name",label:"Full name",type:"text",autoComplete:"name",error:"Please enter at least two characters."},
      {name:"email",label:"Email",type:"email",autoComplete:"email",error:"Please enter a valid email address."},
      {name:"phone",label:"Phone / WhatsApp",type:"tel",autoComplete:"tel",error:"Please check your phone number."},
      {name:"nationality",label:"Nationality",type:"text",autoComplete:"off",error:"Please check this field."}
    ] as const).map(({name,label,type,autoComplete,error})=><FormField key={name} label={label} required={name==="name"||name==="email"} error={errors[name]?error:undefined}>
      {association=><Input {...register(name)} {...association} type={type} autoComplete={autoComplete} aria-required={name==="name"||name==="email"}/>}
    </FormField>)}
    <FormField className="md:col-span-2" label={quotation?"Anything we should consider before confirming your quotation?":"Tell us what you are imagining"} required error={errors.notes?"Please share at least ten characters of detail.":undefined}>
      {association=><Textarea {...register("notes")} {...association} rows={6} aria-required="true" placeholder={quotation?"Dietary needs, room preferences, mobility considerations or special occasions…":"Places, pace, occasion, travel dates or anything else that matters…"}/>}
    </FormField>
    {submitError?<Feedback className="md:col-span-2">{submitError}</Feedback>:null}
    <Button disabled={isSubmitting} aria-busy={isSubmitting} type="submit" className="md:col-span-2">{isSubmitting?"Sending…":quotation?"Request Final Quotation":"Speak with a journey designer"}</Button>
  </form>;
}
