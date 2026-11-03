"use client";

import * as Dialog from "@radix-ui/react-dialog";
import {Check,ChevronDown,Globe2} from "lucide-react";
import {useRef,useState} from "react";
import {usePathname} from "next/navigation";
import {isPublicLanguagePath,locales,localeLabels,type Locale} from "@/lib/i18n/locale";
import {useTranslation} from "./locale-provider";
import {LanguageFlag} from "./language-flag";

export function LanguageSelector({disabled=false,variant="popover",align="start"}:{disabled?:boolean;variant?:"popover"|"panel";align?:"start"|"end"}){
  const {locale,setLocale,t}=useTranslation();
  const [open,setOpen]=useState(false);
  const choices=useRef<Partial<Record<Locale,HTMLButtonElement|null>>>({});
  const choose=(next:Locale)=>{if(disabled)return;setLocale(next);setOpen(false)};

  if(variant==="panel")return <section aria-label={t("Website language")} className="mt-6 border-t border-forest/15 pt-5">
    <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.13em] text-forest"><Globe2 className="size-3.5" aria-hidden="true"/>{t("Language")}</h3>
    <div className="grid grid-cols-3 gap-2">
      {locales.map(value=><button key={value} type="button" lang={value} disabled={disabled} aria-pressed={locale===value} onClick={()=>choose(value)} className={`relative flex min-h-[4.25rem] min-w-0 flex-col items-center justify-center gap-2 rounded-xl border px-2 py-3 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${locale===value?"border-forest bg-forest text-ivory":"border-forest/15 bg-white/60 text-forest hover:border-gold/50 hover:bg-sand/50"}`}>
        <LanguageFlag locale={value}/><span>{localeLabels[value]}</span>{locale===value?<Check className="absolute right-1.5 top-1.5 size-3" aria-hidden="true"/>:null}
      </button>)}
    </div>
    <div className="mt-4"><LanguageAvailabilityNotice always/></div>
  </section>;

  return <Dialog.Root open={open} onOpenChange={setOpen} modal={false}>
    <div className="relative inline-flex shrink-0">
      <Dialog.Trigger asChild>
        <button type="button" disabled={disabled} aria-label={t("Website language: {language}",{language:localeLabels[locale]})} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-forest transition-colors hover:bg-forest/5 disabled:cursor-not-allowed disabled:opacity-50">
          <Globe2 className="size-4" strokeWidth={1.5} aria-hidden="true"/><span className="text-[.68rem] uppercase tracking-[.12em]">{locale}</span><ChevronDown className="size-3 text-forest/45" aria-hidden="true"/>
        </button>
      </Dialog.Trigger>
      <Dialog.Content onOpenAutoFocus={event=>{event.preventDefault();choices.current[locale]?.focus()}} className={`absolute top-full z-[90] mt-2 w-[min(18rem,calc(100vw-4rem))] rounded-2xl border border-forest/10 bg-ivory p-2 text-forest shadow-[0_12px_40px_rgba(11,48,42,.15)] outline-none ${align==="end"?"right-0":"left-0"}`}>
        <Dialog.Title className="sr-only">{t("Website language")}</Dialog.Title>
        <Dialog.Description className="sr-only">{t("Choose your website language.")}</Dialog.Description>
        <div className="space-y-0.5">
          {locales.map(value=><button key={value} ref={element=>{choices.current[value]=element}} type="button" lang={value} disabled={disabled} aria-pressed={locale===value} onClick={()=>choose(value)} className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${locale===value?"bg-forest/6 font-semibold":"hover:bg-sand/60"}`}>
            <LanguageFlag locale={value}/><span className="flex-1">{localeLabels[value]}</span>{locale===value?<Check className="size-4 text-forest" strokeWidth={1.7} aria-hidden="true"/>:null}
          </button>)}
        </div>
        <div className="mx-2 mt-2 border-t border-forest/10 pb-2 pt-3"><LanguageAvailabilityNotice always/></div>
      </Dialog.Content>
    </div>
  </Dialog.Root>;
}

export function LanguageAvailabilityNotice({always=false}:{always?:boolean}){
  const {locale,t}=useTranslation();
  const pathname=usePathname();
  if(!isPublicLanguagePath(pathname??"/")||(!always&&locale==="en"))return null;
  return <div className="text-[.68rem] leading-relaxed text-current opacity-75">
    <p>{t("Some content remains in English.")}</p>
    <details className="mt-1.5">
      <summary className="w-fit cursor-pointer text-[.65rem] underline decoration-current/35 underline-offset-4">{t("View language availability")}</summary>
      <p className="mt-2 max-w-sm leading-relaxed">{t("Some catalogue descriptions, partner applications, the travel assistant, proposals, PDFs and legal terms are currently available in English.")}</p>
    </details>
  </div>;
}
