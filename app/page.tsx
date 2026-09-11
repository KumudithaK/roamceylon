import {Hero} from "@/components/home/hero";
import {EditorialHome} from "@/components/home/editorial-home";
import {listContent} from "@/lib/data";
import {ExperienceRepository,HomepageRepository} from "@/lib/repositories/content";
import type {HeroMedia} from "@/lib/types";

export default async function Home(){
  const [themes,destinations,experiences]=await Promise.all([listContent("themes"),listContent("destinations"),new ExperienceRepository().getEditorial().catch(()=>[])]);
  const fallbackPoster=destinations.find(x=>x.slug==="ella")?.hero_image_url||themes[0]?.hero_image_url||"/og.png";
  const fallbackHero:HeroMedia={title:"Discover Sri Lanka. Your Way.",subtitle:"Create a personalised journey through timeless heritage, tropical coastlines, wild landscapes and authentic local experiences.",posterUrl:fallbackPoster,desktopVideoUrl:null,mobileVideoUrl:null,alt:"Sri Lankan landscape",overlayStrength:.58,enabled:false,autoplay:false,loop:true,muted:true};
  const configuredHero=await new HomepageRepository().getHero().catch(()=>fallbackHero);
  const hero:HeroMedia=process.env.NODE_ENV==="development"?{...configuredHero,developmentYoutubePreviewId:"eWJWA9hv4yw"}:configuredHero;
  return <><Hero media={hero} themes={themes} destinations={destinations}/><EditorialHome themes={themes} destinations={destinations} experiences={experiences}/></>;
}
