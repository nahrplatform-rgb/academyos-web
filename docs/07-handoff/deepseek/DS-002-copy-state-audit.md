# DS-002 — Players and Calendar wording/state audit

**Scope:** static copy/state audit of the existing Owner Players and Calendar journeys, EN and AR. Detail is in [`DS-002-copy-state-audit.csv`](DS-002-copy-state-audit.csv) (**85 rows**, `DS-002-C01`–`C85`). Proposed wording only; nothing is accepted, implemented or closed.

## Provenance

- Commit `3be2d4168bef1f58c5664f5daf3f038b6c602459`. DS-002 read as `ready_for_handoff`; EX-07 confirmed `primary` / `current` / `MP-B01`.
- Sources: `people-workspace.tsx` (`2d0bb9ec…`), `experience-workspace.tsx` (`4224f660…`); `owner-workspace-device.tsx` (`41cb886f…`) read only because both screens render its connection status. No other helper needed.
- Design reads: `operations-design-reference.md` (`02c973ca…`), `academy-working-behavior-contract.md` (`0e14c921…`), `product-outcomes-and-simplicity.md` (`149d36b7…`).
- Model: harness session reports the `deepseek-flash` alias; no credential or provider console read.
- Written: these two files only. The two worktree modifications present at start were untouched. No test, build, browser, DB, provider or Git write.

## Coverage

| Area | Rows | Assessments |
|---|---|---|
| Players — load, directory, empty, filtered-empty, search, paging, prepared summary, profile, denied, failed read, draft, duplicates, review, saving, unknown, return | 50 | 12 `ok`, 12 `minor`, 18 `issue`, 7 `decision_needed`, 1 `not_found` |
| Calendar — initial/checking, toolbar, summary, uncovered, empty, filtered-empty, day cells, failed read, unavailable, freshness, reload | 31 | 10 `ok`, 4 `minor`, 16 `issue`, 1 `not_found` |
| Shared device states | 4 | 2 `ok`, 1 `minor`, 1 `issue` |

`ok` accurate; `minor` clarity only; `issue` misleading or wrong for the state; `decision_needed` depends on a business/scope decision; `not_found` state absent in source. Rows quote confirmed source text, `reason` is interpretation, `suggested_text` is proposed copy.

## Strongest observations

1. A confirmed save can read as unconfirmed on one screen: `:415` "Registration confirmed…" beside `:383`/`:88` "Could not confirm this operation…" (C34); reads and writes share that message (C32).
2. A recorded contact displays as "Not provided" in the offline prepared summary, whose row has no contact field (C44).
3. Upcoming sessions say "Published", not "Scheduled"; the Guardian/Trainer card at `:325` already says Scheduled (C71/C72).
4. The Calendar loads "your current tasks", for both initial load and the sticky check (C52–C55).
5. "Retry access" labels a rate-limit retry, and one failed directory read renders two different messages (C39–C41).
6. Counts mix Arabic-Indic and Western digits, and `{n} لاعباً` / `{n} تدريباً` ignore singular and dual (C10, C62, C63).
7. The freshness footer picks its sentence by connection, not by data source (C78/C79); uncovered-period copy assumes offline (C64/C65).
8. "First visible date" does not describe the control (C58); visible "Refresh" is announced as "Reload current view" (C80).

## Blocked questions and limits

- **Fixture wording** at `people-workspace.tsx:386, 404, 455` and the `@example.invalid` rule at `:392` need the data-stage decision; those rows stay `decision_needed`.
- **Prepared-summary disclosure** (C45), plural strategy, a remove-downloads confirmation (C83) and a Scheduled/Published split are coordinator decisions.
- Not verified: no browser, screen-reader, RTL render, ICU runtime output, hosted state or native Arabic review; Arabic rows are meaning-level. Only a local CSV/path-format check ran.
