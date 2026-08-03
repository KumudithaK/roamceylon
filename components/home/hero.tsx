import Link from "next/link";
import {ArrowDown} from "lucide-react";
import {JourneySearch} from "./journey-search";
import {HeroRouteDemo} from "./hero-route-demo";
import {FadeIn} from "@/components/animate/fade-in";
import {HeroMedia} from "./hero-media";
import type {Destination,HeroMedia as HeroMediaType,Theme} from "@/lib/types";

export function Hero({media,themes,destinations}:{media:HeroMediaType;themes:Theme[];destinations:Destination[]}){
  return <section className="relative min-h-[calc(100svh-7rem)] overflow-hidden bg-slate text-ivory"><HeroMedia media={media}/><div className="shell relative flex min-h-[calc(100svh-7rem)] flex-col justify-end pb-12 pt-28"><div className="flex items-end justify-between gap-12"><FadeIn><p className="eyebrow mb-5 text-gold-light">Private, tailor-made Sri Lanka journeys</p><h1 className="display max-w-4xl">{media.title}</h1><p className="mt-7 max-w-2xl text-lg leading-8 text-ivory/80">{media.subtitle}</p></FadeIn><HeroRouteDemo destinations={destinations}/></div><div className="mt-10"><JourneySearch themes={themes}/></div><Link href="#discover" className="mt-8 inline-flex w-fit items-center gap-2 text-sm font-semibold text-ivory/70 hover:text-ivory">Explore Sri Lanka <ArrowDown className="size-4"/></Link></div></section>;
}
