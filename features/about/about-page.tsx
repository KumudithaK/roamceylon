import Image from "next/image";
import Link from "next/link";
import {ArrowRight,Check,Compass,HeartHandshake,Leaf,MessagesSquare,ShieldCheck,Sparkles,UsersRound} from "lucide-react";
import {FadeIn} from "@/components/animate/fade-in";
import {AboutRouteMap} from "@/components/about/about-route-map";
import {Button} from "@/components/ui/button";
import {BrandWordmark} from "@/components/brand/brand-wordmark";
import {brand} from "@/lib/brand";

const heroImage="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Sun_setting_over_Kandalama_Lake%2C_Sri_Lanka.jpg/1920px-Sun_setting_over_Kandalama_Lake%2C_Sri_Lanka.jpg";

const steps=[
  ["01","Explore","Follow the places, experiences and travel styles that draw you to Sri Lanka."],
  ["02","Shape","Bring those ideas together in a journey that reflects your interests, pace and people."],
  ["03","Refine","A local Journey Designer reviews the route, timing and every practical detail."],
  ["04","Confirm","We verify availability, coordinate trusted partners and prepare a clear Journey Proposal."],
  ["05","Travel","Secure your journey, then experience Sri Lanka with thoughtful support along the way."]
] as const;

const differences=[
  "Every journey is personally reviewed",
  "Local destination knowledge informs every route",
  "Partners are selected with care",
  "Thoughtful alternatives protect the journey when plans change",
  "Journey Proposals are clear and considered",
  "Human support is available before and during travel",
  "Every detail is refined by people who know the island"
];

const values=[
  ["Thoughtful by Design","Each choice should earn its place in the journey."],
  ["Rooted in Sri Lanka","Local context shapes how we plan, host and tell the island's stories."],
  ["Clear & Responsible","Honest proposals and careful coordination create trust."],
  ["Quality Over Volume","We favour journeys with integrity over travel by template."],
  ["Human at Heart","Warmth, judgement and conversation remain central to every experience."]
] as const;

const responsibilities=[
  [UsersRound,"Local communities","We favour experiences that respect local life and allow tourism value to remain within communities."],
  [Leaf,"Wildlife & environment","Wildlife encounters should protect natural behaviour, while every route should minimise avoidable impact."],
  [ShieldCheck,"Trusted partners","We give preference to appropriately licensed, responsible local partners and verify arrangements before confirmation."],
  [HeartHandshake,"Living culture","Sacred places, craft and tradition are approached with context, permission and respect—not as a performance staged for visitors."]
] as const;

export function AboutPage({email,telephone}:{email:string|null;telephone:string}){
  const displayUrl=new URL(brand.canonicalUrl).hostname;
  return <>
    <section className="relative isolate flex min-h-[calc(100svh-7rem)] items-end overflow-hidden bg-slate text-ivory">
      <Image src={heroImage} alt="Golden evening light settling over Kandalama Lake in Sri Lanka" fill priority sizes="100vw" className="object-cover motion-safe:animate-[hero-zoom_12s_ease-out_forwards]"/>
      <div className="absolute inset-0 bg-gradient-to-r from-slate/95 via-slate/66 to-slate/20"/>
      <div className="absolute inset-0 bg-gradient-to-t from-slate/80 via-transparent to-slate/15"/>
      <div className="shell relative z-10 py-20 md:py-28">
        <FadeIn className="max-w-4xl">
          <p className="eyebrow mb-6 text-gold-light">Our story</p>
          <h1 className="display max-w-4xl text-[clamp(3.3rem,7.4vw,7rem)]">Journeys imagined with care.<br/><span className="text-ivory/72">Sri Lanka told with soul.</span></h1>
          <p className="mt-8 max-w-2xl text-base leading-8 text-ivory/78 md:text-lg">Every journey from {brand.name} begins as a handful of wishes, then takes shape slowly—place by place, story by story—until it feels unmistakably yours.</p>
          <div className="mt-9 flex flex-wrap gap-3"><Button asChild variant="accent" size="lg"><Link href="/journey-builder?step=0">Plan Your Journey<ArrowRight className="size-4"/></Link></Button><Button asChild variant="outline" size="lg" className="border-ivory/45 bg-transparent text-ivory hover:bg-ivory/10"><Link href="/discover">Discover Sri Lanka</Link></Button></div>
        </FadeIn>
      </div>
    </section>

    <section className="section overflow-hidden">
      <div className="shell grid items-center gap-12 lg:grid-cols-[.88fr_1.12fr] lg:gap-24">
        <FadeIn><AboutRouteMap/></FadeIn>
        <FadeIn delay={.08}><p className="eyebrow mb-5">The Ceylon Edition story</p><h2 className="heading">Nothing this personal should ever feel taken from a shelf.</h2><div className="prose-luxury mt-8 space-y-6"><p>A journey from {brand.name} begins with a conversation. You bring the places, interests and moments that matter to you; we listen closely and begin with a fresh page.</p><p>Our Journey Designers lay out the route like a working sketch—bringing destinations together, considering the pace between them and choosing experiences that belong naturally within the story.</p><p>Then comes the fitting and refining. We check the timing, stays, local partners and practical details, adjusting each element until the journey feels balanced, personal and ready to carry your name.</p></div></FadeIn>
      </div>
    </section>

    <section className="relative overflow-hidden bg-forest py-24 text-ivory md:py-36">
      <div className="shell relative grid items-center gap-14 lg:grid-cols-[1.2fr_.8fr] lg:gap-24">
        <FadeIn><p className="eyebrow mb-6 text-gold-light">The house in which our journeys are made</p><h2 className="heading">{brand.name} is a Sri Lankan home for bespoke journeys.</h2><div className="mt-8 max-w-3xl space-y-6 text-base leading-8 text-ivory/72 md:text-lg"><p>Our atelier is a creative home in Sri Lanka—the place where local knowledge, thoughtful hospitality and a traveller&apos;s wishes are gathered into one beautifully considered whole.</p><div className="pt-3"><p className="eyebrow mb-4 text-gold-light">Why &ldquo;Atelier&rdquo;?</p><p>An <em>atelier</em> is a workshop where skilled designers and artisans create bespoke work—never mass-produced, always intentional. That philosophy defines everything we do.</p></div><p>At <strong className="font-semibold text-ivory">{brand.name}</strong>, every journey is imagined, refined and thoughtfully crafted around the traveller, never simply selected from a shelf.</p></div><p className="mt-12 border-l border-gold pl-7 font-serif text-3xl leading-tight text-ivory md:text-5xl">Because the most memorable journeys aren&apos;t booked—they&apos;re thoughtfully designed.</p></FadeIn>
        <FadeIn delay={.1} className="relative grid min-h-[520px] place-items-center overflow-hidden rounded-[12rem_12rem_1.75rem_1.75rem] border border-gold/30 bg-[#f3ead8] p-8 text-center text-forest md:p-10"><div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_center,#c58f2f_1px,transparent_1px)] [background-size:22px_22px]"/><div className="relative w-full"><BrandWordmark className="mx-auto items-center"/><p className="eyebrow mt-12">Made in Sri Lanka</p><p className="mt-4 font-serif text-3xl leading-tight">One island.<br/>Countless possibilities.<br/>Journeys made around you.</p></div></FadeIn>
      </div>
    </section>

    <section className="section bg-sand-light">
      <div className="shell"><FadeIn className="max-w-3xl"><p className="eyebrow mb-5">Our approach</p><h2 className="heading">From first inspiration to a journey ready to travel.</h2></FadeIn><div className="mt-16 border-y border-stone/25 lg:grid lg:grid-cols-5">{steps.map(([number,title,copy],index)=><FadeIn key={title} delay={index*.06} className="border-b border-stone/25 py-8 last:border-b-0 lg:border-b-0 lg:border-r lg:px-7 lg:last:border-r-0"><span className="font-serif text-2xl text-gold">{number}</span><h3 className="mt-8 font-serif text-2xl">{title}</h3><p className="mt-4 text-sm leading-7 text-slate/60">{copy}</p></FadeIn>)}</div></div>
    </section>

    <section className="section">
      <div className="shell grid gap-14 lg:grid-cols-[.8fr_1.2fr] lg:gap-24"><FadeIn><p className="eyebrow mb-5">The Ceylon Edition difference</p><h2 className="heading">Considered in the details. Human in the moments that matter.</h2><p className="prose-luxury mt-7">We bring together the imagination of a private journey house and the judgement of people who know Sri Lanka intimately.</p></FadeIn><div className="border-t border-stone/25">{differences.map((item,index)=><FadeIn key={item} delay={index*.035} className="flex gap-5 border-b border-stone/25 py-5"><span className="mt-1 grid size-7 shrink-0 place-items-center rounded-full border border-gold/40 text-gold"><Check className="size-3.5"/></span><p className="font-serif text-xl leading-snug md:text-2xl">{item}</p></FadeIn>)}</div></div>
    </section>

    <section className="bg-slate py-24 text-ivory md:py-32"><div className="shell grid items-end gap-12 lg:grid-cols-[1.15fr_.85fr] lg:gap-24"><FadeIn><p className="eyebrow mb-5 text-gold-light">Local expertise. Human judgement.</p><h2 className="heading max-w-4xl">A journey may begin with a wish.<br/><span className="text-gold-light">People give it grace and shape.</span></h2></FadeIn><FadeIn delay={.08} className="space-y-5 text-base leading-8 text-ivory/68"><p>Before a journey carries your name, a Journey Designer reads it as a whole—its rhythm, its distances, its moments of wonder and the breathing room between them.</p><p>When a preferred stay or experience cannot be woven in beautifully, we seek an alternative that protects the mood and meaning of the journey. Nothing is substituted carelessly; every new choice must still belong to your story.</p></FadeIn></div></section>

    <section className="section"><div className="shell"><FadeIn className="max-w-3xl"><p className="eyebrow mb-5">Our values</p><h2 className="heading">The principles behind every journey.</h2></FadeIn><div className="mt-14 grid border-y border-stone/25 md:grid-cols-2 lg:grid-cols-5">{values.map(([title,copy],index)=><FadeIn key={title} delay={index*.05} className="border-b border-stone/25 py-8 md:px-6 lg:border-b-0 lg:border-r lg:last:border-r-0"><Sparkles className="size-5 text-gold"/><h3 className="mt-9 font-serif text-2xl leading-tight">{title}</h3><p className="mt-4 text-sm leading-7 text-slate/58">{copy}</p></FadeIn>)}</div></div></section>

    <section className="section bg-sand-light"><div className="shell grid gap-14 lg:grid-cols-[.7fr_1.3fr] lg:gap-24"><FadeIn><p className="eyebrow mb-5">Responsible travel</p><h2 className="heading">Travel should leave respect behind.</h2><p className="prose-luxury mt-7">Responsibility is a way of making decisions, not a badge. We keep improving how journeys support people, protect place and honour Sri Lanka&apos;s living heritage.</p></FadeIn><div className="grid gap-x-12 md:grid-cols-2">{responsibilities.map(([Icon,title,copy],index)=><FadeIn key={title} delay={index*.06} className="border-t border-stone/25 py-8"><Icon className="size-6 text-gold"/><h3 className="mt-6 font-serif text-2xl">{title}</h3><p className="mt-3 text-sm leading-7 text-slate/60">{copy}</p></FadeIn>)}</div></div></section>

    <section className="py-20 md:py-24"><div className="shell"><FadeIn className="grid gap-10 border-y border-stone/25 py-10 md:grid-cols-[.7fr_1.3fr] md:py-14"><div><p className="eyebrow">Brand information</p><h2 className="mt-4 font-serif text-3xl">{brand.name}, with a clear home in Sri Lanka.</h2></div><dl className="grid gap-x-12 gap-y-7 text-sm sm:grid-cols-2">{[["Brand",brand.name],["Country","Sri Lanka"],["Website",displayUrl],...(email?[["Email",email]]:[]),["Telephone",telephone]].map(([term,value])=><div key={term} className="border-b border-stone/20 pb-4"><dt className="text-xs font-bold uppercase tracking-[.14em] text-stone">{term}</dt><dd className="mt-2 font-semibold text-slate">{value}</dd></div>)}</dl></FadeIn></div></section>

    <section className="relative isolate overflow-hidden bg-forest py-24 text-center text-ivory md:py-36"><div className="absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_center,#d7ad65_1px,transparent_1px)] [background-size:26px_26px]"/><FadeIn className="shell relative"><Compass className="mx-auto size-8 text-gold-light"/><p className="eyebrow mb-5 mt-7 text-gold-light">Begin your story</p><h2 className="heading mx-auto max-w-4xl">Your Sri Lankan journey should feel like yours.</h2><p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-ivory/68 md:text-lg">Begin with the places, experiences and travel styles that inspire you. Our Journey Designers will refine the details and prepare a thoughtful Journey Proposal.</p><div className="mt-9 flex flex-wrap justify-center gap-3"><Button asChild variant="accent" size="lg"><Link href="/journey-builder?step=0">Plan Your Journey<ArrowRight className="size-4"/></Link></Button><Button asChild variant="outline" size="lg" className="border-ivory/40 bg-transparent text-ivory hover:bg-ivory/10"><Link href="/contact">Speak With a Journey Designer<MessagesSquare className="size-4"/></Link></Button></div></FadeIn></section>
  </>;
}
