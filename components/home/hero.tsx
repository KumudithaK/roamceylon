import Image from "next/image";
import Link from "next/link";
import {ArrowDown} from "lucide-react";
import {JourneySearch} from "./journey-search";
import {FadeIn} from "@/components/animate/fade-in";
import {HeroMedia} from "./hero-media";
import type {HeroMedia as HeroMediaType} from "@/lib/types";

export function Hero({media}:{media:HeroMediaType}){
  return <section className="relative min-h-[calc(100svh-6rem)] overflow-hidden bg-slate text-ivory"><HeroMedia media={media}/><div className="shell relative flex min-h-[calc(100svh-6rem)] flex-col justify-end pb-12 pt-32"><FadeIn><Image src="/assets/logo/roam-ceylon-elephant.png" alt="Roam Ceylon — Journeys that connect" width={180} height={102} priority className="mb-7 h-auto w-[180px] rounded-2xl bg-ivory/95 p-2 shadow-2xl"/><p className="eyebrow mb-5 text-gold-light">Discover Sri Lanka</p><h1 className="display max-w-5xl">{media.title}</h1><p className="mt-7 max-w-2xl text-lg leading-8 text-ivory/80">{media.subtitle}</p></FadeIn><div className="mt-10"><JourneySearch/></div><Link href="#discover" className="mt-8 inline-flex w-fit items-center gap-2 text-sm font-semibold text-ivory/70 hover:text-ivory">Explore Sri Lanka <ArrowDown className="size-4"/></Link></div></section>;
}
