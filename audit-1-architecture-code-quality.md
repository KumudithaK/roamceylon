# Audit 1 of 5 - Architecture & Code Quality

**Classification:** Confidential  
**Audit type:** Read-only review  
**Audit date:** 11 August 2026  
**Scope:** Full platform  
**Worktree:** No changes made during the original audit  
**Original artifact:** `output/pdf/roam-ceylon-architecture-code-quality-audit-1-of-5.pdf`

A release-readiness assessment of the Roam Ceylon public platform, Journey Builder, Journey Studio, supplier allocation, proposals, benefits, accounting, CMS, RBAC and Supabase architecture.

## 1. Executive Summary

Roam Ceylon now has a substantial and coherent Destination Management Company platform architecture. The public Journey Builder, Journey Studio, supplier allocation, commercial pricing, versioned proposals, secure traveller approval, preferred benefits, accounting, cancellation, CMS and role-based access layers are all present.

Core business calculations are comparatively well tested. TypeScript passes, all 132 tests pass, the production build succeeds, and all 70 local Supabase migrations match the remote database.

| Measure | Result |
|---|---:|
| Tests passing | 132 |
| Migrations matching | 70 |
| Build routes | 43 |
| Import cycles | 1 |

Three release-blocking risks remain: incomplete capability enforcement, partial supplier/accounting writes, and non-atomic traveller proposal acceptance.

### Release position

The build is suitable for continued controlled development and internal testing. It should not yet process real traveller acceptances, supplier commitments or live payments until the P0 fixes and their database integration tests are complete.

## 2. Architecture Map

1. **Public CMS & Discovery** - Published themes, destinations, experiences and marketplace content.
2. **Journey Builder** - Client journey preferences, route legs, planning ranges and enquiry submission.
3. **Immutable Traveller Brief** - The submitted enquiry remains the historical customer request.
4. **Journey Studio** - A detached, editable curated journey with a change history.
5. **Supplier Allocation** - Internal accommodation, transport, guide and experience assignments.
6. **Commercial & Proposal** - DMC cost calculation, versioned snapshots and customer-safe presentation.
7. **Traveller Approval** - Tokenized proposal viewing, change requests and exact-version acceptance.
8. **Accounting & Operations** - Deposits, settlements, receipts, refunds, cancellation and benefits fulfilment.

### Architectural assessment

The intended domain boundaries are sound. The main weaknesses are enforcement and orchestration: several UI modules span too many layers, and critical multi-record operations are coordinated in application code rather than committed atomically by the database.

## 3. Prioritized Findings

### ARC-001 - Capability-based access is incomplete

- **Severity:** P0
- **Area:** RBAC
- **Classification:** Release block
- **Evidence:** Older CMS, supplier, pricing, relationship, partner and storage policies still authorize every admin/editor. Hidden navigation is not an authorization boundary. Staff with unrelated operational roles can potentially alter content or commercial data through direct Supabase access.
- **Remediation:** Replace broad editor write policies with explicit capabilities and test every staff role directly against Supabase.

### DATA-001 - Supplier and accounting writes can partially save

- **Severity:** P0
- **Area:** Allocations
- **Classification:** Release block
- **Evidence:** Allocation records, curated status and settlement synchronization are written through separate loops. A mid-operation error can leave only part of a journey saved while the API reports failure.
- **Remediation:** Move the complete allocation and accounting synchronization into one transactional database function.

### WF-001 - Traveller acceptance is not atomic

- **Severity:** P0
- **Area:** Proposals
- **Classification:** Release block
- **Evidence:** Acceptance is inserted before the proposal and enquiry are updated. If a later update fails, the unique acceptance record can block a safe retry while the proposal remains unapproved.
- **Remediation:** Implement an idempotent transaction that locks the exact proposal version and updates every related record together.

### WF-002 - Admin status selection can bypass business transitions

- **Severity:** P1
- **Area:** Lifecycle
- **Classification:** Release block
- **Evidence:** An enquiry can be assigned lifecycle statuses directly instead of progressing through proposal, acceptance, deposit and accounting commands. This can create impossible combinations across domain state machines.
- **Remediation:** Use dedicated server-side commands for lifecycle transitions and restrict manual changes to exceptional, audited corrections.

### DATA-002 - Eligibility uses original rather than curated dates

- **Severity:** P1
- **Area:** Benefits
- **Classification:** Release block
- **Evidence:** Journey Studio can revise dates, but benefits evaluate the original enquiry columns. A traveller may receive or lose a benefit incorrectly.
- **Remediation:** Resolve the active curated journey and snapshot evaluated dates into the proposal.

### DATA-003 - Admin screens show competing journey truths

- **Severity:** P1
- **Area:** State
- **Classification:** Release block
- **Evidence:** Some summaries show original dates and traveller counts while allocations and proposals use curated values. Staff can see contradictory information for the same journey.
- **Remediation:** Show curated operational values by default and label the immutable submitted brief explicitly.

### WF-003 - Generation and transitions are multi-write operations

- **Severity:** P1
- **Area:** Proposals
- **Classification:** Release block
- **Evidence:** Proposal insertion, superseding, enquiry status and curated status updates are separate. Compensation covers only part of the workflow and some secondary errors are ignored.
- **Remediation:** Use transactional proposal generation and transition functions with idempotency keys.

### ACC-001 - Financial transitions have incomplete atomicity

- **Severity:** P1
- **Area:** Accounting
- **Classification:** Release block
- **Evidence:** Payments, cancellation assessment, account status, histories, waivers and attachments span multiple writes. Secondary failures can create incomplete audit trails or inconsistent balances.
- **Remediation:** Move each accounting command behind a transactional database function and make attachment handling explicitly recoverable.

### TEST-001 - No database integration or browser E2E coverage

- **Severity:** P1
- **Area:** Testing
- **Classification:** Release block
- **Evidence:** Pricing logic is well covered, but eight of eighteen test files inspect source text. Passing tests do not prove RLS, rollback behaviour or end-to-end lifecycle integrity.
- **Remediation:** Add role-based Supabase tests, failure-injection transaction tests and one complete traveller-to-accounting E2E journey.

### TYPE-001 - Database typing is manually maintained and bypassed

- **Severity:** P2
- **Area:** Types
- **Classification:** Stabilize
- **Evidence:** Several write paths use `as never` or double casts, and relationship metadata is absent from the database type file. Schema drift can compile unnoticed.
- **Remediation:** Generate Supabase types in CI and replace unsafe casts with validated typed command DTOs.

### ARC-002 - Large components combine unrelated responsibilities

- **Severity:** P2
- **Area:** Maintainability
- **Classification:** Stabilize
- **Evidence:** The lifecycle workspace, Journey Builder, Journey Studio and accounting review combine data access, domain rules, state, permissions and presentation.
- **Remediation:** Extract narrow domain controllers and presentation components without changing behaviour.

### ARC-003 - One circular import is present

- **Severity:** P2
- **Area:** Module graph
- **Classification:** Stabilize
- **Evidence:** `journey-store` imports `journey-persistence`, which imports `journey-store`. Shared domain types also depend on a client feature module.
- **Remediation:** Move state contracts and persistence types into a neutral `lib/journey` domain module.

### DB-001 - Schema and editorial data releases are interleaved

- **Severity:** P2
- **Area:** Migrations
- **Classification:** Stabilize
- **Evidence:** Seventy migrations include both structural changes and large content rewrites. Core accounting functions have been replaced repeatedly, increasing review and recovery complexity.
- **Remediation:** Keep history immutable, add a schema baseline and final-function catalogue, and separate future content releases.

### ERR-001 - Failures can appear as valid empty states

- **Severity:** P2
- **Area:** Errors
- **Classification:** Stabilize
- **Evidence:** Some services return empty arrays or `null` after errors, while others surface raw database messages. There is no common operational error vocabulary.
- **Remediation:** Add structured error categories, request IDs, logs and explicit unavailable states.

### DATA-004 - General contacts and journey requests share one model

- **Severity:** P2
- **Area:** Enquiries
- **Classification:** Stabilize
- **Evidence:** A basic contact can create an enquiry with no meaningful itinerary, yet downstream modules can treat it as a journey request.
- **Remediation:** Add an explicit enquiry kind/source and gate journey workflows accordingly.

### LEG-001 - Three pricing architectures remain active

- **Severity:** P2
- **Area:** Pricing
- **Classification:** Stabilize
- **Evidence:** Public planning ranges, supplier-allocation proposals and legacy exact package pricing coexist. This is valid during transition but difficult to reason about.
- **Remediation:** Document the authoritative new-journey path and isolate legacy pricing behind a compatibility service.

### QA-001 - The lint gate currently fails

- **Severity:** P2
- **Area:** Lint
- **Classification:** Stabilize
- **Evidence:** Seven React state-in-effect errors and three warnings remain. A build can pass while the repository does not satisfy its quality gate.
- **Remediation:** Correct initialization and subscription patterns, then require lint in CI.

### OBS-001 - Critical workflows lack consistent telemetry

- **Severity:** P2
- **Area:** Observability
- **Classification:** Stabilize
- **Evidence:** Proposal, allocation, accounting and estimate fallback failures are not consistently traceable through structured operational events.
- **Remediation:** Add structured logs and alerts around all traveller, supplier and financial transitions.

### PERF-001 - Proposal HTML uses raw images

- **Severity:** P3
- **Area:** Performance
- **Classification:** Stabilize
- **Evidence:** Large unoptimized images can increase traveller proposal load time and bandwidth.
- **Remediation:** Adopt an optimized image strategy that remains compatible with print and PDF output.

### QA-002 - TypeScript tests emit module-format warnings

- **Severity:** P3
- **Area:** Test runtime
- **Classification:** Stabilize
- **Evidence:** Node reparses each test as an ES module, adding noise and small startup overhead.
- **Remediation:** Declare the test module format explicitly or configure a dedicated runner.

### ANALYTICS-001 - Proposal view counts use read-then-write

- **Severity:** P3
- **Area:** Analytics
- **Classification:** Stabilize
- **Evidence:** Concurrent views can overwrite one another and lose increments.
- **Remediation:** Use an atomic SQL increment if exact proposal engagement matters.

### Severity summary

| Severity | Count |
|---|---:|
| P0 | 3 |
| P1 | 6 |
| P2 | 9 |
| P3 | 3 |
| **Total** | **21** |

## 4. Sources of Truth and Data Model

The model has the right conceptual layers, but operational screens and services do not always consult the same layer.

| Domain | Authoritative source | Assessment |
|---|---|---|
| Submitted request | `enquiries` + immutable `trip_state` | Correct historical source |
| Revised journey | `curated_journeys.itinerary` | Correct, but not consistently consumed |
| Change history | `curated_journey_changes` | Appropriate; save and history are not atomic |
| Supplier allocation | `journey_supplier_allocations` | Correctly separated from traveller preferences |
| Customer contract | Versioned `journey_proposals` | Strong immutable snapshot design |
| Traveller approval | `journey_proposal_acceptances` | Correct record; unsafe transition boundary |
| Accounting | `accounts` + settlements + transactions | Good ledger shape; atomicity incomplete |
| Benefits | Definitions + assignments + snapshots | Good separation; date source must change |
| Staff access | Capabilities + legacy profile role | Transition incomplete |

### Competing-source hotspots

- Journey dates and travellers: immutable enquiry versus curated operational journey.
- Lifecycle status: enquiry, curated journey, proposal, account, cancellation and settlement state machines.
- Pricing: public non-binding range, supplier-allocation proposal and legacy exact quote.
- Presentation: repeated currency, date, status and proposal-description formatting.

## 5. Complexity and Legacy Inventory

| Component | Size | Primary concern |
|---|---:|---|
| `journey-lifecycle-workspace.tsx` | 78 KB | Allocation, rates, commercial controls, proposal lifecycle, PDF and history |
| `journey-builder.tsx` | 44 KB | Seven-step flow, routes, estimates, insights and submission |
| `journey-account-review.tsx` | 33 KB | Accounts, settlements, payments, receipts, reversals and closure |
| `journey-studio.tsx` | 33 KB | Curation, dates, travellers, guides and allocation invalidation |
| `experience-editorial.tsx` | 27 KB | Editorial UI, participants and persisted journey state |
| `resource-editor.tsx` | 27 KB | Generic persistence plus resource-specific CMS forms |
| `cancellation-workflow.tsx` | 26 KB | Assessment, calculations, transitions and audit presentation |
| `proposal-document.tsx` | 25 KB | Large presentation-only proposal document |

### Still used

- Immutable legacy enquiry selection columns and `trip_state` compatibility parsing.
- `PackagePricingService` for older journeys without supplier allocations.
- Direct stay, vehicle and guide IDs for historical enquiries.
- Public Journey Builder summary PDF, separate from the final proposal PDF.

### Verify before removal

- `journey_pricing_settings` and `tour_supplier_costs`.
- `use-package-quote.ts` and legacy exact quote endpoints.
- Direct-supplier enquiry columns after all historical journeys are migrated.
- Duplicate proposal and journey-summary formatting helpers.

### Likely safe cleanup after verification

- Unused Radix Accordion, Dialog and Tabs dependencies.
- Extraneous packages present in `node_modules`.
- Repeated local currency and status helpers.

Historical migrations must remain immutable even after the features or tables they introduced are retired.

## 6. Test Coverage and Validation

The calculation layer is the strongest-tested part of the system. The greatest gap is persistence and authorization behaviour at the real database boundary.

| Check | Result | Detail |
|---|---|---|
| TypeScript | PASS | `npx tsc --noEmit` |
| Automated tests | PASS | 132 passed, 0 failed |
| Production build | PASS | 43 routes generated |
| Lint | FAIL | 7 errors and 3 warnings |
| Migration parity | PASS | 70 local migrations match remote |
| Import graph | FAIL | 1 circular dependency |
| Git worktree | CLEAN | No audit changes |

### Strong coverage

- Pricing, margin and accommodation quantity calculations.
- Experience participant pricing and journey estimate ranges.
- Route legs, endpoints, guide scopes and journey insights.
- Cancellation arithmetic, benefits calculations and curated journey normalization.

### Critical gaps

- Real RLS tests for every staff role.
- Rollback and retry tests for allocations, proposals and accounting.
- Journey Studio revised-date integration with benefits.
- Browser E2E for the complete traveller-to-accounting lifecycle.
- React interaction, accessibility and PDF visual regression tests.

**Confirmed import cycle:** `journey-store -> journey-persistence -> journey-store`

## 7. Recommended Remediation Sequence

### P0 - Before production release

- Complete capability-based RLS for all remaining CMS, supplier, pricing, partner, relationship and storage operations.
- Make allocation plus accounting synchronization transactional.
- Make traveller proposal acceptance transactional and idempotent.

### P1 - Before production acceptance testing

- Replace manual status shortcuts with guarded lifecycle commands.
- Make proposal generation and accounting/cancellation commands transactional.
- Use curated dates and travellers consistently.
- Add Supabase integration tests and one full traveller-to-accounting E2E test.

### P2 - Stabilization

- Break down the largest admin components and remove the import cycle.
- Generate database types automatically and remove unsafe casts.
- Correct lint errors and introduce structured error handling and observability.
- Document current versus legacy pricing and separate general enquiries.

### P3 - Quality improvements

- Consolidate currency, date and status formatting.
- Remove verified unused dependencies.
- Resolve test module warnings and optimize proposal images.
- Make proposal view counting atomic if exact analytics are required.

## Release Recommendation

Continue controlled development. Do not process live proposal acceptances, supplier commitments or payments until the P0 work is complete and verified through real database integration tests.

**AUDIT COMPLETE - NO CODE CHANGES MADE**

The original audit was read-only. Its PDF was the only artifact produced in response to the request for a downloadable report. This Markdown edition preserves its substantive content in the repository's common audit format.
