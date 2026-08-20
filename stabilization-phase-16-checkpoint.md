# Stabilization Phase 16 — Final Release Readiness Checkpoint

Date: 2026-08-15  
Status: **COMPLETE — clean-room reconstruction and isolated critical regression verified**  
Authorized isolated project: `xnsxmwgyugoqanuoyebh`  
Rejected production project: `fstpfqlgypvktjwdeagu`  
Production modified: **NO**

## Phase reconciliation

Phases 1–15 are complete. Their checkpoints establish restore proof, capability and RLS boundaries, PII minimization, command-only lifecycle integrity, exact proposal acceptance, Accounting integrity, supplier allocation, Operations fulfilment, role-aware read models, partner onboarding, public/API validation, immutable minimized audit evidence and a 32/32 integrated golden path. No earlier phase remains partial or blocked.

| Finding | Final classification | Evidence |
|---|---|---|
| `ARC-001`, `SEC-001` | REMEDIATED | Phase 3 application/API capabilities plus Phase 4 database/RLS/Storage enforcement |
| `SEC-003`, `SEC-013` | REMEDIATED | Phase 2 public projections and anonymous denial of private supplier/setup state |
| `SEC-004` | REMEDIATED | Phase 6 authoritative transition commands and 26/26 executable matrix |
| `SEC-005` | REMEDIATED | Phase 3 exact-capability protected APIs and complete role matrix |
| `SEC-008` | REMEDIATED | Phase 5 purpose-specific traveller projections and 39/39 executable matrix |
| `SEC-014`, `TEST-001` | CLOSED AS BASELINE GAP | Phase 1 executable identity/API/Storage baseline; Phases 2–15 extend it through full integration |
| Browser header portion of `SEC-007`/`SEC-009` | REMEDIATED IN RELEASE CANDIDATE; runtime verification pending | CSP, no-store/no-index proposal responses, referrer, framing, MIME sniffing, permissions, COOP and production HSTS in `next.config.ts` |

No unresolved critical/high authorization, PII, workflow, financial, onboarding, public/API, Storage or audit-integrity finding is known after the Phase 2–15 executable evidence. Non-blocking post-launch work remains: measured pagination/query optimization before scale, extended accessibility/manual UAT, formal legal/privacy text, durable platform edge throttling at cutover, stronger media processing/malware scanning where required, and proposal-token-at-rest hardening if the threat model later requires it. These items do not weaken the verified database/business invariants, but public launch still requires the human preflight in the cutover plan.

## Canonical migration evidence

- Complete repository migration inventory: **84 files**, frozen in `repository-migration-manifest.sha256`.
- Stabilization chain: **14 unique files**, frozen in `stabilization-migration-manifest.sha256`.
- Stabilization order is `202608120001` through `202608120014`.
- `202608120009_supplier_allocation_pricing_enum_compatibility.sql` is the legitimate Phase 9 follow-up and is preserved.
- Repository checksum and unique-version validation: **PASSED locally**.
- Hosted migration bookkeeping is not used as proof for the Phase 1 logical restore; the clean-room rehearsal generated and verified the complete 84-entry local history from the repository.

The clean-room rehearsal is implemented in `scripts/run-isolated-phase16-release-readiness.sh`. It creates a disposable local Supabase database, proves it is empty, applies the five schema/bootstrap migrations required by the canonical JSON importer, imports the repository-owned baseline catalogue, then applies the remaining 79 migrations. It verifies RLS/constraints/core RPCs, compares a normalized structural/system-data fingerprint with the accumulated isolated project, destroys the disposable environment, and invokes the already-guarded Phase 15 golden path. The final human-executed run passed all 84 migrations, matched the isolated baseline and completed the 32/32 Phase 15 critical regression.

The first manual rehearsal exposed this required ordering: `202608040002_premium_experience_catalogue.sql` deliberately refines and validates 118 catalogue records that are populated by `scripts/import-json-to-supabase.mjs`; an all-migrations/no-import harness reached its validation with zero records. The runner performs the canonical import at the earliest complete importer schema (`202607260005`) and keeps its report in private Phase 16 diagnostics. Narrow historical bootstrap corrections for temporary-table lifecycle and a transitional Sporting count were checksummed in the frozen repository manifest; they changed no application behavior or production data.

The next bootstrap attempt exposed a provider-generation difference rather than an importer or catalogue defect. The repository's current local Supabase configuration uses the newer `auto_expose_new_tables=false` default, so the local `service_role` JWT bypassed RLS but did not hold table DML privileges at the early importer checkpoint. The original hosted project/import workflow was created with the legacy Supabase auto-exposure grants and the importer works in that intended environment. The runner now enables `auto_expose_new_tables=true` only in its disposable copied configuration, reproducing the original bootstrap grant model. The hardened Phase 2–4 migrations later revoke/narrow public and staff access, and the final fingerprint still has to match the isolated stabilized state. The repository configuration, application authorization and historical migrations remain unchanged.

## Fresh-install bootstrap classification

| Classification | Data/configuration |
|---|---|
| REQUIRED SYSTEM DATA | staff roles, permissions and role-permission grants; enums/reference rows created by migrations; singleton public/settings/pricing defaults required by application contracts; four Storage buckets and their policies |
| OPTIONAL BUSINESS DATA | travel themes, destinations, experiences, stays, vehicles, guides, supplier rates, benefits and website editorial settings beyond safe defaults |
| TEST-ONLY DATA | all `phaseN` synthetic IDs/markers, `.invalid`/`@roamceylon.test` identities, authorization fixtures, command failure probes and cleanup contexts |
| USER-ENTERED REAL DATA | traveller enquiries, partner applications, supplier contacts/licences, proposals, accepted journeys, payments, receipts, settlements, real media and production staff identities |

No synthetic fixture is part of production bootstrap. The first Super Admin is created through the controlled human procedure in `production-cutover-plan.md`; the historical `editor` value is not an authority source.

## Storage readiness

| Bucket | Public | Limit | Allowed MIME types | Production authority |
|---|---:|---:|---|---|
| `travel-content` | yes | 100 MB | configured image/video allowlist | Content Marketing/Super Admin capabilities and canonical object paths |
| `partner-application-media` | no | 10 MB | JPEG, PNG, WebP | applicant-scoped public intake plus Partner Manager review paths |
| `partner-application-documents` | no | 15 MB | PDF, JPEG, PNG | applicant-scoped private documents plus Partner Manager review paths |
| `accounting-receipts` | no | 10 MB | PDF, JPEG, PNG, WebP | Finance-controlled receipt workflow |

Phase 4 verified 56/56 normal Storage authorization probes and 8/8 canonical path-safety probes. Phase 12 verified onboarding media/document boundaries. Storage metadata is migration-managed; underlying files require a separate export because a database backup alone does not contain the objects.

## Environment contract

| Variable | Classification | Production |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | PUBLIC, required | required |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | PUBLIC, required | required |
| `NEXT_PUBLIC_SITE_URL` | PUBLIC, recommended | canonical `https://theroamceylon.com` |
| `SUPABASE_SERVICE_ROLE_KEY` | SERVER-ONLY SECRET, required | secret manager only |
| `SUPABASE_URL` | OPTIONAL TOOLING | importer fallback only |
| `AUTHZ_TEST_*`, `AUTHZ_FIXTURE_*` | TEST-ONLY | forbidden from deployment environment |

No privileged variable has a `NEXT_PUBLIC_` name and browser source does not read the service-role key. The local `.env.authz.local` remains outside deployment and is not printed by runners.

## Test-only, logging and legacy review

- Phase runners, synthetic matrix files, cleanup scripts and failure-injection controls are **safe test-only repository artifacts**. They are not imported by application routes or bundles.
- Direct database cleanup contexts require a service-role database session plus a narrow transaction-local flag and synthetic markers. They are not exposed as public or staff RPCs and are inert in normal application operation.
- Private diagnostics are retained under `/tmp`, mode-restricted and excluded from Git.
- Partner application drafts now use tab-scoped `sessionStorage`, not durable `localStorage`; successful submission removes the draft.
- Admin login returns a generic authentication error. Journey bootstrap logging records only a scoped error classification and does not serialize caught objects, request bodies, tokens or PII.
- Phase 14 immutable/minimized observability remains authoritative; release changes do not suppress it.
- The canonical authority is `profile_staff_roles` plus capabilities. Active staff/API paths do not use the legacy `editor` role. Historical schema compatibility remains inert.
- Public submissions, proposals, Accounting, allocations, Operations, dashboards, audit reads and content publication retain the strict contracts proven by Phases 2–15.

## Release controls prepared

- Browser security headers and proposal privacy headers are present in the release candidate.
- Production backup, Storage export, recovery, realistic forward-fix/restore rollback and exact cutover ordering are documented in `production-cutover-plan.md`.
- The non-destructive post-cutover public/admin/security/business checklist is in `production-smoke-test-checklist.md`.
- Real content remains prohibited until cutover and smoke verification; month-long protection controls are in `real-data-entry-readiness.md`.
- No production deploy script was created or executed. The plan intentionally requires explicit human project confirmation, backup evidence and independent go/no-go review.

## Validation status

| Gate | Result |
|---|---|
| Phase 1–15 checkpoints | ALL COMPLETE |
| 84-file repository checksum manifest | PASSED |
| 14-file stabilization checksum manifest | PASSED |
| Shell syntax for Phase 16 runner | PASSED |
| Phase 16 static release contracts | PASSED (11/11 focused tests) |
| TypeScript | PASSED (`npx tsc --noEmit`) |
| Full local suite | PASSED (214/214) |
| Focused lint | PASSED |
| Full lint baseline | 7 established React effect errors and 3 image/hook warnings remain in unrelated pre-Phase-16 components; no new Phase 16 lint finding |
| Production build | PASSED; existing local pre-cutover PostgREST projection cache warnings remained non-fatal |
| Clean-room 84/84 reconstruction | PASSED |
| Clean-room/isolated fingerprint equality | PASSED — schema and required system data match |
| Final isolated golden path and cleanup | PASSED — 32/32 |

## Final performance sanity

No stabilization migration introduced an unbounded recursive query, missing unique/idempotency constraint, uncontrolled background loop or eager public disclosure. Critical lookup/command paths retain indexed identifiers and bounded API bodies. The production build completes. Some Admin catalogue selectors and public catalogue repositories still load full active lists, and proposal/public data composition can issue several parallel relationship queries. At the current controlled pre-launch catalogue volume these are not a release blocker; pagination, measured query plans and cache/bundle budgets remain an explicitly deferred scale gate before materially larger catalogues or traffic. No destructive load testing was performed.

The full lint result is also an established non-security baseline rather than a hidden PASS: `accounting-overview.tsx` and `experience-editorial.tsx` retain React `setState`-in-effect findings, and the proposal document retains two deliberate `<img>` warnings for printable/customer media. Touched Phase 16 files pass focused lint, TypeScript, tests and production compilation.

## Current decision

Phase 16 is **COMPLETE** and ready for human review. The repository is ready to enter C0 preflight, but this checkpoint does not authorize production deployment or real-data entry. Production backup, target verification, cutover, production smoke testing and the human GO/NO-GO decision remain mandatory. Production remains unmodified.

**STABILIZATION PHASE 16 COMPLETE — READY FOR HUMAN REVIEW**
