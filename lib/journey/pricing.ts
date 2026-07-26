import type {JourneyExperience,JourneyGuide,JourneyPricingSettings,JourneyStay,JourneyVehicle,PricingSeason} from "@/lib/types";

export type PriceLine={label:string;amount:number|null;reason?:string};
export type TripPrice={currency:string;durationDays:number;nights:number;lines:PriceLine[];subtotal:number;knownTotal:number;complete:boolean;seasonLabel:string;seasonMultiplier:number;estimateFactor:number};

export const getDurationDays=(start:string,end:string,fallbackDays=1)=>{
  if(!start||!end)return Math.max(1,fallbackDays);
  const startTime=new Date(`${start}T00:00:00Z`).getTime();
  const endTime=new Date(`${end}T00:00:00Z`).getTime();
  if(!Number.isFinite(startTime)||!Number.isFinite(endTime)||endTime<=startTime)return Math.max(1,fallbackDays);
  return Math.ceil((endTime-startTime)/86_400_000);
};

const seasonFor=(settings:JourneyPricingSettings|null,startDate:string,currentMonth:number):PricingSeason|null=>{
  if(!settings)return null;
  const selectedMonth=Number(startDate.split("-")[1])||currentMonth;
  return Object.values(settings.seasons).find(season=>season.months.includes(selectedMonth))??null;
};

export function calculateTripPrice({
  settings,experiences,stays,vehicle,guide,travellers,durationDays,distanceKm,destinationCount,startDate,currentMonth=new Date().getMonth()+1
}:{
  settings:JourneyPricingSettings|null;
  experiences:JourneyExperience[];
  stays:JourneyStay[];
  vehicle:JourneyVehicle|null;
  guide:JourneyGuide|null;
  travellers:number;
  durationDays:number;
  distanceKm:number;
  destinationCount:number;
  startDate:string;
  currentMonth?:number;
}):TripPrice{
  const nights=Math.max(0,durationDays-1);
  const activityRate=settings?.activityPerGuestUsd??null;
  const experienceAmount=experiences.length?experiences.reduce<number|null>((total,item)=>{
    const rate=item.price_per_person_usd??activityRate;
    return total===null||rate===null?null:total+rate*travellers;
  },0):0;
  const nightlyCosts=stays.map(stay=>{
    if(stay.nightly_rate_usd!==null)return stay.nightly_rate_usd;
    const tier=stay.pricing_tier?settings?.accommodationTiers[stay.pricing_tier]:null;
    return tier?tier.nightlyPerGuest*travellers:null;
  });
  const stayAmount=nightlyCosts.length&&nightlyCosts.every((value):value is number=>value!==null)
    ?nights*nightlyCosts.reduce((total,value)=>total+value,0)/nightlyCosts.length
    :nightlyCosts.length?null:0;
  const transportDays=Math.max(durationDays,destinationCount);
  const vehicleAmount=vehicle
    ?vehicle.daily_rate_usd===null||vehicle.per_km_rate_usd===null
      ?null
      :vehicle.daily_rate_usd*transportDays+vehicle.per_km_rate_usd*distanceKm
    :0;
  const guideRate=guide?.daily_rate_usd??settings?.guideDefaultDailyRateUsd??null;
  const guideAmount=guide?guideRate===null?null:guideRate*durationDays:0;
  const lines:PriceLine[]=[
    {label:"Experiences",amount:experienceAmount,reason:experienceAmount===null?"Activity pricing is not configured":undefined},
    {label:"Accommodation",amount:stayAmount,reason:stayAmount===null?"Selected accommodation requires a quote":undefined},
    {label:"Vehicle",amount:vehicleAmount,reason:vehicleAmount===null?"Selected vehicle requires day and distance rates":undefined},
    {label:"Guide",amount:guideAmount,reason:guideAmount===null?"Selected guide requires a daily rate":undefined}
  ];
  const season=seasonFor(settings,startDate,currentMonth);
  const subtotal=lines.reduce((total,line)=>total+(line.amount??0),0);
  const seasonMultiplier=season?.multiplier??1;
  const estimateFactor=settings?.estimateFactor??1;
  const knownTotal=subtotal*seasonMultiplier*estimateFactor;
  return {currency:settings?.currency??"USD",durationDays,nights,lines,subtotal,knownTotal,complete:Boolean(settings)&&lines.every(line=>line.amount!==null),seasonLabel:season?.label??(settings?"Season unavailable":"Pricing configuration unavailable"),seasonMultiplier,estimateFactor};
}
