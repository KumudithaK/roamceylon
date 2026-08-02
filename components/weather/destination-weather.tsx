import Link from "next/link";
import {Cloud,CloudLightning,CloudRain,CloudSun,Droplets,Sun,Wind} from "lucide-react";
import {getDestinationForecast} from "@/lib/weather/met-norway";

type WeatherProps={name:string;latitude:number|null;longitude:number|null;climate:string|null};

function WeatherIcon({symbol,className="size-8"}:{symbol:string;className?:string}){
  if(symbol.includes("thunder"))return <CloudLightning className={className}/>;
  if(symbol.includes("rain"))return <CloudRain className={className}/>;
  if(symbol.includes("clearsky")||symbol.includes("fair"))return <Sun className={className}/>;
  if(symbol.includes("partlycloudy"))return <CloudSun className={className}/>;
  return <Cloud className={className}/>;
}

export async function DestinationWeather({name,latitude,longitude,climate}:WeatherProps){
  const located=Number.isFinite(latitude)&&Number.isFinite(longitude);
  const forecast=located?await getDestinationForecast(latitude!,longitude!):null;
  if(!forecast&&!climate)return null;
  return <article className="overflow-hidden rounded-3xl bg-forest p-7 text-ivory">
    <div className="flex items-start justify-between gap-5"><div><p className="eyebrow text-gold-light">Weather in {name}</p>{forecast?<><div className="mt-4 flex items-end gap-3"><strong className="font-serif text-5xl font-normal">{forecast.temperature}°</strong><span className="pb-1 text-sm text-ivory/65">{forecast.condition}</span></div><div className="mt-4 flex flex-wrap gap-4 text-xs text-ivory/60">{forecast.humidity!==null?<span className="flex items-center gap-1.5"><Droplets className="size-4 text-gold-light"/>{forecast.humidity}% humidity</span>:null}{forecast.windSpeed!==null?<span className="flex items-center gap-1.5"><Wind className="size-4 text-gold-light"/>{forecast.windSpeed} km/h wind</span>:null}</div></>:<p className="mt-4 text-sm text-ivory/60">Live conditions are temporarily unavailable.</p>}</div>{forecast?<WeatherIcon symbol={forecast.symbol} className="size-11 text-gold-light"/>:<CloudSun className="size-11 text-gold-light"/>}</div>
    {forecast?.days.length?<div className="mt-6 grid grid-cols-3 gap-2 border-t border-white/10 pt-5">{forecast.days.map(day=><div key={day.date} className="rounded-xl bg-white/5 p-3 text-center"><span className="text-[.65rem] font-bold uppercase tracking-wide text-ivory/55">{day.label}</span><WeatherIcon symbol={day.symbol} className="mx-auto mt-2 size-5 text-gold-light"/><strong className="mt-2 block text-sm">{day.maximum}° <span className="font-normal text-ivory/45">{day.minimum}°</span></strong>{day.precipitationProbability!==null?<span className="mt-1 block text-[.65rem] text-ivory/45">{day.precipitationProbability}% rain</span>:null}</div>)}</div>:null}
    {climate?<div className="mt-5 border-t border-white/10 pt-5"><p className="text-xs font-bold uppercase tracking-widest text-gold-light">Typical climate</p><p className="mt-3 text-sm leading-6 text-ivory/65">{climate}</p></div>:null}
    {forecast?<p className="mt-5 text-[.62rem] text-ivory/35">Model forecast · <Link href="https://api.met.no/" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-ivory/60">MET Norway</Link> · Updated every 30 minutes</p>:null}
  </article>;
}
