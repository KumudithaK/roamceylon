import Link from "next/link";
import {CircleCheck} from "lucide-react";
import {Button} from "@/components/ui/button";

const names={accommodation:"Accommodation",vehicle:"Vehicle or fleet",guide:"Local guide"} as const;
export default async function Page({searchParams}:{searchParams:Promise<{reference?:string;type?:string}>}){
  const query=await searchParams;
  const type=query.type==="accommodation"||query.type==="vehicle"||query.type==="guide"?query.type:"accommodation";
  return <main className="grid min-h-[75vh] place-items-center bg-sand-light px-6 py-20"><section className="w-full max-w-3xl rounded-[2.5rem] border border-stone/15 bg-white p-8 text-center md:p-14"><CircleCheck className="mx-auto size-12 text-gold"/><p className="eyebrow mb-4 mt-7">Application received</p><h1 className="font-serif text-4xl md:text-6xl">Thank you for applying to partner with Roam Ceylon.</h1><div className="mx-auto mt-8 grid max-w-md gap-3 rounded-2xl bg-sand-light p-5 text-sm"><div className="flex justify-between"><span className="text-stone">Reference</span><strong>{query.reference||"Pending"}</strong></div><div className="flex justify-between"><span className="text-stone">Category</span><strong>{names[type]}</strong></div></div><p className="mx-auto mt-8 max-w-2xl leading-8 text-slate/60">Our team will review your details, photos and supporting documents. We may contact you for clarification before preparing a listing. Submission does not guarantee publication, and no listing will go live without Roam Ceylon approval.</p><p className="mt-5 text-sm text-stone">Questions? hello@roamceylon.com</p><Button asChild className="mt-8"><Link href="/">Return to homepage</Link></Button></section></main>;
}
