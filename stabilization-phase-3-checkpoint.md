# Stabilization Phase 3 Checkpoint

Date: 2026-08-12  
Scope: staff role and application capability architecture  
Production project: `fstpfqlgypvktjwdeagu` — **not modified**  
Isolated validation project: `xnsxmwgyugoqanuoyebh`

## Status

Implementation, local regression verification and guarded isolated authorization verification are complete. The capability and API matrices passed for every canonical synthetic role, SEC-005 is remediated and executably verified, and the focused Phase 2 boundary regression passed. Phase 3 is **COMPLETE — READY FOR HUMAN REVIEW**. Phase 4 has not started.

## Canonical identity and authorization model

The application now follows one explicit chain:

1. Supabase Auth establishes the authenticated user.
2. `profiles` establishes the compatible application identity record.
3. `profile_staff_roles` supplies one or more canonical staff roles.
4. `staff_role_permissions` resolves those roles to named capabilities.
5. Every protected server action passes a mandatory capability requirement to `authenticatedStaff`.

`profiles.role='editor'` remains only a compatibility classification. It no longer grants server/API authorization. `profiles.role='admin'` retains a deliberate, explicit and testable all-capability compatibility bypass. The migration removes only the two unowned automatic role assignments historically generated for legacy editor profiles; deliberately assigned rows with `assigned_by` evidence are retained. A Super Admin must explicitly assign the correct canonical staff role to any affected real editor before a later production rollout.

## Canonical roles

| Business role | Repository role code |
|---|---|
| Super Admin / Founder | `super_admin` |
| Journey Designer | `journey_designer` |
| Partner / Supplier Manager | `partner_manager` |
| Finance / Accounting | `finance` |
| Operations | `operations` |
| Content Marketing / CMS | `content_marketing` |

No additional business roles were introduced.

## Capability inventory

| Module | Capabilities |
|---|---|
| Journey and enquiries | `journey.requests.view`, `journey.design.view`, `journey.design.edit` |
| Proposals | `journey.proposal.view`, `journey.proposal.create`, `journey.proposal.send`, `journey.proposal.manage` |
| Suppliers and partners | `suppliers.view`, `suppliers.manage`, `suppliers.allocate`, `suppliers.rates.view` |
| Benefits | `benefits.view`, `benefits.manage`, `benefits.assign`, `benefits.reference.view`, `benefits.reference.manage` |
| Operations | `operations.view`, `operations.manage` |
| Accounting | `finance.revenue.view`, `finance.costs.view`, `finance.margin.view`, `finance.payments.manage`, `finance.settlements.reverse`, `finance.accounts.override` |
| CMS | `cms.view`, `cms.edit` |
| Staff and settings | `users.manage`, `settings.manage` |

The four new capabilities separate proposal sending/administration and sensitive settlement/account correction from their former broad permissions. Existing names were retained everywhere else.

## Least-privilege role matrix

| Role | Allowed areas | Explicit exclusions |
|---|---|---|
| Super Admin | Every registered capability | None; explicit compatibility bypass |
| Journey Designer | Enquiry read, journey view/edit, proposal view/create/send, supplier read context, benefit view/assign | Accounting, CMS, supplier master-data management, staff/settings, proposal revoke/final management |
| Partner Manager | Enquiry/journey context, supplier view/manage/allocate/rates, benefit management/reference | Accounting, CMS, staff/settings, journey editing/proposal authority |
| Finance | Journey/proposal context, supplier/rate read, benefit/reference read, revenue/cost/margin/payment management, settlement reversal | CMS, supplier master-data changes, journey editing, force-close override |
| Operations | Journey context, supplier read, operations management, benefit view/assign | Accounting administration, supplier rates/master-data, CMS, journey editing |
| Content Marketing | CMS view/edit only | Traveller journeys/PII, suppliers, accounting, operations, staff/settings |

`finance.accounts.override` is intentionally Super Admin only. `finance.settlements.reverse` is intentionally granted to Finance and Super Admin.

## Application authorization changes

- `authenticatedStaff` now requires a capability or explicit any-of capability set; callers cannot omit authorization accidentally.
- Invalid/missing authentication returns 401; a valid identity without the required capability returns 403.
- Legacy editor membership no longer passes the helper.
- `legacy_admin_quote` now requires `journey.proposal.create`.
- `legacy_partner_conversion` now requires `suppliers.manage`.
- Proposal generation/internal approval, sending, and final management/revocation are separated across `journey.proposal.create`, `journey.proposal.send`, and `journey.proposal.manage`.
- Settlement reversal and forced account closure use exact capabilities instead of direct `profile.role` checks.
- Journey allocation read uses an explicit any-of capability requirement rather than an unrestricted staff call.
- All other admin API callers were normalized to preserve the 401/403 distinction.

## Admin module visibility

Admin navigation remains a convenience layer, not a security boundary. Supplier master-data modules and partner applications now require `suppliers.manage`; CMS resources require `cms.edit`. Resource and partner screens are wrapped by the same capability-aware Admin shell. Journey, finance, operations, benefits and settings navigation retain their existing named capability mapping. Super Admin sees every module through the explicit all-capability result.

## Legacy-check inventory and classification

- **Replaced in Phase 3:** active Next.js API checks for quote calculation, partner conversion and direct admin-only accounting actions.
- **Legitimate compatibility:** the explicit `profiles.role='admin'` all-capability bypass in the server helper, client capability loader and `private.has_permission`.
- **Deferred to Phase 4:** historical/current RLS and Storage policies that still use `private.has_role(['admin','editor'])`, including CMS, enquiry, supplier allocation, pricing, accounting and Storage enforcement. No broad RLS or Storage cutover was attempted here.
- **Archived application:** `legacy-v1/js/admin-app.js` retains legacy role checks but is outside the active Next.js application; it was not modified.

## Journey lifecycle and PII scope boundaries

Phase 3 authorizes application commands but does not redesign the enquiry state machine. `journey.design.edit` permits curation, not arbitrary lifecycle transitions; deeper SEC-004 command/state enforcement remains deferred.

SEC-008 also remains unresolved. Intended access is Journey Designer for design-relevant traveller details, Finance for required commercial identity/context, Operations for service-delivery context, Partner Manager for supplier-related context only, and Content Marketing for no traveller PII. Purpose-specific DTO and field minimization work is deferred and was not made broader by this phase.

## Database migration

Migration: `supabase/migrations/202608120002_staff_capability_architecture.sql`  
SHA-256: `dfe1cc7bd7665a2323dde00fe758becf9baa5820f5931b32d335c2ec45707be4`

The migration adds the four precise capabilities, normalizes the six canonical role records, removes only identifiable automatic legacy-editor assignments, and deterministically replaces the canonical role-capability mappings. It does not replace RLS/Storage policies or fabricate migration history.

## Executable authorization coverage

`tests/api-authorization-baseline.mjs` now:

- compares each synthetic role's complete `current_staff_permissions()` result with the canonical TypeScript matrix;
- verifies anonymous denial;
- probes journey design, supplier allocation, benefit management, proposal sending, settlement reversal and forced account closure;
- verifies the two SEC-005 legacy paths;
- uses invalid/non-mutating synthetic bodies so an authorized response reaches only validation/not-found handling.

The guarded runner `scripts/run-isolated-phase3-capabilities.sh`:

- loads secrets only from `.env.authz.local`;
- accepts only `xnsxmwgyugoqanuoyebh`;
- explicitly rejects `fstpfqlgypvktjwdeagu`;
- applies only the Phase 3 migration atomically;
- refreshes disposable synthetic identities/assignments;
- runs the exact role/capability and API matrix;
- reruns the focused Phase 2 SEC-003/SEC-013 anonymous boundary matrix;
- stores private evidence outside Git under `/tmp/roam-stabilization-phase3`.

## Local regression evidence

| Check | Result |
|---|---|
| `npx tsc --noEmit` | PASS |
| `npm test` | PASS — 138/138 |
| `npm run build` | PASS; existing local Supabase schema-cache warnings for Phase 2 projections were logged during static generation but did not fail the build |
| `npm run lint` | BASELINE FAIL — 7 pre-existing React effect errors and 3 warnings in unrelated accounting/experience/proposal files; no Phase 3 file reported |
| `bash -n scripts/run-isolated-phase3-capabilities.sh` | PASS |
| `git diff --check` | PASS |

## Isolated verification status

- Guarded runner result: **`PHASE 3 CAPABILITY ARCHITECTURE VERIFIED: isolated project only.`**
- Capability migration: **APPLIED TO ISOLATED PROJECT / PASS**
- Exact capability matrix: **PASS** for anonymous, Journey Designer, Partner Manager, Finance, Operations, Content Marketing and Super Admin
- API authorization matrix: **PASS** for `legacy_admin_quote`, `legacy_partner_conversion`, `journey_design_edit`, `supplier_allocation`, `benefit_management`, `proposal_send`, `settlement_reversal` and `account_override_close`
- SEC-005: **REMEDIATED AND EXECUTABLY VERIFIED**
- Phase 2 regression: **PASS** — SEC-003 and SEC-013 remain remediated; public projections remain accessible; private supplier/contact/licence fields and internal website setup state remain anonymous DENY
- Production: **NOT MODIFIED**

Any transaction/module warnings emitted during the successful guarded run were non-fatal diagnostics. The runner reached its explicit verified completion result, so they are not classified as Phase 3 verification failures.

## Findings and deferrals

- ARC-001 / SEC-001: application authorization foundation addressed; database RLS/Storage enforcement remains for Phase 4.
- SEC-004: route capability checks improved; command-only lifecycle enforcement remains deferred.
- SEC-005: application authorization remediated and executably verified in the isolated project.
- SEC-008: purpose-specific PII minimization remains deferred.
- Phase 4 full RLS/Storage cutover: **NOT STARTED**.

## Final closure

- Role model: **IMPLEMENTED AND VERIFIED**
- Capability model: **IMPLEMENTED AND VERIFIED**
- Legacy application role checks: **REPLACED within Phase 3 scope**
- Super Admin: **PASS**
- Journey Designer: **PASS**
- Partner Manager: **PASS**
- Finance: **PASS**
- Operations: **PASS**
- Content Marketing: **PASS**
- Phase 2 regression: **PASSED**
- TypeScript: **PASSED**
- Tests: **138/138 PASSED**
- Build: **PASSED**
- Lint: only established unrelated baseline findings remain
- Other findings remediated: **NONE**
- Production: **NOT MODIFIED**
- Phase 4: **NOT STARTED**
- Phase 4 readiness: **YES — subject to human review of this completed Phase 3 checkpoint**
