import {NextResponse} from "next/server";
import {z} from "zod";
import {authenticatedStaff} from "@/lib/admin/authenticated-staff";

const schema=z.object({accountId:z.uuid(),reason:z.string().trim().min(10).max(1000),overrideSupplierBalance:z.boolean().default(false)});
export async function POST(request:Request){
  const actor=await authenticatedStaff(request);if(!actor)return NextResponse.json({error:"Unauthorized."},{status:401});
  if(actor.profile.role!=="admin")return NextResponse.json({error:"Only an administrator can close an account with a balance adjustment."},{status:403});
  const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:parsed.error.issues[0]?.message??"Explain why this account is being closed."},{status:400});
  const {database,user}=actor,{accountId,reason,overrideSupplierBalance}=parsed.data;
  const [{data:account},{data:settlements}]=await Promise.all([database.from("journey_accounts").select("*").eq("id",accountId).maybeSingle(),database.from("journey_settlements").select("amount_due,amount_paid,waived_amount").eq("account_id",accountId)]);
  if(!account)return NextResponse.json({error:"Journey account not found."},{status:404});
  if(account.status==="closed")return NextResponse.json({error:"This account is already closed."},{status:409});
  const supplierOutstanding=(settlements??[]).reduce((sum,row)=>sum+Math.max(0,row.amount_due-row.amount_paid-row.waived_amount),0);
  if(supplierOutstanding>.005&&!overrideSupplierBalance)return NextResponse.json({error:`Supplier commitments of ${account.currency} ${supplierOutstanding.toFixed(2)} remain unresolved. Confirm the authorised override to continue.`},{status:409});
  const effectiveSelling=Math.max(0,account.selling_price-account.closure_adjustment);const balance=Math.max(0,effectiveSelling-account.amount_received);const now=new Date().toISOString();
  const {error}=await database.from("journey_accounts").update({status:"closed",active:false,closure_adjustment:account.closure_adjustment+balance,closure_reason:reason,manually_closed_at:now,manually_closed_by:user.id,settled_at:now,deactivated_at:now}).eq("id",account.id);
  if(error)return NextResponse.json({error:error.message},{status:500});
  await database.from("accounting_lifecycle_history").insert({account_id:account.id,from_status:account.status,to_status:"closed",reason:`Account manually closed${balance?` with ${account.currency} ${balance.toFixed(2)} approved balance adjustment`:""}. ${reason}`,changed_by:user.id});
  return NextResponse.json({ok:true,adjustment:balance,supplierOutstanding});
}
