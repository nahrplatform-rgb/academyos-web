# Persistent local data and synchronization: source review and plan reconciliation

2 November2026. Authorized scope: understand the newer Shift staging iOS implementation deeply and adjust AcademyOS's documentation/plans to the clarified persistent-local model. AcademyOS starting source `12ccb4527434decd36fde683831d0997aee4a80e`; clean tree before this task. Shift reference staging source `1239e2c7ffcbbd608295303dff2aae400e11af35`, with unrelated pre-existing renewal/temp edits retained. No memory, real/private customer data, native app installation, provider/schema or operating data change.

## Current references and outcome

- [Deep Shift staging iOS review](../04-engineering/shift-ios-local-data-reference-review.md): startup/durable cache/journal/crypto/coverage/bootstrap/version checks/exact sync/revocation boundaries and real limits. Earlier main checkout was the wrong reference; the staging worktree is the correct one.
- [LF-v2 local-data and synchronization plan](../06-delivery/local-data-and-sync-plan.md): persistent datasets across visits, finite sequential preparation, local indexed reads, manifest/change synchronization and separate write/recovery/authority owners. Ten dataset classes, six exact pending policy categories; no accepted numerical lease/TTL invented.
- [Working behaviour](../03-design/academy-working-behavior-contract.md), [request standard](../06-delivery/request-hygiene-and-offline-standard.md), [50 planned cases](../06-delivery/academy-working-day-cases.csv), [execution tracker](../06-delivery/experience-execution.csv) and [generated continuation prompt](../06-delivery/continue-academyos.md) are reconciled.
- [Documentation audit map](evidence/local-data-sync-reconciliation-2026-11-02/documentation-audit.csv) distinguishes machine-scanned files, closely reviewed current contracts, changed current guidance, future plans and preserved historical receipts. It does not pretend every dated sentence/source/prototype is freshly runtime verified.

The old unaccepted summary-only/30second/5minute/intent-only proposal is visibly superseded in its packet, handoff, README and HTML. Original source inventories and test receipts remain historical; new retirement-banner checks use a separate evidence directory rather than overwrite them. The accepted full Charcoal visual/workflow reference is preserved; a revised local-first changed-state review remains next, not a request to approve the retired storyboard.

## Reference verification

Copied only the SwiftCore package source/tests/manifest to an isolated temporary directory and ran selected synthetic persistence/sync tests with a restricted environment, no hosted credential fixture and no reference build-directory change. **55 selected tests:54 passed,1 hosted-fixture skip,0 failed.** They cover encrypted reopen/wrong key/tamper, page resume including10,005 synthetic events, complete-empty, feature digest persistence, session/generation checks, exact lost-response packet replay, conflict preservation and durable notes. [Selected test receipt](evidence/local-data-sync-reconciliation-2026-11-02/shift-tests.json) records the filter/cases/source hashes and limits.

No fresh actual iOS Keychain/file-protection/device/offline/performance/hosted claim: tests run as isolated macOS SwiftCore with synthetic transports/injected keys and temp files. Existing Shift documents report wider historical native/hosted proof, retained with their original scope. Current source has manifest gating **and some time-triggered full refresh paths**, not universal delta transport. The review identifies an offline-binding expiry concern requiring exact immutable-expiry proof before any AcademyOS equivalent; it is not a newly established hosted exploit or security approval.

## Execution and documentation changes

The existing eleven EX rows and current EX-10 remain; no old delivery/acceptance evidence is erased. EX-06's target now includes durable repositories/indexes/access and read ownership; EX-04 includes bootstrap/version/change contracts; EX-03 preserves durable original online-command discovery, separately gated from offline queues; EX-11 adds cross-reopen/coverage/sync/storage cases. EX-05/08/09 support them rather than defer private local reads wholesale to optional native work. Primary order remains explicit in the tracker.

Updated active guidance covers AGENTS/README, governance decisions/change control/source register, product/release blueprint, identity/people/scheduling/attendance/finance/evaluation/privacy workflows, experience/role/loading contracts, architecture/API/data/jobs/privacy/security, findings/service impact, provider/native boundaries, cost/test/implementation/redesign/roadmap and builder handoffs. Action30 groups and loading18 rows gain a **prospective** local-data join; existing runtime bounds, measured evidence, business/implementation/deployment/Owner status fields and all180 requirements remain. No source evidence is converted into a durable-store runtime pass.

Case register retains the original32 IDs with corrected pending-policy descriptions and adds WD-33–WD-50. There are50 planned/future cases:48 planned,2 explicitly future (Manager/Player and monthly finance), none newly executed. Shift synthetic results are not linked as execution of these AcademyOS cases.

Validation extends existing structural gates to require the canonical LF-v2 target, ten dataset classes/six policy categories, matrix/action joins, planned persistence cases and visible old-proposal retirement. This is structural freshness, not semantic privacy/design/runtime approval. The factual HTML rebuild uses the unchanged actual-component capture pack with the updated prospective registers; no private local-store simulation is substituted for product captures.

## Next action and explicit limits

Follow [the generated continuation prompt](../06-delivery/continue-academyos.md). Prepare concrete plain-language trusted/shared-device, fields/unlock/retention and synchronization choices plus a connected persistent-local bootstrap → reopen → quiet changes → failure/recovery design. Do not re-ask whether data should survive normal reopening, or resume the old narrow proposal. Current direction is established; exact sensitive capability/lease/storage/retention/offline-write choices still need dependent review.

After readiness, continue stable workspace → durable repository → bounded bootstrap/change sync → original-operation proof → connected local-reopen acceptance, with measurements/security alongside each. Do not install a query cache or native wrapper as a substitute. No new app/data/schema rollout or production release is part of this documentation/reference checkpoint; current staging runtime remains its previous source. Independent security, physical browser/mobile, load/cost and Owner working acceptance stay open.

[Checkpoint checks and limitations](evidence/local-data-sync-reconciliation-2026-11-02/checks.json). Repository records are authoritative; no persistent-memory update was requested or made.
