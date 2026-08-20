#!/usr/bin/env bash
set -euo pipefail
readonly ISOLATED_REF="xnsxmwgyugoqanuoyebh"
readonly PRODUCTION_REF="fstpfqlgypvktjwdeagu"
readonly POSTGRES_IMAGE="public.ecr.aws/supabase/postgres:17.6.1.147"
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)";repository_dir="$(cd "${script_dir}/.." && pwd)";environment_file="${repository_dir}/.env.authz.local";migration_file="${repository_dir}/supabase/migrations/202608120005_workflow_transition_integrity.sql";evidence_dir="/tmp/roam-stabilization-phase6"
[[ -f "${environment_file}" && -f "${migration_file}" ]]||{ echo "BLOCKED: isolated environment or Phase 6 migration is missing.";exit 2; }
set -a;source "${environment_file}";set +a
: "${AUTHZ_TEST_PROJECT_REF:?}": "${AUTHZ_TEST_SUPABASE_URL:?}": "${AUTHZ_TEST_DB_URL:?}": "${AUTHZ_TEST_ISOLATED_PROJECT:?}"
if [[ "${AUTHZ_TEST_PROJECT_REF}" != "${ISOLATED_REF}" || "${AUTHZ_TEST_SUPABASE_URL}" != "https://${ISOLATED_REF}.supabase.co" || "${AUTHZ_TEST_ISOLATED_PROJECT}" != "true" || "${AUTHZ_TEST_DB_URL}" != *"${ISOLATED_REF}"* || "${AUTHZ_TEST_DB_URL}" == *"${PRODUCTION_REF}"* ]];then echo "BLOCKED: isolated-project safety gate failed.";exit 2;fi
for role in JOURNEY_DESIGNER PARTNER_MANAGER FINANCE OPERATIONS CONTENT_MARKETING SUPER_ADMIN;do email="AUTHZ_TEST_${role}_EMAIL";password="AUTHZ_TEST_${role}_PASSWORD";[[ "${!email:-}" == *@roamceylon.test && -n "${!password:-}" ]]||{ echo "BLOCKED: a disposable synthetic identity is missing.";exit 2;};done
docker info >/dev/null 2>&1||{ echo "BLOCKED: Docker Desktop is not available.";exit 2;};mkdir -p "${evidence_dir}";chmod 700 "${evidence_dir}";cd "${repository_dir}"
echo "Safety gate passed: isolated project only; production rejected."
marker="$(docker run --rm "${POSTGRES_IMAGE}" psql "${AUTHZ_TEST_DB_URL}" -X --set ON_ERROR_STOP=1 -Atc "select
 (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in('execute_enquiry_transition','accept_journey_proposal_command','request_journey_proposal_changes_command','transition_journey_proposal_command','execute_curated_journey_transition'))
 +(select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='enquiry_lifecycle_history' and c.relkind='r')
 +(select count(*) from pg_trigger where not tgisinternal and tgname in('enquiries_guard_status_transition','curated_journeys_guard_status_transition'))
 +(select count(*) from public.permissions where code in('journey.lifecycle.manage','journey.lifecycle.override'))
 +(select count(*) from public.staff_role_permissions where (role_code='journey_designer' and permission_code='journey.lifecycle.manage') or (role_code='super_admin' and permission_code in('journey.lifecycle.manage','journey.lifecycle.override')));"|tr -d '[:space:]')"
if [[ "${marker}" == "13" ]];then echo "Phase 6 migration already detected; skipping application.";elif [[ "${marker}" == "0" ]];then docker run --rm -v "${migration_file}:/phase6.sql:ro" "${POSTGRES_IMAGE}" psql "${AUTHZ_TEST_DB_URL}" -X --set ON_ERROR_STOP=1 --single-transaction -f /phase6.sql >/dev/null;else echo "BLOCKED: partial Phase 6 database state detected.";exit 2;fi
docker run --rm "${POSTGRES_IMAGE}" psql "${AUTHZ_TEST_DB_URL}" -X --set ON_ERROR_STOP=1 -Atc "do \$verify\$ begin
  if (select count(*) from pg_views where schemaname='public' and viewname in('public_accommodations','public_vehicles','public_guides','website_public_settings'))<>4 then raise exception 'Phase 2 public boundary regression';end if;
  if not exists(select 1 from public.staff_role_permissions where role_code='journey_designer' and permission_code='journey.design.edit') then raise exception 'Phase 3 capability regression';end if;
  if (select count(*) from pg_policies where schemaname='storage' and tablename='objects' and policyname in('travel_content_cms_insert','partner_storage_staff_insert','accounting_receipts_finance_insert'))<>3 then raise exception 'Phase 4 Storage regression';end if;
  if (select count(*) from pg_views where schemaname='public' and viewname in('traveller_journey_design','traveller_operations_context','traveller_finance_reference','traveller_supplier_context','traveller_admin_full'))<>5 then raise exception 'Phase 5 PII boundary regression';end if;
  if has_table_privilege('authenticated','public.enquiries','UPDATE') then raise exception 'Generic authenticated enquiry update remains';end if;
end \$verify\$;" >/dev/null
echo "Phase 2-5 focused structural regression and direct-write gates passed."
node --env-file="${environment_file}" tests/phase6-workflow-authorization.mjs | tee "${evidence_dir}/workflow-matrix.json";chmod 600 "${evidence_dir}/workflow-matrix.json"
echo "PHASE 6 WORKFLOW INTEGRITY VERIFIED: isolated project only."
