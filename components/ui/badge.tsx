import type {HTMLAttributes} from "react";
import {cn} from "@/lib/utils";
export function Badge({className,...props}:HTMLAttributes<HTMLSpanElement>){return <span className={cn("inline-flex rounded-sm border border-divider bg-ivory px-3 py-1 text-xs font-semibold leading-5 tracking-wide text-forest",className)} {...props}/>;}
