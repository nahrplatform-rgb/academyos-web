# Owner unfinished-program return checkpoint

13 November 2026 · EX-07 / MP-B01 · VAL-01/09 · IMP-J01-A01 / IMP-J09-A01

**Latest review: corrective batch locally closed 13 November.** The [active resume packet](mp-b01-corrective-resume-2026-11-13.md) records the executed batch: the actual Today → Program → Back to Today journey, the original register-summary keyboard case and the device lifecycle proof now have real local evidence with detected negative controls. Signed-in hosted EN/AR publication review, installed-device evidence and Owner acceptance remain open.

## Outcome

The source carries a bounded `#program-return=<uuid>` marker from the Owner Today unfinished-program task into the exact program route. The Program component exposes **Back to Today** when the checked program matches that marker. The later corrective execution demonstrates the complete local routed journey and focus on the retained task or attention heading after completion. Earlier source/href/component evidence alone did not demonstrate it. The marker carries navigation context only and does not grant authority.

The existing Back to programs path, one-read program entry, bounded preparation receipts, dirty preview, current-access/version checks and saved/unknown original-operation recovery remain unchanged. Arabic and English use the existing localized return label.

## Changed source and checks

- `apps/web/src/lib/owner-session-navigation.ts` accepts the bounded `program` task kind and exposes the checked source ID.
- `apps/web/src/components/experience-workspace.tsx` adds the program marker to exact Today task links and the one-use return hint.
- `apps/web/src/components/program-workspace.tsx` renders the guarded checked return for the matching program and preserves existing navigation guards.
- `apps/web/src/lib/workspace-navigation.test.ts` covers valid and malformed program markers.
- `scripts/programs/test_ui.mjs` covers direct program entry with the return marker and exact Back to Today destination.
- The actual-component experience review capture pack/HTML was regenerated after the UI source change.

Observed local checks:

- `node scripts/programs/test_ui.mjs` — passed production React mode.
- `UI_REACT_MODE=development node scripts/programs/test_ui.mjs` — passed development React mode.
- `node scripts/navigation/test_next.mjs` — passed actual Next production navigation EN/AR, dirty guards, selection and Back/Forward.
- `npm test` — 105 tests passed.
- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm run build` — passed and recorded the compiled web source/asset receipt.
- `node scripts/verification/web-build.mjs --check` — passed.
- `node scripts/experience-review/test.mjs` and `node scripts/experience-review/build.mjs --check` — passed.
- `python3 scripts/design/validate_implementation_register.py`, `python3 scripts/design/validate_experience_execution.py` and `git diff --check` — passed.

The browser checks use the existing fictional identity/transport fixtures and local disposable environments. They are not hosted authentication, installed-device or Owner acceptance evidence.

## Historical completed-state component fixture and its limits

The `experience-projections` fixture supplies an unfinished program task with the same bounded marker and a simulated response that removes it. It bundles the actual Owner Today component at every requested path, including a Program URL. Its reported production/development passes cover that component's focus behavior under the adapter; they do not open the actual Program screen or activate Back to Today. The earlier statement that this proved the complete return was incorrect. The factual experience-review capture pack/HTML regeneration is historical artifact evidence, not the missing routed case.

- `node scripts/experience-projections/test_ui.mjs` — passed production React mode.
- `UI_REACT_MODE=development node scripts/experience-projections/test_ui.mjs` — passed development React mode.
- `node scripts/experience-review/collect.mjs`, `node scripts/experience-review/build.mjs`, `node scripts/experience-review/test.mjs` and `node scripts/experience-review/build.mjs --check` — passed.

## Corrective batch execution — 13 November 2026 (closed locally)

Finding 2 is closed locally. `scripts/navigation/test_next.mjs` exercises actual Next production Today → Program → Back to Today in EN/AR: the retained unfinished task is refocused, or the attention heading is focused after the completed fixture removes it. Each complete entry/return pair measures `['read','owner_home']`, zero writes, zero document loads and zero target-task speculative prefetch. **All** router-prefetch requests are separately 21 for unfinished and 22 for completed cases, mostly shell destinations. The earlier global zero-prefetch claim was incorrect; its failed assertion and paths remain in [the routed receipt](evidence/mp-b01-routed-return/receipt.json) and adjacent failed-run artifacts. No shell behavior was changed to manufacture zero. Actual database/Redis cost of those preparations remains unmeasured. The broken checked-task marker variant is still detected while return reaches the attention heading.

Component/href cases in `scripts/programs/test_ui.mjs` and the Experience-only fixture cases retain their narrower scope as recorded above; the receipt case list was relabelled accordingly. Earlier component assertions were not weakened. The routed journey is local synthetic-router evidence: no hosted authentication, no deployment and no Owner acceptance.

**Finding 3 — closed locally:** `scripts/experience-projections/test_ui.mjs` restores the original register-summary control: pointer click coverage plus focus+Enter activation on the same summary link, both asserting the focused attention heading, with the existing request-budget assertion (`Scope links and queue rendering add no reads`) retained. Production and development modes pass.

**Finding 4 — later closed locally:** the actual hook/approval/sync lifecycle and old-ordering negative control are now executed, including account and academy remount. Unmount proves no captured page error after the late reply, not no callback attempt. Utility tests keep their narrower classification. See the [EX-15 corrected receipt](ex15-storage-diagnostics-2026-11-13.md).

OpenCode's earlier aggregate 112-unit/UI report did not supply the then-missing assertions. The later actual harness executions above close only their declared local cases; the 13 November local-workflow receipt records the subsequent pinned-toolchain rerun and source hashes.

## Remaining limits and next work

Signed-in hosted EN/AR publication review, hosted NR07 diagnosis, wider NR03, installed-device evidence, Owner working acceptance and the Owner-deferred independent security review remain open. No deployment promotion was initiated. The fire-and-forget `approve` path integration cases are now provided by `scripts/working-day/test_device_lifecycle.mjs` (see the EX-15 receipt); installed-device cases remain EX-16.
