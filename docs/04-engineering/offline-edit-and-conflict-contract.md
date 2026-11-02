# Local edits, reconnect and conflict resolution — LF-v3 preparation

2 November 2026. **Owner-directed target; domain rules and connected offline-edit design are not yet approved or implemented.** This extends [the canonical local-data plan](../06-delivery/local-data-and-sync-plan.md); it does not replace current server authorization, atomicity, deadlines, history or previous business approvals. Read-only preview approval remains valid for its scope, not for these newly requested write states.

## What the Owner clarified

- Prepare permitted data in bounded sequences, with a month or three months of dated coverage, instead of redownloading it for each read. Complete directory coverage is separate from dated coverage.
- Retained prepared data should remain readable offline; do not impose the proposed24hour cutoff or the rejected inactivity lock. Same-account/device protection and handling a known loss of access still need implementation/security review.
- Save new work locally while disconnected and synchronize when internet returns. The Owner suggested timestamps for conflict resolution. That is a requested conflict mechanism to evaluate, not permission to silently overwrite another person's work.
- Retention choice:30days without successful online verification, or explicit logout. Keep existing Remove downloads/known-denial controls; unresolved original operations are a separate recoverability class, not disposable read replicas. The fate of *unsent new offline edits* at logout/retention requires the explicit rule below before any outbox is enabled.

These choices are recorded in [the exact Owner response receipt](../07-handoff/evidence/local-first-owner-direction-2026-11-02.json). They grant no new account access, real-data use, production release or automatic approval/financial authority.

## Why a timestamp cannot be the only conflict rule

Example: two devices read plan version7. One device raises capacity from18to20 while offline; another lowers it to16 and saves version8. The first device's clock can be ahead, behind or manually changed. A later local timestamp does not prove that its operator saw version8, and must not silently undo it or create an over-capacity roster.

The [current program/date](../../apps/web/src/components/date-planning-workspace.tsx), [register](../../apps/web/src/components/attendance-workspace.tsx) and [correction](../../apps/web/src/components/correction-workspace.tsx) flows already depend on expected versions, review, idempotent operation IDs and server decisions. Preserve those. **Recommended engineering protocol:** timestamps describe intent/history and help display/order; server revisions determine the editing basis; an immutable operation ID determines duplicate/replay identity. The server's clock governs its existing deadlines unless a new domain policy explicitly accepts another rule. Two edits with the same timestamp are still distinct operations.

Shift read-only reference: `DurableScheduleEditor`, `EncryptedEditJournal`, `JournalSessionController` and `DurableAssignmentNotes` retain exact command packets/base revisions and conflict states; [SR-08/09/12](shift-ios-local-data-reference-review.md). PYSA WF-0005 remains PARTIALLY_REVIEWED: existing local helpers are not end-to-end browser/reconnect proof. Neither reference authorizes AcademyOS offline attendance, signatures or privileged writes.

## Separate data classes

| Class | Durable meaning | Cleanup / authority |
|---|---|---|
| Read replica | Last permitted server rows and coverage, with applied revision | Rebuildable; agreed30day/logout cleanup applies. Not a server write entitlement. |
| Draft input | Work not yet deliberately saved | Keep separately from sync; exact private draft persistence/dirty-leave rules must be selected. |
| Locally saved edit/outbox | Exact user intent plus base versions and operation identity, committed atomically on this device | Not disposable cache. Do not erase/expire it silently during logout, migration, key rotation, storage pressure or replica cleanup. Quarantine versus deliberate discard needs a reviewed choice. |
| Submitted, reply unknown | The original operation may have committed at the server | Reconcile that same identity before replacement. Do not convert unknown to failed/unsent merely because the connection dropped. |
| Confirmed receipt | Authoritative accepted outcome, revision and immutable audit reference | Apply exact result and settle the original intent atomically; failed later read does not undo confirmation. |

## Proposed command boundary — no blanket queue

| Domain | First offline candidate / review preparation | Checks and choices still required |
|---|---|---|
| Attendance register | First candidate: newly selected Present/Absent marks for one already downloaded assigned/published roster; retain existing all-or-nothing register semantics | Exact who/when eligibility, event/roster/mark versions, revoked assignment, window expiry while disconnected, same-player competing mark, current saved-mark correction path. An expired upload must not be silently backdated or declared server recorded. |
| Private planning/program edits | Capture a reviewed draft intent with exact definition, date/roster/capacity versions | Conflict/capacity/overlap checks require server data; signed review receipts cannot be invented or renewed offline. Decide whether local capture is a draft only or may later submit after renewed review. Preserve whole-program atomicity. |
| Feedback writing | Potential private draft text, not automatic submit/publish | Author/assignment scope, text privacy/key/retention, revision conflicts and withdrawal. Publication remains a separate different-account review. |
| Registration | Potential draft capture, not an automatically registered player | Current duplicate comparison and explicit no-auto-merge review; sensitive fields and queued registration need separate acceptance. |
| Corrections, approval/publication, invitation/access/card changes | Recommended online-only consequential decision in the first outbox slice | Current identity/version/recipient/reviewer/publication/authority checks. Do not make an offline grant, approval or visibility change appear effective. |
| Finance, payroll, medical/media and unbuilt roles | Future domain design, no working endpoint or general queue assumed | Immutable monetary records, ownership, amounts/fees/retention and exact role authority; local timestamps never decide balances or permissions. |

The first candidate above is a recommendation, not silent acceptance of new recording-window rules. Prove one complete connected capture/reopen/sync/conflict/recovery journey before extending the mechanism. An app-wide architecture does not require enabling every offline command at once.

## Required state machine and sync sequence

1. Verify local device/account policy and complete compatible basis/coverage. Missing data is Not prepared, not zero; partial rosters cannot be used as a full register.
2. On explicit Save, validate the available local constraints, then atomically persist local projection + immutable intent + original operation ID + base revision. A failed disk commit keeps unsaved input and cannot show Saved on this device.
3. Show **Saved on this device · Awaiting sync**, distinct from **Server recorded**. Use explicit queue counts, retry/conflict destinations and retained task context; no hidden perpetual spinner.
4. A per-scope leader schedules active/reconnect sync, yielding to current work and coalescing triggers. Browser closed/suspended execution is not guaranteed. Identity renewal/access checks and real provider work are measured, not assumed free.
5. Before dispatch, establish current server authority and validate the exact domain packet/review/window/base versions. Use the original ID for uncertain retries. Never re-key an unknown command or blindly replay dependent operations out of order.
6. On accepted server receipt, validate operation/payload identity and atomically apply the authoritative result, retain receipt, mark intent settled and invalidate only affected projections.
7. On conflict, preserve base/local/current values and state the business consequence. Proposed choices: keep server result; deliberately edit/review against the current basis; or retain unresolved work. **No automatic last-device-clock-wins.** Replacing an already settled/conflicting intent needs an explicit new review/operation linked to the old result.
8. On denied access, hide forbidden records, quarantine protected pending work under the eventual same-account recovery rule, stop dispatch and reject late replies. No new account/role can inherit another subject's drafts/outbox. On unknown reply, reconcile first; on storage loss, use reviewed server outcome discovery rather than pretending an outbox survived.

## Exact decisions for the first write slice

Prepare one plain-language packet and changed-state preview that answers:

- What may be **saved on this device**, who may do it, and what coverage/version must already exist?
- If the attendance window expires before reconnection, is the upload rejected into Owner review, or is another explicit timing rule accepted? Current server deadline stays unchanged until that decision.
- If two devices or QR/manual capture disagree, who resolves it and which existing correction/review path applies? Unmarked never becomes Absent automatically.
- At logout/30day cleanup, how are unsent edits safely quarantined or deliberately discarded without exposing them to a different account? Read replicas and pending edits must not share a blanket deletion command.
- How is one atomic18-player save reported if one player conflicts? Preserve all-or-nothing unless the Owner explicitly changes that rule.
- What unlock/recovery/key policy protects retained fields and pending payloads on personal/shared devices? No plaintext fallback, token-as-key or claimed native hardware protection.

Do not re-ask whether persistent local data/offline capture is wanted, whether to add an inactivity lock, or whether the old read-only design is approved. Those answers are recorded. Ask only the concrete new business choices after preparing reviewable recommendations.

## Verification and execution

Add planned cases for month/three-month completeness; zero unchanged snapshot pages on reopen; real offline restart/local save; exact replay after lost reply; clock skew/equal timestamps; two-device edit conflict; access loss; deadline expiry; atomic register conflict; pending-work/logout/quota/key/migration handling; reconnect leadership and physical offline cold launch. Plan entries are not passes.

Follow EX-10 for this expanded architecture/policy/design readiness. EX-02's current-online workspace/read-owner seam is independent safe work and does not enable any outbox. EX-06 owns durable encrypted repository/journal and migration; EX-04 real manifest/snapshot/change transport; EX-03 original outcome/queue recovery; EX-11 operating proof; EX-05/08/09 accompany each. Existing no-store commands remain online until the selected offline slice is actually accepted, implemented and verified.
