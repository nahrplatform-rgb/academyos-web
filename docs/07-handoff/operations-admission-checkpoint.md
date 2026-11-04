# EX-07 Operations admission — 4 November 2026

## Authorized checkpoint

Current EX-07 / supporting EX-12; NR03 and NR16. Preserve IMP-J02-A01, J02-A01, S59/S60/S61, AO-003/AO-008/AO-011, AT-003/AT-008/AT-011, L02 and SEC-J02. J01/J03/J04 remain regression boundaries. This translates the selected [Operations system](../03-design/operations-design-reference.md) to the existing Platform admission directory, selected-academy details and original invitation tasks. It neither completes every Owner journey nor changes account authority.

Source baseline `d6bd958`. The tree was clean. Inspected AdmissionDirectory, OnboardingWorkspace, shared shell/panes/controls, the accepted full Platform proposal and Operations v2. Relevant PYSA source: `platform-description/PYSA-platform-brief-for-another-AI.md:43–51`, `pysa-platform/components/admin/invite-owner-modal.tsx:37–65`; audit FND-0012 / EV-0019. Keep separate invitation/Owner/setup stages and concrete failure feedback. Do not copy PYSA's credential mutation before role-conflict checks, implicit ownership reassignment, demo activation or impersonation assumptions. PYSA source and mocked-SDK audit evidence are not fresh hosted proof.

Retained prior [M1 admission presentation](m1-admission-presentation.md), [admission implementation/deployment evidence](full-experience-admission-implementation.md) and [M1 implementation history](onboarding-m1-implementation.md) remain valid within their original scope. The action-matrix evidence cell remains one existing file path, now pointing here for the current bounded checkpoint; original functional/deployment/Owner statuses are not advanced.

## Implemented change

- Platform uses the already delivered Operations shell rhythm: system typography, 25px desktop title, restrained light surfaces, Charcoal alternative and compact controls. The main directory gains loaded-record search and status filters, with delivery visible before inspection; these are real local interactions over the existing authorized projection.
- Counts explicitly describe loaded records, not database-wide totals. More-page availability remains explicit; filtering never silently fetches or claims global search. Loading, failed read, empty and filtered-empty remain distinct. A failed read does not display false zero counts.
- The selected-academy inspector groups owner acceptance, provider delivery, invitation expiry in UTC, initial setup and the existing allowed actions. Provider accepted still does not mean inbox delivery. No private academy-content link is added; operational activation is not inferred.
- View identifiers/search/filter now belong to the existing keyed account/context lifetime. An authoritative recheck still masks the old screen as before, then restores a still-permitted selected academy and search. Back can restore the current row's focus after that remount. No private payload cache, browser persistence, authority reuse or extra data request is introduced. Denial clears the view state; subject/context replacement already resets the keyed lifetime.
- Existing create/review/withdraw/reissue/retry, generation targeting, atomic receipt and unknown-original reconciliation remain canonical. No gateway, API, SQL, write contract, recipient rule or membership logic changed.

## Request and continuity evidence

The [same-fixture before/after measurement](evidence/operations-admission-2026-11-04/comparison.json) compiles actual baseline/current components without checking out or changing the original tree. Two fictional academies, Chromium 156, 1440×1000; synthetic identity/transport only.

| Observation | Baseline | Updated |
|---|---:|---:|
| Initial admission reads | 1 | 1 |
| Selection/local interaction extra reads | 0 | 0 |
| Explicit clean recheck reads | 1 | 1 |
| Selected academy retained after recheck | No | Yes |
| Selected-heading focus after recheck | No | Yes |
| Loaded-data search | Absent | Present, retained |
| Desktop title computed size | 28px | 25px |
| Other onboarding requests in the measurement | 0 | 0 |

This fixes a measured continuity defect; it does **not** claim fewer required authority reads or measured database/Redis/hosting savings. Recheck still temporarily replaces content with the existing checking state. Continuous private content, cross-route/multi-page scroll recovery and whole-app NR03 closure are not established. No p75/p95, real network, disk, provider SQL/billing, physical-device, screen-reader or actual 200% browser-zoom result is claimed.

The [expanded actual-component receipt](evidence/operations-admission-2026-11-04/ui.json) covers 24 EN/AR × light/Charcoal × 320/360/390/768/1280/1600 cases. Each preserves search, selection, focused heading and Back after one paired visible-return read; search/filter/selection/Back add zero reads. It also covers long Arabic at 320px, partial loaded coverage, filtered-empty clearing, unavailable versus empty and loading without false counts. Existing handoff identity races, denial clearing, native dialog containment/Escape/trigger restoration, exact invitation/generation, dirty setup, duplicate create prevention, lost reply and original receipt assertions remain.

## Visual difference ledger

| Reference aspect | Current result / limitation |
|---|---|
| System type, 25px desktop title, neutral navigation/center/inspector layers | Implemented using delivered Operations rules; measured desktop title28→25px. |
| Primary blue action, neutral supporting actions, meaningful module/status colour | Reused; gold identifies People/admission/selection, semantic delivery/acceptance tones remain labelled. Module colour is not approval/permission. |
| Compact directory plus optional inspector; one task on phone | Real table/detail/central-create/native-confirmation seams retained; visible row delivery on phone; 24 viewport/theme/locale checks and representative images inspected. |
| Exact Platform screen | Operations studio has only Today/Calendar/Players/Attendance. This is an adaptation of its system plus the accepted full Platform workflow, not a pixel match to a nonexistent Platform studio screen. |
| Pane dimensions | Existing220px navigation and stored bounded detail width retained. Existing default280px versus the sample276px is a known4px difference, not silently reported identical. No cross-app preference rewrite. |
| Continuity/recovery | Search/selected ID/focus return proven after current recheck; existing checking replacement remains visible. No full instantaneous/cached/offline claim. |
| Remaining copy/flows | Wider entry, setup and appointment refinements, diagnostic-copy cleanup and full Owner/Trainer/Guardian adoption remain in EX-07. No new whole-design acceptance. |

[Before desktop](evidence/operations-admission-2026-11-04/before-1440.png) · [After same desktop selection](evidence/operations-admission-2026-11-04/after-1440.png) · [Arabic light phone](evidence/operations-admission-2026-11-04/ar-light-390.png) · [Arabic Charcoal phone](evidence/operations-admission-2026-11-04/ar-dark-390.png) · [Long Arabic at320px](evidence/operations-admission-2026-11-04/ar-long-320.png).

## Account and delivery boundaries

[EX-12 read-only preflight](staging-role-preflight-2026-11-04.md) found the existing mixed roles and sole-Owner constraint. No grants, membership changes, emails, transfers, deletions, custody changes or private activation occurred. The current Gmail browser session/subject was verified; a fresh isolated iCloud session and local pending-work inventory remain unverified. A supported, explicitly authorized ownership disposition is still required before removing Gmail's academy-A Owner access. That does not block this UI batch.

Existing staging alias was rechecked read-only: `dpl_7uNTT7sXQ3SWHh9gWhbFn9pzxGMM`, source `ef73a36537228461f80aecf1084bd1429b2ebb8c`, Ready. The provider's Production label identifies this existing staging project, not a production launch. The updated code is **not deployed or hosted-verified by that observation**. The Owner alone promotes a checked build. No promotion/passkey/alias action is performed by the agent.

## Verification and next checkpoint

Build, typecheck, lint,93 unit cases,17 foundation checks and16 actual-component capture suites passed. The first direct unit invocation used the repository root and could not resolve a workspace alias; rerunning in the existing `apps/web` test working directory passed all93 without changing any assertion. The first new loading assertion targeted directory content during the pre-existing parent checking screen; it was corrected to assert that actual checking state/no false empty. A separate before/after test then reproduced and verified the real selection-remount fix.

The same expanded UI suite also passes in [React development mode](evidence/operations-admission-2026-11-04/ui-development.json), retaining all24 layout/continuity cases and original recovery assertions. The factual HTML/static pack was regenerated:1189 recorded frames and1163 observed transitions across17 groups including static entry, with16 real-component suites passed. Counts describe captured fixtures, not exhaustive conditional/provider/device coverage.

`build.mjs --check`, standalone offline review-tool tests and66 representative theme/contrast checks pass. Implementation/execution validators preserve68 screens,30 stable action groups,180 requirements,12 EX rows,17 findings,G01–G09 and57 planned/evidence-linked working-day cases.334 local Markdown targets resolved at the scoped link check; all12 selected studio hashes remain unchanged. `git diff --check` passes. No API/domain-library/schema source changed. The reused Terra helper performed a focused static diff review and found no concrete defect; it ran no tests/provider/browser actions and supplies no independent human-audit evidence.

Source/UI/local evidence are separate from exact-source CI, preview readiness, Owner promotion, signed-in new-source verification and working acceptance. Independent human review remains deferred/nonblocking, not passed. Broader security, concurrency and real-device/load checks remain open; meaningful existing checks are preserved.

| Delivery layer | Checkpoint state |
|---|---|
| Design | Existing accepted Operations/full workflow applied; adaptations and gaps recorded above. |
| Implementation/local tests | Bounded admission source, fixtures, comparison, regression and factual maintenance passed as recorded. |
| Git/CI/preview | Publish the checked source; inspect exact commit/build separately. This local receipt does not imply remote success. |
| Staging | Existing ef73a36 source verified; new source requires Owner promotion and subsequent hosted checks. |
| Owner acceptance | No new working acceptance supplied; earlier functional approvals retained. |
| Account separation/security | Read-only role inventory partial; no mutation. Independent external review deferred/nonblocking, not performed. |

## CI dependency correction

Initial app commit `e151261547f2781e9bb4cc5400c1ebb69993cc9a` produced Ready preview `dpl_CtpRze26VdYJEJ4HQ2fHWBur44Sm`, but [PR run41779950070](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/41779950070) and [push run41779941572](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/41779941572) failed the pre-existing working-day **source freshness** check before reaching the onboarding step. The record still fingerprinted the old shared CSS. That Ready build is not the recommended promotion candidate.

Reran the actual disposable Next/PG17/Chromium working day, then its supported `--record` mode to regenerate [the current eight-case evidence](evidence/owner-working-day-next-2026-11-04.json). Offline18-player capture, restart, unchanged manifest, exact lost-reply replay, scoped invalidation, deadline refusal and same-account pending recovery passed. The separate seven-case Owner public-startup/account-cleanup run also passed with current CSS. No expected business result, assertion, source list, freshness rule or private gate was changed. No stored hash was patched manually. These remain fictional local integration runs, not private hosted activation or a new latency percentile.

Recheck all CI receipt-freshness commands before publishing the corrected checkpoint, then inspect its exact CI/Ready source separately. Preserve the failed initial runs as evidence; neither preview readiness nor corrected local evidence alone marks remote verification passed.

Next: release/verify this exact code through Owner-controlled promotion, then continue the Academy Today→Calendar→session/register→exact return and Players adoption. Preserve current source and the role preflight; do not repeat settled design reviews, create a new feature or make account changes from this packet alone.

## AI execution

One explicitly configured `gpt-6.1-terra` helper, medium effort, read-only reference/source/PYSA comparison, no nested agents or file writes. Peak created helpers:1. Coordinator owned all source, fixtures, browser/provider reads, integration and checks. No helper model/token/credit telemetry or comparable total delivery cost is exposed; savings are unmeasured. Scripts run deterministic checks. No global model/concurrency setting or paid service changed.
