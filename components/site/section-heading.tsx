
import {Text} from "@/components/i18n/text";
export function SectionHeading({eyebrow,title,copy,center=false,as:Heading="h2"}:{eyebrow:string;title:string;copy?:string;center?:boolean;as?:"h1"|"h2"|"h3"}){return <div className={center?"reading-measure mx-auto mb-10 text-center md:mb-11":"reading-measure mb-10 md:mb-11"}><p className="eyebrow mb-3"><Text>{eyebrow}</Text></p><Heading className={Heading==="h1"?"heading-1":Heading==="h3"?"heading-3":"heading"}><Text>{title}</Text></Heading>{copy&&<p className="prose-luxury mt-5"><Text>{copy}</Text></p>}</div>}
