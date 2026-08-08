# Proposal and Accounting Correction

Date: 2026-08-08

## Outcome

The traveller enquiry, supplier allocation, proposal and accounting boundaries were corrected without deleting or replacing existing supplier, pricing, enquiry, proposal or accounting data.

## Implemented

- Supplier allocations now reference an existing `pricing_plans` record and retain an immutable rate snapshot.
- Accommodation allocations expose the hotel's configured room/meal plans, including BB, HB and FB when those plans exist.
- Accommodation proposal lines capture rooms, nights, guests, check-in and check-out information.
- Vehicle, guide and experience allocations use their own rental plans, service rates and ticket types.
- Saved rate price multiplied by billable quantity calculates the internal supplier total.
- Traveller selling total remains an explicit internal proposal decision.
- Custom negotiated services remain possible only when no active catalogue rate exists; they require a service name, quantity, billing unit and supplier cost.
- Proposal snapshots now include rate name, quantity, billing unit and service details.
- Proposal readiness lists each missing stay, guide, route or experience provider by name.
- Unsaved allocation changes block proposal generation with a clear instruction.
- Destinations explicitly assigned zero nights no longer require a hotel allocation.
- National and Chauffeur Tourist Guide preferences create one journey-wide guide allocation instead of one duplicated guide per destination.
- Site, area, wildlife and specialist guides remain destination-specific.
- Supplier invoices, payment status and arrival instructions are presented only after proposal acceptance.
- Saving proposal allocations no longer creates a pre-deposit Accounting account.
- Allocation-backed Accounting now requires an accepted proposal and an actual traveller deposit.
- Existing legacy quote-based accounting remains supported.

## Database migration

Migration: `202608080004_allocation_rate_snapshots.sql`

The migration is additive. It introduces:

- `pricing_plan_id`
- `pricing_plan_snapshot`
- `service_name`
- `quantity`
- `quantity_label`
- `service_details`
- support for a journey-wide guide allocation

Existing allocation rows are retained. Older rows must be opened and given a service rate and quantity before a new proposal can be generated.

## Verification

- Project architecture validation: passed.
- Automated tests: 59 passed, 0 failed.
- TypeScript: passed.
- Targeted ESLint: passed.
- Production build: passed, all 35 pages generated.
- Local admin runtime: loaded without application errors.

## Deployment status

The migration was not pushed from the Codex environment because the Supabase CLI access token was unavailable. Run the authenticated migration command before testing allocation saves against the remote database.
