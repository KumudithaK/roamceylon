"use client";
import Image from "next/image";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {useEffect,useState} from "react";
import {createClient} from "@/lib/supabase/client";
import type {Database} from "@/lib/database.types";

export function SiteFooter(){
  const pathname=usePathname();
  const [contact,setContact]=useState<Pick<Database["public"]["Views"]["website_public_settings"]["Row"],"contact_phone"|"whatsapp_url"|"facebook_url"|"business_address"|"website_url"|"business_email">|null>(null);
  useEffect(()=>{void createClient().from("website_public_settings").select("contact_phone,whatsapp_url,facebook_url,business_address,website_url,business_email").eq("id",true).maybeSingle().then(({data})=>setContact(data))},[]);
  if(pathname.startsWith("/admin")||pathname.startsWith("/proposal/"))return null;
  const groups=[["Explore","/discover","/destinations","/experiences"],["Plan","/journey-builder","/hotels","/guides"],["Company","/about","/contact","/partners"]];
  return <footer className="bg-slate py-16 text-ivory/70"><div className="shell grid gap-12 md:grid-cols-[1.3fr_repeat(3,1fr)_1.2fr]"><div><Image src="/assets/logo/roam-ceylon-elephant-transparent.png" alt="Roam Ceylon" width={220} height={125} className="mb-7 h-auto w-[220px] rounded-2xl bg-ivory p-2 object-contain"/><p className="max-w-xs text-sm leading-7">Private journeys across Sri Lanka, planned with local knowledge and shaped around you.</p></div>{groups.map(([title,...hrefs])=><div key={title}><h2 className="mb-4 text-xs font-bold uppercase tracking-[.18em] text-gold-light">{title}</h2><div className="grid gap-3">{hrefs.map(href=><Link key={href} href={href} className="text-sm capitalize hover:text-ivory">{href.slice(1).replaceAll("-"," ")}</Link>)}</div></div>)}{contact?<div><h2 className="mb-4 text-xs font-bold uppercase tracking-[.18em] text-gold-light">Contact</h2><div className="grid gap-3 text-sm"><a href={`tel:${contact.contact_phone?.replace(/\s/g,"")}`}>{contact.contact_phone}</a>{contact.whatsapp_url?<a href={contact.whatsapp_url} target="_blank" rel="noreferrer">WhatsApp</a>:null}{contact.business_email?<a href={`mailto:${contact.business_email}`}>{contact.business_email}</a>:null}{contact.facebook_url?<a href={contact.facebook_url} target="_blank" rel="noreferrer">Facebook</a>:null}<p className="whitespace-pre-line text-xs leading-5 text-ivory/50">{contact.business_address}</p>{contact.website_url?<a href={contact.website_url}>{contact.website_url.replace(/^https?:\/\//,"")}</a>:null}</div></div>:null}</div><div className="shell mt-14 border-t border-ivory/10 pt-6 text-xs">© {new Date().getFullYear()} Roam Ceylon. Journeys that connect.</div></footer>;
}
