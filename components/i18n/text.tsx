"use client";

import {useTranslation} from "./locale-provider";
import type {MessageValues} from "@/lib/i18n/locale";

/** A plain text node so this is also valid inside an option or heading. */
export function Text({children,values}:{children:string;values?:MessageValues}){
  const {t}=useTranslation();
  return t(children,values);
}
