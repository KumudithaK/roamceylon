# Phase 10 — Premium Journey Proposal & Traveller Approval

Date: 10 August 2026  
Branch: `agent/premium-experience-showcase`

## Existing architecture discovered

- Journey proposals already existed as versioned commercial records linked to traveller enquiries.
- Journey Studio stores the editable, curated itinerary separately from the immutable traveller brief.
- Supplier allocations store the selected accommodation, guide, transport and experience services, including saved rate snapshots and journey-specific commercial values.
- Proposal generation previously produced an internal allocation summary and PDF, but it did not preserve a complete customer document, provide a traveller proposal page, or record version-specific acceptance and structured change requests.
- RBAC already provided `journey.proposal.view` and `journey.proposal.create`; Phase 10 continues to enforce those capabilities through the server API.

## Implementation summary

### Proposal data and composition

- Added a customer-safe `ProposalSnapshot` model containing brand, traveller, curated route, day-by-day itinerary, destinations, stays, transport, guides, experiences, explicit meals, inclusions, exclusions, optional additions, reconciled customer pricing, payment schedule, requirements, terms, next steps and central contact details.
- Proposal source order is Curated Journey first, then saved supplier allocations, final commercial selling price and customer-facing proposal content.
- Legacy journeys safely fall back to their original journey state only when no Curated Journey exists.
- Customer price categories reconcile exactly to the final proposal total; supplier costs, margins, commissions, payment states, internal notes and internal identifiers are excluded.

### Versioning and immutable snapshots

- Each generated proposal creates a new numbered version.
- Internal approval is required before sending.
- Sending freezes the exact customer document in `sent_snapshot` and activates an opaque version-specific traveller token.
- A database trigger prevents customer, allocation, commercial, curated journey, currency and total fields from being rewritten on a sent proposal.
- Journey Studio or proposal-relevant supplier-allocation changes flag the active proposal as out of date and require a new version.
- Historical versions remain visible in Admin and accepted versions are preserved.

### Admin proposal preparation

- Added editable personal introduction, customer terms, validity date, deposit amount/dates, journey-specific inclusions, exclusions and important information.
- Added a customer-facing proposal preview and a pre-send review for journey, pricing, inclusions/exclusions, payment schedule and contact completeness.
- Added explicit internal approval and intentional send actions.
- Added warnings for subject-to-confirmation services and out-of-date proposals.
- Added version history and visible structured traveller feedback.
- Existing internal commercial summary remains Admin-only.

### Traveller proposal experience

- Added `/proposal/[token]`, with the normal site header/footer suppressed so the proposal reads as a dedicated premium document.
- Added editorial cover, personal introduction, complete route/map, day-by-day itinerary, destination chapters, stays, transport, guide services, experiences, optional additions, inclusion/exclusion sections, final journey investment, payment schedule, requirements, terms, next steps and contact footer.
- Meal language is explicit; ambiguous “meals as applicable/specified” wording is not used.
- Services display traveller-friendly confirmation states rather than internal allocation terminology.
- Empty sections and unconfigured future business identifiers are omitted.

### Traveller approval and change requests

- Traveller acceptance records the exact proposal ID/version, total, currency, name, email, terms acknowledgement, timestamp and a privacy-conscious request fingerprint.
- The proposal email must match the enquiry email.
- A stale, expired, superseded, changed or already accepted version cannot be accepted.
- Structured change requests support general, destination, accommodation, experience, transport, guide, budget and other categories without overwriting the proposal.
- Change requests move the workflow back to proposal preparation so Journey Studio can produce a new version.

### PDF and print

- Replaced the previous internal-style PDF with an A4 customer proposal using the same customer snapshot.
- Added page-aware headings, card-safe print rules, proposal reference/version, page numbering, contact footer, premium brand styling and a generated WhatsApp QR code where available.
- The digital proposal also supports browser print/PDF with dedicated print CSS.

### Central contact configuration

- Expanded `website_settings` as the single source for hotline, WhatsApp URL, Facebook URL, address, website, official email, business registration number and SLTDA registration number.
- Applied current official hotline, WhatsApp, Facebook and business address.
- Updated the public footer and Contact page to consume central values and omit empty future fields.

## Database migrations

- `202608100005_premium_journey_proposals.sql`
  - central contact fields
  - Phase 10 proposal statuses and customer/sent snapshots
  - public proposal token
  - internal approval, view, change and acceptance metadata
  - structured change-request and acceptance audit tables with RLS
- `202608100006_proposal_snapshot_guards.sql`
  - out-of-date proposal state
  - sent-snapshot immutability trigger
  - Journey Studio and allocation change detection

Both migrations were successfully applied to the linked Supabase project. The Supabase CLI reported only its known Docker catalogue-cache warning after the successful remote push.

## Main files changed

- `app/api/admin/journey-proposals/route.ts`
- `app/api/proposals/[token]/route.ts`
- `app/proposal/[token]/page.tsx`
- `app/contact/page.tsx`
- `app/globals.css`
- `components/proposal/proposal-document.tsx`
- `components/site/site-header.tsx`
- `components/site/site-footer.tsx`
- `features/admin/journey-lifecycle-workspace.tsx`
- `features/proposals/traveller-proposal.tsx`
- `lib/proposals/customer-proposal.ts`
- `lib/proposals/customer-proposal-types.ts`
- `lib/proposals/journey-proposal-service.ts`
- `lib/proposals/traveller-proposal-service.ts`
- `lib/proposals/export-proposal-pdf.ts`
- `lib/database.types.ts`
- `tests/journey-lifecycle.test.ts`

## Compatibility and security

- Traveller Brief, Journey Studio, supplier management/allocation, accounting, operations, CMS, guides, journey legs, estimated price ranges and public Journey Builder behaviour were not redesigned.
- Existing proposal records remain accessible. Legacy proposal versions without a Phase 10 snapshot must be regenerated as a new version before sending.
- Public proposal endpoints return only status after mutations; no internal proposal row or commercial data is returned.
- Admin routes retain server-side RBAC checks and database RLS remains enabled.

## Verification

- TypeScript: passed (`npx tsc --noEmit`).
- Automated tests: 116 passed, 0 failed (`npm test`).
- Phase 10 targeted ESLint: 0 errors; two intentional `img` advisories remain for the print-safe brand logo and generated QR image.
- Full-project ESLint remains blocked by eight pre-existing React effect errors in `accounting-overview.tsx` and `experience-editorial.tsx`; Phase 10 added no lint errors.
- Production build reached Next.js compilation but could not download the existing Manrope and Playfair Display Google fonts because outbound font access was unavailable in this execution environment. No Phase 10 TypeScript or application compilation error was reported before that external fetch failure.
- Local runtime smoke testing was blocked by an inaccessible stale Next dev lock owned by PID 4276. The existing log shows successful compilation before the stale process became unreachable.

## Manual configuration required before production

1. Configure and verify the official website URL when confirmed.
2. Configure and verify the official business email when confirmed.
3. Add the Business Registration Number only after the valid number is issued.
4. Add the SLTDA licence/registration number only after it is valid.
5. Confirm approved customer-facing proposal terms, cancellation wording and payment policy; the system intentionally does not invent legal language.
6. Set the deposit amount and applicable due dates per proposal where payment terms are ready.
7. Review all services labelled “Subject to confirmation” before sending.
8. Verify a production build in a networked CI environment where the project’s existing Google fonts can be downloaded or cached.
9. Confirm the generated WhatsApp QR code remains scannable in the final email/PDF delivery environment.

## Resulting lifecycle

Traveller Brief → Journey Studio → Supplier Allocation → Accounting / Costing → Final Selling Price → Versioned Journey Proposal → Traveller Acceptance → Operations

The traveller receives the exact proposal version they review and accept, with a transparent total, clear inclusions/exclusions and an auditable path for refinements.
