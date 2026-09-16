"use client";

import {useEffect,useId,useRef,useState} from "react";
import type {KeyboardEvent,ReactNode} from "react";
import {useRouter} from "next/navigation";
import {Check,ChevronLeft,ChevronRight,FileText,ImagePlus,Plus,Search,Trash2,X} from "lucide-react";
import {Button} from "@/components/ui/button";
import {applicationValuesForType,commonValueKeys,districts,exclusiveSelection,introductionIsValid,normalizedDraftType,normalizedProvince,parseLegacySelections,provinceForDistrict} from "@/lib/partners/partner-application";
import type {CatalogueOption,PartnerType} from "@/lib/partners/partner-application";
import {cn} from "@/lib/utils";

type Values=Record<string,string|boolean>;
type Entry=Record<string,string|boolean>;

const initialValues:Values={applicantName:"",businessName:"",email:"",countryCode:"+94",phone:"",preferredContactMethod:"whatsapp",address:"",district:"",province:"",website:"",socialUrl:"",introduction:"",heardFrom:"",consent:false,accurate:false,honeypot:"",propertyType:"Hotel",destination:"",totalRooms:"",guestCapacity:"",pricingBasis:"Per room per night",startingPrice:"",currency:"USD",yearEstablished:"",starCategory:"",mealPlans:"",checkIn:"",checkOut:"",amenities:"",parking:"Yes",driverAccommodation:"No",guideAccommodation:"No",accessibility:"",sustainablePractices:"",operatorType:"Company",operatingBase:"",coverage:"Island-wide",vehicleCount:"1",airportTransfers:"Yes",islandWide:"Yes",driverIncluded:"Yes",guideType:"National guide",homeBase:"",languages:"English",yearsExperience:"",specialistKnowledge:"",destinationsCovered:"",experiencesSupported:"",halfDayFee:"",fullDayFee:"",multiDay:"Yes",overnightTrips:"Yes",driverGuide:"No",licenceNumber:"",associationMembership:"",availabilityNotes:""};
const MAX_FILE_BYTES=3*1024*1024;
const MAX_TOTAL_FILE_BYTES=Math.floor(3.5*1024*1024);
const steps=[
  {label:"Contact",title:"Who should we speak with?",copy:"Begin with a person, a professional name and the best way to continue the conversation."},
  {label:"Context",title:"Where are you based?",copy:"Share enough professional context for a useful, grounded review."},
  {label:"Service",title:"What do you bring to a journey?",copy:"The questions adapt to accommodation, transport or guiding. Only the first practical details are required."},
  {label:"Review",title:"Add supporting context when useful.",copy:"Photos and verification documents are optional. Documents remain private and submission never publishes a listing automatically."}
] as const;
const fieldsByType={
  accommodation:[["propertyType","Property type"],["destination","Destination or nearest town"],["totalRooms","Rooms or units"],["guestCapacity","Maximum guest capacity"],["yearEstablished","Year established"],["starCategory","Star category"],["startingPrice","Indicative starting price"],["pricingBasis","Pricing basis"],["mealPlans","Meal plans available"],["checkIn","Check-in time"],["checkOut","Check-out time"],["amenities","Amenities"],["parking","Parking available"],["driverAccommodation","Driver accommodation"],["guideAccommodation","Guide accommodation"],["accessibility","Accessibility information"],["sustainablePractices","Sustainable practices"]],
  vehicle:[["operatorType","Owner type"],["operatingBase","Operating base"],["coverage","Service coverage"],["vehicleCount","Number of vehicles"],["airportTransfers","Airport transfers"],["islandWide","Island-wide trips"],["driverIncluded","Driver included"],["languages","Languages spoken by drivers"]],
  guide:[["guideType","Guide type"],["homeBase","Home base"],["destinationsCovered","Destinations covered"],["languages","Languages"],["yearsExperience","Years of experience"],["specialistKnowledge","Specialist knowledge"],["experiencesSupported","Experiences supported"],["halfDayFee","Half-day indicative fee"],["fullDayFee","Full-day indicative fee"],["multiDay","Multi-day availability"],["overnightTrips","Overnight trips"],["driverGuide","Driver-guide availability"],["licenceNumber","Licence number"],["associationMembership","Association membership"],["availabilityNotes","Availability notes"]]
} as const;

export function PartnerApplicationForm({initialType,explicitType,destinationOptions,experienceOptions}:{initialType:PartnerType;explicitType:boolean;destinationOptions:CatalogueOption[];experienceOptions:CatalogueOption[]}){
  const router=useRouter();
  const [type,setType]=useState<PartnerType>(initialType);
  const [step,setStep]=useState(0);
  const [values,setValues]=useState<Values>(initialValues);
  const [entries,setEntries]=useState<Entry[]>([]);
  const [destinationSelections,setDestinationSelections]=useState<string[]>([]);
  const [experienceSelections,setExperienceSelections]=useState<string[]>([]);
  const [media,setMedia]=useState<File[]>([]);
  const [documents,setDocuments]=useState<File[]>([]);
  const [error,setError]=useState("");
  const [invalidField,setInvalidField]=useState("");
  const [submitting,setSubmitting]=useState(false);
  const [hydrated,setHydrated]=useState(false);
  const submissionKey=useRef<string|null>(null);
  const errorRef=useRef<HTMLDivElement>(null);

  useEffect(()=>{try{
    const saved=sessionStorage.getItem("roam-ceylon-partner-draft");
    if(saved){
      const draft=JSON.parse(saved) as {type?:unknown;values?:Record<string,unknown>;entries?:Entry[];destinationSelections?:unknown;experienceSelections?:unknown};
      const selectedType=normalizedDraftType(initialType,explicitType,draft.type);
      const draftValues={...initialValues,...draft.values,honeypot:""} as Values;
      const typeChanged=(explicitType&&draft.type!==selectedType)||(typeof draft.type==="string"&&draft.type!==selectedType);
      const common=Object.fromEntries(commonValueKeys.map(key=>[key,draftValues[key]])) as Values;
      const normalized=typeChanged?{...initialValues,...common,consent:false,accurate:false}:draftValues;
      normalized.province=normalizedProvince(normalized);
      queueMicrotask(()=>{
        setType(selectedType);
        setValues(normalized);
        setEntries(typeChanged?[]:draft.entries||[]);
        setDestinationSelections(typeChanged?[]:parseLegacySelections(draft.destinationSelections??draft.values?.destinationsCovered));
        setExperienceSelections(typeChanged?[]:parseLegacySelections(draft.experienceSelections??draft.values?.experiencesSupported));
        setHydrated(true);
      });
      return;
    }
  }catch{}
  queueMicrotask(()=>setHydrated(true));
  },[explicitType,initialType]);
  useEffect(()=>{if(!hydrated)return;const {honeypot,...savedValues}=values;void honeypot;sessionStorage.setItem("roam-ceylon-partner-draft",JSON.stringify({type,values:savedValues,entries,destinationSelections,experienceSelections}))},[destinationSelections,entries,experienceSelections,hydrated,type,values]);
  useEffect(()=>{if(error)errorRef.current?.focus()},[error]);

  const set=(key:string,value:string|boolean)=>setValues(current=>({...current,[key]:value}));
  const changeType=(nextType:PartnerType)=>{
    if(nextType===type)return;
    const common=Object.fromEntries(commonValueKeys.map(key=>[key,values[key]])) as Values;
    setType(nextType);setValues({...initialValues,...common,consent:false,accurate:false});setEntries([]);setDestinationSelections([]);setExperienceSelections([]);setError("");setInvalidField("");
  };
  const required=step===0?["applicantName","businessName","email","phone","preferredContactMethod"]:step===1?["address","district","province","introduction","heardFrom"]:step===2?fieldsByType[type].slice(0,type==="guide"?6:4).map(([key])=>key):[];
  const next=()=>{
    const missing=required.filter(key=>!String(values[key]??"").trim());
    if(missing.length){setInvalidField(missing[0]);setError(`Please complete: ${missing.map(labelFor).join(", ")}.`);return}
    if(step===1&&!introductionIsValid(values.introduction)){setInvalidField("introduction");setError("The short introduction must contain at least 30 non-whitespace characters.");return}
    if(values.website&&!isUrl(String(values.website))||values.socialUrl&&!isUrl(String(values.socialUrl))){setError("Please enter complete website and social links, including https://.");return}
    setInvalidField("");setError("");setStep(current=>Math.min(3,current+1));
  };
  const addEntry=()=>setEntries(items=>[...items,type==="accommodation"?{name:"",description:"",capacity:"",price:"",pricingBasis:String(values.pricingBasis)}:{category:"Car",model:"",year:"",registration:"",capacity:"",luggage:"",airConditioning:"Yes",driverIncluded:"Yes",rate:"",airportRate:"",extraKmRate:"",notes:""}]);
  const updateEntry=(index:number,key:string,value:string|boolean)=>setEntries(items=>items.map((item,itemIndex)=>itemIndex===index?{...item,[key]:value}:item));
  const submit=async()=>{
    if(!values.consent||!values.accurate){setError("Confirm consent and the accuracy of the submitted information.");return}
    const finalRequired=["applicantName","businessName","email","phone","preferredContactMethod","address","district","province","introduction","heardFrom"];
    const missing=finalRequired.filter(key=>!String(values[key]??"").trim());
    if(missing.length){setError(`Please complete: ${missing.map(labelFor).join(", ")}.`);return}
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(values.email))){setError("Please enter a valid email address.");return}
    if(!introductionIsValid(values.introduction)){setError("The short introduction must contain at least 30 characters.");return}
    if(String(values.phone).replace(/\D/g,"").length<7){setError("Please enter a complete phone or WhatsApp number.");return}
    const totalFileBytes=[...media,...documents].reduce((total,file)=>total+file.size,0);
    if([...media,...documents].some(file=>file.size>MAX_FILE_BYTES)){setError("Each optional file must be 3 MB or smaller.");return}
    if(totalFileBytes>MAX_TOTAL_FILE_BYTES){setError("The combined optional uploads must be 3.5 MB or smaller. Remove or compress a file, then try again.");return}
    setSubmitting(true);setError("");setInvalidField("");
    submissionKey.current??=crypto.randomUUID();
    const payload={submissionKey:submissionKey.current,partnerType:type,applicantName:values.applicantName,businessName:values.businessName,email:values.email,phone:`${values.countryCode} ${values.phone}`,preferredContactMethod:values.preferredContactMethod,address:values.address,district:values.district,province:provinceForDistrict(String(values.district)),website:values.website,socialUrl:values.socialUrl,introduction:values.introduction,heardFrom:values.heardFrom,consent:values.consent,accurate:values.accurate,honeypot:values.honeypot,applicationData:applicationValuesForType(type,values,entries,destinationSelections,experienceSelections)};
    const body=new FormData();body.set("payload",JSON.stringify(payload));media.forEach(file=>body.append("media",file));documents.forEach(file=>body.append("documents",file));
    try{
      const response=await fetch("/api/partner-applications",{method:"POST",body});
      const responseText=await response.text();
      let result:Record<string,unknown>={};
      try{result=JSON.parse(responseText) as Record<string,unknown>}catch{}
      if(!response.ok){
        const fields=result.fields&&typeof result.fields==="object"?result.fields as Record<string,unknown>:null;
        const invalid=fields?Object.keys(fields).filter(key=>Array.isArray(fields[key])&&Boolean((fields[key] as unknown[]).length)):[];
        const fallback=response.status===413?"The optional uploads are too large for a single secure submission. Remove or compress a file, then try again.":"Application could not be submitted. Your draft has been preserved; please try again.";
        setError(invalid.length?`Please check: ${invalid.map(labelFor).join(", ")}.`:typeof result.error==="string"?result.error:fallback);return;
      }
      if(typeof result.reference!=="string"||typeof result.type!=="string")throw new Error("Invalid application response");
      sessionStorage.removeItem("roam-ceylon-partner-draft");
      router.push(`/partners/application-received?reference=${encodeURIComponent(result.reference)}&type=${encodeURIComponent(result.type)}`);
    }catch{
      setError("Application could not be submitted. Your draft has been preserved; check your connection and try again.");
    }finally{
      setSubmitting(false);
    }
  };

  return <main id="content" className="bg-ivory">
    <section className="editorial-noise bg-forest py-16 text-ivory md:py-24">
      <div className="shell grid gap-8 lg:grid-cols-[.65fr_1.35fr] lg:items-end"><div><p className="editorial-index text-gold-light/35">03</p><p className="eyebrow mt-7 text-gold-light">Begin a partner conversation</p></div><div><h1 id="partner-form-title" className="font-serif text-[clamp(2.8rem,6vw,5.5rem)] leading-[1] tracking-[-.035em]">Tell us what you bring to the journey.</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-ivory/68">Your draft is saved only in this browser. Submission starts a manual review and never creates a public listing, account or agreement automatically.</p></div></div>
    </section>

    <section className="section">
      <div className="shell" aria-labelledby="partner-form-title">
        <p id="partner-required-note" className="mb-7 text-sm text-muted"><span aria-hidden="true">*</span> Required information. Supporting files are optional.</p>
        <ol aria-label="Application progress" className="grid gap-px overflow-hidden rounded-xl border border-forest/20 bg-forest/20 sm:grid-cols-2 lg:grid-cols-4">{steps.map((item,index)=><li key={item.label} aria-current={index===step?"step":undefined} className={cn("flex min-h-16 items-center gap-3 bg-surface px-4 py-3 text-xs font-semibold uppercase tracking-[.1em]",index===step&&"bg-forest text-ivory",index<step&&"bg-sand text-forest")}><span className="font-serif text-lg">{index<step?<Check className="size-4" aria-hidden="true"/>:String(index+1).padStart(2,"0")}</span>{item.label}</li>)}</ol>

        {error?<div ref={errorRef} id="partner-form-error" role="alert" aria-live="assertive" tabIndex={-1} className="mt-6 border-l-2 border-error bg-red-50 px-5 py-4 text-sm font-semibold text-red-900 focus:outline-none">{error}</div>:null}

        <div className="mt-8 grid overflow-hidden border border-forest/20 bg-surface lg:grid-cols-[.38fr_1fr]">
          <aside className="bg-sand p-7 md:p-10"><p className="font-serif text-5xl text-gold/70">{String(step+1).padStart(2,"0")}</p><p className="eyebrow mt-8">{steps[step].label}</p><h2 className="mt-4 font-serif text-3xl leading-tight">{steps[step].title}</h2><p className="mt-5 text-sm leading-7 text-muted">{steps[step].copy}</p>{step===3?<p className="mt-8 border-t border-forest/20 pt-6 text-xs leading-6 text-muted">The final button creates a real partner application and optional private uploads. Review everything before submitting.</p>:null}</aside>
          <section aria-label={`${steps[step].label} information`} className="p-6 md:p-10">
            {step===0?<Grid><Select label="Partner type" value={type} required onChange={value=>changeType(value as PartnerType)} options={[["accommodation","Accommodation"],["vehicle","Vehicle or fleet"],["guide","Local guide"]]}/><Text label="Full name" required value={values.applicantName} onChange={value=>set("applicantName",value)}/><Text label="Business or professional name" required value={values.businessName} onChange={value=>set("businessName",value)}/><Text label="Email" required type="email" value={values.email} onChange={value=>set("email",value)}/><div className="grid grid-cols-[6rem_1fr] gap-3"><Text label="Code" value={values.countryCode} onChange={value=>set("countryCode",value)}/><Text label="Phone / WhatsApp" required value={values.phone} onChange={value=>set("phone",value)}/></div><Select label="Preferred contact" required value={values.preferredContactMethod} onChange={value=>set("preferredContactMethod",value)} options={[["whatsapp","WhatsApp"],["email","Email"],["phone","Phone"]]}/><input tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" value={String(values.honeypot)} onChange={event=>set("honeypot",event.target.value)}/></Grid>:null}

            {step===1?<Grid><Area label="Full address" required value={values.address} onChange={value=>set("address",value)}/><Select label="District" required value={values.district} onChange={value=>setValues(current=>({...current,district:value,province:provinceForDistrict(value)}))} options={districts.map(item=>[item,item])}/><DerivedField label="Province" value={String(values.province)} help="Automatically determined by the selected district."/><Text label="Website" hint="Optional" type="url" value={values.website} onChange={value=>set("website",value)}/><Text label="Social media page" hint="Optional" type="url" value={values.socialUrl} onChange={value=>set("socialUrl",value)}/><Area id="partner-introduction" label="Short introduction" required value={values.introduction} invalid={invalidField==="introduction"} describedBy={invalidField==="introduction"?"partner-form-error":undefined} onChange={value=>set("introduction",value)}/><Select label="How did you hear about us?" required value={values.heardFrom} onChange={value=>set("heardFrom",value)} options={["Recommendation","Search engine","Social media","Tourism network","The Ceylon Edition team","Other"].map(item=>[item,item])}/></Grid>:null}

            {step===2?<><Grid>{fieldsByType[type].map(([key,label])=>key==="propertyType"?<Select key={key} label={label} required value={values[key]} onChange={value=>set(key,value)} options={["Hotel","Boutique hotel","Villa","Guest house","Resort","Homestay","Eco lodge","Apartment","Hostel","Other"].map(item=>[item,item])}/>:key==="guideType"?<Select key={key} label={label} required value={values[key]} onChange={value=>set(key,value)} options={["National guide","Chauffeur guide","Site guide","Nature guide","Wildlife guide","Adventure guide","Cultural guide","Language specialist","Other"].map(item=>[item,item])}/>:key==="destinationsCovered"?<CatalogueMultiSelect key={key} label={label} required options={[{value:"Island Wide",label:"Island Wide"},...destinationOptions]} selections={destinationSelections} exclusive="Island Wide" onChange={items=>{setDestinationSelections(items);set("destinationsCovered",items.join("; "))}}/>:key==="experiencesSupported"?<CatalogueMultiSelect key={key} label={label} options={[{value:"Any Experience",label:"Any Experience"},...experienceOptions]} selections={experienceSelections} exclusive="Any Experience" onChange={items=>{setExperienceSelections(items);set("experiencesSupported",items.join("; "))}}/>:key==="pricingBasis"?<Select key={key} label={label} value={values[key]} onChange={value=>set(key,value)} options={["Per room per night","Per person per night","Per villa per night","Per unit per night","Contact for quotation"].map(item=>[item,item])}/>:yesNoKeys.includes(key)?<Select key={key} label={label} value={values[key]} onChange={value=>set(key,value)} options={[["Yes","Yes"],["No","No"]]}/>:<Text key={key} label={label} required={required.includes(key)} value={values[key]} onChange={value=>set(key,value)}/>)}</Grid>{type!=="guide"?<div className="mt-10 border-t border-forest/20 pt-8"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h3 className="font-serif text-2xl">{type==="accommodation"?"Room or unit types":"Vehicles"}</h3><p className="mt-2 text-sm text-muted">Optional at this stage. Add practical detail only when it is ready to share.</p></div><Button type="button" variant="outline" onClick={addEntry}><Plus aria-hidden="true"/>Add an entry</Button></div><div className="mt-6 grid gap-5">{entries.map((entry,index)=><fieldset key={index} className="grid gap-4 border border-forest/15 bg-sand/45 p-5 md:grid-cols-3"><legend className="px-2 text-xs font-bold uppercase tracking-[.12em]">Entry {index+1}</legend>{Object.keys(entry).map(key=><Text key={key} label={labelFor(key)} value={entry[key]} onChange={value=>updateEntry(index,key,value)}/>) }<button type="button" className="min-h-11 text-left text-sm font-semibold text-red-800" onClick={()=>setEntries(items=>items.filter((_,itemIndex)=>itemIndex!==index))}><Trash2 className="mr-2 inline size-4" aria-hidden="true"/>Remove entry</button></fieldset>)}</div></div>:null}</>:null}

            {step===3?<div className="grid gap-9"><Uploads title="Photos" icon={ImagePlus} accept="image/jpeg,image/png,image/webp" files={media} setFiles={setMedia} max={10} help={photoGuidance[type]} onError={setError}/><Uploads title="Verification documents" icon={FileText} accept="application/pdf,image/jpeg,image/png" files={documents} setFiles={setDocuments} max={6} help={documentGuidance[type]} onError={setError}/><p className="-mt-5 text-xs leading-6 text-muted">Each file must be 3 MB or smaller and combined uploads must be 3.5 MB or smaller. Documents are stored privately, reviewed manually and never published automatically.</p><fieldset className="grid gap-4 border-t border-forest/20 pt-7"><legend className="mb-2 font-serif text-2xl">Before submitting</legend><label className="flex min-h-14 gap-3 border border-forest/20 p-4 text-sm leading-6"><input type="checkbox" required checked={Boolean(values.consent)} onChange={event=>set("consent",event.target.checked)}/><span>I consent to The Ceylon Edition contacting me about this application.</span></label><label className="flex min-h-14 gap-3 border border-forest/20 p-4 text-sm leading-6"><input type="checkbox" required checked={Boolean(values.accurate)} onChange={event=>set("accurate",event.target.checked)}/><span>I confirm that the submitted information is accurate.</span></label></fieldset></div>:null}

            <div className="mt-10 flex items-center justify-between border-t border-forest/20 pt-7"><Button type="button" variant="ghost" disabled={step===0||submitting} onClick={()=>{setError("");setStep(current=>current-1)}}><ChevronLeft aria-hidden="true"/>Back</Button>{step<3?<Button type="button" onClick={next}>Continue<ChevronRight aria-hidden="true"/></Button>:<Button type="button" variant="accent" disabled={submitting} aria-busy={submitting} onClick={()=>void submit()}>{submitting?"Submitting and uploading…":"Submit for manual review"}</Button>}</div>
          </section>
        </div>
      </div>
    </section>
  </main>;
}

const yesNoKeys=["parking","driverAccommodation","guideAccommodation","airportTransfers","islandWide","driverIncluded","multiDay","overnightTrips","driverGuide"];
const photoGuidance:Record<PartnerType,string>={
  accommodation:"Optional — property, room, facilities or surrounding-area photographs help us understand the stay.",
  vehicle:"Optional — photographs of the vehicle or fleet, including the type of vehicle offered.",
  guide:"Optional — a clear professional or profile photograph may be included."
};
const documentGuidance:Record<PartnerType,string>={
  accommodation:"Optional — relevant registration, licence or other business verification documents may be included.",
  vehicle:"Optional — relevant vehicle, operator, registration or licence documentation may be included.",
  guide:"Optional — a guide licence, accreditation, association membership or other relevant professional verification may be included."
};
const isUrl=(value:string)=>{try{return ["http:","https:"].includes(new URL(value).protocol)}catch{return false}};
const labelFor=(key:string)=>({applicantName:"full name",businessName:"business or professional name",email:"email",phone:"phone / WhatsApp",preferredContactMethod:"preferred contact method",address:"full address",district:"district",province:"province",website:"website",socialUrl:"social media page",introduction:"short introduction",heardFrom:"how you heard about The Ceylon Edition",consent:"contact consent",accurate:"accuracy confirmation",honeypot:"spam check",applicationData:"application details",partnerType:"partner type",name:"Room type",description:"Short description",capacity:"Maximum guests / passengers",price:"Indicative price",pricingBasis:"Pricing basis",category:"Vehicle category",model:"Make and model",year:"Year",registration:"Registration number",luggage:"Luggage capacity",airConditioning:"Air-conditioning",driverIncluded:"Driver included",rate:"Daily rate",airportRate:"Airport transfer rate",extraKmRate:"Extra kilometre rate",notes:"Notes"}[key]||key);
const fieldClass="form-control focus:border-gold";

function FieldLabel({label,required,hint}:{label:string;required?:boolean;hint?:string}){return <span className="flex items-baseline justify-between gap-3 text-sm font-semibold"><span>{label}{required?<span aria-hidden="true" className="ml-1 text-gold">*</span>:null}</span>{hint?<span className="text-xs font-normal text-muted">{hint}</span>:null}</span>}
function Grid({children}:{children:ReactNode}){return <div className="grid gap-x-6 gap-y-7 md:grid-cols-2">{children}</div>}
function Text({label,value,type="text",required=false,hint,onChange}:{label:string;value:string|boolean;type?:string;required?:boolean;hint?:string;onChange:(value:string)=>void}){return <label className="grid gap-2"><FieldLabel label={label} required={required} hint={hint}/><input type={type} required={required} aria-describedby={required?"partner-required-note":undefined} value={String(value)} onChange={event=>onChange(event.target.value)} className={fieldClass}/></label>}
function Area({id,label,value,required=false,invalid=false,describedBy,onChange}:{id?:string;label:string;value:string|boolean;required?:boolean;invalid?:boolean;describedBy?:string;onChange:(value:string)=>void}){return <label className="grid gap-2 md:col-span-2"><FieldLabel label={label} required={required}/><textarea id={id} rows={4} required={required} aria-invalid={invalid||undefined} aria-describedby={describedBy??(required?"partner-required-note":undefined)} value={String(value)} onChange={event=>onChange(event.target.value)} className={fieldClass}/></label>}
function Select({label,value,required=false,onChange,options}:{label:string;value:string|boolean;required?:boolean;onChange:(value:string)=>void;options:Array<readonly [string,string]>}){return <label className="grid gap-2"><FieldLabel label={label} required={required}/><select required={required} aria-describedby={required?"partner-required-note":undefined} value={String(value)} onChange={event=>onChange(event.target.value)} className={fieldClass}><option value="">Select…</option>{options.map(([key,option])=><option key={key} value={key}>{option}</option>)}</select></label>}
function DerivedField({label,value,help}:{label:string;value:string;help:string}){return <div className="grid gap-2"><FieldLabel label={label} required/><div role="status" aria-live="polite" className="form-control flex min-h-12 items-center bg-sand/45 text-forest">{value||"Select a district"}</div><p className="text-xs text-muted">{help}</p></div>}

function CatalogueMultiSelect({label,required=false,options,selections,exclusive,onChange}:{label:string;required?:boolean;options:CatalogueOption[];selections:string[];exclusive:string;onChange:(values:string[])=>void}){
  const id=useId();
  const [query,setQuery]=useState("");
  const [open,setOpen]=useState(false);
  const [active,setActive]=useState(0);
  const inputRef=useRef<HTMLInputElement>(null);
  const filtered=options.filter(option=>option.label.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const choose=(value:string)=>{onChange(exclusiveSelection(selections,value,exclusive));setQuery("");setActive(0);setOpen(true);inputRef.current?.focus()};
  const keyDown=(event:KeyboardEvent<HTMLInputElement>)=>{
    if(event.key==="ArrowDown"){event.preventDefault();setOpen(true);setActive(index=>Math.min(index+1,Math.max(0,filtered.length-1)))}
    else if(event.key==="ArrowUp"){event.preventDefault();setActive(index=>Math.max(0,index-1))}
    else if(event.key==="Enter"&&open&&filtered[active]){event.preventDefault();choose(filtered[active].value)}
    else if(event.key==="Escape"){event.preventDefault();setOpen(false)}
  };
  return <div className="grid gap-2 md:col-span-2"><FieldLabel label={label} required={required}/><div className="border border-forest/20 bg-ivory p-3 focus-within:border-gold"><div className="flex flex-wrap gap-2">{selections.map(value=><span key={value} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-gold/35 bg-sand px-4 py-2 text-sm text-forest">{value}<button type="button" aria-label={`Remove ${value}`} onClick={()=>onChange(selections.filter(item=>item!==value))} className="rounded-full p-1 focus-ring"><X className="size-3" aria-hidden="true"/></button></span>)}</div><div className={cn("flex items-center gap-3",selections.length&&"mt-3")}><Search className="size-4 shrink-0 text-gold" aria-hidden="true"/><input ref={inputRef} role="combobox" aria-label={`Search ${label}`} aria-expanded={open} aria-controls={`${id}-listbox`} aria-autocomplete="list" value={query} onFocus={()=>setOpen(true)} onChange={event=>{setQuery(event.target.value);setOpen(true);setActive(0)}} onKeyDown={keyDown} className="min-h-11 w-full bg-transparent text-sm outline-none" placeholder={`Search published ${label.toLocaleLowerCase()}…`}/></div></div>{open?<div id={`${id}-listbox`} role="listbox" aria-label={label} className="max-h-64 overflow-y-auto border border-forest/20 bg-ivory p-2 shadow-xl">{filtered.length?filtered.map((option,index)=><button key={option.value} type="button" role="option" aria-selected={selections.includes(option.value)} onMouseDown={event=>event.preventDefault()} onClick={()=>choose(option.value)} className={cn("flex min-h-11 w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-sand focus:bg-sand focus:outline-none",index===active&&"bg-sand")}>{option.label}{selections.includes(option.value)?<Check className="size-4 text-gold" aria-hidden="true"/>:null}</button>):<p className="px-4 py-6 text-sm text-muted">No published matches found.</p>}</div>:null}</div>;
}

function Uploads({title,icon:Icon,accept,files,setFiles,max,help,onError}:{title:string;icon:typeof ImagePlus;accept:string;files:File[];setFiles:(files:File[])=>void;max:number;help:string;onError:(message:string)=>void}){return <section><div className="flex items-start gap-3"><Icon className="mt-1 size-5 shrink-0 text-gold" aria-hidden="true"/><div><h3 className="font-serif text-2xl">{title}</h3><p className="mt-1 text-sm leading-6 text-muted">{help}</p></div></div><label className="mt-4 grid min-h-28 cursor-pointer place-items-center border border-dashed border-forest/35 bg-ivory p-7 text-center text-sm font-semibold hover:border-gold focus-within:border-gold"><input type="file" multiple accept={accept} className="sr-only" onChange={event=>{const selected=Array.from(event.target.files||[]);if(selected.some(file=>file.size>MAX_FILE_BYTES)){onError("Each optional file must be 3 MB or smaller.");event.target.value="";return}const next=[...files,...selected].slice(0,max);setFiles(next);event.target.value=""}}/><span>Choose optional files</span></label><div className="mt-3 grid gap-2">{files.map((file,index)=><div key={`${file.name}-${index}`} className="flex items-center justify-between gap-4 bg-sand/55 px-4 py-3 text-xs"><span className="truncate">{file.name} · {(file.size/1024/1024).toFixed(1)} MB</span><button type="button" onClick={()=>setFiles(files.filter((_,itemIndex)=>itemIndex!==index))} className="min-h-11 shrink-0 font-semibold text-red-800">Remove</button></div>)}</div></section>}
