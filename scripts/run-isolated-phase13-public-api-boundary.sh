#!/usr/bin/env bash
set -euo pipefail

readonly ISOLATED_REF="xnsxmwgyugoqanuoyebh" PRODUCTION_REF="fstpfqlgypvktjwdeagu" POSTGRES_IMAGE="public.ecr.aws/supabase/postgres:17.6.1.147"
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)";repository_dir="$(cd "${script_dir}/.." && pwd)";environment_file="${repository_dir}/.env.authz.local";migration_file="${repository_dir}/supabase/migrations/202608120013_public_api_boundary_integrity.sql";evidence_dir="/tmp/roam-stabilization-phase13"
[[ -f "${environment_file}" && -f "${migration_file}" ]]||{ echo "BLOCKED: isolated environment or Phase 13 migration is missing.";exit 2;}
set -a
# shellcheck disable=SC1090
source "${environment_file}"
set +a
: "${AUTHZ_TEST_PROJECT_REF:?Missing isolated project ref}";: "${AUTHZ_TEST_SUPABASE_URL:?Missing isolated project URL}";: "${AUTHZ_TEST_SUPABASE_PUBLISHABLE_KEY:?Missing isolated publishable key}";: "${AUTHZ_TEST_SUPABASE_SERVICE_ROLE_KEY:?Missing isolated service key}";: "${AUTHZ_TEST_DB_URL:?Missing isolated database URL}";: "${AUTHZ_TEST_ISOLATED_PROJECT:?Missing isolated confirmation}"
if [[ "${AUTHZ_TEST_PROJECT_REF}" != "${ISOLATED_REF}" || "${AUTHZ_TEST_SUPABASE_URL}" != "https://${ISOLATED_REF}.supabase.co" || "${AUTHZ_TEST_ISOLATED_PROJECT}" != "true" || "${AUTHZ_TEST_DB_URL}" != *"${ISOLATED_REF}"* || "${AUTHZ_TEST_PROJECT_REF}" == "${PRODUCTION_REF}" || "${AUTHZ_TEST_SUPABASE_URL}" == *"${PRODUCTION_REF}"* || "${AUTHZ_TEST_DB_URL}" == *"${PRODUCTION_REF}"* ]];then echo "BLOCKED: isolated-project safety gate failed.";exit 2;fi
for role in JOURNEY_DESIGNER PARTNER_MANAGER FINANCE OPERATIONS CONTENT_MARKETING SUPER_ADMIN;do email="AUTHZ_TEST_${role}_EMAIL";password="AUTHZ_TEST_${role}_PASSWORD";[[ "${!email:-}" == *@roamceylon.test && -n "${!password:-}" ]]||{ echo "BLOCKED: a disposable synthetic identity is missing.";exit 2;};done
docker info >/dev/null 2>&1||{ echo "BLOCKED: Docker Desktop is not available.";exit 2;};mkdir -p "${evidence_dir}";chmod 700 "${evidence_dir}";shasum -a 256 "${migration_file}"|awk '{print $1}' >"${evidence_dir}/migration.sha256";chmod 600 "${evidence_dir}/migration.sha256";cd "${repository_dir}"
psql_cmd(){ docker run --rm "${POSTGRES_IMAGE}" psql "${AUTHZ_TEST_DB_URL}" -X --set ON_ERROR_STOP=1 "$@"; }
fixture_count(){ psql_cmd -Atc "select (select count(*) from public.enquiries where email like 'phase13-%@roamceylon.test')+(select count(*) from public.partner_applications where email like 'phase13-%@roamceylon.test');"|tr -d '[:space:]'; }
cleanup(){
  psql_cmd -q -c "begin;select set_config('request.jwt.claim.role','service_role',true);select set_config('roam.phase12_synthetic_cleanup','on',true);
    delete from public.journey_proposal_acceptances where proposal_id in(select proposal.id from public.journey_proposals proposal join public.enquiries enquiry on enquiry.id=proposal.enquiry_id where enquiry.email like 'phase13-%@roamceylon.test');
    delete from public.journey_proposal_change_requests where proposal_id in(select proposal.id from public.journey_proposals proposal join public.enquiries enquiry on enquiry.id=proposal.enquiry_id where enquiry.email like 'phase13-%@roamceylon.test');
    delete from public.journey_proposals where enquiry_id in(select id from public.enquiries where email like 'phase13-%@roamceylon.test');
    delete from public.enquiry_lifecycle_history where enquiry_id in(select id from public.enquiries where email like 'phase13-%@roamceylon.test');
    delete from public.curated_journeys where enquiry_id in(select id from public.enquiries where email like 'phase13-%@roamceylon.test');
    delete from public.enquiries where email like 'phase13-%@roamceylon.test';
    delete from public.partner_onboarding_command_receipts where application_id in(select id from public.partner_applications where email like 'phase13-%@roamceylon.test');
    delete from public.partner_application_history where application_id in(select id from public.partner_applications where email like 'phase13-%@roamceylon.test');
    delete from public.partner_application_files where application_id in(select id from public.partner_applications where email like 'phase13-%@roamceylon.test');
    delete from public.partner_applications where email like 'phase13-%@roamceylon.test';commit;" >/dev/null
}
safe_cleanup(){ cleanup >/dev/null 2>&1||true; };trap safe_cleanup EXIT
echo "Safety gate passed: isolated project only; production rejected."
marker="$(psql_cmd -Atc "select (exists(select 1 from information_schema.columns where table_schema='public' and table_name='enquiries' and column_name='public_submission_key'))::int+(exists(select 1 from information_schema.columns where table_schema='public' and table_name='partner_applications' and column_name='public_submission_key'))::int+(not has_table_privilege('anon','public.enquiries','INSERT'))::int;"|tr -d '[:space:]')"
if [[ "${marker}" == "3" ]];then echo "Phase 13 migration already detected; preserving isolated state and skipping migration application.";elif [[ "${marker}" == "0" ]];then docker run --rm -v "${migration_file}:/phase13.sql:ro" "${POSTGRES_IMAGE}" psql "${AUTHZ_TEST_DB_URL}" -X --set ON_ERROR_STOP=1 --single-transaction -f /phase13.sql >"${evidence_dir}/migration.log" 2>&1||{ chmod 600 "${evidence_dir}/migration.log";echo "BLOCKED: Phase 13 migration failed; private diagnostics retained.";exit 2;};chmod 600 "${evidence_dir}/migration.log";else echo "BLOCKED: partial Phase 13 database state detected; migration was not reapplied.";exit 2;fi
psql_cmd -Atc "do \$verify\$
declare leaked_columns integer;
begin
  if to_regclass('public.themes') is null then raise exception 'Phase 2 regression: published theme source is missing';end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='themes' and policyname='themes_public_read' and 'anon'=any(roles) and coalesce(qual,'') ilike '%status%published%' and coalesce(qual,'') ilike '%active%') then raise exception 'Phase 2 regression: published theme anonymous RLS policy is missing or malformed';end if;
  if to_regclass('public.public_accommodations') is null then raise exception 'Phase 2 regression: accommodation public projection is missing';end if;
  if to_regclass('public.public_vehicles') is null then raise exception 'Phase 2 regression: vehicle public projection is missing';end if;
  if to_regclass('public.public_guides') is null then raise exception 'Phase 2 regression: guide public projection is missing';end if;
  if to_regclass('public.website_public_settings') is null then raise exception 'Phase 2 regression: website public projection is missing';end if;
  select count(*) into leaked_columns from information_schema.columns where table_schema='public' and (
    (table_name='public_accommodations' and column_name in('phone','email','website','booking_url','partner_account_id','subscription_plan','nightly_rate_usd','pricing_tier','status','active','is_sample')) or
    (table_name='public_vehicles' and column_name in('phone','email','website','provider_name','partner_account_id','subscription_plan','daily_rate_usd','per_km_rate_usd','status','active','is_sample')) or
    (table_name='public_guides' and column_name in('phone','email','licence_number','partner_account_id','subscription_plan','daily_rate_usd','status','active','is_sample')) or
    (table_name='website_public_settings' and column_name in('maintenance_mode','partner_registration_available','setup_checklist','setup_dismissed','updated_at','updated_by','business_registration_number','sltda_registration_number'))
  );
  if leaked_columns<>0 then raise exception 'Phase 2 regression: a public projection exposes a forbidden private column';end if;
  if has_table_privilege('anon','public.accommodations','SELECT') or has_table_privilege('anon','public.vehicles','SELECT') or has_table_privilege('anon','public.guides','SELECT') or has_table_privilege('anon','public.website_settings','SELECT') then raise exception 'Phase 2 regression: anonymous protected base-table SELECT privilege exists';end if;
  if not has_table_privilege('anon','public.public_accommodations','SELECT') then raise exception 'Phase 2 regression: accommodation projection anonymous SELECT is missing';end if;
  if not has_table_privilege('anon','public.public_vehicles','SELECT') then raise exception 'Phase 2 regression: vehicle projection anonymous SELECT is missing';end if;
  if not has_table_privilege('anon','public.public_guides','SELECT') then raise exception 'Phase 2 regression: guide projection anonymous SELECT is missing';end if;
  if not has_table_privilege('anon','public.website_public_settings','SELECT') then raise exception 'Phase 2 regression: website projection anonymous SELECT is missing';end if;
  if to_regprocedure('public.current_staff_permissions()') is null then raise exception 'Phase 3 regression: capability read function is missing';end if;
  if (select count(*) from pg_views where schemaname='public' and viewname in('traveller_journey_design','traveller_operations_context','traveller_finance_reference','traveller_supplier_context','traveller_admin_full'))<>5 then raise exception 'Phase 5 regression: one or more canonical purpose-limited traveller views are missing';end if;
  if has_table_privilege('authenticated','public.enquiries','SELECT') then raise exception 'Phase 5 regression: authenticated complete enquiry base-row SELECT has been restored';end if;
  if has_table_privilege('anon','public.traveller_journey_design','SELECT') or has_table_privilege('anon','public.traveller_operations_context','SELECT') or has_table_privilege('anon','public.traveller_finance_reference','SELECT') or has_table_privilege('anon','public.traveller_supplier_context','SELECT') or has_table_privilege('anon','public.traveller_admin_full','SELECT') then raise exception 'Phase 5 regression: anonymous access exists on a purpose-limited traveller view';end if;
  if not has_table_privilege('authenticated','public.traveller_journey_design','SELECT') or not has_table_privilege('authenticated','public.traveller_operations_context','SELECT') or not has_table_privilege('authenticated','public.traveller_finance_reference','SELECT') or not has_table_privilege('authenticated','public.traveller_supplier_context','SELECT') or not has_table_privilege('authenticated','public.traveller_admin_full','SELECT') then raise exception 'Phase 5 regression: authenticated access grant is missing from a purpose-limited traveller view';end if;
  if exists(select 1 from information_schema.columns where table_schema='public' and table_name='traveller_supplier_context' and column_name in('name','email','phone','nationality','summary','trip_state','traveller_notes','internal_notes','estimate_snapshot')) then raise exception 'Phase 5 regression: supplier context exposes a forbidden identity, contact, note, or estimate field';end if;
  if exists(select 1 from information_schema.columns where table_schema='public' and table_name='traveller_finance_reference' and column_name in('email','phone','nationality','summary','trip_state','traveller_notes','internal_notes','estimate_snapshot')) then raise exception 'Phase 5 regression: Finance reference exposes non-minimal traveller fields';end if;
  if exists(select 1 from information_schema.columns where table_schema='public' and table_name='traveller_operations_context' and column_name in('email','summary','trip_state','internal_notes','estimate_snapshot')) then raise exception 'Phase 5 regression: Operations context exposes forbidden traveller fields';end if;
  if to_regprocedure('public.execute_enquiry_transition(uuid,text,uuid,text)') is null then raise exception 'Phase 6 regression: enquiry transition command is missing';end if;
  if to_regprocedure('public.accept_journey_proposal_command(uuid,text,text,jsonb)') is null then raise exception 'Phase 7 regression: proposal acceptance command is missing';end if;
  if to_regprocedure('public.record_accounting_transaction_command(uuid,uuid,text,numeric,numeric,date,text,text,text,text,uuid,text,uuid,jsonb)') is null then raise exception 'Phase 8 regression: accounting transaction command is missing';end if;
  if to_regprocedure('public.save_supplier_allocations_command(uuid,uuid,jsonb,uuid,text)') is null then raise exception 'Phase 9 regression: supplier allocation command is missing';end if;
  if to_regprocedure('public.execute_operational_journey_command(uuid,text,uuid,text,text)') is null then raise exception 'Phase 10 regression: operational journey command is missing';end if;
  if to_regprocedure('public.read_admin_dashboard()') is null then raise exception 'Phase 11 regression: admin dashboard read model is missing';end if;
  if to_regprocedure('public.review_partner_application_command(uuid,text,uuid,text,text)') is null then raise exception 'Phase 12 regression: partner review command is missing';end if;
  if has_table_privilege('anon','public.enquiries','INSERT') then raise exception 'Phase 13 regression: anonymous enquiry INSERT grant remains';end if;
end \$verify\$;" >/dev/null
echo "Phase 2-12 focused structural regression gates passed."
if [[ "$(fixture_count)" != "0" ]];then echo "Synthetic Phase 13 fixtures detected; cleaning canonical phase13 email markers.";cleanup;fi
[[ "$(fixture_count)" == "0" ]]||{ echo "BLOCKED: Phase 13 synthetic pre-clean did not reach zero.";exit 2;};echo "PHASE 13 SYNTHETIC PRE-CLEAN VERIFIED: isolated project only."
psql_cmd -qAtc "notify pgrst,'reload schema';" >/dev/null
if ! node --env-file="${environment_file}" tests/phase13-public-api-boundary.mjs|tee "${evidence_dir}/public-api-matrix.json";then chmod 600 "${evidence_dir}/public-api-matrix.json";echo "BLOCKED: Phase 13 matrix failed; sanitized diagnostics retained.";exit 2;fi
chmod 600 "${evidence_dir}/public-api-matrix.json";cleanup;[[ "$(fixture_count)" == "0" ]]||{ echo "BLOCKED: post-matrix Phase 13 cleanup verification failed.";exit 2;};trap - EXIT
echo "Synthetic public-boundary cleanup passed."
echo "PHASE 13 PUBLIC/API BOUNDARY VERIFIED: isolated project only."
