import {NextResponse} from "next/server";
import {z} from "zod";
import {AccountingPostError,postJourneyToAccounts} from "@/lib/accounting/post-journey-account";
import {authenticatedStaff} from "@/lib/admin/authenticated-staff";

const schema=z.object({enquiryId:z.uuid().optional()});

export async function POST(request:Request){
  const actor=await authenticatedStaff(request);
  if(!actor)return NextResponse.json({error:"Unauthorized."},{status:401});
  const parsed=schema.safeParse(await request.json().catch(()=>({})));
  if(!parsed.success)return NextResponse.json({error:"Invalid accounting request."},{status:400});
  if(parsed.data.enquiryId){
    try{
      const account=await postJourneyToAccounts(parsed.data.enquiryId,actor.user.id);
      return NextResponse.json({account});
    }catch(error){
      const status=error instanceof AccountingPostError&&error.code==="NOT_FOUND"?404:error instanceof AccountingPostError&&error.code==="PRICING"?409:500;
      return NextResponse.json({error:error instanceof Error?error.message:"The journey could not be posted to accounts."},{status});
    }
  }
  const [{data:completed,error},{data:existing}]=await Promise.all([
    actor.database.from("enquiries").select("id").eq("status","completed"),
    actor.database.from("journey_accounts").select("enquiry_id")
  ]);
  if(error)return NextResponse.json({error:error.message},{status:500});
  const existingIds=new Set((existing??[]).map(item=>item.enquiry_id));
  const pending=(completed??[]).filter(item=>!existingIds.has(item.id));
  const posted:string[]=[];const skipped:Array<{id:string;reason:string}>=[];
  for(const item of pending){
    try{posted.push((await postJourneyToAccounts(item.id,actor.user.id)).id)}
    catch(syncError){skipped.push({id:item.id,reason:syncError instanceof Error?syncError.message:"Unable to post."})}
  }
  return NextResponse.json({posted,skipped});
}
