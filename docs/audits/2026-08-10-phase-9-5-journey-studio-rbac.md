# Phase 9.5 — Journey Studio, Admin Boundaries and RBAC

Date: 10 August 2026  
Branch: `agent/premium-experience-showcase`

## Outcome

Phase 9.5 introduces a separate Journey Studio and capability-based staff access without redesigning the public Journey Builder, Journey Insights, supplier catalogue, Accounting, Operations, CMS, guide model, transport model, pricing range, or traveller proposal presentation.

The lifecycle is now explicitly separated:

1. **Traveller Brief** — the submitted enquiry snapshot; immutable after submission.
2. **Curated Journey** — Roam Ceylon's editable professional itinerary.
3. **Supplier Allocation** — the partners who fulfil curated requirements.
4. **Costing** — supplier costs, selling values, operations and margins.
5. **Proposal** — a versioned snapshot generated from the Curated Journey and reviewed allocations.

Phase 10 proposal redesign was not implemented.

## Existing architecture discovered

- The public builder serialises traveller selections and preference state into `enquiries.trip_state`, with legacy selection columns retained for compatibility.
- Destination preferences contain nights, stay class, local specialist request and notes.
- Phase 8 transport uses pickup/drop-off endpoints, a global preference and per-leg overrides.
- Phase 7 guides use one journey-wide primary guide plus optional destination specialists.
- Supplier allocation is stored separately in `journey_supplier_allocations` and is linked to catalogue hotels, vehicles, guides and experiences.
- Proposal and Accounting services previously resolved the raw enquiry directly.
- Staff authorization previously depended primarily on the broad `admin` / `editor` profile enum.

## Journey Studio implementation

New routes:

- `/admin/journey-studio`
- `/admin/journey-studio/[enquiry-id]`
- `/api/admin/journey-studio`

The workspace provides:

- traveller, journey date, duration, pax and Studio-status context;
- a collapsible read-only Original Traveller Brief;
- pickup and drop-off refinement;
- destination add/remove and native drag-and-drop reordering;
- destination nights including valid `0 → 2`, `3 → 2`, and `1 → 0` changes;
- independent stay requirements, specialist guides and internal destination notes;
- published Experience CMS selection, Roam Ceylon/traveller origin markers, ordering and internal notes;
- global primary-guide requirement, languages and guide notes;
- global transport preference and complete per-leg overrides;
- an updated Sri Lanka route map;
- journey-duration/night validation;
- internal curation notes and meaningful change history;
- unsaved browser-exit protection and destructive-action confirmation;
- “Proceed to Supplier Allocation”.

## Data model and migrations

Applied remotely:

- `202608100003_journey_studio_and_rbac.sql`
  - adds `curated_journeys`;
  - adds `curated_journey_changes`;
  - links allocations and proposals to a Curated Journey;
  - adds allocation-review metadata;
  - stores Curated Journey proposal snapshots;
  - prevents updates to submitted brief fields;
  - adds capabilities, staff roles, role grants and profile-role assignments;
  - replaces broad financial/allocation RLS policies with capability checks.
- `202608100004_tighten_journey_designer_finance_boundary.sql`
  - removes direct Accounting-row access from the Journey Designer role.

Supabase reported both migrations as successfully applied. Its optional local migration-catalogue cache warning remains because Docker Desktop is not running; this did not prevent the remote database push.

## Traveller Brief immutability

`private.protect_original_traveller_brief()` rejects updates to submitted dates, pax, selections, participant counts, pricing estimate fields and `trip_state`. Admin status and internal follow-up notes remain editable. Existing enquiries are not destructively migrated; a legacy enquiry creates its Curated Journey from its existing submitted state on demand.

## Route recalculation

Destination changes call the existing complete-leg engine. Pickup, consecutive destination legs and drop-off are rebuilt immediately. Valid overrides on unchanged leg keys survive; obsolete leg overrides are pruned. Destination-specific preferences remain keyed to their destination and therefore survive reordering.

## Allocation review behavior

Meaningful changes compare the previous and next Curated Journey. Affected saved allocations receive `review_required`, a human-readable reason, and cleared reviewer metadata. This covers stay requirements, nights, destination removal, guide requirements/languages, experience removal or participant changes, route/endpoints and transport preferences.

Proposal generation checks outstanding allocation reviews **before** commercial calculation. Staff must explicitly reconfirm a still-required service or retire an obsolete one. Retirement never deletes the row, is refused after supplier payment/waiver activity, and synchronises an active Accounting account safely.

## Proposal and Accounting boundary

- New proposals resolve the Curated Journey when present and retain a Curated Journey snapshot.
- Legacy journeys without a Curated Journey continue to resolve the original enquiry.
- Allocation Accounting resolves curated route, endpoints and travel dates.
- The existing proposal design and pricing calculations remain unchanged.
- Allocation and proposal read APIs redact supplier costs, rate snapshots, margins and payment fields unless the staff member has the matching capability.
- Accounting write APIs require `finance.payments.manage`.
- Direct RLS access to allocation and finance tables is capability-scoped, so privacy does not rely on UI hiding.

## RBAC foundation

Capabilities introduced:

- `journey.requests.view`
- `journey.design.view`, `journey.design.edit`
- `journey.proposal.view`, `journey.proposal.create`
- `suppliers.view`, `suppliers.manage`, `suppliers.allocate`, `suppliers.rates.view`
- `operations.view`, `operations.manage`
- `finance.revenue.view`, `finance.costs.view`, `finance.margin.view`, `finance.payments.manage`
- `cms.view`, `cms.edit`
- `users.manage`, `settings.manage`

Default role definitions:

- Super Admin / Founder
- Journey Designer
- Partner / Experience Manager
- Operations
- Finance
- Content / Marketing

Existing `admin` profiles receive Super Admin. Existing `editor` profiles receive Journey Designer and Content / Marketing to preserve their historic CMS and enquiry workflows. A role-management UI is deliberately deferred; specialised assignments can be added to `profile_staff_roles` by an authorised administrator later.

## Principal files changed

- `features/admin/journey-studio.tsx`
- `features/admin/journey-studio-inbox.tsx`
- `app/admin/journey-studio/**`
- `app/api/admin/journey-studio/route.ts`
- `lib/journey/curated-journey.ts`
- `lib/journey/curated-journey-server.ts`
- `features/admin/journey-lifecycle-workspace.tsx`
- `app/api/admin/journey-allocations/route.ts`
- `lib/proposals/journey-proposal-service.ts`
- `app/api/admin/journey-proposals/route.ts`
- `lib/accounting/allocation-accounting.ts`
- `lib/admin/permissions.ts`
- `lib/admin/authenticated-staff.ts`
- `lib/admin/use-staff-permissions.ts`
- `features/admin/admin-shell.tsx`
- Accounting API authorization routes
- `lib/database.types.ts`
- the two Phase 9.5 migrations
- `tests/journey-studio.test.ts`
- `tests/admin-permissions.test.ts`

## Verification

- TypeScript: **passed** — `npx tsc --noEmit`
- Architecture validation and tests: **passed** — 115/115
- Production build: **passed** — 40 routes generated, including Journey Studio
- Supabase migration push: **passed** — both Phase 9.5 migrations applied remotely
- Browser smoke test: Journey Studio route resolved correctly through the staff-login boundary; no runtime console errors were found
- `git diff --check`: **passed**
- ESLint: **not clean due to seven pre-existing `react-hooks/set-state-in-effect` errors** in `features/admin/accounting-overview.tsx` and `features/experiences/experience-editorial.tsx`. Phase 9.5 did not refactor these stable modules; no new lint errors were introduced by Journey Studio.

## Manual follow-up

- No manual database migration is required; migrations are already applied.
- When creating specialised staff accounts, assign only the necessary roles through `profile_staff_roles` until a later staff-role UI is approved.
- A fully authenticated role-by-role browser acceptance test should be run with dedicated Journey Designer, Partner Manager, Operations, Finance and Content test accounts. Automated permission and RLS contract tests cover the expected boundaries meanwhile.

