# Stabilization Phase 9 checkpoint — Supplier allocation and fulfilment integrity

Date: 13 August 2026  
Authorized isolated project: `xnsxmwgyugoqanuoyebh`  
Explicitly rejected production project: `fstpfqlgypvktjwdeagu`  
Status: **COMPLETE — isolated supplier-allocation integrity matrix verified 26/26**

## Scope and production safety

Phase 9 changes only supplier allocation, fulfilment and their direct proposal/benefit/accounting linkages. It does not redesign the supplier catalogue, Traveller Brief, Curated Journey, proposals, benefits, Accounting or any public experience. No command in this phase targets production, and production has not been modified.

## Supplier model inventory

| Concern | Existing authoritative resource | Phase 9 conclusion |
|---|---|---|
| Traveller request | `enquiries.trip_state` and submitted selection fields | Immutable Phase 5/6 input; never rewritten by allocation |
| Curated requirement | `curated_journeys.itinerary` | Canonical current requirements; destinations, experience IDs, route legs, service dates and participant context are derived here |
| Allocation | `journey_supplier_allocations` | One canonical row per stay destination, guide scope, route leg or experience; no parallel requirement table exists |
| Supplier catalogue | `accommodations`, `vehicles`, `guides`, `experiences` | Existing supplier entities retained unchanged |
| Supplier coverage | accommodation destination, `vehicle_destinations`, `guide_destinations`, `guide_experiences`, `experience_destinations`, nationwide flags | Existing Admin matching remains presentation assistance; allocation type/existence and required experience mapping are authoritative in the command |
| Supplier rate | `pricing_plans` | Active entity-owned plan is authoritative for saved rates |
| Journey-specific rate | explicit `customJourneyRate` in allocation service details | Preserved as the existing auditable manual-rate path; it never changes catalogue pricing |
| Proposal evidence | `journey_proposals.allocation_snapshot` and `commercial_snapshot` | Phase 7 accepted snapshot remains immutable; mutable allocation cannot diverge after acceptance |
| Benefits | `journey_benefits.allocation_id` | Must reference an active allocation from the same enquiry |
| Accounting | `journey_accounts`, `journey_settlements`, `accounting_transactions` | Phase 8 remains authoritative; allocation/account/currency cross-link is now checked at the database boundary |
| Operations | confirmation/invoice/payment states, arrival instructions and special notes on the allocation | Operations receives a narrow fulfilment command and no supplier cost or master-data mutation authority |

There is no separate journey supplier requirement table, supplier-service table or allocation-history table in the pre-Phase 9 model. Requirements are intentionally derived from the Curated Journey. Phase 9 adds only a compact append-only allocation history and idempotency receipt table.

## Proven allocation invariants

The implementation in `202608120008_supplier_allocation_integrity.sql` establishes:

- the Curated Journey must belong to the same enquiry;
- destination allocations must reference a selected Curated Journey destination;
- experience allocations must reference both a selected experience and its valid destination mapping;
- vehicle allocations must match an adjacent pickup/destination/drop-off leg in the current route;
- allocation type and typed supplier entity must agree;
- an existing allocation cannot move to another journey, requirement or scope;
- a saved rate must be active, owned by the allocated entity, and snapshot the authoritative unit price/currency;
- catalogue supplier cost is derived as unit rate × positive billable quantity;
- a manual cost is accepted only through the pre-existing explicit complete custom-journey-rate basis;
- structured service dates must be valid and remain within journey dates; check-out follows check-in;
- confirmed allocations cannot move backwards to pending or be commercially rewritten;
- an accepted proposal freezes allocation identity and commercial fields pending a future explicit post-acceptance amendment process;
- cancellation requires a reason and rejects paid/waived supplier activity;
- confirmed, cancelled or financially linked rows cannot be physically deleted;
- settlement and benefit allocation IDs must belong to the same journey context;
- every command is capability checked, row/advisory locked, atomic and idempotent.

## Command and lifecycle model

| Command | Capability | Allowed work |
|---|---|---|
| `save_supplier_allocations_command` | `suppliers.allocate` | Atomic batch creation/update of valid pending allocations and confirmation with authoritative rate snapshots |
| `transition_supplier_allocation_command` | `suppliers.allocate` | Pending → confirmed or pending → cancelled, with replay safety and audit metadata |
| `update_supplier_fulfilment_command` | `operations.manage` | Confirmed allocation invoice state, arrival instructions and operational notes only |

Actual lifecycle values remain `pending`, `confirmed`, `cancelled`; Phase 9 does not invent additional fulfilment states. Confirmed-supplier replacement is **not applicable** in this phase: the prior interface exposed generic overwrite rather than an explicit business replacement workflow. It is now denied, especially after traveller acceptance. A future replacement must be implemented as a defined post-acceptance journey amendment, not by silently changing history.

Generic authenticated INSERT/UPDATE/DELETE grants are revoked. The only retained non-command updates are the already established narrow Journey Studio review flag and Phase 8 command-maintained payment-status synchronization. Both are field-compared in the guard.

## Role matrix

| Role | Allocation/fulfilment boundary |
|---|---|
| Partner Manager | Command-based allocation, confirmation and cancellation; no journey lifecycle, Accounting or capability administration |
| Journey Designer | Curated requirements and proposal work; no direct allocation DML or supplier master authority |
| Operations | Read operational allocation context and update narrow fulfilment facts; no supplier/cost/rate mutation |
| Finance | Read required cost/payment context through existing boundaries; no allocation mutation |
| Content Marketing | No internal allocation read or mutation |
| Super Admin | May use legitimate commands through capabilities; structural, state and relationship corruption remains denied |

## Audit, concurrency and rollback

- `journey_supplier_allocation_history` preserves previous/new commercial and lifecycle snapshots, actor, reason, idempotency key and timestamp.
- `supplier_allocation_command_receipts` prevents duplicate side effects and rejects reuse of a key for a different request.
- an enquiry-scoped advisory transaction lock serializes competing allocation batches;
- existing database unique indexes remain the final duplicate guard;
- batch validation, writes, audit rows and receipts share one database transaction;
- the guarded matrix includes a forced invalid second line and verifies that the first line and its audit evidence roll back.

## Migration and files

- Migration: `supabase/migrations/202608120008_supplier_allocation_integrity.sql`
- Narrow compatibility follow-up: `supabase/migrations/202608120009_supplier_allocation_pricing_enum_compatibility.sql`
- Admin API: `app/api/admin/journey-allocations/route.ts`
- Admin client handoff: `features/admin/journey-lifecycle-workspace.tsx`
- Generated database contract: `lib/database.types.ts`
- Static/focused tests: `tests/supplier-allocation-integrity.test.ts`
- Executable isolated matrix: `tests/phase9-supplier-allocation-integrity.mjs`
- Guarded runner: `scripts/run-isolated-phase9-supplier-allocation.sh`

The runner checks the exact isolated project and synthetic identities, rejects production in URL/ref/DB connection, detects fully applied versus unapplied Phase 9 state, refuses partial state, applies migrations atomically only when absent, preserves private evidence outside Git, runs focused Phase 2–8 gates, uses synthetic supplier/journey fixtures, and cleans them up. The follow-up makes the two Phase 9 `pricing_entity_type` enum-to-allocation-text comparisons explicit; it does not weaken any relationship, lifecycle, commercial or authorization rule.

## Local validation

- Project validation + Node tests: **167/167 passed**
- Phase 9 focused static tests: **4/4 passed**
- TypeScript (`npx tsc --noEmit`): **passed**
- Focused ESLint: **passed**
- Production build: **passed**
- Shell syntax check for guarded runner: **passed**
- `git diff --check`: **passed**

## Executable verification evidence

The guarded runner completed against the authorized isolated project on 13 August 2026:

- safety gate: **PASSED** — isolated project confirmed and production rejected;
- Phase 9 migration state: **detected and preserved**;
- supplier-allocation matrix: **26/26 passed, 0 failed**;
- synthetic supplier-allocation cleanup: **PASSED**;
- production modified: **NO**.

| Executable probe | Result |
|---|---|
| Valid supplier allocation | PASS |
| Duplicate allocation replay | SAFE |
| Concurrent allocation | SAFE |
| Invalid supplier type | DENY |
| Cross-journey requirement | DENY |
| Supplier ID substitution | DENY |
| Journey ID substitution | DENY |
| Requirement ID substitution | DENY |
| Commercial cost tampering | DENY |
| Direct status mutation | DENY |
| Valid confirmation | PASS |
| Confirmation replay | SAFE |
| Invalid confirmation transition | DENY |
| Operations fulfilment | PASS |
| Operations cost authority | DENY |
| Unauthorized cancellation | DENY |
| Valid cancellation | PASS |
| Confirmed allocation delete | DENY |
| Downstream failure rollback | PASS |
| Allocation audit history | PASS |
| Finance allocation mutation | DENY |
| Content Marketing allocation access | DENY |
| Phase 2 public boundary | PASS |
| Phase 5 supplier PII boundary | PASS |
| Phase 6 lifecycle boundary | PASS |
| Phase 8 finance boundary | PASS |

The guarded structural prerequisite gates for completed Phases 2–8 also passed. Together with the existing 167/167 local suite, this preserves the previously verified Phase 3 capability model, Phase 4 database authorization, Phase 7 accepted-proposal integrity and the explicitly probed Phase 2, 5, 6 and 8 boundaries. No broader remediation is claimed.

## Exit status

- Supplier model inventory: **COMPLETE**
- Allocation invariants: **IMPLEMENTED AND VERIFIED**
- Valid allocation and supplier compatibility: **PASS**
- Cross-journey, supplier, journey and requirement substitution: **DENIED**
- Commercial tampering and direct status mutation: **DENIED**
- Duplicate and concurrent allocation: **SAFE**
- Allocation lifecycle, confirmation and cancellation: **VERIFIED**
- Confirmation replay: **SAFE**
- Replacement: **NOT APPLICABLE** — no legitimate explicit replacement workflow exists in the current product model
- History/audit, atomicity and rollback: **PASS**
- Phase 2–8 regressions: **PASSED**
- Synthetic cleanup: **PASSED**
- Production modified: **NO**
- Other findings remediated: **NONE**
- Phase 10 ready: **YES**
