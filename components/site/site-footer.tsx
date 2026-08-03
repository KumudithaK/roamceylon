"use client";
import Image from "next/image";
import Link from "next/link";
import {usePathname} from "next/navigation";

export function SiteFooter(){
  const pathname=usePathname();
  if(pathname.startsWith("/admin"))return null;
  const groups=[["Explore","/discover","/destinations","/experiences"],["Plan","/journey-builder","/hotels","/guides"],["Company","/about","/contact","/partners"]];
  return <footer className="bg-slate py-16 text-ivory/70"><div className="shell grid gap-12 md:grid-cols-[1.4fr_repeat(3,1fr)]"><div><Image src="/assets/logo/roam-ceylon-elephant-transparent.png" alt="Roam Ceylon" width={220} height={125} className="mb-7 h-auto w-[220px] rounded-2xl bg-ivory p-2 object-contain"/><p className="max-w-xs text-sm leading-7">Private journeys across Sri Lanka, planned with local knowledge and shaped around you.</p></div>{groups.map(([title,...hrefs])=><div key={title}><h2 className="mb-4 text-xs font-bold uppercase tracking-[.18em] text-gold-light">{title}</h2><div className="grid gap-3">{hrefs.map(href=><Link key={href} href={href} className="text-sm capitalize hover:text-ivory">{href.slice(1).replaceAll("-"," ")}</Link>)}</div></div>)}</div><div className="shell mt-14 border-t border-ivory/10 pt-6 text-xs">© {new Date().getFullYear()} Roam Ceylon. Journeys that connect.</div></footer>;
}
