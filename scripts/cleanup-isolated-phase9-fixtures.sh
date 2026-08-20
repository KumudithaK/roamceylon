#!/usr/bin/env bash
set -euo pipefail

readonly ISOLATED_REF="xnsxmwgyugoqanuoyebh"
readonly PRODUCTION_REF="fstpfqlgypvktjwdeagu"
readonly POSTGRES_IMAGE="public.ecr.aws/supabase/postgres:17.6.1.147"

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repository_dir="$(cd "${script_dir}/.." && pwd)"
environment_file="${repository_dir}/.env.authz.local"

[[ -f "${environment_file}" ]] || { echo "BLOCKED: isolated authorization environment is missing."; exit 2; }
set -a
# shellcheck disable=SC1090
source "${environment_file}"
set +a

: "${AUTHZ_TEST_PROJECT_REF:?Missing isolated project ref}"
: "${AUTHZ_TEST_SUPABASE_URL:?Missing isolated project URL}"
: "${AUTHZ_TEST_DB_URL:?Missing isolated database URL}"
: "${AUTHZ_TEST_ISOLATED_PROJECT:?Missing isolated confirmation}"

if [[ "${AUTHZ_TEST_PROJECT_REF}" != "${ISOLATED_REF}" \
  || "${AUTHZ_TEST_SUPABASE_URL}" != "https://${ISOLATED_REF}.supabase.co" \
  || "${AUTHZ_TEST_ISOLATED_PROJECT}" != "true" \
  || "${AUTHZ_TEST_DB_URL}" != *"${ISOLATED_REF}"* \
  || "${AUTHZ_TEST_PROJECT_REF}" == "${PRODUCTION_REF}" \
  || "${AUTHZ_TEST_SUPABASE_URL}" == *"${PRODUCTION_REF}"* \
  || "${AUTHZ_TEST_DB_URL}" == *"${PRODUCTION_REF}"* ]]; then
  echo "BLOCKED: isolated-project safety gate failed."
  exit 2
fi

docker info >/dev/null 2>&1 || { echo "BLOCKED: Docker Desktop is not available."; exit 2; }

echo "Safety gate passed: isolated project only; production rejected."
docker run --rm -i "${POSTGRES_IMAGE}" psql "${AUTHZ_TEST_DB_URL}" -X --set ON_ERROR_STOP=1 <<'SQL'
begin;

create temporary table phase9_enquiries on commit drop as
select id from public.enquiries
where email like 'phase9-%@roamceylon.test' and name='Phase Nine Synthetic';
create temporary table phase9_destinations on commit drop as
select id from public.destinations
where slug like 'phase9-%' and name in('Phase Nine A','Phase Nine B');
create temporary table phase9_accommodations on commit drop as
select id from public.accommodations
where slug like 'phase9-stay-%' and name='Phase Nine Stay';
create temporary table phase9_guides on commit drop as
select id from public.guides
where slug like 'phase9-guide-%' and name in('Phase Nine Guide A','Phase Nine Guide B');
create temporary table phase9_vehicles on commit drop as
select id from public.vehicles
where slug like 'phase9-vehicle-%' and listing_title='Phase Nine Vehicle';
create temporary table phase9_experiences on commit drop as
select id from public.experiences
where slug like 'phase9-experience-%' and name='Phase Nine Experience';

do $safety$
begin
  if exists(select 1 from public.enquiries where email like 'phase9-%@roamceylon.test' and id not in(select id from phase9_enquiries))
    or exists(select 1 from public.destinations where slug like 'phase9-%' and id not in(select id from phase9_destinations))
    or exists(select 1 from public.accommodations where slug like 'phase9-%' and id not in(select id from phase9_accommodations))
    or exists(select 1 from public.guides where slug like 'phase9-%' and id not in(select id from phase9_guides))
    or exists(select 1 from public.vehicles where slug like 'phase9-%' and id not in(select id from phase9_vehicles))
    or exists(select 1 from public.experiences where slug like 'phase9-%' and id not in(select id from phase9_experiences)) then
    raise exception 'A Phase 9 marker exists outside the exact synthetic harness signature; cleanup refused.';
  end if;
  if exists(select 1 from public.journey_accounts where enquiry_id in(select id from phase9_enquiries))
    or exists(select 1 from public.journey_proposals where enquiry_id in(select id from phase9_enquiries))
    or exists(select 1 from public.journey_benefits where enquiry_id in(select id from phase9_enquiries))
    or exists(select 1 from public.journey_settlements settlement join public.journey_accounts account on account.id=settlement.account_id where account.enquiry_id in(select id from phase9_enquiries)) then
    raise exception 'Unexpected financial, proposal, or benefit linkage exists on a synthetic Phase 9 enquiry; cleanup refused.';
  end if;
end $safety$;

select 'Synthetic inventory: enquiries='||(select count(*) from phase9_enquiries)
  ||', curated journeys='||(select count(*) from public.curated_journeys where enquiry_id in(select id from phase9_enquiries))
  ||', allocations='||(select count(*) from public.journey_supplier_allocations where enquiry_id in(select id from phase9_enquiries))
  ||', destinations='||(select count(*) from phase9_destinations)
  ||', accommodations='||(select count(*) from phase9_accommodations)
  ||', guides='||(select count(*) from phase9_guides)
  ||', vehicles='||(select count(*) from phase9_vehicles)
  ||', experiences='||(select count(*) from phase9_experiences)
  ||', pricing plans='||(select count(*) from public.pricing_plans where entity_id in(
      select id from phase9_accommodations union all select id from phase9_guides
      union all select id from phase9_vehicles union all select id from phase9_experiences));

select set_config('roam.allocation_command','on',true);
update public.journey_supplier_allocations
set confirmation_status='pending',confirmed_at=null,confirmed_by=null,cancelled_at=null,cancelled_by=null,
  cancellation_reason=null,payment_status=case when payment_status='cancelled' then 'pending' else payment_status end,
  updated_at=now()
where enquiry_id in(select id from phase9_enquiries) and confirmation_status<>'pending';

delete from public.journey_supplier_allocation_history where enquiry_id in(select id from phase9_enquiries);
delete from public.supplier_allocation_command_receipts where enquiry_id in(select id from phase9_enquiries);
select set_config('roam.allocation_command','cleanup',true);
delete from public.journey_supplier_allocations where enquiry_id in(select id from phase9_enquiries);
delete from public.curated_journey_changes where curated_journey_id in(select id from public.curated_journeys where enquiry_id in(select id from phase9_enquiries));
delete from public.curated_journeys where enquiry_id in(select id from phase9_enquiries);
delete from public.enquiry_lifecycle_history where enquiry_id in(select id from phase9_enquiries);
delete from public.enquiries where id in(select id from phase9_enquiries);

delete from public.pricing_plans where entity_id in(
  select id from phase9_accommodations union all select id from phase9_guides
  union all select id from phase9_vehicles union all select id from phase9_experiences
);
delete from public.experience_destinations where experience_id in(select id from phase9_experiences);
delete from public.guide_experiences where guide_id in(select id from phase9_guides) or experience_id in(select id from phase9_experiences);
delete from public.guide_destinations where guide_id in(select id from phase9_guides) or destination_id in(select id from phase9_destinations);
delete from public.vehicle_destinations where vehicle_id in(select id from phase9_vehicles) or destination_id in(select id from phase9_destinations);
delete from public.accommodations where id in(select id from phase9_accommodations);
delete from public.guides where id in(select id from phase9_guides);
delete from public.vehicles where id in(select id from phase9_vehicles);
delete from public.experiences where id in(select id from phase9_experiences);
delete from public.destinations where id in(select id from phase9_destinations);

do $verify$
begin
  if exists(select 1 from public.enquiries where email like 'phase9-%@roamceylon.test')
    or exists(select 1 from public.destinations where slug like 'phase9-%')
    or exists(select 1 from public.accommodations where slug like 'phase9-%')
    or exists(select 1 from public.guides where slug like 'phase9-%')
    or exists(select 1 from public.vehicles where slug like 'phase9-%')
    or exists(select 1 from public.experiences where slug like 'phase9-%') then
    raise exception 'Phase 9 synthetic marker verification failed; transaction rolled back.';
  end if;
end $verify$;

commit;
SQL

echo "PHASE 9 SYNTHETIC CLEANUP VERIFIED: isolated project only."
