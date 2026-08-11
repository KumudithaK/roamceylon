# Phase 10.2 — Roam Ceylon Preferred Benefits & Privileges

Date: 11 August 2026
Branch: `agent/premium-experience-showcase`

## Outcome

Phase 10.2 adds a structured, additive benefits capability without changing the Journey Builder, pricing engine, supplier cost model, Accounting, proposal lifecycle, secure proposal access, or existing supplier CMS.

The implementation reuses the existing Journey Studio, supplier allocation, immutable proposal snapshots, secure customer DTO, premium digital proposal, PDF export, Operations workspace, staff permissions and RLS architecture.

## Benefit model

Migration: `supabase/migrations/202608110002_preferred_benefits_and_privileges.sql`

New tables:

- `benefit_definitions` — reusable Roam Ceylon, partner, destination and service benefits.
- `journey_benefits` — journey-specific selections, customer wording snapshots, verified savings and fulfilment state.

Supported types:

- Roam Ceylon complimentary
- Preferred rate
- Partner privilege
- Complimentary upgrade
- Meal benefit
- Arrival / departure benefit
- Celebration benefit
- Experience benefit
- Roam Ceylon service benefit
- Other extensible traveller benefit

Scopes include journey, traveller, stay, destination, experience, transport, guide and journey day.

Confidence is explicit and immutable in each journey selection:

- Guaranteed by Roam Ceylon
- Confirmed partner benefit
- Subject to availability

Conditional customer wording remains conditional and is never upgraded to a guarantee.

## Default welcome benefit

The migration seeds `roam_ceylon_welcome_tshirt` as an active default benefit:

- one complimentary printed white Roam Ceylon T-shirt per traveller;
- guaranteed by Roam Ceylon;
- snapshotted into a proposal when generated;
- removable for an individual journey;
- fulfilment sizes may be collected after acceptance.

Operations supports adult and child sizes, quantity, notes, and the statuses Not Required, Pending, Confirmed, Prepared, Delivered and Unavailable. This remains intentionally lightweight and does not introduce inventory management.

## Preferred-rate integrity

A savings comparison can be verified only when all of the following are recorded:

- customer rate and higher comparable reference rate;
- currency and rate unit;
- reference basis and internal evidence/source;
- verification date;
- matching occupancy, room category and meal plan;
- applicable travel period;
- comparable taxes/fees and cancellation terms.

The journey dates must fall within the comparison period. Without this evidence, the traveller can see a preferred customer rate but cannot see an original/reference price or savings claim.

Verified saving is calculated server-side as:

`(reference rate - customer rate) × applicable quantity`

Non-monetary benefits are never assigned invented values. A total is shown only for verified monetary comparisons and uses restrained premium wording.

## Admin and journey integration

- New top-level **Benefits & Privileges** workspace to create, edit, disable and associate reusable benefits with existing stays, vehicles, guides, experiences or destinations.
- Internal evidence and notes are redacted unless the staff member has reference-rate permission.
- Journey Studio shows applicable journey-wide value without changing curation.
- Supplier Allocation surfaces relevant benefits only after the matching partner/service is allocated. Staff must manually include them; stored conditional benefits are not automatically promised.
- Destination benefits can be selected independently while still requiring that destination to belong to the journey.
- Any material journey-benefit change marks an active proposal as requiring a new version.

## Proposal and security integration

Proposal generation persists default benefits and adds selected benefits to the customer snapshot. The exact benefit wording, scope, confidence, rates and verified value therefore belong to that proposal version.

The secure digital proposal and its PDF share the same snapshot and add **The Roam Ceylon Difference** section. Only approved customer-safe fields are serialized. The customer DTO does not contain supplier cost, contract rates, margin, markup, commission, internal notes, evidence/source documents or procurement details.

The accepted proposal snapshot is read separately in Operations, so staff can see exactly what the traveller accepted even if a reusable definition is later edited or disabled.

## Accounting separation

No Accounting or package-pricing code was changed. Reference rates and verified savings are informational only:

- reference rate is not revenue;
- reference rate is not supplier cost;
- verified savings does not affect package price, payment, settlement, margin or profit;
- customer selling prices continue through the existing commercial allocation and proposal engine.

## RBAC

Added permissions using the repository's alphabetic dot-separated naming convention:

- `benefits.view`
- `benefits.manage`
- `benefits.assign`
- `benefits.reference.view`
- `benefits.reference.manage`

Journey Designers can view and assign. Partner Managers can manage benefits and reference evidence. Operations can view/assign and update fulfilment through its existing permission. Finance can view benefit/reference context without managing claims. Super Admin receives every benefit permission.

Both tables use RLS and deny anonymous access.

## Files changed

- `app/admin/benefits/page.tsx`
- `app/api/admin/benefits/route.ts`
- `app/api/admin/journey-benefits/route.ts`
- `components/proposal/proposal-document.tsx`
- `features/admin/admin-shell.tsx`
- `features/admin/benefits-manager.tsx`
- `features/admin/journey-benefits-panel.tsx`
- `features/admin/journey-lifecycle-workspace.tsx`
- `features/admin/journey-studio.tsx`
- `lib/admin/permissions.ts`
- `lib/benefits/journey-benefit-service.ts`
- `lib/benefits/preferred-benefits.ts`
- `lib/database.types.ts`
- `lib/proposals/customer-proposal-dto.ts`
- `lib/proposals/customer-proposal-types.ts`
- `lib/proposals/export-proposal-pdf.ts`
- `lib/proposals/journey-proposal-service.ts`
- `supabase/migrations/202608110002_preferred_benefits_and_privileges.sql`
- `tests/preferred-benefits.test.ts`

## Verification

- Supabase migration: applied successfully to the linked remote project.
- TypeScript: `npx tsc --noEmit` — passed.
- Tests: `npm test -- --runInBand` — 130 passed, 0 failed.
- Phase 10.2 targeted ESLint — passed with only the two pre-existing `<img>` optimization warnings in the proposal document.
- Production build: `npm run build` — passed; all 43 static pages generated and dynamic routes compiled.
- Repository-wide ESLint still reports pre-existing `react-hooks/set-state-in-effect` errors in `features/admin/accounting-overview.tsx` and `features/experiences/experience-editorial.tsx`. Phase 10.2 did not modify those flows.

QA covers the default multi-traveller T-shirt, verified and unverified preferred rates, conditional wording, non-monetary benefits, multiple benefits, verified totals, proposal version snapshotting, accepted-benefit visibility, fulfilment, RLS/RBAC, public data leakage and Accounting isolation.

## Manual configuration

1. Open Admin → Benefits & Privileges to add genuine partner privileges.
2. Associate each partner benefit with the existing supplier/service record.
3. Complete every comparison-evidence field before marking a preferred-rate comparison verified.
4. Select the benefits that genuinely apply within Supplier Allocation; do not select conditional benefits as guaranteed.
5. After proposal acceptance, Operations records T-shirt sizes and fulfils the accepted promises.

No supplier rates, benefits or savings beyond the guaranteed welcome T-shirt were invented or automatically published.
