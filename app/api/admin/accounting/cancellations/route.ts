import {NextResponse} from "next/server";
import {z} from "zod";
import {authenticatedStaff} from "@/lib/admin/authenticated-staff";
import {calculateCancellationPosition} from "@/lib/accounting/cancellation";

const settlementSchema=z.object({
  action:z.literal("review_settlement"),
  accountId:z.uuid(),
  settlementId:z.uuid(),
  resolution:z.enum(["cancelled_without_cost","recoverable","waived","non_recoverable"]),
  nonRecoverableAmount:z.coerce.number().min(0).max(100000000),
  notes:z.string().trim().max(500).optional()
});
const calculateSchema=z.object({
  action:z.literal("calculate"),
  accountId:z.uuid(),
  cancellationFee:z.coerce.number().min(0).max(100000000),
  otherNonRecoverableCost:z.coerce.number().min(0).max(100000000),
  notes:z.string().trim().max(1000).optional()
});
const transitionSchema=z.object({
  action:z.enum(["approve","close"]),
  accountId:z.uuid()
});
const schema=z.discriminatedUnion("action",[settlementSchema,calculateSchema,transitionSchema]);

export async function POST(request:Request){
  const actor=await authenticatedStaff(request);
  if(!actor)return NextResponse.json({error:"Unauthorized."},{status:401});
  const {database,user}=actor;
  const parsed=schema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:parsed.error.issues[0]?.message??"Check the cancellation details."},{status:400});
  const value=parsed.data;
  const [{data:account},{data:cancellation}]=await Promise.all([
    database.from("journey_accounts").select("*").eq("id",value.accountId).maybeSingle(),
    database.from("journey_cancellation_cases").select("*").eq("account_id",value.accountId).maybeSingle()
  ]);
  if(!account)return NextResponse.json({error:"Journey account not found."},{status:404});
  if(!cancellation)return NextResponse.json({error:"Cancel the Traveller Enquiry before assessing a refund."},{status:409});

  if(value.action==="review_settlement"){
    if(["approved","part_refunded","refunded","closed"].includes(cancellation.status))return NextResponse.json({error:"Supplier outcomes cannot be changed after the refund is approved."},{status:409});
    const {data:settlement}=await database.from("journey_settlements").select("*").eq("id",value.settlementId).eq("account_id",account.id).maybeSingle();
    if(!settlement)return NextResponse.json({error:"Supplier commitment not found."},{status:404});
    const amount=value.resolution==="non_recoverable"?value.nonRecoverableAmount:0;
    if(amount>settlement.amount_due+0.005)return NextResponse.json({error:"Non-recoverable cost cannot exceed the supplier commitment."},{status:409});
    if(value.resolution==="non_recoverable"&&amount<=0)return NextResponse.json({error:"Enter the final non-recoverable supplier cost."},{status:400});
    if(["cancelled_without_cost","waived"].includes(value.resolution)&&settlement.amount_paid>0.005)return NextResponse.json({error:"This supplier has already been paid. Mark it recoverable and record the funds returned, or record the amount as non-recoverable."},{status:409});
    if(value.resolution==="recoverable"&&settlement.amount_paid<=0.005)return NextResponse.json({error:"Nothing has been paid to this supplier. Choose cancelled without cost or waived instead."},{status:409});
    const {error}=await database.from("journey_settlements").update({
      cancellation_resolution:value.resolution,
      cancellation_non_recoverable_amount:amount,
      cancellation_notes:value.notes||null,
      cancellation_reviewed_at:new Date().toISOString(),
      cancellation_reviewed_by:user.id
    }).eq("id",settlement.id);
    if(error)return NextResponse.json({error:error.message},{status:500});
    if(cancellation.status==="calculated")await database.from("journey_cancellation_cases").update({status:"assessment",calculated_at:null,approved_refund:null}).eq("id",cancellation.id);
    return NextResponse.json({ok:true});
  }

  const {data:settlements,error:settlementError}=await database.from("journey_settlements").select("*").eq("account_id",account.id);
  if(settlementError)return NextResponse.json({error:settlementError.message},{status:500});
  const rows=settlements??[];
  if(rows.some(row=>row.cancellation_resolution==="not_reviewed"))return NextResponse.json({error:"Review every supplier commitment before calculating the traveller refund."},{status:409});

  if(value.action==="calculate"){
    if(["approved","part_refunded","refunded","closed"].includes(cancellation.status))return NextResponse.json({error:"The approved refund can no longer be recalculated."},{status:409});
    if(value.cancellationFee+value.otherNonRecoverableCost>0&&(!value.notes||value.notes.length<3))return NextResponse.json({error:"Explain the cancellation fee or other non-recoverable costs."},{status:400});
    const {data:entries,error:entryError}=await database.from("accounting_transactions").select("transaction_type,amount").eq("account_id",account.id);
    if(entryError)return NextResponse.json({error:entryError.message},{status:500});
    const customerPaid=(entries??[]).filter(row=>row.transaction_type==="customer_receipt").reduce((total,row)=>total+row.amount,0);
    const supplierNonRecoverable=rows.reduce((total,row)=>total+row.cancellation_non_recoverable_amount,0);
    const {calculatedRefund}=calculateCancellationPosition({customerPaid,supplierNonRecoverable,cancellationFee:value.cancellationFee,otherNonRecoverableCost:value.otherNonRecoverableCost});
    const {error}=await database.from("journey_cancellation_cases").update({
      status:"calculated",
      customer_paid:customerPaid,
      supplier_non_recoverable:supplierNonRecoverable,
      cancellation_fee:value.cancellationFee,
      other_non_recoverable_cost:value.otherNonRecoverableCost,
      calculated_refund:calculatedRefund,
      approved_refund:null,
      calculation_notes:value.notes||null,
      calculated_at:new Date().toISOString(),
      approved_at:null,
      approved_by:null
    }).eq("id",cancellation.id);
    if(error)return NextResponse.json({error:error.message},{status:500});
    return NextResponse.json({ok:true,calculatedRefund});
  }

  if(value.action==="approve"){
    if(cancellation.status!=="calculated")return NextResponse.json({error:"Calculate the refund before approving it."},{status:409});
    const approvedAt=new Date().toISOString();
    const approvedStatus=account.amount_refunded+0.005>=cancellation.calculated_refund?"refunded":"approved";
    const {error}=await database.from("journey_cancellation_cases").update({
      status:approvedStatus,approved_refund:cancellation.calculated_refund,approved_at:approvedAt,approved_by:user.id
    }).eq("id",cancellation.id);
    if(error)return NextResponse.json({error:error.message},{status:500});
    if(approvedStatus==="refunded")await database.from("journey_accounts").update({status:"refunded"}).eq("id",account.id);
    await database.from("accounting_lifecycle_history").insert({
      account_id:account.id,from_status:account.status,to_status:"refund_pending",enquiry_status:"cancelled",
      reason:`Traveller refund of ${account.currency} ${cancellation.calculated_refund.toFixed(2)} approved.`,changed_by:user.id
    });
    return NextResponse.json({ok:true});
  }

  if(cancellation.status!=="refunded")return NextResponse.json({error:"Pay the full approved refund before closing the cancellation."},{status:409});
  if(rows.some(row=>row.cancellation_resolution==="recoverable"&&row.amount_paid>0.005))return NextResponse.json({error:"Record all expected supplier recoveries before closing the cancellation."},{status:409});
  const {error}=await database.from("journey_cancellation_cases").update({status:"closed",closed_at:new Date().toISOString(),closed_by:user.id}).eq("id",cancellation.id);
  if(error)return NextResponse.json({error:error.message},{status:500});
  await database.from("accounting_lifecycle_history").insert({
    account_id:account.id,from_status:account.status,to_status:"refunded",enquiry_status:"cancelled",
    reason:"Cancellation finances closed after the approved traveller refund was paid.",changed_by:user.id
  });
  return NextResponse.json({ok:true});
}
