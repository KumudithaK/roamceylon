# Stabilization Phase 6 Checkpoint

Date: 2026-08-13  
Scope: workflow and lifecycle integrity (SEC-004)  
Production project: `fstpfqlgypvktjwdeagu` — **not modified**  
Isolated validation project: `xnsxmwgyugoqanuoyebh`

## Current status

Phase 6 is **COMPLETE**. TypeScript, 151/151 tests and the production build pass. The guarded isolated workflow-integrity matrix completed **26/26 PASS with 0 failures**, including direct-update, invalid-transition, replay, concurrency and API mass-assignment controls. Focused Phase 2–5 regressions passed, synthetic cleanup passed, and production was not modified. SEC-004 is **REMEDIATED AND EXECUTABLY VERIFIED**. Phase 7 has not started.

## Lifecycle inventory and canonical ownership

| Resource | Status fields | Canonical command/owner after Phase 6 | Integrity notes |
|---|---|---|---|
| Traveller enquiry | `enquiries.status` | `execute_enquiry_transition` actions; Journey Design, Operations, Finance-deposit, traveller proposal service, or Super Admin according to action | Target state is derived in PostgreSQL; row locked; invalid skips rejected; direct status writes rejected; accepted transitions audited. |
| Curated Journey | `curated_journeys.status` | `execute_curated_journey_transition`; Journey Design or Supplier Allocation | `not_started → designing → ready_for_allocation → allocation_in_progress/ready_for_proposal`; direct status writes rejected. |
| Journey proposal | `journey_proposals.status` | proposal-specific Admin/traveller services | Direct authenticated writes were already revoked. Ready/internal approval/send are named actions. Acceptance is now atomic with enquiry transition. View/expiry and change-request actions remain proposal-specific trusted-service operations. |
| Proposal acceptance | one row per proposal version | `accept_journey_proposal_command` | Proposal row is locked; unique proposal acceptance remains enforced; acceptance, proposal approval and enquiry transition share one database transaction. Replay/concurrency can create only one acceptance. |
| Supplier allocation | confirmation, invoice and payment states | capability-protected allocation endpoint and settlement sync | Confirmation/invoice are independent operational facts rather than one linear state machine. Allocation endpoint excludes `paid`; Finance settlement evidence controls paid state. Cancelled allocation retirement is a named endpoint action. |
| Journey account | `journey_accounts.status` | accounting posting, transaction recalculation, cancellation, refund and override-close commands | Existing Phase 3/4 Finance capabilities, idempotency keys, lifecycle history and recalculation remain authoritative. No generic public/account status editor exists. |
| Supplier settlement | `journey_settlements.status` plus cancellation recovery fields | Finance settlement/reversal/cancellation endpoints | Existing transaction/reversal audit model preserved. Allocation payment state is derived by trigger. |
| Cancellation | `journey_cancellation_cases.status` | discriminated Finance actions: review, calculate, approve, close | Assessment locking, supplier review gate, approved refund and closure prerequisites remain intact. |
| Partner application | `partner_applications.status` | Partner Manager application workflow | Outside journey lifecycle; precise supplier capability remains. No Phase 6 schema change. |
| CMS resources | content status and active flags | Content Marketing resource commands | Outside journey lifecycle; Phase 2–4 public/private boundaries remain unchanged. |

Canonical enquiry transitions:

- `new → under_review` (`start_review`)
- `new/under_review → preparing_proposal` (`prepare_proposal`)
- `proposal_sent/awaiting_traveller_approval → preparing_proposal` (`request_changes`)
- `preparing_proposal → proposal_sent` (`mark_proposal_sent`)
- `proposal_sent/awaiting_traveller_approval → proposal_accepted` (`accept_proposal`)
- `proposal_accepted → deposit_requested → deposit_paid`
- `deposit_paid → journey_confirmed → ready_for_operations → travelling → completed`
- `completed/cancelled → archived` only through Super Admin override
- cancellation is an explicit override action and cannot be used as an arbitrary target value

Legacy statuses remain readable and supported as documented transition sources; no records were deleted or rewritten.

## Root cause and remediation

SEC-004 was reproduced in the code path: `features/admin/enquiry-review.tsx` supplied every status as an HTML option and directly issued `UPDATE enquiries SET status = <client value>`. RLS proved row authority but could not validate allowed transitions or protect the status column from stage skipping.

Migration: `supabase/migrations/202608120005_workflow_transition_integrity.sql`

Local SHA-256: `fbcee7e77f2d90d53f424383c4c8190320bcc1c7b3380f493ad0a671d11c2c36`

The migration:

- adds `journey.lifecycle.manage` and `journey.lifecycle.override` capabilities without changing unrelated role permissions;
- adds append-only `enquiry_lifecycle_history`;
- provides row-locked, fixed-action `execute_enquiry_transition` and `execute_curated_journey_transition` commands;
- derives every target state server-side and validates source state plus exact capability;
- guards both status columns against direct writes, including service-role writes not made inside a command;
- revokes authenticated generic enquiry updates;
- adds atomic `accept_journey_proposal_command`, preserving the unique per-version acceptance constraint;
- preserves existing accounting synchronization triggers, proposals, supplier assignments and historical rows.

The Admin now displays the current lifecycle state and only the legitimate next action. Internal notes use a strict, authenticated server endpoint and are not coupled to an arbitrary status payload. The endpoint schema is strict, so `status`, financial fields or unrelated row fields are rejected as mass assignment.

## Atomicity, replay and auditability

- Enquiry and Curated Journey commands use `SELECT … FOR UPDATE`.
- Invalid and skipped transitions raise an error before mutation.
- Repeating the same completed action is a no-op only when already at that action's exact target.
- Proposal acceptance locks the proposal, inserts the unique acceptance and updates proposal plus enquiry in one database transaction. Any failure rolls back all three changes.
- Concurrent/replayed proposal acceptance permits exactly one acceptance; the other attempt is rejected by state/uniqueness.
- Successful enquiry transitions record previous state, target state, business action, actor, reason and timestamp.
- Existing accounting lifecycle history, transaction idempotency, cancellation locks and settlement reversal evidence are preserved.

## Application changes

- New strict endpoint: `POST /api/admin/enquiry-lifecycle`.
- Enquiry Review no longer sends arbitrary status values.
- Journey Studio now sends `ready_for_allocation`, not `action=status` plus a client-selected target.
- Allocation and proposal services use the Curated Journey command.
- Proposal generation/send/accept/change-request and deposit posting use the enquiry command.
- Traveller proposal acceptance uses the atomic database command.

## Executable isolated verification

Prepared runner: `scripts/run-isolated-phase6-workflow-integrity.sh`  
Prepared matrix: `tests/phase6-workflow-authorization.mjs`

The runner:

- accepts only isolated ref `xnsxmwgyugoqanuoyebh` and explicitly rejects production;
- loads only `.env.authz.local` and requires six disposable `@roamceylon.test` identities;
- applies the migration atomically with `ON_ERROR_STOP=1`, skips a fully applied migration, and blocks partial state;
- verifies Journey Designer legitimate transition ALLOW, invalid skip/direct write DENY;
- verifies Operations legitimate delivery transition ALLOW and unrelated review transition DENY;
- verifies Partner Manager, Finance and Content Marketing general lifecycle transition DENY;
- verifies Super Admin valid command ALLOW but invalid state corruption DENY;
- verifies concurrent and replayed proposal acceptance creates exactly one acceptance;
- removes all synthetic records in cleanup and stores evidence outside Git under `/tmp/roam-stabilization-phase6`.

Isolated execution result: **PASS — 26/26, 0 failures**.

Final guarded runner result: `PHASE 6 WORKFLOW INTEGRITY VERIFIED: isolated project only.`

Executable evidence confirmed:

- Journey Designer legitimate transition ALLOW; invalid, state-skipping, backwards and unknown transitions DENY; direct arbitrary status update DENY; replay behavior SAFE.
- Operations legitimate operational transition ALLOW; unrelated lifecycle transition and direct arbitrary status update DENY.
- Partner Manager, Finance and Content Marketing general lifecycle mutation DENY.
- Super Admin valid transition ALLOW; invalid lifecycle corruption DENY.
- Concurrent proposal acceptance SAFE; proposal acceptance replay DENY.
- API mass-assignment status injection DENY; unauthorized API lifecycle action DENY; legitimate Journey Designer API lifecycle action ALLOW.
- Focused Phase 2, Phase 3/4 and Phase 5 regression verification PASS.
- Synthetic cleanup PASS.
- Production project NOT MODIFIED.

## Regression and local validation

| Check | Result |
|---|---|
| `npx tsc --noEmit` | PASS |
| `npm test` | PASS — 151/151 |
| `npm run build` | PASS |
| Phase 6 runner syntax | PASS (`bash -n`) |
| Phase 6 matrix syntax | PASS (`node --check`) |
| Production project | NOT MODIFIED |

Build-time schema-cache notices for the Phase 2 public projections are expected because production is intentionally not migrated during stabilization; compilation and page generation completed successfully.

## Exit criteria

- Local architecture, commands, UI/API migration, atomic acceptance, tests and guarded runner: **PASS**.
- Isolated capability/direct-bypass/concurrency evidence: **PASS — 26/26**.
- SEC-004: **REMEDIATED AND EXECUTABLY VERIFIED**.
- Earlier Phase 2–5 remediations: **FOCUSED REGRESSION PASSED**.
- Production: not modified.
- Phase 7: ready for human review; not started.
