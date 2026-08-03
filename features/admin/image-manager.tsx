"use client";

import Image from "next/image";
import {useState} from "react";
import {ImagePlus,Trash2,Upload} from "lucide-react";
import {createClient} from "@/lib/supabase/client";

const safeName=(name:string)=>name.toLowerCase().replace(/[^a-z0-9.]+/g,"-").replace(/^-|-$/g,"");

export function ImageManager({resourceType,resourceId,hero,heroAlt,gallery,onHeroChange,onHeroAltChange,onGalleryChange}:{resourceType:string;resourceId:string;hero:string|null;heroAlt:string;gallery:string[];onHeroChange:(url:string|null)=>void;onHeroAltChange:(value:string)=>void;onGalleryChange:(urls:string[])=>void}){
  const [uploading,setUploading]=useState(false);
  const [message,setMessage]=useState("");
  const upload=async(files:FileList|null,target:"hero"|"gallery")=>{
    if(!files?.length)return;setUploading(true);setMessage("");
    const database=createClient(),urls:string[]=[];
    for(const file of Array.from(files)){
      const path=`${resourceType}/${resourceId}/${crypto.randomUUID()}-${safeName(file.name)}`;
      const {error}=await database.storage.from("travel-content").upload(path,file,{contentType:file.type,upsert:false});
      if(error){setMessage(error.message);continue}
      urls.push(database.storage.from("travel-content").getPublicUrl(path).data.publicUrl);
    }
    if(target==="hero"&&urls[0])onHeroChange(urls[0]);
    if(target==="gallery"&&urls.length)onGalleryChange([...gallery,...urls]);
    setUploading(false);if(urls.length)setMessage("Upload complete. Save changes to publish it.");
  };
  return <div className="grid gap-8"><section><h2 className="font-serif text-2xl">Main image</h2><p className="mt-1 text-sm text-stone">Used on cards and at the top of the public page.</p><div className="mt-5 flex flex-wrap items-center gap-5">{hero?<div className="relative aspect-[16/9] w-full max-w-md overflow-hidden rounded-2xl bg-sand"><Image src={hero} alt={heroAlt} fill sizes="448px" className="object-cover"/><button onClick={()=>onHeroChange(null)} title="Remove main image" className="absolute right-3 top-3 rounded-full bg-white p-2 text-red-700 shadow"><Trash2 className="size-4"/></button></div>:<div className="grid aspect-[16/9] w-full max-w-md place-items-center rounded-2xl border border-dashed border-stone/30 bg-sand-light text-stone"><ImagePlus/></div>}<UploadButton label={hero?"Replace image":"Upload main image"} disabled={uploading} multiple={false} onFiles={files=>void upload(files,"hero")}/></div><label className="mt-5 grid max-w-2xl gap-2 text-sm font-semibold">Image description <span className="font-normal text-stone">Describe the image for travellers using screen readers.</span><input value={heroAlt} onChange={event=>onHeroAltChange(event.target.value)} placeholder="Example: A local guide overlooking the Knuckles mountain range" className="rounded-xl border border-stone/25 px-4 py-3"/></label></section><section className="border-t border-stone/15 pt-7"><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="font-serif text-2xl">Gallery</h2><p className="mt-1 text-sm text-stone">Add supporting landscape and detail photography.</p></div><UploadButton label="Add gallery images" disabled={uploading} multiple onFiles={files=>void upload(files,"gallery")}/></div><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{gallery.map((url,index)=><div key={`${url}-${index}`} className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-sand"><Image src={url} alt="" fill sizes="300px" className="object-cover"/><button onClick={()=>onGalleryChange(gallery.filter((_,itemIndex)=>itemIndex!==index))} title="Remove from gallery" className="absolute right-3 top-3 rounded-full bg-white p-2 text-red-700 shadow"><Trash2 className="size-4"/></button></div>)}</div></section>{message&&<p className="rounded-xl bg-sand-light p-3 text-sm">{message}</p>}</div>;
}

function UploadButton({label,disabled,multiple,onFiles}:{label:string;disabled:boolean;multiple:boolean;onFiles:(files:FileList|null)=>void}){return <label className={`inline-flex cursor-pointer items-center gap-2 rounded-full bg-forest px-5 py-3 text-sm font-bold text-white ${disabled?"pointer-events-none opacity-50":""}`}><Upload className="size-4"/>{disabled?"Uploading…":label}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple={multiple} disabled={disabled} onChange={event=>{onFiles(event.target.files);event.target.value=""}} className="sr-only"/></label>}
