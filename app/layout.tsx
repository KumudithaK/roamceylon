import type {Metadata} from "next";
import {Manrope,Playfair_Display} from "next/font/google";
import "./globals.css";
import {SiteHeader} from "@/components/site/site-header";
import {SiteFooter} from "@/components/site/site-footer";

const manrope=Manrope({subsets:["latin"],variable:"--font-manrope",display:"swap"});
const playfair=Playfair_Display({subsets:["latin"],variable:"--font-playfair",display:"swap"});

export const metadata:Metadata={
  metadataBase:new URL(process.env.NEXT_PUBLIC_SITE_URL||"https://theroamceylon.com"),
  title:{default:"Roam Ceylon — Journeys that connect",template:"%s | Roam Ceylon"},
  description:"Design a private Sri Lankan journey through remarkable places, experiences and trusted local partners.",
  alternates:{canonical:"/"},
  openGraph:{type:"website",locale:"en_LK",siteName:"Roam Ceylon",title:"Roam Ceylon",description:"Sri Lanka, shaped around you.",images:[{url:"/og.png",width:1200,height:630,alt:"Roam Ceylon — Journeys that connect"}]},
  twitter:{card:"summary_large_image",title:"Roam Ceylon",description:"Sri Lanka, shaped around you.",images:["/og.png"]}
};

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="en"><body className={`${manrope.variable} ${playfair.variable}`}><a href="#content" className="fixed -top-20 left-4 z-[100] rounded bg-ivory px-4 py-2 focus:top-4">Skip to content</a><SiteHeader/><main id="content">{children}</main><SiteFooter/></body></html>;
}
