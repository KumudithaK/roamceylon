import type {Destination} from "@/lib/types";

const island="M129 22 143 42 136 55 154 68 165 87 178 111 187 139 199 169 208 202 214 239 209 276 198 311 180 339 157 359 130 373 105 379 82 371 64 351 54 323 49 288 43 249 40 211 44 173 55 140 67 111 72 86 68 66 79 45 96 31 112 27Z";
const point=(destination:Destination)=>({x:48+(Number(destination.longitude)-79.5)/2.5*164,y:365-(Number(destination.latitude)-5.7)/4.1*330});

export function HeroRouteDemo({destinations}:{destinations:Destination[]}){
  const route=destinations.filter(item=>item.latitude!==null&&item.longitude!==null).slice(0,3);
  const points=route.map(point);
  const path=points.map((item,index)=>`${index?"L":"M"} ${item.x.toFixed(1)} ${item.y.toFixed(1)}`).join(" ");
  return <aside className="hidden w-[310px] shrink-0 rounded-[2rem] border border-white/25 bg-slate/20 p-6 backdrop-blur-md xl:block"><p className="text-xs font-bold uppercase tracking-[.18em] text-gold-light">Your route, live</p><svg viewBox="0 0 260 410" className="mt-4 w-full" role="img" aria-label="Sample Sri Lanka journey route"><path d={island} fill="rgba(255,255,255,.03)" stroke="rgba(255,255,255,.55)" strokeWidth="2"/>{path&&<path d={path} fill="none" stroke="#F2C368" strokeWidth="3" strokeDasharray="9 9" className="animate-[route-dash_12s_linear_infinite]"/>}{points.map((item,index)=><g key={route[index].id}><circle cx={item.x} cy={item.y} r="8" fill="#F2C368"/><circle cx={item.x} cy={item.y} r="15" fill="none" stroke="rgba(242,195,104,.35)"/></g>)}</svg><p className="mt-2 text-xs leading-5 text-white/60">{route.length?route.map(item=>item.name).join(" → "):"Choose destinations to draw your route."}</p></aside>;
}
