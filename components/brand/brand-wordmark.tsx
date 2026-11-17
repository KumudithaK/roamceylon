import {Text} from "@/components/i18n/text";
import {brand} from "@/lib/brand";
import {cn} from "@/lib/utils";

export function BrandWordmark({className,inverse=false,showTagline=true}:{className?:string;inverse?:boolean;showTagline?:boolean}){
  return <span className={cn("inline-flex max-w-full flex-col items-start text-left",inverse?"text-ivory":"text-forest",className)}>
    <span className="font-sans text-xl font-semibold leading-tight tracking-[.1em] sm:text-2xl">{brand.name}</span>
    {showTagline?<span className={cn("mt-3 max-w-72 text-sm leading-6",inverse?"text-ivory/85":"text-muted")}><Text>{brand.tagline}</Text></span>:null}
  </span>;
}
