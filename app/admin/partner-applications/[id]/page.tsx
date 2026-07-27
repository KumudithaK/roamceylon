import {PartnerApplicationReview} from "@/features/admin/partner-application-review";
export default async function Page({params}:{params:Promise<{id:string}>}){return <PartnerApplicationReview id={(await params).id}/>}
