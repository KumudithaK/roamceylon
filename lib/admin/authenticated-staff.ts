import "server-only";
import {randomUUID} from "node:crypto";
import {createAdminClient} from "@/lib/supabase/admin";
import {staffPermissions,type StaffPermission} from "./permissions";

export type StaffRequirement=StaffPermission|readonly StaffPermission[]|{anyOf:readonly StaffPermission[]};
export type StaffAuthorizationFailure={authorized:false;status:401|403;reason:"unauthenticated"|"forbidden"};
export type StaffActor={authorized:true;database:NonNullable<ReturnType<typeof createAdminClient>>;user:{id:string};profile:{role:string};permissions:StaffPermission[]};

const failed=(status:401|403,reason:StaffAuthorizationFailure["reason"]):StaffAuthorizationFailure=>({authorized:false,status,reason});

const requirements=(required:StaffRequirement):StaffPermission[]=>"anyOf" in Object(required)
  ?[...(required as {anyOf:readonly StaffPermission[]}).anyOf]
  :[...(Array.isArray(required)?required:[required as StaffPermission])];

async function recordAuthorizationDenial(database:NonNullable<ReturnType<typeof createAdminClient>>,request:Request,actorId:string,reason:"missing_profile"|"missing_capability",required:StaffRequirement){
  try{
    const path=new URL(request.url).pathname;
    if(!path.startsWith("/api/admin/"))return;
    await database.rpc("record_staff_authorization_denial",{
      p_actor_id:actorId,p_reason_class:reason,p_required_permissions:requirements(required),
      p_method:request.method.toUpperCase(),p_path:path,p_correlation_id:randomUUID()
    });
  }catch{/* Security telemetry must never turn a denial into an availability failure. */}
}

export async function authenticatedStaff(request:Request,required:StaffRequirement):Promise<StaffActor|StaffAuthorizationFailure>{
  const database=createAdminClient();
  const token=request.headers.get("authorization")?.replace(/^Bearer\s+/,"");
  if(!database||!token)return failed(401,"unauthenticated");
  const {data,error:userError}=await database.auth.getUser(token);
  if(userError||!data.user)return failed(401,"unauthenticated");
  const {data:profile}=await database.from("profiles").select("role").eq("id",data.user.id).maybeSingle();
  if(!profile){await recordAuthorizationDenial(database,request,data.user.id,"missing_profile",required);return failed(403,"forbidden")}
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
  const allowed="anyOf" in Object(required)
    ?(required as {anyOf:readonly StaffPermission[]}).anyOf.some(permission=>permissions.includes(permission))
    :(Array.isArray(required)?required:[required as StaffPermission]).every(permission=>permissions.includes(permission));
  if(!allowed){await recordAuthorizationDenial(database,request,data.user.id,"missing_capability",required);return failed(403,"forbidden")}
  return {authorized:true,database,user:data.user,profile,permissions};
}
