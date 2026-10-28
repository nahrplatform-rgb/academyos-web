# I4a — connected attendance design contract

28 October2026. Policy accepted for design; **connected-design approval pending**. [Accepted bounded policy](i4a-online-attendance-decisions.md), [engineering/security/retrieval preparation](../04-engineering/i4a-online-attendance-preparation.md), [PYSA preservation ledger](../03-design/pysa-behavior-preservation.md).

## Connected role-specific journey

J12 / IMP-J12-A01; J13 / IMP-J13-A01 only the reasoned Owner direct-correction subset. L08, SEC-J12/SEC-J13; AO-035/036/037/038/042/045 are partial associations. Existing full requirement/acceptance statuses stay open.

1. Schedule entry shows the actual dated assignment, branch, effective date/time, timezone, publication and recording window. Trainer sees only assigned published work. Owner enters through their session context. No separate recurrence-derived Today or fake dashboard.
2. Open attendance: header/context and complete-roster coverage stay visible. Pages have explicit loaded range/total, previous/next, per-player saved/unmarked state and no hidden assumption that an unloaded player is absent. Local fixture deliberately has four players over two pages; production target is50 per page, up to1000 total, pending data-boundary feasibility/measurement.
3. Select player: contextual pane shows the selected name/session/current status. Desktop reuses sidebar → roster → inspector; phone uses roster → detail → labelled Back. Shared presentation does not grant authority.
4. Record Present/Absent → review exact person/date/old/new → acknowledge → confirm. Pending prevents another submission. Confirmed result updates saved coverage and can be reopened with its history. Unmarked remains a distinct unresolved status; no completion or automatic absence.
5. Trainer sees a clear Owner-correction route in wording, not an unimplemented in-app request button. Owner selects a committed mark, chooses a different state and enters a reason, reviews, confirms and sees both historical events/actors. No status deletion, implicit approval, after-window edit or new Manager power.
6. Any committed attendance explains the existing session's schedule/roster/publication protection. Owner's review of protection explains blocked move/cancel/roster replacement/withdrawal without performing those operations or presenting a fake successful change. Future exceptional repair policy is not invented.

The review-only actor selector sits outside the product shell and preserves the fictional register for comparing role-specific controls. It is explicitly labelled as simulation, not role switching or a permission bypass in the app.

## State and recovery contract

| State | Required view/action |
|---|---|
| Loading | Roster loading is distinct from zero players; no absence implied. |
| Read failure | Retry roster; do not render a successful empty register. |
| Genuine empty | No players on published roster, zero coverage, no mark action; contact Owner guidance. |
| Before/closed capture window | Read-only roster/status/history; no mark or correction action. Show branch window. |
| Canceled | No capture; preserve identity/history, no inferred replacement date. |
| Wrong role/academy/revoked | Clear private session/roster, show denied state; no data from prior context. |
| Stale current version | Reject the submitted change, show newer state; no blind overwrite or automatic correction. |
| Pending | One operation; navigation/scenario/actor controls blocked while simulated response is pending. |
| Unknown committed / not committed | No saved claim; Check original operation. Committed result returns once; not-committed operation is fenced before deliberate retry with preserved intent. |
| Confirmed save, failed read | Explicit known saved state; Retry reading rather than another save. |
| Back or role/navigation change during edit | Warn before discarding unsaved choice; return to context. Reload resets simulation only, not a product persistence promise. |

EN/AR uses shared controls/native fields, RTL mirroring, isolated dates/times, live status/alert regions and existing focus-to-inspector/Back semantics. No macOS traffic lights. No new dependency, product API, database, email, identity/session, hosted write or real data.

## Local evidence and limits

[Preview README](../../design/i4a-online-attendance/README.md), [automated checks](../../design/i4a-online-attendance/evidence/checks.json), [English desktop](../../design/i4a-online-attendance/evidence/review-en-1440.png), [Arabic phone](../../design/i4a-online-attendance/evidence/review-ar-360.png). Tests exercise in-memory transitions and layout at320/360/926/1440 in both languages, not actual current authorization, server clock/window, persisted attendance, atomicity, database races, provider performance or physical-device usability.

Implementation must replace simulation with the full authoritative operation and re-test all affected scheduling writers under the shared attendance guard. Separate Owner connected-design review precedes that work; working-feature acceptance and independent security/device/load/cost gates remain later and separate.
