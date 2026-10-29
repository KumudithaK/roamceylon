# The Ceylon Edition — Launch

## Current state

- Protected staging release: `a353e2705eca4132109e80b7ca77d5c9e3a148b2`.
- Human UAT: **HOLD**. Commercial Launch is not authorized.
- Current entry blocker: a classified `realtime.default_acl` grant-option mismatch. Fingerprint reconstruction supports added explicit SELECT and INSERT grant options for `postgres` in `supabase_admin`'s `realtime` table defaults. The actor, cause, timing, authorization, and net effective authority remain unproven.
- Do not treat the classification as approval to change privileges, replace the trusted baseline, bypass the guard, or resume UAT. Obtain owner/provider provenance review and separate authorization before any staging access or next entry step.

## Goal and evidence

Complete one controlled Human UAT and Elevate's full customer-to-settlement demo. The demonstrated path must cover customer enquiry, journey design and allocation, proposal generation and export, exact-version acceptance, simulated deposit and account activation, fulfilment, settlement, profitability, and profit sharing. Verify amounts, permissions, customer-safe output, audit effects, and cleanup with recorded evidence. Do not describe an unexecuted step or an unimplemented profitability or profit-sharing rule as passed.

Use the current release report and the Human UAT plan, authorization request, fresh-entry verification, default-ACL reconciliation result, launch manifests, and manual walkthrough as the detailed evidence and execution sources. Reconcile their dated statements with the latest verified state; an older PASS does not clear a current HOLD.

## Autonomous local work

Agents may inspect local files and Git history, develop in isolation, run offline tests, and write local documentation. Keep work scoped to the requested task. Preserve existing Git worktrees and their uncommitted changes. Do not use local or historical test results as a substitute for fresh, separately authorized staging evidence.

## Human approval gates

Require explicit human approval for each bounded action involving:

- Any staging access, including reads, browser visits, API requests, database queries, and administrative metadata checks.
- Any staging write or Human UAT execution.
- Creation, assignment, removal, or use of temporary identities or privileged sessions.
- Migration application or migration-history changes.
- Fixture or identity cleanup.
- Deployment, alias changes, or protection changes.
- Any Production access or action.
- Any change to financial rules, including pricing, profitability, margins, settlement, payment, payout, or profit-sharing logic or configuration.

Approval for a plan, prior run, read-only check, or staging release does not authorize a later action. State the exact target, scope, expected effects, evidence, rollback or cleanup boundary, and stop conditions before requesting approval. Do not automatically retry a failed or ambiguous privileged action.

## Protected state

Preserve protected business records and original audit rows; retain legitimate new audit history. Preserve source hashes, reviewed manifests, migration history and ordering, account and other sequence values, existing Git worktrees, the original Super Admin, supplier and pricing data, global benefit definitions, storage objects, grants, RLS, guards, and deployment protections. Do not reset sequences, rewrite history, delete audits, weaken permissions, broaden cleanup, or alter a trusted baseline to make a check pass.

Human UAT fixtures must be synthetic, owned by an exact-ID ledger, bounded by the approved plan, and independently reconciled. Stop on drift, missing ownership evidence, unexpected writes, private-data exposure, wrong amounts or dates, cap breaches, or ambiguous results. Perform only separately approved cleanup whose ownership and safety assertions still pass.

## Setup boundary

Creating this file alone authorizes no branch switch, commit, push, staging query, Production access, UAT action, migration, cleanup, or deployment.
