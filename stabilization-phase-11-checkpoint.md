# Stabilization Phase 11 checkpoint — Admin read models, reporting and dashboard integrity

Date: 13 August 2026  
Authorized isolated project: `xnsxmwgyugoqanuoyebh`  
Explicitly rejected production project: `fstpfqlgypvktjwdeagu`  
Status: **COMPLETE — repository remediation, local validation and guarded isolated verification passed**

## Scope and production safety

Phase 11 reconciles the administrative read plane only. It does not create an alternate journey, proposal, accounting, supplier-allocation or operational source of truth. Production was not modified and Phase 12 has not started. The prepared runner rejects production by project reference, Supabase URL and database URL; uses only disposable `@roamceylon.test` identities and `phase11-*` fixtures; preserves completed migrations; and uses the same fixture predicate for pre-clean, execution and post-clean verification.

## Read-model inventory

| Active read resource | Classification | Authoritative source | Principal consumers |
|---|---|---|---|
| `themes`, `destinations`, `experiences` | source of truth for editorial state | same table rows and CMS relationships | resource lists/editors; Phase 11 content metrics |
| `accommodations`, `vehicles`, `guides`, `pricing_plans` | source of truth for supplier catalogue/rates | same table rows and relationship tables | supplier editors/allocation workspace; capability-limited catalogue metrics |
| `partner_applications`, files and history | source of truth for partner workflow | same protected tables | Partner Application inbox/review; Phase 11 count-only supplier workload |
| `enquiries` and `enquiry_lifecycle_history` | source of truth for request lifecycle | Phase 6 transition model | enquiry review and purpose projections |
| `curated_journeys` and changes | source of truth for internal itinerary design | Phase 6/Studio model | Journey Studio and proposal preparation |
| `journey_proposals` and acceptances | source of truth for current/accepted commercial agreement | Phase 7 immutable proposal versions | proposal APIs; Phase 11 current pipeline value |
| `journey_accounts`, transactions and settlements | source of truth for accounting | Phase 8 commands and aggregates | Finance workspace; Phase 11 Finance aggregate |
| `journey_supplier_allocations` and history | source of truth for supplier allocation | Phase 9 command model | allocation workspace; supplier/operations reporting |
| enquiry operational lifecycle and allocation fulfilment fields | source of truth for execution | Phase 10 commands and histories | Operations workspace; Phase 11 operational aggregate |
| `public_accommodations`, `public_vehicles`, `public_guides`, `website_public_settings` | purpose-specific public projections | protected supplier/settings tables | public website only |
| `traveller_journey_design` | purpose-specific PII projection | `enquiries` | Journey Designer detail |
| `traveller_operations_context` | purpose-specific PII projection | operationally relevant `enquiries` | Operations detail |
| `traveller_finance_reference` | purpose-specific PII projection | `enquiries` | Finance reconciliation |
| `traveller_supplier_context` | non-identifying purpose projection | `enquiries` | Partner allocation context |
| `traveller_admin_full` | full administrative projection | `enquiries` | Super Admin only |
| `staff_journey_request_summary` | purpose-specific staff list projection | `enquiries` | dashboard history, Enquiry inbox, Journey Studio inbox |
| `finance_journey_accounts` | purpose-specific Finance projection | `journey_accounts` | Accounting overview/detail |
| `journey_account_statuses` | minimized cross-workflow status projection | `journey_accounts` | design/allocation/operations status display |
| `current_staff_permissions()` | capability read RPC | staff role/permission assignments | Admin shell and feature authorization |
| `read_admin_dashboard()` | Phase 11 aggregate/projection RPC | authoritative tables above | `/admin/dashboard` only |

No materialized view is active. Browser-derived dashboard arrays were classified as a legacy read pattern and replaced only for `/admin/dashboard`; authoritative tables and existing purpose projections remain intact.

## `staff_journey_request_summary` root cause

Classification: **A — required relation missing from the database used during local review because completed stabilization migrations were not deployed there; not a stale reference and not proven cache-only.**

Evidence:

- migration `202608120004_traveller_pii_boundaries.sql` creates the exact security-barrier view;
- generated database types describe the same columns;
- Dashboard, Enquiry Inbox and Journey Studio Inbox actively consume it;
- Phase 5 tests and the completed isolated Phase 5 executable matrix verify its intended role behavior;
- the local production build also reported `PGRST205` for Phase 2 projections `public_accommodations`, `public_guides`, `public_vehicles` and `website_public_settings`, demonstrating broader migration deployment drift in the configured database rather than a single cached relation; and
- the view contains no email, phone, notes, trip JSON or copied proposal/accounting payload. Traveller name is emitted only to Design, Finance, operationally relevant Operations or Super Admin.

Phase 11 migration `202608120011_admin_read_model_integrity.sql` re-declares the exact evidence-backed Phase 5 view contract, grants only authenticated/service-role SELECT, revokes anonymous access and requests a PostgREST schema reload. This makes clean restore/migration application deterministic without inventing an independent data model.

## Dashboard contract and authoritative aggregate semantics

`/admin/dashboard` now calls parameter-free, stable `read_admin_dashboard()` rather than downloading broad content, partner-application and enquiry rows into the browser.

- Journey workload and pipeline counts use the Phase 6 enquiry lifecycle values.
- Open pipeline value uses the newest non-superseded/non-cancelled/non-expired proposal selling price when one exists, preserving the Phase 7 commercial snapshot; only pre-proposal journeys fall back to their immutable submitted planning estimate.
- Recent journey rows use the Phase 5 minimized contract and contain no contact or free-text fields.
- Content health is computed from authorized CMS rows. Supplier catalogue health is added only for roles with `suppliers.view`.
- Partner workload returns counts only—no applicant name, contact, application JSON, licence or document data.
- Finance totals derive from Phase 8 account aggregates (`selling_price`, received, refunded and supplier-paid values). No alternate ledger is created.
- Operations totals derive from Phase 10 enquiry readiness/travelling/completed status and allocation fulfilment fields. Completion is not inferred in frontend code.
- The RPC accepts no IDs, filters, status, sorting, search, date ranges or pagination parameters, so caller input cannot expand its authorization scope.
- Unauthorized sections are returned as `null`, not fabricated zeroes. Query failure displays a controlled unavailable state and does not present business zeroes.
- The function is `STABLE`, contains no business DML and is executable only by authenticated/service roles after an exact `admin.dashboard.view` check.

## Role read matrix

| Role | Dashboard sections | Explicit exclusions |
|---|---|---|
| Super Admin | journey, content, supplier, Finance and Operations summaries | structurally invalid substitutions remain impossible because the RPC has no resource parameters |
| Journey Designer | journey workload/recent list and supplier catalogue/workload context | no Finance or Operations aggregate; no full partner/traveller rows |
| Partner Manager | minimized journey context and supplier catalogue/application counts | traveller name remains null; no full traveller PII or Finance aggregate |
| Finance | minimized journey context, Finance aggregate and permitted supplier catalogue context | no full traveller base row or Operations aggregate |
| Operations | operationally minimized journey context, supplier catalogue context and Operations aggregate | no Finance aggregate or commercial mutation authority |
| Content Marketing | editorial content health only | no journey, partner, Finance or Operations counts |
| Anonymous | none | RPC and staff projection execution/select denied |

All six named staff roles receive the narrow `admin.dashboard.view` navigation capability. This capability grants no underlying business-row authority; each section additionally checks its existing Phase 3–5 purpose capability.

## PII, substitution, count and error assessment

- The dashboard payload contains no traveller email/phone, free-text notes, supplier contact/licence/document values, application content or account IDs.
- Roles without an authorized section receive `null`; protected record existence is not exposed through exact zeroes.
- Cross-journey, cross-supplier and cross-account browser substitution is unavailable because the dashboard RPC is parameter-free. Existing base tables and projections retain RLS/grant enforcement.
- Arbitrary filter, sort and search expressions are not accepted by the read RPC.
- Dashboard errors are rendered with a generic operational message; raw SQL/PostgREST messages are no longer displayed by this screen.
- The executable matrix snapshots lifecycle, accounting, allocation and operational audit counts before and after representative reads to prove the dashboard is non-mutating.

## Migration and implementation

- Migration: `supabase/migrations/202608120011_admin_read_model_integrity.sql`
- Dashboard consumer: `features/admin/dashboard.tsx`
- Capability model/types: `lib/admin/permissions.ts`, `lib/database.types.ts`
- Focused static tests: `tests/admin-read-model-integrity.test.ts`
- Isolated matrix: `tests/phase11-admin-read-models.mjs`
- Guarded runner: `scripts/run-isolated-phase11-admin-read-models.sh`

The runner detects complete versus absent Phase 11 state and refuses partial state. It does not blindly reapply the migration, runs focused Phase 2–10 structural regression gates, retains sanitized mode-600 diagnostics outside Git and cleans only `phase11-*` / `RCJ-PHASE11-*` fixtures.

## Local validation

- TypeScript (`npx tsc --noEmit`): **PASSED**
- Project validation + Node tests: **177/177 PASSED**
- Phase 11 focused static tests: **5/5 PASSED**
- Focused ESLint: **PASSED**
- Guarded runner shell syntax: **PASSED**
- Executable matrix JavaScript syntax: **PASSED**
- Production build: **PASSED**

The build's non-fatal `PGRST205` messages for missing Phase 2 projections in the currently configured database are recorded as deployment-drift evidence. Compilation, TypeScript, static generation and optimization completed; application behavior was not weakened to hide the messages.

## Isolated executable verification

The guarded matrix completed against authorized isolated project `xnsxmwgyugoqanuoyebh` with **25/25 PASSED and 0 FAILED**. The production project was explicitly rejected and was not modified.

Executable evidence confirmed:

- anonymous dashboard and staff journey summary reads were denied;
- dashboard loading, the reconciled `staff_journey_request_summary` contract and known synthetic journey metrics passed;
- Journey Designer received authorized journey reporting while Finance detail remained denied;
- Partner Manager received supplier summary data while traveller identity was minimized and full traveller PII remained denied;
- Finance received authoritative accounting summary data while the full traveller base row remained denied;
- Operations received operational summary data while unnecessary Finance detail remained denied;
- Content Marketing received content reporting while traveller reporting remained denied;
- Super Admin received the complete legitimate administrative summary;
- count leakage was minimized, filter bypass and cross-supplier/cross-account substitutions were denied, supplier private-field minimization passed, and dashboard reads created no business or audit mutations;
- focused Phase 2 public/private, Phase 5 PII and Phase 10 operational-fulfilment regressions passed;
- guarded Phase 2–10 prerequisite gates passed before matrix execution; and
- synthetic Phase 11 cleanup passed.

This executable result confirms the earlier dashboard failure was not a stale frontend contract: the required Phase 5 view was absent from the database used for local review because the completed stabilization migrations had not been deployed there. Migration `202608120011_admin_read_model_integrity.sql` deterministically re-declared the evidence-backed view, restored its narrow grants, refreshed PostgREST schema discovery and installed the capability-checked dashboard RPC. The isolated dashboard and view contract then loaded successfully without exposing contact, supplier-private or Finance data to unauthorized roles.

## Current exit status

- Read-model inventory: **COMPLETE**
- Dashboard read model: **VERIFIED**
- `staff_journey_request_summary`: **ROOT CAUSE CLASSIFIED, RECONCILED AND EXECUTABLY VERIFIED**
- Dashboard load and aggregate correctness: **PASSED**
- Role-aware reads and anonymous denial: **VERIFIED / DENIED**
- PII, accounting, supplier and operations read integrity: **PASSED**
- Count leakage, substitution, filter bypass and read-only guarantee: **MINIMIZED / DENIED / PASSED**
- Phase 2–10 regressions: **PASSED**
- Production modified: **NO**
- Other findings remediated: **NONE**
- Phase 12 ready: **YES**
