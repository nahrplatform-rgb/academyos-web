# Attendance experience redesign —29 October2026

## Authority and outcome

Owner selected **Charcoal spectrum, dark mode as the platform default**, then instructed starting the connected redesign. Light is an alternative in this preview; no production preference mechanism is implemented. Existing business policy and scoped working-feature approvals are preserved. The imported visual-help verdict/studio is reference guidance, not authority to accept new rules. Its blue-led recommendation is superseded by the explicit new palette choice.

Authorized work here: record visual direction and create a connected EN/AR desktop/phone **design simulation** for entry → roster selections → review/save → saved result → corrections/history and recovery. No product source, API, schema, permission, account, provider or staging change. No attendance or notification is sent. Preview actor/scenario controls are outside the product shell.

Traceability: J12 / IMP-J12-A01 manual attendance and J13 / IMP-J13-A01 correction subset; S28/S29; L08; SEC-J12/SEC-J13; AO-035/036/037/038/042/045 associations, not full requirement closure. Existing I4c Trainer request/different-account Owner review remains distinct from first marking. QR remains a separate implemented journey. This manual-register redesign does not simulate a camera or add a dead scanner control; future integration must preserve exact occurrence scope.

## Multi-player policy — explicitly accepted for design

**Accepted register-save policy for design:** select Present/Absent for multiple currently unmarked players, review the exact changed players, then one all-or-nothing save. Any stale version, changed roster/assignment/academy authority or closed recording window rejects the whole new selection set. No partial save; preserve in-memory selections for deliberate comparison/review. Unselected/unloaded/unmarked players remain unmarked. Saved marks are locked from direct Trainer editing; Owner correction/reason and Trainer request/different-account Owner review retain current policy. Clearing an unsaved choice does not delete committed attendance. No Mark all present, automatic absence, Late/Excused, new deadline, offline queue or new role is introduced.

Moamen explicitly selected “Accept all-or-nothing register saving for design” on29October2026. This settles the multi-player rule for design only; connected-design approval is still required before dependent implementation. The prototype is a design simulation, not authority to change the database. The existing per-player a10_mark_v1 and a10_operation_v1 cannot provide this atomic batch result by looping. Future implementation requires a reviewed bounded transaction/receipt/reconciliation contract; business decision and connected-design approval are separate gates.

## Layout and interactions

Charcoal spectrum semantic tokens; layered dark surfaces, restrained cool/violet context and distinct Present/Absent/Unmarked labels. Optional light preview; no four-theme switcher. Three desktop columns: role navigation → working roster → contextual inspector. Before selection, show relevant session/progress guidance. Status marking stays in the center; inspector is not mandatory per player. On phone, navigation is labelled, roster controls remain readable/touchable and optional details open as a focused native dialog. No squeezed three-column phone or fake macOS controls.

Summary distinguishes **saved** from **selected** counts. Existing saved marks have Saved labels; newly chosen rows show Not saved. Search/filter never changes register totals or implicitly selects other players.18-player realistic fictional fixture; large-roster scenario shows50/120 loaded and explicit Load more. Selection survives filtering/loading more and session view return only with a deliberate guard. Selected scope and visible/total counts remain explicit.

Review dialog lists exact affected players/old→new, selected count and remaining unmarked; confirmation is one intentional final action, not a per-player acknowledgement. Existing mark correction uses a reasoned before/after dialog. Native dialog focus/label/Escape behaviour is retained; return focus to the initiating control. Save in flight/unknown outcome blocks replacement, navigation, role and scenario changes. Confirmed-save/read failure offers reading again, never another save. A no-commit outcome is fenced before rereview/replacement. Canceling review preserves selections; discard/navigation needs explicit choice.

## State/recovery/security contract

- Loading, genuine empty and read failure are separate. Read failure never looks like0 players or absence.
- Before start/after24hours from end: read-only/history. Server clock remains authoritative in implementation; preview clock is fixed fiction.
- Access revoked/foreign scope: clear roster, names, selections/history and deny. No data persists in localStorage/sessionStorage in this preview.
- Stale/concurrent mark: show exact changed row and newer mark, exclude no item silently; user explicitly reviews the latest register before any replacement. Original save applies zero new marks.
- Unknown committed/uncommitted: check original save status; no false saved badge. Pending display does not prove commit. Read-only reconciliation and a safe cancellation fence are implementation requirements.
- Corrections: Trainer cannot overwrite saved mark; request stays Pending until a different-account Owner approves within existing window, with current assignment/version checks. Owner direct correction reason/history remains distinct. Guardian only sees current authorized published attendance; no staff reason/other roster exposure is added here.

## Source and PYSA reference inspected

AcademyOS: current attendance-workspace.tsx, lib/attendance.ts, correction entry links, original I4a policy/design and I4c accepted request flow. Actual roster is bounded; first fixture's tiny pages do not imply one production row/page. Do not repeat that as a measured performance fact. Source supports per-player writes and receipt validation; batch write is new scope.

PYSA read-only: components/trainer/session/session-attendance.tsx uses a full roster, dirtyIds and changed-member saving; actions/attendance.ts contains recording/sync/correction paths. Preserve changed-only review and usable roster context. Do not copy PYSA offline/default settings, extra statuses, safety fields or authority assumptions. EV-0024 audit demonstrates separately updated correction/attendance false success and reviewer races under synthetic SDK barriers, not new hosted evidence. New AcademyOS batch and correction writes must commit domain/history/receipt atomically and reject zero-row/stale effects. No PYSA files or live data changed.

## Proposed retrieval and measurable budgets for implementation

Reuse exact published dated occurrence/current server/data permissions. Lists50+sentinel, maximum1000 loaded players; explicit cursors and loaded/total counts. Selected draft remains scoped to actor+academy+occurrence in memory and clears on denial/account/context change. Future proposed batch body≤32KiB; maximum100 marks per save is an engineering recommendation requiring feasibility/design reconciliation for larger rosters, not a hidden product limit. No unbounded preload or all-family/staff projection. Same actor read/write budget; no limiter increase. Revalidate all selected versions/current authorizations within one transaction, not cached UI scope.

Targets, not achieved proof: warm roster API p95≤800ms; first useful phone register≤2s on declared stable4G; local status selection feedback≤100ms; CLS≤0.1; no duplicate/partial effects in100 repeat/conflict/interruption cases. Measure HTTP, query counts, bytes, lock waits, WAL and cost on synthetic staging before claiming performance. No new paid service or telemetry. Local prototype reflow/interaction checks prove only the declared in-memory design, not these budgets or independent security/accessibility.

## Next gates

Policy decision → connected design review → reviewed API/transaction feasibility and security cases → bounded actual implementation → refresh current-source HTML captures → local/hosted verification → working usability acceptance. Independent human/security, wider accessibility/device/load/cost gates remain separate. No current-source visual review is replaced by this proposed simulation.

## Policy decision received during design preparation

Owner accepted all newly selected Present/Absent marks saving together, current checks failing the whole set, preserved selections, Unmarked remaining unmarked and existing saved records using correction. This does not accept an unreviewed payload/roster cap, implementation, deployment or new account access.

## Local design verification — 29 October 2026

The connected simulation and its reproducible checks are in `design/attendance-refresh/`. Eleven grouped cases cover multi-player review/commit, Trainer request and different-account Owner approval, five save/recovery failures, failed-read/denial, read-only windows, a 120-player bounded-loading fixture, and EN/AR at 320/360/390/926/1440px. Screenshots at 390/1440px were visually inspected. The test reports no page errors or HTTP requests. Dialog Escape/return focus and selection-button focus are checked. Correction review Back retains the typed reason in memory.

Evidence is limited to the fictional browser simulation; no app source, API, database, staging deployment, access or current-source review captures changed. Connected-design acceptance remains pending. Full manual accessibility, screen reader, physical devices, backend feasibility, concurrency, load/cost and independent security review remain open.

## Connected design accepted; implementation packet

Moamen selected “Approve this connected attendance redesign for implementation” on 29 October 2026. Authorized outcome: implement the reviewed J12/IMP-J12-A01 multi-player register and preserve J13 corrections, current server clock, roles and tenant/branch/occurrence authority. Trust boundaries: in-memory selections → same-origin bounded API → signed gateway → database transaction and actor-scoped receipt; no notification/provider/account changes.

Feasibility refinement: support the existing maximum 1000-player session rather than introduce the previously proposed 100-mark product cap. Request bytes are bounded at 128KiB for the batch only, other attendance commands retain 8KiB; compact receipt contains kind/event/operation/count rather than 1000 names or marks and stays below the existing32KiB response budget. Current50-player bounded retrieval remains. One academy lock and operation lock protect full validation, all inserts, immutable per-player histories, audit and receipt; any write or final deadline failure rolls everything back. Existing single-mark correction and receipt endpoints remain backward compatible. No new grant, key or service.

Verification required: duplicate/foreign IDs; wrong role/branch/academy; revoked access; replay/fence; mixed stale/new set commits zero; operation ordering versus existing marks/publication/revocation; history/audit failure; deadline crossing; bounded1000-player transaction. UI: retained choices across filter/load, exact review, saved-only corrections, unknown response reconciliation, denial clearing, read failure hiding stale roster, EN/AR phone/desktop and focus. Rollout: additive function/allowlist only after local checks and staging snapshot/backup checks; rollback app to prior build while retaining additive RPC and immutable evidence. Do not delete marks/history to roll back. Hosted, working acceptance and independent gates remain separate.
