
import {Text} from "@/components/i18n/text";
import Image from "next/image";
import {ContactForm} from "@/features/contact/contact-form";
import {approvedPublicContact} from "@/lib/public-navigation";
import {safeExternalUrl} from "@/lib/security/safe-url";

const contactImage="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Sun_setting_over_Kandalama_Lake%2C_Sri_Lanka.jpg/1920px-Sun_setting_over_Kandalama_Lake%2C_Sri_Lanka.jpg";

export default async function Page({searchParams}:{searchParams:Promise<{quotation?:string}>}){
  const quotation=(await searchParams).quotation==="1";
  const whatsapp=safeExternalUrl(approvedPublicContact.whatsapp);
  const facebook=safeExternalUrl(approvedPublicContact.facebook);
  return <main>
    <section className="relative min-h-[52svh] overflow-hidden bg-forest text-ivory">
      <Image src={contactImage} alt="Evening light over Kandalama Lake in Sri Lanka" fill priority sizes="100vw" className="object-cover opacity-50"/>
      <div className="absolute inset-0 bg-gradient-to-r from-forest via-forest/75 to-transparent"/>
      <div className="shell relative flex min-h-[52svh] items-end py-16 md:py-24"><div className="max-w-4xl"><p className="eyebrow text-gold-light"><Text>{quotation?"Journey proposal":"Start a conversation"}</Text></p><h1 className="display mt-5"><Text>{quotation?"Let us shape the final details.":"Tell us where your curiosity leads."}</Text></h1></div></div>
    </section>
    <section className="section bg-ivory"><div className="shell grid gap-14 lg:grid-cols-[.72fr_1.28fr] lg:gap-24"><div><p className="editorial-index">01</p><p className="prose-luxury mt-8"><Text>{quotation?"Share your details and our journey designer will review availability, refine every arrangement and prepare your personal proposal from ELAVA8 TRAVELS.":"No sales script. No obligation. Just a thoughtful conversation with someone who knows Sri Lanka."}</Text></p><div className="mt-10 divide-y divide-forest/20 border-y border-forest/20 text-sm leading-7"><a className="block py-4 font-semibold" href={approvedPublicContact.phoneHref}>{approvedPublicContact.phone}</a>{whatsapp?<a className="block py-4" href={whatsapp} target="_blank" rel="noopener noreferrer"><Text>{"Chat with ELAVA8 TRAVELS on WhatsApp"}</Text></a>:null}<address className="whitespace-pre-line py-4 not-italic text-stone">{approvedPublicContact.address}</address>{facebook?<a className="block py-4" href={facebook} target="_blank" rel="noopener noreferrer"><Text>{"ELAVA8 TRAVELS on Facebook"}</Text></a>:null}</div></div><ContactForm quotation={quotation}/></div></section>
  </main>;
}
