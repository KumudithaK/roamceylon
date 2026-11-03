"use client";

import {Text} from "@/components/i18n/text";

import {useTranslation} from "@/components/i18n/locale-provider";
import {CalendarDays,MapPin,Users} from "lucide-react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import type {Theme} from "@/lib/types";
import {brand,editionDisplayName} from "@/lib/brand";

export function JourneySearch({themes}:{themes:Theme[]}){
  const router=useRouter();
  const {t}=useTranslation();
  return <form onSubmit={event=>{event.preventDefault();const form=new FormData(event.currentTarget);const theme=String(form.get("theme")||"");router.push(theme?`/journey-builder?theme=${encodeURIComponent(theme)}`:"/journey-builder")}} className="grid gap-3 rounded-3xl border border-white/20 bg-ivory/95 p-3 text-slate shadow-2xl shadow-slate/15 md:grid-cols-[1fr_1fr_1fr_auto]"><label className="flex items-center gap-3 rounded-2xl px-4 py-3 hover:bg-sand-light"><MapPin className="size-5 text-gold"/><span className="min-w-0"><small className="block text-[.65rem] font-bold uppercase tracking-widest text-stone"><Text>{"Inspired by"}</Text></small><select name="theme" aria-label={t("Choose an Edition")} className="w-full bg-transparent font-semibold outline-none"><option value=""><Text>{"Choose an Edition"}</Text></option>{themes.map(theme=><option key={theme.id} value={theme.id} lang={t(editionDisplayName(theme))===editionDisplayName(theme)?"en":undefined}>{t(editionDisplayName(theme))}</option>)}</select></span></label><label className="flex items-center gap-3 rounded-2xl px-4 py-3 hover:bg-sand-light"><CalendarDays className="size-5 text-gold"/><span><small className="block text-[.65rem] font-bold uppercase tracking-widest text-stone"><Text>{"Travel month"}</Text></small><input type="month" className="bg-transparent font-semibold outline-none"/></span></label><label className="flex items-center gap-3 rounded-2xl px-4 py-3 hover:bg-sand-light"><Users className="size-5 text-gold"/><span><small className="block text-[.65rem] font-bold uppercase tracking-widest text-stone"><Text>{"Travellers"}</Text></small><select className="bg-transparent font-semibold outline-none"><option value="2 travellers">{t("2 travellers")}</option><option value="Solo traveller">{t("Solo traveller")}</option><option value="Family">{t("Family")}</option><option value="Private group">{t("Private group")}</option></select></span></label><Button type="submit" variant="accent" className="h-full"><Text>{brand.primaryCta}</Text></Button></form>;
}
