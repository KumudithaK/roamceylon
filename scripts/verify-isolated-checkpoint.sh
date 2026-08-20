#!/usr/bin/env bash

set -euo pipefail

readonly ISOLATED_REF="xnsxmwgyugoqanuoyebh"
readonly PRODUCTION_REF="fstpfqlgypvktjwdeagu"
readonly POSTGRES_IMAGE="public.ecr.aws/supabase/postgres:17.6.1.147"

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repository_dir="$(cd "${script_dir}/.." && pwd)"
environment_file="${repository_dir}/.env.authz.local"
verification_dir="/tmp/roam-stabilization-phase1/restore-diagnostics"
work_dir=""
repository_migration_count="$(find "${repository_dir}/supabase/migrations" -maxdepth 1 -type f -name '*.sql' | wc -l | tr -d ' ')"
repository_latest_migration="$(find "${repository_dir}/supabase/migrations" -maxdepth 1 -type f -name '*.sql' -exec basename {} \; | LC_ALL=C sort | tail -n 1)"
repository_migration_manifest_sha256="$(
  cd "${repository_dir}"
  find supabase/migrations -maxdepth 1 -type f -name '*.sql' -print0 \
    | LC_ALL=C sort -z \
    | xargs -0 shasum -a 256 \
    | shasum -a 256 \
    | awk '{print $1}'
)"

cleanup() {
  if [[ -n "${work_dir}" &&
        -d "${work_dir}" &&
        "${work_dir}" == "${TMPDIR:-/tmp}/roam-isolated-verification."* ]]; then
    rm -rf -- "${work_dir}"
  fi
}
trap cleanup EXIT

if [[ ! -f "${environment_file}" ]]; then
  echo "BLOCKED: .env.authz.local was not found."
  exit 2
fi

set -a
# shellcheck disable=SC1090
source "${environment_file}"
set +a

: "${AUTHZ_TEST_PROJECT_REF:?Missing isolated project ref}"
: "${AUTHZ_TEST_SUPABASE_URL:?Missing isolated project URL}"
: "${AUTHZ_TEST_DB_URL:?Missing isolated database URL}"
: "${AUTHZ_TEST_ISOLATED_PROJECT:?Missing isolated-project confirmation}"

if [[ "${AUTHZ_TEST_PROJECT_REF}" != "${ISOLATED_REF}" ]] ||
   [[ "${AUTHZ_TEST_SUPABASE_URL}" != "https://${ISOLATED_REF}.supabase.co" ]] ||
   [[ "${AUTHZ_TEST_ISOLATED_PROJECT}" != "true" ]] ||
   [[ "${AUTHZ_TEST_DB_URL}" != *"${ISOLATED_REF}"* ]] ||
   [[ "${AUTHZ_TEST_DB_URL}" == *"${PRODUCTION_REF}"* ]]; then
  echo "BLOCKED: isolated-project safety check failed."
  exit 2
fi

work_dir="$(mktemp -d "${TMPDIR:-/tmp}/roam-isolated-verification.XXXXXX")"
chmod 700 "${work_dir}"
mkdir -p "${verification_dir}"
chmod 700 "${verification_dir}"

cat > "${work_dir}/reconcile.sql" <<'SQL'
\pset tuples_only on
\pset format unaligned
\set ON_ERROR_STOP on

BEGIN;

CREATE TEMP TABLE verification_results (
  check_name text PRIMARY KEY,
  expected text NOT NULL,
  actual text NOT NULL,
  passed boolean NOT NULL
) ON COMMIT DROP;

CREATE TEMP TABLE expected_entity_counts (
  table_name text PRIMARY KEY,
  expected_count bigint NOT NULL
) ON COMMIT DROP;

INSERT INTO expected_entity_counts VALUES
  ('themes', 9),
  ('destinations', 33),
  ('experiences', 142),
  ('accommodations', 10),
  ('vehicles', 11),
  ('guides', 6),
  ('pricing_plans', 9),
  ('enquiries', 26),
  ('curated_journeys', 3),
  ('journey_supplier_allocations', 80),
  ('journey_proposals', 16),
  ('journey_proposal_acceptances', 1),
  ('journey_accounts', 11),
  ('accounting_transactions', 60),
  ('journey_settlements', 106),
  ('journey_benefits', 1);

DO $block$
DECLARE
  item record;
  actual_count bigint;
BEGIN
  FOR item IN SELECT * FROM expected_entity_counts ORDER BY table_name LOOP
    EXECUTE format('SELECT count(*) FROM public.%I', item.table_name) INTO actual_count;
    INSERT INTO verification_results VALUES (
      'count.' || item.table_name,
      item.expected_count::text,
      actual_count::text,
      item.expected_count = actual_count
    );
  END LOOP;
END
$block$;

INSERT INTO verification_results
SELECT 'schema.tables', '46', count(*)::text, count(*) = 46
FROM pg_class AS c
JOIN pg_namespace AS n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p');

INSERT INTO verification_results
SELECT 'schema.functions', '19', count(*)::text, count(*) = 19
FROM pg_proc AS p
JOIN pg_namespace AS n ON n.oid = p.pronamespace
WHERE n.nspname IN ('public', 'private');

INSERT INTO verification_results
SELECT 'schema.policies', '121', count(*)::text, count(*) = 121
FROM pg_policy AS pol
JOIN pg_class AS c ON c.oid = pol.polrelid
JOIN pg_namespace AS n ON n.oid = c.relnamespace
WHERE n.nspname IN ('public', 'storage');

INSERT INTO verification_results
SELECT 'schema.triggers', '40', count(*)::text, count(*) = 40
FROM pg_trigger AS trg
JOIN pg_class AS c ON c.oid = trg.tgrelid
JOIN pg_namespace AS n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND NOT trg.tgisinternal;

INSERT INTO verification_results
SELECT 'schema.rls_enabled', '46', count(*)::text, count(*) = 46
FROM pg_class AS c
JOIN pg_namespace AS n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p') AND c.relrowsecurity;

INSERT INTO verification_results
SELECT 'schema.foreign_keys', '98', count(*)::text, count(*) = 98
FROM pg_constraint AS con
JOIN pg_class AS c ON c.oid = con.conrelid
JOIN pg_namespace AS n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND con.contype = 'f';

INSERT INTO verification_results
SELECT 'schema.unvalidated_constraints', '0', count(*)::text, count(*) = 0
FROM pg_constraint AS con
JOIN pg_class AS c ON c.oid = con.conrelid
JOIN pg_namespace AS n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND NOT con.convalidated;

DO $block$
DECLARE
  migration_count bigint;
  latest_version text;
BEGIN
  IF to_regclass('supabase_migrations.schema_migrations') IS NULL THEN
    INSERT INTO verification_results VALUES ('migrations.count', '70', 'missing', false);
    INSERT INTO verification_results VALUES ('migrations.latest', '202608110002', 'missing', false);
  ELSE
    EXECUTE 'SELECT count(*), coalesce(max(version), ''none'') FROM supabase_migrations.schema_migrations'
      INTO migration_count, latest_version;
    INSERT INTO verification_results VALUES ('migrations.count', '70', migration_count::text, migration_count = 70);
    INSERT INTO verification_results VALUES ('migrations.latest', '202608110002', latest_version, latest_version = '202608110002');
  END IF;
END
$block$;

INSERT INTO verification_results
SELECT 'auth.users', '1', count(*)::text, count(*) = 1 FROM auth.users;

INSERT INTO verification_results
SELECT 'storage.buckets', '4', count(*)::text, count(*) = 4 FROM storage.buckets;

INSERT INTO verification_results
SELECT 'storage.objects', '18', count(*)::text, count(*) = 18 FROM storage.objects;

INSERT INTO verification_results
SELECT 'grants.public_table_acl_entries', 'present', count(*)::text, count(*) > 0
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated', 'service_role');

CREATE TEMP TABLE foreign_key_violations (
  constraint_oid oid PRIMARY KEY,
  violation_count bigint NOT NULL
) ON COMMIT DROP;

DO $block$
DECLARE
  fk record;
  join_predicate text;
  child_non_null_predicate text;
  violation_count bigint;
BEGIN
  FOR fk IN
    SELECT con.oid,
           con.conrelid,
           con.confrelid,
           con.conkey,
           con.confkey
    FROM pg_constraint AS con
    JOIN pg_class AS c ON c.oid = con.conrelid
    JOIN pg_namespace AS n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND con.contype = 'f'
  LOOP
    SELECT string_agg(format('child.%I = parent.%I', child_attribute.attname, parent_attribute.attname), ' AND ' ORDER BY keys.ordinality),
           string_agg(format('child.%I IS NOT NULL', child_attribute.attname), ' AND ' ORDER BY keys.ordinality)
      INTO join_predicate, child_non_null_predicate
    FROM unnest(fk.conkey, fk.confkey) WITH ORDINALITY AS keys(child_number, parent_number, ordinality)
    JOIN pg_attribute AS child_attribute
      ON child_attribute.attrelid = fk.conrelid AND child_attribute.attnum = keys.child_number
    JOIN pg_attribute AS parent_attribute
      ON parent_attribute.attrelid = fk.confrelid AND parent_attribute.attnum = keys.parent_number;

    EXECUTE format(
      'SELECT count(*) FROM %s AS child WHERE %s AND NOT EXISTS (SELECT 1 FROM %s AS parent WHERE %s)',
      fk.conrelid::regclass,
      child_non_null_predicate,
      fk.confrelid::regclass,
      join_predicate
    ) INTO violation_count;

    INSERT INTO foreign_key_violations VALUES (fk.oid, violation_count);
  END LOOP;
END
$block$;

INSERT INTO verification_results
SELECT 'relationships.foreign_key_orphans', '0', coalesce(sum(violation_count), 0)::text, coalesce(sum(violation_count), 0) = 0
FROM foreign_key_violations;

SELECT check_name || '|expected=' || expected || '|actual=' || actual || '|status=' || CASE WHEN passed THEN 'PASS' ELSE 'FAIL' END
FROM verification_results
ORDER BY check_name;

SELECT 'application_reconciliation_summary|status=' || CASE WHEN bool_and(passed) THEN 'PASS' ELSE 'FAIL' END
FROM verification_results
WHERE check_name NOT LIKE 'migrations.%';

SELECT 'migration_bookkeeping_summary|status=' || CASE WHEN bool_and(passed) THEN 'RESTORED' ELSE 'NOT_RESTORED' END
FROM verification_results
WHERE check_name LIKE 'migrations.%';

ROLLBACK;
SQL

chmod 600 "${work_dir}/reconcile.sql"
: > "${verification_dir}/post-restore-reconciliation.txt"
chmod 600 "${verification_dir}/post-restore-reconciliation.txt"

echo "Safety check passed: isolated project confirmed."
echo "Repository migration inventory: count=${repository_migration_count} latest=${repository_latest_migration}"
echo "Repository migration manifest SHA-256: ${repository_migration_manifest_sha256}"
echo "Running read-only post-restore reconciliation..."

docker run --rm \
  --env-file "${environment_file}" \
  --volume "${work_dir}:/verification:ro" \
  --volume "${verification_dir}:/verification-output" \
  --entrypoint /bin/bash \
  "${POSTGRES_IMAGE}" \
  -lc 'set -euo pipefail; psql "$AUTHZ_TEST_DB_URL" -Xq --variable ON_ERROR_STOP=1 --file /verification/reconcile.sql 2>&1 | tee /verification-output/post-restore-reconciliation.txt'
