# I4c — Trainer attendance correction request and Owner decision

28 October 2026. **Moamen explicitly accepted the correction-request rules for design on 28 October 2026. Connected-design approval remains pending.** [Accepted I4a manual attendance/direct correction](i4a-online-attendance-decisions.md), [accepted working I4b Guardian view](../07-handoff/i4b-guardian-training-implementation.md), [engineering/security preparation](../04-engineering/i4c-attendance-correction-preparation.md). This advances I4 before QR/manual parity and later development/finance; it does not claim the full attendance stage is finished.

## Outcome and current behavior

J13-A01/A02/A03 / IMP-J13-A01 / S29 / L08 / SEC-J13; scoped AO-037/038 and AT-037/038. Current assigned Trainer can record an initial Present/Absent mark but cannot replace a saved mark. The current UI directs them to the Owner; the Owner already has a reasoned direct correction during the recording window. There is no implemented correction-request queue, durable review or approval operation. The broad earlier prototype demonstrates an intended pattern, not accepted permission policy or database behavior.

Accepted outcome for design: Trainer opens their actual published session and saved mark → requests the opposite status with a reason → sees a pending request while attendance stays unchanged → Owner sees the before/proposed/current values and reason → explicitly approves or rejects → Trainer can reopen the permitted result → Guardian sees only the current approved attendance through their separately approved active link. No notification or actual grant follows from this packet.

## Accepted policy — design preparation only

| Choice | Accepted rule and consequence |
|---|---|
| Who requests? | Only the current active Trainer assigned to that exact published occurrence, for a rostered fictional player with a saved mark. Owner direct correction remains available. No Manager delegation, Guardian correction request, general scan, drop-in or Platform Owner bypass. Resolve the current principal on the final boundary, not a supplied role or old request context. |
| What changes? | A request proposes Present↔Absent, records the saved mark/version and requires a reason. Unmarked is not an error state and is not converted to Absent; initial recording keeps the existing path. A pending request does not change attendance, history, attendance-protected scheduling or Guardian output. |
| Who decides? | Only a current Academy Owner, with explicit approve/reject and a required decision reason. Requester and reviewer must be different accounts; an Owner who also holds a Trainer role uses the existing direct-correction path rather than self-approving a request. A reason entered for this review is visible to the eligible requester and Owner; separate internal notes are not introduced. |
| Deadline? | Both request and approval must be within the existing recording window: from effective start until24 hours after effective end, using server time and branch timezone. Filing does not extend that deadline. After the deadline, a still-pending request is expired and cannot be approved or used to change attendance. Rejecting a still-pending expired request is unnecessary; show the terminal expiry. After-window correction remains a separate unresolved rule. |
| Duplicate/stale requests? | At most one pending request for the same occurrence/player/current mark version. Same original operation replays; a second request must resolve the existing one instead of creating duplicate approvals. A changed canonical mark/version makes a pending request stale; never automatically approve it even if its proposed value happens to match the new mark. Show current state and require a fresh eligible request if needed. |
| Changed authority? | Recheck requester eligibility and the original appointment/assignment revision at approval as well as the Owner's current authority. Ending/suspending/changing that appointment invalidates its pending review; reactivation does not silently revive old requests. The former Trainer loses private reads/actions; current Owner can retain the academy's request history. No access restoration is authorized here. |
| Approval/rejection effect? | Approval must atomically save the decision, exact version-checked canonical mark, immutable before/after attendance history, request decision history/audit and operation receipt, or none of them. Rejection records its reason/decision/history/receipt while leaving attendance unchanged. Two reviewers/approval versus direct correction cannot both apply incompatible decisions. No delete, silent overwrite or partial-success status. |
| Minimal visibility? | Owner sees this academy's bounded request queue and selected exact request. Trainer sees only their own currently authorized requests and relevant session/player result. Guardian sees only the updated canonical mark/correction indicator already approved in I4b, with no request reason, decision reason, requester/reviewer identity or review history. No finance, email, export, attachment, child login, late/excused or offline side effect. |

Request/decision text is fictional and limited to500 characters, consistent with existing attendance correction input. This is an input/payload bound, not a retention rule. Retain submitted/decided records; retention/deletion schedules remain unresolved. No new free-text telemetry or client-persisted sensitive reasons.

Why this next: it completes the existing saved-mark → review → current-register chain before adding QR credentials/camera or offline replay. QR/manual parity and correction requests remain open until actually delivered and verified; this recommendation does not retire them or reset prior accepted work. The prior active-Trainer replacement hosted case stays separately open.

## Connected design after policy approval

Reuse the shared compact-blue shell, panes, accessible inputs, exact-session context, scoped paging, current-role messages and original-operation reconciliation. Trainer remains a session-focused requester; Owner gets a queue/detail decision experience. EN/AR phone/desktop should cover draft reason, before/proposed/current diff, pending, approved/rejected, duplicate, stale, expiry, changed assignment, failed reads and pre/post-commit interruption. A new request and review operation need separate operation IDs; reconcile an unknown result before allowing a replacement. No decorative queue or success before commit.

Policy approval authorizes design preparation only. Separate connected-design approval precedes dependent implementation; any actual hosted Trainer/Guardian account restoration or additional access needs its separately scoped explicit authorization. Existing ended Casey and Guardian test links remain ended.

## PYSA reference inspected — read-only,28 October 2026

Source **37d8901ca1cde805c126f6f3ac83d996ece953a0**, `/Users/moamenghareeb/Pro Youth Football Academy`. No PYSA modification, account/provider access, real data or live behavior test.

- `platform-description/PYSA-platform-brief-for-another-AI.md` describes a proposed change/reason → authorized decision → agreeing attendance/audit result; `PYSA-current-surface-reference.md` inventories request/review actions and FND-0015.
- Actual `pysa-platform/actions/attendance.ts` requestAttendanceCorrection and reviewAttendanceCorrection: useful saved-status snapshot, reason, pending/approved/rejected and Owner queue invalidation. Source request accepts Owner/Manager/Trainer and review accepts Owner/Manager/super_admin; those broader roles are not AcademyOS authority. No TSX caller of these two exported functions was found in the inspected source search, so action presence does not prove a connected or working legacy screen.
- The review action updates request status before a separate attendance write and omits an affected-row/version guard. It may save approval on failure or zero affected rows; concurrent reviewers may leave an incompatible decision/mark. AcademyOS must use one authoritative atomic operation and current-version checks.
- `engineering-audit/03-evidence/database/EV-0024-attendance-correction-consistency.md`: actual action with synthetic SDK/barrier reproduced partial failure, zero-row success and reviewer race. These are in-process source evidence, not actual SQL/hosted race proof. Do not copy its transaction assumptions or claim remediation from a preview.
- `EV-0071-attendance-helper-authority.md`: supplied helper role could exceed wrapper policy in synthetic cases. Every request/review/reconcile read or write must resolve current authority; helper arguments and old role snapshots grant nothing.
- `components/attendance/staff-correction-modal.tsx` is a separate staff presence/payroll-related manual correction, not the player's request-review UI. Do not treat its missing-checkin/out/timestamp/late/excused flow as policy for this slice.

## Connected review prepared —28 October 2026

[Connected design contract](i4c-attendance-correction-design-contract.md) and [local EN/AR preview](../../design/i4c-attendance-corrections/README.md) cover the accepted rules and interruption states. Design approval, product implementation, database/hosted verification and working acceptance remain separate and pending. No actual account access was restored or expanded.
