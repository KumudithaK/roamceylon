# Final coordinated staging execution plan — approval required

28 October 2026. **PREPARED, NOT EXECUTED.** Candidate acceptance/local patch approvals do not authorize migration, commit/push/publication, identities, UAT entry or cleanup. Production and Commercial Launch remain NOT AUTHORIZED.

## Frozen candidate and exact approval boundary

Worktree: `/Users/kumudithakk/Documents/Codex/2026-07-25/use-the-uploaded-roam-ceylon-html/roamceylon-launch-completion`.

- Base: `85374f782b789a069d6a581302cb6791f104d1da`; detached and uncommitted.
- Accepted19-file code/test/dependency/SQL source-set SHA-256 remains **`8c32bb1334924848e8423a084ac1fdc1fc0a48366abe0f5f51ffed033fd8abd6`**. All19 individual hashes still match [source manifest](launch-reviewed-source-manifest.json).
- Exact source review patch SHA-256: **`cd9e8f717589a97ebc3bf8c4a864caff869dc511b1ad93333ece2e010f364326`**; [patch](launch-reviewed-source.diff).
- Migration001 SHA-256: **`7e117e9b5da8116de54de91a48f1de6fff1bee06505d15e8648985f7022062a3`**.
- Next16.4.1, Sharp0.35.5, Zod4.6.6; ten runtime files, six tests, two dependency files, migration001. No Ceylo/hero/CMS/R14 source delta.
- Only planning documents changed during this final preparation. The explicit proposed UAT budget is corrected from27/14 to **28 business rows/15 tables**, for one observed native default-benefit insert. **This correction requires final human approval; no fixture has been created.**
- [Approved-file allowlist](launch-approved-file-list.txt) covers the19 frozen source files and13 planning/evidence artifacts;32 files total. No `.env`, `.vercel`, filled ledger, browser storage or private historical journal may be staged. The allowlist/document digests are recorded in [final preparation evidence](launch-final-preparation-evidence.json).

## Evidence available now

| Evidence | Actual observation |
| --- | --- |
| Candidate integrity |19/19 file hashes and aggregate reproduced; historical continuation runner and34 pins unchanged. |
| Existing local validation |566 tests;157 focused checks; TypeScript/build PASS; audit0 vulnerabilities; lint0 errors/5 warnings. Not rerun without a source change. |
| Remote staging Git ref |Read-only `ls-remote` confirms85374f7 on `commercial-readiness/staging`; no newer branch change observed. |
| Protected Preview |Fresh read-only GET at **15:35:07 Asia/Colombo**: READY; `dpl_7j88PqnXGr8JiteTStP9Q38VgZB8`,85374f7; exact staging alias, Authentication preserved, bypass entries0 and staging Supabase verified. |
| Staging database |Human-authenticated read-only stdin preflight at **15:37:19**, backend960296; dependencies960302. PASS/drift[].89/max002,001 absent; Auth1/1; Storage4/5; account3/Auth57; original enquiries2; suppliers10/6/10; plans0; pricingNULLs13; authority13/denial7;53/53 protected aggregate fingerprints matched; R14/native guards intact; no temporary/orphan/fixture rows, active hooks or reviewed open transaction. |
| UAT benefit applicability |Human-authenticated read-only SELECT at **15:44:23**, backend960997: definition rows1, existing journey assignments0, applicable default1: `f4d0a933-55a6-46ef-bf6e-6283bc32e03f` /`roam_ceylon_welcome_tshirt`. |
| Migration tool |Installed Supabase CLI2.109.1 help confirms `--linked`, `--include-all` and `--dry-run`. No push/dry-run/application was executed during preparation. |

The workspace's Supabase login attempt failed before SQL access; the subsequent human-authenticated result supplies the fresh proof. That authentication failure is not classified as data drift. The existing read-only helpers did not invoke any consumed continuation, identity or account workflow.

## Five lint warnings — reviewed, none release-blocking

| File/line | Disposition |
| --- | --- |
| `components/proposal/proposal-document.tsx:16` |P3 image optimization/LCP advice, not authorization or finance correctness. Existing image tag; approved content policy omits the legacy-logo branch. |
| Same file`:60` |P3 QR image optimization advice. QR encodes approved business WhatsApp data, not traveller identity/token; proposal source retains no-referrer protection. Manual export still checks rendering. |
| `features/experiences/experience-public-detail.tsx:55` |P3 `window.location.assign` versus router navigation. Fixed same-origin Builder target, query built with URLSearchParams after draft persistence; no arbitrary-origin navigation. File unchanged from853. |
| Same file`:59` |P3 same-origin Builder hard reload after selection update; preserve behavior now and check the ordinary selection-to-Builder handoff before the single UAT submission. |
| `tests/browser/proposal-focus/next.config.mjs:6` |P3 anonymous default-export naming only, in isolated test configuration; not production runtime. File unchanged. |

No suppression, runtime edit or cosmetic cleanup was added. These are performance/maintainability follow-ups, not a dismissal of inaccurate money/customer information.

## Exact execution sequence AFTER final approval

### Gate0 — freeze and bind approval

Keep staging idle. The approval must name this candidate digest, migration checksum, staging project `hvcggnuptrcsxtrcjnre`, protected Preview/alias, proposed28/15 UAT, at most three temporary role identities, one account3→4 increment and the cleanup/audit rules below.

Immediately before mutation, revalidate the frozen hashes, exact target/remote SHA, protected Preview and fresh database/benefit state. Stop for drift; do not force-push, rebase the accepted candidate silently, overwrite CMS assets, reset counters or change protected benefits/pricing to force a match. The28October observations are evidence, not a permanent exemption from the execution-time gate.

Resolve the human operator(s), one run tag (`TCE-UAT-<operating-date>-01`), D0 and payment date before entry. D0 is the approved actual operating date satisfying native start-travel checks; requestD0+7…D0+9, accepted designD0…D0+2. Resolve the private ledger location and supported authenticated replay facility before fixture creation. No secrets in chat/commits/HARs/screenshots.

### Gate1 — freeze one release commit locally

Stage only the allowlist; review the cached file set and whitespace before committing:

```sh
git add --pathspec-from-file=docs/launch-approved-file-list.txt
git diff --cached --check
git diff --cached --name-only
git commit -m "CR7: coordinated journey fixes, isolated pricing and Zod security patch"
git rev-parse HEAD
```

These are future commands, not instructions to run now. Record new commitC and verify its19 code/test/dependency/SQL blobs match the accepted digests. Remain detached if needed; no Production branch and no push yet. A local commit is not a deployment or test PASS.

### Gate2 — apply ONLY accepted-date001 through normal migrations

Use the release worktree, **not** the old R14 checkout (which does not contain this assembled migration set). The future authenticated Terminal procedure is:

```sh
SUPABASE_TELEMETRY_DISABLED=1 ./node_modules/.bin/supabase link --project-ref hvcggnuptrcsxtrcjnre
SUPABASE_TELEMETRY_DISABLED=1 ./node_modules/.bin/supabase db push --linked --include-all --dry-run
```

The dry-run must list **only** `202610150001_cr7_account_accepted_dates.sql`. `--include-all` is needed because001 is missing while the later002 is already installed. No `--include-seed`, `--include-roles`, repair, renaming, SQL Editor substitute or002 reapplication. If the plan differs, STOP before application.

Only the approved exact dry-run permits one permanent application:

```sh
SUPABASE_TELEMETRY_DISABLED=1 ./node_modules/.bin/supabase db push --linked --include-all
```

From a fresh connection, assert90 migration records, max202610150002;001 and002 exactly once; correct native initializer body/signature/SECURITY DEFINER/search_path/ACL; all unrelated grants/RLS/triggers/CR5/CR6/CR7 guards and business/Auth/Storage data unchanged. Compare canonical `pg_get_functiondef`/catalogs, not copied dashboard text. Record the approved initializer/migration-catalog deltas separately. Do not run the old001-absent preflight after applying001 and misreport its expected failure as corruption. Do not repeat the native account-init test or consume an account number here.

On ambiguous application output, query history/function state independently; **never rerun push automatically**. No publication or UAT while migration verification is incomplete.

### Gate3 — publish onlyC to protected staging

Recheck remote staging still85374f7, then use the explicit staging-only ref:

```sh
git push origin HEAD:refs/heads/commercial-readiness/staging
```

Never force-push or push another branch. This may immediately trigger the normal Preview rollout/auto-alias; it therefore occurs **only after migration verification**. One Preview build must correspond toC and branch `commercial-readiness/staging` in Vercel project `prj_1UyIsBoedY2TF9rhHZhfywZ61pp0`, team `team_mJg3th6VO3aRCRLETmuswRWB`. If the Git hook does not produce the correct build, stop and use only the approved same-commit staging Preview procedure after target/env verification—not a blind second deployment or Production flag.

Preserve branch-scoped Preview Supabase URL `https://hvcggnuptrcsxtrcjnre.supabase.co` and server-side staging key isolation. Never print/decrypt keys or pull a full env file. Preserve Authentication (`all_except_custom_domains`) and zero bypass entries; no automation bypass secret.

Verify READY, commitC, deploymentID, correct project/Preview environment and alias `roam-ceylon-git-commercial-readiness-staging-roam-ceylon.vercel.app`. The existing project had `autoAssignCustomDomains:false`; verify actual alias destination. Final approval must include assigning this **existing staging alias only** if the normal rollout leaves it on the old deployment. Do not change global protection/auto-assignment settings or Production domains. Immediately verify/recover any critical broken alias.

Read-only/non-mutating smoke: malformed token404/no private error, homepage/hero/Ceylo, CMS imagery/destination pages, Journey Builder, admin login, allocation/proposal entry points. No fixture or original-customer write merely to smoke a page. Check populated exports/Finance/fulfilment in the one owned case below, not a repeated test matrix.

### Gate4 — provision only the approved manual role access

The Ceylon application has no staff-user provisioning screen. Use the human's trusted **staging Supabase Dashboard Auth administration**, not a consumed test runner: at most three new explicitly labelled temporary users for Designer/Finance/Operations, no invitation to a real customer and no traveller Auth identity. Resolve exact reserved `example.test` test addresses and private credential delivery before creation. Confirm the Dashboard's normal account-confirmation flow is supported; if unavailable, HOLD rather than invent another privileged path.

Capture each exact AuthUUID. Through the normal trusted administrative Table Editor workflow, create/reconcile only its owned `public.profiles` row with legacy role`editor` (not`admin`) and exactly one `public.profile_staff_roles` assignment: `journey_designer`, `finance`, `operations` respectively. No permission catalogue/grant changes. Native triggers retain assignment audits; Dashboard actor class can be`database_owner`, not the old scripted`service_role`. Do not manufacture audits.

Use three genuine human role sessions, one initial password sign-in each. Existing human owner performs allocation and proposal-local pricing in their own normal Super Admin session, never impersonated/automated or reassigned. Verify exact effective permissions without rerunning R18E/16-case matrix. Normal Vercel authentication only; private/ephemeral role contexts, no copied JWT/cookie/browser-storage files.

Auth counter57→60 is the normal forecast for those three sign-ins if the owner reuses a valid session; a necessary owner sign-in and native refreshes must be explicitly recorded and independently reconciled, not hidden or reset. This is a **manual-session forecast, not a guaranteed scripted delta**. Bound activity to the named UAT sessions, no repeated login attempts or unrelated identity use. Ordinary original-user metadata changes require field-level comparison and matching Auth activity; identity/security-sensitive fields and Super Admin assignment must remain intact. Any unexplained change is HOLD.

### Gate5 — one human-operated28-row/15-table fixture

Use [dataset](launch-human-uat-dataset.json), [walkthrough](launch-human-uat-walkthrough.md) and a restricted copy of the [empty ledger](launch-human-uat-ownership-ledger.template.json). Caps:

`enquiries1; curated_journeys1; curated_journey_changes4; journey_supplier_allocations1; journey_supplier_allocation_history3; supplier_allocation_command_receipts1; journey_proposals1; journey_benefits1; journey_proposal_acceptances1; enquiry_lifecycle_history7; journey_accounts1; journey_settlements1; accounting_transactions1; accounting_lifecycle_history1; journey_operational_command_receipts3`.

The extra table/row versus the earlier draft is **one native default welcome-benefit assignment** from protected definition `f4d0a933-55a6-46ef-bf6e-6283bc32e03f`, inserted during normal proposal generation. Preserve the definition; no manual benefit assignment/toggle/size/fulfilment update. It is a simulated UAT promise only and adds no Finance liability. Check its customer branding; real-world welcome-gift policy remains a business decision before real launch. If default applicability differs or additional rows are needed, stop; no fixture expansion.

1. Final non-date Builder inputs before one public submission; resolve the exact returned journey reference to its authorized admin UUID and immediately ledger it. No prefix-based ownership/deletion.
2. Initialize Studio once, change both dates, click **Proceed to Supplier Allocation once as the sole save**. Do not click Save journey first. Keep original request; no status manipulation.
3. Owner saves one confirmed custom experience: costUSD240.00, selling price blank/native-auto, all delivery/private notes entered upfront. No supplier/rate creation or second allocation save/confirmation.
4. Owner generates one version with proposal-local feeUSD25.00, fee5.00%, target20.00%, existing seven operating/admin/contingency overrides0. Only users with BOTH existing pricing-management and proposal-creation permissions can send those keys. Effective values stay in owned proposal context; global13NULLs/every other pricing field remain untouched. Expected totalUSD346.25; fee37.00; internal240.00; gross106.25/achievedmargin30.69%. No global restoration is necessary or allowed.
5. Designer approves/sends within existing permissions. Review live customer HTML/print/Save-as-PDF and staff generated PDF: exact fictional identity, labelledUSD346.25, designed dates, The Ceylon Edition/approved contacts, no unverified business email or unsupported stay promise. Costs, target margins, private contacts/notes and receipt internals must be **absent**, including nested data; whitespace normalization is for PDF extraction only, not money/identity loosening.
6. Traveller persona accepts the exact version once. Only after export AND acceptance pass, Finance makes **one** native activation:100.25 simulated receipt, payment method **Other**, Notes `UAT SIMULATED - NO REAL PAYMENT`, run-tag Reference. No money moves outside staging. Expected account datesD0/D0+2, selling346.25, internal/liability240.00, received100.25, balance246.00, paid/refunded/waived0.
7. Account sequence may advance exactly **3→4 once**. A failed/ambiguous activation may consume4; no retry/reset. Do not repeat standalone account initialization.
8. Native confirm/prepare/start, Cancel/Escape no-submit checks, one populated successful allocation fulfilment. Check actual role-safe response. Use only a previously agreed authenticated in-memory/browser request replay facility for same-key replay and distinct-key409 conflict; no additional business rows/finance changes. If unavailable, record UNEXECUTED and HOLD acceptance of that gate—do not develop a framework or claim PASS.

No extra Studio save, proposal version, meaningful allocation edit, benefit action, completion transition, supplier payment/refund/waiver or full E2E rerun. Normal owned view timestamps/counters and native lifecycle updates are allowed. Generation can persist the native benefit before a later error: capture/reconcile it even on partial failure, and never retry blindly.

### Gate6 — exact-ID cleanup and financial reconciliation

The same final approval must cover instantiating the frozen cleanup strategy with actual ledger IDs/caps—not a broad deletion. Before entry, verify current incoming FKs/logical dependencies and review the parameterized cleanup transaction. After the case, freeze new writes; ledger every actual row/command key, assert exclusive ownership and per-table caps. Partial runs clean only actual captured IDs; unused capacity is not a target.

One atomic business cleanup in this order: Operations receipts → allocation receipts → accounting transaction → accounting lifecycle → settlement → account → acceptance → proposal → **owned journey benefit** → allocation history → allocation → enquiry lifecycle → curated changes → curated journey → enquiry. Global benefit definitions/pricing/suppliers and staff audits are never targets.

Use only the existing approved transaction-local hooks within that cleanup transaction: `roam.phase8_cleanup=on`, `roam.financial_command=on`, `roam.allocation_command=cleanup`, `roam.phase10_cleanup=on`. No CASCADE, disabled constraints/triggers/RLS, changed grants or sequence reset. Assert exact deletion counts, zero owned residuals/unexpected references and unchanged protected state before COMMIT; ROLLBACK on mismatch. Stop on failure and report exact residual IDs privately for recovery—no improvised repair or consumed cleanup-only script.

Then remove only the three owned exact role assignments through normal audited administration and delete only their AuthUUIDs through normal Auth administration (profile/session/identity cascades), preserving original Super Admin and all legitimate security/authority/provider audits. Three assignment/removal pairs ordinarily add6 authority events13→19; preserve all original7 denials and every legitimate addition. Actor classes can differ between manual and historical scripted administration.

Fresh independent reconciliation:90/max002 with001/002 once; accepted initializer/ACL as approved; Auth1/1 and original identity/security/role integrity; Storage4/5; original enquiries2 and historical accounts unchanged; suppliers10/6/10; plans0; all13 global pricingNULLs/every other field unchanged; global default-benefit definition unchanged; zero owned business rows and orphan temporary roles; R14/RLS/grants/CR5/CR6/CR7 guards preserved; no active cleanup hooks/open cleanup transaction. Preserve account4 if activation attempted successfully or consumed once, else3; never reset. Explain every Auth counter/metadata effect.

For protected tables compare full aggregate digests on51 non-append-audit tables and every original row in the two append-only audit tables, plus only legitimate explained new audit rows. Do not demand an unchanged audit aggregate after allowed additions or delete audits to force one. Business/provider balances must reconcile before deletion:100.25 received,246.00 outstanding,240.00 supplier liability, supplierpaid/refunds/waivers0; after deletion no owned balances/ledger rows remain, historical finance unchanged.

## Failure and rollback boundaries

- Hash/ref/target/baseline drift, non-single001 migration plan, unexpected grant/data change, security leak, ambiguous write, cap breach or unexplained counter: HOLD new mutations; reconcile and execute only approved exact-ID cleanup where safe. No automatic retry.
- Critical Preview/alias regression: restore only the approved staging alias to prior deployment `dpl_7j88PqnXGr8JiteTStP9Q38VgZB8`/85374f7, independently verify protection/routing. That prior build still has the known old Zod version; use only as a protected short-term recovery, never claim the advisory fixed there. If unsuitable, HOLD protected access and request a patched fallback.
- App rollback does not reverse001; unchanged function signature is backward compatible. Any DB reversal needs a separately reviewed additive correction; no history repair/backfill/sequence reset.
- No Production branch/project/domain/access, public Holding Mode removal, bypass secret, commercial publication, real payment or launch approval.

## Precise approval requested — NOT permission already granted

Approve the exact frozen source digest and32-file allowlist; local release commitC and staging-only push/publication; one001 migration after single-file dry-run; protected alias verification/assignment and bounded recovery; the corrected **28-row/15-table** native manual case; at most three least-privilege temporary identities/profiles/assignments with normal human sessions and retained audits; one conditional account3→4 advancement; exact-ID cleanup and independent financial/security reconciliation. Fill actor/run/date/private-ledger/replay-method parameters before entry. All execution-time gates and stop rules remain mandatory.

Candidate acceptance does **not** mark migration, live export/acceptance/Finance/fulfilment/replay, Human UAT, cleanup or Commercial Launch as passed. Return actual evidence and explicit gaps after any separately approved execution.
