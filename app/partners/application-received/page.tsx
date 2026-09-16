import type {Metadata} from "next";
import Link from "next/link";
import {Check} from "lucide-react";
import {Button} from "@/components/ui/button";

export const metadata:Metadata={title:"Partner Application Received",robots:{index:false,follow:false}};

const names={accommodation:"Accommodation",vehicle:"Vehicle or fleet",guide:"Local guide"} as const;

export default async function Page({searchParams}:{searchParams:Promise<{reference?:string;type?:string}>}){
  const query=await searchParams;
  const type=query.type==="accommodation"||query.type==="vehicle"||query.type==="guide"?query.type:"accommodation";
  return <main id="content" className="grid min-h-[75svh] place-items-center bg-forest px-5 py-16 text-ivory md:py-24">
    <section aria-labelledby="received-title" className="w-full max-w-5xl border border-ivory/20 bg-ivory text-slate shadow-[0_30px_100px_rgba(0,0,0,.2)]">
      <div className="grid lg:grid-cols-[.58fr_1fr]">
        <div className="editorial-noise flex min-h-72 flex-col justify-between bg-forest p-8 text-ivory md:p-12"><span className="grid size-14 place-items-center rounded-full border border-gold text-gold-light"><Check className="size-6" aria-hidden="true"/></span><div><p className="eyebrow mt-12 text-gold-light">Application received</p><p className="mt-4 font-serif text-3xl leading-tight">A conversation has begun.</p></div></div>
        <div className="p-8 md:p-14"><h1 id="received-title" tabIndex={-1} className="font-serif text-4xl leading-tight md:text-6xl">Thank you for sharing your details.</h1><p className="mt-6 max-w-2xl leading-8 text-muted">Your application has entered The Ceylon Edition’s manual review workspace. This acknowledgement does not create a listing, account, partnership or commercial agreement.</p><dl className="mt-9 grid gap-px border-y border-forest/20 bg-forest/20 text-sm sm:grid-cols-2"><div className="bg-surface p-5"><dt className="text-xs font-bold uppercase tracking-[.14em] text-muted">Reference</dt><dd className="mt-2 font-semibold">{query.reference||"Pending"}</dd></div><div className="bg-surface p-5"><dt className="text-xs font-bold uppercase tracking-[.14em] text-muted">Application path</dt><dd className="mt-2 font-semibold">{names[type]}</dd></div></dl><p className="mt-8 max-w-2xl text-sm leading-7 text-muted">The team may use your chosen contact method if clarification or a further conversation is useful. Supporting documents remain private. Any future catalogue publication is a separate manual decision.</p><div className="mt-9 flex flex-wrap gap-3"><Button asChild><Link href="/">Return to homepage</Link></Button><Button asChild variant="outline"><Link href="/partners">Partner overview</Link></Button></div></div>
      </div>
    </section>
  </main>;
}
