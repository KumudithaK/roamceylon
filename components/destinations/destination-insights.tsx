import {CalendarCheck,Camera,Compass,Landmark,Luggage,PawPrint,Sun,Waves} from "lucide-react";
import type {JourneyDestination} from "@/lib/types";

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

export function DestinationInsights({item}:{item:JourneyDestination}){
  const hasContent=item.local_highlights.length||item.travel_tips.length;
  if(!hasContent)return null;

  return <div id="destination-insights" className="mt-20 scroll-mt-28 border-t border-stone/20 pt-16">
    <header className="max-w-3xl">
      <p className="eyebrow">Destination insights</p>
      <h2 className="heading mt-4">Discover more about {item.name}</h2>
      <p className="mt-5 max-w-2xl text-base leading-7 text-slate/60">Local character, places worth a detour and thoughtful details for a more rewarding stay.</p>
    </header>

    <div className="mt-12 grid items-stretch gap-8 xl:grid-cols-2">
      {item.local_highlights.length?<section aria-labelledby="local-highlights-heading" className="flex h-full flex-col">
        <div><p className="eyebrow">The character of {item.name}</p><h3 id="local-highlights-heading" className="mt-3 font-serif text-3xl">Local highlights</h3></div>
        <ol className="mt-7 flex flex-1 flex-col overflow-hidden rounded-[1.75rem] border border-stone/15 bg-white shadow-sm">
          {item.local_highlights.map((highlight,index)=><li key={highlight} className="group flex min-h-24 flex-1 gap-4 border-b border-stone/15 px-6 py-5 last:border-b-0 transition hover:bg-gold/[.055]">
            <span className="grid size-11 shrink-0 place-items-center rounded-full border border-gold/25 font-serif text-sm text-gold transition group-hover:bg-gold group-hover:text-white" aria-hidden="true">{String(index+1).padStart(2,"0")}</span>
            <p className="pt-1 text-sm leading-6 text-slate/65">{highlight}</p>
          </li>)}
        </ol>
      </section>:null}

      {item.travel_tips.length?<section aria-labelledby="traveller-essentials-heading" className="flex h-full flex-col">
        <div><p className="eyebrow">Travel well</p><h3 id="traveller-essentials-heading" className="mt-3 font-serif text-3xl">Before you go</h3></div>
        <ul className="mt-7 flex flex-1 flex-col overflow-hidden rounded-[1.75rem] border border-stone/15 bg-white shadow-sm">{item.travel_tips.map(tip=>{const Icon=essentialIcon(tip);return <li key={tip} className="group flex min-h-24 flex-1 gap-4 border-b border-stone/15 px-6 py-5 last:border-b-0 transition hover:bg-gold/[.055]"><span className="grid size-11 shrink-0 place-items-center rounded-full border border-gold/25 text-gold transition group-hover:bg-gold group-hover:text-white"><Icon className="size-5" aria-hidden="true"/></span><p className="pt-1 text-sm leading-6 text-slate/65">{tip}</p></li>;})}</ul>
      </section>:null}
    </div>
  </div>;
}
