import './supabase-client.js';
import './repositories.js';

const scripts=['backend','services','state','experience-renderer','marketplace','ui','builder','app'];
const load=name=>new Promise((resolve,reject)=>{
  const script=document.createElement('script');
  script.src=`/js/${name}.js`;
  script.onload=resolve;
  script.onerror=()=>reject(new Error(`Unable to load ${name}`));
  document.body.append(script);
});

for(const script of scripts)await load(script);
