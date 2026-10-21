# CR7-R14B — installed security verification and isolated Preview publication

21 October 2026. Target: `hvcggnuptrcsxtrcjnre` only. Commercial Launch remains NOT AUTHORIZED; CR7 closure remains HOLD. No account-date migration, new Auth user or synthetic business row is authorized by this security rollout.

## A. Database migration confirmation

The human reported normal linked CLI application of `202610150002_cr7_allocation_read_boundary.sql`. The Docker catalog-cache warning was not treated as proof of remote state. The agent did **not** rerun db push, apply SQL in the editor, repair history or change permissions manually.

Independent native PostgreSQL snapshot on backend **266206**, captured `2026-10-21 12:23:15.940187+00`, confirms the intended permanent change. Candidate SHA-256 remains `23625b5e855bd7b539e8b44f2fcf2bd1f5a34f27d834efaf494540c9f2466c1d`.

## B. Exact migration history

Installed count **89**, latest **202610150002**, security migration recorded **once**, account-date **202610150001 recorded zero times**. A second live verification on backend **266882** independently asserted these exact values. The separate account-date file is absent from this isolated checkout; the original dirty staging checkout and that candidate are preserved.

## C. Grants, RLS and trusted access

Compared with the fresh pre-application native baseline, only these two entries were removed:

- authenticated SELECT on `public.journey_supplier_allocations`;
- authenticated SELECT on `public.journey_supplier_allocation_history`.

No ACL entries were added. Table and column ACLs were compared canonically. All 12 catalog fingerprint groups are unchanged, including RLS policies, function definitions/security/search paths, triggers, constraints, views, namespace/default privileges and role memberships/settings. Thus no unrelated privilege or RLS change is hidden behind a count-only check.

`scripts/sql/cr7-r14-installed-security-verification.sql` ran within `BEGIN READ ONLY` / `ROLLBACK`, with bounded timeouts and no DDL, DML, permanent objects or business-command execution. It returned `INSTALLED_SECURITY_READ_ONLY_ASSERTIONS_PASS` after ROLLBACK on backend **266882**. Actual SQL under authenticated and anon roles denied sensitive allocation/history SELECT with controlled 42501 handling; service_role SELECT still compiled. The safe authenticated audit metadata view remained accessible. These are SQL-role tests, not live distinct-staff JWT sessions.

Command EXECUTE remains service_role-only for save, transition, fulfil and fulfilment-update functions; anon/authenticated cannot invoke them directly. No broad private-schema USAGE was granted to anon, authenticated or service_role. Three accepted-design guards and four validated finance snapshot checks remain installed. Pure precision validation accepts 1.23 and rejects 1.234.

## D. Protected baseline

Exactly one table fingerprint changed: `supabase_migrations.schema_migrations`, as expected for the new record. All other **59** table fingerprints match, including **all 53 public tables**, four Auth tables and two Storage tables. The comparison uses the same native server-side method as R13/R14; no function text copied from a dashboard is hashed.

Supplier baseline **10 accommodations / 6 guides / 10 vehicles**; pricing plans **0**; original pricing NULLs **13**. All journey/enquiry/proposal/allocation/account/finance/history/command-receipt business tables remain empty. Protected CR5 counts/digests remain **4 applications / 4 file records / 4 history records**. Auth **1 user / 1 Super Admin**, Storage **4 buckets / 4 objects**, account sequence **2 / is_called=true**, cleanup hooks all inactive. No sequence reset or business cleanup was performed.

## E. API redaction and isolated artifact

Only the reviewed security runtime changes are included: `app/api/admin/journey-allocations/route.ts` and `lib/admin/allocation-projection.ts`. All four response sites use the explicit role/capability DTO: GET, batch save, fulfilment, retirement. Fulfilment receipt fields are limited to enquiryId, allocationId, status and idempotent. Future/raw allocation fields and arbitrary command-result fields are not serialized.

Designer receives proposal-selling information but no supplier costs/private contact snapshots; Operations retains necessary delivery contact/notes but no costs or selling price; Finance retains authorized financial fields but no private delivery prose/contact snapshots; allocators/Super Admin retain their legitimate capability-scoped fields. Some stable contract fields are present as null/empty objects when redacted, not necessarily absent as JSON keys. Unknown fields are omitted entirely.

Actual route/authentication/projection tests use in-memory database/network boundaries and canary private fields. They cover authorized GET/fulfilment, denied actions, replay, already-fulfilled rejection and retirement financial protections. Save/retirement response source sites use the same projection. Customer proposal DTO/export/acceptance logic is unchanged and its existing confidentiality tests pass. No new fulfilment/save/retire event or customer proposal was created.

The account-date/R12 prompt and proposal-content changes, hero/audio/Ceylo work, environment/configuration edits and .DS_Store are excluded. No unrelated runtime file or dependency manifest/lockfile is changed.

### Local release validation

Full suite: **426 passed / 0 failed / 1 intentional skip**, 427 registered. The skip is only the optional hash check for the account-date file deliberately excluded from the isolated security checkout. The exact migration inventory is independently asserted as 89 files, including security002 but not account001. TypeScript, changed-file ESLint, normal production build and diff checks PASS. Build content fallback is not evidence of live staging content or credentials.

Logs: `/private/tmp/cr7-r14b-isolated-full.log`, `/private/tmp/cr7-r14b-isolated-typescript.log`, `/private/tmp/cr7-r14b-isolated-eslint.log`, `/private/tmp/cr7-r14b-isolated-build.log`.

## F. Deployment publication checkpoint

Prepared from verified source SHA `d8f1ff03f651da53a3d5a2f112fab9f0d110aea7` in the separate `roamceylon-cr7-r14-security` worktree. The remote staging branch was independently confirmed at that SHA before publication. Only the isolated security artifact, exact migration and supporting security tests/SQL/docs are selected for the commit. No force push or Production branch update is permitted.

Publication and immutable deployment/commit verification are pending at this document's initial commit checkpoint. This section will be completed locally from the resulting Git/Vercel evidence; it is not a claim of an already deployed fix.

## G. Staging environment / alias

Vercel UI independently confirms the `commercial-readiness/staging` Preview override for `NEXT_PUBLIC_SUPABASE_URL` is **https://hvcggnuptrcsxtrcjnre.supabase.co**. The publishable key and secret service-role key are scoped to the same Preview branch; secret values were not revealed or copied. Production-scoped values were not opened or changed.

Vercel Authentication **Require Log In enabled / Standard Protection**, no listed domain exceptions, no automation bypass secret; settings were not changed. Intended persistent alias: https://roam-ceylon-git-commercial-readiness-staging-roam-ceylon.vercel.app/ . New-deployment alias, immutable source and protected HTTP checks remain required after publication.

## H. Live-role coverage and gaps

No distinct Designer, Operations or Finance Auth sessions/identities were created. Local real-handler tests and native SQL SET ROLE evidence are not represented as actual distinct-role JWT/PostgREST proof. The only existing approved identity baseline is one Super Admin. Deployed session/anonymous/navigation checks will be recorded separately; absence of business rows means response value-redaction evidence comes from release-source linkage plus canary tests, not a fabricated populated live response. A fresh successful fulfilment or valid traveller proposal cannot be demonstrated without new separately authorized business fixtures.

## I. Production and historical isolation

No Production or historical-stabilization database operations, credentials, source modifications, deployments, promotions, permission changes or launch authorization. No new Auth user, supplier, journey, financial record or real communication/payment. No CR8/CR9 advancement. Git publication is restricted to `commercial-readiness/staging` and protected Preview only.

## J. Ceylo demo decision

Pending matching deployment and independent deployed verification. This security rollout alone does not close CR7, resolve excluded R12/pre-launch findings, verify a real supplier network or authorize Commercial Launch. If the security publication passes, only the separately scoped Ceylo demo work may resume under its own isolation and approval requirements.
