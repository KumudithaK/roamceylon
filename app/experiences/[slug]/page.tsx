import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {ExperienceEditorialPage} from "@/features/experiences/experience-editorial";
import {ExperienceRepository} from "@/lib/repositories/content";

export const dynamic="force-dynamic";

async function getExperience(slug:string){
  const experiences=await new ExperienceRepository().getEditorial();
  const experience=experiences.find(item=>item.slug===slug);
  if(!experience)return {experience:null,related:[]};
  const related=experiences.filter(item=>item.id!==experience.id&&(item.category===experience.category||item.destinationIds.some(id=>experience.destinationIds.includes(id)))).slice(0,4);
  return {experience,related};
}

export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
  const {experience}=await getExperience((await params).slug);
  return experience?{title:experience.name,description:experience.short_description,alternates:{canonical:`/experiences/${experience.slug}`}}:{};
}

export default async function Page({params}:{params:Promise<{slug:string}>}){
  const {experience,related}=await getExperience((await params).slug);
  if(!experience)notFound();
  return <ExperienceEditorialPage experience={experience} related={related}/>;
}
