"use client";

import Image from "next/image";
import Link from "next/link";
import {ArrowUpRight} from "lucide-react";
import {useState} from "react";
import {UnescoBadge} from "@/components/destinations/unesco-badge";

export function MediaCard({href,image,alt,title,eyebrow,description,tall=false,unesco=false,index}:{href:string;image:string|null;alt:string|null;title:string;eyebrow?:string|null;description?:string|null;tall?:boolean;unesco?:boolean;index?:number}){
  const [imageFailed,setImageFailed]=useState(false);

  return <Link href={href} className="image-lift group focus-ring block">
    <article>
      <div className={`relative overflow-hidden bg-sand ${tall?"aspect-[3/4]":"aspect-[4/3]"}`}>
        {image&&!imageFailed?<Image src={image} alt={alt||title} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" onError={()=>setImageFailed(true)}/>:<div className="absolute inset-0 grid place-items-center bg-forest/5 text-sm text-muted">Image awaiting review</div>}
        <div className="absolute inset-0 bg-gradient-to-t from-forest/75 via-transparent to-transparent"/>
        {unesco&&<UnescoBadge className="absolute bottom-4 left-4"/>}
        {index!==undefined?<span className="absolute right-5 top-5 font-serif text-2xl text-ivory/85">{String(index+1).padStart(2,"0")}</span>:null}
      </div>
      <div className="border-b border-forest/20 py-5">
        {eyebrow?<p className="text-[.68rem] font-bold uppercase tracking-[.18em] text-gold">{eyebrow}</p>:null}
        <div className="mt-2 flex items-start justify-between gap-5"><h3 className="font-serif text-2xl leading-tight md:text-3xl">{title}</h3><ArrowUpRight aria-hidden="true" className="mt-1 size-5 shrink-0 text-forest transition-transform motion-safe:group-hover:translate-x-1 motion-safe:group-hover:-translate-y-1"/></div>
        {description?<p className="mt-3 line-clamp-2 max-w-xl text-sm leading-6 text-muted">{description}</p>:null}
      </div>
    </article>
  </Link>;
}
