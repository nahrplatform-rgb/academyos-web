# EX-02 workspace/read-owner seam with LF-v3 continuation

2 November 2026. Starting source `a7f955f`, clean. Authorized living continuation; current EX-10 remains policy/design readiness. This is safe current-online work under [the scoped contract](../04-engineering/workspace-read-owner-contract.md), plus reconciliation of the Owner's later offline-edit answers. It does not enable private disk or an outbox while their exact dependent rules are pending.

## Implemented boundary

The real locale/academy layout now supplies a stable client scope. `WorkspaceRuntime` binds one `WorkspaceReadOwner` to the loaded Clerk subject/academy, while leaving the root ClerkProvider and existing protected page/API/data authorization in place. No new membership/bootstrap request or stored credentials. Home/Calendar, Guardian link lookup for those views and individual-date read/candidate/directory operations use the owner. Planning review/save/reconcile stay on the existing command path.

Exact current parameters and capability partition pending reads. Same-key consumers share one transport; leaving one cannot cancel another; leaving the last cancels the browser transport. Settled values are not retained, results are isolated copies and obsolete completions cannot settle a newer entry. Known denied/setup-required results invalidate pending peers only in that capability. Current generation/dirty/unknown/receipt guards remain task-owned. No retries, polling, idle timers, hidden mounted pages, private persistence or new dependency.

This establishes the shared lifetime/repository seam; **route shell DOM still remounts and ordinary settled navigation still performs its current read**. It is not the promised durable repository or a claim that the user should already feel instant navigation. EX-06/04 still need actual protected local records, coverage and real sync contracts.

## Comparable evidence and budgets

The baseline diagnostic ran before the edit on `a7f955f`; after runs use the actual changed components/production Next router. Identity and HTTP remain fictional, explicitly separate from Clerk/RLS/provider/hosted proof. [Sanitized receipts](evidence/ex02-read-owner-2026-11-02/checks.json) include source hashes and before/after observations.

| Observation | Before | After / interpretation |
|---|---|---|
| Home → Calendar → dated task → Calendar return |1browser document;4initial task reads in either locale |Same1document/4task reads, no layout/bootstrap read. No invented reduction for different resources. |
| Stable shared workspace read owner across that loop |No academy-layout owner; current route-owned request implementations |One owner mount,0unmounts across the loop; a changed/uncertain subject destroys it and requires a fresh read. |
| Shell DOM mounts |1/2/3/4across route changes |Unchanged route-owned shell; not evidence of changed Clerk/DB activity. |
| Controlled two concurrent exact Home consumers |Independent domain-reader mechanism can start separately; no assertion this duplication occurs on every actual user route |Actual two-consumer fixture starts1transport. Unit checks also prove distinct link/role/period/cursor/scopes remain separate. |
| Explicit read after prior success |Current no-store request |Still1new read; this owner is not a private freshness cache or offline substitute. |
| Writes / backend/provider costs |Existing atomic/idempotent commands |No change. Browser cancellation does not prove SQL or limiter cancellation. No service savings or p75/p95 claim. |

The first added routing assertion initially expected a cold Calendar action after following Home's Calendar link. Inspection confirmed that the existing link carries a valid period hint, so the correct action is `owner_calendar`; the assertion was corrected to that exact existing contract, retaining the one-read budget and all business outcomes.

Local checks passed:91unit tests including12new read-owner cases; actual Next EN/AR dirty/busy/unknown/selection/Back/Forward assertions plus scope lifetime/identity replacement/two-consumer checks; all16actual-component capture suites; affected Home/Calendar and Planning development/StrictMode suites; lint/typecheck/production build; standalone factual review checks/freshness. No test assertion was removed to weaken policy. Synthetic tests include denial, two-account/academy partitions, subscriber cancellation, late results, no retry, immutable consumer values and refusal to share mutations/review/reconciliation.

The factual HTML was rebuilt from real-component captures; fingerprint coverage now also includes actual layouts and the read owner. It records1051frames/1055transitions/70source files with existing68screens/30action groups/180requirements preserved. Counts are inventory, not exhaustive hosted rendering, usability or security acceptance. Temporary screenshots and raw harness output remain outside the repository. Source/HTML review and local emulation do not establish real physical devices or server isolation.

## Latest Owner answers and new target

The Owner wants one/three-month datasets prepared sequentially and read locally, new offline edits saved to the device and synchronized on reconnect, and30day-without-verification/logout replica cleanup. No inactivity lock; the proposed24hour cutoff is not selected. [Exact replies](evidence/local-first-owner-direction-2026-11-02.json) and [LF-v3 plan](../06-delivery/local-data-and-sync-plan.md) retain acceptance boundaries. Original read-design approval stands; new command/conflict/deadline/pending-work states still need focused review. Timestamps alone cannot safely replace base versions/idempotent IDs; the new [offline-edit/conflict packet](../04-engineering/offline-edit-and-conflict-contract.md) prepares the first Owner register recommendation and pending-work/logout choice.

Added WD-51–WD-57 as **planned, not executed**. The previous50cases retain their evidence status; no coordinator/prototype pass becomes offline operating proof. Master plan, redesign, roadmap, working contract, AGENTS and generated prompt point to current choices rather than repeating the rejected timer questions. Current EX-10 remains the single primary priority; the safe EX-02 seam is implemented separately.

## Release and open gates

At this local checkpoint, no new schema, account grant, email, real data, paid service, production launch, private adapter/key or operating write was made. Release source/CI/alias/hosted evidence is recorded separately after push; automatic Git deployment is not assumed to have updated the canonical staging alias. The Vercel connector could not resolve `academyos-web` under explicit `academy-os2` scope (404); no project/provider setting was changed. Existing browser access is available for a read-only hosted check once exact release source is established.

Working Owner acceptance, broad role/device/load/cost and independent security remain open. GitHub's earlier high default-branch dependency alert remains untriaged, with staging applicability unverified; no dependency changed here.

## Continue

Do not rebuild this seam or re-ask settled durable-data/timer/replica-retention/read-design choices. Follow the current generated prompt: resolve the prepared first offline-register timing/conflict and pending-work/logout decisions, prepare its connected offline-write review, and complete remaining exact device/field/key readiness. Then advance only ready EX-06/04/03 work, preserving current server checks and all existing scopes. Actual private local implementation and working offline acceptance are still ahead.

## Earlier release handoff —3November2026, superseded below

App/source commit `1e7008f388e82c225a7b1e50f4e7319469dbfede` was pushed. Both exact-source Foundation checks passed: [run41531516588](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/41531516588) and [run41531507290](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/41531507290). Vercel automatically produced **Preview Ready** `dpl_7MRnExdKzvVagCzBF4hna6kzfJWo` in56seconds, visibly bound to that source. A preview build does not update the canonical staging alias.

The explicit promotion review listed only `academyos-web.vercel.app` and `staging.academy.nahr.dev`. Promotion was requested within the existing staging authorization; Vercel then displayed **Reauthenticate**. Continue with Passkey was initiated and the tab was left visible for the Owner. The fresh account check is pending; no credentials, OTP or recovery code were read or entered. This is the existing provider's account control, not a new feature/access approval. [Release receipt](evidence/ex02-read-owner-2026-11-02/release.json).

**Canonical staging deployment and release-specific hosted verification remain pending.** The existing signed-in Calendar could be read, but was not claimed as the new source. No domain save or access restoration occurred. Once the Owner finishes the passkey check, inspect fresh provider state; request the Owner to complete the exact prepared release if necessary; verify exact source/Ready/canonical alias, then run read-only Owner EN/AR Home/Calendar/date/return and foreign-scope denial. Do not assume authentication completion itself proves promotion or app behaviour. Keep the original user Calendar tab/selection; use a temporary test tab.

This documentation receipt may follow the code commit; do not rebuild/promote a different source merely because its documentation timestamp is later. Current code hashes and the source-specific CI/release boundary stay explicit.

## Owner replies —3November2026

The first **Owner-only offline-register policy was accepted for design** and protected pending-work recovery after logout/30day replica cleanup was selected. See the [accepted scope](../04-engineering/offline-edit-and-conflict-contract.md); build its focused offline-write changed-state preview next, not another policy question for the same choices. Device/key/field detail, connected design approval and private implementation/security remain separate.

For release selection, the Owner asked which of `1e7008f` and `58eee46` to promote. Verified `git diff --name-only 1e7008f 58eee46` contains only four delivery-document files; application source is identical. **Promote `1e7008f` only**, using the prepared/checked deployment and existing staging destination. Do not promote both or assume the clarification means authentication/promotion already completed. This approval-record update is committed locally without pushing until that release step finishes, to avoid adding another preview choice mid-handoff.

## Owner-promoted release verified —3November2026

The Owner reported “promoted.” Read-only native Chrome provider inspection confirms **Ready/current** deployment `dpl_8VRWuibdYQWGSiiAhfjgCinnPPro`, exact source `1e7008f388e82c225a7b1e50f4e7319469dbfede`, and `staging.academy.nahr.dev`. Duration shown was61seconds. The provider labels this existing project environment Production; AcademyOS customer production is not launched. [Updated structured release/hosted receipt](evidence/ex02-read-owner-2026-11-02/release.json).

A temporary signed-in native Chrome tab verified Owner Home → Calendar → the synthetic3November date → Back: visible period3–9November and selected session were retained. Arabic Calendar navigation, date/time and selected inspector loaded. A direct read of the known foreign academy showed access unavailable and no session rows. The temporary tab was closed; no domain write, membership change, invitation or access restoration occurred. In-app browser binding failed and the scoped Vercel connector returned404; authenticated native Chrome was the read-only fallback. No hosted network/SQL/Redis/Clerk counters, all-role proof, physical-device/zoom test or percentiles are inferred from AX observations.

**New Owner promotion instruction saved:** the Owner performs every future promotion. Agents prepare/test/commit/push and inspect/verify, but do not initiate/finalize promotions, change live aliases or operate the promotion/passkey flow. When needed, give the exact checked candidate/deployment/staging destination. Ordinary continuation does not override this rule. It is in AGENTS.md, the continuation generator and the explicitly requested memory note.

The first offline-register policy and protected pending recovery are accepted for design. [The connected write preview is now prepared](../06-delivery/offline-register-decision-design.md), with separate local synthetic evidence and design-review status. Current app UI and factual captures are unchanged by that new artifact. The earlier pending-promotion/build-preview instructions above are historical; do not promote1e7008f again or promote later documentation-only commits.
