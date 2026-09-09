"use client";

import Link from "next/link";
import {Menu} from "lucide-react";
import {useEffect,useState} from "react";
import {usePathname} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Dialog,DialogClose,DialogContent,DialogTrigger} from "@/components/ui/dialog";
import {BrandLogo} from "@/components/brand/brand-logo";
import {brand} from "@/lib/brand";
import {hidePublicShell,isActiveNavigation,journeyLaunchHref,publicNavigation} from "@/lib/public-navigation";

export function SiteHeader(){
  const pathname=usePathname();
  const [open,setOpen]=useState(false);
  useEffect(()=>{
    const desktop=window.matchMedia("(min-width: 1280px)");
    const closeOnDesktop=()=>{if(desktop.matches)setOpen(false)};
    desktop.addEventListener("change",closeOnDesktop);
    return ()=>desktop.removeEventListener("change",closeOnDesktop);
  },[]);
  if(hidePublicShell(pathname))return null;
  return <header className="sticky top-0 z-50 border-b border-gold/35 bg-ivory/95 shadow-[0_8px_30px_rgba(11,48,42,0.04)] backdrop-blur-md">
    <div className="shell flex min-h-20 items-center justify-between gap-4 py-2.5 sm:min-h-24">
      <Link href="/" aria-label={`${brand.name} home`} className="block shrink-0 rounded-sm"><BrandLogo variant="compact" decorative/></Link>
      <nav className="hidden items-center gap-6 xl:flex" aria-label="Primary">
        {publicNavigation.map(({label,href})=><Link key={href} href={href} aria-current={isActiveNavigation(pathname,href)?"page":undefined} className="inline-flex min-h-11 items-center border-b border-transparent text-sm font-medium transition-colors hover:border-gold aria-[current=page]:border-gold">{label}</Link>)}
      </nav>
      <div className="hidden items-center gap-3 xl:flex">
        <Button asChild variant="outline" size="sm" className="border-gold/70 text-forest hover:border-gold hover:bg-gold/10"><Link href="/partners">Partner with us</Link></Button>
        <Button asChild className="whitespace-nowrap"><Link href={journeyLaunchHref}>{brand.primaryCta}</Link></Button>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild><button type="button" className="inline-flex size-12 shrink-0 items-center justify-center rounded-md hover:bg-sand xl:hidden" aria-label="Open navigation menu"><Menu className="size-6" aria-hidden="true"/></button></DialogTrigger>
        <DialogContent title="Explore The Ceylon Edition" description="Public navigation and journey planning. Close this menu with Escape or the close button.">
          <nav className="grid gap-2" aria-label="Mobile primary">
            {publicNavigation.map(({label,href})=><DialogClose asChild key={href}><Link href={href} aria-current={isActiveNavigation(pathname,href)?"page":undefined} className="flex min-h-12 items-center rounded-md px-3 text-lg hover:bg-sand aria-[current=page]:bg-sand">{label}</Link></DialogClose>)}
            <DialogClose asChild><Button asChild variant="outline" className="mt-2 border-gold/70"><Link href="/partners">Partner with us</Link></Button></DialogClose>
            <DialogClose asChild><Button asChild className="mt-4"><Link href={journeyLaunchHref}>{brand.primaryCta}</Link></Button></DialogClose>
          </nav>
        </DialogContent>
      </Dialog>
    </div>
  </header>;
}
