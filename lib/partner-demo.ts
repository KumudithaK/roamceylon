/** Server-only configuration: never enable this with a public query parameter. */
type DemoEnvironment={
  CEYLON_PARTNER_DEMO_HERO?:string;
  CEYLON_DEMO_SCOPE?:string;
  VERCEL?:string;
  VERCEL_ENV?:string;
  VERCEL_GIT_COMMIT_REF?:string;
  NEXT_PUBLIC_SUPABASE_URL?:string;
  NODE_ENV?:string;
};

export const partnerDemoVideoId="OkLsh-4NokU";

/** Published hero records may legitimately have no poster configured. */
export function partnerDemoPosterUrl(poster:string|null|undefined,fallback:string){
  return poster?.trim()||fallback||"/og.png";
}

export function isPartnerDemoEnabled(env:DemoEnvironment){
  if(env.CEYLON_PARTNER_DEMO_HERO!=="1"||env.CEYLON_DEMO_SCOPE!=="commercial-readiness-staging")return false;
  if(env.VERCEL_ENV==="production")return false;
  if(env.VERCEL_ENV==="preview")return env.VERCEL_GIT_COMMIT_REF==="commercial-readiness/staging"&&env.NEXT_PUBLIC_SUPABASE_URL==="https://hvcggnuptrcsxtrcjnre.supabase.co";
  return !env.VERCEL&&!env.VERCEL_ENV&&env.NODE_ENV==="development";
}

export function partnerDemoEmbedUrl(videoId:string,origin:string){
  const url=new URL(`https://www.youtube-nocookie.com/embed/${videoId}`);
  url.search=new URLSearchParams({autoplay:"1",mute:"1",controls:"0",loop:"1",playlist:videoId,playsinline:"1",enablejsapi:"1",origin,disablekb:"1",fs:"0",rel:"0"}).toString();
  return url.toString();
}
