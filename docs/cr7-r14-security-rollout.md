# CR7-R14 — controlled staging security rollout checkpoint

**Historical pre-application checkpoint. Superseded by `cr7-r14b-security-rollout.md`: the human subsequently applied the approved migration, and independent PostgreSQL verification confirmed 89 / 202610150002 with only the authorized ACL delta. Do not rerun the permanent application handoff below.**

21 October 2026. **HOLD: human authenticated dry-run passed; permanent linked CLI execution handoff required. No permanent migration or publication has occurred.** CR7 closure remains HOLD. Commercial Launch remains NOT AUTHORIZED.

## A. Fresh preflight

- Target confirmed in the authenticated Supabase dashboard: `the-ceylon-edition-staging`, project `hvcggnuptrcsxtrcjnre`. The dashboard's generic main-branch “Production” badge belongs to this staging project; it is not the separate protected Production project.
- Fresh native PostgreSQL snapshot: backend **258481**, captured `2026-10-21 10:30:04.215731+00`. All **60 table fingerprints** (53 public, four Auth, two Storage, migration history), all **12 catalog groups**, and the exact allocation-table/column ACL list match the R13 baseline. No Auth metadata exception or baseline reconciliation was needed.
- Independent backend **264031** again returned full canonical equality, 88 migrations/latest `202610090001`, both candidates absent, and zero idle-in-transaction client sessions. This was SELECT-only; no cleanup hooks or business commands were invoked.
- After the human completed linking and the one-candidate dry-run, fresh independent backend **266136** again returned the identical full canonical baseline, migration state, current original grants, inactive hooks and zero idle-in-transaction client sessions. The isolated linked project reference was independently read as `hvcggnuptrcsxtrcjnre`; migration checksum and the absence of the account-date file were rechecked. The agent's CLI still returned `LegacyPlatformAuthRequiredError`, so no permanent command was attempted by the agent.
- Canonical method is the unchanged `scripts/sql/cr7-r13-security-snapshot.sql`: PostgreSQL-native row JSON digests and sorted aggregate digests; catalog definitions use native `pg_get_functiondef`, `pg_get_triggerdef`, policy/constraint/view definitions, ownership, privileges and security/search-path metadata. No dashboard-rendered function text is hashed. MD5 here is a regression checksum, not a credential hash or cryptographic security claim.
- Original dirty worktree remains on `commercial-readiness/staging` at `d8f1ff03f651da53a3d5a2f112fab9f0d110aea7`. Its account-date, R12, hero/sound, Ceylo-preflight and unrelated documentation changes were inspected and preserved, not staged or copied wholesale.
- Isolated checkout: `/Users/kumudithakk/Documents/Codex/2026-07-25/use-the-uploaded-roam-ceylon-html/roamceylon-cr7-r14-security`, detached from that exact SHA. The managed-worktree API could not resolve the parent chat directory as a repository, so a normal Git worktree was created from the verified staging repository. No Production branch or source was changed.

## B. Approved migration identity and checksum

Candidate: `202610150002_cr7_allocation_read_boundary.sql`.

SHA-256: `23625b5e855bd7b539e8b44f2fcf2bd1f5a34f27d834efaf494540c9f2466c1d`.

Exact approved content is preserved. It only revokes SELECT on `public.journey_supplier_allocations` and `public.journey_supplier_allocation_history` from PUBLIC, anon and authenticated. No RLS, function, trigger, schema, command, integrity constraint or private-schema privilege is changed.

**Not applied.** The workspace CLI's read-only migration-list attempt returned `LegacyPlatformAuthRequiredError: Access token not provided`. No credential extraction, SQL Editor application, migration repair or history fabrication was attempted.

## C. Exact migration history and isolation

- Remote installed state: **88 / `202610090001`**. Both `202610150001` and `202610150002` have zero installed records.
- Isolated local inventory: **89 files** = the existing 88 applied migrations plus only `202610150002`.
- `202610150001_cr7_account_accepted_dates.sql` is absent from the isolated checkout. It remains unchanged and unapplied in the original dirty worktree, SHA-256 `7e117e9b5da8116de54de91a48f1de6fff1bee06505d15e8648985f7022062a3`.
- No blanket push was run. There is no CLI per-file selector in the installed `db push --help`; the supported workflow compares the isolated local migration inventory against remote history. The human's normal Terminal confirmed `Finished supabase link`, then a successful linked dry-run offering **only `202610150002_cr7_allocation_read_boundary.sql`**, followed by `Finished supabase db push`. The output explicitly identified the dry run: this is not evidence of permanent application.
- After an authorized successful application, the required result is **89 / `202610150002`**, recorded once, with account-date `202610150001` still absent. That is an expectation, not a current-state claim. Do not use `--include-all` or repair history to force this result. Future handling of the older account-date candidate requires its own reviewed ordering/application plan.

## D. Application artifact / commit

**No new commit or push.** Isolated runtime changes are limited to:

- `app/api/admin/journey-allocations/route.ts` — one projection on GET, batch save, fulfilment and retirement responses; allowlisted fulfilment receipt.
- `lib/admin/allocation-projection.ts` — explicit capability-appropriate allocation DTO and receipt fields. No raw row spread or unknown future column serialization.

Supporting changes only: `tests/admin-permissions.test.ts`, `tests/release-readiness.test.ts`, `tests/cr7-r13-allocation-security.test.ts`, the R13 snapshot/rehearsal SQL artifacts (only an extra trailing blank line removed for cached whitespace validation), the exact approved migration, and this report. Release inventory is adjusted only to the isolated 89-file set.

Excluded: account-date migration/correction; R12 prompt, branding/contact and proposal changes; hero/video/audio/Ceylo changes; `.env` changes; `next.config.ts`; `.DS_Store`; unrelated readiness-report changes. Existing package and lockfile are unchanged. No staging secrets were copied into the checkout.

### Local validation

- Full suite: **426 passed, 0 failed, 1 intentional skip** (427 registered). The skipped optional R13 checksum test concerns the deliberately absent account-date candidate; the release-inventory test independently enforces the exact isolated migration list.
- Focused security / CR6 / CR7 / allocation / customer-proposal regressions: **88 passed, 0 failed, 1 identical intentional skip** (89 registered).
- TypeScript, changed-file ESLint and `git diff --check`: PASS.
- Normal `npm run build`: PASS with isolated dependencies installed from the unchanged lockfile. Build uses unconfigured-content fallback, not live staging content.
- Initial dependency-sharing attempt was rejected by Turbopack because the node_modules symlink pointed outside its root. The symlink was removed. An initial npm cache permission failure was avoided with a fresh task-specific cache; no home-directory ownership/permission repair was performed. A lockfile-based `npm ci --ignore-scripts --no-audit --no-fund` then installed 436 packages. The normal build subsequently passed without application/configuration changes.
- Logs: `/private/tmp/cr7-r14-isolated-full.log`, `/private/tmp/cr7-r14-isolated-security-regression.log`, `/private/tmp/cr7-r14-isolated-typescript.log`, `/private/tmp/cr7-r14-isolated-eslint.log`, `/private/tmp/cr7-r14-isolated-build.log`, `/private/tmp/cr7-r14-isolated-install.log`.

## E. Vercel deployment

No new deployment. Current verified Ready/Latest **Preview** remains:

- Commit `d8f1ff03f651da53a3d5a2f112fab9f0d110aea7`.
- Deployment `dpl_GCXS7EMqojKenXWpCAFasE9GCzWT`.
- Immutable URL: https://roam-ceylon-gsdy136aq-roam-ceylon.vercel.app/
- Persistent alias: https://roam-ceylon-git-commercial-readiness-staging-roam-ceylon.vercel.app/
- Dashboard: https://vercel.com/roam-ceylon/roam-ceylon/GCXS7EMqojKenXWpCAFasE9GCzWT
- Current project protection settings show **Require Log In enabled / Standard Protection**, no protection exceptions listed, no automation bypass secret, and no settings saved/changed.

Deployment credentials and a new build/alias have not been verified because no publication occurred. Do not infer staging credential isolation for a future deployment from the local fallback build.

## F. Grants / RLS and rollout compatibility

Current vulnerable read grants remain installed: both tables have authenticated SELECT=true, anon SELECT=false, service_role SELECT=true. All policies, ownership, function flags/search paths and grants match the R13 baseline exactly. This is **not** a claim that remediation is already active.

RLS is row-level eligibility, not sensitive-column redaction. Eligible staff roles can currently select costs/contact/snapshots directly; non-staff authentication alone does not satisfy those policies. R13 demonstrated the exact proposed REVOKE with SQL roles in a rollback-only transaction and verified independent rollback. That historical rehearsal was not rerun or misreported as permanent application.

The deployed allocation route and other inspected allocation/history consumers already use the trusted server client after capability authorization. Browser workflow calls the server API, not the sensitive base tables. Consequently the approved direct-read revoke does not remove their database role's SELECT. Safe owner-executed audit metadata and command EXECUTE contracts are preserved. No broad private-schema access is needed.

Chosen continuation order: have the isolated application artifact validated and publication capability ready; prove the authenticated one-candidate dry-run; freshly recheck staging; apply the ACL migration through the linked CLI; independently verify its exact delta; immediately publish only the matching DTO artifact to protected Preview and verify it. Do not publish an unfinished mixed checkout or claim the partner demo safe during an incomplete rollout. If a later gate fails, stop and keep the demo/CR7 HOLD rather than broadening scope or permissions.

## G. API response redaction

Local actual-handler tests replace only network/database I/O, exercising real authorization and projection code. GET and fulfilment responses enforce Designer/Finance/Operations/Super Admin boundaries; invalid/nonstaff sessions fail before sensitive reads; arbitrary future allocation and command-result fields are omitted; replay metadata and retirement/financial-activity checks remain intact. Save/retire response sites use the same projection; source assertions and build/type checks cover their response contract.

Operations retains necessary delivery/contact/fulfilment data but receives neither supplier costs nor selling price. Finance retains financial fields but not private delivery prose/contact snapshots. Designer retains proposal-selling information but not supplier costs/private contacts. Allocators/Super Admin retain fields needed by their existing capabilities. Receipt fields are only enquiryId, allocationId, status, idempotent.

Customer proposal projection/export/acceptance code is unchanged in this narrow artifact, with existing confidentiality regressions green. No newly deployed response has been tested yet. No real save, fulfilment, retirement, enquiry or acceptance event was generated. The separate unfinished R12 Cancel/Escape and proposal-content corrections are explicitly not included.

## H. Actual JWT / PostgREST coverage

No new actual distinct-role JWT/PostgREST test was performed. Native database-role rehearsal and in-memory real-handler tests are separate evidence, not live staff-session proof. No bearer tokens, service-role keys, refresh tokens or private business values were retrieved or printed. No new Auth identity was created.

## I. Remaining gates

1. Authenticated isolated linked dry-run: **PASS, human output reviewed**. The workspace CLI still lacks login. Permanent application must be executed through the authenticated normal Mac Terminal, from this same isolated checkout. If any other migration is offered, stop without confirming.
2. Permanent application and fresh independent 89/latest002/ACL-only verification.
3. Narrow security commit/push/Preview publication, correct staging environment and Vercel Authentication/alias proof.
4. Deployed response checks and actual existing-session JWT/REST tests where safely available. Designer, Finance and Operations distinct-role sessions are not available under the current one-user baseline. Do not create users or mislabel tests to hide this gap. Any new mutation-based fixture plan needs separate authority.
5. CR7 closure remains HOLD regardless of the narrow security result; unrelated R12 and broader real-world readiness findings are not resolved by this artifact.

## J. Staging integrity

All 53 public table digests match, including protected CR5: **4 applications / 4 file records / 4 history records**. Enquiries, curated journeys, proposals/acceptances/change requests, allocations/history/receipts, accounts, transactions/history, settlements and cancellation/recoverability rows remain **0**. Suppliers **10 accommodations / 6 guides / 10 vehicles**; pricing plans **0**; original Business Pricing NULLs **13**; sequence **2 / is_called=true**, never reset. Auth **1 user / 1 Super Admin**; Storage **4 buckets / 4 objects**. Auth identity/session/refresh and Storage digests match without exception. CR6/CR7 guards, all 74 noninternal trigger definitions, 148 policies and 626 constraints match the prior catalog. Four cleanup hooks inactive; open idle-in-transaction client sessions **0**.

Database business, Auth, Storage, migration, privilege or schema mutations in this task: **NONE**. SQL Editor queries were read-only. Dashboard query-editor state and local audit artifacts are not business/schema mutations.

Preflight screenshot: `/private/tmp/cr7-r14-preflight-proof.png`.

## K. Production / historical integrity

No Production or historical-stabilization database access, mutation, source change, push, deployment, promotion or settings change. No new migration identity, Auth user, synthetic business row, sequence reset or real communication/payment. Local Git worktree administration does not alter another checkout's source or branch. Commercial Launch remains NOT AUTHORIZED. No CR8/CR9 advancement.

## L. Ceylo demo readiness and exact handoff

**Not cleared.** Ceylo demo preflight may resume only after the authorized security rollout and deployed verification pass. No Ceylo implementation/publication has been included here.

The authenticated linking/dry-run handoff above is complete. With the existing R14 approval and fresh matching preflight, in the same authenticated normal Mac Terminal run only:

```sh
cd "/Users/kumudithakk/Documents/Codex/2026-07-25/use-the-uploaded-roam-ceylon-html/roamceylon-cr7-r14-security"
SUPABASE_TELEMETRY_DISABLED=1 npx supabase db push --linked
```

Confirm `Y` only if **`202610150002_cr7_allocation_read_boundary.sql` is the sole offered migration**. Stop if any other migration appears, the link targets another project, or CLI requests history repair. Paste the output without credentials. Do not run a permanent push from the original dirty staging checkout. Do not rerun a reported successful application merely because of a Docker catalog-cache warning; independent database verification must establish the actual state before publication.

CLI behavior reference: https://supabase.com/docs/reference/cli/supabase-db-push — db push compares local files with remote history; `--dry-run` previews the pending set. No SQL Editor substitute or hand-built migration history is permitted.

CR7-R14 — HOLD /
SECURITY ROLLOUT OR VERIFICATION INCOMPLETE
