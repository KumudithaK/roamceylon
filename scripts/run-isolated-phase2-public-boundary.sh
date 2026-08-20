#!/usr/bin/env bash

set -euo pipefail

readonly ISOLATED_REF="xnsxmwgyugoqanuoyebh"
readonly PRODUCTION_REF="fstpfqlgypvktjwdeagu"
readonly POSTGRES_IMAGE="public.ecr.aws/supabase/postgres:17.6.1.147"

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repository_dir="$(cd "${script_dir}/.." && pwd)"
environment_file="${repository_dir}/.env.authz.local"
migration_file="${repository_dir}/supabase/migrations/202608120001_public_data_boundaries.sql"
evidence_dir="/tmp/roam-stabilization-phase2"
verification_file=""

cleanup() {
  if [[ -n "${verification_file}" && -f "${verification_file}" && "${verification_file}" == "${TMPDIR:-/tmp}/roam-phase2-verification."* ]]; then
    rm -f -- "${verification_file}"
  fi
}
trap cleanup EXIT

if [[ ! -f "${environment_file}" ]] || [[ ! -f "${migration_file}" ]]; then
  echo "BLOCKED: isolated environment or Phase 2 migration is missing."
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
   [[ "${AUTHZ_TEST_PROJECT_REF}" == "${PRODUCTION_REF}" ]] ||
   [[ "${AUTHZ_TEST_SUPABASE_URL}" == *"${PRODUCTION_REF}"* ]] ||
   [[ "${AUTHZ_TEST_DB_URL}" == *"${PRODUCTION_REF}"* ]]; then
  echo "BLOCKED: isolated-project safety gate failed."
  exit 2
fi

for role in JOURNEY_DESIGNER PARTNER_MANAGER FINANCE OPERATIONS CONTENT_MARKETING SUPER_ADMIN; do
  email_variable="AUTHZ_TEST_${role}_EMAIL"
  password_variable="AUTHZ_TEST_${role}_PASSWORD"
  if [[ "${!email_variable:-}" != *@roamceylon.test ]] || [[ -z "${!password_variable:-}" ]]; then
    echo "BLOCKED: a synthetic staff identity is missing or is not disposable."
    exit 2
  fi
done

if ! docker info >/dev/null 2>&1; then
  echo "BLOCKED: Docker Desktop is not available."
  exit 2
fi

mkdir -p "${evidence_dir}"
chmod 700 "${evidence_dir}"
shasum -a 256 "${migration_file}" | awk '{print $1}' > "${evidence_dir}/migration.sha256"
chmod 600 "${evidence_dir}/migration.sha256"

echo "Safety gate passed: isolated project and synthetic identities confirmed."
echo "Applying Phase 2 migration to isolated project only..."
docker run --rm \
  -v "${migration_file}:/phase2.sql:ro" \
  "${POSTGRES_IMAGE}" \
  psql "${AUTHZ_TEST_DB_URL}" -X --set ON_ERROR_STOP=1 -f /phase2.sql >/dev/null

verification_file="$(mktemp "${TMPDIR:-/tmp}/roam-phase2-verification.XXXXXX")"
chmod 600 "${verification_file}"
cat > "${verification_file}" <<'SQL'
\set ON_ERROR_STOP on
DO $verify$
DECLARE
  missing_views text[];
  leaked_columns integer;
BEGIN
  SELECT array_agg(name) INTO missing_views
  FROM unnest(ARRAY['public_accommodations','public_vehicles','public_guides','website_public_settings']) AS name
  WHERE to_regclass('public.' || name) IS NULL;
  IF missing_views IS NOT NULL THEN
    RAISE EXCEPTION 'Phase 2 public projections are missing';
  END IF;

  SELECT count(*) INTO leaked_columns
  FROM information_schema.columns
  WHERE table_schema='public' AND (
    (table_name='public_accommodations' AND column_name IN ('phone','email','website','booking_url','partner_account_id','subscription_plan','nightly_rate_usd','pricing_tier','status','active','is_sample')) OR
    (table_name='public_vehicles' AND column_name IN ('phone','email','website','provider_name','partner_account_id','subscription_plan','daily_rate_usd','per_km_rate_usd','status','active','is_sample')) OR
    (table_name='public_guides' AND column_name IN ('phone','email','licence_number','partner_account_id','subscription_plan','daily_rate_usd','status','active','is_sample')) OR
    (table_name='website_public_settings' AND column_name IN ('maintenance_mode','partner_registration_available','setup_checklist','setup_dismissed','updated_at','updated_by','business_registration_number','sltda_registration_number'))
  );
  IF leaked_columns <> 0 THEN
    RAISE EXCEPTION 'A Phase 2 public projection exposes a forbidden column';
  END IF;

  IF has_table_privilege('anon','public.accommodations','SELECT')
     OR has_table_privilege('anon','public.vehicles','SELECT')
     OR has_table_privilege('anon','public.guides','SELECT')
     OR has_table_privilege('anon','public.website_settings','SELECT') THEN
    RAISE EXCEPTION 'Anonymous base-table SELECT privilege still exists';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.column_privileges
    WHERE grantee='anon' AND privilege_type='SELECT' AND table_schema='public'
      AND table_name IN ('accommodations','vehicles','guides','website_settings')
  ) THEN
    RAISE EXCEPTION 'Anonymous base-table column SELECT privilege still exists';
  END IF;

  IF NOT has_table_privilege('anon','public.public_accommodations','SELECT')
     OR NOT has_table_privilege('anon','public.public_vehicles','SELECT')
     OR NOT has_table_privilege('anon','public.public_guides','SELECT')
     OR NOT has_table_privilege('anon','public.website_public_settings','SELECT') THEN
    RAISE EXCEPTION 'Anonymous projection SELECT privilege is missing';
  END IF;
END
$verify$;
SQL

docker run --rm \
  -v "${verification_file}:/verify.sql:ro" \
  "${POSTGRES_IMAGE}" \
  psql "${AUTHZ_TEST_DB_URL}" -X --set ON_ERROR_STOP=1 -f /verify.sql >/dev/null

echo "Database boundary verification passed."
echo "Executing focused anonymous authorization probes..."
set +e
AUTHZ_TEST_SCOPE=phase2-public-boundary AUTHZ_TEST_ENABLE_MUTATIONS=false \
  node --env-file="${environment_file}" tests/authorization-baseline.mjs \
  | tee "${evidence_dir}/authorization.json"
probe_status="${PIPESTATUS[0]}"
set -e
chmod 600 "${evidence_dir}/authorization.json"

if [[ "${probe_status}" -ne 0 ]]; then
  echo "BLOCKED: focused Phase 2 authorization verification did not pass."
  exit "${probe_status}"
fi

echo "PHASE 2 PUBLIC BOUNDARY VERIFIED: isolated project only."
