import {createHash} from "node:crypto";
import {z} from "zod";

export class PublicInputError extends Error{
  readonly code:"PAYLOAD_TOO_LARGE"|"INVALID_BODY";
  constructor(code:"PAYLOAD_TOO_LARGE"|"INVALID_BODY",message:string){super(message);this.code=code;this.name="PublicInputError"}
}

export async function readBoundedJson(request:Request,maximumBytes:number):Promise<unknown>{
  const declared=Number(request.headers.get("content-length")??0);
  if(Number.isFinite(declared)&&declared>maximumBytes)throw new PublicInputError("PAYLOAD_TOO_LARGE","The request is too large.");
  if(!request.body)throw new PublicInputError("INVALID_BODY","The request body is missing.");
  const reader=request.body.getReader();const decoder=new TextDecoder();let size=0,text="";
  try{
    while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>maximumBytes){await reader.cancel();throw new PublicInputError("PAYLOAD_TOO_LARGE","The request is too large.");}text+=decoder.decode(value,{stream:true});}
    text+=decoder.decode();
  }catch(error){if(error instanceof PublicInputError)throw error;throw new PublicInputError("INVALID_BODY","The request body is invalid.");}
  try{return JSON.parse(text)}catch{throw new PublicInputError("INVALID_BODY","The request body is invalid.")}
}

export const safeHttpUrlSchema=z.string().trim().max(500).refine(value=>{
  if(!value)return true;
  try{return ["http:","https:"].includes(new URL(value).protocol)}catch{return false}
},{message:"Use a complete http or https URL."});

export const publicSubmissionDigest=(value:unknown)=>createHash("sha256").update(JSON.stringify(value)).digest("hex");
export const anonymousIdentityDigest=(value:string)=>createHash("sha256").update(value.trim().toLowerCase()).digest("hex");

const attempts=new Map<string,{count:number;reset:number}>();
export function publicAttemptLimited(scope:string,identity:string,maximum:number,windowMs:number){
  const now=Date.now(),key=`${scope}:${anonymousIdentityDigest(identity)}`,current=attempts.get(key);
  if(!current||current.reset<=now){attempts.set(key,{count:1,reset:now+windowMs});return false}
  current.count+=1;return current.count>maximum;
}

const signatures:Record<string,(bytes:Uint8Array)=>boolean>={
  "application/pdf":bytes=>String.fromCharCode(...bytes.slice(0,5))==="%PDF-",
  "image/jpeg":bytes=>bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff,
  "image/png":bytes=>[0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a].every((value,index)=>bytes[index]===value),
  "image/webp":bytes=>String.fromCharCode(...bytes.slice(0,4))==="RIFF"&&String.fromCharCode(...bytes.slice(8,12))==="WEBP"
};
export async function fileMatchesDeclaredType(file:File){
  const signature=signatures[file.type];if(!signature)return false;
  const bytes=new Uint8Array(await file.slice(0,16).arrayBuffer());return signature(bytes);
}
