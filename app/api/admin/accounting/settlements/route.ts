import {NextResponse} from "next/server";
import {z} from "zod";
import {authenticatedStaff} from "@/lib/admin/authenticated-staff";

const schema=z.object({
  accountId:z.uuid(),
  payeeName:z.string().trim().min(2).max(160),
  description:z.string().trim().min(2).max(240),
  amount:z.number().positive().max(100000000),
  dueDate:z.union([z.iso.date(),z.literal("")]),
  notes:z.string().trim().max(500).optional()
});

export async function POST(request:Request){
  const actor=await authenticatedStaff(request);
  if(!actor)return NextResponse.json({error:"Unauthorized."},{status:401});
  const {database}=actor;
  const parsed=schema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Check the payee, description, and amount."},{status:400});
  const value=parsed.data;
  const {data:account}=await database.from("journey_accounts").select("id,currency,status").eq("id",value.accountId).maybeSingle();
  if(!account)return NextResponse.json({error:"Journey account not found."},{status:404});
  if(account.status==="void")return NextResponse.json({error:"Liabilities cannot be added to a void account."},{status:409});
  const {error}=await database.from("journey_settlements").insert({
    account_id:account.id,
    source_key:`other:${crypto.randomUUID()}`,
    payee_type:"other",
    payee_name:value.payeeName,
    description:value.description,
    currency:account.currency,
    amount_due:value.amount,
    due_date:value.dueDate||null,
    notes:value.notes||null
  });
  if(error)return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json({ok:true},{status:201});
}
