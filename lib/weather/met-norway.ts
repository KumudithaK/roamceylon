export type DestinationWeatherDay={date:string;label:string;minimum:number;maximum:number;precipitationProbability:number|null;symbol:string;condition:string};
export type DestinationForecast={temperature:number;humidity:number|null;windSpeed:number|null;symbol:string;condition:string;updatedAt:string;days:DestinationWeatherDay[]};

type ForecastEntry={
  time?:string;
  data?:{
    instant?:{details?:{air_temperature?:number;relative_humidity?:number;wind_speed?:number}};
    next_1_hours?:{summary?:{symbol_code?:string};details?:{probability_of_precipitation?:number}};
    next_6_hours?:{summary?:{symbol_code?:string};details?:{probability_of_precipitation?:number}};
  };
};

const colomboDate=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Colombo",year:"numeric",month:"2-digit",day:"2-digit"});
const colomboHour=new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Colombo",hour:"2-digit",hour12:false});
const weekday=new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Colombo",weekday:"short"});

const number=(value:unknown)=>typeof value==="number"&&Number.isFinite(value)?value:null;
const symbolOf=(entry:ForecastEntry)=>entry.data?.next_1_hours?.summary?.symbol_code||entry.data?.next_6_hours?.summary?.symbol_code||"cloudy";
const rainChance=(entry:ForecastEntry)=>number(entry.data?.next_1_hours?.details?.probability_of_precipitation)??number(entry.data?.next_6_hours?.details?.probability_of_precipitation);

export function describeWeatherSymbol(symbol:string){
  if(symbol.includes("thunder"))return "Thunderstorms";
  if(symbol.includes("heavyrain"))return "Heavy rain";
  if(symbol.includes("rainshowers"))return "Rain showers";
  if(symbol.includes("rain"))return "Rain";
  if(symbol.includes("fog"))return "Misty";
  if(symbol.includes("partlycloudy"))return "Partly cloudy";
  if(symbol.includes("clearsky"))return "Clear";
  if(symbol.includes("fair"))return "Fair";
  return "Cloudy";
}

export function parseMetForecast(payload:unknown,now=new Date()):DestinationForecast|null{
  const timeseries=(payload as {properties?:{timeseries?:ForecastEntry[]}})?.properties?.timeseries;
  if(!Array.isArray(timeseries)||!timeseries.length)return null;
  const current=timeseries.find(entry=>number(entry.data?.instant?.details?.air_temperature)!==null);
  const temperature=number(current?.data?.instant?.details?.air_temperature);
  if(!current||temperature===null)return null;
  const today=colomboDate.format(now);
  const tomorrow=colomboDate.format(new Date(now.getTime()+86_400_000));
  const groups=new Map<string,{temperatures:number[];rain:number[];symbol:string;symbolDistance:number;date:Date}>();
  for(const entry of timeseries){
    if(!entry.time)continue;
    const date=new Date(entry.time);
    const value=number(entry.data?.instant?.details?.air_temperature);
    if(Number.isNaN(date.getTime())||value===null)continue;
    const key=colomboDate.format(date);
    const hour=Number(colomboHour.format(date));
    const group=groups.get(key)??{temperatures:[],rain:[],symbol:symbolOf(entry),symbolDistance:24,date};
    group.temperatures.push(value);
    const probability=rainChance(entry);
    if(probability!==null)group.rain.push(probability);
    const distance=Math.abs(hour-12);
    if(distance<group.symbolDistance){group.symbol=symbolOf(entry);group.symbolDistance=distance;}
    groups.set(key,group);
  }
  const days=[...groups.entries()].slice(0,7).map(([date,group])=>({
    date,
    label:date===today?"Today":date===tomorrow?"Tomorrow":weekday.format(group.date),
    minimum:Math.round(Math.min(...group.temperatures)),
    maximum:Math.round(Math.max(...group.temperatures)),
    precipitationProbability:group.rain.length?Math.round(Math.max(...group.rain)):null,
    symbol:group.symbol,
    condition:describeWeatherSymbol(group.symbol)
  }));
  const symbol=symbolOf(current);
  return {
    temperature:Math.round(temperature),
    humidity:number(current.data?.instant?.details?.relative_humidity)===null?null:Math.round(number(current.data?.instant?.details?.relative_humidity)!),
    windSpeed:number(current.data?.instant?.details?.wind_speed)===null?null:Math.round(number(current.data?.instant?.details?.wind_speed)!*3.6),
    symbol,
    condition:describeWeatherSymbol(symbol),
    updatedAt:current.time||now.toISOString(),
    days
  };
}

export async function getDestinationForecast(latitude:number,longitude:number){
  try{
    const url=new URL("https://api.met.no/weatherapi/locationforecast/2.0/compact");
    url.searchParams.set("lat",latitude.toFixed(4));
    url.searchParams.set("lon",longitude.toFixed(4));
    const response=await fetch(url,{headers:{"User-Agent":"TheCeylonEdition/2.0 (+https://theceylonedition.com)"},next:{revalidate:1800},signal:AbortSignal.timeout(5000)});
    if(!response.ok)return null;
    return parseMetForecast(await response.json());
  }catch{return null;}
}
