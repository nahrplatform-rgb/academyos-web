# DS-001 — Coordinator review and correction of DeepSeek batch bcb1a78

Owner instruction: review all work from the DeepSeek session, correct or redo it where necessary, and prepare simple meaningful work that is registered/tracked. This receipt joins **DS-001 → EX-07 / MP-B01 → NR07/14/15 → IMP-J06-A01/A02 → VAL-01/02/09**. It does not create another primary queue or approve rich Player policy.

[Structured review/check receipt](evidence/deepseek-DS-001-review-2026-11-07.json). The worker ledger records coordinator-reviewed outputs, not Owner working-feature acceptance.

## Baseline and review method

Reviewed all13 paths changed by `bcb1a7863116b88a3d2bb5299d0fb3317a7d25da` against `29293f0`. The existing dirty file was its post-push CI receipt in `mp-b01-owner-day-continuity-2026-11-07.md`; those exact results were preserved. No reset/revert of completed work. Source/runtime/hosted/Owner evidence remain separate.

The original DeepSeek Harness session was read locally in the preceding review: `session-745c66f3-c728-41f0-9bec-5e64e9c6010c`, configured alias `deepseek-flash`,196 model steps,199 tool calls, about58.7 elapsed minutes including local testing/CI and five transport/time-out retries. These describe one task, not relative model quality, billed cost or measured savings. No raw transcript, credentials or private records are copied into this repository.

## Every changed path reviewed

| Original changed path | Assessment and disposition |
|---|---|
| `scripts/workspace-download/bridge.py` | Repair: generated replacement UUID and hardcoded duplicate fields lost the browser intent. Removed direct fixture registration; real People RPC argument binding now carries the browser original. Added read-only disposable receipt/player/audit observer |
| `scripts/workspace-download/normal_workspace.mjs` | Keep useful nonempty-directory discovery assertion. Repair registration scenarios to use the real People handler, canonical profile and original ID; verify idempotent replay and post-commit unavailable-result recovery |
| `scripts/workspace-download/test_transport.mjs` | Keep real workspace transfer harness. Add actual People route/parser/SQL input fingerprints, typed bridge targets, current-authority refusal and explicit source-fresh assertions for the new cases |
| `docs/07-handoff/evidence/ex13b-workspace-transfer/transport.json` | Original50-case receipt superseded by a new53-case Node24 receipt from the repaired harness; old source/result remains in Git history |
| `docs/07-handoff/mp-b01-owner-day-continuity-2026-11-07.md` | Retain dated original result and CI53/53. Correct investigation-closure wording, original fixture limits and unconditional promotion prerequisite; point to this review |
| `docs/07-handoff/mp-b01-rich-player-contract-2026-11-07.md` | Rewrite unsupported exclusions/English-name/child-only/default/visibility assumptions; preserve current baseline and explicit pending policy; align rich profiles with normal local-data target |
| `docs/04-engineering/request-findings-register.md` | Keep NR07 open. Separate expected behavior in one fixture from hosted diagnosis; remove later-promotion-only investigation gate |
| `docs/06-delivery/experience-execution.csv` | Preserve one current EX-07, actual deployment and Owner statuses. Point to corrected evidence and scoped next action; worker task does not advance the parent |
| `docs/06-delivery/continue-academyos.md` | Regenerate from tracker; no hand-edit. Add registered worker scope/status projection without another priority queue |
| `docs/06-delivery/master-plan-v2/README.md` | Retain canonical direction and prior automatic-build clarification; add focused field/review/task joins |
| `docs/06-delivery/master-plan-v2/package-receipt.json` | Retain dated MP-B00/29293f0 CI and untriaged dependency notice; local audit count is a dated observation, not provider-alert reconciliation or vulnerability closure |
| `docs/07-handoff/master-plan-v2-checkpoint-2026-11-07.md` | Retain historical planning/CI evidence; add this later review pointer instead of relabelling the old checkpoint |
| `docs/07-handoff/ex07-normal-attendance-checkpoint-2026-11-06.md` | Keep historical49-case statement accurate and point to the current versioned transport receipt/review; no new Attendance implementation claim |

## Corrections and findings

1. **DSR-01 — Test boundary/original identity.** The original People create/profile transport was fictional and generated a new operation ID before invoking SQL. The repaired registration scenarios use the real Next People handler/parser, Supabase SDK and signed gateway through a fictional PostgREST wire to disposable PostgreSQL17. Browser IDs and full current arguments reach canonical operations unchanged. Clerk, limiter and wire remain substituted; this is not hosted identity proof.
2. **DSR-02 — Complete useful field scope.** Added an individual [42-field reconciliation](../06-delivery/master-plan-v2/player-field-reconciliation.csv). School, grade, water confidence/restrictions and the disabled session selector now have explicit dispositions. Nationality/document sensitivity, phone/address/notes usefulness, kit applicability, archive/end dates and flag visibility are not invented as facts.
3. **DSR-03 — Local experience.** Current minimal replica/online profile remains a baseline. The target retains permitted rich profiles and supported edits on the normal device path. Schema/epoch migration is engineering work; exact new private fields/commands still need their contract.
4. **DSR-04 — Hosted investigation.** The same People/workspace product paths and migrations match the recorded68b6575 baseline. A new promotion is not inherently required to inspect/reproduce current staging. Record actual current source/worker/account/coverage/network before interpreting a trace. No hosted attempt was performed in this review; NR07 stays undiagnosed/unfixed.
5. **DSR-05 — Scope and useful decisions.** Three focused MP-Q01 groups replace a mixed ten-question global stop. No new field, archive/import rule, contact visibility or offline command is silently approved. Continue independent accepted work.
6. **DSR-06 — Toolchain and orchestration.** Repaired fixture runs use pinned Node24.14.0 and disposable PG17. The worker register/brief limits DeepSeek to owned outputs and coordinator review; no external worker is launched by writing a task row.

## Verification

The repaired transport suite passed **53/53** under Node24.14.0: retained existing assertions plus real People denial, original-ID replay and post-commit unavailable-response reconciliation. Both replay/recovery assert exactly **one player, one operation receipt and one registration audit**. A normal save still uses candidates/create/profile and zero online list calls; its57-row replacement transfer is manifest +3pages +complete. The recovery case adds its explicit reconcile and ends at58 total players.

The unavailable-result fault deliberately replaces the committed200 response with503. An initial TCP-reset attempt was transparently retried by Chromium, so it did not deterministically reach the unknown state. The fault was corrected; no product behavior or assertion was weakened. An initial local variable collision was corrected before fixture verification. No hanging/repeated unchanged full suite is treated as progress.

The exact current receipt is [transport.json](evidence/ex13b-workspace-transfer/transport.json). Canonical application files, schema migrations, workers, roles, keys and provider settings are unchanged. Final local validation:

| Check | Actual result / limit |
|---|---|
| Transport and source-fresh receipt |53/53 passed on Node24.14.0 with disposablePG17; `--check` passes current hashes |
| Existing People API boundary regression |passed;15 failed-budget cases,3 invalid-body cases and cross-origin refusal; synthetic session/limiter adapters |
| Continuation/worker contracts |17/17 passed, including unknown parent, overlapping ownership, missing submitted outputs, historical batch retention and no implicit parent advance |
| Master/canonical/execution |passed; all180 AO/AT,68 screens,30 actions,21domains,42focused field joins,2worker rows,9PWA joins and86WD cases retained; optional local PYSA path/finding check passed |
| Factual review |inventory-only refresh and freshness passed; unchanged source/capture pack,1224frames/1213transitions; no new UI capture or hosted claim |
| Product/schema/provider boundary |no `apps/web`, migration, worker, workflow, dependency, account or hosted configuration change |

Unaffected prior 101 unit/build/type/lint results remain historical; automatic CI for a new candidate is separate.

## Outstanding work and next tracked task

- **NR07 hosted zero-player symptom:** open; local nonempty success/recovery does not close it. Zero-player first-registration and wider initial-handoff behavior still need their separate cases and actual hosted trace.
- **Rich fields:** pending exact selected field/role/lifecycle contracts. Current Unicode minimal writer is the working behavior; this review introduces no new collection.
- **DS-002:** [simple EN/AR copy/state audit](deepseek-task-DS-002.md), ready for Owner handoff, not running. Its two report files are isolated from coordinator-owned source/plans. [AI work items](../06-delivery/ai-work-items.csv) tracks it under the same EX-07 / MP-B01. A report needs review before adoption.
- **Release:** Owner-deferred1e68403 promotion remains separate. No promotion/passkey flow, live-alias action, account/provider change or new hosted/installed/Owner acceptance occurred.

## AI execution

One explicitly configured `gpt-6.1-terra` medium helper performed a read-only42-field/reference review. It owned no files, tests, browser/provider actions or nested agents. The coordinator owned architecture, fixture/recovery repair, all edits and integration. Observed peak active native helpers1; no DeepSeek worker was launched by this batch. DS-002 is only a prepared Owner handoff; unrelated external activity is not inventoried as a runtime guarantee. Actual token/cost savings are unmeasured.
