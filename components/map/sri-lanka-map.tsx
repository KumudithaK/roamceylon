"use client";

import Link from "next/link";
import {ArrowRight,MapPin} from "lucide-react";
import {motion} from "motion/react";
import {cn} from "@/lib/utils";
import {getRouteEstimate,type LocatedRouteDestination} from "@/lib/journey/route";
import {endpointRouteLocation,type JourneyEndpoint} from "@/lib/journey/journey-endpoints";

type Marker={id:string;slug:string;name:string;latitude:number|null;longitude:number|null};
type DestinationContext={id:string;name:string;province:string|null;region:string|null};
type NearbyDestination=LocatedRouteDestination&{estimatedDistance:number};
type MapProps={
  destinations:Marker[];
  selectedIds?:string[];
  onSelect?:(id:string)=>void;
  className?:string;
  mode?:"journey"|"destination";
  destination?:DestinationContext;
  nearbyDestinations?:NearbyDestination[];
  journeyHref?:string;
  pickup?:JourneyEndpoint;
  dropoff?:JourneyEndpoint;
};

const point=(lat:number,lon:number)=>({x:32+((lon-79.6)/2.4)*166,y:376-((lat-5.8)/4.2)*344});

export function SriLankaMap({destinations,selectedIds=[],onSelect,className,mode="journey",destination,nearbyDestinations=[],journeyHref="/journey-builder",pickup,dropoff}:MapProps){
  const endpointStops=[...(pickup?.type?[endpointRouteLocation(pickup,"pickup",destinations)]:[]),...(dropoff?.type?[endpointRouteLocation(dropoff,"dropoff",destinations)]:[])];
  const mapDestinations=[...destinations,...endpointStops];
  const routeIds=[...(pickup?.type?["__pickup__"]:[]),...selectedIds,...(dropoff?.type?["__dropoff__"]:[])];
  const valid=mapDestinations.filter((item):item is LocatedRouteDestination=>Number.isFinite(item.latitude)&&Number.isFinite(item.longitude));
  const {route,estimatedDistance,estimatedTravelDays}=getRouteEstimate(mapDestinations,routeIds);
  const routePoints=route.map(item=>{const value=point(item.latitude,item.longitude);return `${value.x},${value.y}`}).join(" ");
  const destinationMode=mode==="destination"&&Boolean(destination);
  const currentLocated=destination?valid.some(item=>item.id===destination.id):false;
  const mapLabel=destinationMode?`Map showing ${destination?.name} and nearby Sri Lankan destinations`:`Map showing the complete journey with ${route.length} located stops`;

  return <section id={destinationMode?"destination-location":undefined} className={cn("grid overflow-hidden rounded-[2rem] bg-forest text-ivory md:grid-cols-[1fr_.75fr]",className)} aria-label={destinationMode?`${destination?.name} location map`:"Sri Lanka destinations map"}>
    <div className="relative min-h-[520px] p-8"><svg viewBox="0 0 220 400" role="img" aria-label={mapLabel} className="mx-auto h-[480px] max-w-full"><path d="M198.4 270.3 190.6 314.7 175.7 335.1 145.2 356.3 121.7 364.6 103 374.8 88.9 376.7 73.2 371.1 53.7 346.2 47.4 316.5 39.6 282.3 36.4 262 34.1 224 27.8 176.9 38 145.4 47.4 117.7 45.8 104.7 55.2 90.9 59.9 76.1 56 61.2 63 47.4 73.2 38.1 67 24.2 63 17.8 78.7 24.2 94.3 42.7 86.5 52 106.1 61.2 120.2 79.7 133.5 102.9 145.2 126 157 149.1 164.8 176.9 172.6 190.7 184.3 213.9 190.6 237Z" fill="rgba(255,253,248,.07)" stroke="rgba(255,253,248,.4)" strokeWidth="1.5"/>{!destinationMode&&route.length>1&&<motion.polyline key={routePoints} points={routePoints} fill="none" stroke="#d7ad65" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" initial={{pathLength:0,opacity:0}} animate={{pathLength:1,opacity:1}} transition={{duration:1.2,ease:"easeInOut"}}/>}{valid.map(item=>{const {x,y}=point(item.latitude,item.longitude);const selected=routeIds.includes(item.id);const endpoint=item.id==="__pickup__"||item.id==="__dropoff__";return <g key={item.id} transform={`translate(${x} ${y})`}><motion.circle initial={{scale:.7}} animate={{scale:selected?1.18:1}} r={selected?7:5} fill={selected?"#d7ad65":"#fffdf8"} stroke="#123d33" strokeWidth="2"/>{selected&&!destinationMode&&<text y="2.5" textAnchor="middle" fontSize="7" fontWeight="700" fill="#123d33">{endpoint?(item.id==="__pickup__"?"P":"D"):selectedIds.indexOf(item.id)+1}</text>}<title>{item.name}</title></g>})}</svg>{destinationMode&&destination&&currentLocated&&<div className="pointer-events-none absolute bottom-7 left-7 rounded-full bg-ivory/10 px-4 py-2 text-xs text-ivory/70 backdrop-blur"><span className="mr-2 inline-block size-2 rounded-full bg-gold"/>{destination.name} is highlighted</div>}</div>
    {destinationMode&&destination
      ?<DestinationPanel destination={destination} nearby={nearbyDestinations} journeyHref={journeyHref} currentLocated={currentLocated}/>
      :<JourneyPanel valid={valid.filter(item=>!item.id.startsWith("__"))} routeLength={route.length} selectedIds={selectedIds} onSelect={onSelect} estimatedDistance={estimatedDistance} estimatedTravelDays={estimatedTravelDays}/>
    }
  </section>;
}

function DestinationPanel({destination,nearby,journeyHref,currentLocated}:{destination:DestinationContext;nearby:NearbyDestination[];journeyHref:string;currentLocated:boolean}){
  const location=destination.province||destination.region||"Sri Lanka";
  return <div className="bg-white/5 p-8"><p className="eyebrow mb-3 text-gold-light">On the island</p><h2 className="font-serif text-3xl">Where is {destination.name}?</h2><p className="mt-3 flex items-center gap-2 text-sm leading-6 text-ivory/60"><MapPin className="size-4 shrink-0 text-gold-light"/>{location}{currentLocated?" · highlighted in gold":" · map position awaiting review"}</p><Link href={journeyHref} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gold px-5 py-3 text-sm font-bold text-slate transition hover:bg-gold-light">Add {destination.name} to my journey<ArrowRight className="size-4"/></Link><div className="mt-8 border-t border-white/10 pt-6"><p className="text-[.65rem] font-bold uppercase tracking-widest text-gold-light">Nearby places</p><div className="mt-4 grid gap-2">{nearby.length?nearby.map(item=><Link key={item.id} href={`/destinations/${item.slug}`} className="group flex items-center justify-between gap-4 rounded-xl bg-white/5 px-4 py-3 text-sm transition hover:bg-white/10"><span>{item.name}</span><span className="whitespace-nowrap text-xs text-ivory/45 group-hover:text-ivory/65">Approx. {item.estimatedDistance} km</span></Link>):<p className="rounded-xl bg-white/5 p-4 text-sm leading-6 text-ivory/50">Nearby destination coordinates are not available yet.</p>}</div></div></div>;
}

function JourneyPanel({valid,routeLength,selectedIds,onSelect,estimatedDistance,estimatedTravelDays}:{valid:LocatedRouteDestination[];routeLength:number;selectedIds:string[];onSelect?:((id:string)=>void);estimatedDistance:number;estimatedTravelDays:number}){
  return <div className="bg-white/5 p-8"><p className="eyebrow mb-3 text-gold-light">{routeLength?"Your route":"Across the island"}</p><h2 className="font-serif text-3xl">{routeLength?"Journey map":"Choose a place on the map."}</h2>{routeLength>0&&<div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl bg-white/5 p-3"><span className="block text-xs text-ivory/50">Distance</span><strong>{estimatedDistance} km</strong></div><div className="rounded-xl bg-white/5 p-3"><span className="block text-xs text-ivory/50">Travel days</span><strong>{estimatedTravelDays||"—"}</strong></div></div>}<div className="mt-6 grid max-h-[300px] gap-2 overflow-auto pr-2">{valid.map(item=>onSelect?<button key={item.id} onClick={()=>onSelect(item.id)} className={cn("focus-ring rounded-xl px-4 py-3 text-left text-sm",selectedIds.includes(item.id)?"bg-gold text-slate":"bg-white/5 hover:bg-white/10")}>{selectedIds.includes(item.id)&&`${selectedIds.indexOf(item.id)+1}. `}{item.name}</button>:<Link key={item.id} href={`/destinations/${item.slug}`} className="focus-ring rounded-xl bg-white/5 px-4 py-3 text-sm hover:bg-white/10">{item.name}</Link>)}</div>{!valid.length&&<p className="mt-6 text-sm text-ivory/55">Destination coordinates are unavailable. Add reviewed coordinates in Supabase to enable the route.</p>}</div>;
}
