import {NextResponse} from "next/server";
import {z} from "zod";
import {authenticatedStaff} from "@/lib/admin/authenticated-staff";
import {enquiryLifecycleActions,type EnquiryLifecycleAction} from "@/lib/enquiries/enquiry-lifecycle";
import type {StaffPermission} from "@/lib/admin/permissions";

const schema=z.object({enquiryId:z.uuid(),action:z.enum(enquiryLifecycleActions).optional(),internalNotes:z.string().max(10000).optional(),idempotencyKey:z.string().trim().min(8).max(160).optional()}).strict();
const permissionFor=(action:EnquiryLifecycleAction):StaffPermission=>["prepare_operations","start_travel","complete_journey"].includes(action)?"operations.manage":action==="record_deposit"?"finance.payments.manage":action==="cancel_journey"||action==="archive_journey"?"users.manage":"journey.design.edit";

export async function POST(request:Request){
  const body=await request.json().catch(()=>null),parsed=schema.safeParse(body);
  if(!parsed.success)return NextResponse.json({error:parsed.error.issues[0]?.message??"Invalid lifecycle request."},{status:400});
  if(parsed.data.action&&parsed.data.internalNotes!==undefined)return NextResponse.json({error:"Save internal notes separately before performing a journey lifecycle action."},{status:400});
  const required=parsed.data.action?permissionFor(parsed.data.action):"journey.design.edit";
  const actor=await authenticatedStaff(request,required);
  if(!actor.authorized)return NextResponse.json({error:actor.status===401?"Unauthorized.":"You do not have permission to perform this journey action."},{status:actor.status});
  if(parsed.data.internalNotes!==undefined){
    const {error}=await actor.database.from("enquiries").update({internal_notes:parsed.data.internalNotes}).eq("id",parsed.data.enquiryId);
    if(error)return NextResponse.json({error:error.message},{status:500});
  }
  if(!parsed.data.action)return NextResponse.json({ok:true});
  const operationalActions=["prepare_operations","start_travel","complete_journey"] as const;
  const operational=operationalActions.find(action=>action===parsed.data.action);
  const {data,error}=operational
    ?await actor.database.rpc("execute_operational_journey_command",{p_enquiry_id:parsed.data.enquiryId,p_action:operational,p_actor_id:actor.user.id,p_reason:null,p_idempotency_key:parsed.data.idempotencyKey??`operational:${parsed.data.enquiryId}:${operational}`})
    :await actor.database.rpc("execute_enquiry_transition",{p_enquiry_id:parsed.data.enquiryId,p_action:parsed.data.action,p_actor_id:actor.user.id,p_reason:null});
  if(error)return NextResponse.json({error:error.message},{status:["P0001","23514","55000"].includes(error.code??"")?409:error.code==="42501"?403:500});
  const raw=Array.isArray(data)?data[0]:data;
  const result=raw&&typeof raw==="object"&&!Array.isArray(raw)?raw:{};
  return NextResponse.json({ok:true,status:"status" in result?result.status:undefined,changed:"changed" in result?result.changed:undefined});
}
