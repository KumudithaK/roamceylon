# Stabilization Phase 14 — Audit, Observability & Security Event Integrity

Status: **COMPLETE — isolated executable verification passed**  
Authorized target: `xnsxmwgyugoqanuoyebh`  
Rejected production target: `fstpfqlgypvktjwdeagu`

## Inventory and source-of-truth decision

The application already had authoritative but fragmented evidence. Phase 14 preserves these sources rather than duplicating mutable business snapshots:

| Domain | Existing authoritative evidence | Phase 14 treatment |
|---|---|---|
| Journey lifecycle | `enquiry_lifecycle_history` | Indexed as purpose-limited journey/operations evidence |
| Proposal acceptance | `journey_proposal_acceptances` | Indexed without traveller identity, email, total, metadata or token |
| Finance | `accounting_transactions`, `accounting_lifecycle_history` | Transaction event indexed without amount, reference, notes or receipt data |
| Supplier allocation | `journey_supplier_allocation_history`, command receipts | History indexed without commercial/snapshot fields; idempotency key is one-way correlated |
| Operations | `journey_operational_command_receipts` and allocation/lifecycle history | Receipt type/hash indexed without result payload |
| Partner onboarding | `partner_application_history`, onboarding receipts | Lifecycle history indexed without applicant/contact/application data |
| Staff authority | No immutable history existed | New derived-actor `staff_authority_history` trigger evidence |
| Authenticated staff denials | No structured safe event existed | New bounded `staff_security_events`; anonymous/invalid credential noise deliberately excluded |

## Implementation

- Migration: `202608120014_audit_observability_integrity.sql`
- New audit permissions: journey, supplier, finance, operations and security scopes.
- `staff_authority_history` records role assignment/removal and permission grant/revocation from database-derived actor context.
- `staff_security_events` accepts only trusted server-side, authenticated-staff capability denials with fixed outcome/reason classes, bounded known permissions, a sanitized admin path and a UUID correlation ID.
- `staff_audit_event_index` is a security-barrier, capability-filtered index across authoritative evidence. Its contract contains only event identity/type, authoritative actor class/id, resource linkage, action, outcome, non-secret correlation reference and timestamp.
- The index deliberately excludes PII, traveller/supplier contact details, notes, public tokens, request bodies, mutable snapshots and commercial values.
- Audit/security tables deny staff inserts, updates and deletes, including Super Admin. A service-role cleanup escape hatch is limited to guarded Phase 14 synthetic cleanup.
- `authenticatedStaff` records only authenticated admin-route denials. Missing/invalid tokens are not persisted, preventing anonymous event-storage abuse. Audit failure does not convert a denial into an availability outage.

## Integrity properties

- Successful commands continue writing their existing authoritative evidence; the unified index is read-only.
- Replay behaviour is inherited from authoritative command receipts/state transitions and cannot create a second business outcome.
- Failed/rolled-back business commands cannot produce false success evidence because command evidence shares the business transaction.
- Staff role/capability history is created by database triggers after successful changes and uses `auth.uid()`/trusted role context rather than caller-supplied identity.
- Direct evidence forgery and evidence rewrite are denied by grants, RLS and append-only guards.
- One-way hashes are used where an idempotency key is useful for correlation; the original key is not disclosed.

## Isolated executable verification

The guarded verifier completed against `xnsxmwgyugoqanuoyebh` only:

- Phase 14 matrix: **29/29 PASSED; 0 FAILED**
- Phase 2–13 focused structural regression gates: **PASSED**
- Synthetic audit-observability cleanup: **PASSED**
- Production project: **NOT MODIFIED**

Verified evidence:

- anonymous audit read: **DENY**;
- journey command evidence: **EXACTLY_ONCE**;
- journey replay and concurrency semantics: **SAFE**;
- failed-command audit atomicity: **ROLLBACK**;
- journey audit read model: **PASS**;
- financial, supplier, operational and onboarding command evidence: **PASS**;
- staff authority grant/revoke history: **EXACTLY_ONCE**;
- forged authority event and forged actor/timestamp: **DENY**;
- bounded security event: **EXACTLY_ONCE**;
- untrusted security-event injection: **DENY**;
- Journey Designer security-audit read and Content Marketing journey-audit read: **DENY**;
- Super Admin legitimate audit visibility: **PASS**;
- PII and secret-minimized audit contract: **MINIMIZED**;
- Finance, Partner Manager and Operations audit minimization: **PASS**;
- audit rewrite attempts by every staff role: **DENY**;
- unauthorized audit deletion, including through Super Admin visibility: **DENY**.

## Local validation

Completed locally:

- architecture/secret-boundary validation: **PASSED**
- focused Phase 14 tests: **3/3 PASSED**
- full local tests: **197/197 PASSED**
- production build and its integrated TypeScript pass: **PASSED**
- runner shell syntax: **PASSED**
- matrix JavaScript syntax: **PASSED**

The standalone `npx tsc --noEmit` invocation remains blocked by the established pre-existing ES-target mismatch in `tests/public-api-boundary.test.ts`; the production build's TypeScript stage passed and no Phase 14 TypeScript error was reported.

The repository includes:

- `tests/audit-observability-integrity.test.ts`
- `tests/phase14-audit-observability.mjs`
- `scripts/run-isolated-phase14-audit-observability.sh`

### Isolated matrix continuation note

The first isolated run reached **28/29 PASS**. Its sole failure was a test-only false positive: the minimization probe treated the safe event classification `staff.authorization.denied` as sensitive because it searched every serialized value for the ordinary word `authorization`. The projection exposed no PII, secret, token, header, request body, commercial value or unsafe URL/query data. The corrected probe validates the exact ten-column audit contract, opaque UUID/hash correlation formats, and explicit sensitive payload patterns without rejecting legitimate security-event classifications. No database or application behaviour changed. The corrected isolated run subsequently passed **29/29**.

## Exit status

- Audit inventory: **COMPLETE**
- Authoritative event model: **IMPLEMENTED AND VERIFIED**
- Critical command coverage: **VERIFIED**
- Actor attribution and timestamp integrity: **VERIFIED**
- Resource linkage: **VERIFIED**
- Replay/concurrency semantics: **SAFE**
- Rollback audit integrity: **VERIFIED**
- Event immutability: **VERIFIED**
- Role-aware audit reads: **VERIFIED**
- Anonymous audit access: **DENIED**
- PII/secret/token minimization: **VERIFIED**
- Security event logging: **IMPLEMENTED AND VERIFIED**
- Phase 2–13 regressions: **PASSED**
- Synthetic cleanup: **PASSED**
- Production modified: **NO**
- Phase 15 ready: **YES — not started**
