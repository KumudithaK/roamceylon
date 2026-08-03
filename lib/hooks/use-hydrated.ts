"use client";

import {useSyncExternalStore} from "react";

const subscribe=(notify:()=>void)=>{
  queueMicrotask(notify);
  return ()=>{};
};

export const useHydrated=()=>useSyncExternalStore(subscribe,()=>true,()=>false);
