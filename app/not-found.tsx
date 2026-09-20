import Link from "next/link";
import {ArrowRight} from "lucide-react";
import {Button} from "@/components/ui/button";
import {brand} from "@/lib/brand";
import {journeyLaunchHref} from "@/lib/public-navigation";

export default function NotFound(){
  return <main className="bg-ivory text-slate">
    <section className="shell flex min-h-[68svh] items-center py-20">
      <div className="max-w-3xl">
        <p className="eyebrow">The Ceylon Edition · 404</p>
        <h1 className="mt-5 font-serif text-[clamp(3.25rem,7vw,6.5rem)] leading-[.96] tracking-[-.035em]">This path is not part of the journey.</h1>
        <p className="mt-7 max-w-xl text-lg leading-8 text-muted">Return to our Sri Lanka journeys, or begin shaping an Edition around the places and experiences that matter to you.</p>
        <div className="mt-9 flex flex-wrap gap-4">
          <Button asChild variant="accent" size="lg"><Link href={journeyLaunchHref}>{brand.primaryCta}<ArrowRight aria-hidden="true"/></Link></Button>
          <Button asChild variant="outline" size="lg"><Link href="/">Return home</Link></Button>
        </div>
      </div>
    </section>
  </main>;
}
