import {PartnerApplicationForm} from "@/features/partners/partner-application-form";

export default async function Page({searchParams}:{searchParams:Promise<{type?:string}>}){
  const type=(await searchParams).type;
  return <PartnerApplicationForm initialType={type==="accommodation"||type==="vehicle"||type==="guide"?type:"accommodation"}/>;
}
