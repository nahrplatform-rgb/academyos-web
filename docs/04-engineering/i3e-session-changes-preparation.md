# I3e — session-change engineering preparation

28 October2026. Policy accepted for design28 October2026; connected design approved for implementation28 October2026. [Policy/PYSA packet](../06-delivery/i3e-session-changes-decisions.md). This preparation is not runtime evidence; current implementation and rollout are linked below.

## Scope and affected boundary

Current Owner → bounded same-origin API → fixed signed operation → current academy/branch/program/session/version/visibility → atomic effective schedule/cancellation/history/audit/receipt. Existing Trainer → published dated projection with current accepted assignment, not historical/withdrawn/canceled state. No privileged UI key, impersonated identity or widening access to make discovery work. Policy approval creates no actual account grant.

Preserve academy lifecycle locking shared by q6/r7/s8/staff ending; current authority rechecked at commit. Existing published snapshots are immutable; withdrawal remains required before mutation. Identify all writers/readers of occurrence date/UTC intervals, including program preparation, whole-program apply, publication targets, scoped calendar list and Trainer seven-day cursor. Original identity/history cannot be rewritten by moving composite keys. A newly moved occurrence must not be hidden by the old range or emitted on both old/new date. Canceled plans do not occupy active slots; concurrent cancellation/move/enrollment/publication must agree on that state.

## Connected design states to review

Owner dated list/detail → move input or cancellation reason → before/after with retained Trainer/capacity/roster count and explicit audience → confirm → persisted result/history/reopen. Show “Withdraw before changing” for published dates and link existing withdrawal. Cancellation clearly differs from withdrawal: withdrawn session remains planned; canceled session does not operate. Moved session remains private and offers existing publication review, never fake Trainer visibility.

EN/AR, keyboard, phone/desktop; empty/unassigned and inactive Trainer; region loading/failure; wrong role/academy; changed plan/appointment/head; full or overlapping destination; occupied same-program date; DST/overnight rejection; canceled/started state; interrupted request; original committed/lost reply; original did not commit/fence; confirmed change/failed read; leaving/context/account switch. Failure must retain typed intent where authorized and clear private projection after denial. No “all done” for unavailable validation.

## Bounded retrieval, freshness and budgets

Reuse25+sentinel headers/selected roster/history pages, stable scoped cursor, explicit seven-day daily work window; other periods selected deliberately, not a program-length cap. Critical selected-session read plus independent deferred history, not every roster per list row. Derive current effective date/instants and publication state server-side. No private offline storage/public cache. Invalidate old/new date windows, Owner program/date list, selected detail and Trainer schedule after confirmed changes; focus revalidates authority and denial clears names.

Proposed inherited targets: SQLp95300ms, outer statement3s/lock2s; useful view2.5s p95 on10Mbps down/1Mbps up/150ms RTT and small confirmed action1s p95. These are targets, not pass claims. I3d1000-date300ms miss and measured1.4–1.9s sequential hosted reads remain open. Measure query count/bytes, cold/warm list/detail and change latency;20/40/100/1000 occurrence programs;1/25/1001 roster; memory/WAL/fairness and cost. Do not hide misses with timeout relaxation or new arbitrary period caps.

## Mandatory verification and recovery

- Role/tenant/branch/session ownership and forged IDs; ended/revoked membership and assignment; direct endpoint/helper ACL; private/canceled/withdrawn/published visibility.
- Move changes exactly one occurrence; retained capacity/Trainer/roster/identity/history; old slot freed, new occupied; one logical result after repeated operation; changed payload with same key denied; no duplicate dated discovery.
- Source/destination conflict and eligibility queries fail closed. Test first/middle/last child/header/audit faults with full rollback. Retain original valid plan when replacement fails. Test stale plan/head and current clock crossing start before commit.
- Both observed orders: move versus q6 save/r7 activation/s8 publication/withdrawal/staff ending, two moves to same slot, cancel versus enrollment/publication/move, two academies' independent work. No weakening existing assertions to fit a new model.
- Interrupted/lost-reply/reload/reopen/fence/confirmed-write-read-failure at actual SQL/API/React layers and scoped staging proof. Prior working approvals remain separately valid. No positive hosted Trainer grant without separate authorization.

Additive migration needs fresh trusted backup restore rehearsal and before/after business fingerprints. Keep original snapshots/history; repair forward rather than destructive key rewrite/old backup restore. Independent human security approval, physical-device/accessibility, sustained load/cost and Owner working acceptance remain separate gates. Prior AI/local tests do not satisfy those gates.

## Policy acceptance —28 October2026

Moamen explicitly selected “Accept this one-session change policy for design”. This authorizes the connected local design only; separate design approval precedes dependent implementation. No actual account grant, session mutation, financial or notification effect is authorized by this policy acceptance.

## Connected-design approval —28 October2026

Moamen explicitly selected “Approve this session-change design for implementation”. The bounded move/cancel slice may now be implemented and verified. No actual account restoration/invitation, real data, fee/makeup/notification or production authority is inferred. Current implementation/tests/rollout/working acceptance remain separate.

Current execution: [I3e implementation receipt](../07-handoff/i3e-session-changes-implementation.md). The earlier simulation-only statements describe the design-review evidence; they do not supersede the separate implementation/test/rollout record.

## Implementation security review —28 October2026

Engineering self-review of the actual additive migration/API/React: current Owner scope through i2_owner/q6_target; lifecycle lock shared with planning/publication/appointment ending; private-table RLS and no client grants; fixed gateway-attested RPCs; staged-only same-origin8192-byte JSON and fail-closed shared request budgets; expected schedule/plan/head; immutable original keys/snapshots; atomic audit/history/receipts; denied clearing and account remount; no new browser authority/privileged key. Negative role/tenant/helper calls, observed competing commit orders, validation/audit rollback, replay/fence and changed-date discovery are exercised locally. New individual-planning v2 RPCs bind the schedule revision even at plan version0; the existing gateway remains mandatory for legacy reconciliation/internal validation paths.

UI/storage holds only the scoped operation ID across reload; reasons/player names are not persisted to browser storage or telemetry. Current selected-session read combines bounded current metadata/25-name roster and25-entry newest-first history in one request. This proportional implementation choice replaces the preparation suggestion of a separate history request; it avoids an extra sequential call, remains bounded and does not fetch every row. No query failure becomes an empty/conflict-free success.

This is the implementing agent's engineering review, not an independent human/security approval. Hosted signed-in/direct-API/race/failure, physical-device/accessibility, controlled performance/load/WAL/cost and wider scheduling cases remain open. No additional account or third-party disclosure is authorized. See the [implementation receipt](../07-handoff/i3e-session-changes-implementation.md) for exact current evidence.
