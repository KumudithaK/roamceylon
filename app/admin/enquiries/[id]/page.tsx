import {EnquiryReview} from "@/features/admin/enquiry-review";
export default async function Page({params}:{params:Promise<{id:string}>}){return <EnquiryReview id={(await params).id}/>}
