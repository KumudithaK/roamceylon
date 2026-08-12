# Roam Ceylon Audit 3/5 — Business Logic & Data Integrity

**Audit date:** 11 August 2026  
**Scope:** Read, analyse, test and report only  
**Application changes:** None  
**Database changes:** None  

## 1. Executive summary

Roam Ceylon now has a recognisable DMC workflow: a traveller brief is copied into a curated journey, staff allocate suppliers, a versioned proposal is prepared and sent, the traveller may accept or request changes, and an accounting account can be activated after payment. The code also contains useful protections: traveller preferences and supplier assignments are separate, proposal customer snapshots are immutable after sending, allocation changes flag a prepared proposal as stale, monetary inputs are generally constrained to non-negative values, and the existing automated suite passes.

The release is **not ready for live financial or proposal operations**. Five release-blocking integrity risks were verified:

1. Journey-night validation is off by one. A valid 12–19 February stay is treated as six available nights instead of seven.
2. An already-ready curated journey can be edited into an invalid state without losing its ready status, while proposal generation does not re-run journey validation.
3. Concurrent traveller acceptance and change-request actions can leave an immutable acceptance beside a proposal marked `changes_requested` and an enquiry moved back to proposal preparation.
4. Accounting totals can remain frozen to the accepted proposal while supplier settlements are rebuilt from later, mutable allocations.
5. Payment and refund endpoints have no idempotency key or atomic balance reservation, so retries or concurrent submissions can double-post money.

The test suite result—**132 passed, 0 failed**—shows good coverage of isolated functions and source-level architectural expectations, but it does not exercise transactional database concurrency or the complete state machine. A production build also completed successfully. These green checks must not be interpreted as evidence that financial and lifecycle invariants are safe.

## 2. Release position

**Position: NO-GO for production traveller acceptance, payment collection, refunds or supplier settlement.**

The public discovery and non-financial planning experience may continue in controlled preview. Live proposal acceptance and accounting should remain disabled until BIZ-001 through BIZ-005 are corrected and verified against a transaction-capable Supabase test environment.

Release blockers:

- BIZ-001 — incorrect journey-night invariant
- BIZ-002 — invalid curated state can retain proposal eligibility
- BIZ-003 — acceptance/change-request race
- BIZ-004 — non-idempotent financial posting
- BIZ-005 — accepted commercial snapshot and current supplier obligations can diverge

## 3. Domain model map

| Domain | Primary records | Authoritative purpose | Important links |
|---|---|---|---|
| Traveller brief | `enquiries`, `enquiries.trip_state` | Immutable submitted intent and submitted estimate | Themes, destinations, experiences and original journey details |
| Journey design | `curated_journeys`, `curated_journey_changes` | Staff-curated route, dates, pax, preferences and audit trail | One curated journey per enquiry; JSON itinerary |
| Content | `themes`, `destinations`, `experiences`, mapping tables | Discovery catalogue and valid content relationships | Theme → destination; destination/theme → experience |
| Suppliers | `accommodations`, `vehicles`, `guides`, `pricing_plans` | Reusable supplier catalogue and rates | Destination/service coverage and resource-owned rates |
| Supplier allocation | `journey_supplier_allocations` | Actual supplier/service chosen for a specific journey | Enquiry, curated journey, supplier resource, route leg or experience |
| Benefits | `benefit_definitions`, `journey_benefits` | Preferred privileges and fulfilment | Journey and optionally an allocation/entity |
| Proposal | `journey_proposals` | Versioned commercial and traveller-facing snapshot | Enquiry, curated journey and allocation/commercial snapshots |
| Traveller response | `journey_proposal_acceptances`, `journey_proposal_change_requests` | Exact-version acceptance or requested changes | Proposal version and public token |
| Accounting | `journey_accounts`, `journey_settlements`, `accounting_transactions`, attachments and lifecycle history | Customer receipts/refunds and supplier obligations/payments | Enquiry, approved proposal economics and supplier allocations |
| Cancellation | `journey_cancellation_cases`, supplier recoverability records | Refund assessment, approval and payment lifecycle | Journey account and settlement exposure |

The intended authority chain should be: **submitted brief → curated journey → accepted proposal snapshot → accounting ledger**. Current implementation sometimes reads from the original brief or current allocation instead of the correct stage snapshot; those exceptions are the central integrity risk.

## 4. Complete state machine

### Enquiry lifecycle

Observed canonical progression:

`new` → `under_review` → `preparing_proposal` → `proposal_sent` → `proposal_accepted` → `deposit_requested` → `deposit_paid` → `journey_confirmed` → `ready_for_operations` → `travelling` → `completed` → `archived`

Additional/legacy states include `awaiting_traveller_approval` and `cancelled`. The admin enquiry editor can directly set statuses, so the application does not presently enforce the above transition graph as an invariant. This overlaps Audit 2 finding SEC-004.

### Curated journey lifecycle

`not_started` → `designing` → `ready_for_allocation` → `allocation_in_progress` → `ready_for_proposal`

The status endpoint validates before entering a ready state. The ordinary save endpoint does not invalidate or demote a previously ready record when its content becomes invalid.

### Supplier allocation lifecycle

Allocations carry confirmation (`pending`, `confirmed`, `cancelled`), invoice and payment states plus a `review_required` flag. Journey edits can set the flag. There is no single transaction joining the curated edit, change history and all resulting review flags.

### Proposal lifecycle

`ready` → `internal_approved` → `sent` → `viewed` → either `approved` or `changes_requested`

New versions supersede active older versions. Other terminal states are `expired`, `cancelled` and `superseded`. Snapshot immutability after sending is a strong control, but database constraints restrict allowed values rather than allowed transitions.

### Accounting lifecycle

Observed statuses include `pending_deposit`, `active`, `review_required`, `part_paid`, `fully_paid`, `cancelled`, `refund_pending`, `refunded` and `closed`. Closing can be forced by an administrator even when supplier commitments remain unresolved.

### Cancellation lifecycle

Assessment proceeds through assessment/recoverability review, decision, calculation, approval, partial/full refund and closure. The calculator itself has useful unit coverage, but ledger posting and closure remain susceptible to concurrency and cross-record inconsistency.

## 5. Traveller brief → curated journey

Positive behavior:

- Initialisation creates a detached curated copy rather than mutating the traveller brief.
- Add/remove/reorder changes are recorded in `curated_journey_changes`.
- Supplier allocations remain separate from preferences.
- Legacy enquiries can fall back to the original submitted state.

Integrity gaps:

- The curated itinerary is a JSON object with most business invariants enforced only in TypeScript.
- Saving a changed journey updates the curated row, inserts history, then flags allocations in separate statements. A failure in the middle can leave the itinerary changed with incomplete history/review flags.
- The enquiry review screen still displays original dates/selections in some overview panels even when a curated state exists, increasing the chance that staff act on stale facts.
- Default benefits and account travel dates also read the original brief in places; see sections 14 and 17.

## 6. Dates and nights

The core duration function returns the number of midnight boundaries between start and end. For hotel nights, this value is already the correct number of nights. `validateCuratedJourney` subtracts one again:

- `curatedJourneyDuration`: 12 February → 19 February = 7
- `availableNights`: `duration - 1` = 6
- A planned seven-night stay is therefore rejected.

This was reproduced directly against the repository code:

```text
{"duration":7,"availableNights":6,"plannedNights":7,"errors":["Planned stays use 7 nights, but the journey has 6."],"warnings":[]}
```

Evidence: `lib/journey/curated-journey.ts:78-93`.

Proposal composition independently uses inclusive calendar days, which is correct for day count, but it uses `Math.max(1, stop.nights || 1)` for every destination and can extend `totalDays` beyond the selected end date. This creates two competing interpretations of dates/nights in the same product. Evidence: `lib/proposals/customer-proposal.ts:20`, `:63-67`.

Required invariant:

`journeyDays = dateDifference + 1`, `journeyNights = dateDifference`, and `sum(destination nights) <= journeyNights`.

## 7. Destination and experience integrity

Positive behavior:

- The public filtering engine uses explicit mappings and prevents duplicate destination/experience unions.
- Journey Studio rejects an experience that has no relationship to any selected destination.
- Published content has relationship-oriented validation and catalogue tests.

Gaps:

- A multi-destination experience does not store which selected destination is intended for this journey. Proposal generation chooses the first selected destination with a matching relationship (`destinationIds.find(...)`). Reordering destinations may therefore move the experience operationally without an explicit staff decision. Evidence: `lib/proposals/journey-proposal-service.ts:38-44`.
- Experience proposal ordering is driven by active allocation iteration and destination-name matching rather than a durable explicit itinerary day/destination assignment.
- Relationship validity is checked when saving the curated journey but is not revalidated inside the final proposal transaction.

## 8. Transport integrity

Positive behavior:

- Route-leg keys cover pickup, consecutive destinations and drop-off.
- Traveller transport preferences are separate from assigned vehicles.
- Reordering/pruning logic uses stable leg keys and flags allocations for review.

Gaps:

- Arbitrary “other” endpoints receive coordinates only when the typed location exactly matches a destination name. In the public estimate this produces an explicit unavailable component; in internal commercial calculation the null-coordinate endpoint is filtered from the route, silently undercounting distance and route-based fuel. Evidence: `lib/journey/journey-endpoints.ts:22-25`, `lib/journey/route.ts:13-19`, `lib/accounting/allocation-accounting.ts:108-120`.
- Vehicle capacity, luggage capacity and suitability for the traveller count are not enforced server-side.
- A requested travel mode is advisory: an incompatible vehicle can be selected from “other supplier records” and accepted by the server.
- Mixed inclusions are handled journey-wide. If one vehicle includes fuel and another does not, `vehicles.every(...)` is false and the engine adds fuel for the entire route, including the already-inclusive leg. The same pattern applies to driver, toll and parking inclusions. Evidence: `lib/pricing/allocation-commercial.ts:27-44`.

## 9. Guide integrity

Positive behavior:

- Primary national/chauffeur guides are journey-wide.
- Specialist/site guides remain destination-specific.
- “No primary guide with a specialist guide” is supported and tested.
- Preferred languages and specialist type are preserved in the traveller preference model.

Gaps:

- The allocation API verifies that a guide record exists but does not enforce active/published status, nationwide/destination coverage, requested licence class, specialism or language match.
- UI grouping presents preferred and other records but does not make suitability an invariant.
- Primary guide duration is derived mechanically from the journey dates; unavailable days and partial coverage require manual handling rather than a formal service interval.

## 10. Stay integrity

Positive behavior:

- Accommodation is destination-level and omitted for zero-night stops.
- Saved pricing plans and custom auditable journey rates are supported.
- Per-room and per-person quantities are distinguished.

Gaps:

- A zero-night destination is omitted from allocation requirements but proposal composition still turns it into at least one full itinerary day.
- Default room count uses a simple `ceil(total travellers / maximum guests or 2)`. Adults, children and infants are treated as equivalent occupancy units.
- Per-person accommodation applies the same plan price to adults, children and infants for every night. There is no room-combination, child-sharing, infant, single-supplement or occupancy rule model.
- The selected accommodation need not satisfy the traveller’s requested class; preference is guidance, not an enforced compatibility check.

These limitations can be acceptable only if the proposal UI clearly requires a human quantity/rate review and cannot auto-approve the result.

## 11. Supplier allocation integrity

Positive behavior:

- Allocations snapshot service/rate/quantity details.
- Logical allocation scopes prevent obvious duplicate stay/guide/route/experience requirements.
- Traveller requested preference and actual supplier are stored separately.
- Allocation changes mark sent proposals as requiring a new version.

Gaps:

- Supplier catalogue options include records that are merely non-archived; active/published/coverage compatibility is not consistently enforced by the server.
- The allocation save operation performs multiple upserts and later accounting sync without one database transaction. Partial allocation changes can persist even if later sync fails.
- No optimistic concurrency token is supplied. Two staff members editing the same allocation or curated journey can overwrite one another’s changes.
- `journey_supplier_allocations` references both an enquiry and a curated journey, but the database does not enforce that the curated journey belongs to that same enquiry.

## 12. Costing integrity

The intended internal formula is:

`supplier cost + journey operations + administration + contingency = internal cost`

`automatic selling portion = (unpriced internal cost + service fee) / (1 - target margin)`

`total selling = explicit line selling prices + automatic selling portion`

This formula is deterministic and unit-tested. Manual selling values are treated as exact line prices rather than being marked up again. However:

- Mixed vehicle inclusions can double-count journey-wide operations, as described in section 8.
- One guide-accommodation fallback is applied when any guide lacks included accommodation; it does not model different guide service intervals.
- The active business pricing configuration currency is not validated against allocation currencies before numerically combining its fixed values with the proposal currency.
- The engine records missing supplier costs as incomplete, but automatic quantity rules for family stays remain commercially weak.
- Operations assume one journey-wide driver-day profile and total route distance, even where multiple supplier services have different charging scopes.

## 13. Estimated vs final price integrity

Positive behavior:

- Public estimates expose ranges, not supplier costs or margin.
- Missing rate components produce a planning fallback rather than invented exact prices.
- A final proposal outside the submitted range requires an internal reason.
- The submitted estimate snapshot is retained for comparison.

Gaps:

- The estimate and final commercial engines use different quantity and fallback models. A range may therefore be directionally useful but is not guaranteed to contain the final proposal.
- An “other” route endpoint without coordinates makes the public range unavailable, while the internal proposal may silently use a shorter route distance.
- Infants are included in the displayed per-person denominator while many supplier components do not have explicit infant rules. This is a product-policy ambiguity requiring a documented definition.
- The final traveller breakdown assigns manually entered selling prices to categories and places all remaining margin, operations and automatic price in “Journey planning & other included services.” The total is correct, but category totals are not a reliable cost attribution.

## 14. Benefits integrity

Positive behavior:

- Benefits are customer-safe DTOs and are snapshotted into proposal versions.
- Verified savings require comparable rates and dates.
- Internal evidence and supplier cost are excluded from the traveller DTO.

Critical stale-source behavior:

- Default benefit quantity is calculated from the original `enquiries.trip_state`, not the current curated journey.
- Benefit date applicability is checked against original enquiry travel dates, not curated dates.

If staff changes two travellers to four or changes the journey period in Journey Studio, default per-traveller benefits and verified comparison validity can remain based on the original request. Evidence: `lib/benefits/journey-benefit-service.ts:14-43`.

Benefits are intentionally excluded from accounting. That is safe only if every benefit’s real fulfilment cost is either genuinely zero/pre-negotiated or recorded elsewhere as an internal cost before proposal approval.

## 15. Proposal generation integrity

Positive behavior:

- Required allocation scopes, review flags, complete service data and single allocation currency are checked.
- Customer-safe content is validated before insert.
- Commercial, allocation, curated and customer-facing data are snapshotted.
- A sent proposal is immutable and becomes stale when relevant source records change.

Gaps:

- Proposal generation checks curated status but does not re-run `validateCuratedJourney`. Evidence: `lib/proposals/journey-proposal-service.ts:35-37`.
- A normal Journey Studio save can preserve `ready_for_allocation` or `ready_for_proposal` even when the returned validation contains errors. Evidence: `app/api/admin/journey-studio/route.ts:62-80`.
- Proposal insert, superseding earlier versions, enquiry status change and curated status change are separate writes. Cleanup covers one supersede failure but not all later failures.
- Version number is computed with `last version + 1`; the unique database constraint prevents duplicates but concurrent generation can fail rather than serialize/retry.
- A destination with zero nights is converted to a proposal day, and planned nights may extend proposal dates beyond the traveller’s selected end date.

## 16. Versioning and acceptance integrity

Positive behavior:

- Each proposal version has its own token.
- Sent snapshots are immutable.
- New versions supersede old active versions.
- Acceptance stores proposal ID/version, amount, currency, traveller identity and acknowledgement.

Release-blocking race:

Both acceptance and change request first read `sent/viewed`. Acceptance inserts an acceptance then conditionally updates the proposal. Change request inserts a request and updates proposal status without a status condition. Under concurrency, a change request can overwrite an already-approved proposal to `changes_requested`, and move the enquiry back to `preparing_proposal`, while the unique acceptance record remains. Evidence: `lib/proposals/traveller-proposal-service.ts:25-50`.

Additional gaps:

- Acceptance insert, proposal transition and enquiry transition are not atomic. A failed later write can leave a permanent acceptance that blocks retry.
- The acceptance table stores proposal version/amount/currency but does not constrain those denormalised values to equal the referenced proposal.
- View count uses read-plus-write and can lose increments under concurrent views; this is analytics integrity rather than a booking blocker.

## 17. Accounting, payment and cancellation integrity

Positive behavior:

- An approved proposal can provide frozen selling price, cost, profit and margin to accounting.
- Supplier settlements retain paid and waived values and guard against reducing obligations below them.
- Cancellation calculations have direct unit tests for non-recoverable cost, recoveries, partial refunds and outcomes.
- Sent proposal commercial snapshots are preferred over recalculation for account totals.

Gaps:

- Account travel dates are initially copied from the original enquiry rather than the accepted curated proposal.
- When syncing an active account, account totals use the approved proposal, but supplier settlements are iterated from the **current** active allocation snapshot. A later supplier change can therefore alter obligations while accepted customer economics remain frozen. Evidence: `lib/accounting/allocation-accounting.ts:133-179`.
- Customer/supplier transaction endpoints have no idempotency key and perform “read remaining → insert” without row locking. Concurrent valid requests can both pass the balance check and both insert. Evidence: `app/api/admin/accounting/transactions/route.ts:49-109`.
- Waiver update, payment/waiver transaction inserts, receipt upload and attachment insert use compensating cleanup, not a transaction. Concurrent updates can lose waiver changes.
- Refunds recorded before cancellation are included in account totals but cancellation assessment language can still present gross receipts as “paid,” making the approved liability hard to interpret even though later payment guards consider prior refunds.
- Forced account closure can set the account terminal while individual supplier settlements remain outstanding. The override records a reason but does not resolve each liability. Evidence: `app/api/admin/accounting/close/route.ts:11-20`.
- A closed-account error tells staff to reopen through an authorised correction, but no corresponding reopen workflow was found.

## 18. Concurrency and atomicity

No complete workflow is protected by a database transaction or stored procedure. High-risk sequences include:

- Curated itinerary update → change-log insert → allocation review flags
- Multiple allocation upserts → curated status → accounting sync
- Proposal insert → supersede older proposals → enquiry/curated statuses
- Acceptance insert → proposal status → enquiry status
- Change request insert → proposal status → enquiry status
- Account creation/update → initial payment → settlements → lifecycle history
- Settlement waiver → transaction(s) → receipt upload → attachment record
- Refund/receipt balance check → financial transaction insert

Compensating deletes reduce some single-request failures but do not protect against process interruption, competing staff actions, retries or two browser tabs. The state-changing functions need transaction-level domain commands, row locks where balances are consumed, idempotency keys for money movement, and optimistic version checks for staff edits.

## 19. Data constraints

Existing strengths:

- Foreign keys protect many primary relationships.
- Proposal version/token and acceptance uniqueness exist.
- Status and non-negative amount checks exist across major tables.
- Sent proposal snapshot guards preserve published traveller terms.

Missing or insufficient constraints:

- Curated JSON has no database-level date, pax, selected-ID or nights reconciliation constraints.
- Status columns constrain allowed values, not valid transitions.
- Acceptance version/amount/currency can disagree with its referenced proposal.
- Allocation enquiry and curated journey ownership are not cross-constrained.
- Polymorphic benefit entity/scope identifiers cannot receive normal foreign-key integrity.
- Financial transaction creation has no caller-supplied idempotency key.
- No optimistic revision/version field is checked when Journey Studio, allocations or enquiry status are saved.
- Supplier compatibility (active status, coverage, capacity, guide credentials/languages) remains application guidance rather than a server invariant.

## 20. End-to-end scenarios

| Scenario | Expected outcome | Audit result |
|---|---|---|
| A. Couple, 8 days / 7 nights, two destinations | Seven allocatable nights and a proposal within selected dates | **Fail:** validator reports six nights; proposal composer uses a separate calendar model |
| B. Family with children/infant | Correct rooms, child/infant rates, suitable vehicle and experience participant prices | **Partial:** experience participants are separated; stay occupancy and supplier suitability lack sufficient rules |
| C. Slow journey with open nights | Honest warning and no silent selection mutation | **Mostly pass:** estimate can distribute open nights without changing preferences; validator count is off by one |
| D. Fast multi-stop route | Flag impossible pacing and prevent invalid final proposal | **Fail/partial:** insights are advisory; invalid edits can retain ready status |
| E. Mixed train/private vehicle route | Per-leg preference, allocation and cost without duplicated operations | **Partial:** legs persist; mixed inclusion logic can charge operations across inclusive legs |
| F. No primary guide plus site specialist | No journey guide required; specialist allocated only where requested | **Pass in isolated scope tests**; supplier credential/coverage match is not enforced |
| G. Redesign after allocations | Every affected allocation reviewed; accepted economics remain coherent | **Fail under partial/concurrent writes:** flags are non-atomic and accounting can mix accepted totals with current allocations |
| H. Proposal v1 changed to v2 | v1 immutable/superseded, only one exact version accepted | **Mostly pass sequentially; fail concurrently:** acceptance/change-request race can produce contradictory status |
| I. Deposit, cancellation, supplier recoverability and refund | One auditable liability, no duplicate money, closure only after obligations resolve | **Fail under retry/concurrency; partial sequentially:** calculator tests pass, posting is non-idempotent and forced closure can leave supplier balances |

## 21. Findings table

| ID | Severity | Area | Evidence | Failing scenario | Incorrect outcome | Recommended remediation | Release blocker |
|---|---|---|---|---|---|---|---|
| BIZ-001 | P0 | Dates/nights | `lib/journey/curated-journey.ts:78-93`; runtime reproduction | 12–19 Feb with 7 planned nights | Valid journey rejected as 6 nights | Define one shared inclusive-days/exclusive-nights utility and migrate every validator/composer to it | Yes |
| BIZ-002 | P0 | Journey/proposal state | `app/api/admin/journey-studio/route.ts:62-80`; `lib/proposals/journey-proposal-service.ts:35-37` | Edit a ready journey into an invalid date/night state, review allocations, generate | Invalid journey remains eligible for proposal | Demote invalid saves and revalidate inside the same proposal-generation transaction | Yes |
| BIZ-003 | P0 | Proposal acceptance | `lib/proposals/traveller-proposal-service.ts:25-50` | Accept and request changes concurrently | Acceptance record exists while proposal/enquiry return to changes/preparation | One transactional compare-and-set command; both transitions conditional on current status; exclusive terminal response | Yes |
| BIZ-004 | P0 | Payments/refunds | `app/api/admin/accounting/transactions/route.ts:49-109` | Double-click/retry or two finance users post the remaining amount | Duplicate or excessive ledger transactions | Required idempotency key, unique constraint and locked transactional balance validation | Yes |
| BIZ-005 | P0 | Accepted proposal/accounting | `lib/accounting/allocation-accounting.ts:133-179` | Change supplier allocation after acceptance on an active account | Frozen customer total paired with later supplier obligations | Build settlements from accepted allocation snapshot; require explicit financial amendment/version for later changes | Yes |
| BIZ-006 | P1 | Route costing | `lib/journey/journey-endpoints.ts:22-25`; `lib/journey/route.ts:13-19`; accounting commercial context | Use a typed pickup/drop-off not identical to a destination | Public estimate unavailable; internal distance silently omits endpoint leg | Require geocoded coordinates or a reviewed manual distance before pricing/proposal | No |
| BIZ-007 | P1 | Vehicle operations | `lib/pricing/allocation-commercial.ts:27-44` | One leg includes fuel/driver, another does not | Full-route fallback may double-charge inclusive leg | Calculate operations per allocation/leg and inclusion flags, then aggregate | No |
| BIZ-008 | P1 | Benefits | `lib/benefits/journey-benefit-service.ts:14-43` | Curated pax or dates differ from original enquiry | Wrong benefit quantity or invalid savings period | Resolve benefit context from current curated state before proposal, then snapshot | No |
| BIZ-009 | P1 | Supplier suitability | Allocation API/UI trace | Allocate inactive, wrong-capacity, uncovered or language-mismatched supplier | Operationally unsuitable proposal can be prepared | Server-side eligibility policies with explicit override reason and audit trail | No |
| BIZ-010 | P1 | Itinerary | `lib/proposals/customer-proposal.ts:63-67` | Selected zero-night transit stop | Extra full itinerary day; dates can extend beyond end date | Model transit stops explicitly and refuse composition beyond selected calendar | No |
| BIZ-011 | P1 | Experience placement | `lib/proposals/journey-proposal-service.ts:38-44` | Experience belongs to two selected destinations | First matching destination is chosen implicitly | Persist an explicit journey experience → destination/day assignment | No |
| BIZ-012 | P1 | Accounting dates | `lib/accounting/post-journey-account.ts` account creation trace | Curated dates differ from submitted dates | Account/operations use stale travel dates | Copy dates from accepted proposal snapshot, retaining original brief separately | No |
| BIZ-013 | P1 | Account closure | `app/api/admin/accounting/close/route.ts:11-20` | Force-close with open supplier balances | Terminal account coexists with pending obligations | Require per-settlement disposition or create an explicit write-off liability record | No |
| BIZ-014 | P1 | Family accommodation | Allocation quantity trace and pricing tests | 2 adults, 2 children, infant with room/per-person rates | Occupancy or per-person cost may be commercially wrong | Add reviewed occupancy groups, child/infant policies and supplements to allocation snapshot | No |
| BIZ-015 | P1 | Workflow atomicity | Multi-write services in sections 15–18 | Failure between linked writes | Partial lifecycle records and misleading statuses | Move domain commands into transactional database functions with audit events | No; supports all P0 fixes |
| BIZ-016 | P2 | Staff concurrency | Journey Studio/allocation updates do not compare revision | Two designers save the same journey | Last write silently overwrites earlier work | Add revision number/`updated_at` compare-and-set and conflict UI | No |
| BIZ-017 | P2 | Traveller proposal breakdown | `lib/proposals/customer-proposal.ts:77-82` | Mostly automatically priced package | Margin/operations accumulate in broad “other” category | Define traveller-safe selling-price allocation rules independent of internal cost disclosure | No |
| BIZ-018 | P2 | State governance | Enquiry workflow and direct status editor; cross-reference SEC-004 | Staff jumps or reverses lifecycle state | Status no longer proves completed prerequisites | Central transition service and database-enforced transition policy | No |
| BIZ-019 | P2 | Cancellation presentation | Transaction and cancellation trace | Refund before later cancellation assessment | “Paid”/recommended liability can be based on gross receipts while prior refund is separate | Present gross received, already refunded, net held and remaining approved refund distinctly | No |
| BIZ-020 | P2 | Data constraints | Journey/proposal/allocation migrations | Direct or partial writes bypass TypeScript | Cross-record facts can contradict each other | Add check/trigger/function constraints for ownership, snapshots and transitions | No |
| BIZ-021 | P2 | Admin truth source | `features/admin/enquiry-review.tsx` trace | Curated dates/pax differ from brief | Staff overview shows stale original values | Clearly label immutable brief versus current curated/accepted journey | No |
| BIZ-022 | P3 | Proposal engagement | `lib/proposals/traveller-proposal-service.ts:14-21` | Concurrent page views | Lost view-count increments | Atomic SQL increment; keep first-view timestamp compare-and-set | No |

## 22. Cross-audit correlation

- **Audit 1 ARC-001 / Audit 2 SEC-004:** broad/direct lifecycle mutation is also a business-state integrity issue (BIZ-018). UI status must not bypass prerequisite transitions.
- **Audit 2 SEC-011:** transaction integrity concerns are confirmed and expanded by BIZ-003, BIZ-004, BIZ-005 and BIZ-015. The risk is not only partial writes; it includes competing valid requests and divergence between accepted terms and operational liabilities.
- Security and business integrity meet at the service-role boundary: server authorization may be correct while a permitted operation still violates a domain invariant. RBAC alone cannot replace transactions, compare-and-set transitions and idempotency.
- No Audit 2 finding is duplicated as a new security claim here; this report describes the business consequence and exact workflow scenario.

## 23. Remediation roadmap

### P0 — before any live acceptance or money movement

1. Establish a single date/day/night contract and correct all validators, estimate inputs and proposal composition.
2. Make proposal generation transactionally revalidate the current curated journey and required allocations.
3. Implement mutually exclusive, transactional traveller acceptance/change-request commands.
4. Add idempotent, locked transactional commands for every financial posting and reversal.
5. Freeze accounting supplier obligations from the accepted proposal snapshot; require a versioned financial amendment for changes.

### P1 — before normal DMC operations

1. Make proposal creation/supersession/status changes atomic.
2. Make curated save/change log/allocation review atomic.
3. Add supplier eligibility checks for active status, coverage, vehicle capacity and guide credentials/languages, with authorised overrides.
4. Model per-leg operating inclusions and route endpoint distance explicitly.
5. Resolve benefits and accounting dates from the curated/accepted source of truth.
6. Add family occupancy and age-band pricing review rules.
7. Require explicit experience placement and explicit disposal of supplier liabilities before closure.

### P2 — operational hardening

1. Add optimistic concurrency to Journey Studio and supplier allocation editing.
2. Centralise the enquiry state machine and remove unrestricted status mutation.
3. Improve traveller-safe price attribution and cancellation balance language.
4. Add cross-record database constraints and structured audit events.
5. Clearly distinguish submitted brief, current design and accepted journey in Admin.

### P3

1. Make proposal engagement counters atomic.
2. Remove module-type warnings from the test runner without changing runtime semantics.

### Future

1. Formal rooming lists, supplements, child/infant policies and meal-plan occupancy.
2. Availability holds with expiry and supplier confirmation SLAs.
3. Multi-currency conversion snapshots and exchange-rate gains/losses.
4. Amendments/credit notes linked to accepted proposal versions.
5. Operations manifests derived only from the confirmed version.

## 24. Tests required before release

### Unit and property tests

- Date matrices covering same-day, one-night, leap day, month/year boundaries and timezone independence.
- Property: `days = nights + 1` for valid date ranges.
- Proposal composer never emits a date after selected end date.
- Zero-night transit destination does not create a destination stay day.
- Mixed vehicle inclusion combinations allocate operations only to uncovered legs.
- Child/infant/room occupancy scenarios and per-person rate categories.
- Multi-destination experience requires explicit placement.
- Curated benefit quantities/dates override original enquiry values.

### Transactional integration tests against Supabase/Postgres

- Two concurrent acceptance requests.
- Acceptance racing a change request.
- Two concurrent customer receipts/refunds for the exact remaining balance.
- Two concurrent supplier payments/waivers.
- Process failure after each write in proposal, acceptance, allocation and accounting commands.
- Allocation changed after accepted proposal: account and settlement snapshots must remain consistent.
- Duplicate request with the same idempotency key returns the original transaction.
- Stale Journey Studio/allocation revision returns conflict rather than overwriting.

### End-to-end tests

- The nine scenarios in section 20, using real database constraints and two browser contexts where concurrency matters.
- Full legacy enquiry compatibility without permitting legacy paths to bypass current proposal acceptance prerequisites.
- Public planning range → submitted estimate → final proposal range review.
- Proposal v1 change request → Journey Studio revision → proposal v2 → v2 acceptance → deposit → cancellation → supplier recovery → refund → closure.
- Traveller PDF/digital snapshot parity and exact accepted version identity.

### Test execution recorded in this audit

- `npm test`: **132 passed, 0 failed**.
- `npm run build`: **passed**, including TypeScript and generation of 43 static pages.
- Direct runtime date/night reproduction: **failed business expectation**, returning six available nights for a seven-night interval.
- No remote database mutation, migration, live payment, live acceptance or destructive test was performed.

AUDIT 3 COMPLETE – NO APPLICATION CODE OR DATABASE CHANGES MADE
