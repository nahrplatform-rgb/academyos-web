# WD-69 · Owner Today and Calendar tab return

14 November 2026 · EX-07 / MP-B01 · WB-05, WB-07, WB-14, WB-15 and WB-20 · VAL-01 and VAL-09.

The Owner can return to Today or Calendar while a single current-access and freshness check runs. A temporary failure hides unchecked academy data and shows the existing error. When search focus disappears with that data, focus moves to Refresh. A successful same-scope retry restores the selected session if it still exists, the search text and selection, and the previous scroll position. Keyboard or pointer activity elsewhere cancels the automatic restoration. Known denial clears the selected record and discards the recovery position. The new recovery information lives only in the mounted view and contains coordinates and text selection offsets. Existing scoped navigation state and server authorization still resolve the search, period and selected record.

The pre-change component retained the checked rows during a delayed success and already restored the filter and selected record after a retry. A 503 removed the focused search from the DOM. Focus dropped to the document body and the reduced page clamped the center to the top. The successful retry replaced search focus with the inspector heading and did not restore the center scroll.

| Real route | Before failure | After retry before repair | After retry with repair |
| --- | --- | --- | --- |
| Today, EN and AR at 1440 × 600 | 370 CSS px, search focused | 0 CSS px, inspector heading focused | 370 CSS px, search focused with text range retained |
| Calendar month, EN and AR at 1440 × 600 | 400 CSS px, search focused | 0 CSS px, inspector heading focused | 400 CSS px, search focused with the same text range and month |

Each measured return in the four desktop cases made one projection read. The paired focus event after the successful read settled added zero. Each deliberate retry made one read. The normal routes stayed in the same document throughout the return, failure, retry and denial legs. A terminal 503 or 403 hid the rows and inspector. The Arabic phone-width Calendar case held the selected dialog during the check, gated its action, and hid it on the failed check. During the baseline retry, the dialog reopened before the result arrived. Now the dialog stays closed until the checked session resolves. [Before, after and responsive evidence](evidence/mp-b01-owner-tab-return-2026-11-14.json) · [Next route harness](../../scripts/navigation/test_next.mjs).

The tests use the real Next production Today and Calendar entry points and product components with a fictional identity and local test responses. Two additional Chromium cases switched away to another tab and brought the working tab forward. Trusted blur/focus fired, the held rows and search focus stayed in place, and each page made one read with zero document transitions. That browser reported the working page as visible while it was unfocused. The separate controlled cases exercise the visibility-change pairing and delayed errors.

The 20-layout geometry sweep passed at 1440, 1024, 390, 360 and 320 CSS px in both languages. It checks the retained rows and position while pending, deliberate contraction on shorter results or failure, and the failure/denial masks. The harness now reads the expected academy context from the sidebar at desktop sizes or the closed drawer at narrower sizes, matching the existing shared layout.

Exact-source local checks include the broader routed navigation suite, workspace transfer (72 checks) with 21 disposable PostgreSQL 17 tests, compiled web build and assets, 117 units, typecheck, lint, and the regenerated 1,390-frame factual experience review with zero gaps in its declared coverage. [Transfer evidence](evidence/ex13b-workspace-transfer/transport.json) · [Factual experience review](../../design/app-experience-review/AcademyOS-experience-review.html).

The local production preview was rebuilt and responded on port 3100. The Mac locked before the signed-in Chrome tab-return walkthrough, so the new evidence is limited to isolated Chromium plus local build readiness. No new staging or Owner acceptance evidence is recorded. WD-69 still includes prepared-device and other role/route cases. NR02 and NR03 remain open at whole-app scope. Earlier [People return proof](mp-b01-profile-continuity-2026-11-08.md) stays applicable to its documented cases.

One bounded `gpt-6.1-terra` helper drafted the isolated fixture. The coordinator reviewed it, measured the reproduction, fixed the mounted view, and integrated the full browser, geometry and transfer checks. Peak helper count was one. Usage was not separately measured.

The next authorized development case is the Owner Calendar slice of WD-70. Compare prepared local controls with an uncovered period, and measure overlapping period or view changes before changing their behavior. The [MP-Q01 Player decisions](mp-b01-player-decisions-2026-11-14.md) remain scoped to their dependent additions.
