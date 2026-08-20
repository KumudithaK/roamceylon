#!/usr/bin/env bash
set -euo pipefail

readonly ISOLATED_REF="xnsxmwgyugoqanuoyebh" PRODUCTION_REF="fstpfqlgypvktjwdeagu" POSTGRES_IMAGE="public.ecr.aws/supabase/postgres:17.6.1.147"
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)";repository_dir="$(cd "${script_dir}/.." && pwd)";environment_file="${repository_dir}/.env.authz.local";evidence_dir="/tmp/roam-stabilization-phase15"
[[ -f "${environment_file}" ]]||{ echo "BLOCKED: isolated environment is missing.";exit 2;}
set -a
# shellcheck disable=SC1090
source "${environment_file}"
set +a
: "${AUTHZ_TEST_PROJECT_REF:?Missing isolated project ref}";: "${AUTHZ_TEST_SUPABASE_URL:?Missing isolated project URL}";: "${AUTHZ_TEST_SUPABASE_PUBLISHABLE_KEY:?Missing isolated publishable key}";: "${AUTHZ_TEST_SUPABASE_SERVICE_ROLE_KEY:?Missing isolated service key}";: "${AUTHZ_TEST_DB_URL:?Missing isolated database URL}";: "${AUTHZ_TEST_ISOLATED_PROJECT:?Missing isolated confirmation}"
if [[ "${AUTHZ_TEST_PROJECT_REF}" != "${ISOLATED_REF}" || "${AUTHZ_TEST_SUPABASE_URL}" != "https://${ISOLATED_REF}.supabase.co" || "${AUTHZ_TEST_ISOLATED_PROJECT}" != "true" || "${AUTHZ_TEST_DB_URL}" != *"${ISOLATED_REF}"* || "${AUTHZ_TEST_PROJECT_REF}" == "${PRODUCTION_REF}" || "${AUTHZ_TEST_SUPABASE_URL}" == *"${PRODUCTION_REF}"* || "${AUTHZ_TEST_DB_URL}" == *"${PRODUCTION_REF}"* ]];then echo "BLOCKED: isolated-project safety gate failed.";exit 2;fi
for role in JOURNEY_DESIGNER PARTNER_MANAGER FINANCE OPERATIONS CONTENT_MARKETING SUPER_ADMIN;do email="AUTHZ_TEST_${role}_EMAIL";password="AUTHZ_TEST_${role}_PASSWORD";[[ "${!email:-}" == *@roamceylon.test && -n "${!password:-}" ]]||{ echo "BLOCKED: a disposable synthetic identity is missing.";exit 2;};done
docker info >/dev/null 2>&1||{ echo "BLOCKED: Docker Desktop is not available.";exit 2;};mkdir -p "${evidence_dir}";chmod 700 "${evidence_dir}";cd "${repository_dir}"
psql_cmd(){ docker run --rm "${POSTGRES_IMAGE}" psql "${AUTHZ_TEST_DB_URL}" -X --set ON_ERROR_STOP=1 "$@"; }

# Canonical Phase 15 predicate: phase15-* synthetic enquiry/application email,
# phase15-* content/supplier slug, and catalogue provenance rooted at a marked
# application. Pre-clean, post-clean and stale-fixture checks share this predicate.
fixture_count(){ psql_cmd -Atc "select
  (select count(*) from public.enquiries where email like 'phase15-%@roamceylon.test')+
  (select count(*) from public.partner_applications where email like 'phase15-%@roamceylon.test')+
  (select count(*) from public.destinations where slug like 'phase15-%')+
  (select count(*) from public.accommodations where slug like 'phase15-%' or onboarding_application_id in(select id from public.partner_applications where email like 'phase15-%@roamceylon.test'))+
  (select count(*) from public.journey_accounts where traveller_email like 'phase15-%@roamceylon.test')+
  (select count(*) from public.staff_security_events where actor_id in(select id from auth.users where email='${AUTHZ_TEST_CONTENT_MARKETING_EMAIL}') and safe_metadata->>'path' in(select '/api/admin/partner-applications/'||id::text||'/review' from public.partner_applications where email like 'phase15-%@roamceylon.test'));"|tr -d '[:space:]'; }
cleanup(){
  psql_cmd -q -c "begin;
    select set_config('request.jwt.claim.role','service_role',true);
    select set_config('roam.phase14_synthetic_cleanup','on',true);
    select set_config('roam.phase8_cleanup','on',true);select set_config('roam.financial_command','on',true);
    select set_config('roam.phase10_cleanup','on',true);select set_config('roam.allocation_command','cleanup',true);
    select set_config('roam.phase12_synthetic_cleanup','on',true);
    create temporary table phase15_enquiries on commit drop as select id from public.enquiries where email like 'phase15-%@roamceylon.test';
    create temporary table phase15_accounts on commit drop as select id from public.journey_accounts where enquiry_id in(select id from phase15_enquiries) or traveller_email like 'phase15-%@roamceylon.test';
    create temporary table phase15_applications on commit drop as select id from public.partner_applications where email like 'phase15-%@roamceylon.test';
    create temporary table phase15_stays on commit drop as select id from public.accommodations where slug like 'phase15-%' or onboarding_application_id in(select id from phase15_applications);
    create temporary table phase15_destinations on commit drop as select id from public.destinations where slug like 'phase15-%';
    create temporary table phase15_settlements on commit drop as select id from public.journey_settlements where account_id in(select id from phase15_accounts);
    create temporary table phase15_cancellations on commit drop as select id from public.journey_cancellation_cases where account_id in(select id from phase15_accounts);
    delete from public.staff_security_events where actor_id in(select id from auth.users where email='${AUTHZ_TEST_CONTENT_MARKETING_EMAIL}') and safe_metadata->>'path' in(select '/api/admin/partner-applications/'||id::text||'/review' from phase15_applications);
    delete from public.journey_operational_command_receipts where enquiry_id in(select id from phase15_enquiries);
    delete from public.supplier_recoverability_history where settlement_id in(select id from phase15_settlements) or cancellation_case_id in(select id from phase15_cancellations);
    delete from public.accounting_attachments where account_id in(select id from phase15_accounts);
    delete from public.accounting_transactions where account_id in(select id from phase15_accounts);
    delete from public.accounting_lifecycle_history where account_id in(select id from phase15_accounts);
    delete from public.journey_cancellation_cases where id in(select id from phase15_cancellations);
    delete from public.journey_benefits where enquiry_id in(select id from phase15_enquiries);
    delete from public.journey_settlements where id in(select id from phase15_settlements);
    delete from public.journey_supplier_allocation_history where enquiry_id in(select id from phase15_enquiries);
    delete from public.supplier_allocation_command_receipts where enquiry_id in(select id from phase15_enquiries);
    delete from public.journey_supplier_allocations where enquiry_id in(select id from phase15_enquiries);
    delete from public.journey_accounts where id in(select id from phase15_accounts);
    delete from public.journey_proposal_change_requests where proposal_id in(select p.id from public.journey_proposals p where p.enquiry_id in(select id from phase15_enquiries));
    delete from public.journey_proposal_acceptances where proposal_id in(select p.id from public.journey_proposals p where p.enquiry_id in(select id from phase15_enquiries));
    delete from public.journey_proposals where enquiry_id in(select id from phase15_enquiries);
    delete from public.curated_journey_changes where curated_journey_id in(select j.id from public.curated_journeys j where j.enquiry_id in(select id from phase15_enquiries));
    delete from public.curated_journeys where enquiry_id in(select id from phase15_enquiries);
    delete from public.enquiry_lifecycle_history where enquiry_id in(select id from phase15_enquiries);
    delete from public.enquiries where id in(select id from phase15_enquiries);
    delete from public.pricing_plans where entity_type::text='accommodation' and entity_id in(select id from phase15_stays);
    delete from public.accommodations where id in(select id from phase15_stays);
    delete from public.partner_onboarding_command_receipts where application_id in(select id from phase15_applications);
    delete from public.partner_application_history where application_id in(select id from phase15_applications);
    delete from public.partner_application_files where application_id in(select id from phase15_applications);
    delete from public.partner_applications where id in(select id from phase15_applications);
    delete from public.destinations where id in(select id from phase15_destinations);
    commit;" >/dev/null
}
safe_cleanup(){ cleanup >/dev/null 2>&1||true; };trap safe_cleanup EXIT

echo "Safety gate passed: isolated project only; production rejected."
psql_cmd -Atc "do \$verify\$
declare stabilization_count integer;
begin
  select count(*) into stabilization_count from (values
    ('public.public_accommodations'::regclass),('public.staff_role_permissions'::regclass),('public.traveller_journey_design'::regclass),('public.enquiry_lifecycle_history'::regclass),
    ('public.journey_proposal_acceptances'::regclass),('public.journey_accounts'::regclass),('public.journey_supplier_allocations'::regclass),('public.journey_operational_command_receipts'::regclass),
    ('public.staff_journey_request_summary'::regclass),('public.partner_onboarding_command_receipts'::regclass),('public.staff_audit_event_index'::regclass)
  ) objects(name);
  if stabilization_count<>11 then raise exception 'Phase 2-14 regression: stabilized object inventory incomplete';end if;
  if to_regprocedure('public.current_staff_permissions()') is null then raise exception 'Phase 3 regression: capability model missing';end if;
  if to_regprocedure('public.execute_enquiry_transition(uuid,text,uuid,text)') is null then raise exception 'Phase 6 regression: lifecycle command missing';end if;
  if to_regprocedure('public.accept_journey_proposal_command(uuid,text,text,jsonb)') is null then raise exception 'Phase 7 regression: proposal acceptance missing';end if;
  if to_regprocedure('public.record_accounting_transaction_command(uuid,uuid,text,numeric,numeric,date,text,text,text,text,uuid,text,uuid,jsonb)') is null then raise exception 'Phase 8 regression: accounting command missing';end if;
  if to_regprocedure('public.save_supplier_allocations_command(uuid,uuid,jsonb,uuid,text)') is null then raise exception 'Phase 9 regression: allocation command missing';end if;
  if to_regprocedure('public.execute_operational_journey_command(uuid,text,uuid,text,text)') is null then raise exception 'Phase 10 regression: operations command missing';end if;
  if to_regprocedure('public.read_admin_dashboard()') is null then raise exception 'Phase 11 regression: dashboard read model missing';end if;
  if to_regprocedure('public.review_partner_application_command(uuid,text,uuid,text,text)') is null then raise exception 'Phase 12 regression: onboarding command missing';end if;
  if has_table_privilege('anon','public.enquiries','INSERT') or has_table_privilege('anon','public.partner_applications','INSERT') then raise exception 'Phase 13 regression: direct public mutation grant exists';end if;
  if has_table_privilege('anon','public.staff_audit_event_index','SELECT') or has_table_privilege('authenticated','public.staff_security_events','UPDATE') then raise exception 'Phase 14 regression: audit boundary weakened';end if;
  if has_table_privilege('authenticated','public.enquiries','SELECT') then raise exception 'Phase 5 regression: complete traveller base-row grant exists';end if;
end \$verify\$;" >/dev/null
echo "Phase 2-14 focused structural release gates passed."
canonical_stabilization_migrations=(
  "202608120001_public_data_boundaries.sql"
  "202608120002_staff_capability_architecture.sql"
  "202608120003_capability_rls_storage_cutover.sql"
  "202608120004_traveller_pii_boundaries.sql"
  "202608120005_workflow_transition_integrity.sql"
  "202608120006_proposal_acceptance_integrity.sql"
  "202608120007_accounting_integrity.sql"
  "202608120008_supplier_allocation_integrity.sql"
  "202608120009_supplier_allocation_pricing_enum_compatibility.sql"
  "202608120010_operational_fulfilment_integrity.sql"
  "202608120011_admin_read_model_integrity.sql"
  "202608120012_partner_onboarding_integrity.sql"
  "202608120013_public_api_boundary_integrity.sql"
  "202608120014_audit_observability_integrity.sql"
)
canonical_names=" ${canonical_stabilization_migrations[*]} "
for migration in "${canonical_stabilization_migrations[@]}";do
  [[ -f "supabase/migrations/${migration}" ]]||{ echo "BLOCKED: required stabilization migration is missing: ${migration}";exit 2;}
done
actual_stabilization_count=0
while IFS= read -r migration_path;do
  migration_name="${migration_path##*/}";migration_version="${migration_name%%_*}"
  if [[ "${migration_version}" =~ ^[0-9]{12}$ ]]&&((10#${migration_version}>=10#202608120001&&10#${migration_version}<=10#202608120014));then
    ((actual_stabilization_count+=1))
    [[ "${canonical_names}" == *" ${migration_name} "* ]]||{ echo "BLOCKED: unexpected migration exists inside the Phase 2-14 stabilization version range: ${migration_name}";exit 2;}
  fi
done < <(find supabase/migrations -maxdepth 1 -type f -name '*.sql' | sort)
[[ "${actual_stabilization_count}" == "${#canonical_stabilization_migrations[@]}" ]]||{ echo "BLOCKED: repository Phase 2-14 migration manifest does not match the canonical inventory.";exit 2;}
duplicate_versions="$(find supabase/migrations -maxdepth 1 -type f -name '*.sql' -exec basename {} \;|cut -d_ -f1|sort|uniq -d)"
[[ -z "${duplicate_versions}" ]]||{ echo "BLOCKED: duplicate repository migration version detected.";exit 2;}
echo "Canonical Phase 2-14 migration manifest and unique version ordering verified."
echo "Isolated hosted migration bookkeeping remains intentionally unrestored per the Phase 1 checkpoint; executable schema state is verified independently."
count="$(fixture_count)";if [[ "${count}" != "0" ]];then echo "Synthetic Phase 15 inventory detected: ${count} aggregate fixture roots. Cleaning with canonical predicate.";cleanup;fi
[[ "$(fixture_count)" == "0" ]]||{ echo "BLOCKED: Phase 15 synthetic pre-clean did not reach zero.";exit 2;}
echo "PHASE 15 SYNTHETIC PRE-CLEAN VERIFIED: isolated project only."
psql_cmd -qAtc "notify pgrst,'reload schema';" >/dev/null
rm -f "${evidence_dir}/matrix-diagnostics.json";export AUTHZ_TEST_DIAGNOSTIC_FILE="${evidence_dir}/matrix-diagnostics.json"
if ! node --env-file="${environment_file}" tests/phase15-end-to-end-integrity.mjs|tee "${evidence_dir}/end-to-end-matrix.json";then chmod 600 "${evidence_dir}/end-to-end-matrix.json";[[ ! -f "${evidence_dir}/matrix-diagnostics.json" ]]||chmod 600 "${evidence_dir}/matrix-diagnostics.json";echo "BLOCKED: Phase 15 matrix failed; sanitized private diagnostics retained.";exit 2;fi
chmod 600 "${evidence_dir}/end-to-end-matrix.json";cleanup;[[ "$(fixture_count)" == "0" ]]||{ echo "BLOCKED: post-matrix Phase 15 cleanup verification failed.";exit 2;};trap - EXIT
echo "Synthetic end-to-end cleanup passed."
echo "PHASE 15 END-TO-END SYSTEM INTEGRITY VERIFIED: isolated project only."
