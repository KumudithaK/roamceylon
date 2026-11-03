export const locales=["en","de","fr"] as const;
export type Locale=typeof locales[number];
export type MessageValues=Record<string,string|number>;
export type Translations=Record<string,{de:string;fr:string}>;
export const localeCookie="ceylon_locale";
export const localeLabels:Record<Locale,string>={en:"English",de:"Deutsch",fr:"Français"};

export function resolveLocale(value:unknown):Locale{
  return value==="de"||value==="fr"?value:"en";
}

export function isPublicLanguagePath(pathname:string){
  return !["admin","api","proposal"].some(segment=>pathname===`/${segment}`||pathname.startsWith(`/${segment}/`));
}

/** Only authored interface messages are translated. Values remain verbatim. */
export function translateMessage(messages:Translations,locale:Locale,source:string,values:MessageValues={}){
  const key=source.replace(/\s+/g," ").trim();
  const template=locale==="en"?source:messages[key]?.[locale]??source;
  return template.replace(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g,(token,name)=>Object.hasOwn(values,name)?String(values[name]):token);
}
