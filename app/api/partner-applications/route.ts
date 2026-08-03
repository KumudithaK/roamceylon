import {NextResponse} from "next/server";
import {z} from "zod";
import {createAdminClient} from "@/lib/supabase/admin";
import type {Json} from "@/lib/database.types";

export const runtime="nodejs";

const schema=z.object({
  partnerType:z.enum(["accommodation","vehicle","guide"]),
  applicantName:z.string().trim().min(2).max(120),
  businessName:z.string().trim().min(2).max(160),
  email:z.email().max(200),
  phone:z.string().trim().min(7).max(40),
  preferredContactMethod:z.enum(["email","phone","whatsapp"]),
  address:z.string().trim().min(5).max(400),
  district:z.string().trim().min(2).max(80),
  province:z.string().trim().min(2).max(80),
  website:z.union([z.url(),z.literal("")]),
  socialUrl:z.union([z.url(),z.literal("")]),
  introduction:z.string().trim().min(30).max(2000),
  heardFrom:z.string().trim().min(2).max(100),
  consent:z.literal(true),
  accurate:z.literal(true),
  honeypot:z.literal(""),
  applicationData:z.record(z.string(),z.unknown())
});

const attempts=new Map<string,{count:number;reset:number}>();
const limited=(key:string)=>{
  const now=Date.now(),current=attempts.get(key);
  if(!current||current.reset<now){attempts.set(key,{count:1,reset:now+60*60*1000});return false}
  current.count+=1;return current.count>5;
};
const safeName=(name:string)=>name.toLowerCase().replace(/[^a-z0-9._-]+/g,"-").slice(-100);

export async function POST(request:Request){
  const ip=request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||"local";
  const form=await request.formData().catch(()=>null);
  if(!form)return NextResponse.json({error:"Invalid application."},{status:400});
  let raw:unknown=null;try{raw=JSON.parse(String(form.get("payload")||"null"))}catch{}
  const parsed=schema.safeParse(raw);
  if(!parsed.success){
    const fields=parsed.error.flatten().fieldErrors;
    const invalid=Object.entries(fields).filter(([,messages])=>messages?.length).map(([field])=>field);
    return NextResponse.json({error:`Please check: ${invalid.join(", ")||"the required fields"}.`,fields},{status:400});
  }
  if(limited(ip))return NextResponse.json({error:"Too many completed applications were submitted from this connection. Please try again later."},{status:429});
  const database=createAdminClient();
  if(!database)return NextResponse.json({error:"Applications are temporarily unavailable."},{status:503});
  const value=parsed.data;
  const {data:application,error}=await database.from("partner_applications").insert({
    partner_type:value.partnerType,applicant_name:value.applicantName,business_name:value.businessName,email:value.email,
    phone:value.phone,preferred_contact_method:value.preferredContactMethod,address:value.address,district:value.district,
    province:value.province,website:value.website||null,social_url:value.socialUrl||null,introduction:value.introduction,
    application_data:{...value.applicationData,heardFrom:value.heardFrom} as Json,status:"submitted",submitted_at:new Date().toISOString()
  }).select("id,application_reference,partner_type").single();
  if(error||!application)return NextResponse.json({error:"We could not save your application."},{status:500});
  const plural={accommodation:"accommodation",vehicle:"vehicles",guide:"guides"}[value.partnerType];
  const uploaded:Array<{bucket:string;path:string}>=[];
  const fileRows=[];
  let mediaCount=0,documentCount=0;
  try{
    for(const [field,entry] of form.entries()){
      if(!(entry instanceof File)||!["media","documents"].includes(field))continue;
      const media=field==="media";
      if(media)mediaCount+=1;else documentCount+=1;
      if(mediaCount>10||documentCount>6)throw new Error("Too many files");
      const allowed=media?["image/jpeg","image/png","image/webp"]:["application/pdf","image/jpeg","image/png"];
      const limit=media?10*1024*1024:15*1024*1024;
      if(!allowed.includes(entry.type)||entry.size>limit)throw new Error("Unsupported file");
      const bucket=media?"partner-application-media" as const:"partner-application-documents" as const;
      const path=`partner-applications/${plural}/${application.id}/${crypto.randomUUID()}-${safeName(entry.name)}`;
      const {error:uploadError}=await database.storage.from(bucket).upload(path,entry,{contentType:entry.type,upsert:false});
      if(uploadError)throw uploadError;
      uploaded.push({bucket,path});
      fileRows.push({application_id:application.id,file_type:media?"marketing_media":"verification_document",file_name:entry.name,storage_path:path,bucket_id:bucket,mime_type:entry.type,is_private:true,sort_order:fileRows.length});
    }
    if(fileRows.length){
      const {error:fileError}=await database.from("partner_application_files").insert(fileRows);
      if(fileError)throw fileError;
    }
    await database.from("partner_application_history").insert({application_id:application.id,to_status:"submitted",note:"Application submitted through the partner portal."});
    return NextResponse.json({reference:application.application_reference,type:application.partner_type},{status:201});
  }catch{
    await Promise.all(uploaded.map(item=>database.storage.from(item.bucket).remove([item.path])));
    await database.from("partner_applications").delete().eq("id",application.id);
    return NextResponse.json({error:"One or more files could not be uploaded. Check their type and size, then try again."},{status:400});
  }
}
