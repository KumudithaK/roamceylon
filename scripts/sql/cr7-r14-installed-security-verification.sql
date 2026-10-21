-- READ-ONLY installed-state verification: staging hvcggnuptrcsxtrcjnre only.
-- Not a migration: no REVOKE/GRANT, business DML, persistent objects or command invocation.
BEGIN READ ONLY;
SET LOCAL lock_timeout='3s';
SET LOCAL statement_timeout='30s';
SET LOCAL idle_in_transaction_session_timeout='30s';
DO $installed$
BEGIN
  IF (SELECT count(*) FROM supabase_migrations.schema_migrations)<>89
    OR (SELECT max(version) FROM supabase_migrations.schema_migrations)<>'202610150002'
    OR (SELECT count(*) FROM supabase_migrations.schema_migrations WHERE version='202610150002')<>1
    OR EXISTS(SELECT 1 FROM supabase_migrations.schema_migrations WHERE version='202610150001')
  THEN RAISE EXCEPTION 'Installed migration baseline differs'; END IF;
  IF (SELECT count(*) FROM pg_trigger WHERE tgname IN ('curated_journeys_guard_accepted_itinerary','journey_allocations_guard_accepted_insert','journey_proposals_guard_accepted_insert') AND tgenabled<>'D')<>3
  THEN RAISE EXCEPTION 'Accepted-design guards missing'; END IF;
  IF (SELECT count(*) FROM pg_constraint WHERE conname IN ('enquiries_estimate_snapshot_cent_precision','allocations_rate_snapshot_cent_precision','proposals_financial_snapshots_cent_precision','accounts_quote_snapshot_cent_precision') AND convalidated)<>4
  THEN RAISE EXCEPTION 'Finance snapshot constraints missing'; END IF;
  IF constraint_guard.finance_snapshot_cent_precise('{"total":1.23}'::jsonb) IS NOT TRUE
    OR constraint_guard.finance_snapshot_cent_precise('{"total":1.234}'::jsonb) IS NOT FALSE
  THEN RAISE EXCEPTION 'Finance precision validation differs'; END IF;
END $installed$;

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
ROLLBACK;
SELECT 'INSTALLED_SECURITY_READ_ONLY_ASSERTIONS_PASS' AS result,
  pg_backend_pid() AS backend_pid,
  (SELECT count(*) FROM supabase_migrations.schema_migrations) AS migration_count,
  (SELECT max(version) FROM supabase_migrations.schema_migrations) AS latest_migration,
  (SELECT count(*) FROM supabase_migrations.schema_migrations WHERE version='202610150002') AS security_migration_records,
  (SELECT count(*) FROM supabase_migrations.schema_migrations WHERE version='202610150001') AS account_date_migration_records,
  NOT has_table_privilege('authenticated','public.journey_supplier_allocations','SELECT')
    AND NOT has_any_column_privilege('authenticated','public.journey_supplier_allocations','SELECT')
    AND NOT has_table_privilege('authenticated','public.journey_supplier_allocation_history','SELECT')
    AND NOT has_any_column_privilege('authenticated','public.journey_supplier_allocation_history','SELECT') AS authenticated_reads_denied,
  (SELECT last_value FROM public.journey_account_number_seq) AS sequence_value;
