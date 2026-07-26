import type {JourneyExperience,JourneyGuide,JourneyStay,JourneyVehicle} from "@/lib/types";

export type PriceLine={label:string;amount:number|null;reason?:string};
export type TripPrice={currency:"USD";durationDays:number;nights:number;lines:PriceLine[];knownTotal:number;complete:boolean};

export const getDurationDays=(start:string,end:string,fallbackDays=1)=>{
  if(!start||!end)return Math.max(1,fallbackDays);
  const startTime=new Date(`${start}T00:00:00Z`).getTime();
  const endTime=new Date(`${end}T00:00:00Z`).getTime();
  if(!Number.isFinite(startTime)||!Number.isFinite(endTime)||endTime<=startTime)return Math.max(1,fallbackDays);
  return Math.ceil((endTime-startTime)/86_400_000);
};

export function calculateTripPrice({
  experiences,stays,vehicle,guide,travellers,durationDays
}:{
  experiences:JourneyExperience[];
  stays:JourneyStay[];
  vehicle:JourneyVehicle|null;
  guide:JourneyGuide|null;
  travellers:number;
  durationDays:number;
}):TripPrice{
  const nights=Math.max(0,durationDays-1);
  const experienceKnown=experiences.every(item=>item.price_per_person_usd!==null);
  const stayKnown=stays.every(item=>item.nightly_rate_usd!==null);
  const experienceAmount=experienceKnown?experiences.reduce((total,item)=>total+(item.price_per_person_usd??0)*travellers,0):null;
  const stayAmount=stayKnown&&stays.length?nights*stays.reduce((total,item)=>total+(item.nightly_rate_usd??0),0)/stays.length:stays.length?null:0;
  const vehicleAmount=vehicle?vehicle.daily_rate_usd===null?null:vehicle.daily_rate_usd*durationDays:0;
  const guideAmount=guide?guide.daily_rate_usd===null?null:guide.daily_rate_usd*durationDays:0;
  const lines:PriceLine[]=[
    {label:"Experiences",amount:experienceAmount,reason:experienceKnown?undefined:"One or more experiences require a quote"},
    {label:"Accommodation",amount:stayAmount,reason:stayKnown?undefined:"One or more stays require a quote"},
    {label:"Vehicle",amount:vehicleAmount,reason:vehicle&&vehicleAmount===null?"Selected vehicle requires a quote":undefined},
    {label:"Guide",amount:guideAmount,reason:guide&&guideAmount===null?"Selected guide requires a quote":undefined}
  ];
  return {currency:"USD",durationDays,nights,lines,knownTotal:lines.reduce((total,line)=>total+(line.amount??0),0),complete:lines.every(line=>line.amount!==null)};
}
