# DS-004 — First registration in a genuinely empty directory

Prepared 8 November 2026 under EX-07 / MP-B01; outcomes VAL-02/09, existing IMP-J06-A01 and WD-70/71 joins. Status: `ready_for_handoff` in [AI work items](../06-delivery/ai-work-items.csv). Preparation does not start a worker. This task supplies a small regression plan for the current development priority; it does not block the coordinator's independent initial-handoff work or Owner-deferred release.

## Useful result

Identify the exact source and existing test coverage for an Owner registering the **first player in an academy with zero players**, including an already prepared empty directory. Explain the smallest isolated fixture and missing assertions needed to prove that the new player becomes discoverable without clearing downloads or issuing another registration.

Do not produce another broad wording audit. DS-001 already exercises registration in a populated prepared directory; DS-002/003 have been reviewed. Explain how the zero-player case differs, and reuse existing proof where it is sufficient. Source inspection is not a reproduced defect, a passing test or proof of the hosted NR07 symptom.

## Frozen source and permitted reads

Read AGENTS.md, this brief, your task row and the current EX-07 row. Relevant contracts: master-plan product-outcomes/simplicity, the normal-workspace/dataset contract, working-behaviour WB-09/10/18 and the MP-B01 feedback/return checkpoint. These shared files may have expected uncommitted metadata; do not clean or rewrite them.

Inspect these six source files **at frozen commit `d2bccb8c9475dac9f7c4d1210b33655ae8320008`**, using read-only `git show <commit>:<path>`. For `test_boundary.py`, inspect only lines 1–120: the class/fixture helpers and existing empty/default-month and page tests. Hash its full file for provenance. This lets the coordinator continue independently without a moving-source audit. Report line numbers and hashes from that commit, not a mixture of working files. Compare only these six paths with the working tree and report any drift separately; do not repair or reset it. Read Python as text; do not import or execute it.

| Source | SHA-256 at the frozen commit |
|---|---|
| `apps/web/src/components/people-workspace.tsx` | `5d9d0d46b9c20e865708a85d578177ff7c05844402cd0760adf0ac2ee59b91a0` |
| `scripts/workspace-download/normal_workspace.mjs` | `7323cc8c3923909c559e8b2285ce444fde94231cc091ae7c5bf8e7c0f39621df` |
| `scripts/workspace-download/bridge.py` | `afb9f8dfb482ea5397f5c12f66c8ec2985565b2ab3925caf7d30476c3a127a0c` |
| `scripts/workspace-download/test_boundary.py` (read lines 1–120) | `021318ec8665b4d92177558752e632d17803ba16788806bfb754b3ce3c1dfb24` |
| `apps/web/src/lib/local-workspace-repository.ts` | `2a752b297c6a84ab070de021c1c76efe2516fdda6002f6ce19b929392fdb9e0b` |
| `apps/web/src/lib/workspace-device.ts` | `3f224da37a278c5e445edfcda9d6de29313dde165d60b8ddac93e2a92d42e0d7` |

Do not expand into cryptographic keys, credentials, environment files, live accounts, other chats or PYSA. If a function's producer or an authority claim is outside these sources, mark that evidence limit and name the unresolved symbol/path for the coordinator. Do not infer server guarantees from client code. No product design, migration or new policy is requested.

The backend already names an empty/default-month contract test. Inspect its actual scope and reuse that source evidence; do not label all empty-dataset coverage absent. The question is whether the normal UI proves first registration from a genuinely empty prepared directory. The bridge's `make` action also has distinct directory-only and calendar fixture paths; preserve that distinction when specifying a minimal isolated fixture.

## Six distinct cases to specify

Write one row per case, `DS-004-T01`–`T06`; paired translations do not create more cases.

1. **Online genuine empty entry:** an authorized, setup-complete academy with zero players; distinguish this from filtered-empty, unavailable and denied. Identify actual current fixture population and why a populated case cannot prove this boundary.
2. **Prepared complete empty dataset:** distinguish a verified empty collection from missing, incomplete or incompatible local coverage. Locate the relevant code; explicitly qualify any server/completion claim not proved in the allowed files.
3. **First confirmed registration:** duplicate review/current revision, original ID, saved profile, return to the ordinary directory and discovery/count of exactly one player. Identify appropriate request counters and canonical result assertions from existing tests; derive budgets rather than inventing them.
4. **First registration loses its reply:** retain/reconcile the original; one canonical player/result; ordinary prepared discovery. Preserve the existing real-handler replay proof and name the additional zero-player coverage needed.
5. **Confirmed registration followed by a failed read/preparation:** the confirmed save stays confirmed; a read/transfer failure cannot become an empty directory or another create. Explain the required held/failure observations.
6. **Authority/scope refusal:** distinguish missing sign-in, actual refusal and another academy; no private row leakage or replacement original. Identify existing assertions and limits rather than proposing new role behavior.

For each case provide: initial fixture, user actions, exact expected visible/data result, existing test name and baseline lines, covered-versus-missing distinction, minimal isolated fixture/test addition and evidence limit. Do not empty or alter the shared populated fixture, delete protected slots, fake server success or weaken assertions to make a case easy. New rich Player fields/edit/archive/import and MP-Q01 choices are outside scope.

## Write only two outputs, then stop

- `docs/07-handoff/deepseek/DS-004-empty-directory-test-plan.csv`
- `docs/07-handoff/deepseek/DS-004-empty-directory-test-plan.md`

CSV columns: `case_id,initial_fixture,user_actions,expected_result,existing_test_and_lines,coverage_gap,minimal_addition,source_evidence,evidence_limit`. Use LF line endings. The Markdown should be about 500 words or fewer: inspected commit/hashes, current fixture shape, useful existing proof, concrete missing cases, proposed isolated fixture location and unresolved source limits. State clearly that tests were not run. Do not invent a findings quota, model savings, timing, SQL/hosted proof or an Owner decision gate.

Source/tests/shared plans remain read-only. No builds, app tests, browser/provider/database/account actions, installs, schema changes, commits, pushes, promotions, messages or nested agents. You may validate the format of your two outputs and use read-only Git commands. If either output exists, stop before overwriting. If a case cannot be supported, record the exact gap instead of expanding scope. Return the two paths and the most useful test gap, then stop; do not start another task yourself.

The coordinator reviews factual anchors and any source drift, owns test implementation/integration and publishing, and selects the next useful task. This small packet is not an additional global approval gate or acceptance of EX-07. Default one active helper; no quota-filling work queue.
