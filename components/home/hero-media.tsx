"use client";

import Image from "next/image";
import {useReducedMotion} from "motion/react";
import type {HeroMedia as HeroMediaType} from "@/lib/types";
import {useHydrated} from "@/lib/hooks/use-hydrated";
import {HeroDemoVideo} from "./hero-demo-video";

export function HeroMedia({media}:{media:HeroMediaType}){
  const hydrated=useHydrated();
  const reduced=useReducedMotion();
  const demo=Boolean(media.partnerDemoVideoId);
  const showUploadedVideo=hydrated&&!demo&&!reduced&&media.enabled&&Boolean(media.desktopVideoUrl);

  return <div className="absolute inset-0">
    {media.posterUrl&&<Image src={media.posterUrl} alt={media.alt} fill priority sizes="100vw" className={demo?"object-cover":"object-cover animate-[hero-zoom_18s_ease-out_both]"}/>}
    {media.partnerDemoVideoId&&<HeroDemoVideo videoId={media.partnerDemoVideoId}/>}
    {showUploadedVideo&&<video className="absolute inset-0 size-full object-cover opacity-0 animate-[hero-fade_.8s_ease-out_forwards]" autoPlay={media.autoplay} loop={media.loop} muted playsInline preload="none" poster={media.posterUrl||undefined} aria-label={media.alt}><source src={media.mobileVideoUrl||media.desktopVideoUrl!} media="(max-width: 767px)"/><source src={media.desktopVideoUrl!}/></video>}
    {!demo&&<div className="absolute inset-0 bg-slate" style={{opacity:media.overlayStrength}}/>}
  </div>;
}
