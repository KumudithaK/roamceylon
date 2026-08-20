# Stabilization Phase 8 Checkpoint

Date: 2026-08-13  
Scope: Accounting, payments and supplier-settlement integrity  
Production project: `fstpfqlgypvktjwdeagu` — **not modified**  
Isolated validation project: `xnsxmwgyugoqanuoyebh`

## Current status

Phase 8 is **COMPLETE**. The guarded isolated verification completed **28/28 PASS with 0 failures**. Account initialization, payment and refund integrity, supplier settlements, reversals, direct-write denial, override authority, closed-account protection, atomic rollback, role boundaries and focused earlier-phase regressions were executably verified. Synthetic cleanup passed. TypeScript, focused lint and 163/163 local tests pass. The build reaches compilation but is blocked only by the previously established unavailable Google Fonts network fetch. Production was not modified, and Phase 9 has not started.

## Financial model inventory

| Resource | Existing purpose | Phase 8 authority |
|---|---|---|
| `journey_proposals` + `journey_proposal_acceptances` | Immutable accepted customer and commercial agreement established in Phase 7 | Sole source for new account selling price, supplier/internal cost, margin, currency, allocation liabilities and operational allowances. |
| `journey_accounts` | One account per enquiry/journey; stores accepted basis and trigger-maintained aggregates | Unique enquiry and journey keys retained. Commercial basis is frozen; closure uses an explicit override command. |
| `accounting_transactions` | Traveller receipts/refunds, supplier payments/waivers/recoveries and compensating reversals | Append-only authoritative event stream. Every command has an account-scoped idempotency key and authoritative account currency. |
| `journey_settlements` | Supplier and operational commitments, paid/waived state and cancellation recovery context | Liability identity remains unique by account/source. Paid and waived totals are derived from events. |
| `accounting_attachments` + `accounting-receipts` | Private transfer-receipt metadata and object storage | Metadata must match the exact account/settlement/transaction path and MIME/size boundary. Existing Phase 4 bucket authorization remains unchanged. |
| `accounting_lifecycle_history` | Account activation, correction and closure audit history | Written in the same database transaction as the sensitive command. |
| `journey_cancellation_cases` | Approved cancellation/refund liability and status | Refund command locks and respects an approved refund outcome when a case exists. |
| `supplier_recoverability_history` | Cancellation-specific supplier recovery decisions | Preserved; Phase 8 does not redesign cancellation assessment. |
| Admin APIs and pages | Existing post, transaction, settlement, reversal and close workflows | UI remains unchanged. Routes now validate strict command DTOs and call explicit service-only RPCs instead of multi-write CRUD. |

Existing NUMERIC money columns and single-currency-per-account semantics are preserved. No FX engine, new accounting product, new payment gateway, or duplicate ledger was introduced.

## Canonical invariants

1. One accepted proposal produces at most one account for an enquiry and journey.
2. New accounts derive price, cost, profit, margin, currency and liabilities only from the exact accepted proposal snapshot; mutable supplier rates cannot rewrite that basis.
3. Posted financial events are positive, append-only, attributed and immutable. Corrections use linked compensating events.
4. Account totals and settlement paid/waived amounts are trigger-derived from transactions; browser payloads cannot set them.
5. A command's account, settlement and currency must agree. A settlement from another account is rejected.
6. A stable account/idempotency key produces one effect; replay with different financial values conflicts.
7. Traveller receipts cannot exceed the open selling balance. Refunds cannot exceed net receipts or an approved cancellation refund when applicable.
8. Supplier payment plus courtesy waiver cannot exceed the outstanding liability; recovery and reversal cannot exceed posted net values.
9. A closed/inactive account rejects ordinary financial events. Only the explicit Super Admin override-close command may apply a documented closure adjustment.
10. Receipt metadata must use `accounting-receipts/journey-accounts/{account}/{settlement}/{transaction}/...` linkage and an approved MIME/size.
11. Financial event, derived totals, settlement state, attachment metadata and audit history commit atomically or all roll back.

## Command architecture

Migration: `supabase/migrations/202608120007_accounting_integrity.sql`  
SHA-256: `d340b3ebf73438a44765b41238934227595dc29e9c19855dcd50a5ee8c4f07a3`

Service-only commands:

- `initialize_journey_account_command` — enquiry advisory lock; exact accepted proposal; one account; snapshot liabilities; first deposit; lifecycle transition in one transaction.
- `record_accounting_transaction_command` — account/settlement row locks; payment/refund/supplier validation; idempotent posting; optional canonical receipt metadata.
- `create_manual_settlement_command` — row-locked idempotent liability creation without exposing supplier tables or arbitrary state.
- `reverse_supplier_settlement_command` — capability-checked linked compensating events, bounded partial reversals and replay safety.
- `close_journey_account_command` — Super Admin-only documented override with supplier-balance acknowledgement and atomic audit history.

All commands use `SECURITY DEFINER`, an empty `search_path`, exact argument types, service-role-only EXECUTE grants and explicit staff-capability checks. Authenticated direct INSERT/UPDATE/DELETE privileges are removed from the five financial tables. Existing read permissions remain capability controlled.

## Application integration

- `post-journey-account.ts` now invokes the atomic accepted-proposal initialization command.
- payment, refund and supplier-payment routes invoke the posting command; receipt upload is performed first and removed if the database command fails or resolves as an idempotent replay.
- manual settlement, reversal and override-close routes invoke their dedicated commands.
- every touched request schema is strict; internal IDs, actor, currency, totals, status, audit fields and derived aggregates cannot be mass-assigned.
- generated database types include the new commands and reversal linkage.

## Executable verification

Runner: `scripts/run-isolated-phase8-accounting-integrity.sh`  
SHA-256: `e4222f2c29a0af9d7ccc90cefc23ae354762720a71e5f8cc19677d2cd7736fc7`

Matrix: `tests/phase8-accounting-integrity.mjs`  
SHA-256: `eeb85e070ebf914ce322c00c6a6ea0940a786985e4b8e1f10ae1a4c411225e71`

The guarded runner rejects production, checks all six disposable staff identities, detects complete/absent/partial Phase 8 state, never blindly reapplies a partial migration, stores private evidence under `/tmp`, uses only synthetic records and cleans them through a test-runner-only database session setting. It verifies valid/duplicate/concurrent payment, account substitution, refund bounds/replay, supplier settlement and waiver, concurrent manual settlement, authorized/unauthorized/replayed reversals, direct rewrite and aggregate denial, Finance/Super Admin closure boundaries, closed-account protection, failure rollback, role denials and focused Phase 2–7 regressions.

Final guarded result: `PHASE 8 ACCOUNTING INTEGRITY VERIFIED: isolated project only.`

Executable outcome: **28/28 PASS, 0 failures**.

- Concurrent account initialization created one account and one accepted-snapshot deposit.
- Valid payment and refund commands passed; duplicate and concurrent payment/refund commands were safe.
- Cross-account settlement substitution, excess refund and closed-account posting were denied.
- Supplier payment/waiver and idempotent concurrent settlement behavior passed.
- Authorized linked reversal passed; duplicate reversal was safe and unauthorized reversal was denied.
- Posted transaction rewrite and stored account aggregate tampering were denied.
- Finance account-override escalation was denied; the explicit Super Admin override passed.
- Invalid receipt linkage forced full financial-event rollback.
- Journey Designer, Partner Manager, Operations and Content Marketing financial mutations were denied.
- Phase 2 public/private boundaries, Phase 5 Finance PII minimization, Phase 6 lifecycle controls and the Phase 7 exact-token boundary passed focused regression checks.
- Phase 3 capability separation and Phase 4 direct database enforcement remain supported by the command capability checks, role-denial matrix and direct financial DML denial.
- Synthetic financial cleanup passed.

## Local validation

| Check | Result |
|---|---|
| `npx tsc --noEmit` | PASS |
| `npm test` | PASS — 163/163 |
| focused ESLint | PASS |
| runner `bash -n` | PASS |
| matrix `node --check` | PASS |
| `npm run build` | BLOCKED only by the established Google Fonts network fetch for Manrope and Playfair Display; no Phase 8 compile error was reported |
| isolated migration/matrix | PASS — 28/28, synthetic cleanup passed |
| production | NOT MODIFIED |

## Exit review

All Phase 8 exit criteria are satisfied by repository evidence, local validation and the completed 28/28 isolated matrix:

- financial inventory and canonical invariants: **COMPLETE AND VERIFIED**;
- accepted commercial basis and concurrent account initialization: **PASS**;
- payment/refund linkage, bounds, idempotency and concurrency: **PASS/SAFE**;
- supplier settlement, concurrent duplication protection and reversal: **PASS/SAFE**;
- direct financial rewrite, aggregate tampering and unauthorized role mutation: **DENIED**;
- Finance override escalation: **DENIED**; explicit Super Admin override: **PASS**;
- atomicity and downstream rollback: **PASS**;
- focused Phase 2–7 regression evidence: **PASSED**;
- production: **NOT MODIFIED**.

Phase 9 is **READY FOR HUMAN REVIEW; NOT STARTED**.
