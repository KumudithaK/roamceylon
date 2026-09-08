"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import {X} from "lucide-react";
import type {ReactNode} from "react";
import {cn} from "@/lib/utils";

export const Dialog=DialogPrimitive.Root;
export const DialogTrigger=DialogPrimitive.Trigger;
export const DialogClose=DialogPrimitive.Close;

/** Radix supplies focus trapping/restoration, Escape, and background inertness. */
export function DialogContent({title,description,children,className}:{title:string;description:string;children:ReactNode;className?:string}){
  return <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-[60] bg-[var(--overlay)]"/>
    <DialogPrimitive.Content className={cn("fixed left-1/2 top-1/2 z-[70] max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto overscroll-contain rounded-lg border border-divider bg-ivory p-6 text-slate shadow-xl sm:p-8",className)}>
      <div className="mb-6 flex items-center justify-between gap-4">
        <DialogPrimitive.Title className="font-serif text-2xl">{title}</DialogPrimitive.Title>
        <DialogPrimitive.Close className="inline-flex size-11 shrink-0 items-center justify-center rounded-md hover:bg-sand" aria-label="Close menu or dialog"><X className="size-5" aria-hidden="true"/></DialogPrimitive.Close>
      </div>
      <DialogPrimitive.Description className="sr-only">{description}</DialogPrimitive.Description>
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>;
}
