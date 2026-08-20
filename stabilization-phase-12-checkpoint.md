# Stabilization Phase 12 checkpoint — Partner onboarding, approval and supplier catalogue integrity

Date: 13 August 2026  
Authorized isolated project: `xnsxmwgyugoqanuoyebh`  
Explicitly rejected production project: `fstpfqlgypvktjwdeagu`  
Status: **COMPLETE — repository remediation, local validation and guarded isolated verification passed**

## Scope and production safety

Phase 12 secures the upstream trust boundary that turns public partner evidence into an internally managed supplier catalogue record. It preserves the existing public application form, Partner Applications inbox, supplier editors, pricing plans, public supplier projections and Phase 9 allocation workflow. Production was not modified and Phase 13 was not started.

The single prepared runner rejects production by project reference, Supabase URL and database URL, requires all six disposable `@roamceylon.test` staff identities, detects an already-applied migration, runs focused Phase 2–11 structural gates, and uses one canonical `phase12-*` predicate for pre-clean and post-clean verification. Private diagnostics and evidence are retained mode 600 under `/tmp/roam-stabilization-phase12`.

## Onboarding inventory

| Resource | Role in the model | Private/public boundary |
|---|---|---|
| `partner_applications` | authoritative submitted application and lifecycle | private reviewer evidence |
| `partner_application_files` | application media/document metadata | private reviewer evidence |
| `partner_application_history` | append-only review decisions | private reviewer evidence |
| `partner_onboarding_command_receipts` | Phase 12 idempotency evidence | Partner Manager/Super Admin only |
| `partner-application-media` | private application imagery | server submission + authorized reviewer access |
| `partner-application-documents` | private licence/verification documents | server submission + authorized reviewer access |
| `accommodations`, `vehicles`, `guides` | editable supplier catalogue sources of truth | protected base rows; safe Phase 2 public projections |
| `pricing_plans` | editable supplier rates | existing supplier rate capability model |
| `public_accommodations`, `public_vehicles`, `public_guides` | public catalogue projections | only active, published records; no contact/licence data |
| `journey_supplier_allocations` | Phase 9 journey allocation source of truth | now validates application-backed supplier provenance |
| `read_admin_dashboard()` | Phase 11 count-only supplier workload | no application contact, licence or document values |

No partner account, public application token, supplier bank/payout table or experience-provider application type exists in the repository. The public application categories are exactly `accommodation`, `vehicle` and `guide`. Public submission is intentionally server mediated; the applicant does not receive direct database or Storage ownership credentials and cannot edit the application after submission.

## Authoritative graph

The repository-supported graph is:

`public server-mediated submission -> submitted -> under_review / needs_information -> approved or rejected -> converted -> inactive draft catalogue record -> internal catalogue publication -> Phase 9 allocation`

- `partner_applications` remains the application evidence source of truth.
- `decision_snapshot` freezes the submitted evidence, decision, actor and time for approved/rejected decisions.
- `converted_catalogue` records the UUIDs created atomically by conversion.
- `onboarding_application_id` on accommodation, vehicle and guide rows provides immutable provenance.
- Supplier catalogue fields remain editable in their existing resource editors; editing catalogue content never rewrites historical application evidence.
- Approval and conversion are intentionally separate because the current product already reviews first and then offers “Convert to draft listing”. Conversion itself is atomic.
- Approval does not publish. Conversion creates `draft`, `active=false`, `verified=false`, `featured=false` records. Existing CMS publication remains a separate capability-controlled action.
- Internally created supplier records with no external application provenance remain supported. Application-linked records are Phase 9 eligible only after their source application reaches `converted` and lists that exact record UUID.

## Application and identity boundary

- The public endpoint validates a strict top-level Zod schema and inserts a server-shaped row with `status='submitted'`.
- Nested category data passes through an explicit denylist for authoritative identity/lifecycle/verification/publication/commercial keys before storage.
- Application UUID, reference, status, reviewer, decision and catalogue linkage are server/database generated.
- The server creates application-specific Storage paths only after the application UUID exists. Browser-supplied IDs do not establish ownership.
- Uploaded files are MIME/size constrained to the existing bucket rules; partial upload failure removes uploaded objects and the still-unreviewed application.
- There is no applicant login/edit token in the actual model. Post-submission edits are therefore not supported and remain denied.

## Authoritative review and conversion commands

`review_partner_application_command(...)`:

- service-role only;
- requires `suppliers.manage` for the supplied authenticated actor;
- accepts business actions rather than arbitrary target status;
- validates the current state and required evidence;
- requires review reasons for information requests/rejections;
- uses application locking, advisory locking and idempotency receipts;
- captures reviewer/time/decision evidence; and
- appends review history in the same transaction.

Allowed transitions are derived from the existing lifecycle:

- `submitted -> under_review | rejected`
- `under_review -> needs_information | approved | rejected`
- `needs_information -> under_review | rejected`
- same-action replay is safe; rejected/approved/converted states cannot be reset through the command.

`convert_partner_application_command(...)`:

- service-role only with `suppliers.manage`;
- locks and verifies the approved application and stored partner type;
- creates only the matching accommodation, vehicle(s), or guide record;
- atomically records immutable provenance, `converted_catalogue`, status and history;
- uses command receipts and advisory/row locking for replay/concurrency safety; and
- rolls back every catalogue insert if any entry fails.

The Admin review UI and APIs now call these commands. The former free status selector and browser DML/history writes were removed. Direct authenticated INSERT/UPDATE/DELETE grants on application evidence/history/files were revoked.

## Private evidence, licence and Storage model

- Application contact, category JSON, licence evidence and file metadata remain in private application tables/buckets.
- Partner Manager and Super Admin receive reviewer access through `suppliers.manage`.
- Journey Designer, Operations and Finance retain supplier consumption/context capabilities but no longer inherit private application/document access merely from `suppliers.view`.
- Content Marketing has no application approval, private contact, licence or document authority.
- Public safe supplier projections remain unchanged and contain no email, phone or guide licence number.
- Verification remains an internal catalogue field. Applicant payload cannot set it, and converted rows begin unverified.
- Partner Storage policies require `suppliers.manage`, a canonical `partner-applications/` path and Phase 4 traversal protection. Direct public/anonymous access remains denied.
- Public applicant files continue through the server/service endpoint rather than direct browser Storage credentials, which is the authoritative ownership check in the actual product.

## Phase 9 and Phase 10 integration

The Phase 12 eligibility trigger runs before supplier allocation insert or supplier-ID replacement:

- existing internally maintained catalogue rows with no onboarding application remain supported;
- an application-linked supplier whose application is not `converted`, whose type differs, or whose UUID is absent from `converted_catalogue` is denied;
- a correctly converted linked supplier is eligible for the existing Phase 9 journey/rate checks; and
- no Phase 9 pricing, journey relationship, confirmation or Phase 10 fulfilment invariant was weakened.

## Migration and implementation

- Migration: `supabase/migrations/202608120012_partner_onboarding_integrity.sql`
- Public submission boundary: `app/api/partner-applications/route.ts`
- Review API: `app/api/admin/partner-applications/[id]/review/route.ts`
- Conversion API: `app/api/admin/partner-applications/[id]/convert/route.ts`
- Admin reviewer: `features/admin/partner-application-review.tsx`
- Generated database contract: `lib/database.types.ts`
- Static tests: `tests/partner-onboarding-integrity.test.ts`
- Isolated matrix: `tests/phase12-partner-onboarding.mjs`
- Guarded runner: `scripts/run-isolated-phase12-partner-onboarding.sh`
- Storage cleanup helper: `scripts/cleanup-isolated-phase12-storage.mjs`

## Local validation

- TypeScript (`npx tsc --noEmit`): **PASSED**
- Project validation + Node tests: **183/183 PASSED**
- Phase 12 focused static tests: **6/6 PASSED**
- Focused ESLint: **PASSED**
- Guarded runner shell syntax: **PASSED**
- Matrix and Storage cleanup JavaScript syntax: **PASSED**
- Production build: **BLOCKED only by the established unrelated Google Fonts network fetch for Manrope and Playfair Display**. No Phase 12 compile/type error was reported before that external fetch failure.

## Isolated executable verification

The guarded Phase 12 matrix completed against authorized isolated project `xnsxmwgyugoqanuoyebh` with **40/40 PASSED and 0 FAILED**. Production was explicitly rejected and was not modified. Synthetic cleanup passed.

Executable evidence verified:

- valid submitted application state, mass-assignment boundary and self-approval denial;
- direct Partner Manager status mutation denial;
- valid review, approval, rejection and Super Admin action;
- replay and concurrent approval safety;
- unauthorized Journey Designer, Finance, Operations and Content Marketing commands;
- application-type, application-ID and supplier-provenance substitution denial;
- inactive/unverified draft conversion, conversion replay safety and approved evidence immutability;
- licence self-verification denial and public/private contact boundaries;
- valid reviewer media/document operations, public/Content Marketing denial and canonical path enforcement;
- unapproved application-linked Phase 9 supplier denial and converted supplier eligibility;
- atomic rollback on a deliberately invalid second vehicle catalogue entry;
- Phase 11 read-model consistency; and
- focused Phase 2–11 regression gates.

The matrix used synthetic `phase12-*` records only. Cleanup removed synthetic allocations/history/receipts, enquiries, rates, catalogue rows, command/history/file metadata, applications, destinations and Storage objects in FK-safe order, then verified the same canonical root predicate reached zero.

The Phase 2–11 prerequisite gates passed before matrix execution. Focused executable regression evidence confirmed the Phase 2 public/private supplier boundary, Phase 3 capability boundary, Phase 4 Storage boundary, Phase 5 PII boundary, Phase 6–10 command boundaries and Phase 11 read-model boundary remain intact.

## Current exit status

- Onboarding inventory: **COMPLETE**
- Application model: **VERIFIED**
- Valid application: **PASS**
- Self-approval/direct status mutation: **DENIED**
- Review authorization: **VERIFIED**
- Valid approval and rejection: **PASS**
- Approval/rejection/conversion replay: **SAFE**
- Approval concurrency: **SAFE**
- Unauthorized approval and type/linkage substitution: **DENIED**
- Approved evidence: **PROTECTED**
- Licence/verification authority: **VERIFIED**
- Private application data: **PROTECTED**
- Partner media/documents: **VERIFIED**
- Storage path safety: **PASS**
- Phase 9 unapproved supplier eligibility: **DENIED**
- Phase 9 approved supplier eligibility: **PASS**
- Atomicity and rollback: **PASS**
- Read-model consistency: **PASS**
- Phase 2–11 regressions: **PASSED**
- Production modified: **NO**
- Other findings remediated: **NONE**
- Phase 13 ready: **YES**
