# SEC-J10 / SEC-J11 — I3b engineering security review

27 October2026. Implementing agent review, **not an independent human audit**. [Actual implementation/evidence/status](../07-handoff/i3b-planning-implementation.md); [accepted policy/design preparation](i3b-draft-session-planning-preparation.md).

## Trust and field boundaries

Current Clerk identity → same-origin synthetic-staging API → existing shared read/write limiter → fixed named RPC gateway with signed actor/path proof → current Academy Owner/initial branch/ready date and staff lifecycle locks → tenant-composite private tables. Browser roles, UUID knowledge, review checkboxes, candidate results and cached memberships never supply authority. Public RPCs are callable only by authenticated transport; private tables and helpers deny clients. Five named entries use empty search paths and statement/lock limits. No generic privileged proxy, service-key impersonation, account creation, appointment restoration, email, paid provider or new worker is introduced.

Projections include selected draft date, capacity/version, minimal eligible Trainer name/ID and minimal player name/ID/count. No contact email, invitation recipient, family relationship, payer/consent, compensation or operational Trainer schedule is exposed. Minimal committed operation results include program/date/version; opaque per-actor recovery remains private and is checked against current authority. Payload history and audit references are private; no names or freeform private fields enter telemetry/audit details.

## Integrity and lifecycle

Existing per-academy Trainer lifecycle serialization precedes Owner/setup/target/selected Trainer row locks. A single canonical order protects save/end and same-academy cross-date overlap checks; player and Trainer intervals use actual immutable UTC timestamps. Row count, current version, exact delta, selected people/branch and eligibility are checked before one transaction writes plan/roster/history/audit. Existing valid replacement state survives failure. Cancellation fences share operation serialization. No ready/incomplete date, stale version, expired/ended staff or unrelated actor can silently become authorized through a retry. Ended Trainer references remain historical and project unavailable coverage; no new membership is added.

## Evidence and remaining gates

Actual disposable SQL tests cover foreign player/date/academy, wrong roles including platform-only, suspended Owner, ended Trainer, direct-table denial, last-place and cross-date conflicts, duplicate/fingerprint/fence, partial injected failure, paginated1001-player roster and bounded SQL timings. Actual route tests cover body/shape/origin/budget failures; actual component tests with synthetic adapters cover recovery/private-state clearing. See F-I3b-001/002 and their passing regression results in the receipt. Source and local fixtures do not prove hosted exploitability or absence of every race.

Before broader release, independently verify actual hosted ACLs/current accounts, appointment-ending/revocation lock order under contention, delayed-response/context switches, helper/gateway tamper/no direct bypass, many-program overlap-query scale and sustained tenant fairness, physical-device/accessibility behavior and independent human/security approval. No prior AI self-review or Owner usability acceptance is promoted to independent approval. Keep inherited M1/people security/privacy gates visible; no real data or production scope is authorized by this slice.

Hosted schema/ACLs were subsequently inspected after apply; advisor findings and rationale are recorded in the implementation receipt. Hosted account-level negative/race/load checks and independent review remain pending.
