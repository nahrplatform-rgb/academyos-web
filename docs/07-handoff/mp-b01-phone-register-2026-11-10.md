# MP-B01 direct return and phone register

10 November 2026. EX-07 / MP-B01, VAL-01/04/09, IMP-J09-A01 and IMP-J12-A01, L07/L08 and Working Day B/E. Continue from the independently verified staging build `07c92ae`. The live two-player prepared register proved the earlier return through the dated task. The connected 18-player local fixture supplies the comparison for this change. [Previous staging verification](mp-b01-owner-return-2026-11-10.md#owner-promotion-and-signed-in-check)

The selected Operations sample returns from a register to its source in one step. The actual register can use its existing validated Today or Calendar hint for that action. Keep the exact dated task available separately and use the same dirty choice guard. Keep the compact toolbar, three labelled mark choices, disclosure focus, online and device readiness, accessible review bar and original-operation recovery. Treat the return hint as navigation only. The original worker path, authority, data and save contracts govern the work. [Operations reference](../03-design/operations-design-reference.md) · [Working-day cases](../06-delivery/academy-working-day-cases.csv)

PYSA's schedule source supplies the dated instance and day to its attendance and scan actions. Keep that useful link between the occurrence and register, while using AcademyOS's checked identity and explicit source return. PYSA's separate recurring schedule and contextual legacy billing are outside this change. The prior source comparison records the useful details and limits. [PYSA scheduling review](../03-design/pysa-scheduling-reference-review.md)

## Working result

| Before | After | Reason |
|---|---|---|
| The linked register returned through the dated task and read that task again. | Back to calendar or Back to Today returns directly to the stored view. The dated session stays available through Session actions online or Open session on the prepared register. | Make the common return one step while keeping planning available. |
| Scan, corrections and device preparation occupied space above the online roster. | Session actions groups the same exact routes and preparation button in the shared disclosure beside Details. Escape restores menu focus. Canceling device preparation restores the same button, including after switching to Arabic. | Keep the marking surface in reach. These secondary actions take one extra tap when the menu is closed. |
| Long register context and repeated counts pushed the mark buttons below the review bar. | The compact layout keeps the context, readiness, counts and filters. It uses the same status tokens and labelled choices, and all first-row controls fit above Review in the measured phone views. | Give priority to the first useful task while keeping the recording and device state legible. |

The primary return uses a plain same-workspace link through the existing guard. It derives no new authority from the fragment. Malformed hints retain the unlinked path. Canceling departure retains the selection in both online and prepared mode. The canonical route's unknown outcome still masks the roster and exits remain guarded. The prepared worker still reopens the fragment URL with 18 device rows and zero operating requests. The linked session actions appear again once connected. Existing history, correction, deadline, account, binding and original-save coverage remains.

## Matched phone evidence

Local Chromium 156 with Node 24 and disposable PostgreSQL 17 on loopback. Each paired measurement uses the same synthetic Owner context, 18 unmarked players and 390 × 844 CSS px. The selected Operations concept uses a different 12-row fictional roster. Its useful reference is the hierarchy and direct return. AcademyOS keeps extra controls for scope, protected state, scan and local preparation. [Before receipt](evidence/mp-b01-phone-register/before.json) · [After and request receipt](evidence/ex07-normal-attendance/runtime.json)

| Register | First row top, before → after | Bottom of mark controls, before → after | After review bar top |
|---|---:|---:|---:|
| Online EN | 790 → 515 | 925 → 639 | 779 |
| Online AR | 759 → 522 | 894 → 646 | 779 |
| Prepared EN | 804 → 539 | 921 → 645 | 779 |
| Prepared AR | 791 → 545 | 908 → 651 | 779 |

At widths 320, 360 and 390 with the same 844 px height, all three first-row choices were hit-testable above Review in both modes and languages. Their targets stayed at least 48 px high and 86 px wide. The last row remained reachable, and the narrow actions disclosure stayed inside the viewport. These are desktop browser measurements. Physical touch, smaller viewport heights, installed mode and hosted mark behavior have separate evidence requirements. [Online English](evidence/mp-b01-phone-register/canonical-en-390.png) · [Prepared Arabic](evidence/mp-b01-phone-register/prepared-ar-390.png)

The EN Calendar and AR Today cases each entered with one planning read and one roster read. Their direct returns made one checked source read in the same document, saving the dated planning read from the previous return. The Calendar restored its 96 px pane scroll, Month, date, filter, selected occurrence and details focus. Today restored filter, selection and focus. The prepared online return also restored the checked Month with one scoped Calendar read. The separate dated action still made one planning read when explicitly opened. Request counts describe the named application calls, with no hosted timings or quota estimates. [Current runtime receipt](evidence/ex07-normal-attendance/runtime.json)

One configured `gpt-6.1-terra` helper at medium effort traced the phone density and reference gaps. Peak helper count was one. The coordinator verified staging, selected and implemented the changes, ran the geometry and safety checks and owned publishing. Token savings are unmeasured.

## Local checkpoint

The compiled build, type and lint checks, 103 unit cases, 24 normal Attendance cases, eight Owner-day cases, eight startup cases and 70 workspace transport cases passed. The living factual HTML was rebuilt from 16 current real-component capture groups and eight entry captures. The local tests exercise actual signed application handlers and disposable data with a fictional identity wire. The previous hosted check used an existing signed-in staging session. [Living factual review](../../design/app-experience-review/AcademyOS-experience-review.html) · [Transport evidence](evidence/ex13b-workspace-transfer/transport.json)

## Narrow layout repair after CI

The first candidate `910352f` passed on the local browser. Foundation attempt 1 on the Linux runner stopped in the 320 px geometry check. The mark controls ended at 786 px, below a Review bar that began at 749 px. No first-row mark was hit-testable. The Ready preview of that candidate did not qualify for promotion. [Failed Foundation run](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/42832093649)

The repair allows the action labels to wrap within their row, keeps the review copy compact, and uses a locale-aware date/time range to avoid repeating the date when both times share it. The same timestamp and branch timezone supply the range. A duplicate absence note was removed from the prepared summary and remains visible by Review. The geometric assertions still require all three mark controls above Review. In an additional local 320 × 844 test with wider fallback fonts, the smallest clearance was 48 CSS px. All four EN/AR normal and prepared cases had zero horizontal overflow and all three targets received hits. This stress check exercises text wrapping, with the actual Linux result recorded by the next exact run.

## Checked release candidate

The repaired commit `ce5a3247889b9afa275bd42e2b71eecc2d48ee6d` passed all 53 Foundation steps on run `42836207878`, attempt 1. This includes the same 320 px layout assertion. The exact Vercel preview `dpl_CrjMRu8Vyp68MXpqUhR7Z3ehXRTu` is Ready. The canonical staging alias still resolves to the Owner-promoted `07c92ae`, whose earlier two-step signed-in return is verified. The Owner can promote the repaired preview to `staging.academy.nahr.dev`, followed by separate signed-in verification. [Foundation result](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/42836207878) · [Exact Vercel preview](https://vercel.com/academy-os2/academyos-web/CrjMRu8Vyp68MXpqUhR7Z3ehXRTu) · [Release receipt](evidence/mp-b01-phone-register/release.json)

## Next scoped work

Today’s exact attendance work-queue link currently opens the register without a source hint. Continue MP-B01 by testing that entry and restoring its initiating queue task and focus through the same checked Today route. Keep the existing register/date behavior and proceed independently of rich Player field choices. [Living continuation](../06-delivery/continue-academyos.md)

## Owner promotion and partial hosted check

The Owner reported promotion of `ce5a324`. The staging alias independently resolved to Ready deployment `dpl_6JNDzB6p9zo8A3orNJ1TBLqSYeQD` with the exact source. In the existing `test nahr` Chrome Owner profile, Academy B Month filtered by `Normal Register` opened the published occurrence and linked Attendance event. The English online register showed its two retained saved marks, the direct Back to calendar control and Session actions disclosure. Chrome switched to another active window before the menu/return and Arabic walkthrough completed. Those checks remain pending, alongside hosted phone/offline coverage. [Release receipt](evidence/mp-b01-phone-register/release.json)
