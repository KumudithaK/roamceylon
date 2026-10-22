import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import ts from "typescript";
import {isPartnerDemoEnabled,partnerDemoEmbedUrl,partnerDemoPosterUrl,partnerDemoVideoPosterUrl} from "../lib/partner-demo.ts";
const source=readFileSync(new URL("../components/home/hero-demo-video.tsx",import.meta.url),"utf8");
test("a missing published hero poster uses the selected film thumbnail, never the Ella card fallback",()=>{
  for(const missing of [null,undefined,"", "  "])assert.equal(partnerDemoPosterUrl(missing),partnerDemoVideoPosterUrl);
  assert.equal(partnerDemoPosterUrl(" /configured-poster.jpg "),"/configured-poster.jpg");
  assert.equal(partnerDemoVideoPosterUrl,"https://i.ytimg.com/vi/OkLsh-4NokU/maxresdefault.jpg");
  const home=readFileSync(new URL("../app/page.tsx",import.meta.url),"utf8");assert.match(home,/posterUrl:partnerDemoPosterUrl\(savedHero\?\.posterUrl\)/);assert.match(home,/const configuredHero=savedHero\?\?fallbackHero/);
});
test("CMS-backed destination cards and homepage are request-rendered after direct admin saves",()=>{
  for(const path of ["app/page.tsx","app/destinations/page.tsx"]){
    const page=readFileSync(new URL("../"+path,import.meta.url),"utf8");assert.match(page,/export const dynamic="force-dynamic"/);
  }
  const config=readFileSync(new URL("../next.config.ts",import.meta.url),"utf8");assert.match(config,/hostname:"i.ytimg.com",pathname:"\/vi\/OkLsh-4NokU\/maxresdefault.jpg",search:""/);
});
async function effect(failure=false){
  const body=source.slice(source.indexOf("    if(!enabled||!host.current)return;"),source.indexOf("\n  },[enabled,videoId]"));
  const timers=new Map<number,()=>void>();let serial=0,removed=0,destroyed=0,muted=0,played=0;
  const state={playing:false,failed:false,hasPlayed:false},attributes:Record<string,string>={};
  const iframe={title:"",tabIndex:0,allow:"",referrerPolicy:"",src:"",setAttribute:(k:string,v:string)=>{attributes[k]=v},remove:()=>{removed++}};
  let events:Record<string,(event:unknown)=>void>={};
  const player={mute:()=>{muted++},playVideo:()=>{played++},destroy:()=>{destroyed++}};
  const api={Player:function(_frame:unknown,options:{events:typeof events}){events=options.events;return player}};
  const cleanup=new Function("enabled","host","videoId","window","document","loadYouTubeApi","partnerDemoEmbedUrl","setPlaying","setFailed","setHasPlayed",ts.transpileModule(body,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText)(true,{current:{appendChild:()=>{}}},"OkLsh-4NokU",{location:{origin:"http://127.0.0.1:4185"},setTimeout:(fn:()=>void)=>{timers.set(++serial,fn);return serial},clearTimeout:(n:number)=>timers.delete(n)},{createElement:()=>iframe},()=>failure?Promise.reject(new Error("blocked")):Promise.resolve(api),partnerDemoEmbedUrl,(n:boolean)=>{state.playing=n},(n:boolean)=>{state.failed=n},(n:boolean)=>{state.hasPlayed=n}) as ()=>void;
  await Promise.resolve();await Promise.resolve();return {state,timers,events,player,iframe,attributes,cleanup,counts:()=>({removed,destroyed,muted,played})};
}
test("hero actual effect starts muted, reveals only PLAYING, and removes provider on pause/unmount",async()=>{
  const h=await effect();assert.equal(h.state.playing,false);assert.equal(h.iframe.tabIndex,-1);assert.equal(h.attributes["aria-hidden"],"true");h.events.onReady({target:h.player});assert.equal(h.counts().muted,1);h.events.onStateChange({data:1});assert.equal(h.state.playing,true);assert.equal(h.timers.size,0);h.cleanup();assert.deepEqual(h.counts(),{removed:1,destroyed:1,muted:1,played:1});h.events.onReady({target:h.player});assert.equal(h.counts().played,1);assert.doesNotMatch(source,/unMute/);
});
for(const name of ["onError","onAutoplayBlocked"])test(`hero ${name} falls back to poster`,async()=>{const h=await effect();h.events[name]({});assert.equal(h.state.failed,true);assert.equal(h.state.playing,false);h.cleanup()});
test("blocked API, stalled playback and buffering retain fallback",async()=>{
  const blocked=await effect(true);assert.equal(blocked.state.failed,true);blocked.cleanup();
  const h=await effect();h.events.onStateChange({data:1});h.events.onStateChange({data:3});assert.equal(h.state.playing,false);for(const fn of h.timers.values())fn();assert.equal(h.state.failed,true);h.cleanup();
});
test("reduced motion gates all iframe work; static poster remains underneath",()=>{
  assert.match(source,/const enabled=allowMotion&&!paused&&!failed/);assert.match(source,/serverMotionAllowed=\(\)=>false/);assert.match(source,/query.removeEventListener\("change",notify\)/);
  assert.match(readFileSync(new URL("../components/home/hero-media.tsx",import.meta.url),"utf8"),/src=\{media.posterUrl\}/);
});
test("actual Next header configuration scopes microphone allowance to demo homepage and never Production",async()=>{
  const config=readFileSync(new URL("../next.config.ts",import.meta.url),"utf8").replace(/^import .*;\n/gm,"").replace("export default nextConfig;","return nextConfig;");
  const compiled=ts.transpileModule(config,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
  const flags={CEYLON_PARTNER_DEMO_HERO:"1",CEYLON_DEMO_SCOPE:"commercial-readiness-staging",VERCEL_GIT_COMMIT_REF:"commercial-readiness/staging",NEXT_PUBLIC_SUPABASE_URL:"https://hvcggnuptrcsxtrcjnre.supabase.co",NODE_ENV:"production"};
  for(const environment of ["production","preview"]){
    const result=new Function("process","isPartnerDemoEnabled",compiled)({env:{...flags,VERCEL_ENV:environment}},isPartnerDemoEnabled) as {headers:()=>Promise<{source:string;headers:{key:string;value:string}[]}[]>};
    const rules=await result.headers();const all=rules.find(r=>r.source==="/:path*")!;assert.equal(all.headers.find(h=>h.key==="Permissions-Policy")?.value,"camera=(), microphone=(), geolocation=()");
    const home=rules.find(r=>r.source==="/");assert.equal(Boolean(home),environment==="preview");
    if(home)assert.equal(home.headers.find(h=>h.key==="Permissions-Policy")?.value,"camera=(), microphone=(self), geolocation=()");
    assert.equal(all.headers.find(h=>h.key==="Content-Security-Policy")!.value.includes(" https://www.youtube.com"),environment==="preview");
    assert(all.headers.some(h=>h.key==="X-Frame-Options"&&h.value==="DENY"));
  }
});
