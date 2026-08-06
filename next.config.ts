import type {NextConfig} from "next";

const nextConfig:NextConfig={
  images:{
    remotePatterns:[
      {protocol:"https",hostname:"images.pexels.com"},
      {protocol:"https",hostname:"images.unsplash.com"},
      {protocol:"https",hostname:"upload.wikimedia.org"},
      {protocol:"https",hostname:"sitecore-cd.shangri-la.com"},
      {protocol:"https",hostname:"fstpfqlgypvktjwdeagu.supabase.co"}
    ]
  }
};

export default nextConfig;
