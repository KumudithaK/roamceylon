import {JourneyAccountReview} from "@/features/admin/journey-account-review";
export default async function Page({params}:{params:Promise<{id:string}>}){return <JourneyAccountReview id={(await params).id}/>}
