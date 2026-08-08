# Prompt 4/5 — Admin Supplier Allocation Report

Date: 8 August 2026  
Branch: `agent/premium-experience-showcase`

## Outcome

Admin Journey Management now presents the traveller's request destination by destination and keeps Roam Ceylon's proposed supplier allocation in a separate, staff-only data model.

## What changed

- Added a destination-led section to each Admin Traveller Enquiry.
- Each destination shows the original traveller request for:
  - stay class preference;
  - guide preference;
  - destination experiences;
  - destination notes;
  - onward travel preference for the next route leg.
- Added internal allocation controls for:
  - one accommodation partner per destination;
  - one guide partner per destination;
  - one vehicle / transport record per consecutive route leg.
- Supplier choices come from the existing accommodation, guide, vehicle and destination-coverage records.
- Matching suppliers are shown first; other existing supplier records remain available to staff.
- Draft or inactive supplier records remain visible internally and are labelled with their content status.
- Added links to the existing Stays, Local Guides and Vehicles admin create flows. They open separately so an in-progress allocation is not lost.
- Preserved the current direct accommodation, vehicle and guide selections and display them as legacy selections when present.

## Data separation

Traveller preferences remain unchanged in `enquiries.trip_state`.

Internal proposals are stored in the new staff-only `journey_supplier_allocations` table. The table uses typed foreign keys to existing accommodations, guides and vehicles and scopes allocations by destination or route leg. Saving an allocation never updates the traveller preference snapshot.

Existing fields remain in place and were not migrated or overwritten:

- `enquiries.selected_stays`
- `enquiries.selected_vehicle`
- `enquiries.selected_guide`

This preserves compatibility with enquiries created before the traveller-preference model.

## Supplier management preserved

No supplier, pricing, image, relationship, editor or resource-list capability was removed or changed. Hotels/stays, vehicles and guides continue to be created and maintained through their existing Admin screens.

## Supabase

Migration applied successfully:

`202608080002_journey_supplier_allocations.sql`

Row Level Security allows authenticated `admin` and `editor` staff to manage allocations. Anonymous access is revoked. Supplier deletion is restricted while an allocation references the supplier.

The CLI completed the remote database push. It only warned that the optional local Docker migration catalogue could not be cached; this did not prevent the remote migration from being applied.

## Verification

- `npm test`: passed, 41 tests.
- `npm run build`: passed, including TypeScript and all 33 generated routes.
- Targeted ESLint for changed implementation and tests: passed.
- `git diff --check`: passed.
- Full-project ESLint remains blocked by 11 pre-existing issues in unrelated accounting, experience, journey-store and PDF files. Those files were deliberately left untouched under this task's scope.
