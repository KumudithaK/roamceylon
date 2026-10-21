-- CR7-R13: allocation rows and their cost-bearing audit snapshots are read
-- through existing capability-authorized server handlers / safe audit index.
-- Browser callers do not need direct base-table SELECT. Preserve service_role,
-- existing RLS, command EXECUTE grants, triggers and all financial guards.
-- Deliberately separate from the unapplied account-date migration.
REVOKE SELECT ON TABLE public.journey_supplier_allocations,
  public.journey_supplier_allocation_history FROM PUBLIC, anon, authenticated;
