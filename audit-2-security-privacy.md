# Roam Ceylon Audit 2/5 — Security, Privacy & Access Control

Date: 2026-08-11  
Scope: read-only repository review, migration/RLS review, safe anonymous Supabase reads, static secret scan, focused security tests, dependency inventory.  
Change control: no application code, database policy, migration, dependency, secret, or production data was modified.

## 1. Executive Security Summary

Roam Ceylon is **not ready for production or UAT with real traveller, supplier, proposal, or financial data**. The capability model introduced in Phase 9.5 is sound in principle, and the newer Journey Studio, allocation, benefits, proposal DTO, and accounting APIs generally use explicit capabilities and Zod validation. However, legacy `admin/editor` RLS policies and two legacy admin APIs bypass that model.

Four P0 release blockers were confirmed:

1. Any staff account whose legacy profile role is `editor` can directly read or change CMS, supplier, supplier-rate, pricing-configuration, partner-application, relationship, and media data irrespective of assigned capabilities. This confirms and expands **ARC-001 from Audit 1**.
2. A Journey Designer can call the proposal API with the hidden `approved` action and mark a sent proposal accepted without a traveller acceptance record.
3. Anonymous Supabase clients can query full published supplier rows. Safe remote tests confirmed exposed email/phone fields for 4/4 published stays, 3/3 vehicles, and 2/2 guides; guide licence data was also readable.
4. Capability-level enquiry UPDATE is not column/command constrained. A Journey Designer, Operations user, or Finance user can directly set lifecycle states such as `proposal_accepted`, `deposit_paid`, `completed`, or `cancelled`, bypassing the guarded APIs and UI workflow.

Positive controls include high-entropy version-specific proposal tokens, revocation and supersession support, explicit customer-safe proposal DTO parsing, server-only service-role use, capability checks on most modern admin APIs, RLS on financial tables, no tracked live secrets, constrained storage bucket MIME lists, and React escaping for ordinary text.

## 2. Security Release Position

**Position: NO-GO.** Do not expose Admin/Journey Studio to multiple staff roles or load real supplier contracts, traveller PII, proposal acceptances, or accounting data until SEC-001 through SEC-004 are remediated and verified with real role-based integration tests.

Public marketing content can only be exposed after SEC-003 is fixed because the Supabase anon key is intentionally visible and currently permits direct supplier contact/licence reads. Secure proposal links should not be issued to real travellers until SEC-002, SEC-007, SEC-008, SEC-009, and SEC-011 are addressed.

## 3. Attack Surface Map

| Surface | Identity/boundary | Sensitive assets | Current posture |
|---|---|---|---|
| Public site/Journey Builder | Anonymous Supabase key and public APIs | Supplier listings, planning assumptions, enquiry submissions | Supplier full-row leak; enquiry abuse controls insufficient |
| Admin pages | Supabase Auth session; mostly client-side route gating | CMS, partner applications, pricing, traveller PII | Direct URLs render client modules; RLS/API must be the real boundary |
| Modern admin APIs | Bearer access token + `authenticatedStaff` | Journey Studio, allocations, benefits, proposals, accounting | Mostly capability checked and allowlisted |
| Legacy admin APIs | Bearer token + legacy `admin/editor` role | Full internal quote, partner conversion | Capability bypass |
| Direct Supabase | Browser-visible project URL/publishable key/JWT | All PostgREST tables and RPCs | Mixed legacy-role and capability RLS |
| Traveller proposal | UUID capability link | Traveller identity, itinerary, selling price, payment schedule | Clean DTO; acceptance bypass and token hardening gaps |
| Storage | Public CMS bucket; private partner/accounting buckets | Marketing media, applicant documents, receipts | Bucket types/limits exist; legacy editor reads/writes too broad |
| Local browser storage | `localStorage`/`sessionStorage` | Journey state; full partner application draft | Partner PII persists on shared devices |

## 4. Authentication Findings

- Admin login uses Supabase `signInWithPassword`; logout calls `signOut` and redirects. Session persistence/refresh is delegated to the Supabase browser client.
- There is no middleware/proxy or server layout enforcing staff authentication on `/admin/**`. Resource pages and several modules call `getSession()` client-side and then query Supabase. This is not itself a data boundary; RLS/API authorization must remain independently correct.
- `AdminShell` hides navigation and renders a restricted message after permissions load, but resource list/editor and partner application modules are not consistently wrapped by it. Direct URL access is possible, confirming that hidden UI cannot be treated as authorization.
- No application password-reset/recovery flow was found. Raw Supabase login errors are displayed to the user. These are P3 UX/hardening issues, not the primary release blocker.
- Server APIs using `authenticatedStaff` verify the bearer token with `auth.getUser`, require profile role `admin|editor`, load role grants server-side, and require explicit capabilities. This is a good pattern.

## 5. RBAC / Capability Findings

Intended role mapping:

| Role | Principal intended access |
|---|---|
| Super Admin | All capabilities |
| Journey Designer | Enquiries, curation, proposal preparation, limited supplier view, benefits assignment |
| Partner Manager | Supplier management/rates/allocation, benefits/reference comparisons |
| Operations | Journey delivery and operational confirmations |
| Finance | Revenue, costs, margin, payments, accounting |
| Content / Marketing | CMS view/edit only |

Actual enforcement diverges:

- All historical `profiles.role='editor'` users were assigned Journey Designer **and** Content/Marketing roles during migration. More importantly, legacy policies still test only `private.has_role(['admin','editor'])`.
- Those legacy checks allow any editor—regardless of assigned capability—to query or mutate supplier catalogue rows, confidential `pricing_plans`, DMC business pricing, public-estimate bands, partner applications/history/documents, relationship mappings, and travel-content storage.
- `app/api/admin/quotes/route.ts` and `app/api/admin/partner-applications/[id]/convert/route.ts` also check only the legacy profile role. A Content/Marketing user can call them directly.
- No practical self-assignment of `users.manage` was found: role/capability metadata uses `private.has_permission('users.manage')`, and ordinary users can only read their own role assignments. The critical escalation is horizontal capability bypass through legacy role policies, not self-promotion to Super Admin.

## 6. Complete RLS Assessment

| Classification | Tables/resources | Assessment |
|---|---|---|
| Public read | Published `themes`, `destinations`, `experiences`, `accommodations`, `vehicles`, `guides`; published relationship rows; `website_settings`; published `homepage_content`; `travel-content` | Row visibility works, but full-row supplier reads expose non-public columns (SEC-003). Website setup state is also public (SEC-013). |
| Public write | `enquiries` INSERT with `status='new'` and `internal_notes is null` | No read/update/delete, but arbitrary large/extra allowed columns and no durable rate limit (SEC-006). |
| Legacy role read/write | CMS/supplier tables and links; `pricing_plans`; `tour_pricing_config`; `tour_supplier_costs`; `journey_pricing_settings`; estimate bands; partner applications/files/history/settings; travel-content storage | Over-permissive for every editor; not capability aligned (SEC-001). |
| Capability restricted | `curated_journeys`, changes, enquiries read/update, supplier allocations, proposals read, benefits, accounts, settlements, transactions, attachments, cancellation/recovery history | Newer policies are materially better; enquiry UPDATE remains command/column over-broad (SEC-004). |
| Service-role writes | Proposal generation/transitions, proposal acceptance/change request, accounting commands, public partner application persistence | Appropriate pattern, but individual command authorization/atomicity defects remain. |

RLS is enabled on the reviewed business-sensitive tables. The principal defect is policy meaning, not missing `ENABLE ROW LEVEL SECURITY`.

## 7. Direct Supabase Access Assessment

The Supabase project URL and publishable key are safe public configuration and necessarily discoverable. Therefore direct PostgREST/storage calls are expected and RLS must be sufficient.

Safe remote anonymous tests (read-only; values not printed) established:

- Published accommodations: 4 rows readable; all 4 contained email and phone.
- Published vehicles: 3 rows readable; all 3 contained email and phone.
- Published guides: 2 rows readable; both contained email and phone; licence data is queryable.
- `pricing_plans`, `enquiries`, `partner_applications`, and confidential estimate bands returned zero rows to anon, consistent with RLS filtering.
- `website_settings.setup_checklist` and `setup_dismissed` were readable anonymously.

A real low-privilege staff credential was not available, so direct authenticated requests were not executed. Static policy evaluation is conclusive for SEC-001 because all affected policies explicitly accept any `profiles.role='editor'` JWT.

## 8. Secure Proposal Security Assessment

Strengths:

- Tokens use UUID v4 generation, are unique, version-specific, rotated on send, and can be revoked.
- Sent snapshots are guarded against mutation; superseded/out-of-date/revoked versions cannot be accepted through the traveller service.
- Acceptance verifies the email against the proposal snapshot and requires explicit terms acknowledgement.
- The public page parses `sent_snapshot ?? customer_snapshot` through an explicit Zod customer DTO. Supplier cost, margin, commission, supplier contact, procurement notes, internal notes, and accounting records are absent.

Weaknesses:

- SEC-002 permits staff-side acceptance forgery through the admin transition API.
- Tokens are stored in plaintext and transported in URLs. `validUntil` is optional, so a sent capability link may remain usable indefinitely unless manually revoked.
- Proposal acceptance/change processing performs multiple service-role writes without a transaction: acceptance row, proposal status, and enquiry status can diverge after a partial failure. This confirms the workflow-integrity concern from Audit 1 (SEC-011).
- Proposal/public database failures may return raw Supabase error text to the traveller route (SEC-012).

## 9. Commercial / Supplier Cost Leakage Assessment

- Public quote endpoints return `quote.public`, and the Journey Estimate service returns an explicit public estimate object. No supplier cost/margin fields were found in those normal public responses.
- The traveller proposal DTO exposes customer selling totals, customer-facing breakdown, payment schedule, and verified public/reference benefit values only. It excludes internal evidence/source notes and supplier/commercial fields.
- `pricing_plans` is correctly blocked for anon but is readable/writable by every legacy editor. The table is explicitly described as confidential supplier input and its `price` becomes `supplierCost` during allocation/pricing.
- `tour_pricing_config` and estimate bands use the same broad editor check. A Content/Marketing or Journey Designer account can change operational costs, fees, contingency, and target margin directly, altering public estimates and proposals.
- The legacy admin quote API returns the complete `AdminPackageQuote` to any editor. This includes internal calculations that the public API intentionally redacts.

## 10. Accounting Security Assessment

- Accounting POST routes for transactions, settlements, reversals, cancellations, close, and account posting require `finance.payments.manage`, validate bodies with Zod, and verify referenced accounts/settlements before writing.
- Direct table reads use finance capabilities; authenticated table writes were revoked and are routed through service-role commands. This is a strong boundary.
- Supplier allocation reads redact supplier cost/contact/payment fields according to capabilities in the API.
- SEC-004 still allows non-Finance journey/operations users to alter enquiry lifecycle state directly. Existing database triggers then synchronize accounting lifecycle state, making broad enquiry UPDATE a financial workflow boundary.
- Accounting/proposal/allocation multi-write operations are not database transactions. Partial failure can create inconsistent financial or acceptance state (SEC-011; also identified in Audit 1).
- No DELETE path for financial records was found; reversals and waivers are append/update workflows, which is appropriate.

## 11. Input / XSS / Injection Assessment

- Modern APIs generally use explicit Zod object schemas and explicit insert/update objects, limiting mass assignment.
- Public journey/contact forms validate only in the client and insert directly into `enquiries`. A direct anon caller bypasses client limits; database checks do not bound names, notes, or JSON sizes (SEC-006).
- Partner applications validate top-level fields, file counts/types/sizes, and use random storage paths. `applicationData` is an unbounded `record<string, unknown>` and can contain arbitrary/deep JSON. The in-memory IP limiter is per-process and non-durable (SEC-006).
- No untrusted raw SQL construction or query interpolation vulnerability was found. Supabase query methods parameterize values. The public relationship RPC accepts only fixed resource types and performs an authorization check, although that check is the legacy broad editor role.
- React renders traveller/admin text as escaped text. No untrusted HTML/Markdown renderer was found. The only `dangerouslySetInnerHTML` is JSON-LD with `<` escaped.
- CMS-controlled image/background URLs and website/social URLs lack a consistent HTTPS protocol allowlist. This is defense-in-depth; no confirmed executable stored-XSS path was reproduced.
- CSRF risk is reduced because sensitive admin APIs require a bearer header set by JavaScript, not ambient application cookies, and JSON cross-origin calls require CORS preflight. No credentialed wildcard CORS was found. Clickjacking remains relevant because frame protection is absent.

## 12. Storage / Upload Assessment

- `travel-content` is intentionally public and limits files to JPEG/PNG/WebP/AVIF, 10 MB. SVG/HTML are not allowed. Randomized names and `upsert:false` reduce overwrite risk.
- Partner media/doc buckets are private and limit file type/size. Public submission uses a service-role API, random UUID paths, count limits, and cleanup on failure.
- Accounting receipts are private and finance-capability readable.
- Legacy editor policies let every editor insert/update/delete any `travel-content` object and read every partner application media/document object (SEC-001). There is no path ownership or module capability boundary.
- MIME validation trusts the browser-supplied content type; there is no magic-byte verification, malware scanning, or image re-encoding. Private PDFs/images and receipts therefore require operational malware controls before production (SEC-010).

## 13. Secrets / Environment Assessment

- Tracked-file scan found no live Supabase secret key, GitHub token, database password URL, private key, AWS key, or hardcoded password. Documentation/example values are placeholders.
- `.env.local` is ignored. Only variable names were inspected: public URL, public publishable key, and server-only service-role key.
- `SUPABASE_SERVICE_ROLE_KEY` is not prefixed `NEXT_PUBLIC_`; `lib/supabase/admin.ts` imports `server-only`, disables persistence/refresh, and no client component imports it.
- `.env.example` is tracked appropriately. The publishable key and project URL are safe public configuration; the service-role key must remain server-only and must never be copied into browser code, logs, or deployment previews.

## 14. Dependency Findings

- Installed production versions include Next.js 16.2.12, React/React DOM 19.2.8, Supabase JS 2.110.8, Zod 4.4.3, and pdf-lib 1.17.1.
- `npm audit --omit=dev --json` could not reach the npm advisory endpoint (`ENOTFOUND`), so a complete transitive vulnerability result is **not available** and remains a required release test.
- Primary GitHub advisories reviewed during the audit show the recent high-severity Next.js SSRF issue fixed in 16.2.11 and several May 2026 issues fixed in 16.2.5; installed 16.2.12 is outside those affected ranges. This does not replace a successful lockfile audit.
- `npm ls` reported five extraneous WASM/runtime packages in local `node_modules`; reconcile with a clean lockfile install before final dependency attestation.

## 15. Headers / CORS / Cache Findings

- `next.config.ts` configures image hosts only. No CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options`, or CSP `frame-ancestors` is configured (SEC-009).
- No custom wildcard CORS headers were found. Same-origin defaults are appropriate for application APIs; Supabase direct access remains governed by RLS.
- The proposal page is `force-dynamic`, and authenticated GET APIs depend on request headers, reducing accidental static caching. However, no explicit `Cache-Control: private, no-store` is set for proposal/admin/financial responses.
- Proposal tokens exist in URL/history and the page loads external image/QR resources. External links use `rel="noreferrer"`, and the QR contains only the WhatsApp URL, not the proposal token. Explicit no-referrer/no-store policies are still required for defense in depth (SEC-007).
- Live header verification could not be completed because the existing local dev listener was not reachable from the audit command sandbox; deployment-edge headers must be tested separately.

## 16. Privacy / PII Assessment

Traveller data stored across enquiries and snapshots includes name, email, phone, nationality/country, travel dates, traveller counts, preferences, selected services, notes/special requirements, estimated range, proposal acceptance identity, and change requests. Proposal and accounting snapshots duplicate portions for business history.

- Roles with `journey.requests.view`—Journey Designer, Partner Manager, Operations, and Finance—receive full enquiry rows through direct Supabase/UI queries. Row-level RLS does not minimize columns by operational need. Partner and Finance users therefore see traveller phone, notes, and preferences even when a redacted task-specific view would suffice (SEC-008).
- No retention, archival deletion, anonymization, or data-subject deletion mechanism was found. Foreign keys and snapshots intentionally preserve records indefinitely. Retention duration and lawful business-history requirements require a future policy decision.
- Public proposal links expose the intended traveller identity, itinerary, dates, requirements, prices, and payment schedule to anyone possessing the bearer URL. This is expected capability-link behavior but increases the importance of expiry, revocation, no-store, and careful distribution.
- Partner application drafts persist name, email, phone, address, licence, price/rate, and business details in `localStorage` until successful submission. On a shared device this remains available to later browser users (SEC-010).
- Children and infants are represented only by counts in the normal model; names, birth dates, and IDs are not required. This is good minimization. Free-text notes can still contain sensitive minor information, so collection guidance and retention rules are needed.

## 17. Third-Party Data Exposure

Identifiable integrations from code:

- Supabase receives authentication, CMS/supplier data, traveller enquiries, proposals, accounting records, and stored files.
- MET Norway receives destination coordinates and the Roam Ceylon service User-Agent; no traveller PII is sent.
- A temporary YouTube no-cookie hero iframe receives ordinary network/browser metadata and the site origin when loaded.
- `api.qrserver.com` receives the public Roam Ceylon WhatsApp URL to generate QR codes; it is used both in the proposal page and client PDF generation. It does not receive the proposal token in its query payload.
- External image origins may receive browser/server image requests. The proposal uses raw/CSS images in places rather than exclusively the Next image proxy.
- WhatsApp/Facebook receive data only after link activation; relevant links generally use `noreferrer` when opening a new tab.
- No analytics, error-monitoring, payment-gateway, or outbound email provider integration was found in the reviewed code.

## 18. Findings Table

| ID | Severity | Area | Evidence / attack scenario | Impact | Recommended remediation | Blocker |
|---|---|---|---|---|---|---|
| SEC-001 | P0 | RBAC/RLS | `202607260001_content_marketplace.sql:293-340`, `202607270004_resource_pricing_plans.sql:43-57`, `202607280001_partner_marketplace_applications.sql:89-121`; any legacy editor directly queries/writes protected tables/storage. Confirms and expands Audit 1 ARC-001. | Broad staff authorization bypass; supplier-cost leakage; pricing/media/partner-data manipulation. | Replace every legacy role policy with capability-specific policies; split public/supplier DTOs; revoke broad table/storage grants; test every role directly against Supabase. | YES |
| SEC-002 | P0 | Proposal acceptance | `app/api/admin/journey-proposals/route.ts:17,46-58` accepts `action='approved'` under `journey.proposal.create`; `journey-proposal-service.ts:108-128` marks proposal/enquiry accepted without inserting `journey_proposal_acceptances`. | A Journey Designer can forge traveller acceptance and advance booking/accounting workflow. | Remove public admin `approved` transition; require traveller acceptance command, or a separately privileged, audited override with reason and immutable acceptance provenance. | YES |
| SEC-003 | P0 | Public supplier privacy | Full-row public RLS at `content_marketplace.sql:293-298`; supplier tables include email/phone/licence. Safe remote anon read confirmed 4 stays, 3 vehicles, 2 guides with contact data. | Unauthorized supplier contact and licence disclosure; scraping at catalogue scale. | Remove sensitive columns from public exposure using public views/RPC DTOs or column grants; keep supplier tables staff-only; regression-test anon column access. | YES |
| SEC-004 | P0 | Lifecycle/financial integrity | `202608100003_journey_studio_and_rbac.sql:205-209` grants full-row enquiry UPDATE to design/operations/finance. Only brief fields are trigger-protected; `status` remains directly mutable and accounting triggers consume it. | Direct acceptance/deposit/completion/cancellation state manipulation outside guarded commands and audit rules. | Revoke direct UPDATE; expose narrow command RPC/API transitions with state machine, capability, preconditions, actor, reason, and transaction. | YES |
| SEC-005 | P1 | Legacy admin APIs | `app/api/admin/quotes/route.ts:18-29` returns full admin quote to any editor; partner convert route lines 7-28 converts approved applicants with the same broad check. | Capability bypass, internal commercial disclosure, unauthorized supplier creation/conversion. | Use `authenticatedStaff` with exact rate/partner capabilities and response redaction. | YES |
| SEC-006 | P1 | Public input/abuse | Journey/contact forms insert directly into `enquiries`; DB policy checks status/internal notes only. Partner `applicationData` is unbounded and limiter is an in-process Map. | Spam, oversized JSON/database growth, workflow contamination, serverless rate-limit bypass. | Route all public submissions through server validation; set byte/depth/field limits; durable IP/device/risk rate limiting; CAPTCHA/queue controls where justified. | YES |
| SEC-007 | P1 | Proposal token | Plaintext UUID token in URL/DB; validity date optional; no explicit no-store/referrer header policy. | Leaked URL may provide long-lived access to traveller PII, itinerary and prices. | Store token digest, require expiry, rotate/revoke, set `no-store`, strict referrer policy, redact URLs from logs, and provide link lifecycle audit. | YES |
| SEC-008 | P1 | Traveller privacy | `journey.requests.view` is assigned to partner/operations/finance and RLS returns full enquiry rows; inbox/review use `select('*')`. | Excess internal access to phone, notes, preferences, dates and requirements. | Provide purpose-specific server DTOs/views and field-level redaction by role; record access; define retention. | YES |
| SEC-009 | P1 | Browser security | `next.config.ts` has no security headers/frame controls. Admin is session-bearing and proposal pages hold PII. | Clickjacking and reduced containment for future XSS/token leaks; no explicit transport/content/referrer policy. | Add tested CSP, frame-ancestors, HSTS in production, nosniff, strict referrer and permissions policies. | YES |
| SEC-010 | P2 | Upload/local privacy | Upload MIME is client-declared; no signature scan/re-encode. Partner draft PII is written to `localStorage` (`partner-application-form.tsx:32-33`). | Malicious documents reach staff; sensitive partner data persists on shared devices. | Validate magic bytes, scan private docs, re-encode images, expire/encrypt or avoid persistent PII drafts, offer clear-draft control. | NO |
| SEC-011 | P1 | Transaction integrity | Traveller acceptance and proposal/accounting workflows perform sequential service-role writes without one DB transaction. Confirms Audit 1 workflow atomicity finding. | Partial failures create acceptance, proposal, enquiry, or financial states that disagree. | Implement transactional SECURITY DEFINER commands with idempotency keys and immutable event/audit records. | YES |
| SEC-012 | P2 | Error/rate leakage | Traveller proposal service wraps raw Supabase errors and public route returns `error.message`; proposal actions have no durable rate limit. | Schema/constraint details may leak; endpoint can be abused for resource consumption after token disclosure. | Map public errors to stable codes; log redacted details server-side; add durable per-token/IP rate limits. | NO |
| SEC-013 | P2 | Public configuration | `website_settings_public_read` exposes every column; anon test confirmed setup checklist/dismissal state. | Internal launch/setup state is unnecessarily disclosed. | Serve an explicit public settings DTO/view; keep operational setup fields staff-only. | NO |
| SEC-014 | P2 | Tests/assurance | Security tests are source-regex/unit checks; they pass but do not execute role×table×operation RLS or forbidden API calls. | Regressions such as SEC-001/002 can pass CI. | Add disposable-project integration tests for anon and each staff role, API negative tests, token replay/expiry, and storage policies. | NO |
| SEC-015 | P3 | Auth/RPC hygiene | Raw Supabase login errors; no reset UX; `private.has_role` execute was granted to anon although it returns false without `auth.uid()`. | Minor information/maintenance hygiene. | Normalize login messages, add recovery flow, revoke unnecessary anon execute grant. | NO |

### P0/P1 evidence details

**SEC-001 — attack/precondition:** attacker has any legitimate staff account whose legacy profile role is `editor`, including Content/Marketing. They use the public project URL/key and their JWT directly against PostgREST/storage. **Unauthorized action:** read/write confidential supplier rates and DMC configuration; read partner PII/documents; edit supplier/CMS/media regardless of capabilities. **Business impact:** supplier-cost disclosure, quote manipulation, content defacement, partner privacy breach. **Remediation:** complete capability migration at database/API/storage layers and revoke legacy-role access.

**SEC-002 — attack/precondition:** Journey Designer has `journey.proposal.create` and knows a sent/viewed proposal UUID. **Unauthorized action:** POST `{action:"approved", proposalId}` to the admin proposal route. **Business impact:** forged traveller acceptance and false lifecycle progression without terms evidence. **Remediation:** traveller-only transactional acceptance; separately permissioned and audited exceptional override if business-required.

**SEC-003 — attack/precondition:** none; anonymous caller uses the public key. **Unauthorized action:** select contact/licence columns from published supplier rows. **Business impact:** direct scraping/contact bypass, privacy and relationship damage. **Remediation:** public allowlisted DTO/view; staff-only base tables.

**SEC-004 — attack/precondition:** Journey Designer, Operations, or Finance JWT with one of the broad update capabilities. **Unauthorized action:** direct PostgREST UPDATE of `enquiries.status`. **Business impact:** bypassed state machine, misleading acceptance/deposit/completion/cancellation state, downstream accounting synchronization. **Remediation:** command-based, transactional state transitions; no general table UPDATE.

**SEC-005 — attack/precondition:** any editor JWT. **Unauthorized action:** call full admin quote or convert approved partner application. **Business impact:** internal commercial disclosure and unauthorized supplier-database changes. **Remediation:** exact capability checks and redacted DTOs.

**SEC-006 — attack/precondition:** anonymous caller. **Unauthorized action:** bypass client validation and repeatedly insert large/hostile enquiry JSON or submit arbitrary partner `applicationData`. **Business impact:** spam, operational disruption, storage/database cost. **Remediation:** server-only validated submissions with durable abuse controls.

**SEC-007 — attack/precondition:** obtain a link from history, forwarded email/chat, logs, or a staff/database read. **Unauthorized action:** reuse an unexpired/non-revoked bearer URL. **Business impact:** traveller PII/itinerary/price disclosure. **Remediation:** mandatory expiry, digest storage, no-store/referrer/log controls, lifecycle monitoring.

**SEC-008 — attack/precondition:** legitimate Partner Manager, Operations, or Finance account. **Unauthorized action:** direct full-row enquiry SELECT. **Business impact:** unnecessary internal PII access. **Remediation:** least-privilege field DTOs/views and access logging.

**SEC-009 — attack/precondition:** victim visits attacker-controlled page while staff session is active, or a future injection occurs. **Unauthorized action:** frame UI or exploit absent browser containment. **Business impact:** unauthorized UI actions or amplified data/token exposure. **Remediation:** frame/CSP and standard security headers verified at deployment edge.

**SEC-011 — attack/precondition:** ordinary transient DB/network failure during a multi-write command. **Unauthorized outcome:** partial acceptance/accounting state. **Business impact:** disputed acceptance or incorrect financial workflow. **Remediation:** one transactional idempotent database command per business event.

## 19. Recommended Remediation Order

### P0

1. Create a complete policy/grant inventory from the live database; replace all legacy `admin/editor` checks with capabilities; include storage and the two legacy admin APIs (SEC-001/005).
2. Stop public full-row supplier reads; expose only deliberate public fields through views/DTOs (SEC-003).
3. Remove the staff `approved` proposal action and rebuild acceptance as one transactional traveller command (SEC-002/011).
4. Revoke direct enquiry UPDATE and introduce audited lifecycle commands with transition preconditions (SEC-004).

### P1

5. Put public enquiries/partner submissions behind bounded server schemas and durable abuse protection (SEC-006).
6. Minimize traveller fields by role and establish retention/access policy (SEC-008).
7. Enforce mandatory proposal expiry, token digest/no-store/log controls (SEC-007).
8. Add browser security headers and frame protection (SEC-009).
9. Make financial/allocation/proposal workflows transactional and idempotent (SEC-011).

### P2

10. Add file signature/malware controls; remove persistent partner PII drafts; sanitize public settings DTO and public errors (SEC-010/012/013).
11. Add real RLS/API/storage integration tests (SEC-014).

### P3

12. Normalize auth errors, add account recovery UX, and remove unnecessary anon RPC execution (SEC-015).

### Future

- Add immutable security/audit events for staff reads of traveller PII, proposal link creation/revocation, rate changes, role grants, and financial commands.
- Introduce secret-scanning and dependency/DAST checks in CI; define incident response, retention, backup access, and staff offboarding procedures.
- Consider step-up authentication/MFA for Finance, Super Admin, staff-role management, and exceptional acceptance/financial overrides.

## 20. Security Tests Still Required

Before real-data UAT:

1. Disposable Supabase integration matrix: anon, Content, Journey Designer, Partner Manager, Operations, Finance, Super Admin × every sensitive table × SELECT/INSERT/UPDATE/DELETE.
2. Storage matrix for list/read/upload/update/delete across all four buckets and paths.
3. API negative tests using real JWTs for every admin route, including hidden actions and modified IDs/payloads.
4. Proposal tests for expiry, revocation, supersession, replay, concurrent acceptance, email mismatch, forged admin approval, change requests, caching, referrers, and logs.
5. Transaction-failure injection for acceptance, proposal generation/supersession, allocations, payments, reversals, refunds, cancellation, and close.
6. Public submission load/abuse tests with bounded safe fixtures; durable limiter verification across multiple instances.
7. Upload magic-byte, polyglot, malformed image/PDF, filename/path, and malware-scanner tests.
8. Deployment header/CORS/cache verification over HTTPS, including CDN behavior for proposal/admin/API responses.
9. Successful `npm audit`/OSV or equivalent scan against the exact production lockfile and container/runtime; review Dependabot results.
10. Authorized secret scan of Git history and deployment environment; this audit scanned tracked current files only.
11. Privacy review of role-purpose field access, retention/deletion, backups, local storage, minors’ free-text data, and third-party processors.
12. Re-run typecheck, complete tests, production build, and security integration suite after remediation.

Focused tests executed during this audit: 19/19 proposal/RBAC/benefit source tests passed. These tests verify intended code patterns and DTO exclusions but do not exercise live low-privilege denial paths. Safe anon Supabase reads and tracked-file secret scans completed without modifying data.

**AUDIT 2 COMPLETE – NO APPLICATION CODE OR DATABASE SECURITY POLICIES MODIFIED**
