# Coordinated staging release and one Human UAT

Prepared 28 October 2026. **RELEASE-READY for controlled staging approval: the separately human-approved local Zod security patch is complete and all local checks pass. Nothing here authorizes staging execution. Commercial Launch remains NOT AUTHORIZED.**

Final approval sequence and fresh read-only evidence: [final execution manifest](launch-final-execution-manifest.md). Its explicit proposed28-row/15-table budget supersedes the previous proposed27/14 count; no source candidate hash changes.

## 1. Exact source boundary and current status

- Isolated worktree: `roamceylon-launch-completion`, detached at verified staging commit `85374f782b789a069d6a581302cb6791f104d1da`. No new commit, branch push, migration, deployment, alias change, Auth identity, fixture or pricing write was made.
- Reviewed code/test/SQL inventory and individual SHA-256 values: [source manifest](launch-reviewed-source-manifest.json). Full review-only patch against that commit: [source diff](launch-reviewed-source.diff). The patch is not an execution script.
- Canonical source-set digest: `8c32bb1334924848e8423a084ac1fdc1fc0a48366abe0f5f51ffed033fd8abd6`. Method: sorted paths; each line is `SHA256(file bytes) + two spaces + relative path + LF`; SHA-256 of those UTF-8 lines. Documentation is excluded to avoid a self-referential digest.
- Ten runtime files, six test files, one already reviewed migration and two dependency files. The original seven-file runtime batch is preserved; the human separately approved the narrow journey-local pricing extension, adding three runtime files, and then the minimal Zod patch. No unrelated dependency/package changes are included.
- Next.js **16.4.1**, Sharp **0.35.5** and eslint-config-next **16.4.1** remain unchanged. The only package/lock delta is the approved exact Zod **4.6.6** pin and its matching resolved package metadata; every other locked dependency entry is unchanged. Ceylo/hero/CMS files and R14 permission/projection/allocation-handler files are not in the changed-file set.
- The historical partner-demo worktree, protected continuation runner `a679a58fa3adf5df84ac1f7db5889a8f4579f9c461a4d296de559e57673eff05` and all **34/34** source pins remain unchanged. No consumed runner, deferred probe or live test was invoked.

### Runtime changes

| File | Narrow purpose |
| --- | --- |
| `lib/proposals/traveller-proposal-service.ts` | Reject malformed UUID proposal tokens as safe NOT_FOUND before any database access; existing route maps to404. |
| `features/admin/journey-lifecycle-workspace.tsx` | Cancel/Escape null prompt returns before any command; authorized proposal-local commercial controls; consistent proposal heading. |
| `lib/proposals/customer-proposal-content.ts` | Shared display-only brand/contact policy; omit unapproved business email/registration claims; do not mutate stored snapshots, traveller identity or money. |
| `lib/proposals/customer-proposal.ts` | Approved composer contacts/wording; no accommodation-confirmation promise when no stay is allocated. |
| `lib/proposals/customer-proposal-dto.ts` | Retain strict customer allowlist, then normalize approved visible business content. |
| `components/proposal/proposal-document.tsx` | Same customer policy for HTML/print; readable benefit labels without changing technical keys. |
| `lib/proposals/export-proposal-pdf.ts` | Same policy for generated PDF; no invented mailbox/legacy logo. |
| `lib/pricing/allocation-commercial.ts` | Validate three proposal-local values and resolve a copied effective configuration; existing calculator semantics preserved. |
| `lib/accounting/allocation-accounting.ts` | Snapshot effective proposal configuration; no-account/inactive/unrelated/accepted-account no-sync branches return before unnecessary global-pricing validation. Mutable active-account sync remains strict. |
| `app/api/admin/journey-proposals/route.ts` | Validate new values and require BOTH existing `journey.proposal.create` and `settings.manage` when any new key is supplied, including null/zero, through one audited authorization call. |

The account-date correction is entirely in the pending function migration; no separate account-date frontend rewrite or historical backfill is required. The existing Finance handler invokes the unchanged command signature. This release must not be described as an already deployed correction.

### Tests

New: `cr7-r12-targeted-remediation.test.ts`, `traveller-proposal-token.test.ts`, `journey-commercial-overrides.test.ts`, `proposal-accommodation-copy.test.ts`.

Adjusted: `dependency-security-compatibility.test.ts` for the actual shared content module/intentional legacy-logo omission, plus one new Zod manifest/lock/installed-version security regression; and `release-readiness.test.ts` for local migration001 presence while preserving frozen historical checksum assertions. No financial/security assertion was weakened. All other existing tests are unchanged.

## 2. Validation and the specific security blocker

Node **24.22.1**, a clean frozen `npm ci`, isolated worktree-local dependencies. Build/tests had all Supabase URL/key/service variables removed; no `.env.local` or privileged keys were copied. The build explicitly reported Supabase unconfigured. These are local checks, not fresh staging or populated live HTTP proof.

| Check | Actual result |
| --- | --- |
| Full automated suite + architecture/secret-boundary validator | **566 passed; 0 failed/skipped** |
| Focused12-file CR7/pricing/finance/Operations/security set | **157 passed; 0 failed/skipped** |
| Production build | PASS, Next16.4.1/Turbopack, all46 static pages generated |
| Standalone TypeScript `tsc --noEmit` | PASS |
| Repository ESLint | PASS: **0 errors /5 warnings** after fixing a new test variable name |
| Changed-file ESLint / whitespace / review-patch checks | PASS; changed-file lint0 errors/2 image warnings; exact refreshed patch reverses cleanly in check-only mode |
| Fresh npm audit after approved Zod patch | **PASS: zero vulnerabilities at every severity; exit0** |
| Dependency tree | `npm ls --all` exit0; six optional WASM/fallback packages reported extraneous, matching existing lock entries; not invalid peer dependencies |

Warnings: two proposal `<img>` warnings; two pre-existing experience navigation warnings; one browser-fixture anonymous-export warning. None is hidden as an error-free/no-warning claim. Node's typeless-package warning is pre-existing; changing module type is not in scope.

The previous locked/resolved Zod **4.4.3** was affected by [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) (`<4.6.6`, patched4.6.6). Source review identified constrained-array request validation, including public handlers and parsing before authorization in some existing admin handlers. Existing public body limits were not treated as proof of immunity; no attack or oversized-input test was run.

**Separately approved and completed locally:** exact Zod4.6.6 pin in package/root-lock plus that package's version, registry tarball URL and registry-verified integrity. Frozen `npm ci`, audit/tree, schema/DTO regressions, full tests/type/lint/build pass. The one added security test checks exact manifest/lock/installed agreement and no older resolved Zod copy. No other package entry, application source, migration or existing prepared test changed during this patch. No broad audit-fix/force was used. See [patch evidence](launch-zod-security-patch-report.md); publication still requires separate approval.

## 3. Pending account-date migration and ordering

Only candidate: `supabase/migrations/202610150001_cr7_account_accepted_dates.sql`.

SHA-256: **`7e117e9b5da8116de54de91a48f1de6fff1bee06505d15e8648985f7022062a3`**.

It replaces only `public.initialize_journey_account_command(uuid,uuid,numeric,date,text,text,text)`, preserving its signature, SECURITY DEFINER/search_path, grants, permission checks, money commands and native history. New accounts read/validate dates from the immutable accepted proposal's sent snapshot and require exact agreement with its curated snapshot. Invalid format/calendar/order/mismatch rejects. Existing accounts, original requests and accepted snapshots are not rewritten. No sequence reset or data backfill.

Historical native rollback-only/date and full initializer evidence remains valid and is not rerun here. The prior native account integration passed and left account sequence3; the pending migration remains unapplied. Local static/mock tests do not substitute for those historical native results or a future post-application catalog check.

Last independently verified staging: **89 records / max202610150002**,001 absent; security002 installed. Because001 sorts below already installed002, the future approved CLI procedure must explicitly include missing earlier migrations. [Supabase CLI reference](https://supabase.com/docs/reference/cli/v0/supabase-db-remote-commit) documents `--include-all` and `--dry-run`.

Future sequence, only after separate execution approval:

1. Freeze staging writes. Verify target `hvcggnuptrcsxtrcjnre`, fresh baseline, migration/initializer/ACL fingerprints and final approved source/SQL hashes; capture canonical `pg_get_functiondef` and catalog privileges, never dashboard-copied text.
2. Verify/link the exact isolated release checkout; run `supabase db push --linked --include-all --dry-run`. It must list **ONLY001**. Do not include seed/roles, repair history, rename migrations or rerun002.
3. If and only if that exact output and scope are approved, apply001 once using the same normal migration workflow. No SQL Editor substitute.
4. Fresh independent connection must find **90 records, max002;001 and002 exactly once**; correct initializer definition, identical ACL/security boundary and all unrelated guards/data intact. Expected migration/function-catalog deltas are explicit, not compared to an obsolete unchanged89-record catalog digest.
5. No account activation is needed for migration verification. The single future UAT activation is its only3→4 allowance.

No remote dry-run, application or migration command has been executed in this preparation task.

## 4. Isolated, reversible Human UAT pricing

The thirteen existing configuration fields consumed by proposal pricing are:

`driver_salary_per_day`, `fuel_price_per_litre`, `vehicle_km_per_litre`, `tolls_per_journey`, `parking_per_day`, `guide_accommodation_per_night`, `administration_fixed`, `administration_percent`, `contingency_percent`, `service_fee_fixed`, `service_fee_percent`, `target_profit_margin_percent`, `route_distance_buffer_percent`.

Administration fixed/percent and contingency normally require defaults unless their existing journey overrides are supplied. Vehicle/guide costs are conditionally required by actual service/inclusion flags. Service fixed/percent and target margin require effective values for any proposal. Route buffer defaults0. The prepared one-experience fixture has no vehicle/guide; existing seven journey overrides0 cover operations/admin/contingency, and the three newly authorized proposal-local fields cover fee/margin. No shared configuration UPDATE, temporary global defaults or restoration is permitted.

| Fictional UAT input/result | Value |
| --- | ---: |
| Supplier cost; quantity | USD240.00;1 |
| Manual selling price | blank; native automatic pricing |
| Proposal-local service fixed fee / percentage / target | USD25.00 /5.00% /20.00% |
| Existing seven operating/admin/contingency overrides |0 each |
| Calculated service fee / internal cost | USD37.00 /240.00 |
| Customer total / gross profit / achieved margin | **USD346.25 /106.25 /30.69%** |
| Simulated deposit / balance | USD100.25 /246.00 |
| One supplier liability / supplier paid | USD240.00 /0.00 |

The configured20% target is not the achieved30.69% margin under existing calculator semantics. These are fictional test prices, not commercial approvals. Values exist only in the owned proposal's commercial context; deleting that exact proposal/fixture removes them. All13 original NULLs and every other protected pricing value remain unchanged. Existing permission and customer/staff projection rules remain in force; no new broad grant or margin/contact DTO key was added.

## 5. One manual UAT case, not a repeated CR7 E2E

Use [machine-readable input specification](launch-human-uat-dataset.json), [manual walkthrough](launch-human-uat-walkthrough.md), [ownership/dependency review](launch-uat-ownership-review.md) and [empty exact-ID ledger template](launch-human-uat-ownership-ledger.template.json). These are not seed/cleanup scripts and are **not authorized for entry now**.

One labelled fictional traveller, one existing published Ahungalla/experience pair, one simulated custom experience, one proposal version. No new supplier/rate/catalogue/benefit definition/Storage object; one native owned default-benefit assignment is included. Lodging/transport are self-arranged and explicitly excluded; no fabricated accommodation promise. Original requested datesD0+7…D0+9; designed/accepted datesD0…D0+2. D0 must match native operating-date eligibility without backdating or status manipulation.

Prescribed flow: final non-date Builder choices before one submission → one Studio initialization and one date-only save → one already-confirmed allocation save → owner-generated proposal/local pricing → internal approval/send → live traveller HTML/print and staff PDF/export confidentiality → exact-version acceptance → **one** native simulated Finance activation → native confirm/prepare/start → Cancel/Escape no-submit checks → one populated successful fulfilment → approved same-key replay/distinct-key conflict review. No optional journey completion, extra design save, allocation confirmation/edit, proposal version or full16-case/17-service/R18E/native-account rerun. Where a replay facility is unavailable, record UNEXECUTED and obtain a disposition; do not invent success or develop a new framework.

The public enquiry submission returns a reference, not the root UUID. Capture the UUID from the authorized admin detail for that exact returned reference before further writes. Fill the private ledger immediately with each native returned ID and any generated history/receipt IDs, using scoped authorized reads. Do not place proposal tokens, passwords, JWTs, cookies, request authorization headers or private contact content in reports/logs.

### Exact proposed business-row caps

| Table | Maximum |
| --- | ---: |
|enquiries|1|
|curated_journeys|1|
|curated_journey_changes|4|
|journey_supplier_allocations|1|
|journey_supplier_allocation_history|3|
|supplier_allocation_command_receipts|1|
|journey_proposals|1|
|journey_proposal_acceptances|1|
|enquiry_lifecycle_history|7|
|journey_accounts|1|
|journey_settlements|1|
|accounting_transactions|1|
|accounting_lifecycle_history|1|
|journey_operational_command_receipts|3|
|journey_benefits|1|
|**Total / tables**|**28 /15**|

The fresh28October targeted SELECT confirmed one applicable welcome T-shirt default, so normal proposal generation adds one owned journey-benefit row. Preserve the global definition and do not toggle/size/fulfil the simulated benefit. This explicitly corrects the previous proposed27/14 total to28/15 for final human approval; financial values and all other row caps remain unchanged.

The four curated rows are initialization plus date/pickup-date/dropoff-date changes from the one native save, with final other choices fixed before submission. Three allocation histories arise natively from allocation INSERT, Finance settlement sync UPDATE and fulfilment UPDATE. Seven enquiry lifecycle events and three Operations receipts follow the prescribed native flow. Caps do not authorize manufacturing histories or filling unused capacity. Native owned view timestamps/counters and account/allocation/lifecycle updates are permitted; unrelated rows/updates are not. The existing estimate-range guard may require the explicit honest internal UAT override reason on the first generation; never disable it or add a second version.

### Identity, account and audit conditions

- Last verified Auth1/1 does not provide distinct Designer/Finance/Operations sessions. Name the humans and approve at most three temporary least-privilege identities/profiles/role assignments before provisioning. No traveller Auth identity or new Super Admin; original owner acts only as themselves in their normal session, not impersonated/automated.
- Public/owner/role sessions use normal Vercel Authentication. No bypass secret, exported browser storage, durable JWT/cookie capture or reusable secret in the ledger. Manual human credentials, if temporary identities are separately approved, stay within the normal private identity-administration workflow, never chat.
- Account baseline3; at most one native advance to4, **only after live export and exact-version acceptance pass**. No real payment, payout, refund, waiver or booking. Failed activation can still consume nextval: stop, do not retry or reset.
- Auth refresh baseline57 and authority/denial baselines13/7 are historical expectations. Manual sign-in/refresh activity must be separately bounded by approved named sessions and reconciled; **do not reuse the old automated57→60 assumption as a manual hard guarantee**. Three temporary assignment/removal pairs normally add six authority events13→19; preserve original and legitimate new audits. No audit deletion to force fingerprints/counters.

## 6. Exact-ID cleanup and independent reconciliation

Future cleanup authority must cover only this case and ledger. Before the first UAT write, approve the complete operation/identity/cleanup manifest and verify installed FKs/logical references. After writes, freeze the ledger of actual IDs and observed counts. No blank ledger, label prefix, broad enquiry-root predicate or unused cap is a deletion target.

One reviewed atomic business-data transaction; existing transaction-local maintenance hooks only if explicitly included in that future approval: `roam.phase8_cleanup=on`, `roam.financial_command=on`, `roam.allocation_command=cleanup`, `roam.phase10_cleanup=on`. Never disable triggers, RLS, constraints, grants or use CASCADE; never reset sequences. Revalidate the leaf order against actual installed dependencies before cleanup:

Operations receipts → allocation command receipts → accounting transactions → accounting lifecycle → settlements → account → acceptance → proposal → owned journey benefit → allocation history → allocation → enquiry lifecycle → curated changes → curated journey → enquiry.

Assert every selected ID is exclusively owned, exact deleted counts reconcile, no unexpected incoming references exist, all owned business rows are gone, protected rows/settings/RLS/ACL/guards/Storage are unchanged and all audits retained. On any assertion, ROLLBACK the business cleanup. Do not improvise deletion or run historical cleanup-only scripts. Remove only the separately approved temporary roles/profiles/identities via reviewed normal identity cleanup after their business references are gone; preserve audit references. If any residual remains, stop further mutations and report exact residual IDs privately for separate recovery approval.

Fresh independent post-cleanup connection: Auth1/1 with original identity/role, Storage4/5, original two enquiries/historical accounts/suppliers10/6/10 unchanged, pricingplans0, all13 pricingNULLs and other fields unchanged, zero owned rows/orphan roles, R14 grants/RLS/CR5/CR6/CR7 guards intact;90 migrations/max002 with001/002 once; account sequence3or4 according to actual at-most-once activation, never reset; exact original audit rows retained plus explained native additions. Compare protected-table canonical `to_jsonb` row and ordered aggregate digests; compare original audit rows separately from legitimate appended events. Compare native function/catalog fingerprints with the explicitly approved001 delta.

No executable cleanup implementation is approved by this document. Resolve the final exact-ID parameterized cleanup transaction and private identity-removal manifest before UAT entry; the28-row budget is an input to that review, not authority to run an old22-row runner.

## 7. Minimal future publication and rollback

1. Verify this final source/lock digest and green local evidence; the isolated Zod security blocker is resolved. Obtain human approval for the exact final release commit/diff,001, protected Preview publication and UAT/cleanup/session envelope in this one coordinated manifest; unresolved placeholders must be resolved before their gate.
2. Fresh read-only target/Preview/data/ACL/audit/sequence preflight; if staging branch/deployment has changed from85374f7, stop and reconcile source/CMS changes rather than force-push/overwrite. No Production project/branch/credentials.
3. Apply only001 through the guarded migration procedure above, independently verify90/max002. Then commit/push only the approved staging branch and publish the compatible final app to protected Preview after explicit approval. Do not promote to Production or remove Holding Mode.
4. Preserve existing Authentication and staging Supabase environment binding. Verify deployment READY, exact final SHA/ID and protected alias `roam-ceylon-git-commercial-readiness-staging-roam-ceylon.vercel.app`. Historical Vercel metadata had `autoAssignCustomDomains:false`; do not assume an alias moved just because a build is READY. If explicit reassignment of the existing staging alias is needed, it must be in the rollout approval; do not change global protection or auto-assignment settings.
5. Read-only/non-mutating smoke: safe404 malformed token, Ceylo/hero, configured CMS images, Journey Builder, login/role UI and proposal routes; then run the one approved manual UAT. Existing automated/JWT/HTTP coverage stands; current local tests are not substituted for unexecuted live export/acceptance/activation/fulfilment evidence.
6. If critical app verification fails, stop new UAT writes and restore only the approved protected alias to known safe deployment **`dpl_7j88PqnXGr8JiteTStP9Q38VgZB8` /85374f7**, independently verify recovery and protections. App rollback does not undo001: the function signature is backward compatible. If the old app's dependency advisory makes even temporary fallback unsuitable, keep access protected/HOLD and obtain a patched safe rollback build; never pretend the advisory disappeared.
7. Any database reversal needs a separately reviewed additive corrective migration and human approval. Never delete migration history, rewrite old migrations, reset counters or backfill historical accounts. Exact fixture cleanup and audit reconciliation are distinct from app rollback.

## 8. Required decisions and shortest route

**Now:** local release preparation is complete, including the human-approved Zod4.6.6 patch. No local code/security blocker remains in this reviewed scope. The ten-file app assembly, two dependency files, migration, tests and UAT documents are ready for controlled staging approval, not already published or applied.

**Next approval:** one human execution authorization should identify final source/lock commit/diff,001 checksum, protected staging target/alias plus rollback, named manualUAT/session bounds,28/15 business ceiling, account3→4 once, private exact-ID ledger/atomic cleanup and audit retention. No current approval is inferred for those effects.

Remaining technical acceptance evidence: current-release live PDF/customer export (identity/labelledUSD346.25/private-field absence), exact-version acceptance, migrated native Finance account dates/precision, populated successful fulfilment and replay/conflict disposition, followed by complete cleanup/reconciliation. These are focused Human UAT gates, not a reopened full17-service E2E. Real suppliers, merchant/payment settlement, legal/business approval, customer publication and commercial launch remain separate human/business gates.
