import "server-only";
import {createAdminClient} from "@/lib/supabase/admin";
import type {Database} from "@/lib/database.types";

type Account=Database["public"]["Tables"]["journey_accounts"]["Row"];

export type DepositPayment={
  amount:number;
  paymentDate:string;
  paymentMethod?:string;
  reference?:string;
  notes?:string;
};

export class AccountingPostError extends Error{
  constructor(public code:"NOT_FOUND"|"PRICING"|"DATABASE",message:string){super(message);this.name="AccountingPostError"}
}

const classify=(message:string):AccountingPostError["code"]=>
  /not found/i.test(message)?"NOT_FOUND":/accepted proposal|commercial basis|supplier allocation|selling price|deposit exceeds/i.test(message)?"PRICING":"DATABASE";

export async function activateJourneyAccount(enquiryId:string,userId:string,deposit:DepositPayment):Promise<Account>{
  const database=createAdminClient();
  if(!database)throw new AccountingPostError("DATABASE","Supabase server credentials are unavailable.");
  const {data:accountId,error}=await database.rpc("initialize_journey_account_command",{
    p_enquiry_id:enquiryId,
    p_actor_id:userId,
    p_amount:deposit.amount,
    p_payment_date:deposit.paymentDate,
    p_payment_method:deposit.paymentMethod??null,
    p_reference:deposit.reference??null,
    p_notes:deposit.notes??null
  });
  if(error||!accountId){const message=error?.message??"The journey account could not be initialized.";throw new AccountingPostError(classify(message),message)}
  const {data:account,error:loadError}=await database.from("journey_accounts").select("*").eq("id",accountId).single();
  if(loadError||!account)throw new AccountingPostError("DATABASE",loadError?.message??"The activated journey account could not be loaded.");
  return account;
}
