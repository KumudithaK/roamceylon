#!/usr/bin/env bash
set -euo pipefail
readonly ISOLATED_REF="xnsxmwgyugoqanuoyebh" PRODUCTION_REF="fstpfqlgypvktjwdeagu" POSTGRES_IMAGE="public.ecr.aws/supabase/postgres:17.6.1.147"
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)";repository_dir="$(cd "${script_dir}/.." && pwd)";environment_file="${repository_dir}/.env.authz.local";migration_file="${repository_dir}/supabase/migrations/202608120008_supplier_allocation_integrity.sql";followup_file="${repository_dir}/supabase/migrations/202608120009_supplier_allocation_pricing_enum_compatibility.sql";evidence_dir="/tmp/roam-stabilization-phase9"
[[ -f "${environment_file}" && -f "${migration_file}" && -f "${followup_file}" ]]||{ echo "BLOCKED: isolated environment or Phase 9 migration is missing.";exit 2;}
set -a
# shellcheck disable=SC1090
source "${environment_file}"
set +a
: "${AUTHZ_TEST_PROJECT_REF:?Missing isolated project ref}";: "${AUTHZ_TEST_SUPABASE_URL:?Missing isolated project URL}";: "${AUTHZ_TEST_SUPABASE_PUBLISHABLE_KEY:?Missing isolated publishable key}";: "${AUTHZ_TEST_SUPABASE_SERVICE_ROLE_KEY:?Missing isolated service key}";: "${AUTHZ_TEST_DB_URL:?Missing isolated database URL}";: "${AUTHZ_TEST_ISOLATED_PROJECT:?Missing isolated confirmation}"
if [[ "${AUTHZ_TEST_PROJECT_REF}" != "${ISOLATED_REF}" || "${AUTHZ_TEST_SUPABASE_URL}" != "https://${ISOLATED_REF}.supabase.co" || "${AUTHZ_TEST_ISOLATED_PROJECT}" != "true" || "${AUTHZ_TEST_DB_URL}" != *"${ISOLATED_REF}"* || "${AUTHZ_TEST_PROJECT_REF}" == "${PRODUCTION_REF}" || "${AUTHZ_TEST_SUPABASE_URL}" == *"${PRODUCTION_REF}"* || "${AUTHZ_TEST_DB_URL}" == *"${PRODUCTION_REF}"* ]];then echo "BLOCKED: isolated-project safety gate failed.";exit 2;fi
for role in JOURNEY_DESIGNER PARTNER_MANAGER FINANCE OPERATIONS CONTENT_MARKETING SUPER_ADMIN;do email="AUTHZ_TEST_${role}_EMAIL";password="AUTHZ_TEST_${role}_PASSWORD";[[ "${!email:-}" == *@roamceylon.test && -n "${!password:-}" ]]||{ echo "BLOCKED: a disposable synthetic identity is missing.";exit 2;};done
docker info >/dev/null 2>&1||{ echo "BLOCKED: Docker Desktop is not available.";exit 2;};mkdir -p "${evidence_dir}";chmod 700 "${evidence_dir}";shasum -a 256 "${migration_file}"|awk '{print $1}' >"${evidence_dir}/migration.sha256";chmod 600 "${evidence_dir}/migration.sha256";cd "${repository_dir}"
psql_cmd(){ docker run --rm "${POSTGRES_IMAGE}" psql "${AUTHZ_TEST_DB_URL}" -X --set ON_ERROR_STOP=1 "$@"; }
cleanup_script="${script_dir}/cleanup-isolated-phase9-fixtures.sh"
[[ -x "${cleanup_script}" ]]||{ echo "BLOCKED: canonical Phase 9 fixture cleanup is unavailable.";exit 2;}
cleanup(){ "${cleanup_script}" >/dev/null 2>&1 || true; }
trap cleanup EXIT
echo "Safety gate passed: isolated project only; production rejected."
marker="$(psql_cmd -Atc "select (to_regprocedure('public.save_supplier_allocations_command(uuid,uuid,jsonb,uuid,text)') is not null)::int+(to_regprocedure('public.transition_supplier_allocation_command(uuid,text,uuid,text,text)') is not null)::int+(to_regprocedure('public.update_supplier_fulfilment_command(uuid,uuid,text,text,text,text)') is not null)::int+(to_regclass('public.journey_supplier_allocation_history') is not null)::int+(exists(select 1 from pg_trigger where tgname='journey_supplier_allocations_integrity_guard' and not tgisinternal))::int;"|tr -d '[:space:]')"
if [[ "${marker}" == "5" ]];then echo "Phase 9 migration already detected; preserving isolated state and skipping migration application.";elif [[ "${marker}" == "0" ]];then docker run --rm -v "${migration_file}:/phase9.sql:ro" "${POSTGRES_IMAGE}" psql "${AUTHZ_TEST_DB_URL}" -X --set ON_ERROR_STOP=1 --single-transaction -f /phase9.sql >"${evidence_dir}/migration.log" 2>&1||{ chmod 600 "${evidence_dir}/migration.log";echo "BLOCKED: Phase 9 migration failed; private diagnostics retained.";exit 2;};chmod 600 "${evidence_dir}/migration.log";else echo "BLOCKED: partial Phase 9 database state detected; migration was not reapplied.";exit 2;fi
enum_fix="$(psql_cmd -Atc "select (pg_get_functiondef('private.validate_supplier_allocation(public.journey_supplier_allocations)'::regprocedure) like '%plan_row.entity_type::text<>allocation.allocation_type%')::int+(pg_get_functiondef('public.save_supplier_allocations_command(uuid,uuid,jsonb,uuid,text)'::regprocedure) like '%plan_row.entity_type::text<>item->>''allocation_type''%')::int;"|tr -d '[:space:]')"
if [[ "${enum_fix}" == "2" ]];then echo "Phase 9 enum compatibility follow-up already detected; preserving isolated state.";elif [[ "${enum_fix}" == "0" ]];then docker run --rm -v "${followup_file}:/phase9-followup.sql:ro" "${POSTGRES_IMAGE}" psql "${AUTHZ_TEST_DB_URL}" -X --set ON_ERROR_STOP=1 --single-transaction -f /phase9-followup.sql >"${evidence_dir}/followup-migration.log" 2>&1||{ chmod 600 "${evidence_dir}/followup-migration.log";echo "BLOCKED: Phase 9 enum compatibility follow-up failed; private diagnostics retained.";exit 2;};chmod 600 "${evidence_dir}/followup-migration.log";else echo "BLOCKED: partial Phase 9 enum compatibility state detected; follow-up was not applied.";exit 2;fi
psql_cmd -Atc "do \$verify\$ begin if to_regprocedure('public.record_accounting_transaction_command(uuid,uuid,text,numeric,numeric,date,text,text,text,text,uuid,text,uuid,jsonb)') is null then raise exception 'Phase 8 regression';end if;if to_regprocedure('public.accept_journey_proposal_command(uuid,text,text,jsonb)') is null then raise exception 'Phase 7 regression';end if;if to_regprocedure('public.execute_enquiry_transition(uuid,text,uuid,text)') is null then raise exception 'Phase 6 regression';end if;if has_table_privilege('authenticated','public.journey_supplier_allocations','INSERT') or has_table_privilege('authenticated','public.journey_supplier_allocations','UPDATE') or has_table_privilege('authenticated','public.journey_supplier_allocations','DELETE') then raise exception 'generic allocation DML remains granted';end if;if (select count(*) from pg_views where schemaname='public' and viewname in('public_accommodations','website_public_settings'))<>2 then raise exception 'Phase 2 regression';end if;if (select count(*) from pg_views where schemaname='public' and viewname in('traveller_supplier_context','traveller_finance_reference'))<>2 then raise exception 'Phase 5 regression';end if;end \$verify\$;" >/dev/null
psql_cmd -qAtc "notify pgrst,'reload schema';" >/dev/null
echo "Phase 2-8 structural authorization, workflow, proposal and accounting gates passed."
"${cleanup_script}"
rm -f "${evidence_dir}/matrix-diagnostics.json"
export AUTHZ_TEST_DIAGNOSTIC_FILE="${evidence_dir}/matrix-diagnostics.json"
if ! node --env-file="${environment_file}" tests/phase9-supplier-allocation-integrity.mjs|tee "${evidence_dir}/allocation-matrix.json";then
  chmod 600 "${evidence_dir}/allocation-matrix.json";[[ ! -f "${evidence_dir}/matrix-diagnostics.json" ]]||chmod 600 "${evidence_dir}/matrix-diagnostics.json"
  echo "BLOCKED: Phase 9 matrix failed; sanitized private diagnostics retained."
  exit 2
fi
chmod 600 "${evidence_dir}/allocation-matrix.json"
"${cleanup_script}";trap - EXIT
echo "Synthetic supplier-allocation cleanup passed."
echo "PHASE 9 SUPPLIER ALLOCATION INTEGRITY VERIFIED: isolated project only."
