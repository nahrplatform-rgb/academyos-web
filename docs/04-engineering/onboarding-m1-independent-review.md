# M1 independent security review handoff

Status: prepared for a separately named reviewer; review/approval not executed. This packet does not authorize repository disclosure, contact with a third party, account grants, new services, production rollout or acceptance of residual risks. Moamen requested security/privacy as an independent gate. The [charter](../00-governance/engineering-charter.md) states: “An AI reviewing its own output is not an independent human/security audit.” Engineering self-review and green CI do not satisfy that gate.

Moamen subsequently requested Codex perform the review. The resulting [engineering review](onboarding-m1-engineering-security-review.md) records a verified execution-limit regression and its bounded staging repair, an open abuse-control gap, advisor dispositions and residual cases. It is explicitly the implementing assistant's review; no independent human reviewer, acceptance or waiver is inferred.

## Review target and authority

Review the complete M1 change in draft [PR #1](https://github.com/nahrplatform-rgb/academyos-web/pull/1), not only the latest UI patch. Current deployed implementation: `e32f7dba85e4506cf37666dff1ae7f56ea3de9fb`, existing AcademyOS staging, deployment `dpl_4MKTn8zR8Bs8yq86kC2syXiNWFnD`. Later documentation-only commits preserve test provenance. Confirm the final PR head/diff and current canonical alias when beginning the review.

Accepted scope: J01–J05 bounded synthetic academy creation, intended-recipient invitation, explicit owner acceptance and resumable setup. Relevant AO-002–009/011/012/019 and security/privacy AO-169–180 remain scoped, not whole-family completion claims. Policy/design approval, separately authorized grants/test memberships, implementation, hosted tests, deployment and Product Owner acceptance are distinct. Read the [accepted action/security packet](../06-delivery/onboarding-m1-decision-design-packet.md) and [current execution receipt](../07-handoff/onboarding-m1-staging.md).

Abuse-control follow-up: inspect the [gateway change packet](onboarding-m1-abuse-control.md), including its proof replay window, transport limiter, current JWT/role checks, legacy entry points, trusted network header, failure behavior and app-before-database rollout. The shared caller gate and provider-entry budget are deployed and scoped actual A/B-session REST/app and limiter checks are recorded. This does not close the independent review gate or broader network/billing cases.

## Material boundaries to inspect

- Clerk issuer/session/authorized-origin validation, current verified-recipient proof and identity versus academy membership. Signup, link possession, Platform Owner capability and cached UI state must not confer tenant authority.
- Browser → onboarding API → caller-token/publishable-key RPC. Verify current role/tenant checks before new mutations and successful-operation replay, actor-scoped receipt absence, private-table grants/RLS, function EXECUTE grants/search paths and safe exception mapping. No service-role application client.
- Atomic academy/appointment/owner constraints, operation request immutability and audit history; common locks and ordering for duplicate/concurrent/stale/revoked operations. Inspect the actual applied forward conflict repair, not just migration intent.
- Fragment removal, encrypted HttpOnly handoff, cookie scope/lifetime, route-scoped readiness across identity hydration, private state reset and late-response exclusion. Review failure/unknown outcome and receipt recovery; do not treat the cookie as ownership.
- Delivery intent/lease/generation, signed QStash worker, bounded attempts and provider idempotency/unknown outcomes. Confirm no destination override, duplicate appointment, expiry extension or accidental send on denial/replay.
- Signed Clerk verification-email callback: bounded raw body, signature freshness, exact staging instance/template/destination, original-event expiry, fixed message, provider idempotency and hashed throttling. OTP/recipient/body must not enter app storage/logs; provider retention is separate. Only the authorized template has native delivery disabled.
- Canonical staging direct-entry policy versus retained preview/generated-URL protection, environment/project binding, secret custody, privacy filters, cache/referrer policies and rate-limit failure behavior. Standard Protection is owner-authorized; it is not a public customer launch.

## Evidence map and limits

| Area | Available evidence | Still separate/open |
|---|---|---|
| Authoritative data | [Implementation](../07-handoff/onboarding-m1-implementation.md), 16 isolated PostgreSQL groups including concurrency/revocation ordering | Local/simulated claims do not prove every hosted caller/provider path |
| Two populated academies | [Two-account packet](../07-handoff/onboarding-m1-two-account-isolation.md): actual A and B HTTP setup/read/save-replay/receipt boundaries; B platform list/create guard; unchanged pre/post aggregates; UI recovery | A and B cases have explicit differing source provenance; fresh/conflicting writes, live account-transition races and every later domain action are not covered |
| Roles/revocation | [HTTP boundary](../07-handoff/onboarding-m1-http-boundary.md), [verification](../07-handoff/onboarding-m1-verification.md), [write/revocation](../07-handoff/onboarding-m1-write-revocation.md) | Same-account role changes are not separate persona sessions; concurrent hosted write/revocation remains open |
| Invitation/provider recovery | [Email repair](../07-handoff/clerk-verification-delivery.md), signed negatives, fresh recipient receipt and distinct B acceptance | Hosted expiry/reissue, unknown/exhausted delivery and all live provider retry orderings remain incomplete |
| Browser/auth entry | [Account entry](../07-handoff/onboarding-m1-auth-entry.md), [handoff race reproduction/fix](../07-handoff/onboarding-m1-handoff-recovery.md), actual React production/development tests and hosted release boundaries | Synthetic identity/transport is not real Clerk hydration/cookie-race proof; follow-up wording acceptance remains open |
| Performance/abuse/cost | [Scoped measurements](../07-handoff/onboarding-m1-verification.md): historical warm reads, offline read recovery, current B 20-read/10-committed-replay bursts | Full navigation, skewed/multi-actor/new-write load, billable provider meters, physical devices/accessibility and full performance budgets remain open |

Known dependency carry-forward: development-only high-severity braces advisory recorded in PR; unchanged lockfile is not remediation. Refresh actual advisory applicability/fix availability before deciding its handling. No claim of a complete supply-chain audit.

Verification continuation: [local scale and keyboard evidence](../07-handoff/onboarding-m1-scale-and-keyboard.md) adds a skewed synthetic database fixture, paging/read/write assertions and eight React-mode/locale/viewport keyboard profiles. These do not close independent review, hosted load, native popup/screen-reader/device or provider-cost gates. Review the benchmark/adapter scope and retained hashes rather than treating local timings as a hosted SLA.

## Review completion record

Record reviewer name/role, exact commit/diff/environment/date, inspected boundaries, tests independently observed or reproduced, findings with severity and affected action, required remediation/retest and any explicitly handled residual risks. Do not copy secrets, real codes, recipient payloads or raw session headers into this record. A claimed tenant leak, unauthorized grant or private-data disclosure stops the affected work until investigated; do not hide it by changing expected outcomes or deleting history.

Reviewer: unassigned. Independent review result: pending. Findings: not assessed by an independent reviewer. Owner acceptance and full M1 acceptance: separate and pending. Contact/disclosure authorization: not provided by this packet.
