# Roam Ceylon Production Cutover Plan

Date prepared: 2026-08-15  
Status: **prepared, not authorized or executed**  
Production project: `fstpfqlgypvktjwdeagu`  
Release rehearsal project: `xnsxmwgyugoqanuoyebh`

This is a human-run control plan. Phase 16 does not link, migrate, deploy, seed or create users in production.

## Release artifacts and immutable checks

- Freeze one reviewed release commit and annotated release-candidate tag before cutover.
- Verify all 84 repository migrations against `repository-migration-manifest.sha256`.
- Verify the 14 stabilization migrations against `stabilization-migration-manifest.sha256`.
- The stabilization chain is `202608120001` through `202608120014`, including the legitimate Phase 9 follow-up `202608120009_supplier_allocation_pricing_enum_compatibility.sql`.
- Do not edit a migration after the release manifests are approved. Any correction becomes a new forward migration and a new reviewed release candidate.

## Non-mutating production preflight

An authorized operator must record the following without changing production:

1. Confirm the project reference displayed by the Supabase dashboard and CLI is exactly `fstpfqlgypvktjwdeagu`.
2. Capture the deployed application commit/artifact identifier and the current environment-variable name inventory; never export values into the repository.
3. List production migration history. It must contain the expected pre-stabilization chain through `202608110002_preferred_benefits_and_privileges.sql`, in unique order, before any stabilization push.
4. Compare the existing production object inventory with the Phase 1 checkpoint. Stop on unexpected tables, functions, policies, triggers, constraints, Storage buckets or partial stabilization objects.
5. Confirm the four expected bucket definitions and record object counts. Do not change policies in preflight.
6. Confirm the provider backup/PITR status and available restore point. Record the backup identifier and timestamp.
7. Confirm a separate Storage-object export has completed. Database backup protects Storage metadata, not the underlying files.
8. Confirm the previous application artifact and its environment configuration remain deployable for an application rollback.
9. Confirm the release environment has platform-level rate controls for public enquiry, partner application and proposal-action endpoints.
10. Confirm no real content-entry session is active during the cutover window.

Any mismatch is a stop condition. Do not use migration repair, history fabrication, destructive reset or broad SQL filtering during production cutover.

## Backup before cutover

1. Record the current managed database backup/PITR restore point.
2. Create and checksum logical schema, data and roles exports in encrypted off-machine storage where the plan supports it.
3. Export all four Storage buckets with an S3-compatible client or the Supabase Storage CLI. Save an object-key/size/checksum manifest with the encrypted export.
4. Capture Auth configuration, redirect allowlists, email settings, Storage S3 configuration state and deployment environment-variable names. Store secrets only in the approved secret manager.
5. Capture the current application deployment artifact, commit, domain/DNS state and health result.
6. Nominate the cutover operator and independent verifier. Record start time, backup IDs and go/no-go approval.

## Cutover order

1. Enter a controlled change window; pause Admin content edits and supplier/accounting work.
2. Complete and sign the non-mutating preflight and backup evidence.
3. Verify both migration checksum manifests from the exact release checkout.
4. Apply only the pending stabilization migrations with fail-fast behavior. Never reset production and never run test runners against production.
5. Verify relations, functions/RPCs, constraints, triggers, RLS, grants, read models, audit objects, Storage bucket metadata and policies before deploying the application.
6. Refresh the PostgREST schema cache where needed and confirm no missing-object errors.
7. Deploy the exact reviewed application artifact with the production environment manifest.
8. Create the first staff identity only if no valid Super Admin exists, using the controlled bootstrap below.
9. Execute `production-smoke-test-checklist.md` with clearly synthetic data only.
10. Close/retire synthetic smoke records through authoritative commands; preserve immutable audit evidence.
11. End the change freeze only after the independent verifier signs off.
12. Keep public launch controlled until content, legal, rate-limit and operational checks are approved.

## Controlled first Super Admin bootstrap

Do not create staff automatically from migrations or seed files.

1. A project owner creates/invites one named Auth user through the production Supabase dashboard using a controlled company address and strong unique credentials.
2. In one reviewed transaction, insert/update the matching `profiles` row and assign `profile_staff_roles.role_code='super_admin'`. The assignment must reference the exact Auth UUID and a documented administrator UUID where available.
3. Keep the legacy `editor` value unassigned. The explicit `super_admin` assignment is the capability source; the historical profile enum exists only for schema compatibility.
4. Sign in, verify `current_staff_permissions()` returns the complete approved capability set, and verify the Super Admin can view—but not bypass—the command, RLS and audit controls.
5. Create each later staff user separately and assign only one or more of: `journey_designer`, `partner_manager`, `finance`, `operations`, `content_marketing`, `super_admin`.
6. Review staff assignments after bootstrap and monthly thereafter. Disable departed staff in Auth and remove assignments in a recorded administrative procedure.

## Environment variable manifest

| Name | Classification | Required | Purpose |
|---|---|---:|---|
| `NEXT_PUBLIC_SUPABASE_URL` | PUBLIC | yes | Production Supabase API URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | PUBLIC | yes | Supabase publishable/anon client key |
| `SUPABASE_SERVICE_ROLE_KEY` | SERVER-ONLY SECRET | yes | Server routes and repositories only; never browser-exposed |
| `NEXT_PUBLIC_SITE_URL` | PUBLIC | recommended | Canonical `https://theroamceylon.com` metadata URL; safe default exists |
| `SUPABASE_URL` | OPTIONAL TOOLING | no | JSON importer fallback only |
| `AUTHZ_TEST_*` | TEST-ONLY SECRET/CONTROL | no | Isolated stabilization runners only; forbidden in production deployment |
| `AUTHZ_FIXTURE_*` | TEST-ONLY | no | Isolated authorization fixtures only; forbidden in production deployment |

Required values must be configured in the deployment secret manager. Missing Supabase values must fail preflight; no `.env.authz.local` or test fixture variable may be present in production.

## Realistic rollback and recovery

### Application rollback

Redeploy the captured previous application artifact only when its schema contract remains compatible with the migrated database. Additive schema changes usually permit this; changed grants, RLS and command-only paths may make an old application unsafe or unusable. Never weaken database controls just to support an old client.

### Database migration failure

- If the migration transaction fails before commit, verify rollback and stop.
- If a migration commits and verification fails, prefer a reviewed forward fix when data is intact and impact is bounded.
- RLS/grant/function changes are not assumed safely reversible. Do not improvise reverse SQL.
- For destructive or data-corrupting outcomes, stop traffic/writes and restore the verified pre-cutover database backup/PITR point. Re-run reconciliation before reopening.

### Storage recovery

Database restore restores Storage metadata but does not restore file objects. Restore bucket configuration/policies through reviewed migrations and restore objects from the separate encrypted S3/CLI export, verifying object counts and checksums. Supabase Storage does not provide bucket object versioning, so deleted objects require that external copy.

### Recovery verification

The independent verifier repeats schema reconciliation, four-bucket metadata/object checks, anonymous/private boundary checks, staff capability checks and the non-destructive smoke checklist. Recovery is not complete merely because the application starts.

## Pre-launch operation

- Keep the deployment behind platform access protection or an unannounced restricted preview domain until launch approval.
- Keep new catalogue records `draft`/inactive until editorial approval; only published projections are public.
- Do not expose real proposal links during content entry.
- Enable public DNS/marketing only after smoke, content, legal/privacy, rate-limit and operational sign-off.
- A complex maintenance-mode feature is not required for this cutover.

## Explicit exclusions

Phase 16 has passed. This plan still does not authorize a production link, migration, backup, user creation, deployment, DNS change or real-data entry; those require a separate human C0 go/no-go decision.
