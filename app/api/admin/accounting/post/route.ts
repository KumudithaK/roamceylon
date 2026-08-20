import {NextResponse} from "next/server";
import {z} from "zod";
import {AccountingPostError,activateJourneyAccount} from "@/lib/accounting/post-journey-account";
import {authenticatedStaff} from "@/lib/admin/authenticated-staff";
import {financeAccountForStaff} from "@/lib/admin/traveller-pii";

const schema=z.object({
  enquiryId:z.uuid(),
  depositAmount:z.coerce.number().positive().max(100000000),
  paymentDate:z.iso.date(),
  paymentMethod:z.string().trim().max(80).optional(),
  reference:z.string().trim().max(120).optional(),
  notes:z.string().trim().max(500).optional()
}).strict();

export async function POST(request:Request){
  const actor=await authenticatedStaff(request,"finance.payments.manage");
  if(!actor.authorized)return NextResponse.json({error:actor.status===401?"Unauthorized.":"You do not have permission to post journey accounts."},{status:actor.status});
  const parsed=schema.safeParse(await request.json().catch(()=>({})));
  if(!parsed.success)return NextResponse.json({error:parsed.error.issues[0]?.message??"Check the deposit details."},{status:400});
  try{
    const value=parsed.data;
    const account=await activateJourneyAccount(value.enquiryId,actor.user.id,{
      amount:value.depositAmount,
      paymentDate:value.paymentDate,
      paymentMethod:value.paymentMethod,
      reference:value.reference,
      notes:value.notes
    });
    return NextResponse.json({account:financeAccountForStaff(account)},{status:201});
  }catch(error){
    const status=error instanceof AccountingPostError&&error.code==="NOT_FOUND"?404:error instanceof AccountingPostError&&error.code==="PRICING"?409:500;
    return NextResponse.json({error:error instanceof Error?error.message:"The deposit could not activate Accounting."},{status});
  }
}
