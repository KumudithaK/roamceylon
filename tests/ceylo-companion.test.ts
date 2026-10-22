import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import {companionState,companionHintOverlaps,companionIntroDismissed,dismissCompanionIntro,subscribeCompanionIntro} from "../lib/ceylo/companion-state.ts";
import {ceyloSuggestions} from "../lib/ceylo/catalogue.ts";
import {browserVoiceDependencies} from "../lib/ceylo/voice.ts";
const read=(file:string)=>readFileSync(new URL("../"+file,import.meta.url),"utf8");

test("character states follow real listening/speech lifecycle and local work, with no invented speech",()=>{
  assert.equal(companionState("idle",false,"",false),"ready");
  assert.equal(companionState("requesting",false,"",false),"ready");
  assert.equal(companionState("listening",false,"",true),"listening");
  for(const phase of ["finishing","preparing"] as const)assert.equal(companionState(phase,false,"",false),"thinking");
  assert.equal(companionState("idle",true,"",false),"thinking");
  assert.equal(companionState("speaking",false,"",true),"speaking");
  assert.equal(companionState("idle",false,"",true),"success");
  assert.equal(companionState("idle",false,"permission denied",false),"error");
});
test("welcome hint is one-shot across client-side remounts, without tracking/storage",()=>{
  assert.equal(companionIntroDismissed(),false);let calls=0;
  const unsubscribe=subscribeCompanionIntro(()=>calls++);dismissCompanionIntro();dismissCompanionIntro();
  assert.equal(companionIntroDismissed(),true);assert.equal(calls,1);unsubscribe();
  assert.doesNotMatch(read("lib/ceylo/companion-state.ts"),/localStorage|sessionStorage|document\.cookie|fetch\(/);
});
test("the one-time hint is hidden before placement and dismissed if it intersects a hero heading or CTA",()=>{
  const hint={left:96,right:291,top:391,bottom:459};
  assert.equal(companionHintOverlaps(hint,[{left:16,right:198,top:444,bottom:500}]),true);
  assert.equal(companionHintOverlaps(hint,[{left:16,right:198,top:320,bottom:375}]),false);
  assert.equal(companionHintOverlaps(hint,[{left:400,right:500,top:444,bottom:500}]),false);
  const ui=read("components/ceylo/ceylo-companion.tsx");assert.match(ui,/companionHintOverlaps\(welcome.current.getBoundingClientRect/);assert.match(ui,/observer.disconnect\(\)/);
  assert.match(read("components/ceylo/ceylo.module.css"),/\.welcome\[data-hint-ready=false\]\{visibility:hidden\}/);
});
test("browser speech adapter reports speaking only from utterance onstart, and preserves exact visible text",()=>{
  let utterance:Record<string,unknown>|undefined,starts=0,ends=0;
  class FakeUtterance {text:string;constructor(text:string){this.text=text}}
  const previousWindow=Object.getOwnPropertyDescriptor(globalThis,"window"),previousUtterance=Object.getOwnPropertyDescriptor(globalThis,"SpeechSynthesisUtterance");
  Object.defineProperty(globalThis,"window",{configurable:true,value:{speechSynthesis:{getVoices:()=>[],speak:(value:Record<string,unknown>)=>{utterance=value},cancel:()=>{}},SpeechSynthesisUtterance:FakeUtterance}});
  Object.defineProperty(globalThis,"SpeechSynthesisUtterance",{configurable:true,value:FakeUtterance});
  try{
    browserVoiceDependencies().speak!("Visible public answer",()=>ends++,()=>{},()=>starts++);
    assert.equal(starts,0);assert.equal(utterance!.text,"Visible public answer");assert.equal(utterance!.lang,"en-US");
    (utterance!.onstart as ()=>void)();assert.equal(starts,1);(utterance!.onend as ()=>void)();assert.equal(ends,1);
  }finally{
    if(previousWindow)Object.defineProperty(globalThis,"window",previousWindow);else Reflect.deleteProperty(globalThis,"window");
    if(previousUtterance)Object.defineProperty(globalThis,"SpeechSynthesisUtterance",previousUtterance);else Reflect.deleteProperty(globalThis,"SpeechSynthesisUtterance");
  }
});
test("launcher is a transparent character, correctly labelled/connected; no permanent pill label",()=>{
  const ui=read("components/ceylo/ceylo-companion.tsx"),css=read("components/ceylo/ceylo.module.css");
  assert.match(ui,/ceylo-companion-cutout\.webp/);assert.doesNotMatch(ui,/Your Sri Lankan companion<|ceylo-approved\.png/);
  assert.match(ui,/Open Ceylo travel companion/);assert.match(ui,/aria-controls=\{open\?panelId:undefined\}/);
  assert.match(ui,/if\(open\)\{wasOpened.current=true;input.current\?\.focus\(\)/);assert.match(ui,/else if\(wasOpened.current\)launcher.current\?\.focus\(\)/);assert.match(ui,/event.key==="Escape"/);
  assert.match(ui,/Let&apos;s explore Sri Lanka/);assert.match(ui,/Ask Ceylo anything about your next adventure/);
  assert.match(css,/\.launcher\{[^}]*background:transparent/);assert.match(css,/--character-size:112px/);assert.match(css,/--character-size:80px/);
});
test("motion has an explicit pause, reduced-motion override, safe-area spacing and lightweight transform keyframes",()=>{
  const ui=read("components/ceylo/ceylo-companion.tsx"),css=read("components/ceylo/ceylo.module.css");
  assert.match(ui,/Pause Ceylo animation/);assert.match(ui,/data-motion-paused=\{motionPaused\}/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);assert.match(css,/animation:none!important/);assert.match(css,/env\(safe-area-inset-bottom\)/);
  assert.match(css,/:focus-visible/);assert.match(css,/min-height:44px/);assert.match(css,/@keyframes ceyloFloat/);
  assert.doesNotMatch(ui,/setInterval|dangerouslySetInnerHTML|localStorage|sessionStorage|fetch\(/);
});
test("requested suggested questions preserve the same catalogue engine and manual transcript submission",()=>{
  assert.deepEqual([...ceyloSuggestions],["Best beaches in December?","Where can I see elephants?","What should I do in Ella?","Plan a romantic honeymoon","Family-friendly destinations"]);
  const ui=read("components/ceylo/ceylo-companion.tsx");assert.match(ui,/recommendCeylo\(value,catalogue,context.current\)/);
  assert.match(ui,/transcript:setDraft/);assert.match(ui,/Stop Listening/);assert.match(ui,/Stop Speaking/);assert.match(ui,/useState\(false\)/);
});
