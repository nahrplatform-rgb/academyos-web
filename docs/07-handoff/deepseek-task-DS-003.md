# DS-003 — Attendance wording and state audit

Registered child task under EX-07 / MP-B01; outcomes VAL-04/09. Initial status: `ready_for_handoff` in [AI work items](../06-delivery/ai-work-items.csv). This brief prepares manual handoff; it launches no worker. The coordinator owns DS-002's Players/Calendar review and integration in parallel. Default one active external helper, with no extra native helper or nested agents.

**Returned and reviewed, 7 November:** the Owner supplied both reports and reported the worker stopped. [The coordinator review](deepseek-DS-003-review-2026-11-07.md) and its 83-row ledger correct source/proposal limits; the combined MP-B01 packet owns actual adoption and checks. Do not relaunch or overwrite these completed outputs. The remaining text preserves the original handoff scope, not a new active assignment.

## Useful outcome

Audit the current normal Attendance and prepared-register wording in English and Arabic. Find misleading save, connection, retry or recovery messages with exact source anchors and proposed copy. Preserve the distinction between unsaved choices, Saved on this device, pending upload, server confirmation, refusal and an unknown original save. This is a static report, not an implementation task.

## Read scope and provenance

Read AGENTS.md, this brief, your task row and the current EX row. Start only if DS-003 is ready and EX-07 / MP-B01 is current. Read the Operations reference, working-behaviour contract and master-plan product-outcomes/simplicity contract. Use the existing offline-edit/conflict contract for save terminology; do not redesign synchronization.

Product source is limited to these three files:

- `apps/web/src/components/attendance-workspace.tsx`
- `apps/web/src/components/prepared-register-panel.tsx`
- `apps/web/src/components/prepared-register-session.tsx`

Record the exact inspected commit and full SHA-256 for each. Source baseline is `3be2d4168bef1f58c5664f5daf3f038b6c602459`; expected shared documentation edits are already dirty. Do not require a clean worktree. If the three source files change during inspection, stop and report drift. Do not inspect Players/Calendar, device-key internals, credentials, environment files, real records or unrelated chats. If a helper outside this scope is necessary, record the evidence gap instead of expanding the audit.

| Source | Baseline SHA-256 |
|---|---|
| Attendance workspace | `de8e4d472eb46338bec4b3fde5519d8d485863f6373c7f422c19d121d3e34c17` |
| Prepared register panel | `7849631b47c8140885e299db475954249c26257373e0875f2d725edeb3ab786c` |
| Prepared register session | `0d22aacd0fa1d5e37bc7266814577eca583e0eafb9cfb8bd955452c82d8a400c` |

Inspect sign-in/entry, authority checks, roster loading, clean recheck versus history, search/filter and empty results, Present/Absent/Unmarked, unsaved choices, register summary/review/save, individual correction/reason/history, confirmed-save/read failure, unknown-original recovery, local save, pending/syncing/synced, refused/conflicting/deadline states, navigation/dirty warnings and return. Mark a state absent or outside these three files explicitly. Check count wording used for an 18-player register from source; do not claim rendered-volume, browser, Arabic specialist or accessibility proof.

## Write only two reports

1. `docs/07-handoff/deepseek/DS-003-attendance-copy-state-audit.csv`
2. `docs/07-handoff/deepseek/DS-003-attendance-copy-state-audit.md`

Use the same 11 columns as DS-002: `item_id,journey,state_or_control,locale,source_file,source_line,current_text,assessment,suggested_text,reason,evidence_limit`. Stable sequential IDs start `DS-003-C01`; assessments are `ok`, `minor`, `issue`, `decision_needed`, `not_found`. Include accurate existing states and absent coverage, not an invented findings quota. Quote actual strings/conditions. An absent state may use `n/a` for its line with an explicit evidence limit. Proposals must not invent permissions, recording deadlines, timestamp-wins conflict rules, new offline commands or another confirmation step.

Keep the Markdown summary around 300 words: actual read/written files, source hashes, model alias if visible without credentials, coverage, strongest observations and uncertainties. Separate source facts, interpretation and proposed copy. A routine copy/formatting question is not automatically a new Owner policy decision; identify the exact unresolved rule if there is one.

## Boundaries and stop conditions

Product source, tests and shared records are read-only. Do not modify trackers, generators, canonical plans, factual HTML, DS-002 outputs or another worker's files. No app tests/builds, installs, browser/provider actions, database/account changes, commits, pushes, promotions, messages or nested agents. Read-only Git status/rev-parse/show and a short format/path check of your own reports are allowed. Do not reset, stash or clean concurrent work.

If either output already exists, stop before overwriting it. Report ambiguity, unavailable evidence or source drift; do not repair the app or quietly widen scope. Return the two paths and strongest observations, then stop. The coordinator reviews the report, integrates accepted changes and updates shared tracking. Submission does not close EX-07 or establish Owner, hosted or security acceptance.

Copyable instruction:

> Work only on AcademyOS task DS-003. Read `/Users/moamenghareeb/AcademyOS/docs/07-handoff/deepseek-task-DS-003.md`. Audit the three named Attendance sources in EN/AR. Write only the two specified reports, return their paths, then stop. Do not change the app, shared plans, tests or database. Do not commit, push or deploy.
