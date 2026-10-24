# I2a synthetic player registration — implementation receipt

24 October 2026. Moamen accepted the narrow policy and then explicitly approved the connected registration design for implementation. [Policy](../06-delivery/i2-people-first-slice-decisions.md), [contract and budgets](../06-delivery/i2a-registration-design-contract.md), [security review](../04-engineering/i2a-registration-security-review.md).

## Implemented outcome

J06-A01 / S16–S18: existing Academy Owner → completed setup / explicit initial branch → paginated player directory → fictional name and optional unverified `@example.invalid` contact → scoped name candidates → existing profile or explicit different-person confirmation → review → atomic registration → persisted profile. No login, guardian link, enrollment, invitation or activation is created. Setup has a real Open players link. Existing M1 behavior is retained.

New `/api/people` route validates exact allowed fields, bounds streaming input, enforces same origin/staging/session and shared rate limits. Five explicitly named RPCs enforce current active Owner and academy/resource scope. Three private RLS tables store players, same-name revisions and people receipts. Separate receipts prevent M1's generic operation lookup exposing people results. Audit contains result IDs, never raw names/contact. Lost-response recovery keeps only an actor/academy-scoped opaque operation UUID in session storage; missing receipt is atomically fenced/cancelled before replacement. All other draft fields stay in memory.

## Local verification

- Disposable PostgreSQL 17: **25 groups passed**, including the 16 existing M1 groups plus persistence/projections, changed intent, foreign academy/branch/player/receipt, platform-only and wrong-role denial, revocation, direct gateway bypass, same-name/exact-operation concurrency, stale review, rollback, recovery fence, paginated candidates and function limits.
- Unit tests: **33 passed**. Actual route harness: 15 limiter timeout/denial/outage cases plus invalid fields/size/contact and cross-origin denial; no RPC on denied entry.
- Actual React component with synthetic identity/transport adapters: passed in production and development modes. Checked duplicate distinction, opening existing without creating, stale review, pending submission, lost-response recovery, actor switch, revoked profile clearing, EN/AR draft preservation and 360px reflow. This does not substitute for real SQL/HTTP or hosted identity evidence.
- Build, TypeScript, lint and existing five foundation E2E checks passed. [UI receipt](evidence/i2a-local-2026-10-24/ui-receipt.json), [local scale measurements](evidence/i2a-local-2026-10-24/sql-scale.json). Local 1000-player/800-same-name p95 function execution under6ms and responses under6KiB; excludes HTTP/identity/limiter/cold starts/device. Full proposed budgets remain unverified.

## Staging / acceptance status

Fresh encrypted backup [40084175093](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/40084175093) succeeded. Downloaded ciphertext matched the receipt and trusted successful workflow log; the restored baseline plus forward migration passed the membership boundary suite ([receipt](evidence/i2a-local-2026-10-24/restore-receipt.json)). Recovered plaintext and the disposable cluster were removed. The rehearsal exposed missing signing-extension scaffolding and an outdated unsigned membership fixture; both were corrected in the local restore/test harness without disabling the verifier. Backup safety suite: 11 tests passed. Hosted rollout remains separate. Migration is additive; no account or membership grant, outbound email, existing-record rewrite or destructive rollback is included.

Source implementation and local checks are complete; hosted schema/app/runtime are pending at this point. Owner approval covers policy/design, not the deployed registration feature. Independent human security review, physical-device/screen-reader acceptance, hosted workload/cost meters and broader I2 people/guardian policy remain open. Uncommitted design-chat planning files are preserved separately.
