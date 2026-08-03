import type {ResourceType} from "./resources";

export type RelationshipState={themeIds:string[];destinationIds:string[];experienceIds:string[]};

export function newDraft(type:ResourceType,token:string){
  const common={slug:`draft-${type}-${token}`,status:"draft" as const,active:false};
  if(type==="vehicles")return {...common,listing_title:"Untitled vehicle"};
  const names:Record<Exclude<ResourceType,"vehicles">,string>={themes:"Untitled theme",destinations:"Untitled destination",experiences:"Untitled experience",stays:"Untitled stay",guides:"Untitled guide"};
  return {...common,name:names[type]};
}

export function relationshipPublishIssues(type:ResourceType,record:Record<string,unknown>,relationships:RelationshipState){
  if(type==="destinations"&&!relationships.themeIds.length)return ["select at least one travel theme"];
  if(type==="experiences"){
    const issues:string[]=[];
    if(!relationships.destinationIds.length)issues.push("select at least one destination");
    if(!relationships.themeIds.length)issues.push("select at least one travel theme");
    return issues;
  }
  if(type==="stays"&&!record.destination_id)return ["select a destination"];
  if(type==="vehicles"&&!record.nationwide&&!relationships.destinationIds.length)return ["select coverage destinations or enable nationwide coverage"];
  if(type==="guides"&&!record.nationwide&&!relationships.destinationIds.length&&!relationships.themeIds.length&&!relationships.experienceIds.length)return ["select guide coverage or enable nationwide coverage"];
  return [];
}
