import {supabase,isSupabaseConfigured} from './supabase-client.js';
import {ThemeRepository,DestinationRepository,ExperienceRepository,AccommodationRepository,VehicleRepository,GuideRepository,PartnerApplicationRepository} from './repositories.js';

const contentTypes={
  themes:{label:'Travel Themes',repository:new ThemeRepository(),title:'name',image:'hero_image_url',alt:'image_alt',folder:'themes',fields:['name','slug','short_description','hero_image_url','image_alt','icon','display_order','status','active'],relations:[{name:'destination_ids',label:'Destinations',source:'destinations',join:'theme_destinations',local:'theme_id',foreign:'destination_id',nested:'theme_destinations',object:'destination'}]},
  destinations:{label:'Destinations',repository:new DestinationRepository(),title:'name',image:'hero_image_url',alt:'image_alt',folder:'destinations',fields:['name','slug','province','region','short_description','full_description','hero_image_url','image_alt','latitude','longitude','display_order','coming_soon','status','active'],relations:[{name:'theme_ids',label:'Travel themes',source:'themes',join:'theme_destinations',local:'destination_id',foreign:'theme_id',nested:'theme_destinations',object:'theme'}]},
  experiences:{label:'Experiences',repository:new ExperienceRepository(),title:'name',image:'hero_image_url',alt:'image_alt',folder:'experiences',fields:['name','slug','category','short_description','full_description','hero_image_url','image_alt','duration','difficulty','family_friendly','suitable_for_children','private_option','priority','featured','display_order','status','active'],relations:[{name:'destination_ids',label:'Destinations',source:'destinations',join:'experience_destinations',local:'experience_id',foreign:'destination_id',nested:'experience_destinations',object:'destination'},{name:'theme_ids',label:'Travel themes',source:'themes',join:'experience_themes',local:'experience_id',foreign:'theme_id',nested:'experience_themes',object:'theme'}]},
  accommodations:{label:'Stays',repository:new AccommodationRepository(),title:'name',image:'hero_image_url',alt:'image_alt',folder:'accommodations',fields:['name','slug','destination_id','property_type','star_rating','short_description','full_description','hero_image_url','image_alt','address','price_range','amenities','phone','email','website','verified','featured','status','active']},
  vehicles:{label:'Vehicles',repository:new VehicleRepository(),title:'listing_title',image:'hero_image_url',alt:'image_alt',folder:'vehicles',fields:['listing_title','slug','vehicle_type','vehicle_model','hero_image_url','image_alt','passenger_capacity','luggage_capacity','air_conditioned','driver_included','nationwide','price_guide','phone','email','verified','featured','status','active']},
  guides:{label:'Local Guides',repository:new GuideRepository(),title:'name',image:'profile_image_url',alt:'image_alt',folder:'guides',fields:['name','slug','profile_image_url','image_alt','short_bio','full_bio','languages','years_experience','specialities','licence_number','phone','email','verified','featured','status','active'],relations:[{name:'destination_ids',label:'Destinations',source:'destinations',join:'guide_destinations',local:'guide_id',foreign:'destination_id',nested:'guide_destinations',object:'destination'},{name:'theme_ids',label:'Travel themes',source:'themes',join:'guide_themes',local:'guide_id',foreign:'theme_id',nested:'guide_themes',object:'theme'},{name:'experience_ids',label:'Experiences',source:'experiences',join:'guide_experiences',local:'guide_id',foreign:'experience_id',nested:'guide_experiences',object:'experience'}]},
  partner_applications:{label:'Partner Applications',repository:new PartnerApplicationRepository(),title:'business_name',image:null,folder:'partners',fields:['application_type','business_name','applicant_name','email','phone','status','admin_notes']}
};
const booleanFields=new Set(['active','coming_soon','featured','verified','family_friendly','suitable_for_children','private_option','air_conditioned','driver_included','nationwide']);
const numberFields=new Set(['display_order','star_rating','latitude','longitude','passenger_capacity','years_experience']);
const jsonFields=new Set(['amenities','languages','specialities']);
let activeType='themes',editing=null,profile=null;
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
  $('#adminNav').innerHTML=Object.entries(contentTypes).map(([key,type])=>`<button type="button" class="${key===activeType?'active':''}" data-admin-type="${key}">${type.label}</button>`).join('');
}
async function loadList(){
  const type=contentTypes[activeType];
  $('#adminTitle').textContent=type.label;$('#adminMessage').textContent='Loading…';
  try{
    let sort=$('#adminSort').value;
    if(sort==='name')sort=type.title;
    if(sort==='display_order'&&!type.fields.includes('display_order'))sort='updated_at';
    const rows=await type.repository.listAdmin({search:$('#adminSearch').value,status:$('#adminStatusFilter').value,sort});
    $('#adminMessage').textContent=`${rows.length} records`;
    $('#adminList').innerHTML=rows.map(row=>`<article class="admin-content-row">
      ${type.image?`<img src="${escape(row[type.image])}" alt="${escape(row[type.alt])}">`:''}
      <div><span class="market-tag">${escape(row.status||'record')}</span><h3>${escape(row[type.title]||row.applicant_name||'Untitled')}</h3><p>${escape(row.short_description||row.short_bio||row.email||'')}</p></div>
      <div class="admin-row-actions">${activeType==='partner_applications'?`
        <button data-admin-action="edit" data-id="${row.id}">Review</button>
        <button data-admin-action="approve" data-id="${row.id}">Approve</button>
        ${profile.role==='admin'&&row.status==='approved'?`<button data-admin-action="convert" data-id="${row.id}">Convert to draft</button>`:''}
        <button data-admin-action="needs_changes" data-id="${row.id}">Needs changes</button>
        <button data-admin-action="reject" data-id="${row.id}">Reject</button>
        ${profile.role==='admin'?`<button class="danger" data-admin-action="delete" data-id="${row.id}">Delete</button>`:''}
      `:`
        <button data-admin-action="preview" data-id="${row.id}">Preview</button>
        <button data-admin-action="edit" data-id="${row.id}">Edit</button>
        ${row.status==='published'?`<button data-admin-action="unpublish" data-id="${row.id}">Unpublish</button>`:`<button data-admin-action="publish" data-id="${row.id}">Publish</button>`}
        <button data-admin-action="duplicate" data-id="${row.id}">Duplicate</button>
        ${profile.role==='admin'?`<button class="danger" data-admin-action="delete" data-id="${row.id}">Delete</button>`:''}
      `}</div>
    </article>`).join('')||'<div class="destination-empty">No matching records.</div>';
  }catch(error){$('#adminMessage').textContent=error.message;}
}
function fieldControl(name,value){
  const label=name.replaceAll('_',' ');
  if(booleanFields.has(name))return `<label class="admin-check"><input name="${name}" type="checkbox" ${value?'checked':''}> ${label}</label>`;
  if(name==='status'&&activeType==='partner_applications')return `<label>${label}<select name="${name}">${['pending','approved','rejected','needs_changes'].map(item=>`<option ${value===item?'selected':''}>${item}</option>`).join('')}</select></label>`;
  if(name==='status')return `<label>${label}<select name="${name}"><option>draft</option><option ${value==='published'?'selected':''}>published</option><option ${value==='archived'?'selected':''}>archived</option></select></label>`;
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
  $('#adminEditorForm').querySelectorAll('input,textarea,select').forEach(input=>input.addEventListener('input',()=>preview(formRecord(new FormData($('#adminEditorForm'))),type)));
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
    if(record.status==='published'&&type.image&&(!record[type.image]||!record[type.alt]))throw new Error('Image URL and image alt text are required before publishing.');
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
    $('#adminEditor').close();await loadList();
  }catch(error){$('#imageWarning').textContent=error.message;}
}

if(await protect()){
  $('#adminLoading').hidden=true;$('#adminApp').hidden=false;renderNav();await loadList();
  $('#adminNav').addEventListener('click',event=>{const button=event.target.closest('[data-admin-type]');if(!button)return;activeType=button.dataset.adminType;$('#adminAdd').hidden=activeType==='partner_applications';$('#adminStatusFilter').value='';renderNav();loadList();});
  $('#adminAdd').addEventListener('click',()=>openEditor({status:'draft',active:true}));
  $('#adminSearch').addEventListener('input',loadList);$('#adminStatusFilter').addEventListener('change',loadList);$('#adminSort').addEventListener('change',loadList);
  $('#adminSignOut').addEventListener('click',async()=>{await supabase.auth.signOut();location.replace('/admin/login/');});
  $('#adminList').addEventListener('click',async event=>{
    const button=event.target.closest('[data-admin-action]');if(!button)return;
    const repository=contentTypes[activeType].repository,record=await repository.find(button.dataset.id),action=button.dataset.adminAction;
    if(action==='edit'||action==='preview'){await openEditor(record);if(action==='preview'){$('#adminEditorForm').querySelectorAll('input,textarea,select').forEach(input=>input.disabled=true);$('#editorSave').hidden=true;}return;}
    if(action==='publish')await repository.publish(record.id);
    if(action==='unpublish')await repository.unpublish(record.id);
    if(action==='approve')await repository.update(record.id,{status:'approved'});
    if(action==='needs_changes')await repository.update(record.id,{status:'needs_changes'});
    if(action==='reject')await repository.update(record.id,{status:'rejected'});
    if(action==='convert')await convertPartner(record);
    if(action==='duplicate')await repository.duplicate(record.id);
    if(action==='delete'&&confirm(`Delete ${record[contentTypes[activeType].title]||'this record'}?`))await repository.delete(record.id);
    await loadList();
  });
  $('#adminEditorForm').addEventListener('submit',saveEditor);
}
