import type {Metadata} from "next";
import Link from "next/link";
import {ArrowRight,ArrowUpRight} from "lucide-react";
import {FadeIn} from "@/components/animate/fade-in";
import {PartnerEditorialImage} from "@/components/partners/partner-editorial-image";
import {Button} from "@/components/ui/button";
import {brand,editionDisplayName} from "@/lib/brand";
import {listContent} from "@/lib/data";

export const metadata:Metadata={
  title:"Work with The Ceylon Edition",
  description:"Begin a considered commercial conversation about accommodation, transport or guiding within thoughtfully designed Sri Lanka journeys.",
  alternates:{canonical:"/partners"},
  openGraph:{title:"Work with The Ceylon Edition",description:"A considered starting point for Sri Lankan accommodation, transport and guiding conversations.",url:"/partners",images:["/og.png"]}
};

const heroImage="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Sun_setting_over_Kandalama_Lake%2C_Sri_Lanka.jpg/1920px-Sun_setting_over_Kandalama_Lake%2C_Sri_Lanka.jpg";
const partnerPaths=[
  {number:"01",type:"accommodation",title:"Places to stay",copy:"Share the character, location and practical details of an accommodation you represent. We consider how a stay may sit within the pace and geography of a journey."},
  {number:"02",type:"vehicle",title:"Transport across the island",copy:"Introduce a vehicle or fleet and the journeys it can realistically support, from airport arrivals to longer routes between destinations."},
  {number:"03",type:"guide",title:"Guides and local specialists",copy:"Tell us about your languages, home base, destinations and specialist knowledge so a future conversation can begin with useful context."}
] as const;
const conversation=[
  ["01","Share the essentials","Choose the relevant path and tell us what you offer, where you work and how we can reach you."],
  ["02","A human review","The submission enters the existing partner review workspace. It does not create a public listing or commercial agreement."],
  ["03","Continue the conversation","If the details are relevant to a journey or future collaboration, The Ceylon Edition may contact you using your chosen method."],
  ["04","Publication is separate","Any catalogue publication follows a distinct review and manual decision. An application alone never makes information public."]
] as const;

export default async function Page(){
  const [editions,destinations,experiences]=await Promise.all([listContent("themes"),listContent("destinations"),listContent("experiences")]);
  const edition=editions.find(item=>item.slug==="heritage")??editions.find(item=>item.hero_image_url)??null;
  const destination=destinations.find(item=>item.slug==="sigiriya")??destinations.find(item=>item.hero_image_url)??null;
  const experience=experiences.find(item=>item.slug.includes("sigiriya"))??experiences.find(item=>item.hero_image_url)??null;
  const publicJourney=[
    edition?{eyebrow:"Editions",title:editionDisplayName(edition),copy:edition.short_description,href:`/discover/${edition.slug}`,image:edition.hero_image_url,alt:edition.image_alt||editionDisplayName(edition)}:null,
    destination?{eyebrow:"Destinations",title:destination.name,copy:destination.short_description,href:`/destinations/${destination.slug}`,image:destination.hero_image_url,alt:destination.image_alt||destination.name}:null,
    experience?{eyebrow:"Experiences",title:experience.name,copy:experience.short_description,href:`/experiences/${experience.slug}`,image:experience.hero_image_url,alt:experience.image_alt||experience.name}:null
  ].filter(item=>item!==null);

  return <main id="content">
    <section className="relative isolate min-h-[76svh] overflow-hidden bg-forest text-ivory">
      <PartnerEditorialImage src={heroImage} alt="Evening light over Kandalama Lake and the Sri Lankan landscape" sizes="100vw" priority className="object-cover object-center"/>
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(11,48,42,.92)_0%,rgba(11,48,42,.68)_48%,rgba(11,48,42,.18)_100%)]"/>
      <div className="shell relative flex min-h-[76svh] items-end py-16 md:py-24">
        <FadeIn className="max-w-4xl">
          <p className="eyebrow text-gold-light">For those who help shape the journey</p>
          <h1 className="display mt-5">Sri Lanka is experienced through people who know it well.</h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-ivory/76">The Ceylon Edition welcomes considered conversations with accommodation providers, transport operators and guides whose work may be relevant to thoughtfully designed journeys.</p>
          <div className="mt-9 flex flex-wrap gap-3"><Button asChild variant="accent" size="lg"><Link href="/partners/apply">Begin a partner conversation<ArrowRight aria-hidden="true"/></Link></Button><Button asChild variant="outline" size="lg" className="border-ivory/45 text-ivory hover:bg-ivory/10"><Link href="#our-approach">Our approach</Link></Button></div>
        </FadeIn>
      </div>
    </section>

    <section id="our-approach" className="section overflow-hidden bg-ivory">
      <div className="shell grid gap-12 lg:grid-cols-[.68fr_1.32fr] lg:gap-24">
        <FadeIn><p className="editorial-index">01</p><p className="eyebrow mt-8">A partnership point of view</p></FadeIn>
        <FadeIn delay={.08}><h2 className="font-serif text-[clamp(2.7rem,5vw,5rem)] leading-[1.02] tracking-[-.035em]">The right detail, shared at the right moment.</h2><div className="mt-8 grid gap-6 border-t border-forest/20 pt-8 md:grid-cols-2"><p className="prose-luxury">A private journey is shaped by place, pace and the practical reality of moving through the island. We begin with the traveller, then consider which services genuinely belong in that journey.</p><p className="prose-luxury">A first submission is simply context for a human conversation. It is not a promise of work, publication, rates, availability or a commercial relationship.</p></div></FadeIn>
      </div>
    </section>

    <section className="editorial-noise bg-forest py-20 text-ivory md:py-32">
      <div className="shell">
        <FadeIn className="max-w-4xl"><p className="eyebrow text-gold-light">Ways we may begin</p><h2 className="heading mt-4">Three kinds of local knowledge.</h2><p className="mt-6 max-w-2xl leading-8 text-ivory/68">The existing partner pathway accepts accommodation, vehicle or fleet, and guide applications. Each asks only for the practical detail relevant to that path.</p></FadeIn>
        <div className="mt-14 border-y border-ivory/20">{partnerPaths.map(item=><FadeIn key={item.type}><article className="grid gap-5 border-b border-ivory/20 py-9 last:border-b-0 md:grid-cols-[6rem_1fr_1.2fr_auto] md:items-center"><span className="font-serif text-4xl text-gold-light/70">{item.number}</span><h3 className="font-serif text-3xl">{item.title}</h3><p className="max-w-xl text-sm leading-7 text-ivory/64">{item.copy}</p><Link href={{pathname:"/partners/apply",query:{type:item.type}}} className="editorial-link text-gold-light">Begin here</Link></article></FadeIn>)}</div>
      </div>
    </section>

    {publicJourney.length?<section className="section bg-sand">
      <div className="shell"><div className="grid gap-6 border-b border-forest/20 pb-10 md:grid-cols-[.55fr_1fr]"><p className="eyebrow">The public journey</p><div><h2 className="heading">See the experience travellers are invited to shape.</h2><p className="prose-luxury mt-5 max-w-2xl">Our published Editions, destinations and experiences reveal the tone and level of detail behind the journey. The Journey Builder then brings those choices together.</p></div></div>
        <div className="mt-14 grid gap-8 lg:grid-cols-12">{publicJourney.map((item,index)=><FadeIn key={item.href} className={index===0?"lg:col-span-6":"lg:col-span-3"}><Link href={item.href} className="image-lift group block focus-ring"><article><div className={`relative overflow-hidden bg-forest ${index===0?"aspect-[4/3]":"aspect-[3/4]"}`}><PartnerEditorialImage src={item.image} alt={item.alt} sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover"/><div className="absolute inset-0 bg-gradient-to-t from-forest/90 via-transparent to-transparent"/><div className="absolute inset-x-0 bottom-0 p-6 text-ivory"><p className="text-[.65rem] font-bold uppercase tracking-[.18em] text-gold-light">{item.eyebrow}</p><h3 className="mt-3 font-serif text-2xl leading-tight md:text-3xl">{item.title}</h3></div></div><p className="mt-4 line-clamp-3 text-sm leading-7 text-muted">{item.copy}</p></article></Link></FadeIn>)}</div>
        <Button asChild variant="outline" className="mt-10"><Link href="/journey-builder?step=0">Explore the Journey Builder<ArrowUpRight aria-hidden="true"/></Link></Button>
      </div>
    </section>:null}

    <section className="section bg-ivory">
      <div className="shell grid gap-12 lg:grid-cols-[.7fr_1.3fr] lg:gap-24"><FadeIn><p className="editorial-index">02</p><p className="eyebrow mt-8">How a conversation begins</p><h2 className="heading mt-4">Clear steps. No automatic promises.</h2></FadeIn><div className="border-t border-forest/20">{conversation.map(([number,title,copy])=><FadeIn key={number}><article className="grid gap-4 border-b border-forest/20 py-8 sm:grid-cols-[4rem_1fr] lg:grid-cols-[4rem_.7fr_1.3fr]"><span className="font-serif text-2xl text-gold">{number}</span><h3 className="font-serif text-2xl">{title}</h3><p className="text-sm leading-7 text-muted">{copy}</p></article></FadeIn>)}</div></div>
    </section>

    <section className="relative isolate overflow-hidden bg-forest py-24 text-ivory md:py-36"><div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_20%,rgba(181,138,58,.22),transparent_35%)]"/><FadeIn className="shell relative"><p className="eyebrow text-gold-light">Begin with context</p><h2 className="mt-5 max-w-5xl font-serif text-[clamp(3rem,6vw,6rem)] leading-[.98]">Tell us what you bring to Sri Lanka’s journeys.</h2><p className="mt-7 max-w-2xl text-lg leading-8 text-ivory/68">Your draft stays in this browser until you choose to submit. Submission begins a manual review; it does not create a listing, account or agreement.</p><Button asChild variant="accent" size="lg" className="mt-9"><Link href="/partners/apply">Begin a partner conversation<ArrowRight aria-hidden="true"/></Link></Button><p className="mt-5 text-xs leading-6 text-ivory/48">Questions before applying? Use the verified telephone or WhatsApp details on our Contact page.</p></FadeIn></section>

    <section className="bg-sand py-14"><div className="shell flex flex-col gap-6 border-y border-forest/20 py-12 md:flex-row md:items-end md:justify-between"><div><p className="eyebrow">{brand.name}</p><p className="mt-4 max-w-2xl font-serif text-3xl leading-tight">Journeys composed with local knowledge, thoughtful pacing and human care.</p></div><Link href="/contact" className="editorial-link shrink-0">Start a conversation</Link></div></section>
  </main>;
}
