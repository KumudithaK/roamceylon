import type {Json} from "@/lib/database.types";

export type ProposalContact={
  hotline:string;whatsappUrl:string;facebookUrl:string;address:string;
  websiteUrl?:string;email?:string;businessRegistrationNumber?:string;sltdaRegistrationNumber?:string;
};
export type ProposalRouteStop={key:string;name:string;kind:"pickup"|"destination"|"dropoff";nights?:number;latitude?:number|null;longitude?:number|null};
export type ProposalStay={name:string;destination:string;nights:number;checkIn?:string;checkOut?:string;room:string;rooms:number;mealPlan:string;image?:string;inclusions:string[];notes:string[];confirmation:string};
export type ProposalTransport={from:string;to:string;service:string;details:string[];confirmation:string};
export type ProposalGuide={name:string;role:string;destination?:string;languages:string[];service:string;confirmation:string};
export type ProposalExperience={name:string;destination:string;description:string;image?:string;duration?:string;admission:string;guide:string;thingsToKnow:string[];status:"included"|"optional"|"not_included"|"subject_to_confirmation"};
export type ProposalDay={day:number;date?:string;title:string;destination:string;route?:string;arrival?:string;transport:string[];stay?:string;room?:string;meals:string[];experiences:Array<{name:string;timing:string}>;guides:string[];notes:string[]};
export type ProposalPriceLine={key:string;label:string;amount:number};
export type ProposalSnapshot={
  schemaVersion:1;documentStage?:"pre_booking_proposal";generatedAt:string;proposalReference:string;version:number;
  brand:{name:string;line:string;logo:string};coverImage?:string;
  traveller:{name:string;email:string;country?:string;adults:number;children:number;infants:number;total:number;requirements:string[]};
  journey:{startDate:string;endDate:string;days:number;nights:number;pickup:string;dropoff:string;route:ProposalRouteStop[]};
  introduction:string;destinations:Array<{id:string;name:string;nights:number;summary:string;image?:string;highlights:string[]}>;
  days:ProposalDay[];stays:ProposalStay[];transport:ProposalTransport[];guides:ProposalGuide[];experiences:ProposalExperience[];
  inclusions:string[];exclusions:string[];optionalItems:Array<{name:string;description:string;price?:number;currency?:string}>;
  pricing:{currency:string;total:number;perPerson:number;breakdown:ProposalPriceLine[];allInclusive:boolean};
  payment:{depositAmount:number|null;depositDueDate?:string;depositDueLabel:string;balanceAmount:number|null;balanceDueDate?:string;paidAmount:number;status:"not_started"|"part_paid"|"paid"};
  importantInformation:string[];terms:string;validUntil?:string;nextSteps:string[];contact:ProposalContact;
};

const isObject=(value:Json):value is {[key:string]:Json|undefined}=>Boolean(value)&&typeof value==="object"&&!Array.isArray(value);
export const isProposalSnapshot=(value:Json):boolean=>isObject(value)&&value.schemaVersion===1&&typeof value.proposalReference==="string";
export const proposalSnapshot=(value:Json|null|undefined)=>value&&isProposalSnapshot(value)?value as unknown as ProposalSnapshot:null;
export function validateCustomerProposal(snapshot:ProposalSnapshot){
  const checks=[
    {key:"journey",label:"Journey",ok:Boolean(snapshot.journey.startDate&&snapshot.journey.endDate&&snapshot.journey.route.length>=3&&snapshot.days.length)},
    {key:"pricing",label:"Pricing",ok:Boolean(snapshot.pricing.currency&&snapshot.pricing.total>0&&Math.abs(snapshot.pricing.breakdown.reduce((sum,line)=>sum+line.amount,0)-snapshot.pricing.total)<.01)},
    {key:"inclusions",label:"Inclusions / exclusions",ok:Boolean(snapshot.inclusions.length&&snapshot.exclusions.length)},
    {key:"payment",label:"Payment schedule",ok:snapshot.payment.depositAmount===null||snapshot.payment.depositAmount<=snapshot.pricing.total},
    {key:"contact",label:"Contact information",ok:Boolean(snapshot.contact.hotline&&snapshot.contact.whatsappUrl)}
  ];
  return {checks,ready:checks.every(check=>check.ok),issues:checks.filter(check=>!check.ok).map(check=>`${check.label} is incomplete.`)};
}
