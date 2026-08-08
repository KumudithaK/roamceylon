# Public Travel Preferences Implementation Report

Date: 2026-08-08  
Scope: Prompt 3/5 — Getting Around / Transport

## Exact changes

### Route-leg travel preferences

- Journey Details now creates one travel leg for every consecutive pair in the traveller’s selected destination order.
- Every leg clearly displays `FROM`, the origin, an arrow, `TO`, and the next destination.
- Each leg asks “How would you like to travel?” and provides the 12 approved travel preferences.
- Every preference remains selectable. Traveller count only produces a short list of sensible suggestions for the party size.
- A one-destination journey receives a clear empty state because there is no between-destination leg yet.

### Persistence and route changes

- New `travelPreferencesByLeg` journey state stores origin ID, destination ID and travel preference for each leg.
- Preferences are stored inside the existing browser journey snapshot and enquiry `trip_state` JSON.
- Route keys are derived from consecutive destination IDs, so unchanged legs retain their preference.
- Removed or reordered destinations automatically prune stale legs; newly created legs default to “Let Roam Ceylon Recommend”.

### Supplier separation

- Individual public vehicle cards, details and vehicle pricing-plan selection were removed from the Journey Builder.
- New public journey restoration clears legacy traveller-selected vehicle IDs and vehicle pricing-plan keys.
- New public quote and enquiry submissions send no assigned vehicle ID.
- Travel preferences remain in the journey snapshot for later supplier matching.
- Existing Admin transport screens, vehicle/provider records, relationships and Supabase schema were not modified or deleted.
- Historical enquiry handoff parsing continues to preserve older vehicle assignments.

### Review, summary and export

- Review shows every route leg and its chosen travel preference.
- The green journey summary shows compact FROM → TO travel preferences.
- Journey-summary PDF input receives the route-leg preferences instead of an individual vehicle listing.
- The pricing engine itself was not changed. A travel preference is not treated as a priced supplier assignment.

## Deliberately unchanged

- Theme, destination and experience selection and filtering.
- Destination-level stay, guide and notes preferences from Prompt 2.
- Experience participant handling.
- Admin supplier management and resource editors.
- Supabase schema, RLS and stored supplier records.
- Pricing calculation modules.
- Proposal request workflow.

## Verification

- TypeScript passed: `npx tsc --noEmit --allowImportingTsExtensions --incremental false`.
- Automated tests passed: 39/39 with `npm test`.
- Production build passed with `npm run build`, including all 33 generated routes.
- Regression tests verify the exact 12-option catalogue, route ordering, defaulting, stale-leg pruning, group-size guidance and absence of public vehicle supplier components.
- Interactive browser QA remains unavailable in this execution environment because local port binding is denied with `EPERM`; no browser result is claimed.

