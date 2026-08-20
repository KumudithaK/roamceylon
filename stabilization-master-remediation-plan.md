# Roam Ceylon Stabilization Phase 0 - Master Audit Consolidation & Remediation Plan

Date: 12 August 2026  
Mode: read, analyse, plan and report only  
Baseline commit: `a500b849d87d224224b6dd601aabac34ca5afa36` (`fix(journey): allow studio date and traveller revisions`, 11 August 2026)  
Change control: this document is the only file created by Phase 0. No code, test, content, configuration, migration, policy or database change was made.

## 1. Executive Summary

The five audits describe a coherent DMC product whose main weakness is not its domain model or premium presentation, but enforcement at stage boundaries. Ninety-one original findings consolidate into 22 root-cause groups. The true release blockers are: legacy authorization bypass, anonymous supplier PII exposure, unrestricted lifecycle mutation, non-atomic allocation/proposal/accounting commands, forged or racing proposal acceptance, inconsistent date/readiness rules, non-idempotent money movement, and divergence between accepted customer terms and mutable supplier obligations.

Remediation must be incremental and reversible. The order is: checkpoint and executable authorization baseline; public-data containment; API and capability cutover; lifecycle commands; journey readiness; transactional allocation/proposal/acceptance; accepted-deal accounting; idempotent financial commands; commercial integrity; launch performance; P1 accessibility; controlled UAT. Large component refactors and scale optimizations must not be mixed into integrity work.

## 2. Current Release Position

**NO-GO for public launch, real traveller proposal acceptance, supplier commitments, live payments or refunds.** Public discovery may remain a controlled preview. Supervised desktop planning exploration is possible, but mobile/unassisted UAT and staff/finance UAT are not signed off. No new P0 is created here; this plan preserves the P0 severity assigned by the audits.

## 3. Audit Inventory

| Audit | Exact source | Date | Scope | P0 | P1 | P2 | P3 | Future findings | Release position |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| 1 - Architecture & Code Quality | `../output/pdf/roam-ceylon-architecture-code-quality-audit-1-of-5.pdf` | 2026-08-11 | Full architecture, code quality, tests, migrations | 3 | 6 | 9 | 3 | 0 enumerated | Controlled development only; no live acceptance, commitments or payments |
| 2 - Security, Privacy & Access | `audit-2-security-privacy.md` | 2026-08-11 | Auth, RBAC/RLS, APIs, storage, privacy, secrets | 4 | 6 | 4 | 1 | 0 enumerated | NO-GO for real data/UAT |
| 3 - Business Logic & Data Integrity | `audit-3-business-logic-data-integrity.md` | 2026-08-11 | State, pricing, proposal, accounting, concurrency | 5 | 10 | 6 | 1 | 0 enumerated | NO-GO for acceptance and money |
| 4 - Performance, Weight & Scale | `audit-4-performance-weight-scalability.md` | 2026-08-11 | Build, payloads, queries, media, scaling | 0 | 7 | 8 | 2 | 0 enumerated | NO-GO for unqualified performance sign-off |
| 5 - UX, Accessibility & UAT | `audit-5-ux-accessibility-uat.md` | 2026-08-11 | Traveller/staff UX, WCAG 2.2 AA assessment, UAT | 0 | 5 | 10 | 1 | 0 enumerated | HOLD; supervised desktop exploration only |

Counts are original table findings, not cross-references or future suggestions. Audit-qualified IDs are used below because `PERF-001` and `QA-001` are reused by different audits.

## 4. Master Findings Summary

### Complete original finding inventory

| Qualified ID | Sev | Original finding and evidence | Original remediation direction | Blocker / cross-reference |
|---|---:|---|---|---|
| A1:ARC-001 | P0 | Legacy admin/editor policies bypass capabilities across CMS/supplier/pricing/storage | Replace with explicit capability policies and role-level DB tests | YES; SEC-001 |
| A1:DATA-001 | P0 | Allocation loops and accounting sync can partially save | One transactional allocation/accounting function | YES; SEC-011, BIZ-015, PERF-006 |
| A1:WF-001 | P0 | Acceptance insert precedes proposal/enquiry updates | Idempotent exact-version transaction | YES; SEC-002/011, BIZ-003 |
| A1:WF-002 | P1 | Free Admin status selection bypasses lifecycle | Guarded commands; audited exceptional corrections | YES; SEC-004, BIZ-018 |
| A1:DATA-002 | P1 | Benefits use original, not curated, dates | Resolve current curated state and snapshot it | YES; BIZ-008 |
| A1:DATA-003 | P1 | Admin presents competing brief/curated truths | Curated operational default; label immutable brief | YES; BIZ-012/021 |
| A1:WF-003 | P1 | Proposal generation/transitions are multi-write | Transactional generation/transitions with idempotency | YES; BIZ-015 |
| A1:ACC-001 | P1 | Financial commands and audit trails can partially save | Transactional accounting commands; recoverable attachments | YES; SEC-011, BIZ-004/015 |
| A1:TEST-001 | P1 | No real DB/RLS/browser E2E coverage | RLS, failure-injection and full lifecycle E2E | YES; SEC-014, A5:QA-001 |
| A1:TYPE-001 | P2 | Manual DB types and unsafe casts hide drift | Generate types; validated command DTOs | NO |
| A1:ARC-002 | P2 | Large modules mix data/domain/state/UI | Extract narrow boundaries without behavior change | NO; PERF-011, A11Y-003 |
| A1:ARC-003 | P2 | `journey-store`/persistence circular import | Move state contracts to neutral domain module | NO |
| A1:DB-001 | P2 | Schema and editorial migrations interleaved | Baseline/catalogue; separate future content releases | NO |
| A1:ERR-001 | P2 | Errors become empty states or raw DB text | Structured error vocabulary, IDs and unavailable states | NO; SEC-012 |
| A1:DATA-004 | P2 | General contacts and journeys share one model | Explicit enquiry kind/source and workflow gate | NO; SEC-006 |
| A1:LEG-001 | P2 | Three pricing architectures coexist | Document authoritative path; isolate compatibility service | NO; BIZ-017 |
| A1:QA-001 | P2 | Lint fails with 7 errors/3 warnings | Correct patterns; require lint in CI | NO |
| A1:OBS-001 | P2 | Critical workflows lack structured telemetry | Correlated events/logs/alerts | NO; PERF-015 |
| A1:PERF-001 | P3 | Proposal uses raw images | Print-compatible optimization | NO; A4:PERF-002 |
| A1:QA-002 | P3 | TS tests emit module-format warnings | Declare module format/test runner | NO; A4:PERF-016 |
| A1:ANALYTICS-001 | P3 | Proposal view counter is read-then-write | Atomic increment if exact analytics matter | NO; BIZ-022 |
| A2:SEC-001 | P0 | Any legacy editor can alter/read protected data through PostgREST/storage | Capability RLS/storage grants; direct role tests | YES; ARC-001 |
| A2:SEC-002 | P0 | Journey Designer can invoke hidden Admin `approved` action | Traveller-only acceptance or privileged audited override | YES; WF-001, BIZ-003 |
| A2:SEC-003 | P0 | Anon full supplier rows expose phone/email/licence; remotely confirmed | Public allowlisted views/DTOs; base tables staff-only | YES |
| A2:SEC-004 | P0 | Broad direct enquiry UPDATE permits arbitrary lifecycle/financial status | Narrow transactional commands; revoke generic UPDATE | YES; WF-002, BIZ-018 |
| A2:SEC-005 | P1 | Legacy quote/partner-convert APIs use admin/editor only | Exact capabilities and redacted DTOs | YES; SEC-001 |
| A2:SEC-006 | P1 | Direct/unbounded public submissions and process-local limiter | Server schemas, bounds and durable abuse controls | YES; DATA-004 |
| A2:SEC-007 | P1 | Plain URL token, optional expiry, no no-store/referrer policy | Digest, mandatory expiry, rotate/revoke, safe headers/logs | YES |
| A2:SEC-008 | P1 | Partner/Ops/Finance receive full enquiry PII | Purpose DTOs/views, access logs, retention | YES |
| A2:SEC-009 | P1 | Missing CSP/frame/HSTS/nosniff/referrer/permissions headers | Tested deployment security headers | YES |
| A2:SEC-010 | P2 | Client MIME trust; partner PII in localStorage | Signature/scan/re-encode; expire/clear local drafts | NO; UX-004 |
| A2:SEC-011 | P1 | Acceptance/proposal/accounting service-role writes are non-atomic | Transactional SECURITY DEFINER commands and events | YES; WF-001/003, ACC-001, BIZ-015 |
| A2:SEC-012 | P2 | Public raw DB errors and no durable proposal action rate limit | Stable public codes, redacted logs, durable rate limits | NO; ERR-001 |
| A2:SEC-013 | P2 | Public website settings reveal setup state | Explicit public settings DTO/view | NO |
| A2:SEC-014 | P2 | Security tests inspect source, not real RLS/API denials | Disposable-project role/API/storage integration tests | NO; TEST-001 |
| A2:SEC-015 | P3 | Raw login errors, no recovery, unnecessary anon RPC execute | Normalize, recovery, revoke unnecessary grant | NO |
| A3:BIZ-001 | P0 | 12-19 Feb is incorrectly validated as 6, not 7, nights | One inclusive-days/exclusive-nights utility | YES |
| A3:BIZ-002 | P0 | Invalid edit can retain ready state; generation does not revalidate | Demote invalid saves; transactional final revalidation | YES |
| A3:BIZ-003 | P0 | Accept/change race creates acceptance plus `changes_requested` | Transactional compare-and-set exclusive response | YES; WF-001, SEC-002/011 |
| A3:BIZ-004 | P0 | Receipts/refunds can double-post after retry/concurrency | Idempotency key, unique constraint, locked balance | YES; ACC-001 |
| A3:BIZ-005 | P0 | Frozen customer total can pair with later mutable obligations | Settlements from accepted snapshot; versioned amendment | YES |
| A3:BIZ-006 | P1 | Non-destination endpoint is omitted internally or disables estimate | Geocode or reviewed manual distance | NO |
| A3:BIZ-007 | P1 | Mixed vehicle inclusions can double-charge whole-route operations | Per-leg inclusion/operations aggregation | NO |
| A3:BIZ-008 | P1 | Benefits use stale enquiry dates/pax | Curated context then immutable proposal snapshot | NO; DATA-002 |
| A3:BIZ-009 | P1 | Inactive/wrong-capacity/coverage/language supplier can be allocated | Server eligibility plus audited override | NO |
| A3:BIZ-010 | P1 | Zero-night stop becomes a day; itinerary can exceed end date | Explicit transit semantics and calendar bound | NO |
| A3:BIZ-011 | P1 | Multi-destination experience uses first matching destination | Explicit journey experience placement | NO |
| A3:BIZ-012 | P1 | Account dates come from original brief | Accepted proposal snapshot dates | NO; DATA-003 |
| A3:BIZ-013 | P1 | Force close can leave supplier balances unresolved | Per-settlement disposition/write-off liability | NO |
| A3:BIZ-014 | P1 | Family room/per-person quantities ignore occupancy/age rules | Reviewed occupancy groups and age supplements | NO |
| A3:BIZ-015 | P1 | Linked domain writes lack transactions | Transactional commands with audit events | NO; supports P0s |
| A3:BIZ-016 | P2 | Two designers overwrite silently | Revision compare-and-set and conflict UI | NO; UX-009 |
| A3:BIZ-017 | P2 | Margin/operations collect in broad traveller “Other” | Customer-safe selling attribution rules | NO; LEG-001 |
| A3:BIZ-018 | P2 | Status values do not prove prerequisites | Central transition service and DB transition policy | NO; SEC-004 |
| A3:BIZ-019 | P2 | Cancellation view confuses gross paid/prior refund/net held | Present all four amounts distinctly | NO |
| A3:BIZ-020 | P2 | Missing cross-record DB constraints | Checks/triggers/commands for ownership/snapshots/transitions | NO |
| A3:BIZ-021 | P2 | Admin overview shows stale brief facts | Label brief vs current curated/accepted truth | NO; DATA-003 |
| A3:BIZ-022 | P3 | Concurrent proposal views lose increments | Atomic SQL increment | NO; ANALYTICS-001 |
| A4:PERF-001 | P1 | Clean build failed after 19.19 s fetching Google fonts | Self-host/provision fonts; capture bundle | YES |
| A4:PERF-002 | P1 | Long proposal eagerly uses raw/CSS single-size images | Responsive print-safe variants and budgets | YES; A1:PERF-001, UX-006 |
| A4:PERF-003 | P1 | Builder: 16 reads, 5 stages, full catalogue client payload | Compact/step-scoped DTOs | NO; UX-001 amplifier |
| A4:PERF-004 | P1 | Estimate repeatedly scans all vehicle/guide/coverage rows | Eligible queries, safe cached bands, telemetry | NO |
| A4:PERF-005 | P1 | Admin lists/histories are unbounded | Server pagination/filters/aggregates | NO |
| A4:PERF-006 | P1 | Allocation save is per-row plus sync/reload | Transactional batch returning changed rows | NO; DATA-001/BIZ-015 |
| A4:PERF-007 | P1 | Detail pages load complete catalogues | Direct slug/related DTO repositories | NO |
| A4:PERF-008 | P2 | No explicit public cache/invalidation policy | Tagged public cache; sensitive no-store | NO; SEC-007/009 dependency |
| A4:PERF-009 | P2 | Accounting uses all rows and N signed URLs | Aggregates, windows, pagination, batch URLs | NO |
| A4:PERF-010 | P2 | Large uploads and orphaned CMS media | Compression, derivatives, ownership, cleanup | NO; SEC-010 |
| A4:PERF-011 | P2 | 45 client modules; large mixed components | Split after stabilization | NO; ARC-002 |
| A4:PERF-012 | P2 | Potential index/query-shape mismatches | Representative EXPLAIN before indexes | NO |
| A4:PERF-013 | P2 | Full history/version JSON grows linearly | Summary DTOs, lazy bodies, retention/archive | NO |
| A4:PERF-014 | P2 | Dashboard capped data appears global | Count/aggregate endpoints with windows | NO |
| A4:PERF-015 | P2 | No production latency/payload/query telemetry | Timings, bytes, Web Vitals and alerts | YES for sign-off; OBS-001 |
| A4:PERF-016 | P3 | Test module warnings | Configure module format | NO; QA-002 |
| A4:PERF-017 | P3 | Footer queries settings on every public route | Cached server public-footer DTO | NO |
| A5:UX-001 | P1 | Builder is 663 px wide in 360 px viewport; 32 px steps | Reflow progress and meet 44 px target | YES; PERF-003 amplifier |
| A5:UX-002 | P1 | Validation alert appears >2,000 px above action | Focus/scroll to summary or invalid field | YES |
| A5:A11Y-001 | P1 | Selected/current states are visual only | `aria-pressed/current`, disabled state, announcements | YES |
| A5:A11Y-002 | P1 | Normal text measured 2.69-3.04:1 | AA-safe semantic text tokens | YES |
| A5:A11Y-003 | P1 | Studio destination order is pointer-drag-only | Keyboard move controls/position announcements | YES; ARC-002 |
| A5:A11Y-004 | P2 | Enquiry/proposal modal focus and semantics incomplete | Accessible dialog primitive and focus lifecycle | NO |
| A5:A11Y-005 | P2 | Repeated transport controls have identical names | Include From/To in accessible names | NO |
| A5:UX-003 | P2 | Future steps look actionable but fail silently | Disabled semantics or prerequisites | NO |
| A5:UX-004 | P2 | Persisted journey silently resumes, no clear reset | Resume/start-new disclosure and clearing | NO; SEC-010 pattern |
| A5:UX-005 | P2 | Full Admin sidebar precedes mobile workspace | Compact authenticated mobile navigation | NO |
| A5:UX-006 | P2 | Long proposal lacks section/jump navigation | Compact navigation/return to actions | NO; PERF-002 |
| A5:UX-007 | P2 | Public/Admin current links lack `aria-current` | Programmatic current-page state | NO |
| A5:UX-008 | P2 | Footer omits Terms/Privacy discovery | Legal/privacy links and identity path | NO; SEC-007/008 |
| A5:UX-009 | P2 | No staff save-conflict UI | Compare-and-set conflict handling | NO; BIZ-016 |
| A5:UX-010 | P3 | Quote/proposal terms coexist | Standardize proposal terminology | NO |
| A5:QA-001 | P2 | No configured automated accessibility checks | Targeted automation plus manual release script | NO; TEST-001/SEC-014 |

## 5. Deduplication / Cross-Audit Map

| Relationship | Findings | Consolidation rule |
|---|---|---|
| SAME ROOT CAUSE | ARC-001 + SEC-001 + SEC-005 | One capability cutover; API and DB/storage verification remain separate |
| SAME ROOT CAUSE | DATA-001 + BIZ-015 + SEC-011 + PERF-006 | Transactional allocation command fixes integrity and latency; never “batch” outside a transaction |
| SAME ROOT CAUSE | WF-001 + SEC-002 + BIZ-003 | Traveller authority and exclusive exact-version transaction are one acceptance design |
| SAME ROOT CAUSE | WF-002 + SEC-004 + BIZ-018 | Remove direct lifecycle mutation; use command state machine |
| DEPENDENCY | BIZ-001 -> BIZ-002 -> proposal generation | Correct date contract before readiness/transaction logic |
| DEPENDENCY | SEC-014/TEST-001 -> every security cutover | Executable denial tests precede policy replacement |
| AMPLIFIER | UX-001 + PERF-003 | Payload may worsen mobile use, but reflow and loading are separately verified |
| AMPLIFIER | UI pending states + BIZ-004 | Disabling buttons helps UX; only idempotency/locking fixes money integrity |
| DUPLICATE | A1:PERF-001 + A4:PERF-002 | One proposal media programme; Audit 4 supplies launch measurement |
| DUPLICATE | ANALYTICS-001 + BIZ-022 | One optional atomic counter change |
| CONFLICT | PERF-008 caching vs SEC-007/009 privacy | Security/no-store wins for proposal/admin/finance; cache only public DTOs |
| CONFLICT | Convenience status editing vs SEC-004/BIZ-018 | State integrity wins; exceptional correction must be privileged/audited |
| CONFLICT | Normalization vs immutable proposal/accepted snapshots | Contract immutability wins; normalize sources before snapshot, never rewrite sent versions |
| CONFLICT | Faster per-row batching vs DATA-001/BIZ-015 | Atomic correctness wins; optimize inside one command |
| CONFLICT | Automatic family pricing vs BIZ-014 | Human-reviewed commercial correctness wins until policy exists |
| INDEPENDENT | UX/A11Y P1s | Narrow UI/semantic fixes after domain behavior stabilizes; no redesign |

## 6. Root Cause Groups

1. **Legacy authorization compatibility:** profile `admin/editor` remains an unintended authority beside capability tables.
2. **Public data boundary:** base supplier/settings rows double as public DTOs.
3. **Lifecycle authority:** mutable status columns substitute for guarded business commands.
4. **Transaction orchestration:** critical events are sequential application writes.
5. **Acceptance authority/versioning:** staff and traveller paths are not exclusively separated.
6. **Financial concurrency:** balances are read then inserted without idempotency or locks.
7. **Stage source of truth:** brief, curated journey, proposal and allocations are consulted inconsistently.
8. **Journey temporal/readiness contract:** days, nights, transit and readiness have competing implementations.
9. **Supplier suitability/allocation model:** coverage, capacity, placement and concurrency are guidance, not invariants.
10. **Commercial attribution/policy:** mixed operations, family occupancy and customer-safe breakdown rules are incomplete.
11. **Proposal capability-link/privacy:** token lifecycle, headers and errors need hardening.
12. **Public input/file/local privacy:** direct submissions, MIME trust and persistent drafts lack bounded controls.
13. **Assurance/observability:** source tests and green unit tests do not prove DB transactions, RLS or UAT.
14. **Build/proposal media:** reproducible build and bounded long-proposal delivery are absent.
15. **Read/query architecture:** full catalogues and unbounded Admin reads amplify growth.
16. **Storage/history growth:** orphaned media and full snapshots need lifecycle policy later.
17. **Core mobile/accessibility:** Builder reflow, error recovery, state, contrast and keyboard reorder fail launch criteria.
18. **Secondary UX/accessibility:** dialogs, labels, location, persistence and long-document navigation.
19. **Code/type quality:** large components, cycle, casts, lint and test runtime noise.
20. **Database structural governance:** missing cross-record constraints and mixed migration/content history.
21. **Analytics accuracy:** view counts are non-atomic but non-commercial.
22. **PII purpose/retention:** staff receive more traveller data than their task requires.

## 7. True P0 Release Blockers

| Consolidated P0 | Original IDs | Failure scenario / impact | Required remediation | Dependencies / verification |
|---|---|---|---|---|
| P0-A Capability bypass | ARC-001, SEC-001 | Any editor reads/changes rates, partner data, CMS or storage outside role | Exact capability APIs plus atomic RLS/storage cutover | Phase 1 harness; real role x resource matrix |
| P0-B Anonymous supplier PII | SEC-003 | Public key scrapes supplier phone/email/licence | Staff-only base tables; public allowlist DTO/view | Public route compatibility; anon negative column tests |
| P0-C Lifecycle mutation bypass | SEC-004, WF-002 | Staff directly marks accepted/paid/completed/cancelled | Revoke generic update; transactional command graph | Capability cutover; state transition integration tests |
| P0-D Allocation partial save | DATA-001 | Mid-loop failure leaves partial allocations/accounting sync | One atomic batch command and audit event | Lifecycle and ownership constraints; failure injection |
| P0-E Acceptance authority/race | WF-001, SEC-002, BIZ-003 | Forged approval or accept/change race produces contradictory contract | Traveller-only compare-and-set transaction; explicit override policy | Human decision; concurrent V1/V2 tests |
| P0-F Date/readiness defect | BIZ-001, BIZ-002 | Valid seven nights rejected; invalid ready journey generates proposal | Shared date contract; derived readiness; generation revalidation | Date matrix; invalid-ready and zero-night tests |
| P0-G Duplicate money | BIZ-004 | Retry/two Finance users double-post receipt/refund | Required idempotency keys, unique constraint, row lock | Accounting source freeze; concurrency tests |
| P0-H Accepted-deal divergence | BIZ-005 | Customer contract stays frozen while obligations rebuild from later allocations | Supplier commitments from accepted allocation snapshot; versioned amendment | Human adjustment policy; post-acceptance replacement tests |

## 8. Authorization Target Architecture

- **Database source of truth:** `staff_roles`, `staff_role_permissions`, `profile_staff_roles`, `permissions`, and `private.has_permission`. `profiles.role` is compatibility metadata only and must cease authorizing business data.
- **Application mirror:** `lib/admin/permissions.ts` may provide typed names/defaults but must not independently grant authority.
- **RLS/storage:** capability-specific table and path policies; base supplier/PII/pricing tables never public. Direct writes denied unless the role truly owns CRUD.
- **APIs:** `authenticatedStaff` plus one exact action capability, allowlisted input/output DTO and server audit identity.
- **UI:** permission-aware navigation is convenience only; denial remains enforced below it.
- **Target roles:** Super Admin all; Journey Designer brief/curation/proposal and limited supplier view; Partner Manager supplier/rate/allocation; Operations accepted-delivery data; Finance commercial/ledger; Content CMS only.
- **Safe cutover:** (1) capture live policy/grant inventory; (2) add executable role tests; (3) deploy API/client compatibility; (4) atomically replace legacy policies/grants in one migration; (5) smoke-test every role; (6) retain a reviewed rollback migration. Never temporarily add broad fallback policies.

## 9. Lifecycle / State Machine Target

| Transition | Actor | Preconditions | Atomic side effects / audit / idempotency |
|---|---|---|---|
| `new -> under_review` | Journey Designer | Valid journey enquiry kind | Status + actor/time event; repeat returns current state |
| `under_review -> preparing_proposal` | Journey Designer | Curated journey exists | Enquiry + curated design status event |
| Curated `not_started -> designing` | Journey Designer | Detached brief copy | Create once; immutable original retained |
| `designing -> ready_for_allocation` | Journey Designer | Date/pax/route/night validation passes | Derived readiness result + audit event |
| `ready_for_allocation -> allocation_in_progress` | Partner Manager | Required scopes materialized | Allocation batch revision/event |
| `allocation_in_progress -> ready_for_proposal` | Journey Designer/Partner Manager command | All required allocations eligible, priced, reviewed | Revalidate curated journey and allocations; no free status update |
| Proposal `ready -> internal_approved` | Authorized proposal approver | Valid snapshot, range reason if needed | Version/review event; human role decision may be required |
| `internal_approved -> sent`; enquiry `-> proposal_sent` | Journey Designer | Version immutable, token/expiry created | Supersede prior active version, token digest, send event; idempotent send key |
| `sent/viewed -> changes_requested`; enquiry `-> preparing_proposal` | Traveller token | Exact active version, CAS status | Request + both statuses in one transaction; exclusive with acceptance |
| `sent/viewed -> approved`; enquiry `-> proposal_accepted` | Traveller token only | Exact active version, identity/terms, CAS | Acceptance + statuses + immutable event in one transaction |
| `proposal_accepted -> deposit_requested` | Finance/Journey command | Accepted version is account source | Account/deposit schedule event |
| `deposit_requested -> deposit_paid -> journey_confirmed` | Finance command | Idempotent receipt reaches threshold | Ledger + account/enquiry states atomically |
| `journey_confirmed -> ready_for_operations -> travelling -> completed -> archived` | Operations then authorized close | Accepted snapshot, obligations/operational gates | Each guarded transition emits actor/reason/event |
| Any permitted active state `-> cancelled` | Authorized cancellation command | Policy and existing money/commitments assessed | Cancellation case, statuses and audit; not a free select |

Readiness should be derived from the current curated revision and persisted only as a cached state with its revision; every proposal command independently revalidates.

## 10. Transaction / Concurrency Target

| Workflow | Current failure window | Target boundary | Concurrency/idempotency | Rollback expectation |
|---|---|---|---|---|
| Curated save | Itinerary -> history -> review flags | One transaction | Optimistic revision/CAS | No itinerary change without history/flags |
| Allocation batch | Per-row upserts -> status -> account sync | One allocation command | Journey revision + logical-scope uniqueness | All allocations/sync commit or none |
| Proposal generation | Insert -> supersede -> enquiry/curated status | One version command | Lock journey; unique next version; request key | No orphan/split version state |
| Change request | Request -> proposal -> enquiry | One exact-version command | CAS `sent/viewed`; idempotent response | No request without matching statuses |
| Acceptance | Acceptance -> proposal -> enquiry | One exact-version command | CAS; unique acceptance; request key | No acceptance without approved states |
| Account activation | Account -> initial receipt -> commitments -> history | One command | Accepted proposal ID unique | No partial account |
| Customer receipt/refund | Read balance -> insert -> states | One ledger command | Lock account; idempotency key/unique constraint | No overpayment/duplicate posting |
| Supplier payment/waiver | Read settlement -> update -> transactions -> attachment | Financial DB portion atomic; file staged/finalized separately | Lock settlement; idempotency key | DB rolls back; orphan file cleanup is recoverable |
| Cancellation/refund | Assessment -> approvals -> ledger -> states | One transaction per domain command | Case revision, locks and request keys | Each step either fully records or not |
| Supplier replacement after acceptance | Mutable allocation -> sync | Explicit amendment command | Lock accepted version/account; new amendment version | Original contract/commitments unchanged until amendment commits |

UI pending states remain required, but are not integrity controls.

## 11. Accounting Source-of-Truth Target

- **Customer obligation:** the accepted `journey_proposals` version and its immutable customer/commercial snapshot. Customer receipts/refunds reference that version/account.
- **Supplier/operational obligation:** the allocation snapshot accepted with that proposal, materialized once as settlement commitments. Never silently rebuild active commitments from current allocations.
- **Post-acceptance replacement:** preserve original commitment; create an explicit amendment/adjustment and settlement delta with actor, reason and approval. Policy is a human decision.
- **Balances:** derive from append-only ledger entries plus explicit settlement/waiver dispositions; never from UI status alone.
- **Cancellation:** show gross receipts, previous refunds, net cash held, non-recoverable costs and remaining approved refund separately.
- **Closure:** allowed only when customer and every supplier balance has a disposition; force closure creates explicit write-off/liability records, not hidden outstanding amounts.

## 12. Journey Integrity Target

Authoritative contract: `days = calendar date difference + 1`; `nights = calendar date difference`; `sum(destination nights) <= journey nights`; same-day is 1 day/0 nights; zero-night destinations are transit stops and do not create stays or forced full destination days. Pickup/drop-off are route endpoints, not destinations. Non-catalogue endpoints require coordinates or reviewed manual distance before estimate/proposal.

Traveller intent remains immutable in `enquiries.trip_state`. The current `curated_journeys.itinerary` is authoritative for design, dates, pax, order, nights, experience placement, transport, guides and benefit eligibility until a proposal is accepted. The accepted proposal then becomes authoritative for traveller contract, operations and accounting.

Readiness is calculated from the current curated revision, required allocation scopes, eligibility, rates, experience placement and date/night reconciliation. Any dependent edit invalidates readiness and proposal freshness.

## 13. Supplier / Allocation Integrity Target

Required server invariants: allocation belongs to the same enquiry/curated journey; one active allocation per logical scope; supplier active and appropriate to type; stay destination/occupancy/rate reviewed; vehicle coverage/capacity/leg/inclusions reviewed; guide licence class/coverage/language/service interval reviewed; experience provider explicitly placed. Authorized suitability overrides require capability, reason and audit event.

Traveller preferences never become supplier assignments. Supplier identities/cost/contact remain internal. Replacements preserve history, invalidate unsent proposals, and require amendment after acceptance. Batch save uses one revision and transaction.

## 14. Proposal Integrity Target

Draft and preview derive only from one validated curated revision plus eligible allocation/commercial snapshots. Generation locks sources, creates one next version, supersedes prior active versions and records statuses atomically. Sent versions are immutable. Tokens are version-owned, stored as digests, mandatory-expiry, revocable, no-store and absent from logs/referrers. Traveller view receives a customer DTO only.

Acceptance and change requests are mutually exclusive CAS commands against the exact current sent/viewed version. Staff cannot impersonate acceptance. Any exceptional override requires a separately approved human policy, capability, immutable provenance and visible label. Post-send design changes create staleness; post-acceptance changes require an amendment/new commercial agreement, never snapshot mutation.

Traveller-friendly total, per-person value, inclusions, payment schedule and current proposal hierarchy are preserved. Selling-price category attribution must be defined independently of supplier cost/margin so “Other” is not misleading. Benefits remain customer-safe and only claim verified comparable savings.

## 15. Performance Launch Requirements

**Launch required:** reproducible font-independent production build and bundle baseline (PERF-001); responsive/print-safe proposal media with measured 5/14/30-day budgets (PERF-002); production-like homepage/Builder/proposal mobile traces; route/query/payload/Web Vitals observability (PERF-015); explicit no-store for sensitive responses and safe caching only for public DTOs.

**Before scale:** compact Builder/detail/estimate DTOs, eligible supplier queries, Admin/accounting pagination and aggregates, transactional allocation batches, batched signed URLs, measured indexes, media lifecycle controls.

**Future:** archival/partitioning, background media/export jobs, reporting read models, large-scale CDN controls and component splitting after stable boundaries.

## 16. UX / Accessibility Launch Requirements

Without redesigning the brand or product model, resolve before unassisted UAT: Builder 360 px reflow and 44 px targets; error summary/focus recovery; `aria-pressed/current/disabled` and step announcements; 4.5:1 normal-text contrast; keyboard destination reordering with position announcements. Then correct dialog focus/semantics, route-specific control names and a clear resume/start-new choice before public launch. Proposal jump navigation and Admin mobile convenience may follow launch if controlled UAT confirms workarounds.

## 17. DO NOT REGRESS List

- Immutable submitted traveller brief and detached curated journey.
- Traveller preferences separated from internal supplier allocation.
- Journey-wide primary guide, destination specialist guide and “No primary guide” model.
- Journey-wide transport preference with route-leg overrides and explicit pickup/drop-off legs.
- Theme/destination/experience mapping, union/deduplication and Sporting Sri Lanka isolation.
- Experience participant counts/pricing separate from whole-trip counts.
- Public estimated ranges that hide supplier identity, cost and margin and fall back honestly.
- Supplier identities, contacts, costs and internal notes hidden from travellers.
- Immutable sent proposal versions, customer DTO, version-specific traveller view and V1/V2 isolation.
- Proposal visual/content hierarchy, one customer total, payment schedule, inclusions/exclusions and traveller-safe language.
- Enquiry modal expectation: no payment and contact within 24 hours; submission reset behavior.
- Existing accounting reversals/waivers/history rather than destructive deletion.
- Benefits snapshot/customer redaction and verified-comparison safeguards.
- Existing 132 passing domain tests, reduced-motion handling, semantic public structure and premium design direction.

## 18. Human Decisions Required

| Question | Why it matters | Current options/evidence | Decision point |
|---|---|---|---|
| May staff ever record traveller acceptance? | Prevents impersonation/disputes | Hidden Admin approval exists; audits require traveller-only or exceptional override | Before Phase 10 |
| Who can approve exceptional lifecycle/financial corrections? | Commands need an escalation path | Current direct status/force close is too broad | Before Phase 6/12 |
| What amendment policy applies after acceptance? | Supplier replacements can change profit/liability | Current sync mutates obligations; proposal stays frozen | Before Phase 11 |
| How are unresolved supplier liabilities closed/written off? | Force close currently hides exposure | Settle, waive and force close exist | Before Phase 11/12 |
| Family occupancy and child/infant pricing rules? | Automatic room/per-person totals can be wrong | Simple max-guests/party multiplication | Before Phase 13 |
| Are infants included in public per-person denominator? | Range meaning can mislead | Current denominator includes infants | Before Phase 13 |
| Currency/FX policy? | Fixed config and allocations may combine currencies | No conversion snapshot model | Before multi-currency live use |
| Supplier eligibility override authority/evidence? | Real exceptions exist, but must be auditable | UI can select “other” suppliers | Before Phase 8 |
| Manual endpoint distance/geocoding authority? | Cost and route depend on it | Exact destination match only | Before Phase 7/13 |
| Who bears benefit fulfilment cost? | Benefits are outside accounting | Assumed zero/pre-negotiated or elsewhere | Before Phase 13 |
| Data retention/deletion and proposal-link lifetime? | PII/snapshots currently persist indefinitely | No policy; optional proposal expiry | Before Phase 2/9 |

## 19. Database Migration Strategy

Use expand/validate/contract. Never modify historical migrations. Every new migration is transactional where PostgreSQL permits, has a reviewed rollback, validates existing data before adding strict constraints, and is tested on a restored copy first.

| Planned migration purpose | Affected areas | Backfill | Compatibility risk / rollback | App dependency / required test |
|---|---|---|---|---|
| Public supplier/settings DTO boundary | Supplier/settings views, grants, anon policies | None or view projection | Public pages may expect full rows; rollback grants/view | Compatible public repositories first; anon column denial |
| Capability RLS/storage cutover | Legacy policies/grants/buckets | Verify role assignments | Staff lockout; atomic rollback policy migration | Exact-capability APIs deployed; full role matrix |
| Command-only lifecycle | Enquiries/status policies, command functions/events | Validate current state combinations | Old clients directly update status; contract migration | Compatible command client; transition tests |
| Date/readiness revision contract | Curated journey revision/status/validation function | Audit invalid ready rows; no silent correction | Existing invalid rows need quarantine | Shared date logic; readiness matrix |
| Allocation ownership/batch command | Allocations, logical uniqueness, revision/audit | Detect duplicates/mismatched ownership | Existing anomalies may block constraint | Studio/allocation API; rollback preserves rows |
| Proposal generation/token hardening | Proposals, token digest/expiry/version command | Rotate active test tokens; preserve sent snapshots | Old links need controlled grace/rotation | New public link resolver; token tests |
| Acceptance/change command | Acceptance/change/event constraints | Validate contradictory records | Historical contradictions require report/manual decision | New API; concurrency suite |
| Accepted commitment snapshot/amendments | Accounts/settlements/amendment records | Snapshot active accounts from accepted versions after validation | Financial backfill requires human reconciliation | Accounting service; accepted-deal tests |
| Ledger idempotency/locking | Transactions, idempotency unique keys, command RPCs | Existing entries get immutable legacy keys | Old clients lack keys | Finance API/client; concurrent posting tests |
| Cross-record/eligibility constraints | Ownership/status/rate references | Validation report first | Supplier historical exceptions | Audited override command; fixture matrix |

## 20. Existing Data Safety Plan

Before each migration, produce read-only anomaly counts and IDs for enquiries, curated journeys, suppliers/rates, allocations, proposals/acceptances, accounts/transactions/settlements, benefits and CMS links. Never rewrite sent proposal snapshots or ledger entries. Quarantine/report contradictory historical records; require human reconciliation for accepted/financial data. Preserve legacy read compatibility behind explicit adapters until every referenced record is classified. Backfills are deterministic, restartable, checksum/report their changes and run first on a restored isolated database. Storage objects are not deleted during stabilization; orphan cleanup is a later reviewed phase.

## 21. Backup / Checkpoint Plan

Execute immediately before Phase 1, not now:

1. Preserve the current worktree, including the five audit artifacts and this plan, in a human-reviewed documentation-only commit; current baseline SHA before that commit is `a500b849d87d224224b6dd601aabac34ca5afa36`.
2. Create `backup/pre-stabilization-20260812` and annotated tag `pre-stabilization-20260812` at the immutable documentation checkpoint; record both SHAs and `git status --short`.
3. Export an encrypted full database backup plus schema-only dump, roles/grants/policies/functions/storage policy catalogue and migration history. Prefer provider backup/PITR plus `pg_dump`-compatible artifact. Record SHA-256 checksums.
4. Restore the backup to an isolated project and run read-only record counts/foreign-key/snapshot checks. A backup without restore proof is not the gate.
5. Inventory environment variable **names**, deployment/runtime versions, Supabase project reference, bucket names and config hashes without values/secrets.
6. Record `npm test`, typecheck, lint and clean production-build outputs; preserve known failures rather than correcting them during checkpoint.
7. Copy all five audits and the master plan into the checkpoint; no generated backup or secret enters Git.

## 22. Text Dependency Graph

```text
Verified checkpoint + isolated test identities
    -> Public supplier/PII DTO boundary
    -> Exact API capability compatibility
        -> Atomic capability RLS/storage cutover
            -> Command-only lifecycle foundation
                -> Shared date/readiness contract
                    -> Atomic curated/allocation workflow
                        -> Atomic proposal generation/token lifecycle
                            -> Traveller acceptance/change transaction
                                -> Accepted-deal/accounting source freeze
                                    -> Idempotent payments/refunds/settlements/cancellation
                                        -> Commercial/benefit/occupancy integrity
                                            -> Launch build/media/observability
                                                -> P1 mobile/accessibility
                                                    -> Full security/business/performance regression
                                                        -> Isolated controlled UAT
                                                            -> Launch readiness review
```

Public submission/upload hardening can proceed after authorization cutover without blocking date work. Before-scale query optimization branches only after transactional/source-of-truth work, so it cannot weaken correctness.

## 23. Stabilization Phase Plan

| Phase | Title / objective | Findings primarily resolved | Likely areas | Migration | Risk / dependencies | Do not touch | Tests / exit / rollback |
|---:|---|---|---|---|---|---|---|
| 0 | Master consolidation (this document) | Planning only | Audit artifacts | No | Low | Everything | This file only |
| 1 | Immutable checkpoint and authorization test baseline | TEST-001, SEC-014 foundation | Git, backup, isolated Supabase test harness | No production migration | Low; none | Product behavior | Restore proof; baseline role matrix records expected failures; rollback to tag |
| 2 | Public supplier/settings data boundary | SEC-003, SEC-013, part SEC-008 | Public views/DTO repositories/RLS grants | Yes | High; Phase 1 | Supplier CMS/editors | Public pages pass; anon sensitive columns deny; rollback view/grants |
| 3 | Exact API capability and purpose DTO compatibility | SEC-005, SEC-008 | Legacy APIs, authenticatedStaff, response DTOs | Maybe views only | Medium; Phase 1/2 | Lifecycle/business rules | API allow/deny matrix; no staff lockout; rollback deploy |
| 4 | Capability RLS and storage cutover | ARC-001, SEC-001 | All legacy policies/grants/buckets | Yes | High; Phase 3 | Public behavior, domain logic | Every role/table/storage matrix pass; atomic rollback migration |
| 5 | Public submission, enquiry kind and upload hardening | SEC-006/010/012, DATA-004 | Enquiry/partner APIs, validation, limiter, file pipeline | Likely | Medium; Phase 4 | Builder flow/content | Boundary/abuse/file tests; safe error codes; rollback API/migration |
| 6 | Command-only lifecycle foundation | WF-002, SEC-004, BIZ-018 | Enquiry workflow, command RPC/API, audit events | Yes | High; Phase 4 | Proposal/accounting calculations | Transition matrix/forbidden direct update; rollback command policy |
| 7 | Unified date, transit and readiness contract | BIZ-001/002/006/010, DATA-003 | Journey domain, Studio, proposal preconditions | Likely revision fields/functions | High; Phase 6 | Mapping/preferences | Date property tests; invalid rows reported; rollback app + migration |
| 8 | Atomic curated journey and allocation integrity | DATA-001, BIZ-009/011/014/015/016/020, PERF-006 | Studio, allocation commands, eligibility, revisions | Yes | High; Phase 7 | Traveller preferences, supplier catalogue CRUD | Failure injection, CAS, suitability, batch tests; rollback command |
| 9 | Atomic proposal generation and secure token lifecycle | WF-003, SEC-007/009/012, BIZ-002 | Proposal command, token resolver, headers | Yes | High; Phase 7/8 | Sent snapshot content/design | Version races, expiry/revoke/no-store, rollback with legacy grace |
| 10 | Traveller acceptance/change authority transaction | WF-001, SEC-002/011, BIZ-003 | Traveller proposal service/API/DB command | Yes | High; Phase 9 + human policy | Proposal visuals | Concurrent accept/change/V1/V2/forged admin tests; rollback command |
| 11 | Accepted-deal accounting source of truth | BIZ-005/012/013, DATA-003 | Account posting, commitments, amendments | Yes | High; Phase 10 + human policy | Historical ledger/snapshots | Post-acceptance replacement and closure tests; reconcile report/rollback |
| 12 | Idempotent financial and cancellation commands | ACC-001, BIZ-004/019, SEC-011 | Receipts, refunds, settlements, waivers, cancellation | Yes | High; Phase 11 | Pricing formula/UI design | Two-user/retry/failure tests; ledger invariants; rollback functions |
| 13 | Commercial, benefits and family integrity | DATA-002, LEG-001, BIZ-007/008/014/017 | Pricing, benefits, occupancy review, proposal breakdown | Possibly | Medium; Phase 7/11 + human policies | Traveller-safe total presentation | Pricing/benefit/family/mixed-leg tests; rollback rules |
| 14 | Launch build, proposal media and observability | A4:PERF-001/002/015, OBS-001 | Fonts, proposal assets, telemetry, cache headers | No/possibly config | Medium; secure routes complete | Brand/proposal content | Clean build; 5/14/30-day budgets; redacted traces; rollback deploy |
| 15 | P1 mobile and accessibility stabilization | UX-001/002, A11Y-001/002/003 | Builder progress/errors/semantics, tokens, Studio reorder | No | Medium; behavior stable | Product model/visual redesign | 360 px, 200% zoom, keyboard/SR/contrast tests; rollback UI commit |
| 16 | Release assurance and controlled UAT | TEST-001, SEC-014, A5:QA-001; all regressions | CI, isolated fixtures, E2E/a11y/perf | Test data only | Medium; Phases 2-15 | Production data | All gates below; rollback to phase tags |

Each phase gets its own branch/commit/tag or deploy checkpoint and must not absorb post-launch refactors.

## 24. Test Strategy

- **Unit/domain:** date properties, transit, quantities, mixed inclusions, customer breakdown, benefit eligibility, status guards.
- **Database integration:** real constraints, ownership, snapshots, rollback after each statement, restored-data backfills.
- **RLS/authorization:** real JWTs for every role, table, bucket and RPC; positive and negative cases.
- **Transaction/concurrency:** two sessions, idempotency replay, CAS conflicts, row-lock balance consumption and failure injection.
- **API:** malformed/oversize payloads, wrong capability, ID ownership, stable error codes, token expiry/revocation and cache headers.
- **E2E:** brief -> curate -> allocate -> V1 -> change -> V2 -> accept -> deposit -> operations -> cancellation/refund/close.
- **Accessibility:** automated semantics/contrast where reliable plus keyboard, screen reader, focus, 360 px and 200% manual checks.
- **Performance:** clean build/bundles, Slow 4G, 5/14/30-day proposal, query counts/bytes and representative datasets.
- **UAT:** isolated personas/fixtures; no production data or money.

## 25. Security Test Matrix

Legend per cell: `R/C/U/D/A`; `+` allowed, `-` denied. `A` is a guarded server action, not direct table mutation. Purpose-redacted reads are noted `r`.

| Resource | Anonymous/public | Journey Designer | Partner Manager | Finance | Operations | Content | Super Admin |
|---|---|---|---|---|---|---|---|
| Published content DTO | `R+ C-U-D-A-` | `R+ ----` | `R+ ----` | `R+ ----` | `R+ ----` | `R+ C+U+D+ A+` | all + |
| Supplier public DTO | `R+ ----` | `r+ ----` | `R+ ----` | `r+ ----` | `r+ ----` | public only | all + |
| Supplier base/contact/rates | all - | `r+`, CRUD/A - | `R+C+U+D+ A+` | `r+`, CRUD - | `r+`, CRUD - | all - | all + |
| Enquiry submission | `R- C- U-D- A+` via bounded API | — | — | — | — | — | all + |
| Traveller PII/brief | own token scope only | `r+`, direct writes -, design actions + | task-redacted `r+` | finance-redacted `r+` | ops-redacted `r+` | all - | all + |
| Curated journey | all - | `R+ C/U via A+`, D- | `R+`, allocation A+ | `r+` | `r+` | all - | all + |
| Allocations | all - | redacted R+, no cost/action | `R+ A+`, direct C/U/D- | commercial R+ | ops-redacted R+ | all - | all + |
| Proposal prepare/send | token view only | `R+ A+` | R- | `r+` | `r+` after acceptance | all - | all + |
| Proposal accept/change | token-owned `A+`; table CRUD - | **A- accept** | A- | A- | A- | A- | override only if approved policy |
| Accounting/ledger | all - | all - | settlement task-redacted only | `R+ A+`, direct C/U/D- | ops-redacted R+ | all - | all + |
| Roles/capabilities | all - | own assignment R only | own R | own R | own R | own R | all + |
| Private storage | all - unless signed purpose URL | purpose-only | partner files by capability | receipts by capability | ops docs by capability | travel-content only | all by explicit capability |

## 26. Transaction Test Matrix

| Race/retry | Expected final state |
|---|---|
| Accept twice, same key | One acceptance; identical successful replay result; one approved proposal/enquiry event |
| Accept twice, different keys | One wins; other receives deterministic conflict; no second event |
| Accept vs request changes | Exactly one terminal action commits; losing action leaves no row/status |
| V1 acceptance after V2 sent | V1 denied/superseded; only current version actionable |
| Proposal generation by two staff | Sequential unique versions or one conflict/retry; never duplicate active version |
| Customer payment twice | One ledger entry for same key; balance never exceeded |
| Refund twice / two Finance users | One refund up to approved remaining; deterministic replay/conflict |
| Supplier payment/waiver race | Amount paid + waived never exceeds due; complete audit history |
| Supplier replacement race | One revision wins; loser gets conflict; accepted commitments unchanged without amendment |
| Two Journey Designers save | One revision wins; loser receives conflict and can compare/rebase; no silent overwrite |
| Inject failure at each command write | Entire DB command rolls back; staged file cleanup/retry is visible and recoverable |

## 27. Regression Matrix

| Known-good behavior | Threatening phases | Required regression |
|---|---|---|
| Theme/destination/experience mapping | 2, 4, 7 | Mapping union/intersection and Sporting isolation |
| Traveller preference vs allocation | 7, 8, 11 | Original preference immutable; supplier separate |
| Primary/specialist/no-guide model | 8, 13 | Existing guide scope tests + supplier eligibility |
| Transport default + leg overrides/endpoints | 7, 8, 13 | Four endpoint patterns and mixed mode |
| Experience participants/pricing | 7, 13 | Counts <= trip; per-experience price |
| Planning range redaction/fallback | 2, 13, 14 | No supplier/cost/margin; family/infant fallback |
| Proposal immutable versions/customer DTO | 9, 10, 13 | V1 unchanged after V2; exact token/version |
| Proposal premium hierarchy/PDF parity | 9, 14, 15 | Visual/print snapshot and customer totals |
| Benefits redaction/verification | 11, 13 | Curated dates/pax; no unverified savings |
| Ledger reversals/waivers/cancellation math | 11, 12 | Existing arithmetic plus concurrency |
| Enquiry success/reset/24-hour expectation | 5, 15 | Form validation, success and reset E2E |

## 28. UAT Environment Plan

Use an isolated Supabase project and non-production deployment with synthetic names/contact data, outbound email/WhatsApp sandboxed, payment actions simulated and Storage buckets disposable. Create one account per role: Super Admin, Journey Designer, Partner Manager, Finance, Operations and Content. Seed published content, compatible/incompatible suppliers and rates, a family case, mixed transport, zero-night transit, geocoded/manual endpoint, V1/V2 proposals/tokens, accepted journey, account, deposits, supplier commitments, partial payment, cancellation, recovery and refund. Reset by deterministic seed; preserve event logs; never clone real PII unless anonymized and approved.

## 29. UAT Gates

| UAT category | Safe after |
|---|---|
| Discovery/content | Phase 2 public DTO tests; current mapping regressions pass |
| Journey Builder supervised desktop | Phase 7 date/readiness; no money/acceptance |
| Journey Builder mobile/unassisted | Phase 15 P1 accessibility/reflow pass |
| Staff journey design/allocation | Phases 4, 6, 7, 8 and role/concurrency tests |
| Proposal view | Phases 9 and 14; disposable token/privacy/media checks |
| Proposal acceptance/revision | Phase 10 plus exact-version concurrency/security matrix |
| Finance/payments/refunds/cancellation | Phases 11-12 plus two-session ledger tests |
| Operations handoff | Phases 11-13; accepted snapshot is authoritative |
| Public beta without money | Phases 2-10, 14-16 and privacy/accessibility gates |
| Real-money test | All P0s, Phases 11-13, finance UAT, reconciliation/rollback drill |
| Public launch | Every gate in Section 30 and human launch approval |

## 30. Launch Gates

- **Security:** all P0 security closed; role/RLS/storage/API matrix green; supplier PII and purpose PII protected; token/header controls verified over HTTPS.
- **Business:** BIZ-001-005 closed; transition graph enforced; curated/accepted stage authority verified; no invalid ready proposal.
- **Financial:** accepted customer and supplier snapshots reconcile; payment/refund/settlement idempotency and concurrent locks pass; every close has dispositions.
- **Proposal:** immutable V1/V2, current-token acceptance only, staff cannot impersonate traveller, customer/PDF parity and price attribution approved.
- **Performance:** clean production build; route bundle recorded; mobile homepage/Builder and 5/14/30-day proposal budgets pass; observability live.
- **UX/accessibility:** all Audit 5 P1s closed; critical keyboard/mobile path passes; accessible error/dialog/state checks pass.
- **Testing/UAT:** unit/domain, DB, RLS, concurrency, API, E2E, accessibility and performance suites green; isolated controlled traveller/staff/finance UAT signed off.
- **Operations:** restore/rollback drill passes; incident owner, reconciliation procedure and deployment rollback are documented.

## 31. Post-Launch Backlog

Admin/list pagination beyond immediate volumes; compact catalogue/estimate repositories if measured; caching/tag invalidation refinements; proposal jump navigation; Admin mobile convenience; advanced localization/currency; formal rooming/supplement engine; storage cleanup/archival/partitioning; background exports; component decomposition/import-cycle/type automation; exact view analytics; password recovery polish; extended screen-reader/usability studies. None may be pulled into a critical phase without a measured dependency.

## 32. Master Findings Table

| Master ID | Root cause | Original IDs | Highest | Surfaces | Launch blocker | Dependencies | Target phase | Verification |
|---|---|---|---:|---|---|---|---:|---|
| MASTER-001 | Legacy authorization | ARC-001, SEC-001/005 | P0 | DB/API/storage/Admin | YES | Phase 1/3 | 4 | Role x resource matrix |
| MASTER-002 | Public data boundary | SEC-003/013, SEC-008 | P0 | Supplier/settings/PII | YES | Phase 1 | 2-3 | Anon columns + purpose DTO tests |
| MASTER-003 | Lifecycle authority | WF-002, SEC-004, BIZ-018/021 | P0 | Enquiry/Admin/account triggers | YES | MASTER-001 | 6 | Transition/direct-update denial |
| MASTER-004 | Atomic orchestration | DATA-001, WF-003, SEC-011, BIZ-015, PERF-006 | P0 | Studio/allocation/proposal/account | YES | MASTER-003 | 8-12 | Failure injection/rollback |
| MASTER-005 | Acceptance authority/version | WF-001, SEC-002, BIZ-003 | P0 | Traveller/Admin proposal | YES | 6,9 + policy | 10 | Concurrent exact-version tests |
| MASTER-006 | Financial idempotency | ACC-001, BIZ-004/019 | P0 | Receipts/refunds/settlements | YES | MASTER-007 | 12 | Two-session ledger invariants |
| MASTER-007 | Accepted-deal truth | DATA-003, BIZ-005/012/013 | P0 | Proposal/account/operations | YES | MASTER-005 | 11 | Replacement/closure reconciliation |
| MASTER-008 | Date/readiness truth | DATA-002, BIZ-001/002/006/008/010 | P0 | Builder/Studio/proposal/benefits | YES | MASTER-003 | 7/13 | Date properties + readiness |
| MASTER-009 | Allocation suitability/concurrency | BIZ-009/011/014/016/020, UX-009 | P1 | Suppliers/Studio | YES before staff sign-off | 7/4 | 8 | Eligibility/CAS/ownership |
| MASTER-010 | Commercial attribution/policy | LEG-001, BIZ-007/017 | P1 | Pricing/proposal | YES before money | Human policies | 13 | Mixed-leg and customer breakdown |
| MASTER-011 | Proposal token/browser privacy | SEC-007/009/012, PERF-008 | P1 | Proposal/API/headers | YES | 4 | 9 | Expiry/revoke/cache/header tests |
| MASTER-012 | Public input/file/local privacy | DATA-004, SEC-006/010, UX-004 | P1 | Enquiries/partners/storage | YES for public launch | 4 | 5 | Abuse, payload, magic-byte tests |
| MASTER-013 | Assurance/observability | TEST-001, ERR-001, OBS-001, SEC-014, PERF-015, A5:QA-001 | P1 | CI/all workflows | YES | Begins Phase 1 | 1/16 | DB/E2E/a11y/perf suites |
| MASTER-014 | Build/proposal media | A1:PERF-001, A4:PERF-001/002, UX-006 | P1 | Build/proposal | YES | Secure proposal stable | 14 | Clean build + 5/14/30-day budgets |
| MASTER-015 | Query/data-loading scale | PERF-003/004/005/007/008/009/012/014/017 | P1 | Public/Admin/accounting | NO current volume | Integrity first | Post-launch/before scale | Payload/query/EXPLAIN budgets |
| MASTER-016 | Media/history growth | DB-001, PERF-010/013 | P2 | Storage/migrations/history | NO | Retention policy | Post-launch | Orphan/retention reports |
| MASTER-017 | Core mobile/accessibility | UX-001/002, A11Y-001/002/003 | P1 | Builder/Studio/palette | YES | Behavior stable | 15 | 360 px/keyboard/SR/contrast |
| MASTER-018 | Secondary UX/accessibility | A11Y-004/005, UX-003-008/010 | P2 | Dialogs/nav/proposal | Partial | MASTER-017 | 15/post-launch | Manual/automated a11y UAT |
| MASTER-019 | Code/type quality | TYPE-001, ARC-002/003, A1:QA-001/002, PERF-011/016, SEC-015 | P2 | Codebase/CI/auth UX | NO | Stable commands | Post-launch except lint gate | Type/lint/import tests |
| MASTER-020 | DB structural governance | DB-001, BIZ-020 | P2 | Constraints/migrations | Supports blockers | Transaction commands | 7-12 | Restored-data validation |
| MASTER-021 | Analytics accuracy | ANALYTICS-001, BIZ-022 | P3 | Proposal views | NO | None | Post-launch | Concurrent increment |
| MASTER-022 | PII purpose/retention/trust | SEC-008, UX-008 | P1 | Staff DTO/footer/policy | YES for real PII | Human retention policy | 2-3 | Purpose access/privacy review |

## 33. Recommended Exact Next Phase

**NEXT PHASE NUMBER:** 1  
**TITLE:** Immutable Checkpoint and Executable Authorization Baseline  
**WHY IT MUST COME NEXT:** every subsequent phase changes policies, state or financial invariants. The current audit artifacts are untracked, the Git SHA alone does not preserve them, and current backups have not been restore-proven. Capability cutover cannot be safely reviewed without real role-denial tests.  
**FINDINGS COVERED:** begins A1:TEST-001, A2:SEC-014 and MASTER-013; establishes verification/rollback dependencies for ARC-001, SEC-001-005 and every P0.  
**DEPENDENCIES:** human approval; access to provider backup/isolated Supabase project and non-production test identities.  
**EXPECTED RISK:** LOW; no production behavior change.  
**DATABASE IMPACT:** no production schema/data change; read-only backup/dumps and an isolated restored test database only.  
**TESTS REQUIRED:** restore verification; record-count/checksum baseline; role JWT fixture validation; current expected-allow/deny matrix recorded; `npm test`, typecheck, lint and clean build baselines preserved exactly.  
**BACKUP REQUIRED BEFORE START?** YES - the backup/checkpoint procedure in Section 21 is the first action of Phase 1.  
**EXIT CRITERIA:** immutable Git/report checkpoint, verified database restore, secret-free environment inventory, reproducible baseline outputs and executable authorization tests that demonstrate current failures without changing production. Only then may Phase 2 be authorized.

**FINAL SAFETY CHECK:** `git status --short` reports the four pre-existing untracked audit inputs (`audit-2-security-privacy.md` through `audit-5-ux-accessibility-uat.md`) and this newly created plan. This planning task created only `stabilization-master-remediation-plan.md`; it did not alter application, database, test, configuration or content files. No backup, migration, commit, push or deployment was performed.

STABILIZATION PHASE 0 COMPLETE – MASTER REMEDIATION PLAN CREATED – NO APPLICATION CODE OR DATABASE CHANGES MADE

## Final stabilization handover — Phase 16

Date updated: 2026-08-15
Current programme state: **Phases 1–16 complete; ready for human C0 preflight review**

The phased programme implemented and executably verified the public data boundary, capability architecture, RLS/Storage enforcement, purpose-limited PII, command-only workflow transitions, proposal acceptance, Accounting, supplier allocation, operational fulfilment, Admin read models, partner onboarding, public/API integrity and immutable minimized audit evidence. Phase 15 verified the integrated system with 32/32 isolated probes and 202/202 local tests. Production was not modified.

The final canonical release inventory is frozen in `repository-migration-manifest.sha256` (84 migrations) and `stabilization-migration-manifest.sha256` (14 stabilization migrations). The release package, clean-room runner and human controls are documented in:

- `stabilization-phase-16-checkpoint.md`
- `stabilization-final-report.md`
- `production-cutover-plan.md`
- `production-smoke-test-checklist.md`
- `real-data-entry-readiness.md`

The guarded Phase 16 execution passed 84/84 clean-room migrations, schema and required system-data fingerprint equality, and the 32/32 isolated critical regression. Production deployment is **not yet authorized**: a separate human decision, C0 preflight, production backup, migration/application cutover and smoke verification remain mandatory before real-data entry. No Phase 17 is planned.
