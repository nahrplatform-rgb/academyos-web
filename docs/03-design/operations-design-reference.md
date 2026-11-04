# Operations design reference and adoption contract

**Latest execution order4November:** [Role-first/offline checkpoint](../07-handoff/role-first-offline-sequence-2026-11-04.md) selects EX-12 isolated accounts/exact cleanup, then EX-11 working private register pilot, EX-13 progressive Players/month data, then remaining EX-07 redesign. Retain completed Operations work; actual access/activation/promotion authority and separate evidence remain. Older same-day EX-07-first notes below are superseded.

**Latest Owner review/role direction — 4 November 2026:** [Current staging policy](../00-governance/staging-delivery-and-review-policy.md) defers independent human/external security review without blocking any currently authorized synthetic staging work, including otherwise-authorized private offline activation. Keep actual engineering checks, access/configuration authority and separate acceptance. Follow [the dedicated-role plan](../06-delivery/staging-role-separation-plan.md): distinct Platform Owner and Academy Owner accounts/journeys first, controlled cleanup preserving history; no account/data mutation is authorized or executed by this documentation update. Earlier external-review prerequisites below are superseded, not marked passed.

Reconciled 4 November 2026 from the Owner's [Design AcademyOS visual prototype chat](codex://threads/01a16a57-9fa0-73f0-a6d5-33df9119e86b), the actual studio files, shared app source and existing delivery receipts. This is the current presentation authority for the redesign. Accepted AcademyOS business, authorization, data, audit and recovery contracts continue to govern operations.

## Selected reference and decision evidence

Use **Operations**, the second studio variant, with **light as the initial default** and **Charcoal as the appearance alternative**. This supersedes the 29 October dark-default presentation direction. The Owner requested a complete app redesign and a working connected review, delivered in verified batches. It does not authorize repeating the product from scratch.

| Owner direction in the design chat | Evidence locator within that chat | Interpretation and limits |
|---|---|---|
| “i like operations more”; denser useful data, tighter navigation, more colour | User turn `01a1a333-a7e7-75b3-a5b4-ea3d7f682094` | Operations composition is selected; fictional chart and count definitions are not automatically business policy. |
| Unified coloured buttons and light-default refinement, followed by “start” | Turns `01a1a33b-3b1d-7751-8bd4-113f877af628`, `01a1a340-9cb2-7fb3-8969-4f4bc4e1f150` | Consistent primary/supporting/destructive hierarchy; light default and Charcoal alternative. Earlier dark-default receipts stay historical. |
| Navigation opens/closes, resizes and starts at its minimum; details resize independently | Turn `01a1a345-f49f-7c13-8d19-6ec6f0f9cb32` | Compact resizable panes and accessible equivalent controls; no forced third column on phones. |
| “i like that design”; refine the sample, then replace the full visual system | Turns `01a1a349-5915-7fc3-8b6c-b6697f8cb664`, `01a1a393-d6cb-7633-adad-2ca1f7b1aea8` | One coordinated full-system direction; preserve the sample's composition during implementation, rather than interpreting it as a palette. |
| Complete working sample using the real backend with dedicated fictional staging records | Turns `01a1a397-0224-7a62-b545-865037095b43`, `01a1a39d-d614-7252-9c59-41f1ac062f1e` | Functional review app is the destination. A mailbox mentioned there is not authorization for a new invitation or role grant. |
| Apply the design tools during editing; typography, spacing and controls must match | Turns `01a1a3ab-7abb-7141-8b61-d7dab0211eba`, `01a1a3c4-5c31-75c2-ac76-4a00e2a4010d` | Compare equivalent actual and selected-reference states while building each batch. A generic screenshot replay is insufficient. |
| Continue across the app; correct oversized or inert controls in the review | Turns `01a1a3c9-8f8a-7fa1-a6e3-1082d8f4479b`, `01a1a3d0-f06d-7922-8e7f-f8146ee036b9` | Every ordinary control in the working review must have its real permitted destination/action. Unsupported future capability stays explicitly separate. |
| Owner promoted the first Owner Today work and requested continuation in the implementation chat | Turns `01a1a3eb-3757-73e1-82db-14d508bd7fd6`, `01a1a3ef-720d-7f91-a20d-97e0e8e5bb7b` | Preserve that source and evidence. Design chat supplies review/decisions; this repository and implementation chat own integration and delivery. Promotion is not full redesign acceptance. |

The linked chat was read through the recent Operations selection, refinements, implementation and handoff on 4 November. Older quoted recommendations, tool-generated ratings and “accepted” labels in imported artifacts are not additional Owner decisions. The source-of-truth record is this reconciled contract plus the named Owner turns and existing domain decisions.

## Reproducible reference package

The exact selected interactive source is [the 3 November studio](../../design/owner-design-studio-2026-11-03/index.html), [its usage guide](../../design/owner-design-studio-2026-11-03/README.md), [verification](../../design/owner-design-studio-2026-11-03/verification.md) and [manifest](../../design/owner-design-studio-2026-11-03/manifest.json). Select variant `v=2` (Operations), then the required language/theme/state. Do not use Briefing (`v=1`) as the implementation reference.

The files were present but untracked when reconciliation started. They are retained unchanged and versioned by this documentation checkpoint. The manifest's `proposal` status and the studio README's review-pending wording are dated artifact metadata, preceding the later selections above. Preserve those fingerprints; this contract records the later decisions without rewriting historical evidence.

| File | SHA-256 at reconciliation |
|---|---|
| `app.js` | `f4958891f3fd518b579370e6b62983491ebf64d9528c6bd687f5317a816fe950` |
| `data.js` | `5506f7911eedb82ae3286475d7002db191417a52558b156014dca1ba10695f38` |
| `index.html` | `1ca9e8ab32f33acdccd9db9b58fead4ffd3f0e5be1c870bd75265d48c793463e` |
| `picker.css` | `f292574d26d73a6a95b5f36e1c09182ae135a9f5b2e5c89cf3716942aa40f993` |
| `studio.css` | `9ffef817edc3448c86f7c5525f9db913c6b34ae43d09dad16960b61ce106c14d` |

The design chat also linked [the hosted Operations sample](https://academyos-a29rjjz6z-academy-os2.vercel.app/?v=2&lang=en#home), deployment `dpl_4HCigfdZF28dqCxTxqKMfBugJmrq`. This is a fictional interaction sample, not the authenticated working app. Availability/protection was not rechecked in this documentation pass; use the versioned local package as the reproducible reference.

There are four actual studio destinations: **Today, Calendar, Players and Attendance**. This is a selected whole-system visual foundation with four demonstrated destinations, not a fully implemented redesign of every journey. The earlier [complete proposed experience](../../design/full-experience-preview/README.md) still supplies approved broader workflow/state coverage where it remains compatible with current business contracts. Extend Operations to that scope; do not silently retire it or call the four-view studio complete app coverage.

## Layout, controls and visual fidelity

| Aspect | Current direction | Implementation/verification obligation |
|---|---|---|
| Appearance | Operations light default; Charcoal alternative; layered neutral surfaces with meaningful sky, teal, gold, violet and other established module accents | Preserve semantic success/error/warning separately. Colours appear in navigation, selected records, summaries and context, not only tiny badges. Do not infer a saved state from a module colour. |
| Actions | Shared blue primary, neutral supporting, quiet navigation, red destructive confirmation | Same hierarchy across roles and themes; concise labels, correct disabled/busy states and real destinations. No oversized generic controls replacing the compact reference. |
| Desktop navigation | Minimum/default 220 CSS px; current app maximum 336; toggle visibility and remember the chosen width | Read actual shell constraints at each viewport. RTL reverses divider movement. Width preferences contain presentation data only. |
| Desktop detail | Initial 276 CSS px; current app minimum 260 and maximum 420, bounded by usable center width | Independently resize/hide. Optional context cannot crowd complex planning or force ordinary actions through a detail pane. |
| Resizing | Pointer and keyboard equivalents; Home/End reach bounds; Enter/double-click restore starting width | Verify focus-visible, accessible names/values, reset, both directions and minimum usable center. Closing/reopening navigation restores the selected width. |
| Responsive | Current product wide layout at 1280+; smaller screens use labelled drawer/on-demand details; phone has one focused task | Verify 320/360/390, tablet/laptop and desktop, zoom and long Arabic. Preserve role-specific phone navigation. Do not copy the sample's older intermediate breakpoint overrides without checking actual available width. |
| Density/type | System font stack; compact aligned data rows, readable headings, deliberate 8/16/24 rhythm | Owner Today sample targets include 25px desktop page title, 27px phone title, 17px section title and 12px dense desktop schedule text. These are reference observations, not blanket permission to shrink essential controls/copy. Record any readability-driven adaptation and review it rather than silently diverging. Phone inputs remain 16px; retain readable labels and 44/48px frequent touch targets from the redesign contract. |
| Scroll | Task owns its natural document/work-area flow; list/detail preserve independent position only when that task needs it | Do not make every column a scroll container by default. Verify actual overflow, pane widths, focus visibility, overlays, sticky actions and return position at zoom. Resizing alone does not solve nested scrolling. |
| Dialogs/inspectors | Row selection updates context without moving the list. Short focused edits/confirmations use accessible dialogs; complex work stays in the main area | Focus containment/restoration, Escape, dirty protection, exact consequence/audience, optional diagnostics and native semantics. No imitation OS window controls. |

Current implementation seams: [layout preferences](../../apps/web/src/components/workspace-layout.tsx), [theme toggle](../../apps/web/src/components/theme-toggle.tsx), existing shell/panes/controls and [Owner Today batch](../../design/operations-review/owner-today-batch.md). These are implementations to inspect and reuse, not permission to clone a parallel component system. Layout preferences persist locally; the current theme toggle retains appearance during navigation, not a proven account-synced/restart preference. Keep that limitation visible until deliberately implemented and checked.

## Connected workflow and data boundaries

The first reference chain is **Owner Today → Calendar → dated session → register → exact source return**, with **Players → profile/registration/duplicate review** next. Today prioritizes current work and exact actionable lists before historical charts. Preserve period, view, search, filters, selected record, safe scroll and initiating-control focus; recheck authority on return. Count links open the exact represented scope. Unavailable is not zero; future sessions say Scheduled; Unmarked never becomes Absent.

Retain program weekday-specific times, full-period automatic bounded checks, weekly summary and mandatory exceptions, individual-date access, individual exceptions, all-or-nothing program planning/publication, withdrawal-first and attended-session protection. Retain atomic register saving, existing correction/reviewer/deadline rules, QR matching/duplicate/revocation, exact Guardian link and published-only data, development return/publication/withdrawal/history, original-operation reconciliation and protected pending-work rules. A presentation update cannot replace these with a studio simulation.

Owner requested a **complete functional review using the real AcademyOS backend and dedicated fictional staging records**. Use current authorized accounts and existing fictional records first. A new account, invitation, restored role, Guardian link or added visibility requires its own explicit authorization. Do not seed private data to make a screenshot look like the sample. Empty/error views must remain useful and truthful. Proposed analytics need approved denominator, cohort, timezone, completeness and an authoritative scoped projection before becoming real counts/charts. Keep any unavailable metric unavailable instead of inserting fixture values.

Persistent local data remains a core target under the [local-data plan](../06-delivery/local-data-and-sync-plan.md); the studio's browser memory is not a substitute. The [closed private-register checkpoint](../07-handoff/owner-register-promoted-checkpoint.md) preserves real implementation and gate evidence. Actual key custody, activation authority and hosted offline evidence remain unfinished where recorded. Independent human review is deferred and nonblocking under the current staging policy; no reviewer disposition precedes otherwise-authorized staging activation.

## Full-app adoption and coverage

Reuse the existing J/AO/AT/S/IMP/L/SEC IDs and joins in the [implementation registers](../06-delivery/app-implementation-plan.md). The original `prototype_reference` column retains historical coverage provenance; it does not override this current presentation contract. Do not renumber screens/actions or change requirement completion solely for a redesign.

| Adoption area | Existing coverage to preserve | Required working review |
|---|---|---|
| Shared shell and Owner Today | Role home/read contracts, shared navigation, J01 context; delivered Owner Operations source | Compare equivalent real data states to selected sample, exact task destinations and EN/AR; full Owner acceptance remains separate. |
| Calendar/session/attendance and Players | J06, J09–J13; associated IMP, loading and security joins | Reference four destinations in the actual app; 18-player marking, selected-state details, returns, failures, denied access and recovery. |
| Programs/planning/publication/changes | Existing I3a–I3e and full-experience contracts | 40-date program, automatic full checks, exception review, exact audience, all-or-none results, retained history; preserve current commands. |
| Entry/setup/Platform admission/appointments | Existing M1, I1, I2b/I2c contracts and role boundaries | Sign-in versus creation, exact invitation/scope, acceptance, setup resume, delivery/expired/wrong-recipient/revoked states; no Platform tenant-content authority inferred. |
| Corrections/QR/development | I4c/I4d/I5a contracts | Before/requested/reason/decision/history, clear scan outcomes, focused writing/review and exact family preview; no hidden changes to transactions or visibility. |
| Trainer and Guardian homes/calendars | Existing assigned-published and approved-link projections | Same design system with daily role priorities; real permitted fields only, no transplanted Owner panels or invented metrics. |
| Finance, communications, media, Manager/Player operations and other unbuilt scope | Master-plan future backlog and unresolved business rules | Clearly labelled future; design completeness does not turn these into authorized functionality. |

The complete connected **working** review remains required across this scope. Batches are implementation checkpoints, not separate incompatible designs. Avoid another all-app fictional preview as a substitute for translating the accepted system into functional components. For genuinely new interaction patterns outside the selected examples, prepare a focused connected extension/review before dependent implementation; do not re-ask settled light/pane/role policies.

## Fidelity and evidence for each batch

1. Name the current EX row, findings, affected journeys/actions/requirements/loading/security joins and the exact selected reference view/state.
2. Inspect current source and the relevant PYSA workflow/source/audit evidence. Record useful connections and defects; accepted AcademyOS rules remain authoritative. For scheduling, start with [the existing PYSA review](pysa-scheduling-reference-review.md).
3. Use relevant design tools **while editing**: UI/UX and Product Design for hierarchy/flows, Emil guidance for interaction details, mobile guidance for responsive tasks; Figma when an actual Figma artifact/workflow is supplied or requested. No tool score or AI review establishes acceptance or independent security.
4. Capture reference versus actual at matching role, data state, language, theme and viewport. Record pane geometry, density/type, gaps/alignment, surface/colour distribution, control sizing, inspector/dialog behavior, focus and return position. Compare loading, empty, filtered-empty, saving, saved, denied, blocked, stale, unknown and recovery where applicable.
5. Keep a difference ledger: faithful implementation, intentional reviewed adaptation, missing functionality/data definition, unresolved defect or unavailable evidence. Fix unexplained drift before calling that view visually verified. Never weaken a request/recovery/security assertion to match a picture.
6. Record request ownership, useful-task/blank intervals, reads/RPCs/bytes and affected invalidation. Retain declared budgets and measure under the stated device/network/data profile; no percentiles from a few screenshots.
7. Update actual-component captures and the [factual HTML](../../design/app-experience-review/README.md), implementation evidence and tracker. Separate design selected, implemented, locally tested, deployed source, hosted verified, Owner accepted and independent security.
8. Owner performs any promotion. Verify its exact-source staging result separately. The redesign is complete only when the declared working coverage and acceptance evidence exist, not when a theme, sample, capture pack or build is available.

## Next execution and reconciliation receipt

The [single tracker](../06-delivery/experience-execution.csv) selects **EX-07 Operations adoption** with **EX-12 dedicated-role preflight/verification** alongside it. Complete Platform Owner and Academy Owner journeys first, using the role plan and current permitted fictional records; then extend shared patterns across other implemented roles. Preserve completed EX-10/02/06/04/03 checkpoints. EX-11 retains actual private working-day evidence, EX-09 concrete custody/authority readiness and EX-05/08 measurements. Independent reviewer assignment/disposition is deferred and is not a staging dependency. No offline acceptance or account mutation is inferred.

See [the reconciliation checkpoint](../07-handoff/operations-plan-reconciliation-2026-11-04.md) for changed documents, source limits and verification. The reusable instruction stays **“Continue from the living continuation prompt.”** Its generated current priority must reflect this route.
