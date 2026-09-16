"use client";

import Image from "next/image";
import {useState} from "react";

export function PartnerEditorialImage({src,alt,sizes,className,priority=false}:{src:string|null|undefined;alt:string;sizes:string;className?:string;priority?:boolean}){
  const [failed,setFailed]=useState(false);
  if(!src||failed)return <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_25%,rgba(181,138,58,.3),transparent_35%),linear-gradient(145deg,#174a40,#0b302a_70%)]" aria-hidden="true"/>;
  return <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className={className??"object-cover"} onError={()=>setFailed(true)}/>;
}
