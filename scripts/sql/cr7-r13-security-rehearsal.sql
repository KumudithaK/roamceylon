-- Staging hvcggnuptrcsxtrcjnre ONLY. No business DML or command invocation.
BEGIN;
SET LOCAL lock_timeout='3s';
SET LOCAL statement_timeout='30s';
SET LOCAL idle_in_transaction_session_timeout='30s';
CREATE TEMP TABLE r13_security_baseline ON COMMIT DROP AS
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
DO $preflight$
DECLARE s jsonb;
BEGIN
  SELECT snapshot INTO s FROM pg_temp.r13_security_baseline;
  IF s->'migrations'<> '{"count":88,"latest":"202610090001","candidates":0}'::jsonb THEN RAISE EXCEPTION 'Unexpected migration baseline'; END IF;
  IF (s#>>'{sequence,last_value}')::bigint<>2 OR (s->>'pricing_nulls')::int<>13 THEN RAISE EXCEPTION 'Unexpected sequence/pricing baseline'; END IF;
  IF (s#>>'{rows,auth.users,count}')::int<>1 OR (s->>'super_admin_assignments')::int<>1 OR (s#>>'{rows,storage.buckets,count}')::int<>4 OR (s#>>'{rows,storage.objects,count}')::int<>4 THEN RAISE EXCEPTION 'Unexpected Auth/Storage baseline'; END IF;
  IF (s#>>'{rows,public.accommodations,count}')::int<>10 OR (s#>>'{rows,public.guides,count}')::int<>6 OR (s#>>'{rows,public.vehicles,count}')::int<>10 OR (s#>>'{rows,public.pricing_plans,count}')::int<>0 THEN RAISE EXCEPTION 'Unexpected supplier baseline'; END IF;
  IF (s#>>'{rows,public.enquiries,count}')::int<>0 OR (s#>>'{rows,public.journey_supplier_allocations,count}')::int<>0 THEN RAISE EXCEPTION 'Unexpected business rows'; END IF;
  IF s->'cleanup_hooks'<>'[null,null,null,null]'::jsonb THEN RAISE EXCEPTION 'Cleanup hook active'; END IF;
  IF (SELECT count(*) FROM pg_trigger WHERE tgname IN ('curated_journeys_guard_accepted_itinerary','journey_allocations_guard_accepted_insert','journey_proposals_guard_accepted_insert') AND tgenabled<>'D')<>3 THEN RAISE EXCEPTION 'Accepted-design guards missing'; END IF;
  IF (SELECT count(*) FROM pg_constraint WHERE conname IN ('enquiries_estimate_snapshot_cent_precision','allocations_rate_snapshot_cent_precision','proposals_financial_snapshots_cent_precision','accounts_quote_snapshot_cent_precision') AND convalidated)<>4 THEN RAISE EXCEPTION 'Finance snapshot constraints missing'; END IF;
  IF constraint_guard.finance_snapshot_cent_precise('{"total":1.23}'::jsonb) IS NOT TRUE OR constraint_guard.finance_snapshot_cent_precise('{"total":1.234}'::jsonb) IS NOT FALSE THEN RAISE EXCEPTION 'Finance precision validation differs'; END IF;
  IF NOT has_table_privilege('authenticated','public.journey_supplier_allocations','SELECT') OR NOT has_table_privilege('authenticated','public.journey_supplier_allocation_history','SELECT') THEN RAISE EXCEPTION 'Expected pre-remediation read grants differ'; END IF;
END $preflight$;

-- Exact unchanged candidate starts here.
-- CR7-R13: allocation rows and their cost-bearing audit snapshots are read
-- through existing capability-authorized server handlers / safe audit index.
-- Browser callers do not need direct base-table SELECT. Preserve service_role,
-- existing RLS, command EXECUTE grants, triggers and all financial guards.
-- Deliberately separate from the unapplied account-date migration.
REVOKE SELECT ON TABLE public.journey_supplier_allocations,
  public.journey_supplier_allocation_history FROM PUBLIC, anon, authenticated;
-- Exact unchanged candidate ends here.

DO $grants$
DECLARE role_name text; relation_name text; command_name text;
BEGIN
  FOREACH role_name IN ARRAY ARRAY['anon','authenticated'] LOOP
    FOREACH relation_name IN ARRAY ARRAY['journey_supplier_allocations','journey_supplier_allocation_history'] LOOP
      IF has_table_privilege(role_name,'public.'||relation_name,'SELECT')
        OR has_any_column_privilege(role_name,'public.'||relation_name,'SELECT') THEN
        RAISE EXCEPTION 'Direct or column SELECT remains for % on %',role_name,relation_name;
      END IF;
    END LOOP;
    IF has_schema_privilege(role_name,'private','USAGE') THEN RAISE EXCEPTION 'Unexpected private schema privilege'; END IF;
  END LOOP;
  IF NOT has_table_privilege('service_role','public.journey_supplier_allocations','SELECT')
    OR NOT has_table_privilege('service_role','public.journey_supplier_allocation_history','SELECT') THEN RAISE EXCEPTION 'Trusted server reads lost'; END IF;
  IF has_schema_privilege('service_role','private','USAGE') THEN RAISE EXCEPTION 'Unexpected broad service private access'; END IF;
  FOREACH command_name IN ARRAY ARRAY[
    'public.save_supplier_allocations_command(uuid,uuid,jsonb,uuid,text)',
    'public.transition_supplier_allocation_command(uuid,text,uuid,text,text)',
    'public.fulfil_supplier_allocation_command(uuid,uuid,uuid,text,text)',
    'public.update_supplier_fulfilment_command(uuid,uuid,text,text,text,text)'
  ] LOOP
    IF NOT has_function_privilege('service_role',command_name,'EXECUTE')
      OR has_function_privilege('anon',command_name,'EXECUTE')
      OR has_function_privilege('authenticated',command_name,'EXECUTE') THEN
      RAISE EXCEPTION 'Command execution boundary changed: %',command_name;
    END IF;
  END LOOP;
END $grants$;

SET LOCAL ROLE authenticated;
DO $authenticated$
DECLARE denied boolean;
BEGIN
  denied:=false;
  BEGIN PERFORM supplier_cost,selling_price,supplier_contact,pricing_plan_snapshot,service_details FROM public.journey_supplier_allocations LIMIT 0;
  EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Authenticated sensitive read unexpectedly allowed'; END IF;
  denied:=false;
  BEGIN PERFORM previous_snapshot,new_snapshot FROM public.journey_supplier_allocation_history LIMIT 0;
  EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Authenticated history read unexpectedly allowed'; END IF;
  -- Safe owner-executed audit projection remains available (no values returned).
  PERFORM * FROM public.staff_audit_event_index LIMIT 0;
END $authenticated$;
RESET ROLE;

SET LOCAL ROLE anon;
DO $anonymous$
DECLARE denied boolean;
BEGIN
  denied:=false;
  BEGIN PERFORM supplier_cost,supplier_contact FROM public.journey_supplier_allocations LIMIT 0;
  EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Anonymous sensitive read unexpectedly allowed'; END IF;
  denied:=false;
  BEGIN PERFORM previous_snapshot,new_snapshot FROM public.journey_supplier_allocation_history LIMIT 0;
  EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Anonymous history read unexpectedly allowed'; END IF;
END $anonymous$;
RESET ROLE;

SET LOCAL ROLE service_role;
DO $trusted$
BEGIN
  PERFORM supplier_cost,selling_price,supplier_contact,pricing_plan_snapshot,service_details FROM public.journey_supplier_allocations LIMIT 0;
  PERFORM previous_snapshot,new_snapshot FROM public.journey_supplier_allocation_history LIMIT 0;
END $trusted$;
RESET ROLE;

CREATE TEMP TABLE r13_security_after ON COMMIT DROP AS
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
DO $unchanged$
DECLARE before_state jsonb; after_state jsonb; expected_acl jsonb;
BEGIN
  SELECT snapshot INTO before_state FROM pg_temp.r13_security_baseline;
  SELECT snapshot INTO after_state FROM pg_temp.r13_security_after;
  SELECT coalesce(jsonb_agg(entry ORDER BY entry->>'table_name',entry->>'column_name' NULLS FIRST,entry->>'grantee',entry->>'grantor',entry->>'privilege_type',(entry->>'is_grantable')::boolean),'[]'::jsonb)
  INTO expected_acl FROM jsonb_array_elements(before_state->'target_acl') entry
  WHERE NOT(entry->>'grantee' IN ('PUBLIC','anon','authenticated') AND entry->>'privilege_type'='SELECT');
  IF after_state->'target_acl'<>expected_acl THEN RAISE EXCEPTION 'Unexpected target ACL delta'; END IF;
  IF before_state-'target_acl'<>after_state-'target_acl' THEN RAISE EXCEPTION 'Data, guards, RLS, unrelated grants, Auth, Storage or sequence changed'; END IF;
END $unchanged$;
SELECT 'ALL_ASSERTIONS_PASSED_BEFORE_ROLLBACK' AS result,pg_backend_pid() AS backend_pid,
  (SELECT count(*) FROM pg_temp.r13_security_baseline) AS baseline_rows,
  (SELECT snapshot->'migrations' FROM pg_temp.r13_security_after) AS migrations;
ROLLBACK;
SELECT 'ROLLBACK_COMPLETED' AS result,pg_backend_pid() AS backend_pid,
  to_regclass('pg_temp.r13_security_baseline') IS NULL AS baseline_table_absent,
  to_regclass('pg_temp.r13_security_after') IS NULL AS after_table_absent,
  has_table_privilege('authenticated','public.journey_supplier_allocations','SELECT') AS original_read_grant_restored;
