import {NextResponse} from "next/server";
import {z} from "zod";
import {authenticatedStaff} from "@/lib/admin/authenticated-staff";

const schema=z.object({
  accountId:z.uuid(),
  settlementId:z.uuid().nullable().optional(),
  type:z.enum(["customer_receipt","customer_refund","supplier_payment"]),
  amount:z.number().positive().max(100000000),
  paymentDate:z.iso.date(),
  paymentMethod:z.string().trim().max(80).optional(),
  reference:z.string().trim().max(120).optional(),
  notes:z.string().trim().max(500).optional()
});

export async function POST(request:Request){
  const actor=await authenticatedStaff(request);
  if(!actor)return NextResponse.json({error:"Unauthorized."},{status:401});
  const {database,user}=actor;
  const parsed=schema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Check the payment amount and required fields."},{status:400});
  const value=parsed.data;
  const {data:account,error:accountError}=await database.from("journey_accounts").select("*").eq("id",value.accountId).maybeSingle();
  if(accountError||!account)return NextResponse.json({error:"Journey account not found."},{status:404});
  if(account.status==="void")return NextResponse.json({error:"Payments cannot be recorded against a void account."},{status:409});
  let settlementId:string|null=null;
  if(value.type==="supplier_payment"){
    if(!value.settlementId)return NextResponse.json({error:"Choose a supplier settlement."},{status:400});
    const {data:settlement}=await database.from("journey_settlements").select("*").eq("id",value.settlementId).eq("account_id",account.id).maybeSingle();
    if(!settlement)return NextResponse.json({error:"Supplier settlement not found."},{status:404});
    if(settlement.status==="waived")return NextResponse.json({error:"A waived settlement cannot be paid."},{status:409});
    if(value.amount>settlement.amount_due-settlement.amount_paid+0.005)return NextResponse.json({error:"Payment exceeds the outstanding supplier balance."},{status:409});
    settlementId=settlement.id;
  }else if(value.type==="customer_refund"&&value.amount>account.amount_received+0.005){
    return NextResponse.json({error:"Refund exceeds the amount received from the traveller."},{status:409});
  }
  const {error}=await database.from("accounting_transactions").insert({
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
  });
  if(error)return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json({ok:true},{status:201});
}
