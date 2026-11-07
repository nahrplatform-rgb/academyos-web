# DS-002 — Players and Calendar wording/state audit

**Registered task:** DS-002 in [AI work items](../06-delivery/ai-work-items.csv). Parent EX-07 / MP-B01; outcomes VAL-01/02/09. Initial assignment status: ready for Owner handoff, not started. The original copyable instruction is retained below; the return checkpoint and task register own current status. This file does not launch a worker or grant it global implementation ownership.

**Return checkpoint, 7 November:** the Owner returned both reports and reported the worker stopped. [Coordinator intake](deepseek-DS-002-intake-2026-11-07.md) records structural/source checks; the task register now says `submitted_for_review`. The initial assignment above is retained as provenance. Do not rerun or overwrite the returned reports; no suggestion is accepted by submission alone.

## Useful outcome

Find confusing, inconsistent or misleading EN/AR wording and feedback in the **existing** Owner Players and Calendar journeys. Produce exact source references and proposed wording so the coordinator can apply a coherent UI improvement later. This is a static source audit; do not claim browser, accessibility or hosted verification.

## Read

- `/Users/moamenghareeb/AcademyOS/AGENTS.md` and this task brief.
- Read your row in `docs/06-delivery/ai-work-items.csv` and the parent EX-07 row in `experience-execution.csv`. Start only if DS-002 is ready for handoff and EX-07 / MP-B01 is still current; otherwise report the mismatch and stop.
- `apps/web/src/components/people-workspace.tsx` and `apps/web/src/components/experience-workspace.tsx`; read directly imported copy/date helpers only if necessary and list them in the report.
- `docs/03-design/operations-design-reference.md`, `docs/03-design/academy-working-behavior-contract.md`, and `docs/06-delivery/master-plan-v2/product-outcomes-and-simplicity.md`.

Inspect Player directory/search, empty versus filtered-empty, registration/review, saving/confirmed/uncertain result, access refusal and return. Inspect Calendar period/navigation, initial/checking, empty/uncovered, disconnected and failed-read wording. If a state is absent, record that explicitly; never invent a control or runtime observation. Use current terminology and preserve the exact distinction between local Saved, server confirmation and Synced.

## Write only these two files

1. `docs/07-handoff/deepseek/DS-002-copy-state-audit.csv`
2. `docs/07-handoff/deepseek/DS-002-copy-state-audit.md`

CSV columns: `item_id`, `journey`, `state_or_control`, `locale`, `source_file`, `source_line`, `current_text`, `assessment`, `suggested_text`, `reason`, `evidence_limit`. IDs start `DS-002-C01` and remain stable. Include clear OK/not-found coverage as well as issues; no quota of invented findings. A row must cite the actual string/condition. Suggestions must not introduce a new permission, feature or policy.

The short Markdown report records inspected commit and relevant file hashes, actual model alias if visible without reading credentials, files read/written, coverage, most useful changes and remaining uncertainties. Distinguish confirmed source text, interpretation and proposed copy. Keep the summary around300words; put detail in CSV.

## Boundaries

- Product source is read-only. Do not change components, tests, database, fixtures, accounts, providers, dependencies, roles, financial rules or offline behavior.
- Do not modify any tracker, generator, canonical CSV, factual HTML, previous receipt or another worker's file. The coordinator updates shared records after review.
- No application tests/builds, installs, browser/provider actions, commits, pushes, promotions or nested agents. A short local CSV/path-format check of your two reports is allowed. Read-only Git status/show/rev-parse is allowed for source provenance.
- Do not access environment files, credentials, real records or unrelated chats. Do not reset/stash/overwrite pre-existing work.
- If an owned output already exists or source changes while you inspect it, report that and stop before overwriting. If a wording issue depends on an unclear business rule, flag it for the coordinator instead of deciding it.

## Completion and handback

Return the two paths, exact scope inspected, a brief list of strongest observations and any blocked question. Stop after producing them. **The coordinator must review the evidence and suggestions before they become implementation or accepted copy.** Task completion does not close EX-07, NR findings or Owner acceptance. No external sends are authorized.

Copyable instruction:

> Work only on registered task DS-002. Read `/Users/moamenghareeb/AcademyOS/docs/07-handoff/deepseek-task-DS-002.md` and follow its scope. Audit the existing Players/Calendar EN/AR wording and states, write only the two named report files, then stop and report. Do not change the app, shared plans, tests or database. Do not commit, push or deploy.
