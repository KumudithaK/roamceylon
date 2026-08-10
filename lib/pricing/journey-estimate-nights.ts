export type PlanningNightAllocation={
  nightsByDestination:Record<string,number>;
  unallocatedNights:number;
  exceedsJourney:boolean;
};

export function allocatePlanningNights(destinationIds:string[],preferences:Record<string,{nights?:number|null}|undefined>,tripNights:number):PlanningNightAllocation{
  const total=Math.max(0,Math.floor(tripNights));
  const nightsByDestination:Record<string,number>={};
  const open:string[]=[];
  let explicitTotal=0;
  for(const id of destinationIds){
    const value=preferences[id]?.nights;
    if(value===null||value===undefined){open.push(id);continue}
    const nights=Math.max(0,Math.floor(value));
    nightsByDestination[id]=nights;explicitTotal+=nights;
  }
  if(explicitTotal>total)return {nightsByDestination,unallocatedNights:0,exceedsJourney:true};
  let remaining=total-explicitTotal;
  if(open.length){
    const base=Math.floor(remaining/open.length),extra=remaining%open.length;
    open.forEach((id,index)=>{nightsByDestination[id]=base+(index<extra?1:0)});
    remaining=0;
  }
  return {nightsByDestination,unallocatedNights:remaining,exceedsJourney:false};
}
