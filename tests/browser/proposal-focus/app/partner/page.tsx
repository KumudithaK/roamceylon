import {PartnerApplicationForm} from "@/features/partners/partner-application-form";
import {partnerTypeFromRoute} from "@/lib/partners/partner-application";

export default async function Page({searchParams}:{searchParams:Promise<{type?:string}>}){
  const routeType=partnerTypeFromRoute((await searchParams).type);
  return <PartnerApplicationForm initialType={routeType??"accommodation"} explicitType={Boolean(routeType)} destinationOptions={[{value:"Colombo",label:"Colombo"},{value:"Sigiriya",label:"Sigiriya"},{value:"Kandy",label:"Kandy"}]} experienceOptions={[{value:"Sigiriya Rock Fortress",label:"Sigiriya Rock Fortress"},{value:"Yala Jeep Safari",label:"Yala Jeep Safari"},{value:"Nine Arches Bridge Dawn Railway Walk",label:"Nine Arches Bridge Dawn Railway Walk"}]}/>;
}
