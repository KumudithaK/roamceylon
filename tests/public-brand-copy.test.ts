import assert from "node:assert/strict";
import {existsSync,readFileSync} from "node:fs";
import path from "node:path";
import test from "node:test";
import ts from "typescript";
import {brand} from "../lib/brand.ts";
import {createCeyloCatalogue} from "../lib/ceylo/catalogue.ts";

const root=path.resolve(import.meta.dirname,"..");
const oldCopy="Arranged by The Ceylon Edition.";
const expected=`Arranged by ${brand.name}.`;
const identity={id:"supplier-1",name:"The Ceylon Edition partner",slug:"the-ceylon-edition-partner",status:"published",active:true};

function repositories(){
  const row={...identity,short_description:oldCopy,full_description:oldCopy,image_alt:oldCopy,travel_inspiration:oldCopy,highlights:[oldCopy],badges:[oldCopy],why_choose:[oldCopy],suggested_itinerary:[oldCopy],gallery:["https://example.invalid/the-ceylon-edition.jpg"],local_highlights:[oldCopy],nearby_attractions:[oldCopy],travel_tips:[oldCopy],historical_importance:null,cultural_significance:null,why_visit:null,unesco_information:null,nature_wildlife:null,best_time_to_visit:null,weather:null,unique_points:[],included:[oldCopy],things_to_know:[],traveller_tips:[],gallery_alt_texts:[],short_bio:oldCopy,full_bio:oldCopy,languages:["English"],specialities:[],nationwide:true,destination_id:"supplier-1",hero_title:oldCopy,hero_subtitle:oldCopy,hero_video_alt:oldCopy};
  const source=JSON.stringify(row);
  const database={from(table:string){
    const data=table==="pricing_plans"||table.endsWith("_destinations")||table.endsWith("_themes")||table==="guide_experiences"?[]:[row];
    return {select(){return this},eq(){return this},in(){return this},order(){return this},single(){return Promise.resolve({data:row,error:null})},then(resolve:(value:unknown)=>unknown){return Promise.resolve({data,error:null}).then(resolve)}};
  }};
  const cache=new Map<string,Record<string,unknown>>();
  function load(file:string):Record<string,unknown>{
    if(cache.has(file))return cache.get(file)!;
    const loaded={exports:{}};cache.set(file,loaded.exports);
    const require=(id:string):unknown=>{
      if(id==="server-only")return {};
      if(id==="@/lib/supabase/server")return {createPublicClient:()=>database};
      if(id==="@/lib/supabase/admin")return {createAdminClient:()=>database};
      const base=id.startsWith("@/")?path.join(root,id.slice(2)):path.resolve(path.dirname(file),id);
      const target=[base,base+".ts"].find(existsSync);
      assert(target,`Unresolved test import ${id}`);
      return load(target);
    };
    const code=ts.transpileModule(readFileSync(file,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
    new Function("require","module","exports",code)(require,loaded,loaded.exports);
    return loaded.exports;
  }
  return {module:load(path.join(root,"lib/repositories/content.ts")),row,source};
}

test("public repositories rebrand persisted prose while preserving source records and identity fields",async()=>{
  const {module,row,source}=repositories();
  const read=async(name:string,method:string,args:unknown[]=[])=>{
    const Repository=module[name] as new()=>Record<string,(...args:unknown[])=>Promise<Array<Record<string,unknown>>>>;
    return (await new Repository()[method](...args))[0];
  };
  for(const [name,method,args] of [
    ["ThemeRepository","getPublished",[]],
    ["DestinationRepository","getPublished",[]],
    ["AccommodationRepository","getByDestinationIds",[[identity.id]]],
    ["VehicleRepository","getPublished",[]],
  ] as const){
    const result=await read(name,method,[...args]);
    assert.equal(result.short_description,expected);
    assert.equal(result.name,identity.name);
    assert.equal(result.slug,identity.slug);
    assert.deepEqual(result.gallery,row.gallery);
  }
  const guide=await read("GuideRepository","getMatching",[{themeIds:[],destinationIds:[],experienceIds:[]}]);
  assert.equal(guide.short_bio,expected);
  assert.equal(guide.full_bio,expected);
  assert.equal(guide.name,identity.name);
  const Hero=module.HomepageRepository as new()=>{getHero():Promise<{title:string;subtitle:string;alt:string}>};
  assert.deepEqual(await new Hero().getHero().then(({title,subtitle,alt})=>({title,subtitle,alt})),{title:expected,subtitle:expected,alt:expected});
  assert.equal(JSON.stringify(row),source);
});

test("Ceylo rebrands persisted summaries while retaining catalogue names and stable links",()=>{
  const id="00000000-0000-4000-8000-000000000001",experienceId="00000000-0000-4000-8000-000000000002";
  const destination={...identity,id,short_description:oldCopy};
  const experience={...identity,id:experienceId,short_description:oldCopy};
  const catalogue=createCeyloCatalogue([destination],[experience],[{destination_id:id,experience_id:experienceId}]);
  assert.equal(catalogue.destinations[0].summary,expected);
  assert.equal(catalogue.experiences[0].summary,expected);
  assert.equal(catalogue.destinations[0].name,identity.name);
  assert.equal(catalogue.experiences[0].slug,identity.slug);
  assert.equal(destination.short_description,oldCopy);
});
