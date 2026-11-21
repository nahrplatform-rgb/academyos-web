# Operations design acceptance against staging

4 November 2026. The Owner identified the selected browser sample as the visual reference. Each implementation batch should compare its own running candidate against that reference before calling the design matched. Preserve this distinction in review and implementation handoff.

## Reference and observed build

- [Approved Operations sample](http://127.0.0.1:8780/?v=2&lang=en#home), variant 2. The original sample files and checksums are in the AcademyOS checkout under design/owner-design-studio-2026-11-03. Verified reference inputs include index.html, studio.css and app.js. The selected sample governs composition and interaction. The accepted repository contracts govern permissions, behavior and real data.
- [AcademyOS staging](https://staging.academy.nahr.dev/en/workspace) resolved to deployment dpl_GBRTCfpPWntMp7VZWu2h8vk5chSr, ready, Git source f266aabce5deb4efb9cfef78463dcc8144c3bce9. The reconnected Vercel account could read the project and alias. The existing signed-in Academy Owner browser session loaded the synthetic academy's authoritative Today view.
- The isolated Operations branch and its offline replay are intermediate review work. Replay evidence shows actual app components through fictional adapters. Record source and build provenance separately for each subsequent comparison.

## First live comparison

| Staged Owner Today | Approved target | Required evidence before calling it matched |
| --- | --- | --- |
| Staging renders Charcoal by default. The sidebar has a compact option. Only the details divider is resizable on desktop. | Light by default with an optional Charcoal appearance. Navigation opens at 220 px, can close and reopen, and both panes resize. The sample starts details at 276 px. | Check a fresh session, both appearances, resize and close/reopen with pointer and keyboard, and mirrored controls in Arabic. Any intentional difference in geometry needs an Owner-visible note. |
| Review and task cards take the first content position, even when most counts are zero. Today's schedule follows. | One row of compact, actionable scope metrics, then today's schedule, then attention and the trend panel. Compact rows align time, session, trainer, roster, schedule and attendance. | Capture a populated date with current records, compare the order, density, selected row and inspector action at the same width. Also capture a true empty day and failed read. |
| The live date returned zero sessions. The empty inspector and calendar link were observable. A populated session and linked attendance state were outside this run. | A selected row and useful inspector content, separate schedule and attendance states, and a short queue of registers needing attention. | Verify those states on a populated fictional staging date through normal reads. The current calendar projection already includes time, session, roster count and schedule state. Trainer name, attendance state, exact register counts, branch-wide totals and historical metrics need their own authority and coverage check before use. |
| At 390 px in Arabic, the staged Today page mirrored without horizontal overflow. Keyboard activation opened the navigation drawer. Escape closed it and restored focus to the opener. | Arabic phone layout retains the schedule, attention, then trend order with a contextual detail dialog. The approved sample also mirrored without overflow at 390 px. | Repeat on the candidate in EN and AR, with a selected record and long realistic text, and verify touch targets, keyboard order, drawer/dialog focus and return position. |

## Use on every design batch

1. Reference the exact sample route, language, viewport and state. For screens beyond the studio's four destinations, show an explicit application of the shared system and record Owner review of any new screen pattern.
2. Compare the approved sample with the running implementation side by side, at matching widths and with equivalent data states. Use Product Design for the task flow, UI UX Designer for component and token consistency, Mobile App Builder for narrow and touch behavior, and Emil's guidance for focus, transitions and feedback. Use a linked Figma file for editable component inspection if the project has one. The HTML sample remains the reference for this batch.
3. Record each difference as an implementation correction, an intentional adaptation for Owner review, or an open data/engineering dependency. Compare the stable visual shell separately from what the server can currently supply. Sample counts and the sample historical chart remain illustrative until an authoritative definition and scoped source are verified.
4. Verify the exact preview build through the existing signed-in staging access path when available. Use dedicated fictional records for working states and a separate account for cross-role denial evidence. Preserve unknown-operation reconciliation and current access checks.
5. Give the Owner the two rendered states and any open differences before asking for visual acceptance. Keep that acceptance separate from authenticated runtime results and promotion. The Owner controls promotion.

This checkpoint is a focused comparison of live Owner Today and the approved sample. It records no deployed UI change, new records, invitation, grant or provider configuration change.
