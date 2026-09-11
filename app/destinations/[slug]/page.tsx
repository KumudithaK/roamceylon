import type {Metadata} from "next";
import Image from "next/image";
import Link from "next/link";
import {ArrowLeft,ArrowRight,MapPin} from "lucide-react";
import {notFound} from "next/navigation";
import {SriLankaMap} from "@/components/map/sri-lanka-map";
import {Button} from "@/components/ui/button";
import {brand,editionDisplayName} from "@/lib/brand";
import {DestinationWeather} from "@/components/weather/destination-weather";
import {DestinationInsights} from "@/components/destinations/destination-insights";
import {UnescoBadge} from "@/components/destinations/unesco-badge";
import {JourneyService} from "@/lib/journey/journey-service";
import {getNearbyDestinations} from "@/lib/journey/route";
import type {JourneyDestination} from "@/lib/types";

const editorialCopy=(value:string|null)=>value?.replaceAll("\\n","\n")||value;

export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
  const {slug}=await params;
  const data=await new JourneyService().getJourneyBootstrapData();
  const item=data.destinations.find(destination=>destination.slug===slug);
  return item?{title:item.name,description:item.short_description,alternates:{canonical:`/destinations/${item.slug}`}}:{};
}

export default async function DestinationPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const data=await new JourneyService().getJourneyBootstrapData();
  const item=data.destinations.find(destination=>destination.slug===slug);
  if(!item)notFound();
  const experiences=data.experiences.filter(experience=>experience.destinationIds.includes(item.id));
  const stays=data.stays.filter(stay=>stay.destinationId===item.id);
  const themeNames=item.themeIds.flatMap(id=>{const theme=data.themes.find(candidate=>candidate.id===id);return theme?[editionDisplayName(theme)]:[]});
  const journeyHref=`/journey-builder?themes=${item.themeIds.join(",")}&destination=${item.id}&step=1`;
  const nearbyDestinations=getNearbyDestinations(data.destinations,item.id,5);
  return <main>
    <section className="relative min-h-[75svh] overflow-hidden bg-slate text-ivory">{item.hero_image_url&&<Image src={item.hero_image_url} alt={item.image_alt||item.name} fill priority sizes="100vw" className="object-cover opacity-60"/>}<div className="absolute inset-0 bg-gradient-to-t from-slate via-slate/25 to-slate/20"/><div className="shell relative flex min-h-[75svh] flex-col justify-end pb-16"><Link href="/destinations" className="mb-8 inline-flex items-center gap-2 text-sm"><ArrowLeft className="size-4"/>All destinations</Link><p className="eyebrow flex items-center gap-2 text-gold-light"><MapPin className="size-4"/>{item.province||item.region||"Sri Lanka"}</p><h1 className="display mt-4">{item.name}</h1>{item.short_description&&<p className="mt-6 max-w-2xl text-lg leading-8 text-ivory/80">{item.short_description}</p>}<Button asChild variant="accent" className="mt-8 w-fit"><Link href={journeyHref}>{brand.primaryCta}<ArrowRight/></Link></Button></div></section>
    <section className="section"><div className="shell grid gap-12 xl:grid-cols-[.72fr_1.28fr] xl:gap-24"><article><p className="editorial-index">01</p><p className="eyebrow mt-8">A closer look</p><h2 className="heading mt-4">Why visit {item.name}?</h2>{themeNames.length?<div className="mt-8 flex flex-wrap gap-2">{themeNames.map(name=><span key={name} className="border-b border-gold px-1 py-2 text-xs font-bold uppercase tracking-wider text-forest">{name}</span>)}</div>:null}</article><div><p className="prose-luxury max-w-3xl whitespace-pre-line">{editorialCopy(item.full_description||item.short_description)}</p><div className="mt-12"><SriLankaMap destinations={data.destinations} selectedIds={[item.id]} mode="destination" destination={item} nearbyDestinations={nearbyDestinations} journeyHref={journeyHref}/></div></div></div></section>
    <DestinationStory item={item}/>
    {item.gallery.length?<section className="pb-20"><div className="shell grid gap-3 md:grid-cols-12">{item.gallery.slice(0,3).map((src,index)=><div key={src} className={`image-lift relative overflow-hidden bg-sand ${index===0?"aspect-[16/10] md:col-span-8":"aspect-square md:col-span-4"}`}><Image src={src} alt={`${item.name} gallery ${index+1}`} fill sizes="66vw" className="object-cover"/></div>)}</div></section>:null}
    <Related title={`Experiences in ${item.name}`} eyebrow="Things to do" empty="No published experiences are linked to this destination yet." items={experiences.map(entry=>({id:entry.id,title:entry.name,description:entry.short_description,image:entry.hero_image_url,alt:entry.image_alt,href:`/experiences/${entry.slug}`,meta:entry.category}))}/>
    <Related title="Places to stay" eyebrow="Accommodation" empty="No published accommodation is available here yet." items={stays.map(entry=>({id:entry.id,title:entry.name,description:entry.short_description,image:entry.hero_image_url,alt:entry.image_alt,href:`/hotels/${entry.slug}`,meta:entry.property_type}))} shaded/>
    <section className="bg-forest py-20 text-ivory md:py-28"><div className="shell md:flex md:items-end md:justify-between"><div><p className="eyebrow text-gold-light">Make it yours</p><h2 className="mt-4 max-w-3xl font-serif text-4xl leading-tight md:text-6xl">Place {item.name} on your route.</h2></div><Button asChild variant="accent" className="mt-8 md:mt-0"><Link href={journeyHref}>{brand.primaryCta}<ArrowRight/></Link></Button></div></section>
  </main>;
}

function DestinationStory({item}:{item:JourneyDestination}){
  const stories=[
    ["Why visit",item.why_visit],
    ["Historical importance",item.historical_importance],
    ["Cultural significance",item.cultural_significance],
    ["UNESCO information",item.unesco_information],
    ["Nature & wildlife",item.nature_wildlife],
    ["Best time to visit",item.best_time_to_visit]
  ].filter((entry):entry is [string,string]=>Boolean(entry[1]));
  if(!stories.length&&!item.weather&&!item.local_highlights.length&&!item.nearby_attractions.length&&!item.travel_tips.length)return null;
  return <section id="destination-story" className="bg-sand py-20 md:py-28"><div className="shell">
    {stories.length?<div className="divide-y divide-forest/20 border-y border-forest/20">{stories.map(([title,copy],index)=>{const unesco=title==="UNESCO information";return <article key={title} className="relative grid gap-5 py-9 md:grid-cols-[.55fr_1fr] md:py-12"><div><span className="font-serif text-2xl text-gold">{String(index+1).padStart(2,"0")}</span><div className="mt-4 flex flex-wrap items-center gap-3"><h3 className="font-serif text-2xl">{title}</h3>{unesco&&<UnescoBadge/>}</div></div><p className="whitespace-pre-line text-base leading-8 text-slate/70">{editorialCopy(copy)}</p></article>;})}</div>:null}
    {item.weather?<div className="mt-6"><DestinationWeather name={item.name} latitude={item.latitude} longitude={item.longitude} climate={item.weather}/></div>:null}
    <DestinationInsights item={item}/>
  </div></section>;
}

type RelatedItem={id:string;title:string;description:string|null;image:string|null;alt:string|null;href:string;meta:string|null};
function Related({title,eyebrow,items,empty,shaded=false}:{title:string;eyebrow:string;items:RelatedItem[];empty:string;shaded?:boolean}){
  return <section className={shaded?"bg-sand py-20 md:py-28":"section"}><div className="shell"><p className="eyebrow">{eyebrow}</p><h2 className="heading mt-4">{title}</h2>{items.length?<div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">{items.slice(0,6).map(entry=><Link href={entry.href} key={entry.id} className="image-lift group block focus-ring"><div className="relative aspect-[4/3] overflow-hidden bg-sand">{entry.image&&<Image src={entry.image} alt={entry.alt||entry.title} fill sizes="33vw" className="object-cover"/>}<div className="absolute inset-0 bg-gradient-to-t from-forest/45 to-transparent"/></div><div className="border-b border-forest/20 py-5"><p className="text-[.65rem] font-bold uppercase tracking-widest text-gold">{entry.meta}</p><h3 className="mt-2 font-serif text-2xl leading-snug">{entry.title}</h3><p className="mt-3 line-clamp-2 text-sm leading-6 text-slate/60">{entry.description}</p></div></Link>)}</div>:<p className="mt-8 border-y border-forest/20 py-7 text-stone">{empty}</p>}</div></section>;
}
