import {NextResponse} from "next/server";
import {createAdminClient} from "@/lib/supabase/admin";
import type {Json} from "@/lib/database.types";

const slug=(value:string,id:string)=>`${value.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,60)||"partner"}-${id.slice(0,6)}`;
const object=(value:Json)=>value&&typeof value==="object"&&!Array.isArray(value)?value as Record<string,Json>:{};
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
  const database=createAdminClient(),token=request.headers.get("authorization")?.replace(/^Bearer\s+/,"");
  if(!database||!token)return NextResponse.json({error:"Unauthorized."},{status:401});
  const {data:userData}=await database.auth.getUser(token);if(!userData.user)return NextResponse.json({error:"Unauthorized."},{status:401});
  const {data:profile}=await database.from("profiles").select("role").eq("id",userData.user.id).maybeSingle();
  if(!profile||!["admin","editor"].includes(profile.role))return NextResponse.json({error:"Forbidden."},{status:403});
  const id=(await params).id;const {data:application}=await database.from("partner_applications").select("*").eq("id",id).single();
  if(!application||application.status!=="approved")return NextResponse.json({error:"Approve the application before converting it."},{status:400});
  const data=object(application.application_data),baseSlug=slug(application.business_name||application.applicant_name,id);
  let table:"accommodations"|"vehicles"|"guides",type:"stays"|"vehicles"|"guides",createdIds:string[]=[];
  if(application.partner_type==="accommodation"){
    table="accommodations";type="stays";
    const {data:record,error}=await database.from(table).insert({name:application.business_name||application.applicant_name,slug:baseSlug,property_type:String(data.propertyType||""),short_description:application.introduction,address:application.address,email:application.email,phone:application.phone,status:"draft",active:true,verified:false,featured:false,is_sample:false} as never).select("id").single();
    if(error||!record)return NextResponse.json({error:error?.message||"Draft could not be created."},{status:500});createdIds=[record.id];
  }else if(application.partner_type==="vehicle"){
    table="vehicles";type="vehicles";const entries=Array.isArray(data.entries)&&data.entries.length?data.entries:[{}];
    for(let index=0;index<entries.length;index++){const entry=object(entries[index]);const {data:record,error}=await database.from(table).insert({listing_title:String(entry.model||application.business_name||"Partner vehicle"),slug:`${baseSlug}-${index+1}`,vehicle_type:String(entry.category||""),passenger_capacity:Number(entry.capacity)||null,short_description:application.introduction,email:application.email,phone:application.phone,status:"draft",active:true,verified:false,featured:false,is_sample:false} as never).select("id").single();if(error||!record)return NextResponse.json({error:error?.message||"Draft could not be created."},{status:500});createdIds.push(record.id)}
  }else{
    table="guides";type="guides";const {data:record,error}=await database.from(table).insert({name:application.business_name||application.applicant_name,slug:baseSlug,short_bio:application.introduction,languages:String(data.languages||"").split(",").map(item=>item.trim()).filter(Boolean),years_experience:Number(data.yearsExperience)||null,specialities:String(data.specialistKnowledge||"").split(",").map(item=>item.trim()).filter(Boolean),email:application.email,phone:application.phone,status:"draft",active:true,verified:false,featured:false,is_sample:false} as never).select("id").single();if(error||!record)return NextResponse.json({error:error?.message||"Draft could not be created."},{status:500});createdIds=[record.id];
  }
  await database.from("partner_applications").update({status:"converted",reviewed_at:new Date().toISOString(),reviewed_by:userData.user.id,application_data:{...data,convertedListingIds:createdIds}}).eq("id",id);
  await database.from("partner_application_history").insert({application_id:id,from_status:"approved",to_status:"converted",note:`Created ${createdIds.length} unpublished draft listing(s).`,changed_by:userData.user.id});
  return NextResponse.json({editorUrl:`/admin/resources/${type}/${createdIds[0]}`});
}
