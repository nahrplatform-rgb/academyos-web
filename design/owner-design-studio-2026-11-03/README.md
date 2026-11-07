# Owner design studio — 3 November 2026

Status: **Operations selected as the visual direction. The 4 November refinements are ready for review.** A real browser interface with fictional fixtures and simulated operating actions. It is separate from the functional app and the factual current-experience review. No image-generated mockups or new runtime dependencies.

## Open and compare

From the AcademyOS root:

```sh
python3 -m http.server 8780 --bind 127.0.0.1 --directory design/owner-design-studio-2026-11-03
```

Open <http://127.0.0.1:8780/>. Operations opens in light mode by default. The appearance button switches to Charcoal for the current visit. Use the bottom switcher, `1` / `2`, or left/right arrows outside inputs and dialogs. Variant is retained in `?v=1` or `?v=2`; language is retained in `?lang=ar`. These are presentation choices, not approval. No deployment is involved.

| Treatment | Axis and strength | Tradeoff |
| --- | --- | --- |
| Briefing | Spacious overview; a full-width trend graphic precedes the desktop session list | Daily actions sit farther down on desktop |
| Operations | Denser session-first workspace; trend and attention occupy a supporting two-column region | Less space for explanatory data graphics |

The refined Operations overview shows six fictional Cairo sessions with aligned time, session, trainer, roster, schedule and attendance columns. The summary reports the selected branch’s sessions, upcoming sessions, player count and registers needing marks. Sky, violet, gold and teal distinguish programs and metrics. Labelled badges communicate schedule and attendance states separately.

The Operations attention list shows up to three registers needing marks, ordered by session date and time. Each entry shows its unmarked count and opens that register. View all opens the complete filtered list. The attendance trend follows the work queue in reading and keyboard order.

The overview counts are interactive. Sessions and upcoming sessions switch the Today list, player count opens the complete branch directory, and registers needing marks opens that exact filtered set. The chart gives the branch, period and underlying counts. The inspector labels confirmed sample marks as Recorded attendance. Register totals explicitly indicate when they include unsaved selections. Returning restores the source view and the initiating queue entry or selected session when present.

Shared controls use a filled blue primary action, neutral supporting actions, quiet navigation, and red destructive confirmation. Module and status colors remain separate. The light default and button palette are proposed for review in this sample.

Operations starts with navigation open at its 220 CSS pixel minimum on desktop. Use Navigation in the toolbar to close or reopen it at the width you last used during the visit. Drag either divider or focus it and use the arrow keys. Home and End move to that pane’s current limits. Enter or a double-click restores its starting width. The details pane starts at 276 CSS pixels and can grow to 420 when space permits. Arabic mirrors both controls. Phones use the navigation drawer and contextual dialog.

Both use the same components, fixtures and operation simulations. Phone layouts prioritize today's sessions and attention before trends. Monthly phone calendars become an agenda. Desktop retains navigation → central work → contextual inspector; narrower layouts open full detail in a native dialog. No imitation macOS window controls.

## Connected sample

Today → selected session → attendance → exact review → pending sample reply → confirmed / unknown / conflict. Calendar week/month → selected dated session. Players → search/program filter → selected profile. Browser Back/Forward and in-app navigation preserve the calendar's in-memory date/view/search context. Detail dialogs return focus to the selected record.

Shared functions in [app.js](app.js) provide the shell, buttons, icons, statuses, session rows, inspectors, charts, notices and dialogs. [studio.css](studio.css) defines common tokens and responsive/variant composition. [data.js](data.js) owns all fixtures. The original reference is a composition anchor, not copied business policy. The picker CSS follows the installed Emil `prototype` skill.

Only four navigation destinations are included: Today, Calendar, Players and Attendance. Other roles, admission, setup, registration/duplicate review, appointment lifecycle, planning/publication authoring, corrections, feedback, finance and the broader system are outside this first sample. They remain in the AcademyOS plan; this exploration does not retire them.

## Data and operation boundaries

- Every person, session, academy, branch, identifier and statistic is fictional. The fixed sample day is 3 November 2026 at 17:10, Africa/Cairo. The ended-session filter is a fixture mechanism, not a replacement for production eligibility or deadline rules.
- Attendance trends are **proposed illustrative analytics**. Present / (Present + Absent), excluding Unmarked. The graphic and accessible data table use the same branch-specific six-/four-week fixture. Definitions, denominators, time zones, completeness, permitted cohorts and authoritative read ownership need engineering/business review before product integration.
- Selected new marks remain unsaved until an exact review and deliberate confirmation. Confirmed marks are immutable through the marking control in this sample. A partial register remains labelled Partly recorded. No automatic absence or future attendance inference.
- Save responses are browser-memory simulations, not HTTP, SQL, audit or receipt evidence. `connect-src 'none'` prevents API connections. No login, database, provider, private device store, real authority, telemetry, camera or external asset is connected.
- Memory survives navigation within this document, not reload/restart. This is **not** AcademyOS's accepted durable local-data target or an offline implementation. Reload discards the sample. No localStorage/IndexedDB/service worker is used.
- Unknown replies retain the original frozen intent and fence edits/navigation until explicit original-operation reconciliation. The scenario assumes a confirmed original reply when checked; it is labelled simulated. No replacement command is sent.
- Conflict demonstrates retained input and no silent overwrite. “View retained choices” displays the local selections. Real competing-version comparison, conflict resolution, current authority, deadlines, same-account protected recovery and durable operation identity are **not implemented by this sample**.
- Preview states simulate loading, empty, read failure and denied access. Context clears with the central view. Resetting access is a fixture-only tool, never a permission grant.

## Repository authority and traceability

This sample relates to the implemented subsets of J06 (player directory/profile), J09/J10 (dated training/calendar) and J11 (attendance), plus the role-home overlay. Loading associations: L04–L08. Existing action/AO/AT/security joins remain in the canonical registers; no new accepted journey ID, authority or requirement closure is invented.

Read alongside:

- [Engineering charter](../../docs/00-governance/engineering-charter.md), [builder handoff](../../docs/07-handoff/start-here-for-builders.md), [app implementation plan](../../docs/06-delivery/app-implementation-plan.md).
- [Original three-pane foundation](../implemented-journeys-review-2026-10-25/reference-foundation-contract.md), [full redesign contract](../../docs/06-delivery/full-experience-redesign.md), [Charcoal presentation scope](../../docs/06-delivery/whole-app-charcoal-theme.md).
- [Current home/calendar contract](../../docs/07-handoff/full-experience-home-calendar-contract.md), [loading matrix](../../docs/03-design/screen-data-loading-matrix.csv), [security gates](../../docs/04-engineering/journey-security-review.md).
- [Working-behaviour contract](../../docs/03-design/academy-working-behavior-contract.md), [local-data plan](../../docs/06-delivery/local-data-and-sync-plan.md), [offline edit/conflict contract](../../docs/04-engineering/offline-edit-and-conflict-contract.md), [execution tracker](../../docs/06-delivery/experience-execution.csv).

Inspected the actual shared Owner navigation/shell, controls, date-formatting and role-home contracts. PYSA was read-only: its platform surface inventory, dated schedule component, dashboard snapshot reader, AcademyOS scheduling reference review, and EV-0088 recovery audit. Useful pattern: dated calendar → selected session → roster, with date context retained. Known limit: source/audit evidence is not hosted behavior; linked reschedule recovery can be partial in its historical synthetic audit. No PYSA data, permissions, source code or architecture was copied into this prototype. Financial, capacity and notification defaults were not imported.

## Acceptance and evidence

Review checks and limitations are recorded in [verification.md](verification.md). Recorded layout observations are in [evidence/layout-checks.json](evidence/layout-checks.json); exceptional-view observations are in [evidence/state-checks.json](evidence/state-checks.json). Screenshots are captures of this proposal, not captures of the real app. [manifest.json](manifest.json) fingerprints the shipped files.

Owner acceptance should cover:

1. Compare both desktop compositions at realistic size and identify whether either establishes the desired system identity.
2. Follow Today → session → register → selected marks → review; distinguish selected, confirmed, partially recorded and unmarked.
3. Try a lost reply; verify explicit reconciliation and no replacement save/navigation.
4. Try conflict; verify choices remain visible and the limited comparison scope is honest.
5. Filter charts, inspect the data table, change branch, and confirm figures follow the declared sample scope.
6. Use week/month and period/search controls; inspect moved/private/cancelled states; return with date/view/filter intact.
7. Search/select a player and return from detail by Back/Escape with focus restored.
8. Check EN/AR, RTL, dark/light, phone and desktop. Keyboard, real devices and accessibility need their own review; recorded geometry alone does not establish conformance.
9. Inspect loading, empty, failed-read and denied views. No missing metric becomes a successful zero or concealed outcome.

## Implementation chat handoff

Do **not** replace the app from this artifact yet. Use Operations as the selected visual direction and review the refined connected sample. Plan the full visual replacement as one shared system, then verify adoption journey by journey. Earlier approvals remain valid for their scope; this new exploration does not supersede them without an explicit selection.

After review, extract the accepted tokens/component variants into the existing app shell/panes/controls. Reuse real domain writers and current permission, audit, version, persistence and recovery contracts. Proposed analytics and any changed interaction require an explicit engineering packet; the synthetic fixtures are not a backend specification.

Integrate in bounded journey batches, regenerate affected real-component captures and the living factual review, and run the relevant existing checks. Keep design selection, implementation, local checks, hosted verification, Owner working acceptance and independent security separate. The existing EX tracker has not advanced because of this sample. Owner alone performs promotions. No functional source, database, provider configuration, deployment, commit or push was changed by this design task.
