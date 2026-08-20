import {randomUUID} from "node:crypto";
import {createClient} from "@supabase/supabase-js";

const ISOLATED_REF="xnsxmwgyugoqanuoyebh";
const PRODUCTION_REF="fstpfqlgypvktjwdeagu";
const roles=["journey_designer","partner_manager","finance","operations","content_marketing","super_admin"];
const buckets=[
  {id:"travel-content",mime:"image/jpeg",bytes:new Uint8Array([0xff,0xd8,0xff,0xd9])},
  {id:"partner-application-media",mime:"image/jpeg",bytes:new Uint8Array([0xff,0xd8,0xff,0xd9])},
  {id:"partner-application-documents",mime:"application/pdf",bytes:new TextEncoder().encode("%PDF-1.4\n% synthetic authorization fixture\n%%EOF")},
  {id:"accounting-receipts",mime:"application/pdf",bytes:new TextEncoder().encode("%PDF-1.4\n% synthetic authorization fixture\n%%EOF")}
];
const url=process.env.AUTHZ_TEST_SUPABASE_URL??"";
const key=process.env.AUTHZ_TEST_SUPABASE_PUBLISHABLE_KEY??"";
const serviceKey=process.env.AUTHZ_TEST_SUPABASE_SERVICE_ROLE_KEY??"";
const projectRef=process.env.AUTHZ_TEST_PROJECT_REF??"";
const pathSafetyOnly=process.env.AUTHZ_TEST_STORAGE_SCOPE==="path-safety";
const block=message=>{console.error(`[BLOCKED] ${message}`);process.exit(2)};
if(projectRef!==ISOLATED_REF||url!==`https://${ISOLATED_REF}.supabase.co`)block("isolated target did not match the approved project");
if(projectRef===PRODUCTION_REF||url.includes(PRODUCTION_REF))block("production is explicitly rejected");
if(process.env.AUTHZ_TEST_ISOLATED_PROJECT!=="true")block("isolated flag is not true");
if(!key||!serviceKey)block("isolated API keys are not configured");

const makeClient=secret=>createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
const admin=makeClient(serviceKey);
const clients={anonymous:makeClient(key)};
for(const role of roles){
  const prefix=`AUTHZ_TEST_${role.toUpperCase()}`;
  const email=process.env[`${prefix}_EMAIL`];
  const password=process.env[`${prefix}_PASSWORD`];
  if(!email?.endsWith("@roamceylon.test")||!password)block(`${role} is not a verified synthetic identity`);
  const client=makeClient(key);
  const {error}=await client.auth.signInWithPassword({email,password});
  if(error)block(`${role} synthetic sign-in failed`);
  clients[role]=client;
}

const runId=randomUUID();
const seeded=[];
const results=[];
let cleanupPassed=true;
const expected=(bucket,role,action)=>{
  if(bucket==="travel-content")return action==="READ"||["content_marketing","super_admin"].includes(role)?"ALLOW":"DENY";
  if(["partner-application-media","partner-application-documents"].includes(bucket)){
    if(action==="READ")return ["journey_designer","partner_manager","finance","operations","super_admin"].includes(role)?"ALLOW":"DENY";
    return ["partner_manager","super_admin"].includes(role)?"ALLOW":"DENY";
  }
  if(bucket==="accounting-receipts")return ["finance","super_admin"].includes(role)?"ALLOW":"DENY";
  return "DENY";
};
const addResult=(bucket,role,action,actual,detail)=>{
  const target=action==="PATH_SAFETY"?"SAFE":action==="CROSS_BUCKET_PATH_WRITE"?"DENY":expected(bucket,role,action);
  results.push({bucket,role,action,actual,target,targetVerdict:actual===target?"PASS":"FAIL",detail});
};
try{
  for(const bucket of buckets){
    if(!pathSafetyOnly){
      const fixturePath=`authorization-baseline/read/${runId}.${bucket.mime==="application/pdf"?"pdf":"jpg"}`;
      const {error:seedError}=await admin.storage.from(bucket.id).upload(fixturePath,bucket.bytes,{contentType:bucket.mime,upsert:false});
      if(seedError)block(`could not create the synthetic read fixture in ${bucket.id}`);
      seeded.push({bucket:bucket.id,path:fixturePath});

      for(const [role,client] of Object.entries(clients)){
        const {error:readError}=await client.storage.from(bucket.id).download(fixturePath);
        addResult(bucket.id,role,"READ",readError?"DENY":"ALLOW",readError?`storage_error:${readError.statusCode??"unknown"}`:"synthetic_object_read");

        const writePath=`authorization-baseline/write/${role}/${randomUUID()}.${bucket.mime==="application/pdf"?"pdf":"jpg"}`;
        const {error:writeError}=await client.storage.from(bucket.id).upload(writePath,bucket.bytes,{contentType:bucket.mime,upsert:false});
        addResult(bucket.id,role,"WRITE",writeError?"DENY":"ALLOW",writeError?`storage_error:${writeError.statusCode??"unknown"}`:"synthetic_object_created");
        if(!writeError){
          const {error:removeError}=await client.storage.from(bucket.id).remove([writePath]);
          if(removeError){
            const {error:adminRemoveError}=await admin.storage.from(bucket.id).remove([writePath]);
            if(adminRemoveError)cleanupPassed=false;
          }
        }
      }
    }

    const pathRole=bucket.id==="travel-content"?"content_marketing":bucket.id==="accounting-receipts"?"finance":"partner_manager";
    const unsafePath=`authorization-baseline/../phase4-escape-${randomUUID()}.${bucket.mime==="application/pdf"?"pdf":"jpg"}`;
    const {data:unsafeData,error:unsafeError}=await clients[pathRole].storage.from(bucket.id).upload(unsafePath,bucket.bytes,{contentType:bucket.mime,upsert:false});
    // storage-js returns `path` as the caller's cleaned input, while `fullPath`
    // is the server-returned data.Key. URL routing legitimately normalizes the
    // former before PostgreSQL/RLS sees the object; only fullPath is evidence of
    // the persisted bucket/key.
    const storedFullPath=unsafeData?.fullPath??"";
    const retainedTraversal=storedFullPath.split("/").includes("..");
    const remainsInBucket=storedFullPath.startsWith(`${bucket.id}/`);
    addResult(bucket.id,pathRole,"PATH_SAFETY",unsafeError||(!retainedTraversal&&remainsInBucket)?"SAFE":"UNSAFE",unsafeError?`storage_rejected:${unsafeError.statusCode??"unknown"}`:"server_full_path_is_bucket_contained");
    if(!unsafeError){
      const storedRelativePath=storedFullPath.startsWith(`${bucket.id}/`)?storedFullPath.slice(bucket.id.length+1):"";
      const {error:unsafeRemoveError}=storedRelativePath?await admin.storage.from(bucket.id).remove([storedRelativePath]):{error:new Error("Stored key was not bucket-contained")};
      if(unsafeRemoveError)cleanupPassed=false;
    }

    // A routing-normalized `..` could name another bucket in the HTTP path. The
    // target bucket's own capability policy must still be evaluated and deny it.
    const targetBucket=bucket.id==="accounting-receipts"?"partner-application-documents":"accounting-receipts";
    const crossBucketPath=`../${targetBucket}/phase4-cross-bucket-${randomUUID()}.${bucket.mime==="application/pdf"?"pdf":"jpg"}`;
    const {data:crossData,error:crossError}=await clients[pathRole].storage.from(bucket.id).upload(crossBucketPath,bucket.bytes,{contentType:bucket.mime,upsert:false});
    addResult(bucket.id,pathRole,"CROSS_BUCKET_PATH_WRITE",crossError?"DENY":"ALLOW","cross_bucket_capability_rechecked");
    if(!crossError){
      const fullPath=crossData?.fullPath??"";
      const relative=fullPath.startsWith(`${targetBucket}/`)?fullPath.slice(targetBucket.length+1):"";
      if(relative){
        const {error:removeError}=await admin.storage.from(targetBucket).remove([relative]);
        if(removeError)cleanupPassed=false;
      }else cleanupPassed=false;
    }
  }
}finally{
  for(const item of seeded){
    const {error}=await admin.storage.from(item.bucket).remove([item.path]);
    if(error)cleanupPassed=false;
  }
}

console.log(JSON.stringify({projectRef,syntheticOnly:true,scope:pathSafetyOnly?"path-safety":"all",results,cleanup:{syntheticObjectsRemoved:cleanupPassed}},null,2));
if(!cleanupPassed)process.exitCode=2;
else if(results.some(result=>result.targetVerdict==="FAIL"))process.exitCode=1;
