import type {ProposalSnapshot} from "../../lib/proposals/customer-proposal-types";

/** Synthetic, offline-only fixture. No captured private records or remote services. */
export function presentationSnapshot():ProposalSnapshot{
  const names=["Galle","Mirissa","Tangalle"],rooms="STAGING DEMO double room with breakfast";
  const stayNames=names.map(name=>`STAGING DEMO — ${name} Stay`);
  return {
    schemaVersion:1,generatedAt:"2026-10-30",proposalReference:"LOCAL-PRESENTATION-P1",version:1,
    brand:{name:"The Ceylon Edition",line:"Bespoke journeys through Sri Lanka.",logo:""},
    traveller:{name:"STAGING DEMO — Alex Morgan",email:"alex@example.invalid",adults:2,children:0,infants:0,total:2,requirements:["Fictional staging demonstration only."]},
    journey:{startDate:"2026-11-16",endDate:"2026-11-22",days:7,nights:6,pickup:"CMB",dropoff:"CMB",route:[{key:"pickup",name:"CMB",kind:"pickup"},...names.map((name,index)=>({key:String(index),name,kind:"destination" as const,nights:2,latitude:6.03-index*.04,longitude:80.22+index*.35})),{key:"dropoff",name:"CMB",kind:"dropoff"}]},
    introduction:"We have thoughtfully shaped this journey around the places and experiences that drew you to Sri Lanka, balancing meaningful discovery with a comfortable island rhythm.",
    destinations:names.map((name,index)=>({id:String(index),name,nights:2,summary:`Two unhurried nights in ${name}, with time for local discovery and relaxation.`,highlights:["Local culture","Coastal views","Unhurried discovery"]})),
    days:Array.from({length:7},(_,index)=>{const destination=names[Math.min(2,Math.floor(index/2))];return {day:index+1,date:`2026-11-${16+index}`,title:index===6?"Departure from Sri Lanka":index%2===0?`Journey to ${destination}`:destination,destination,route:index===6?"Tangalle → CMB":index%2===0?`${index===0?"CMB":names[index/2-1]} → ${destination}`:undefined,transport:index%2===0?["STAGING DEMO private chauffeur transfer"]:[],stay:index<6?stayNames[Math.floor(index/2)]:undefined,room:index<6?`${rooms} · ${rooms}`:undefined,meals:[rooms],experiences:index<6&&index%2===0?[{name:["Southern Beeralu Lace Artisan Encounter","Mirissa Headlands & Hidden-Cove Photography Walk","Oceanfront morning yoga and sound healing workshops"][index/2],timing:"Flexible timing"}]:[],guides:["Primary journey guide · STAGING DEMO Coastal Journey Host"],notes:index%2===0?["Accommodation is subject to confirmation."]:[]}}),
    stays:names.map((name,index)=>({name:stayNames[index],destination:name,nights:2,rooms:1,room:rooms,mealPlan:rooms,checkIn:`2026-11-${16+index*2}`,checkOut:`2026-11-${18+index*2}`,inclusions:["Double room with breakfast"],notes:[],confirmation:"Subject to confirmation"})),
    transport:[["CMB","Galle"],["Galle","Mirissa"],["Mirissa","Tangalle"],["Tangalle","CMB"]].map(([from,to])=>({from,to,service:"STAGING DEMO private chauffeur transfer — all transport costs included",details:["Car / SUV for two adults"],confirmation:"Subject to confirmation"})),
    guides:[{name:"STAGING DEMO — Coastal Journey Host",role:"Primary journey guide",languages:["English"],service:"Seven days",confirmation:"Subject to confirmation"}],
    experiences:names.map((destination,index)=>({name:["Southern Beeralu Lace Artisan Encounter","Mirissa Headlands & Hidden-Cove Photography Walk","Oceanfront morning yoga and sound healing workshops"][index],destination,description:"A thoughtfully selected part of this fictional coastal journey, with participation by both adults. Exact arrangements remain subject to confirmation.",duration:"Two hours",admission:"Admission for two adults included",guide:"As specified in itinerary",thingsToKnow:[],status:"subject_to_confirmation" as const})),
    inclusions:[...stayNames.map(name=>`Two nights at ${name}, double room with breakfast`),"Four private transfers","English-speaking guide for seven days","Three selected experiences for two adults","The Ceylon Edition journey design and coordination"],
    exclusions:["International airfare","Visa / ETA fees","Travel insurance","Meals not specifically stated as included","Personal expenses","Tips and gratuities"],optionalItems:[],
    pricing:{currency:"USD",total:2367.5,perPerson:1183.75,breakdown:[{key:"journey",label:"Complete curated journey",amount:2367.5}],allInclusive:true},
    payment:{depositAmount:700,depositDueDate:"2026-11-07",depositDueLabel:"Due by the date shown",balanceAmount:1667.5,balanceDueDate:"2026-11-14",paidAmount:0,status:"not_started"},importantInformation:["Fictional staging demonstration only. No real reservation or payment obligation.","Services shown as subject to confirmation will be secured after approval and required payment."],terms:"Fictional staging demonstration only. All payments and fulfilments are simulated; no legally binding booking or supplier commitment is created.",validUntil:"2026-11-06",
    nextSteps:["Review your journey","Request refinements","Accept this exact version","Complete simulated deposit","Prepare final arrangements"],
    benefits:[{code:"welcome",type:"roam_ceylon_complimentary",scope:"traveller",title:"Welcome T-shirt",description:"A fictional welcome touch for both travellers.",confidence:"guaranteed_by_roam_ceylon",quantity:2,verifiedSavings:0}],
    contact:{hotline:"+94 78 799 7897",whatsappUrl:"",facebookUrl:"",address:"Sri Lanka"}
  };
}
