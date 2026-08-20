# Stabilization Phase 7 Checkpoint

Date: 2026-08-13  
Scope: proposal acceptance and resulting business-record integrity  
Production project: `fstpfqlgypvktjwdeagu` — **not modified**  
Isolated validation project: `xnsxmwgyugoqanuoyebh`

## Current status

Phase 7 is **COMPLETE**. The guarded isolated verification completed **19/19 PASS with 0 failures**. Exact-token acceptance, duplicate and concurrent behavior, proposal-version gates, expiry, revocation, identity binding, commercial tamper resistance, accepted-agreement immutability, dependent-record integrity and downstream rollback were executably verified. Focused earlier-phase regressions and synthetic cleanup passed. TypeScript, 156/156 tests, focused lint and the production build pass. Production was not modified. Phase 8 has not started.

## Acceptance inventory

| Stage or resource | Authoritative source | Phase 7 integrity decision |
|---|---|---|
| Traveller link | `journey_proposals.public_token` | Exact version-specific opaque token; the acceptance RPC receives no proposal, enquiry or journey ID. |
| Proposal version | `journey_proposals.version`, enquiry relationship and current maximum version | Only the current version may be accepted. Superseded/outdated/current-version races are denied under an enquiry-scoped transaction lock. |
| Internal readiness | proposal status, `internally_approved_at`, `sent_at`, `sent_snapshot` | Only an internally approved and sent/viewed version with a sent customer document is actionable. |
| Expiry and revocation | `valid_until`, database `current_date`, `access_revoked_at` | Checked again inside the database transaction; browser time and cached page state are not authoritative. |
| Traveller identity | `sent_snapshot.traveller.email` | Submitted email must match the exact sent proposal. Name remains traveller supplied and bounded. It grants no ownership or authorization. |
| Commercial agreement | proposal totals/currency, `sent_snapshot`, `commercial_snapshot`, `allocation_snapshot` | Client commercial inputs are rejected. Stored customer total/currency must agree with the proposal row. Acceptance stores values derived from that row. |
| Acceptance evidence | `journey_proposal_acceptances` | One immutable row per proposal; acceptance values, version and timestamp are database derived. |
| Proposal state | `journey_proposals` | Updated to `approved` in the same database command. Accepted identity/evidence becomes immutable. |
| Enquiry state | Phase 6 `execute_enquiry_transition` | Transitioned to `proposal_accepted` in the same transaction; an invalid source causes full rollback. |
| Curated Journey | `curated_journeys` | The Curated Journey already exists before proposal generation and is unique per enquiry. Acceptance validates any proposal linkage and does not duplicate it. |
| Journey account | `journey_accounts` | Not created at acceptance. Existing business flow creates the unique enquiry account only when Finance records the first deposit. |
| Supplier allocations and benefits | immutable proposal snapshots | Acceptance does not rebuild mutable supplier/catalogue state. The sent customer promise remains on the accepted proposal version. |

## Authoritative acceptance transaction

Input is limited to the public token, bounded traveller name, matching email and bounded metadata created by the trusted server. The database command:

1. requires the service role and validates argument shape;
2. locks the proposal identified by the opaque token;
3. takes an enquiry-scoped transaction advisory lock to serialize competing versions;
4. re-reads the proposal under row lock;
5. validates revocation, database-time expiry, current version, internal approval, sent state and version freshness;
6. validates proposal-to-Curated-Journey linkage when present;
7. validates traveller email and exact customer total/currency against the immutable sent snapshot;
8. rejects an incomplete commercial/allocation agreement or any prior acceptance for the enquiry;
9. inserts the immutable acceptance with proposal-derived version, total, currency and timestamp;
10. marks the exact proposal approved using compare-and-set status criteria;
11. invokes the Phase 6 enquiry lifecycle command;
12. commits all effects together or rolls all of them back.

Idempotency semantics are an explicit conflict: a duplicate/replayed acceptance is denied and cannot create additional business records.

## Enforcement changes

Migration: `supabase/migrations/202608120006_proposal_acceptance_integrity.sql`

Local SHA-256: `ba6fc18881138c85e32645d0ae05235cf88da2f85cc3302096b989c43f10dc38`

The migration:

- replaces the ID-selected service command with an exact-token command;
- makes expiry, revocation, current version, approval, identity and commercial checks database authoritative;
- serializes acceptance across proposal versions for one enquiry;
- preserves the existing proposal-level unique acceptance constraint;
- prevents acceptance-row updates and accepted-agreement evidence rewrites;
- preserves the Phase 6 lifecycle transition command and atomic rollback behavior;
- creates neither a duplicate Curated Journey nor a premature Journey Account.

Application/API changes:

- the traveller service passes only `p_public_token`, name, matching email and privacy-bounded metadata;
- proposal acceptance no longer passes an internal proposal ID to the database command;
- public action schemas are strict, so proposal/enquiry/journey IDs and commercial fields cannot be mass-assigned;
- database error classes map invalid input and transaction conflicts to existing safe traveller responses.

## Executable matrix prepared

Runner: `scripts/run-isolated-phase7-proposal-acceptance.sh`  
Matrix: `tests/phase7-proposal-acceptance.mjs`

The synthetic isolated matrix verified:

- valid exact-token acceptance and final proposal/enquiry states;
- duplicate and simultaneous acceptance with dependent-record counts;
- expired, revoked, draft/unapproved, stale and newer-version cases;
- mismatched identity, invalid token and proposal-ID substitution;
- selling price, supplier cost and currency injection;
- accepted evidence immutability;
- forced downstream lifecycle failure and full transaction rollback;
- Curated Journey non-duplication and absence of premature Accounting creation;
- focused Phase 2, Phase 5 and Phase 6 regressions, with structural Phase 3/4/6 gates in the runner;
- synthetic cleanup.

Final guarded result: `PHASE 7 PROPOSAL ACCEPTANCE INTEGRITY VERIFIED: isolated project only.`

Executable outcome: **19/19 PASS, 0 failures**.

- Valid exact-token acceptance: ALLOW.
- Dependent Curated Journey/Accounting record integrity: PASS.
- Duplicate acceptance: SAFE with no duplicate records.
- Accepted agreement rewrite: DENY.
- Concurrent acceptance: SAFE with exactly one business outcome.
- Expired, revoked, unapproved, stale and outdated proposal versions: DENY.
- Different-traveller identity, invalid token and proposal-ID substitution: DENY.
- Commercial payload override: DENY.
- Forced downstream lifecycle failure: complete rollback PASS.
- Phase 6 direct lifecycle mutation regression: DENY as expected.
- Phase 2 public projection: ALLOW; private supplier boundary: DENY.
- Phase 5 proposal PII boundary: DENY.
- Synthetic cleanup: PASS.

The runner rejects production, validates the isolated project and disposable identities, detects a complete or partial migration state, never blindly reapplies the migration, retains only non-sensitive aggregate evidence under `/tmp`, and cleans synthetic records.

## Local validation

| Check | Result |
|---|---|
| `npx tsc --noEmit` | PASS |
| `npm test` | PASS — 156/156 |
| focused ESLint | PASS |
| `npm run build` | PASS |
| runner syntax (`bash -n`) | PASS |
| matrix syntax (`node --check`) | PASS |
| guarded isolated runner | PASS — 19/19 |
| production project | NOT MODIFIED |

The production build emitted the established schema-cache notices for Phase 2 projections because production is intentionally not migrated during stabilization; compilation and page generation completed successfully.

## Exit criteria

- Acceptance inventory: **COMPLETE**.
- Exact-token atomic command and application trust boundary: **IMPLEMENTED AND VERIFIED**.
- Local commercial, version, mass-assignment, immutability and rollback architecture tests: **PASS**.
- Isolated valid/duplicate/concurrent/version/expiry/revocation/tamper/rollback evidence: **PASS — 19/19**.
- Phase 2–6 focused regressions: **PASSED**; completed capability, RLS and workflow boundaries remain unchanged.
- Production: **NOT MODIFIED**.
- Phase 8: **READY FOR HUMAN REVIEW; NOT STARTED**.
