# AI delegation, concurrency and delivery cost

Owner-directed project policy, recorded 4 November and updated for the final OpenCode handover on 13 November 2026. Apply it to each AcademyOS batch. The execution tracker and existing contracts govern scope, decisions and release authority. The [OpenCode routing section](#opencode-routing-and-provider-authority--13-november-2026) supersedes earlier client-specific model assignments for OpenCode. Existing coordination, ownership and verification rules carry forward.

The zero/one default and ceiling of two below are the conservative engineering interpretation of “not too many,” not a measured optimum or a numeric limit quoted from the Owner.

## Operating rule

**Keep one accountable coordinator, use scripts for deterministic work and route suitable bounded work through available economical agents.** The earlier Codex configuration used GPT-6.1 Sol as coordinator and explicitly configured GPT-6.1 Terra helpers. OpenCode uses the later Owner-directed routing below. A client or model choice leaves the project's scope and evidence requirements in force.

1. **Route.** Select the current batch from the execution tracker. Use a script for known commands, CI waiting, routine metadata checks and generation. The coordinator owns decisions, architecture, authority, synchronization, recovery, integration and release readiness, with technical escalation through the current-client authority hierarchy when needed.
2. **Assign.** If the task meets the scope and cost test below and the client can assign it, give one explicitly configured economical worker a fresh brief with exact ownership, acceptance cases, evidence and a stop condition. A second helper requires a documented independent scope and benefit. Keep a single coordinator. With no helper mechanism, continue serially.
3. **Verify.** Apply the same acceptance criteria regardless of model. The coordinator checks the diff and the evidence for the changed behavior and runs the affected integration checks. Run consolidated validation at the coherent checkpoint. Revisit a specific result when the evidence is incomplete, the source has changed or a regression needs investigation.
4. **Record.** Put the model, scope, result and verification in the existing batch receipt. Keep development, release evidence and Owner acceptance separate. Link the receipt from the tracker and regenerate the continuation at the checkpoint.

Choose by expected cost of a correctly completed result, including context, coordination, validation and repairs. A lower token rate does not establish a lower whole-task cost. Do not force every task into a delegation workflow or invent a target percentage of work that must use Terra. These are initial routing choices, not a benchmark proving a capability hierarchy between the models.

The Owner's instruction authorizes suitable bounded delegation during ordinary continuation. The coordinator may work directly when a task is small, serial, deterministic, sensitive or cheaper to complete without a handoff. Follow the charter, applicable tool limits and the current batch. [Agent instructions](../../AGENTS.md) · [Execution tracker](../06-delivery/experience-execution.csv)

### Historical DeepSeek trial — 7–8 November 2026

The external trial produced a registration regression and focused audit reports. Keep their exact scopes, returned evidence and coordinator corrections in the child-work register. The later Codex Sol/Terra and OpenCode routing govern their respective clients' new assignments. [AI work items](../06-delivery/ai-work-items.csv) · [DS-001 review](../07-handoff/deepseek-bcb1a78-review-2026-11-07.md) · [DS-004 corrected dispositions](../07-handoff/deepseek-DS-004-review-2026-11-08.md)

DeepSeek stopped DS-005 after writing a partial helper. Terra completed the two owned outputs, and the coordinator integrated the observer and runner and verified the online empty-directory scenario. The record retains separate external, native, integrated and hosted evidence. [Interruption receipt](../07-handoff/deepseek-DS-005-interruption-2026-11-08.md) · [DS-005 review](../07-handoff/deepseek-DS-005-review-2026-11-08.md)

## Models and bounded concurrency

| Item | Project instruction |
|---|---|
| Coordinator | One running main agent retains accountability. Apply the current client's Owner-directed routing. The earlier Codex coordinator choice was `gpt-6.1-sol`; OpenCode's technical hierarchy is below. |
| Delegated worker | Explicitly configure the selected economical model for eligible work. The earlier Codex worker choice was `gpt-6.1-terra`. Verify model identity and availability. If unavailable, continue with a suitable existing coordinator and record the limit. Paid access requires its actual authority. |
| Normal active helpers | Zero for small/serial/mechanical work or unavailable helper tools; one explicitly assigned economical helper for a worthwhile bounded task. |
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
| Focused source inventory, reference comparison, exact-path documentation updates following settled decisions, copy/terminology consistency | Economical worker candidate | Give the exact question/pattern, authoritative references and file set. No new policy interpretation, grant or acceptance claim. |
| Applying an approved component pattern to a bounded independent surface; targeted test investigation | Economical worker candidate | Real contracts/acceptance cases must already be clear. Preserve assertions, operation semantics and domain boundaries; no speculative abstraction or unrelated rewrite. |
| Visual comparison or fixture-based UI checks | Economical worker candidate when tools/resources can be isolated | Match reference/data/role/locale/theme/viewport. Do not compete for the real browser or infer backend/security proof from screenshots. |
| Architecture, ambiguous requirements, role/tenant authority, crypto/key recovery, offline synchronization/concurrency and consequential transaction changes | Coordinator with suitable technical escalation | A worker may collect a narrow read-only fact. The lead owns the reasoning, decision and integration. A worker grants no product authority. |
| Cross-module integration, final diff/receipt assessment and combined validation | Coordinator | Inspect the returned evidence and critical changes; do not merely repeat the worker's success claim or redo all its work without cause. |
| Hosted account/provider mutation, migrations, custody/flags and authorized destructive operations | Coordinator under existing authority | No helper may improvise grants, delete data, send messages or alter providers. Preparing a plan is not permission to execute it. |
| Git staging/commit/push and generated canonical/factual artifacts | Coordinator by default | Keep one owner of shared outputs and the final coherent batch. Helpers report changed files; they do not independently publish work. |
| Deployment promotion | Owner only | Neither coordinator nor worker promotes, reassigns the live alias or operates the passkey/promotion flow. |

This routing does not prohibit Terra from being capable of demanding work. It controls risk and coordination while AcademyOS collects real delivery evidence. Revisit routing using observed quality/cost, without changing accepted product rules or silently substituting models.

## CI and deployment evidence

Use the [local delivery/evidence workflow](../06-delivery/local-development-and-verification.md) before a release checkpoint. Deterministic scripts collect verdicts, timings and artifacts; the coordinator reads compact results and investigates failures/selected visuals. A suitable bounded helper can execute or review settled work under the existing cap. The coordinator owns actual integration and claim-to-assertion review, including internal repair, rather than asking the Owner to relay successive correction prompts. Runtime evidence reuse requires applicable unchanged inputs and intact artifacts with the original timestamp. No measured token/cost saving is inferred from fewer screenshots or a nominal model price.

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

Use a fresh, concise brief with the tools available in that session. Explicitly configure the selected worker model under the current-client routing policy; the earlier Codex worker was Terra. Start with task-specific context where supported. Required repository/charter and relevant accepted contracts still apply; context reduction never authorizes skipping applicable instructions.

```text
Batch / EX / journey-action / requirement IDs:
Exact outcome and acceptance cases:
Model: exact configured identifier; effort and reason:
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

After a helper result, model switch, compaction or interruption, apply the [continuation/evidence contract](../06-delivery/master-plan-v2/delivery-and-verification.md#continuation-after-compaction-or-interruption). Preserve the active acceptance criteria and reconcile the compact checkpoint with the real source. A helper's summary or a model label establishes no missing lifecycle/journey proof. Record actual invocations and their ownership; use one useful bounded helper when available, or state why execution stayed serial. Reuse unchanged passing evidence with its input fingerprints, and repeat checks only for changed inputs, failure or a named unresolved concern. The need to write a final answer does not itself require another broad run. Generic provider errors require sanitized diagnosis and bounded recovery, not automatic paid fallback or a fabricated context/quota explanation.

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

## Continuing in OpenCode — 12 November 2026

The Owner requested a move to OpenCode and a portable continuation handoff. The current tracker, accepted contracts and exact receipts remain the delivery authority. The Codex chat link supplies historical context. The handoff and generated continuation give the receiving client an actionable entry point. [Portable handoff](../07-handoff/opencode-project-handoff-2026-11-12.md)

Keep one coordinator for the active checkout and apply the existing helper cap and ownership rules. Verify the receiving client's actual model and tool availability. Record those facts in the affected batch receipt. Tools and authentication configured in Codex require their own availability check in the receiving client. An unavailable connector permits work that does not depend on it, using the existing authorization and evidence standards. The client change supplies no additional account, schema, production or promotion authority.

## OpenCode routing and provider authority — 13 November 2026

The Owner supplied the environment details below in the final handover request. This records the intended configuration and limitations. This Codex documentation task did not inspect OpenCode's runtime, provider accounts, model inventory, imported conversations or global configuration.

| Owner-reported capability | AcademyOS operating rule |
|---|---|
| Auto model-routing agent | Classifies work and selects a configured permitted model. Resolve the actual tracker task before accepting its complexity classification. The active coordinator retains task and evidence accountability. |
| Economy, Balanced and Authority agents | The Owner reports Economy as `opencode/glm-5.3-flash-free`, Balanced as `signor-cheap/glm-5.3-flash` and Authority as `signor-cheap/claude-sonnet-5-5`. Balanced and Authority use paid routes. Model/task suitability and spend authorization both apply. |
| OpenCode free models and authorized ChatGPT development accounts | Use only available authorized routes suitable for the task. Verify actual model identity and limits when the client exposes them. Preserve private credentials in their existing configuration. |
| Signor CHEAP provider | Use within existing route authorization. Pay-as-you-go Signor routes stay blocked until explicitly authorized by the Owner. A cheap label grants no spend authority. |
| RepoPrompt Classic MCP | Supports repository discovery and bounded context analysis. The coordinator verifies useful findings against current source and owns integration. |
| Previously migrated Codex conversations | Supply optional historical context. The root instructions, tracker, decisions and scoped evidence are sufficient to begin. Read a relevant historical thread only to resolve an actual gap. |
| Automatic helper spawning is not implemented | Model selection does not create a helper. Start helpers only through an actually available explicit mechanism with an owned brief, within the existing cap. Work serially when that mechanism is absent. |
| Manual authority escalation, account switching and some provider fallbacks | State the exact technical question or unavailable capability when intervention is needed. Continue independent ready work. A provider error does not authorize reconnecting another account or enabling a paid route. |

The Owner's preferred technical authority order is **Claude Sonnet 5.5 → GPT-6.1 Sol → verified GPT-6.1 Terra**. This is the Owner's project preference. Verify the configured model identity in the receiving client; the name of an Authority agent alone supplies no such proof. Business policy, spending, product acceptance and deployment authority remain with the Owner. Technical model review supplies engineering evidence.

Apply economical routing proportionately. Important architecture, security/tenant authority, irreversible or financial behavior, synchronization, conflicts and original-operation recovery need technically suitable review through that hierarchy where available. Routing introduces no blanket requirement for every routine change to wait for an unavailable model. The active coordinator can proceed with permitted work it can responsibly verify, record limitations and escalate only a concrete unresolved decision or dependent risk. Auto, RepoPrompt or a preferred model can be unavailable while file-based continuation still works.

The **personal emergency iCloud ChatGPT development account has been removed and must never be reconnected or used automatically**. This restriction concerns OpenCode's development-provider accounts. AcademyOS application identities and memberships continue under their existing staging-role and account contracts.

Keep one coordinator, zero or one helper by default, a maximum of two explicitly justified independent helpers and no nested spawning. Auto, Economy, Balanced, Authority and RepoPrompt are capabilities used within this ownership model. They create no competing execution queue. Record actual tools, models, manual escalations, checks and unverified environment details in the affected batch handoff. Global OpenCode configuration changes fall outside this documentation task.

### Continuation-aware selection and cost limits

The complete environment briefing supplied by the Owner on 13 November adds the following operating details. The associated reports reside under `~/Documents/Codex-Migration/`. Their test counts and reported live executions are attributed to that migration work. The AcademyOS documentation review does not replay paid requests or inspect authentication secrets.

- **Classify the actual batch.** Auto reportedly classifies the submitted prompt before necessarily reading project files. The short continuation phrase can therefore receive an initially simple classification. The coordinator must read the current tracker, dependencies, accepted contracts, Git state and required verification before implementation. If Auto cannot reconsider that context or its selected model is unsuitable, manually select an already authorized capable model for the same task. For the current synchronization/recovery-sensitive work, an available authorized OpenAI Sol route is a suitable secondary-authority choice under the Owner's hierarchy. These repository instructions do not modify the global classifier.
- **Check the executed route.** Auto's reported initial model is a paid Signor GLM route, but its plugin may select a permitted free model before execution. Report the actual selected provider/model. Manual `/balanced` and `/authority` selection must be checked against their paid routes too; Auto's `paidRoutesApproved=false` setting does not establish that separate manual-agent calls are gated. Model or agent selection supplies no new spending approval.
- **Keep estimates explicit.** The reported $1 daily threshold is a soft gate using local spending state. The monitor has no verified actual Signor wallet/billing endpoint or reliable shared live ledger. Estimates can omit failed requests/retries and separate cached-token costs. Record observed usage separately from modeled cost; never claim a hard cap, balance, remaining subscription allowance or guaranteed concurrency coverage from those figures.
- **Use supported recovery.** Automatic 429/503 detection and retry are reported unimplemented. Cooldowns, some fallbacks and account switching remain manual. A 503 can be an upstream failure. Preserve the configured credential and protected-account exclusion while diagnosing the reported route. Paid cross-provider execution stays gated, and an unperformed authority review stays open with its actual dependent scope.
- **Verify availability proportionately.** Global and receiving-client model counts differ and are dynamic. A catalog listing records configuration, while successful execution establishes scoped runtime availability. Simulated routing, quotas, failure and concurrency cases retain their simulation label. The reported successful free same-provider Auto completion does not establish live paid cross-provider fallback or automatic helper coordination.
- **Use relevant context tools.** Prefer native reads/searches for simple work and RepoPrompt Classic for useful bounded cross-file context. The reported Classic build supplies no Community Edition model-routing, usage-balancing or automatic-effort functionality. Keep a single MCP namespace and coordinator. Do not invoke `/rp-orchestrate`, upgrade RepoPrompt, change skill advertising or activate optional integrations during AcademyOS continuation without the applicable Owner authorization. Load only relevant skills; quieted skills can be invoked explicitly where available.

The protected emergency ChatGPT account also remains excluded from imports, quota-exhaustion fallbacks and helper use. Its future use requires explicit Owner authorization. Verify account identity only through an appropriate account-facing surface; never copy tokens to prove exclusion. The separate Codex emergency environment remains under the Owner's control.

The existing provider configuration, pricing files, backups, global router, credentials and integrations remain owned by their environment workflow. AcademyOS continuation uses their available authorized capabilities. Use Signor CHEAP as the sole selected Signor provider. Current Signor PDF price labels supply a dated estimate baseline, and provider identifiers remain separate from display labels. Media-only endpoints supply no implied AcademyOS chat route. [Environment and evidence references](../07-handoff/opencode-project-handoff-2026-11-12.md#environment-evidence-and-remaining-limits)
