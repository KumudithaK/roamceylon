import type {Metadata} from "next";
import {Manrope,Playfair_Display} from "next/font/google";
import "./globals.css";
import {SiteHeader} from "@/components/site/site-header";
import {SiteFooter} from "@/components/site/site-footer";
import {brand} from "@/lib/brand";

const manrope=Manrope({subsets:["latin"],variable:"--font-manrope",display:"swap"});
const playfair=Playfair_Display({subsets:["latin"],variable:"--font-playfair",display:"swap"});

export const metadata:Metadata={
  metadataBase:new URL(process.env.NEXT_PUBLIC_SITE_URL||brand.canonicalUrl),
  title:{default:`${brand.name} — ${brand.tagline}`,template:`%s | ${brand.name}`},
  description:brand.tagline,
  alternates:{canonical:"/"},
  openGraph:{type:"website",locale:"en_LK",siteName:brand.name,title:brand.name,description:brand.tagline,images:[{url:"/og.png",width:1200,height:630,alt:`${brand.name} — ${brand.tagline}`}]},
  twitter:{card:"summary_large_image",title:brand.name,description:brand.tagline,images:["/og.png"]}
};

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="en"><body className={`${manrope.variable} ${playfair.variable}`}><a href="#content" className="fixed -top-20 left-4 z-[100] rounded bg-ivory px-4 py-2 focus:top-4">Skip to content</a><SiteHeader/><main id="content">{children}</main><SiteFooter/></body></html>;
}
