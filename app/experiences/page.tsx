import type {Metadata} from "next";
import Image from "next/image";
import {ExperienceCatalogue} from "@/features/experiences/experience-editorial";
import {ExperienceRepository} from "@/lib/repositories/content";

export const metadata:Metadata={title:"Experiences",description:"Discover meaningful experiences across Sri Lanka."};
export const dynamic="force-dynamic";

export default async function Page(){
  const experiences=await new ExperienceRepository().getEditorial();
  const hero=experiences.find(item=>item.hero_image_url);
  return <main className="bg-ivory pb-24">
    <header className="relative min-h-[62svh] overflow-hidden bg-forest text-ivory">{hero?.hero_image_url?<Image src={hero.hero_image_url} alt="" fill priority sizes="100vw" className="object-cover opacity-50"/>:null}<div className="absolute inset-0 bg-gradient-to-r from-forest via-forest/75 to-transparent"/><div className="absolute inset-0 bg-gradient-to-t from-forest/75 to-transparent"/><div className="shell relative flex min-h-[62svh] items-end py-16 md:py-24"><div><p className="eyebrow text-gold-light">Experience Sri Lanka</p><h1 className="mt-5 max-w-5xl font-serif text-[clamp(3.4rem,7vw,7rem)] leading-[.94] tracking-[-.04em]">Moments that stay with you.</h1><p className="mt-7 max-w-2xl text-lg leading-8 text-ivory/72">Wild encounters, living traditions and remarkable landscapes—chosen for depth, not checklists.</p></div></div></header>
    <div className="shell py-16 md:py-24"><div className="grid gap-6 border-b border-forest/20 pb-10 md:grid-cols-[.55fr_1fr]"><p className="eyebrow">A considered collection</p><p className="max-w-2xl font-serif text-2xl leading-snug md:text-3xl">Experiences worth making time for, selected to bring you closer to the character of each place.</p></div><ExperienceCatalogue experiences={experiences}/></div>
  </main>;
}
