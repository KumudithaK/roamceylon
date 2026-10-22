"use client";

import Image from "next/image";
import Link from "next/link";
import {useEffect,useId,useRef,useState,useSyncExternalStore} from "react";
import {ArrowUpRight,Mic,Pause,Play,Send,Square,Volume2,X} from "lucide-react";
import {ceyloSuggestions,type CeyloCatalogue} from "@/lib/ceylo/catalogue";
import {recommendCeylo,type CeyloContext,type CeyloReply} from "@/lib/ceylo/recommend";
import {browserVoiceDependencies,createVoiceController,type VoicePhase} from "@/lib/ceylo/voice";
import {companionState,companionHintOverlaps,subscribeCompanionIntro,companionIntroDismissed,serverCompanionIntroDismissed,dismissCompanionIntro} from "@/lib/ceylo/companion-state";
import styles from "./ceylo.module.css";

type Message={id:number;question:string;reply:CeyloReply};
const greeting="Hello, I’m Ceylo. Tell me what draws you to Sri Lanka, and I’ll help you explore our published places and Experiences.";
const statuses:Record<VoicePhase,string>={idle:"",requesting:"Waiting for microphone permission…",listening:"Listening in English…",finishing:"Finishing your transcript…",preparing:"Preparing spoken reply…",speaking:"Ceylo is speaking…"};
const subscribeSupport=()=>()=>{};
const supportSnapshot=()=>{const deps=browserVoiceDependencies();return (deps.recognition?1:0)+(deps.speak?2:0)};
const serverSupport=()=>0;

export function CeyloCompanion({catalogue}:{catalogue:CeyloCatalogue}){
  const [open,setOpen]=useState(false),[draft,setDraft]=useState(""),[messages,setMessages]=useState<Message[]>([]);
  const [phase,setPhase]=useState<VoicePhase>("idle"),[processing,setProcessing]=useState(false),[error,setError]=useState("");
  const support=useSyncExternalStore(subscribeSupport,supportSnapshot,serverSupport);
  const voiceSupport={recognition:Boolean(support&1),speech:Boolean(support&2)};
  const [speakReplies,setSpeakReplies]=useState(false);
  const [celebrating,setCelebrating]=useState(false),[motionPaused,setMotionPaused]=useState(false);
  const [hintReady,setHintReady]=useState(false);
  const welcome=useRef<HTMLDivElement>(null);
  const introDismissed=useSyncExternalStore(subscribeCompanionIntro,companionIntroDismissed,serverCompanionIntroDismissed);
  const voice=useRef<ReturnType<typeof createVoiceController>|null>(null);
  const context=useRef<CeyloContext>({}),busy=useRef(false),generation=useRef(0),nextId=useRef(0);
  const input=useRef<HTMLTextAreaElement>(null),launcher=useRef<HTMLButtonElement>(null),log=useRef<HTMLDivElement>(null);
  const wasOpened=useRef(false);
  const pending=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),titleId=useId(),panelId=useId(),inputId=useId(),statusId=useId();
  useEffect(()=>{
    const controller=createVoiceController(browserVoiceDependencies(),{phase:setPhase,transcript:setDraft,error:setError});
    voice.current=controller;
    const activeGeneration=generation,pendingWork=pending;
    return ()=>{activeGeneration.current++;if(pendingWork.current)clearTimeout(pendingWork.current);controller.destroy();voice.current=null};
  },[]);
  useEffect(()=>{if(open){wasOpened.current=true;input.current?.focus()}else if(wasOpened.current)launcher.current?.focus()},[open]);
  useEffect(()=>{if(introDismissed)return;const timer=setTimeout(dismissCompanionIntro,9000);return ()=>clearTimeout(timer)},[introDismissed]);
  useEffect(()=>{
    if(introDismissed||open)return;
    let frame=0;
    const check=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{
      if(!welcome.current)return;
      const protectedElements=[...document.querySelectorAll(".partner-demo-hero h1,.partner-demo-hero a,.hero-demo-controls")];
      if(companionHintOverlaps(welcome.current.getBoundingClientRect(),protectedElements.map(element=>element.getBoundingClientRect())))dismissCompanionIntro();
      else setHintReady(true);
    })};
    const observer=new ResizeObserver(check);observer.observe(document.documentElement);if(welcome.current)observer.observe(welcome.current);
    window.addEventListener("resize",check);window.addEventListener("scroll",check,{passive:true});check();
    return ()=>{cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener("resize",check);window.removeEventListener("scroll",check)};
  },[introDismissed,open]);
  useEffect(()=>{if(!celebrating)return;const timer=setTimeout(()=>setCelebrating(false),900);return ()=>clearTimeout(timer)},[celebrating]);
  useEffect(()=>{if(log.current)log.current.scrollTop=log.current.scrollHeight},[messages,processing]);
  const close=()=>{generation.current++;if(pending.current)clearTimeout(pending.current);busy.current=false;setProcessing(false);voice.current?.cancel();setOpen(false)};
  const submit=(question=draft)=>{
    const value=question.trim().slice(0,600);
    if(!value||busy.current||["requesting","listening","finishing"].includes(phase))return;
    busy.current=true;voice.current?.cancel();setError("");setProcessing(true);setDraft("");
    const current=++generation.current;
    pending.current=setTimeout(()=>{
      if(generation.current!==current)return;
      try{
        const reply=recommendCeylo(value,catalogue,context.current);context.current=reply.context;
        setMessages(previous=>[...previous,{id:++nextId.current,question:value,reply}].slice(-8));
        setCelebrating(true);
        if(speakReplies)voice.current?.speak(reply.text);
      }catch{setDraft(value);setError("Ceylo could not match that question. Please try again or open Plan Your Journey.")}
      finally{busy.current=false;setProcessing(false);input.current?.focus()}
    },0);
  };
  const listening=["requesting","listening","finishing"].includes(phase);
  const latest=messages[messages.length-1]?.reply;
  const status=processing?"Matching the published catalogue…":statuses[phase];
  const state=companionState(phase,processing,error,celebrating);
  return <div className={styles.widget} data-ceylo-state={state} data-motion-paused={motionPaused}>
    {open&&<section id={panelId} className={styles.panel} role="dialog" aria-modal="false" aria-labelledby={titleId} onKeyDown={event=>{if(event.key==="Escape"){event.preventDefault();close()}}}>
      <header className={styles.header}>
        <Image src="/partner-demo/ceylo-companion-cutout.webp" alt="" width={52} height={52} className={styles.avatar}/>
        <div><h2 id={titleId}>Let&apos;s explore Sri Lanka</h2><p>Ask Ceylo anything about your next adventure.</p></div>
        <button type="button" onClick={close} className={styles.iconButton} aria-label="Close Ceylo"><X size={20} aria-hidden="true"/></button>
      </header>
      <div ref={log} className={styles.log} role="log" aria-label="Conversation with Ceylo" aria-live="polite" aria-relevant="additions">
        <p className={styles.eyebrow}>Guided catalogue demo</p><p className={styles.greeting}>{greeting}</p>
        {!messages.length&&<div className={styles.suggestions} aria-label="Suggested travel questions">{ceyloSuggestions.map(question=><button key={question} type="button" disabled={processing||listening} onClick={()=>submit(question)}>{question}<ArrowUpRight size={14} aria-hidden="true"/></button>)}</div>}
        {messages.map(message=><div key={message.id} className={styles.exchange}>
          <p className={styles.question}><span className={styles.srOnly}>You: </span>{message.question}</p>
          <div className={styles.reply}><p>{message.reply.text}</p>
            {message.reply.links.length>0&&<ul className={styles.links}>{message.reply.links.map(link=><li key={`${link.kind}-${link.id}`}><Link href={link.href}><span>{link.kind}</span>{link.name}<ArrowUpRight size={14} aria-hidden="true"/></Link></li>)}</ul>}
            {message.reply.source&&<a className={styles.source} href={message.reply.source.href} target="_blank" rel="noopener noreferrer">{message.reply.source.label} ↗</a>}
            {voiceSupport.speech&&<button type="button" className={styles.listen} onClick={()=>voice.current?.speak(message.reply.text)} disabled={processing}><Volume2 size={14} aria-hidden="true"/>Listen to this reply</button>}
          </div>
        </div>)}
      </div>
      <div className={styles.composer}>
        <p id={statusId} className={styles.status} role="status">{status||"Explore Sri Lanka at your own pace."}</p>
        {error&&<p role="alert" className={styles.error}>{error}</p>}
        <form onSubmit={event=>{event.preventDefault();submit()}}>
          <label htmlFor={inputId}>Your question</label>
          <textarea ref={input} id={inputId} value={draft} onChange={event=>setDraft(event.target.value)} maxLength={600} rows={2} placeholder="Ask about beaches, Ella, wildlife…" aria-describedby={statusId} disabled={processing||listening} onKeyDown={event=>{if(event.key==="Enter"&&!event.shiftKey&&!event.nativeEvent.isComposing){event.preventDefault();submit()}}}/>
          <div className={styles.actions}>
            {voiceSupport.recognition?<button type="button" className={styles.voiceButton} disabled={processing||phase==="finishing"} onClick={()=>listening?voice.current?.stopListening():voice.current?.start()}><Mic size={16} aria-hidden="true"/>{listening?"Stop Listening":"Use microphone"}</button>:<span className={styles.unsupported}>Voice input unavailable here. You can type.</span>}
            <button type="submit" className={styles.send} disabled={!draft.trim()||processing||listening} aria-label="Send question"><Send size={17} aria-hidden="true"/></button>
          </div>
        </form>
        <div className={styles.speechOptions}>
          {voiceSupport.speech?<label><input type="checkbox" checked={speakReplies} onChange={event=>{setSpeakReplies(event.target.checked);if(!event.target.checked)voice.current?.cancel()}}/>Speak replies</label>:<span>Spoken replies unavailable in this browser.</span>}
          {(phase==="speaking"||phase==="preparing")&&<button type="button" onClick={()=>voice.current?.cancel()}><Square size={12} aria-hidden="true"/>Stop Speaking</button>}
        </div>
        <Link className={styles.journey} href={latest?.journeyHref??"/journey-builder?step=0"}>Plan Your Journey<ArrowUpRight size={16} aria-hidden="true"/></Link>
        <details className={styles.privacy}><summary>Voice &amp; privacy</summary><p>This is a guided demo, not a live AI agent. Voice starts only when you ask. Your browser/provider may process audio remotely; support and English voices vary. We do not store recordings or this chat. Do not share private or payment details. Review your transcript before sending. No live pricing, availability or bookings.</p></details>
      </div>
    </section>}
    {!introDismissed&&!open&&<div ref={welcome} className={styles.welcome} data-hint-ready={hintReady}>
      <p>Hi! I&apos;m Ceylo 🌿<br/><span>Where shall we explore?</span></p>
      <button type="button" onClick={dismissCompanionIntro} aria-label="Dismiss Ceylo greeting"><X size={13} aria-hidden="true"/></button>
    </div>}
    <div className={styles.characterDock}>
      <button type="button" className={styles.motionToggle} aria-label={motionPaused?"Resume Ceylo animation":"Pause Ceylo animation"} aria-pressed={motionPaused} onClick={()=>setMotionPaused(value=>!value)}>{motionPaused?<Play size={13} aria-hidden="true"/>:<Pause size={13} aria-hidden="true"/>}</button>
      <button ref={launcher} type="button" className={styles.launcher} onClick={()=>{dismissCompanionIntro();if(open)close();else{setCelebrating(true);setOpen(true)}}} aria-expanded={open} aria-controls={open?panelId:undefined} aria-label={open?"Close Ceylo travel companion":"Open Ceylo travel companion"} title="Explore with Ceylo">
        <span className={styles.aura} aria-hidden="true"/>
        <span className={styles.character} aria-hidden="true"><Image src="/partner-demo/ceylo-companion-cutout.webp" alt="" width={112} height={112} sizes="(max-width: 600px) 80px, 112px" draggable={false}/></span>
        <span className={styles.waves} aria-hidden="true"><i/><i/><i/></span>
        <span className={styles.sparkle} aria-hidden="true">✧</span>
      </button>
    </div>
  </div>;
}
