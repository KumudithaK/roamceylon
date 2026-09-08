"use client";

import {useId,type InputHTMLAttributes,type SelectHTMLAttributes,type TextareaHTMLAttributes,type ReactNode} from "react";
import {cn} from "@/lib/utils";

type ControlAssociation={id:string;"aria-describedby"?:string;"aria-invalid"?:true};

/** Pass the supplied association to the control; help/error IDs stay unique per instance. */
export function FormField({label,help,error,required=false,className,children}:{label:string;help?:string;error?:string;required?:boolean;className?:string;children:(association:ControlAssociation)=>ReactNode}){
  const id=useId();
  const descriptions=[help?`${id}-help`:null,error?`${id}-error`:null].filter(Boolean).join(" ")||undefined;
  return <div className={cn("grid content-start gap-2",className)}>
    <label htmlFor={id} className="text-sm font-semibold leading-6">{label}{required?<span className="ml-1 text-muted">(required)</span>:null}</label>
    {children({id,"aria-describedby":descriptions,"aria-invalid":error?true:undefined})}
    {help?<p id={`${id}-help`} className="text-sm leading-6 text-muted">{help}</p>:null}
    {error?<p id={`${id}-error`} className="text-sm leading-6 text-error">{error}</p>:null}
  </div>;
}

export function Input({className,...props}:InputHTMLAttributes<HTMLInputElement>){return <input className={cn("form-control",className)} {...props}/>;}
export function Select({className,...props}:SelectHTMLAttributes<HTMLSelectElement>){return <select className={cn("form-control",className)} {...props}/>;}
export function Textarea({className,...props}:TextareaHTMLAttributes<HTMLTextAreaElement>){return <textarea className={cn("form-control",className)} {...props}/>;}
