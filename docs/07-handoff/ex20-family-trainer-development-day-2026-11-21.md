# EX-20 Family and Trainer development day

21 November 2026 · MP-B05 · synthetic-trial scope

## Workflow

- Trainer Today opens the exact saved feedback draft or pending correction for the current assignment. A correction request reopens its existing record from Today. The Trainer can return to Today from the correction screen.
- Guardian Home, Calendar, Training & attendance, and Development links carry the selected child. Each destination verifies the link and its relevant permission before displaying data. A child whose publication was withdrawn can stay selected while their published list is checked again. The withdrawn text is removed.
- Family development continues under the approved narrative policy. An assigned Trainer writes strengths, improvement focus and next steps for a rostered player after an ended published session. An eligible different Owner returns or publishes the submitted version. An amendment preserves the last publication until the successor is published. Withdrawal hides the current snapshot and retains internal history. [Approved narrative policy](../06-delivery/i5a-development-feedback-decisions.md)
- The connected journey follows PYSA's useful selected-child continuity and session-specific Trainer entry. The reference audit's broad sensitive-field access and stale relationship audiences reinforce the need for current server-checked projections. AcademyOS keeps its own approved roles and field rules. See the PYSA platform brief, Guardian and permission sections, cited in the narrative policy.

## Local and release evidence

The connected browser runner uses an isolated production Next build, actual route components and API handlers, distinct fictional sessions, and signed RPCs against disposable PostgreSQL 17. It exercises English and Arabic in independent synthetic academies. [Runner](../../scripts/working-day/test_family_development_day.mjs)

All 10 connected checks passed, five per language. They followed Trainer Today to a saved draft, Owner return and publication, Guardian child switches and linked session attendance, Trainer correction resumption and Owner decision, and the amendment and withdrawal lifecycle. The tests checked returned API fields as well as the rendered screens. The Guardian received no staff note, private review reason, reviewer identity, internal history or sibling assessment. The withdrawal left two immutable publication records and three submission records, with no current publication.

The connected run reproduced loss of the selected child when the shared sidebar rebuilt its links. With the shared link handling repaired, the same EN/AR workflow passed. The production build, type checking, lint and 119 unit tests passed on Node 24.14.0. Ten focused database boundary tests covered current role and assignment, separate Guardian opt-in, and immutable review and publication history. The 13 actual React Development cases passed in both React modes. The small-screen Attendance regression was resolved by keeping the correction entry on Trainer Today, and the existing narrow Attendance interaction passed again.

The candidate includes the EX-17 sport selector change. The bilingual program test checks both qualified names, the original default, and read-only reopen of previously saved programs in both sports. The Owner working day, workspace startup, normal and additive Attendance, and 74 workspace transfer regression checks also passed. [EX-17 evidence](ex17-multisport-foundation-2026-11-21.md)

Provider readback on 21 November confirmed that staging serves `21aa73ef2d956fb1b42299ad2f6dedc66a43d04d` and Supabase lists migration `20261121123317`. Catalog football is enabled in the original custom football academy. Catalog swimming is enabled in the original custom swimming academy. The identically named original swimming sport still has its saved program. This is provider and database evidence for the earlier release. The signed-in EX-17 multisport, EX-18 Schedule and EX-19 Attendance walkthroughs remain separate. [Staging deployment](https://vercel.com/academy-os2/academyos-web/fndeNPoTjnRK7YYsDcvy3kWzqvim)

The current-experience review was refreshed and checked, with 1,940 captured frames and no capture gaps. Execution, implementation and continuation validators passed. [Experience review](../../design/app-experience-review/AcademyOS-experience-review.html)

## Grouped product decisions

| Decision | Scope still open |
|---|---|
| MP-Q20 · D-013 | Sport-specific metric definitions and versions, units, bilingual scales, missing values, review, and progression visibility. |
| MP-Q04 · D-004 | Player login and field access, age and account transition, Guardian authority, and relationship changes for minors. |
| MP-Q05 · D-003 | Manager role and branch scope, delegation limits and revocation, and whether any assessment review can be delegated. |
| MP-Q11 · D-014/D-015 | Which publication, amendment, or withdrawal events may notify a currently linked Guardian, on which channels, and with what preferences, payload and retry rules. |

The current approval covers the described synthetic narrative journey. The Owner controls promotion, staging access and working acceptance. Connected core workflows precede the app-wide UI/UX pass and the dedicated offline/PWA work in the existing plan.
