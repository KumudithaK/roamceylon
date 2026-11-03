
import {Text} from "@/components/i18n/text";
import {BookOpen} from "lucide-react";
import {brand} from "@/lib/brand";

export default function Page(){return <main><section className="editorial-noise bg-forest py-24 text-ivory md:py-36"><div className="shell"><p className="eyebrow text-gold-light"><Text>{"Places · People · Purpose"}</Text></p><h1 className="display mt-5 max-w-5xl"><Text>{brand.journalName}</Text></h1><p className="mt-7 max-w-2xl text-lg leading-8 text-ivory/70"><Text>{"Thoughtful guides to Sri Lanka's seasons, places, food, wildlife and living culture."}</Text></p></div></section><section className="section bg-ivory"><div className="shell grid gap-10 border-y border-forest/20 py-14 md:grid-cols-[.55fr_1fr]"><div><BookOpen className="size-7 text-gold"/><p className="eyebrow mt-8"><Text>{"The first edition"}</Text></p></div><div><h2 className="heading"><Text>{"Stories are being prepared with care."}</Text></h2><p className="prose-luxury mt-6 max-w-2xl"><Text>{"Our first journal entries are being written and reviewed. Until they are ready, explore the island through its published destinations and experiences."}</Text></p></div></div></section></main>}
