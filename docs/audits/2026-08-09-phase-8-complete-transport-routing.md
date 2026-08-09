# Phase 8 — Journey Start, End and Complete Transport Routing

Date: 2026-08-09

## Scope delivered

- Added structured pickup and drop-off endpoints without treating either as a destination.
- Added airport arrival/departure details for CMB, HRI and JAF, plus free-form other pickup/drop-off locations.
- Made pickup/drop-off date and time, and at least one adult, mandatory before Journey Review.
- Preserved one global transport preference and added optional per-leg overrides.
- Built the complete route as pickup → ordered destinations → drop-off.
- Updated Journey Review, summary export, Journey Map and Journey Insights to use the complete route.
- Kept traveller transport preferences separate from Roam Ceylon vehicle/supplier allocations.
- Added first and final route legs to Admin proposal readiness, allocation, proposal snapshots, Operations and Accounting.
- Preserved legacy journeys that do not contain explicit endpoints and migrated legacy destination-leg preference keys in memory.

## Data and model changes

Journey state now contains:

- `pickup`
- `dropoff`
- `globalTravelPreference`
- per-leg overrides keyed by stable route locations

Route location keys use:

- `pickup`
- `destination:<destination-id>`
- `dropoff`

Supabase migration `202608090002_complete_transport_route_endpoints.sql` adds `from_location_key` and `to_location_key` to `journey_supplier_allocations`, backfills existing vehicle allocations and permits endpoint legs while retaining the existing supplier entity model.

Remote migration status: applied successfully on 2026-08-09. The CLI's optional local Docker catalogue cache was skipped because Docker Desktop was not running; the remote database push completed.

## Public journey changes

- Journey Details collects pickup/drop-off type, location/airport, date, time and optional airport flight number.
- The traveller selects one default travel preference for the journey.
- Every generated leg displays that default and can store a separate override.
- Review displays arrival, ordered destination stops, every effective transport preference and departure.
- The map draws airport endpoints when coordinates are known. A free-form endpoint is plotted when it matches a known destination/location record; otherwise it remains correctly represented in the written route without inventing coordinates.

## Admin, proposal and financial integration

- Admin displays one complete transport allocation panel covering every route leg.
- Each panel shows the immutable traveller preference and a separate Roam Ceylon vehicle/supplier allocation.
- Saved vehicle pricing plans, supplier cost, optional selling price and operational status continue to use the existing allocation editor.
- Proposal readiness requires the first and final legs for new journeys with explicit endpoints.
- Proposal wording and snapshots retain pickup/drop-off names.
- Allocation-derived Accounting includes endpoint route distance and creates settlements through the existing transport allocation flow.
- Existing journeys without endpoints continue to require only destination-to-destination transport legs.

## Verification

- TypeScript: passed (`npx tsc --noEmit`).
- Targeted Phase 8 lint: passed.
- Automated tests: 74 passed, 0 failed (`npm test`).
- Browser verification: CMB → Sigiriya → CMB produced two independently selectable transport legs, both airport markers, and a complete mapped route. A global Private Chauffeur Car / SUV preference remained unchanged when only the final leg was overridden to Scenic Train.
- Supabase runtime schema check: passed for the new allocation location-key columns. A separate local development 500 was traced to corrupted Turbopack cache data, not the API or database; the clean production build passed.
- Full repository lint: still reports pre-existing issues in `features/admin/accounting-overview.tsx`, `features/experiences/experience-editorial.tsx` and `lib/journey/export-journey-pdf.ts`; no Phase 8 file has a lint error.
- Production build: passed (`npm run build`).
