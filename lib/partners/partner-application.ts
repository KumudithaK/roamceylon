export type PartnerType="accommodation"|"vehicle"|"guide";
export type CatalogueOption={value:string;label:string};

export const districtProvince={
  Ampara:"Eastern",Anuradhapura:"North Central",Badulla:"Uva",Batticaloa:"Eastern",Colombo:"Western",
  Galle:"Southern",Gampaha:"Western",Hambantota:"Southern",Jaffna:"Northern",Kalutara:"Western",
  Kandy:"Central",Kegalle:"Sabaragamuwa",Kilinochchi:"Northern",Kurunegala:"North Western",Mannar:"Northern",
  Matale:"Central",Matara:"Southern",Monaragala:"Uva",Mullaitivu:"Northern","Nuwara Eliya":"Central",
  Polonnaruwa:"North Central",Puttalam:"North Western",Ratnapura:"Sabaragamuwa",Trincomalee:"Eastern",Vavuniya:"Northern"
} as const;

export const districts=Object.keys(districtProvince) as Array<keyof typeof districtProvince>;
export const provinceForDistrict=(district:string)=>districtProvince[district as keyof typeof districtProvince]??"";
export const introductionIsValid=(value:unknown)=>typeof value==="string"&&value.trim().length>=30;

export const commonValueKeys=[
  "applicantName","businessName","email","countryCode","phone","preferredContactMethod","address","district","province",
  "website","socialUrl","introduction","heardFrom","consent","accurate","honeypot"
] as const;

export const serviceValueKeys={
  accommodation:["propertyType","destination","totalRooms","guestCapacity","pricingBasis","startingPrice","currency","yearEstablished","starCategory","mealPlans","checkIn","checkOut","amenities","parking","driverAccommodation","guideAccommodation","accessibility","sustainablePractices"],
  vehicle:["operatorType","operatingBase","coverage","vehicleCount","airportTransfers","islandWide","driverIncluded","languages"],
  guide:["guideType","homeBase","destinationsCovered","languages","yearsExperience","specialistKnowledge","experiencesSupported","halfDayFee","fullDayFee","multiDay","overnightTrips","driverGuide","licenceNumber","associationMembership","availabilityNotes"]
} as const;

export const partnerTypeFromRoute=(value?:string):PartnerType|undefined=>value==="accommodation"||value==="vehicle"||value==="guide"?value:undefined;

export function normalizedDraftType(initialType:PartnerType,explicitType:boolean,draftType:unknown):PartnerType{
  if(explicitType)return initialType;
  return draftType==="accommodation"||draftType==="vehicle"||draftType==="guide"?draftType:initialType;
}

export function normalizedProvince(values:Record<string,unknown>){
  const district=typeof values.district==="string"?values.district:"";
  return provinceForDistrict(district);
}

export function applicationValuesForType(
  type:PartnerType,
  values:Record<string,unknown>,
  entries:Array<Record<string,unknown>>,
  destinationSelections:string[],
  experienceSelections:string[]
):Record<string,unknown>{
  const allowed=new Set<string>([...commonValueKeys,...serviceValueKeys[type]]);
  const result=Object.fromEntries(Object.entries(values).filter(([key])=>allowed.has(key)));
  if(type==="guide"){
    result.destinationsCovered=destinationSelections.join("; ");
    result.experiencesSupported=experienceSelections.join("; ");
  }
  return {...result,entries:type==="guide"?[]:entries};
}

export function exclusiveSelection(current:string[],value:string,exclusive:string){
  if(value===exclusive)return current.includes(exclusive)?[]:[exclusive];
  const withoutExclusive=current.filter(item=>item!==exclusive);
  return withoutExclusive.includes(value)?withoutExclusive.filter(item=>item!==value):[...withoutExclusive,value];
}

export function parseLegacySelections(value:unknown){
  if(Array.isArray(value))return value.filter((item):item is string=>typeof item==="string"&&Boolean(item.trim()));
  if(typeof value!=="string"||!value.trim())return [];
  return value.split(/\s*;\s*/).map(item=>item.trim()).filter(Boolean);
}
