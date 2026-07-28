import {NextResponse} from "next/server";
import {z} from "zod";
import {authenticatedStaff} from "@/lib/admin/authenticated-staff";

export const runtime="nodejs";

const schema=z.object({
  accountId:z.uuid(),
  settlementId:z.union([z.uuid(),z.literal(""),z.null()]).optional(),
  type:z.enum(["customer_receipt","customer_refund","supplier_payment"]),
  amount:z.coerce.number().min(0).max(100000000),
  waivedAmount:z.coerce.number().min(0).max(100000000).default(0),
  waiverReason:z.string().trim().max(500).optional(),
  paymentDate:z.iso.date(),
  paymentMethod:z.string().trim().max(80).optional(),
  reference:z.string().trim().max(120).optional(),
  notes:z.string().trim().max(500).optional()
}).superRefine((value,context)=>{
  if(value.type==="supplier_payment"&&value.amount+value.waivedAmount<=0)context.addIssue({code:"custom",message:"Enter a payment or courtesy waiver."});
  if(value.type!=="supplier_payment"&&value.amount<=0)context.addIssue({code:"custom",message:"Enter a payment amount."});
  if(value.waivedAmount>0&&(!value.waiverReason||value.waiverReason.length<3))context.addIssue({code:"custom",message:"Explain the supplier courtesy waiver."});
});

const safeName=(name:string)=>name.toLowerCase().replace(/[^a-z0-9._-]+/g,"-").slice(-100);

export async function POST(request:Request){
  const actor=await authenticatedStaff(request);
  if(!actor)return NextResponse.json({error:"Unauthorized."},{status:401});
  const {database,user}=actor;
  const contentType=request.headers.get("content-type")??"";
  let receipt:File|null=null;
  let raw:unknown;
  if(contentType.includes("multipart/form-data")){
    const form=await request.formData().catch(()=>null);
    if(!form)return NextResponse.json({error:"Invalid payment form."},{status:400});
    raw=Object.fromEntries([...form.entries()].filter(([,value])=>typeof value==="string"));
    const candidate=form.get("receipt");
    receipt=candidate instanceof File&&candidate.size>0?candidate:null;
  }else raw=await request.json().catch(()=>null);
  const parsed=schema.safeParse(raw);
  if(!parsed.success)return NextResponse.json({error:parsed.error.issues[0]?.message??"Check the payment and waiver fields."},{status:400});
  const value=parsed.data;
  if(receipt){
    const allowed=["application/pdf","image/jpeg","image/png","image/webp"];
    if(!allowed.includes(receipt.type)||receipt.size>10*1024*1024)return NextResponse.json({error:"Receipt must be a PDF, JPG, PNG, or WebP file under 10 MB."},{status:400});
    if(value.type!=="supplier_payment"||value.amount<=0)return NextResponse.json({error:"Attach a receipt only when recording a supplier payment."},{status:400});
  }
  const {data:account,error:accountError}=await database.from("journey_accounts").select("*").eq("id",value.accountId).maybeSingle();
  if(accountError||!account)return NextResponse.json({error:"Journey account not found."},{status:404});
  if(account.status==="void")return NextResponse.json({error:"Payments cannot be recorded against a void account."},{status:409});
  let settlementId:string|null=null;
  let previousWaiver=0;
  let previousReason:string|null=null;
  if(value.type==="supplier_payment"){
    if(!value.settlementId)return NextResponse.json({error:"Choose a supplier settlement."},{status:400});
    const {data:settlement}=await database.from("journey_settlements").select("*").eq("id",value.settlementId).eq("account_id",account.id).maybeSingle();
    if(!settlement)return NextResponse.json({error:"Supplier settlement not found."},{status:404});
    if(settlement.status==="waived")return NextResponse.json({error:"This supplier obligation has already been fully waived."},{status:409});
    const remaining=settlement.amount_due-settlement.amount_paid-settlement.waived_amount;
    if(value.amount+value.waivedAmount>remaining+0.005)return NextResponse.json({error:"Payment and waiver exceed the outstanding supplier balance."},{status:409});
    settlementId=settlement.id;previousWaiver=settlement.waived_amount;previousReason=settlement.waiver_reason;
    if(value.waivedAmount>0){
      const reason=[settlement.waiver_reason,value.waiverReason].filter(Boolean).join("\n");
      const {error:waiverError}=await database.from("journey_settlements").update({waived_amount:settlement.waived_amount+value.waivedAmount,waiver_reason:reason}).eq("id",settlement.id);
      if(waiverError)return NextResponse.json({error:waiverError.message},{status:500});
    }
  }else if(value.type==="customer_refund"&&value.amount>account.amount_received+0.005){
    return NextResponse.json({error:"Refund exceeds the amount received from the traveller."},{status:409});
  }
  let paymentTransactionId:string|null=null;
  const transactionIds:string[]=[];
  let uploadedPath:string|null=null;
  try{
    if(value.amount>0){
      const {data:transaction,error}=await database.from("accounting_transactions").insert({
        account_id:account.id,
        settlement_id:settlementId,
        transaction_type:value.type,
        amount:value.amount,
        currency:account.currency,
        payment_date:value.paymentDate,
        payment_method:value.paymentMethod||null,
        reference:value.reference||null,
        notes:value.notes||null,
        created_by:user.id
      }).select("id").single();
      if(error||!transaction)throw new Error(error?.message??"Payment could not be recorded.");
      paymentTransactionId=transaction.id;transactionIds.push(transaction.id);
    }
    if(value.waivedAmount>0&&settlementId){
      const {data:waiver,error}=await database.from("accounting_transactions").insert({
        account_id:account.id,
        settlement_id:settlementId,
        transaction_type:"supplier_waiver",
        amount:value.waivedAmount,
        currency:account.currency,
        payment_date:value.paymentDate,
        payment_method:"Supplier courtesy",
        reference:value.reference||null,
        notes:value.waiverReason||null,
        created_by:user.id
      }).select("id").single();
      if(error||!waiver)throw new Error(error?.message??"Courtesy waiver could not be recorded.");
      transactionIds.push(waiver.id);
    }
    if(receipt&&paymentTransactionId&&settlementId){
      uploadedPath=`journey-accounts/${account.id}/${settlementId}/${paymentTransactionId}/${crypto.randomUUID()}-${safeName(receipt.name)}`;
      const {error:uploadError}=await database.storage.from("accounting-receipts").upload(uploadedPath,receipt,{contentType:receipt.type,upsert:false});
      if(uploadError)throw uploadError;
      const {error:attachmentError}=await database.from("accounting_attachments").insert({
        account_id:account.id,
        settlement_id:settlementId,
        transaction_id:paymentTransactionId,
        file_name:receipt.name,
        storage_path:uploadedPath,
        mime_type:receipt.type,
        file_size:receipt.size,
        created_by:user.id
      });
      if(attachmentError)throw attachmentError;
    }
    return NextResponse.json({ok:true},{status:201});
  }catch(error){
    if(uploadedPath)await database.storage.from("accounting-receipts").remove([uploadedPath]);
    if(transactionIds.length)await database.from("accounting_transactions").delete().in("id",transactionIds);
    if(settlementId&&value.waivedAmount>0)await database.from("journey_settlements").update({waived_amount:previousWaiver,waiver_reason:previousReason}).eq("id",settlementId);
    return NextResponse.json({error:error instanceof Error?error.message:"The payment could not be saved."},{status:500});
  }
}
