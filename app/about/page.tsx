import type {Metadata} from "next";
import {AboutPage} from "@/features/about/about-page";
import {createPublicClient} from "@/lib/supabase/server";

const siteUrl=(process.env.NEXT_PUBLIC_SITE_URL||"https://theroamceylon.com").replace(/\/$/,"");

export const metadata:Metadata={
  title:"About Roam Ceylon — Sri Lanka Destination Management Company",
  description:"Meet Roam Ceylon, a Sri Lanka Destination Management Company creating tailor-made, personalised journeys through local expertise, thoughtful design and human care.",
  alternates:{canonical:"/about"},
  openGraph:{
    title:"About Roam Ceylon — Journeys thoughtfully designed",
    description:"Local knowledge, thoughtful design and deeply personal journeys, composed with care across Sri Lanka.",
    url:"/about",
    images:[{url:"/og.png",width:1200,height:630,alt:"Roam Ceylon — tailor-made journeys across Sri Lanka"}]
  },
  twitter:{card:"summary_large_image",title:"About Roam Ceylon",description:"Journeys thoughtfully designed. Sri Lanka deeply understood.",images:["/og.png"]}
};

async function companyDetails(){
  const fallback={email:"hello@roamceylon.com",telephone:"+94 71 307 7989"};
  const supabase=createPublicClient();
  if(!supabase)return fallback;
  const {data,error}=await supabase.from("website_settings").select("enquiry_email,contact_phone").limit(1).maybeSingle();
  if(error){
    console.error(`[about:website-settings] ${error.code}: ${error.message}`);
    return fallback;
  }
  return {email:data?.enquiry_email||fallback.email,telephone:data?.contact_phone||fallback.telephone};
}

export default async function Page(){
  const company=await companyDetails();
  const organisation={
    "@context":"https://schema.org",
    "@type":["Organization","TravelAgency"],
    name:"Roam Ceylon",
    legalName:"Roam Ceylon Atelier (Private) Limited",
    url:siteUrl,
    logo:`${siteUrl}/assets/logo/roam-ceylon-elephant-transparent.png`,
    email:company.email,
    telephone:company.telephone,
    address:{"@type":"PostalAddress",addressCountry:"LK",addressLocality:"Colombo"},
    areaServed:{"@type":"Country",name:"Sri Lanka"},
    description:"A Sri Lankan journey atelier creating and coordinating deeply personal, tailor-made journeys across the island."
  };
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(organisation).replace(/</g,"\\u003c")}}/>
    <AboutPage email={company.email} telephone={company.telephone}/>
  </>;
}
