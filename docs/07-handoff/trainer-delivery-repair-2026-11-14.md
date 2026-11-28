# Trainer delivery configuration repair

**Latest checkpoint:** the Owner redeploy on exact `aedb3ad` reached staging, and the original Trainer invitation reached provider acceptance and normal recipient acceptance. That Trainer was then used on one fictional in-window session. The signed-in local Owner prepared the register, saved two marks while offline, reopened after the original tab closed, and synced one original automatically. See the [local Attendance checkpoint](evidence/ex07-local-offline-attempt-2026-11-14.json). The first attached browser identity failure and the earlier pending-release steps remain historical evidence.

14 November 2026 · EX-07 / MP-B01 · synthetic staging only. This is a bounded continuation of the authorized Outlook Trainer invitation and local functional/offline test. The [single tracker](../06-delivery/experience-execution.csv) still owns priority. No new business rule, schema, account, wrapping key or Attendance command is introduced.

## Current result

The **project settings** now pass the current source limits: one invitation-email destination, two verification-email destinations and one exact Trainer recipient. Remote readback confirmed valid plaintext mailbox lists, their counts and the intended exact matches. The values are not repeated in this public packet. These are temporary settings for the already-authorized Owner/Outlook test.

The current staging deployment is still `dpl_21p2C6fzJDvSoZWzzMun39TutcK5`, source `aedb3adcf58b083f3463b4b2b652f720dff6604a`, Ready. It predates the corrected project settings; project readback does not establish its running environment. **A new deployment with the latest settings is required.** Promoting the old artifact alone will not apply them.

Local development was restarted at `http://localhost:3000/en`, using the existing archived-key recovery into server memory. This is server readiness, not another signed-in/offline journey result. Existing browser sessions, data and pending work were left intact.

## Confirmed causes and prior mistakes

| Evidence | Consequence |
|---|---|
| [email.ts](../../apps/web/src/lib/email.ts), `stagingEmailConfig`, lines14–26 requires exactly one recipient | The two-address configuration failed before the Trainer provider send. An earlier encrypted provider response was also incorrectly treated as a prior plaintext recipient. |
| [clerk-email.ts](../../apps/web/src/lib/clerk-email.ts), lines53–55 accepts one or two unique mailboxes | The three-address verification configuration returned503. Keeping all three test personas in this bounded staging list is unsupported by the current code. |
| [trainer-delivery.ts](../../apps/web/src/lib/trainer-delivery.ts), `deliverTrainer`, lines24–45 begins as `blocked` and switches to `unknown` immediately before calling Resend | This attempt's recorded `blocked` result occurred before a provider send. This reasoning does **not** permit replay of `unknown` or `accepted` delivery. |
| [Trainer lifecycle SQL](../../supabase/migrations/20261025123233_i2c_synthetic_trainer_appointments.sql), retry lines115–116 and delivery lines203–206 | Ordinary retry intentionally excludes `blocked`; preserve the same invitation and provider idempotency key rather than revoke/recreate or reset attempts. |

All six inspected email/Trainer/authority-trigger source files are byte-identical to `aedb3ad`. Their SHA-256 fingerprints and exact evidence boundaries are in [the repair receipt](evidence/local-functional-environment/trainer-delivery-repair-2026-11-14.json).

**Release-record correction:** the agent created production-target deployments `dpl_2hzouEv9gjQbjx6tJ7wJfBzRD6b1` and `dpl_21p2C6fzJDvSoZWzzMun39TutcK5`; Vercel automatically assigned staging aliases. Those were agent-caused release actions contrary to the Owner-only promotion rule. Earlier descriptions of an “Owner-authorized same-source production deployment” were inaccurate and are superseded. No further deployment, promotion or alias change was made during this repair checkpoint. The rule now explicitly covers automatic alias assignment during production deployment creation.

## Existing invitation and guarded recovery

Read-only database verification at **11:59:04 UTC** found invitation `460d1ea9-96da-456d-9373-597e720d405f` for `Synthetic Offline Trainer 2026-11-14`: pending, version1, blocked, attempts1, no provider receipt, no acceptor and no active assignment. Its original approver remains the intended Owner. First attempt:14November02:55:52.389551UTC; expiry:17November02:33:47UTC. No Trainer access has been accepted.

The [operator recovery SQL](evidence/local-functional-environment/trainer-delivery-recovery-2026-11-14.sql) defaults to **ROLLBACK**. It is not a migration or a new user retry feature. Under existing SDR-06 test authority, its eventual application is limited to this exact invitation after the corrected release is verified. It:

- Acquires the existing per-academy Trainer lifecycle lock and rechecks the original approver's active Owner authority.
- Checks exact invitation, recipient digest, version, pending/blocked state, first-attempt timestamp, attempt count, expiry, no provider result, completed lease, unlinked staff and absence of an assignment; verifies the original blocked delivery audit.
- Changes only `delivery` to `queued`, retaining token hash, original IDs, version, first-attempt time and attempt count. It adds one explicit operator audit using a fixed recovery marker. It creates no membership or assignment and sends no email.
- Treats a repeated marker as no additional work. Changed conditions, unknown/accepted sends, expiry or the23-hour original-send boundary refuse recovery. Do not alter timestamps or reset the provider retry horizon to force it through.

At **12:01:48 UTC**, the actual database rehearsal ran the repair twice in one rolled-back transaction. Assertions passed for the single row change, one audit, unchanged non-delivery fields and repeat idempotence. Provider sends0; committed=false. Readback after the rehearsal confirmed blocked/attempts1/version1 and zero persisted recovery audits. Sequence allocation during a rolled-back audit is not a persisted event. This does not prove an email, a released fix, recipient acceptance or offline Attendance synchronization.

The three existing email/auth/Trainer local suites passed **12 tests** in this checkpoint. A no-send check using the actual configuration code accepted the single exact destination and rejected the former two-address list, an encrypted-envelope-shaped value and another Trainer recipient. No real email was sent by these checks. Application source was unchanged; the earlier114-unit and28-case Attendance fixture results retain their original timestamps and scope.

## Exact continuation

1. **Owner release:** on [the current checked deployment](https://vercel.com/academy-os2/academyos-web/21p2C6fzJDvSoZWzzMun39TutcK5), redeploy source **aedb3ad** using the latest Production environment values for the existing **staging.academy.nahr.dev** destination. The agent must not initiate that production-target creation or its alias assignment. This uses the historically checked53-step source, not the uncommitted local edits. Record the new deployment ID; do not claim it is already released.
2. Independently verify the new deployment's project, exact source, Ready state, alias and creation after the settings correction. Retain project readback as separate configuration evidence. Inspect live delivery/configuration results before claiming runtime repair.
3. Recheck the guarded recovery conditions, then apply the same-original requeue with its audit under SDR-06; **do not leave the SQL's final ROLLBACK unchanged and claim application**. Use the normal Owner Retry delivery action and inspect the provider/database result. A changed or refused condition requires investigation, not a replacement invitation or acceptance bypass.
4. The authorized Outlook recipient completes normal verified sign-in and invitation acceptance. Preserve the separate iCloud Owner and Gmail Platform windows. Passwords, verification codes, bearer tokens and invitation token fragments stay out of evidence/chat. An already signed-in mailbox does not prove accepted Trainer access.
5. Create/use a fictional session whose actual start/end puts it within the existing Attendance window; publish through the normal Owner flow after the Trainer is eligible. The20November18:00 draft is **not** recordable on14November. Do not retime a closed/attended session or reset a protected binding. Run the actual `localhost:3100` Owner register → disconnect → local save → close/reopen → reconnect → same-original reconciliation journey, retaining old pending work. Record exact marks, operation ID, server result and EN/AR boundaries.

After the temporary email test, restore the earlier setup destination and Gmail/iCloud verification pair through the recorded environment change and an Owner-controlled release, at a checkpoint that will not interrupt recipient acceptance. Existing Gmail sign-in is retained, but this temporary two-mailbox verification pair does not send **new** Gmail verification messages. Broader permanent multi-recipient behavior requires its own source/contract work; do not widen these source limits by configuration alone.

## Still open

Live connected Attendance offline save/reopen/sync, working acceptance, installed-device behavior and the broader MP-B01/EX-07 matrix remain open. Local Players/Calendar offline reading and the28-case Attendance fixture remain retained evidence. No new commit, push, remote CI, provider-send success, Trainer acceptance or Owner acceptance is claimed. The factual experience HTML needs no recapture for this configuration/documentation-only repair; existing changed product inputs/captures remain the pre-existing local batch.
