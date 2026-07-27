import {notFound} from "next/navigation";
import {ResourceEditor} from "@/features/admin/resource-editor";
import {isResourceType,resourceConfigs} from "@/lib/admin/resources";

export default async function Page({params}:{params:Promise<{type:string;id:string}>}){
  const {type,id}=await params;
  if(!isResourceType(type))notFound();
  return <ResourceEditor config={resourceConfigs[type]} id={id}/>;
}
