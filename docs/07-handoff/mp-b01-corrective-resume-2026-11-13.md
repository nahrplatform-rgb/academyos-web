# MP-B01 corrective resume and evidence checkpoint

13 November 2026 · EX-07 / MP-B01, with supporting EX-15 · VAL-01/09 · existing program/navigation and personal-device contracts retained.

**Status: corrective batch locally closed 13 November.** This packet corrected unsupported completion claims and executed the remaining scoped cases in the next continuation. The [EX tracker](../06-delivery/experience-execution.csv) owns the sole current priority. The behavioral matrix below carries the local closures with exact scope limits; hosted/installed/Owner gates remain open. The implementation instructions below are retained as the record of what was executed.

**Latest checkpoint:** the Owner then authorized the [local development/compact verification workflow](../06-delivery/local-development-and-verification.md). Its [executed receipt](local-first-workflow-2026-11-13.md) records the running dev/production frontends, guarded evidence reuse, pinned-toolchain reruns and current source hashes. Explicit academy-remount coverage is added; unmount means no captured page error, not no callback attempt. Zero **target-task** prefetch remains distinct from 21/22 **all-router** prefetches. The required local corrective cases are closed; historical missing-proof instructions below are not the next queue. The tracker retains EX-07/MP-B01 and next permitted Operations work.

## Resume instruction and boundaries

Read `AGENTS.md`, the [generated continuation](../06-delivery/continue-academyos.md), the current EX-07 row and this packet. Reconcile the actual branch, HEAD, staged/unstaged/untracked files and source against the fingerprints below. Preserve existing edits. A compacted summary saying "complete", "integration tests" or "named gap, not a blocker" does not satisfy or waive the required cases here. Apply the [continuation and claim-evidence contract](../06-delivery/master-plan-v2/delivery-and-verification.md#continuation-after-compaction-or-interruption).

Finish the same corrective batch before advancing unrelated development. Preserve the accepted program marker, permissions, tenant scope, dirty input, atomicity, keys, pending originals and unknown-operation recovery. Do not add new business rules, migrations, accounts, offline engines or provider dependencies. Use existing React/browser infrastructure and permitted fictional adapters. Do not rewrite working product behavior merely to simplify its tests.

Keep EX-07 current. Retain scoped EX-11/EX-12/EX-13 passed routing checkpoints and their remaining acceptance/device limits. After this correction passes, continue the next ready MP-B01 task under the existing sequence, including applicable EX-15 support and decision-gated MP-Q01; do not automatically restart EX-11. Ordinary authorized Git work follows existing instructions. The Owner alone promotes deployments or changes live aliases; an old summary supplies no new blanket Git approval gate.

## Original inspection and later acceptance disposition

The inspection establishes the implementation and test scope listed here. It does not execute missing cases or certify all behavior from aggregate pass counts. Existing local/CI/hosted results remain bounded to their original source and assertions.

| Existing finding / required case | Evidence at the original inspection | Proof required by that inspection | Later disposition |
|---|---|---|---|
| Finding 2: unfinished/completed program return in EN/AR | `scripts/programs/test_ui.mjs` checks the real Program component's return labels/hrefs, including Arabic and a saved program, but does not activate Back to Today. `scripts/experience-projections/test_ui.mjs` bundles only the Experience component at every path. Its Program URL and focus assertions do not exercise Program-to-Today routing. | Use the appropriate existing real Next/navigation harness: Today task → actual intended Program → actual Back to Today → checked Today task when unfinished, or attention heading after completion removes the task. Exercise both locales, applicable focus/context and measured request budget; navigation creates no replacement operation. A meaningful isolated negative control must detect a broken return. | **Closed locally 13 November**: `scripts/navigation/test_next.mjs` routed legs pass EN/AR for unfinished (task refocused) and completed (task removed, attention-heading focus) returns, each with exactly `['read','owner_home']`, no write action, no document load; a disposable bundle variant that breaks the checked-task lookup fails the focused-task assertion and still lands the attention heading. Scope: local Next production router with fictional fixtures; no hosted/Owner proof. |
| Finding 3: original register-summary keyboard control | The original `Operations summary` link for registers needing marks still uses `.click()`. Added Enter activation targets the unfinished-program link instead. | Restore focus + Enter and attention-heading focus on the original summary link, retain its request-budget assertion and appropriate pointer coverage. Test the original changed behavior rather than substituting another control. | **Closed locally 13 November**: `scripts/experience-projections/test_ui.mjs` now covers pointer click and focus+Enter on the original register-summary link, both asserting the focused attention heading, with the existing zero-read budget assertion retained. Production and development modes pass. |
| Finding 4: advisory storage versus operational status | `approve` now starts persistence without awaiting it before setting Preparing. This source change removes the identified storage wait from that ordering. The three new tests call the storage utility only and never mount the hook, invoke the real approval callback or assert operational phase. | Mount a real hook/component using controlled external promises. Exercise persistence pending while sync proceeds, sync reaching Ready before the late response, refusal/rejection/unsupported APIs, Denied, account/academy change and unmount. Assert actual state and stale-result fencing. Prove the relevant regression test detects the old awaited placement in an isolated variant; if the hypothesized race does not reproduce, narrow the claim honestly. | **Closed locally 13 November**: `scripts/working-day/test_device_lifecycle.mjs` (registered in CI) mounts the real hook with the real storage utility, fictional slot/account/sync doubles and a controllable `navigator.storage`. Ready is reached while persistence is pending; the late granted reply updates advisory storage and keeps Ready; refusal, rejection, unsupported APIs, denied sync, account and academy remount assert stale-reply fencing; unmount records no captured page errors, with callback attempts unobserved; the disposable old awaited-ordering variant reproduces the Ready→Preparing overwrite, proving the regression is detected. Scope: no OS quota, eviction or installed-container proof. |
| Evidence consistency | Earlier receipt text calls utility cases "integration" and the generated action says all corrections are complete. Documents matching one another cannot supply the missing assertions. | Update the existing receipts, this matrix and EX-07/EX-15 only after actual results. State the real boundary and limits per case. Regenerate continuation; retain separate deployed/hosted/installed/Owner gates. | Reconciled 13 November after the executed batch below; behavioral rows above now carry their local closures with scope limits |

### Historical implementation instructions — executed by the later closures

1. Extend the real routed harness, not the Experience-only fixture, for the complete return cases. Keep useful component/href cases and label their narrower scope.
2. Restore the original summary-control keyboard case alongside the existing request assertion. Fix a genuine failure instead of weakening that assertion.
3. Extend the existing component/browser infrastructure to call `useOwnerWorkspaceDevice` through its actual approval/sync lifecycle. Mock external storage/transport dependencies as needed, not the operational state being proved. A comment that a phase "would run here" is not an assertion. An unavailable dedicated test file does not retire this required work.
4. Keep utility tests useful but classify them as utility tests. Add lifecycle guards only where source/reproduction requires them. Never assume a detached promise alone establishes account-change or unmount correctness.
5. Exercise a suitable negative control in a disposable fixture/build without damaging current edits. If old behavior still passes, improve the test or correct the defect claim before declaring the regression demonstrated.
6. Use focused checks during editing and one consolidated relevant checkpoint, preserving required CI/freshness checks. Build the current compiled source before any consuming fixture. Do not refresh hashes or hand-edit receipt cases to manufacture runtime proof.

## Source and checkout snapshot

At inspection, branch `codex/onboarding-decision-design-packet`, HEAD `780225b51360a63153f6fc09d47431cd5b654047`, tracking the existing remote `aedb3ad` snapshot and one local documentation commit ahead. Product, test, design-capture and documentation changes are already uncommitted. Recheck the actual tree before work; these are hashes of inspected source, not an attestation of tested release source.

| Inspected file | SHA-256 |
|---|---|
| `apps/web/src/components/owner-workspace-device.tsx` | `3125612c3f82c99a55d9fa25af226cb3d3971c657dc63ab219f69cad943335c6` |
| `apps/web/src/lib/workspace-storage.ts` | `1301d838d02432b21dc0ac958e818a1156376b8ac28874e507a1e3135797b7e7` |
| `apps/web/src/lib/workspace-storage.test.ts` | `2741ad43a167f1c4fbffb8506d297349ee0d766e57e2a6b4379d5a1685ebddf0` |
| `scripts/programs/test_ui.mjs` | `a72af6ecdacce5d08e5c36bb767330dc3019bfb8306ee5272bb75af474156c34` |
| `scripts/experience-projections/test_ui.mjs` | `1a50d489a56b61f8b8daef98d1713a4b4dbb01cff00e5d984551dc148691d245` |
| `scripts/navigation/test_next.mjs` | `41ff28f762f6b35ee86f73ca55bb91e53a53cdc8f4b9fd09767b60574e2f9799` |

The [program receipt](mp-b01-owner-program-return-2026-11-13.md) retains the earlier reported runs and their corrected scope. The [EX-15 receipt](ex15-storage-diagnostics-2026-11-13.md) retains storage utility/source evidence. EX-14 identity work remains implemented locally with its existing [separate receipt](ex14-install-identity-2026-11-13.md); manifest installation metadata is not installed/offline proof. No new application tests are claimed by this documentation repair.

## Model, context and service limitations

One coordinator owns integration and shared artifacts. Use one bounded economical helper for independent test/harness work only when exact model-specific execution is actually available. Give it owned files and no nested delegation; avoid simultaneous edits to the same files. Record the executed model or the limitation that kept work serial. A catalog entry is not proof that Terra executed. Current provider/spending and protected-account restrictions remain; no automatic paid fallback or global configuration changes.

The Owner-supplied compacted summary repeats earlier unsupported completions. The screenshot shows a configured 200k window and a summary request of about 99.9k input/2k output; it does not prove compaction always occurs at exactly 200k. Compaction can discard detail and preserve earlier errors. Use this acceptance matrix and current source when resuming rather than accepting the summary as a decision.

Read-only log inspection found `AI.Error: The service was unable to process your request` for session `ses_e2d5de031ffepXPyXoo6b2QKST` at **08:18:49 Cairo, 13 November**. That record exposes no HTTP status/request ID or confirmed context-overflow cause. The earlier **07:51:03** usage-limit error and DNS/TLS/timeout records are separate observations. Resolve a specific service failure using sanitized available metadata and bounded diagnostics; do not claim an exact cause or continuously resend the full request. Verify the installed version/effective settings before any proposed environment adjustment. This work does not change them.

## Checkpoint maintenance and next action

**Next permitted product action:** continue accepted Calendar/Players Operations composition and density within MP-B01, starting with equivalent reference/working states and a finite difference ledger. Use the live local workflow, preserve existing data/authority/dirty/unknown behavior, and verify the affected actual journey before one coherent candidate. New rich Player fields/edit/archive/import remain MP-Q01 dependent. Do not restart EX-11 or repeat already-passed corrective suites without changed inputs or an unresolved risk. Hosted EN/AR publication review, installed/device proof and Owner acceptance stay separately open.

## Earlier reported corrective execution — 13 November (OpenCode, reported opencode/glm-5.3-flash-free)

One coordinator executed all three cases serially; no helper was used, so no model-specific helper identity is recorded. All changes are test-harness and CI files only — no application source changed (`apps/web/src/components/owner-workspace-device.tsx`, `apps/web/src/lib/workspace-storage.ts` and their tests kept the fingerprints from the table above).

Executed commands and results:

- `node scripts/experience-projections/test_ui.mjs` and `UI_REACT_MODE=development node scripts/experience-projections/test_ui.mjs` — passed. Finding 3: the original register-summary link now gets pointer click plus focus+Enter, both asserting the focused `Needs your attention` heading; the zero-read budget assertion is retained.
- `EX02_READ_OWNER_MEASURE=1 node scripts/navigation/test_next.mjs` — earlier passed local routed returns with `['read','owner_home']` per entry/return pair, no writes or document load and a detected broken-marker negative control. The earlier global zero-prefetch claim is corrected by the later measurement: target-task prefetch is zero, but all-router prefetch is 21 unfinished / 22 completed per locale. Preserve [the broad-zero failed control and later receipt](evidence/mp-b01-routed-return/receipt.json); no app shell prefetch was disabled. Its database/provider cost is not measured.
- `node scripts/working-day/test_device_lifecycle.mjs` — passed (new; registered in `.github/workflows/verify.yml`). Finding 4: real hook + real storage utility with fictional slot/account/sync doubles and a controllable `navigator.storage`. Ready is reached while persistence is pending; the late granted reply updates advisory storage and keeps Ready; rejection → `unavailable`, refusal → `not-granted`, unsupported APIs → `unsupported`, denied sync → `denied` phase, account change and unmount fence the stale reply with no runtime errors; the disposable old awaited-ordering variant (`globalThis.__oldAwaitPersistence`) reproduces the Ready→Preparing overwrite.
- `node scripts/programs/test_ui.mjs` and development mode — passed (component/href cases retain their narrower scope, relabelled in the receipt).
- `npm test` — 112 passed; `npm run typecheck`, `npm run lint` — passed.

Historical source fingerprints from that earlier report (superseded test/tooling hashes are in the latest workflow receipt):

| File | SHA-256 |
|---|---|
| `scripts/navigation/test_next.mjs` | `ef4bb6932b436f19a15450354ebd0687180a1161e4af4c636a596b06d5c12a29` |
| `scripts/experience-projections/test_ui.mjs` | `fcd168614bab423c66a7b2c434405941f7c55e8557b6af4ad47798f126232283` |
| `scripts/working-day/test_device_lifecycle.mjs` | `2480a4256eaeb8f3f8983a13d768822c6d9b2a40c8a252b40a5683c17e381cdc` |
| `.github/workflows/verify.yml` | `41c7c88ba27f659380a1b7dfe7f1987062c3911ff2930a9cc61c2cf3ebcd6c2e` |

Limits: all results are local Chromium/Next production evidence over fictional identity/read-only fixtures. No hosted, installed-device, OS-quota, eviction, deployed-source or Owner-acceptance proof was produced. The routed return's request budget is the measured local budget, not a hosted allowance. No commit, push, deployment or promotion was performed by this batch.

Update this matrix with exact commands, tested source fingerprints, actual results, negative controls and limits. Update the existing program/EX-15 receipts, EX-07/EX-15 tracker fields, affected owning artifacts and generated continuation together. Preserve original historical results while correcting their interpretation. Keep application implementation, local tests, CI, release, hosted/installed proof and acceptance separate. Finish with a compact per-case report and the next permitted tracker action, rather than an aggregate "everything passes" statement.

## Historical documentation-only recovery verification — before local closures

The Owner authorized this documentation/tooling repair with "start". It updates the standing instructions, current brief/receipts, EX-07/EX-15 and PW-06 evidence, and owning continuation generator. It does not implement the open product cases above.

- Two added generator regression tests first failed against the previous implementation: the active resume link was absent and four invalid checkpoint forms were accepted. A captured test-process exit of `1` recorded five failing assertions. After adding repository-relative existing-file validation and the dynamic resume link, `python3 scripts/design/test_continuation_prompt.py` passed all **19 tests**. These tests establish emitted-pointer behavior, invalid-reference rejection and preserved routing; they do not prove real app behavior or future agent compliance.
- `python3 scripts/design/build_continuation_prompt.py` regenerated the prompt from the corrected tracker. Its `--check` passed.
- `python3 scripts/design/validate_experience_execution.py` passed, including the continuation tests, current master metadata and PWA joins. `validate_master_plan.py` and `validate_implementation_register.py` also passed. Their field/join/freshness results retain structural scope. Current master artifacts needed no regeneration.
- The initial `git diff --check` exposed existing CRLF tracker line endings as trailing whitespace. They were normalized to LF after asserting every CSV cell remained identical through that formatting change. The final diff check passed. Only EX-07/EX-15 status cells and PW-06 evidence cells differ from the initial parsed tables; routing fields and all other rows are preserved.
- A before/after SHA-256 comparison of **3,494** existing tracked/untracked repository files found changes only in the **15** permitted documentation/tooling files. Existing application, schema, runtime tests, factual HTML/captures and other work were unchanged. HEAD and staged index were unchanged. Local file/heading-link checks found no newly broken links in the changed documents.
- One read-only helper was explicitly requested with configured model `gpt-6.1-terra`, medium effort, non-overlapping scope and no nested delegation. It reviewed the contract/generator and then the final tracker/PWA/continuation alignment. It suggested qualifying the historical outcome as source intent; that correction was applied. Final review found no material inconsistency. The helper interface did not expose independent runtime provider/model telemetry, so no stronger identity or cost-saving claim is made.

That earlier documentation-only recovery ran no product/browser suites or hosted/installed cases and made no CI submission, commit, push, promotion, credential or global provider/compaction change. **At that time** the behavioral matrix remained open. The later actual executions and latest workflow receipt supersede that open-next-action statement; they do not convert it into a past runtime pass.
