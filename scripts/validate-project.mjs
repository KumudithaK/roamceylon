import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const read=relative=>readFile(path.join(root,relative),'utf8');
const migration=await read('supabase/migrations/202607260001_content_marketplace.sql');
const envExample=await read('.env.example');
const index=await read('index.html');
const services=await read('js/services.js');
const repository=await read('js/repositories.js');
const backend=await read('js/backend.js');
const importer=await read('scripts/import-json-to-supabase.mjs');

for(const table of ['profiles','themes','destinations','theme_destinations','experiences','experience_destinations','experience_themes','accommodations','vehicles','guides','guide_destinations','guide_themes','guide_experiences','partner_applications']){
  assert.match(migration,new RegExp(`create table public\\.${table}\\b`),`missing ${table} table`);
}
for(const repositoryName of ['ThemeRepository','DestinationRepository','ExperienceRepository','AccommodationRepository','VehicleRepository','GuideRepository','PartnerApplicationRepository']){
  assert.match(repository,new RegExp(`class ${repositoryName}\\b`),`missing ${repositoryName}`);
}
assert.match(migration,/status=''published'' and active/,'public content must be published and active');
assert.match(migration,/partner_public_insert[\s\S]*status='pending'/,'partner inserts must be pending');
assert.match(migration,/travel-content/,'storage bucket is missing');
assert.match(migration,/profiles_admin_all/,'admin profile policy is missing');
assert.match(index,/type="module" src="\/js\/bootstrap\.js"/,'module bootstrap is missing');
assert.doesNotMatch(services,/data\/(themes|destinations|experiences|accommodations|vehicles|guides)\.json/,'public content still reads JSON');
assert.match(importer,/--confirm-import/,'import guard is missing');
assert.doesNotMatch(envExample,/fstpfqlgypvktjwdeagu|eyJ[A-Za-z0-9_-]+/,'env example must contain placeholders only');
assert.doesNotMatch(`${index}\n${repository}\n${backend}`,/service.?role|SUPABASE_SERVICE_ROLE_KEY/i,'service role reference found in frontend code');

const frontendFiles=(await readdir(path.join(root,'js'))).filter(file=>file.endsWith('.js'));
for(const file of frontendFiles){
  const source=await read(`js/${file}`);
  assert.doesNotMatch(source,/from the official Sri Lanka destination guide/i,`${file} contains generated copy`);
  assert.doesNotMatch(source,/Season Depend(?:ant|ent)/i,`${file} contains false seasonal metadata`);
}

console.log('Project structure, repository boundaries, migration policies, and secret separation validated.');
