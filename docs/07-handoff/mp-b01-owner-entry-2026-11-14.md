# Academy Owner workspace entry and return

14 November 2026 · EX-07 / MP-B01 · WD-01 · WB-01/02 · IMP-J01-A01 and IMP-J09-A01. Choosing a workspace after sign-in now gives a clear next step when the lookup fails, keeps keyboard focus through Retry, and opens the selected academy only when requested. This checkpoint continues the [shared workspace layout](mp-b01-workspace-layout-2026-11-14.md).

## What changed

- The chooser uses workspace lookup wording for an interrupted read or unavailable service. The verified no-membership state keeps the invitation guidance. A Platform-only account gets its Platform workspace action, and a denied request has its own explanation.
- The refresh/retry control stays in place and retains keyboard focus while the active lookup runs. While current access is checked, workspace choices are withheld and pressing the control again cannot start a second request.
- Workspace destination links load on selection. Each destination still checks current authority. The chooser continues to keep current workspace results in memory.

The change is in [the chooser component](../../apps/web/src/components/onboarding-workspace.tsx). The existing App Router, signed API and database authorization remain authoritative. PYSA’s portal switcher demonstrates the value of explicit role selection. AcademyOS uses current direct memberships with separate Platform and academy roles. The legacy preview/impersonation flow has a different purpose. [PYSA journey comparison](../03-design/pysa-comparison-completed-journeys.md).

## Before and after

The [WD-01 receipt](evidence/mp-b01-owner-entry-2026-11-14.json) records the same twelve production-routing cases in English and Arabic before and after the repair. Tests used real Next chooser and Today entry points and product components, with fictional authentication and controlled read responses. The [routed assertions](../../scripts/navigation/owner_entry.mjs) checked visible workspaces, branch/timezone, a session, and the dated Calendar destination. The earlier product source failed the newly covered guidance, focus, prefetch and Platform-only checks.

| Scenario | Measured or observed result |
|---|---|
| Permitted chooser → Today | One `context` read, then one `owner_home` read after choosing. The task included an actionable Calendar link and the expected branch and timezone. Requests for the Today route before selection or after chooser return fell from two observed per locale to zero across the full journey. |
| Switch workspace → browser Back and Forward | One scoped read on each destination. Zero new document loads across all internal legs. English used Enter to open the workspace and Arabic used a pointer. |
| No membership, Platform-only, denied | One `context` read each and no Owner task data request until entry. Each state displayed its own result. |
| Service or network failure → Retry | One failed read and one retry. The chooser preserved focus during the delayed reply and on success. A second Enter while checking created zero extra reads. |

The before/after change removes speculative route traffic. The required operating API request counts stayed the same. The routed replay supplies no provider cost or latency percentile estimate.

## Verification across environments

- The rebuilt local production app at `http://localhost:3100` opened in the existing signed-in Chrome Owner profile. The English and Arabic chooser each listed the two permitted synthetic memberships. The selected academy loaded the configured branch, Africa/Cairo and the two current sessions, and offered its dated Calendar destination. Switch workspace returned to the English chooser. This was a read-only positive walkthrough using an existing session.
- Production routing, 117 web units, typecheck, lint, the 15-case onboarding HTTP budget, the onboarding interaction suite, and disposable PostgreSQL onboarding and Today boundaries (16 and 10 cases) passed. The [workspace transfer receipt](evidence/ex13b-workspace-transfer/transport.json) was refreshed against the current compiled source with 72 transport checks and 21 disposable database checks.
- The [factual experience review](../../design/app-experience-review/AcademyOS-experience-review.html) was regenerated from all 16 component suites and eight entry captures. The 1,390 rendered frames have zero gaps for the declared fixture coverage. Source freshness and offline review-tool checks passed.

The denied/no-membership/unavailable scenarios above are local synthetic cases. Fresh identity-provider sign-in, exact-source staging, physical-device evidence and Owner acceptance of this checkpoint remain open. No release or hosted data or role changes were made. Prior scoped offline and shared layout evidence stays in its original receipts.

## Continue MP-B01

The [focused Player review](mp-b01-player-decisions-2026-11-14.md) proposes first registration/profile fields, exact readers and device limits, and the edit/archive/restore lifecycle. One bounded Terra 6.1 source review checked the current fields, authorization and local codec. The coordinator owned the acceptance assertions, implementation, integration, and evidence. Usage was not separately measured.

### WD-27 · Existing duplicate review and profile return

The actual Players component at its normal local URL used the real People POST handler, signed gateway and disposable PostgreSQL 17. In each locale, a fictional academy started with 23 players, including one same-name candidate. Search kept its value, keyboard opening and Back restored the row opener, and desktop directory scroll returned to the exact measured position (EN 731 CSS px and AR 738 CSS px). That existing profile leg added one profile read and no directory read.

The Owner could inspect the same-name candidate and return to the preserved name and contact draft. Saving required an explicit different-person check and confirmation. The comparison, existing profile, repeated review after returning to draft, save, confirmed profile, and directory refresh used six corresponding signed reads/writes (`candidates`, `profile`, `candidates`, `create`, `profile`, `list`) and zero extra documents. One new player, one original operation and one audit were observed in each database; the earlier candidate remained. Focus returned to the new row and Enter reopened the exact saved contact with one additional profile read. Current registration rules needed no change. [Executable case](../../scripts/workspace-download/duplicate_registration.mjs) · [Measured receipt](evidence/ex13b-workspace-transfer/transport.json).

This is local component, API and database evidence with a fictional identity adapter. The signed-in browser walkthrough above covers WD-01.

### WD-68 · Academy setup shortcuts

The normal Setup → Players and Setup → Today shortcuts use guarded client navigation. EN/AR tests held the destination read and checked its visible shell and pending content. Players displayed a distinct failed read with an explicit retry. The keyboard and pointer cases each used three new documents before the change across the entry, Back and Forward sequence, then zero after it. The two destination URLs also went from three observed prefetches each per journey to zero. The required destination reads were unchanged. Setup's staff and program shortcuts share the guarded link pattern.

Cancel at the dirty branch prompt preserved the exact field value. A modified click allowed the native link action while leaving that draft in place. That assertion intercepts the browser default after observing it. A controlled unknown save hid the shortcuts and reconciled with the original ID before the journey proceeded. That test used a fixture reply, alongside existing API and SQL tests of original-operation protection. An existing Academy Owner in local production Chrome used the actual Arabic Setup → Players → browser Back → Setup → Today sequence and saw current data in both destinations. [Executable cases](../../scripts/navigation/setup_shortcuts.mjs) · [Setup shortcut evidence](evidence/mp-b01-setup-shortcuts-2026-11-14.json).

NR01 and WD-68 retain broader role and route scope. The subsequent [WD-69 checkpoint](mp-b01-owner-tab-return-2026-11-14.md) records the tested Owner Today and Calendar return, including recovery after a temporary failed check. Follow the [living continuation](../06-delivery/continue-academyos.md) for the next development action.
