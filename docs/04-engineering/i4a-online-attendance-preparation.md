# I4a engineering and security preparation

28 October2026; proposed policy and design pending. See [decision packet](../06-delivery/i4a-online-attendance-decisions.md). Packet SEC-J12/I4a and SEC-J13/I4a covers online manual capture plus reasoned Owner direct correction only. This is engineering planning, not security approval or implemented functionality.

## Trust crossings and invariants

Authenticated browser → same-origin application operation → signed current-principal data boundary → academy/branch/exact occurrence/publication/assignment/roster → canonical attendance/history/audit/receipt. No privileged key or submitted actor/role authorizes a mark. Current Owner/Trainer authority is rechecked at every read/write/reconciliation; ending appointment or removing assignment blocks the next request and clears private UI on denial.

One canonical mark per occurrence/player. Correlated operation ID and payload hash give one effect; changed payload under the same key is rejected. Each consequential transition, version, before/after history, audit and receipt commit together. Do not implement correction as independent “approve then update” writes. Current server time controls the capture window; captured/received timestamps remain distinct and neither browser timezone nor timestamp can extend authority.

All attendance and existing scheduling writers need a shared locking/order contract: mark racing withdrawal, move, cancellation, plan or roster replacement must serialize to one valid outcome. Once a mark exists, proposed history protection applies even when the caller uses an older API/preparation. Existing q6/r7/s8/I3e regression suites must remain intact. Recheck publication, appointment, roster, eligible player, expected versions and time after locks and before commit. Preserve historical identity; no delete/reinsert of dates or roster to repair conflicts.

## Retrieval and freshness design targets

- Reuse authorized actual schedule discovery for Today/upcoming; derive branch-local day from effective instants and timezone, never weekly rules. Unavailable is not empty.
- Open one selected occurrence header plus roster/marks in deterministic pages of at most50 rows with a sentinel/cursor; request minimal IDs/display names/status/version. No contact, family, finances or unrelated profiles. Exact page contract must be finalized from current roster source during design.
- Show loaded/total coverage and remaining Unmarked truthfully. Pagination must reach the entire published roster; do not claim completion from one page. Historic before/after events fetched on demand, at most20 plus sentinel.
- Private `no-store` responses; account/academy/role/occurrence/version scoped client state. Abort obsolete reads and reject late responses after navigation, sign-out or scope changes. Clear private data on denial. Revalidate on open, focus/reconnect and confirmed commit; no permanent manual-refresh prerequisite or repeated background polling.
- Independent row pending states; confirmed receipt updates the row, unknown result retains operation identity and exposes Check original operation. After known save/read failure show confirmed-save status and Retry reading, not another mark. Offline capture is unavailable; no implied durable queue.

## Measurable proposed budgets

At up to1000 fictional roster entries,50-row pages and bounded on-demand history: roster SQL p95≤300ms; mark/correction SQL p95≤300ms; authenticated end-to-end roster/commit p95≤1500ms on declared stable staging network; roster page≤32KiB uncompressed JSON; critical UI useful≤2.5s on a declared phone/network. One selected page request per navigation, one operation per mark plus bounded reconciliation; no full-program roster or per-player request fan-out. Test25 and1000-row rosters separately, cold/warm HTTP and scoped SQL separately. Record device/network, sample counts, retry counts, query plans, rows/bytes, lock waits, DB/WAL growth and audit amplification. These are targets, all unmeasured; provider time and physical-device budgets cannot be inferred from local SQL.

## Acceptance and adversarial cases to implement

| Case | Required outcome |
|---|---|
| Assigned Trainer / current Owner | Complete authorized published roster; explicit mark, confirmed persistence and reopen; Owner reasoned correction retains prior event. |
| Two academies; wrong branch/role; Platform Owner alone | Deny reads/writes/direct function calls and disclose no roster, contacts or historical values. |
| Revoked membership/appointment, removed assignment, withdrawn or canceled date | Current request denied; no stale UI authority or queued retry effect. |
| Non-rostered/archived player; foreign player/event; forged actor/status | No new mark or history/audit success. |
| Same key concurrent duplicates / changed payload | One effect and original receipt / explicit mismatch denial. |
| Distinct operations racing on same mark | Expected-version conflict; no last-client-time-wins. |
| Mark vs move/cancel/withdraw/plan/roster change | Serializable valid result; attended identity/roster/history preserved. |
| Boundary time, moved date, DST, bad device clock | Saved effective UTC window governs; authoritative clock rechecked at commit. |
| History/audit/receipt failure, zero-row update | Entire transaction rolls back; no fake success or incomplete correction. |
| Lost reply / cancellation fence / revoked reconcile | Original operation reconciled without replacement; denial does not leak prior private receipt. |
| EN/AR; phone/desktop; keyboard; failure/load/empty | Clear session context, labelled controls, coverage/status announcement, focus return, no overflow; no accidental absence. |

Detection: redacted operation/resource reference, reasoned correction audit, denial/conflict/rate and unknown-outcome signals without names, raw payloads or free-text reasons in telemetry. Operational handling: Product/Platform Owner assesses signals under existing access scope; no new alert destination or retention policy is activated by this packet. Containment uses existing scoped appointment/access ending and fail-closed operation limits, never a broad bypass. Recovery is original-operation lookup, version-aware reread or authorized reasoned correction; backup does not replace atomicity.

Migration/repair plan remains pending implementation design: additive attendance/event/receipt structures, scoped constraints and ACL, guarded integration into existing writers, trusted encrypted backup/restore rehearsal before authorized staging apply. No historical mark synthesis, old roster alteration or policy weakening. Independent security review, actual direct-API/SQL races, physical devices, load and cost gates remain open separately from future Owner usability acceptance.

## Preparation verification —28 October2026

Documentation-only checks passed: implementation-register validator preserves68 screens,30 stable action groups and180 canonical requirements with separate delivery statuses;56 relative Markdown links in the four changed packets resolve;11 documentation CSVs have consistent row widths; `git diff --check` passes. No product tests were rerun for these documentation-only additions. Policy is proposed, connected design is not yet produced/approved, attendance implementation and deployment have not begun, and no runtime/performance/security acceptance is claimed.

Subsequent Owner reply explicitly accepted the bounded I4a policy for design. [Connected preview contract](../06-delivery/i4a-online-attendance-design-contract.md) and local simulation now exist; connected-design approval remains pending. Local in-memory interaction checks and strict TypeScript pass; EN/AR layouts checked at320/360/926/1440 with no horizontal overflow. Screenshot review found an over-wide checkbox, corrected through scoped CSS and checks rerun. These are design checks, not product/database/window/current-authority/performance proof. No attendance implementation, staging deployment or account grant occurred. The six current design/documentation packets have68 valid relative Markdown links; existing register and11 documentation CSV structures remain valid.

## Implementation approval and contract refinement —28 October2026

Owner explicitly approved the connected attendance design for implementation. [Current source/evidence/rollout](../07-handoff/i4a-attendance-implementation.md) supersedes prior pending-design checkpoints. Actual byte-aware paging can return fewer than50 players/20 history events to preserve the existing32KiB transport ceiling for multibyte names/reasons. One in-flight consequential operation per register deliberately blocks replacement until original reconciliation; no speculative batch authority. Attendance-specific write/reconciliation budgets are60/minute per actor at both entry and signed gateway, with deny/timeout/outage remaining fail-closed; other mutation budgets are unchanged. These engineering choices do not expand roles, states, window or side effects.
