(function createBackend(global){
  const config = global.ROAM_CONFIG || {};
  const enabled = Boolean(config.supabaseUrl && config.supabaseAnonKey);
  const headers = {apikey:config.supabaseAnonKey || '', Authorization:`Bearer ${config.supabaseAnonKey || ''}`, 'Content-Type':'application/json'};
  async function request(path, options = {}){
    if(!enabled) return {offline:true};
    const response = await fetch(`${config.supabaseUrl}${path}`, {...options, headers:{...headers, ...options.headers}});
    if(!response.ok) throw new Error(`Backend request failed (${response.status})`);
    if(response.status === 204) return null;
    return response.json();
  }
  global.RoamBackend = {
    enabled,
    submitEnquiry(payload){return request('/rest/v1/enquiries',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify(payload)});},
    signIn(email,password){return request('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email,password})});},
    listEnquiries(accessToken){return request('/rest/v1/enquiries?select=*&order=created_at.desc',{headers:{Authorization:`Bearer ${accessToken}`}});}
  };
})(window);
