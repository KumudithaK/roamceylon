"use client";

import {useState} from "react";
import {CheckCircle2,Download,MessageCircle,Send,X} from "lucide-react";
import {Button} from "@/components/ui/button";
import {ProposalDocument} from "@/components/proposal/proposal-document";
import type {ProposalSnapshot} from "@/lib/proposals/customer-proposal-types";

type Mode="accept"|"changes"|null;

export function TravellerProposal({token,snapshot,initialStatus,requiresNewVersion=false}:{
  token:string;
  snapshot:ProposalSnapshot;
  initialStatus:string;
  requiresNewVersion?:boolean;
}){
  const [status,setStatus]=useState(initialStatus);
  const [mode,setMode]=useState<Mode>(null);
  const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState("");
  const actionable=["sent","viewed"].includes(status)&&!requiresNewVersion;

  const submit=async(event:React.FormEvent<HTMLFormElement>)=>{
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const form=new FormData(event.currentTarget);
    const body=mode==="accept"
      ? {action:"accept",name:String(form.get("name")||""),email:String(form.get("email")||""),termsAcknowledged:form.get("termsAcknowledged")==="on"}
      : {action:"request_changes",name:String(form.get("name")||""),email:String(form.get("email")||""),category:String(form.get("category")||"general"),message:String(form.get("message")||"")};
    const response=await fetch(`/api/proposals/${token}`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
    const result=await response.json() as {status?:string;error?:string};
    setSaving(false);
    if(!response.ok){
      setMessage(result.error??"We could not update your proposal. Please contact Roam Ceylon.");
      return;
    }
    setStatus(result.status??status);
    setMode(null);
    setMessage(mode==="accept"
      ? "Thank you. Your acceptance of this exact proposal version has been recorded."
      : "Thank you. Your requested refinements have been sent to your journey designer.");
  };

  const actions=(
    <div className="rounded-[2rem] bg-forest p-7 text-ivory md:p-10">
      <div className="grid gap-7 lg:grid-cols-[1fr_auto]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.22em] text-gold-light">Ready when you are</p>
          <h2 className="mt-4 font-serif text-4xl">Your journey, your decision.</h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-ivory/65">Review this exact Version {snapshot.version}, request any refinements, or approve it when every detail feels right.</p>
          {requiresNewVersion?<p className="mt-5 rounded-xl border border-gold/30 bg-white/10 p-4 text-sm text-gold-light">This journey has been refined since this version was prepared. Your journey designer is preparing an updated proposal; acceptance is paused for this version.</p>:null}
          {message?<p className="mt-5 rounded-xl bg-white/10 p-4 text-sm text-gold-light">{message}</p>:null}
        </div>
        <div className="grid content-center gap-3 sm:grid-cols-2 lg:min-w-[420px] lg:grid-cols-1">
          <Button onClick={()=>setMode("accept")} disabled={!actionable} className="!bg-gold !text-slate"><CheckCircle2 className="size-4"/>Accept journey</Button>
          <Button onClick={()=>setMode("changes")} disabled={!actionable} variant="outline" className="border-ivory/30 !text-ivory"><MessageCircle className="size-4"/>Request changes</Button>
          <Button onClick={()=>window.print()} variant="outline" className="border-ivory/30 !text-ivory"><Download className="size-4"/>Download / print PDF</Button>
          <Button asChild variant="outline" className="border-ivory/30 !text-ivory"><a href={snapshot.contact.whatsappUrl} target="_blank" rel="noreferrer"><Send className="size-4"/>Contact Roam Ceylon</a></Button>
        </div>
      </div>
      {!actionable?<p className="mt-6 border-t border-white/10 pt-5 text-sm text-ivory/60">{statusMessage(status,requiresNewVersion)}</p>:null}
    </div>
  );

  return <>
    <ProposalDocument snapshot={snapshot} status={status} actions={actions}/>
    {mode?<div className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-slate/70 p-4 backdrop-blur-sm">
      <form onSubmit={submit} className="relative my-8 w-full max-w-xl rounded-[2rem] bg-ivory p-7 shadow-2xl md:p-9">
        <button type="button" onClick={()=>setMode(null)} aria-label="Close" className="absolute right-5 top-5 grid size-9 place-items-center rounded-full bg-white"><X className="size-4"/></button>
        <p className="eyebrow">Proposal {snapshot.proposalReference} · Version {snapshot.version}</p>
        <h2 className="mt-4 pr-10 font-serif text-4xl">{mode==="accept"?"Accept your journey":"What would you like us to refine?"}</h2>
        <p className="mt-4 text-sm leading-6 text-stone">{mode==="accept"?`You are accepting this exact proposal version for ${money(snapshot.pricing.total,snapshot.pricing.currency)}.`:"Your current proposal remains unchanged. Your journey designer will review this request before preparing a new version."}</p>
        <div className="mt-7 grid gap-4">
          <Field label="Full name"><input required name="name" defaultValue={snapshot.traveller.name}/></Field>
          <Field label="Email address"><input required type="email" name="email" defaultValue={snapshot.traveller.email}/></Field>
          {mode==="changes"?<>
            <Field label="Area to refine"><select name="category"><option value="general">General changes</option><option value="dates">Travel dates</option><option value="destination">Destination</option><option value="accommodation">Stay</option><option value="experience">Experience</option><option value="transport">Transport</option><option value="guide">Guide</option><option value="budget">Budget</option><option value="other">Other</option></select></Field>
            <Field label="Tell us what you would like changed"><textarea required minLength={10} rows={6} name="message" placeholder="Share the detail and the feeling you would like us to preserve…"/></Field>
          </>:<label className="flex gap-3 rounded-xl bg-sand-light p-4 text-sm leading-6"><input required type="checkbox" name="termsAcknowledged" className="mt-1 size-4"/><span>I have reviewed Version {snapshot.version}, the journey total, inclusions, exclusions, payment schedule and applicable terms, and I accept this proposal.</span></label>}
          {message?<p role="alert" className="text-sm text-red-700">{message}</p>:null}
          <Button disabled={saving} type="submit">{saving?"Recording…":mode==="accept"?"Accept this proposal version":"Send change request"}</Button>
        </div>
      </form>
    </div>:null}
  </>;
}

function statusMessage(status:string,requiresNewVersion:boolean){
  if(requiresNewVersion||status==="superseded") return "A newer proposal has been prepared. Please contact Roam Ceylon for the current version.";
  if(status==="approved") return "This exact proposal version has been accepted.";
  if(status==="changes_requested") return "Your requested refinements are with your journey designer.";
  if(status==="expired") return "This proposal's validity period has ended. Please contact Roam Ceylon for an updated proposal.";
  if(status==="cancelled") return "This proposal is no longer active. Please contact Roam Ceylon if you would like us to begin again.";
  return "This proposal version is available for reference but is no longer active.";
}

const money=(value:number,currency:string)=>`${currency} ${value.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
function Field({label,children}:{label:string;children:React.ReactNode}){
  return <label className="grid gap-2 text-sm font-semibold">{label}<span className="[&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-stone/25 [&_input]:bg-white [&_input]:px-4 [&_input]:py-3 [&_select]:w-full [&_select]:rounded-xl [&_select]:border [&_select]:border-stone/25 [&_select]:bg-white [&_select]:px-4 [&_select]:py-3 [&_textarea]:w-full [&_textarea]:rounded-xl [&_textarea]:border [&_textarea]:border-stone/25 [&_textarea]:bg-white [&_textarea]:px-4 [&_textarea]:py-3">{children}</span></label>;
}
