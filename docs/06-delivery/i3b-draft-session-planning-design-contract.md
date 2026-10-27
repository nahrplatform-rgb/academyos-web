# I3b connected draft-date planning design contract

27 October2026. [Policy accepted](i3b-draft-session-planning-decisions.md); **connected design awaiting Owner review**. [Preview](../../design/i3b-draft-session-planning/README.md) at http://127.0.0.1:3209/ . This is an in-memory local simulation, separate from the deployed I3a program journey. No product/API/database/provider/account changes.

## One connected outcome

Saved draft-date list → select a specific program/date/time/timezone → inspect its current capacity/Trainer/roster → Plan this date → enter explicit capacity, select up to one eligible same-branch Trainer or leave unassigned, search/select existing fictional players → review Current/New values and exact additions/removals → acknowledge this dated change → pending → confirmed saved plan → Back/reopen. Selecting another date retains the date list and changes context only after deliberate discard of unsaved work. Different dates remain independent; no recurring enrollment or full-program bulk implication.

J10/J11, grouped IMP-J10-A01; S23/S24/S26; L07; SEC-J10/SEC-J11, scoped AO-023/024/027/028/031 plus current-authority/atomicity/idempotency requirements. Proposed concrete commands: inspect draft date, review dated plan, commit dated plan, reconcile original operation. These describe the proposed narrow actions; they do not renumber the canonical journey register or complete the grouped action.

## States and review behavior

| State | Visible behavior and next useful action |
|---|---|
| Initial date loading | Loading message; no empty-schedule claim |
| Date read unavailable | Failed read with Retry dates; synthetic fixture list appears only after retry |
| No plan / empty roster | Capacity “Not set”, Trainer “Unassigned”, zero players; Plan this date |
| Editor | Native required positive integer capacity; explicit Trainer selection; player search/checkboxes and selected names retained outside search results |
| No eligible Trainer | Truthful prerequisite; leave unassigned; no invitation/grant/restore action |
| Invalid capacity / too many players | Reject review and retain choices; no guessed capacity or silent player removal |
| Overlap | Known same-academy conflicting draft identified in Owner context; adjust selection; no override |
| Conflict service unavailable | Unavailable validation blocks review/save; Retry conflict check retains choices |
| Review | Current/New capacity and Trainer; exact player additions/removals; unchanged other dates; explicit dated acknowledgement |
| Pending | Save and conflicting navigation disabled; no success before simulated commit |
| Stale version | Current plan changed; Compare current plan retains unsaved intent and requires fresh review |
| Trainer ended before commit | Original selection remains visible as ended/ineligible; explicit eligible replacement or unassigned choice, then review |
| Limited / known failed save | Retain intent; known failure is not an unknown committed operation |
| Unknown reply | Check original operation; replacement and navigation blocked; reconcile the same original simulated record |
| Original did not commit | Simulated cancellation fence; return to retained choices for deliberate review |
| Confirmed save / failed read | Save remains confirmed; Load saved plan retries read without another save |
| Restricted | No private date/Trainer/player data; no alternate-role bypass |

The scenario selector/reset are visibly outside the app frame and labelled design controls. Reset/reload clears the simulation. It does not claim a durable browser recovery identifier, SQL locks, current membership checks or hosted reconciliation. The real implementation must fulfill the [engineering/security/loading preparation](../04-engineering/i3b-draft-session-planning-preparation.md).

## EN/AR and device contract

Shared compact-blue shell, sidebar/work list/contextual inspector and native controls, with no macOS window buttons. Desktop keeps dated list and planning context together. Phone uses selected detail/editor/review with Back to dates and44px controls. Dates localize; synthetic names and time/timezone text are isolated. Review uses explicit Current/New labels rather than direction-dependent arrow meaning. Confirmation text follows the current locale.

The local fixture has3 dates,2 eligible Trainers and4 fictional players, including one overlapping plan. This is not a pagination, large-roster, search-service, server-conflict or sustained-load test. Implemented retrieval must remain25-plus-sentinel with explicit partial-roster/count semantics and on-demand candidates; larger-data interaction needs its own evidence without broadening current policy. No real child/customer data, recipient email, player contact, private staff details or financial projection exists in the preview.

## Evidence and next gate

[Local browser receipt](../../design/i3b-draft-session-planning/evidence/verification.json) records actual status, runtime and tested cases; source hashes bind the built artifact. Standalone TypeScript and link/register integrity checks accompany the design. First local build rejected a CSS input/output filename collision; importing the stylesheet was removed because the builder already concatenates scoped CSS. An initial test tried selecting a nonexistent Trainer in the intentionally empty-Trainer scenario; the fixture helper was corrected to select explicit Unassigned, retaining the empty-state assertion. Final receipts supersede those failed attempts; neither was counted as pass.

Owner review must cover the connected happy path plus EN/AR, phone/desktop and failure scenarios before dependent product implementation. Working-feature acceptance, actual server/database authorization, concurrency/recovery, hosted verification, physical-device accessibility, performance/cost and independent security approval remain separate. Existing accepted AcademyOS rules and the read-only PYSA review govern; the design simulation does not supply new permissions or business defaults.
