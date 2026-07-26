import type {Metadata} from "next";
import {listContent} from "@/lib/data";
import {ListingPage} from "@/components/site/listing-page";
import {SriLankaMap} from "@/components/map/sri-lanka-map";
export const metadata:Metadata={title:"Destinations",description:"Explore Sri Lanka's coast, highlands, ancient cities and wild landscapes."};
export default async function Page(){const items=await listContent("destinations");return <><ListingPage eyebrow="Explore the island" title="Places with a story to tell." copy="From sacred highlands to slow southern shores, every destination reveals a different Sri Lanka." basePath="/destinations" items={items.map(x=>({id:x.id,slug:x.slug,name:x.name,image:x.hero_image_url,alt:x.image_alt,eyebrow:x.province,description:x.short_description}))}/><div className="shell pb-24"><SriLankaMap destinations={items}/></div></>}
