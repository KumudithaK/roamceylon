import type {ProposalDay,ProposalStay} from "./customer-proposal-types";

const key=(value:string)=>value.trim().replace(/\s+/g," ").toLocaleLowerCase("en");
export const sameProposalText=(left:string,right:string)=>Boolean(key(left))&&key(left)===key(right);
export const uniqueProposalText=(values:string[])=>values.filter((value,index)=>value.trim()&&!values.slice(0,index).some(previous=>sameProposalText(value,previous)));

/** Salutation only. Keep the complete traveller name in identity and acceptance data. */
export function proposalGreetingName(name:string){
  const personal=name.trim().replace(/^STAGING DEMO\s*(?:—|–|-|:)\s*/i,"");
  return personal.split(/\s+/)[0]||"traveller";
}
export function proposalStayDisplay(stay:ProposalStay){
  const combined=sameProposalText(stay.room,stay.mealPlan);
  return {room:stay.room,roomLabel:combined?"Room & meal plan":"Room",mealPlan:combined?"":stay.mealPlan};
}
export function proposalDayDisplay(day:ProposalDay){
  const roomParts=uniqueProposalText((day.room??"").split(/\s+·\s+/));
  return {room:roomParts.join(" · "),meals:uniqueProposalText(day.meals).filter(meal=>!roomParts.some(part=>sameProposalText(part,meal)))};
}
export const flexibleScheduleNote="Experience days and times marked flexible are indicative and remain to be agreed with you.";
export const hasFlexibleSchedule=(days:ProposalDay[])=>days.some(day=>day.experiences.some(item=>item.timing==="Flexible timing"));
export const proposalExperienceTiming=(timing:string)=>timing==="Flexible timing"?"Flexible day & time":timing;
