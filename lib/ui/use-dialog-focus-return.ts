"use client";

import {useCallback,useEffect,useRef} from "react";

export function useDialogFocusReturn(open:boolean){
  const openerRef=useRef<HTMLElement|null>(null);
  const wasOpenRef=useRef(false);

  useEffect(()=>{
    if(open){wasOpenRef.current=true;return}
    if(!wasOpenRef.current)return;
    wasOpenRef.current=false;
    const opener=openerRef.current;
    openerRef.current=null;
    if(opener?.isConnected)opener.focus({preventScroll:true});
  },[open]);

  return useCallback((opener:HTMLElement)=>{openerRef.current=opener},[]);
}
