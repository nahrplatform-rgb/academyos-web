# I4c — attendance correction request and decision design

28 October 2026. **Policy explicitly accepted for design; connected design explicitly approved for implementation on 28 October 2026.** [Policy and read-only PYSA inspection](i4c-attendance-correction-decisions.md), [trust/retrieval/security preparation](../04-engineering/i4c-attendance-correction-preparation.md), [preview and local checks](../../design/i4c-attendance-corrections/README.md).

## Authorized outcome and boundaries

J13-A01/A02/A03 / IMP-J13-A01 / S29 / L08 / SEC-J13; partial AO-037/038 and AT-037/038. Current assigned Trainer requests a saved Present↔Absent correction, a different-account current Academy Owner approves/rejects with a reason, and the permitted current register/history agrees. Pending is never a changed mark. Existing I4a direct Owner correction and I4b minimal Guardian result remain intact. This packet authorizes a design simulation only: no product API/schema, hosted deployment, account restoration or notifications.

PYSA's saved snapshot/reason/pending/decision pattern informs the design. Actual player correction action source has no located TSX callers, and EV-0024/0071 demonstrate synthetic consistency/authority defects. The preview neither copies its wider roles nor claims to fix PYSA or establish actual database atomicity.

## Connected journey

1. Trainer opens a published fictional session register, with exact branch/sport, effective time and timezone, window and complete paged roster. Saved Present/Absent is explicit; Unmarked points to initial capture and offers no correction request. Select a row for desktop inspector/phone detail with Back.
2. Request correction shows current mark/version and proposed opposite mark. A required trimmed reason (maximum500 characters) precedes exact-player/session/consequence review and acknowledgement. Submission shows pending confirmation. Once confirmed, the request is Pending while canonical mark/version/history stay unchanged. An existing current pending request opens instead of offering a duplicate.
3. My correction requests reopens retained results. The Owner uses an academy-scoped Pending/All retained queue; selected detail shows original/proposed/current versions, deadline/validity and reason. Broad queue rows do not expose reasons. Owner register offers no Trainer request action; existing direct Owner correction remains a separate product path.
4. Owner chooses approve or reject and supplies a required decision reason, then reviews and acknowledges the exact consequence. Approval requires decision, mark, immutable before/after history, audit and receipt to save together. Rejection records the decision and leaves attendance unchanged. The simulated result/history makes that distinction visible; real implementation must enforce it in one authoritative transaction.
5. Requester reopens the permitted decision and shared decision reason. Guardian is a separate minimal view of Alex only: current canonical mark and updated indicator. No other player, request/decision reason, actor identity or review history appears. Changing review actor clears selected private content and draft reason after an explicit discard guard.

A request does not extend the existing24-hour-after-effective-end deadline. Before-start, expired, stale, changed appointment and self-review cases have no approval control. Expired/ineligible examples remain terminal after switching back to Normal; reset begins a new fictional demonstration. Actual requester revision and current Owner checks must execute at final server boundary. A reactivated appointment must never revive an invalidated request.

## Failure and recovery

Loading/failed retrieval never means no requests or an attendance result. Retry is contextual. Denial clears private body; Guardian failed reads hide the current mark. Demo race scenarios deliver a newer direct correction or another Owner's rejection at simulated response time, blocking our decision and preserving current history. This is visual scenario coverage, not real concurrency proof.

Request and decision have separate in-memory operation IDs. During confirmation/unknown outcome, record/actor/scenario navigation and replacement submission are blocked. A lost reply requires Check original operation. Committed outcome opens the original once; not-committed outcome displays the required cancellation fence, keeps the reason and requires a fresh review. Confirmed commit/read failure offers only Load saved result. A failed write leaves request/mark/history unchanged. Real durable receipts, cancellation fencing and current-authority reconciliation remain implementation requirements.

EN/AR covers navigation, form, statuses, errors and recovery; entered reasons stay in their authored language. Language change retains the draft. Back from review returns to edit; leaving an unsaved form through paging/record/role/reset/navigation requires confirmation. Shared phone Back/selection focus and desktop sidebar/list/inspector are reused; no imitation macOS window controls or permanent Refresh saved state action.

## Retrieval, evidence and next gate

Real proposed bounds remain one academy/filter queue25 plus sentinel, one Trainer/occurrence25 plus sentinel, selected exact request/current mark and history 20 plus sentinel; byte-aware 32 KiB responses. Private no-store current reads revalidate on opening/focus/reconnect/confirmed writes and discard obsolete context responses. Demo two-row pages exercise coverage only; no synthetic in-memory timer is claimed as network or performance evidence. Budgets and workload remain unmeasured in the engineering packet.

Local automated receipt covers the request/approval/rejection chain, duplicate/Unmarked, no Owner request, self/deadline/changed-authority, stale/other-reviewer, original-operation recovery, paged coverage, dirty-state guard, minimal Guardian and EN/AR320/360/926/1440 overflow checks. Screenshots are local Chromium simulation, not physical devices or a full accessibility audit. Source strict TypeScript checking is separate. No staging/application/database test or account grant occurred for this design.

Next gate: implement the bounded request/review slice and actual SQL/HTTP/React isolation, failure/race/window/recovery tests. Hosted access restoration requires a separately scoped approval. Independent human/security, physical-device, accessibility, stable-network/load/cost/WAL and prior active-Trainer replacement gates remain open. Wider QR/manual parity, after-window correction, Manager delegation, late/excused and offline are not retired.
