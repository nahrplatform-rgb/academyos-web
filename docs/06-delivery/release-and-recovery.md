# Release, incident response and recovery

## Installed PWA updates and recovery — 6 November 2026

Apply the [PWA delivery/readiness contract](pwa-delivery-and-readiness.md#pw-05--service-worker-and-update-ownership) to each changed installed release. Record manifest identity/launch, worker controller/public cache revision, code/protocol and protected repository schema compatibility alongside the existing source/configuration/migration evidence. Test an open older client, dirty input, pending/unknown original, interrupted update and rollback/forward repair. Retain compatible assets and protected pending work; no blanket prefix/store wipe or unconditional focus/controllerchange reload.

An Owner promotion changes the hosted build, not every already installed client instantaneously. Verify each declared installed combination after the relevant release and keep unsupported devices/current old clients explicit. Persistence is not a backup guarantee; OS/user destruction of the only unsynced copy is not recoverable by promising a server restore. Owner-only promotions and current synthetic authority remain unchanged. This planning update performs no PWA install, release, cache deletion or migration.

## Release record

Each release records scope/requirements, commit, package lock, migration set, configuration changes, affected providers, test evidence, known issues, rollback/forward-fix strategy, operator and owner decision. Staging acceptance, production deployment and formal business acceptance are distinct records.

## Release sequence

1. Freeze the candidate and verify required CI/tests against that commit.
2. Review schema and provider changes for compatibility with the currently deployed app and supported native clients.
3. Verify recoverable backup/object state and any required restore rehearsal. Capture pre-change schema/policy fingerprints and reconciliation totals.
4. Apply compatible database expansion through the controlled release identity. Check actual target project and migration result; stop on mismatch.
5. Build/deploy the candidate to the intended production environment without assigning customer traffic where the selected platform supports staging.
6. Run production-safe health, identity, tenant-isolation and critical-path checks. Do not create real charges or contact customers as an incidental smoke test.
7. Authorize promotion, record exact deployment ID and observe initial error/latency/job/payment signals.
8. Capture post-change fingerprints and reconciliation. Obtain role/owner acceptance for the declared scope.
9. Contract/remove old schema only after compatibility windows and pending queues/jobs are clear.

Do not assume a Vercel Git deployment waits for GitHub checks. Implement and test the selected gate from the Vercel runbook. Environment-variable changes and provider settings are part of the release, even if no source code changes.

## Rollback decision

For UI/server regressions with compatible schema, route back to the known-good deployment and verify. For incompatible data changes, use an approved forward fix or restore plan; blindly redeploying old code can worsen the incident. Pause external side-effect jobs when state consistency is uncertain. Preserve queues and provider references.

Rollback does not retract already sent email, downloaded files or confirmed payments. Reconcile and communicate their actual state. A refund or data deletion is a separate authorized business operation, not an automatic rollback step.

## Incident severity and response

| Severity | Example | Immediate response |
|---|---|---|
| Critical | Cross-tenant data exposure, unauthorized money movement, widespread data loss | Contain affected access/feature, preserve evidence, notify accountable owner, begin incident process |
| High | Core login/attendance/payment unavailable, unreconciled committed operations | Activate on-call owner, stop unsafe retries, use documented degraded mode |
| Medium | Partial report/media/email failure with safe core operation | Triage, show truthful status, repair/retry scoped jobs |
| Low | Cosmetic issue or minor help defect | Track and schedule with user impact |

Incident record includes detection time, impacted tenants/features, evidence, containment, provider status, data/financial implications, recovery and follow-up actions. Any notification deadlines/recipients follow the approved jurisdiction/contract policy; this handbook does not invent legal timelines.

## Recovery drills

Practice provider key rotation, identity-provider outage, Redis timeout, stopped job transport, database restore, missing media object, duplicate payment callback and failed deployment. Validate operator access and backup custody before an emergency. Keep sensitive details in restricted incident evidence and write a redacted learning summary.

After recovery, reconcile pending operations and external providers, replay privacy deletions if needed, confirm no duplicate side effects, restore normal schedules and record owner acceptance. A green health endpoint alone does not close an incident involving money or data integrity.
