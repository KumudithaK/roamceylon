-- CR7-R4: let existing cent-precision CHECKs execute without exposing private.
-- Run as postgres. This migration changes only the four CHECK expressions;
-- it does not change the underlying validator, RLS, business rows, or grants
-- on the private schema. Keep creation, revocation, and constraint replacement
-- in one transaction when this migration is eventually applied.

create schema constraint_guard authorization postgres;
revoke all on schema constraint_guard from public;
grant usage on schema constraint_guard to service_role, authenticated;

create function constraint_guard.finance_snapshot_cent_precise(value jsonb)
returns boolean
language sql
immutable
security definer
set search_path = pg_catalog, pg_temp
as $$
  select private.finance_snapshot_cent_precise($1);
$$;

-- PostgreSQL grants EXECUTE to PUBLIC on new functions by default. Remove it
-- before granting the two roles with existing affected-table INSERT paths.
revoke all on function constraint_guard.finance_snapshot_cent_precise(jsonb) from public;
grant execute on function constraint_guard.finance_snapshot_cent_precise(jsonb)
  to service_role, authenticated;

alter table public.enquiries
  drop constraint enquiries_estimate_snapshot_cent_precision,
  add constraint enquiries_estimate_snapshot_cent_precision
    check (constraint_guard.finance_snapshot_cent_precise(estimate_snapshot));

alter table public.journey_supplier_allocations
  drop constraint allocations_rate_snapshot_cent_precision,
  add constraint allocations_rate_snapshot_cent_precision
    check (constraint_guard.finance_snapshot_cent_precise(pricing_plan_snapshot));

alter table public.journey_proposals
  drop constraint proposals_financial_snapshots_cent_precision,
  add constraint proposals_financial_snapshots_cent_precision
    check (constraint_guard.finance_snapshot_cent_precise(allocation_snapshot)
      and constraint_guard.finance_snapshot_cent_precise(commercial_snapshot)
      and constraint_guard.finance_snapshot_cent_precise(customer_snapshot)
      and constraint_guard.finance_snapshot_cent_precise(sent_snapshot));

alter table public.journey_accounts
  drop constraint accounts_quote_snapshot_cent_precision,
  add constraint accounts_quote_snapshot_cent_precision
    check (constraint_guard.finance_snapshot_cent_precise(quote_snapshot));
