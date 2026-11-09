# AI delegation, concurrency and delivery cost

Owner-directed project policy, recorded 4 November and updated 9 November 2026. Apply it to each AcademyOS batch. The execution tracker and existing contracts govern the scope, decisions and release authority.

The zero/one default and ceiling of two below are the conservative engineering interpretation of “not too many,” not a measured optimum or a numeric limit quoted from the Owner.

## Operating rule

**Use GPT-6.1 Sol to coordinate and GPT-6.1 Terra for new bounded helper assignments. Use scripts directly for deterministic work.**

1. **Route.** Select the current batch from the execution tracker. Use a script for known commands, CI waiting, routine metadata checks and generation. Sol handles decisions, architecture, authority, synchronization, recovery, integration and release readiness.
2. **Assign.** If the task meets the scope and cost test below, give one explicitly configured Terra worker a fresh brief with exact ownership, acceptance cases, evidence and a stop condition. A second helper requires a documented independent scope and benefit. Keep a single coordinator.
3. **Verify.** Apply the same acceptance criteria regardless of model. The coordinator checks the diff and the evidence for the changed behavior and runs the affected integration checks. Run consolidated validation at the coherent checkpoint. Revisit a specific result when the evidence is incomplete, the source has changed or a regression needs investigation.
4. **Record.** Put the model, scope, result and verification in the existing batch receipt. Keep development, release evidence and Owner acceptance separate. Link the receipt from the tracker and regenerate the continuation at the checkpoint.

Choose by expected cost of a correctly completed result, including context, coordination, validation and repairs. A lower token rate does not establish a lower whole-task cost. Do not force every task into a delegation workflow or invent a target percentage of work that must use Terra. These are initial routing choices, not a benchmark proving a capability hierarchy between the models.

The Owner's instruction authorizes suitable bounded delegation during ordinary continuation. The coordinator may work directly when a task is small, serial, deterministic, sensitive or cheaper to complete without a handoff. Follow the charter, applicable tool limits and the current batch. [Agent instructions](../../AGENTS.md) · [Execution tracker](../06-delivery/experience-execution.csv)

### Historical DeepSeek trial — 7–8 November 2026

The external trial produced a registration regression and focused audit reports. Keep their exact scopes, returned evidence and coordinator corrections in the child-work register. The 9 November Sol/Terra rule governs new assignments. [AI work items](../06-delivery/ai-work-items.csv) · [DS-001 review](../07-handoff/deepseek-bcb1a78-review-2026-11-07.md) · [DS-004 corrected dispositions](../07-handoff/deepseek-DS-004-review-2026-11-08.md)

DeepSeek stopped DS-005 after writing a partial helper. Terra completed the two owned outputs, and the coordinator integrated the observer and runner and verified the online empty-directory scenario. The record retains separate external, native, integrated and hosted evidence. [Interruption receipt](../07-handoff/deepseek-DS-005-interruption-2026-11-08.md) · [DS-005 review](../07-handoff/deepseek-DS-005-review-2026-11-08.md)

## Models and bounded concurrency

| Item | Project instruction |
|---|---|
| Coordinator | Use `gpt-6.1-sol` for coordination. The running main agent retains accountability and respects the Owner's model selection. |
| Delegated worker | Explicitly choose `gpt-6.1-terra` for eligible work; do not assume the worker inherits that model. If unavailable, continue with the existing coordinator and state the limitation; do not purchase access or silently substitute another paid model. |
| Normal active helpers | Zero for small/serial/mechanical work; one Terra helper for a worthwhile bounded task. |
| Maximum active helpers | Two, excluding the coordinator, only for genuinely independent work with non-overlapping ownership and a recorded benefit. This is a ceiling, not a target. |
| Nested delegation | Prohibited. Helpers return to the coordinator instead of spawning children. Count any already active related workers before starting another; do not start replacement or duplicate workers while originals are still active. |
| Coordinator count | One active implementation coordinator for the AcademyOS batch. Do not create extra chats/parent trees to bypass the limit; coordinate with any known parallel project work. |
| Reasoning effort | Start low for clear low-risk repetition and medium for bounded investigation/logic where supported. Increase effort only with a specific reason; complex/ambiguous cross-module reasoning normally returns to the existing coordinator. Do not apply maximum effort to every task. |
| Availability and visibility | Use available agent-state tools when considering a spawn. If related active work cannot be accounted for, do not add uncertain overlapping workers; the coordinator continues serially. Do not claim a project-wide runtime limit was verified when only one tree is visible. |

A second helper needs a concrete reason in the batch note: independent scopes, separate files/resources, and expected benefit after coordination cost. More than two requires a later explicit Owner change; otherwise queue the work. Stop or finish an obsolete worker before replacing it. Avoid frequent polling; use bounded waits and concise completion evidence while continuing independent useful work.

This document and its references are **project instructions**, not a provider-level hard cap. No global Codex configuration, billing setting, model account or concurrency setting is changed by this documentation checkpoint. A structural documentation validator can check the policy is linked; it cannot prove a runtime agent honored the cap or verify billing. Report actual active counts and limitations honestly.

## Work routing

| Work | Default owner | Boundary |
|---|---|---|
| CI waiting, generating registers/prompts, formatting, validators, known commands and simple file searches | Script/tool directly | Run one bounded command and use its result. Batch independent reads and keep output bounded. |
| Focused source inventory, reference comparison, exact-path documentation updates following settled decisions, copy/terminology consistency | Terra candidate | Give the exact question/pattern, authoritative references and file set. No new policy interpretation, grant or acceptance claim. |
| Applying an approved component pattern to a bounded independent surface; targeted test investigation | Terra candidate | Real contracts/acceptance cases must already be clear. Preserve assertions, operation semantics and domain boundaries; no speculative abstraction or unrelated rewrite. |
| Visual comparison or fixture-based UI checks | Terra candidate when tools/resources can be isolated | Match reference/data/role/locale/theme/viewport. Do not compete for the real browser or infer backend/security proof from screenshots. |
| Architecture, ambiguous requirements, role/tenant authority, crypto/key recovery, offline synchronization/concurrency and consequential transaction changes | Coordinator | Terra may collect a narrow read-only fact, but the lead owns the reasoning, decision and integration. A cheap worker is not a policy authority. |
| Cross-module integration, final diff/receipt assessment and combined validation | Coordinator | Inspect the returned evidence and critical changes; do not merely repeat the worker's success claim or redo all its work without cause. |
| Hosted account/provider mutation, migrations, custody/flags and authorized destructive operations | Coordinator under existing authority | No helper may improvise grants, delete data, send messages or alter providers. Preparing a plan is not permission to execute it. |
| Git staging/commit/push and generated canonical/factual artifacts | Coordinator by default | Keep one owner of shared outputs and the final coherent batch. Helpers report changed files; they do not independently publish work. |
| Deployment promotion | Owner only | Neither coordinator nor worker promotes, reassigns the live alias or operates the passkey/promotion flow. |

This routing does not prohibit Terra from being capable of demanding work. It controls risk and coordination while AcademyOS collects real delivery evidence. Revisit routing using observed quality/cost, without changing accepted product rules or silently substituting models.

## CI and deployment evidence

At a release checkpoint, use the full candidate SHA and its Foundation checks run ID. Find the run once from the existing PR or use `gh run list --repo nahrplatform-rgb/academyos-web --workflow verify.yml --commit "$candidate_sha" --json databaseId,headSha,event,status,conclusion,url`.

```sh
python3 scripts/verification/wait_for_candidate.py --commit "$candidate_sha" --run-id "$foundation_run_id"
```

The [CI waiter](../../scripts/verification/wait_for_candidate.py) uses the GitHub CLI to read one named run every 30 seconds until it completes, with a default one-hour wait window. It checks the repository, workflow, source and run attempt, then prints one JSON result with the verdict, run and job links, step counts and the first failed step when available. Exit `0` means the expected checks passed, `1` means CI finished without success, and `2` means verification could not be completed. Only inspect a targeted log excerpt when needed to diagnose a failure. After a rerun, verify the new attempt and record it in the existing release receipt.

When a release needs a preview, make one separate read-only Vercel lookup for the candidate. Check the AcademyOS project, exact source SHA, deployment ID and ready state. Use the connected read tool or an already authorized CLI session. The Owner promotes the checked deployment. Afterward, verify the live staging source and signed-in behavior separately. [Coherent delivery and verification](../06-delivery/master-plan-v2/delivery-and-verification.md)

## Delegation decision before spawning

The coordinator answers these questions in a short batch note:

1. Is there a clear, sufficiently substantial subtask with an expected result and objective checks?
2. Can a direct command, generator or existing result solve it more cheaply?
3. Can the worker proceed without waiting for an unresolved business decision or the lead's next edit?
4. Are files, fixtures, ports, browser/provider resources and generated outputs independently owned?
5. Will context transfer, review and likely repair cost be smaller than the benefit? If unknown, keep the trial small and label it unmeasured.
6. Is the active-helper count within the limit, with no nested or duplicate work?

If the answer is no, keep it serial or prepare the missing contract first. Do not spawn agents just to appear busy, multiply quota usage to shorten a trivial wait, or use a worker to avoid a difficult decision.

## Minimal handoff contract

Use a fresh, concise brief rather than forwarding this whole chat. A different-model worker must be explicitly configured as Terra using the tools available in that session. Where supported, start with task-specific context instead of copying the entire parent history. Required repository/charter and relevant accepted contracts still apply; context reduction never authorizes skipping applicable instructions.

```text
Batch / EX / journey-action / requirement IDs:
Exact outcome and acceptance cases:
Model: gpt-6.1-terra; effort and reason:
Read-only or exact write-owned files/resources:
Relevant accepted decisions/source paths and known current state:
Boundaries: no nested agents, no other files/role/provider/Git changes,
  no weakened assertions or new business rules; preserve concurrent work:
Commands/checks and expected evidence:
Stop/escalate conditions and how much repair is permitted:
Return: concise result, changed paths, exact checks/results, unresolved issues,
  evidence references and available usage; no secrets or full logs:
```

Return a compact summary, normally around 300 words, with references to any larger evidence. Required exceptions/negative cases matter more than an arbitrary word cap. Include actual command exit/results and source paths, not an unsupported “done.” Avoid dumping whole files, model reasoning, complete browser trees, raw private responses or repeated tool inventories into the main context. Ask for targeted output and retain only the useful excerpts.

## Shared workspace and resource ownership

- One writer owns each path/resource at a time. Shared shell/contracts, canonical matrices, generated continuation/factual HTML and lockfiles stay with the coordinator unless one exact write scope is explicitly transferred.
- Read the current tree and inspect the diff before and after integration. Do not reset, stash, replace or overwrite another agent's/user's changes to make a task easier. Overlap returns to the coordinator; use an isolated checkout/worktree only when justified and authorized by the existing workflow.
- No simultaneous control of the real computer/browser/profile or provider dashboard. The coordinator owns those interactions; a worker uses an isolated fictional/headless fixture only when explicitly assigned.
- Serialize database applies, provider mutations, shared fixture changes, canonical generation, heavy builds and performance measurements where contention or state would invalidate results. Give tests distinct fixtures/ports where needed. Parallel execution is not permission to corrupt a request budget or benchmark.
- Reuse the same bounded worker for a related follow-up when efficient. Do not duplicate investigations, run the same full suite in several agents, or keep a completed task running in a polling loop.

## Escalation and quality

A worker stops and returns evidence when scope becomes ambiguous, authority/ownership/retention policy is missing, a sensitive boundary is unexpectedly involved, another writer overlaps, required access is unavailable or the task no longer fits its brief. Do not invent a rule or request new privileged access independently.

For an ordinary bounded defect, permit one focused repair attempt when the cause is understood. If it fails, or a second cause/contract change appears, return the evidence to the coordinator. Consequential permission/recovery uncertainty escalates immediately. The coordinator decides whether to fix directly, clarify the brief or obtain a genuinely required decision; do not cycle through additional workers automatically.

The lead verifies the diff against the actual approved contract and runs or confirms meaningful integration checks. Test failures are fixed at their cause; never delete assertions, relax request budgets, change business results or mark skipped checks passed to make delegation look economical. Repeat tests only for new changes, failures or unresolved concerns. Preserve design/source/local/deployment/hosted/Owner status separation.

Worker review remains AI engineering review. The [Owner's deferred independent security review](staging-delivery-and-review-policy.md) is neither reopened as a blocker nor relabelled passed because two models reviewed the work.

## Cost facts and measurement

The following is a **dated source snapshot, checked 4 November 2026**, not a guarantee of future rates or the Owner's included allowance. Official [Codex pricing](https://learn.chatgpt.com/docs/pricing) lists Standard credits per million tokens:

| Model | Input | Cached input | Output |
|---|---:|---:|---:|
| GPT-6.1 Sol | 50 | 2.5 | 250 |
| GPT-6.1 Terra | 25 | 1.25 | 125 |

Published Terra credit rates are half Sol's for these categories. The same page distinguishes subscription usage from API/token pricing; do not promise twice the five-hour allowance. Official [subagent guidance](https://learn.chatgpt.com/docs/agent-configuration/subagents) explains the extra model/tool token work and warns about concurrent writes. [Terra's model page](https://developers.openai.com/api/docs/models/gpt-6.1-terra) documents its model identity and supported effort options. These sources support the cost/overhead facts; the AcademyOS cap and routing above are project decisions, not OpenAI defaults or comparative benchmarks.

Measure **cost per verified completed batch**, not number of agents, files or cheap-model tokens alone. Include coordinator context, worker context/output/reasoning where exposed, tool-related work, integration, repairs and discarded attempts. Keep AI development cost separate from AcademyOS runtime Supabase/Redis/hosting/email costs; delegation can itself issue more application/provider requests and does not waive their budgets.

For eligible batches, record model/effort, active count, exact scope, wall time, changed paths, validation result, repair cycles and available token or credit usage. Judge the work against its acceptance cases. Keep the same assignment with one owner and record missing usage as **not measured**.

Do not add paid telemetry, API credentials, automatic billing polling or service upgrades for this policy. Recheck official rates when making a new pricing claim or revising the model strategy; do not repeatedly browse/reload pricing for every unchanged task.

## Per-batch record and continuing use

Add a proportional AI-execution note to the existing EX implementation/handoff receipt; no separate stage or acceptance gate is created:

```text
Coordinator model if known:
Worker(s), exact configured model/effort, scope and active peak (or none):
Why delegation/serial/script execution was chosen:
Write/resource ownership and validation:
Exact CI run/attempt and preview source evidence when applicable:
Time, repairs and available usage (actual / modeled / unavailable):
Cost/quality conclusion and limits; next routing adjustment if justified:
```

The [master plan](../06-delivery/app-implementation-plan.md), [execution guide](../06-delivery/experience-execution.md), [cost plan](../06-delivery/cost-capacity-and-operations.md) and [generated continuation](../06-delivery/continue-academyos.md) carry this policy forward. Preserve EX-07 and EX-12 priorities, dedicated roles, accepted Operations design, local-data direction and existing authorization boundaries. This is not a reason to pause implementation for a model benchmark.

Initial [documentation checkpoint](../07-handoff/ai-delegation-policy-2026-11-04.md): no worker was needed for writing governance and running deterministic documentation checks. No measured delegation savings, runtime concurrency enforcement, model-setting change or application release is claimed.
