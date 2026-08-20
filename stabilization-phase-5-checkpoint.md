# Stabilization Phase 5 Checkpoint

Date: 2026-08-12  
Scope: sensitive traveller data / PII boundary (SEC-008)  
Production project: `fstpfqlgypvktjwdeagu` — **not modified**  
Isolated validation project: `xnsxmwgyugoqanuoyebh`

## Status

Phase 5 is **COMPLETE**. The guarded isolated runner finished with `PHASE 5 PII BOUNDARY VERIFIED: isolated project only.` The purpose-specific PII matrix passed **39/39** with zero failures, synthetic cleanup succeeded, base-row and nested/API bypass protection passed, and the Phase 2, Phase 3 and Phase 4 regression gates passed. SEC-008 is therefore **REMEDIATED + EXECUTABLY VERIFIED**.

Phase 6 has not started. No production migration was applied.

## Traveller PII inventory

The inventory covers the current schema, generated types, public entry forms, Admin clients, service-role repositories, server APIs, proposal services, accounting services and customer proposal/export components. It records fields that exist; it does not invent passport, date-of-birth or other future fields.

| Classification | Existing source/copy | Fields or content |
|---|---|---|
| Identity | `enquiries` | `name`, `nationality` |
| Contact | `enquiries` | `email`, `phone` (the public form describes phone as WhatsApp) |
| Travel requirements | `enquiries` | `summary`, travel dates, adult/child counts, selected themes/destinations/experiences/stays/vehicle/guide, `experience_participants`, `trip_state`, `traveller_notes` |
| Sensitive travel requirements | nested in `trip_state` and potentially `traveller_notes` | accessibility/mobility requirements; free text can include dietary, medical or special-occasion information |
| Commercial | `enquiries` | submitted estimate bounds, currency, basis, timestamp and `estimate_snapshot` |
| Internal | `enquiries` | `internal_notes`, status and audit timestamps |
| Curated operational copy | `curated_journeys` | itinerary copy of journey dates, party composition, destinations, experiences and travel preferences; `internal_notes`; no modelled traveller email/phone field |
| Proposal copies | `journey_proposals` | `customer_snapshot`, `sent_snapshot` and `curated_journey_snapshot` may contain name, email, country, party composition and traveller requirements; `accepted_name`, `accepted_email`, `acceptance_metadata`, public token and access-revocation reason |
| Proposal interaction | `journey_proposal_change_requests`, `journey_proposal_acceptances` | traveller name/email, free-text change message, accepted amount/terms; acceptance metadata contains a bounded user-agent and non-reversible fingerprint |
| Accounting copy | `journey_accounts` | traveller name/email plus journey reference and `quote_snapshot`; financial amounts/statuses are commercial rather than contact PII |
| Supplier allocation | `journey_supplier_allocations` | journey reference links, party/service context and supplier operational notes; no direct modelled traveller identity/contact columns |
| Receipt/document content | `accounting-receipts` Storage | uploaded bank evidence can indirectly contain payer/customer identity; access remains Finance capability-controlled under the verified Phase 4 policy |

No current traveller/passenger table, passport number, identity-document number, postal address, date of birth, emergency-contact field, or traveller-document Storage bucket exists. Partner applicant/supplier PII is a separate subject and was not reclassified as traveller data in Phase 5.

## Data-flow inventory

| Stage | Entry/storage/copy/return |
|---|---|
| Public request | `QuotationModal` and the contact form insert name, email, phone, country, free text and journey details into `enquiries`. Journey preference state in browser storage does not store the contact form identity fields. |
| Admin review/design | Admin list/detail pages previously read the `enquiries` base row. They now read the conditional summary or exact purpose projection. Journey Studio's trusted server API still loads the complete record internally only after both design and design-PII capabilities pass. |
| Curation/allocation | The original brief remains immutable; a curated itinerary copies required journey context. Partner allocation screens now receive a non-identifying supplier context rather than the complete enquiry. |
| Proposal creation | Trusted server services create immutable customer and commercial snapshots. The traveller-facing token route returns the customer DTO to the holder of the version-specific opaque token. Admin proposal responses now apply permission-aware PII and commercial DTOs. |
| Acceptance/change request | Traveller name/email and bounded interaction metadata are stored for evidence. Direct authenticated base-table reads are removed; Journey Design receives them through the shaped Admin proposal API, while Finance receives status/reference fields only. |
| Accounting | Account posting intentionally copies name/email and the commercial snapshot for audit. Finance client views and API responses exclude copied email and `quote_snapshot`; Finance retains display name and journey/account references. |
| Operations | Operations receives name, phone, nationality, dates, party/service selections, relevant notes and a quote-free operational brief only after an existing operationally relevant status. Commercial estimate/internal-note fields are excluded. |
| Search/listing | Dashboard, enquiry inbox and Journey Studio inbox use `staff_journey_request_summary`; traveller name is conditionally emitted only to Design, Finance, operationally relevant Operations or Super Admin. Email and phone are absent from list/search payloads. |
| Export | The digital proposal and proposal PDF use the same customer-safe immutable snapshot. No new export path was introduced. |
| Logs/diagnostics | No clear application path logs complete enquiries, contact fields or traveller notes. Phase 5 API diagnostics are written outside Git with mode 600; test output contains field names and verdicts, not marker values. |

## Canonical role / purpose matrix

| Role | Legitimate purpose | Traveller data boundary |
|---|---|---|
| Journey Designer | communicate, interpret requirements, design and send proposals | identity, contact, country, dates, party, selections/preferences, relevant traveller/internal notes and submitted estimate context through `traveller_journey_design` |
| Operations | deliver an accepted/active journey | name, operational phone, country, dates, party/service selections, relevant traveller notes and sanitized operational brief; only operationally relevant statuses; no email, submitted estimate or internal staff notes |
| Finance | reconcile payments/accounts and report revenue/cost/margin | journey/account reference, display name, dates, party and commercial/account fields; no email, phone, preferences, traveller/internal notes or copied quote/proposal snapshot |
| Partner Manager | select and coordinate suppliers | non-identifying journey reference, dates, party, destination/experience quantities and sanitized supplier brief; no name, contact, accessibility/free-text notes or commercial quote |
| Content Marketing | CMS work only | no traveller projection, base row, proposal data or Journey Studio API |
| Super Admin | explicit administrative/support access | complete administrative traveller projection through `traveller_admin_full` and all purpose capabilities |

## Database implementation

Migration: `supabase/migrations/202608120004_traveller_pii_boundaries.sql`

Local SHA-256: `e878a9f241831c71e1263265ee9d33846c046c31d32a61be475bbf575751dc9e`

The migration:

- introduces five capabilities separate from generic journey-row access;
- assigns exact Design, Operations, Finance and supplier-context purposes and explicitly gives Super Admin all traveller capabilities;
- revokes complete authenticated `SELECT` on `enquiries`, proposals, proposal acceptances/change requests and journey accounts;
- retains only the narrow enquiry/account column privileges needed by existing capability-authorized status/note update flows;
- replaces direct proposal/account reads with explicit projections or trusted API DTOs;
- creates security-barrier projections `traveller_journey_design`, `traveller_operations_context`, `traveller_finance_reference`, `traveller_supplier_context`, `traveller_admin_full`, `staff_journey_request_summary`, `finance_journey_accounts` and `journey_account_statuses`;
- denies all projection access to `anon`, grants invocation only to authenticated/service roles, and enforces the caller's exact capability inside every sensitive view;
- keeps public enquiry insertion and service-role orchestration unchanged;
- keeps historical proposal/account records intact.

PostgreSQL RLS is not treated as a column-hiding mechanism. The implementation combines revoked base-table reads, explicit column grants for mutation compatibility, capability-guarded views, and server DTOs.

## Application/API changes

- Dashboard, enquiry inbox and Journey Studio inbox use `staff_journey_request_summary`.
- Enquiry Review selects one exact projection based on the caller's PII capability; the client never receives fields outside that projection.
- Accounting overview/review use `finance_journey_accounts` and `traveller_finance_reference`.
- Shared lifecycle/cancellation components use `journey_account_statuses` or the Finance-safe account projection.
- Journey Studio API requires both `journey.design.*` and `traveller.pii.design.view`; Partner Manager and Finance can no longer use generic journey-view authority to retrieve the full enquiry.
- Journey proposal API shapes immutable snapshots and change requests with `proposalForStaff` / `proposalChangeForStaff`; Finance keeps commercial authority without customer snapshot, accepted contact, acceptance metadata or free-text change messages.
- Accounting activation API returns `financeAccountForStaff`, excluding copied traveller email and quote snapshot.
- Existing trusted service-role repositories may read complete records internally for proposal/accounting calculations, but their outward API payloads are explicitly shaped.

No UI-only hiding is used as the security boundary.

## Executed field-level and bypass matrix

`tests/phase5-pii-authorization.mjs` creates only disposable synthetic records with recognizable markers and records field names rather than field values. It verifies:

- complete `enquiries` base-row selection is denied to all ordinary staff and Super Admin uses the explicit full administrative projection;
- Journey Designer receives the required design field set;
- Operations receives the operational projection only for a qualifying lifecycle status and cannot receive email/internal/commercial fields;
- Finance receives only the finance reference/account projections and cannot retrieve email, phone, preferences, notes or copied account snapshots;
- Partner Manager receives only non-identifying supplier context;
- Content Marketing receives no traveller projection;
- Super Admin receives the explicit complete administrative projection;
- complete proposal and account base rows are unavailable to authenticated roles;
- nested `curated_journeys -> enquiries(*)` selection cannot reconstruct protected fields;
- Journey Studio rejects Partner Manager, Finance and Content Marketing while permitting Journey Designer;
- Admin proposal API returns full required traveller content to Journey Design, redacted content to Finance, and denies Partner Manager;
- Phase 4 Finance self-role escalation remains denied;
- every disposable enquiry, curation, proposal, change request and account is removed in `finally` cleanup.

Final isolated result: **39/39 PASS, 0 failures**. Synthetic fixture cleanup passed. The matrix proved each role receives only its purpose-appropriate field set and cannot reconstruct protected PII through complete base rows, proposal/account copies, nested relations, shared summaries or protected Admin APIs.

## Guarded isolated runner

`scripts/run-isolated-phase5-pii-boundaries.sh`:

- loads secrets only from `.env.authz.local` and does not print them;
- accepts only `xnsxmwgyugoqanuoyebh` and rejects production ref/URL/database URL;
- requires six disposable `@roamceylon.test` identities;
- detects 13 exact migration markers, skips a complete prior application, applies only when none exist, and blocks partial state;
- uses `ON_ERROR_STOP=1` and an atomic migration;
- verifies capability assignments, projections, grants, protected-table legacy-policy absence and Phase 4 Storage structure;
- runs or preserves the Phase 5 field/bypass evidence, Phase 3 exact API matrix and Phase 2 public-boundary matrix;
- preserves and validates the completed Phase 4 62-check database/self-escalation, 56-check Storage and 8-check path-safety evidence instead of rerunning an obsolete pre-PII base-row expectation;
- stores evidence outside Git under `/tmp/roam-stabilization-phase5` with restrictive permissions.

## Local validation

| Check | Result |
|---|---|
| `npx tsc --noEmit` | PASS |
| `npm test` | PASS — 147/147 |
| Focused PII tests | PASS — 5/5 (included above) |
| `npm run build` | PASS; only the established safe-projection schema-cache notices appeared because production is intentionally unmodified |
| `npm run lint` | BASELINE FAIL — seven established `react-hooks/set-state-in-effect` errors and unrelated image/effect warnings; Phase 5 DTO warnings were removed |
| `node --check tests/phase5-pii-authorization.mjs` | PASS |
| `bash -n scripts/run-isolated-phase5-pii-boundaries.sh` | PASS |
| `git diff --check` | PASS |

## Final isolated executable evidence

Final guarded runner result: **`PHASE 5 PII BOUNDARY VERIFIED: isolated project only.`**

| Gate | Final result |
|---|---|
| Purpose-specific PII matrix | PASS — 39/39, 0 failures |
| Journey Designer projection and Journey Studio API | PASS |
| Finance projection, proposal DTO and account DTO | PASS |
| Operations lifecycle-limited projection | PASS |
| Partner Manager non-identifying supplier context | PASS |
| Content Marketing traveller PII denial | PASS |
| Super Admin explicit administrative projection | PASS |
| Complete base-row bypass | DENIED / PASS |
| Nested relation and protected API bypass | DENIED / PASS |
| Proposal/account copied-PII bypass | DENIED or MINIMIZED / PASS |
| Synthetic record cleanup | PASS |
| Phase 2 public-data boundary regression | PASS |
| Phase 3 capability/API regression | PASS |
| Phase 4 database, self-escalation and Storage evidence | PASS / preserved |

## Deferred findings and scope

- SEC-004 lifecycle/state-machine enforcement remains deferred and was not remediated.
- Proposal acceptance/accounting transaction integrity, settlement architecture, performance, accessibility and product UX were not redesigned.
- Partner applicant/supplier PII is not traveller PII and was not expanded into Phase 5.
- Production project `fstpfqlgypvktjwdeagu` was not modified.
- Phase 6 was not started.

## Closure

- PII inventory: **COMPLETE**.
- Purpose-specific projections and DTOs: **IMPLEMENTED AND VERIFIED**.
- Journey Designer, Finance, Operations, Partner Manager, Content Marketing and Super Admin boundaries: **PASS**.
- Complete base-row, nested relation and protected API bypasses: **DENIED / MINIMIZED AS DESIGNED**.
- SEC-008: **REMEDIATED + EXECUTABLY VERIFIED**.
- SEC-003, SEC-005 and SEC-013 remain remediated; earlier-phase regression gates passed.
- ARC-001 and SEC-001 remain remediated; Phase 4 enforcement evidence remains valid.
- Production was not modified.
- Other findings were not remediated.
- Phase 5 exit criteria are satisfied. Phase 6 is ready for a separately authorized start and has not been started.
