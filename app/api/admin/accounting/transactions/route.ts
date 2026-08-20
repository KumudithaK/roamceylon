import {NextResponse} from "next/server";
import {z} from "zod";
import {authenticatedStaff} from "@/lib/admin/authenticated-staff";
import {fileMatchesDeclaredType} from "@/lib/security/public-input";

export const runtime="nodejs";

const schema=z.object({
  accountId:z.uuid(),settlementId:z.union([z.uuid(),z.literal(""),z.null()]).optional(),
  type:z.enum(["customer_receipt","customer_refund","supplier_payment","supplier_recovery"]),
  amount:z.coerce.number().min(0).max(100000000),waivedAmount:z.coerce.number().min(0).max(100000000).default(0),
  waiverReason:z.string().trim().max(500).optional(),paymentDate:z.iso.date(),paymentMethod:z.string().trim().max(80).optional(),
  reference:z.string().trim().max(120).optional(),notes:z.string().trim().max(500).optional(),idempotencyKey:z.string().trim().min(8).max(180).optional()
}).strict().superRefine((value,context)=>{
  if(value.type==="supplier_payment"&&value.amount+value.waivedAmount<=0)context.addIssue({code:"custom",message:"Enter a payment or courtesy waiver."});
  if(value.type!=="supplier_payment"&&value.amount<=0)context.addIssue({code:"custom",message:"Enter a payment amount."});
  if(value.waivedAmount>0&&(!value.waiverReason||value.waiverReason.length<3))context.addIssue({code:"custom",message:"Explain the supplier courtesy waiver."});
});

const safeName=(name:string)=>name.toLowerCase().replace(/\.+/g,"-").replace(/[^a-z0-9_-]+/g,"-").replace(/^-+|-+$/g,"").slice(-100)||"receipt";
const statusFor=(message:string)=>/not found/i.test(message)?404:/not authorised|permission/i.test(message)?403:/exceed|closed|inactive|refund|cancellation|outstanding|idempotency/i.test(message)?409:400;

export async function POST(request:Request){
  const actor=await authenticatedStaff(request,"finance.payments.manage");
  if(!actor.authorized)return NextResponse.json({error:actor.status===401?"Unauthorized.":"You do not have permission to manage payments."},{status:actor.status});
  const contentType=request.headers.get("content-type")??"",declaredHeader=request.headers.get("content-length"),declared=Number(declaredHeader);if(contentType.includes("multipart/form-data")&&(!declaredHeader||!Number.isFinite(declared)||declared<=0))return NextResponse.json({error:"A bounded payment attachment is required."},{status:411});if(Number.isFinite(declared)&&declared>12*1024*1024)return NextResponse.json({error:"The payment attachment is too large."},{status:413});
  const {database,user}=actor;let receipt:File|null=null;let raw:unknown;
  if(contentType.includes("multipart/form-data")){
    const form=await request.formData().catch(()=>null);if(!form)return NextResponse.json({error:"Invalid payment form."},{status:400});
    raw=Object.fromEntries([...form.entries()].filter(([,value])=>typeof value==="string"));const candidate=form.get("receipt");receipt=candidate instanceof File&&candidate.size>0?candidate:null;
  }else raw=await request.json().catch(()=>null);
  const parsed=schema.safeParse(raw);if(!parsed.success)return NextResponse.json({error:parsed.error.issues[0]?.message??"Check the payment and waiver fields."},{status:400});
  const value=parsed.data;
  if(receipt){const allowed=["application/pdf","image/jpeg","image/png","image/webp"];if(!allowed.includes(receipt.type)||receipt.size>10*1024*1024||!await fileMatchesDeclaredType(receipt))return NextResponse.json({error:"Receipt must be a genuine PDF, JPG, PNG, or WebP file under 10 MB."},{status:400});if(value.type!=="supplier_payment"||value.amount<=0)return NextResponse.json({error:"Attach a receipt only when recording a supplier payment."},{status:400})}
  const transactionId=crypto.randomUUID();const settlementId=value.settlementId||null;
  const key=value.idempotencyKey??(value.reference?`manual:${value.type}:${value.reference}`:`manual:${value.type}:${crypto.randomUUID()}`);
  let uploadedPath:string|null=null;
  try{
    let attachment:null|{storagePath:string;fileName:string;mimeType:string;fileSize:number}=null;
    if(receipt&&settlementId){uploadedPath=`journey-accounts/${value.accountId}/${settlementId}/${transactionId}/${crypto.randomUUID()}-${safeName(receipt.name)}`;const {error}=await database.storage.from("accounting-receipts").upload(uploadedPath,receipt,{contentType:receipt.type,upsert:false});if(error)throw error;attachment={storagePath:uploadedPath,fileName:receipt.name,mimeType:receipt.type,fileSize:receipt.size}}
    const {data,error}=await database.rpc("record_accounting_transaction_command",{
      p_account_id:value.accountId,p_actor_id:user.id,p_type:value.type,p_amount:value.amount,p_waived_amount:value.waivedAmount,
      p_payment_date:value.paymentDate,p_payment_method:value.paymentMethod??null,p_reference:value.reference??null,p_notes:value.notes??null,
      p_waiver_reason:value.waiverReason??null,p_settlement_id:settlementId,p_idempotency_key:key,p_transaction_id:transactionId,p_attachment:attachment
    });
    if(error)throw new Error(error.message);
    const result=data&&typeof data==="object"&&!Array.isArray(data)?data as Record<string,unknown>:null;
    if(uploadedPath&&result?.idempotent===true){await database.storage.from("accounting-receipts").remove([uploadedPath]);uploadedPath=null}
    return NextResponse.json({ok:true,idempotent:result?.idempotent===true},{status:result?.idempotent===true?200:201});
  }catch(error){if(uploadedPath)await database.storage.from("accounting-receipts").remove([uploadedPath]);const message=error instanceof Error?error.message:"The payment could not be saved.";return NextResponse.json({error:message},{status:statusFor(message)})}
}
