"use client";

import {useEffect,useMemo,useState} from "react";
import type {PackageQuoteRequest,PublicPackageQuote} from "./package-types";

export function usePackageQuote(request:PackageQuoteRequest){
  const serialized=useMemo(()=>JSON.stringify(request),[request]);
  const [state,setState]=useState<{loading:boolean;quote:PublicPackageQuote|null;error:string}>({loading:false,quote:null,error:""});
  useEffect(()=>{
    if(!request.selectedDestinationIds.length){queueMicrotask(()=>setState({loading:false,quote:null,error:""}));return}
    const controller=new AbortController();
    const timeout=setTimeout(async()=>{
      setState(current=>({...current,loading:true,error:""}));
      try{
        const response=await fetch("/api/quotes",{method:"POST",headers:{"content-type":"application/json"},body:serialized,signal:controller.signal});
        const payload=await response.json();
        if(!response.ok)throw new Error(payload.error||"Quote unavailable.");
        setState({loading:false,quote:payload as PublicPackageQuote,error:""});
      }catch(error){
        if(!controller.signal.aborted)setState({loading:false,quote:null,error:error instanceof Error?error.message:"Quote unavailable."});
      }
    },250);
    return ()=>{clearTimeout(timeout);controller.abort()};
  },[request.selectedDestinationIds.length,serialized]);
  return state;
}
