import type {HTMLAttributes} from "react";
import {cn} from "@/lib/utils";
export function Badge({className,...props}:HTMLAttributes<HTMLSpanElement>){return <span className={cn("inline-flex rounded-full border border-stone/30 bg-ivory/85 px-3 py-1 text-[.68rem] font-bold uppercase tracking-[.13em] text-forest backdrop-blur",className)} {...props}/>;}
