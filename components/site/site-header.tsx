"use client";
import Link from "next/link";
import {ChevronDown,Menu,X} from "lucide-react";
import {useState} from "react";
import {usePathname} from "next/navigation";
import {Button} from "@/components/ui/button";
import {BrandWordmark} from "@/components/brand/brand-wordmark";
import {brand} from "@/lib/brand";

const links=[["Discover","/discover"],["Destinations","/destinations"],["Experiences","/experiences"],["About","/about"]];
const partnerLinks=[["Accommodation","/hotels"],["Fleet","/transport"],["Local Guides","/guides"]];
export function SiteHeader(){
  const pathname=usePathname();
  const [open,setOpen]=useState(false);
  if(pathname.startsWith("/admin")||pathname.startsWith("/proposal/"))return null;
  return <header className="sticky top-0 z-50 border-b border-stone/15 bg-ivory/90 backdrop-blur-xl"><div className="shell flex h-28 items-center justify-between gap-5">
    <Link href="/" aria-label={`${brand.name} home`} className="block shrink-0"><BrandWordmark/></Link>
    <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">{links.slice(0,3).map(([label,href])=><Link key={href} href={href} className="focus-ring text-sm font-semibold text-slate/75 transition hover:text-forest">{label}</Link>)}<div className="group relative"><button className="focus-ring flex items-center gap-1 text-sm font-semibold text-slate/75 transition hover:text-forest" aria-haspopup="true">Partners<ChevronDown className="size-4"/></button><div className="invisible absolute left-1/2 top-full z-20 w-56 -translate-x-1/2 pt-4 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"><div className="grid gap-1 rounded-2xl border border-stone/15 bg-white p-2 shadow-xl">{partnerLinks.map(([label,href])=><Link key={href} href={href} className="rounded-xl px-4 py-3 text-sm font-semibold hover:bg-sand-light">{label}</Link>)}</div></div></div>{links.slice(3).map(([label,href])=><Link key={href} href={href} className="focus-ring text-sm font-semibold text-slate/75 transition hover:text-forest">{label}</Link>)}</nav>
    <div className="hidden items-center gap-3 lg:flex"><Button asChild variant="accent" className="whitespace-nowrap"><Link href="/partners">Partner with us</Link></Button><Button asChild className="whitespace-nowrap !text-white"><Link href="/journey-builder?step=0">{brand.primaryCta}</Link></Button></div>
    <button className="focus-ring rounded-full p-3 lg:hidden" onClick={()=>setOpen(!open)} aria-expanded={open} aria-label="Toggle menu">{open?<X/>:<Menu/>}</button>
  </div>{open&&<nav className="shell grid gap-1 border-t border-stone/15 py-5 lg:hidden">{links.slice(0,3).map(([label,href])=><Link onClick={()=>setOpen(false)} key={href} href={href} className="rounded-xl px-4 py-3 text-lg font-semibold hover:bg-sand-light">{label}</Link>)}<p className="px-4 pt-3 text-xs font-bold uppercase tracking-widest text-gold">Partners</p>{partnerLinks.map(([label,href])=><Link onClick={()=>setOpen(false)} key={href} href={href} className="rounded-xl px-6 py-2 text-base font-semibold hover:bg-sand-light">{label}</Link>)}{links.slice(3).map(([label,href])=><Link onClick={()=>setOpen(false)} key={href} href={href} className="rounded-xl px-4 py-3 text-lg font-semibold hover:bg-sand-light">{label}</Link>)}<Link href="/partners" className="mt-3 rounded-full bg-gold px-5 py-3 text-center font-bold text-slate">Partner with us</Link><Link href="/journey-builder?step=0" className="mt-2 rounded-full bg-forest px-5 py-3 text-center font-bold text-white">{brand.primaryCta}</Link></nav>}</header>;
}
