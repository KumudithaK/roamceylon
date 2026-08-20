\pset tuples_only on
\pset format unaligned

with inventory as (
  select n.nspname||'.'||c.relname||'|'||c.relkind::text||'|'||c.relrowsecurity||'|'||c.relforcerowsecurity as value
  from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname in ('public','private') and c.relkind in ('r','p','v','m','S')
)
select 'relations|'||count(*)||'|'||md5(coalesce(string_agg(value,E'\n' order by value),'')) from inventory;

with inventory as (
  select n.nspname||'.'||c.relname||'|'||a.attnum||'|'||a.attname||'|'||
    format_type(a.atttypid,a.atttypmod)||'|'||a.attnotnull||'|'||a.attidentity::text||'|'||a.attgenerated::text||'|'||
    coalesce(pg_get_expr(d.adbin,d.adrelid),'') as value
  from pg_attribute a
  join pg_class c on c.oid=a.attrelid
  join pg_namespace n on n.oid=c.relnamespace
  left join pg_attrdef d on d.adrelid=a.attrelid and d.adnum=a.attnum
  where n.nspname in ('public','private') and c.relkind in ('r','p','v','m') and a.attnum>0 and not a.attisdropped
)
select 'columns|'||count(*)||'|'||md5(coalesce(string_agg(value,E'\n' order by value),'')) from inventory;

with inventory as (
  select n.nspname||'.'||c.relname||'|'||con.conname||'|'||con.contype::text||'|'||
    con.convalidated||'|'||pg_get_constraintdef(con.oid,true) as value
  from pg_constraint con
  join pg_class c on c.oid=con.conrelid
  join pg_namespace n on n.oid=c.relnamespace
  where n.nspname in ('public','private')
)
select 'constraints|'||count(*)||'|'||md5(coalesce(string_agg(value,E'\n' order by value),'')) from inventory;

with inventory as (
  select schemaname||'.'||tablename||'|'||indexname||'|'||indexdef as value
  from pg_indexes where schemaname in ('public','private')
)
select 'indexes|'||count(*)||'|'||md5(coalesce(string_agg(value,E'\n' order by value),'')) from inventory;

with inventory as (
  select n.nspname||'.'||p.proname||'('||pg_get_function_identity_arguments(p.oid)||')|'||
    p.prokind::text||'|'||p.prosecdef||'|'||p.provolatile::text||'|'||md5(pg_get_functiondef(p.oid)) as value
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname in ('public','private')
)
select 'functions|'||count(*)||'|'||md5(coalesce(string_agg(value,E'\n' order by value),'')) from inventory;

with inventory as (
  select n.nspname||'.'||c.relname||'|'||t.tgname||'|'||pg_get_triggerdef(t.oid,true) as value
  from pg_trigger t
  join pg_class c on c.oid=t.tgrelid
  join pg_namespace n on n.oid=c.relnamespace
  where n.nspname in ('public','private') and not t.tgisinternal
)
select 'triggers|'||count(*)||'|'||md5(coalesce(string_agg(value,E'\n' order by value),'')) from inventory;

with inventory as (
  select schemaname||'.'||tablename||'|'||policyname||'|'||permissive||'|'||roles::text||'|'||cmd||'|'||
    coalesce(qual,'')||'|'||coalesce(with_check,'') as value
  from pg_policies where schemaname in ('public','private','storage')
)
select 'policies|'||count(*)||'|'||md5(coalesce(string_agg(value,E'\n' order by value),'')) from inventory;

with enum_inventory as (
  select n.nspname,t.typname,e.enumlabel,
    row_number() over(partition by t.oid order by e.enumsortorder) as logical_position
  from pg_type t join pg_namespace n on n.oid=t.typnamespace join pg_enum e on e.enumtypid=t.oid
  where n.nspname='public'
), inventory as (
  select nspname||'.'||typname||'|'||logical_position::text||'|'||enumlabel as value
  from enum_inventory
)
select 'enums|'||count(*)||'|'||md5(coalesce(string_agg(value,E'\n' order by value),'')) from inventory;

with inventory as (
  select c.relname||'|'||coalesce(r.rolname,'PUBLIC')||'|'||x.privilege_type||'|'||x.is_grantable as value
  from pg_class c
  join pg_namespace n on n.oid=c.relnamespace
  cross join lateral aclexplode(c.relacl) x
  left join pg_roles r on r.oid=x.grantee
  where n.nspname in ('public','private')
)
select 'relation_grants|'||count(*)||'|'||md5(coalesce(string_agg(value,E'\n' order by value),'')) from inventory;

with inventory as (
  select id||'|'||public||'|'||coalesce(file_size_limit::text,'')||'|'||coalesce(allowed_mime_types::text,'') as value
  from storage.buckets where id in ('travel-content','partner-application-media','partner-application-documents','accounting-receipts')
)
select 'storage_buckets|'||count(*)||'|'||md5(coalesce(string_agg(value,E'\n' order by value),'')) from inventory;

with inventory as (
  select code||'|'||name||'|'||coalesce(description,'') as value from public.staff_roles
  union all
  select code||'|'||description from public.permissions
  union all
  select role_code||'|'||permission_code from public.staff_role_permissions
)
select 'staff_capabilities|'||count(*)||'|'||md5(coalesce(string_agg(value,E'\n' order by value),'')) from inventory;
