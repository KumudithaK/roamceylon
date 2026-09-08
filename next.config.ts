import type {NextConfig} from "next";

const production=process.env.NODE_ENV==="production";
const contentSecurityPolicy=[
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${production?"":" 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "media-src 'self' blob: https:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.met.no",
  "frame-src https://www.youtube-nocookie.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(production?["upgrade-insecure-requests"]:[])
].join("; ");

const securityHeaders=[
  {key:"Content-Security-Policy",value:contentSecurityPolicy},
  {key:"Referrer-Policy",value:"no-referrer"},
  {key:"X-Content-Type-Options",value:"nosniff"},
  {key:"X-Frame-Options",value:"DENY"},
  {key:"Permissions-Policy",value:"camera=(), microphone=(), geolocation=()"},
  {key:"Cross-Origin-Opener-Policy",value:"same-origin"},
  {key:"X-DNS-Prefetch-Control",value:"off"},
  ...(production?[{key:"Strict-Transport-Security",value:"max-age=31536000; includeSubDomains"}]:[])
];

const nextConfig:NextConfig={
  images:{
    remotePatterns:[
      {protocol:"https",hostname:"images.pexels.com"},
      {protocol:"https",hostname:"images.unsplash.com"},
      {protocol:"https",hostname:"upload.wikimedia.org"},
      {protocol:"https",hostname:"sitecore-cd.shangri-la.com"},
      {protocol:"https",hostname:"fstpfqlgypvktjwdeagu.supabase.co"},
      {protocol:"https",hostname:"hvcggnuptrcsxtrcjnre.supabase.co",pathname:"/storage/v1/object/public/**"}
    ]
  },
  async headers(){return [
    {source:"/:path*",headers:securityHeaders},
    {source:"/proposal/:path*",headers:[
      {key:"Cache-Control",value:"private, no-store, max-age=0"},
      {key:"X-Robots-Tag",value:"noindex, nofollow, noarchive"}
    ]},
    {source:"/api/proposals/:path*",headers:[
      {key:"Cache-Control",value:"private, no-store, max-age=0"},
      {key:"X-Robots-Tag",value:"noindex, nofollow, noarchive"}
    ]}
  ]}
};

export default nextConfig;
