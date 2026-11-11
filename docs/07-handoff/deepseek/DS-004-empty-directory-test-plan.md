# DS-004 — First registration in a genuinely empty directory

**Scope:** a six-case regression plan for the zero-player first registration, read from frozen commit `d2bccb8c9475dac9f7c4d1210b33655ae8320008` (the current HEAD). Detail is in [`DS-004-empty-directory-test-plan.csv`](DS-004-empty-directory-test-plan.csv) (`DS-004-T01`–`T06`). No tests were run; no app, test, DB or shared plan was modified.

## Provenance

Six pinned sources were read via `git show <commit>:<path>`; all six SHA-256 match the brief exactly, and all six paths are byte-identical in the working tree (no drift):

- `people-workspace.tsx` `5d9d0d46…59b91a0` (474 lines)
- `normal_workspace.mjs` `7323cc8c…39621df` (457 lines)
- `bridge.py` `afb9f8df…3a127a0c` (155 lines)
- `test_boundary.py` `021318ec…1dfb24` (611 lines; inspected 1–120)
- `local-workspace-repository.ts` `2a752b29…db9e0b` (426 lines)
- `workspace-device.ts` `3f224da3…42e0d7` (298 lines)

## Current fixture shape

`bridge.make` already separates directory-only from calendar fixtures and accepts `size=0` (`bridge.py:73-90`); `test.academy()` is a setup-complete academy with no players until `seed_people(...,n)` runs. The backend `test_workspace_01_empty_and_default_months` (`test_boundary.py:86-100`) proves an empty people collection transfers as **1 page / 0 rows / phase complete**. `local-workspace-repository.read` distinguishes a verified empty head (`{rows:[], count:0, next:null}`, `:346-347`) from `null` (no head, `:318`).

## Existing proof that is already sufficient

DS-001 (now `normal_workspace.mjs:356-417`) already proves, in a *populated* directory, the exact request/RPC budget and canonical result a first registration needs: People calls `['candidates','create','profile']` (lost-reply `['candidates','create','reconcile','profile']`), one `i2_register_v1`/`i2_operation_v1` per original, post-save transfer `manifest → page → complete`, replay equivalence, and `registration_snapshot {operations:1,audits:1,players:1}`. Suspension/denial/offline-empty and the saved-vs-unknown copy are also already covered. The zero-player case reuses these assertions verbatim.

## What is missing

Only the **zero baseline** differs, and only these assertions are absent: (1) online genuine-empty renders the empty sentence, not filtered-empty/missing/denied; (2) a *prepared* empty collection renders empty online and offline while an incompatible scope masks instead; (3) the people revision goes 0→1 and the page summary reads exactly `1 player on this page`; (4) after a lost reply the academy holds exactly one player and the prepared directory exactly one row; (5) a failed post-save transfer keeps `saved` true and never regresses to the empty sentence or a second create; (6) refusal replaces the empty state on a zero-player directory and missing sign-in remains distinct.

## Proposed isolated fixture location

A new `checkEmptyDirectoryRegistration` in `scripts/workspace-download/normal_workspace.mjs`, reusing `normalWorkspaceFixture` with the existing `{register, people}` options and `loseNextCreateReply()`, driven by a second `db({action:'make', size:0})` fixture; wiring and `rpcCalls` live in `test_transport.mjs` (outside these six files).

## Unresolved source limits

The `i2_people_v1`/`i2_register_v1` SQL and the Clerk `auth.protect()`/401 path are outside the six files; `options.people`, `rpcCalls` and any transfer-failure injection hook are wired in `test_transport.mjs`; a `revision` bridge read is not exposed through `bridge.execute` (`test_boundary.py:59-60`). Each is flagged per case for the coordinator.
