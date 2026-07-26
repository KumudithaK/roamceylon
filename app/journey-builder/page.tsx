import type {Metadata} from "next";import {JourneyService} from "@/lib/journey/journey-service";import {JourneyBuilder} from "@/features/journey/journey-builder";
export const metadata:Metadata={title:"Journey Builder",description:"Shape a private Sri Lankan journey around the places and experiences that matter to you."};
export const dynamic="force-dynamic";
export default async function Page(){const data=await new JourneyService().getJourneyBootstrapData();return <JourneyBuilder data={data}/>}
