#!/usr/bin/env bash
set -euo pipefail

readonly ISOLATED_REF="xnsxmwgyugoqanuoyebh"
readonly PRODUCTION_REF="fstpfqlgypvktjwdeagu"
readonly POSTGRES_IMAGE="public.ecr.aws/supabase/postgres:17.6.1.147"

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repository_dir="$(cd "${script_dir}/.." && pwd)"
environment_file="${repository_dir}/.env.authz.local"
migration_file="${repository_dir}/supabase/migrations/202608120006_proposal_acceptance_integrity.sql"
evidence_dir="/tmp/roam-stabilization-phase7"

[[ -f "${environment_file}" && -f "${migration_file}" ]] || { echo "BLOCKED: isolated environment or Phase 7 migration is missing."; exit 2; }
set -a
# shellcheck disable=SC1090
source "${environment_file}"
set +a

: "${AUTHZ_TEST_PROJECT_REF:?Missing isolated project ref}"
: "${AUTHZ_TEST_SUPABASE_URL:?Missing isolated project URL}"
: "${AUTHZ_TEST_SUPABASE_PUBLISHABLE_KEY:?Missing isolated publishable key}"
: "${AUTHZ_TEST_SUPABASE_SERVICE_ROLE_KEY:?Missing isolated service key}"
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
  [[ "${!email_variable:-}" == *@roamceylon.test && -n "${!password_variable:-}" ]] || { echo "BLOCKED: a disposable synthetic identity is missing."; exit 2; }
done

docker info >/dev/null 2>&1 || { echo "BLOCKED: Docker Desktop is not available."; exit 2; }
mkdir -p "${evidence_dir}"
chmod 700 "${evidence_dir}"
shasum -a 256 "${migration_file}" | awk '{print $1}' > "${evidence_dir}/migration.sha256"
chmod 600 "${evidence_dir}/migration.sha256"
cd "${repository_dir}"

echo "Safety gate passed: isolated project only; production rejected."
marker="$(docker run --rm "${POSTGRES_IMAGE}" psql "${AUTHZ_TEST_DB_URL}" -X --set ON_ERROR_STOP=1 -Atc "select
  (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='accept_journey_proposal_command' and p.proargnames[1]='p_public_token')
  +(select count(*) from pg_trigger where not tgisinternal and tgname in('journey_proposal_acceptances_immutable','journey_proposals_guard_accepted_agreement'));" | tr -d '[:space:]')"

if [[ "${marker}" == "3" ]]; then
  echo "Phase 7 migration already detected; preserving isolated database state and skipping migration application."
elif [[ "${marker}" == "0" ]]; then
  docker run --rm -v "${migration_file}:/phase7.sql:ro" "${POSTGRES_IMAGE}" \
    psql "${AUTHZ_TEST_DB_URL}" -X --set ON_ERROR_STOP=1 --single-transaction -f /phase7.sql >/dev/null
else
  echo "BLOCKED: partial Phase 7 database state detected; migration was not reapplied."
  exit 2
fi

docker run --rm "${POSTGRES_IMAGE}" psql "${AUTHZ_TEST_DB_URL}" -X --set ON_ERROR_STOP=1 -Atc "do \$verify\$ begin
  if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='execute_enquiry_transition') then raise exception 'Phase 6 workflow command regression';end if;
  if has_table_privilege('authenticated','public.enquiries','UPDATE') then raise exception 'Phase 6 direct enquiry mutation regression';end if;
  if (select count(*) from pg_views where schemaname='public' and viewname in('public_accommodations','website_public_settings'))<>2 then raise exception 'Phase 2 public boundary regression';end if;
  if (select count(*) from pg_views where schemaname='public' and viewname in('traveller_journey_design','traveller_operations_context','traveller_finance_reference','traveller_supplier_context','traveller_admin_full'))<>5 then raise exception 'Phase 5 PII boundary regression';end if;
  if has_function_privilege('authenticated','public.accept_journey_proposal_command(uuid,text,text,jsonb)','EXECUTE') or has_function_privilege('anon','public.accept_journey_proposal_command(uuid,text,text,jsonb)','EXECUTE') then raise exception 'Acceptance command execution boundary regression';end if;
end \$verify\$;" >/dev/null
echo "Phase 2-6 focused structural and command-boundary regression gates passed."

node --env-file="${environment_file}" tests/phase7-proposal-acceptance.mjs | tee "${evidence_dir}/acceptance-matrix.json"
chmod 600 "${evidence_dir}/acceptance-matrix.json"
echo "PHASE 7 PROPOSAL ACCEPTANCE INTEGRITY VERIFIED: isolated project only."
