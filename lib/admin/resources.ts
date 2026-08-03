export type ResourceType="stays"|"vehicles"|"guides"|"experiences"|"destinations";
export type PricingEntityType="accommodation"|"vehicle"|"guide"|"experience"|"destination";
export type ResourceConfig={
  type:ResourceType;
  label:string;
  singular:string;
  table:"accommodations"|"vehicles"|"guides"|"experiences"|"destinations";
  entityType:PricingEntityType;
  nameField:"name"|"listing_title";
  imageField:"hero_image_url"|"profile_image_url";
  tabs:Array<{id:string;label:string}>;
};

export const resourceConfigs:Record<ResourceType,ResourceConfig>={
  stays:{type:"stays",label:"Stays",singular:"Stay",table:"accommodations",entityType:"accommodation",nameField:"name",imageField:"hero_image_url",tabs:[{id:"general",label:"General"},{id:"gallery",label:"Gallery"},{id:"pricing",label:"Room Rates"},{id:"amenities",label:"Amenities"},{id:"policies",label:"Policies"},{id:"seo",label:"SEO"}]},
  vehicles:{type:"vehicles",label:"Vehicles",singular:"Vehicle",table:"vehicles",entityType:"vehicle",nameField:"listing_title",imageField:"hero_image_url",tabs:[{id:"general",label:"General"},{id:"gallery",label:"Gallery"},{id:"specifications",label:"Specifications"},{id:"pricing",label:"Rental Plans"},{id:"coverage",label:"Coverage"}]},
  guides:{type:"guides",label:"Local Guides",singular:"Guide",table:"guides",entityType:"guide",nameField:"name",imageField:"profile_image_url",tabs:[{id:"general",label:"General"},{id:"biography",label:"Biography"},{id:"gallery",label:"Gallery"},{id:"languages",label:"Languages"},{id:"coverage",label:"Coverage"},{id:"pricing",label:"Service Rates"}]},
  experiences:{type:"experiences",label:"Experiences",singular:"Experience",table:"experiences",entityType:"experience",nameField:"name",imageField:"hero_image_url",tabs:[{id:"general",label:"General"},{id:"story",label:"Editorial Story"},{id:"gallery",label:"Gallery"},{id:"pricing",label:"Ticket Types"},{id:"requirements",label:"Requirements"}]},
  destinations:{type:"destinations",label:"Destinations",singular:"Destination",table:"destinations",entityType:"destination",nameField:"name",imageField:"hero_image_url",tabs:[{id:"general",label:"General"},{id:"description",label:"Description"},{id:"gallery",label:"Gallery"},{id:"pricing",label:"Destination Fees"},{id:"seo",label:"SEO"}]}
};

export const isResourceType=(value:string):value is ResourceType=>value in resourceConfigs;
