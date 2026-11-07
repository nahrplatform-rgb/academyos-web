# MP-B01 Owner working day — continuity baseline and Player contract checkpoint

7 November 2026. Implementation continuation of [MP-B01](../06-delivery/master-plan-v2/delivery-batches.csv) under the [living continuation prompt](../06-delivery/continue-academyos.md). This checkpoint adds **no product behavior**: it adds one scoped local post-registration regression without closing the hosted investigation, records the measured post-save request path, and delivers the [rich Player field/action/difference packet](mp-b01-rich-player-contract-2026-11-07.md) that MP-Q01 requires before any new field or writer. No migration, endpoint, component, permission, provider setting or account changed. No deployment promotion occurred.

**Coordinator correction:** the registration test boundary and Player packet were reviewed/repaired under [DS-001](deepseek-bcb1a78-review-2026-11-07.md). Original counts below describe `bcb1a78`; the new receipt records53 scoped cases. NR07 remains open.

Trace: EX-07; IMP-J06-A01/A02; IMP-J01-A01; J06; D05; AO-013/016/023; NR07/NR14/NR15; WB-02/05/07/09/10/11/18/20; WD-58/60/62/68–71. Outcomes **VAL-01/02/04/09**.

## Authorized scope and starting point

MP-B01 requires one connected Owner day: open Today, browse Calendar, discover a Player, use a useful profile/registration workflow, open the correct register, return without losing context, and understand connection/pending outcomes, with the remaining initial/return/post-save reads baselined and ready accepted continuity repairs advanced. [Decision MP-Q01](../06-delivery/master-plan-v2/decision-dependencies.csv) blocks only dependent new fields/writers and explicitly asks to continue approved continuity and the design inventory.

Baseline at this checkpoint: source `29293f0` plus the local post-push receipts for its CI result; canonical product source for release remains the Owner-deferred `1e68403`. Existing promoted `68b6575` and the live staging alias are unchanged and were not re-verified here.

## What was open

The [6 November normal-Attendance checkpoint](ex07-normal-attendance-checkpoint-2026-11-06.md#confirmed-source-path-and-remaining-uncertainty) recorded a confirmed affected-view inconsistency: after two successful registrations the prepared Players directory still showed **0 players / No players registered yet** while canonical planning and SQL saw both. NR07 carried it as "exact invalidation/coverage source cause not yet traced", with an explicit instruction to reproduce and repair through the existing collection revision/completion protocol before claiming People creation continuity.

That is a post-save continuity case in the current batch, so it was addressed first — with a reproduction attempt rather than a speculative fix.

## Reproduction attempt and result

The existing EX-13B harness runs the real workspace-download/key Next handlers, Supabase SDK, signed gateway and disposable PostgreSQL17. Its original People HTTP responses were fictional. The bcb1a78 registration bridge invoked canonical SQL with a new fixture UUID rather than the browser save ID; it did not exercise the real People HTTP handler. The later DS-001 repair closes that fixture gap, not the hosted defect.

Added to that harness (test code only):

1. Original bcb1a78: a bridge calls canonical `i2_register_v1` SQL with fixture-generated arguments/UUID. The insert/revision trigger is real, while browser-to-HTTP original-ID fidelity was not established by that version.
2. Original bcb1a78: create/profile HTTP responses are fictional around that SQL bridge; the prepared workspace transfer remains real. Do not label the whole People journey a real-handler end-to-end test.
3. One new case: from a prepared Owner Players task, register a fictional player, confirm the saved profile, return to the directory, and find the new player **through the prepared replica**.

Result: the case **passes**; the hosted symptom did **not** reproduce.
`PASS A confirmed registration becomes discoverable from the prepared directory without an online list read`.

Measured on that synthetic 57-row directory:

| Signal | Result |
|---|---|
| People operating calls during registration | `candidates`, `create`, `profile` — one each, no second read of the same intent |
| People calls to show the new player in the directory | **0** (no online `list` after returning) |
| Workspace transfer actions after the save | `manifest`, `page`, `page`, `page`, `complete` — the people collection performed one replacement transfer because the revision changed |
| Evidence boundary | Existing product guards unchanged; this original case proves one prepared-directory result, not full duplicate/original-ID recovery |

This one nonempty fixture invalidates its prepared projection as expected. It neither proves every entry/empty state correct nor establishes that no repair is needed elsewhere. No speculative cache/schema change is justified by this sample alone. The hosted 6 November observation therefore remains **undiagnosed rather than fixed**. Candidate explanations that this fixture cannot distinguish, listed so the next hosted attempt can test them instead of guessing:

- the observing tab held an earlier-session worker/app build, or a second tab owned the transfer;
- the workspace device was not approved at that moment for that academy, which would make the directory an online read whose result was not the prepared projection;
- the observation happened before the `20261105135304` migration containing `workspace_revisions`/`x21_revise` was applied to the hosted project (the local fixture always has it);
- a hosted-only rate limit or transfer refusal that the fixture's fictional limiter does not reproduce.

A hosted reproduction needs the actual source/worker/account/coverage identity and a network/transfer trace from the same signed-in tab. Current staging can be investigated under the standing synthetic-trial authority; a new promotion is necessary only if required instrumentation or a real repair needs deployment. The agent never promotes. No hosted attempt was performed in this checkpoint or inferred from the local pass.

## Request baseline recorded for the Owner day

Measured here or carried explicitly from named receipts — no new percentile or provider-cost claim:

| Task | Initial | Visible return / resume | Post-save |
|---|---|---|---|
| Players (prepared) | 1 online `list` before the device is prepared; 0 operating reads once prepared | 0 operating reads; one eligible shared manifest check | directory refresh = 1 manifest + 3 pages + 1 completion for 57 rows, 0 online `list`; profile = 1 online read after create |
| Attendance (prepared register) | 0 `/api/attendance` roster calls on normal reopen (retained [6 November receipt](evidence/ex07-normal-attendance/runtime.json)) | 1 eligible manifest under a held check, 18 rows retained (retained) | 0 new documents; one affected-register refresh after the confirmed receipt (retained) |
| Calendar (prepared, Owner) | local covered read; one month preparation when uncovered (retained) | 0 operating reads on a covered view change; 1 manifest check when changes are requested (retained) | unchanged-check transfers 0 dataset pages (retained) |

These are fixture counts under a fictional provider wire, not hosted latency, provider savings or a whole-day budget. The remaining **initial-handoff** and **post-save** cases outside Attendance/Players — notably Calendar initial handoff, the empty-directory-first-registration shape, and coarser Owner-day end-to-end timing — stay open.

## Files changed in this checkpoint

| File | Change |
|---|---|
| `scripts/workspace-download/bridge.py` | Adds the `register_player` fixture action that calls the real signed `i2_register_v1` |
| `scripts/workspace-download/normal_workspace.mjs` | Fictional online People transport gains create/profile honesty; one new continuity case plus its metrics |
| `scripts/workspace-download/test_transport.mjs` | Wires the fixture registration to the disposable database |
| [`docs/07-handoff/evidence/ex13b-workspace-transfer/transport.json`](evidence/ex13b-workspace-transfer/transport.json) | Regenerated: **50** checks, new source hashes, `postRegistration` metrics |
| [`mp-b01-rich-player-contract-2026-11-07.md`](mp-b01-rich-player-contract-2026-11-07.md) | New rich Player field/action/difference packet with the MP-Q01 questions |
| [Master plan package](../06-delivery/master-plan-v2/README.md), `package-receipt.json`, [checkpoint handoff](master-plan-v2-checkpoint-2026-11-07.md) | Retains the previous checkpoint's local CI receipt and Dependabot notice that were waiting for this coherent batch |

No `apps/web` source, SQL migration, worker, flag or provider configuration changed.

## Checks actually run

| Check | Result |
|---|---|
| Disposable PostgreSQL 17 workspace boundary | **21/21** passed (unchanged source contract) |
| Workspace transfer/transport suite (real handler, real Chromium, real components) | **50/50** passed locally, including the new case; `--check` reproduces the receipt |
| Production build | passed (`next build`) |
| Unit tests | **101/101** passed |
| TypeScript | passed (`tsc --noEmit`) |
| ESLint | passed (`eslint .`) |
| Independent human security review | deferred by Owner; nonblocking; not performed |

Limitations: the fixture uses a fictional Clerk session, fictional online legacy responses and a fictional limiter; identity, network, device and provider behaviour are not hosted. This machine runs Node v26.9.0 while CI pins Node 24 and the repository declares `>=24 <25`; the local result is therefore a source-level pass, not a toolchain-identical CI replay.

## Exact-source CI

Commit **`bcb1a7863116b88a3d2bb5299d0fb3317a7d25da`** was pushed. [Foundation run 42373030694](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/42373030694), job [128404876667](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/42373030694/job/128404876667), completed **success with 53/53 steps**, including the regenerated workspace transfer `--check`, the disposable-PostgreSQL suites, every synthetic app regression and `test:e2e` under the pinned Node 24 toolchain. This is automated source/fixture evidence under the documented fictional boundaries; it is not hosted, installed-device, Owner or security acceptance, and no deployment was promoted.

Post-push metadata is recorded locally for the next coherent batch instead of pushing another documentation-only commit that would repeat the full suite to record its own result.

## Next action

1. Use the corrected [focused MP-Q01 packet](mp-b01-rich-player-contract-2026-11-07.md#focused-decisions-not-a-global-stop) for selected new fields/commands. Continue accepted work without waiting for every future field, archive or import choice.
2. Continue the remaining MP-B01 continuity and Operations-adoption work that needs no new decision: initial-handoff continuity for the Owner day, the People directory's empty-state shape, and Calendar/Players density against the selected Operations states.
3. Release follow-up is unchanged and separate: `1e68403` remains Owner-deferred with its passed exact-source CI; a later combined candidate needs its own CI and preserved supersession evidence. Current-source hosted diagnosis is not automatically blocked by the deferred candidate; a source-changing repair has its own exact release proof.
