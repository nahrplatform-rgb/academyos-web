# MP-B01 Today attendance queue return

10 November 2026. Continue EX-07 / MP-B01, VAL-01/04/09, IMP-J09-A01 and IMP-J12-A01, L07/L08 and the connected working-day return. Today’s exact attendance queue already opens the published register. It omits the return hint used by the dated path. The change should return to Today in one action, check current data, then focus the initiating task or the attention heading when that task has finished. Preserve the existing filter and safe scroll, and retain the dirty and unknown-operation guards. [Current living prompt](../06-delivery/continue-academyos.md)

The selected Operations sample records whether Attendance opened from its attention list and restores the queue control on return. The source is `design/owner-design-studio-2026-11-03/app.js`, around lines 68–79 and its `open-register` action. PYSA’s scheduling reference supports exact occurrence-to-register identity and records the limitations of its separate dashboard recurrence logic. Use current AcademyOS Home tasks and server authority for the queue. [Operations reference](../03-design/operations-design-reference.md) · [PYSA scheduling review](../03-design/pysa-scheduling-reference-review.md)

Store only the task identifier and navigation coordinates in the existing scoped tab navigation entry. Read the current Owner Home before focusing a task. A missing queue item after a completed save should lead to the current attention heading. The register link uses the existing validated Home fragment, preserving its query-free offline worker path. This work adds no new domain field, offline command or role.

## Baseline and implementation

The pre-change real Chromium fixture used source `ce5a324`, Node 24, current signed application handlers and disposable PostgreSQL 17. English at 1440 px and Arabic at 390 px both opened the correct 18-player register with one roster read. Neither offered Back to Today or carried the initiating source. The browser identity/provider wire is fictional. [Before receipt](evidence/mp-b01-today-queue/before.json)

The Today attendance queue now carries its exact task through the existing validated fragment. Back to Today returns directly to the current Home read. Retained work restores the initiating task and safe scroll; completed work focuses the attention heading after the server confirms that the task has left the queue. The filter remains. The dated-session action remains available in Session actions. Trainer links and the register's existing save, deadline, version, original-operation and access checks stay canonical.

The focus hint must match the same account/academy/Home navigation entry and the explicit return URL. Home consumes the URL hint on arrival. A generic later visit cannot reuse it. Pointer, keyboard, wheel or touch interaction cancels delayed automatic focus and scroll. The callback also checks cancellation before acting. Identifiers guide focus only; current Home authority determines all visible private content.

## Measured local behavior

| Transition/state | Before | Current checked result |
|---|---|---|
| Today queue → 18-player register, EN 1440 / AR 390 | Correct register, one roster read; no source return | Correct register, same one roster read; Back to Today carries the exact task |
| Dirty Back | No source-return control | Declining preserves the page and selected Present choice; accepting returns through the existing guard |
| Retained task return | Not offered | One `owner_home` read; same task focused, filter and exact scroll restored |
| All 18 saved, then return | Not offered | One canonical register write and the existing roster reread; one Home read; count zero, old task absent, attention heading focused |
| Held Home check | No queue return | Private task absent until the read finishes; static workspace heading receives no premature focus |
| Current Owner membership suspended, EN/AR | Not tested in baseline | Actual signed Home response 403; private task/attention result hidden; no restored task focus |
| Unrelated later Home visit | No saved task marker | A generic visit does not consume old queue focus |
| Typing during a held return | No queue return | New input and its focus remain after the response; automatic focus suppressed |

All four ordinary return cases stay in one browser document and perform one checked Home read, without an intermediate planning read. The entry's read count is unchanged. These counts describe the named application requests, with no hosted latency, Redis-command, cost or quota measurement. [Before](evidence/mp-b01-today-queue/before.json) · [After](evidence/mp-b01-today-queue/after.json) · [Current full runtime receipt](evidence/ex07-normal-attendance/runtime.json)

The eight added queue scenarios pass inside the 25-case normal Attendance suite. Captures cover EN desktop and AR phone retained/completed states. They show the scoped task composition rather than claiming full cross-app visual parity. The existing EN/AR 320/360/390 px normal/prepared register geometry, offline restart, original reconciliation and denial tests remain required in that same suite.

The final local checkpoint passes the compiled build guard, types/lint, 104 unit cases, 25 normal Attendance checks, eight connected Owner-day checks, eight startup checks and 70 protected workspace transport checks. All 16 current component capture families and eight entry captures were refreshed, and factual review navigation passed. The master-plan, canonical implementation and execution validators plus 17 continuation tests pass. These checks preserve earlier offline/account/original assertions; they do not establish real-provider or installed-device behavior. [Living factual review](../../design/app-experience-review/AcademyOS-experience-review.html)

## Delegation and review

One configured `gpt-6.1-terra` helper at medium effort authored the four main regression cases, then performed two bounded source reviews. Peak active helper count was one, with no nested workers or shared-file edits. The coordinator integrated the fixture, implemented the product change, added held-response/current-denial/user-interaction cases, and ran the actual checks. The first review found stale and delayed focus risks; the revised source has an explicit consumed return hint and user-intent cancellation. The second source review found no additional concrete issue. Runtime and release proof remain coordinator responsibilities. Token savings are unmeasured.

The added held-read test initially assumed the static attention heading would disappear. That heading is part of the workspace frame; the correct assertion is that it does not receive focus and no unchecked private queue task is rendered. The current-denial test now waits for its specific HTTP response and scopes its alert to `main`, excluding Next's route announcer, before checking the final transport receipt. On actual denial the attention result is absent. These test-observation repairs do not weaken the current-authority requirement. A changed source comment also invalidated the compiled-build fingerprint; rebuilding the exact final source restored the build guard.

## Evidence boundaries

No account, provider setting, schema, worker, key, field epoch or offline command changes are included. The promoted `ce5a324` source and its limited English signed-in observation are recorded in the previous checkpoint. This new queue journey needs its own exact candidate, CI, Owner promotion and separate signed-in EN/AR proof. Browser extensions were unavailable and the native Chrome check was interrupted; it does not establish a full bilingual or device result. MP-B01, broad NR03/NR07 closure, installed-device readiness and Owner acceptance remain open.

## Remaining Owner-day source inventory

While the exact candidate's CI ran, the same Terra helper inspected the next correction/development handoffs without editing or executing the app. The coordinator checked the relevant page validation and loading functions. At `7b81d99`, `experience-workspace.tsx:255` supplies event/player links for both tasks. `attendance/corrections/page.tsx` validates those identifiers; `correction-workspace.tsx:26–32` reads the list and then player context, with a separate View existing pending request action. Its existing dirty reason guard, stored original-operation locator and reconciliation remain. There is no explicit Today return in that component. This is a source observation, requiring a real pending-request runtime baseline before repair.

`development/page.tsx` validates event/player as a pair. `development-workspace.tsx:30` loads the queue then that exact detail. Its guard and pending-operation state differ from corrections, so the next scoped journey should prove correction handoff/return first, with Development as follow-on. No new recovery guarantee or hosted defect is inferred from this inventory. The generated continuation records that next runtime baseline; no second worker or next product edit was started.

## Release validation repair

Candidate `7b81d990baa5f25d57313cb76178285788f9d5c3` produced a Ready preview, but Foundation run `42869190876`, attempt 1, stopped after 28/53 successful steps at Verify real Next task navigation and guarded return. The navigation test's exact safe-key list predated `attendanceTask`. The actual Calendar entry contained the new marker with a null value. The log did not demonstrate an app navigation failure or establish the unexecuted later assertions. That Ready preview is not promotion-ready.

The same Terra helper retrieved the failed-step log once and traced `scripts/navigation/test_next.mjs:273`. The coordinator verified that assertion, added the safe key and explicitly asserted its null Calendar value. The no-private-projection, held-response, scroll, denial and exact read-count assertions remain. This repair changes that test and delivery evidence only. The failed candidate/run/preview stay in the release receipt; the replacement needs its own complete CI result before an Owner promotion.

The corrected actual Next production navigation suite passes in EN/AR, including guarded edits, selection and Back/Forward. The geometry suite reports 20 cases with zero temporary clamps. These are local synthetic-transport observations. Earlier signed database/offline/source-freshness results still apply because the repair changes no product input. The execution/continuation checks pass; full replacement CI remains a distinct gate.
