import assert from "node:assert/strict";
import {access,readFile} from "node:fs/promises";
import path from "node:path";

const root=path.resolve(import.meta.dirname,"..");
const read=file=>readFile(path.join(root,file),"utf8");
const required=[
  "app/layout.tsx","app/page.tsx","app/globals.css","app/journey-builder/page.tsx",
  "app/destinations/[slug]/page.tsx","app/experiences/[slug]/page.tsx",
  "app/admin/dashboard/page.tsx","lib/data.ts","lib/supabase/server.ts",
  "features/journey/journey-builder.tsx","components/site/gallery-carousel.tsx",
  "supabase/migrations/202607260003_full_cms.sql"
];
await Promise.all(required.map(file=>access(path.join(root,file))));
const packageJson=JSON.parse(await read("package.json"));
for(const dependency of ["next","react","motion","react-hook-form","zod","lucide-react","embla-carousel-react","@supabase/supabase-js"]){
  assert(packageJson.dependencies[dependency],`missing ${dependency}`);
}
const layout=await read("app/layout.tsx");
assert.match(layout,/Playfair_Display/);
assert.match(layout,/openGraph/);
assert.match(layout,/\/og\.png/);
const data=await read("lib/data.ts");
assert.match(data,/status","published"/);
assert.match(data,/active",true/);
const env=await read(".env.example");
assert.match(env,/NEXT_PUBLIC_SUPABASE_URL/);
assert.doesNotMatch(env,/fstpfqlgypvktjwdeagu|sb_secret_|sb_publishable_/);
const clientSources=await Promise.all(["lib/supabase/client.ts","features/contact/contact-form.tsx","features/admin/login-form.tsx"].map(read));
assert.doesNotMatch(clientSources.join("\n"),/service.?role|SUPABASE_SERVICE_ROLE_KEY/i);
console.log("Roam Ceylon V2 architecture, routes, dependencies, metadata, and secret boundaries validated.");
