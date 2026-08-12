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

STABILIZATION PHASE 1 FINISHED – NO PRODUCTION APPLICATION BEHAVIOR, RLS OR DATABASE SCHEMA CHANGES MADE
