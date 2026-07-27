"use client";
import Image from "next/image";
import Link from "next/link";
import {Menu,X} from "lucide-react";
import {useState} from "react";
import {usePathname} from "next/navigation";
import {Button} from "@/components/ui/button";

const links=[["Discover","/discover"],["Destinations","/destinations"],["Experiences","/experiences"],["Stays","/hotels"],["About","/about"]];
export function SiteHeader(){
  const pathname=usePathname();
  const [open,setOpen]=useState(false);
  if(pathname.startsWith("/admin"))return null;
  return <header className="sticky top-0 z-50 border-b border-stone/15 bg-ivory/90 backdrop-blur-xl"><div className="shell flex h-28 items-center justify-between gap-5">
    <Link href="/" aria-label="Roam Ceylon home" className="shrink-0 py-1"><Image src="/assets/logo/roam-ceylon-elephant.png" alt="Roam Ceylon" width={240} height={115} priority className="h-24 w-auto object-contain"/></Link>
    <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">{links.map(([label,href])=><Link key={href} href={href} className="focus-ring text-sm font-semibold text-slate/75 transition hover:text-forest">{label}</Link>)}</nav>
    <div className="hidden items-center gap-3 lg:flex"><Button asChild variant="accent" className="whitespace-nowrap"><Link href="/partners">Partner with us</Link></Button><Button asChild className="whitespace-nowrap !text-white"><Link href="/journey-builder">Build your journey</Link></Button></div>
    <button className="focus-ring rounded-full p-3 lg:hidden" onClick={()=>setOpen(!open)} aria-expanded={open} aria-label="Toggle menu">{open?<X/>:<Menu/>}</button>
  </div>{open&&<nav className="shell grid gap-1 border-t border-stone/15 py-5 lg:hidden">{links.map(([label,href])=><Link onClick={()=>setOpen(false)} key={href} href={href} className="rounded-xl px-4 py-3 text-lg font-semibold hover:bg-sand-light">{label}</Link>)}<Link href="/partners" className="mt-3 rounded-full bg-gold px-5 py-3 text-center font-bold text-slate">Partner with us</Link><Link href="/journey-builder" className="mt-2 rounded-full bg-forest px-5 py-3 text-center font-bold text-white">Build your journey</Link></nav>}</header>;
}
