import "server-only";
import {AccommodationRepository,DestinationRepository,ExperienceRepository,GuideRepository,PricingPlanOptionRepository,ThemeRepository,VehicleRepository} from "@/lib/repositories/content";
import type {JourneyDestination,JourneyExperience,JourneyGuide,JourneyPricingEntityType,JourneyStay,JourneyTheme,JourneyVehicle} from "@/lib/types";
import {availableDestinations,availableExperiences,availableStays} from "./journey-selectors";

export type JourneyBootstrap={themes:JourneyTheme[];destinations:JourneyDestination[];experiences:JourneyExperience[];stays:JourneyStay[];vehicles:JourneyVehicle[];guides:JourneyGuide[]};
const pricingKey=(type:JourneyPricingEntityType,id:string)=>`${type}:${id}`;
export class JourneyService{
  constructor(private themes=new ThemeRepository(),private destinations=new DestinationRepository(),private experiences=new ExperienceRepository(),private stays=new AccommodationRepository(),private vehicles=new VehicleRepository(),private guides=new GuideRepository()){}
  async getJourneyBootstrapData():Promise<JourneyBootstrap>{
    let themes:JourneyTheme[]=[];
    let destinations:JourneyDestination[]=[];
    let experiences:JourneyExperience[]=[];
    try{themes=await this.themes.getWithDestinations()}catch(error){console.error("[journey:themes]",error);return {themes:[],destinations:[],experiences:[],stays:[],vehicles:[],guides:[]}}
    try{destinations=await this.destinations.getByThemeIds(themes.map(item=>item.id))}catch(error){console.error("[journey:destinations]",error)}
    try{experiences=await this.experiences.getByDestinationIds(destinations.map(item=>item.id))}catch(error){console.error("[journey:experiences]",error)}
    const results=await Promise.allSettled([
      this.stays.getByDestinationIds(destinations.map(item=>item.id)),
      this.vehicles.getPublished(destinations.map(item=>item.id)),
      this.guides.getMatching({themeIds:themes.map(item=>item.id),destinationIds:destinations.map(item=>item.id),experienceIds:experiences.map(item=>item.id)})
    ]);
    results.forEach((result,index)=>{if(result.status==="rejected")console.error(`[journey:${["accommodations","vehicles","guides"][index]}]`,result.reason)});
    const stays=results[0].status==="fulfilled"?results[0].value:[];
    const vehicles=results[1].status==="fulfilled"?results[1].value:[];
    const guides=results[2].status==="fulfilled"?results[2].value:[];
    const plans=await new PricingPlanOptionRepository().getFor([
      ...experiences.map(item=>({type:"experience" as const,id:item.id})),
      ...stays.map(item=>({type:"accommodation" as const,id:item.id})),
      ...vehicles.map(item=>({type:"vehicle" as const,id:item.id})),
      ...guides.map(item=>({type:"guide" as const,id:item.id}))
    ]);
    experiences=experiences.map(item=>({...item,pricingPlans:plans.get(pricingKey("experience",item.id))??[]}));
    const staysWithPlans=stays.map(item=>({...item,pricingPlans:plans.get(pricingKey("accommodation",item.id))??[]}));
    const vehiclesWithPlans=vehicles.map(item=>({...item,pricingPlans:plans.get(pricingKey("vehicle",item.id))??[]}));
    const guidesWithPlans=guides.map(item=>({...item,pricingPlans:plans.get(pricingKey("guide",item.id))??[]}));
    return {themes,destinations,experiences,stays:staysWithPlans,vehicles:vehiclesWithPlans,guides:guidesWithPlans};
  }
  getAvailableDestinations(data:JourneyBootstrap,themeIds:string[]){return availableDestinations(data.destinations,themeIds)}
  getAvailableExperiences(data:JourneyBootstrap,destinationIds:string[],themeIds:string[]){return availableExperiences(data.experiences,destinationIds,themeIds)}
  getAvailableStays(data:JourneyBootstrap,destinationIds:string[]){return availableStays(data.stays,destinationIds)}
  getAvailableVehicles(data:JourneyBootstrap,destinationIds:string[]=[]){return data.vehicles.filter(x=>x.nationwide||x.destinationIds.some(id=>destinationIds.includes(id)))}
  getAvailableGuides(data:JourneyBootstrap,selection:{selectedThemeIds:string[];selectedDestinationIds:string[];selectedExperienceIds:string[]}){return data.guides.map(x=>({...x,relevance:x.destinationIds.filter(id=>selection.selectedDestinationIds.includes(id)).length*4+x.themeIds.filter(id=>selection.selectedThemeIds.includes(id)).length*2+x.experienceIds.filter(id=>selection.selectedExperienceIds.includes(id)).length*3+(x.verified?1:0)})).filter(x=>x.nationwide||x.relevance!>0).sort((a,b)=>b.relevance!-a.relevance!)}
}
