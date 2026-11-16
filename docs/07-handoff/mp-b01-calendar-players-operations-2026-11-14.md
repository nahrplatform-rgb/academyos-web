# MP-B01 Owner Calendar and Players Operations

14 November 2026 · EX-07 / MP-B01 · VAL-01, VAL-02, VAL-04, VAL-09. The [living continuation](../06-delivery/continue-academyos.md) carries the next action. This checkpoint implements the approved Calendar and Players presentation in the working app. It builds on the [signed-in local offline register check](evidence/ex07-local-offline-attempt-2026-11-14.json).

## Comparison with earlier work and PYSA

| Area | Existing comparison rechecked | Implemented here | Work carried forward |
|---|---|---|---|
| Owner Calendar · J01-A01 / J09-A01 · PY-011–013 | The [earlier Operations checkpoint](operations-owner-calendar-checkpoint.md) already adapted dated selection and the period-to-detail handoff. Rechecked PYSA `37d8901c`, `components/manager/schedule/schedule-calendar.tsx:650–690`, where Month places a month label between period controls and opens session detail from the day cell. The [scheduling review](../03-design/pysa-scheduling-reference-review.md) and PYSA EV-0088 identify linked-session recovery limitations. | Period label with its arrows, adjacent Week/Month controls, separate Today and direct date entry, search and count on one desktop line. Compact Month grid, clearly distinguished surrounding dates and session states. Narrow panes use a day agenda. Bounds, original dated route, role scope and return behavior follow the existing AcademyOS contract. | Trainer/resource filters, direct attendance summaries in the inspector and expanded availability belong to their scoped projections and policy work. The studio's cards use fictional fields and totals. |
| Owner Players · J06-A01 · PY-007/008 | The [delivered-journey review](../03-design/pysa-comparison-completed-journeys.md#comparison-by-delivered-journey) and [42-field reconciliation](../06-delivery/master-plan-v2/player-field-reconciliation.csv) already establish useful directory and profile behavior. Rechecked PYSA `components/manager/members/member-list.tsx:93–115` for local filtering and stable selected IDs. AcademyOS already has its own bounded search, checked profile and explicit duplicate review. | Branch scope under the Players title, clear search beside the input, registration alongside search when space allows, and a distinct paging footer. Keep the current name and branch rows readable with keyboard/profile access and existing results states. | Studio training-group/ID columns and a complete academy total need authoritative data and their field rules. [MP-Q01](mp-b01-rich-player-contract-2026-11-07.md#focused-decisions-not-a-global-stop) owns the richer profile and lifecycle. |

The Operations studio is the presentation reference. PYSA comparison is based on source and existing audit evidence. Existing user outcomes and permissions take precedence when a reference differs.

## Local before and after

Calendar uses the same ten fictional Cairo occurrences as the EN light studio Week. The prototype starts Month on a different weekday and includes two later sample events outside the week. The comparative AcademyOS Month measurements hold the original ten rows fixed and use its existing Sunday-start 42-day range. Players uses the same twelve fictional Cairo players as the studio for before, after and reference capture. The component fixtures simulate identity and read transport.

| Matched working-app state | Before | After |
|---|---:|---:|
| Calendar Week first visible session, EN 1600×1000 | y=537px | y=442px |
| Calendar Month grid height, EN 1600×1000 | 1,576px | 1,111px |
| First Players row, EN 1440×1000 | y=564px | y=379px |
| First Players row, AR 390×1000 | y=620px | y=491px |

These are single controlled layout measurements. Calendar moves the controls and date caption together, preserves the range's authoritative count and flags partial pages. The count explains surrounding-date coverage beside the month name. Draft and moved surfaces carry their label and accent. Players removes its duplicate header and keeps the branch visible.

## Verified working behavior

- **Direct Calendar entry.** A dated link produced a React hydration error in the production-route fixture. A development run showed the server and browser used different spaces around the week-range dash. Calendar now renders the formatted period after navigation context is restored. The normal route suite checks dated EN/AR links for this regression, and the separate 18-case matrix passed cold/current entry, valid and invalid hints, restored period, Month, setup-required, failure/recovery and departure. The stored-period fixture now uses a different anchor whose week actually contains its one session.
- **Navigation and requests.** Each checked Calendar entry used one operating read. A valid explicit or remembered period read that period directly. An unhinted or invalid-hint entry used the current-period projection. Local search and selection used zero requests. Each intentional period change read once. Four long-list return cases restored the exact pre-departure scroll position, including browser Back/Forward, current denial and pending authority handling. The ordinary test retained its dirty-input and exact Today return checks.
- **Players.** The same 12 players took one read before and after on desktop and Arabic phone. The profile fixture kept all 18 rows visible during a held profile request, with no directory reread. The registration, unknown-result, confirmed-save/read-failure and denial cases passed. The connected fixture also retained zero-row offline entry, first registration from a prepared empty directory and recovery of the first save.
- **Prepared working day.** The local production browser checks use the actual routes and public worker with fictional identity wiring. Prepared Players and Calendar used zero operating reads for covered views, including after a browser relaunch with the fixture origin disconnected. The exact Owner return and 18-player register tests passed again on current source. They retain prior save, dirty-input, original reconciliation, scope and permission assertions.

The [compact receipt](evidence/mp-b01-calendar-players-operations-2026-11-14.json) records source fingerprints, counts, scope and the linked database/transport results. The [factual HTML](../../design/app-experience-review/AcademyOS-experience-review.html) was rebuilt after all 16 component capture suites and the welcome states passed. It records rendered fixture states. This batch also passed typecheck, lint, 117 unit tests and the compiled-source check with Node 24.14.0. One Codex coordinator used scripted browser checks and selected captures, with no delegated runs. Per-check model usage figures were unavailable.

The routed and offline runs use controlled local fixtures. Staging, installed-device evidence and Owner acceptance are still open for this source. No commit, push or promotion was performed.

WD-02 and WD-03 have scoped local evidence. The Calendar portion of WD-04 also has useful cold and repeat observations. The full WD-01 sign-in/chooser handoff, complete cross-layer WD-04 measurement and their remaining environment checks stay open.

## Continuation

Continue the already queued initial Owner handoff on the real local workspace chooser and Today routes. Check permitted entry, no membership and unavailable lookup with the [working-day criteria](../06-delivery/academy-working-day-acceptance.md), then repair any reproduced continuity gap. Use the [existing rich Player packet](mp-b01-rich-player-contract-2026-11-07.md) and 42-field PYSA reconciliation to prepare the focused MP-Q01 field and lifecycle review. Give concrete registration, profile, visibility and local-data examples before any dependent private-field or lifecycle implementation.
