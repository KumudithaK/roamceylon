import type {Metadata} from "next";import {JourneyService} from "@/lib/journey/journey-service";import {JourneyBuilder} from "@/features/journey/journey-builder";
export const metadata:Metadata={title:"Journey Builder",description:"Shape a private Sri Lankan journey around the places and experiences that matter to you."};
export const dynamic="force-dynamic";
const number=(value?:string)=>Math.max(0,Number.parseInt(value||"0",10)||0);
export default async function Page({searchParams}:{searchParams:Promise<{theme?:string;experience?:string;adults?:string;children?:string;infants?:string;experienceAdults?:string;experienceChildren?:string;experienceInfants?:string}>}){
  const [query,data]=await Promise.all([searchParams,new JourneyService().getJourneyBootstrapData()]);
  const hasTravellers=Boolean(query.adults||query.children||query.infants);
  const hasExperienceParticipants=Boolean(query.experienceAdults||query.experienceChildren||query.experienceInfants);
  return <JourneyBuilder data={data} initialSelection={{themeId:query.theme,experienceId:query.experience,travellers:hasTravellers?{adults:number(query.adults),children:number(query.children),infants:number(query.infants)}:undefined,experienceParticipants:hasExperienceParticipants?{adults:number(query.experienceAdults),children:number(query.experienceChildren),infants:number(query.experienceInfants)}:undefined}}/>;
}
