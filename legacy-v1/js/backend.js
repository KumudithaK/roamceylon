(function createBackend(global){
  const client=global.roamSupabase;
  const requireClient=()=>{
    if(!client)throw new Error('Supabase is not configured.');
    return client;
  };
  global.RoamBackend={
    enabled:Boolean(client),
    async submitEnquiry(payload){
      const {error}=await requireClient().from('enquiries').insert(payload);
      if(error)throw error;
    },
    async submitPartnerApplication(payload){
      return new PartnerApplicationRepository().submit(payload);
    },
    async signIn(email,password){
      const {data,error}=await requireClient().auth.signInWithPassword({email,password});
      if(error)throw error;
      return data.session;
    },
    async signOut(){
      const {error}=await requireClient().auth.signOut();
      if(error)throw error;
    },
    async getSession(){
      const {data,error}=await requireClient().auth.getSession();
      if(error)throw error;
      return data.session;
    },
    async getProfile(){
      const {data:{user},error:userError}=await requireClient().auth.getUser();
      if(userError)throw userError;
      if(!user)return null;
      const {data,error}=await requireClient().from('profiles').select('*').eq('id',user.id).single();
      if(error)throw error;
      return data;
    },
    async listEnquiries(){
      const {data,error}=await requireClient().from('enquiries').select('*').order('created_at',{ascending:false});
      if(error)throw error;
      return data;
    }
  };
})(window);
