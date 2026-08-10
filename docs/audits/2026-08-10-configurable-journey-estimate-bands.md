# Configurable Journey Estimate Bands

Date: 2026-08-10  
Scope: Phase 9 extension completed before Phase 10

## Outcome

The Journey Builder now prefers verified published supplier rates and converts them into an honest planning range using confidential lower and upper estimate buffers. When a suitable catalogue rate is unavailable, the server can use an active Admin-maintained planning band for the selected stay, transport, guide or experience preference.

Planning assumptions are never returned to the browser. The traveller receives only the rounded per-person range, total range, duration and traveller-facing factors.

## Admin controls

Admin → Business Pricing → Public Estimates now contains:

- Lower and upper planning-envelope percentages.
- Stay preference bands, priced per billable traveller per night.
- Transport preference bands, priced per route leg.
- Primary and specialist guide bands, priced per service day.
- An experience fallback band, priced per participant.

The definitions were initially created inactive. Migration `202608100002_seed_journey_estimate_benchmarks.sql` then adds and activates conservative 2026 starter benchmarks for development. These are planning assumptions—not contracted supplier rates—and remain editable in Admin.

The starter ranges were informed by published 2025–2026 Sri Lankan market examples, including Sri Lanka Tourism accommodation classifications, published boutique hotel rates, current private-driver market ranges and Sri Lanka Railways fares. Train and floatplane bands scale per traveller; private vehicle bands scale per journey leg.

## Family handling

Children now use the existing confidential child-cost factor for stay planning and are included in the public per-person denominator. Infants retain the careful fallback until a verified infant-pricing rule is introduced.

## Proposal safeguard

Every newly generated proposal is compared with the immutable estimate snapshot submitted by the traveller:

- Within-range proposals are recorded as such.
- Outside-range proposals require an internal explanation of at least 10 characters.
- The comparison and explanation are stored in the proposal commercial snapshot.
- Admin sees the result; it is not included in the traveller PDF.
- Journeys without a submitted range remain backwards compatible and are not blocked.

This safeguard does not modify supplier allocation, exact proposal pricing, Accounting, or the Phase 10 proposal design.

## Verification

- Supabase migration `202608100001_journey_estimate_planning_bands.sql` applied remotely.
- TypeScript compilation passed.
- Targeted ESLint passed.
- 97 automated tests passed.
- Next.js production build passed with all 38 static pages generated.

## Required review before launch

Review every starter band in Business Pricing against Roam Ceylon’s contracted supplier rates, inclusions, seasonal rules and target market before live launch. Published supplier rates continue to take priority automatically.

Reference points used for development benchmarking:

- https://www.sltda.gov.lk/storage/common_media/Year_in_Review_2025_Final_updated_Report_2026_04_02-1.pdf
- https://wirresorts.com/wirdana/reserve/
- https://srilankacaranddriverhire.com/trip-cost-calculator/
- https://www.railway.gov.lk/web/images/pdf/list_ticket_fare_and_charges.pdf
