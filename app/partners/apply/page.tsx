import type {Metadata} from "next";
import {PartnerApplicationForm} from "@/features/partners/partner-application-form";
import {listContent} from "@/lib/data";
import {partnerTypeFromRoute} from "@/lib/partners/partner-application";

export const metadata:Metadata={
  title:"Begin a Partner Conversation",
  description:"Share accommodation, transport or guiding details for manual review by The Ceylon Edition.",
  alternates:{canonical:"/partners/apply"},
  robots:{index:false,follow:true}
};

export default async function Page({searchParams}:{searchParams:Promise<{type?:string}>}){
  const routeType=partnerTypeFromRoute((await searchParams).type);
  const [destinations,experiences]=await Promise.all([listContent("destinations"),listContent("experiences")]);
  return <PartnerApplicationForm
    initialType={routeType??"accommodation"}
    explicitType={Boolean(routeType)}
    destinationOptions={destinations.map(item=>({value:item.name,label:item.name}))}
    experienceOptions={experiences.map(item=>({value:item.name,label:item.name}))}
  />;
}
