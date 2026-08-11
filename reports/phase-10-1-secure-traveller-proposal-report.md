# Phase 10.1 — Secure Traveller Proposal Experience

Date: 11 August 2026  
Status: Complete

## Existing architecture reused

Phase 10's approved proposal document, customer snapshot composer, PDF exporter, proposal version records, Journey Studio workflow, supplier allocations, accounting, and RBAC remain in place. The public route continues to reuse the same `ProposalDocument` presentation as Admin Preview. No proposal redesign or commercial calculation change was made.

## Secure-link implementation

- A traveller opens `/proposal/[secure-token]` without an account.
- The token is a cryptographically random UUID capability tied to one `journey_proposals` row and therefore one proposal version.
- A fresh token is generated when that exact version is sent.
- The public loader resolves by token only; proposal IDs or URL parameters cannot select another version.
- Draft and internal-review statuses are never public.
- Revoked tokens return the same unavailable response as unknown tokens, avoiding information leakage.
- Expired versions remain readable but cannot be accepted or changed.
- Superseded versions remain clearly identifiable and read-only; they are not silently redirected.

## Customer-safe server boundary

`lib/proposals/customer-proposal-dto.ts` defines a deep Zod whitelist for the complete public proposal payload. The server parses the immutable sent snapshot through this schema before rendering it. Unknown keys are stripped and invalid legacy shapes are rejected from public access.

The public DTO contains only traveller-facing journey, stay, transport, guide, experience, inclusion, exclusion, optional-item, price, payment, terms, and centrally configured business-contact fields. It excludes supplier costs, negotiated rates, margin, profit, commission, markup, supplier contacts, procurement data, internal notes, allocation warnings, audit records, and operational instructions.

The public mutation API returns only the resulting proposal status. It never returns the proposal database row.

## Pre-booking and post-booking boundary

Snapshots now carry the extensible stage marker `pre_booking_proposal`. The pre-booking proposal provides the information needed for an informed purchase decision, including named proposed stays, room and meal plan, transport service, guides, experiences, inclusions/exclusions, optional items, total selling price, payment schedule, validity, and applicable terms.

Supplier contact details, booking references, driver/guide personal contact information, exact operational instructions, procurement notes, confirmations, tickets, vouchers, and checklists remain outside the public DTO. A later Final Journey Pack can use a different stage/schema and status gate without changing the proposal architecture.

## Traveller actions

- Accept Journey records the exact proposal ID, version, accepted total, currency, timestamp, traveller identity, acknowledgement, and limited user-agent confirmation metadata.
- Request Changes supports destination, stay, experience, transport, guide, dates, budget, general, and other categories. It creates a separate request and never edits the sent version.
- Contact Roam Ceylon continues to use the central WhatsApp configuration embedded in the customer snapshot.
- Expired, superseded, cancelled, accepted, and change-requested versions show clear, non-editable states.

## Proposal version integrity

The existing sent-snapshot database guards remain unchanged. Sending freezes the customer snapshot for that row. Journey Studio or allocation changes mark the sent version out of date; a new proposal record/version must be generated. Acceptance always records the exact displayed version and total.

## Engagement and revocation

The additive migration `202608110001_secure_traveller_proposal_access.sql` adds:

- `first_viewed_at`
- `last_viewed_at`
- `view_count`
- `access_revoked_at`
- `access_revoked_by`
- `access_revocation_reason`

Only page loads are counted; no third-party analytics, IP collection, geolocation, device fingerprinting, or cross-site tracking was introduced. Revocation preserves the proposal, sent snapshot, version history, engagement history, and acceptance/change records.

## Admin and RBAC

The existing proposal workspace now includes a compact Secure Traveller Access panel with:

- Copy Traveller Link
- View as Traveller
- Revoke Link
- Sent, first-viewed, last-viewed, view-count, accepted, and change-requested indicators
- Revocation state and internal reason
- Existing preview, send, PDF, approval, and new-version workflow

All reads remain protected by `journey.proposal.view`. Generation, status transitions, token issuance, and revocation remain protected by `journey.proposal.create`. Finance redaction remains unchanged.

## Value and PDF consistency

The approved proposal layout was preserved. A concise “Your journey, taken care of.” section was added to both the digital proposal and Phase 10 PDF. Both are generated from the same customer snapshot, so journey content, version, stays, transport, guides, experiences, pricing, payment schedule, inclusions, and exclusions remain aligned.

## Files changed

- `app/api/admin/journey-proposals/route.ts`
- `app/api/proposals/[token]/route.ts`
- `components/proposal/proposal-document.tsx`
- `features/admin/journey-lifecycle-workspace.tsx`
- `features/proposals/traveller-proposal.tsx`
- `lib/database.types.ts`
- `lib/proposals/customer-proposal-dto.ts`
- `lib/proposals/customer-proposal.ts`
- `lib/proposals/customer-proposal-types.ts`
- `lib/proposals/export-proposal-pdf.ts`
- `lib/proposals/journey-proposal-service.ts`
- `lib/proposals/traveller-proposal-service.ts`
- `supabase/migrations/202608110001_secure_traveller_proposal_access.sql`
- `tests/traveller-proposal-security.test.ts`

## Database status

The additive Phase 10.1 migration was successfully pushed to the connected Supabase project on 11 August 2026. The CLI completed the remote migration. Its subsequent local catalogue-cache warning only reflects Docker Desktop not running; it did not roll back or prevent the remote migration.

## QA results

- TypeScript: `npx tsc --noEmit` — passed.
- Automated suite: `npm test` — 122 tests passed, 0 failed.
- Targeted ESLint: 0 errors; 2 existing `no-img-element` performance warnings in the shared proposal document.
- Production build: `npm run build` — passed; all 40 static/dynamic application routes compiled.
- Security tests cover DTO whitelisting, private-field exclusion, unguessable token rotation, token-bound lookup, revocation, engagement fields, exact-version acceptance, date change requests, Admin authentication/capability checks, and web/PDF customer-content consistency.
- Browser QA confirmed that a legacy sent record with an empty pre-Phase-10 customer snapshot fails closed as an unavailable public page, while remaining available internally. No compatible already-sent Phase 10 proposal existed in the connected database for a live customer-data visual pass. Responsive behavior therefore remains covered by the unchanged approved Phase 10 responsive document component, static assertions, and the successful production compilation of the dynamic traveller and print/PDF paths; the first newly sent Phase 10.1 proposal should receive a final desktop/mobile content review before operational use.

## Legacy compatibility

No existing proposal, supplier, allocation, pricing, accounting, or enquiry data was deleted or rewritten. Legacy proposals remain available internally. Only customer snapshots compatible with the explicit Phase 10 customer schema can be sent or exposed publicly; incompatible records can be regenerated as a new secure version through the existing Admin flow.
