import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";
import {test} from "node:test";
import {runInNewContext} from "node:vm";
import ts from "typescript";
import {journeyMessages} from "../lib/i18n/journey-messages.ts";
import {translateMessage} from "../lib/i18n/locale.ts";

const read=(file:string)=>readFileSync(new URL(`../${file}`,import.meta.url),"utf8");
const placeholders=(message:string)=>[...message.matchAll(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g)].map(match=>match[1]).sort();
const translate=(locale:"en"|"de"|"fr")=>(source:string,values?:Record<string,string|number>)=>translateMessage(journeyMessages,locale,source,values);

test("journey translations retain every placeholder and keep interpolated values verbatim",()=>{
  for(const [source,translations] of Object.entries(journeyMessages)){
    for(const locale of ["de","fr"] as const){
      assert.ok(translations[locale].trim(),`${locale}: ${source}`);
      assert.deepEqual(placeholders(translations[locale]),placeholders(source),`${locale}: ${source}`);
    }
  }
  const input="Taylor {notAToken} <script> & Māori";
  for(const locale of ["de","fr"] as const){
    assert.ok(translate(locale)("Notes for {destination}",{destination:input}).includes(input));
    assert.equal(translate(locale)(input),input,"unknown catalogue/user text has explicit English/verbatim fallback");
  }
});

test("all seven authored chapter titles and submission validation messages have German/French copy",()=>{
  for(const source of ["What kind of journey draws you in?","Where would you like to wake up?","Choose the moments that matter.","Shape each place around you.","Add the practical details.","A thoughtful second look.","Review the journey taking shape.","Please enter your full name.","Please enter a valid email address.","Please choose an arrival date at least 14 days from today.","Drop-off must be on or after pickup."]){
    for(const locale of ["de","fr"] as const)assert.notEqual(translate(locale)(source),source);
  }
  assert.equal(translate("de")("{count} night",{count:1}),"1 Übernachtung");
  assert.equal(translate("fr")("{count} nights",{count:2}),"2 nuits");
});

test("dynamic insight localization preserves catalogue names and the supplied scheduling advice",()=>{
  const require=createRequire(import.meta.url);
  const compiledModule={exports:{} as Record<string,unknown>};
  const code=ts.transpileModule(read("features/journey/journey-insights-panel.tsx"),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
  runInNewContext(code,{module:compiledModule,exports:compiledModule.exports,require:(id:string)=>id.startsWith("@/")?{}:require(id)});
  const localize=compiledModule.exports.translateJourneyInsightMessage as (message:string,t:ReturnType<typeof translate>)=>string;
  for(const locale of ["de","fr"] as const){
    const name="Galle {private-token} & Tangalle";
    const source=`${name} does not yet have a selected experience. You can continue as it is, or explore what feels meaningful there.`;
    const result=localize(source,translate(locale));
    assert.ok(result.includes(name));assert.notEqual(result,source);
    assert.equal(localize("An unknown provider-authored message",translate(locale)),"An unknown provider-authored message");
  }
});

test("locale display does not translate form values or introduce journey-state resets",()=>{
  const source=read("features/journey/journey-builder.tsx");
  assert.ok(source.includes('value={value}>{t(label)}</option>'));
  assert.ok(source.includes('value:language}'));
  assert.ok(source.includes('value={state.journeyGuideNotes}'));
  assert.ok(source.includes('value={state.accessibilityRequirements}'));
  assert.ok(!/key=\{locale\}/.test(source));
  assert.ok(!/useEffect\([^]*?dispatch\([^]*?\[locale\]/.test(source));
  const quotation=read("features/journey/quotation-modal.tsx");
  assert.ok(quotation.includes('name:values.name'));
  assert.ok(quotation.includes('notes:values.notes||defaultNotes'));
  assert.ok(quotation.includes('},[open,reset]);'),"language changes are not request-form reset dependencies");
});
