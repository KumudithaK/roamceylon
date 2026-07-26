import type {Metadata} from "next";import {getJourneyData} from "@/lib/data";import {JourneyBuilder} from "@/features/journey/journey-builder";
export const metadata:Metadata={title:"Journey Builder",description:"Shape a private Sri Lankan journey around the places and experiences that matter to you."};
export default async function Page(){const data=await getJourneyData();return <JourneyBuilder {...data}/>}
