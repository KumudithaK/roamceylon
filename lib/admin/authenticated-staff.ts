import "server-only";
import {createAdminClient} from "@/lib/supabase/admin";

export async function authenticatedStaff(request:Request){
  const database=createAdminClient();
  const token=request.headers.get("authorization")?.replace(/^Bearer\s+/,"");
  if(!database||!token)return null;
  const {data}=await database.auth.getUser(token);
  if(!data.user)return null;
  const {data:profile}=await database.from("profiles").select("role").eq("id",data.user.id).maybeSingle();
  return profile&&["admin","editor"].includes(profile.role)?{database,user:data.user}:null;
}
