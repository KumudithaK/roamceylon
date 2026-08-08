# Supplier Allocation, Proposal and Financial Integration

Date: 8 August 2026  
Branch: `agent/premium-experience-showcase`

## Outcome

Roam Ceylon now has an end-to-end DMC journey workspace that keeps the traveller's original preferences immutable while staff curate suppliers, prepare a versioned proposal, establish the commercial position and manage delivery operations.

The implemented flow is:

`Traveller preferences → supplier allocation → proposal → traveller approval → deposit → operations → supplier payments → completion`

Legacy journeys that contain direct hotel, vehicle and guide selections remain readable. Those selections are shown as historical choices and can seed the new allocation workspace without rewriting the enquiry or its `trip_state`.

## Files changed

### Admin journey management

- `features/admin/journey-lifecycle-workspace.tsx`
- `features/admin/enquiry-review.tsx`
- `features/admin/enquiry-inbox.tsx`
- `features/admin/dashboard.tsx`
- `lib/enquiries/enquiry-workflow.ts`

### Supplier allocation and financial services

- `app/api/admin/journey-allocations/route.ts`
- `lib/admin/journey-allocations.ts`
- `lib/admin/allocation-financials.ts`
- `lib/accounting/allocation-accounting.ts`
- `lib/accounting/post-journey-account.ts`

### Journey proposals

- `app/api/admin/journey-proposals/route.ts`
- `lib/proposals/journey-proposal-service.ts`

### Schema, types and validation

- `supabase/migrations/202608080003_journey_proposal_financial_operations.sql`
- `lib/database.types.ts`
- `tests/journey-allocations.test.ts`
- `tests/journey-lifecycle.test.ts`
- `tsconfig.json`
- `.gitignore`

## Database migration

Migration: `202608080003_journey_proposal_financial_operations.sql`

Remote status: applied successfully to the linked Supabase project on 8 August 2026.

The Docker catalogue-cache warning printed by the Supabase CLI occurred after the migration was applied and did not prevent `Finished supabase db push`.

The migration is additive. It does not rename or delete existing supplier, journey, pricing, proposal/accounting or preference fields.

### Allocation fields added

`journey_supplier_allocations` now records:

- Experience allocation and named provider
- Supplier contact
- Supplier cost and traveller selling price
- Currency
- Confirmation status
- Invoice status
- Payment status
- Arrival instructions
- Special operational notes

### Proposal storage added

`journey_proposals` stores:

- One immutable allocation snapshot per proposal version
- Proposal reference and version
- Supplier cost, selling price, gross profit and margin at generation time
- Introduction, terms and validity date
- Ready, sent, approved, superseded or cancelled state
- Sent and approved timestamps

### Accounting relationship added

`journey_settlements.allocation_id` links every new supplier settlement directly to the allocation that created it. The database synchronises settlement activity back to the allocation payment status.

## New relationships

- Enquiry → many independent supplier allocations
- Selected experience → one journey-specific experience-provider allocation
- Journey route leg → one allocated vehicle, with an optional named transport partner
- Supplier allocation → one accounting settlement per journey account
- Enquiry → many versioned journey proposals
- Proposal → immutable JSON snapshot of the allocations used at generation time

Traveller destination preferences and travel-leg preferences remain in the original enquiry handoff snapshot. No supplier API writes to `trip_state`, `destinationPreferences` or `travelPreferencesByLeg`.

## Accounting changes

- Complete supplier allocations automatically prepare a pending-deposit journey account.
- Each active allocation automatically becomes a supplier settlement line.
- Allocation edits recalculate supplier cost, selling price, gross profit and profit percentage.
- The journey workspace displays deposit received, traveller outstanding and supplier payments outstanding.
- Paid amounts and supplier waivers prevent supplier cost from being reduced below already resolved funds.
- An allocation with payment or waiver activity cannot be deleted; staff must cancel it so the audit relationship remains intact.
- Cancelled suppliers with existing financial activity place the account into review instead of silently removing history.
- Existing accounts whose snapshot came from the legacy package-pricing engine are never converted or rewritten by allocation synchronisation.
- If an old journey has no allocations, deposit activation continues through the original `PackagePricingService` path.

Allocation supplier cost and selling price are journey totals for that supplier line, rather than catalogue unit rates. This keeps proposal snapshots and supplier settlements stable even when the underlying supplier catalogue changes later.

## Proposal changes

- Staff can generate a proposal only after every required destination stay, required guide, route vehicle and selected experience provider has been allocated.
- A traveller preference of `No Guide` removes that destination's guide requirement.
- All active allocations require supplier cost, selling price and a common currency.
- A new version supersedes an earlier ready or sent proposal without altering its snapshot.
- Proposal status enforces `Ready → Sent → Traveller Approved`.
- The preview is generated from allocated supplier names and vehicles, never preference labels.
- Proposal approval updates the enquiry lifecycle without changing traveller intent.

This phase intentionally does not add public proposal delivery, PDF generation, signatures or payment-gateway automation.

## Journey lifecycle

The Admin status editor now presents the canonical labels:

1. Draft
2. Proposal Ready
3. Proposal Sent
4. Traveller Approved
5. Deposit Received
6. Supplier Allocation Complete
7. Ready For Operations
8. Travelling
9. Completed
10. Archived

Legacy statuses remain available and are labelled explicitly as legacy so historical records continue to open. Proposal transitions and deposit posting update the appropriate lifecycle state; staff retain the existing ability to edit journey status.

## Operations

The Operations section is derived only from saved allocations. It shows the allocated accommodation, vehicle/transport partner, guide and experience provider together with:

- Destination or route leg
- Supplier contact
- Arrival instructions
- Special notes
- Confirmation status
- Invoice status
- Payment status

Traveller preference fields are not used as operational suppliers.

## Reporting readiness

The stored allocation, proposal and settlement relationships support future reporting for revenue, supplier cost, gross profit, journey margin, supplier usage, hotel usage, guide performance, transport usage and experience popularity. No new dashboard was introduced in this phase.

## QA evidence

- Architecture and secret-boundary validation: passed
- TypeScript (`npx tsc --noEmit`): passed
- Changed-file ESLint: passed
- Automated tests: 48 passed, 0 failed
- Next.js production build: passed; all 35 pages generated
- Supabase remote migration: passed
- `git diff --check`: passed

The repository-wide lint command still reports nine pre-existing errors in unrelated files:

- `features/admin/accounting-overview.tsx`
- `features/experiences/experience-editorial.tsx`
- `features/journey/journey-store.tsx`
- `lib/journey/export-journey-pdf.ts`

None are in the files introduced or modified for this phase. They were intentionally not refactored because this phase prohibits unrelated architecture changes.

## Manual migration required

None. The additive migration has already been applied to the linked remote Supabase project.

No historical journey requires data conversion. Staff may allocate suppliers gradually when a legacy journey is next reviewed.
