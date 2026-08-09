import type {RouteDestination} from "@/lib/journey/route";

export const sriLankaAirports=[
  {code:"CMB",name:"Bandaranaike International Airport",latitude:7.1808,longitude:79.8841},
  {code:"HRI",name:"Mattala Rajapaksa International Airport",latitude:6.2845,longitude:81.1241},
  {code:"JAF",name:"Jaffna International Airport",latitude:9.7923,longitude:80.0701}
] as const;
export type JourneyEndpointType="airport"|"other"|null;
export type JourneyEndpoint={type:JourneyEndpointType;airportCode:string;location:string;date:string;time:string;flightNumber:string};
export const emptyJourneyEndpoint=():JourneyEndpoint=>({type:null,airportCode:"",location:"",date:"",time:"",flightNumber:""});

export function normaliseJourneyEndpoint(value:unknown,fallbackDate=""):JourneyEndpoint{
  const item=value&&typeof value==="object"&&!Array.isArray(value)?value as Record<string,unknown>:{};
  const type=item.type==="airport"||item.type==="other"?item.type:null;
  return {type,airportCode:type==="airport"&&sriLankaAirports.some(airport=>airport.code===item.airportCode)?String(item.airportCode):"",location:type==="other"?String(item.location??"").trim():"",date:String(item.date??fallbackDate),time:String(item.time??""),flightNumber:type==="airport"?String(item.flightNumber??"").trim():""};
}

export const endpointLabel=(endpoint:JourneyEndpoint,kind:"pickup"|"dropoff")=>endpoint.type==="airport"
  ?sriLankaAirports.find(item=>item.code===endpoint.airportCode)?.name||`${kind==="pickup"?"Arrival":"Departure"} airport`
  :endpoint.location||`Other ${kind} location`;

export function endpointRouteLocation(endpoint:JourneyEndpoint,kind:"pickup"|"dropoff",destinations:RouteDestination[]){
  const airport=endpoint.type==="airport"?sriLankaAirports.find(item=>item.code===endpoint.airportCode):null;
  const matched=endpoint.type==="other"?destinations.find(item=>item.name.localeCompare(endpoint.location,undefined,{sensitivity:"base"})===0):null;
  return {id:`__${kind}__`,slug:"",name:endpointLabel(endpoint,kind),latitude:airport?.latitude??matched?.latitude??null,longitude:airport?.longitude??matched?.longitude??null};
}

export const endpointComplete=(endpoint:JourneyEndpoint)=>Boolean(endpoint.type&&(endpoint.type==="airport"?endpoint.airportCode:endpoint.location)&&endpoint.date&&endpoint.time);
