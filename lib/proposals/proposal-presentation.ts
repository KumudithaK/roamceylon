import type {Json} from "@/lib/database.types";

const record=(value:Json|undefined):Record<string,Json|undefined>=>value&&typeof value==="object"&&!Array.isArray(value)?value:{};
const number=(value:Json|undefined)=>typeof value==="number"?value:Number(value)||0;
const text=(value:Json|undefined)=>typeof value==="string"?value:"";
const plural=(value:number,one:string,many=`${one}s`)=>`${value} ${value===1?one:many}`;

export function proposalLinePresentation(line:Record<string,Json>){
  const type=text(line.type),details=record(line.serviceDetails),plan=record(line.pricingPlanSnapshot);
  const service=text(line.serviceName)||text(line.resourceName),quantityLabel=text(line.quantityLabel).toLowerCase();
  const storedMethod=text(plan.chargingMethod)||text(plan.charging_method);
  const method=storedMethod||(/per person/i.test(service)||quantityLabel.includes("guest")?"per_person":"");
  const destination=text(line.destinationName),from=text(line.fromDestinationName),to=text(line.toDestinationName);
  if(type==="accommodation"){
    const guests=number(details.guests),rooms=number(details.rooms),nights=number(details.nights);
    const basis=method==="per_person"?`${plural(guests,"guest")} × ${plural(nights,"night")}`:method==="per_person_stay"?plural(guests,"guest"):method==="per_stay"?"Complete stay":`${plural(rooms,"room")} × ${plural(nights,"night")}`;
    return {title:text(line.resourceName)||text(line.providerName)||"Accommodation",subtitle:[service,basis,destination].filter(Boolean).join(" · ")};
  }
  if(type==="guide"){
    const specialist=text(details.guideRole)==="specialist";
    const role=specialist?(text(details.guideSpeciality)||"Local specialist").replaceAll("_"," "):"Primary journey guide";
    return {title:text(line.resourceName)||text(line.providerName)||"Guide",subtitle:[role,text(details.preferredLanguages),line.quantity?`${line.quantity} ${text(line.quantityLabel)||"days"}`:"",destination||"Journey-wide"].filter(Boolean).join(" · ")};
  }
  if(type==="vehicle")return {title:text(line.resourceName)||text(line.providerName)||"Private transport",subtitle:[service,from&&to?`${from} → ${to}`:"",line.quantity?`${line.quantity} ${text(line.quantityLabel)||"service"}`:""].filter(Boolean).join(" · ")};
  if(type==="experience")return {title:text(line.resourceName)||"Curated experience",subtitle:[service,line.quantity?`${line.quantity} ${text(line.quantityLabel)||"participants"}`:"",destination].filter(Boolean).join(" · ")};
  return {title:text(line.resourceName)||text(line.providerName)||"Journey service",subtitle:[service,destination].filter(Boolean).join(" · ")};
}
