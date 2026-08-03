"use client";

import type {JourneyPricingPlan} from "@/lib/types";
import {cn} from "@/lib/utils";

const chargingMethodLabels:Record<string,string>={per_night:"Per night",per_room_night:"Per room / night",per_person:"Per person",per_villa:"Per villa",per_day:"Per day",per_trip:"Per trip",per_airport_transfer:"Per airport transfer",per_km:"Per kilometre",half_day:"Half day",full_day:"Full day",multi_day:"Multi day",private_tour:"Private tour",custom_rate:"Custom rate"};

export function pricingPlanMeta(plans:JourneyPricingPlan[],selectedId?:string){
  if(!plans.length)return "Price confirmed in your package";
  const plan=plans.find(item=>item.id===selectedId)||plans[0];
  return `${plan.name}${plans.length>1?` · ${plans.length} options`:""}`;
}

export function PricingPlanChoices({plans,value,onChange,dark=false}:{plans:JourneyPricingPlan[];value:string;onChange:(id:string)=>void;dark?:boolean}){
  if(!plans.length)return <div className={cn("mt-7 rounded-2xl p-5 text-sm leading-6",dark?"bg-white/8 text-ivory/60":"bg-sand-light text-stone")}>The final rate for this resource will be confirmed personally in your quotation.</div>;
  return <fieldset className="mt-7"><legend className={cn("text-xs font-bold uppercase tracking-[.16em]",dark?"text-gold-light":"text-gold")}>Choose your rate</legend><div className="mt-3 grid gap-3">{plans.map((plan,index)=><label key={plan.id} className={cn("flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition",value===plan.id?dark?"border-gold-light bg-white/10 ring-1 ring-gold-light/20":"border-gold bg-gold/5 ring-1 ring-gold/20":dark?"border-white/15 hover:border-gold-light/40":"border-stone/15 hover:border-gold/40")}><input type="radio" name={`pricing-plan-${plan.entityType}-${plan.entityId}`} value={plan.id} checked={value===plan.id} onChange={()=>onChange(plan.id)} className="mt-1 accent-gold"/><span className="min-w-0"><strong className="block">{plan.name}{index===0&&<span className={cn("ml-2 rounded-full px-2 py-1 text-[.6rem] uppercase tracking-wider",dark?"bg-gold-light/15 text-gold-light":"bg-gold/10 text-gold")}>Primary</span>}</strong><span className={cn("mt-1 block text-xs",dark?"text-ivory/55":"text-stone")}>{chargingMethodLabels[plan.chargingMethod]||plan.chargingMethod.replaceAll("_"," ")}</span>{plan.description&&<span className={cn("mt-2 block text-sm leading-6",dark?"text-ivory/65":"text-slate/60")}>{plan.description}</span>}</span></label>)}</div><p className={cn("mt-3 text-xs",dark?"text-ivory/45":"text-stone")}>Your package estimate updates using the selected supplier plan. Supplier costs remain private.</p></fieldset>;
}
