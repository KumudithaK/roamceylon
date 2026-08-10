import {JourneyStudio} from "@/features/admin/journey-studio";
export default async function Page({params}:{params:Promise<{id:string}>}){return <JourneyStudio enquiryId={(await params).id}/>}
