import {supabase,isSupabaseConfigured} from './supabase-client.js';

const form=document.getElementById('adminLogin');
const message=document.getElementById('loginMessage');
if(!isSupabaseConfigured){
  form.hidden=true;
  message.textContent='Supabase environment variables are not configured.';
}else{
  const {data:{session}}=await supabase.auth.getSession();
  if(session)location.replace('/admin/');
}
form.addEventListener('submit',async event=>{
  event.preventDefault();
  message.textContent='Signing in…';
  const {error}=await supabase.auth.signInWithPassword({
    email:document.getElementById('adminEmail').value,
    password:document.getElementById('adminPassword').value
  });
  if(error){message.textContent=error.message;return;}
  location.replace('/admin/');
});
