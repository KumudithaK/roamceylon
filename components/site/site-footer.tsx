"use client";

import Link from "next/link";
import {Facebook,ArrowUpRight} from "lucide-react";
import {usePathname} from "next/navigation";
import {BrandWordmark} from "@/components/brand/brand-wordmark";
import {BrandLogo} from "@/components/brand/brand-logo";
import {WhatsAppIcon} from "@/components/icons/whatsapp-icon";
import {brand} from "@/lib/brand";
import {approvedPublicContact,hidePublicShell,journeyLaunchHref,publicNavigation} from "@/lib/public-navigation";

export function SiteFooter(){
  const pathname=usePathname();
  if(hidePublicShell(pathname))return null;
  return <footer className="border-t border-gold/50 bg-sand text-forest shadow-[inset_0_1px_0_rgba(255,252,246,0.55)]">
    <div className="shell grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.3fr_.7fr_1fr] lg:gap-14 lg:py-16">
      <div>
        <BrandLogo variant="emblem" decorative className="mb-5 h-24"/>
        <BrandWordmark/>
        <p className="mt-6 max-w-sm text-base leading-7 text-muted">Private journeys across Sri Lanka, planned with local knowledge and shaped around you.</p>
        <Link href={journeyLaunchHref} className="text-link mt-6 inline-flex min-h-11 items-center gap-3 text-base font-semibold">{brand.primaryCta}<ArrowUpRight className="size-4" aria-hidden="true"/></Link>
      </div>
      <nav aria-label="Footer">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-[.16em]">Explore</h2>
        <ul className="grid gap-1">{[...publicNavigation,{label:"Contact",href:"/contact"},{label:"Partner with us",href:"/partners"}].map(({label,href})=><li key={href}><Link href={href} className="text-link inline-flex min-h-11 items-center text-sm">{label}</Link></li>)}</ul>
      </nav>
      <div>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-[.16em]">Stay in touch</h2>
        <a href={approvedPublicContact.phoneHref} className="text-link inline-flex min-h-11 items-center text-base">{approvedPublicContact.phone}</a>
        <address className="mt-3 whitespace-pre-line text-sm not-italic leading-7 text-muted">{approvedPublicContact.address}</address>
        <div className="mt-5 flex flex-wrap gap-3">
          <a href={approvedPublicContact.whatsapp} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp (opens in a new tab)" className="inline-flex size-11 items-center justify-center rounded-md border border-forest/40 text-forest transition-colors hover:border-forest/60 hover:bg-forest/5"><WhatsAppIcon className="size-5"/></a>
          <a href={approvedPublicContact.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook (opens in a new tab)" className="inline-flex size-11 items-center justify-center rounded-md border border-forest/40 text-forest transition-colors hover:border-forest/60 hover:bg-forest/5"><Facebook className="size-5" aria-hidden="true"/></a>
        </div>
      </div>
    </div>
    <div className="shell border-t border-forest/25 py-6 text-sm leading-6 text-muted">© {new Date().getFullYear()} {brand.name}. <span className="block sm:inline">{brand.tagline}</span></div>
  </footer>;
}
