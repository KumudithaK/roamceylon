import Image from "next/image";
import {Leaf} from "lucide-react";
import {cn} from "@/lib/utils";

export function ExperienceMedia({src,alt,fill=true,priority=false,sizes="100vw",className,imageClassName}:{src:string|null;alt:string;fill?:boolean;priority?:boolean;sizes?:string;className?:string;imageClassName?:string}){
  return <div className={cn("relative overflow-hidden bg-forest",className)}>
    {src?<Image src={src} alt={alt} fill={fill} priority={priority} sizes={sizes} className={cn("object-cover",imageClassName)}/>:<div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_25%_25%,rgba(181,138,58,.3),transparent_42%),linear-gradient(145deg,#174A40,#0B302A_62%,#06251F)] text-ivory"><div className="flex max-w-[16rem] flex-col items-center gap-4 px-6 text-center"><Leaf className="size-9 text-gold-light" aria-hidden="true"/><span className="font-serif text-xl leading-tight">A Sri Lankan experience, thoughtfully selected.</span></div></div>}
  </div>;
}
