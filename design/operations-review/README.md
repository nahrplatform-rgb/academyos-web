# AcademyOS Operations review

**Latest Owner review/role direction — 4 November 2026:** [Current staging policy](../../docs/00-governance/staging-delivery-and-review-policy.md) defers independent human/external security review without blocking any currently authorized synthetic staging work, including otherwise-authorized private offline activation. Keep actual engineering checks, access/configuration authority and separate acceptance. Follow [the dedicated-role plan](../../docs/06-delivery/staging-role-separation-plan.md): distinct Platform Owner and Academy Owner accounts/journeys first, controlled cleanup preserving history; no account/data mutation is authorized or executed by this documentation update. Earlier external-review prerequisites below are superseded, not marked passed.

**Current reconciliation — 4 November 2026:** use the [Operations reference/adoption contract](../../docs/03-design/operations-design-reference.md) for final selected values and [the current tracker](../../docs/06-delivery/experience-execution.csv) for priority. This document retains the earlier review-branch findings and intermediate recommendations. In particular, the detail starting width is now **276px**, not the intermediate 280px below; Home reaches the minimum, Enter/double-click restores the starting width. The first shell/Owner Today work is merged into combined source `ef73a36` and has [closed staging evidence](../../docs/07-handoff/owner-register-promoted-checkpoint.md). The replay below is factual capture evidence; the full review deliverable is the actual signed-in app. Earlier EX-03 routing and separate-checkout notes do not override current source/routing.

The Owner selected Operations in the browser studio and requested a complete working sample with the real AcademyOS staging backend and dedicated fictional records. The review branch, codex/operations-review, starts from 5766398. The current implementation chat and the studio are in a separate checkout.

## Open the review

Open the [connected experience replay](../app-experience-review/AcademyOS-experience-review.html). Choose a journey and follow its recorded transitions or use the screen and state directory. Every captured frame comes from actual application components with fictional test identity and transport. Replay controls reproduce recorded transitions. They cannot exercise the staging backend. The loopback review server opens [directly on the Owner experience](http://127.0.0.1:8781/AcademyOS-experience-review.html?journey=experience-projections).

The [implementation plan](../../docs/06-delivery/app-implementation-plan.md), [action matrix](../../docs/06-delivery/app-implementation-action-matrix.csv), [loading matrix](../../docs/03-design/screen-data-loading-matrix.csv) and [security gates](../../docs/04-engineering/journey-security-review.md) govern the application. The [reference foundation](../implemented-journeys-review-2026-10-25/reference-foundation-contract.md) supplies the navigation, workspace and contextual-detail composition. The [execution guide](../../docs/06-delivery/experience-execution.md) still selects EX-03 original-operation recovery. This review branch records no delivery or acceptance change to that execution lane.

## What to judge first

| Priority and type | Before | After or next decision | Acceptance |
| --- | --- | --- | --- |
| P0 · Shared presentation | Charcoal default, loose desktop navigation, heavy inspector | Light default, Charcoal option, compact desktop navigation and a quieter inspector. Blue identifies primary actions. Module colors provide orientation. Statuses retain their text and semantic tones. | Consistent action hierarchy across forms, review and receipts. Readable status labels, visible focus, no reliance on color. Arabic mirrors the workspace. |
| P0 · Shared layout interaction | Compact navigation rail and adjustable details | Keep the rail option. Desktop navigation opens at 220 px, closes from the toolbar and reopens at its prior width. Both panes use the same pointer and keyboard resizing. Details starts at 280 px and respects the existing available-width ceiling. | Arrows follow visual direction, Home or Enter reset, End expands, double-click resets. Collapsed navigation leaves the tab order. Phone and medium widths use the existing drawer and detail flow. Form input and operation identity survive layout changes. |
| P0 · Daily work | Task cards precede the schedule | Today's sessions lead in reading and keyboard order. Show the confirmed scoped total from the existing projection. Place work and review cards below. Compact the desktop session rows. | Count is labelled as current scope, distinguishes a confirmed zero from missing data, and remains meaningful when only part of the schedule is visible. Session selection opens the same authorized detail. |
| P1 · Role-specific review | Similar controls appear in operationally different pages | Keep Academy Owner operations, Platform Owner admission, Trainer assigned work and Guardian linked-player views distinct. Surface role and workspace in the shared shell. | Each account sees its authorized module, field and record scope. Ending access clears protected content on the next authoritative check. |
| P1 · Interaction review | Similar refresh controls imply the same recovery behavior | Use current scoped confirmed-write and read updates. Review remaining manual controls against the working-behaviour contract. Keep deliberate failed-read retry and original-operation reconciliation separately labelled. | Unknown reply retains original intent. A failed read displays unavailable. No background update steals focus, overwrites a draft or converts unknown to saved. |
| P2 · Proposed analytics | Studio attendance chart uses a fictional six-week series | Review a future branch-scoped trend with period, denominator, unmarked coverage and equivalent data table. The working review uses counts already returned by AcademyOS. | Verify authoritative historical coverage, role scope, pagination, request cost, partial periods and data quality before charts appear in the working app. |
| P2 · Future scope | Finance, media, exports, offline policy and native appear in older plans or samples | Keep proposed and partially prepared features at their recorded status. Design a working state only when current behavior can be named and inspected. | No invented business rules, native functionality or completed offline capability. |

### Refresh and recovery

- After confirmed writes, use the confirmed result or the existing bounded authoritative revalidation. On page return, use the current request owner and preserve the working position. Review any change against the request budgets and the existing execution tracker.
- Keep manual retry for failed or unavailable reads, and manual refresh where operators deliberately recheck remote changes. Label the scope of the read.
- A lost or ambiguous response uses **Check original operation** with its original identity, reviewed inputs and current authority. Ordinary reads or a replacement attempt cannot settle that outcome. This review branch makes no request lifecycle change.

## Full staging walkthrough

Use a dedicated, visibly fictional academy, branches, players, rosters and events. Use the normal Platform Owner and Academy Owner operations, genuine sign-in, caller-scoped reads and writes, current audit and recovery. Verify all invitation destinations against the staging allowlist. Keep account, invite, QR and private provider payloads out of the replay, screenshots and repository. A single mailbox cannot prove distinct-account isolation. Record prepared scope, successful receipts and planned temporary access cleanup with sanitized references.

| Order | Connected implemented surface | Show and verify |
| --- | --- | --- |
| 1 | Entry, Platform Owner admission and invitation | EN/AR sign-in, signed-out boundary, academy create and invitation review, pending delivery, unavailable or expired invitation, original-operation recovery. |
| 2 | Academy Owner acceptance, workspace selection and setup | Exact recipient, academy context, resume saved setup after reopen, denial in a foreign scope. |
| 3 | Players, guardians and staff | Registration, duplicate review, retained input, profile. Guardian and Trainer appointment, acceptance, restricted profiles and audited ending of access. |
| 4 | Home, program and dated session planning | Today and Calendar scope and return position. Draft program, dated review and resume, assignment, roster and capacity, publication preview and receipt, reschedule or cancellation, Trainer schedule. |
| 5 | Attendance and family training | Exact roster, manual and QR parity, partly recorded and confirmed states, lost reply, duplicate and conflict, correction review, linked Guardian calendar/training and published attendance. Separate physical-camera check. |
| 6 | Development feedback | Trainer draft and submission, review and publish, Guardian publication, omitted internal fields, old versus latest publication where supported. |
| 7 | Cross-journey acceptance | EN/AR, desktop and phone, keyboard and focus, loading, true empty, failed read, denied scope, protected drafts, confirmed receipt, conflict and uncertain reply. Recheck scope after access ends. |

The branch leaves the offline target, key custody, retention, recovery and service budgets with their existing contracts.

## Reuse and handoff

Shared React shell, panes, controls and semantic CSS drive the review. The same separator supports navigation and details. Domain surfaces retain their data and actions. For an editable Figma library, map the shared tokens to Surface, Text, Action, Module and Status variables in light and Charcoal modes. Model buttons, statuses, task rows, inspector, form review and recovery with fictional examples.

Product Design and UI UX Designer guidance informed the hierarchy review. Mobile App Builder informed role-specific phone flows. Emil's guidance informed focus, intent-specific feedback and predictable controls. The PYSA source inventory and [AcademyOS scheduling reference review](../../docs/03-design/pysa-scheduling-reference-review.md) informed the dated list/detail and return-context pattern. PYSA's reported translation, search and recovery defects are historical evidence. Its data and permissions are outside this sample.

Owner design review precedes merging or release. In the implementation chat, reconcile this branch with current shared source, preserve the existing operation-recovery lane and use the action, screen, loading and security joins when verifying each adopted surface. Owner alone promotes deployments.

## 4 November verification receipt

- The isolated source builds under Node 24. Type checking, lint, 92 unit tests, and 17 foundation browser tests passed. Foundation tests exercise the local server without staging sign-in.
- All 16 real-component browser harnesses passed with fictional identity and HTTP fixtures. The static entry collector adds eight EN/AR and viewport states. The [manifest](../app-experience-review/manifest.json) records 1,067 distinct states, 1,069 recorded transitions and 17 review groups.
- The [replay verification](../app-experience-review/evidence/verification.json), freshness check and [theme evidence](evidence/captured-theme.json) passed. The theme evidence covers 66 sampled EN/AR phone and desktop cases across both appearances. The in-app browser opened the Owner desktop capture directly.
- Staging's public entry returned HTTP 200. Authenticated staging verification and dedicated records are pending. The available Vercel identity could not access the AcademyOS project. The supplied test mailbox still needs allowlist verification through the approved staging configuration. No academy, invitation, grant, provider setting, or deployment was changed.

Vercel access was restored later on 4 November. See the [signed-in staging comparison and per-batch design acceptance checks](staging-parity.md) for the current access result and observed differences.

The [Owner shell and Today implementation batch](owner-today-batch.md) records the local candidate, comparisons, data gaps and staging acceptance gate.
