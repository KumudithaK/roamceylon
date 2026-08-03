"use client";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import {ChevronLeft,ChevronRight} from "lucide-react";

export function GalleryCarousel({images,title}:{images:string[];title:string}){
  const [ref,api]=useEmblaCarousel({align:"start",loop:true});
  return <div className="mt-12"><div ref={ref} className="overflow-hidden"><div className="-ml-4 flex">{images.map((src,i)=><div className="min-w-0 flex-[0_0_88%] pl-4 md:flex-[0_0_60%]" key={`${src}-${i}`}><div className="relative aspect-[4/3] overflow-hidden rounded-3xl"><Image src={src} alt={`${title} gallery image ${i+1}`} fill sizes="(max-width:768px) 88vw, 55vw" className="object-cover"/></div></div>)}</div></div><div className="mt-4 flex gap-2"><button onClick={()=>api?.scrollPrev()} className="focus-ring grid size-11 place-items-center rounded-full border border-stone/30" aria-label="Previous image"><ChevronLeft/></button><button onClick={()=>api?.scrollNext()} className="focus-ring grid size-11 place-items-center rounded-full border border-stone/30" aria-label="Next image"><ChevronRight/></button></div></div>
}
