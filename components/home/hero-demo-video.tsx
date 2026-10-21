"use client";

import {useEffect,useRef,useState,useSyncExternalStore} from "react";
import {Pause,Play} from "lucide-react";
import {partnerDemoEmbedUrl} from "@/lib/partner-demo";

type Player={mute:()=>void;playVideo:()=>void;destroy:()=>void};
type PlayerEvent={target:Player};
type YouTubeApi={Player:new(iframe:HTMLIFrameElement,options:{events:{
  onReady:(event:PlayerEvent)=>void;
  onStateChange:(event:PlayerEvent&{data:number})=>void;
  onError:()=>void;
  onAutoplayBlocked:()=>void;
}})=>Player};
type YouTubeWindow=Window&{YT?:YouTubeApi;onYouTubeIframeAPIReady?:()=>void};
let apiPromise:Promise<YouTubeApi>|undefined;

function loadYouTubeApi(){
  const scope=window as YouTubeWindow;
  if(scope.YT?.Player)return Promise.resolve(scope.YT);
  if(!apiPromise)apiPromise=new Promise<YouTubeApi>((resolve,reject)=>{
    const previous=scope.onYouTubeIframeAPIReady;
    scope.onYouTubeIframeAPIReady=()=>{
      try{previous?.()}finally{
        if(scope.YT?.Player)resolve(scope.YT);
        else reject(new Error("YouTube player unavailable"));
      }
    };
    const script=document.createElement("script");
    script.src="https://www.youtube.com/iframe_api";
    script.async=true;
    script.onerror=()=>reject(new Error("YouTube player blocked"));
    document.head.appendChild(script);
  });
  return apiPromise;
}

const motionQuery="(prefers-reduced-motion: reduce)";
const subscribeMotion=(notify:()=>void)=>{
  const query=window.matchMedia(motionQuery);
  query.addEventListener("change",notify);
  return ()=>query.removeEventListener("change",notify);
};
const motionAllowed=()=>!window.matchMedia(motionQuery).matches;
const serverMotionAllowed=()=>false;

/** Decorative media only. The original poster stays beneath it at all times. */
export function HeroDemoVideo({videoId}:{videoId:string}){
  const host=useRef<HTMLDivElement>(null);
  const allowMotion=useSyncExternalStore(subscribeMotion,motionAllowed,serverMotionAllowed);
  const [paused,setPaused]=useState(false);
  const [failed,setFailed]=useState(false);
  const [playing,setPlaying]=useState(false);
  const [hasPlayed,setHasPlayed]=useState(false);
  const enabled=allowMotion&&!paused&&!failed;

  useEffect(()=>{
    if(!enabled||!host.current)return;
    let cancelled=false;
    let player:Player|undefined;
    const fallback=()=>{if(!cancelled){setPlaying(false);setFailed(true)}};
    let watchdog=window.setTimeout(fallback,12_000);
    const iframe=document.createElement("iframe");
    iframe.title="Sri Lanka cinematic background — YouTube";
    iframe.tabIndex=-1;
    iframe.setAttribute("aria-hidden","true");
    iframe.allow="autoplay; encrypted-media";
    // Overrides the site's no-referrer policy for this provider only (YouTube error 153).
    iframe.referrerPolicy="strict-origin-when-cross-origin";
    iframe.src=partnerDemoEmbedUrl(videoId,window.location.origin);
    host.current.appendChild(iframe);
    loadYouTubeApi().then(api=>{
      if(cancelled)return;
      player=new api.Player(iframe,{events:{
        onReady:({target})=>{if(!cancelled){target.mute();target.playVideo()}},
        onStateChange:({data})=>{
          if(cancelled)return;
          window.clearTimeout(watchdog);
          setPlaying(data===1);
          if(data===1)setHasPlayed(true);
          if(data!==1)watchdog=window.setTimeout(fallback,12_000);
        },
        onError:fallback,
        onAutoplayBlocked:fallback
      }});
    }).catch(fallback);
    return ()=>{
      cancelled=true;
      window.clearTimeout(watchdog);
      player?.destroy();
      iframe.remove();
    };
  },[enabled,videoId]);

  const state=!allowMotion?"static":failed?"fallback":paused?"paused":playing?"playing":"loading";
  return <>
    <div ref={host} className="hero-demo-video-frame" data-hero-video-state={state} data-playing={enabled&&playing} aria-hidden="true"/>
    {allowMotion&&!failed&&(hasPlayed||paused)&&<div className="hero-demo-controls">
      <button type="button" className="hero-demo-control" onClick={()=>{setPlaying(false);setPaused(value=>!value)}} aria-label={paused?"Play background video":"Pause background video"}>
        {paused?<Play className="size-4" aria-hidden="true"/>:<Pause className="size-4" aria-hidden="true"/>}
        <span>{paused?"Play video":"Pause video"}</span>
      </button>
    </div>}
  </>;
}
