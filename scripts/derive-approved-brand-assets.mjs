/**
 * Faithful raster derivatives only; no tracing, drawing, recolouring or AI generation.
 * Run with the human-approved original path. The source is archived byte-for-byte.
 * Transparent extraction removes the near-white raster matte; solid artwork is untouched.
 */
import sharp from "sharp";
import {copyFile,mkdir,readFile,writeFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const approvedSource=process.argv[2];
if(!approvedSource)throw new Error("Supply the exact human-approved raster source path.");
const bytes=await readFile(approvedSource);
const sourceSha=createHash("sha256").update(bytes).digest("hex");
if(sourceSha!=="5de54200e42d8486099ba4e085a28ba5ca66558c16b929ca3c9f5e5e433c3afa")throw new Error("Source is not the approved Batch 1 raster master.");
const {data,info}=await sharp(bytes).removeAlpha().raw().toBuffer({resolveWithObject:true});
if(info.width!==1536||info.height!==1024||info.channels!==3)throw new Error("Unexpected approved source dimensions; review the crop before proceeding.");
const rgba=Buffer.alloc(info.width*info.height*4);
for(let pixel=0;pixel<info.width*info.height;pixel++){
  const i=pixel*3,o=pixel*4;
  const minimum=Math.min(data[i],data[i+1],data[i+2]);
  // A narrow white-matte ramp preserves anti-aliased edges without a white rectangle.
  const alpha=Math.max(0,Math.min(1,(245-minimum)/20));
  for(let channel=0;channel<3;channel++){
    rgba[o+channel]=alpha===0?0:Math.max(0,Math.min(255,Math.round((data[i+channel]-255*(1-alpha))/alpha)));
  }
  rgba[o+3]=Math.round(alpha*255);
}
const sourceDir=path.join(root,"assets/brand");
const webDir=path.join(root,"public/brand");
await mkdir(sourceDir,{recursive:true});
await mkdir(webDir,{recursive:true});
await copyFile(approvedSource,path.join(sourceDir,"the-ceylon-edition-approved-master.png"));
const fullCrop={left:80,top:24,width:1380,height:940};
const emblemCrop={left:588,top:32,width:396,height:580};
const raster=()=>sharp(rgba,{raw:{width:info.width,height:info.height,channels:4}});
await raster().extract(fullCrop).resize({width:960}).webp({lossless:true,effort:6}).toFile(path.join(webDir,"the-ceylon-edition-lockup.webp"));
await raster().extract(emblemCrop).resize({height:320}).png({compressionLevel:9}).toFile(path.join(webDir,"the-ceylon-edition-emblem.png"));
await raster().extract(emblemCrop).resize({width:64,height:64,fit:"contain",background:{r:0,g:0,b:0,alpha:0}}).png({compressionLevel:9}).toFile(path.join(root,"app/icon.png"));
const derivatives=[];
for(const relative of ["public/brand/the-ceylon-edition-lockup.webp","public/brand/the-ceylon-edition-emblem.png","app/icon.png"]){
  const result=await readFile(path.join(root,relative));
  const metadata=await sharp(result).metadata();
  derivatives.push({path:relative,width:metadata.width,height:metadata.height,bytes:result.length,sha256:createHash("sha256").update(result).digest("hex")});
}
await writeFile(path.join(sourceDir,"raster-provenance.json"),JSON.stringify({
  status:"Human-approved raster master; not a vector master",
  sourceFilename:path.basename(approvedSource),sourceSha256:sourceSha,
  sourceSize:{width:info.width,height:info.height},
  processing:"Near-white matte extraction (minimum channel 225–245), no trace/redraw/recolour; fixed lossless crops; resized raster outputs. Solid source pixels with minimum channel <=225 are unchanged before resizing.",
  fullCrop,emblemCrop,derivatives
},null,2)+"\n");
console.log(JSON.stringify({sourceSha,derivatives},null,2));
