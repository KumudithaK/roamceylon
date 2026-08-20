# Stabilization Phase 4 Checkpoint

Date: 2026-08-12  
Scope: database RLS, grants, RPC and Storage capability enforcement  
Production project: `fstpfqlgypvktjwdeagu` — **not modified**  
Isolated validation project: `xnsxmwgyugoqanuoyebh`

## Status

Phase 4 is **COMPLETE**. The guarded isolated continuation finished with `PHASE 4 CAPABILITY RLS AND STORAGE VERIFIED: isolated project only.` Database/RPC/self-escalation enforcement, normal Storage authorization, corrected Storage path safety, and the Phase 2 and Phase 3 regression gates all passed. Together with the Phase 3 application/API capability evidence, this proves the complete application and database enforcement boundary required to mark ARC-001 and SEC-001 **REMEDIATED**. SEC-008 remains deferred. Production was not modified, no additional findings were remediated, and Phase 5 has not started.

## Authorization inventory before cutover

The restored Phase 1 schema, migrations, active repositories, server routes and Phase 1–3 authorization harnesses were reviewed. The pre-cutover mechanisms classify as follows:

| Classification | Existing mechanisms |
|---|---|
| A — already capability-based | Phase 3 `private.has_permission`; staff role/capability tables; curated journey policies; benefit policies; selected supplier-allocation, pricing, finance and settings policies; Phase 3 application/API authorization |
| B — legacy admin/editor | Most historical CMS, supplier master, relationship, enquiry, allocation, proposal, partner, finance and Storage policies used `private.has_role(['admin','editor'])`; `sync_content_relationships` used the legacy helper |
| C — public by design | Published themes, destinations, experiences and homepage content; published relationship rows; Phase 2 supplier/settings projections; append-only traveller enquiry submission; public `travel-content` reads |
| D — service-role only | Server-side partner applications/uploads, traveller proposal access/actions, proposal/accounting orchestration and trigger-maintained snapshots/calculations |
| E — deferred/human-review boundary | Purpose-specific Finance/Operations traveller PII (SEC-008); proposal/enquiry state-transition command separation (SEC-004); these are explicitly outside Phase 4 |

The only exposed application RPCs are `current_staff_permissions()` and `sync_content_relationships(...)`. Private accounting/lifecycle functions are trigger or server-internal functions rather than public RPC APIs. `private.has_role` remains for compatibility but is no longer referenced by any replacement protected-table or Storage policy.

## Migration

Migration: `supabase/migrations/202608120003_capability_rls_storage_cutover.sql`  
Current local SHA-256: `ec1f0d16bd957bd7bf3d81e806dc166095f74878bef96e296b55b62620e07e59`

The migration is atomic and performs the following cutover:

- hardens `private.has_permission(text)` with explicit authenticated identity, exact assigned capabilities, an intentional legacy-admin compatibility bypass, safe empty `search_path`, and no anonymous execution;
- removes all existing policies on the 46 application tables and recreates the protected business boundary in the same transaction;
- removes dump-era `anon`/`authenticated` table grants before restoring only required SDK commands;
- revokes anonymous access to protected supplier, website, staff, journey and finance base tables;
- preserves Phase 2 safe supplier/settings projections and published content access;
- separates SELECT, INSERT, UPDATE and DELETE checks by canonical capability;
- protects staff authorization tables with `users.manage` and retains only own-role/own-profile read visibility for ordinary staff;
- changes `sync_content_relationships` to a narrowly authorized `SECURITY DEFINER` RPC, requiring `cms.edit` for content and `suppliers.manage` for supplier relationships;
- reserves force-close fields/status for `finance.accounts.override` and prevents Operations from re-parenting supplier allocations or changing supplier/commercial identity without `suppliers.allocate`;
- removes anonymous sequence access and broad future default privileges for application tables, sequences and functions;
- preserves service-role behavior and does not expose any service credential to client code.

## Capability RLS model

| Resource family | Read | Create/update/delete |
|---|---|---|
| CMS and editorial content | public published rows or `cms.view` | `cms.edit` |
| Supplier master records | `suppliers.view` | `suppliers.manage` |
| Supplier rates/costs | `suppliers.rates.view`, relevant finance read, or CMS ticket context | `suppliers.manage` or `cms.edit` for experience tickets |
| Traveller enquiries | `journey.requests.view` | public append-only new enquiry; staff updates retain current Phase 3 workflow capability scope |
| Curated journeys/history | `journey.design.view` | `journey.design.edit` |
| Supplier allocations | allocation/proposal/operations/finance context | `suppliers.allocate`; Operations only delivery fields |
| Proposals | `journey.proposal.view` | create/send/manage capabilities; deeper state machine remains deferred |
| Benefits | `benefits.view` | manage/assign/operations capabilities by command |
| Finance | revenue/cost/payment context | payments, settlement reversal and account override capabilities by command/high-risk field |
| Settings | `settings.manage` | `settings.manage` |
| Staff access | own assignment/profile or `users.manage` | `users.manage` only |

No protected replacement policy contains `private.has_role(...)` or grants authority from `profiles.role='editor'`.

## Storage cutover

| Bucket | Read | Write/update/delete |
|---|---|---|
| `travel-content` | Public | `cms.edit` |
| `partner-application-media` | `suppliers.view` | `suppliers.manage` |
| `partner-application-documents` | `suppliers.view` | `suppliers.manage` |
| `accounting-receipts` | `finance.payments.manage` | `finance.payments.manage` |

All write policies reject object names containing a `..` path segment. Anonymous applicant uploads continue through the existing server-side service-role path; no public partner bucket read/write was introduced.

## Executable verification prepared

`scripts/run-isolated-phase4-capability-rls.sh`:

- loads secrets only from `.env.authz.local`;
- accepts only `xnsxmwgyugoqanuoyebh` and explicitly rejects `fstpfqlgypvktjwdeagu` in ref, API URL and database URL;
- requires all six disposable `@roamceylon.test` identities;
- applies only the Phase 4 migration;
- verifies policy/grant/RPC/Storage structure through PostgreSQL with `ON_ERROR_STOP`;
- runs direct Supabase read/create/update/delete, foreign-key, RPC and self-escalation probes;
- runs the four-bucket Storage matrix with synthetic objects and unsafe-path probes;
- reruns the Phase 3 exact API capability matrix;
- reruns the Phase 2 public-boundary matrix;
- stores evidence outside Git under `/tmp/roam-stabilization-phase4`.

`tests/phase4-direct-authorization.mjs` covers:

- Journey Designer: journey/proposal/supplier reads and journey editing allowed; CMS, supplier writes, finance and staff escalation denied;
- Partner Manager: supplier/rate/allocation authority allowed; CMS, finance, journey edit and staff escalation denied;
- Finance: accounting read/payment/reversal authority allowed; force-close override, CMS, supplier master, journey edit and staff escalation denied;
- Operations: allocation delivery updates allowed; allocation re-parenting/commercial changes, finance, CMS, supplier master and journey edit denied;
- Content Marketing: CMS CRUD and CMS relationship RPC allowed; supplier/traveller/finance/journey/staff access denied;
- Super Admin: intended business and staff-management access allowed;
- direct role/capability/profile self-escalation attempts denied for Journey Designer, Partner Manager and Finance;
- disposable records are removed with the service role in a `finally` cleanup path.

## Local evidence

| Check | Result |
|---|---|
| `npm test` | PASS — 142/142 |
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS; established schema-cache notices appeared because Phase 2 projections remain intentionally unapplied to production |
| `npm run lint` | BASELINE FAIL — the same 7 unrelated React effect errors and 3 existing warnings; no Phase 4 file reported |
| `node --check` on Phase 4/direct, Storage and API harnesses | PASS |
| `bash -n scripts/run-isolated-phase4-capability-rls.sh` | PASS |
| `git diff --check` | PASS |

## Deferred scope

- SEC-004 workflow/state-machine enforcement: not remediated.
- SEC-008 purpose-specific traveller PII DTOs/views: deferred and not claimed closed.
- Accounting calculations, proposal acceptance, date/night logic, supplier allocation transactions, performance and UX: unchanged.
- Production migration/application: not performed.
- Phase 5: not started.

## Storage path-safety root cause and canonical model

Classification: **B + C — Supabase Storage/URL object-key normalization combined with an invalid probe assumption; no demonstrated authorization weakness.**

Runtime evidence from the installed `@supabase/storage-js` implementation:

- `_removeEmptyFolders()` only removes leading/trailing or repeated `/` separators;
- upload constructs an HTTP object URL from the bucket and supplied path;
- URL routing normalizes `..` before the Storage service persists the object and before RLS evaluates `storage.objects`;
- the SDK returns `path: cleanPath` (the caller input) separately from `fullPath: data.Key` (the canonical server-persisted key).

The failed probe read `data.path`, so it necessarily rediscovered its own `..` input and incorrectly labelled all four operations unsafe. The corrected probe reads `data.fullPath`, requires the resulting key to remain within the requested bucket and contain no `..` segment, removes that exact persisted key, and separately attempts a cross-bucket normalized path. The latter must be denied by the destination bucket's capability policy.

Repository upload paths are deterministic and contain no user-controlled folder traversal:

- `travel-content`: `<resource-type>/<resource-uuid>/<random-uuid>-<sanitized-name>`;
- partner media/documents: `partner-applications/<partner-type>/<application-uuid>/<random-uuid>-<sanitized-name>` through the server-side service role;
- accounting receipts: `journey-accounts/<account-uuid>/<settlement-uuid>/<transaction-uuid>/<random-uuid>-<sanitized-name>` through the server-side service role.

Filename sanitizers remove path separators; every stored filename is additionally prefixed by a generated UUID. Staff access is intentionally domain-wide rather than per-object ownership: Content Marketing manages the content bucket, Partner Manager manages partner evidence, and Finance manages accounting receipts. Thus bucket + exact capability is the canonical authorization scope. The existing `name !~ '(^|/)\.\.(/|$)'` checks remain defensive but are not treated as a substitute for Storage routing normalization. No policy or database change was made merely to satisfy the former probe.

The continuation preserved the 62/62 direct database evidence and the 56/56 normal Storage capability evidence, then completed eight corrected path probes (bucket containment plus cross-bucket denial for four buckets), the Phase 3 API regression, the Phase 2 public-boundary regression, and final structural closure verification.

## Final isolated executable evidence

Final guarded runner result: **`PHASE 4 CAPABILITY RLS AND STORAGE VERIFIED: isolated project only.`**

| Gate | Final result |
|---|---|
| Database / RPC / self-escalation | PASS — 62/62 |
| Normal Storage authorization | PASS — 56/56 |
| Corrected Storage path safety | PASS — 8/8 |
| Synthetic Storage cleanup | PASS |
| Journey Designer capability boundary | PASS |
| Partner Manager capability boundary | PASS |
| Finance capability boundary | PASS |
| Operations capability boundary | PASS |
| Content Marketing capability boundary | PASS |
| Super Admin capability boundary | PASS |
| Phase 3 role/capability and protected API regression | PASS |
| Phase 2 public-data boundary regression | PASS |
| TypeScript | PASS |
| Automated tests | PASS — 142/142 |
| Production build | PASS |

The corrected path-safety matrix proved legitimate capability-authorized paths safe and cross-bucket writes denied for `travel-content`, `partner-application-media`, `partner-application-documents`, and `accounting-receipts`. The earlier path assertions were an invalid probe assumption combined with legitimate Supabase key normalization, not an authorization vulnerability.

## Closure

- Database RLS, grants, RPC authorization and Storage policies are implemented and executably verified.
- Legacy editor database authority has been removed within Phase 4 scope.
- Direct and indirect staff self-escalation attempts are denied.
- ARC-001: **REMEDIATED** by the combined Phase 3 application/API and Phase 4 database/Storage evidence.
- SEC-001: **REMEDIATED** by the combined Phase 3 application/API and Phase 4 database/Storage evidence.
- SEC-005 remains remediated; Phase 3 regression passed.
- SEC-003 and SEC-013 remain remediated; Phase 2 regression passed.
- SEC-008 remains **DEFERRED** and is not claimed remediated.
- Production project `fstpfqlgypvktjwdeagu` was **not modified**.
- Other findings were not remediated.
- Phase 4 exit criteria are satisfied. Phase 5 is ready for a separate, explicitly authorized start and has not been started.
