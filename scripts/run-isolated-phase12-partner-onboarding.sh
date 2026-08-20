#!/usr/bin/env bash
set -euo pipefail
readonly ISOLATED_REF="xnsxmwgyugoqanuoyebh" PRODUCTION_REF="fstpfqlgypvktjwdeagu" POSTGRES_IMAGE="public.ecr.aws/supabase/postgres:17.6.1.147"
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)";repository_dir="$(cd "${script_dir}/.." && pwd)";environment_file="${repository_dir}/.env.authz.local";migration_file="${repository_dir}/supabase/migrations/202608120012_partner_onboarding_integrity.sql";evidence_dir="/tmp/roam-stabilization-phase12"
[[ -f "${environment_file}" && -f "${migration_file}" ]]||{ echo "BLOCKED: isolated environment or Phase 12 migration is missing.";exit 2;}
set -a
# shellcheck disable=SC1090
source "${environment_file}"
set +a
: "${AUTHZ_TEST_PROJECT_REF:?Missing isolated project ref}";: "${AUTHZ_TEST_SUPABASE_URL:?Missing isolated project URL}";: "${AUTHZ_TEST_SUPABASE_PUBLISHABLE_KEY:?Missing isolated publishable key}";: "${AUTHZ_TEST_SUPABASE_SERVICE_ROLE_KEY:?Missing isolated service key}";: "${AUTHZ_TEST_DB_URL:?Missing isolated database URL}";: "${AUTHZ_TEST_ISOLATED_PROJECT:?Missing isolated confirmation}"
if [[ "${AUTHZ_TEST_PROJECT_REF}" != "${ISOLATED_REF}" || "${AUTHZ_TEST_SUPABASE_URL}" != "https://${ISOLATED_REF}.supabase.co" || "${AUTHZ_TEST_ISOLATED_PROJECT}" != "true" || "${AUTHZ_TEST_DB_URL}" != *"${ISOLATED_REF}"* || "${AUTHZ_TEST_PROJECT_REF}" == "${PRODUCTION_REF}" || "${AUTHZ_TEST_SUPABASE_URL}" == *"${PRODUCTION_REF}"* || "${AUTHZ_TEST_DB_URL}" == *"${PRODUCTION_REF}"* ]];then echo "BLOCKED: isolated-project safety gate failed.";exit 2;fi
for role in JOURNEY_DESIGNER PARTNER_MANAGER FINANCE OPERATIONS CONTENT_MARKETING SUPER_ADMIN;do email="AUTHZ_TEST_${role}_EMAIL";password="AUTHZ_TEST_${role}_PASSWORD";[[ "${!email:-}" == *@roamceylon.test && -n "${!password:-}" ]]||{ echo "BLOCKED: a disposable synthetic identity is missing.";exit 2;};done
docker info >/dev/null 2>&1||{ echo "BLOCKED: Docker Desktop is not available.";exit 2;};mkdir -p "${evidence_dir}";chmod 700 "${evidence_dir}";shasum -a 256 "${migration_file}"|awk '{print $1}' >"${evidence_dir}/migration.sha256";chmod 600 "${evidence_dir}/migration.sha256";cd "${repository_dir}"
psql_cmd(){ docker run --rm "${POSTGRES_IMAGE}" psql "${AUTHZ_TEST_DB_URL}" -X --set ON_ERROR_STOP=1 "$@"; }

# Canonical Phase 12 predicate: phase12-* synthetic email/slug markers plus
# application provenance rooted at those marked applications.
fixture_count(){ psql_cmd -Atc "select
  (select count(*) from public.partner_applications where email like 'phase12-%@roamceylon.test')+
  (select count(*) from public.accommodations where slug like 'phase12-%' or onboarding_application_id in(select id from public.partner_applications where email like 'phase12-%@roamceylon.test'))+
  (select count(*) from public.vehicles where slug like 'phase12-%' or onboarding_application_id in(select id from public.partner_applications where email like 'phase12-%@roamceylon.test'))+
  (select count(*) from public.guides where slug like 'phase12-%' or onboarding_application_id in(select id from public.partner_applications where email like 'phase12-%@roamceylon.test'))+
  (select count(*) from public.enquiries where email like 'phase12-%@roamceylon.test')+
  (select count(*) from public.destinations where slug like 'phase12-%');"|tr -d '[:space:]'; }
cleanup(){
  node --env-file="${environment_file}" scripts/cleanup-isolated-phase12-storage.mjs >/dev/null
  psql_cmd -q -c "begin;select set_config('request.jwt.claim.role','service_role',true);select set_config('roam.phase12_synthetic_cleanup','on',true);select set_config('roam.allocation_command','cleanup',true);
    delete from public.journey_supplier_allocation_history where enquiry_id in(select id from public.enquiries where email like 'phase12-%@roamceylon.test');
    delete from public.supplier_allocation_command_receipts where enquiry_id in(select id from public.enquiries where email like 'phase12-%@roamceylon.test');
    delete from public.journey_supplier_allocations where enquiry_id in(select id from public.enquiries where email like 'phase12-%@roamceylon.test');
    delete from public.enquiry_lifecycle_history where enquiry_id in(select id from public.enquiries where email like 'phase12-%@roamceylon.test');
    delete from public.curated_journeys where enquiry_id in(select id from public.enquiries where email like 'phase12-%@roamceylon.test');
    delete from public.enquiries where email like 'phase12-%@roamceylon.test';
    delete from public.pricing_plans where (entity_type::text='accommodation' and entity_id in(select id from public.accommodations where slug like 'phase12-%' or onboarding_application_id in(select id from public.partner_applications where email like 'phase12-%@roamceylon.test'))) or (entity_type::text='guide' and entity_id in(select id from public.guides where slug like 'phase12-%' or onboarding_application_id in(select id from public.partner_applications where email like 'phase12-%@roamceylon.test'))) or (entity_type::text='vehicle' and entity_id in(select id from public.vehicles where slug like 'phase12-%' or onboarding_application_id in(select id from public.partner_applications where email like 'phase12-%@roamceylon.test')));
    delete from public.accommodations where slug like 'phase12-%' or onboarding_application_id in(select id from public.partner_applications where email like 'phase12-%@roamceylon.test');
    delete from public.vehicles where slug like 'phase12-%' or onboarding_application_id in(select id from public.partner_applications where email like 'phase12-%@roamceylon.test');
    delete from public.guides where slug like 'phase12-%' or onboarding_application_id in(select id from public.partner_applications where email like 'phase12-%@roamceylon.test');
    delete from public.partner_onboarding_command_receipts where application_id in(select id from public.partner_applications where email like 'phase12-%@roamceylon.test');
    delete from public.partner_application_history where application_id in(select id from public.partner_applications where email like 'phase12-%@roamceylon.test');
    delete from public.partner_application_files where application_id in(select id from public.partner_applications where email like 'phase12-%@roamceylon.test');
    delete from public.partner_applications where email like 'phase12-%@roamceylon.test';
    delete from public.destinations where slug like 'phase12-%';commit;" >/dev/null
}
safe_cleanup(){ cleanup >/dev/null 2>&1||true; };trap safe_cleanup EXIT
echo "Safety gate passed: isolated project only; production rejected."
marker="$(psql_cmd -Atc "select (to_regprocedure('public.review_partner_application_command(uuid,text,uuid,text,text)') is not null)::int+(to_regprocedure('public.convert_partner_application_command(uuid,uuid,text,text)') is not null)::int+(to_regclass('public.partner_onboarding_command_receipts') is not null)::int+(exists(select 1 from pg_trigger where tgname='journey_supplier_onboarding_eligibility' and not tgisinternal))::int+(exists(select 1 from information_schema.columns where table_schema='public' and table_name='partner_applications' and column_name='decision_snapshot'))::int;"|tr -d '[:space:]')"
if [[ "${marker}" == "5" ]];then echo "Phase 12 migration already detected; preserving isolated state and skipping migration application.";elif [[ "${marker}" == "0" ]];then docker run --rm -v "${migration_file}:/phase12.sql:ro" "${POSTGRES_IMAGE}" psql "${AUTHZ_TEST_DB_URL}" -X --set ON_ERROR_STOP=1 --single-transaction -f /phase12.sql >"${evidence_dir}/migration.log" 2>&1||{ chmod 600 "${evidence_dir}/migration.log";echo "BLOCKED: Phase 12 migration failed; private diagnostics retained.";exit 2;};chmod 600 "${evidence_dir}/migration.log";else echo "BLOCKED: partial Phase 12 database state detected; migration was not reapplied.";exit 2;fi
psql_cmd -Atc "do \$verify\$ begin
  if to_regprocedure('public.read_admin_dashboard()') is null then raise exception 'Phase 11 regression';end if;
  if to_regprocedure('public.execute_operational_journey_command(uuid,text,uuid,text,text)') is null then raise exception 'Phase 10 regression';end if;
  if to_regprocedure('public.save_supplier_allocations_command(uuid,uuid,jsonb,uuid,text)') is null then raise exception 'Phase 9 regression';end if;
  if to_regprocedure('public.record_accounting_transaction_command(uuid,uuid,text,numeric,numeric,date,text,text,text,text,uuid,text,uuid,jsonb)') is null then raise exception 'Phase 8 regression';end if;
  if to_regprocedure('public.accept_journey_proposal_command(uuid,text,text,jsonb)') is null then raise exception 'Phase 7 regression';end if;
  if to_regprocedure('public.execute_enquiry_transition(uuid,text,uuid,text)') is null then raise exception 'Phase 6 regression';end if;
  if (select count(*) from pg_views where schemaname='public' and viewname in('public_accommodations','website_public_settings','traveller_supplier_context'))<>3 then raise exception 'Phase 2/5 regression';end if;
  if has_table_privilege('authenticated','public.partner_applications','UPDATE') or has_table_privilege('authenticated','public.partner_application_history','INSERT') then raise exception 'direct onboarding mutation remains granted';end if;
end \$verify\$;" >/dev/null
echo "Phase 2-11 structural authorization and integrity gates passed."
count="$(fixture_count)";if [[ "${count}" != "0" ]];then echo "Synthetic Phase 12 inventory detected: ${count} aggregate fixture roots. Cleaning with canonical predicate.";cleanup;fi
[[ "$(fixture_count)" == "0" ]]||{ echo "BLOCKED: canonical Phase 12 synthetic cleanup did not reach zero.";exit 2;}
echo "PHASE 12 SYNTHETIC CLEANUP VERIFIED: isolated project only."
psql_cmd -qAtc "notify pgrst,'reload schema';" >/dev/null
rm -f "${evidence_dir}/matrix-diagnostics.json";export AUTHZ_TEST_DIAGNOSTIC_FILE="${evidence_dir}/matrix-diagnostics.json"
if ! node --env-file="${environment_file}" tests/phase12-partner-onboarding.mjs|tee "${evidence_dir}/onboarding-matrix.json";then chmod 600 "${evidence_dir}/onboarding-matrix.json";[[ ! -f "${evidence_dir}/matrix-diagnostics.json" ]]||chmod 600 "${evidence_dir}/matrix-diagnostics.json";echo "BLOCKED: Phase 12 matrix failed; sanitized private diagnostics retained.";exit 2;fi
chmod 600 "${evidence_dir}/onboarding-matrix.json";cleanup;[[ "$(fixture_count)" == "0" ]]||{ echo "BLOCKED: post-matrix Phase 12 cleanup verification failed.";exit 2;};trap - EXIT
echo "Synthetic partner-onboarding cleanup passed."
echo "PHASE 12 PARTNER ONBOARDING INTEGRITY VERIFIED: isolated project only."
