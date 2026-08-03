import "server-only";
export class RepositoryError extends Error{
  constructor(public operation:string,public code:string|undefined,message:string){super(`${operation}: ${message}`);this.name="RepositoryError";}
}
export function ensure<T>(operation:string,result:{data:T|null;error:{code?:string;message:string}|null}):T{
  if(result.error)throw new RepositoryError(operation,result.error.code,result.error.message);
  return result.data as T;
}
export const asStrings=(value:unknown)=>Array.isArray(value)?value.filter((item):item is string=>typeof item==="string"):[];
