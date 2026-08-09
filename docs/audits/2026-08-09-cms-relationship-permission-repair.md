# CMS Relationship Permission Repair

Date: 2026-08-09

## Fault

The Admin relationship editor called `public.sync_content_relationships` as a security-invoker function. Although authenticated users could execute the public RPC, it called `private.has_role` and therefore failed with `permission denied for schema private`.

## Repair

- Changed only `public.sync_content_relationships` to `SECURITY DEFINER`.
- Retained its internal Admin/Editor role check.
- Retained the allow-list of supported resource types.
- Explicitly denied anonymous execution.
- Did not grant authenticated users general access to the private schema.

Authorized CMS users can now freely maintain Theme → Destination, Destination/Theme → Experience, vehicle coverage, and guide destination/theme/experience mappings.

## Deployment and verification

- Migration `202608090003_fix_relationship_sync_permissions.sql` applied to the remote Supabase project.
- Local and remote migration histories match.
- TypeScript passed.
- Automated tests passed: 75/75.

