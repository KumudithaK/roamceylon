import {brand} from "@/lib/brand";
import {cn} from "@/lib/utils";

export function BrandWordmark({className,inverse=false,showTagline=true}:{className?:string;inverse?:boolean;showTagline?:boolean}){
  // Temporary typographic lockup, not an approximation of the approved artwork.
  return <span className={cn("inline-flex max-w-full flex-col items-start text-left",inverse?"text-ivory":"text-forest",className)}>
    <span className="-translate-x-[1.5px] self-start font-serif text-xs font-medium leading-5 tracking-[.28em]">THE</span>
    <span className="self-start font-serif text-xl font-medium leading-tight tracking-[.035em] sm:text-2xl">CEYLON EDITION</span>
    {showTagline?<span className={cn("mt-3 max-w-72 text-sm leading-6",inverse?"text-ivory/85":"text-muted")}>{brand.tagline}</span>:null}
  </span>;
}
