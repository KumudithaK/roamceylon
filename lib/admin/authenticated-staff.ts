import "server-only";
import {createAdminClient} from "@/lib/supabase/admin";
import {staffPermissions,type StaffPermission} from "./permissions";

export async function authenticatedStaff(request:Request,required?:StaffPermission|StaffPermission[]){
  const database=createAdminClient();
  const token=request.headers.get("authorization")?.replace(/^Bearer\s+/,"");
  if(!database||!token)return null;
  const {data}=await database.auth.getUser(token);
  if(!data.user)return null;
  const {data:profile}=await database.from("profiles").select("role").eq("id",data.user.id).maybeSingle();
  if(!profile||!["admin","editor"].includes(profile.role))return null;
  let permissions:StaffPermission[]=[];
  if(profile.role==="admin")permissions=[...staffPermissions];
  else{
    const {data:assignments}=await database.from("profile_staff_roles").select("role_code").eq("profile_id",data.user.id);
    const roleCodes=(assignments??[]).map(item=>item.role_code);
    if(roleCodes.length){
      const {data:grants}=await database.from("staff_role_permissions").select("permission_code").in("role_code",roleCodes);
      permissions=(grants??[]).map(item=>item.permission_code).filter((value):value is StaffPermission=>staffPermissions.includes(value as StaffPermission));
    }
  }
  const needed=required?(Array.isArray(required)?required:[required]):[];
  return needed.every(permission=>permissions.includes(permission))?{database,user:data.user,profile,permissions}:null;
}
