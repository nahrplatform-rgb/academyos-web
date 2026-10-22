# Remaining configuration — execution order

Owner authorized continuation on 22 October 2026. This board separates infrastructure actions possible now, feature-dependent implementation and production launch. Update each row with the actual result; a provider key or a checkbox is not completion proof.

## A. Finish staging infrastructure now

| Order | Work | Current state | Required completion evidence |
|---|---|---|---|
| 1 | Consolidate historical/current setup records and navigation | Complete; initial consolidation `78c3f71` pushed; final receipts/operator guide added | Ordered history/register/index; old status headers historical; links validated and source synchronized |
| 2 | Verify uptime's scheduled check and operator alert | Complete for current process monitor | Scheduled 200 checks, displayed 100% uptime; named-owner staging alert 1403422; test/recovery emails observed in approved mailbox |
| 3 | Enforce SSL on incoming staging database connections | Complete | Exact-project switch on after restart; subsequent verify-full DB export and encrypted independent backups succeeded |
| 4 | Monitor backup failures and missed daily runs | Configured and controlled failure/recovery verified | Monitor 2492943; UTC 02:17, 90-minute dispatch grace/30-minute runtime; real start/error/ok check-ins and recovery email. Deliberately waiting through a missed daily run was not performed |
| 5 | Set staging backup retention/immutability | Complete for accepted staging scope | Seven-day scoped lock; owner explicitly approved 30-day expiry; enabled rules reviewed. Actual overwrite/delete rejected with ObjectLockedByBucketPolicy and unchanged read-back in 39746661788; admin can remove rules |
| 6 | Exercise hosted file recovery with a synthetic object | Complete within the same staging service | Real private fixture → encrypted R2 copy → local recovery → separate private restore path → matching download/hash and public denial; exact test objects removed. Independent hosted-project disaster recovery remains a launch gate |
| 7 | Verify custody, provider quotas/notifications and final handoff | Verified operator setup; Sentry tier transition pending | Names-only stores checked; owner-confirmed recovery-key vault copy; operator runbook; actual Cloudflare $0.00/default $10 warning reviewed, no paid upgrade. Sentry post-trial review and production budget remain owner gates |

Use already authorized technical defaults where reversible and within staging. Ask only for missing owner policy, new credentials/access, billing/terms or browser-required final actions. Any approval should name the concrete prepared change and its consequence.

## Next action: build the controlled onboarding/permissions slice

No missing staging secret or unfinished account connection is currently blocking feature development. Before its dependent implementation, resolve D-002/D-003 (academy admission and authority), then build controlled platform administration/onboarding. Resolve the provider-blocked Sentry free-tier transition and verify quotas before expiry; no paid conversion or future reminder is authorized by this record. The current setup is not approval to add real academies.

## B. Configure with the corresponding application feature

These cannot be completed by adding more account variables alone. They require reviewed application/database behavior and test cases.

1. Platform administration and academy onboarding: accepted D-002/D-003 scope, initial administrator provisioning, branch scopes, role/membership lifecycle and audit. Signup remains identity only until then.
2. Tenant Storage permissions: resource ownership, role-scoped upload/finalization/download, expiry and cross-tenant denial; preserve private buckets.
3. Invitations/notifications: transactional outbox, scoped recipients, actual templates, consent/quiet hours where relevant, delivery webhooks and retries.
4. Business background jobs: durable state, idempotency, retry/dead-letter/reconciliation and per-operation permissions. Existing QStash synthetic receipts do not implement these.
5. Payments: provider/entity/merchant/money-flow decision, sandbox keys, verified callbacks, ledger/reconciliation and approval before live credentials.
6. Player/guardian consent and age policy, offline authority, finance and evaluation rules: resolve the named business decisions before their dependent modules.

## C. Before real academies / production

- Separate production Clerk issuer, Supabase/database/storage and service credentials; exact production DNS/origins/callbacks.
- Confirm provider plan/commercial eligibility, region/cross-border policy, budget/spend controls, responsible operators and recovery custody.
- Approved per-data retention, backup lock/retirement, RPO/RTO and whole-service recovery rehearsal, including objects/provider reconciliation.
- Full tenant/role/branch and sensitive-data tests through deployed APIs/Storage/UI, operational monitoring and incident response.
- Pilot onboarding/acceptance and explicit launch decision. Staging success does not grant production acceptance.

## Resume/stop history

The owner previously stopped after uptime creation, preserving local documentation. That stop is superseded by the current instruction to organize the records and proceed. No Codex reminder or autonomous follow-up task was requested; application provider schedules operate independently.

## Sentry free-tier request — 22 October 2026

Owner requested the free Developer tier. The live subscription still shows Business Trial, 13 days left, with no billing details/payment method on file. The documented cancellation route returns “Your plan is not eligible to be cancelled.” No plan change or payment was submitted. Immediate downgrade is provider-blocked; the requested target is free Developer, and the exact post-trial effective plan/monitor behavior must be verified rather than assumed. Support contact has not been authorized/sent. Existing monitoring remains active.

Trial-end monitoring caveat: Sentry’s official Crons guidance says that, without pay-as-you-go budget, having more than one active Cron monitor at trial end disables Cron monitors. AcademyOS currently has one backup Cron monitor; the separate uptime monitor is a different product. This does not verify the Business trial’s automatic plan transition or uptime entitlement. Keep the free-tier target and verify effective plan, active monitors, privacy settings and alert delivery at transition. Source: https://www.sentry.help/en/articles/13963929-do-my-cron-monitors-stay-active-after-my-crons-trial-ends .
