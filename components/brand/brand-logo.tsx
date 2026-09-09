import Image from "next/image";
import {BrandWordmark} from "@/components/brand/brand-wordmark";
import {brand} from "@/lib/brand";
import {cn} from "@/lib/utils";

type BrandLogoProps={variant?:"full"|"compact"|"emblem";inverse?:boolean;decorative?:boolean;className?:string};

/**
 * Graphical variants are faithful crops of the approved raster, not new lockups.
 * The dark/compact wordmark is intentionally HTML until an approved export exists.
 */
export function BrandLogo({variant="compact",inverse=false,decorative=false,className}:BrandLogoProps){
  if(variant==="compact"){
    return <span aria-hidden={decorative?true:undefined} className={cn("inline-flex items-center gap-3",className)}>
      <Image src="/brand/the-ceylon-edition-emblem.png" alt="" width={218} height={320} sizes="56px" className="h-12 w-auto shrink-0 object-contain sm:h-14"/>
      <BrandWordmark showTagline={false}/>
    </span>;
  }
  if(inverse){
    return <span aria-hidden={decorative?true:undefined}><BrandWordmark inverse={inverse} showTagline={variant==="full"} className={className}/></span>;
  }
  if(variant==="emblem"){
    return <Image src="/brand/the-ceylon-edition-emblem.png" alt={decorative?"":brand.name} width={218} height={320} sizes="80px" className={cn("h-28 w-auto object-contain",className)}/>;
  }
  return <figure className={cn("m-0",className)}>
    <Image src="/brand/the-ceylon-edition-lockup.webp" alt={decorative?"":brand.name} width={960} height={654} sizes="(min-width: 1024px) 720px, 90vw" className="hidden h-auto w-full min-[800px]:block"/>
    <span aria-hidden={decorative?true:undefined} className="min-[800px]:hidden"><BrandWordmark showTagline={false}/></span>
    {/* Important copy remains readable text, never only tiny raster lettering. */}
    <figcaption className="mt-4 text-center text-sm leading-6 text-muted">{brand.tagline}</figcaption>
  </figure>;
}
