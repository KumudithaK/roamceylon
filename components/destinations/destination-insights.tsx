import Image from "next/image";
import Link from "next/link";
import {ArrowUpRight,Binoculars,CalendarCheck,Camera,Compass,Landmark,Luggage,MapPin,PawPrint,Sun,Waves} from "lucide-react";
import {getNearbyDestinations} from "@/lib/journey/route";
import type {Destination,JourneyDestination} from "@/lib/types";

type IconComponent=typeof Sun;

const normalise=(value:string)=>value.toLowerCase().replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim();

function essentialIcon(value:string):IconComponent{
  const text=normalise(value);
  if(/swim|sea|ocean|current|beach/.test(text))return Waves;
  if(/sun|heat|hot|rain|weather/.test(text))return Sun;
  if(/reserve|advance|book|plan/.test(text))return CalendarCheck;
  if(/wildlife|turtle|animal/.test(text))return PawPrint;
  if(/sacred|temple|dress|shoulder|knee|worship/.test(text))return Landmark;
  if(/photo|voice|permission|prayer/.test(text))return Camera;
  if(/guide|route|explor/.test(text))return Compass;
  return Luggage;
}

function matchedDestination(value:string,destinations:Destination[]){
  const text=normalise(value);
  return destinations
    .filter(destination=>text===normalise(destination.name)||text.startsWith(`${normalise(destination.name)} `))
    .sort((a,b)=>b.name.length-a.name.length)[0]||null;
}

export function DestinationInsights({item,destinations}:{item:JourneyDestination;destinations:Destination[]}){
  const distances=new Map(getNearbyDestinations(destinations,item.id,destinations.length).map(destination=>[destination.id,destination.estimatedDistance]));
  const hasContent=item.local_highlights.length||item.nearby_attractions.length||item.travel_tips.length;
  if(!hasContent)return null;

  return <div id="destination-insights" className="mt-20 scroll-mt-28 border-t border-stone/20 pt-16">
    <header className="max-w-3xl">
      <p className="eyebrow">Destination insights</p>
      <h2 className="heading mt-4">Discover more about {item.name}</h2>
      <p className="mt-5 max-w-2xl text-base leading-7 text-slate/60">Local character, places worth a detour and thoughtful details for a more rewarding stay.</p>
    </header>

    <div className="mt-12 grid items-start gap-10 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,.65fr)]">
      {item.local_highlights.length?<section aria-labelledby="local-highlights-heading">
        <div className="flex items-end justify-between gap-5"><div><p className="eyebrow">The character of {item.name}</p><h3 id="local-highlights-heading" className="mt-3 font-serif text-3xl">Local highlights</h3></div><Binoculars className="hidden size-7 text-gold md:block" aria-hidden="true"/></div>
        <ol className="mt-7 grid overflow-hidden rounded-[1.75rem] border border-stone/15 bg-white shadow-sm sm:grid-cols-2">
          {item.local_highlights.map((highlight,index)=>{
            const lastOdd=item.local_highlights.length%2===1&&index===item.local_highlights.length-1;
            const finalRow=lastOdd||(item.local_highlights.length%2===0&&index>=item.local_highlights.length-2);
            return <li key={highlight} className={`group flex min-h-32 gap-5 border-b border-stone/15 px-6 py-7 transition duration-300 last:border-b-0 hover:bg-gold/[.055] ${index%2===0&&!lastOdd?"sm:border-r":""} ${lastOdd?"sm:col-span-2":""} ${finalRow?"sm:border-b-0":""}`}>
              <span className="font-serif text-2xl text-gold/55 transition group-hover:text-gold" aria-hidden="true">{String(index+1).padStart(2,"0")}</span>
              <h4 className="max-w-xl font-serif text-xl leading-snug text-slate">{highlight}</h4>
            </li>;
          })}
        </ol>
      </section>:null}

      {item.nearby_attractions.length?<section aria-labelledby="nearby-attractions-heading" className="rounded-[2rem] bg-forest p-6 text-ivory md:p-8">
        <p className="eyebrow text-gold-light">Extend the journey</p>
        <h3 id="nearby-attractions-heading" className="mt-3 font-serif text-3xl">Nearby attractions</h3>
        <div className="mt-7 grid gap-3">{item.nearby_attractions.map(attraction=>{
          const destination=matchedDestination(attraction,destinations);
          const distance=destination?distances.get(destination.id):null;
          const content=<><div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-white/10">{destination?.hero_image_url?<Image src={destination.hero_image_url} alt="" fill sizes="64px" className="object-cover transition duration-500 group-hover:scale-105"/>:<MapPin className="absolute inset-0 m-auto size-5 text-gold-light" aria-hidden="true"/>}</div><div className="min-w-0 flex-1"><h4 className="font-serif text-lg leading-snug">{attraction}</h4>{distance!==null&&distance!==undefined?<p className="mt-1 text-xs text-ivory/50">Approximately {distance} km away</p>:null}</div>{destination?<ArrowUpRight className="size-5 shrink-0 text-gold-light transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true"/>:null}</>;
          return destination?<Link key={attraction} href={`/destinations/${destination.slug}`} className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[.06] p-3 transition duration-300 hover:border-gold-light/35 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-light">{content}<span className="sr-only">Explore {destination.name}</span></Link>:<article key={attraction} className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[.06] p-3">{content}</article>;
        })}</div>
      </section>:null}
    </div>

    {item.travel_tips.length?<section aria-labelledby="traveller-essentials-heading" className="mt-12 overflow-hidden rounded-[2rem] border border-stone/15 bg-white p-7 shadow-sm md:p-10">
      <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]"><div><p className="eyebrow">Travel well</p><h3 id="traveller-essentials-heading" className="mt-3 font-serif text-3xl">Before you go</h3><p className="mt-4 text-sm leading-6 text-slate/55">A few practical details to help you arrive prepared and travel thoughtfully.</p></div><ul className="grid gap-x-7 gap-y-3 md:grid-cols-2">{item.travel_tips.map(tip=>{const Icon=essentialIcon(tip);return <li key={tip} className="group flex gap-4 rounded-2xl p-3 transition hover:bg-sand-light"><span className="grid size-11 shrink-0 place-items-center rounded-full border border-gold/25 text-gold transition group-hover:bg-gold group-hover:text-white"><Icon className="size-5" aria-hidden="true"/></span><p className="pt-1 text-sm leading-6 text-slate/65">{tip}</p></li>;})}</ul></div>
    </section>:null}
  </div>;
}
