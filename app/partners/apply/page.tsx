import type {Metadata} from "next";
import {PartnerApplicationForm} from "@/features/partners/partner-application-form";

export const metadata:Metadata={
  title:"Begin a Partner Conversation",
  description:"Share accommodation, transport or guiding details for manual review by The Ceylon Edition.",
  alternates:{canonical:"/partners/apply"},
  robots:{index:false,follow:true}
};

export default async function Page({searchParams}:{searchParams:Promise<{type?:string}>}){
  const type=(await searchParams).type;
  return <PartnerApplicationForm initialType={type==="accommodation"||type==="vehicle"||type==="guide"?type:"accommodation"}/>;
}
