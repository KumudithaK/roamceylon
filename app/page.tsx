import {Hero} from "@/components/home/hero";
import {EditorialHome} from "@/components/home/editorial-home";
import {listContent} from "@/lib/data";
import {ExperienceRepository,HomepageRepository} from "@/lib/repositories/content";
import type {HeroMedia} from "@/lib/types";
import {isPartnerDemoEnabled,partnerDemoPosterUrl,partnerDemoVideoId} from "@/lib/partner-demo";
import {CeyloCompanion} from "@/components/ceylo/ceylo-companion";
import {loadCeyloCatalogue} from "@/lib/ceylo/catalogue-server";

// Keep the CMS-backed hero and destination cards current after an admin save.
export const dynamic="force-dynamic";

export default async function Home(){
  const [themes,destinations,experiences]=await Promise.all([listContent("themes"),listContent("destinations"),new ExperienceRepository().getEditorial().catch(()=>[])]);
  const fallbackPoster=destinations.find(x=>x.slug==="ella")?.hero_image_url||themes[0]?.hero_image_url||"/og.png";
  const fallbackHero:HeroMedia={title:"Discover Sri Lanka. Your Way.",subtitle:"Create a personalised journey through timeless heritage, tropical coastlines, wild landscapes and authentic local experiences.",posterUrl:fallbackPoster,desktopVideoUrl:null,mobileVideoUrl:null,alt:"Sri Lankan landscape",overlayStrength:.58,enabled:false,autoplay:false,loop:true,muted:true};
  const savedHero=await new HomepageRepository().getHero().catch(()=>null);
  const configuredHero=savedHero??fallbackHero;
  const hero:HeroMedia=isPartnerDemoEnabled(process.env)?{...configuredHero,posterUrl:partnerDemoPosterUrl(savedHero?.posterUrl),title:"Sri Lanka, Beyond the Ordinary.",subtitle:"Bespoke journeys through Sri Lanka.",partnerDemoVideoId}:configuredHero;
  const catalogue=isPartnerDemoEnabled(process.env)?await loadCeyloCatalogue():null;
  return <main><Hero media={hero} themes={themes} destinations={destinations}/><EditorialHome themes={themes} destinations={destinations} experiences={experiences}/>{catalogue&&<CeyloCompanion catalogue={catalogue}/>}</main>;
}
