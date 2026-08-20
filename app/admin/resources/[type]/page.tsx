import {notFound} from "next/navigation";
import {ResourceList} from "@/features/admin/resource-list";
import {isResourceType,resourceConfigs} from "@/lib/admin/resources";
import {resourceAdminPermission} from "@/lib/admin/resources";
import {AdminShell} from "@/features/admin/admin-shell";

export default async function Page({params}:{params:Promise<{type:string}>}){
  const {type}=await params;
  if(!isResourceType(type))notFound();
  return <AdminShell requiredPermission={resourceAdminPermission(type)}><ResourceList config={resourceConfigs[type]}/></AdminShell>;
}
