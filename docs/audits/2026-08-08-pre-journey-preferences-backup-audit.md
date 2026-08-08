# Pre-Journey Preferences Backup and Audit

Date: 2026-08-08  
Baseline commit: `896f0887f54c34245d5aced393aa12d84c111fad`

## Backup identifiers

- Local backup branch: `backup/pre-journey-preferences`
- Annotated tag: `backup/pre-journey-preferences-20260808`
- Restorable Git bundle: `tmp/backups/pre-journey-preferences-20260808/roamceylon-pre-journey-preferences.bundle`
- Remote publication was not completed during the audit because the execution environment could not resolve GitHub. The local branch, tag and verified bundle remain available.

## Supabase snapshot status

- Schema and scoped data snapshots were created under the ignored directory `tmp/backups/pre-journey-preferences-20260808/`.
- The snapshot covers 29 related tables and 1,003 rows, with a manifest and restrictive file permissions.
- Covered domains include public journey state/enquiries, destinations, themes, experiences, accommodation, vehicles, guides, relationship tables, pricing, supplier assignments, proposals and accounting.
- `journey_requests` is not present in the current schema. Its former purpose has been consolidated into `enquiries`; no table was recreated or changed.
- No Supabase schema, row, policy or storage object was modified during the audit.

## Current model summary

The public builder originally used four steps: Theme → Destination → Experience → Plan. Themes filter destinations, and themes plus destinations filter experiences. The Plan step exposed individual stays by destination, one journey-level vehicle, and one journey-level guide.

Traveller state is retained in browser storage and copied into an enquiry `trip_state` snapshot when a proposal is requested. The enquiry also retains explicit supplier IDs for historical compatibility. Admin supplier management is handled by the existing resource editors and relationship tables. Pricing resolves selected supplier pricing plans and business-pricing configuration; accounting is linked to accepted/closed enquiry records.

## Minimal next-step change identified

1. Add destination-level stay preference, guide preference and notes to traveller state.
2. Replace only the public stay/guide supplier selection UI with those preferences.
3. Preserve journey-level transport selection.
4. Add Journey Details and Review steps.
5. Store preferences inside the enquiry journey snapshot while leaving actual supplier assignment fields empty for future internal allocation.
6. Preserve all supplier records, Admin editors, mappings, pricing services and historical enquiry parsing.

