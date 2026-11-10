# MP-B01 Owner session return

10 November 2026. EX-07 / MP-B01, VAL-01/04/09, IMP-J09-A01 and IMP-J12-A01, L07/L08, Working Day B. Compare Today → Calendar → dated session → Attendance → source with the accepted Owner task and the existing 18-player, 40-date fixture. Keep the normal direct-entry and Trainer destinations, existing dirty and original-save guards, and current authority checks. [Working-day acceptance](../06-delivery/academy-working-day-acceptance.md#connected-owner-script)

The selected Operations design keeps the period, selected session and actions together in the Calendar task. The dated screen already carries a checked navigation hint from Calendar or Today. The Attendance handoff drops that hint, so its existing Back to session action reopens the generic dated planning view. Follow the same dated occurrence back through the existing source context. Treat the hint as navigation only and derive the session identity from the checked register. [Operations reference](../03-design/operations-design-reference.md)

PYSA's `pysa-platform/components/manager/schedule/schedule-calendar.tsx` (lines 740–781 and 802–816) shows the date, time and schedule state together and passes the instance and date to Attendance. Keep the useful exact-occurrence handoff. The legacy source also mixes billing into session rows and its broader scheduling audit records material authority and recurrence gaps. AcademyOS retains its scoped date and attendance contracts. The comparison uses source evidence. [PYSA scheduling review](../03-design/pysa-scheduling-reference-review.md)

## Before and after

Use the same synthetic 40-date program and published 18-player register in disposable Next, Chromium 156, Node 24 and PostgreSQL 17. The real signed application handlers use a fictional identity/provider connection over unthrottled loopback. Each scenario is one sample, with an EN 1440 × 900 Calendar return and an AR 390 × 844 Today return. [Baseline receipt](evidence/mp-b01-owner-return/before.json) · [Current runtime receipt](evidence/ex07-normal-attendance/runtime.json)

| Step | Before at `b0e9ffc` | Current working source |
|---|---|---|
| Open the dated task and Attendance | One planning read and one roster read in the original browser document. | The same two reads and original browser document. |
| Back to session | The dated view makes one planning read and one date-list read. Its source action is absent. | One planning read. The dated view offers Back to calendar or Back to academy home. |
| Return to Calendar or Today | The original source is lost from the dated view. | One scoped source read. Selection, filter and details focus return. Calendar restores Month, its date and the tested 96 CSS px pane scroll position. |
| Reload a prepared linked register without network | The old Attendance link carried no source. | The current public worker opens the exact linked URL with 18 device rows and zero operating API requests. The session link is available on reconnect. Declining to discard a dirty selection keeps the choice and linked URL. |

The first implementation used a query on Attendance. The offline fixture rejected that URL, and inspection found the production worker also accepts Attendance only without a query. The finished link carries the hint in a browser fragment, so the worker still receives the original path. Only Calendar or Today and an optional valid civil date can be carried. The actual register supplies the program and occurrence identifiers. Direct entry, malformed hints, Trainer paths and original-save checks retain the existing rules. There is no worker, schema or provider change.

## Operations comparison

The working EN Calendar retains the existing month view, blue selected training card and separate details pane. The AR phone keeps the existing RTL attendance counts and labelled controls. The selected studio variant 2 uses a shorter register introduction and a single Back to sessions action that returns directly to its saved view. In the 390 × 844 comparison its first roster row begins at roughly 609 CSS px with the 12-row design fixture. The real 18-player task starts its first row near 790 CSS px, and the persistent review bar takes up part of the first viewport. These are different fictional datasets. The captured result confirms the return behavior while the extra return step and phone density remain visible differences. [Selected studio](../../design/owner-design-studio-2026-11-03/index.html?v=2) · [EN Calendar return](evidence/mp-b01-owner-return/returned-en-1440.png) · [AR phone register](evidence/mp-b01-owner-return/attendance-ar-390.png)

One configured `gpt-6.1-terra` helper at medium effort independently traced the route, guards and PYSA reference. Peak helper count was one. The coordinator reproduced the baseline, implemented and reviewed the diff, and owned browser, release and integration checks. Token savings are unmeasured.

## Local checkpoint

The current compiled build, types, lint, 103 unit cases, 24 normal Attendance cases, eight Owner-day cases, eight startup cases and 70 workspace transfer cases passed. The regular working-day fixture and the real public worker both reopened the linked route offline. One overlapping fixture run collided on the shared disposable database port. The affected suites passed when run serially. The factual HTML now includes the current 16 real-component capture groups and eight entry captures. [Current experience review](../../design/app-experience-review/AcademyOS-experience-review.html) · [Workspace transfer](evidence/ex13b-workspace-transfer/transport.json)

The preceding Players search candidate has separate signed-in staging verification. This new return still needs its own exact candidate and hosted run. The next MP-B01 task compares the phone register and direct return with the Operations reference while preserving the date action and checked saves. [Verified Players release](mp-b01-players-search-2026-11-09.md#signed-in-staging-verification) · [Living continuation](../06-delivery/continue-academyos.md)
