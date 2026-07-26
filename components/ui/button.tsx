import {Slot} from "@radix-ui/react-slot";
import {cva,type VariantProps} from "class-variance-authority";
import type {ButtonHTMLAttributes} from "react";
import {cn} from "@/lib/utils";

const buttonVariants=cva("inline-flex items-center justify-center gap-2 rounded-full text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:pointer-events-none disabled:opacity-50",{
  variants:{variant:{primary:"bg-forest px-6 py-3 text-ivory hover:bg-emerald",accent:"bg-gold px-6 py-3 text-slate hover:bg-gold-light",outline:"border border-stone/50 bg-ivory/5 px-6 py-3 hover:bg-sand/60",ghost:"px-4 py-2 hover:bg-sand/60"},size:{default:"min-h-11",sm:"min-h-9 text-xs",lg:"min-h-13 px-8"}},
  defaultVariants:{variant:"primary",size:"default"}
});
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>,VariantProps<typeof buttonVariants>{asChild?:boolean}
export function Button({asChild,className,variant,size,...props}:ButtonProps){const Comp=asChild?Slot:"button";return <Comp className={cn(buttonVariants({variant,size}),className)} {...props}/>;}
