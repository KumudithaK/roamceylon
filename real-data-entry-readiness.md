# Roam Ceylon Real-Data Entry Readiness

Date prepared: 2026-08-15  
Current decision: **NO — production has not been cut over or smoke verified**  
Conditional decision: **YES after the human-approved production cutover succeeds and the production smoke checklist passes; Phase 16 has passed**

## Why the conditional answer can become YES

- The application schema and 84-file migration chain are frozen by checksum manifests.
- The stabilization chain is additive/guarded and has executable isolated coverage through Phase 15.
- Content, supplier, pricing, journey, proposal, accounting, operational and audit boundaries are represented in the final contracts.
- Four required Storage buckets have explicit privacy, type/size and capability/path policies.
- A backup, independent Storage export, recovery and smoke procedure is defined.
- No known planned destructive migration is required for the current content/catalogue model.

The Phase 16 clean-room rehearsal has passed. This is not a substitute for the future human-approved production cutover and production smoke test; until those pass, do not enter real data.

## One-month content-entry safeguards

1. Freeze destructive migrations for the entire entry window. Any schema proposal requires impact review, a fresh backup and a rehearsal against a production-like copy.
2. Keep a reviewed release tag and both migration checksum manifests unchanged.
3. Confirm managed database backup status daily. Take scheduled off-site logical exports at least weekly and before every schema/configuration change.
4. Export all Storage objects separately at least weekly using the supported S3/CLI path; database backups do not contain the actual files. Keep key/size/checksum manifests. Supabase Storage object versioning is not available, so never treat delete as recoverable without the export.
5. Keep content drafts unpublished until a second-person review of title, relationships, licence/rights, pricing and imagery.
6. Use canonical object paths already produced by the application; do not rename/move objects directly in Storage behind saved CMS URLs.
7. Restrict Admin access to named staff and least-privilege roles. Review assignments weekly and immediately disable unused accounts.
8. Maintain a weekly content checkpoint: counts by resource/status, missing relationships, missing imagery/alt text, pricing review status and Storage object count.
9. Export business-critical supplier/pricing/content tables to encrypted controlled files at weekly checkpoints. Treat exports as sensitive even when catalogue items will later be public.
10. Never enter real traveller/payment data merely to test a feature. Use synthetic `.invalid` identities until launch operations begin.
11. Keep production behind access protection/restricted preview and keep records in `draft` until public-launch approval.
12. Do not bulk-delete or reset. Corrections use Admin workflows; financial, proposal and audit history remains immutable.

## Data classification

### Required system data

- six canonical staff roles, permissions and role-permission grants;
- enum/reference structures and command/read-model configuration installed by migrations;
- `website_settings`, `homepage_content`, DMC pricing configuration and partner commercial settings singleton rows;
- four Storage bucket definitions and policies.

### Optional business data

- themes, destinations, experiences and editorial relationships;
- accommodation, vehicle and guide catalogue records and pricing plans;
- website contact/registration details, benefits, seasonal estimates and imagery.

### User-entered real data

- staff identities/assignments;
- supplier applications, contacts, licences, rates and files;
- traveller enquiries, proposal identities and journey preferences;
- payments, receipts, settlements, cancellations and operational evidence.

### Test-only data

- `phase*`/`launch-smoke-*` fixtures, `@roamceylon.test` identities, isolated keys and diagnostic logs.
- None belongs in production bootstrap or content imports.

## Stop conditions during content entry

- backup or Storage export cannot be verified;
- unexpected migration/checksum drift;
- anonymous private-data access;
- staff capability mismatch;
- missing relationships or schema-cache errors;
- duplicate/incorrect financial or supplier effects;
- media ownership/licensing cannot be established.

When a stop condition occurs, pause entry, preserve evidence and resolve it through reviewed change control before continuing.
