import Image from "next/image";
import {Text} from "@/components/i18n/text";
import {brand} from "@/lib/brand";
import {cn} from "@/lib/utils";

type BrandLogoProps={variant?:"full"|"compact"|"emblem";inverse?:boolean;decorative?:boolean;className?:string};

export function BrandLogo({variant="compact",inverse=false,decorative=false,className}:BrandLogoProps){
  if(variant==="compact"){
    return <Image
      src="/brand/elava8-travels-horizontal.webp"
      alt={decorative?"":brand.name}
      width={720}
      height={240}
      sizes="(min-width: 640px) 230px, 204px"
      className={cn("h-auto w-[204px] max-w-full object-contain sm:w-[230px]",className)}
    />;
  }
  if(variant==="emblem"){
    return <Image src="/brand/elava8-travels-symbol.png" alt={decorative?"":brand.name} width={256} height={256} sizes="96px" className={cn("h-24 w-24 object-contain",className)}/>;
  }
  return <figure className={cn("m-0",className)}>
    <Image src="/brand/elava8-travels-lockup.webp" alt={decorative?"":brand.name} width={480} height={390} sizes="256px" className={cn("h-auto w-64 max-w-full object-contain",inverse?"rounded-xl bg-ivory p-5":undefined)}/>
    <figcaption className={cn("mt-4 text-sm leading-6",inverse?"text-ivory/85":"text-muted")}><Text>{brand.tagline}</Text></figcaption>
  </figure>;
}
