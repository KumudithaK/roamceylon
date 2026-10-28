# Approved local Zod security patch

28 October 2026. **LOCAL PASS; controlled staging release approval still required.**

Human authorization: “Approve minimal local Zod security patch.” This extends only local package/lock preparation and regression validation, not deployment or database activity.

## Exact patch

1. `package.json`: direct Zod requirement `^4.3.6` → exact `4.6.6`.
2. `package-lock.json`: root requirement matches; the single resolved Zod copy changes4.4.3→4.6.6 with its registry tarball/integrity only. Structural comparison confirms exactly those four lock-leaf changes; no unrelated dependency entry changes.
3. `tests/dependency-security-compatibility.test.ts`: one added regression verifies manifest/root-lock/installed equality, exact4.6.6 and absence of older resolved copies. Removing only that added test reproduces the previously reviewed file's SHA-256 exactly.

Registry metadata was retrieved directly for4.6.6; package has no new dependency/engine/peer requirement. Clean frozen `npm ci` installed438 packages using Node24.22.1 and verified the lock's integrity. Next16.4.1, Sharp0.35.5 and eslint-config-next16.4.1 remain unchanged. No override or broad audit-fix was used.

The patch addresses [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5). This report does not claim a newly deployed fix, penetration test or oversized-input/OOM reproduction.

## Actual validation after installation

- npm audit: exit0, **zero vulnerabilities** (info/low/moderate/high/critical all0).
- npm dependency tree: exit0; app/resolver/react-hooks/validation-error consumers deduplicate to Zod4.6.6, with compatible existing peer ranges. Six pre-existing optional WASM/fallback entries are still marked extraneous by full `npm ls --all`, not invalid versions; no dependency churn was introduced to silence them.
- Full suite: **566/566**, architecture/secret-boundary validator PASS, zero failed/skipped.
- Focused CR7/schema/DTO/security/finance/Operations suite: **157/157** across12 files.
- TypeScript, Next16.4.1 production build, repository lint (0 errors/5 warnings), changed-file lint (0 errors/2 warnings) and diff checks PASS.
- The ten prepared application files, other five changed test files and migration001 retain their prior reviewed SHA-256 values. Historical protected runner and34/34 pins remain unchanged in the source worktree.

The final combined code/test/dependency/SQL hashes and exact uncommitted diff are in [source manifest](launch-reviewed-source-manifest.json) and [review diff](launch-reviewed-source.diff). See [local validation evidence](launch-local-validation-evidence.json) for final document hashes and boundaries.

No commit/push, migration, staging query/write, pricing update, Auth identity, fixture, account increment, browser diagnostic, Vercel deployment/alias change or Production access occurred. The prior staging snapshot is historical evidence, not a newly queried baseline. Commercial Launch remains NOT AUTHORIZED.
