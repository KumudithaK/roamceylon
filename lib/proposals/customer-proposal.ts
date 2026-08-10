import "server-only";
import type {SupabaseClient} from "@supabase/supabase-js";
import {endpointLabel} from "@/lib/journey/journey-endpoints";
import {normaliseCuratedItinerary} from "@/lib/journey/curated-journey";
import {parseJourneyHandoff} from "@/lib/journey/quotation-handoff";
import type {AllocationSnapshotLine} from "@/lib/accounting/allocation-accounting";
import type {Database,Json} from "@/lib/database.types";
import type {ProposalDay,ProposalSnapshot} from "./customer-proposal-types";

type Enquiry=Database["public"]["Tables"]["enquiries"]["Row"];
type Curated=Database["public"]["Tables"]["curated_journeys"]["Row"];
type Details={introduction?:string;terms?:string;validUntil?:string;depositAmount?:number|null;depositDueDate?:string;balanceDueDate?:string;additionalInclusions?:string[];additionalExclusions?:string[];importantInformation?:string[];optionalItems?:Array<{name:string;description:string;price?:number;currency?:string}>};
const object=(value:Json|undefined):Record<string,Json|undefined>=>value&&typeof value==="object"&&!Array.isArray(value)?value:{};
const strings=(value:Json|undefined)=>Array.isArray(value)?value.filter((item):item is string=>typeof item==="string"&&Boolean(item.trim())):[];
const text=(value:Json|undefined)=>typeof value==="string"?value:"";
const number=(value:Json|undefined)=>typeof value==="number"?value:Number(value)||0;
const unique=(values:string[])=>[...new Set(values.map(value=>value.trim()).filter(Boolean))];
const json=(value:unknown)=>JSON.parse(JSON.stringify(value)) as Json;
const dateAt=(start:string,index:number)=>{if(!start)return undefined;const date=new Date(`${start}T00:00:00Z`);date.setUTCDate(date.getUTCDate()+index);return date.toISOString().slice(0,10)};
const daysBetween=(start:string,end:string)=>{const from=new Date(`${start}T00:00:00Z`).getTime(),to=new Date(`${end}T00:00:00Z`).getTime();return Number.isFinite(from)&&Number.isFinite(to)&&to>=from?Math.floor((to-from)/86_400_000)+1:0};
const customerConfirmation=(status:string)=>status==="confirmed"?"Confirmed":"Subject to confirmation";

export async function composeCustomerProposal(database:SupabaseClient<Database>,enquiry:Enquiry,curated:Curated|null,allocationSnapshot:AllocationSnapshotLine[],commercialSummary:{totalSellingPrice:number},proposal:{reference:string;version:number;currency:string},details:Details):Promise<ProposalSnapshot>{
  const handoff=parseJourneyHandoff(enquiry.trip_state);
  if(!handoff)throw new Error("The traveller journey details are unavailable.");
  const itinerary=curated?normaliseCuratedItinerary(curated.itinerary,handoff.state):null;
  const state=itinerary??handoff.state;
  const destinationIds=state.selectedDestinationIds,experienceIds=state.selectedExperienceIds;
  const accommodationIds=allocationSnapshot.flatMap(line=>line.type==="accommodation"&&line.resourceId?[line.resourceId]:[]);
  const guideIds=allocationSnapshot.flatMap(line=>line.type==="guide"&&line.resourceId?[line.resourceId]:[]);
  const vehicleIds=allocationSnapshot.flatMap(line=>line.type==="vehicle"&&line.resourceId?[line.resourceId]:[]);
  const [destinationResult,experienceResult,accommodationResult,guideResult,vehicleResult,contactResult,accountResult]=await Promise.all([
    destinationIds.length?database.from("destinations").select("id,name,short_description,hero_image_url,local_highlights,latitude,longitude").in("id",destinationIds):Promise.resolve({data:[],error:null}),
    experienceIds.length?database.from("experiences").select("id,name,short_description,hero_image_url,duration,things_to_know,included").in("id",experienceIds):Promise.resolve({data:[],error:null}),
    accommodationIds.length?database.from("accommodations").select("id,name,hero_image_url,short_description").in("id",accommodationIds):Promise.resolve({data:[],error:null}),
    guideIds.length?database.from("guides").select("id,name,languages,specialities").in("id",guideIds):Promise.resolve({data:[],error:null}),
    vehicleIds.length?database.from("vehicles").select("id,listing_title,vehicle_type,vehicle_model").in("id",vehicleIds):Promise.resolve({data:[],error:null}),
    database.from("website_settings").select("website_name,contact_phone,whatsapp_url,facebook_url,business_address,website_url,business_email,enquiry_email,business_registration_number,sltda_registration_number").eq("id",true).maybeSingle(),
    database.from("journey_accounts").select("amount_received,currency").eq("enquiry_id",enquiry.id).maybeSingle()
  ]);
  const failed=[destinationResult,experienceResult,accommodationResult,guideResult,vehicleResult,contactResult,accountResult].find(result=>result.error)?.error;
  if(failed)throw new Error(failed.message);
  const destinationMap=new Map((destinationResult.data??[]).map(item=>[item.id,item]));
  const experienceMap=new Map((experienceResult.data??[]).map(item=>[item.id,item]));
  const accommodationMap=new Map((accommodationResult.data??[]).map(item=>[item.id,item]));
  const guideMap=new Map((guideResult.data??[]).map(item=>[item.id,item]));
  const vehicleMap=new Map((vehicleResult.data??[]).map(item=>[item.id,item]));
  const contact=contactResult.data;
  const pickup=state.pickup.type?endpointLabel(state.pickup,"pickup"):"Journey start";
  const dropoff=state.dropoff.type?endpointLabel(state.dropoff,"dropoff"):"Journey end";
  const destinationStops=destinationIds.map(id=>{const destination=destinationMap.get(id);return {key:id,name:destination?.name??"Sri Lanka",kind:"destination" as const,nights:itinerary?.destinationPreferences[id]?.nights??state.destinationPreferences[id]?.nights??0,latitude:destination?.latitude===null?null:Number(destination?.latitude),longitude:destination?.longitude===null?null:Number(destination?.longitude)}});
  const route=[{key:"pickup",name:pickup,kind:"pickup" as const},...destinationStops,{key:"dropoff",name:dropoff,kind:"dropoff" as const}];
  const active=allocationSnapshot.filter(line=>line.confirmationStatus!=="cancelled");
  const stays=active.filter(line=>line.type==="accommodation").map(line=>{const detail=object(line.serviceDetails),plan=object(line.pricingPlanSnapshot),planDetails=object(plan.details),property=line.resourceId?accommodationMap.get(line.resourceId):null;return {
    name:line.resourceName||line.providerName,destination:line.destinationName??"",nights:number(detail.nights),checkIn:text(detail.checkIn)||undefined,checkOut:text(detail.checkOut)||undefined,
    room:text(plan.name)||line.serviceName||"Selected room",rooms:number(detail.rooms)||1,mealPlan:text(planDetails.mealPlan)||text(planDetails.meal_plan)||line.serviceName||"No meal plan included",
    image:property?.hero_image_url??undefined,inclusions:unique([text(plan.description),...strings(planDetails.inclusions)]),notes:unique([text(detail.customerNotes)]),confirmation:customerConfirmation(line.confirmationStatus)
  }});
  const transport=active.filter(line=>line.type==="vehicle").map(line=>{const detail=object(line.serviceDetails),vehicle=line.resourceId?vehicleMap.get(line.resourceId):null;return {from:line.fromLocationName||line.fromDestinationName||"Journey point",to:line.toLocationName||line.toDestinationName||"Journey point",service:line.serviceName||vehicle?.vehicle_type||vehicle?.listing_title||line.resourceName||"Private transport",details:unique([vehicle?.vehicle_model??"",text(detail.class),text(detail.reservation),line.arrivalInstructions??""]),confirmation:customerConfirmation(line.confirmationStatus)}});
  const guides=active.filter(line=>line.type==="guide").map(line=>{const detail=object(line.serviceDetails),guide=line.resourceId?guideMap.get(line.resourceId):null;const specialist=text(detail.guideRole)==="specialist";return {name:guide?.name||line.resourceName||line.providerName,role:specialist?(text(detail.guideSpeciality)||"Destination specialist").replaceAll("_"," "):"Primary journey guide",destination:line.destinationName??undefined,languages:unique((text(detail.preferredLanguages)||strings(guide?.languages).join(",")).split(",")),service:line.serviceName||"Guide service",confirmation:customerConfirmation(line.confirmationStatus)}});
  const experiences=active.filter(line=>line.type==="experience").map(line=>{const item=line.resourceId?experienceMap.get(line.resourceId):null;const confirmation=line.confirmationStatus==="confirmed"?"included":"subject_to_confirmation";return {name:item?.name||line.resourceName,destination:line.destinationName??"",description:item?.short_description??"A thoughtfully selected part of your Sri Lankan journey.",image:item?.hero_image_url??undefined,duration:item?.duration??undefined,admission:`${line.serviceName||"Admission"} included`,guide:text(object(line.serviceDetails).guideIncluded)||"As specified in your itinerary",thingsToKnow:strings(item?.things_to_know),status:confirmation as "included"|"subject_to_confirmation"}});
  const destinationExperiences=(destinationId:string)=>experiences.filter(item=>item.destination===destinationMap.get(destinationId)?.name);
  const days:ProposalDay[]=[];let dayIndex=0;
  destinationStops.forEach((stop,stopIndex)=>{const count=Math.max(1,stop.nights||1),items=destinationExperiences(stop.key),stay=stays.find(item=>item.destination===stop.name),guideItems=guides.filter(item=>!item.destination||item.destination===stop.name);for(let offset=0;offset<count;offset+=1){const first=offset===0,previous=stopIndex===0?pickup:destinationStops[stopIndex-1].name;days.push({day:dayIndex+1,date:dateAt(state.travelDates.start,dayIndex),title:first?(stopIndex===0?`Welcome to Sri Lanka · ${stop.name}`:`Journey to ${stop.name}`):stop.name,destination:stop.name,route:first?`${previous} → ${stop.name}`:undefined,arrival:first&&stopIndex===0&&state.pickup.time?`${state.pickup.time}${state.pickup.flightNumber?` · Flight ${state.pickup.flightNumber}`:""}`:undefined,transport:first?transport.filter(item=>item.to===stop.name).map(item=>item.service):[],stay:stay?.name,room:stay?[stay.room,stay.mealPlan].filter(Boolean).join(" · "):undefined,meals:stay?.mealPlan?[stay.mealPlan]:["No meals are currently included for this day"],experiences:items.filter((_,index)=>index%count===offset).map(item=>({name:item.name,timing:"Flexible timing"})),guides:guideItems.map(item=>`${item.role}${item.name?` · ${item.name}`:""}`),notes:first&&stay?.confirmation!=="Confirmed"?["Accommodation is subject to confirmation."]:[]});dayIndex+=1}});
  const totalDays=Math.max(daysBetween(state.travelDates.start,state.travelDates.end),days.length+1);
  while(days.length<Math.max(0,totalDays-1)){const final=destinationStops.at(-1),stay=stays.find(item=>item.destination===final?.name);days.push({day:days.length+1,date:dateAt(state.travelDates.start,days.length),title:`At leisure in ${final?.name??"Sri Lanka"}`,destination:final?.name??"Sri Lanka",transport:[],meals:[stay?.mealPlan||"No meals are currently included for this day"],experiences:[],guides:[],notes:["A thoughtfully unhurried day within your curated journey."]})}
  if(totalDays){const final=destinationStops.at(-1),stay=stays.find(item=>item.destination===final?.name);days.push({day:totalDays,date:dateAt(state.travelDates.start,totalDays-1),title:"Departure from Sri Lanka",destination:final?.name??"Sri Lanka",route:`${final?.name??"Final destination"} → ${dropoff}`,transport:transport.filter(item=>item.to===dropoff).map(item=>item.service),meals:[stay?.mealPlan||"No meals are currently included for this day"],experiences:[],guides:[],notes:["Departure arrangements will follow the confirmed travel details."]})}
  const destinations=destinationStops.map(stop=>{const item=destinationMap.get(stop.key);return {id:stop.key,name:stop.name,nights:stop.nights||0,summary:item?.short_description??"A considered chapter of your Sri Lankan journey.",image:item?.hero_image_url??undefined,highlights:strings(item?.local_highlights).slice(0,3)}});
  const included=unique([
    ...stays.map(item=>`${item.nights} night${item.nights===1?"":"s"} at ${item.name}, ${item.mealPlan}`),
    ...transport.map(item=>`${item.service}: ${item.from} to ${item.to}`),
    ...guides.map(item=>`${item.role}${item.destination?` in ${item.destination}`:""}`),
    ...experiences.filter(item=>item.status==="included").map(item=>`${item.name}${item.admission?" with stated admission":""}`),
    "Roam Ceylon journey design and coordination",...(details.additionalInclusions??[])
  ]);
  const exclusions=unique(["International airfare","Sri Lanka visa / ETA fees","Travel insurance","Meals not specifically stated as included","Personal expenses and discretionary purchases","Tips and gratuities",...(details.additionalExclusions??[])]);
  const manualByType=new Map<string,number>();for(const line of active){if(line.sellingPrice!==null)manualByType.set(line.type,(manualByType.get(line.type)??0)+line.sellingPrice)}
  const labels:Record<string,string>={accommodation:"Accommodation",vehicle:"Transport",experience:"Experiences",guide:"Guide services"};
  const breakdown=[...manualByType].filter(([,amount])=>amount>0).map(([key,amount])=>({key,label:labels[key]??"Included services",amount:Math.round(amount*100)/100}));
  const allocated=breakdown.reduce((sum,line)=>sum+line.amount,0),remainder=Math.round((commercialSummary.totalSellingPrice-allocated)*100)/100;
  if(remainder>0)breakdown.push({key:"other",label:"Journey planning & other included services",amount:remainder});
  if(!breakdown.length)breakdown.push({key:"journey",label:"Complete curated journey",amount:commercialSummary.totalSellingPrice});
  const travellers=state.travellerCounts.adults+state.travellerCounts.children+state.travellerCounts.infants;
  const deposit=details.depositAmount&&details.depositAmount>0?Math.min(details.depositAmount,commercialSummary.totalSellingPrice):null;
  const paid=Number(accountResult.data?.amount_received??0);
  const important=unique([...(details.importantInformation??[]),"Services shown as subject to confirmation will be secured after your approval and the required payment.","Material changes requested after approval may affect availability and price; any change will be agreed with you first."]);
  const requirements=unique([state.accessibilityRequirements,enquiry.traveller_notes??""]);
  return {schemaVersion:1,generatedAt:new Date().toISOString(),proposalReference:proposal.reference,version:proposal.version,brand:{name:contact?.website_name||"Roam Ceylon",line:"Thoughtfully Crafted. Authentically Sri Lankan.",logo:"/assets/logo/roam-ceylon-elephant-transparent.png"},coverImage:destinations.find(item=>item.image)?.image,traveller:{name:enquiry.name,email:enquiry.email,country:enquiry.nationality??undefined,adults:state.travellerCounts.adults,children:state.travellerCounts.children,infants:state.travellerCounts.infants,total:travellers,requirements},journey:{startDate:state.travelDates.start,endDate:state.travelDates.end,days:totalDays,nights:Math.max(0,totalDays-1),pickup,dropoff,route},introduction:details.introduction||`We have thoughtfully shaped this journey around the places and experiences that drew you to Sri Lanka, balancing meaningful discovery with a comfortable island rhythm.`,destinations,days,stays,transport,guides,experiences,inclusions:included,exclusions,optionalItems:details.optionalItems??[],pricing:{currency:proposal.currency,total:commercialSummary.totalSellingPrice,perPerson:travellers?Math.round(commercialSummary.totalSellingPrice/travellers*100)/100:commercialSummary.totalSellingPrice,breakdown,allInclusive:true},payment:{depositAmount:deposit,depositDueDate:details.depositDueDate,depositDueLabel:deposit?details.depositDueDate?"Due by the date shown":"Due on acceptance":"Payment schedule will be confirmed before booking",balanceAmount:deposit===null?null:Math.max(0,commercialSummary.totalSellingPrice-deposit),balanceDueDate:details.balanceDueDate,paidAmount:paid,status:paid>=commercialSummary.totalSellingPrice?"paid":paid>0?"part_paid":"not_started"},importantInformation:important,terms:details.terms??"",validUntil:details.validUntil,nextSteps:["Review every part of your proposed journey.","Request any refinements you would like us to consider.","Accept this exact proposal version when you are happy.","Complete the required deposit or payment shown in the proposal.","Roam Ceylon will confirm the applicable arrangements and prepare your final travel documentation."],contact:{hotline:contact?.contact_phone||"+94 78 799 7897",whatsappUrl:contact?.whatsapp_url||"https://wa.me/message/G2QL7XFYJ5MAP1",facebookUrl:contact?.facebook_url||"https://www.facebook.com/profile.php?id=61592704994306",address:contact?.business_address||"Mahasen Mw, Rayfield Estate, Pallewela, Kuliyapitiya, Sri Lanka",websiteUrl:contact?.website_url||undefined,email:contact?.business_email||contact?.enquiry_email||undefined,businessRegistrationNumber:contact?.business_registration_number||undefined,sltdaRegistrationNumber:contact?.sltda_registration_number||undefined}};
}

export const customerProposalJson=(snapshot:ProposalSnapshot)=>json(snapshot);
