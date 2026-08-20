#!/usr/bin/env bash

set -euo pipefail

readonly ISOLATED_REF="xnsxmwgyugoqanuoyebh"
readonly PRODUCTION_REF="fstpfqlgypvktjwdeagu"
readonly POSTGRES_IMAGE="public.ecr.aws/supabase/postgres:17.6.1.147"

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repository_dir="$(cd "${script_dir}/.." && pwd)"
environment_file="${repository_dir}/.env.authz.local"
migration_file="${repository_dir}/supabase/migrations/202608120004_traveller_pii_boundaries.sql"
evidence_dir="/tmp/roam-stabilization-phase5"
verification_file=""

cleanup() {
  if [[ -n "${verification_file}" && -f "${verification_file}" && "${verification_file}" == "${TMPDIR:-/tmp}/roam-phase5-verification."* ]]; then
    rm -f -- "${verification_file}"
  fi
}
trap cleanup EXIT

if [[ ! -f "${environment_file}" ]] || [[ ! -f "${migration_file}" ]]; then
  echo "BLOCKED: isolated environment or Phase 5 migration is missing."
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

marker_count="$(docker run --rm "${POSTGRES_IMAGE}" psql "${AUTHZ_TEST_DB_URL}" -X --set ON_ERROR_STOP=1 -Atc \
  "select
     (select count(*) from public.permissions where code in ('traveller.pii.full.view','traveller.pii.design.view','traveller.pii.operations.view','traveller.pii.finance.view','traveller.context.suppliers.view'))
     +
     (select count(*) from pg_views where schemaname='public' and viewname in ('traveller_journey_design','traveller_operations_context','traveller_finance_reference','traveller_supplier_context','traveller_admin_full','staff_journey_request_summary','finance_journey_accounts','journey_account_statuses'));" | tr -d '[:space:]')"

if [[ "${marker_count}" == "13" ]]; then
  echo "Phase 5 migration already detected; preserving isolated database state and skipping migration application."
elif [[ "${marker_count}" == "0" ]]; then
  echo "Applying the Phase 5 PII boundary migration to the isolated project only..."
  docker run --rm -v "${migration_file}:/phase5.sql:ro" "${POSTGRES_IMAGE}" \
    psql "${AUTHZ_TEST_DB_URL}" -X --set ON_ERROR_STOP=1 --single-transaction -f /phase5.sql >/dev/null
else
  echo "BLOCKED: a partial Phase 5 marker set was detected; migration was not reapplied."
  exit 2
fi

verification_file="$(mktemp "${TMPDIR:-/tmp}/roam-phase5-verification.XXXXXX")"
chmod 600 "${verification_file}"
cat > "${verification_file}" <<'SQL'
\set ON_ERROR_STOP on
DO $verify$
DECLARE
  permission_count integer;
  assignment_count integer;
  view_count integer;
BEGIN
  SELECT count(*) INTO permission_count FROM public.permissions
  WHERE code IN (
    'traveller.pii.full.view','traveller.pii.design.view','traveller.pii.operations.view',
    'traveller.pii.finance.view','traveller.context.suppliers.view'
  );
  IF permission_count <> 5 THEN RAISE EXCEPTION 'Phase 5 purpose capability set is incomplete'; END IF;

  SELECT count(*) INTO assignment_count FROM public.staff_role_permissions
  WHERE (role_code='journey_designer' AND permission_code='traveller.pii.design.view')
     OR (role_code='operations' AND permission_code='traveller.pii.operations.view')
     OR (role_code='finance' AND permission_code='traveller.pii.finance.view')
     OR (role_code='partner_manager' AND permission_code='traveller.context.suppliers.view')
     OR (role_code='super_admin' AND permission_code IN (
       'traveller.pii.full.view','traveller.pii.design.view','traveller.pii.operations.view',
       'traveller.pii.finance.view','traveller.context.suppliers.view'
     ));
  IF assignment_count <> 9 THEN RAISE EXCEPTION 'Phase 5 role-purpose assignment set is incomplete'; END IF;

  SELECT count(*) INTO view_count FROM pg_views WHERE schemaname='public' AND viewname IN (
    'traveller_journey_design','traveller_operations_context','traveller_finance_reference',
    'traveller_supplier_context','traveller_admin_full','staff_journey_request_summary',
    'finance_journey_accounts','journey_account_statuses'
  );
  IF view_count <> 8 THEN RAISE EXCEPTION 'Phase 5 projection set is incomplete'; END IF;

  IF has_table_privilege('authenticated','public.enquiries','SELECT')
     OR has_table_privilege('authenticated','public.journey_proposals','SELECT')
     OR has_table_privilege('authenticated','public.journey_proposal_acceptances','SELECT')
     OR has_table_privilege('authenticated','public.journey_proposal_change_requests','SELECT')
     OR has_table_privilege('authenticated','public.journey_accounts','SELECT') THEN
    RAISE EXCEPTION 'Authenticated complete base-table SELECT privilege remains';
  END IF;

  IF has_table_privilege('anon','public.traveller_journey_design','SELECT')
     OR has_table_privilege('anon','public.traveller_operations_context','SELECT')
     OR has_table_privilege('anon','public.traveller_finance_reference','SELECT')
     OR has_table_privilege('anon','public.traveller_supplier_context','SELECT')
     OR has_table_privilege('anon','public.traveller_admin_full','SELECT')
     OR has_table_privilege('anon','public.finance_journey_accounts','SELECT') THEN
    RAISE EXCEPTION 'Anonymous purpose-projection privilege remains';
  END IF;

  IF NOT has_table_privilege('authenticated','public.traveller_journey_design','SELECT')
     OR NOT has_table_privilege('authenticated','public.traveller_operations_context','SELECT')
     OR NOT has_table_privilege('authenticated','public.traveller_finance_reference','SELECT')
     OR NOT has_table_privilege('authenticated','public.traveller_supplier_context','SELECT')
     OR NOT has_table_privilege('authenticated','public.traveller_admin_full','SELECT')
     OR NOT has_table_privilege('authenticated','public.finance_journey_accounts','SELECT') THEN
    RAISE EXCEPTION 'Authenticated purpose-projection privilege is incomplete';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.role_column_grants
    WHERE grantee='authenticated' AND table_schema='public' AND table_name='enquiries'
      AND privilege_type='SELECT' AND column_name='id'
  ) OR EXISTS (
    SELECT 1 FROM information_schema.role_column_grants
    WHERE grantee='authenticated' AND table_schema='public' AND table_name='enquiries'
      AND privilege_type='SELECT' AND column_name IN ('name','email','phone','trip_state','traveller_notes')
  ) THEN
    RAISE EXCEPTION 'Enquiry column privilege boundary is incorrect';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename IN ('enquiries','journey_proposals','journey_proposal_acceptances','journey_proposal_change_requests','journey_accounts')
      AND (coalesce(qual,'') ILIKE '%has_role%' OR coalesce(with_check,'') ILIKE '%has_role%')
  ) THEN RAISE EXCEPTION 'A Phase 5 protected table still uses legacy role authority'; END IF;

  IF (SELECT count(*) FROM pg_policies WHERE schemaname='storage' AND tablename='objects'
      AND policyname IN ('travel_content_cms_insert','partner_storage_staff_insert','accounting_receipts_finance_insert')) <> 3 THEN
    RAISE EXCEPTION 'Phase 4 Storage policy regression detected';
  END IF;
END
$verify$;
SQL

docker run --rm -v "${verification_file}:/verify.sql:ro" "${POSTGRES_IMAGE}" \
  psql "${AUTHZ_TEST_DB_URL}" -X --set ON_ERROR_STOP=1 -f /verify.sql >/dev/null
echo "Purpose capability, projection, grant and Phase 4 structure verification passed."

evidence_passes() {
  local evidence_file="$1"
  local minimum_results="$2"
  node - "${evidence_file}" "${ISOLATED_REF}" "${minimum_results}" <<'NODE'
const [file,projectRef,minimumText]=process.argv.slice(2);
try{
  const evidence=JSON.parse(require("node:fs").readFileSync(file,"utf8"));
  const results=Array.isArray(evidence.results)?evidence.results:[];
  const cleanup=evidence.cleanup?.syntheticRecordsRemoved!==false;
  process.exit(evidence.projectRef===projectRef&&results.length>=Number(minimumText)&&cleanup&&results.every(result=>result.targetVerdict==="PASS")?0:1);
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
  process.exit(evidence.projectRef===projectRef&&capabilities.length===7&&results.length===56&&capabilities.every(item=>item.targetVerdict==="PASS")&&results.every(item=>item.targetVerdict==="PASS")?0:1);
}catch{process.exit(1)}
NODE
}

pii_evidence="${evidence_dir}/pii-field-and-bypass-matrix.json"
if evidence_passes "${pii_evidence}" 36; then
  chmod 600 "${pii_evidence}"
  echo "Phase 5 field-level and bypass evidence already passed; preserving it."
else
  echo "Executing synthetic PII field-level, base-row, nested-relation and API bypass matrix..."
  node --env-file="${environment_file}" tests/phase5-pii-authorization.mjs | tee "${pii_evidence}"
  chmod 600 "${pii_evidence}"
fi

phase3_evidence="${evidence_dir}/phase3-api-regression.json"
if api_evidence_passes "${phase3_evidence}"; then
  chmod 600 "${phase3_evidence}"
  echo "Phase 3 exact capability/API regression already passed; preserving it."
else
  echo "Re-verifying Phase 3 exact capability and protected API matrix..."
  node --env-file="${environment_file}" tests/api-authorization-baseline.mjs | tee "${phase3_evidence}"
  chmod 600 "${phase3_evidence}"
fi

phase2_evidence="${evidence_dir}/phase2-regression.json"
if evidence_passes "${phase2_evidence}" 9; then
  chmod 600 "${phase2_evidence}"
  echo "Phase 2 public-boundary regression already passed; preserving it."
else
  echo "Re-verifying Phase 2 public-data boundaries..."
  AUTHZ_TEST_SCOPE=phase2-public-boundary AUTHZ_TEST_ENABLE_MUTATIONS=false \
    node --env-file="${environment_file}" tests/authorization-baseline.mjs | tee "${phase2_evidence}"
  chmod 600 "${phase2_evidence}"
fi

phase4_dir="/tmp/roam-stabilization-phase4"
if ! evidence_passes "${phase4_dir}/direct-authorization.json" 62 ||
   ! evidence_passes "${phase4_dir}/storage-path-safety.json" 8; then
  echo "BLOCKED: completed Phase 4 direct/path-safety evidence is missing or invalid; refusing to infer regression status."
  exit 2
fi
if ! node - "${phase4_dir}/storage-authorization.json" "${ISOLATED_REF}" <<'NODE'
const [file,projectRef]=process.argv.slice(2);
try{
  const evidence=JSON.parse(require("node:fs").readFileSync(file,"utf8"));
  const normal=(Array.isArray(evidence.results)?evidence.results:[]).filter(item=>item.action!=="PATH_SAFETY"&&item.action!=="CROSS_BUCKET_PATH_WRITE");
  process.exit(evidence.projectRef===projectRef&&evidence.cleanup?.syntheticObjectsRemoved===true&&normal.length===56&&normal.every(item=>item.targetVerdict==="PASS")?0:1);
}catch{process.exit(1)}
NODE
then
  echo "BLOCKED: completed Phase 4 Storage capability evidence is missing or invalid."
  exit 2
fi
echo "Phase 4 direct, self-escalation, Storage and path-safety evidence remains preserved and valid."

echo "PHASE 5 PII BOUNDARY VERIFIED: isolated project only."
