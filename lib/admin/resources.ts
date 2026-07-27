export type ResourceType="stays"|"vehicles"|"guides"|"experiences"|"destinations";
export type PricingEntityType="accommodation"|"vehicle"|"guide"|"experience"|"destination";
export type ResourceField={key:string;label:string;kind?:"text"|"textarea"|"number"|"boolean"|"list"};
export type ResourceTab={id:string;label:string;fields:ResourceField[]};
export type ResourceConfig={
  type:ResourceType;
  label:string;
  singular:string;
  table:"accommodations"|"vehicles"|"guides"|"experiences"|"destinations";
  entityType:PricingEntityType;
  nameField:"name"|"listing_title";
  imageField:"hero_image_url"|"profile_image_url";
  tabs:ResourceTab[];
};

const general=(nameField:string):ResourceField[]=>[
  {key:nameField,label:"Name"},
  {key:"slug",label:"URL slug"},
  {key:"status",label:"Publishing status"},
  {key:"active",label:"Active",kind:"boolean"}
];
const gallery=(imageField:string):ResourceField[]=>[
  {key:imageField,label:"Main image URL"},
  {key:"image_alt",label:"Image description"},
  {key:"gallery",label:"Gallery image URLs",kind:"list"}
];
const seo:ResourceField[]=[{key:"seo_title",label:"SEO title"},{key:"seo_description",label:"SEO description",kind:"textarea"}];

export const resourceConfigs:Record<ResourceType,ResourceConfig>={
  stays:{type:"stays",label:"Stays",singular:"Stay",table:"accommodations",entityType:"accommodation",nameField:"name",imageField:"hero_image_url",tabs:[
    {id:"general",label:"General",fields:[...general("name"),{key:"destination_id",label:"Destination"},{key:"property_type",label:"Property type"},{key:"star_rating",label:"Star rating",kind:"number"}]},
    {id:"gallery",label:"Gallery",fields:gallery("hero_image_url")},
    {id:"pricing",label:"Pricing",fields:[]},
    {id:"amenities",label:"Amenities",fields:[{key:"amenities",label:"Amenities",kind:"list"}]},
    {id:"policies",label:"Policies",fields:[{key:"address",label:"Address",kind:"textarea"},{key:"booking_url",label:"Booking URL"}]},
    {id:"seo",label:"SEO",fields:seo}
  ]},
  vehicles:{type:"vehicles",label:"Vehicles",singular:"Vehicle",table:"vehicles",entityType:"vehicle",nameField:"listing_title",imageField:"hero_image_url",tabs:[
    {id:"general",label:"General",fields:[...general("listing_title"),{key:"vehicle_type",label:"Vehicle type"},{key:"provider_name",label:"Provider"}]},
    {id:"gallery",label:"Gallery",fields:gallery("hero_image_url")},
    {id:"specifications",label:"Specifications",fields:[{key:"passenger_capacity",label:"Maximum passengers",kind:"number"},{key:"luggage_capacity",label:"Luggage capacity"},{key:"driver_included",label:"Driver included",kind:"boolean"},{key:"fuel_included",label:"Fuel included",kind:"boolean"}]},
    {id:"pricing",label:"Pricing",fields:[]},
    {id:"coverage",label:"Coverage",fields:[{key:"nationwide",label:"Available nationwide",kind:"boolean"}]}
  ]},
  guides:{type:"guides",label:"Local Guides",singular:"Guide",table:"guides",entityType:"guide",nameField:"name",imageField:"profile_image_url",tabs:[
    {id:"general",label:"General",fields:[...general("name"),{key:"years_experience",label:"Years of experience",kind:"number"},{key:"verified",label:"Verified",kind:"boolean"}]},
    {id:"biography",label:"Biography",fields:[{key:"short_bio",label:"Short biography",kind:"textarea"},{key:"full_bio",label:"Full biography",kind:"textarea"},...gallery("profile_image_url")]},
    {id:"languages",label:"Languages",fields:[{key:"languages",label:"Languages",kind:"list"},{key:"specialities",label:"Specialities",kind:"list"}]},
    {id:"coverage",label:"Coverage",fields:[{key:"nationwide",label:"Available nationwide",kind:"boolean"}]},
    {id:"pricing",label:"Pricing",fields:[]}
  ]},
  experiences:{type:"experiences",label:"Experiences",singular:"Experience",table:"experiences",entityType:"experience",nameField:"name",imageField:"hero_image_url",tabs:[
    {id:"general",label:"General",fields:[...general("name"),{key:"category",label:"Category"},{key:"duration",label:"Duration"},{key:"difficulty",label:"Difficulty"}]},
    {id:"gallery",label:"Gallery",fields:gallery("hero_image_url")},
    {id:"pricing",label:"Pricing",fields:[]},
    {id:"requirements",label:"Requirements",fields:[{key:"family_friendly",label:"Family friendly",kind:"boolean"},{key:"suitable_for_children",label:"Suitable for children",kind:"boolean"},{key:"private_option",label:"Private option",kind:"boolean"}]}
  ]},
  destinations:{type:"destinations",label:"Destinations",singular:"Destination",table:"destinations",entityType:"destination",nameField:"name",imageField:"hero_image_url",tabs:[
    {id:"general",label:"General",fields:[...general("name"),{key:"province",label:"Province"},{key:"region",label:"Region"},{key:"short_description",label:"Short description",kind:"textarea"}]},
    {id:"description",label:"Description",fields:[{key:"full_description",label:"Full description",kind:"textarea"}]},
    {id:"gallery",label:"Gallery",fields:gallery("hero_image_url")},
    {id:"pricing",label:"Costs",fields:[]},
    {id:"seo",label:"SEO",fields:seo}
  ]}
};

export const isResourceType=(value:string):value is ResourceType=>value in resourceConfigs;

