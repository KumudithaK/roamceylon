# Phase 7 — Global Guide Model & Specialist Guides

Date: 2026-08-08

## Outcome

The Journey Builder now records one primary guide preference for the complete journey and optional, destination-relevant specialist guides. Traveller intent remains separate from the supplier records selected internally by Roam Ceylon.

No hotel, vehicle, guide, pricing, accounting, destination, experience, or supplier-management tables were removed or redesigned. No database migration was required because guide role metadata is stored in the existing `journey_supplier_allocations.service_details` JSON snapshot.

## Public Journey Builder

- Added one journey-wide primary guide choice:
  - National Tourist Guide
  - Chauffeur Tourist Guide
  - No Guide Required
  - Let Roam Ceylon Recommend
- Added multi-select language preferences: English, German, French, Spanish, Italian, Japanese, Chinese, Russian, Arabic, and Other.
- Added optional journey-wide guide notes.
- Added only the approved specialist choices at the relevant destinations:
  - Sigiriya: Site Guide or Archaeological Guide
  - Kandy: Temple Specialist
  - Yala: Wildlife Tracker or Birding Guide
  - Horton Plains: Trekking Guide
  - Mirissa: Whale Watching Naturalist
  - Arugam Bay: Surf Coach
- A traveller can request no primary guide and still request a destination specialist.
- Review, journey summary, persistence, quotation handoff, and journey PDF data now carry the global guide preference, languages, notes, and specialists.

## Admin Journey Management

- Added a read-only Traveller Guide Preference summary showing primary guide type, languages, and notes.
- The primary guide is allocated once using the existing guide supplier database and pricing plans.
- A specialist guide allocation is shown only where the traveller requested one.
- Specialist allocation labels state the requested speciality and destination.
- Existing Add New Partner links and guide create/edit screens are unchanged.
- Traveller preferences are never overwritten by supplier allocation.

## Proposal, Operations, and Accounting

- Proposal readiness requires exactly the applicable guide allocations: one primary guide when requested/recommended, plus each explicitly requested specialist.
- Proposal lines distinguish the primary journey guide from destination specialists and show preferred languages without exposing supplier IDs.
- Operations lines show guide role, speciality, languages, supplier contact, and the existing confirmation/invoice/payment statuses.
- Accounting continues to create one settlement per allocation. The primary guide and every specialist therefore remain separate payable lines, with descriptive guide-role labels.

## Backward Compatibility

- New enquiries are identified by the presence of `journeyGuidePreference` in the captured journey state.
- Older enquiries without that field continue to use their original per-destination guide preferences and allocation requirements.
- Existing guide supplier records, direct legacy selections, saved allocations, proposal snapshots, and accounting records remain readable.

## Verification

- TypeScript: passed (`npx tsc --noEmit`).
- Targeted lint for every Phase 7 file: passed.
- Automated tests: 62/62 passed, including new national, chauffeur, recommendation, multiple-specialist, no-primary-guide, and legacy-detection coverage.
- Browser QA: passed on the Journey Preferences step. Verified that choosing `No Guide Required` hides language choices while a selected Sigiriya Archaeological Guide remains selected; no browser console errors were recorded.
- Production build reached the asset-fetch stage but could not complete in the restricted environment because Google Fonts could not be reached for Manrope and Playfair Display. No application compilation error was reported.
- Full repository lint remains blocked by the same eight pre-existing errors outside Phase 7 in `features/admin/accounting-overview.tsx`, `features/experiences/experience-editorial.tsx`, and `lib/journey/export-journey-pdf.ts`. All files changed by Phase 7 pass lint.
