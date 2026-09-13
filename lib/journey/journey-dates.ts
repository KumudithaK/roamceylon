export const minimumArrivalLeadDays=14;

const pad=(value:number)=>String(value).padStart(2,"0");
const calendarDatePattern=/^(\d{4})-(\d{2})-(\d{2})$/;

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
