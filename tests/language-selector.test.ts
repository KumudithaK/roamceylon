import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {createRequire} from "node:module";
import path from "node:path";
import test from "node:test";
import ts from "typescript";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {resolveLocale,isPublicLanguagePath,translateMessage,type Translations} from "../lib/i18n/locale.ts";

const root=path.resolve(import.meta.dirname,".."),external=createRequire(import.meta.url);
function modules(pathname="/"){
  const cache=new Map<string,Record<string,unknown>>();
  // The local test loader intentionally exposes heterogeneous module exports.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function load(file:string):Record<string,any>{
    if(cache.has(file))return cache.get(file)!;
    const out={exports:{} as Record<string,unknown>};cache.set(file,out.exports);
    const require=(id:string):unknown=>{
      if(id==="next/navigation")return {usePathname:()=>pathname};
      if(id.startsWith("@/")||id.startsWith(".")){
        const base=id.startsWith("@/")?path.join(root,id.slice(2)):path.resolve(path.dirname(file),id);
        const resolved=[base,`${base}.ts`,`${base}.tsx`].find(value=>existsSync(value));
        if(!resolved)throw new Error(`Missing local module: ${id}`);
        return load(resolved);
      }
      return external(id);
    };
    const js=ts.transpileModule(readFileSync(file,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
    new Function("require","module","exports",js)(require,out,out.exports);
    return out.exports;
  }
  return (file:string)=>load(path.join(root,file));
}

test("untrusted or unsupported language preferences fall back to English",()=>{
  for(const value of [undefined,null,"",{},"DE","de-DE","javascript:alert(1)","ar","__proto__"])assert.equal(resolveLocale(value),"en");
  assert.equal(resolveLocale("de"),"de");assert.equal(resolveLocale("fr"),"fr");
});

test("admin, API and accepted proposal routes remain English",()=>{
  for(const url of ["/admin","/admin/accounting/123","/api","/api/enquiries","/proposal","/proposal/private-token"])assert.equal(isPublicLanguagePath(url),false);
  for(const url of ["/","/journey-builder","/destinations/galle","/about","/administer"])assert.equal(isPublicLanguagePath(url),true);
});

test("only exact authored messages translate; arbitrary content and interpolation values remain verbatim",()=>{
  const dictionary:Translations={"Hello {name}":{de:"Hallo {name}",fr:"Bonjour {name}"}};
  assert.equal(translateMessage(dictionary,"fr","Hello {name}",{name:"Alex <Morgan>"}),"Bonjour Alex <Morgan>");
  assert.equal(translateMessage(dictionary,"de","  Hello   {name}  ",{name:"Galle"}),"Hallo Galle");
  assert.equal(translateMessage(dictionary,"fr","Traveller note: Hello {name}"),"Traveller note: Hello {name}");
  assert.equal(translateMessage(dictionary,"en","Hello {name}",{name:0}),"Hello 0");
  assert.equal(translateMessage(dictionary,"fr","Unreviewed catalogue description"),"Unreviewed catalogue description");
});

test("both translation dictionaries preserve source placeholders and contain complete nonempty messages",()=>{
  const load=modules();const {messages}=load("lib/i18n/messages.ts");
  const tokens=(text:string)=>[...text.matchAll(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g)].map(x=>x[1]).sort();
  assert.ok(Object.keys(messages).length>100);
  for(const [source,translations] of Object.entries(messages) as [string,{de:string;fr:string}][]){
    for(const locale of ["de","fr"] as const){assert.ok(translations[locale]?.trim(),`${locale}: ${source}`);assert.deepEqual(tokens(translations[locale]),tokens(source),`${locale} placeholders: ${source}`)}
  }
});

test("real provider renders German and French selectors and interface text with safe user values",()=>{
  for(const locale of ["en","de","fr"]){
    const load=modules("/journey-builder");const {LocaleProvider}=load("components/i18n/locale-provider.tsx");const {Text}=load("components/i18n/text.tsx");const {LanguageSelector}=load("components/i18n/language-selector.tsx");
    const html=renderToStaticMarkup(createElement(LocaleProvider,{initialLocale:locale},createElement("main",null,createElement(LanguageSelector,{variant:"panel"}),createElement("h1",null,createElement(Text,null,"Plan Your Journey")),createElement("p",null,"Alex <Morgan>"))));
    assert.match(html,locale==="de"?/Ihre Reise planen/:locale==="fr"?/Créer votre voyage/:/Plan Your Journey/);
    assert.equal((html.match(/aria-pressed="true"/g)||[]).length,1);assert.doesNotMatch(html,/<select/);assert.match(html,/Deutsch/);assert.match(html,/Français/);assert.match(html,/Alex &lt;Morgan&gt;/);
  }
});

test("German preference cannot translate protected staff/proposal screens",()=>{
  for(const pathname of ["/admin/accounting/123","/proposal/private-token"]){
    const load=modules(pathname);const {LocaleProvider}=load("components/i18n/locale-provider.tsx");const {Text}=load("components/i18n/text.tsx");const {LanguageAvailabilityNotice}=load("components/i18n/language-selector.tsx");
    const html=renderToStaticMarkup(createElement(LocaleProvider,{initialLocale:"de"},createElement("main",null,createElement(Text,null,"Plan Your Journey"),createElement(LanguageAvailabilityNotice))));
    assert.equal(html,"<main>Plan Your Journey</main>");
  }
});

test("shared form controls translate their labels while preserving entered names and notes",()=>{
  const load=modules("/contact");const {LocaleProvider}=load("components/i18n/locale-provider.tsx");const {FormField,Input,Textarea}=load("components/ui/form-field.tsx");
  // FormField requires a render-function prop to associate labels with their controls.
  // eslint-disable-next-line react/no-children-prop
  const html=renderToStaticMarkup(createElement(LocaleProvider,{initialLocale:"fr"},createElement("div",null,createElement(FormField,{label:"Contact",required:true,children:(association:Record<string,unknown>)=>createElement(Input,{...association,defaultValue:"Alex <Morgan>"})}),createElement(Textarea,{defaultValue:"Please preserve my English note."}))));
  assert.match(html,/Alex &lt;Morgan&gt;/);assert.match(html,/Please preserve my English note\./);
});

test("rate badges use their commercial label rather than the navigation label",()=>{
  const load=modules("/journey-builder");const {LocaleProvider}=load("components/i18n/locale-provider.tsx");const {PricingPlanChoices}=load("components/journey/pricing-plan-choices.tsx");
  const plan={id:"fixture-plan",entityId:"fixture-stay",entityType:"accommodation",name:"Original catalogue rate name",chargingMethod:"per_night",description:null};
  for(const locale of ["de","fr"]){
    const html=renderToStaticMarkup(createElement(LocaleProvider,{initialLocale:locale},createElement(PricingPlanChoices,{plans:[plan],value:plan.id,onChange:()=>{}})));
    assert.match(html,locale==="de"?/Haupttarif/:/Tarif principal/);assert.doesNotMatch(html,/Hauptnavigation|Navigation principale/);assert.match(html,/Original catalogue rate name/);assert.match(html,/value="fixture-plan"/);
  }
});
