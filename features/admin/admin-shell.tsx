"use client";

import Link from "next/link";
import {usePathname,useRouter} from "next/navigation";
import {BedDouble,CarFront,Compass,Gift,Handshake,Inbox,LayoutDashboard,LogOut,Map,Route,Settings,Sparkles,UsersRound,WalletCards} from "lucide-react";
import {Button} from "@/components/ui/button";
import {createClient} from "@/lib/supabase/client";
import {useStaffPermissions} from "@/lib/admin/use-staff-permissions";
import {adminNavigationPermissions,type StaffPermission} from "@/lib/admin/permissions";
import {BrandWordmark} from "@/components/brand/brand-wordmark";

const navigation=[
  [LayoutDashboard,"Overview","/admin/dashboard",adminNavigationPermissions.overview],
  [Inbox,"Traveller Enquiries","/admin/enquiries",adminNavigationPermissions.enquiries],
  [Route,"Journey Studio","/admin/journey-studio",adminNavigationPermissions.studio],
  [WalletCards,"Accounting","/admin/accounting",adminNavigationPermissions.accounting],
  [Compass,"Travel Themes","/admin/resources/themes",adminNavigationPermissions.themes],
  [Map,"Destinations","/admin/resources/destinations",adminNavigationPermissions.destinations],
  [Sparkles,"Experiences","/admin/resources/experiences",adminNavigationPermissions.experiences],
  [BedDouble,"Stays","/admin/resources/stays",adminNavigationPermissions.stays],
  [CarFront,"Vehicles","/admin/resources/vehicles",adminNavigationPermissions.vehicles],
  [UsersRound,"Local Guides","/admin/resources/guides",adminNavigationPermissions.guides],
  [Handshake,"Partner Applications","/admin/partner-applications",adminNavigationPermissions.partners],
  [Gift,"Benefits & Privileges","/admin/benefits",adminNavigationPermissions.benefits],
  [Settings,"Business Pricing","/admin/settings/pricing",adminNavigationPermissions.pricing],
  [Settings,"Partner Settings","/admin/settings/partners",adminNavigationPermissions.partnerSettings]
] as const;

export function AdminShell({children,requiredPermission}:{children:React.ReactNode;requiredPermission?:StaffPermission}){
  const pathname=usePathname();
  const router=useRouter();
  const access=useStaffPermissions();
  const allowed=new Set(access.permissions);
  return <div className="grid min-h-screen bg-[#f4f3ef] lg:grid-cols-[250px_1fr]">
    <aside className="border-r border-stone/20 bg-slate p-5 text-ivory">
      <Link href="/admin/dashboard"><BrandWordmark inverse className="rounded-2xl border border-white/10 p-3"/></Link>
      <nav className="mt-6 grid gap-1" aria-label="Admin navigation">{navigation.filter(([, , ,permission])=>allowed.has(permission)).map(([Icon,label,href])=>{
        const active=pathname===href||(href!=="/admin/dashboard"&&pathname.startsWith(`${href}/`));
        return <Link key={label} href={href} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${active?"bg-white/10 text-white":"text-white/55 hover:bg-white/5 hover:text-white"}`}><Icon className="size-4"/>{label}</Link>;
      })}</nav>
      <Button variant="ghost" className="mt-8 text-ivory/60" onClick={async()=>{await createClient().auth.signOut();router.replace("/admin/login")}}><LogOut/>Sign out</Button>
    </aside>
    <main className="min-w-0 p-6 md:p-10">{access.loading?<div className="grid min-h-[60vh] place-items-center text-stone">Checking staff access…</div>:requiredPermission&&!allowed.has(requiredPermission)?<div className="rounded-3xl bg-white p-8"><p className="eyebrow">Restricted workspace</p><h1 className="mt-3 font-serif text-4xl">You do not have access to this module.</h1><p className="mt-3 text-sm text-stone">Ask a Super Admin to assign the required staff role.</p></div>:children}</main>
  </div>;
}
