import {NextResponse} from "next/server";
import {z} from "zod";
import {authenticatedStaff} from "@/lib/admin/authenticated-staff";

const bodySchema=z.object({
  action:z.enum(["start_review","request_information","approve","reject","save_notes"]),
  note:z.string().max(4000).default(""),
  idempotencyKey:z.string().min(8).max(160)
}).strict();

export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
  const actor=await authenticatedStaff(request,"suppliers.manage");
  if(!actor.authorized)return NextResponse.json({error:actor.status===401?"Unauthorized.":"Forbidden."},{status:actor.status});
  const applicationId=(await params).id;if(!z.uuid().safeParse(applicationId).success)return NextResponse.json({error:"Invalid partner application."},{status:400});
  const parsed=bodySchema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"The partner review request is invalid."},{status:400});
  const {data,error}=await actor.database.rpc("review_partner_application_command",{
    p_application_id:applicationId,p_action:parsed.data.action,p_actor_id:actor.user.id,
    p_note:parsed.data.note,p_idempotency_key:parsed.data.idempotencyKey
  } as never);
  if(error)return NextResponse.json({error:error.message},{status:error.code==="42501"?403:400});
  return NextResponse.json(data);
}
