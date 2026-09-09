import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {createRequire} from "node:module";
import {createHash} from "node:crypto";
import path from "node:path";
import test from "node:test";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import ts from "typescript";
import {approvedPublicContact,hidePublicShell,isActiveNavigation,journeyLaunchHref,publicNavigation} from "../lib/public-navigation.ts";

const root=path.resolve(import.meta.dirname,"..");
const source=(file:string)=>readFileSync(path.join(root,file),"utf8");
const external=createRequire(import.meta.url);
// Render the actual TSX without adding a second test/build framework.
function component(file:string,pathname="/"){
  const cache=new Map<string,Record<string,unknown>>();
  function load(filename:string):Record<string,unknown>{
    if(cache.has(filename))return cache.get(filename)!;
    const code=ts.transpileModule(readFileSync(filename,"utf8"),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
    const loadedModule={exports:{} as Record<string,unknown>};
    cache.set(filename,loadedModule.exports);
    const require=(id:string)=>{
      if(id==="next/navigation")return {usePathname:()=>pathname};
      if(id.startsWith("@/")){
        const base=path.join(root,id.slice(2));
        const resolved=[".tsx",".ts","/index.tsx","/index.ts"].map(ext=>base+ext).find(existsSync);
        if(!resolved)throw new Error("Unresolved test import: "+id);
        return load(resolved);
      }
      return external(id);
    };
    new Function("require","module","exports",code)(require,loadedModule,loadedModule.exports);
    return loadedModule.exports;
  }
  return load(path.join(root,file));
}
const render=(file:string,name:string,props:Record<string,unknown>={},pathname="/")=>renderToStaticMarkup(createElement(component(file,pathname)[name] as React.ComponentType<Record<string,unknown>>,props));

test("Batch 1 uses the exact palette, layout measures and readable type foundations",()=>{
  const css=source("app/globals.css");
  for(const value of ["#0B302A","#B58A3A","#F6F1E7","#E8DDC8","#252522"])assert.ok(css.includes(value));
  for(const role of ["surface-page","surface-elevated","surface-secondary","text-primary","text-muted","brand","accent","border","focus","overlay","status-error","status-success","status-warning"])assert.ok(css.includes("--"+role+":"));
  assert.match(css,/--space-unit:\.5rem/);
  assert.match(css,/--measure-content:80rem/);
  assert.match(css,/--measure-reading:46rem/);
  assert.match(css,/--measure-media:90rem/);
  assert.match(css,/\.eyebrow\{font-size:\.75rem/);
  assert.match(css,/\.section\{padding-block:clamp\(3rem,5vw,5rem\)\}/);
  assert.match(css,/\.section-continuation\{padding-top:clamp\(1\.5rem,3vw,3rem\)\}/);
  for(const utility of ["editorial-surface","editorial-rule","cinematic-image"])assert.match(css,new RegExp("\\."+utility));
  assert.match(css,/:focus-visible/);
  assert.match(css,/@layer base\{a\{text-decoration:none;color:inherit\}\}/);
  assert.match(css,/prefers-reduced-motion:reduce/);
  assert.match(source("app/layout.tsx"),/Manrope,Playfair_Display/);
});

test("public navigation keeps exact routes and intentional step-zero launches",()=>{
  assert.equal(journeyLaunchHref,"/journey-builder?step=0");
  assert.deepEqual(publicNavigation.map(x=>x.href),["/discover","/destinations","/experiences","/about"]);
  assert.equal(publicNavigation[0].label,"Editions");
  assert.equal(isActiveNavigation("/discover/heritage","/discover"),true);
  assert.equal(isActiveNavigation("/discovery","/discover"),false);
  for(const route of ["/admin","/admin/login","/admin/dashboard","/proposal/token"])assert.equal(hidePublicShell(route),true);
  assert.equal(hidePublicShell("/destinations"),false);
  assert.equal(hidePublicShell("/administrator"),false);
});

test("header renders accessible navigation and no primary supplier or empty Journal links",()=>{
  const html=render("components/site/site-header.tsx","SiteHeader",{},"/discover/heritage");
  assert.match(html,/aria-label="The Ceylon Edition home"/);
  assert.match(html,/aria-label="Primary"/);
  assert.match(html,/aria-current="page"/);
  assert.match(html,/Plan Your Journey/);
  assert.match(html,/the-ceylon-edition-emblem\.png/);
  assert.match(html,/border-gold\/70/);
  assert.match(html,/aria-label="Open navigation menu"/);
  assert.match(html,/aria-expanded="false"/);
  assert.doesNotMatch(html,/href="\/(?:hotels|transport|guides|blog)"/);
  for(const route of ["/admin/login","/proposal/test"])assert.equal(render("components/site/site-header.tsx","SiteHeader",{},route),"");
});

test("mobile menu uses focus-managed dialog and closes for every navigation/CTA",()=>{
  const header=source("components/site/site-header.tsx");
  assert.match(header,/<Dialog open=\{open\} onOpenChange=\{setOpen\}/);
  assert.match(header,/<DialogClose asChild key=\{href\}>/);
  assert.match(header,/<DialogClose asChild><Button asChild variant="outline"[^>]*><Link href="\/partners"/);
  assert.match(header,/<DialogClose asChild><Button asChild/);
  assert.match(header,/desktop\.removeEventListener/);
  const dialog=source("components/ui/dialog.tsx");
  for(const part of ["Root","Trigger","Close","Portal","Overlay","Content","Title","Description"])assert.ok(dialog.includes("DialogPrimitive."+part));
  assert.doesNotMatch(dialog,/modal=\{false\}|onEscapeKeyDown|onCloseAutoFocus|onOpenAutoFocus/);
});

test("temporary text lockup is readable and does not invent emblem artwork",()=>{
  const html=render("components/brand/brand-wordmark.tsx","BrandWordmark",{showTagline:false});
  assert.match(html,/>THE</);
  assert.match(html,/>CEYLON EDITION</);
  assert.match(html,/items-start text-left/);
  assert.match(html,/-translate-x-\[2px\] self-start/);
  assert.doesNotMatch(html,/<svg|<img|Bespoke/);
  const full=render("components/brand/brand-wordmark.tsx","BrandWordmark",{inverse:true});
  assert.match(full,/Bespoke journeys through Sri Lanka\./);
  assert.match(full,/text-ivory/);
  assert.doesNotMatch(full,/Roam Ceylon|Private Limited|Pvt Ltd/i);
});

test("footer includes only verified contacts, safe external links and no invented claims",()=>{
  const html=render("components/site/site-footer.tsx","SiteFooter");
  for(const href of [approvedPublicContact.phoneHref,approvedPublicContact.whatsapp,approvedPublicContact.facebook])assert.ok(html.includes(href));
  assert.equal((html.match(/rel="noopener noreferrer"/g)??[]).length,2);
  assert.match(html,/Facebook \(opens in a new tab\)/);
  assert.match(html,/aria-label="WhatsApp \(opens in a new tab\)"/);
  assert.match(html,/viewBox="0 0 24 24"/);
  assert.equal((html.match(/inline-flex size-11 items-center justify-center rounded-md border border-forest\/40/g)??[]).length,2);
  assert.doesNotMatch(html,/>WhatsApp<|bright WhatsApp green/);
  assert.doesNotMatch(source("components/site/site-footer.tsx"),/\bPhone\b|rounded-full border border-forest\/45|text-link inline-flex min-h-11 items-center gap-2\.5/);
  assert.doesNotMatch(html,/mailto:|Roam Ceylon|Private Limited|Pvt Ltd|licen[cs]e|href="\/blog"/i);
  assert.equal(render("components/site/site-footer.tsx","SiteFooter",{},"/admin/dashboard"),"");
});

test("shared catalogue introduction and cards use one content-driven section",()=>{
  const listing=source("components/site/listing-page.tsx");
  assert.match(listing,/return <section className="section border-b border-gold\/20 bg-sand-light"/);
  assert.equal((listing.match(/<section/g)??[]).length,1);
  assert.doesNotMatch(listing,/py-16 md:py-24|<\/section><section/);
});

test("approved raster master is unchanged and derivatives have recorded provenance",()=>{
  const provenance=JSON.parse(source("assets/brand/raster-provenance.json"));
  const hash=(file:string)=>createHash("sha256").update(readFileSync(path.join(root,file))).digest("hex");
  assert.equal(hash("assets/brand/the-ceylon-edition-approved-master.png"),"5de54200e42d8486099ba4e085a28ba5ca66558c16b929ca3c9f5e5e433c3afa");
  assert.equal(provenance.sourceSha256,hash("assets/brand/the-ceylon-edition-approved-master.png"));
  for(const asset of provenance.derivatives){
    assert.equal(hash(asset.path),asset.sha256);
    assert.ok(asset.bytes<160000);
  }
  const logo=render("components/brand/brand-logo.tsx","BrandLogo",{variant:"emblem",decorative:true});
  assert.match(logo,/alt=""/);
  assert.match(logo,/width="218"/);
  assert.match(logo,/height="320"/);
  assert.match(logo,/the-ceylon-edition-emblem/);
  const compact=render("components/brand/brand-logo.tsx","BrandLogo",{variant:"compact",decorative:true});
  assert.match(compact,/the-ceylon-edition-emblem/);
  assert.match(compact,/>THE</);
  assert.match(compact,/>CEYLON EDITION</);
  assert.doesNotMatch(compact,/Bespoke journeys through Sri Lanka/);
  const dark=render("components/brand/brand-logo.tsx","BrandLogo",{variant:"full",inverse:true});
  assert.doesNotMatch(dark,/<img/);
  assert.match(dark,/Bespoke journeys through Sri Lanka/);
  assert.doesNotMatch(source("components/brand/brand-logo.tsx"),/approved-master\.png/);
});

test("buttons and badges keep readable text and controls at least 44px tall",()=>{
  for(const size of ["sm","default","lg"]){
    const html=render("components/ui/button.tsx","Button",{size,disabled:true,children:"Continue"});
    assert.match(html,/min-h-(?:11|12|14)/);
    assert.match(html,/disabled=""/);
    assert.doesNotMatch(html,/text-xs|outline-none/);
  }
  const badge=render("components/ui/badge.tsx","Badge",{children:"Published"});
  assert.match(badge,/text-xs/);
});

test("form labels, help and errors are associated with the actual control",()=>{
  const exports=component("components/ui/form-field.tsx");
  const fieldProps={
    label:"Email",help:"Use a monitored address.",error:"Enter a valid email.",required:true,
    children:(association:Record<string,unknown>)=>createElement(exports.Input as React.ComponentType<Record<string,unknown>>,{...association,type:"email"})
  };
  const html=renderToStaticMarkup(createElement(exports.FormField as React.ComponentType<Record<string,unknown>>,fieldProps));
  const id=html.match(/<label[^>]*for="([^"]+)"/)?.[1];
  assert.ok(id);
  assert.ok(html.includes('id="'+id+'"'));
  assert.ok(html.includes('aria-describedby="'+id+'-help '+id+'-error"'));
  assert.match(html,/aria-invalid="true"/);
  assert.match(html,/type="email"/);
  assert.match(html,/form-control/);
});

test("shared feedback distinguishes errors, loading, and honest empty content",()=>{
  assert.match(render("components/ui/feedback.tsx","Feedback",{children:"Unable to load"}),/role="alert"/);
  assert.match(render("components/ui/feedback.tsx","LoadingState"),/role="status"/);
  assert.match(render("components/ui/feedback.tsx","LoadingState"),/motion-safe:animate-spin/);
  assert.match(render("components/ui/feedback.tsx","EmptyState",{title:"More to discover"}),/<h2/);
});

test("motion and image access remain restrained and host-specific",()=>{
  const motion=source("components/animate/fade-in.tsx");
  assert.match(motion,/useReducedMotion/);
  assert.match(motion,/initial=\{reducedMotion\?false/);
  assert.match(motion,/duration:reducedMotion\?0:\.45/);
  const config=source("next.config.ts");
  assert.match(config,/hostname:"fstpfqlgypvktjwdeagu\.supabase\.co"/);
  assert.match(config,/hostname:"hvcggnuptrcsxtrcjnre\.supabase\.co",pathname:"\/storage\/v1\/object\/public\/\*\*"/);
  assert.doesNotMatch(config,/hostname:"\*\*/);
});
