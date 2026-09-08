import type {ReactNode} from "react";
import {cn} from "@/lib/utils";

/** Empty content is not an error. Operational semantics never use brand gold. */
export function EmptyState({title,children}:{title:string;children?:ReactNode}){
  return <div className="rounded-lg border border-divider bg-surface px-6 py-12 text-center sm:px-10"><h2 className="heading-3">{title}</h2>{children?<div className="mx-auto mt-4 max-w-xl text-base leading-7 text-muted">{children}</div>:null}</div>;
}

export function LoadingState({label="Loading…"}:{label?:string}){
  return <div role="status" aria-live="polite" className="flex min-h-24 items-center justify-center gap-3 p-6 text-sm text-muted"><span aria-hidden="true" className="size-5 rounded-full border-2 border-divider border-t-forest motion-safe:animate-spin"/>{label}</div>;
}

export function Feedback({tone="error",children,className}:{tone?:"error"|"success"|"warning";children:ReactNode;className?:string}){
  const colours={error:"border-error text-error",success:"border-success text-success",warning:"border-warning text-warning"};
  return <div role={tone==="error"?"alert":"status"} className={cn("border-l-2 bg-surface px-4 py-3 text-sm leading-6",colours[tone],className)}>{children}</div>;
}
