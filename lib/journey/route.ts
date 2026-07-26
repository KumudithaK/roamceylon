export type RouteDestination={id:string;slug:string;name:string;latitude:number|null;longitude:number|null};
export type LocatedRouteDestination=RouteDestination&{latitude:number;longitude:number};

const radians=(value:number)=>value*Math.PI/180;
const haversine=(a:LocatedRouteDestination,b:LocatedRouteDestination)=>{
  const earthRadius=6371;
  const latitudeDelta=radians(b.latitude-a.latitude);
  const longitudeDelta=radians(b.longitude-a.longitude);
  const value=Math.sin(latitudeDelta/2)**2+Math.cos(radians(a.latitude))*Math.cos(radians(b.latitude))*Math.sin(longitudeDelta/2)**2;
  return 2*earthRadius*Math.asin(Math.sqrt(value));
};

export function getRouteEstimate(destinations:RouteDestination[],selectedIds:string[]){
  const byId=new Map(destinations.filter((item):item is LocatedRouteDestination=>Number.isFinite(item.latitude)&&Number.isFinite(item.longitude)).map(item=>[item.id,item]));
  const route=selectedIds.map(id=>byId.get(id)).filter((item):item is LocatedRouteDestination=>Boolean(item));
  const directDistance=route.slice(1).reduce((total,item,index)=>total+haversine(route[index],item),0);
  const estimatedDistance=Math.round(directDistance*1.28);
  const estimatedTravelDays=estimatedDistance>0?Math.max(1,Math.ceil(estimatedDistance/180)):0;
  return {route,estimatedDistance,estimatedTravelDays};
}
