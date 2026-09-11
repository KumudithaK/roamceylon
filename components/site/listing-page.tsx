import Image from "next/image";
import {EmptyState} from "@/components/ui/feedback";
import {MediaCard} from "./media-card";
type Item={id:string;slug:string;name:string;image:string|null;alt:string|null;eyebrow?:string|null;description?:string|null;unesco?:boolean};
export function ListingPage({eyebrow,title,copy,basePath,items}:{eyebrow:string;title:string;copy:string;basePath:string;items:Item[]}){
  const lead=items.find(item=>item.image);
  return <main>
    <header className="relative isolate min-h-[62svh] overflow-hidden bg-forest text-ivory">
      {lead?.image?<Image src={lead.image} alt="" fill priority sizes="100vw" className="object-cover opacity-55"/>:null}
      <div className="absolute inset-0 bg-gradient-to-r from-forest via-forest/78 to-forest/20"/>
      <div className="absolute inset-0 bg-gradient-to-t from-forest/80 via-transparent to-transparent"/>
      <div className="shell relative flex min-h-[62svh] items-end py-16 md:py-24">
        <div className="max-w-5xl"><p className="eyebrow text-gold-light">{eyebrow}</p><h1 className="display mt-5">{title}</h1><p className="mt-7 max-w-2xl text-lg leading-8 text-ivory/76">{copy}</p></div>
      </div>
    </header>
    <section className="section bg-ivory">
      <div className="shell">
        <div className="mb-14 grid gap-6 border-b border-forest/20 pb-10 md:grid-cols-[.55fr_1fr]"><p className="eyebrow">A considered collection</p><p className="max-w-2xl font-serif text-2xl leading-snug md:text-3xl">Follow the image, then stay for the story. Every published place has been selected to help you see a different side of Sri Lanka.</p></div>
        {items.length?<div className="grid gap-x-7 gap-y-14 md:grid-cols-2 lg:grid-cols-12">{items.map((item,index)=><div key={item.id} className={index%5===0?"lg:col-span-7":index%5===1?"lg:col-span-5 lg:pt-24":"lg:col-span-4"}><MediaCard href={`${basePath}/${item.slug}`} image={item.image} alt={item.alt} title={item.name} eyebrow={item.eyebrow} description={item.description} unesco={item.unesco} index={index}/></div>)}</div>:<EmptyState title="More to discover">Reviewed listings will appear here soon.</EmptyState>}
      </div>
    </section>
  </main>;
}
