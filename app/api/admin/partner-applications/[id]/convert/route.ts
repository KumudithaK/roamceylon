import {NextResponse} from "next/server";
import {z} from "zod";
import {authenticatedStaff} from "@/lib/admin/authenticated-staff";
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
  const actor=await authenticatedStaff(request,"suppliers.manage");
  if(!actor.authorized)return NextResponse.json({error:actor.status===401?"Unauthorized.":"Forbidden."},{status:actor.status});
  const id=(await params).id;if(!z.uuid().safeParse(id).success)return NextResponse.json({error:"Invalid partner application."},{status:400});
  const {data,error}=await actor.database.rpc("convert_partner_application_command",{
    p_application_id:id,p_actor_id:actor.user.id,p_expected_partner_type:null,p_idempotency_key:`convert-${id}`
  } as never);
  if(error)return NextResponse.json({error:error.message},{status:error.code==="42501"?403:400});
  const result=data as unknown as {entityType:"accommodation"|"vehicle"|"guide";entityIds:string[]};
  const section={accommodation:"stays",vehicle:"vehicles",guide:"guides"}[result.entityType];
  return NextResponse.json({editorUrl:`/admin/resources/${section}/${result.entityIds[0]}`});
}
