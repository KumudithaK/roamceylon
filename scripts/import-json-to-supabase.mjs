import {createClient} from '@supabase/supabase-js';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

if(!process.argv.includes('--confirm-import')){
  throw new Error('Import aborted. Run with --confirm-import after reviewing the target project.');
}
const supabaseUrl=process.env.NEXT_PUBLIC_SUPABASE_URL||process.env.SUPABASE_URL;
const serviceRoleKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!supabaseUrl||!serviceRoleKey)throw new Error('SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
if(typeof window!=='undefined')throw new Error('This import may only run in a trusted server environment.');

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const json=async name=>JSON.parse(await readFile(path.join(root,'data',`${name}.json`),'utf8'));
const db=createClient(supabaseUrl,serviceRoleKey,{auth:{persistSession:false,autoRefreshToken:false}});
const slug=value=>String(value).normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const cleanDescription=value=>{
  const cleaned=String(value||'')
    .replace(/[^.]*from the official Sri Lanka destination guide[^.]*\.?/gi,'')
    .replace(/discover\b[^.]*through a thoughtfully paced[^.]*\.?/gi,'')
    .replace(/\s+/g,' ').trim();
  if(!cleaned)return null;
  if(cleaned.length<=160)return cleaned;
  const clipped=cleaned.slice(0,157).replace(/\s+\S*$/,'').replace(/[,:;.\s]+$/,'');
  return `${clipped}…`;
};
const ensure=(error,context)=>{if(error)throw new Error(`${context}: ${error.message}`);};
const upsert=async(table,rows)=>{
  const {data,error}=await db.from(table).upsert(rows,{onConflict:'slug'}).select('id,slug');
  ensure(error,`Upsert ${table}`);return new Map(data.map(row=>[row.slug,row.id]));
};

const [themes,destinations,experiences,accommodations,vehicles,guides]=await Promise.all(
  ['themes','destinations','experiences','accommodations','vehicles','guides'].map(json)
);
const duplicateExperienceImages=new Set(
  Object.entries(experiences.reduce((counts,item)=>({...counts,[item.heroImage]:(counts[item.heroImage]||0)+1}),{}))
    .filter(([image,count])=>image&&count>1).map(([image])=>image)
);
const allContent=[...themes,...destinations,...experiences,...accommodations,...vehicles,...guides];
const imageCounts=allContent.reduce((counts,item)=>item.heroImage?counts.set(item.heroImage,(counts.get(item.heroImage)||0)+1):counts,new Map());
const imageQuality=item=>{
  if(!item.heroImage)return {image_status:'missing',needs_image_review:true,image_review_notes:'No source image was available during import.'};
  if((imageCounts.get(item.heroImage)||0)>1)return {image_status:'duplicate',needs_image_review:true,image_review_notes:'This external image URL is reused and requires relevance review.'};
  return {image_status:'needs_review',needs_image_review:true,image_review_notes:'External source retained provisionally; confirm Sri Lankan relevance, quality, source and credit.'};
};
const report={source:'Existing Roam Ceylon JSON and Journey Builder',imported:{},updated:{},duplicates_skipped:0,missing_images:0,duplicate_images:0,uncertain_records:0,records_marked_for_review:0};
const quality=item=>{
  const image=imageQuality(item);
  if(image.image_status==='missing')report.missing_images+=1;
  if(image.image_status==='duplicate')report.duplicate_images+=1;
  report.records_marked_for_review+=1;
  return {...image,needs_review:true,image_source:item.heroImage?new URL(item.heroImage).hostname:null,image_credit:null,image_focal_x:50,image_focal_y:50};
};

console.log(`Importing into ${new URL(supabaseUrl).host}. Existing slugs will be updated.`);
const themeIds=await upsert('themes',themes.map((item,index)=>({
  name:item.name,slug:slug(item.id||item.name),short_description:cleanDescription(item.description),hero_image_url:item.heroImage||null,
  image_alt:item.heroImage?`${item.name} travel experiences in Sri Lanka`:null,icon:item.icon,display_order:index,status:item.heroImage?'published':'draft',active:true,
  seo_title:`${item.name} | Roam Ceylon`,seo_description:cleanDescription(item.description),...quality(item)
})));
report.imported.themes=themes.length;
const destinationIds=await upsert('destinations',destinations.map((item,index)=>({
  name:item.name,slug:slug(item.id||item.name),province:item.province,short_description:cleanDescription(item.shortDescription),
  hero_image_url:item.heroImage||null,image_alt:item.heroImage?`${item.name}, Sri Lanka`:null,latitude:item.coordinates?.lat,longitude:item.coordinates?.lon,
  display_order:index,coming_soon:Boolean(item.comingSoon),status:item.heroImage&&!item.comingSoon?'published':'draft',active:true,
  seo_title:`${item.name}, Sri Lanka | Roam Ceylon`,seo_description:cleanDescription(item.shortDescription),...quality(item)
})));
report.imported.destinations=destinations.length;
const experienceIds=await upsert('experiences',experiences.map((item,index)=>{
  const trustedImage=item.heroImage&&!duplicateExperienceImages.has(item.heroImage)?item.heroImage:null;
  const priority={'Must Do':'must-do','Popular':'popular','Hidden Gem':'hidden-gem','Seasonal':'optional','Optional':'optional'}[item.priority]||'optional';
  return {
    name:item.name,slug:slug(item.id||item.name),category:item.category,short_description:cleanDescription(item.shortDescription),
    hero_image_url:trustedImage,image_alt:trustedImage?`${item.name} in Sri Lanka`:null,gallery:trustedImage?[trustedImage]:[],
    duration:item.duration||null,difficulty:item.difficulty||null,priority,featured:Boolean(item.featured),display_order:index,
    status:trustedImage?'published':'draft',active:true,seo_title:`${item.name} | Roam Ceylon`,
    seo_description:cleanDescription(item.shortDescription),...quality(item)
  };
}));
report.imported.experiences=experiences.length;

const replaceLinks=async(table,rows,conflict,clearField,importedIds)=>{
  const {error:deleteError}=await db.from(table).delete().in(clearField,[...importedIds.values()]);
  ensure(deleteError,`Clear ${table}`);
  if(rows.length){const {error}=await db.from(table).upsert(rows,{onConflict:conflict});ensure(error,`Insert ${table}`);}
};
await replaceLinks('theme_destinations',themes.flatMap(theme=>(theme.destinations||[]).map(destination=>({theme_id:themeIds.get(slug(theme.id)),destination_id:destinationIds.get(slug(destination))}))).filter(row=>row.theme_id&&row.destination_id),'theme_id,destination_id','theme_id',themeIds);
await replaceLinks('experience_destinations',experiences.flatMap(experience=>(experience.destinationIds||[]).map(destination=>({experience_id:experienceIds.get(slug(experience.id)),destination_id:destinationIds.get(slug(destination))}))).filter(row=>row.experience_id&&row.destination_id),'experience_id,destination_id','experience_id',experienceIds);
await replaceLinks('experience_themes',experiences.flatMap(experience=>(experience.themeIds||[]).map(theme=>({experience_id:experienceIds.get(slug(experience.id)),theme_id:themeIds.get(slug(theme))}))).filter(row=>row.experience_id&&row.theme_id),'experience_id,theme_id','experience_id',experienceIds);

await upsert('accommodations',accommodations.map(item=>({
  name:item.name,slug:slug(item.id||item.name),destination_id:destinationIds.get(slug(item.destinationIds?.[0]))||null,property_type:item.type,
  star_rating:item.starRating,short_description:cleanDescription(item.description),hero_image_url:item.heroImage||null,
  image_alt:item.heroImage?`${item.name}, ${item.location}`:null,address:item.location,price_range:item.priceRange,amenities:item.amenities||[],
  verified:false,featured:false,sponsored:false,is_sample:true,status:'draft',active:true,needs_review:true,
  image_status:item.heroImage?'needs_review':'missing',needs_image_review:true,image_review_notes:'Legacy sample listing. Verify the property and image before replacing with a real partner record.',
  image_source:item.heroImage?new URL(item.heroImage).hostname:null
})));
report.imported.accommodations=accommodations.length;report.uncertain_records+=accommodations.length;
await upsert('vehicles',vehicles.map(item=>({
  listing_title:item.name,slug:slug(item.id||item.name),vehicle_type:item.type,short_description:cleanDescription(item.description),
  hero_image_url:item.heroImage||null,image_alt:item.heroImage?item.name:null,passenger_capacity:Number(String(item.capacity).match(/\d+/)?.[0]||1),
  luggage_capacity:item.luggage,air_conditioned:Boolean(item.airConditioning),driver_included:Boolean(item.driverIncluded),
  price_guide:null,daily_price_guide:null,verified:false,featured:false,sponsored:false,is_sample:true,status:'draft',active:true,needs_review:true,
  image_status:item.heroImage?'needs_review':'missing',needs_image_review:true,image_review_notes:'Legacy UI sample. Add a real provider, confirm specifications and replace pricing before publication.',
  image_source:item.heroImage?new URL(item.heroImage).hostname:null
})));
report.imported.vehicles=vehicles.length;report.uncertain_records+=vehicles.length;
const guideIds=await upsert('guides',guides.map(item=>({
  name:item.name,slug:slug(item.id||item.name),profile_image_url:item.heroImage||null,image_alt:item.heroImage?`${item.name}, local Sri Lankan guide`:null,
  short_bio:cleanDescription(item.description),languages:item.languages||[],years_experience:item.experience,specialities:item.specialities||[],
  verified:false,featured:false,sponsored:false,is_sample:true,status:'draft',active:true,needs_review:true,
  image_status:item.heroImage?'needs_review':'missing',needs_image_review:true,image_review_notes:'Legacy UI sample person. Replace with a real guide application before publication.',
  image_source:item.heroImage?new URL(item.heroImage).hostname:null
})));
report.imported.guides=guides.length;report.uncertain_records+=guides.length;
await replaceLinks('guide_destinations',guides.flatMap(guide=>(guide.destinationIds||[]).map(destination=>({guide_id:guideIds.get(slug(guide.id)),destination_id:destinationIds.get(slug(destination))}))).filter(row=>row.guide_id&&row.destination_id),'guide_id,destination_id','guide_id',guideIds);
await replaceLinks('guide_themes',guides.flatMap(guide=>(guide.themeIds||[]).map(theme=>({guide_id:guideIds.get(slug(guide.id)),theme_id:themeIds.get(slug(theme))}))).filter(row=>row.guide_id&&row.theme_id),'guide_id,theme_id','guide_id',guideIds);

report.duplicate_images=duplicateExperienceImages.size;
const {error:reportError}=await db.from('content_import_runs').insert({source:report.source,report});
ensure(reportError,'Save import report');
const reportPath=process.env.IMPORT_REPORT_PATH
  ?path.resolve(process.env.IMPORT_REPORT_PATH)
  :path.join(root,'reports','latest-import-report.json');
await mkdir(path.dirname(reportPath),{recursive:true});
await writeFile(reportPath,`${JSON.stringify(report,null,2)}\n`);
console.log(JSON.stringify(report,null,2));
console.log(`Import complete. ${duplicateExperienceImages.size} repeated experience image URLs were left blank on draft records for manual correction.`);
