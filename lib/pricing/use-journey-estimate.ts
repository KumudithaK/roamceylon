"use client";

import {useEffect,useMemo,useState} from "react";
import type {JourneyEstimateRequest,PublicJourneyEstimate} from "./journey-estimate-types";

export function useJourneyEstimate(request:JourneyEstimateRequest){
  const serialized=useMemo(()=>JSON.stringify(request),[request]);
  const [state,setState]=useState<{loading:boolean;estimate:PublicJourneyEstimate|null;error:string}>({loading:false,estimate:null,error:""});
  useEffect(()=>{
    if(!request.selectedDestinationIds.length){queueMicrotask(()=>setState({loading:false,estimate:null,error:""}));return}
    const controller=new AbortController();
    queueMicrotask(()=>setState({loading:true,estimate:null,error:""}));
    const timeout=window.setTimeout(async()=>{
      try{
        const response=await fetch("/api/journey-estimate",{method:"POST",headers:{"content-type":"application/json"},body:serialized,signal:controller.signal});
        const payload=await response.json();
        if(!response.ok)throw new Error(payload.error||"Estimate unavailable.");
        setState({loading:false,estimate:payload as PublicJourneyEstimate,error:""});
      }catch(error){if(!controller.signal.aborted)setState({loading:false,estimate:null,error:error instanceof Error?error.message:"Estimate unavailable."})}
    },250);
    return()=>{window.clearTimeout(timeout);controller.abort()};
  },[request.selectedDestinationIds.length,serialized]);
  return state;
}
