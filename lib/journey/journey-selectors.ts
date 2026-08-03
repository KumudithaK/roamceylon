import type {JourneyDestination,JourneyExperience,JourneyStay} from "@/lib/types";
export const unionById=<T extends{id:string}>(items:T[])=>[...new Map(items.map(item=>[item.id,item])).values()];
export const availableDestinations=(items:JourneyDestination[],themeIds:string[])=>themeIds.length?unionById(items.filter(item=>item.themeIds.some(id=>themeIds.includes(id)))).sort((a,b)=>a.name.localeCompare(b.name)):[];
export const availableExperiences=(items:JourneyExperience[],destinationIds:string[])=>destinationIds.length?unionById(items.filter(item=>item.destinationIds.some(id=>destinationIds.includes(id)))).map(item=>({...item,matchedDestinationIds:item.destinationIds.filter(id=>destinationIds.includes(id))})).sort((a,b)=>a.name.localeCompare(b.name)):[];
export const availableStays=(items:JourneyStay[],destinationIds:string[])=>items.filter(item=>destinationIds.includes(item.destinationId));
