import {brand} from "@/lib/brand";
import {cn} from "@/lib/utils";

export function BrandWordmark({className,inverse=false,showTagline=true}:{className?:string;inverse?:boolean;showTagline?:boolean}){
  return <span className={cn("inline-flex flex-col",inverse?"text-ivory":"text-forest",className)}>
    <span className="font-serif text-xl font-semibold tracking-[.12em] sm:text-2xl">{brand.wordmark}</span>
    {showTagline?<span className={cn("mt-1 text-[.52rem] uppercase tracking-[.18em]",inverse?"text-gold-light":"text-gold")}>{brand.tagline}</span>:null}
  </span>;
}
