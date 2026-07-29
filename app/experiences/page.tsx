import type {Metadata} from "next";
import {ExperienceDiscovery} from "@/features/experiences/experience-editorial";
import {ExperienceRepository} from "@/lib/repositories/content";

export const metadata:Metadata={title:"Experiences",description:"Discover meaningful experiences across Sri Lanka."};
export const dynamic="force-dynamic";

export default async function Page(){
  const experiences=await new ExperienceRepository().getEditorial();
  return <main className="bg-ivory pb-24">
    <header className="shell pb-8 pt-20 md:pb-12 md:pt-28">
      <p className="eyebrow">Experience Sri Lanka</p>
      <h1 className="mt-5 max-w-5xl font-serif text-5xl leading-[1.02] md:text-8xl">Moments that stay with you.</h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-slate/60">Wild encounters, living traditions and remarkable landscapes—chosen for depth, not checklists.</p>
    </header>
    <div className="shell"><ExperienceDiscovery experiences={experiences}/></div>
  </main>;
}
