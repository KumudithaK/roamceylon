"use client";
import {CalendarDays,MapPin,Users} from "lucide-react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import type {Theme} from "@/lib/types";
import {brand,editionDisplayName} from "@/lib/brand";

export function JourneySearch({themes}:{themes:Theme[]}){
  const router=useRouter();
  return <form onSubmit={event=>{event.preventDefault();const form=new FormData(event.currentTarget);const theme=String(form.get("theme")||"");router.push(theme?`/journey-builder?theme=${encodeURIComponent(theme)}`:"/journey-builder")}} className="grid gap-3 rounded-3xl border border-white/20 bg-ivory/95 p-3 text-slate shadow-2xl shadow-slate/15 md:grid-cols-[1fr_1fr_1fr_auto]"><label className="flex items-center gap-3 rounded-2xl px-4 py-3 hover:bg-sand-light"><MapPin className="size-5 text-gold"/><span className="min-w-0"><small className="block text-[.65rem] font-bold uppercase tracking-widest text-stone">Inspired by</small><select name="theme" aria-label="Choose an Edition" className="w-full bg-transparent font-semibold outline-none"><option value="">Choose an Edition</option>{themes.map(theme=><option key={theme.id} value={theme.id}>{editionDisplayName(theme)}</option>)}</select></span></label><label className="flex items-center gap-3 rounded-2xl px-4 py-3 hover:bg-sand-light"><CalendarDays className="size-5 text-gold"/><span><small className="block text-[.65rem] font-bold uppercase tracking-widest text-stone">Travel month</small><input type="month" className="bg-transparent font-semibold outline-none"/></span></label><label className="flex items-center gap-3 rounded-2xl px-4 py-3 hover:bg-sand-light"><Users className="size-5 text-gold"/><span><small className="block text-[.65rem] font-bold uppercase tracking-widest text-stone">Travellers</small><select className="bg-transparent font-semibold outline-none"><option>2 travellers</option><option>Solo traveller</option><option>Family</option><option>Private group</option></select></span></label><Button type="submit" variant="accent" className="h-full">{brand.primaryCta}</Button></form>;
}
