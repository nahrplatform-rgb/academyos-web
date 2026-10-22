# Remaining configuration — execution order

Owner authorized continuation on 22 October 2026. This board separates infrastructure actions possible now, feature-dependent implementation and production launch. Update each row with the actual result; a provider key or a checkbox is not completion proof.

## A. Finish staging infrastructure now

| Order | Work | Current state | Required completion evidence |
|---|---|---|---|
| 1 | Consolidate historical/current setup records and navigation | In progress in this revision | Ordered history/register/index; old status headers marked historical; relative links checked; Git commit/push |
| 2 | Verify uptime's scheduled check and operator alert | Manual test passed; high-priority project alert exists | Actual scheduled healthy check; explicit recipient/action review; controlled alert test with received/delivered evidence |
| 3 | Enforce SSL on incoming staging database connections | Provider setting recorded off; clients already verify TLS | Enable on exact staging project, complete provider restart, healthy app/database and subsequent encrypted backup |
| 4 | Monitor backup failures and missed daily runs | First scheduled backup succeeded; independent overdue alert not established | Independent schedule-aware monitor; failure and recovery check-ins; safe notification delivery; delayed GitHub dispatch handled |
| 5 | Set staging backup retention/immutability | No automatic deletion/lock policy approved yet | Concrete duration/cost/custody proposal approved; scoped rules verified; no broad accidental deletion |
| 6 | Exercise hosted file recovery with a synthetic object | Empty current buckets; local mocked-HTTP file roundtrip passed | Private non-personal fixture, actual API download, encrypted independent copy, isolated restore/download/checksum; no tenant/client permission grants added just for the test |
| 7 | Verify custody, provider quotas/notifications and final handoff | Secrets stored; individual runtime proofs recorded | Names-only inventory, clear operator actions/rotation/recovery limits, remaining gates, all changes committed/pushed and provider state rechecked |

Use already authorized technical defaults where reversible and within staging. Ask only for missing owner policy, new credentials/access, billing/terms or browser-required final actions. Any approval should name the concrete prepared change and its consequence.

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
