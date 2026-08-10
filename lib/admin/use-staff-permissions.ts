"use client";

import {useEffect,useState} from "react";
import {createClient} from "@/lib/supabase/client";
import {staffPermissions,type StaffPermission} from "./permissions";

export function useStaffPermissions(){
  const [state,setState]=useState<{loading:boolean;permissions:StaffPermission[]}>({loading:true,permissions:[]});
  useEffect(()=>{void (async()=>{const database=createClient(),{data:{session}}=await database.auth.getSession();if(!session){setState({loading:false,permissions:[]});return}const {data:profile}=await database.from("profiles").select("role").eq("id",session.user.id).maybeSingle();if(profile?.role==="admin"){setState({loading:false,permissions:[...staffPermissions]});return}const {data,error}=await database.rpc("current_staff_permissions",{});setState({loading:false,permissions:error?[]:(data??[]).map(item=>item.permission_code).filter((value):value is StaffPermission=>staffPermissions.includes(value as StaffPermission))})})()},[]);
  return state;
}
