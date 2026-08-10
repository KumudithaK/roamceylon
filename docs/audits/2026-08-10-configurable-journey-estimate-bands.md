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

All band definitions were created inactive and without invented values. An administrator must enter reviewed internal planning costs and activate only the bands Roam Ceylon is prepared to use.

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

## Required Admin action

Review and activate the fallback bands in Business Pricing before relying on them publicly. Published supplier rates already work without this step; inactive fallback bands deliberately cause the builder to ask for more journey detail rather than inventing a price.
