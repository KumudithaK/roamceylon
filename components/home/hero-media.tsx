"use client";

import Image from "next/image";
import {useSyncExternalStore} from "react";
import {useReducedMotion} from "motion/react";
import type {HeroMedia as HeroMediaType} from "@/lib/types";

const subscribe=()=>()=>{};
const useHydrated=()=>useSyncExternalStore(subscribe,()=>true,()=>false);

export function HeroMedia({media}:{media:HeroMediaType}){
  const hydrated=useHydrated();
  const reduced=useReducedMotion();
  const showYoutubePreview=hydrated&&!reduced&&Boolean(media.developmentYoutubePreviewId);
  const showUploadedVideo=hydrated&&!showYoutubePreview&&!reduced&&media.enabled&&Boolean(media.desktopVideoUrl);
  const youtubeUrl=media.developmentYoutubePreviewId
    ?`https://www.youtube-nocookie.com/embed/${media.developmentYoutubePreviewId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${media.developmentYoutubePreviewId}&playsinline=1&rel=0&disablekb=1`
    :null;

  return <div className="absolute inset-0">
    {media.posterUrl&&<Image src={media.posterUrl} alt={media.alt} fill priority sizes="100vw" className="object-cover animate-[hero-zoom_18s_ease-out_both]"/>}
    {showYoutubePreview&&youtubeUrl&&<div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <iframe src={youtubeUrl} title="Temporary development hero preview" className="absolute left-1/2 top-1/2 aspect-video min-h-full min-w-full -translate-x-1/2 -translate-y-1/2 border-0" allow="autoplay; encrypted-media" referrerPolicy="strict-origin-when-cross-origin"/>
    </div>}
    {showUploadedVideo&&<video className="absolute inset-0 size-full object-cover opacity-0 animate-[hero-fade_.8s_ease-out_forwards]" autoPlay={media.autoplay} loop={media.loop} muted playsInline preload="none" poster={media.posterUrl||undefined} aria-label={media.alt}><source src={media.mobileVideoUrl||media.desktopVideoUrl!} media="(max-width: 767px)"/><source src={media.desktopVideoUrl!}/></video>}
    <div className="absolute inset-0 bg-slate" style={{opacity:media.overlayStrength}}/>
  </div>;
}
