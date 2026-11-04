# Journey security review and delivery gates

## Persistent local data and synchronization — LF-v2,2November2026

The local-replica gate in [local-data and sync plan](../06-delivery/local-data-and-sync-plan.md) supplements existing per-journey gates: same-account/academy/branch/link fields and indexes, known denial/late reply, lease expiry/clock rollback, missing/corrupt keys, logout cleanup failure, browser eviction, transactional watermark, tombstones and concurrent tabs. Local read approval does not approve offline commands. Independent security remains open;54passing Shift synthetic tests are reference proof only.

**3November register readiness:** the Owner now requires ordinary sign-in without mandatory passkey/local-secret setup; this does not waive private at-rest or same-account recovery protection. [concrete device/key packet](offline-register-device-key-contract.md) keeps physical localhost PRF success separate from actual RP/account binding and protected pending recovery. [15disposable DB cases](../07-handoff/evidence/offline-register-transport-2026-11-03.json) verify canonical replay/fence/authority/deadline/publication behaviour. These results neither enable private storage nor close SEC-J12/SEC-J16. In particular, account-string AAD is not fresh same-account proof, and the current `reconcile` cancels missing operations; a sync adapter must not treat it as a passive lookup. No new read cutoff or inactivity lock is introduced.

[Later16automatic-key browser cases](../07-handoff/evidence/automatic-local-key-2026-11-03.json) prove the candidate's selected crypto/storage lifecycle with a fictional key authority. They permit inactive adapter engineering, not private enablement or an independent pass. Real account/device/field/key custody, incomplete-cleanup residual keys, same-origin script access, trusted time, storage eviction/migration and hosted authority remain in the [checkpoint gates](automatic-local-key-readiness.md).

## Working-day/shared-state review overlay — 2 November2026

Apply [WB-01–WB-24 and pending WB-P choices](../03-design/academy-working-behavior-contract.md), [working-day acceptance](../06-delivery/academy-working-day-acceptance.md) and [tracker](../06-delivery/experience-execution.csv) to every affected boundary. EX-10 prepares scoped ownership/freshness/operation-discovery decisions; EX-11 requires operating proof. This overlay is not an independent audit, new private-data policy or authority grant.

Review at least: cross-user/academy/role/branch/link keys and late replies; private projection versus navigation/draft/operation data; current authority at reads and commands; denial/logout/account-switch cleanup; stale-display age and disconnected revocation limits; speculative work retrieving unauthorized/unused fields; cross-tab hints and app-version compatibility; dirty version conflicts; unknown-command discovery and storage failure; idempotent replacement fences; retention/purge limits. Persistent private payloads, queues, tokens/QR bearer values and new telemetry remain excluded without their separate decision.

Test enforcement at server/API/database boundaries as well as visible UI; keeping a shell mounted or a cache hit never replaces those checks. A current-policy check or invalidation hint must not be inferred from a cached displayed role. Targeted refresh must not silently retain withdrawn family content or reissue an uncertain operating save. Record exact data class, actor, evidence layer and current-versus-proposed policy; no speed/appearance score waives a failed isolation or integrity case.

Updated 22 October 2026. Required process under the [engineering charter](../00-governance/engineering-charter.md). This is a review framework and planned coverage, not an executed security audit. Use the [security architecture](security-and-privacy.md), [journey register](../03-design/journey-register.csv) and [security coverage matrix](journey-security-matrix.csv).

## Defense contract

For every journey identify what can go wrong, prevention, detection, containment, recovery and proof. Map actual trust crossings: browser/session, academy/branch/role, API/database/RLS, privileged worker, private storage/signed URL, external callback, shared cache, offline device, export and support operator. Record sensitive fields and who can see them, not just which page contains them.

A hidden button is UX, not authorization. A provider token proves identity only within its reviewed purpose. An admin key bypasses some database protections and requires constrained actor/resource validation. RLS does not replace application/field/transaction rules. Backups do not prevent unauthorized reads or duplicate payments. Rate limits do not grant permission. Logs and alerts require safe redaction and operational ownership.

## Review packet template

```text
Packet ID SEC-Jxx-action/version; journey/action; requirements; screens:
Change/commit and environment; reviewer and date:
Actors and current authority; data classes; entry points and trust crossings:
Assets and invariants; misuse/abuse cases:
Prevention: identity, capability/tenant/resource/field checks, validation,
  transaction/idempotency, cache/storage/job boundaries and rate/size limits:
Detection: redacted event/reference, signal, route/operator and test:
Containment: bounded scope, pause/revoke behavior and safe failure mode:
Recovery: operation reconciliation, credential/access correction,
  data restore or compensating action; authority and limitations:
Cases: positive, cross-tenant, wrong branch/role/field, revoked/stale,
  direct API/file/function, concurrency/replay and applicable failures:
Evidence: expected/actual, layer, fixture, build, actual result and limitations:
Open risks/policy blockers; owner and required remediation:
Design review / implementation / verification / acceptance status:
```

For narrow changes mark irrelevant controls N/A with a reason and review affected existing invariants. Do not mark every cell N/A because no new endpoint was added: UI, caching, exports and dependency changes can expose existing endpoints differently.

## Milestone gate matrix

| Gate | Required security work | Evidence and stop condition |
|---|---|---|
| Design ready | Identify assets, trust crossings, misuse, authority and policy dependencies; propose prevention/detection/containment/recovery | Reviewed packet and applicable negative cases; unresolved ownership/child/financial authority blocks dependent design approval |
| Build ready | Specify server/data enforcement, scoped cache/file/job behavior, idempotency and test fixtures | Implementable contract, not a security-labelled UI mock |
| Implementation verified | Run meaningful relevant checks and inspect final diff; compare actual policy to intended contract | Layer-specific results; missing hosted/provider evidence stays pending |
| Staging demonstration | Use two academies and wrong-role/branch/revoked personas; test direct access as applicable plus recovery and redacted signals | Runtime proof on named build; no secrets/real child records in artifacts |
| Journey acceptance | Reconcile actual UI/API/actions against packet and tests; review unresolved risks and role outcome | Owner acceptance separate from test execution; no critical boundary failure waived by visual approval |
| Pilot/production release | Revisit combined cross-module boundaries, effective permissions, privacy/retention, recovery, provider modes and incident readiness | Production-specific evidence and explicit launch decision; staging success is insufficient |
| After changes/incidents | Reassess affected packets after new roles, fields, dependencies, routes, cache, migration, provider or policy changes | Regression cases and updated evidence; old green status is not inherited automatically |

Security is reviewed alongside the five journey dimensions: usability must not conceal authority; speed/cache must preserve isolation; correctness includes current permissions; cost controls cannot bypass validation; recovery cannot resurrect revoked access or erased records. Keep failed controls visible individually.

## Minimum adversarial checks by boundary

- Identity/context: wrong issuer/audience as applicable, wrong account, expired session, tenant ID swapping, stale role/guardian link and late response after context switch.
- Read/export: minimal fields, wrong branch, unpublished/private notes, complete pagination scope, access revoked during export and private artifact expiry.
- Mutation: direct API/function access, forged actor/resource, repeated idempotency key with changed payload, concurrent approvals/capacity and lost response after commit.
- Files: foreign object reference, mismatched content/type/size, pending upload ownership, expired signed URL, unauthorized originals/derivatives and spreadsheet injection on export.
- Jobs/providers: invalid or modified signature, replay, duplicate/out-of-order event, stale authorization/lease, exhausted retry, unsafe redirect/destination and receiver outage.
- Browser/offline: unsafe content rendering, cross-origin mutations, private cache leakage, shared-device logout/reopen, obsolete queue/schema and revoked offline authority.
- Operations: secret/log/build exposure, unnecessary privileges, environment confusion, abusive expensive queries, per-tenant resource starvation and tested safe recovery.

These are check categories, not proof of implemented mitigations. The actual case must name inputs, expected state/denial, persisted outcome and evidence layer. Inspect query/response bodies safely without storing private data in telemetry.

## Detection, containment and recovery ownership

Each sensitive action needs an attributable audit event with original actor and safe operation ID, an actionable signal for important failures/abuse, named operational owner and a bounded response. Avoid collecting raw request bodies to make investigation convenient. Determine alert threshold and retention before enabling new telemetry; current privacy settings are not changed by this plan.

Containment may revoke a capability, expire an invitation, pause a scoped job or restrict an affected academy under approved policy. Do not use broad silent deletion or disable authentication as an incident workaround. Recovery must distinguish rollback, compensating adjustment, reconciliation and backup restoration. Each has different authority and historical effects.

## Findings and residual risk

Track finding ID, journey/action, severity with rationale, reproduction, affected environments, evidence, owner, remediation, re-test and closure. Separate source suspicion, synthetic reproduction and demonstrated hosted impact. Proposed fix is not closure. Known tenant isolation, child privacy, unauthorized access or financial-integrity failures block the affected release. Other residual risks require explicit owner decision, containment/workaround, scope and expiry; no automatic risk acceptance because a deadline is near.

## Coverage maintenance

The coverage matrix has one planned entry per current journey family J01–J28. Before a family enters implementation, split it into action-level packets and link exact requirement/case IDs and evidence. One family row does not prove every action reviewed. Current entries are **Planned / Not executed / Not accepted**. Existing foundation checks and provider proof do not close unrelated rows.

At each milestone compare the journey register, actual rendered actions, server operations, database/file grants and jobs with these packets. Newly exposed paths must not be missed because they lack a sidebar item. Reconcile this review with the difficult scenarios OPS-01–OPS-10 in the [operating blueprint](../01-product/saas-operating-blueprint.md).

4 November SEC-J12/16 key boundary: the [inactive register key checkpoint](../07-handoff/owner-register-key-checkpoint.md) verifies current Owner, tenant/device/event binding, concurrent provisioning and authenticated wrapping in a disposable PG17 test. Product lifecycle, hosted custody and independent review remain open.

4 November SEC-J12 component evidence: [inactive Owner register dispatch](../07-handoff/offline-register-dispatch-checkpoint.md) exercises signed current Owner, original-account matching, tenant denial and late receipt fencing with fictional authority and disposable PG17. Independent review and actual private lifecycle evidence remain open.
