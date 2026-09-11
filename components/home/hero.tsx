import Link from "next/link";
import {ArrowDown} from "lucide-react";
import {JourneySearch} from "./journey-search";
import {HeroRouteDemo} from "./hero-route-demo";
import {FadeIn} from "@/components/animate/fade-in";
import {HeroMedia} from "./hero-media";
import type {Destination,HeroMedia as HeroMediaType,Theme} from "@/lib/types";

export function Hero({media,themes,destinations}:{media:HeroMediaType;themes:Theme[];destinations:Destination[]}){
  return <section className="relative min-h-[calc(100svh-5rem)] overflow-hidden bg-slate text-ivory">
    <HeroMedia media={media}/>
    <div className="absolute inset-0 bg-gradient-to-r from-forest/75 via-transparent to-forest/20"/>
    <div className="shell relative flex min-h-[calc(100svh-5rem)] flex-col justify-end pb-8 pt-24 md:pb-12">
      <div className="grid items-end gap-10 lg:grid-cols-[1fr_auto]">
        <FadeIn className="max-w-4xl"><div className="mb-6 flex items-center gap-4"><span className="h-px w-14 bg-gold-light"/><p className="eyebrow text-gold-light">Private journeys · Sri Lanka</p></div><h1 className="font-serif text-[clamp(3.4rem,7.4vw,7.5rem)] leading-[.88] tracking-[-.045em]">{media.title}</h1><p className="mt-7 max-w-xl text-base leading-8 text-ivory/78 md:text-lg">{media.subtitle}</p></FadeIn>
        <div className="hidden lg:block"><HeroRouteDemo destinations={destinations}/></div>
      </div>
      <div className="mt-10 border-t border-ivory/20 pt-7"><JourneySearch themes={themes}/></div>
      <Link href="#discover" className="mt-7 inline-flex w-fit items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-ivory/70 hover:text-ivory">Explore the island <ArrowDown className="size-4"/></Link>
    </div>
  </section>;
}
