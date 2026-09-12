import Image from "next/image";
import Link from "next/link";
import {ArrowRight,Compass,HeartHandshake,Leaf,ShieldCheck} from "lucide-react";
import {FadeIn} from "@/components/animate/fade-in";
import {SriLankaMap} from "@/components/map/sri-lanka-map";
import {Button} from "@/components/ui/button";
import {brand,editionDisplayName} from "@/lib/brand";
import {curateHomepageExperiences} from "@/lib/homepage-experience-curation";
import type {Destination,JourneyExperience,Theme} from "@/lib/types";

const editionMosaicOrder=["nature","wellness","sporting","heritage","tropical","adventure","culture","wildlife"];
const editionMosaicLayout:Record<string,{tile:string;frame:string;image:string;sizes:string}>={
  nature:{tile:"sm:col-span-2 lg:col-span-7 lg:row-span-5",frame:"aspect-[5/4] sm:aspect-[16/10] lg:aspect-auto lg:h-full",image:"object-center",sizes:"(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 58vw"},
  wellness:{tile:"lg:col-span-5 lg:row-span-2",frame:"aspect-[3/2] lg:aspect-auto lg:h-full",image:"object-center",sizes:"(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 42vw"},
  sporting:{tile:"lg:col-span-5 lg:row-span-3",frame:"aspect-[3/2] lg:aspect-auto lg:h-full",image:"object-center",sizes:"(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 42vw"},
  heritage:{tile:"sm:col-span-2 lg:col-span-5 lg:row-span-6",frame:"aspect-[5/4] sm:aspect-[16/10] lg:aspect-auto lg:h-full",image:"object-center",sizes:"(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 42vw"},
  tropical:{tile:"sm:col-span-2 lg:col-span-7 lg:row-span-4",frame:"aspect-[5/4] sm:aspect-[16/10] lg:aspect-auto lg:h-full",image:"object-center",sizes:"(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 58vw"},
  adventure:{tile:"lg:col-span-3 lg:row-span-2",frame:"aspect-[3/2] lg:aspect-auto lg:h-full",image:"object-center",sizes:"(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"},
  culture:{tile:"lg:col-span-4 lg:row-span-2",frame:"aspect-[3/2] lg:aspect-auto lg:h-full",image:"object-center",sizes:"(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"},
  wildlife:{tile:"sm:col-span-2 lg:col-span-12 lg:row-span-5",frame:"aspect-[5/4] sm:aspect-[16/9] lg:aspect-auto lg:h-full",image:"object-[center_38%]",sizes:"100vw"},
};
const fallbackEditionLayout={tile:"lg:col-span-3 lg:row-span-2",frame:"aspect-[3/2] lg:aspect-auto lg:h-full",image:"object-center",sizes:"(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"};

export function EditorialHome({themes,destinations,experiences}:{themes:Theme[];destinations:Destination[];experiences:JourneyExperience[]}){
  const places=destinations.slice(0,5);
  const moments=curateHomepageExperiences(experiences);
  const brandImage=places.find(item=>item.hero_image_url)?.hero_image_url;
  const editorialEditions=themes.map((theme,index)=>({theme,number:index+1})).sort((a,b)=>{
    const aOrder=editionMosaicOrder.indexOf(a.theme.slug);
    const bOrder=editionMosaicOrder.indexOf(b.theme.slug);
    return (aOrder<0?editionMosaicOrder.length+a.number:aOrder)-(bOrder<0?editionMosaicOrder.length+b.number:bOrder);
  });
  return <>
    <section id="discover" className="section overflow-hidden bg-ivory">
      <div className="shell grid gap-12 lg:grid-cols-[.7fr_1.3fr] lg:gap-24">
        <FadeIn><p className="editorial-index">01</p><p className="eyebrow mt-8">The Ceylon Edition point of view</p></FadeIn>
        <FadeIn delay={.08}><h2 className="font-serif text-[clamp(2.7rem,5vw,5rem)] leading-[1.02] tracking-[-.035em]">The island is not an itinerary. It is a story waiting to become yours.</h2><p className="prose-luxury mt-8 max-w-2xl">We begin with what draws you in, then connect places, people and experiences into a private journey with its own natural rhythm.</p><Link href="/about" className="editorial-link mt-9 text-forest">Our approach</Link></FadeIn>
      </div>
    </section>

    <section className="editorial-noise bg-forest py-20 text-ivory md:py-32">
      <div className="shell">
        <div className="grid gap-8 md:grid-cols-[.8fr_1.2fr] md:items-end"><FadeIn><p className="eyebrow text-gold-light">The Editions</p><h2 className="heading mt-4">Eight ways into Sri Lanka.</h2></FadeIn><FadeIn delay={.08}><p className="max-w-xl leading-8 text-ivory/68">Not packages. Points of departure—each one opening a different mood, landscape and way of moving through the island.</p></FadeIn></div>
        <div className="mt-14 grid grid-cols-1 gap-x-5 gap-y-6 sm:grid-cols-2 lg:auto-rows-[6.5rem] lg:grid-cols-12 lg:gap-y-5">{editorialEditions.map(({theme,number},index)=>{const layout=editionMosaicLayout[theme.slug]??fallbackEditionLayout;return <FadeIn key={theme.id} delay={(index%4)*.05} className={layout.tile}><Link href={`/discover/${theme.slug}`} className="image-lift group block h-full focus-ring"><div className={`relative overflow-hidden bg-slate ${layout.frame}`}>{theme.hero_image_url?<Image src={theme.hero_image_url} alt={theme.image_alt||editionDisplayName(theme)} fill sizes={layout.sizes} className={`object-cover opacity-80 transition duration-1000 ease-out group-hover:scale-[1.025] ${layout.image}`}/>:null}<div className="absolute inset-0 bg-gradient-to-t from-forest/95 via-forest/5 to-transparent"/><span className="absolute right-4 top-4 font-serif text-xl text-ivory/80">{String(number).padStart(2,"0")}</span><div className="absolute inset-x-0 bottom-0 p-5 md:p-6"><h3 className="font-serif text-2xl md:text-3xl">{editionDisplayName(theme)}</h3><p className="mt-2 line-clamp-2 max-w-xl text-xs leading-5 text-ivory/70">{theme.short_description}</p></div></div></Link></FadeIn>})}</div>
      </div>
    </section>

    <section className="section bg-ivory">
      <div className="shell"><div className="grid gap-6 border-b border-forest/20 pb-10 md:grid-cols-[.55fr_1fr]"><p className="eyebrow">Places worth knowing</p><h2 className="heading">Sri Lanka, one extraordinary place at a time.</h2></div>
        <div className="mt-14 grid gap-12">{places.slice(0,3).map((place,index)=><FadeIn key={place.id} className={`grid items-center gap-8 lg:grid-cols-12 ${index%2?"lg:[&>*:first-child]:order-2":""}`}><Link href={`/destinations/${place.slug}`} className="image-lift focus-ring relative aspect-[16/10] overflow-hidden bg-sand lg:col-span-7">{place.hero_image_url?<Image src={place.hero_image_url} alt={place.image_alt||place.name} fill sizes="(max-width: 1024px) 100vw, 60vw" className="object-cover"/>:null}</Link><div className="lg:col-span-5 lg:px-8"><p className="text-[.68rem] font-bold uppercase tracking-[.18em] text-gold">{String(index+1).padStart(2,"0")} · {place.province||"Sri Lanka"}</p><h3 className="mt-4 font-serif text-4xl leading-tight md:text-5xl">{place.name}</h3><p className="mt-5 max-w-lg leading-7 text-muted">{place.short_description}</p><Link href={`/destinations/${place.slug}`} className="editorial-link mt-7">Discover {place.name}</Link></div></FadeIn>)}</div>
        <div className="mt-14 text-center"><Button asChild variant="outline"><Link href="/destinations">Explore every destination</Link></Button></div>
      </div>
    </section>

    {moments.length?<section className="bg-sand py-20 md:py-32"><div className="shell"><FadeIn className="max-w-4xl"><p className="eyebrow">Experiences worth travelling for</p><h2 className="heading mt-4">Remember the moments, not the checklist.</h2></FadeIn><div className="mt-14 grid gap-8 lg:grid-cols-12">{moments.map((item,index)=><FadeIn key={item.id} className={index===0?"lg:col-span-6":"lg:col-span-3"}><Link href={`/experiences/${item.slug}`} className="image-lift group block focus-ring"><div className={`relative overflow-hidden bg-forest ${index===0?"aspect-[4/3]":"aspect-[3/4]"}`}>{item.hero_image_url?<Image src={item.hero_image_url} alt={item.image_alt||item.name} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover"/>:null}<div className="absolute inset-0 bg-gradient-to-t from-forest/90 via-transparent to-transparent"/><div className="absolute inset-x-0 bottom-0 p-6 text-ivory"><p className="text-[.65rem] font-bold uppercase tracking-[.18em] text-gold-light">{item.category||"Experience"}</p><h3 className="mt-3 font-serif text-2xl leading-tight md:text-3xl">{item.name}</h3></div></div></Link></FadeIn>)}</div><Link href="/experiences" className="editorial-link mt-10">Explore all experiences</Link></div></section>:null}

    <section className="section bg-ivory"><div className="shell"><div className="grid items-center gap-12 lg:grid-cols-[.65fr_1.35fr]"><div><p className="eyebrow">Read the island</p><h2 className="heading mt-4">See where your journey could take you.</h2><p className="prose-luxury mt-6">Trace the geography, then let us shape the pace between the places that call to you.</p></div><SriLankaMap destinations={destinations}/></div></div></section>

    <section className="relative isolate min-h-[70svh] overflow-hidden bg-forest text-ivory">{brandImage?<Image src={brandImage} alt="Sri Lankan landscape" fill sizes="100vw" className="object-cover opacity-45"/>:null}<div className="absolute inset-0 bg-gradient-to-r from-forest via-forest/70 to-transparent"/><div className="shell relative flex min-h-[70svh] items-center py-20"><FadeIn className="max-w-3xl"><p className="eyebrow text-gold-light">Why {brand.name}</p><h2 className="mt-5 font-serif text-[clamp(3rem,6vw,6rem)] leading-[.98]">Local intelligence. Quiet confidence. One human connection.</h2><div className="mt-10 grid gap-6 border-t border-ivory/20 pt-8 sm:grid-cols-2">{[[Compass,"Designed around you"],[Leaf,"Rooted here"],[ShieldCheck,"Considered choices"],[HeartHandshake,"Human at heart"]].map(([Icon,label])=><div key={String(label)} className="flex items-center gap-3 text-sm"><Icon className="size-5 text-gold-light"/><span>{String(label)}</span></div>)}</div></FadeIn></div></section>

    <section className="section bg-ivory"><div className="shell border-y border-forest/20 py-16 text-center md:py-24"><p className="eyebrow">Your island. Your pace.</p><h2 className="mx-auto mt-5 max-w-4xl font-serif text-[clamp(3rem,6vw,6rem)] leading-none">Begin with curiosity. Leave with a journey.</h2><Button asChild variant="primary" size="lg" className="mt-9"><Link href="/journey-builder?step=0">{brand.primaryCta}<ArrowRight/></Link></Button></div></section>
  </>;
}
