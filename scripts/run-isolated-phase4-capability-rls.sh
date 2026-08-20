#!/usr/bin/env bash

set -euo pipefail

readonly ISOLATED_REF="xnsxmwgyugoqanuoyebh"
readonly PRODUCTION_REF="fstpfqlgypvktjwdeagu"
readonly POSTGRES_IMAGE="public.ecr.aws/supabase/postgres:17.6.1.147"

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repository_dir="$(cd "${script_dir}/.." && pwd)"
environment_file="${repository_dir}/.env.authz.local"
migration_file="${repository_dir}/supabase/migrations/202608120003_capability_rls_storage_cutover.sql"
evidence_dir="/tmp/roam-stabilization-phase4"
verification_file=""

cleanup() {
  if [[ -n "${verification_file}" && -f "${verification_file}" && "${verification_file}" == "${TMPDIR:-/tmp}/roam-phase4-verification."* ]]; then
    rm -f -- "${verification_file}"
  fi
}
trap cleanup EXIT

if [[ ! -f "${environment_file}" ]] || [[ ! -f "${migration_file}" ]]; then
  echo "BLOCKED: isolated environment or Phase 4 migration is missing."
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

cd "${repository_dir}"
echo "Safety gate passed: isolated project and synthetic identities confirmed; production rejected."

verification_file="$(mktemp "${TMPDIR:-/tmp}/roam-phase4-verification.XXXXXX")"
chmod 600 "${verification_file}"
cat > "${verification_file}" <<'SQL'
\set ON_ERROR_STOP on
DO $verify$
DECLARE
  legacy_policy_count integer;
  storage_policy_count integer;
BEGIN
  SELECT count(*) INTO legacy_policy_count
  FROM pg_policies
  WHERE schemaname='public'
    AND tablename IN (
      'accommodations','accounting_attachments','accounting_lifecycle_history','accounting_transactions',
      'benefit_definitions','content_import_runs','curated_journey_changes','curated_journeys',
      'destinations','enquiries','experience_destinations','experience_themes','experiences',
      'guide_destinations','guide_experiences','guide_themes','guides','homepage_content',
      'journey_accounts','journey_benefits','journey_cancellation_cases','journey_estimate_bands',
      'journey_pricing_settings','journey_proposal_acceptances','journey_proposal_change_requests',
      'journey_proposals','journey_settlements','journey_supplier_allocations',
      'partner_application_files','partner_application_history','partner_applications','partner_commercial_settings',
      'permissions','pricing_plans','profile_staff_roles','profiles','staff_role_permissions','staff_roles',
      'supplier_recoverability_history','theme_destinations','themes','tour_pricing_config',
      'tour_supplier_costs','vehicle_destinations','vehicles','website_settings'
    )
    AND (coalesce(qual,'') ILIKE '%has_role%' OR coalesce(with_check,'') ILIKE '%has_role%');
  IF legacy_policy_count <> 0 THEN
    RAISE EXCEPTION 'A protected public policy still uses the legacy role helper';
  END IF;

  IF has_table_privilege('anon','public.accommodations','SELECT')
     OR has_table_privilege('anon','public.vehicles','SELECT')
     OR has_table_privilege('anon','public.guides','SELECT')
     OR has_table_privilege('anon','public.website_settings','SELECT')
     OR has_table_privilege('anon','public.permissions','SELECT')
     OR has_table_privilege('anon','public.profile_staff_roles','SELECT') THEN
    RAISE EXCEPTION 'Anonymous protected base-table privilege remains';
  END IF;

  IF NOT has_table_privilege('anon','public.public_accommodations','SELECT')
     OR NOT has_table_privilege('anon','public.public_vehicles','SELECT')
     OR NOT has_table_privilege('anon','public.public_guides','SELECT')
     OR NOT has_table_privilege('anon','public.website_public_settings','SELECT') THEN
    RAISE EXCEPTION 'Phase 2 public projection privilege regressed';
  END IF;

  IF has_function_privilege('anon','public.current_staff_permissions()','EXECUTE')
     OR NOT has_function_privilege('authenticated','public.current_staff_permissions()','EXECUTE')
     OR NOT has_function_privilege('authenticated','public.sync_content_relationships(text,uuid,uuid[],uuid[],uuid[])','EXECUTE') THEN
    RAISE EXCEPTION 'Sensitive RPC execute grants are incorrect';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_proc procedure
    JOIN pg_namespace namespace ON namespace.oid=procedure.pronamespace
    WHERE namespace.nspname='private' AND procedure.proname='has_permission'
      AND (NOT procedure.prosecdef OR NOT EXISTS (
        SELECT 1 FROM unnest(coalesce(procedure.proconfig,'{}'::text[])) setting
        WHERE setting LIKE 'search_path=%'
      ))
  ) THEN
    RAISE EXCEPTION 'Capability helper security configuration is unsafe';
  END IF;

  SELECT count(*) INTO storage_policy_count
  FROM pg_policies
  WHERE schemaname='storage' AND tablename='objects'
    AND policyname IN (
      'travel_content_public_read','travel_content_cms_insert','travel_content_cms_update','travel_content_cms_delete',
      'partner_storage_staff_read','partner_storage_staff_insert','partner_storage_staff_update','partner_storage_staff_delete',
      'accounting_receipts_finance_read','accounting_receipts_finance_insert','accounting_receipts_finance_update','accounting_receipts_finance_delete'
    );
  IF storage_policy_count <> 12 THEN
    RAISE EXCEPTION 'Phase 4 Storage policy set is incomplete';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND (coalesce(qual,'') ILIKE '%has_role%' OR coalesce(with_check,'') ILIKE '%has_role%')
  ) THEN
    RAISE EXCEPTION 'A Storage policy still uses the legacy role helper';
  END IF;
END
$verify$;
SQL

phase4_marker_count="$(docker run --rm \
  "${POSTGRES_IMAGE}" \
  psql "${AUTHZ_TEST_DB_URL}" -X --set ON_ERROR_STOP=1 -Atc \
  "select
    (select count(*) from pg_policies where schemaname='storage' and tablename='objects' and policyname in ('travel_content_cms_insert','partner_storage_staff_insert'))
    + (select count(*) from pg_trigger where tgname='journey_accounts_require_override_capability' and not tgisinternal);" \
  | tr -d '[:space:]')"

if [[ "${phase4_marker_count}" == "3" ]]; then
  echo "Phase 4 migration already detected; preserving current isolated database state and skipping migration application."
elif [[ "${phase4_marker_count}" == "0" ]]; then
  echo "Phase 4 migration is not present; applying it to the isolated project only..."
  docker run --rm \
    -v "${migration_file}:/phase4.sql:ro" \
    "${POSTGRES_IMAGE}" \
    psql "${AUTHZ_TEST_DB_URL}" -X --set ON_ERROR_STOP=1 -f /phase4.sql >/dev/null
else
  echo "BLOCKED: a partial Phase 4 marker set was detected; migration was not reapplied."
  exit 2
fi

docker run --rm \
  -v "${verification_file}:/verify.sql:ro" \
  "${POSTGRES_IMAGE}" \
  psql "${AUTHZ_TEST_DB_URL}" -X --set ON_ERROR_STOP=1 -f /verify.sql >/dev/null
echo "Database policy, grant, RPC and Storage structure verification passed."

evidence_passes() {
  local evidence_file="$1"
  local minimum_results="$2"
  node - "${evidence_file}" "${ISOLATED_REF}" "${minimum_results}" <<'NODE'
const [file,projectRef,minimumText]=process.argv.slice(2);
try{
  const evidence=JSON.parse(require("node:fs").readFileSync(file,"utf8"));
  const results=Array.isArray(evidence.results)?evidence.results:[];
  const cleanupPassed=evidence.cleanup?.syntheticObjectsRemoved!==false;
  process.exit(evidence.projectRef===projectRef&&results.length>=Number(minimumText)&&cleanupPassed&&results.every(result=>result.targetVerdict==="PASS")?0:1);
}catch{process.exit(1)}
NODE
}

api_evidence_passes() {
  local evidence_file="$1"
  node - "${evidence_file}" "${ISOLATED_REF}" <<'NODE'
const [file,projectRef]=process.argv.slice(2);
try{
  const evidence=JSON.parse(require("node:fs").readFileSync(file,"utf8"));
  const capabilities=Array.isArray(evidence.capabilityResults)?evidence.capabilityResults:[];
  const results=Array.isArray(evidence.results)?evidence.results:[];
  process.exit(evidence.projectRef===projectRef&&capabilities.length===7&&results.length===56&&capabilities.every(result=>result.targetVerdict==="PASS")&&results.every(result=>result.targetVerdict==="PASS")?0:1);
}catch{process.exit(1)}
NODE
}

storage_capability_evidence_passes() {
  local evidence_file="$1"
  node - "${evidence_file}" "${ISOLATED_REF}" <<'NODE'
const [file,projectRef]=process.argv.slice(2);
try{
  const evidence=JSON.parse(require("node:fs").readFileSync(file,"utf8"));
  const normal=(Array.isArray(evidence.results)?evidence.results:[]).filter(result=>result.action!=="PATH_SAFETY"&&result.action!=="CROSS_BUCKET_PATH_WRITE");
  process.exit(evidence.projectRef===projectRef&&evidence.cleanup?.syntheticObjectsRemoved===true&&normal.length===56&&normal.every(result=>result.targetVerdict==="PASS")?0:1);
}catch{process.exit(1)}
NODE
}

direct_evidence="${evidence_dir}/direct-authorization.json"
if evidence_passes "${direct_evidence}" 62; then
  chmod 600 "${direct_evidence}"
  echo "Direct Supabase CRUD/RPC/self-escalation matrix already passed (62 checks); preserving and not repeating it."
else
  echo "Executing direct Supabase CRUD, RPC, linkage and self-escalation matrix..."
  node --env-file="${environment_file}" tests/phase4-direct-authorization.mjs \
    | tee "${direct_evidence}"
  chmod 600 "${direct_evidence}"
fi

storage_capability_evidence="${evidence_dir}/storage-authorization.json"
if ! storage_capability_evidence_passes "${storage_capability_evidence}"; then
  echo "BLOCKED: completed normal Storage capability evidence is missing or invalid; refusing to infer it."
  exit 2
fi
chmod 600 "${storage_capability_evidence}"
storage_path_evidence="${evidence_dir}/storage-path-safety.json"
if evidence_passes "${storage_path_evidence}" 8; then
  chmod 600 "${storage_path_evidence}"
  echo "Four-bucket Storage path-safety verification already passed; preserving it."
else
  echo "Executing only the corrected four-bucket Storage path-safety verification..."
  AUTHZ_TEST_STORAGE_SCOPE=path-safety \
    node --env-file="${environment_file}" tests/storage-authorization-baseline.mjs \
    | tee "${storage_path_evidence}"
  chmod 600 "${storage_path_evidence}"
fi

phase3_evidence="${evidence_dir}/phase3-api-regression.json"
if api_evidence_passes "${phase3_evidence}"; then
  chmod 600 "${phase3_evidence}"
  echo "Phase 3 API regression evidence already exists; preserving it."
else
  echo "Re-verifying Phase 3 exact API capability matrix..."
  node --env-file="${environment_file}" tests/api-authorization-baseline.mjs \
    | tee "${phase3_evidence}"
  chmod 600 "${phase3_evidence}"
fi

phase2_evidence="${evidence_dir}/phase2-regression.json"
if evidence_passes "${phase2_evidence}" 9; then
  chmod 600 "${phase2_evidence}"
  echo "Phase 2 public-boundary regression already passed; preserving and not repeating it."
else
  echo "Re-verifying Phase 2 public boundaries..."
  AUTHZ_TEST_SCOPE=phase2-public-boundary AUTHZ_TEST_ENABLE_MUTATIONS=false \
    node --env-file="${environment_file}" tests/authorization-baseline.mjs \
    | tee "${phase2_evidence}"
  chmod 600 "${phase2_evidence}"
fi

echo "PHASE 4 CAPABILITY RLS AND STORAGE VERIFIED: isolated project only."
