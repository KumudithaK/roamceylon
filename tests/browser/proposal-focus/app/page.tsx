"use client";

import {useState} from "react";
import type {MouseEvent} from "react";
import {QuotationModal} from "@/features/journey/quotation-modal";
import {emptyJourneyState} from "@/features/journey/journey-store";
import type {JourneyBootstrap} from "@/lib/journey/journey-service";
import {useDialogFocusReturn} from "@/lib/ui/use-dialog-focus-return";

const data:JourneyBootstrap={themes:[],destinations:[],experiences:[],stays:[],vehicles:[],guides:[]};
const state={
  ...emptyJourneyState,
  currentStep:6,
  pickup:{type:"airport" as const,airportCode:"CMB",location:"",date:"2026-10-10",time:"10:00",flightNumber:""},
  dropoff:{type:"airport" as const,airportCode:"CMB",location:"",date:"2026-10-16",time:"18:00",flightNumber:""},
  travelDates:{start:"2026-10-10",end:"2026-10-16"},
  travellerCounts:{adults:1,children:0,infants:0}
};

export default function Page(){
  const [open,setOpen]=useState(false);
  const rememberOpener=useDialogFocusReturn(open);
  const openDialog=(event:MouseEvent<HTMLButtonElement>)=>{rememberOpener(event.currentTarget);setOpen(true)};
  return <>
    <button data-testid="chapter-opener" onClick={openDialog}>Request Journey Proposal</button>
    <button data-testid="summary-opener" onClick={openDialog}>Request Journey Proposal from summary</button>
    <QuotationModal open={open} onClose={()=>setOpen(false)} onSubmitted={()=>{}} state={state} quote={null} data={data}/>
  </>;
}
