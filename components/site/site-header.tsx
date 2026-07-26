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
  return <header className="sticky top-0 z-50 border-b border-stone/15 bg-ivory/90 backdrop-blur-xl"><div className="shell flex h-20 items-center justify-between">
    <Link href="/" aria-label="Roam Ceylon home"><Image src="/assets/logo/roam-ceylon-elephant.png" alt="Roam Ceylon" width={132} height={62} className="h-14 w-auto object-contain"/></Link>
    <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary">{links.map(([label,href])=><Link key={href} href={href} className="focus-ring text-sm font-semibold text-slate/75 transition hover:text-forest">{label}</Link>)}</nav>
    <div className="hidden items-center gap-3 lg:flex"><Button asChild variant="ghost"><Link href="/partners">Partner with us</Link></Button><Button asChild><Link href="/journey-builder">Build your journey</Link></Button></div>
    <button className="focus-ring rounded-full p-3 lg:hidden" onClick={()=>setOpen(!open)} aria-expanded={open} aria-label="Toggle menu">{open?<X/>:<Menu/>}</button>
  </div>{open&&<nav className="shell grid gap-1 border-t border-stone/15 py-5 lg:hidden">{links.map(([label,href])=><Link onClick={()=>setOpen(false)} key={href} href={href} className="rounded-xl px-4 py-3 text-lg font-semibold hover:bg-sand-light">{label}</Link>)}<Link href="/journey-builder" className="mt-3 rounded-full bg-forest px-5 py-3 text-center font-bold text-ivory">Build your journey</Link></nav>}</header>;
}
