# SEC-J09 — I3a draft-program engineering review

26 October 2026. This is the implementing agent's engineering/security review, **not an independent human audit**. Design approval permits this synthetic Owner-only implementation; it grants no account access or production release. Current evidence/status: [implementation receipt](../07-handoff/i3a-program-implementation.md).

## Trust boundaries and controls

Browser → Clerk-authenticated, same-origin staging route → entry rate gate → existing signed/throttled database gateway → fresh Owner/membership/setup locks → tenant-bound private tables. Program UUIDs, hidden controls, client counts, preview flags, stale membership and a privileged key are not authority. There are no direct authenticated table grants, generic database proxies, new jobs, email sends or additional account/membership grants.

The immutable program owns definition/context, expected count/windows, reviewed timestamp digest, preparation cursor/digest and version. Each bounded chunk and its audit are atomic. Unique (program,date), current-version locking and exact create fingerprint prevent duplicate committed work. Actor/intent advisory locks serialize create and cancellation; current authority is checked before existing receipts are returned. Ready requires matching reviewed/generated digests, preventing silent timezone-rule drift. Private HMAC helpers are revoked; their message domain differs from gateway/delivery proofs, and no signing key leaves the database.

Ready-only row projections are enforced by the server. Date rows carry an academy key with a composite parent foreign key and tenant/date/cursor index; tenant identity is never supplied as write authority. No Player, Guardian, Trainer, Manager or Platform-only caller gains a training projection. Publication and those roles' future access require separate policies/designs.

## Required evidence

The disposable PG17 suite exercises two academies, wrong roles, suspended membership, forged/missing transport, direct-table/helper denial, exact changed-payload replay, concurrent create/chunk/finalize, observed membership-lock orders, no-commit fences, transaction rollback, injected mid-chunk failure, partial suppression, cursor completeness, stale context, gap/fold rejection, review skip/tamper/foreign binding and changed authoritative generation. Final test logs/metrics are linked in the implementation receipt; inherited M1/people cases remain identified separately.

Route tests cover request size/shape/origin, bounded reads and fail-closed budgets before provider calls. Product UI tests use synthetic adapters: they exercise progress/recovery/state behavior, not actual database authorization or provider availability. Hosted authenticated read/write/isolation and protection checks must be recorded separately after apply. Neither a green CI run nor zero advisor warnings proves full security.

## Residual gates

Independent human review, physical phone/screen-reader use, hosted multi-account direct-API/revocation/concurrency evidence and declared-network load/cost remain open until their own receipts exist. No real children, staff, customers or family evidence may be introduced by this pilot. The four-digit date parser, bounded per-request work and unchanged caller budgets do not establish aggregate service capacity or a commercial unlimited-duration entitlement. Preparation stops with the client; durable autonomous workers/leases are not implemented or silently claimed. Preview receipts prove server validation, not that a person read the screen. Their actor/scope/context binding and current-authority checks remain required even though they grant no standalone data access.
