# Stabilization Phase 13 checkpoint — Public/API boundary, abuse resistance and input integrity

Date: 14 August 2026  
Authorized isolated project: `xnsxmwgyugoqanuoyebh`  
Explicitly rejected production project: `fstpfqlgypvktjwdeagu`  
Status: **COMPLETE — public/API boundary remediation and guarded isolated verification passed**

## Guarded-runner blocker correction

The first guarded execution safely rejected production, applied the Phase 13 migration to the isolated project, and then stopped before fixture creation or matrix execution. The failed assertion called `to_regclass('public.published_content')`. Repository and Phase 2 evidence show that `published_content` is only the authorization-matrix resource label for an anonymous filtered read of `public.themes`; no relation with that name has ever been part of the authoritative schema.

This was a stale Phase 13 runner assertion, not a Phase 2 security regression. The runner now verifies the actual current boundary separately: the published-theme RLS source/policy, all four Phase 2 projections, their anonymous SELECT grants, forbidden-column absence, and denial of anonymous supplier/settings base-table SELECT. Every assertion emits a sanitized invariant-specific failure. The runtime probe now reads published rows from `themes`, matching `tests/authorization-baseline.mjs`. No application behavior, database object or completed migration was changed for this correction.

The next stopped run exposed a second stale structural assertion: it expected `public.traveller_supplier_context(uuid)` as a function. Phase 5 created `traveller_supplier_context` as a capability-guarded security-barrier view, alongside the journey-design, Operations, Finance and Super Admin purpose projections. The Phase 13 gate now validates the canonical view set, anonymous/authenticated grants, complete enquiry base-row denial and forbidden-column absence. Its runtime matrix also re-executes the role-purpose boundary against one synthetic enquiry. This was a runner correction, not a Phase 5 regression or database change.

The first complete matrix then reported three proposal-token failures. The public route and Phase 7 exact-token command were correct; Phase 13 had inserted truncated synthetic `sent_snapshot` values that could not pass the real customer-safe proposal DTO. The route therefore returned unavailable before identity validation or acceptance, with zero persisted acceptance rows. The fixture now uses the complete public proposal contract, and proposal probes record HTTP status plus aggregate acceptance-row counts. The corrected run proved valid acceptance, conflict-safe replay without duplication and denial of token/traveller substitution. No application behavior, Phase 7 object or completed migration was changed.

## Scope and production safety

Phase 13 hardens externally controlled HTTP, anonymous Supabase, token and upload inputs without redesigning the product or changing the Phase 2–12 business commands. Production was not modified and Phase 14 was not started. The prepared runner rejects production by project reference, Supabase URL and database URL, requires all six disposable staff identities, uses only `phase13-*` records, applies/skips the Phase 13 migration deterministically, pre-cleans, verifies zero stale fixtures, runs low-volume probes through a temporary isolated Next.js server, retains diagnostics privately, cleans in FK-safe order and verifies cleanup.

## External attack-surface inventory

### Public and anonymous boundaries

| Path / function | Method / auth | Input and validation | Output / side effect | Abuse and authority boundary |
|---|---|---|---|---|
| `/api/enquiries` | POST, anonymous | strict Zod allowlist; 160 KB streamed JSON cap; bounded text, UUID arrays, counts and estimate; honeypot | journey reference only; creates one `new` enquiry | service client; server-shaped fields; payload-bound idempotency; email-keyed low-volume limiter; anonymous table INSERT revoked |
| `/api/partner-applications` | POST, anonymous multipart | strict payload; 200 MB request declaration cap; per-file count/size/MIME/signature checks; HTTP(S)-only links | application reference and category only; creates `submitted` application and private files | service client; authoritative nested fields removed; server UUID path; random object key; replay digest; limiter; partial upload cleanup |
| `/api/proposals/[token]` | POST, opaque token + traveller identity | UUID token; strict accept/change union; 16 KB streamed JSON cap; bounded identity/message; exact traveller match in Phase 7 command | proposal status only; acceptance or change request | generic token errors; token/email limiter; no caller proposal ID or commercial fields; transactional Phase 7 command |
| `/api/journey-estimate` | POST, anonymous | strict bounded journey schema; 100 KB streamed JSON cap; UUID/count/array bounds | public per-person planning range | service pricing reads; no mutation; server derives rates and business settings |
| `/api/quotes` | POST, anonymous legacy quote | strict bounded selection schema; 100 KB streamed JSON cap | public quote DTO only | service pricing reads; no internal breakdown returned |
| Public Supabase reads | anonymous publishable key | repository-fixed selections and relationship IDs | published content, safe supplier projections and website public projection | Phase 2 RLS/projections; no generic user-controlled field/sort expression |
| `/proposals/[token]` | GET page, opaque token | server-side token lookup; Phase 7 validity/status/version checks | customer-safe immutable proposal snapshot | no private supplier/internal commercial fields |
| `/partners/application-received` | GET page, anonymous query | category enum allowlist; React-escaped reference | confirmation display only | no database lookup or mutation from the reflected reference |
| `/journey-builder`, `/partners/apply`, `/contact` | GET pages, anonymous query | explicit recognised keys; numeric coercion/bounds in journey state; category/boolean allowlists | initial UI state only | React escaping; no raw SQL/filter/sort; no redirect target |
| Public Storage | anonymous | no direct public upload operation in the application | published media reads only | partner uploads are server mediated; Phase 4/12 bucket policies preserved |

No webhook, callback, caller-controlled redirect, public search API, generic database proxy, server action or public account-recovery implementation exists.

### Staff HTTP boundaries

| API group | Methods | Authentication / authorization | Authoritative action |
|---|---|---|---|
| `/api/admin/journey-studio` | GET/POST | bearer identity plus journey design and purpose-specific PII capabilities | curated journey read/edit and guarded transition |
| `/api/admin/journey-allocations` | GET/POST/PATCH | exact view/allocate/operations/finance capabilities | Phase 9 allocation commands and Phase 10 fulfilment |
| `/api/admin/journey-proposals`, `/api/admin/quotes` | GET/POST | exact proposal view/create/send/manage capability | proposal generation/transition/revocation and internal quote |
| `/api/admin/enquiry-lifecycle` | POST | action-derived journey/operations capability | Phase 6/10 transition commands |
| `/api/admin/accounting/*` | POST | exact Finance payment, reversal or override capability | Phase 8 accounting commands; receipt upload uses Finance Storage boundary |
| `/api/admin/benefits`, `/api/admin/journey-benefits` | GET/POST | exact benefits/reference/assignment/operations capabilities | capability-shaped reads and guarded benefit assignment/fulfilment |
| `/api/admin/partner-applications/[id]/review`, `/convert` | POST | `suppliers.manage`; strict UUID and action inputs | Phase 12 review/conversion commands |

Every custom staff route calls `authenticatedStaff(...)` before its privileged operation. That function verifies the bearer token with Supabase Auth, resolves the current staff role/capabilities and fails closed. Legacy `editor` is not an authorization role. Database commands retain the Phase 3–12 service-role/capability, relationship, lifecycle and idempotency checks.

## Trust-boundary classification

- **Anonymous controlled:** public form text, journey selections, participant counts, proposal identity/action, public token, partner files and external partner links.
- **Authenticated-user controlled:** staff route bodies, route/query UUIDs and Finance receipt input. These are runtime validated and capability checked.
- **Signed/token-bound:** proposal access token plus authoritative proposal version/status and matching traveller identity.
- **Server authoritative:** lifecycle/status, reviewer, approval, verification, supplier/catalogue linkage, account/proposal/allocation IDs, commercial totals, audit actors/timestamps, Storage bucket and object root.
- **Derived:** journey reference, idempotency digest, pricing results, proposal commercial snapshot, upload UUID/name and rate/relationship results.
- **Internal only:** service-role key, internal cost/margin, private contacts/licence/bank evidence, staff read models and command receipts.

TypeScript shapes are not treated as validation. External mutation routes use runtime schemas and explicit server-shaped command parameters.

## Public enquiry boundary and abuse resistance

The two public enquiry forms no longer insert directly into `enquiries`. They call one server route. Unknown properties are rejected; callers cannot supply lifecycle, assignment, approval, proposal, accounting, operational or commercial fields. The API fixes `status='new'`, returns only the journey reference, and records a server-calculated SHA-256 payload digest against an opaque client-generated submission UUID.

Same key + same body returns the original reference without a duplicate. Same key + changed body returns conflict. A hidden honeypot, streamed payload limit and small email-keyed in-process limiter add low-risk abuse resistance without trusting `X-Forwarded-For`. The limiter is deliberately a best-effort single-instance control; durable platform rate limiting remains an infrastructure concern rather than a fabricated distributed guarantee.

## Partner application boundary

- Strict top-level schema and server-fixed `submitted` lifecycle.
- Applicant cannot set reviewer, approval, verification, publication, supplier linkage or internal notes; matching nested authoritative keys are stripped.
- Submission UUID/digest provides replay safety.
- Links permit HTTP and HTTPS only.
- Media: JPG/PNG/WebP, maximum 10 files and 10 MB each.
- Documents: PDF/JPG/PNG, maximum 6 files and 15 MB each.
- Request-declared size is capped before multipart parsing; MIME is confirmed by file signature rather than browser declaration alone.
- Original names are normalized without dots/path separators, prefixed with a random UUID, and placed under the server-created `partner-applications/<category>/<application UUID>/` root with `upsert=false`.
- Failed upload/file metadata work removes uploaded objects and the unreviewed application. Private Phase 12 evidence policies remain unchanged.

## Proposal token boundary

The public action accepts no proposal ID, price, supplier, journey or commercial field. Phase 7 binds the opaque UUID token to the current sent proposal, exact traveller identity, status/version, expiry/revocation and immutable commercial snapshot. Acceptance is atomic and replay safe. Externally visible failures are generic and do not expose database messages or distinguish arbitrary internal identifiers beyond the minimum invalid/unavailable/conflict semantics.

Tokens use unpredictable UUID values and are stored on the protected proposal row. The application does not log request bodies, tokens or authorization headers. This is acceptable for the present link-sharing threat model; infrastructure access-log redaction and future token-at-rest hashing remain deployment-hardening considerations, not evidence-backed Phase 13 application failures.

## Public content, parameters, pagination and injection

- Phase 2 `published_content`, safe supplier projections and `website_public_settings` remain the intended anonymous reads. Draft content, supplier base rows and internal setup remain denied.
- The public application exposes no caller-controlled pagination/sort/field-selection endpoint. Staff journey changes are internally capped at 100. Existing list screens use fixed repository queries rather than arbitrary sort/filter expressions.
- SDK filters bind values. Repository dynamic SQL uses fixed internal identifier lists with PostgreSQL `%I`; no public input reaches raw SQL, dynamic `EXECUTE`, arbitrary PostgREST expression, SQL identifier or regex.
- Public query parameters initialize state or display escaped text. They do not authorize data, mutate business state, choose an external redirect or select arbitrary columns.
- Unsupported HTTP methods have no handler and return 405; GET does not perform a business mutation.

## XSS, URL, redirect and SSRF assessment

React renders public/traveller/partner/CMS text as escaped text. The only active `dangerouslySetInnerHTML` is organization JSON-LD built with `JSON.stringify` and explicit `<` escaping; it does not ingest traveller or partner text. No active raw HTML/Markdown parser was found. Representative stored/reflected values therefore remain inert under the actual rendering model.

Navigable partner submission and public website/social links accept/render only HTTP(S). Unsafe `javascript:` and `data:` schemes are rejected or omitted. Mail/phone links are constructed for the corresponding display fields. No caller-controlled redirect exists; static Next.js redirects target repository-fixed internal paths. No server-side fetch consumes a caller URL, so SSRF is **NOT APPLICABLE**. The weather server fetch uses a fixed MET endpoint and internal destination coordinates.

## Error, logging, CORS, CSRF, cache and client bundle

- Public mutation routes return generic errors and minimal response DTOs; no SQL, stack, path, environment, service credential, PII, licence or bank detail is returned.
- No application logging of full payloads, authorization headers, cookies, credentials or public tokens was found.
- No wildcard/custom CORS headers exist. Same-origin browser behavior is retained.
- Staff custom routes use explicit bearer tokens rather than ambient cookies; public mutations have no authenticated ambient authority. Classical CSRF is therefore not applicable to these routes.
- Route handlers that consume request/auth state are dynamic and not configured for public shared caching. Customer proposal pages are force-dynamic. Public content retains legitimate framework caching.
- `SUPABASE_SERVICE_ROLE_KEY` is read only from `lib/supabase/admin.ts`, which imports `server-only`. Browser modules receive only `NEXT_PUBLIC_SUPABASE_URL` and the publishable key. No service secret is serialized into client DTOs.

## Migration and implementation

- Migration: `supabase/migrations/202608120013_public_api_boundary_integrity.sql`
- Public enquiry route: `app/api/enquiries/route.ts`
- Public form clients: `features/contact/contact-form.tsx`, `features/journey/quotation-modal.tsx`
- Shared public input controls: `lib/security/public-input.ts`, `lib/security/safe-url.ts`
- Partner application route/form: `app/api/partner-applications/route.ts`, `features/partners/partner-application-form.tsx`
- Proposal public action: `app/api/proposals/[token]/route.ts`
- Estimate/quote boundaries: `app/api/journey-estimate/route.ts`, `app/api/quotes/route.ts`
- Finance receipt boundary: `app/api/admin/accounting/transactions/route.ts`
- Static tests: `tests/public-api-boundary.test.ts`
- Isolated matrix: `tests/phase13-public-api-boundary.mjs`
- Guarded runner: `scripts/run-isolated-phase13-public-api-boundary.sh`

The migration adds nullable, unique submission UUID/hash pairs to enquiries and partner applications, preserving historical rows, and revokes anonymous/authenticated direct enquiry INSERT. It does not alter completed migrations through Phase 12.

## Local validation

- TypeScript (`npx tsc --noEmit`): **PASSED**
- Project validation + Node tests: **191/191 PASSED**
- Focused Phase 13 tests: **8/8 PASSED**
- Focused ESLint: **PASSED**
- Guarded runner shell syntax: **PASSED**
- Isolated matrix JavaScript syntax: **PASSED**
- Git whitespace validation: **PASSED**
- Production build: **BLOCKED only by the established unrelated Google Fonts network fetch for Manrope and Playfair Display**. No Phase 13 compile/type error was reported before that external fetch failure.

## Guarded isolated executable verification

The guarded runner targeted only `xnsxmwgyugoqanuoyebh`, explicitly rejected production, detected and preserved the already-applied Phase 13 migration, passed the focused Phase 2–12 structural regression gates, verified a zero-fixture precondition, and executed the public/API matrix through a temporary isolated Next.js server.

Final matrix result: **44/44 PASSED, 0 FAILED**.

Executable coverage included strict/malformed/mass-assigned enquiry input, payload-bound replay, changed-payload conflict, streamed size denial, anonymous direct-write denial, all six Phase 5 role-purpose and base-row boundaries, partner submission/replay/self-approval denial, URL validation, MIME-signature and partial-write safety, admin RPC denial, capability-specific staff API access, exact-token proposal acceptance, replay safety, invalid token, commercial/ID injection, traveller substitution denial, public/private content boundaries, unsupported mutation method and invalid-credential fail-closed behavior.

The proposal probes proved one authoritative acceptance for the valid sent snapshot, a conflict response with exactly one retained acceptance on replay, and zero acceptances for a mismatched traveller identity. Synthetic records were removed and the runner's post-clean verification passed. Production was not modified.

## Final exit status

- Attack-surface inventory: **COMPLETE**
- Input validation: **IMPLEMENTED AND VERIFIED**
- Mass assignment: **DENIED**
- Object-ID substitution: **DENIED**
- Public enquiry: **VERIFIED**
- Partner application boundary: **VERIFIED**
- Public token boundary: **VERIFIED**
- Public content boundary: **VERIFIED**
- Staff API authorization: **VERIFIED**
- Privileged client safety: **VERIFIED**
- Injection: **SAFE**
- XSS: **SAFE under active rendering contexts**
- URL/redirect safety: **PASS / redirect not applicable**
- SSRF: **NOT APPLICABLE**
- Upload input safety: **VERIFIED**
- Error leakage: **DENIED**
- Secret exposure: **DENIED**
- Business command bypass: **DENIED**
- Fail-closed: **VERIFIED**
- Phase 2–12 focused regressions: **PASSED**
- Migration: **`202608120013_public_api_boundary_integrity.sql`**
- Local validation: **TypeScript passed; 191/191 full tests passed; 22/22 focused proposal/public-boundary tests passed; focused lint and syntax checks passed**
- Guarded isolated matrix: **44/44 PASSED; synthetic cleanup passed**
- Production modified: **NO**
- Other findings remediated: **NONE outside Phase 13 scope**
- Phase 14 ready: **YES — not started**
