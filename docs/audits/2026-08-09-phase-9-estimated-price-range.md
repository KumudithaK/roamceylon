# Phase 9 — Estimated Price Range Architecture

Date: 9 August 2026  
Scope: Public Journey Builder estimates only

## Existing pricing architecture found

- `PackagePricingService` loads active supplier pricing plans and the DMC business pricing configuration.
- `calculatePackageQuote` produces the exact internal commercial calculation used by legacy public estimates and by Accounting activation.
- Supplier allocation and Journey Proposal pricing use their own saved allocation commercials and proposal snapshots.
- Accounting recalculates or reads confirmed internal commercial data; it does not need a public estimate.
- Journey Builder state already contains destinations, experiences, selected experience ticket plans and participant counts, destination stay/specialist-guide preferences, the journey-wide guide preference, pickup/drop-off, route-leg transport preferences, dates and traveller counts.

The exact package engine, supplier rates, proposal workflow, supplier allocation and Accounting were preserved. No pricing columns or historical records were removed.

## Pricing logic reused

The new estimate service reads the same verified, active Supabase sources already used by the platform:

- tour pricing configuration;
- published accommodations and their active room-rate plans;
- published vehicles and active rental plans;
- published guides and active service rates;
- published experiences and active ticket plans;
- accommodation, vehicle and guide destination coverage;
- guide-to-experience specialist relationships; and
- existing route distance and journey-leg preference logic.

No default supplier prices, child discounts, seasonal multipliers or AI-generated prices were added.

## New range calculation logic

- `JourneyEstimateService` resolves eligible verified supplier-plan candidates for the traveller's preferences.
- Candidate totals form minimum and maximum component bounds in memory.
- The existing configured DMC administration, contingency, service-fee and target-margin rules are applied server-side to both bounds.
- The result is converted to a per-adult range and rounded outwards to traveller-friendly increments, avoiding false precision.
- The public response contains only the currency, per-person range, optional journey total range, duration, general influence factors and a timestamp.
- Supplier identities, supplier costs, negotiated rates, commissions, internal formulas, internal cost and margins are never returned by the public endpoint.
- Live estimates are debounced and cleared immediately when inputs change so a stale range cannot be submitted as the current snapshot.

## Fallback behaviour

The service returns `Price tailored in your Journey Proposal` rather than inventing a range when any required input is unreliable, including:

- missing or incomplete dates/nights;
- missing active rates for an applicable preference;
- incomplete business pricing settings;
- children or infants without verified age-specific pricing rules;
- invalid pricing bounds; or
- source data that yields an exact value rather than a meaningful uncertainty range.

The traveller sees the approved supporting copy and no operational setup error.

## Database changes

Additive migration: `202608090004_public_journey_estimate_snapshot.sql`

Added to `public.enquiries`:

- `estimated_price_min`
- `estimated_price_max`
- `estimated_price_currency`
- `estimated_price_basis`
- `estimated_at`
- `estimate_snapshot`

Checks validate bounds, currency and basis. A database trigger prevents an estimate captured at submission from being overwritten. The snapshot is explicitly informational and is not a proposal or Accounting input.

Remote migration status: `supabase db push` completed successfully on 9 August 2026. The CLI emitted only its known Docker catalogue-cache warning after applying the migration.

## Frontend components changed

- Journey Builder summary now presents either an estimated range per person plus a reliable total, or the tailored-pricing fallback.
- The summary displays adult count, duration, current-preference wording and a subtle “What affects this estimate?” disclosure.
- Fixed public package totals, daily cost and component breakdowns were removed from the active Journey Builder.
- Journey summary PDF export understands both new range snapshots and legacy fixed estimates.
- Proposal-request submission stores the estimate displayed at that moment.

The seven-step Journey Builder flow and all Phase 1–8 preference screens remain unchanged.

## Admin additions

The enquiry review now includes `What the traveller saw at submission`:

- new enquiries show the immutable estimated range snapshot or tailored-price result;
- legacy enquiries show their historical fixed estimate with a legacy label; and
- copy states that the snapshot never drives supplier allocation, proposal pricing or Accounting.

Admin inbox/dashboard summaries understand the new range without treating it as confirmed pipeline revenue.

## Legacy compatibility and commercial separation

- Existing `PublicPackageQuote` values remain readable.
- Existing exact-pricing API and engine remain available to established internal workflows.
- Accounting continues to use `PackagePricingService` and confirmed internal commercial data.
- Supplier allocation and Journey Proposal code were not redesigned or refactored.
- Journey Insights remains advisory and unchanged; its existing budget-consistency rule does not calculate a price.
- Phase 10 was not implemented.

## QA completed

- Typecheck: passed (`npx tsc --noEmit`).
- Phase 9 targeted lint: passed.
- Automated tests: 92 passed, 0 failed (`npm test`).
- Production build: passed (`npm run build`), including the new `/api/journey-estimate` route.
- Remote additive migration: applied successfully.
- Full repository lint: still reports seven pre-existing `react-hooks/set-state-in-effect` errors in `features/admin/accounting-overview.tsx` and `features/experiences/experience-editorial.tsx`, plus one related dependency warning. No Phase 9 file has a lint error or warning.

The QA suite covers solo and two-adult estimates, families, short and 14-day journeys, lower and premium pricing bounds, route/transport influence, journey and specialist guides, no-guide journeys, sufficient and insufficient source data, non-deceptive ranges, public-data privacy, immutable snapshots and legacy/internal pricing preservation.
