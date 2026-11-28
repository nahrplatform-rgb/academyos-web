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

## Hosted rollout and bounded checks

Source `1e8a6e48e7c2819d8f07f68444067eab8fd20838` committed/pushed. Exact-source CI40194398666 and40194401099 succeeded. Deployment `dpl_9hKXY9GUYmkQrGkNC5jJkhQjyJ3A` is READY with `staging.academy.nahr.dev` alias. Vercel's production target belongs to the existing synthetic staging project; no customer production launch. Compatible gateway deployed before hosted migration apply; `i2c_synthetic_trainer_appointments` applied successfully.

Hosted schema readback: two academies, three memberships, four players and one existing ended Guardian link unchanged; zero Trainer people/invitations/assignments. Six new RPC execution budgets and ACLs match contract: five authenticated caller APIs, one anonymous worker-proof API with authenticated execution denied. `TRAINER_STAGING_RECIPIENTS` absent/default closed; no environment values changed and no invitation or grant created.

Owner A live Trainer appointment screen shows correct existing initial branch, empty list and disabled incomplete review in EN/AR. Same Owner account's direct Trainer profile route denies access with no staff projection. Signed-out `/api/trainers` and unsigned `/api/jobs/trainers` return401. Public invitation route200 has no-store and no-referrer. Python's local certificate store could not verify HTTPS; switched to system curl with certificate verification intact. [Hosted receipt](evidence/i2c-hosted-2026-10-25/checks.json), [Owner screen](evidence/i2c-hosted-2026-10-25/owner-empty-en.png), [denial](evidence/i2c-hosted-2026-10-25/owner-without-trainer-denied.png).

Hosted advisors report22 deny-all RLS/no-policy information entries,3 anonymous definer warnings and26 authenticated definer warnings. Trainer additions are four intentionally private tables, one signed worker entry and five caller-authorized RPCs. Warnings are not suppressed or treated as independent approval. See [anonymous definer guidance](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable) and [authenticated guidance](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable). Unsigned/wrong-role/tenant tests remain necessary; advisory counts alone do not establish safety.

Status supersedes the earlier pre-rollout line: implemented, locally tested and deployed; scoped hosted checks above passed. Actual Trainer invitation→acceptance→own profile→end/next-read denial is pending separate recipient/access authorization. Broader hosted direct-API/race/recovery, workload/provider meters, physical device/accessibility, independent human review and working Trainer owner acceptance remain open.

## Prepared single hosted lifecycle check — authorization pending

Proposed: current Owner A appoints fictional “Casey Demo” in AcademyOS M1 Synthetic Academy's existing branch, intended recipient `moamen_ghareeb@icloud.com`. Temporarily permit only this destination for Trainer delivery and existing email configuration, use current Owner UI and audited operations, restore closed Trainer gate and original email destination after one send. Recipient verifies/signs in and explicitly accepts in their separate browser; verify own name/Trainer role/branch only, no player or Owner powers. Owner ends this appointment and verify the next request denies it. No restoration, additional role, academy B change, real staff data or replacement invitation. Prior Guardian test authorization is not reused. Current state contains zero Trainer records.

## Single separately authorized test initiated

Moamen authorized one Casey Demo Trainer invitation to the approved iCloud account and ending test. Original Owner UI appointment persisted; provider accepted first attempt. Original email destination restored, Trainer gate empty/closed, and restoration deployment `dpl_AmNBMVa5viivJnXyjLQW1s5n7kAv` READY at product source `1e8a6e4`. Recipient acceptance and ending/denial remain pending. [Execution receipt](i2c-trainer-hosted-test.md). No further grants or restoration authorized.

## Single authorized hosted lifecycle completed

Recipient accepted and live EN/AR staff profile was observed. Owner ended the exact appointment through reason/review/confirmation; next recipient refresh denied and removed the profile. Database confirms ended Trainer membership/assignment, one appoint/accept/end audit each, other Owner/Guardian roles active. [Execution and limitations](i2c-trainer-hosted-test.md). Working Trainer usability acceptance and broader hosted/security/device/performance gates remain pending.

## Working-feature owner acceptance — 25 October 2026

Moamen selected “Accept the working Trainer journey”: invitation → review/accept → own name/Trainer role/branch → Owner ends appointment → next refresh removes access. EN/AR wording/usability accepted. This supersedes earlier pending working-feedback status only. Broader direct-API/race/recovery, performance/cost, physical-device/accessibility and independent human security gates remain open. No Trainer restoration, new invitation or further grant follows from this acceptance.
