import {brand,publicBrandText} from "../brand.ts";
import {approvedPublicContact} from "../public-navigation.ts";
import type {ProposalSnapshot} from "./customer-proposal-types";

// Presentation policy only: never rewrite the stored/signed proposal snapshot.
// No business mailbox or registration number has been approved for publication.
export const approvedProposalContact=()=>({
  hotline:approvedPublicContact.phone,whatsappUrl:approvedPublicContact.whatsapp,
  facebookUrl:approvedPublicContact.facebook,address:approvedPublicContact.address,
  websiteUrl:brand.canonicalUrl
});
const copy=(value:string)=>publicBrandText(value).replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,"").trim();
const optional=(value:string|undefined)=>value===undefined?undefined:copy(value);
const lines=(values:string[])=>values.map(copy).filter(Boolean);

/** Normalize business display copy, not identifiers, traveller identity or money. */
export function customerProposalContent(snapshot:ProposalSnapshot):ProposalSnapshot{
  return {...snapshot,brand:{name:brand.name,line:brand.tagline,logo:""},contact:approvedProposalContact(),
    introduction:copy(snapshot.introduction),terms:copy(snapshot.terms),
    journey:{...snapshot.journey,pickup:copy(snapshot.journey.pickup),dropoff:copy(snapshot.journey.dropoff),route:snapshot.journey.route.map(stop=>({...stop,name:copy(stop.name)}))},
    destinations:snapshot.destinations.map(item=>({...item,name:copy(item.name),summary:copy(item.summary),highlights:lines(item.highlights)})),
    days:snapshot.days.map(day=>({...day,title:copy(day.title),destination:copy(day.destination),route:optional(day.route),arrival:optional(day.arrival),transport:lines(day.transport),stay:optional(day.stay),room:optional(day.room),meals:lines(day.meals),experiences:day.experiences.map(item=>({...item,name:copy(item.name),timing:copy(item.timing)})),guides:lines(day.guides),notes:lines(day.notes)})),
    stays:snapshot.stays.map(item=>({...item,name:copy(item.name),destination:copy(item.destination),room:copy(item.room),mealPlan:copy(item.mealPlan),inclusions:lines(item.inclusions),notes:lines(item.notes),confirmation:copy(item.confirmation)})),
    transport:snapshot.transport.map(item=>({...item,from:copy(item.from),to:copy(item.to),service:copy(item.service),details:lines(item.details),confirmation:copy(item.confirmation)})),
    guides:snapshot.guides.map(item=>({...item,name:copy(item.name),role:copy(item.role),destination:optional(item.destination),languages:lines(item.languages),service:copy(item.service),confirmation:copy(item.confirmation)})),
    experiences:snapshot.experiences.map(item=>({...item,name:copy(item.name),destination:copy(item.destination),description:copy(item.description),duration:optional(item.duration),admission:copy(item.admission),guide:copy(item.guide),thingsToKnow:lines(item.thingsToKnow)})),
    benefits:snapshot.benefits?.map(item=>({...item,title:copy(item.title),description:copy(item.description),scopeLabel:optional(item.scopeLabel),rateUnit:optional(item.rateUnit)})),
    inclusions:lines(snapshot.inclusions),exclusions:lines(snapshot.exclusions),optionalItems:snapshot.optionalItems.map(item=>({...item,name:copy(item.name),description:copy(item.description)})),
    pricing:{...snapshot.pricing,breakdown:snapshot.pricing.breakdown.map(item=>({...item,label:copy(item.label)}))},
    payment:{...snapshot.payment,depositDueLabel:copy(snapshot.payment.depositDueLabel)},
    importantInformation:lines(snapshot.importantInformation),nextSteps:lines(snapshot.nextSteps)
  };
}
