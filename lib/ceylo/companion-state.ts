import type {VoicePhase} from "./voice.ts";

export type CompanionState="ready"|"listening"|"thinking"|"speaking"|"success"|"error";
type Bounds={left:number;right:number;top:number;bottom:number};
export const companionHintOverlaps=(hint:Bounds,protectedBounds:Bounds[])=>protectedBounds.some(r=>hint.left<r.right&&hint.right>r.left&&hint.top<r.bottom&&hint.bottom>r.top);

/** Motion follows real work/voice events, never fabricated lip-sync. */
export function companionState(phase:VoicePhase,processing:boolean,error:string,celebrating:boolean):CompanionState{
  if(error)return "error";
  if(phase==="speaking")return "speaking";
  if(phase==="listening")return "listening";
  if(processing||phase==="finishing"||phase==="preparing")return "thinking";
  if(celebrating)return "success";
  return "ready";
}

// One introductory hint per in-memory page session, including client-side returns
// to the homepage. No cookies, browser storage, transcript or identity tracking.
let dismissed=false;
const subscribers=new Set<()=>void>();
export const subscribeCompanionIntro=(notify:()=>void)=>{subscribers.add(notify);return ()=>{subscribers.delete(notify)}};
export const companionIntroDismissed=()=>dismissed;
export const serverCompanionIntroDismissed=()=>false;
export function dismissCompanionIntro(){
  if(dismissed)return;
  dismissed=true;for(const notify of subscribers)notify();
}
