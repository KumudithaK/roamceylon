import Image from "next/image";
import {Text} from "@/components/i18n/text";
import {cn} from "@/lib/utils";

export function ElevateEndorsement({className}:{className?:string}){
  return <figure className={cn("m-0",className)}>
    <figcaption className="mb-3 text-xs font-semibold uppercase tracking-[.12em] text-forest">
      <Text>{"By Elevate Travels"}</Text>
    </figcaption>
    <Image
      src="/brand/elevate-travels-forest-gold.webp"
      alt="Elevate Travels — Elevating Destinations"
      width={480}
      height={390}
      sizes="180px"
      className="h-auto w-44 max-w-full object-contain"
    />
  </figure>;
}
