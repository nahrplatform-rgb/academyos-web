# I2b guardian appointment — implementation receipt

25 October 2026. J07-A01/A02; AO-014/015/016 and AT-014/015/016; S19/minimal guardian view, L06. [Narrow policy](../06-delivery/i2b-guardian-access-decisions.md) and [connected design](../06-delivery/i2b-guardian-design-contract.md) accepted by Moamen for implementation. [Security packet](../04-engineering/i2b-guardian-security-review.md). Working-feature acceptance and independent human security approval are pending.

## Implemented scope

Owner opens a saved fictional player profile → Guardian appointments → explicitly approves recipient/player and reviews the narrow permission → atomic appointment/invitation and audit → durable original delivery record. Verified intended recipient reviews and explicitly accepts → current Guardian membership/person/player link → minimal name/branch view. Owner can revoke pending invitation or end the active link with a private reason. No deletion/restore toggle, sibling inference, payer/consent authority, real relationship evidence or player login.

Separate private people/invitation/link/operation tables preserve identity, membership and relationship distinctions. Recipient proof comes from current Clerk-verified email; request-supplied identity/role/proof fields are rejected. The server/data boundary rechecks current authority; suspended memberships cannot be reactivated by acceptance. Guardian reads use the same minimal field projection even when the identity also has Owner authority. Old M1/people receipt lookup cannot return guardian records.

Gateway includes only five named guardian caller APIs (owner list, command, owner recovery, invitation review/accept/recovery, linked-player read). Worker delivery is a sixth separately signed API; its proof/token domains and provider idempotency key are distinct from Owner invitations. Guardian lifecycle operations serialize per academy before membership/operation locks; read/end and accept/revoke tests observe actual blocked backends in both orders. This bounded pilot trades per-academy contention for a simple serial boundary; broader load is unverified.

Browser state is keyed by identity/context; denial clears private projections, drafts and review. Requests abort/ignore obsolete work; focus/resume reloads authority. Unknown write stores only the scoped operation UUID, blocks replacement and reconciles the original, including a cancellation fence when no commit exists. Tokens enter through a fragment, are removed before authentication, and exchange into a short-lived encrypted HttpOnly scoped cookie. No names, emails or reasons are stored in browser recovery state or telemetry. Existing private telemetry settings are unchanged.

## Local verification

- 34 disposable PostgreSQL17 groups passed:16 M1 +9 player +9 guardian. Includes two academies/other player, roles/platform-only, wrong recipient/forged proof/direct unsigned gateway, expiry/revocation, suspended membership/approver, replay/changed intent, atomic rollback, cancellation fences, separate links/pagination and actual lock contention. [Runner](../../scripts/guardians/test_boundary.py).
- 36 unit tests passed. Actual guardian route harness passed30 limiter exhaustion/timeout/unavailable cases before provider/RPC, invalid bodies and cross-origin denial, no-cookie acceptance denial and default-closed recipient gate. [API harness](../../scripts/guardians/test_api.mjs).
- Actual worker with synthetic provider/queue/database adapters passed stable idempotency, opaque queue message, unauthorized-recipient blocking, provider unknown and lease retry cases. No mail sent. [Worker harness](../../scripts/guardians/test_delivery.mjs).
- Actual React/shared-control harness passed in production/development: explicit approval, pending prevention, commit response loss, pre-send cancellation, original recovery, stale notice clearing, deliberate recipient inspection, fragment exchange once in StrictMode, acceptance, minimal view, EN/AR360px no overflow, ended/denied access and identity clearing. [Receipts/screenshots](evidence/i2b-local-2026-10-25/production/ui-receipt.json). Synthetic HTTP/session adapters do not prove hosted permissions.
- Build, typecheck and lint passed. Six foundation E2E checks passed, including guardian route denial, unsigned callback denial and public invitation/referrer policy. No dependencies added or existing assertions weakened. New API/worker/UI checks are included in the existing verification workflow; disposable SQL remains a separately run local suite.

[Local measurements](evidence/i2b-local-2026-10-25/sql-measurements.json):50 executions per function, one linked player, under32KiB. This measures disposable database execution only; no hosted/browser p95, cold-start, provider-meter or cost-ceiling claim.

## Backup, schema and hosted boundary

Fresh encrypted staging backup [40187626852](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/40187626852) succeeded. Ciphertext SHA256 matched the trusted successful workflow receipt; verified archive restored with this additive migration and existing membership boundary checks. [Restore receipt](evidence/i2b-local-2026-10-25/restore-receipt.json). Temporary plaintext/disposable cluster removed; empty Storage inventory does not prove hosted object recovery. Eleven backup safety checks passed with pinned dependencies. Initial local recovery selected the wrong PostgreSQL executable; corrected to PG17 and used a new extraction directory. No production connection was used.

Supabase applied `20261025111253_i2b_synthetic_guardian_appointments` to synthetic staging. The local CLI-created filename was renamed to the provider-recorded version with identical SQL. Four new tables have RLS and no anon/authenticated direct SELECT; all six APIs have empty search path and3s statement/2s lock settings. Five require attested caller authority; only worker delivery grants anon execution with a fresh signed worker proof. Existing counts remain two academies, two memberships and four players; guardian people/invitations/links remain zero.

Security advisors show18 informational deny-by-default RLS/no-policy tables, two anonymous definer APIs (existing Owner worker plus guardian worker) and21 authenticated definer APIs. These deliberate narrow APIs are reviewed/tested but warnings are not suppressed or treated as an independent audit. The new worker requires its signed proof and independent exact-recipient allowlists; public unauthenticated transport abuse/cost protection remains subject to provider controls and broader review.

`GUARDIAN_STAGING_RECIPIENTS` defaults empty: appointment creation fails closed before RPC/publication until Moamen separately authorizes an exact recipient and access scope. The existing email delivery allowlist must also permit that recipient. No environment recipient, invitation, membership or link has been added by this rollout. No actual guardian send/grant is authorized by design approval.

## Rollout and remaining gates

App source/CI/deployment/runtime results are appended after verification. No production launch or merge. Independent human security review; hosted two-account/other-child/field/revocation/recovery and workload/provider-meter checks; physical-device/screen-reader and working EN/AR owner acceptance remain open. Containment revokes only new RPC execution and entry/delivery capabilities, preserves private records/audits and repairs forward. Do not restore an older backup over later writes.

### App rollout — 25 October 2026

Source `9c6e3ae001048ddbb1bf0376e7e99335a82efce8` committed and pushed to the existing draft PR. Existing synthetic staging deployment `dpl_3Ce1wV8Ko3Q1JpFahNG7tUyW9bV4` reached READY and includes `staging.academy.nahr.dev` alias. Vercel target `production` belongs to this existing synthetic staging project; no customer production launch. Exact-source CI runs40188329771/40188326750 both passed.

The post-commit anonymous worker-role database check also passed with valid and forged proofs, lease retry, failed/unknown outcomes and send-stop behavior. Deployment code is unchanged by that test improvement.

### Hosted initial checks and language correction

The existing Owner opened player `Synthetic Registration Demo` → Guardian appointments. Current read and empty state succeeded. Vercel environment metadata confirmed no guardian recipient configuration. Submitting `guardian@example.invalid` was refused with “No invitation was created”; database recheck confirmed zero guardian people/invitations/links/operations, two memberships and four players. [Hosted screenshot](evidence/i2b-hosted-2026-10-25/recipient-gate-en.png). No provider call or access grant.

The live draft language switch exposed an unnecessary discard confirmation. The follow-up moves language handling before the leave-page discard guard. The new regression reproduced the problem before the correction, and requires preserving email and explicit confirmation with no dialog. Ordinary leaving still guards unsaved drafts; pending/unknown operations still block navigation. Build/lint and actual React production/development checks cover the correction. The temporary browser tab's confirmation could not be dismissed through browser controls; that limits this initial live Arabic check. Follow-up source/deployment and fresh-tab results are recorded separately.
