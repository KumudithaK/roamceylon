#!/usr/bin/env bash

set -euo pipefail

readonly ISOLATED_REF="xnsxmwgyugoqanuoyebh"
readonly PRODUCTION_REF="fstpfqlgypvktjwdeagu"
readonly POSTGRES_IMAGE="public.ecr.aws/supabase/postgres:17.6.1.147"

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repository_dir="$(cd "${script_dir}/.." && pwd)"
environment_file="${repository_dir}/.env.authz.local"
migration_file="${repository_dir}/supabase/migrations/202608120002_staff_capability_architecture.sql"
evidence_dir="/tmp/roam-stabilization-phase3"

if [[ ! -f "${environment_file}" ]] || [[ ! -f "${migration_file}" ]]; then
  echo "BLOCKED: isolated environment or Phase 3 migration is missing."
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

if ! docker info >/dev/null 2>&1; then
  echo "BLOCKED: Docker Desktop is not available."
  exit 2
fi

mkdir -p "${evidence_dir}"
chmod 700 "${evidence_dir}"
shasum -a 256 "${migration_file}" | awk '{print $1}' > "${evidence_dir}/migration.sha256"
chmod 600 "${evidence_dir}/migration.sha256"

cd "${repository_dir}"
echo "Safety gate passed: isolated project confirmed; production rejected."
echo "Applying Phase 3 capability migration to isolated project only..."
docker run --rm \
  -v "${migration_file}:/phase3.sql:ro" \
  "${POSTGRES_IMAGE}" \
  psql "${AUTHZ_TEST_DB_URL}" -X --set ON_ERROR_STOP=1 --single-transaction -f /phase3.sql >/dev/null

echo "Refreshing disposable synthetic staff assignments..."
node --env-file="${environment_file}" scripts/setup-isolated-authorization-baseline.mjs >/dev/null

# The setup script rotates disposable passwords and updates the same private env.
set -a
# shellcheck disable=SC1090
source "${environment_file}"
set +a

echo "Executing exact capability and API authorization matrix..."
node --env-file="${environment_file}" tests/api-authorization-baseline.mjs \
  | tee "${evidence_dir}/api-and-capability-authorization.json"
chmod 600 "${evidence_dir}/api-and-capability-authorization.json"

echo "Re-verifying Phase 2 public boundaries..."
AUTHZ_TEST_SCOPE=phase2-public-boundary AUTHZ_TEST_ENABLE_MUTATIONS=false \
  node --env-file="${environment_file}" tests/authorization-baseline.mjs \
  | tee "${evidence_dir}/phase2-regression.json"
chmod 600 "${evidence_dir}/phase2-regression.json"

echo "PHASE 3 CAPABILITY ARCHITECTURE VERIFIED: isolated project only."
