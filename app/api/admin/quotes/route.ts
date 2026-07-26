import {NextResponse} from "next/server";
import {z} from "zod";
import {createAdminClient} from "@/lib/supabase/admin";
import {PackagePricingService} from "@/lib/pricing/package-service";

const quoteSchema=z.object({
  selectedDestinationIds:z.array(z.uuid()).max(40),
  selectedExperienceIds:z.array(z.uuid()).max(100),
  selectedStayIds:z.array(z.uuid()).max(40),
  selectedVehicleId:z.uuid().nullable(),
  selectedGuideId:z.uuid().nullable(),
  travelDates:z.object({start:z.string().max(10),end:z.string().max(10)}),
  travellerCounts:z.object({adults:z.number().int().min(1).max(100),children:z.number().int().min(0).max(100)})
});

export async function POST(request:Request){
  const database=createAdminClient();
  const token=request.headers.get("authorization")?.replace(/^Bearer\s+/,"");
  if(!database||!token)return NextResponse.json({error:"Unauthorized."},{status:401});
  const {data:userData,error:userError}=await database.auth.getUser(token);
  if(userError||!userData.user)return NextResponse.json({error:"Unauthorized."},{status:401});
  const {data:profile}=await database.from("profiles").select("role").eq("id",userData.user.id).maybeSingle();
  if(!profile||!["admin","editor"].includes(profile.role))return NextResponse.json({error:"Forbidden."},{status:403});
  const parsed=quoteSchema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Invalid quote request."},{status:400});
  try{return NextResponse.json(await new PackagePricingService().quote(parsed.data))}
  catch{return NextResponse.json({error:"Unable to calculate this package."},{status:500})}
}
