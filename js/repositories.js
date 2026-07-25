import {supabase} from './supabase-client.js';

const requireClient = () => {
  if(!supabase) throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.');
  return supabase;
};
const clean = object => Object.fromEntries(Object.entries(object).filter(([,value])=>value!==undefined));
const priorityLabel = value => ({'must-do':'Must Do','hidden-gem':'Hidden Gem',popular:'Popular',seasonal:'Seasonal',optional:'Optional'})[value] || value;

export class BaseRepository {
  constructor({table,select='*',mapper=row=>row,imageField='hero_image_url',orderField='created_at',nameField='name'}){
    this.table=table;this.select=select;this.mapper=mapper;this.imageField=imageField;this.orderField=orderField;this.nameField=nameField;
  }
  async execute(query){
    const {data,error}=await query;
    if(error)throw error;
    return data;
  }
  async listPublished(){
    const rows=await this.execute(requireClient().from(this.table).select(this.select).eq('status','published').eq('active',true).order(this.orderField,{ascending:true}));
    return rows.map(this.mapper);
  }
  async listAdmin({search='',status='',sort='updated_at',ascending=false}={}){
    let query=requireClient().from(this.table).select(this.select).order(sort,{ascending});
    if(search)query=query.ilike(this.nameField,`%${search}%`);
    if(status)query=query.eq('status',status);
    return this.execute(query);
  }
  async find(id){return (await this.execute(requireClient().from(this.table).select(this.select).eq('id',id).single()));}
  async create(record){return this.execute(requireClient().from(this.table).insert(clean(record)).select().single());}
  async update(id,record){return this.execute(requireClient().from(this.table).update(clean(record)).eq('id',id).select().single());}
  async delete(id){await this.execute(requireClient().from(this.table).delete().eq('id',id));}
  async publish(id){return this.update(id,{status:'published'});}
  async unpublish(id){return this.update(id,{status:'draft'});}
  async duplicate(id){
    const original=await this.find(id);
    const {id:discarded,created_at,updated_at,...copy}=original;
    [
      'theme_destinations','experience_destinations','experience_themes',
      'guide_destinations','guide_themes','guide_experiences','destination'
    ].forEach(field=>delete copy[field]);
    copy.slug=`${copy.slug}-copy-${Date.now().toString(36)}`;
    const titleField=this.nameField;
    copy[titleField]=`${copy[titleField]} (Copy)`;
    copy.status='draft';
    return this.create(copy);
  }
  async findImageUsage(url,excludeId){
    if(!url)return [];
    let query=requireClient().from(this.table).select('id,slug').eq(this.imageField,url);
    if(excludeId)query=query.neq('id',excludeId);
    return this.execute(query);
  }
  async uploadImage(file,folder){
    const extension=file.name.split('.').pop().toLowerCase();
    const name=`${folder}/${crypto.randomUUID()}.${extension}`;
    const {error}=await requireClient().storage.from('travel-content').upload(name,file,{cacheControl:'3600',upsert:false});
    if(error)throw error;
    return requireClient().storage.from('travel-content').getPublicUrl(name).data.publicUrl;
  }
}

export class ThemeRepository extends BaseRepository {
  constructor(){super({table:'themes',orderField:'display_order',select:'*,theme_destinations(destination:destinations(id,slug,name))',mapper:row=>({
    id:row.slug,name:row.name,icon:row.icon,description:row.short_description,heroImage:row.hero_image_url,
    destinations:(row.theme_destinations||[]).map(item=>item.destination?.slug).filter(Boolean)
  })});}
}
export class DestinationRepository extends BaseRepository {
  constructor(){super({table:'destinations',orderField:'display_order',select:'*,theme_destinations(theme:themes(id,slug,name))',mapper:row=>({
    id:row.slug,name:row.name,province:row.province,heroImage:row.hero_image_url,shortDescription:row.short_description,
    coordinates:{lat:Number(row.latitude),lon:Number(row.longitude)},themeIds:(row.theme_destinations||[]).map(item=>item.theme?.slug).filter(Boolean),comingSoon:row.coming_soon
  })});}
}
export class ExperienceRepository extends BaseRepository {
  constructor(){super({table:'experiences',orderField:'display_order',select:'*,experience_destinations(destination:destinations(id,slug,name)),experience_themes(theme:themes(id,slug,name))',mapper:row=>({
    id:row.slug,name:row.name,category:row.category,destinationIds:(row.experience_destinations||[]).map(item=>item.destination?.slug).filter(Boolean),
    themeIds:(row.experience_themes||[]).map(item=>item.theme?.slug).filter(Boolean),heroImage:row.hero_image_url,gallery:row.gallery||[],
    shortDescription:row.short_description,duration:row.duration,difficulty:row.difficulty,bestSeason:row.priority==='seasonal'?'Seasonal':null,
    familyFriendly:row.family_friendly,suitableForChildren:row.suitable_for_children,privateOption:row.private_option,
    priority:priorityLabel(row.priority),tags:[],featured:row.featured,comingSoon:false
  })});}
}
export class AccommodationRepository extends BaseRepository {
  constructor(){super({table:'accommodations',select:'*,destination:destinations(slug)',mapper:row=>({
    id:row.slug,name:row.name,type:row.property_type,style:row.property_type,starRating:row.star_rating,destinationIds:[row.destination?.slug].filter(Boolean),
    location:row.address||row.destination?.slug,priceRange:row.price_range,amenities:row.amenities||[],heroImage:row.hero_image_url,
    verified:row.verified,featured:row.featured,premiumPartner:false,description:row.short_description
  })});}
}
export class VehicleRepository extends BaseRepository {
  constructor(){super({table:'vehicles',nameField:'listing_title',mapper:row=>({
    id:row.slug,name:row.listing_title,type:row.vehicle_type,capacity:`${row.passenger_capacity||1} guests`,luggage:row.luggage_capacity,
    airConditioning:row.air_conditioned,driverIncluded:row.driver_included,dayRate:Number((row.price_guide||'').match(/[\\d.]+/)?.[0]||0),
    perKm:0,priceGuide:row.price_guide,heroImage:row.hero_image_url,verified:row.verified,featured:row.featured,description:row.vehicle_model||row.vehicle_type
  })});}
}
export class GuideRepository extends BaseRepository {
  constructor(){super({table:'guides',imageField:'profile_image_url',select:'*,guide_destinations(destination:destinations(id,slug,name)),guide_themes(theme:themes(id,slug,name)),guide_experiences(experience:experiences(id,slug,name,category))',mapper:row=>({
    id:row.slug,name:row.name,languages:row.languages||[],experience:row.years_experience,specialities:row.specialities||[],
    destinationIds:(row.guide_destinations||[]).map(item=>item.destination?.slug).filter(Boolean),
    themeIds:(row.guide_themes||[]).map(item=>item.theme?.slug).filter(Boolean),
    experienceIds:(row.guide_experiences||[]).map(item=>item.experience?.slug).filter(Boolean),
    experienceCategoryIds:[...new Set((row.guide_experiences||[]).map(item=>item.experience?.category).filter(Boolean))],
    heroImage:row.profile_image_url,verified:row.verified,featured:row.featured,description:row.short_bio
  })});}
}
export class PartnerApplicationRepository extends BaseRepository {
  constructor(){super({table:'partner_applications',nameField:'business_name',imageField:null});}
  async submit(record){return this.create({...record,status:'pending'});}
}

Object.assign(window,{BaseRepository,ThemeRepository,DestinationRepository,ExperienceRepository,AccommodationRepository,VehicleRepository,GuideRepository,PartnerApplicationRepository});
