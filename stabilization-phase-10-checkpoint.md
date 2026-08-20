# Stabilization Phase 10 checkpoint — Journey execution and operational fulfilment integrity

Date: 13 August 2026  
Authorized isolated project: `xnsxmwgyugoqanuoyebh`  
Explicitly rejected production project: `fstpfqlgypvktjwdeagu`  
Status: **COMPLETE — implementation, local validation and isolated executable verification passed**

## Scope and production safety

Phase 10 secures the existing post-acceptance handover into Operations. It does not create a second journey, itinerary, supplier, commercial, Accounting or messaging model. The guarded runner rejects production by project reference, Supabase URL and database URL, requires disposable `@roamceylon.test` staff identities, and uses only `phase10-*` synthetic fixtures. Production has not been modified. Phase 11 has not started.

## Operational inventory and authoritative graph

| Stage | Authoritative resource | Phase 10 treatment |
|---|---|---|
| Traveller request | `enquiries.trip_state` and submitted fields | Preserved as the immutable brief and minimized Phase 5 operational view |
| Accepted agreement | current `journey_proposals` row joined to immutable `journey_proposal_acceptances` | Required for handover; sent journey dates and accepted allocation IDs are authoritative |
| Curated itinerary | `curated_journeys.itinerary` linked by the accepted proposal | Existing destination, route and service context; no parallel itinerary table added |
| Supplier requirements | accepted proposal `allocation_snapshot` derived from the Curated Journey | Exact service scope handed to Operations |
| Supplier assignments | `journey_supplier_allocations` | Existing supplier/resource, service-date, commercial and confirmation authority retained |
| Operational readiness/execution/completion | `enquiries.status` | Existing `journey_confirmed → ready_for_operations → travelling → completed` graph retained |
| Service fulfilment | new evidence fields on the existing allocation | `pending → fulfilled`; no unsupported no-show or exception states invented |
| Operational history | existing allocation and enquiry lifecycle histories plus command receipts | Actor, relationship, state, timestamp and replay evidence preserved |
| Finance | Phase 8 account, transaction and settlement commands | Read/settlement context remains separate; operational commands cannot change finance |

There is no existing journey-day/item table, driver assignment table, operational owner table, explicit no-show state, or post-acceptance date-amendment workflow. Those concerns are therefore **NOT APPLICABLE** in Phase 10 rather than being invented. Structured allocation dates already use `service_details` (`checkIn`, `checkOut`, `serviceDate`, `startDate`, `endDate`, `pickupDate`, `dropoffDate`) and remain protected by the Phase 9 journey-period validator.

## Proven execution invariants

Migration `202608120010_operational_fulfilment_integrity.sql` establishes:

- an operational handover requires one current accepted proposal and its Curated Journey must belong to the enquiry;
- enquiry start/end dates must be valid and exactly match the accepted sent proposal dates;
- every accepted allocation reference must exist, belong to the same enquiry and accepted Curated Journey, remain confirmed, and not require review;
- generic lifecycle RPC calls cannot enter readiness, travelling or completed states; these actions require the operational command context;
- fulfilment takes an explicit enquiry ID and allocation ID, verifies same-journey ownership and accepted-snapshot membership, and requires the journey to be travelling;
- only a confirmed current allocation can be fulfilled;
- fulfilment timestamp and actor are server-derived, and fulfilled evidence cannot be rewritten or physically deleted;
- completion requires every service in the accepted allocation snapshot to be fulfilled;
- operational commands cannot re-parent allocations or alter supplier IDs, rates, costs, selling prices, accepted proposal evidence or financial records;
- advisory locks and unique idempotency receipts serialize replay/concurrent operations;
- transition, fulfilment, audit history and command receipt writes share the caller's database transaction.

Accepted journey dates are not accepted from an operational browser payload. The API exposes only the enquiry ID, named action, optional reason/note and idempotency key; authoritative dates, proposal, itinerary, allocation, actor and timestamps are resolved by the database.

## Command model

| Command | Capability | Authoritative work |
|---|---|---|
| `execute_operational_journey_command` | `operations.manage` | Validates accepted agreement/readiness and performs prepare, start or completion through the existing lifecycle engine |
| `fulfil_supplier_allocation_command` | `operations.manage` | Records one immutable fulfilled fact for an accepted, confirmed service while travelling |
| `execute_enquiry_transition` | existing Phase 6 capabilities | Continues handling non-operational lifecycle actions; operational actions now require the trusted wrapper context |
| `update_supplier_fulfilment_command` | `operations.manage` | Existing Phase 9 invoice/instructions command retained; it is not treated as delivery completion |

Both new commands are `SECURITY DEFINER`, use an empty `search_path`, require `service_role`, verify the actor capability, validate strict IDs/actions and relationships, use row/advisory locking, and grant execution only to `service_role`.

## Roles and operational boundaries

| Role | Resulting boundary |
|---|---|
| Operations | Purpose-specific operational view, readiness/start/completion and service fulfilment commands; no commercial, Finance, staff or accepted-agreement authority |
| Journey Designer | Existing design/read work retained; no operational fulfilment or completion authority after handover |
| Partner Manager | Phase 9 supplier allocation scope retained; no journey execution/completion authority |
| Finance | Existing minimized operational/settlement context retained; no operational mutation |
| Content Marketing | No operational execution authority or internal allocation context |
| Super Admin | Legitimate capability-based operational command access; same cross-journey and structural invariants apply |

Assignment replacement remains **NOT APPLICABLE**: the repository has no legitimate post-acceptance supplier replacement workflow. Fulfilled historical assignments cannot be silently rewritten. Cancellation continues through the existing Phase 6/9 lifecycle paths and is not duplicated here.

## API and Operations UI

- `/api/admin/enquiry-lifecycle` sends the three operational lifecycle actions to the authoritative operational command and never accepts a target status.
- `/api/admin/journey-allocations` accepts a strict `fulfil` action containing only enquiry ID, allocation ID, optional note and idempotency key.
- the existing Delivery Desk shows confirmation, invoice, payment and fulfilment independently;
- `Mark fulfilled` is available only to Operations while the journey is `travelling`;
- fulfilled actor/time evidence and the optional internal note are displayed read-only afterward.

## Audit, replay, concurrency and rollback

- `journey_supplier_allocation_history` now snapshots fulfilment status, actor and timestamp and records the transition as `fulfilment_updated`;
- `enquiry_lifecycle_history` remains the journey readiness/start/completion audit authority;
- `journey_operational_command_receipts` is append-only and rejects an idempotency key reused for a different request;
- allocation-scoped fulfilment and enquiry-scoped lifecycle commands use transaction advisory locks;
- same-key replay returns the original result with `idempotent=true`;
- concurrent same-key probes are designed to prove one history/business effect;
- the rollback probe verifies a conflicting receipt cannot leave a partial operational mutation or receipt;
- fulfilled allocation deletion is denied.

## Migration and files

- Migration: `supabase/migrations/202608120010_operational_fulfilment_integrity.sql`
- Lifecycle API: `app/api/admin/enquiry-lifecycle/route.ts`
- Allocation API: `app/api/admin/journey-allocations/route.ts`
- Operations UI: `features/admin/journey-lifecycle-workspace.tsx`
- Database contract: `lib/database.types.ts`
- Focused static tests: `tests/operational-fulfilment-integrity.test.ts`
- Executable isolated matrix: `tests/phase10-operational-fulfilment.mjs`
- Guarded runner: `scripts/run-isolated-phase10-operational-fulfilment.sh`

The runner uses one canonical fixture predicate for preflight, cleanup and post-clean verification: synthetic enquiry emails matching `phase10-%@roamceylon.test`, proposal references matching `RCJ-PHASE10-%`, and content slugs matching `phase10-%`. It detects fully applied versus absent Phase 10 state, refuses partial state, never blindly reapplies the migration, keeps private diagnostics mode-restricted outside Git, and preserves the already completed Phase 2–9 baseline.

## Local validation

- TypeScript (`npx tsc --noEmit`): **PASSED**
- Project validation + Node tests: **172/172 PASSED**
- Phase 10 focused static tests: **5/5 PASSED**
- Focused ESLint: **PASSED**
- Guarded runner shell syntax: **PASSED**
- Executable matrix JavaScript syntax: **PASSED**
- `git diff --check`: **PASSED**
- Production build: **PASSED**

The build emitted non-fatal schema-cache messages for existing public projection views in the currently configured local environment; compilation, TypeScript, page generation and final optimization all completed. This is not classified as a Phase 10 regression.

## Isolated executable verification

The guarded matrix completed against authorized isolated project `xnsxmwgyugoqanuoyebh` with **36/36 PASSED and 0 FAILED**. The production project was explicitly rejected and was not modified.

Executable evidence confirmed:

- valid readiness and readiness replay passed; premature readiness and direct transition bypass were denied;
- unauthorized accepted-date replacement, itinerary substitution, cross-journey operational linkage and allocation substitution were denied;
- premature start was denied; valid start passed and replay was safe;
- valid fulfilment passed; duplicate and concurrent fulfilment were safe;
- invalid fulfilment, fulfilment rewrite, direct evidence rewrite and historical execution deletion were denied;
- Operations commercial and financial tampering were denied;
- Journey Designer completion, Partner Manager completion, Finance operational mutation, Content Marketing operational mutation and Super Admin cross-journey corruption were denied;
- premature completion was denied; valid completion passed; replay and concurrent completion were safe;
- operational audit history and downstream-failure rollback passed;
- focused Phase 2 public/private, Phase 5 Operations PII, Phase 6 lifecycle, Phase 7 accepted-agreement and Phase 9 supplier-allocation regressions passed;
- all Phase 2–9 structural prerequisite gates passed before execution; and
- synthetic operational cleanup passed.

## Current exit status

- Operational inventory: **COMPLETE**
- Execution invariants: **VERIFIED**
- Operational readiness/start/completion: **PASSED**
- Fulfilment, replay, concurrency, audit and rollback: **PASSED / SAFE**
- Local validation: **PASSED**
- Phase 2–9 regressions: **PASSED**
- Production modified: **NO**
- Other findings remediated: **NONE**
- Phase 11 ready: **YES**
