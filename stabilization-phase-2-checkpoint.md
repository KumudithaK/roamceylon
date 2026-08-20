# Stabilization Phase 2 Checkpoint

Date: 2026-08-12  
Scope: SEC-003 and SEC-013 public data-boundary remediation only  
Production project: `fstpfqlgypvktjwdeagu` — **not modified**  
Isolated validation project: `xnsxmwgyugoqanuoyebh`

## Baseline

Phase 1 remains the immutable pre-remediation baseline. It executably reproduced:

- SEC-003: anonymous clients could select published supplier base rows including contact and guide licence fields.
- SEC-013: anonymous clients could select `website_settings.setup_checklist` and `setup_dismissed`.
- Legitimately published themes remained anonymously readable.

No Phase 1 result or backup artifact was changed by this phase.

## Boundary design

The supplier and website-settings base tables combine traveller-facing presentation data with private operational data. Phase 2 therefore uses explicit, read-only public projections instead of column hiding in the frontend:

- `public.public_accommodations`
- `public.public_vehicles`
- `public.public_guides`
- `public.website_public_settings`

Each projection names every exposed column. None uses `select *`. Published supplier projections also enforce `status='published'`, `active=true`, and `is_sample=false` inside the database interface.

Excluded supplier data includes contact email/telephone, guide licence number, provider account and subscription data, direct commercial rates, internal review/status fields, and supplier-management metadata. The website projection excludes setup progress, dismissal state, maintenance/registration controls, update ownership and business-registration metadata.

## Database changes

Migration: `supabase/migrations/202608120001_public_data_boundaries.sql`  
SHA-256: `853cbfcd495488fc98a6084728cf6f279e08612591f15a6cab330308275f8b48`

- Revokes anonymous `SELECT` from `accommodations`, `vehicles`, `guides`, and `website_settings`.
- Removes the former anonymous-capable read policies on those base tables.
- Adds authenticated staff read policies using the existing legacy role and capability checks; no staff capability redesign was attempted.
- Grants anonymous and authenticated `SELECT` only on the four narrow public projections.
- Requests a PostgREST schema-cache reload after commit.

## Application consumers

- Public supplier catalogue/list/detail and Journey bootstrap repositories now read the public supplier projections.
- Public contact, About and footer reads now use `website_public_settings`.
- The public guide detail no longer renders licence information.
- Trusted server/admin proposal, allocation, pricing and accounting consumers retain their protected base-table access.

## Files changed

- `supabase/migrations/202608120001_public_data_boundaries.sql`
- `lib/database.types.ts`
- `lib/data.ts`
- `lib/repositories/content.ts`
- `components/site/site-footer.tsx`
- `app/about/page.tsx`
- `app/contact/page.tsx`
- `app/guides/[slug]/page.tsx`
- `tests/authorization-baseline.mjs`
- `tests/public-data-boundary.test.ts`
- `scripts/run-isolated-phase2-public-boundary.sh`
- `stabilization-phase-2-checkpoint.md`

## Executable authorization coverage

`tests/authorization-baseline.mjs` was extended with a focused `phase2-public-boundary` scope covering:

- anonymous published theme read → ALLOW
- all three supplier public projections → ALLOW
- supplier base contact/licence reads → DENY
- website public projection → ALLOW
- website internal setup-state base read → DENY

Guarded isolated execution: `scripts/run-isolated-phase2-public-boundary.sh`

The runner rejects the production reference, loads only `.env.authz.local`, requires disposable synthetic identities, applies the single migration atomically through PostgreSQL, verifies projection columns and ACLs, and runs only the focused read-only authorization probes. Evidence is retained outside Git under `/tmp/roam-stabilization-phase2`.

## Local regression evidence

| Check | Result |
|---|---|
| `npx tsc --noEmit` | PASS |
| `npm test` | PASS — 135 tests, including 3 focused public-boundary regression tests |
| `npm run lint` | FAIL at the unchanged baseline — 7 errors and 3 warnings in pre-existing proposal/accounting/experience files; no Phase 2 file is reported |
| `npm run build` | BLOCKED by the established Google Fonts network fetch failure for Manrope and Playfair Display; no Phase 2 compile error was reported before that external failure |

## Isolated post-remediation evidence

The guarded isolated verification completed successfully against `xnsxmwgyugoqanuoyebh`:

- Database boundary verification: **PASS**
- anonymous `published_content` read: **ALLOW / PASS**
- `supplier_public_accommodation_projection`: **ALLOW / PASS**
- `supplier_public_vehicle_projection`: **ALLOW / PASS**
- `supplier_public_guide_projection`: **ALLOW / PASS**
- `supplier_contact_and_licence`: **DENY / PASS**
- `accommodation_private_contact`: **DENY / PASS**
- `vehicle_private_contact`: **DENY / PASS**
- `website_public_projection`: **ALLOW / PASS**
- `website_setup_state`: **DENY / PASS**

Final runner result: `PHASE 2 PUBLIC BOUNDARY VERIFIED: isolated project only.`

SEC-003 and SEC-013 are remediated and executably verified. Production was not modified.

## Before / after comparison

| Boundary | Phase 1 before | Phase 2 after | Final evidence |
|---|---|---|---|
| Published themes | ALLOW | ALLOW | Executable isolated probe PASS; public content still works |
| Supplier public presentation | Base-table whole-row access | Narrow projection ALLOW | All three executable projection probes PASS |
| Supplier contact/licence/base data | ALLOW | DENY | All three executable private-data probes PASS with anonymous access denied |
| Public business/contact settings | Mixed base row | Narrow projection ALLOW | Executable website public projection probe PASS |
| Internal website setup state | ALLOW | DENY | Executable base-table setup-state probe PASS with anonymous access denied |

## Final closure

- SEC-003: **REMEDIATED + EXECUTABLY VERIFIED**
- SEC-013: **REMEDIATED + EXECUTABLY VERIFIED**
- Public published content: **STILL WORKING**
- Safe supplier public projections: **WORKING**
- Private supplier/contact/licence data: **ANONYMOUS DENIED**
- Internal website setup state: **ANONYMOUS DENIED**
- Website public projection: **WORKING**
- TypeScript: **PASSED**
- Tests: **135/135 PASSED**
- Build: blocked only by the previously established unrelated Google Fonts network issue; this is not a Phase 2 regression
- Production: **NOT MODIFIED**
- Other findings: **NOT REMEDIATED**
- Phase 2 status: **COMPLETE — READY FOR HUMAN REVIEW**

## Scope preservation

- ARC-001: not remediated
- SEC-001: not remediated
- SEC-004: not remediated
- SEC-005: not remediated
- SEC-008: not remediated
- Admin UI, Journey Builder, accounting, proposals, pricing and supplier allocation workflows: unchanged
- Production: not modified
