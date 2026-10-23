import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";
import test from "node:test";
import sharp from "sharp";
import {PDFDocument,PDFName,PDFRawStream} from "pdf-lib";
import ts from "typescript";
import {proposalSnapshot,type ProposalSnapshot} from "../lib/proposals/customer-proposal-types.ts";

const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const manifest=JSON.parse(read("package.json"));
const lock=JSON.parse(read("package-lock.json")) as {packages:Record<string,{version?:string;dependencies?:Record<string,string>;optionalDependencies?:Record<string,string>}>};
const atLeast=(value:string,minimum:string)=>{
  const a=value.split(".").map(Number),b=minimum.split(".").map(Number);
  for(let i=0;i<3;i++){if(a[i]!==b[i])return a[i]>b[i]}
  return true;
};

test("framework security versions are pinned consistently without overrides or a major migration",()=>{
  assert.equal(manifest.dependencies.next,"16.4.1");
  assert.equal(manifest.devDependencies["eslint-config-next"],"16.4.1");
  assert.equal(lock.packages["node_modules/next"].version,"16.4.1");
  assert.equal(lock.packages["node_modules/eslint-config-next"].version,"16.4.1");
  assert.equal(lock.packages["node_modules/next"].optionalDependencies?.sharp,"^0.35.5");
  assert.equal(Object.hasOwn(manifest,"overrides"),false);
  assert.equal(manifest.dependencies.react,"^19.2.4");
  assert.equal(lock.packages["node_modules/react"].version,lock.packages["node_modules/react-dom"].version);
  const next=JSON.parse(read("node_modules/next/package.json")),image=JSON.parse(read("node_modules/sharp/package.json"));
  assert.equal(next.engines.node,">=20.9.0");assert.equal(image.engines.node,">=20.9.0");
  assert(atLeast(process.versions.node,"20.9.0"));
});

test("every resolved Sharp copy and native image dependency meets the reviewed patched floor",()=>{
  const copies=Object.entries(lock.packages).filter(([path])=>/(?:^|\/)node_modules\/sharp$/.test(path));
  assert(copies.length>0);
  for(const [path,value] of copies)assert(atLeast(value.version!,"0.35.5"),path);
  assert(atLeast(sharp.versions.sharp,"0.35.5"));
  assert(atLeast(sharp.versions.rsvg!,"2.63.2"));
  assert(atLeast(sharp.versions.heif!,"1.23.2"));
});

test("targeted transitive DoS patches leave no older resolved copy",()=>{
  const minimum:Record<string,string>={nanoid:"3.3.18","source-map-js":"1.2.2","js-yaml":"4.3.2"};
  for(const [path,value] of Object.entries(lock.packages)){
    const name=path.split("node_modules/").at(-1)!;
    if(minimum[name])assert(atLeast(value.version!,minimum[name]),path);
    if(name==="brace-expansion")assert(atLeast(value.version!,value.version!.startsWith("1.")?"1.1.21":"5.0.12"),path);
  }
  assert.equal(lock.packages["node_modules/fastq"].version,"1.20.1","Unrelated lockfile update must stay excluded");
});

test("patched Sharp decodes the existing Ceylo WebP and brand PNG without asset changes",async()=>{
  for(const path of ["public/partner-demo/ceylo-companion-cutout.webp","public/brand/the-ceylon-edition-emblem.png"]){
    const data=readFileSync(new URL("../"+path,import.meta.url));
    const image=await sharp(data).resize(64,64,{fit:"inside"}).png().toBuffer();
    const result=await sharp(image).metadata();
    assert.equal(result.format,"png");assert(result.width!<=64&&result.height!<=64);
  }
});

for(const format of ["png","jpeg","webp","avif"] as const){
  test(`patched Sharp safely encodes and decodes a bounded in-memory ${format} image`,async()=>{
    const bytes=await sharp({create:{width:8,height:8,channels:3,background:{r:11,g:48,b:42}}}).toFormat(format).toBuffer();
    const result=await sharp(bytes).raw().toBuffer({resolveWithObject:true});
    assert.equal(result.info.width,8);assert.equal(result.info.height,8);assert(result.data.length>0);
  });
}

test("actual proposal PDF exporter preserves PNG logo/QR generation under the patched framework",async()=>{
  const snapshot:ProposalSnapshot={schemaVersion:1,generatedAt:"2030-01-01T00:00:00Z",proposalReference:"LOCAL-SECURITY",version:1,
    brand:{name:"The Ceylon Edition",line:"IN-PROCESS COMPATIBILITY TEST",logo:"/brand/the-ceylon-edition-emblem.png"},
    traveller:{name:"In-process Test",email:"not-sent@example.test",adults:1,children:0,infants:0,total:1,requirements:[]},
    journey:{startDate:"2030-01-01",endDate:"2030-01-02",days:2,nights:1,pickup:"Test pickup",dropoff:"Test dropoff",route:[]},
    introduction:"Local binary-generation test only.",destinations:[],days:[],stays:[],transport:[],guides:[],experiences:[],inclusions:[],exclusions:[],optionalItems:[],
    pricing:{currency:"USD",total:1.25,perPerson:1.25,breakdown:[],allInclusive:true},
    payment:{depositAmount:null,depositDueLabel:"Test only",balanceAmount:null,paidAmount:0,status:"not_started"},
    importantInformation:[],terms:"",nextSteps:[],contact:{hotline:"IN-PROCESS TEST ONLY",whatsappUrl:"https://example.test/not-sent",facebookUrl:"",address:"LOCAL TEST ONLY"}
  };
  const png=readFileSync(new URL("../public/brand/the-ceylon-edition-emblem.png",import.meta.url));
  const external=createRequire(import.meta.url),exports={} as {exportProposalPdf:(p:unknown,e:unknown)=>Promise<void>};
  const require=(name:string)=>name==="./customer-proposal-types"?{proposalSnapshot}:external(name);
  const captured:{blob?:Blob;name?:string;clicks:number;revoked:boolean;fetches:string[]}={clicks:0,revoked:false,fetches:[]};
  const anchor={href:"",download:"",click:()=>{captured.clicks++;captured.name=anchor.download}};
  const output=ts.transpileModule(read("lib/proposals/export-proposal-pdf.ts"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  new Function("require","exports","fetch","document","URL","setTimeout",output)(require,exports,
    async(url:string)=>{captured.fetches.push(url);return new Response(png)},
    {createElement:(tag:string)=>{assert.equal(tag,"a");return anchor}},
    {createObjectURL:(blob:Blob)=>{captured.blob=blob;return "blob:owned-in-process-only"},revokeObjectURL:()=>{captured.revoked=true}},
    (callback:()=>void)=>{callback();return 0});
  await exports.exportProposalPdf({proposal_reference:"LOCAL-SECURITY",version:1,customer_snapshot:snapshot},{name:"In-process Test"});
  assert(captured.blob);assert.equal(captured.clicks,1);assert.equal(captured.revoked,true);
  assert.equal(captured.name,"local-security-v1-journey-proposal.pdf");assert.equal(captured.fetches.length,2);
  const pdf=await PDFDocument.load(await captured.blob.arrayBuffer());
  assert(pdf.getPageCount()>0);assert.equal(pdf.getTitle(),"LOCAL-SECURITY - The Ceylon Edition Journey Proposal");
  const images=pdf.context.enumerateIndirectObjects().filter(([,object])=>object instanceof PDFRawStream&&object.dict.get(PDFName.of("Subtype"))?.toString()==="/Image");
  assert(images.length>=2,"Both PNG inputs must be embedded");
});
