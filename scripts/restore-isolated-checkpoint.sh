#!/usr/bin/env bash

set -euo pipefail

readonly ISOLATED_REF="xnsxmwgyugoqanuoyebh"
readonly PRODUCTION_REF="fstpfqlgypvktjwdeagu"
readonly POSTGRES_IMAGE="public.ecr.aws/supabase/postgres:17.6.1.147"
readonly SCHEMA_SHA256="a011e830b757cc74c200c492253270033592d1beba703d3bf15ffda6a8d2e6eb"
readonly DATA_SHA256="fa250f095a5dc9cdbb9cda52f8fe14640b558a97a8ab66fa45d365ff7e423878"
readonly ROLES_SHA256="168a95a9c745af5ed4679751f90419ac9dc434240a213b03e32a06d5664c2308"
readonly RESTORE_DATA_SHA256="5e1eaa99599f6cb5fb5252aed821f0fe717959d7ccfe919b862114d23a0bf83d"
readonly RESTORE_ROLES_SHA256="0867bd8085fd6f1064997ce04fd1fec79e3e91a5dbee8af35b4ce4743ee9e3c8"
RESTORE_WORK_DIR=""

cleanup_restore_work_dir() {
  if [[ -n "${RESTORE_WORK_DIR}" &&
        -d "${RESTORE_WORK_DIR}" &&
        "${RESTORE_WORK_DIR}" == "${TMPDIR:-/tmp}/roam-isolated-restore."* ]]; then
    rm -rf -- "${RESTORE_WORK_DIR}"
  fi
}

verify_sha256() {
  local file="$1"
  local expected="$2"
  local actual
  actual="$(shasum -a 256 "${file}" | awk '{print $1}')"
  if [[ "${actual}" != "${expected}" ]]; then
    echo "BLOCKED: checksum mismatch for $(basename "${file}")."
    exit 2
  fi
}

run_inside_container() {
  : "${AUTHZ_TEST_PROJECT_REF:?Missing isolated project ref}"
  : "${AUTHZ_TEST_SUPABASE_URL:?Missing isolated project URL}"
  : "${AUTHZ_TEST_DB_URL:?Missing isolated database URL}"
  : "${AUTHZ_TEST_ISOLATED_PROJECT:?Missing isolated-project confirmation}"

  if [[ "${AUTHZ_TEST_PROJECT_REF}" != "${ISOLATED_REF}" ]] ||
     [[ "${AUTHZ_TEST_SUPABASE_URL}" != "https://${ISOLATED_REF}.supabase.co" ]] ||
     [[ "${AUTHZ_TEST_ISOLATED_PROJECT}" != "true" ]] ||
     [[ "${AUTHZ_TEST_DB_URL}" != *"${ISOLATED_REF}"* ]] ||
     [[ "${AUTHZ_TEST_DB_URL}" == *"${PRODUCTION_REF}"* ]]; then
    echo "BLOCKED: isolated-project safety check failed."
    exit 2
  fi

  local preflight_result
  preflight_result="$(
    psql "${AUTHZ_TEST_DB_URL}" \
      -XAtq \
      --variable ON_ERROR_STOP=1 \
      --file /restore-work/preflight.sql
  )"

  local application_relations application_functions auth_users storage_buckets storage_objects extra
  IFS='|' read -r application_relations application_functions auth_users storage_buckets storage_objects extra <<<"${preflight_result}"

  if [[ -n "${extra:-}" ]] ||
     [[ ! "${application_relations:-}" =~ ^[0-9]+$ ]] ||
     [[ ! "${application_functions:-}" =~ ^[0-9]+$ ]] ||
     [[ ! "${auth_users:-}" =~ ^[0-9]+$ ]] ||
     [[ ! "${storage_buckets:-}" =~ ^[0-9]+$ ]] ||
     [[ ! "${storage_objects:-}" =~ ^[0-9]+$ ]]; then
    echo "BLOCKED: preflight returned an unexpected result."
    exit 2
  fi

  echo "Preflight: application relations=${application_relations}"
  echo "Preflight: application functions=${application_functions}"
  echo "Preflight: auth users=${auth_users}"
  echo "Preflight: storage buckets=${storage_buckets}"
  echo "Preflight: storage objects=${storage_objects}"

  if (( application_relations != 0 ||
        application_functions != 0 ||
        auth_users != 0 ||
        storage_buckets != 0 ||
        storage_objects != 0 )); then
    echo "BLOCKED: isolated project is not empty; restore was not attempted."
    exit 3
  fi

  echo "Preflight passed: isolated project is empty."
  echo "Starting atomic isolated restore..."

  if ! psql "${AUTHZ_TEST_DB_URL}" \
    -Xq \
    --single-transaction \
    --variable ON_ERROR_STOP=1 \
    --file /backup/pre-stabilization-roles.restore.sql \
    --file /backup/pre-stabilization-schema.sql \
    --file /backup/pre-stabilization-data.restore.sql \
    > /restore-diagnostics/restore.log 2>&1; then
    chmod 600 /restore-diagnostics/restore.log
    echo "RESTORE FAILED: transaction rolled back. The private mode-600 restore log was retained outside Git and was not printed."
    exit 4
  fi

  chmod 600 /restore-diagnostics/restore.log
  echo "RESTORE COMPLETED: isolated project only."
}

run_from_host() {
  local script_dir repository_dir environment_file backup_dir diagnostics_dir work_dir file
  script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  repository_dir="$(cd "${script_dir}/.." && pwd)"
  environment_file="${repository_dir}/.env.authz.local"
  backup_dir="/tmp/roam-stabilization-phase1"
  diagnostics_dir="${backup_dir}/restore-diagnostics"

  if [[ ! -f "${environment_file}" ]]; then
    echo "BLOCKED: .env.authz.local was not found."
    exit 2
  fi

  for file in \
    pre-stabilization-roles.sql \
    pre-stabilization-roles.restore.sql \
    pre-stabilization-schema.sql \
    pre-stabilization-data.sql \
    pre-stabilization-data.restore.sql; do
    if [[ ! -s "${backup_dir}/${file}" ]]; then
      echo "BLOCKED: required non-empty backup artifact is missing: ${file}"
      exit 2
    fi
  done

  verify_sha256 "${backup_dir}/pre-stabilization-schema.sql" "${SCHEMA_SHA256}"
  verify_sha256 "${backup_dir}/pre-stabilization-data.sql" "${DATA_SHA256}"
  verify_sha256 "${backup_dir}/pre-stabilization-roles.sql" "${ROLES_SHA256}"
  verify_sha256 "${backup_dir}/pre-stabilization-data.restore.sql" "${RESTORE_DATA_SHA256}"
  verify_sha256 "${backup_dir}/pre-stabilization-roles.restore.sql" "${RESTORE_ROLES_SHA256}"

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
     [[ "${AUTHZ_TEST_DB_URL}" == *"${PRODUCTION_REF}"* ]]; then
    echo "BLOCKED: .env.authz.local does not identify only the authorized isolated project."
    exit 2
  fi

  work_dir="$(mktemp -d "${TMPDIR:-/tmp}/roam-isolated-restore.XXXXXX")"
  RESTORE_WORK_DIR="${work_dir}"
  chmod 700 "${work_dir}"
  trap cleanup_restore_work_dir EXIT

  mkdir -p "${diagnostics_dir}"
  chmod 700 "${diagnostics_dir}"
  : > "${diagnostics_dir}/restore.log"
  chmod 600 "${diagnostics_dir}/restore.log"

  cat > "${work_dir}/preflight.sql" <<'SQL'
SELECT
  (
    SELECT count(*)
    FROM pg_class AS c
    JOIN pg_namespace AS n ON n.oid = c.relnamespace
    WHERE n.nspname IN ('public', 'private')
      AND c.relkind IN ('r', 'p', 'v', 'm', 'f', 'S')
  )::text
  || '|' ||
  (
    SELECT count(*)
    FROM pg_proc AS p
    JOIN pg_namespace AS n ON n.oid = p.pronamespace
    WHERE n.nspname IN ('public', 'private')
  )::text
  || '|' || (SELECT count(*) FROM auth.users)::text
  || '|' || (SELECT count(*) FROM storage.buckets)::text
  || '|' || (SELECT count(*) FROM storage.objects)::text;
SQL

  chmod 600 "${work_dir}/preflight.sql"

  echo "Safety check passed: isolated project confirmed."

  docker run --rm \
    --env-file "${environment_file}" \
    --env ROAM_RESTORE_IN_CONTAINER=1 \
    --volume "${backup_dir}:/backup:ro" \
    --volume "${diagnostics_dir}:/restore-diagnostics" \
    --volume "${work_dir}:/restore-work" \
    --volume "${script_dir}/restore-isolated-checkpoint.sh:/restore-runner.sh:ro" \
    --entrypoint /bin/bash \
    "${POSTGRES_IMAGE}" \
    /restore-runner.sh
}

if [[ "${ROAM_RESTORE_IN_CONTAINER:-0}" == "1" ]]; then
  run_inside_container
else
  run_from_host
fi
