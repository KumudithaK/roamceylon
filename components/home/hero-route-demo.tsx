import type {Destination} from "@/lib/types";

const island="M198.4 270.3 190.6 314.7 175.7 335.1 145.2 356.3 121.7 364.6 103 374.8 88.9 376.7 73.2 371.1 53.7 346.2 47.4 316.5 39.6 282.3 36.4 262 34.1 224 27.8 176.9 38 145.4 47.4 117.7 45.8 104.7 55.2 90.9 59.9 76.1 56 61.2 63 47.4 73.2 38.1 67 24.2 63 17.8 78.7 24.2 94.3 42.7 86.5 52 106.1 61.2 120.2 79.7 133.5 102.9 145.2 126 157 149.1 164.8 176.9 172.6 190.7 184.3 213.9 190.6 237Z";
const point=(destination:Destination)=>({x:32+((Number(destination.longitude)-79.6)/2.4)*166,y:376-((Number(destination.latitude)-5.8)/4.2)*344});

export function HeroRouteDemo({destinations}:{destinations:Destination[]}){
  const valid=destinations.filter(item=>Number.isFinite(item.latitude)&&Number.isFinite(item.longitude));
  const route=valid.filter(item=>["colombo","sigiriya","trincomalee"].some(slug=>item.slug===slug||item.slug.startsWith(`${slug}-`)));
  const selected=(route.length>=3?route:valid.slice(0,3)).slice(0,3);
  const points=selected.map(point);
  const routePoints=points.map(item=>`${item.x.toFixed(1)},${item.y.toFixed(1)}`).join(" ");
  return <aside className="hidden w-[310px] shrink-0 rounded-[2rem] border border-white/25 bg-slate/25 p-6 backdrop-blur-md xl:block"><p className="text-xs font-bold uppercase tracking-[.18em] text-gold-light">Your route, live</p><svg viewBox="0 0 220 400" className="mx-auto mt-4 h-[400px] max-w-full" role="img" aria-label="Sample Sri Lanka journey route"><path d={island} fill="rgba(255,255,255,.04)" stroke="rgba(255,255,255,.58)" strokeWidth="1.7"/>{routePoints&&<polyline points={routePoints} fill="none" stroke="#F2C368" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="9 8" className="animate-[route-dash_12s_linear_infinite]"/>}{valid.map(item=>{const marker=point(item),order=selected.findIndex(selectedItem=>selectedItem.id===item.id),isSelected=order>=0;return <g key={item.id}><circle cx={marker.x} cy={marker.y} r={isSelected?7:4.5} fill={isSelected?"#F2C368":"#fffdf8"} stroke="#123d33" strokeWidth="2"/>{isSelected&&<text x={marker.x} y={marker.y+2.5} textAnchor="middle" fontSize="7" fontWeight="700" fill="#123d33">{order+1}</text>}</g>})}</svg><p className="mt-2 text-xs leading-5 text-white/60">{selected.length?selected.map(item=>item.name).join(" → "):"Choose destinations to draw your route."}</p></aside>;
}
