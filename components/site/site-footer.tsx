"use client";

import Link from "next/link";
import {Facebook,ArrowUpRight} from "lucide-react";
import {usePathname} from "next/navigation";
import {BrandLogo} from "@/components/brand/brand-logo";
import {WhatsAppIcon} from "@/components/icons/whatsapp-icon";
import {brand} from "@/lib/brand";
import {approvedPublicContact,hidePublicShell,journeyLaunchHref,publicNavigation} from "@/lib/public-navigation";

import {LanguageAvailabilityNotice} from "@/components/i18n/language-selector";
import {useTranslation} from "@/components/i18n/locale-provider";

export function SiteFooter(){
  const {t}=useTranslation();
  const pathname=usePathname();
  if(hidePublicShell(pathname))return null;
  return <footer className="border-t border-gold/50 bg-sand text-forest shadow-[inset_0_1px_0_rgba(255,252,246,0.55)]">
    <div className="shell grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.3fr_.7fr_1fr] lg:gap-14 lg:py-16">
      <div>
        <BrandLogo variant="full" decorative showTagline={false} className="max-w-56"/>
        <p className="mt-6 max-w-sm text-base leading-7 text-muted">{t("Private journeys across Sri Lanka, planned with local knowledge and shaped around you.")}</p>
        <Link href={journeyLaunchHref} className="text-link mt-6 inline-flex min-h-11 items-center gap-3 text-base font-semibold">{t(brand.primaryCta)}<ArrowUpRight className="size-4" aria-hidden="true"/></Link>
      </div>
      <nav aria-label={t("Footer")}>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-[.16em]">{t("Explore")}</h2>
        <ul className="grid gap-1">{[...publicNavigation,{label:brand.journalName,href:"/blog"},{label:"Contact",href:"/contact"},{label:"Partner with us",href:"/partners"}].map(({label,href})=><li key={href}><Link href={href} className="text-link inline-flex min-h-11 items-center text-sm">{t(label)}</Link></li>)}</ul>
      </nav>
      <div>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-[.16em]">{t("Stay in touch")}</h2>
        <a href={approvedPublicContact.phoneHref} className="text-link inline-flex min-h-11 items-center text-base">{approvedPublicContact.phone}</a>
        <address className="mt-3 whitespace-pre-line text-sm not-italic leading-7 text-muted">{approvedPublicContact.address}</address>
        <div className="mt-5 flex flex-wrap gap-3">
          <a href={approvedPublicContact.whatsapp} target="_blank" rel="noopener noreferrer" aria-label={t("WhatsApp (opens in a new tab)")} className="inline-flex size-11 items-center justify-center rounded-md border border-forest/40 text-forest transition-colors hover:border-forest/60 hover:bg-forest/5"><WhatsAppIcon className="size-5"/></a>
          <a href={approvedPublicContact.facebook} target="_blank" rel="noopener noreferrer" aria-label={t("Facebook (opens in a new tab)")} className="inline-flex size-11 items-center justify-center rounded-md border border-forest/40 text-forest transition-colors hover:border-forest/60 hover:bg-forest/5"><Facebook className="size-5" aria-hidden="true"/></a>
        </div>
      </div>
    </div>
    <div className="shell pb-5"><LanguageAvailabilityNotice/></div>
    <div className="shell flex flex-col gap-4 border-t border-forest/25 py-6 text-sm leading-6 text-muted sm:flex-row sm:items-center sm:justify-between">
      <p>© {new Date().getFullYear()} {brand.name}.</p>
      <nav aria-label={t("Legal")}><ul className="flex flex-wrap gap-x-5 gap-y-2"><li><Link href="/privacy" className="text-link inline-flex min-h-11 items-center">{t("Privacy")}</Link></li><li><Link href="/terms" className="text-link inline-flex min-h-11 items-center">{t("Terms")}</Link></li></ul></nav>
    </div>
  </footer>;
}
