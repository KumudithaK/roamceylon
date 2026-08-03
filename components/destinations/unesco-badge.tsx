import {Star} from "lucide-react";
import {cn} from "@/lib/utils";

export function UnescoBadge({className,dark=false}:{className?:string;dark?:boolean}){
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[.6rem] font-bold uppercase tracking-[.13em] shadow-sm backdrop-blur",dark?"border-gold-light/45 bg-slate/70 text-gold-light":"border-gold/35 bg-ivory/95 text-forest",className)}><Star className="size-3 fill-current" aria-hidden="true"/>UNESCO World Heritage</span>;
}
