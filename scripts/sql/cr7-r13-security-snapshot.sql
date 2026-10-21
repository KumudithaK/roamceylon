-- Canonical server-side digests only: no row values or function source returned.
WITH table_hashes AS (
  SELECT table_key,
    ((xpath('//n/text()',proof))[1]::text)::bigint AS row_count,
    (xpath('//digest/text()',proof))[1]::text AS digest
  FROM (
    SELECT n.nspname||'.'||c.relname AS table_key,
      query_to_xml(format($data$
        SELECT count(*) AS n, md5(coalesce(string_agg(row_hash,'' ORDER BY row_hash),'')) AS digest
        FROM (SELECT md5(to_jsonb(t)::text) AS row_hash FROM %I.%I t) rows
      $data$,n.nspname,c.relname),false,true,'') AS proof
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE c.relkind IN ('r','p') AND (
      n.nspname='public' OR
      n.nspname='auth' AND c.relname IN ('users','identities','sessions','refresh_tokens') OR
      n.nspname='storage' AND c.relname IN ('buckets','objects') OR
      n.nspname='supabase_migrations' AND c.relname='schema_migrations'
    )
  ) inventory
), target_acl AS (
  SELECT c.relname AS table_name,entries.column_name,
    CASE WHEN x.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(x.grantee) END AS grantee,
    pg_get_userbyid(x.grantor) AS grantor,x.privilege_type,x.is_grantable
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  CROSS JOIN LATERAL (
    SELECT NULL::text AS column_name,c.relacl AS acl
    UNION ALL
    SELECT a.attname::text,a.attacl FROM pg_attribute a
    WHERE a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped
  ) entries CROSS JOIN LATERAL aclexplode(entries.acl) x
  WHERE n.nspname='public' AND c.relname IN ('journey_supplier_allocations','journey_supplier_allocation_history')
), catalog_rows AS (
  SELECT 'namespace' AS kind,jsonb_build_array(n.nspname,n.nspowner,n.nspacl)::text AS value
  FROM pg_namespace n WHERE n.nspname IN ('public','private','constraint_guard','auth','storage')
  UNION ALL
  SELECT 'relation',jsonb_build_array(n.nspname,c.relname,c.relkind::text,c.relowner,c.relrowsecurity,c.relforcerowsecurity,c.reloptions,
    CASE WHEN n.nspname='public' AND c.relname IN ('journey_supplier_allocations','journey_supplier_allocation_history') THEN NULL ELSE c.relacl::text END)::text
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname IN ('public','private','constraint_guard','auth','storage') AND c.relkind IN ('r','p','v','m','S')
  UNION ALL
  SELECT 'column',jsonb_build_array(n.nspname,c.relname,a.attnum,a.attname,format_type(a.atttypid,a.atttypmod),a.attnotnull,a.attidentity::text,a.attgenerated::text,
    pg_get_expr(d.adbin,d.adrelid),CASE WHEN n.nspname='public' AND c.relname IN ('journey_supplier_allocations','journey_supplier_allocation_history') THEN NULL ELSE a.attacl::text END)::text
  FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace
  LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
  WHERE n.nspname IN ('public','private','constraint_guard','auth','storage') AND a.attnum>0 AND NOT a.attisdropped
  UNION ALL
  SELECT 'function',jsonb_build_array(n.nspname,p.proname,pg_get_function_identity_arguments(p.oid),p.proowner,p.prosecdef,p.provolatile::text,p.proacl,p.proconfig,md5(pg_get_functiondef(p.oid)))::text
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname IN ('public','private','constraint_guard','auth','storage') AND p.prokind IN ('f','p')
  UNION ALL
  SELECT 'constraint',jsonb_build_array(n.nspname,c.relname,k.conname,k.contype::text,k.convalidated,pg_get_constraintdef(k.oid,true))::text
  FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname IN ('public','private','constraint_guard','auth','storage')
  UNION ALL
  SELECT 'trigger',jsonb_build_array(n.nspname,c.relname,t.tgname,t.tgenabled::text,pg_get_triggerdef(t.oid,true))::text
  FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname IN ('public','private','constraint_guard','auth','storage') AND NOT t.tgisinternal
  UNION ALL
  SELECT 'policy',jsonb_build_array(schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check)::text
  FROM pg_policies WHERE schemaname IN ('public','private','constraint_guard','auth','storage')
  UNION ALL
  SELECT 'index',jsonb_build_array(schemaname,tablename,indexname,indexdef)::text
  FROM pg_indexes WHERE schemaname IN ('public','private','constraint_guard','auth','storage')
  UNION ALL
  SELECT 'view',jsonb_build_array(n.nspname,c.relname,pg_get_viewdef(c.oid,true))::text
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname IN ('public','private','constraint_guard','auth','storage') AND c.relkind IN ('v','m')
  UNION ALL
  SELECT 'default_acl',to_jsonb(d)::text FROM pg_default_acl d
  UNION ALL
  SELECT 'role_membership',to_jsonb(m)::text FROM pg_auth_members m
  UNION ALL
  SELECT 'database_role_settings',to_jsonb(s)::text FROM pg_db_role_setting s
), catalog_hashes AS (
  SELECT kind,count(*) AS object_count,md5(coalesce(string_agg(value,E'\n' ORDER BY value),'')) AS digest
  FROM catalog_rows GROUP BY kind
)
SELECT jsonb_build_object(
  'rows',(SELECT jsonb_object_agg(table_key,jsonb_build_object('count',row_count,'digest',digest) ORDER BY table_key) FROM table_hashes),
  'catalog',(SELECT jsonb_object_agg(kind,jsonb_build_object('count',object_count,'digest',digest) ORDER BY kind) FROM catalog_hashes),
  'target_acl',(SELECT coalesce(jsonb_agg(to_jsonb(a) ORDER BY table_name,column_name NULLS FIRST,grantee,grantor,privilege_type,is_grantable),'[]'::jsonb) FROM target_acl a),
  'migrations',(SELECT jsonb_build_object('count',count(*),'latest',max(version),'candidates',count(*) FILTER(WHERE version IN ('202610150001','202610150002'))) FROM supabase_migrations.schema_migrations),
  'sequence',(SELECT jsonb_build_object('last_value',last_value,'is_called',is_called) FROM public.journey_account_number_seq),
  'pricing_nulls',(SELECT count(*) FROM public.tour_pricing_config c CROSS JOIN unnest(ARRAY[
    'driver_salary_per_day','fuel_price_per_litre','vehicle_km_per_litre','tolls_per_journey','parking_per_day','guide_accommodation_per_night','airport_transfer_each_way',
    'administration_fixed','administration_percent','contingency_percent','service_fee_fixed','service_fee_percent','target_profit_margin_percent'
  ]) field WHERE to_jsonb(c)->field='null'::jsonb),
  'super_admin_assignments',(SELECT count(*) FROM public.profile_staff_roles WHERE role_code='super_admin'),
  'cleanup_hooks',jsonb_build_array(
    nullif(current_setting('roam.phase8_cleanup',true),''),
    nullif(current_setting('roam.financial_command',true),''),
    nullif(current_setting('roam.allocation_command',true),''),
    nullif(current_setting('roam.phase10_cleanup',true),'')
  )
) AS snapshot;
