#!/usr/bin/env bash

set -euo pipefail

readonly ISOLATED_REF="xnsxmwgyugoqanuoyebh"
readonly PRODUCTION_REF="fstpfqlgypvktjwdeagu"
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repository_dir="$(cd "${script_dir}/.." && pwd)"
environment_file="${repository_dir}/.env.authz.local"
evidence_dir="/tmp/roam-stabilization-phase1/authorization-evidence"

if [[ ! -f "${environment_file}" ]]; then
  echo "BLOCKED: isolated environment file was not found."
  exit 2
fi

set -a
# shellcheck disable=SC1090
source "${environment_file}"
set +a

: "${AUTHZ_TEST_PROJECT_REF:?Missing isolated project ref}"
: "${AUTHZ_TEST_SUPABASE_URL:?Missing isolated project URL}"
: "${AUTHZ_TEST_ISOLATED_PROJECT:?Missing isolated confirmation}"
: "${AUTHZ_FIXTURE_THEME_ID:?Missing synthetic theme fixture}"
: "${AUTHZ_FIXTURE_GUIDE_ID:?Missing synthetic guide fixture}"
: "${AUTHZ_FIXTURE_ENQUIRY_ID:?Missing synthetic enquiry fixture}"
: "${AUTHZ_FIXTURE_CURATED_JOURNEY_ID:?Missing synthetic curated-journey fixture}"
: "${AUTHZ_FIXTURE_ALLOCATION_ID:?Missing synthetic allocation fixture}"
: "${AUTHZ_FIXTURE_ACCOUNT_ID:?Missing synthetic account fixture}"

if [[ "${AUTHZ_TEST_PROJECT_REF}" != "${ISOLATED_REF}" ]] ||
   [[ "${AUTHZ_TEST_SUPABASE_URL}" != "https://${ISOLATED_REF}.supabase.co" ]] ||
   [[ "${AUTHZ_TEST_ISOLATED_PROJECT}" != "true" ]] ||
   [[ "${AUTHZ_TEST_PROJECT_REF}" == "${PRODUCTION_REF}" ]] ||
   [[ "${AUTHZ_TEST_SUPABASE_URL}" == *"${PRODUCTION_REF}"* ]]; then
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

mkdir -p "${evidence_dir}"
chmod 700 "${evidence_dir}"

run_evidence_probe() {
  local label="$1"
  local output_file="$2"
  shift 2
  set +e
  "$@" | tee "${output_file}"
  local probe_status="${PIPESTATUS[0]}"
  set -e
  chmod 600 "${output_file}"
  if [[ "${probe_status}" -eq 2 ]]; then
    echo "BLOCKED: ${label} safety or fixture gate failed."
    exit 2
  fi
  if [[ "${probe_status}" -gt 2 ]]; then
    echo "BLOCKED: ${label} did not execute reliably."
    exit "${probe_status}"
  fi
  echo "${label}: EXECUTED (red target verdicts are retained evidence)."
}

cd "${repository_dir}"
echo "Safety gate passed: isolated project and synthetic fixtures confirmed."

run_evidence_probe \
  "Mutation authorization matrix" \
  "${evidence_dir}/mutation-authorization.json" \
  env AUTHZ_TEST_ENABLE_MUTATIONS=true node --env-file="${environment_file}" tests/authorization-baseline.mjs

run_evidence_probe \
  "Legacy API authorization baseline" \
  "${evidence_dir}/api-authorization.json" \
  node --env-file="${environment_file}" tests/api-authorization-baseline.mjs

run_evidence_probe \
  "Storage authorization baseline" \
  "${evidence_dir}/storage-authorization.json" \
  node --env-file="${environment_file}" tests/storage-authorization-baseline.mjs

echo "PHASE 1 EXECUTABLE BASELINES COMPLETED: isolated project only."
