import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {ExperiencePublicDetail} from "@/features/experiences/experience-public-detail";
import {isPubliclyDiscoverableExperience,publiclyDiscoverableExperiences} from "@/lib/experience-discovery";
import {publicBrandText} from "@/lib/brand";
import {ExperienceRepository} from "@/lib/repositories/content";

export const dynamic="force-dynamic";

async function getExperience(slug:string){
  const experiences=await new ExperienceRepository().getEditorial();
  const experience=experiences.find(item=>item.slug===slug);
  if(!experience)return {experience:null,related:[]};
  const related=publiclyDiscoverableExperiences(experiences).filter(item=>item.id!==experience.id&&(item.category===experience.category||item.destinationIds.some(id=>experience.destinationIds.includes(id)))).slice(0,4);
  return {experience,related};
}

export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
  const {experience}=await getExperience((await params).slug);
  return experience?{title:publicBrandText(experience.name),description:experience.short_description?publicBrandText(experience.short_description):undefined,robots:isPubliclyDiscoverableExperience(experience)?undefined:{index:false,follow:false},alternates:{canonical:`/experiences/${experience.slug}`},openGraph:{title:`${publicBrandText(experience.name)} | The Ceylon Edition`,description:experience.short_description?publicBrandText(experience.short_description):undefined,url:`/experiences/${experience.slug}`,images:experience.hero_image_url?[{url:experience.hero_image_url,alt:publicBrandText(experience.image_alt||experience.name)}]:undefined}}:{};
}

export default async function Page({params}:{params:Promise<{slug:string}>}){
  const {experience,related}=await getExperience((await params).slug);
  if(!experience)notFound();
  return <ExperiencePublicDetail experience={experience} related={related}/>;
}
