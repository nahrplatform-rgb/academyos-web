# I2c Trainer entry implementation — 25 October 2026

Owner accepted the narrow policy for design, then explicitly approved the connected design for implementation on 25 October 2026. [Policy](../06-delivery/i2c-trainer-entry-decisions.md), [contract](../06-delivery/i2c-trainer-design-contract.md), [security packet](../04-engineering/i2c-trainer-security-review.md). J08-A01 proposed subdivision, J03/J05; scoped requirements named in the packet. AO-017 transfers and wider staff management remain deferred.

## Implemented source

Owner opens completed initial setup → Trainer appointments → fictional name, intended email, explicit fixed Trainer/initial-branch approval → exact review → atomic pending staff profile/invitation/receipt/audit. Durable original delivery has signed queue callback, worker proof/lease, stable provider idempotency, closed exact-recipient allowlist and unknown-outcome stop. Recipient fragment is removed and exchanged for a sealed HttpOnly route-scoped cookie. Current verified intended email plus explicit acceptance creates identity linkage, Trainer membership and branch assignment atomically. Restricted Trainer route shows only own staff name, Trainer role and branch. Owner ends only this Trainer membership/branch appointment with private reason and audit; unrelated roles/academies and history remain.

New private `trainer_people`, `trainer_invitations`, `trainer_assignments`, `trainer_operations`; bounded `t4_*` RPCs use current authority, signed shared throttled gateway, empty search path, 3s statement/2s lock limits and a separate receipt/worker/token domain. No account/membership/recipient seeded. Historical same-email appointments require inspection rather than implicit replacement/reactivation. Reappointment, transfer and restoration remain out of scope. Owner-only staff management does not authorize platform-only or Manager callers.

Existing shared shell/controls, identity/session transport, limiter, cookie encryption, proof verification, queue/email configuration and audit are reused. No new dependency, provider service, telemetry or production launch. Trainer navigation is role specific; no fake sessions, players, payroll or Trainer Today counters.

`TRAINER_STAGING_RECIPIENTS` defaults empty. Both this exact gate and existing ordinary email destination must permit a separately authorized recipient before actual creation/sending. Design approval does not authorize any such grant. Do not reuse the prior guardian authorization.

## Local evidence

- Disposable PostgreSQL17: 33 tests passed, including 8 Trainer cases plus inherited M1/player regressions. Trainer cases cover own projection/persistence, preserving Guardian role on end, tenant/branch/role and receipt isolation, proof/expiry/revocation, no suspended restoration, changed-intent replay, cancellation fences, atomic rollback, concurrent duplicate/accept/end, both read/end and accept/revoke lock orders, worker proof/lease/unknown stop, 25+sentinel paging, exact inspection and input bounds.
- Actual route adapters: 30 limiter denial/timeout/outage cases, recipient gate, input injection/size, missing cookie and cross-origin failures passed.
- Actual worker adapters: opaque queue callback, stable provider idempotency, proof domain, unauthorized recipient, provider accepted versus inbox, unknown outcome, active lease and forged callback passed. No actual email sent.
- Actual React/shared-control adapters in production and development StrictMode passed: explicit approval/review, pending disabled, commit-response loss/reconciliation, once-only fragment exchange, verified acceptance, minimal profile, EN/AR360px no overflow, error/denial clears profile, end denies next read, account switch clearing and opaque recovery-only storage. [Receipts/screenshots](evidence/i2c-local-2026-10-25/production/ui-receipt.json), [development](evidence/i2c-local-2026-10-25/development/ui-receipt.json).
- App typecheck, lint, build and 39 unit tests passed. Broader browser regression and hosted rollout recorded below when executed. A new Trainer invitation privacy-header assertion initially failed; the route header was corrected rather than weakening the assertion. New route/worker/UI suites added to existing CI; PG17 tests remain a local disposable layer.

These are layer-specific tests, not independent human security approval or hosted provider/device acceptance. Named-network p95, provider meters, physical devices/screen reader and real Trainer hosted journey remain open. No performance/cost success is inferred from test duration or unavailable meter data.

## Backup and migration rehearsal

Fresh [encrypted backup run40194036380](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/40194036380) succeeded. Downloaded ciphertext matched trusted successful-workflow SHA256 `4392287964c815e490eada8271d4466521da0ef77a368eeaac3f7b14c201c231`. Restored with PostgreSQL17 and applied the new migration in a disposable socket-only database; existing membership boundary tests passed. [Restore receipt](evidence/i2c-local-2026-10-25/restore-receipt.json). Two academies/three memberships were preserved; zero Storage objects means hosted object recovery was not tested. First local decrypt verification selected the wrong PostgreSQL executable; corrected to PG17 and a fresh extraction destination. Temporary plaintext is removed after rehearsal. Eleven existing backup safety checks passed.

## Migration/recovery and rollout

Additive migration `20261025123233_i2c_synthetic_trainer_appointments.sql`. Rehearse on a fresh encrypted staging backup before hosted apply; deploy compatible gateway first. Preserve private history and repair forward; containment closes Trainer entry/delivery and revokes only new RPC access if necessary. Do not restore an old backup over later operating writes. Hosted advisor output must be reviewed with explicit discussion of intentional deny-all private tables and caller/worker-checked definer entry points, not described as zero findings.

Current status: implementation and listed local checks complete; hosted database migration/deployment/Trainer journey verification and working owner acceptance pending. Independent human security review remains pending.
