import {createClient} from "@supabase/supabase-js";
import type {Database} from "@/lib/database.types";

export function createPublicClient(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return url&&key?createClient<Database>(url,key,{auth:{persistSession:false,autoRefreshToken:false}}):null;
}
