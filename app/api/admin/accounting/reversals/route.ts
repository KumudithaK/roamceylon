import {NextResponse} from "next/server";
import {z} from "zod";
import {authenticatedStaff} from "@/lib/admin/authenticated-staff";

const schema=z.object({accountId:z.uuid(),settlementId:z.uuid(),paymentAmount:z.coerce.number().min(0),waiverAmount:z.coerce.number().min(0),paymentDate:z.iso.date(),reason:z.string().trim().min(10).max(500)}).superRefine((value,context)=>{if(value.paymentAmount+value.waiverAmount<=0)context.addIssue({code:"custom",message:"Enter a payment or waiver amount to reverse."})});

export async function POST(request:Request){
  const actor=await authenticatedStaff(request,"finance.payments.manage");if(!actor)return NextResponse.json({error:"Unauthorized."},{status:401});
  if(actor.profile.role!=="admin")return NextResponse.json({error:"Only an administrator can reverse posted supplier settlements."},{status:403});
  const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:parsed.error.issues[0]?.message??"Check the correction."},{status:400});
  const {database,user}=actor,value=parsed.data;
  const [{data:account},{data:settlement},{data:cancellation}]=await Promise.all([
    database.from("journey_accounts").select("*").eq("id",value.accountId).maybeSingle(),
    database.from("journey_settlements").select("*").eq("id",value.settlementId).eq("account_id",value.accountId).maybeSingle(),
    database.from("journey_cancellation_cases").select("assessment_locked_at").eq("account_id",value.accountId).maybeSingle()
  ]);
  if(!account||!settlement)return NextResponse.json({error:"Supplier settlement not found."},{status:404});
  if(account.status==="closed")return NextResponse.json({error:"A closed account cannot be corrected."},{status:409});
  if(cancellation?.assessment_locked_at)return NextResponse.json({error:"Reopen the completed cancellation assessment before changing supplier settlements."},{status:409});
  if(value.paymentAmount>settlement.amount_paid+.005)return NextResponse.json({error:"Payment reversal exceeds the amount paid."},{status:409});
  if(value.waiverAmount>settlement.waived_amount+.005)return NextResponse.json({error:"Waiver reversal exceeds the courtesy amount recorded."},{status:409});
  const inserted:string[]=[];const previousWaiver=settlement.waived_amount,previousReason=settlement.waiver_reason;
  try{
    if(value.waiverAmount>0){const next=Math.max(0,settlement.waived_amount-value.waiverAmount);const {error}=await database.from("journey_settlements").update({waived_amount:next,waiver_reason:[settlement.waiver_reason,`Reversed ${account.currency} ${value.waiverAmount.toFixed(2)}: ${value.reason}`].filter(Boolean).join("\n")}).eq("id",settlement.id);if(error)throw error}
    for(const entry of [{amount:value.paymentAmount,type:"supplier_payment_reversal" as const},{amount:value.waiverAmount,type:"supplier_waiver_reversal" as const}].filter(item=>item.amount>0)){
      const {data,error}=await database.from("accounting_transactions").insert({account_id:account.id,settlement_id:settlement.id,transaction_type:entry.type,amount:entry.amount,currency:account.currency,payment_date:value.paymentDate,payment_method:"Accounting correction",notes:value.reason,created_by:user.id}).select("id").single();if(error||!data)throw error??new Error("Correction entry could not be recorded.");inserted.push(data.id)
    }
    await database.from("accounting_lifecycle_history").insert({account_id:account.id,from_status:account.status,to_status:account.status,reason:`Supplier settlement correction for ${settlement.payee_name}: ${value.reason}`,changed_by:user.id});
    return NextResponse.json({ok:true});
  }catch(error){if(inserted.length)await database.from("accounting_transactions").delete().in("id",inserted);if(value.waiverAmount>0)await database.from("journey_settlements").update({waived_amount:previousWaiver,waiver_reason:previousReason}).eq("id",settlement.id);return NextResponse.json({error:error instanceof Error?error.message:"Settlement correction failed."},{status:500})}
}
