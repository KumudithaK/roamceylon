"use client";

import {createClient} from "@/lib/supabase/client";
import type {Database,Json} from "@/lib/database.types";

export const journeyRequestStatuses=[
  ["new","New"],
  ["preparing_proposal","Preparing Proposal"],
  ["proposal_sent","Proposal Sent"],
  ["accepted","Accepted"],
  ["cancelled","Cancelled"]
] as const;

export type JourneyRequestStatus=(typeof journeyRequestStatuses)[number][0];
export type JourneyRequest=Database["public"]["Tables"]["journey_requests"]["Row"];

export type JourneyRequestSubmission={
  customerName:string;
  whatsappNumber:string;
  emailAddress:string;
  country?:string;
  arrivalDate?:string;
  departureDate?:string;
  specialRequests?:string;
  journeySnapshot:Json;
};

export class JourneyRequestService{
  async submit(input:JourneyRequestSubmission){
    const {error}=await createClient().from("journey_requests").insert({
      customer_name:input.customerName,
      whatsapp_number:input.whatsappNumber,
      email_address:input.emailAddress,
      country:input.country||null,
      arrival_date:input.arrivalDate||null,
      departure_date:input.departureDate||null,
      special_requests:input.specialRequests||null,
      journey_snapshot:input.journeySnapshot,
      status:"new"
    });
    if(error)throw error;
  }

  async list(){
    const {data,error}=await createClient().from("journey_requests").select("*").order("created_at",{ascending:false});
    if(error)throw error;
    return data??[];
  }

  async updateStatus(id:string,status:JourneyRequestStatus){
    const {error}=await createClient().from("journey_requests").update({status}).eq("id",id);
    if(error)throw error;
  }
}
