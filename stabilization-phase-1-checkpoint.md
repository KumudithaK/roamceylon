# Roam Ceylon Stabilization Phase 1 - Checkpoint & Authorization Baseline

Date: 12 August 2026

Execution mode: checkpoint, read-only discovery and isolated-test infrastructure only

Production behavior change: none

## 1. Executive Summary

The audited application state and all five Markdown audits are preserved in Git. A documentation-only checkpoint, recovery branch and annotated tag all point to commit `d28d81a01eb10cd6341b6df4f2d71d5866774bf1`. Existing tests and typecheck pass; lint and the Google Fonts-dependent production build retain their known failures. A narrow authorization harness now exists, refuses the live project, uses only synthetic isolated identities, and can measure database and Storage ALLOW/DENY behavior without changing application code or policies.

Phase 1 is **PARTIAL**. The linked Supabase project has no provider backup restore point reported by the CLI and PITR is disabled. The logical dump attempt was blocked because Docker Desktop is unavailable. No isolated restored project or synthetic staff identities were supplied, so restore proof and role/mutation authorization execution could not be completed. Two known data-boundary findings were reproduced safely through anonymous read-only probes; no production mutation was attempted.

## 2. Phase 1 Status

**PARTIAL**

Completed: Git checkpoint, audit preservation, environment inventory, active-source aggregate baseline, migration parity check, existing check baseline, authorization architecture discovery, isolated-only harness and anonymous read-only evidence.

Blocked gates: valid database backup, isolated restore proof, synthetic role identities and executable staff/mutation matrix.

## 3. Git Baseline

| Item | Value |
|---|---|
| Master-plan baseline SHA | `a500b849d87d224224b6dd601aabac34ca5afa36` |
| Current starting SHA | `a500b849d87d224224b6dd601aabac34ca5afa36` |
| Documentation checkpoint SHA | `d28d81a01eb10cd6341b6df4f2d71d5866774bf1` |
| Backup branch | `backup/pre-stabilization-20260812` -> `d28d81a01eb10cd6341b6df4f2d71d5866774bf1` |
| Annotated tag | `pre-stabilization-20260812` -> `d28d81a01eb10cd6341b6df4f2d71d5866774bf1` |
| Working branch | `agent/premium-experience-showcase` |
| Remote action | No push performed |

The starting SHA matched the master plan exactly. `next-env.d.ts` was already modified by the local Next.js development runtime (`.next/dev/types/routes.d.ts`) when Phase 1 began. It is unrelated, was excluded from every checkpoint commit, and was not reset or edited by this phase.

Final status after the Phase 1 artifact commit is expected to retain only that pre-existing `next-env.d.ts` modification. The verified final command output is recorded in the phase handoff.

## 4. Preserved Audit Artifacts

The documentation checkpoint contains only:

- `audit-1-architecture-code-quality.md`
- `audit-2-security-privacy.md`
- `audit-3-business-logic-data-integrity.md`
- `audit-4-performance-weight-scalability.md`
- `audit-5-ux-accessibility-uat.md`
- `stabilization-master-remediation-plan.md`

Documentation SHA-256 values recorded at checkpoint time:

| Artifact | SHA-256 |
|---|---|
| Audit 1 | `bc5271b87585597453385dda88fd50cc907290d2fb43c3820b066b423f8b91f5` |
| Audit 2 | `08ba947cc1cab785dcbf6df918a6b9857af264bc1ceba89de0789a76a48dc748` |
| Audit 3 | `d48600ff64390fc0a08f69d6d2f4fe52d87850aa9b72166e10b4493a0afdb474` |
| Audit 4 | `9b7d8fe7b06eb667a6aa5e0e411a4f3c75c08606c4d8f816aae72d07903023c6` |
| Audit 5 | `0239c438543967b4d51cb91b8fee985490cc243ee74a14098596d8813c3e023b` |
| Master plan | `79da9089fd78b66407f1e08ffc4c71f6c2db70baba1a1a00d1eed5954983b8a4` |

## 5. Database Backup Status

**BLOCKED - HUMAN ACTION REQUIRED**

Read-only provider inspection returned:

- Project region: `ap-northeast-2`
- Available backup list: none reported
- PITR: disabled
- WAL-G capability flag: enabled, but no restorable backup was returned

A linked logical schema dump was attempted into `/tmp/roam-stabilization-phase1/`, outside Git. Supabase authenticated successfully and reached "Dumping schemas from remote database", then stopped because Docker Desktop is unavailable. The resulting zero-byte file is not a backup and must not be used or checksummed as one.

Exact human action required:

1. Install and start Docker Desktop.
2. Confirm a secure, encrypted directory outside the repository for sensitive dumps.
3. Create schema, data and role dumps with the linked Supabase CLI; never commit them.
4. Enable/verify an appropriate provider-managed backup or PITR plan for the live project.
5. Create a separate non-production Supabase project and restore the checkpoint there.
6. Record successful restore time, artifact checksums and safe aggregate reconciliation.

No database data, schema, grants, RLS or Storage policy was changed.

## 6. Database Restore Verification

**BLOCKED** - no valid backup artifact and no isolated restore target were available.

The active linked project was queried read-only to preserve source aggregate counts for the future restore comparison:

| Domain/table | Source count |
|---|---:|
| Themes | 9 |
| Destinations | 33 |
| Experiences | 142 |
| Accommodations | 10 |
| Vehicles | 11 |
| Guides | 6 |
| Pricing plans | 9 |
| Enquiries | 26 |
| Curated journeys | 3 |
| Supplier allocations | 80 |
| Proposal versions | 16 |
| Proposal acceptances | 1 |
| Journey accounts | 11 |
| Accounting transactions | 60 |
| Settlements | 106 |
| Journey benefits | 1 |

All 70 local migrations matched the remote migration history. Latest migration: `202608110002_preferred_benefits_and_privileges.sql`.

These counts prove only the current source baseline. They do **not** constitute restore proof.

## 7. Backup Checksums

No valid database backup artifact exists, so no database-backup checksum is claimed.

| Artifact | Timestamp (UTC) | Checksum/status |
|---|---|---|
| Logical schema dump attempt | 2026-08-12 | Invalid zero-byte artifact; excluded |
| Audit/master documentation | 2026-08-12T00:20:00Z checkpoint review | SHA-256 values in Section 4 |
| Migration catalogue | 2026-08-12T00:20:00Z | 70 local/remote entries matched |

Database dump checksums must be added only after successful, non-zero artifacts are created in the secure external location.

## 8. Secret-Free Environment Inventory

| Item | Baseline |
|---|---|
| Operating system | Darwin 24.4.0 arm64 |
| Node.js | 25.6.1 |
| npm | 11.9.0 |
| Next.js installed | 16.2.12 |
| Supabase JS installed | 2.110.8 |
| Supabase CLI | 2.109.1 |
| App/package | `roam-ceylon-v2` 2.0.0 |
| Supabase project reference | `fstpfqlgypvktjwdeagu` |
| Local Supabase config ID | `roamceylon` |
| Deployment/runtime | Next.js Node runtime; production host not established in repository configuration |

Environment variable names in local templates/runtime source (values never recorded):

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NODE_ENV`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_URL`

The isolated harness additionally defines only names under `AUTHZ_TEST_*` and `AUTHZ_FIXTURE_*`; its committed example contains no values.

Storage buckets defined by migrations:

- `travel-content` - public read; legacy admin/editor write policies
- `partner-application-media` - private
- `partner-application-documents` - private
- `accounting-receipts` - private

Important configuration SHA-256 values:

| File | SHA-256 |
|---|---|
| `package.json` | `7349caa9d14abdd1b57ba25bd6cd6cfe0afa714c2dd5dc64eab6211f477cb67a` |
| `package-lock.json` | `46a7ca77612014c26326410af246feb03ff63c7da06dfe3560c7be90e078de78` |
| `next.config.ts` | `4a0febe2282eeeac4652d965e096c5acbc6a00d4f999f405469294bb4d106155` |
| `tsconfig.json` | `ce8f2b44d8b4e483d2e032fee3bf999c99e70c2c8a62384d9858f8cdda31ea1f` |
| `eslint.config.mjs` | `50ae922401fd8a6f9816b7b7c65526530c94804451a9cad251d1ed0868c9568a` |
| `supabase/config.toml` | `5b9b443492d16b09cadae6ee141d962e2a42389d9ec5e50d8755b12563f967a8` |
| `.env.example` | `1dfe27b57b2436b25d264db8a1ec3dbd86fcc610cb0d7e97b8b6d1c6e80ee5aa` |

## 9. Existing Test/Build Baseline

No finding was corrected.

| Command | Result | Duration | Important baseline |
|---|---|---:|---|
| `npm test` | PASS | 2.04 s wall | Existing 132 tests pass; repeated `MODULE_TYPELESS_PACKAGE_JSON` warnings remain |
| `npx tsc --noEmit` | PASS | 1.57 s wall | No TypeScript errors |
| `npm run lint` | FAIL | 8.69 s wall | Known 7 errors and 3 warnings; primarily synchronous state updates inside effects |
| `npm run build` | FAIL | 18.43 s wall | Turbopack cannot fetch Manrope and Playfair Display from Google Fonts in this environment |

The build reported Next.js 16.2.12 and loaded `.env.local`. No dependency or configuration was changed to alter these results.

## 10. Current Authorization Architecture

1. `profiles.role` remains the legacy identity authority with `admin`, `editor` and `partner` values.
2. `staff_roles`, `permissions`, `staff_role_permissions` and `profile_staff_roles` define the newer capability model.
3. `private.has_permission(text)` returns true for every legacy `admin`, otherwise resolves assigned role permissions.
4. `private.has_role(profile_role[])` remains active in many older CMS, supplier, pricing, partner, relationship and Storage policies.
5. `authenticatedStaff` validates a bearer token using the server admin client, requires legacy role `admin` or `editor`, grants every permission to `admin`, and resolves assignments for `editor`.
6. Most newer Admin APIs call `authenticatedStaff` with a named capability. Allocation reads use a capability union.
7. Legacy quote and partner-conversion APIs still check only `profiles.role in ('admin','editor')`.
8. Accounting close/reversal routes combine capability checks with a further legacy `profile.role === 'admin'` condition.
9. UI navigation uses capability names, but hidden navigation is not an authorization boundary.
10. RLS is mixed: curated/proposal/accounting additions use capabilities in many places, while older content, suppliers, pricing, partner records and `travel-content` writes retain broad admin/editor rules.

This explains the ARC-001/SEC-001 bypass: the capability model exists, but legacy role authorization remains a parallel authority.

## 11. Test Identity Matrix

The committed harness expects synthetic users only:

| Test identity | Current legacy profile | Staff role fixture | Status |
|---|---|---|---|
| Anonymous/public | None | None | Ready for read-only probes |
| Journey Designer | `editor` | `journey_designer` | Blocked - isolated credentials absent |
| Partner Manager | `editor` | `partner_manager` | Blocked - isolated credentials absent |
| Finance | `editor` | `finance` | Blocked - isolated credentials absent |
| Operations | `editor` | `operations` | Blocked - isolated credentials absent |
| Content | `editor` | `content_marketing` | Blocked - isolated credentials absent |
| Super Admin | `admin` | `super_admin` | Blocked - isolated credentials absent |

Using `editor` for non-super staff is required to measure the current `authenticatedStaff` and legacy RLS behavior. This is a test description, not a recommendation for the target design.

## 12. Executable Authorization Baseline

Created:

- `tests/authorization-baseline.mjs`
- `tests/authorization-baseline.env.example`

The harness:

- uses the installed Supabase JS dependency;
- requires an explicitly declared isolated project;
- hard-blocks the live project reference;
- never embeds passwords, tokens or keys;
- authenticates one synthetic identity per staff role;
- verifies fixture existence through the synthetic Super Admin before role probes;
- records current expectation, actual result, target expectation, target verdict and audit ID;
- leaves mutations disabled unless `AUTHZ_TEST_ENABLE_MUTATIONS=true` is explicitly set;
- performs same-value update probes only against disposable fixtures;
- removes synthetic Storage probe objects immediately after a successful probe;
- exits `1` for target failures and `2` for blocked/incomplete execution.

Harness safety validation:

| Validation | Result |
|---|---|
| Missing isolated configuration | PASS - exits 2 with BLOCKED message |
| Live project reference supplied | PASS - exits 2 before network or mutation |
| JavaScript syntax | PASS (`node --check`) |
| Full isolated role matrix | BLOCKED - environment and identities unavailable |

## 13. Known Authorization Failures Reproduced

Anonymous probes used the publishable key and selected at most one row. Only counts and booleans were logged; no PII values were printed.

| Role | Resource | Action | Current expectation | Actual result | Target expectation | Target verdict | Audit ID |
|---|---|---|---|---|---|---|---|
| Anonymous | Published guide base row: phone/email/licence fields | READ | ALLOW under current published-row policy | ALLOW; 2 visible rows, a non-empty sensitive field observed | DENY base row; public DTO only | FAIL | SEC-003 |
| Anonymous | Published accommodation base row: phone/email fields | READ | ALLOW | ALLOW; 4 visible rows, a non-empty sensitive field observed | DENY base row; public DTO only | FAIL | SEC-003 |
| Anonymous | Published vehicle base row: phone/email fields | READ | ALLOW | ALLOW; 3 visible rows, a non-empty sensitive field observed | DENY base row; public DTO only | FAIL | SEC-003 |
| Anonymous | Website setup checklist/dismissed fields | READ | ALLOW | ALLOW; one row and non-empty setup state observed | DENY internal setup state; public settings DTO only | FAIL | SEC-013 |
| Anonymous | Enquiry email/phone | READ | DENY through RLS | No visible rows | DENY | PASS | Baseline |
| Journey Designer | CMS/supplier updates | UPDATE | Legacy editor permits | BLOCKED - no isolated identity/fixture | DENY unless exact capability | BLOCKED | ARC-001/SEC-001 |
| Staff roles | Legacy quote/partner-conversion API | ACTION | Admin/editor permits | BLOCKED - no isolated deployment/identities | Exact capability | BLOCKED | SEC-005 |
| Finance/Operations | Full enquiry base row | READ | Current capability policy exposes full row | BLOCKED - no isolated identities | Purpose-redacted DTO only | BLOCKED | SEC-008 |

**Known security findings reproduced: 2** (`SEC-003`, `SEC-013`) through four read-only failing probes. ARC-001/SEC-001, SEC-005 and SEC-008 remain source-confirmed but executable execution-blocked. SEC-014/TEST-001 is partially addressed by creating the harness; it is not closed until the isolated matrix runs.

## 14. Blocked Tests / Human Actions

1. **Database backup:** start Docker Desktop and generate secure external logical dumps; verify provider backup/PITR.
2. **Restore target:** provision a separate Supabase project with no production integrations.
3. **Restore:** restore the database backup into that project and reconcile Section 6 counts, migration history and constraints.
4. **Synthetic identities:** create the seven fixtures in Section 11 with non-real emails and no employee data.
5. **Disposable records:** seed the IDs named in `tests/authorization-baseline.env.example`.
6. **Harness execution:** first run with mutations false; review results; then explicitly enable mutations in the isolated project only.
7. **API matrix:** deploy the checkpoint app against the isolated project or run it locally against that project before testing legacy Admin actions.
8. **Storage verification:** confirm the four buckets exist in the restored project, then run synthetic upload/remove probes.

No dependency installation is required for the harness.

## 15. Recovery Procedure

### Git recovery reference

1. Preserve any current work separately; never reset over user changes.
2. Inspect `pre-stabilization-20260812` or `backup/pre-stabilization-20260812`.
3. Create a new recovery branch from `d28d81a01eb10cd6341b6df4f2d71d5866774bf1` rather than moving the backup reference.
4. Verify the six documentation checksums in Section 4.

### Database recovery reference

Database recovery is not yet proven. After the human actions in Section 14:

1. Select the provider restore point or verified logical dump whose timestamp/checksum is recorded.
2. Restore into an isolated project first, never over the active project.
3. Verify 70 migration entries, required tables/functions/policies/grants/buckets and Section 6 aggregate counts.
4. Run relationship/constraint checks without exposing PII.
5. Only after signed human review may a production recovery be scheduled.

### Storage and configuration

- Preserve Storage object metadata and private-bucket access policy with the database backup; back up object bytes separately if provider backup does not include them.
- Restore `travel-content`, partner application buckets and `accounting-receipts` with original privacy flags.
- Recreate environment values from the authorized secret manager using only the variable-name inventory in Section 8.
- Verify config files against Section 8 checksums; never recover secret values from Git.

## 16. Phase 1 Exit Criteria

- [x] Audit/master plan checkpoint preserved
- [x] Immutable Git recovery reference exists
- [ ] Database backup exists or provider backup is verified
- [ ] Database restore proven in isolation
- [x] Environment inventory contains no secrets
- [x] Existing test/build baseline recorded
- [ ] Synthetic role identities available in isolation
- [x] Executable authorization harness exists
- [~] Current authorization behavior recorded for anonymous reads; staff/mutations blocked
- [~] Known failures reproduced where safe; blocked cases explicitly documented
- [x] No production behavior changed

Because backup/restore and isolated execution gates are not satisfied, Phase 1 cannot be marked complete.

## 17. Recommendation for Phase 2

**Do not start Phase 2 yet.** First complete the database backup, isolated restore, synthetic identities and full authorization harness execution. Human review must confirm that the red baseline reflects current behavior and that recovery is proven.

Only after every Phase 1 exit criterion is satisfied should a separate prompt authorize:

**Phase 2 - Public Supplier / Settings Data Boundary**

No supplier DTO, settings DTO, RLS, Storage policy or application behavior remediation was implemented here.

## 18. Phase 1B Completion

Phase 1B resumed on 12 August 2026 after Docker Desktop was started. It completed the Docker and logical-schema-artifact checks, then stopped at the isolated-target gate as required. Phase 2 was not started.

### Docker verification

**READY**

The operator-provided `docker --version` and `docker info` output confirms Docker Desktop 29.7.2 with a live 29.7.2 Linux server on `desktop-linux`. The Supabase PostgreSQL utility image was subsequently pulled and used successfully by the linked schema dump.

### Git safety verification

| Item | Verified value |
|---|---|
| Working branch | `agent/premium-experience-showcase` |
| Phase 1 artifact commit at resumption | `61309e8b553b3563309c87f7f5900c69baf002af` |
| Backup branch | `backup/pre-stabilization-20260812` -> `d28d81a01eb10cd6341b6df4f2d71d5866774bf1` |
| Annotated tag target | `pre-stabilization-20260812` -> `d28d81a01eb10cd6341b6df4f2d71d5866774bf1` |

The pre-existing generated `next-env.d.ts` change remains untouched. No reset, checkout or discard operation was used.

### Backup artifacts and verification

The linked Supabase schema dump completed successfully and is stored outside Git:

| Artifact | Path | Size | Timestamp (Asia/Colombo) | SHA-256 | Verification |
|---|---|---:|---|---|---|
| Logical schema | `/tmp/roam-stabilization-phase1/pre-stabilization-schema.sql` | 201,177 bytes | `2026-08-12T09:30:43+0530` | `a011e830b757cc74c200c492253270033592d1beba703d3bf15ffda6a8d2e6eb` | Supabase dump exit 0; non-zero ASCII SQL; 4,734 lines, 46 tables, 19 functions and 121 policies detected |

The schema artifact is **VERIFIED AS A SCHEMA ARTIFACT**. It is not by itself a complete recoverable database backup.

Data-only and role-only dump attempts did not run because the Codex execution sandbox cannot read the operator's Supabase CLI login credential stored outside the workspace. They failed before connecting with `Access token not provided`; no database mutation occurred and no incomplete artifact is accepted as a backup.

Provider status was rechecked and remains:

- managed backup restore points returned: none;
- PITR: disabled;
- WAL-G capability flag: enabled, but no restorable backup was returned;
- region: `ap-northeast-2`.

Therefore the Phase 1 **valid database backup gate remains BLOCKED** until schema, data and roles are all preserved, verified and restore-tested. Enabling a paid backup/PITR plan remains a human business decision and was not attempted.

### Isolated restore target and recovery proof

**BLOCKED - HUMAN ACTION REQUIRED**

No `AUTHZ_TEST_*` target values or other clearly disposable Supabase project are configured. The only configured application project is the live project, which the harness correctly refuses. Creating a separate Supabase project requires organization/account selection and may require a billing decision or browser action. Under the Phase 1B stop rule, Codex did not create a project, did not restore over production and did not improvise with the live project.

Because there is no isolated target:

- restore verification was not run;
- the expected 70 migrations and source aggregate counts were not reconciled in a restored database;
- no synthetic identities were created;
- no disposable fixtures were created;
- the staff or mutation authorization matrix was not run;
- the legacy API authorization baseline remains blocked;
- isolated Storage upload/remove probes remain blocked.

### Authorization evidence status

The anonymous, read-only evidence already recorded in Section 13 remains valid. The known findings reproduced without production mutation are:

- `SEC-003`
- `SEC-013`

`ARC-001/SEC-001`, `SEC-005`, `SEC-008` and closure evidence for `SEC-014/TEST-001` remain execution-blocked until the isolated restore, synthetic identities and fixtures exist.

### Exact remaining human actions

1. From an operator terminal already authenticated with Supabase CLI, create the remaining sensitive dumps outside Git:

   ```bash
   cd /Users/kumudithakk/Documents/Codex/2026-07-25/use-the-uploaded-roam-ceylon-html/roamceylon
   SUPABASE_TELEMETRY_DISABLED=1 npx supabase db dump --linked --data-only --use-copy --file /tmp/roam-stabilization-phase1/pre-stabilization-data.sql
   SUPABASE_TELEMETRY_DISABLED=1 npx supabase db dump --linked --role-only --file /tmp/roam-stabilization-phase1/pre-stabilization-roles.sql
   ```

2. Create a separate disposable Supabase project, suggested name `roamceylon-stabilization-test`, in the appropriate organization. It must have no production integrations and must not use project ref `fstpfqlgypvktjwdeagu`.
3. Keep all keys/passwords out of Git and chat. Configure them locally using the variable names in `tests/authorization-baseline.env.example`; provide only the new non-production project ref to identify the target.
4. Resume Phase 1B so Codex can checksum the remaining dumps, restore them into that isolated project, reconcile the baseline, create synthetic identities/fixtures and execute the authorization matrix.

### Re-evaluated Phase 1 exit gate

- [x] Audit/master plan checkpoint preserved
- [x] Immutable Git recovery reference exists
- [ ] Valid complete database backup exists
- [ ] Database restore proven in isolation
- [x] Environment inventory contains no secrets in the report
- [x] Existing test/build baseline recorded
- [ ] Synthetic role identities available in isolation
- [x] Executable authorization harness exists
- [~] Anonymous authorization behavior recorded; staff and mutation behavior blocked
- [~] `SEC-003` and `SEC-013` reproduced; remaining executable cases blocked
- [x] No production behavior changed

Final Phase 1 status remains **PARTIAL**. Production mutations: **NONE**. Application remediation: **NONE**. Ready for Phase 2: **NO**.

STABILIZATION PHASE 1B FINISHED — PHASE 2 NOT STARTED

## 19. Phase 1C Completion

Phase 1C resumed on 12 August 2026 after the operator created the isolated Supabase project and completed the two remaining logical dumps. Backup validation passed. The operator then configured an ignored, mode-`600` local environment file for the isolated project. Execution stopped because the Codex filesystem sandbox cannot access Docker Desktop's Unix socket, which the available Supabase/PostgreSQL restore tooling requires. No restore, isolated mutation or production action was attempted.

### Backup validation

**VERIFIED**

All artifacts are non-zero, terminate cleanly, contain no `pg_dump` error/fatal marker and are stored outside Git under `/tmp/roam-stabilization-phase1/`.

| Artifact | Size | Timestamp (Asia/Colombo) | SHA-256 | Structural verification |
|---|---:|---|---|---|
| `pre-stabilization-schema.sql` | 201,177 bytes | `2026-08-12T09:30:43+0530` | `a011e830b757cc74c200c492253270033592d1beba703d3bf15ffda6a8d2e6eb` | 4,734 lines; 46 tables; 19 functions; 121 policies |
| `pre-stabilization-data.sql` | 1,300,700 bytes | `2026-08-12T09:40:51+0530` | `fa250f095a5dc9cdbb9cda52f8fe14640b558a97a8ab66fa45d365ff7e423878` | 2,075 lines; 75 COPY blocks and 75 terminators; includes 46 public tables plus Auth users/identities and Storage buckets/objects |
| `pre-stabilization-roles.sql` | 370 bytes | `2026-08-12T09:41:08+0530` | `168a95a9c745af5ed4679751f90419ac9dc434240a213b03e32a06d5664c2308` | 15 lines; three role alterations and one grant; structurally complete for the CLI role-only export |

The data artifact does not contain the `supabase_migrations.schema_migrations` catalogue. That hosted Supabase CLI bookkeeping is not part of the logical application dump and is not claimed as restored. The immutable repository inventory of 70 migration files is the historical reference; application/schema fidelity is verified independently below.

These files contain sensitive database material. They remain untracked and must not be committed. `/tmp` is not durable storage; after restore proof, the operator should copy the verified set to an approved encrypted backup location using the recorded checksums.

### Isolation verification

| Check | Result |
|---|---|
| Authorized isolated project | `xnsxmwgyugoqanuoyebh` |
| Production project | `fstpfqlgypvktjwdeagu` |
| Target differs from production | PASS |
| Harness production-ref denial retained | PASS |
| Existing workspace link | Still points to production; not changed or used for restore |
| Production integrations used | NONE |

The new project is explicitly authorized as disposable. `.env.authz.local` passed all non-secret safety checks: required values are present, the declared ref and URL exactly match the isolated project, the isolated flag is true, the database URL contains the isolated ref, the production ref is absent, permissions are `600`, and Git ignores the file.

### Restore and reconciliation

**BLOCKED - RESTORE COMMAND MUST RUN FROM THE OPERATOR TERMINAL**

The isolated credentials are configured safely, but the Codex sandbox is denied access to `/Users/kumudithakk/.docker/run/docker.sock`. The Docker-backed Supabase connection probe therefore fails before connecting. The repository remains linked to production and was deliberately not relinked. Relinking or substituting production was explicitly rejected.

Consequently:

- schema/data/roles were not restored;
- 70-migration parity and latest migration `202608110002_preferred_benefits_and_privileges.sql` were not verified on the isolated project;
- baseline counts, relationships, constraints, functions, grants and policies were not reconciled;
- no synthetic staff identities or disposable fixtures were created;
- read-only and mutation staff authorization matrices were not executed;
- legacy API and isolated Storage baselines were not executed.

### Exact remaining human action

From the normal Mac Terminal, in the repository directory, run the guarded Docker restore command supplied in the Phase 1C handoff. It reads the already-configured ignored environment file, rejects any URL without the isolated ref or containing the production ref, and restores roles, schema and data in one transaction. Return only the command's success/error output; never print the environment file or connection string.

### Re-evaluated Phase 1 exit gate

- [x] Audit/master plan checkpoint preserved
- [x] Immutable Git recovery reference exists
- [x] Valid logical backup artifacts exist
- [x] Backup checksums recorded
- [ ] Database restore proven in isolation
- [ ] Migration/schema/data reconciliation completed
- [x] Existing test/build baseline recorded
- [ ] Synthetic role identities available
- [x] Executable authorization harness exists
- [ ] Staff authorization behavior executed
- [ ] Mutation authorization behavior executed safely
- [~] Anonymous known failures reproduced; staff/API/Storage cases remain blocked
- [x] No production behavior changed
- [x] No production data/schema/RLS mutated

Final Phase 1 status remains **PARTIAL**. Backups: **VERIFIED**. Isolated project: identified and authorized, connection **BLOCKED**. Production project modified: **NO**. Application remediation: **NONE**. Phase 2 ready: **NO**.

STABILIZATION PHASE 1C FINISHED — PHASE 2 NOT STARTED

### Phase 1C manual restore diagnostics

Two manual isolated restore attempts were reported after the initial Phase 1C handoff:

1. The first attempt failed inside the immutable roles dump at line 13 on `GRANT SET ON PARAMETER "log_min_messages" TO "supabase_realtime_admin"` with permission denied. This is a hosted Supabase provider-role/server-logging grant and is not used by application JWT roles, table grants, RLS, Storage authorization or the staff capability baseline. The original roles artifact remains unchanged at SHA-256 `168a95a9c745af5ed4679751f90419ac9dc434240a213b03e32a06d5664c2308`. A restore-only derivative omitting only that statement was created outside Git at `/tmp/roam-stabilization-phase1/pre-stabilization-roles.restore.sql`, SHA-256 `0867bd8085fd6f1064997ce04fd1fec79e3e91a5dbee8af35b4ce4743ee9e3c8`.
2. The next invocation passed the exact isolated-project guard and empty-project preflight, then failed during the single-transaction restore. `ON_ERROR_STOP=1` and `--single-transaction` were active. The script's cleanup trap deleted the temporary private log on exit, so the exact PostgreSQL statement/error from this attempt is no longer recoverable and must not be guessed. The failure is currently **unclassified** pending retained diagnostic evidence.

The restore script was corrected without executing another restore. Future output is redirected to `/tmp/roam-stabilization-phase1/restore-diagnostics/restore.log`, stored with mode `600`, outside Git, and never printed by the script. The backup directory remains mounted read-only; only the separate diagnostics subdirectory is writable. Atomic restore behavior, `ON_ERROR_STOP=1`, production-ref rejection, exact isolated-ref validation and zero-state preflight remain intact.

Phase 1 remains **PARTIAL**. Restore proof, reconciliation, synthetic identities and authorization matrix execution remain blocked. Production project modified: **NO**. Application remediation: **NONE**. Phase 2 started: **NO**.

### Phase 1C retained-log diagnosis and correction

A diagnostic retry passed the isolated-project guard and all five zero-state preflight counts, then failed atomically. The retained mode-`600` log was parsed without printing row, detail or context content. It contains one PostgreSQL error:

- artifact: `pre-stabilization-data.sql`;
- line: 2001;
- statement: empty `COPY` into provider-managed `storage.buckets_vectors`;
- error: `permission denied for table buckets_vectors`;
- classification: Supabase provider-managed object/privilege incompatibility.

The block contained zero rows and consisted only of the `COPY` declaration and its immediate terminator. `storage.buckets_vectors` is part of the hosted Supabase Storage implementation, is not created by the application schema dump, is absent from application migrations/source usage, and does not participate in application roles, capabilities, RLS policies, triggers, functions or authorization behavior. The hosted project database role legitimately cannot write it.

The immutable data backup remains unchanged at SHA-256 `fa250f095a5dc9cdbb9cda52f8fe14640b558a97a8ab66fa45d365ff7e423878`. A restore-only derivative was created outside Git at `/tmp/roam-stabilization-phase1/pre-stabilization-data.restore.sql`, SHA-256 `ecd4900f0b82ca736d3f4a3f052c538f3be670ef417d7030bc56165647068259`. It differs only by omission of the proven-empty two-line `storage.buckets_vectors` COPY block: 74 COPY blocks and 74 terminators remain, compared with 75/75 in the immutable source.

The restore script now uses this data derivative, retains `ON_ERROR_STOP=1` and `--single-transaction`, and verifies SHA-256 for all three immutable backups and both restore-only derivatives before connecting. Production rejection, exact isolated-target validation, empty-project preflight and private diagnostic retention remain unchanged. The script was syntax-checked and was not executed by Codex.

The reported failure was inside the single transaction and the script returned failure, so the attempt rolled back. Restore proof remains pending the next manual isolated retry. Phase 1 remains **PARTIAL** and Phase 2 was not started.

### Phase 1C second retained-log diagnosis

The next manual retry again passed the exact target guard and all zero-state preflight checks, then failed atomically. The current private log contains one error:

- artifact: `pre-stabilization-data.restore.sql`;
- line: 2049;
- statement: empty `COPY` into provider-managed `storage.vector_indexes`;
- error: `permission denied for table vector_indexes`;
- classification: Supabase provider-managed object/privilege incompatibility.

Inspection proved the block has zero rows. A complete structural scan of every remaining Auth and Storage COPY block showed that the restore had already passed `storage.buckets_analytics`, the four application `storage.buckets` rows, 18 application `storage.objects` rows, and the empty multipart-upload tables. These blocks remain intact. `storage.vector_indexes` was the final COPY block in the artifact, so no later structurally identical provider-managed COPY incompatibility was found proactively.

The immutable data backup is still unchanged at SHA-256 `fa250f095a5dc9cdbb9cda52f8fe14640b558a97a8ab66fa45d365ff7e423878`. The data restore derivative was regenerated directly from that immutable source, omitting only the two independently proven-empty hosted vector-storage COPY blocks (`storage.buckets_vectors` and `storage.vector_indexes`) and their terminators. Its new SHA-256 is `5e1eaa99599f6cb5fb5252aed821f0fe717959d7ccfe919b862114d23a0bf83d`. A mechanical comparison confirms exactly four removed lines and no additions or other differences.

The restore script checksum pin was updated to the new derivative. All safety, atomicity, strict-error and private-log behavior remains unchanged. The script was syntax-checked and not executed by Codex. The failed single transaction rolled back; restore proof remains pending manual retry. Phase 1 remains **PARTIAL** and Phase 2 was not started.

### Phase 1C successful isolated restore and reconciliation gate

The operator reported a successful manual restore after the two narrow provider-managed corrections. The exact isolated-project guard passed; all pre-restore counts were zero; roles, schema and data then completed in one strict transaction. Terminal completion marker: `RESTORE COMPLETED: isolated project only.` Target: `xnsxmwgyugoqanuoyebh`. Production project `fstpfqlgypvktjwdeagu` was not modified.

Restore status is now **PASSED**. The immutable and restore-only checksums remain those recorded above. The provider-managed omissions remain limited to the unsupported server-logging grant and two empty vector-storage COPY blocks; application buckets, Storage object metadata, tables, functions, policies, triggers, grants and application data were retained.

Post-restore reconciliation is the next gate. Codex's execution sandbox cannot reach the isolated network endpoint and cannot access Docker Desktop's socket, so it could not execute the verification itself. A read-only executable verifier was added at `scripts/verify-isolated-checkpoint.sh`. It enforces the exact isolated ref and production rejection, loads only `.env.authz.local`, and checks safe entity counts, 70/latest migration history, schema objects, RLS policies, triggers, foreign keys, unvalidated constraints, aggregate FK orphan count, Auth user count, Storage bucket/object metadata and the presence of application table grants. It runs all temporary verification work inside a transaction that is rolled back and persists only safe aggregate output outside Git.

The verifier was made executable and passed `bash -n` and `git diff --check`. It was not executed by Codex. Until its output is reviewed, reconciliation, migration verification, synthetic identities, fixtures and both authorization matrices remain **BLOCKED**. Phase 1 remains **PARTIAL** and Phase 2 was not started.

### Phase 1C post-restore reconciliation and migration classification

The operator executed the read-only verifier after the successful isolated restore. The application restoration reconciled completely:

- all expected application entity counts passed;
- `auth.users` passed;
- 46/46 public application tables, 19/19 public/private functions, 121/121 policies, 46/46 RLS-enabled tables, 98/98 foreign keys and 40/40 triggers passed;
- unvalidated constraints and foreign-key orphans were both zero;
- all four Storage buckets and all 18 Storage object metadata rows passed;
- 966 public table ACL entries were present.

The only missing object was `supabase_migrations.schema_migrations`. Direct inspection confirms that none of the three immutable logical backup artifacts contains either the `supabase_migrations` schema name or a `schema_migrations` object/data block. Supabase CLI maintains this table as migration bookkeeping outside the application schemas included by its logical dump. Its absence is therefore classified as **bookkeeping-only**, not application restore incompleteness. No migration rows were fabricated, no migration was rerun, and the restored schema was not changed.

The repository independently contains exactly 70 ordered SQL migration files. The latest is `202608110002_preferred_benefits_and_privileges.sql`; the aggregate SHA-256 of the sorted per-file SHA-256 manifest is `274c4164b57b3c671e1961403637eff5f53a0d4491942e8aaf350393ab655d73`. Earlier Phase 1 evidence had already reconciled all 70 repository versions with the production migration inventory before backup. Together with the complete post-restore schema/data reconciliation, this establishes application recovery fidelity while explicitly preserving the limitation that hosted migration bookkeeping itself was not restored.

`scripts/verify-isolated-checkpoint.sh` now reports two independent summaries:

- `application_reconciliation_summary`: excludes migration bookkeeping and is expected to report `PASS` for this restore;
- `migration_bookkeeping_summary`: reports `NOT_RESTORED` honestly while retaining the individual missing-history results.

The next Phase 1 gate requires creation of six disposable synthetic staff identities and six minimum linked fixtures in the isolated project. `scripts/setup-isolated-authorization-baseline.mjs` was added for this purpose. It hard-codes the isolated project identity, explicitly rejects production, reads credentials only from the ignored local environment, creates no real-person data, records generated credentials and fixture UUIDs back into the mode-`600` ignored file without printing them, and leaves mutation probes disabled. The script passed `node --check` and was not executed by Codex because its sandbox cannot reach the isolated Supabase endpoint.

Phase 1 remains **PARTIAL** at this manual identity/fixture gate. Production project modified: **NO**. Application remediation: **NONE**. Migration bookkeeping fabricated/repaired: **NO**. Phase 2 started: **NO**.

### Phase 1C executed read-only authorization baseline

The operator completed the isolated setup and read-only matrix. All six disposable identities (`journey_designer`, `partner_manager`, `finance`, `operations`, `content_marketing`, `super_admin`) authenticated successfully, and all six linked fixture IDs were verified by the synthetic Super Admin. Mutation rows were blocked solely because `AUTHZ_TEST_ENABLE_MUTATIONS=false`, as required by the read-first gate.

The executed read-only behavior was:

| Role | Resource | Actual | Target | Evidence |
|---|---|---:|---:|---|
| Anonymous | Published theme content | ALLOW | ALLOW | Baseline correct |
| Anonymous | Guide contact and licence columns | ALLOW | DENY | `SEC-003` reproduced |
| Anonymous | Website setup state | ALLOW | DENY | `SEC-013` reproduced |
| Journey Designer | Traveller enquiry PII | ALLOW | ALLOW | Baseline correct for current role requirement |
| Finance | Full traveller enquiry PII row | ALLOW | DENY | `SEC-008` reproduced |
| Operations | Full traveller enquiry PII row | ALLOW | DENY | `SEC-008` reproduced |
| Content Marketing | Guide contact and licence columns | ALLOW | DENY | `ARC-001` / `SEC-001` reproduced |
| Partner Manager | Guide contact and licence columns | ALLOW | ALLOW | Baseline correct |
| Journey Designer | Curated journey fixture | ALLOW | ALLOW | Baseline correct |
| Partner Manager | Supplier allocation fixture | ALLOW | ALLOW | Baseline correct |
| Finance | Journey account fixture | ALLOW | ALLOW | Baseline correct |
| Super Admin | Staff roles | ALLOW | ALLOW | Baseline correct |

Red target verdicts are evidence of current defects, not harness failures. No policy, grant, role, API or application behavior was changed.

The mutation safety gate was re-encoded in `scripts/run-isolated-phase1-baselines.sh`: exact isolated ref/URL, explicit production rejection, isolated flag, six `@roamceylon.test` identities and all disposable fixture IDs must pass before any probe begins. The runner enables mutations only for the existing same-value/synthetic harness process; it does not change production or committed environment files.

Two narrow test-only baselines were also prepared:

- `tests/api-authorization-baseline.mjs` runs the existing legacy quote and partner-conversion authorization paths against an isolated local Next server using deliberately invalid/non-existent inputs, so authorization is measured without creating business records;
- `tests/storage-authorization-baseline.mjs` measures read/write behavior for all four buckets and all six synthetic roles plus anonymous, using only disposable objects and mandatory cleanup.

All scripts retain safe aggregate/authorization results outside Git under `/tmp/roam-stabilization-phase1/authorization-evidence`. Secrets and tokens are never printed. Syntax checks passed, but Codex did not execute the network-dependent probes because its sandbox cannot reach the isolated hosted project. The remaining Phase 1 mutation/API/Storage gate therefore requires one operator-terminal execution.

Current Phase 1 status: **PARTIAL**. Read-only matrix: **EXECUTED**. Mutation matrix: **BLOCKED AT MANUAL EXECUTION GATE**. API baseline: **BLOCKED AT MANUAL EXECUTION GATE**. Storage baseline: **BLOCKED AT MANUAL EXECUTION GATE**. Production modified: **NO**. Application remediation: **NONE**. Phase 2 started: **NO**.

### Phase 1C executed mutation matrix and continuation diagnostics

The guarded operator-terminal runner passed its isolated-project and synthetic-identity gates and executed the mutation matrix. All six identities remained `READY`; the matrix used the existing fixture IDs and same-value/disposable probes only. Actual mutation results were:

| Role | Resource/action | Actual | Target | Evidence |
|---|---|---:|---:|---|
| Journey Designer | CMS theme UPDATE | ALLOW | DENY | `ARC-001` / `SEC-001` reproduced |
| Journey Designer | Supplier guide UPDATE | ALLOW | DENY | `ARC-001` / `SEC-001` reproduced |
| Content Marketing | CMS theme UPDATE | ALLOW | ALLOW | Intended CMS baseline passed |
| Journey Designer | Enquiry lifecycle UPDATE | ALLOW | DENY | `SEC-004` reproduced |
| Journey Designer | `travel-content` upload | DENY (HTTP 415) | DENY | Inconclusive authorization result because payload was rejected first |
| Content Marketing | `travel-content` upload | DENY (HTTP 415) | ALLOW | Inconclusive authorization result because payload was rejected first |

The two HTTP 415 results are classified as **probe errors**, not authorization decisions. The original harness uploaded a `.txt`/`text/plain` payload while the restored `travel-content` bucket permits only JPEG, PNG, WebP and AVIF. The test probe was corrected to a minimal `.jpg` byte payload with `image/jpeg`; no Storage policy or application behavior changed.

The runner then stopped before the API and four-bucket Storage baselines. The retained mode-`600` API diagnostic contains one safe startup error: `node: --env-file= is not allowed in NODE_OPTIONS`. Next.js never started. This is an **environment/test-runner wiring failure**, not an application startup, build, Supabase connectivity, missing fixture or authorization failure. The API harness was corrected to pass the three isolated Next.js variables directly to a child process, strip authorization-harness variables from that child, and run a temporary source copy with its own `.next` directory so it cannot conflict with an operator development server. No production or application source behavior was changed.

The API probe remains deliberately non-mutating: it calls the legacy quote and partner-conversion endpoints with invalid/non-existent inputs. Any status beyond authentication/authorization (`401`/`403`) proves passage through the legacy role gate but cannot create or convert a business record. This is sufficient to measure `SEC-005` without broadening Phase 1.

`scripts/run-isolated-phase1-continuation.sh` now runs only the two previously blocked baselines—legacy API and all four Storage buckets. It does **not** repeat the successful read-only or mutation database matrices. The Storage baseline uses synthetic objects only and service-role cleanup as a final fallback; cleanup failure is a hard blocked result. Syntax checks passed. Operator execution remains required because Codex cannot reach the isolated hosted project from its sandbox.

Current Phase 1 status remains **PARTIAL**. Mutation matrix: **EXECUTED**. API baseline: **BLOCKED AT CORRECTED MANUAL CONTINUATION**. Storage baseline: **BLOCKED AT CORRECTED MANUAL CONTINUATION**. `SEC-014` / `TEST-001`: **PARTIAL** until the executable API and Storage evidence is captured. Production modified: **NO**. Application remediation: **NONE**. Phase 2 started: **NO**.

The first corrected continuation attempt provided a second, different API-runner failure. Next.js 16.2.12 reached its `Ready` state in 398 ms, but Turbopack panicked while compiling the readiness route because the test-only temporary workspace linked `node_modules` from outside Turbopack's filesystem root (`TurbopackInternalError: Symlink [project]/node_modules is invalid, it points out of the filesystem root`). No API authorization result was produced. This is classified as a test-runner/runtime-layout incompatibility, not Google Fonts, application configuration, Supabase connectivity, port use, identity data or fixtures. The test-only spawn now uses the supported `next dev --webpack` mode while retaining the isolated temporary build directory and direct isolated environment. Application code and production configuration remain unchanged.

## 20. Phase 1 Final Closure

The operator executed the corrected continuation runner to completion. Final terminal marker: `PHASE 1 CONTINUATION BASELINES COMPLETED: isolated project only.` The API and four-bucket Storage evidence files are mode `600`, outside Git, contain synthetic identifiers/results only, and report the isolated project `xnsxmwgyugoqanuoyebh`. No further Phase 1 execution is required.

### Legacy API authorization matrix

The intentionally invalid/non-existent request bodies prevent business mutation. HTTP `400` means the authenticated request passed the endpoint's authorization gate and reached application validation, so it is correctly recorded as `ALLOW`; `401` is `DENY`.

| API | Role | HTTP | Actual | Target | Result |
|---|---|---:|---:|---:|---|
| Legacy admin quote | Anonymous | 401 | DENY | DENY | Correct |
| Legacy admin quote | Journey Designer | 400 | ALLOW | ALLOW | Correct |
| Legacy admin quote | Partner Manager | 400 | ALLOW | DENY | `SEC-005` reproduced |
| Legacy admin quote | Finance | 400 | ALLOW | DENY | `SEC-005` reproduced |
| Legacy admin quote | Operations | 400 | ALLOW | DENY | `SEC-005` reproduced |
| Legacy admin quote | Content Marketing | 400 | ALLOW | DENY | `SEC-005` reproduced |
| Legacy admin quote | Super Admin | 400 | ALLOW | ALLOW | Correct |
| Legacy partner conversion | Anonymous | 401 | DENY | DENY | Correct |
| Legacy partner conversion | Journey Designer | 400 | ALLOW | DENY | `SEC-005` reproduced |
| Legacy partner conversion | Partner Manager | 400 | ALLOW | ALLOW | Correct |
| Legacy partner conversion | Finance | 400 | ALLOW | DENY | `SEC-005` reproduced |
| Legacy partner conversion | Operations | 400 | ALLOW | DENY | `SEC-005` reproduced |
| Legacy partner conversion | Content Marketing | 400 | ALLOW | DENY | `SEC-005` reproduced |
| Legacy partner conversion | Super Admin | 400 | ALLOW | ALLOW | Correct |

`SEC-005` is therefore **REPRODUCED** through executable isolated API evidence. No partner was converted and no quote was generated.

### Four-bucket Storage authorization matrix

The corrected probes used bucket-supported JPEG/PDF MIME types. The previous HTTP 415 results are superseded and are not authorization evidence. The completed matrix used one synthetic read object per bucket and one disposable write object per role; final cleanup reported `syntheticObjectsRemoved=true`.

| Bucket | Current executable behavior | Classification |
|---|---|---|
| `travel-content` | READ ALLOW for anonymous and every tested staff role; WRITE DENY for anonymous and all six staff roles | Public reads and non-CMS write denials are intended. Content Marketing and Super Admin write denials are target-policy/capability failures requiring later remediation. |
| `partner-application-media` | READ and WRITE DENY for anonymous and all six staff roles | Anonymous and unrelated-role denials are intentional. Partner Manager and Super Admin lack the required operational access; record as a genuine Storage authorization/capability defect. |
| `partner-application-documents` | READ and WRITE DENY for anonymous and all six staff roles | Private-by-default behavior is correct for anonymous/unrelated roles. Partner Manager and Super Admin access failures are genuine target-policy/capability defects. |
| `accounting-receipts` | READ and WRITE DENY for anonymous and all six staff roles | Anonymous/unrelated-role denials are intended. Finance and Super Admin READ denial is a genuine capability defect. Direct client WRITE denial is intentionally retained because receipt upload flows through the capability-checked server API and service client, not a broad Storage client policy. |

These red Storage results are recorded for the later capability/RLS/Storage cutover. They do not invalidate Phase 1 execution.

### Findings and assurance baseline

Executable evidence now reproduces:

- `ARC-001` / `SEC-001`: legacy editor authorization permits out-of-capability CMS/supplier reads and updates; Storage capabilities are also misaligned;
- `SEC-003`: anonymous supplier contact/licence exposure;
- `SEC-004`: Journey Designer can update enquiry lifecycle directly;
- `SEC-005`: broad legacy admin/editor API authorization;
- `SEC-008`: Finance and Operations can read over-broad traveller PII;
- `SEC-013`: anonymous website setup-state exposure.

`SEC-014` and `TEST-001` are **CLOSED AS BASELINE GAPS** because disposable-project execution now covers synthetic identities, database reads, same-value mutations, negative/positive legacy API authorization, four Storage buckets and cleanup. This closure means the missing executable-baseline problem has been addressed; it does **not** mean any reproduced security vulnerability is remediated or that all future security/E2E coverage is complete.

### Final Phase 1 exit gate

- [x] Immutable Git checkpoint, backup branch and annotated tag exist at `d28d81a01eb10cd6341b6df4f2d71d5866774bf1`
- [x] Original schema/data/roles backups verified and checksummed
- [x] Narrow restore-only derivatives documented and checksummed; originals unchanged
- [x] Atomic isolated restore passed
- [x] Application schema/data/relationships/RLS/grants/Storage reconciliation passed
- [x] Hosted migration-bookkeeping limitation documented without fabricated rows
- [x] Repository migration inventory contains 70 files; latest is `202608110002_preferred_benefits_and_privileges.sql`
- [x] Six synthetic staff identities are ready
- [x] Minimum disposable linked fixtures are available
- [x] Read-only authorization matrix executed
- [x] Mutation authorization matrix executed
- [x] Legacy API authorization matrix executed
- [x] Four-bucket Storage authorization matrix executed
- [x] Synthetic Storage objects removed
- [x] Current defects reproduced and documented without remediation
- [x] Production project was not modified
- [x] Application remediation performed: none

Phase 1 status is **COMPLETE**. Backup and recovery: **PASSED**. Isolated restore: **PASSED**. Reconciliation: **PASSED**. Production modified: **NO**. Application remediation: **NONE**. Phase 2 readiness: **YES, pending human review and explicit authorization to begin Phase 2**.

STABILIZATION PHASE 1 COMPLETE — READY FOR HUMAN REVIEW
