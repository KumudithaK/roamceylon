import "server-only";
import {z} from "zod";
import type {Json} from "@/lib/database.types";
import type {ProposalSnapshot} from "./customer-proposal-types";

const optionalText=z.string().optional();
const routeStop=z.object({key:z.string(),name:z.string(),kind:z.enum(["pickup","destination","dropoff"]),nights:z.number().optional(),latitude:z.number().nullable().optional(),longitude:z.number().nullable().optional()});
const stay=z.object({name:z.string(),destination:z.string(),nights:z.number(),checkIn:optionalText,checkOut:optionalText,room:z.string(),rooms:z.number(),mealPlan:z.string(),image:optionalText,inclusions:z.array(z.string()),notes:z.array(z.string()),confirmation:z.string()});
const transport=z.object({from:z.string(),to:z.string(),service:z.string(),details:z.array(z.string()),confirmation:z.string()});
const guide=z.object({name:z.string(),role:z.string(),destination:optionalText,languages:z.array(z.string()),service:z.string(),confirmation:z.string()});
const experience=z.object({name:z.string(),destination:z.string(),description:z.string(),image:optionalText,duration:optionalText,admission:z.string(),guide:z.string(),thingsToKnow:z.array(z.string()),status:z.enum(["included","optional","not_included","subject_to_confirmation"])});
const benefit=z.object({code:z.string(),type:z.enum(["roam_ceylon_complimentary","preferred_rate","partner_privilege","complimentary_upgrade","meal_benefit","arrival_departure_benefit","celebration_benefit","experience_benefit","roam_ceylon_service_benefit","other"]),scope:z.enum(["journey","traveller","stay","destination","experience","transport","guide","day"]),title:z.string(),description:z.string(),confidence:z.enum(["guaranteed_by_roam_ceylon","confirmed_partner_benefit","subject_to_availability"]),scopeLabel:optionalText,quantity:z.number(),preferredRate:z.number().optional(),referenceRate:z.number().optional(),currency:optionalText,rateUnit:optionalText,verifiedSavings:z.number()});
const day=z.object({day:z.number(),date:optionalText,title:z.string(),destination:z.string(),route:optionalText,arrival:optionalText,transport:z.array(z.string()),stay:optionalText,room:optionalText,meals:z.array(z.string()),experiences:z.array(z.object({name:z.string(),timing:z.string()})),guides:z.array(z.string()),notes:z.array(z.string())});

const customerProposalSchema=z.object({
  schemaVersion:z.literal(1),documentStage:z.literal("pre_booking_proposal").optional().default("pre_booking_proposal"),generatedAt:z.string(),proposalReference:z.string(),version:z.number().int().positive(),
  brand:z.object({name:z.string(),line:z.string(),logo:z.string()}),coverImage:optionalText,
  traveller:z.object({name:z.string(),email:z.string(),country:optionalText,adults:z.number(),children:z.number(),infants:z.number(),total:z.number(),requirements:z.array(z.string())}),
  journey:z.object({startDate:z.string(),endDate:z.string(),days:z.number(),nights:z.number(),pickup:z.string(),dropoff:z.string(),route:z.array(routeStop)}),
  introduction:z.string(),destinations:z.array(z.object({id:z.string(),name:z.string(),nights:z.number(),summary:z.string(),image:optionalText,highlights:z.array(z.string())})),
  days:z.array(day),stays:z.array(stay),transport:z.array(transport),guides:z.array(guide),experiences:z.array(experience),benefits:z.array(benefit).optional().default([]),
  inclusions:z.array(z.string()),exclusions:z.array(z.string()),optionalItems:z.array(z.object({name:z.string(),description:z.string(),price:z.number().optional(),currency:z.string().optional()})),
  pricing:z.object({currency:z.string(),total:z.number(),perPerson:z.number(),breakdown:z.array(z.object({key:z.string(),label:z.string(),amount:z.number()})),allInclusive:z.boolean()}),
  payment:z.object({depositAmount:z.number().nullable(),depositDueDate:optionalText,depositDueLabel:z.string(),balanceAmount:z.number().nullable(),balanceDueDate:optionalText,paidAmount:z.number(),status:z.enum(["not_started","part_paid","paid"])}),
  importantInformation:z.array(z.string()),terms:z.string(),validUntil:optionalText,nextSteps:z.array(z.string()),
  contact:z.object({hotline:z.string(),whatsappUrl:z.string(),facebookUrl:z.string(),address:z.string(),websiteUrl:optionalText,email:optionalText,businessRegistrationNumber:optionalText,sltdaRegistrationNumber:optionalText})
});

export function customerSafeProposalDto(value:Json|null|undefined):ProposalSnapshot|null{
  const parsed=customerProposalSchema.safeParse(value);
  return parsed.success?parsed.data as ProposalSnapshot:null;
}

export const customerProposalAllowedKeys=Object.freeze(Object.keys(customerProposalSchema.shape));
