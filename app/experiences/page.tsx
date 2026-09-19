import type {Metadata} from "next";
import {ExperienceCatalogue} from "@/features/experiences/experience-catalogue";
import {publiclyDiscoverableExperiences} from "@/lib/experience-discovery";
import {ExperienceRepository} from "@/lib/repositories/content";

export const metadata:Metadata={title:"Experiences in Sri Lanka",description:"Discover Sri Lanka through a considered collection of private, cultural, wildlife and landscape experiences, shaped into a bespoke journey.",alternates:{canonical:"/experiences"},openGraph:{title:"Experiences in Sri Lanka | The Ceylon Edition",description:"A considered collection of experiences to shape into a private Sri Lankan journey.",url:"/experiences"}};
export const dynamic="force-dynamic";

export default async function Page(){
  const experiences=await new ExperienceRepository().getEditorial();
  return <ExperienceCatalogue experiences={publiclyDiscoverableExperiences(experiences)}/>;
}
