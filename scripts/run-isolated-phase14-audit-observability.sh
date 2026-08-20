#!/usr/bin/env bash
set -euo pipefail

readonly ISOLATED_REF="xnsxmwgyugoqanuoyebh" PRODUCTION_REF="fstpfqlgypvktjwdeagu" POSTGRES_IMAGE="public.ecr.aws/supabase/postgres:17.6.1.147"
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)";repository_dir="$(cd "${script_dir}/.." && pwd)";environment_file="${repository_dir}/.env.authz.local";migration_file="${repository_dir}/supabase/migrations/202608120014_audit_observability_integrity.sql";evidence_dir="/tmp/roam-stabilization-phase14"
[[ -f "${environment_file}" && -f "${migration_file}" ]]||{ echo "BLOCKED: isolated environment or Phase 14 migration is missing.";exit 2;}
set -a
# shellcheck disable=SC1090
source "${environment_file}"
set +a
: "${AUTHZ_TEST_PROJECT_REF:?Missing isolated project ref}";: "${AUTHZ_TEST_SUPABASE_URL:?Missing isolated project URL}";: "${AUTHZ_TEST_SUPABASE_PUBLISHABLE_KEY:?Missing isolated publishable key}";: "${AUTHZ_TEST_SUPABASE_SERVICE_ROLE_KEY:?Missing isolated service key}";: "${AUTHZ_TEST_DB_URL:?Missing isolated database URL}";: "${AUTHZ_TEST_ISOLATED_PROJECT:?Missing isolated confirmation}"
if [[ "${AUTHZ_TEST_PROJECT_REF}" != "${ISOLATED_REF}" || "${AUTHZ_TEST_SUPABASE_URL}" != "https://${ISOLATED_REF}.supabase.co" || "${AUTHZ_TEST_ISOLATED_PROJECT}" != "true" || "${AUTHZ_TEST_DB_URL}" != *"${ISOLATED_REF}"* || "${AUTHZ_TEST_PROJECT_REF}" == "${PRODUCTION_REF}" || "${AUTHZ_TEST_SUPABASE_URL}" == *"${PRODUCTION_REF}"* || "${AUTHZ_TEST_DB_URL}" == *"${PRODUCTION_REF}"* ]];then echo "BLOCKED: isolated-project safety gate failed.";exit 2;fi
for role in JOURNEY_DESIGNER PARTNER_MANAGER FINANCE OPERATIONS CONTENT_MARKETING SUPER_ADMIN;do email="AUTHZ_TEST_${role}_EMAIL";password="AUTHZ_TEST_${role}_PASSWORD";[[ "${!email:-}" == *@roamceylon.test && -n "${!password:-}" ]]||{ echo "BLOCKED: a disposable synthetic identity is missing.";exit 2;};done
docker info >/dev/null 2>&1||{ echo "BLOCKED: Docker Desktop is not available.";exit 2;};mkdir -p "${evidence_dir}";chmod 700 "${evidence_dir}";shasum -a 256 "${migration_file}"|awk '{print $1}' >"${evidence_dir}/migration.sha256";chmod 600 "${evidence_dir}/migration.sha256";cd "${repository_dir}"
psql_cmd(){ docker run --rm "${POSTGRES_IMAGE}" psql "${AUTHZ_TEST_DB_URL}" -X --set ON_ERROR_STOP=1 "$@"; }
content_user_id(){ psql_cmd -Atc "select id from auth.users where email='${AUTHZ_TEST_CONTENT_MARKETING_EMAIL}' limit 1;"|tr -d '[:space:]'; }
cleanup(){
  local content_id;content_id="$(content_user_id)";[[ -n "${content_id}" ]]||return 1
  psql_cmd -q -c "begin;select set_config('request.jwt.claim.role','service_role',true);select set_config('roam.phase14_synthetic_cleanup','on',true);
    create temporary table phase14_enquiries on commit drop as select id from public.enquiries where email like 'phase14-%@roamceylon.test' and name like 'Phase Fourteen%';
    create temporary table phase14_destinations on commit drop as select id from public.destinations where slug like 'phase14-destination-%' and name='Phase Fourteen Destination';
    create temporary table phase14_stays on commit drop as select id from public.accommodations where slug like 'phase14-stay-%' and name='Phase Fourteen Stay';
    create temporary table phase14_applications on commit drop as select id from public.partner_applications where email like 'phase14-partner-%@roamceylon.test' and business_name='Phase Fourteen Partner';
    select set_config('roam.allocation_command','on',true);
    update public.journey_supplier_allocations set confirmation_status='pending',confirmed_at=null,confirmed_by=null,invoice_status='not_requested',arrival_instructions=null,special_notes=null,updated_at=now() where enquiry_id in(select id from phase14_enquiries);
    delete from public.journey_supplier_allocation_history where enquiry_id in(select id from phase14_enquiries);
    delete from public.supplier_allocation_command_receipts where enquiry_id in(select id from phase14_enquiries);
    select set_config('roam.allocation_command','cleanup',true);
    delete from public.journey_supplier_allocations where enquiry_id in(select id from phase14_enquiries);
    select set_config('roam.phase8_cleanup','on',true);select set_config('roam.financial_command','on',true);
    delete from public.accounting_attachments where account_id in(select id from public.journey_accounts where enquiry_id in(select id from phase14_enquiries));
    delete from public.accounting_lifecycle_history where account_id in(select id from public.journey_accounts where enquiry_id in(select id from phase14_enquiries));
    delete from public.accounting_transactions where account_id in(select id from public.journey_accounts where enquiry_id in(select id from phase14_enquiries));
    delete from public.journey_settlements where account_id in(select id from public.journey_accounts where enquiry_id in(select id from phase14_enquiries));
    delete from public.journey_accounts where enquiry_id in(select id from phase14_enquiries);
    delete from public.enquiry_lifecycle_history where enquiry_id in(select id from public.enquiries where email like 'phase14-%@roamceylon.test');
    delete from public.enquiries where id in(select id from phase14_enquiries);
    delete from public.pricing_plans where entity_type='accommodation' and entity_id in(select id from phase14_stays);
    delete from public.accommodations where id in(select id from phase14_stays);
    delete from public.destinations where id in(select id from phase14_destinations);
    select set_config('roam.phase12_synthetic_cleanup','on',true);
    delete from public.partner_onboarding_command_receipts where application_id in(select id from phase14_applications);
    delete from public.partner_application_history where application_id in(select id from phase14_applications);
    delete from public.partner_application_files where application_id in(select id from phase14_applications);
    delete from public.partner_applications where id in(select id from phase14_applications);
    delete from public.profile_staff_roles where profile_id='${content_id}'::uuid and role_code='journey_designer';
    delete from public.staff_security_events where actor_id in(select id from auth.users where email='${AUTHZ_TEST_JOURNEY_DESIGNER_EMAIL}') and safe_metadata->>'path'='/api/admin/partner-applications/synthetic/convert';
    delete from public.staff_authority_history where target_profile_id='${content_id}'::uuid and target_role_code='journey_designer';commit;" >/dev/null
}
fixture_count(){ local content_id;content_id="$(content_user_id)";psql_cmd -Atc "select (select count(*) from public.enquiries where email like 'phase14-%@roamceylon.test')+(select count(*) from public.destinations where slug like 'phase14-destination-%')+(select count(*) from public.accommodations where slug like 'phase14-stay-%')+(select count(*) from public.partner_applications where email like 'phase14-partner-%@roamceylon.test')+(select count(*) from public.profile_staff_roles where profile_id='${content_id}'::uuid and role_code='journey_designer')+(select count(*) from public.staff_authority_history where target_profile_id='${content_id}'::uuid and target_role_code='journey_designer')+(select count(*) from public.staff_security_events where actor_id in(select id from auth.users where email='${AUTHZ_TEST_JOURNEY_DESIGNER_EMAIL}') and safe_metadata->>'path'='/api/admin/partner-applications/synthetic/convert');"|tr -d '[:space:]'; }
safe_cleanup(){ cleanup >/dev/null 2>&1||true; };trap safe_cleanup EXIT
echo "Safety gate passed: isolated project only; production rejected."
marker="$(psql_cmd -Atc "select (to_regclass('public.staff_authority_history') is not null)::int+(to_regclass('public.staff_security_events') is not null)::int+(to_regclass('public.staff_audit_event_index') is not null)::int+(to_regprocedure('public.record_staff_authorization_denial(uuid,text,text[],text,text,uuid)') is not null)::int;"|tr -d '[:space:]')"
if [[ "${marker}" == "4" ]];then echo "Phase 14 migration already detected; preserving isolated state and skipping migration application.";elif [[ "${marker}" == "0" ]];then docker run --rm -v "${migration_file}:/phase14.sql:ro" "${POSTGRES_IMAGE}" psql "${AUTHZ_TEST_DB_URL}" -X --set ON_ERROR_STOP=1 --single-transaction -f /phase14.sql >"${evidence_dir}/migration.log" 2>&1||{ chmod 600 "${evidence_dir}/migration.log";echo "BLOCKED: Phase 14 migration failed; private diagnostics retained.";exit 2;};chmod 600 "${evidence_dir}/migration.log";else echo "BLOCKED: partial Phase 14 database state detected; migration was not reapplied.";exit 2;fi
psql_cmd -Atc "do \$verify\$
begin
  if to_regprocedure('public.current_staff_permissions()') is null then raise exception 'Phase 3 regression: capability model missing';end if;
  if to_regprocedure('public.execute_enquiry_transition(uuid,text,uuid,text)') is null then raise exception 'Phase 6 regression: lifecycle command missing';end if;
  if to_regprocedure('public.accept_journey_proposal_command(uuid,text,text,jsonb)') is null then raise exception 'Phase 7 regression: proposal acceptance missing';end if;
  if to_regprocedure('public.record_accounting_transaction_command(uuid,uuid,text,numeric,numeric,date,text,text,text,text,uuid,text,uuid,jsonb)') is null then raise exception 'Phase 8 regression: finance command missing';end if;
  if to_regprocedure('public.save_supplier_allocations_command(uuid,uuid,jsonb,uuid,text)') is null then raise exception 'Phase 9 regression: allocation command missing';end if;
  if to_regprocedure('public.execute_operational_journey_command(uuid,text,uuid,text,text)') is null then raise exception 'Phase 10 regression: operations command missing';end if;
  if to_regprocedure('public.review_partner_application_command(uuid,text,uuid,text,text)') is null then raise exception 'Phase 12 regression: onboarding command missing';end if;
  if has_table_privilege('anon','public.staff_audit_event_index','SELECT') then raise exception 'Phase 14: anonymous audit privilege exists';end if;
  if has_table_privilege('authenticated','public.staff_authority_history','INSERT') or has_table_privilege('authenticated','public.staff_security_events','UPDATE') then raise exception 'Phase 14: staff audit mutation privilege exists';end if;
end \$verify\$;" >/dev/null
echo "Phase 2-13 focused structural regression gates passed."
if [[ "$(fixture_count)" != "0" ]];then echo "Synthetic Phase 14 fixtures detected; cleaning canonical markers.";cleanup;fi
[[ "$(fixture_count)" == "0" ]]||{ echo "BLOCKED: Phase 14 synthetic pre-clean did not reach zero.";exit 2;};echo "PHASE 14 SYNTHETIC PRE-CLEAN VERIFIED: isolated project only."
psql_cmd -qAtc "notify pgrst,'reload schema';" >/dev/null
if ! node --env-file="${environment_file}" tests/phase14-audit-observability.mjs|tee "${evidence_dir}/audit-matrix.json";then chmod 600 "${evidence_dir}/audit-matrix.json";echo "BLOCKED: Phase 14 matrix failed; sanitized diagnostics retained.";exit 2;fi
chmod 600 "${evidence_dir}/audit-matrix.json";cleanup;[[ "$(fixture_count)" == "0" ]]||{ echo "BLOCKED: post-matrix Phase 14 cleanup verification failed.";exit 2;};trap - EXIT
echo "Synthetic audit-observability cleanup passed."
echo "PHASE 14 AUDIT AND OBSERVABILITY VERIFIED: isolated project only."
