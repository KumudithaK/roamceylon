# Public Journey Preferences Implementation Report

Date: 2026-08-08  
Scope: Prompt 2/5 — public Journey Builder only

## Exact changes

### Journey flow

The public flow is now:

Theme → Destination → Experience → Journey Preferences → Journey Details → Review → Request Journey Proposal

The existing theme, destination and experience cards, selection rules, mappings and Experience Discovery component remain in place.

### Journey Preferences

Each selected destination now receives its own visually connected preference card containing:

- Experiences already selected for that destination, including participant totals when available.
- One stay preference using the nine approved traveller-facing choices.
- One guide preference using the eight approved traveller-facing choices.
- Optional destination notes.

No individual hotel or guide supplier is displayed or selectable in this step.

### Journey Details

- Existing arrival date, departure date and traveller-count controls were retained.
- Existing journey-level vehicle discovery, vehicle details, pricing-plan selection and route map were retained.
- Transport was not converted into a preference model.

### Review and summary

- A new Review step groups stay preference, guide preference, selected experiences and optional notes by destination.
- Journey dates, party size and the selected journey-level vehicle are reviewed separately.
- The green journey summary now shows destination preferences rather than assigned hotels or guides.
- Journey-summary PDF input now receives traveller preferences rather than hotel/guide supplier assignments.
- The proposal action is enabled only on the Review step.

### Persistence and supplier separation

- New `destinationPreferences` state is saved once in the existing local journey snapshot and included in the existing enquiry `trip_state` JSON.
- Preferences are normalized on restoration, default to “Let Roam Ceylon Recommend”, and are removed when their destination is removed.
- Public restoration clears legacy traveller-selected hotel/guide IDs and their pricing-plan keys.
- New public quote/enquiry requests send no assigned stay IDs and no assigned guide ID.
- The existing vehicle ID remains journey-level.
- Historical enquiry handoff parsing still preserves old supplier assignments, so prior records are not damaged.

## Deliberately unchanged

- Supabase schema, RLS, tables and storage.
- Admin supplier screens and resource editors.
- Hotel, vehicle and guide supplier records.
- Theme → Destination and Destination/Theme → Experience filtering.
- Experience participant logic.
- Pricing engine and quote calculation modules.
- Enquiry workflow and proposal modal fields.

## Verification

- TypeScript: passed (`npx tsc --noEmit --allowImportingTsExtensions`).
- Automated tests: 37/37 passed (`npm test`).
- Production build: passed (`npm run build`), including all public, Admin and API routes.
- New regression coverage verifies the exact option sets, normalization/defaults, per-destination pruning, six-step flow, and absence of public stay/guide supplier selectors.
- Interactive browser QA could not run in this execution environment because local port binding was denied with `EPERM`. This is an environment limitation; the optimized application build completed successfully.

