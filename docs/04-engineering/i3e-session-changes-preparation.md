# I3e — session-change engineering preparation

28 October2026. Design preparation only; policy/design approval pending. [Policy/PYSA packet](../06-delivery/i3e-session-changes-decisions.md). No functional implementation or hosted mutation.

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
