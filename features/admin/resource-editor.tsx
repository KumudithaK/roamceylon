"use client";

import Link from "next/link";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {createClient} from "@/lib/supabase/client";
import type {Database} from "@/lib/database.types";
import type {ResourceConfig} from "@/lib/admin/resources";
import {GuideServiceRates,RentalPlans,RoomRates,TicketTypes} from "./pricing-plans";
import {ImageManager} from "./image-manager";
import {relationshipPublishIssues,type RelationshipState} from "@/lib/admin/resource-rules";

type RecordData=Record<string,unknown>;
type Plan=Database["public"]["Tables"]["pricing_plans"]["Row"];
type Option={id:string;name:string};
type EditorProps={record:RecordData;set:(key:string,value:unknown)=>void;tab:string;plans:Plan[];id:string;destinations:Option[];themes:Option[];experiences:Option[];relationships:RelationshipState;setRelationships:React.Dispatch<React.SetStateAction<RelationshipState>>};

export function ResourceEditor({config,id}:{config:ResourceConfig;id:string}){
  const router=useRouter();
  const [record,setRecord]=useState<RecordData|null>(null);
  const [plans,setPlans]=useState<Plan[]>([]);
  const [destinations,setDestinations]=useState<Option[]>([]);
  const [themes,setThemes]=useState<Option[]>([]);
  const [experiences,setExperiences]=useState<Option[]>([]);
  const [relationships,setRelationships]=useState<RelationshipState>({themeIds:[],destinationIds:[],experienceIds:[]});
  const [tab,setTab]=useState(config.tabs[0].id);
  const [message,setMessage]=useState("");
  useEffect(()=>{void (async()=>{
    const database=createClient();const {data:{session}}=await database.auth.getSession();
    if(!session){router.replace("/admin/login");return}
    const pricingQuery=config.entityType?database.from("pricing_plans").select("*").eq("entity_type",config.entityType).eq("entity_id",id).order("sort_order"):Promise.resolve({data:[] as Plan[]});
    const [{data:item,error},{data:pricing},{data:destinationRows},{data:themeRows},{data:experienceRows}]=await Promise.all([
      database.from(config.table).select("*").eq("id",id).single(),
      pricingQuery,
      database.from("destinations").select("id,name").order("name"),
      database.from("themes").select("id,name").order("name"),
      database.from("experiences").select("id,name").order("name")
    ]);
    if(error){setMessage("This resource could not be loaded.");return}
    const linkQueries:PromiseLike<{data:unknown[]|null}>[]=[];
    if(config.type==="destinations")linkQueries.push(database.from("theme_destinations").select("theme_id").eq("destination_id",id));
    if(config.type==="experiences")linkQueries.push(database.from("experience_themes").select("theme_id").eq("experience_id",id),database.from("experience_destinations").select("destination_id").eq("experience_id",id));
    if(config.type==="vehicles")linkQueries.push(database.from("vehicle_destinations").select("destination_id").eq("vehicle_id",id));
    if(config.type==="guides")linkQueries.push(database.from("guide_themes").select("theme_id").eq("guide_id",id),database.from("guide_destinations").select("destination_id").eq("guide_id",id),database.from("guide_experiences").select("experience_id").eq("guide_id",id));
    const links=await Promise.all(linkQueries);
    const all=links.flatMap(result=>(result.data??[]) as RecordData[]);
    setRelationships({themeIds:all.map(row=>row.theme_id).filter((value):value is string=>typeof value==="string"),destinationIds:all.map(row=>row.destination_id).filter((value):value is string=>typeof value==="string"),experienceIds:all.map(row=>row.experience_id).filter((value):value is string=>typeof value==="string")});
    setRecord(item as unknown as RecordData);setPlans(pricing??[]);setDestinations(destinationRows??[]);setThemes(themeRows??[]);setExperiences(experienceRows??[]);
  })()},[config,id,router]);
  const save=async()=>{
    if(!record)return;
    const publishing=record.status==="published";
    if(publishing){
      const missing:string[]=[];
      if(!record[config.imageField])missing.push("upload a main image");
      if(!String(record.image_alt??"").trim())missing.push("add an image description");
      if(["stays","vehicles","guides"].includes(config.type)&&!String(record.email??"").trim()&&!String(record.phone??"").trim())missing.push("add an email address or phone number");
      missing.push(...relationshipPublishIssues(config.type,record,relationships));
      if(missing.length){setMessage(`Cannot publish yet: ${missing.join("; ")}.`);return}
    }
    if(["destinations","experiences","vehicles","guides"].includes(config.type)){
      const {error:relationshipError}=await createClient().rpc("sync_content_relationships",{resource_type:config.type,resource_id:id,theme_ids:relationships.themeIds,destination_ids:relationships.destinationIds,experience_ids:relationships.experienceIds});
      if(relationshipError){setMessage(`Relationships could not be saved: ${relationshipError.message}`);return}
    }
    const {id:recordId,created_at,updated_at,...stored}=record;void recordId;void created_at;void updated_at;
    const changes:RecordData={...stored,...(publishing?{image_status:"approved",needs_image_review:false}:{}),...((publishing&&["stays","vehicles","guides"].includes(config.type))?{is_sample:false}:{})};
    const {error}=await createClient().from(config.table).update(changes as never).eq("id",id);
    const constraint=error?.message.match(/violates check constraint "([^"]+)"/)?.[1];
    const friendly=constraint?.endsWith("_real_publish")?"Publishing requires a main image, image description, and an email address or phone number.":constraint?.includes("publish_image")?"Publishing requires a main image and image description.":error?.message;
    setMessage(error?friendly||"This item could not be saved.":`${config.singular} saved.`);
  };
  if(!record)return <main className="grid min-h-screen place-items-center bg-[#f4f3ef]"><p className="text-stone">{message||`Loading ${config.singular.toLowerCase()}…`}</p></main>;
  const props:EditorProps={record,set:(key,value)=>setRecord(current=>current?{...current,[key]:value}:current),tab,plans,id,destinations,themes,experiences,relationships,setRelationships};
  return <main className="min-h-screen bg-[#f4f3ef] p-6 md:p-10"><div className="mx-auto max-w-6xl"><Link href={`/admin/resources/${config.type}`} className="text-sm font-semibold text-forest">← {config.label}</Link><div className="mt-8 flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow mb-3">{config.singular} editor</p><h1 className="font-serif text-4xl md:text-5xl">{String(record[config.nameField]||"Untitled")}</h1></div><Button onClick={()=>void save()}>Save changes</Button></div>{message&&<p className="mt-5 rounded-xl bg-white p-4 text-sm">{message}</p>}<nav className="mt-9 flex gap-1 overflow-x-auto border-b border-stone/20" aria-label={`${config.singular} editor sections`}>{config.tabs.map(item=><button key={item.id} onClick={()=>setTab(item.id)} className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold ${tab===item.id?"border-gold text-forest":"border-transparent text-stone hover:text-slate"}`}>{item.label}</button>)}</nav><section className="mt-7 rounded-3xl border border-stone/15 bg-white p-6 md:p-8"><ResourceFields type={config.type} {...props}/></section></div></main>;
}

function ResourceFields({type,...props}:{type:ResourceConfig["type"]}&EditorProps){
  if(type==="themes")return <ThemeEditor {...props}/>;
  if(type==="stays")return <StayEditor {...props}/>;
  if(type==="vehicles")return <VehicleEditor {...props}/>;
  if(type==="guides")return <GuideEditor {...props}/>;
  if(type==="experiences")return <ExperienceEditor {...props}/>;
  return <DestinationEditor {...props}/>;
}

function StayEditor({record,set,tab,plans,id,destinations}:EditorProps){
  if(tab==="gallery")return <Images record={record} set={set} type="stays" id={id} heroField="hero_image_url"/>;
  if(tab==="pricing")return <RoomRates entityId={id} initialPlans={plans}/>;
  if(tab==="amenities")return <Grid><ListField label="Amenities" value={record.amenities} onChange={value=>set("amenities",value)}/></Grid>;
  if(tab==="policies")return <Grid><Area label="Address" value={record.address} onChange={value=>set("address",value)}/><Text label="Booking website" value={record.booking_url} onChange={value=>set("booking_url",value)}/><Text label="Contact email" value={record.email} onChange={value=>set("email",value)}/><Text label="Contact phone" value={record.phone} onChange={value=>set("phone",value)}/></Grid>;
  if(tab==="seo")return <Seo record={record} set={set}/>;
  return <Grid><Text label="Property name" value={record.name} onChange={value=>set("name",value)}/><Text label="URL slug" value={record.slug} onChange={value=>set("slug",value)}/><Status value={record.status} onChange={value=>set("status",value)}/><Toggle label="Available to travellers" value={record.active} onChange={value=>set("active",value)}/><Select label="Destination" value={record.destination_id} onChange={value=>set("destination_id",value)} options={destinations.map(item=>[item.id,item.name])}/><Text label="Property type" value={record.property_type} onChange={value=>set("property_type",value)}/><NumberField label="Star rating" value={record.star_rating} onChange={value=>set("star_rating",value)}/><Area label="Short introduction" value={record.short_description} onChange={value=>set("short_description",value)}/></Grid>;
}

function VehicleEditor({record,set,tab,plans,id,destinations,relationships,setRelationships}:EditorProps){
  if(tab==="gallery")return <Images record={record} set={set} type="vehicles" id={id} heroField="hero_image_url"/>;
  if(tab==="pricing")return <RentalPlans entityId={id} initialPlans={plans}/>;
  if(tab==="specifications")return <Grid><NumberField label="Maximum passengers" value={record.passenger_capacity} onChange={value=>set("passenger_capacity",value)}/><Text label="Luggage capacity" value={record.luggage_capacity} onChange={value=>set("luggage_capacity",value)}/><Toggle label="Air conditioned" value={record.air_conditioned} onChange={value=>set("air_conditioned",value)}/><Toggle label="Driver normally included" value={record.driver_included} onChange={value=>set("driver_included",value)}/></Grid>;
  if(tab==="coverage")return <div className="grid gap-6"><Toggle label="Available nationwide" value={record.nationwide} onChange={value=>set("nationwide",value)}/>{!record.nationwide&&<RelationshipPicker label="Coverage destinations" description="Select every destination this vehicle can serve." options={destinations} selected={relationships.destinationIds} onChange={destinationIds=>setRelationships(current=>({...current,destinationIds}))}/>}</div>;
  return <Grid><Text label="Listing title" value={record.listing_title} onChange={value=>set("listing_title",value)}/><Text label="URL slug" value={record.slug} onChange={value=>set("slug",value)}/><Status value={record.status} onChange={value=>set("status",value)}/><Toggle label="Available to travellers" value={record.active} onChange={value=>set("active",value)}/><Text label="Vehicle type" value={record.vehicle_type} onChange={value=>set("vehicle_type",value)}/><Text label="Provider" value={record.provider_name} onChange={value=>set("provider_name",value)}/><Text label="Contact email" value={record.email} onChange={value=>set("email",value)}/><Text label="Contact phone" value={record.phone} onChange={value=>set("phone",value)}/><Area label="Traveller-facing description" value={record.short_description} onChange={value=>set("short_description",value)}/></Grid>;
}

function GuideEditor({record,set,tab,plans,id,destinations,themes,experiences,relationships,setRelationships}:EditorProps){
  if(tab==="gallery")return <Images record={record} set={set} type="guides" id={id} heroField="profile_image_url"/>;
  if(tab==="pricing")return <GuideServiceRates entityId={id} initialPlans={plans}/>;
  if(tab==="biography")return <Grid><Area label="Short biography" value={record.short_bio} onChange={value=>set("short_bio",value)}/><Area label="Full biography" value={record.full_bio} onChange={value=>set("full_bio",value)}/></Grid>;
  if(tab==="languages")return <Grid><ListField label="Languages" value={record.languages} onChange={value=>set("languages",value)}/><ListField label="Specialities" value={record.specialities} onChange={value=>set("specialities",value)}/></Grid>;
  if(tab==="coverage")return <div className="grid gap-7"><Toggle label="Available nationwide" value={record.nationwide} onChange={value=>set("nationwide",value)}/>{!record.nationwide&&<><RelationshipPicker label="Destinations" description="Places where this guide normally works." options={destinations} selected={relationships.destinationIds} onChange={destinationIds=>setRelationships(current=>({...current,destinationIds}))}/><RelationshipPicker label="Travel themes" description="Journey styles this guide specialises in." options={themes} selected={relationships.themeIds} onChange={themeIds=>setRelationships(current=>({...current,themeIds}))}/><RelationshipPicker label="Experiences" description="Specific experiences this guide can lead." options={experiences} selected={relationships.experienceIds} onChange={experienceIds=>setRelationships(current=>({...current,experienceIds}))}/></>}</div>;
  return <Grid><Text label="Guide name" value={record.name} onChange={value=>set("name",value)}/><Text label="URL slug" value={record.slug} onChange={value=>set("slug",value)}/><Status value={record.status} onChange={value=>set("status",value)}/><Toggle label="Available to travellers" value={record.active} onChange={value=>set("active",value)}/><NumberField label="Years of experience" value={record.years_experience} onChange={value=>set("years_experience",value)}/><Toggle label="Identity verified" value={record.verified} onChange={value=>set("verified",value)}/><Text label="Contact email" value={record.email} onChange={value=>set("email",value)}/><Text label="Contact phone" value={record.phone} onChange={value=>set("phone",value)}/></Grid>;
}

function ExperienceEditor({record,set,tab,plans,id,destinations,themes,relationships,setRelationships}:EditorProps){
  if(tab==="gallery")return <Images record={record} set={set} type="experiences" id={id} heroField="hero_image_url"/>;
  if(tab==="pricing")return <TicketTypes entityId={id} initialPlans={plans}/>;
  if(tab==="relationships")return <div className="grid gap-8"><RelationshipPicker label="Destinations" description="Where travellers can enjoy this experience. Multiple selections are supported." options={destinations} selected={relationships.destinationIds} onChange={destinationIds=>setRelationships(current=>({...current,destinationIds}))}/><RelationshipPicker label="Travel themes" description="Select only the themes this experience genuinely supports." options={themes} selected={relationships.themeIds} onChange={themeIds=>setRelationships(current=>({...current,themeIds}))}/></div>;
  if(tab==="story")return <Grid><Area label="About the experience" value={record.full_description} onChange={value=>set("full_description",value)}/><ListField label="Highlights" value={record.highlights} onChange={value=>set("highlights",value)}/><ListField label="What makes it unique" value={record.unique_points} onChange={value=>set("unique_points",value)}/><ListField label="What’s included" value={record.included} onChange={value=>set("included",value)}/><ListField label="Things to know" value={record.things_to_know} onChange={value=>set("things_to_know",value)}/><ListField label="Nearby attractions" value={record.nearby_attractions} onChange={value=>set("nearby_attractions",value)}/><ListField label="Traveller tips" value={record.traveller_tips} onChange={value=>set("traveller_tips",value)}/><ListField label="Editorial badges" value={record.badges} onChange={value=>set("badges",value)}/></Grid>;
  if(tab==="requirements")return <Grid><Toggle label="Family friendly" value={record.family_friendly} onChange={value=>set("family_friendly",value)}/><Toggle label="Suitable for children" value={record.suitable_for_children} onChange={value=>set("suitable_for_children",value)}/><Toggle label="Private option available" value={record.private_option} onChange={value=>set("private_option",value)}/></Grid>;
  return <Grid><Text label="Experience name" value={record.name} onChange={value=>set("name",value)}/><Text label="URL slug" value={record.slug} onChange={value=>set("slug",value)}/><Status value={record.status} onChange={value=>set("status",value)}/><Toggle label="Available to travellers" value={record.active} onChange={value=>set("active",value)}/><Text label="Category" value={record.category} onChange={value=>set("category",value)}/><Text label="Duration" value={record.duration} onChange={value=>set("duration",value)}/><Text label="Best season" value={record.best_season} onChange={value=>set("best_season",value)}/><Area label="One-line editorial introduction" value={record.short_description} onChange={value=>set("short_description",value)}/></Grid>;
}

function DestinationEditor({record,set,tab,id,themes,relationships,setRelationships}:EditorProps){
  if(tab==="gallery")return <Images record={record} set={set} type="destinations" id={id} heroField="hero_image_url"/>;
  if(tab==="relationships")return <RelationshipPicker label="Travel themes" description="Choose every theme this destination belongs to. This controls Theme → Destination discovery." options={themes} selected={relationships.themeIds} onChange={themeIds=>setRelationships(current=>({...current,themeIds}))}/>;
  if(tab==="description")return <Grid><Area label="Short description" value={record.short_description} onChange={value=>set("short_description",value)}/><Area label="Full destination story" value={record.full_description} onChange={value=>set("full_description",value)}/><Area label="Why visit" value={record.why_visit} onChange={value=>set("why_visit",value)}/><Area label="Historical importance" value={record.historical_importance} onChange={value=>set("historical_importance",value)}/><Area label="Cultural significance" value={record.cultural_significance} onChange={value=>set("cultural_significance",value)}/><Area label="UNESCO information" value={record.unesco_information} onChange={value=>set("unesco_information",value)}/><Area label="Nature and wildlife" value={record.nature_wildlife} onChange={value=>set("nature_wildlife",value)}/><Text label="Best time to visit" value={record.best_time_to_visit} onChange={value=>set("best_time_to_visit",value)}/><Text label="Weather" value={record.weather} onChange={value=>set("weather",value)}/><ListField label="Local highlights" value={record.local_highlights} onChange={value=>set("local_highlights",value)}/><ListField label="Nearby attractions" value={record.nearby_attractions} onChange={value=>set("nearby_attractions",value)}/><ListField label="Travel tips" value={record.travel_tips} onChange={value=>set("travel_tips",value)}/></Grid>;
  if(tab==="seo")return <Seo record={record} set={set}/>;
  return <Grid><Text label="Destination name" value={record.name} onChange={value=>set("name",value)}/><Text label="URL slug" value={record.slug} onChange={value=>set("slug",value)}/><Status value={record.status} onChange={value=>set("status",value)}/><Toggle label="Available to travellers" value={record.active} onChange={value=>set("active",value)}/><Text label="Province" value={record.province} onChange={value=>set("province",value)}/><Text label="Region" value={record.region} onChange={value=>set("region",value)}/><Toggle label="Coming soon" value={record.coming_soon} onChange={value=>set("coming_soon",value)}/></Grid>;
}

function ThemeEditor({record,set,tab,id}:EditorProps){
  if(tab==="gallery")return <Images record={record} set={set} type="themes" id={id} heroField="hero_image_url"/>;
  if(tab==="description")return <Grid><Area label="Short description" value={record.short_description} onChange={value=>set("short_description",value)}/><Area label="Full theme story" value={record.full_description} onChange={value=>set("full_description",value)}/><Area label="Travel inspiration" value={record.travel_inspiration} onChange={value=>set("travel_inspiration",value)}/><ListField label="Why choose this theme" value={record.why_choose} onChange={value=>set("why_choose",value)}/><ListField label="Suggested journey ideas" value={record.suggested_itinerary} onChange={value=>set("suggested_itinerary",value)}/></Grid>;
  if(tab==="seo")return <Seo record={record} set={set}/>;
  return <Grid><Text label="Theme name" value={record.name} onChange={value=>set("name",value)}/><Text label="URL slug" value={record.slug} onChange={value=>set("slug",value)}/><Status value={record.status} onChange={value=>set("status",value)}/><Toggle label="Available to travellers" value={record.active} onChange={value=>set("active",value)}/><Text label="Icon" value={record.icon} onChange={value=>set("icon",value)}/><NumberField label="Display order" value={record.display_order} onChange={value=>set("display_order",value)}/></Grid>;
}

const value=(input:unknown)=>String(input??"");
const gallery=(input:unknown)=>Array.isArray(input)?input.filter((item):item is string=>typeof item==="string"):[];
const fieldClass="rounded-xl border border-stone/25 bg-white px-4 py-3 outline-none focus:border-gold";
function Grid({children}:{children:React.ReactNode}){return <div className="grid gap-5 md:grid-cols-2">{children}</div>}
function Text({label,value:input,onChange}:{label:string;value:unknown;onChange:(value:string)=>void}){return <label className="grid gap-2 text-sm font-semibold">{label}<input value={value(input)} onChange={event=>onChange(event.target.value)} className={fieldClass}/></label>}
function NumberField({label,value:input,onChange}:{label:string;value:unknown;onChange:(value:number|null)=>void}){return <label className="grid gap-2 text-sm font-semibold">{label}<input type="number" min="0" value={value(input)} onChange={event=>onChange(event.target.value===""?null:Number(event.target.value))} className={fieldClass}/></label>}
function Area({label,value:input,onChange}:{label:string;value:unknown;onChange:(value:string)=>void}){return <label className="grid gap-2 text-sm font-semibold md:col-span-2">{label}<textarea rows={6} value={value(input)} onChange={event=>onChange(event.target.value)} className={fieldClass}/></label>}
function Toggle({label,value:input,onChange}:{label:string;value:unknown;onChange:(value:boolean)=>void}){return <label className="flex items-center gap-3 rounded-xl border border-stone/15 p-4 text-sm font-semibold"><input type="checkbox" checked={Boolean(input)} onChange={event=>onChange(event.target.checked)}/>{label}</label>}
function Select({label,value:input,onChange,options}:{label:string;value:unknown;onChange:(value:string)=>void;options:Array<[string,string]>}){return <label className="grid gap-2 text-sm font-semibold">{label}<select value={value(input)} onChange={event=>onChange(event.target.value)} className={fieldClass}><option value="">Select…</option>{options.map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>}
function Status({value:input,onChange}:{value:unknown;onChange:(value:string)=>void}){return <Select label="Publishing status" value={input} onChange={onChange} options={[["draft","Draft"],["in_review","Review"],["published","Published"],["archived","Archived"]]}/>}
function ListField({label,value:input,onChange}:{label:string;value:unknown;onChange:(value:string[])=>void}){return <label className="grid gap-2 text-sm font-semibold md:col-span-2">{label}<textarea rows={5} value={gallery(input).join("\n")} onChange={event=>onChange(event.target.value.split("\n").map(item=>item.trim()).filter(Boolean))} className={fieldClass}/><span className="text-xs font-normal text-stone">One item per line</span></label>}
function RelationshipPicker({label,description,options,selected,onChange}:{label:string;description:string;options:Option[];selected:string[];onChange:(ids:string[])=>void}){
  const toggle=(id:string)=>onChange(selected.includes(id)?selected.filter(item=>item!==id):[...selected,id]);
  return <section><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-serif text-2xl">{label}</h2><p className="mt-1 text-sm text-stone">{description}</p></div><span className="rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">{selected.length} selected</span></div>{options.length?<div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{options.map(option=>{const checked=selected.includes(option.id);return <label key={option.id} className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 text-sm font-semibold transition ${checked?"border-gold bg-gold/10 text-forest":"border-stone/15 bg-white hover:border-gold/40"}`}><input type="checkbox" checked={checked} onChange={()=>toggle(option.id)} className="accent-[#c58f2f]"/><span>{option.name}</span>{checked&&<span className="ml-auto text-gold">✓</span>}</label>})}</div>:<div className="mt-5 rounded-2xl border border-dashed border-stone/25 p-7 text-sm text-stone">No options are available yet. Create and save those resources first.</div>}</section>;
}
function Seo({record,set}:{record:RecordData;set:(key:string,value:unknown)=>void}){return <Grid><Text label="SEO title" value={record.seo_title} onChange={value=>set("seo_title",value)}/><Area label="SEO description" value={record.seo_description} onChange={value=>set("seo_description",value)}/></Grid>}
function Images({record,set,type,id,heroField}:{record:RecordData;set:(key:string,value:unknown)=>void;type:string;id:string;heroField:string}){return <ImageManager resourceType={type} resourceId={id} hero={typeof record[heroField]==="string"?record[heroField] as string:null} heroAlt={value(record.image_alt)} gallery={gallery(record.gallery)} onHeroChange={url=>{set(heroField,url);if(url){set("image_status","needs_review");set("needs_image_review",true)}}} onHeroAltChange={text=>set("image_alt",text)} onGalleryChange={urls=>set("gallery",urls)}/>}
