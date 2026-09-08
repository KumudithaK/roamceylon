import {Slot} from "@radix-ui/react-slot";
import {cva,type VariantProps} from "class-variance-authority";
import type {ButtonHTMLAttributes} from "react";
import {cn} from "@/lib/utils";

const buttonVariants=cva("inline-flex min-w-11 items-center justify-center gap-2 rounded-md text-sm font-semibold leading-5 transition-colors duration-180 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",{
  variants:{variant:{primary:"bg-forest px-6 py-3 text-ivory hover:bg-emerald active:bg-[var(--interactive-active)]",accent:"bg-gold px-6 py-3 text-forest hover:bg-gold-light active:bg-gold",outline:"border border-current bg-transparent px-6 py-3 hover:bg-sand/25 active:bg-sand/40",ghost:"px-4 py-3 hover:bg-sand/25 active:bg-sand/40"},size:{default:"min-h-12",sm:"min-h-11 px-4 text-sm",lg:"min-h-14 px-8"}},
  defaultVariants:{variant:"primary",size:"default"}
});
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>,VariantProps<typeof buttonVariants>{asChild?:boolean}
export function Button({asChild,className,variant,size,...props}:ButtonProps){const Comp=asChild?Slot:"button";return <Comp className={cn(buttonVariants({variant,size}),className)} {...props}/>;}
