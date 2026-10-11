export const minimumArrivalLeadDays=14;

const pad=(value:number)=>String(value).padStart(2,"0");
const calendarDatePattern=/^(\d{4})-(\d{2})-(\d{2})$/;

const calendarDayOrdinal=(value:string):number|null=>{
  const match=calendarDatePattern.exec(value);
  if(!match)return null;
  const year=Number(match[1]),month=Number(match[2]),day=Number(match[3]);
  const date=new Date(0);
  date.setUTCFullYear(year,month-1,day);
  if(date.getUTCFullYear()!==year||date.getUTCMonth()!==month-1||date.getUTCDate()!==day)return null;
  // UTC calendar ordinals avoid local DST/elapsed-hour arithmetic.
  return date.getTime()/86_400_000;
};

export function overnightJourneyDuration(start:string,end:string):{days:number;nights:number}|null{
  const arrival=calendarDayOrdinal(start),departure=calendarDayOrdinal(end);
  // Preserve the curated-design/planning-estimate requirement for an overnight journey.
  // The public Builder's independent same-day departure validation is unchanged.
  if(arrival===null||departure===null||departure<=arrival)return null;
  const nights=departure-arrival;
  return {days:nights+1,nights};
}

export function isCalendarDate(value:string):boolean{
  const match=calendarDatePattern.exec(value);
  if(!match)return false;
  const year=Number(match[1]),month=Number(match[2]),day=Number(match[3]);
  const parsed=new Date(year,month-1,day);
  return parsed.getFullYear()===year&&parsed.getMonth()===month-1&&parsed.getDate()===day;
}

export function localCalendarDate(value=new Date()):string{
  return `${value.getFullYear()}-${pad(value.getMonth()+1)}-${pad(value.getDate())}`;
}

export function minimumArrivalDate(today=new Date()):string{
  return localCalendarDate(new Date(today.getFullYear(),today.getMonth(),today.getDate()+minimumArrivalLeadDays));
}

export function arrivalDateIssue(arrivalDate:string,today=new Date()):string{
  return !isCalendarDate(arrivalDate)||arrivalDate<minimumArrivalDate(today)?"Please choose an arrival date at least 14 days from today.":"";
}

export function departureDateIssue(arrivalDate:string,departureDate:string):string{
  if(!isCalendarDate(departureDate))return "Please choose a valid drop-off date.";
  return departureDate<arrivalDate?"Drop-off must be on or after pickup.":"";
}
