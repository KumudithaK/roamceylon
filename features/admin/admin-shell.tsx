"use client";

import Image from "next/image";
import Link from "next/link";
import {usePathname,useRouter} from "next/navigation";
import {BedDouble,CarFront,ClipboardList,Handshake,Inbox,LayoutDashboard,LogOut,Map,Settings,Sparkles,UsersRound,WalletCards} from "lucide-react";
import {Button} from "@/components/ui/button";
import {createClient} from "@/lib/supabase/client";

const navigation=[
  [LayoutDashboard,"Overview","/admin/dashboard"],
  [ClipboardList,"Journey Requests","/admin/journey-requests"],
  [Inbox,"Traveller Enquiries","/admin/enquiries"],
  [WalletCards,"Accounting","/admin/accounting"],
  [Map,"Destinations","/admin/resources/destinations"],
  [Sparkles,"Experiences","/admin/resources/experiences"],
  [BedDouble,"Stays","/admin/resources/stays"],
  [CarFront,"Vehicles","/admin/resources/vehicles"],
  [UsersRound,"Local Guides","/admin/resources/guides"],
  [Handshake,"Partner Applications","/admin/partner-applications"],
  [Settings,"Business Pricing","/admin/settings/pricing"],
  [Settings,"Partner Settings","/admin/settings/partners"]
] as const;

export function AdminShell({children}:{children:React.ReactNode}){
  const pathname=usePathname();
  const router=useRouter();
  return <div className="grid min-h-screen bg-[#f4f3ef] lg:grid-cols-[250px_1fr]">
    <aside className="border-r border-stone/20 bg-slate p-5 text-ivory">
      <Link href="/admin/dashboard"><Image src="/assets/logo/roam-ceylon-elephant.png" alt="Roam Ceylon" width={190} height={108} priority className="h-auto w-full rounded-2xl bg-ivory p-2"/></Link>
      <nav className="mt-6 grid gap-1" aria-label="Admin navigation">{navigation.map(([Icon,label,href])=>{
        const active=pathname===href||(href!=="/admin/dashboard"&&pathname.startsWith(`${href}/`));
        return <Link key={label} href={href} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${active?"bg-white/10 text-white":"text-white/55 hover:bg-white/5 hover:text-white"}`}><Icon className="size-4"/>{label}</Link>;
      })}</nav>
      <Button variant="ghost" className="mt-8 text-ivory/60" onClick={async()=>{await createClient().auth.signOut();router.replace("/admin/login")}}><LogOut/>Sign out</Button>
    </aside>
    <main className="min-w-0 p-6 md:p-10">{children}</main>
  </div>;
}
