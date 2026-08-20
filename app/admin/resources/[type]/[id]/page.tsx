import {notFound} from "next/navigation";
import {ResourceEditor} from "@/features/admin/resource-editor";
import {isResourceType,resourceAdminPermission,resourceConfigs} from "@/lib/admin/resources";
import {AdminShell} from "@/features/admin/admin-shell";

export default async function Page({params}:{params:Promise<{type:string;id:string}>}){
  const {type,id}=await params;
  if(!isResourceType(type))notFound();
  return <AdminShell requiredPermission={resourceAdminPermission(type)}><ResourceEditor config={resourceConfigs[type]} id={id}/></AdminShell>;
}
