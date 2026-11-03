import {useId} from "react";
import type {Locale} from "@/lib/i18n/locale";

/** Decorative accents only; language names always accompany these flags. */
export function LanguageFlag({locale}:{locale:Locale}){
  const clip=useId();
  return <svg viewBox="0 0 60 40" width="24" height="16" aria-hidden="true" focusable="false" className="h-4 w-6 shrink-0 overflow-hidden rounded-[2px] ring-1 ring-black/10">
    {locale==="en"?<>
      <defs><clipPath id={clip}><path d="M30 20H60V40ZM30 20H0V40ZM30 20H0V0ZM30 20H60V0Z"/></clipPath></defs>
      <path fill="#012169" d="M0 0H60V40H0Z"/>
      <path d="M0 0L60 40M60 0L0 40" stroke="#fff" strokeWidth="8"/>
      <path d="M0 0L60 40M60 0L0 40" stroke="#C8102E" strokeWidth="4" clipPath={`url(#${clip})`}/>
      <path d="M30 0V40M0 20H60" stroke="#fff" strokeWidth="13"/>
      <path d="M30 0V40M0 20H60" stroke="#C8102E" strokeWidth="8"/>
    </>:locale==="de"?<>
      <path fill="#181818" d="M0 0H60V14H0Z"/>
      <path fill="#D00" d="M0 13.333H60V27H0Z"/>
      <path fill="#FFCE00" d="M0 26.667H60V40H0Z"/>
    </>:<>
      <path fill="#002395" d="M0 0H20V40H0Z"/>
      <path fill="#fff" d="M20 0H40V40H20Z"/>
      <path fill="#ED2939" d="M40 0H60V40H40Z"/>
    </>}
  </svg>;
}
