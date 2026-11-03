"use client";

import {createContext,useCallback,useContext,useEffect,useMemo,useState,type ReactNode} from "react";
import {usePathname} from "next/navigation";
import {isPublicLanguagePath,localeCookie,resolveLocale,translateMessage,type Locale,type MessageValues} from "@/lib/i18n/locale";
import {messages} from "@/lib/i18n/messages";

type LocaleContextValue={locale:Locale;setLocale:(locale:Locale)=>void;t:(source:string,values?:MessageValues)=>string};
const LocaleContext=createContext<LocaleContextValue>({locale:"en",setLocale:()=>{},t:(source,values)=>translateMessage(messages,"en",source,values)});

export function LocaleProvider({initialLocale="en",children}:{initialLocale?:Locale;children:ReactNode}){
  const pathname=usePathname();
  const [preferredLocale,setPreferredLocale]=useState<Locale>(resolveLocale(initialLocale));
  const locale=isPublicLanguagePath(pathname??"/")?preferredLocale:"en";
  const setLocale=useCallback((next:Locale)=>{
    const safeLocale=resolveLocale(next);
    setPreferredLocale(safeLocale);
    // A display preference only: never navigate, reload, or remount the journey.
    document.cookie=`${localeCookie}=${safeLocale}; Path=/; Max-Age=31536000; SameSite=Lax${window.location.protocol==="https:"?"; Secure":""}`;
  },[]);
  useEffect(()=>{document.documentElement.lang=locale},[locale]);
  const t=useCallback((source:string,values?:MessageValues)=>translateMessage(messages,locale,source,values),[locale]);
  const value=useMemo(()=>({locale,setLocale,t}),[locale,setLocale,t]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useTranslation(){return useContext(LocaleContext)}
