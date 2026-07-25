import {supabase,isSupabaseConfigured} from './supabase-client.js';
import {ThemeRepository,DestinationRepository,ExperienceRepository,AccommodationRepository,VehicleRepository,GuideRepository,PartnerApplicationRepository,WebsiteSettingsRepository,HomepageRepository,EnquiryRepository} from './repositories.js';

const contentTypes={
  dashboard:{label:'Overview'},
  themes:{label:'Travel Themes',repository:new ThemeRepository(),title:'name',image:'hero_image_url',alt:'image_alt',folder:'themes',fields:['name','slug','short_description','hero_image_url','image_alt','icon','display_order','seo_title','seo_description','needs_review','image_status','image_review_notes','needs_image_review','image_source','image_credit','image_focal_x','image_focal_y','status','active'],relations:[{name:'destination_ids',label:'Destinations',source:'destinations',join:'theme_destinations',local:'theme_id',foreign:'destination_id',nested:'theme_destinations',object:'destination'}]},
  destinations:{label:'Destinations',repository:new DestinationRepository(),title:'name',image:'hero_image_url',alt:'image_alt',folder:'destinations',fields:['name','slug','province','region','short_description','full_description','hero_image_url','image_alt','latitude','longitude','display_order','coming_soon','seo_title','seo_description','needs_review','image_status','image_review_notes','needs_image_review','image_source','image_credit','image_focal_x','image_focal_y','status','active'],relations:[{name:'theme_ids',label:'Travel themes',source:'themes',join:'theme_destinations',local:'destination_id',foreign:'theme_id',nested:'theme_destinations',object:'theme'}]},
  experiences:{label:'Experiences',repository:new ExperienceRepository(),title:'name',image:'hero_image_url',alt:'image_alt',folder:'experiences',fields:['name','slug','category','short_description','full_description','hero_image_url','image_alt','duration','difficulty','family_friendly','suitable_for_children','private_option','priority','featured','display_order','seo_title','seo_description','needs_review','image_status','image_review_notes','needs_image_review','image_source','image_credit','image_focal_x','image_focal_y','status','active'],relations:[{name:'destination_ids',label:'Destinations',source:'destinations',join:'experience_destinations',local:'experience_id',foreign:'destination_id',nested:'experience_destinations',object:'destination'},{name:'theme_ids',label:'Travel themes',source:'themes',join:'experience_themes',local:'experience_id',foreign:'theme_id',nested:'experience_themes',object:'theme'}]},
  accommodations:{label:'Stays',repository:new AccommodationRepository(),title:'name',image:'hero_image_url',alt:'image_alt',folder:'stays',fields:['name','slug','destination_id','property_type','star_rating','short_description','full_description','hero_image_url','image_alt','location','address','latitude','longitude','price_range','amenities','phone','email','website','booking_url','verified','featured','sponsored','subscription_plan','is_sample','needs_review','image_status','image_review_notes','needs_image_review','image_focal_x','image_focal_y','status','active']},
  vehicles:{label:'Getting Around',repository:new VehicleRepository(),title:'listing_title',image:'hero_image_url',alt:'image_alt',folder:'vehicles',fields:['listing_title','slug','provider_name','vehicle_type','vehicle_model','model_year','hero_image_url','image_alt','passenger_capacity','luggage_capacity','air_conditioned','driver_included','fuel_included','nationwide','daily_price_guide','transfer_price_guide','phone','email','website','verified','featured','sponsored','subscription_plan','is_sample','needs_review','image_status','image_review_notes','needs_image_review','image_focal_x','image_focal_y','status','active']},
  guides:{label:'Local Guides',repository:new GuideRepository(),title:'name',image:'profile_image_url',alt:'image_alt',folder:'guides',fields:['name','slug','profile_image_url','image_alt','short_bio','full_bio','languages','years_experience','specialities','licence_number','phone','email','verified','featured','sponsored','subscription_plan','is_sample','needs_review','image_status','image_review_notes','needs_image_review','image_focal_x','image_focal_y','status','active'],relations:[{name:'destination_ids',label:'Destinations',source:'destinations',join:'guide_destinations',local:'guide_id',foreign:'destination_id',nested:'guide_destinations',object:'destination'},{name:'theme_ids',label:'Travel themes',source:'themes',join:'guide_themes',local:'guide_id',foreign:'theme_id',nested:'guide_themes',object:'theme'},{name:'experience_ids',label:'Experiences',source:'experiences',join:'guide_experiences',local:'guide_id',foreign:'experience_id',nested:'guide_experiences',object:'experience'}]},
  partner_applications:{label:'Partner Applications',repository:new PartnerApplicationRepository(),title:'business_name',image:null,folder:'partners',fields:['application_type','business_name','applicant_name','email','phone','status','admin_notes']},
  homepage:{label:'Homepage Content',repository:new HomepageRepository(),title:'hero_title',image:'hero_background_image_url',alt:'hero_image_alt',folder:'homepage',singleton:true,fields:['hero_title','hero_subtitle','hero_background_image_url','hero_image_alt','primary_cta','secondary_cta','featured_theme_ids','featured_destination_ids','featured_experience_ids','featured_stay_ids','featured_vehicle_ids','featured_guide_ids','why_content','traveller_stories','partner_cta','footer_content','needs_review','status','active']},
  settings:{label:'Website Settings',repository:new WebsiteSettingsRepository(),title:'website_name',image:'logo_url',alt:'website_name',folder:'settings',singleton:true,fields:['website_name','logo_url','favicon_url','contact_phone','whatsapp_number','enquiry_email','business_address','social_links','default_seo_title','default_seo_description','default_social_image_url','currency','supported_languages','maintenance_mode','partner_registration_available','setup_checklist','setup_dismissed']},
  enquiries:{label:'Traveller Enquiries',repository:new EnquiryRepository(),title:'name',image:null,fields:['name','email','phone','nationality','travel_start_date','travel_end_date','adults','children','selected_themes','selected_destinations','selected_experiences','selected_stays','selected_vehicle','selected_guide','traveller_notes','status','internal_notes']}
};
const booleanFields=new Set(['active','coming_soon','featured','verified','family_friendly','suitable_for_children','private_option','air_conditioned','driver_included','fuel_included','nationwide','sponsored','is_sample','needs_review','needs_image_review','maintenance_mode','partner_registration_available','setup_dismissed']);
const numberFields=new Set(['display_order','star_rating','latitude','longitude','passenger_capacity','years_experience','model_year','image_focal_x','image_focal_y','adults','children']);
const jsonFields=new Set(['amenities','languages','specialities','primary_cta','secondary_cta','featured_theme_ids','featured_destination_ids','featured_experience_ids','featured_stay_ids','featured_vehicle_ids','featured_guide_ids','why_content','traveller_stories','partner_cta','footer_content','social_links','supported_languages','setup_checklist','selected_themes','selected_destinations','selected_experiences','selected_stays']);
let activeType='dashboard',editing=null,profile=null,dirty=false;
const $=selector=>document.querySelector(selector);
const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));

async function protect(){
  if(!isSupabaseConfigured){$('#adminLoading').textContent='Supabase environment variables are not configured.';return false;}
  const {data:{session}}=await supabase.auth.getSession();
  if(!session){location.replace('/admin/login/');return false;}
  const {data,error}=await supabase.from('profiles').select('*').eq('id',session.user.id).single();
  if(error||!['admin','editor'].includes(data?.role)){
    $('#adminLoading').textContent='Access Denied — your account does not have an authorised staff profile.';
    return false;
  }
  profile=data;$('#adminUser').textContent=`${profile.full_name||profile.email} · ${profile.role}`;return true;
}
function renderNav(){
  $('#adminNav').innerHTML=Object.entries(contentTypes).filter(([key])=>profile.role==='admin'||key!=='partner_applications').map(([key,type])=>`<button type="button" class="${key===activeType?'active':''}" data-admin-type="${key}">${type.label}</button>`).join('');
}
async function count(table,filters={}){
  let query=supabase.from(table).select('*',{count:'exact',head:true});
  Object.entries(filters).forEach(([field,value])=>{query=query.eq(field,value);});
  const {count,error}=await query;if(error)throw error;return count||0;
}
async function renderDashboard(){
  $('#adminTitle').textContent='Content Overview';$('#adminAdd').hidden=true;$('#adminBulk').hidden=true;
  const [themes,destinations,experiences,published,drafts,missing,duplicates,review,pending,enquiries,settings]=await Promise.all([
    count('themes'),count('destinations'),count('experiences'),count('experiences',{status:'published'}),count('experiences',{status:'draft'}),
    count('experiences',{image_status:'missing'}),count('experiences',{image_status:'duplicate'}),count('experiences',{needs_review:true}),
    profile.role==='admin'?count('partner_applications',{status:'pending'}):0,count('enquiries',{status:'new'}),
    new WebsiteSettingsRepository().getPublic()
  ]);
  const metrics=[
    ['Total Themes',themes,'themes'],['Total Destinations',destinations,'destinations'],['Total Experiences',experiences,'experiences'],
    ['Published Experiences',published,'experiences'],['Draft Experiences',drafts,'experiences'],['Missing Images',missing,'experiences'],
    ['Duplicate Images',duplicates,'experiences'],['Content Needing Review',review,'experiences'],
    ['Pending Partner Applications',pending,'partner_applications'],['New Traveller Enquiries',enquiries,'enquiries']
  ];
  $('#adminMessage').textContent='Content Health — select a card to review the corresponding records.';
  const checklist=settings.setup_checklist||{},complete=Object.values(checklist).filter(Boolean).length,total=Object.keys(checklist).length;
  $('#adminList').innerHTML=`<div class="admin-health-grid">${metrics.filter(([, ,target])=>profile.role==='admin'||target!=='partner_applications').map(([label,value,target])=>`<button class="admin-health-card" data-health-target="${target}"><strong>${value}</strong><span>${label}</span></button>`).join('')}</div>
    <section class="admin-setup"><h2>Launch checklist · ${complete}/${total}</h2><p>Review imported content, correct imagery, replace sample marketplace listings, configure contact details and publish only approved records.</p>
    <div class="admin-checklist">${Object.entries(checklist).map(([key,value])=>`<label><input type="checkbox" data-setup-key="${key}" ${value?'checked':''}> ${key.replaceAll('_',' ')}</label>`).join('')}</div>
    <button class="btn btn-outline" data-health-target="settings">Open all website settings</button></section>`;
}
async function loadList(){
  if(activeType==='dashboard'){await renderDashboard();return;}
  const type=contentTypes[activeType];
  $('#adminBulk').hidden=Boolean(type.singleton)||['partner_applications','enquiries','settings','homepage'].includes(activeType);
  $('#adminAdd').hidden=Boolean(type.singleton)||['partner_applications','enquiries'].includes(activeType);
  $('#adminTitle').textContent=type.label;$('#adminMessage').textContent='Loading…';
  try{
    let sort=$('#adminSort').value;
    if(sort==='name')sort=type.title;
    if(type.singleton)sort='updated_at';
    const health=$('#adminHealthFilter').value;
    const rows=await type.repository.listAdmin({search:$('#adminSearch').value,status:$('#adminStatusFilter').value,sort,filters:health?{[health]:true}:{}});
    $('#adminMessage').textContent=`${rows.length} records`;
    $('#adminList').innerHTML=rows.map(row=>`<article class="admin-content-row">
      ${!type.singleton&&!['partner_applications','enquiries'].includes(activeType)?`<input class="admin-row-check" type="checkbox" value="${row.id}" aria-label="Select ${escape(row[type.title])}">`:''}
      ${type.image?`<img src="${escape(row[type.image])}" alt="${escape(row[type.alt])}">`:''}
      <div><span class="market-tag">${escape(row.status||'record')}</span>${row.needs_review?'<span class="market-tag">Needs review</span>':''}<h3>${escape(row[type.title]||row.applicant_name||'Untitled')}</h3><p>${escape(row.short_description||row.short_bio||row.email||'')}</p></div>
      <div class="admin-row-actions">${activeType==='partner_applications'?`
        <button data-admin-action="edit" data-id="${row.id}">Review</button>
        <button data-admin-action="approve" data-id="${row.id}">Approve</button>
        ${profile.role==='admin'&&row.status==='approved'?`<button data-admin-action="convert" data-id="${row.id}">Convert to draft</button>`:''}
        <button data-admin-action="needs_changes" data-id="${row.id}">Needs changes</button>
        <button data-admin-action="reject" data-id="${row.id}">Reject</button>
        ${profile.role==='admin'?`<button class="danger" data-admin-action="delete" data-id="${row.id}">Delete</button>`:''}
      `:`
        ${type.image?`<button data-admin-action="preview" data-id="${row.id}">Preview</button>`:''}
        <button data-admin-action="edit" data-id="${row.id}">Edit</button>
        ${row.status!==undefined?(row.status==='published'?`<button data-admin-action="unpublish" data-id="${row.id}">Unpublish</button>`:`<button data-admin-action="publish" data-id="${row.id}">Publish</button>`):''}
        ${!type.singleton?`<button data-admin-action="duplicate" data-id="${row.id}">Duplicate</button>`:''}
        ${profile.role==='admin'?`<button class="danger" data-admin-action="delete" data-id="${row.id}">Delete</button>`:''}
      `}</div>
    </article>`).join('')||'<div class="destination-empty">No matching records.</div>';
  }catch(error){$('#adminMessage').textContent=error.message;}
}
function fieldControl(name,value){
  const label=name.replaceAll('_',' ');
  if(booleanFields.has(name))return `<label class="admin-check"><input name="${name}" type="checkbox" ${value?'checked':''}> ${label}</label>`;
  if(name==='status'&&activeType==='partner_applications')return `<label>${label}<select name="${name}">${['pending','under_review','needs_changes','approved','rejected'].map(item=>`<option ${value===item?'selected':''}>${item}</option>`).join('')}</select></label>`;
  if(name==='status'&&activeType==='enquiries')return `<label>${label}<select name="${name}">${['new','contacted','quote_preparing','quote_sent','confirmed','closed','cancelled'].map(item=>`<option ${value===item?'selected':''}>${item}</option>`).join('')}</select></label>`;
  if(name==='status')return `<label>${label}<select name="${name}">${['draft','in_review','published','archived'].map(item=>`<option ${value===item?'selected':''}>${item}</option>`).join('')}</select></label>`;
  if(name==='image_status')return `<label>${label}<select name="${name}">${['approved','needs_review','missing','broken','duplicate','unrelated'].map(item=>`<option ${value===item?'selected':''}>${item}</option>`).join('')}</select></label>`;
  if(name==='priority')return `<label>${label}<select name="${name}"><option value="">Optional</option>${['must-do','popular','hidden-gem','seasonal','optional'].map(item=>`<option ${value===item?'selected':''}>${item}</option>`).join('')}</select></label>`;
  if(/description|_bio|admin_notes/.test(name))return `<label>${label}<textarea name="${name}" rows="4">${escape(value)}</textarea></label>`;
  const type=numberFields.has(name)?'number':name==='email'?'email':name==='website'?'url':'text';
  const display=jsonFields.has(name)?JSON.stringify(value||[]):value??'';
  return `<label>${label}<input name="${name}" type="${type}" value="${escape(display)}"></label>`;
}
function preview(record,type){
  if(!type.image){$('#adminPreview').innerHTML=`<div class="market-card"><h3>${escape(record[type.title]||record.applicant_name||'Application')}</h3><p>${escape(record.email||'')}</p></div>`;return;}
  $('#adminPreview').innerHTML=`<article class="planner-card"><div class="planner-card-media"><img src="${escape(record[type.image])}" alt="${escape(record[type.alt])}"><span class="planner-card-shade"></span></div><div class="planner-card-body"><h4>${escape(record[type.title]||'Untitled')}</h4><p>${escape(record.short_description||record.short_bio||record.vehicle_model||'')}</p></div></article>`;
}
function validatePublish(record,type){
  const errors=[];
  const description=record.short_description||record.short_bio||record.hero_subtitle;
  if(!record[type.title])errors.push('title or name');
  if(!record.slug&&!type.singleton)errors.push('slug');
  if(!description&&!['settings','homepage'].includes(activeType))errors.push('traveller-facing description');
  if(type.image&&(!record[type.image]||!record[type.alt]))errors.push('image and alt text');
  if(record.image_status&&['missing','broken','unrelated'].includes(record.image_status))errors.push(`approved/reviewable image (currently ${record.image_status})`);
  if(/official Sri Lanka destination guide|thoughtfully paced/i.test(description||''))errors.push('clean description without prohibited generated copy');
  const relationshipFields={themes:'theme_destinations',destinations:'theme_destinations',experiences:'experience_destinations'}[activeType];
  if(relationshipFields&&!(record[relationshipFields]||[]).length)errors.push('required relationship');
  if(['accommodations','vehicles','guides'].includes(activeType)&&!record.email&&!record.phone)errors.push('contact email or phone');
  if(record.is_sample)errors.push('replacement of sample record with verified real listing data');
  if(errors.length)throw new Error(`Cannot publish until corrected: ${errors.join(', ')}.`);
  if(record.image_status==='duplicate'&&!confirm('This image may be duplicated. Publish with an admin override?'))throw new Error('Publication cancelled for duplicate-image review.');
}
async function openEditor(record={}){
  const type=contentTypes[activeType];editing=record.id||null;
  $('#editorSave').hidden=false;
  $('#adminEditorForm').querySelectorAll('input,textarea,select').forEach(input=>input.disabled=false);
  $('#editorTitle').textContent=editing?'Edit record':'Add record';
  $('#editorFields').innerHTML=type.fields.map(field=>fieldControl(field,record[field])).join('')+(type.image?`<label>Upload or replace image<input name="image_upload" type="file" accept="image/jpeg,image/png,image/webp,image/avif"></label>`:'');
  for(const relation of type.relations||[]){
    const {data:options,error}=await supabase.from(relation.source).select('id,name').order('name',{ascending:true});
    if(error)throw error;
    const selected=new Set((record[relation.nested]||[]).map(item=>item[relation.object]?.id).filter(Boolean));
    $('#editorFields').insertAdjacentHTML('beforeend',`<label>${relation.label}<select name="${relation.name}" multiple size="6">${options.map(option=>`<option value="${option.id}" ${selected.has(option.id)?'selected':''}>${escape(option.name||option.listing_title)}</option>`).join('')}</select></label>`);
  }
  preview(record,type);$('#imageWarning').textContent='';
  $('#adminEditor').showModal();
  dirty=false;
  $('#adminEditorForm').querySelectorAll('input,textarea,select').forEach(input=>input.addEventListener('input',()=>{dirty=true;preview(formRecord(new FormData($('#adminEditorForm'))),type);}));
}
async function convertPartner(record){
  if(profile.role!=='admin')throw new Error('Only administrators can convert partner applications.');
  const common={slug:`partner-${record.id.slice(0,8)}-${Date.now().toString(36)}`,status:'draft',active:true,phone:record.phone,email:record.email,verified:false,featured:false};
  if(record.application_type==='accommodation'){
    await contentTypes.accommodations.repository.create({...common,name:record.business_name,property_type:'Partner property',short_description:record.application_data?.message||'Partner-submitted accommodation. Review before publishing.'});
  }else if(record.application_type==='vehicle'){
    await contentTypes.vehicles.repository.create({...common,listing_title:record.business_name,vehicle_type:'Partner fleet',vehicle_model:record.application_data?.message||null});
  }else{
    await contentTypes.guides.repository.create({...common,name:record.business_name,short_bio:record.application_data?.message||'Partner-submitted guide profile. Review before publishing.'});
  }
  await contentTypes.partner_applications.repository.update(record.id,{status:'approved',admin_notes:`${record.admin_notes||''}\nConverted to a draft listing on ${new Date().toISOString()}.`.trim()});
}
function formRecord(data){
  const type=contentTypes[activeType],record={};
  for(const field of type.fields){
    if(booleanFields.has(field))record[field]=$(`[name="${field}"]`)?.checked||false;
    else if(numberFields.has(field))record[field]=data.get(field)===''?null:Number(data.get(field));
    else if(jsonFields.has(field)){try{record[field]=JSON.parse(data.get(field)||'[]');}catch{throw new Error(`${field} must be valid JSON.`);}}
    else record[field]=data.get(field)||null;
  }
  return record;
}
async function saveEditor(event){
  event.preventDefault();
  const type=contentTypes[activeType],data=new FormData(event.currentTarget);
  try{
    const record=formRecord(data);
    const file=data.get('image_upload');
    if(file?.size)record[type.image]=await type.repository.uploadImage(file,type.folder);
    if(record.status==='published'){
      validatePublish(record,type);
    }
    if(type.image&&record[type.image]){
      const usages=await type.repository.findImageUsage(record[type.image],editing);
      if(usages.length&&!confirm('This image is already used by another card. Save anyway?'))return;
    }
    const saved=editing?await type.repository.update(editing,record):await type.repository.create(record);
    for(const relation of type.relations||[]){
      const selected=data.getAll(relation.name);
      const {error:deleteError}=await supabase.from(relation.join).delete().eq(relation.local,saved.id);
      if(deleteError)throw deleteError;
      if(selected.length){
        const {error:insertError}=await supabase.from(relation.join).insert(selected.map(id=>({[relation.local]:saved.id,[relation.foreign]:id})));
        if(insertError)throw insertError;
      }
    }
    dirty=false;$('#adminEditor').close();await loadList();
  }catch(error){$('#imageWarning').textContent=error.message;}
}

if(await protect()){
  $('#adminLoading').hidden=true;$('#adminApp').hidden=false;renderNav();await loadList();
  $('#adminNav').addEventListener('click',event=>{const button=event.target.closest('[data-admin-type]');if(!button)return;activeType=button.dataset.adminType;$('#adminStatusFilter').value='';$('#adminHealthFilter').value='';renderNav();loadList();});
  $('#adminAdd').addEventListener('click',()=>openEditor({status:'draft',active:true}));
  $('#adminSearch').addEventListener('input',loadList);$('#adminStatusFilter').addEventListener('change',loadList);$('#adminHealthFilter').addEventListener('change',loadList);$('#adminSort').addEventListener('change',loadList);
  $('#adminSignOut').addEventListener('click',async()=>{await supabase.auth.signOut();location.replace('/admin/login/');});
  $('#adminList').addEventListener('click',async event=>{
    const health=event.target.closest('[data-health-target]');if(health){activeType=health.dataset.healthTarget;renderNav();await loadList();return;}
    const button=event.target.closest('[data-admin-action]');if(!button)return;
    const repository=contentTypes[activeType].repository,record=await repository.find(button.dataset.id),action=button.dataset.adminAction;
    if(action==='edit'||action==='preview'){await openEditor(record);if(action==='preview'){$('#adminEditorForm').querySelectorAll('input,textarea,select').forEach(input=>input.disabled=true);$('#editorSave').hidden=true;}return;}
    if(action==='publish'){validatePublish(record,contentTypes[activeType]);await repository.publish(record.id);}
    if(action==='unpublish')await repository.unpublish(record.id);
    if(action==='approve')await repository.update(record.id,{status:'approved'});
    if(action==='needs_changes')await repository.update(record.id,{status:'needs_changes'});
    if(action==='reject')await repository.update(record.id,{status:'rejected'});
    if(action==='convert')await convertPartner(record);
    if(action==='duplicate')await repository.duplicate(record.id);
    if(action==='delete'&&confirm(`Delete ${record[contentTypes[activeType].title]||'this record'}?`))await repository.delete(record.id);
    await loadList();
  });
  $('#adminList').addEventListener('change',async event=>{
    const input=event.target.closest('[data-setup-key]');if(!input)return;
    const settings=await new WebsiteSettingsRepository().getPublic();
    await new WebsiteSettingsRepository().update(true,{setup_checklist:{...(settings.setup_checklist||{}),[input.dataset.setupKey]:input.checked}});
    await renderDashboard();
  });
  $('#adminSelectAll').addEventListener('change',event=>document.querySelectorAll('.admin-row-check').forEach(input=>input.checked=event.target.checked));
  $('#adminApplyBulk').addEventListener('click',async()=>{
    const action=$('#adminBulkAction').value,ids=[...document.querySelectorAll('.admin-row-check:checked')].map(input=>input.value);
    if(!action||!ids.length)return;
    if(!confirm(`Apply "${action}" to ${ids.length} selected records?`))return;
    if(action==='publish'){
      for(const id of ids)validatePublish(await contentTypes[activeType].repository.find(id),contentTypes[activeType]);
    }
    const updates={publish:{status:'published'},unpublish:{status:'draft'},archive:{status:'archived'},activate:{active:true},deactivate:{active:false},review:{needs_review:true}}[action];
    const {error}=await supabase.from(contentTypes[activeType].repository.table).update(updates).in('id',ids);
    if(error)$('#adminMessage').textContent=error.message;else await loadList();
  });
  $('#adminEditorForm').addEventListener('submit',saveEditor);
  $('#adminEditor').addEventListener('cancel',event=>{if(dirty&&!confirm('Discard unsaved changes?'))event.preventDefault();});
  addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
}
