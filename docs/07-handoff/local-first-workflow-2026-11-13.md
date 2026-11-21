# Live local delivery and compact verification checkpoint

13 November 2026 · EX-07 / MP-B01, supporting EX-15 / PW-06 · VAL-01/09. Owner authorization: implement the agreed local-first development and quality workflow ("do it"). The current [EX tracker](../06-delivery/experience-execution.csv) and [corrective checkpoint](mp-b01-corrective-resume-2026-11-13.md) retain priority. This is workflow/tooling delivery, not a new product feature or full redesign acceptance.

**Later same-day setup:** the Owner then requested all implemented functions available locally, including offline, and Git work from this workspace. The [later functional-environment receipt](local-functional-environment-2026-11-13.md) supersedes this packet's initial missing-wrapping-keys status and old tooling hashes. Those initial observations/tests remain historical; actual connected/offline/device proof stays separately qualified.

## Useful result and scope

The Owner can view saved edits in the actual local frontend at **http://localhost:3000/en** (Arabic `/ar`). `npm run dev` selects the pinned existing toolchain and uses a loopback listener. A separate `npm run local:production` performs the owning build and starts the accepted **http://localhost:3100/en** origin for production-mode work (the numeric loopback alias is not the supported browser address). The [operating manual](../06-delivery/local-development-and-verification.md) supplies commands, backend boundaries and risk-appropriate checks.

`scripts/local/workflow.mjs` provides preflight, live dev, production build/start, bounded verification profiles and compact reports. The new tooling units are registered in CI alongside the existing device lifecycle suite. It invokes existing real route/component fixtures with a minimal environment that excludes live credentials and inherited baseline switches. Per-run receipts bind source/config and dependency-lock metadata, runtime, controlled fixture settings, actual exit/result and retained artifact hashes. Missing, altered, failed, running or source-unstable evidence is not reused; valid reuse preserves its original completion time. Live-server smoke is always fresh. This is not a hash of installed dependency contents or a signed release attestation.

The public smoke uses a fresh anonymous browser, actual EN/AR localized workspace and final local URL, phone overflow and page-error assertions, and protected-route redirect/refusal. It saves screenshots and trace; video is retained on failure. Navigation/device/Experience suites retain their own narrower artifact capabilities. The runner prints concise verdicts and private artifact locations, rather than sending all evidence to the model.

No domain component, schema, writer, worker, permission, business rule or new offline command was changed in this task. Pre-existing OpenCode/Codex product edits remain. Next's generated type declaration/build outputs may change when development/build runs; those are not a new functional implementation. No dependency installation, global OpenCode/provider/compaction change, remote CI submission, commit, push or promotion was performed.

## Actual local settings and security boundary

The ignored `apps/web/.env.local` now contains the existing synthetic staging browser/server settings. The Owner supplied the Clerk secret and Redis token without putting them in chat. The coordinator securely recovered the existing private onboarding signing value into that ignored file, preserving other settings and mode `0600`. No secret was displayed, rotated or written to the hosted database. `ONBOARDING_PROOF_KEY` must match the signed gateway's private database value; it is not a user credential or a browser key.

Presence checks report configured core settings, not a verified account or database transaction. The anonymous browser successfully traverses the real Clerk development handshake and the protected entry redirects; no actual user signs in during this smoke. Local UI uses shared synthetic staging services when configured, so later connected writes still need fixture scope and original-operation safeguards. Offline register/workspace wrapping keys remain absent and pilots closed in this local environment. No local private offline parity, data access grant, stronger security review or fresh hosted proof is claimed.

Private logs redact known secret/token/key/DSN/connection-string values; fixtures receive a minimal OS/runtime allowlist. Raw connected traces can still contain cookies or URL data outside those values, so they remain ignored/private and are not copied into the public evidence package. `git check-ignore` confirms the local settings and workflow log are ignored. Neither log redaction nor that check is a complete secret/security audit.

## Corrective evidence refinements

- **Real routed return:** the Node 24 actual Next fixture exercises Today → Program → Back to Today in EN/AR for unfinished and completed tasks. Each complete entry/return pair uses `['read','owner_home']`, zero writes and zero documents. The broken checked-marker negative control is detected. Zero **target-task** prefetch is accurate; **all-router** prefetch is separately 21 unfinished / 22 completed per locale, mostly shell destinations. The earlier broad zero assertion failed and its receipt/log remain in [the routed evidence directory](evidence/mp-b01-routed-return/receipt.json). No app-shell prefetch was disabled to manufacture a pass. Actual query/Redis/hosting cost of those preparations remains unmeasured.
- **Original keyboard control:** the existing Experience component suite retains pointer plus focus/Enter on the original registers-needing-marks summary and its zero-read budget. Its component fixture is not relabelled as the real Program router.
- **Storage lifecycle:** real hook and storage utility with fictional slot/account/sync and controlled StorageManager cover Ready before the late reply, refusal, rejection, unsupported APIs, denied sync, account and explicit academy remount. The old-awaited-ordering negative control is detected. The product wrappers' subject/academy remount strategy is reflected in the fixture. Unmount records no captured page errors after the reply; callback attempts are not observed. No reachable same-mounted scope defect, actual OS quota, eviction or installed-container correctness is inferred. [Lifecycle receipt](evidence/mp-b01-device-lifecycle/receipt.json).

The historical 112-unit/type/lint/program-React and complete factual-capture results remain attributed to their earlier checkpoint; they are not fabricated fresh results of this task. New focused executions and exact current fingerprints are in the [curated workflow receipt](evidence/local-first-workflow/receipt.json). Repeated runtime checks during this implementation followed changed launcher/test inputs or an actual failure; no new full 112-unit or all-journey capture rerun was needed for documentation alone.

## Internal failures and repairs retained

1. The first public smoke incorrectly targeted the global document language. Inspection found the real locale boundary at `.app-scene`; the test now asserts its language/direction and records the unchanged document-root English language separately. No product source was changed to satisfy a test. Broader accessibility remains unproven.
2. Configured local navigation timed out after the Clerk handshake: the numeric bind address disagreed with this Next/Clerk combination's internal `localhost` rewrite, causing self-proxy socket errors. Binding `localhost` fixed dev. Production also needed a child-only IPv4-first lookup so the accepted `127.0.0.1` browser origin reaches that loopback listener. Direct `localhost` binding without it produced connection refusal. No system DNS, SDK or allowed authentication origin was changed. The actual production wrapper and fresh smoke are checked after this repair.
3. Two concurrent launcher invocations exposed an unlink/symlink `EEXIST` race. Executable-path-keyed shim directories and idempotent same-target link creation remove the unlink gap; mismatched targets are refused. A disposable 16-concurrent-call test checks the actual helper and preserved target. The normal verification profile remains serial; this check does not authorize racing the same suite's receipt or shared browser/build resources.
4. The read-only helper found overbroad credential inheritance, unsafe reuse/redaction/process/capture reporting in the initial tooling. The coordinator repaired these boundaries, added targeted tests, and retained compact evidence. Final review found no material regression in the concurrent-link/redaction fixes; its lockfile-versus-installed-content wording correction was adopted. Source review is not runtime or independent human security proof.

Initial failed smoke traces, video, logs and intermediate runs remain in ignored `test-results/local-workflow/`; failures are not relabelled as success. This document reports causes supported by the scoped before/after observations, not a new whole-app refresh diagnosis.

## Execution, verification and continuation

One coordinator integrated the task and owned credentials, live servers, shared documents and generation. One explicitly configured `gpt-6.1-terra` helper at medium effort handled bounded harness refinement and read-only review; no nested or second concurrent helper was used. Independent provider/model runtime telemetry and token/credit totals were not exposed, so no stronger executed-model or measured savings claim is made. This is the agreed economical routing method, not proof of a general quality comparison between models or AI clients.

Final local results, toolchain, exact input hashes and original timestamps are recorded in [the curated receipt](evidence/local-first-workflow/receipt.json). The tracker updates only EX-07/EX-15 action/evidence text and PW-06 supporting status; lane/order/current/batch/dependency routing and other EX rows remain. The generator, agent/builder/OpenCode guidance, execution guide, charter and delivery/AI policy link the same manual. The factual HTML freshness check is reused for unchanged product/capture inputs; it does not establish a complete current design review. Master/continuation validators are structural checks, not future-agent compliance guarantees.

**Next permitted product work:** accepted Calendar/Players Operations composition and density in MP-B01, starting from equivalent reference/data/locale/viewport states and a finite difference ledger. Use visible local editing and the actual affected journey, preserve current data/authority/dirty/unknown behavior, and prepare one coherent candidate when useful. New rich Player field/edit/archive/import decisions remain MP-Q01 dependent. Closed corrective cases stay closed unless their relevant inputs change. Do not restart EX-11. Existing signed-in hosted EN/AR publication review, installed/device work and Owner acceptance remain open; a later combined candidate needs its own CI and Owner promotion.

Reusable instruction remains **Continue from the living continuation prompt.** No new promotion is requested by this checkpoint.

### Final executed checks

| Check | Observed result and scope |
|---|---|
| `npm run local:verify -- --suite=all-local` | Passed: navigation 21,936ms, device 2,522ms, Experience/keyboard 4,785ms, development public smoke 2,200ms. These are individual local run durations, not production percentiles. |
| Identical `--suite=corrective` after unchanged inputs | Navigation/device reused with original completion times `2026-11-13T14:18:49.110Z` / `14:18:51.658Z`; neither fixture ran again. |
| Actual production launcher and fresh production public smoke | Owning build/start passed; EN/AR/phone/anonymous redirect passed in 2,968ms at the accepted numeric origin. Root compiled-source/asset guard passed separately. |
| Final development launcher restart and fresh smoke | Passed in 2,574ms; live local frontend remains running. No signed-in user/data proof. |
| Tooling units | 7 passed on Node v24.14.0; includes 16 concurrent same-target link calls, mismatched-target refusal, credential boundary and artifact corruption/deletion cases. |
| Execution validator | Passed with current EX-07, master artifacts, PW joins and all 20 continuation tests; emitted instructions and structural integrity only. |
| Implementation validator | Passed: existing 68 screens, 30 stable action groups and 180 requirements retained. |
| Factual HTML freshness | Passed without recapturing unchanged product/capture inputs. Earlier rendered evidence retains its original scope. |
| Private files, links and source | Local settings/log ignored; 15 affected instruction/manual/receipt documents have no missing local file links; all 15 recorded input hashes are current and five affected pre-existing product hashes are unchanged. |
| Git diff | Final whitespace check passed; no new commit, push, remote CI or promotion. |

The two local listeners remain on loopback only. Raw local runtime artifacts are ignored/private; the linked curated receipt contains no credentials, cookies, full private logs or connected traces. The retained historical 112-unit/full-capture results and old 53-step remote CI are not reported as newly executed here.
