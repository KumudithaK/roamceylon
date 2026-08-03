import {notFound} from "next/navigation";
import {ResourceList} from "@/features/admin/resource-list";
import {isResourceType,resourceConfigs} from "@/lib/admin/resources";

export default async function Page({params}:{params:Promise<{type:string}>}){
  const {type}=await params;
  if(!isResourceType(type))notFound();
  return <ResourceList config={resourceConfigs[type]}/>;
}

