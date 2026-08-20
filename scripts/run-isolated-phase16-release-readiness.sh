#!/usr/bin/env bash
set -euo pipefail
umask 077

readonly ISOLATED_REF="xnsxmwgyugoqanuoyebh"
readonly PRODUCTION_REF="fstpfqlgypvktjwdeagu"
readonly CLEAN_PROJECT_ID="roamceylon_phase16"
readonly POSTGRES_IMAGE="public.ecr.aws/supabase/postgres:17.6.1.147"

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repository_dir="$(cd "${script_dir}/.." && pwd)"
environment_file="${repository_dir}/.env.authz.local"
evidence_dir="/tmp/roam-stabilization-phase16"
clean_root=""
clean_started="false"

safe_stop_cleanroom(){
  if [[ "${clean_started}" == "true" && -n "${clean_root}" ]]; then
    SUPABASE_TELEMETRY_DISABLED=1 XDG_CONFIG_HOME="${evidence_dir}/supabase-config" \
      npx supabase --workdir "${clean_root}" stop --project-id "${CLEAN_PROJECT_ID}" --no-backup \
      >"${evidence_dir}/cleanroom-stop.log" 2>&1 || true
  fi
  [[ -z "${clean_root}" ]] || rm -rf "${clean_root}"
}
trap safe_stop_cleanroom EXIT

[[ -f "${environment_file}" ]]||{ echo "BLOCKED: isolated environment is missing.";exit 2;}
mkdir -p "${evidence_dir}/supabase-config"
chmod 700 "${evidence_dir}" "${evidence_dir}/supabase-config"
cd "${repository_dir}"

set -a
# shellcheck disable=SC1090
source "${environment_file}"
set +a
: "${AUTHZ_TEST_PROJECT_REF:?Missing isolated project ref}"
: "${AUTHZ_TEST_SUPABASE_URL:?Missing isolated project URL}"
: "${AUTHZ_TEST_SUPABASE_PUBLISHABLE_KEY:?Missing isolated publishable key}"
: "${AUTHZ_TEST_SUPABASE_SERVICE_ROLE_KEY:?Missing isolated service key}"
: "${AUTHZ_TEST_DB_URL:?Missing isolated database URL}"
: "${AUTHZ_TEST_ISOLATED_PROJECT:?Missing isolated confirmation}"

if [[ "${AUTHZ_TEST_PROJECT_REF}" != "${ISOLATED_REF}" ||
      "${AUTHZ_TEST_SUPABASE_URL}" != "https://${ISOLATED_REF}.supabase.co" ||
      "${AUTHZ_TEST_ISOLATED_PROJECT}" != "true" ||
      "${AUTHZ_TEST_DB_URL}" != *"${ISOLATED_REF}"* ||
      "${AUTHZ_TEST_PROJECT_REF}" == "${PRODUCTION_REF}" ||
      "${AUTHZ_TEST_SUPABASE_URL}" == *"${PRODUCTION_REF}"* ||
      "${AUTHZ_TEST_DB_URL}" == *"${PRODUCTION_REF}"* ]];then
  echo "BLOCKED: isolated-project safety gate failed."
  exit 2
fi
for role in JOURNEY_DESIGNER PARTNER_MANAGER FINANCE OPERATIONS CONTENT_MARKETING SUPER_ADMIN;do
  email="AUTHZ_TEST_${role}_EMAIL";password="AUTHZ_TEST_${role}_PASSWORD"
  [[ "${!email:-}" == *@roamceylon.test && -n "${!password:-}" ]]||{ echo "BLOCKED: a disposable synthetic identity is missing.";exit 2;}
done
docker info >/dev/null 2>&1||{ echo "BLOCKED: Docker Desktop is not available.";exit 2;}
echo "Safety gate passed: disposable local clean room plus authorized isolated project; production rejected."

shasum -a 256 -c repository-migration-manifest.sha256 >"${evidence_dir}/repository-manifest.log"
shasum -a 256 -c stabilization-migration-manifest.sha256 >"${evidence_dir}/stabilization-manifest.log"
chmod 600 "${evidence_dir}/repository-manifest.log" "${evidence_dir}/stabilization-manifest.log"
[[ "$(wc -l < repository-migration-manifest.sha256 | tr -d '[:space:]')" == "84" ]]||{ echo "BLOCKED: frozen repository migration inventory is not 84 files.";exit 2;}
duplicate_versions="$(awk '{print $2}' repository-migration-manifest.sha256|xargs -n1 basename|cut -d_ -f1|sort|uniq -d)"
[[ -z "${duplicate_versions}" ]]||{ echo "BLOCKED: duplicate migration version exists in the frozen repository manifest.";exit 2;}
echo "Frozen 84-file repository migration chain and 14-file stabilization chain verified by SHA-256."

clean_root="$(mktemp -d /tmp/roam-phase16-cleanroom.XXXXXX)"
mkdir -p "${clean_root}/supabase"
cp supabase/config.toml "${clean_root}/supabase/config.toml"
cp supabase/seed.sql "${clean_root}/supabase/seed.sql"
perl -0pi -e 's/project_id = "roamceylon"/project_id = "roamceylon_phase16"/;
  s/port = 54321/port = 55321/;s/port = 54322/port = 55322/;s/shadow_port = 54320/shadow_port = 55320/;
  s/port = 54329/port = 55329/;s/port = 54323/port = 55323/;s/port = 54324/port = 55324/;
  s/# auto_expose_new_tables = true/auto_expose_new_tables = true/' "${clean_root}/supabase/config.toml"

SUPABASE_TELEMETRY_DISABLED=1 XDG_CONFIG_HOME="${evidence_dir}/supabase-config" \
  npx supabase --workdir "${clean_root}" start \
  --exclude analytics,edge-runtime,functions,imgproxy,inbucket,realtime,studio,vector \
  >"${evidence_dir}/cleanroom-start.log" 2>&1 || { chmod 600 "${evidence_dir}/cleanroom-start.log";echo "BLOCKED: disposable Supabase clean room could not start; private diagnostics retained.";exit 2;}
clean_started="true"
chmod 600 "${evidence_dir}/cleanroom-start.log"

clean_container="supabase_db_${CLEAN_PROJECT_ID}"
empty_relations="$(docker exec "${clean_container}" psql -XAt -U postgres -d postgres --set ON_ERROR_STOP=1 -c "select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','private') and c.relkind in ('r','p','v','m','S');"|tr -d '[:space:]')"
[[ "${empty_relations}" == "0" ]]||{ echo "BLOCKED: disposable database was not empty before repository migration application.";exit 2;}
echo "Clean-room preflight passed: application relations=0."

mkdir -p "${clean_root}/supabase/migrations"
for migration in \
  202607260001_content_marketplace.sql \
  202607260002_review_workflow_enums.sql \
  202607260003_full_cms.sql \
  202607260004_vehicle_description.sql \
  202607260005_v2_data_relationship_repair.sql;do
  cp "supabase/migrations/${migration}" "${clean_root}/supabase/migrations/${migration}"
done
SUPABASE_TELEMETRY_DISABLED=1 XDG_CONFIG_HOME="${evidence_dir}/supabase-config" \
  npx supabase --workdir "${clean_root}" db reset --local --no-seed \
  >"${evidence_dir}/cleanroom-bootstrap-schema.log" 2>&1 || { echo "BLOCKED: clean-room bootstrap schema failed; private diagnostics retained.";exit 2;}
SUPABASE_TELEMETRY_DISABLED=1 XDG_CONFIG_HOME="${evidence_dir}/supabase-config" \
  npx supabase --workdir "${clean_root}" status -o env >"${evidence_dir}/cleanroom.env" 2>"${evidence_dir}/cleanroom-status.log" || {
    echo "BLOCKED: clean-room connection metadata was unavailable; private diagnostics retained.";exit 2;
  }
set -a
# shellcheck disable=SC1090
source "${evidence_dir}/cleanroom.env"
set +a
: "${API_URL:?Clean-room API URL missing}"
: "${SERVICE_ROLE_KEY:?Clean-room service key missing}"
SUPABASE_URL="${API_URL}" SUPABASE_SERVICE_ROLE_KEY="${SERVICE_ROLE_KEY}" \
  IMPORT_REPORT_PATH="${evidence_dir}/cleanroom-import-report.json" \
  node scripts/import-json-to-supabase.mjs --confirm-import \
  >"${evidence_dir}/cleanroom-bootstrap-content.log" 2>&1 || {
    unset API_URL SERVICE_ROLE_KEY ANON_KEY JWT_SECRET DB_URL
    rm -f "${evidence_dir}/cleanroom.env"
    echo "BLOCKED: canonical clean-room content bootstrap failed; private diagnostics retained.";exit 2;
  }
unset API_URL SERVICE_ROLE_KEY ANON_KEY JWT_SECRET DB_URL
rm -f "${evidence_dir}/cleanroom.env"
rm -rf "${clean_root}/supabase/migrations"
cp -R supabase/migrations "${clean_root}/supabase/migrations"
SUPABASE_TELEMETRY_DISABLED=1 XDG_CONFIG_HOME="${evidence_dir}/supabase-config" \
  npx supabase --workdir "${clean_root}" migration up --local --include-all \
  >"${evidence_dir}/cleanroom-migrations.log" 2>&1 || { echo "BLOCKED: clean-room migration chain failed; private diagnostics retained.";exit 2;}
chmod 600 "${evidence_dir}/cleanroom-migrations.log"

clean_migration_count="$(docker exec "${clean_container}" psql -XAt -U postgres -d postgres --set ON_ERROR_STOP=1 -c "select count(*) from supabase_migrations.schema_migrations;"|tr -d '[:space:]')"
[[ "${clean_migration_count}" == "84" ]]||{ echo "BLOCKED: clean-room migration history is incomplete.";exit 2;}
docker exec "${clean_container}" psql -XAt -U postgres -d postgres --set ON_ERROR_STOP=1 -c "do \$verify\$
declare missing text;disabled_rls integer;unvalidated integer;
begin
  select string_agg(name,', ') into missing from (values
    ('public.themes'::text),('public.enquiries'),('public.journey_proposals'),('public.journey_accounts'),
    ('public.journey_supplier_allocations'),('public.partner_applications'),('public.staff_audit_event_index'),
    ('public.public_accommodations'),('public.staff_journey_request_summary')
  ) required(name) where to_regclass(name) is null;
  if missing is not null then raise exception 'missing clean-room relations: %',missing;end if;
  if to_regprocedure('public.current_staff_permissions()') is null
    or to_regprocedure('public.accept_journey_proposal_command(uuid,text,text,jsonb)') is null
    or to_regprocedure('public.record_accounting_transaction_command(uuid,uuid,text,numeric,numeric,date,text,text,text,text,uuid,text,uuid,jsonb)') is null
    or to_regprocedure('public.save_supplier_allocations_command(uuid,uuid,jsonb,uuid,text)') is null
    or to_regprocedure('public.execute_operational_journey_command(uuid,text,uuid,text,text)') is null
    or to_regprocedure('public.read_admin_dashboard()') is null then
      raise exception 'clean-room command/read-model function inventory incomplete';
  end if;
  select count(*) into disabled_rls from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relkind in('r','p') and not c.relrowsecurity;
  if disabled_rls<>0 then raise exception 'clean-room public tables without RLS: %',disabled_rls;end if;
  select count(*) into unvalidated from pg_constraint con join pg_namespace n on n.oid=con.connamespace
    where n.nspname in('public','private') and not con.convalidated;
  if unvalidated<>0 then raise exception 'clean-room unvalidated constraints: %',unvalidated;end if;
end \$verify\$;" >/dev/null

docker exec -i "${clean_container}" psql -XAt -U postgres -d postgres --set ON_ERROR_STOP=1 \
  < scripts/sql/phase16-schema-fingerprint.sql >"${evidence_dir}/cleanroom-fingerprint.txt"
docker run --rm -i "${POSTGRES_IMAGE}" psql "${AUTHZ_TEST_DB_URL}" -XAt --set ON_ERROR_STOP=1 \
  < scripts/sql/phase16-schema-fingerprint.sql >"${evidence_dir}/isolated-fingerprint.txt"
chmod 600 "${evidence_dir}/cleanroom-fingerprint.txt" "${evidence_dir}/isolated-fingerprint.txt"
if ! diff -u "${evidence_dir}/cleanroom-fingerprint.txt" "${evidence_dir}/isolated-fingerprint.txt" >"${evidence_dir}/fingerprint.diff";then
  chmod 600 "${evidence_dir}/fingerprint.diff"
  echo "BLOCKED: clean-room and accumulated isolated schema fingerprints differ; safe category diagnostics retained."
  exit 2
fi
rm -f "${evidence_dir}/fingerprint.diff"
echo "CLEAN-ROOM MIGRATION REHEARSAL PASSED: 84/84 migrations; schema and required system-data fingerprints match isolated baseline."

safe_stop_cleanroom
clean_started="false";clean_root=""
trap - EXIT

./scripts/run-isolated-phase15-end-to-end-integrity.sh
echo "PHASE 16 RELEASE READINESS VERIFIED: clean room plus isolated critical regression only."
