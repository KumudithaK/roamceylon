import type {Metadata} from "next";
import Image from "next/image";
import Link from "next/link";
import {ArrowLeft,ArrowRight,MapPin} from "lucide-react";
import {notFound} from "next/navigation";
import {SriLankaMap} from "@/components/map/sri-lanka-map";
import {Button} from "@/components/ui/button";
import {DestinationWeather} from "@/components/weather/destination-weather";
import {DestinationInsights} from "@/components/destinations/destination-insights";
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
  const themeNames=item.themeIds.map(id=>data.themes.find(theme=>theme.id===id)?.name).filter(Boolean);
  const journeyHref=`/journey-builder?themes=${item.themeIds.join(",")}&destination=${item.id}&step=1`;
  const nearbyDestinations=getNearbyDestinations(data.destinations,item.id,5);
  return <main>
    <section className="relative min-h-[75svh] overflow-hidden bg-slate text-ivory">{item.hero_image_url&&<Image src={item.hero_image_url} alt={item.image_alt||item.name} fill priority sizes="100vw" className="object-cover opacity-60"/>}<div className="absolute inset-0 bg-gradient-to-t from-slate via-slate/25 to-slate/20"/><div className="shell relative flex min-h-[75svh] flex-col justify-end pb-16"><Link href="/destinations" className="mb-8 inline-flex items-center gap-2 text-sm"><ArrowLeft className="size-4"/>All destinations</Link><p className="eyebrow flex items-center gap-2 text-gold-light"><MapPin className="size-4"/>{item.province||item.region||"Sri Lanka"}</p><h1 className="display mt-4">{item.name}</h1>{item.short_description&&<p className="mt-6 max-w-2xl text-lg leading-8 text-ivory/80">{item.short_description}</p>}<Button asChild variant="accent" className="mt-8 w-fit"><Link href={journeyHref}>Build a journey here<ArrowRight/></Link></Button></div></section>
    <section className="section"><div className="shell grid gap-12 xl:grid-cols-[minmax(0,1fr)_560px]"><article><p className="eyebrow">A closer look</p><h2 className="heading mt-4">Why visit {item.name}?</h2><p className="prose-luxury mt-7 max-w-3xl whitespace-pre-line">{editorialCopy(item.full_description||item.short_description)}</p>{themeNames.length?<div className="mt-8 flex flex-wrap gap-2">{themeNames.map(name=><span key={name} className="rounded-full bg-sand-light px-4 py-2 text-xs font-bold text-forest">{name}</span>)}</div>:null}</article><SriLankaMap destinations={data.destinations} selectedIds={[item.id]} mode="destination" destination={item} nearbyDestinations={nearbyDestinations} journeyHref={journeyHref}/></div></section>
    <DestinationStory item={item}/>
    {item.gallery.length?<section className="pb-20"><div className="shell grid gap-4 md:grid-cols-3">{item.gallery.slice(0,3).map((src,index)=><div key={src} className={`relative overflow-hidden rounded-3xl bg-sand ${index===0?"aspect-[16/10] md:col-span-2":"aspect-square"}`}><Image src={src} alt={`${item.name} gallery ${index+1}`} fill sizes="66vw" className="object-cover"/></div>)}</div></section>:null}
    <Related title={`Experiences in ${item.name}`} eyebrow="Things to do" empty="No published experiences are linked to this destination yet." items={experiences.map(entry=>({id:entry.id,title:entry.name,description:entry.short_description,image:entry.hero_image_url,alt:entry.image_alt,href:`/experiences/${entry.slug}`,meta:entry.category}))}/>
    <Related title="Places to stay" eyebrow="Accommodation" empty="No published accommodation is available here yet." items={stays.map(entry=>({id:entry.id,title:entry.name,description:entry.short_description,image:entry.hero_image_url,alt:entry.image_alt,href:`/hotels/${entry.slug}`,meta:entry.property_type}))} shaded/>
    <section className="pb-24"><div className="shell rounded-[2rem] bg-forest p-9 text-ivory md:flex md:items-center md:justify-between"><div><p className="eyebrow text-gold-light">Make it yours</p><h2 className="mt-3 font-serif text-4xl">Place {item.name} on your route.</h2></div><Button asChild variant="accent" className="mt-6 md:mt-0"><Link href={journeyHref}>Build your journey<ArrowRight/></Link></Button></div></section>
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
  return <section id="destination-story" className="bg-sand-light py-20"><div className="shell">
    {stories.length?<div className="grid gap-6 md:grid-cols-2">{stories.map(([title,copy])=><article key={title} className={`rounded-3xl border p-7 ${title==="Best time to visit"?"border-gold/25 bg-gold/[.08]":"border-transparent bg-white"}`}><p className="eyebrow">{title}</p><p className="mt-4 whitespace-pre-line leading-8 text-slate/65">{editorialCopy(copy)}</p></article>)}</div>:null}
    {item.weather?<div className="mt-6"><DestinationWeather name={item.name} latitude={item.latitude} longitude={item.longitude} climate={item.weather}/></div>:null}
    <DestinationInsights item={item}/>
  </div></section>;
}

type RelatedItem={id:string;title:string;description:string|null;image:string|null;alt:string|null;href:string;meta:string|null};
function Related({title,eyebrow,items,empty,shaded=false}:{title:string;eyebrow:string;items:RelatedItem[];empty:string;shaded?:boolean}){
  return <section className={shaded?"bg-sand-light py-20":"section"}><div className="shell"><p className="eyebrow">{eyebrow}</p><h2 className="heading mt-4">{title}</h2>{items.length?<div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{items.slice(0,6).map(entry=><Link href={entry.href} key={entry.id} className="group flex gap-4 rounded-2xl border border-stone/10 bg-white p-3 transition hover:-translate-y-1 hover:shadow-lg"><div className="relative size-28 shrink-0 overflow-hidden rounded-xl bg-sand">{entry.image&&<Image src={entry.image} alt={entry.alt||entry.title} fill sizes="112px" className="object-cover"/>}</div><div className="py-2"><p className="text-[.65rem] font-bold uppercase tracking-widest text-gold">{entry.meta}</p><h3 className="mt-2 line-clamp-2 font-serif text-lg leading-snug">{entry.title}</h3><p className="mt-2 line-clamp-2 text-xs leading-5 text-slate/55">{entry.description}</p></div></Link>)}</div>:<p className="mt-8 rounded-2xl border border-dashed border-stone/30 p-7 text-stone">{empty}</p>}</div></section>;
}
