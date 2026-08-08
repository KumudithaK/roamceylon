export function accommodationBillableQuantity(method:string,{rooms,nights,guests}:{rooms:number;nights:number;guests:number}){
  const safeRooms=Math.max(1,rooms),safeNights=Math.max(1,nights),safeGuests=Math.max(1,guests);
  if(method==="per_person")return safeGuests*safeNights;
  if(method==="per_person_stay")return safeGuests;
  if(method==="per_stay")return 1;
  return safeRooms*safeNights;
}
