# Phase 6 — Journey Insights

Date: 8 August 2026  
Branch: `agent/premium-experience-showcase`

## Outcome

Journey Insights is now an additive, advisory layer immediately before the final Review step.

The public journey flow is:

`Theme → Destination → Experience → Journey Preferences → Journey Details → Journey Insights → Review → Request Journey Proposal`

Insights never modify traveller selections, never prevent the traveller from continuing and never select or promote a hotel, guide, vehicle, provider or paid upgrade.

## Files changed

- `features/journey/journey-builder.tsx`
- `features/journey/journey-store.tsx`
- `features/journey/journey-insights-panel.tsx`
- `lib/journey/journey-insights.ts`
- `lib/journey/journey-persistence.ts`
- `lib/journey/journey-preferences.ts`
- `lib/journey/quotation-handoff.ts`
- `tests/journey-business.test.ts`
- `tests/journey-insights.test.ts`

## Independent rule engine

Every rule exposes:

- Rule ID
- Name
- Trigger condition through an independent evaluator
- Severity
- Recommendation message
- Optional suggested action returning the traveller to an earlier step

The ten rules are:

1. Journey duration
2. Route optimisation
3. Destination completeness
4. Journey/night balance
5. Experience balance
6. Seasonality
7. Budget consistency
8. Travel pace
9. Accessibility planning
10. Family suitability

The engine accepts a plain journey snapshot and returns plain insight results. It has no UI, persistence, pricing, proposal, supplier or accounting dependencies, leaving a clean future integration point for additional recommendation sources.

## New traveller context

Three backward-compatible inputs were added because the existing builder did not contain enough information to evaluate the requested rules objectively:

- Optional planned nights per destination
- Preferred pace: Relaxed, Balanced or Fast-paced
- Optional accessibility/mobility considerations

The previously stored `budgetPreference` is now exposed as a simple journey-style selection: Open to guidance, Value-conscious, Balanced comfort or Premium comfort.

These values are stored only inside the existing journey state and enquiry `trip_state` snapshot. No table or database architecture change was made. Historical/local saved journeys receive safe defaults during normalisation:

- Planned nights: open/not specified
- Pace: Balanced
- Budget: Open to guidance
- Accessibility: blank

## Recommendation behaviour

- Duration compares trip nights with destination count without pricing the journey.
- Route flow uses destination coordinates to identify material backtracking; it never reorders the route.
- Completeness highlights destinations without selected experiences or a specific stay style.
- Night balance runs only when the traveller supplies enough night data.
- Experience balance reviews category diversity, not spend.
- Seasonality runs only when a selected experience has usable month metadata and travel dates exist.
- Budget consistency compares broad preference categories only and never calculates prices.
- Pace compares the selected rhythm with destination density and travel duration.
- Accessibility guidance activates only when the traveller records a requirement.
- Family guidance activates only for journeys with children/infants and experience metadata indicating additional planning.

Recommendations use gentle editorial language and remain optional. Suggested-action buttons only navigate back to the relevant builder step.

## Journey Quality

The internal numeric score measures completeness using:

- Destination experience coverage
- Stay-preference coverage
- Route efficiency
- Pace consistency
- Budget consistency
- Journey balance

It does not include price or spending. Travellers see only the advisory label:

- Excellent
- Very Good
- Good
- Needs Review

The interface explicitly explains that this is a completeness guide rather than a judgement.

## Review page

The final Review now includes:

- Destination journey summary
- Traveller dates and party size
- Planned nights
- Stay preferences
- Guide preferences
- Selected experiences
- Travel preferences between destinations
- Pace and budget style
- Accessibility considerations when supplied
- Journey Insights
- Journey Quality
- Request Journey Proposal action

## Preservation of Phases 1–5

No changes were made to:

- Theme, destination or experience mapping
- Supplier Allocation
- Accounting
- Proposal generation
- Operations
- Admin supplier management
- Supabase schema or data

The quotation request still submits the same enquiry through the existing modal and stores the expanded journey snapshot through the existing handoff.

## QA evidence

- TypeScript (`npx tsc --noEmit`): passed
- Phase 6 changed-file ESLint: passed
- Automated tests: 56 passed, 0 failed
- Production build: passed; all 35 pages generated
- `git diff --check`: passed
- Browser validation: passed
  - Journey Insights rendered as step 6 of 7
  - Continue remained enabled regardless of recommendations
  - Review rendered as step 7 of 7
  - Review contained Traveller Details, Journey Insights and Journey Quality
  - Empty journeys received objective destination guidance rather than a false completeness result
  - No browser console errors were recorded

The repository-wide lint command continues to report eight pre-existing errors and one warning in unrelated files:

- `features/admin/accounting-overview.tsx`
- `features/experiences/experience-editorial.tsx`
- `lib/journey/export-journey-pdf.ts`

Those completed areas were intentionally not refactored in this additive phase.

## Database migration

None required.

## Manual migration

None required. Existing saved journeys are normalised automatically when restored.
