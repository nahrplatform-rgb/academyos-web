# EX-10 local-data decision/design review checkpoint

2 November 2026. Starting source `4044ec50b2c4b7329206be2b6ae6600de68d6f72`, clean before this task. Authorized outcome: continue the living prompt’s current EX-10 next action, preparing clear LF-P choices and a connected persistent-local changed-state review. This is a proposed experience/tooling checkpoint, **not** private app storage implementation, deployment, Owner acceptance or independent security approval.

## LF-v3 continuation — latest2November2026

Owner selected30day-without-verification/logout replica cleanup, wants retained prepared data readable offline without the proposed24hour cutoff, and explicitly requests durable local edits plus reconnect synchronization. See [exact responses](evidence/local-first-owner-direction-2026-11-02.json) and [the new offline-edit/conflict preparation](../04-engineering/offline-edit-and-conflict-contract.md). No inactivity lock. The original connected read/preparation design remains approved; its24hour/15minute captions are superseded and its approval does not cover new command/conflict/deadline/logout states. Exact device/key/field and per-command handling remain to review. Current-online read-owner work is independent; [contract](../04-engineering/workspace-read-owner-contract.md). Earlier receipts below remain historical within their declared scope.

## Latest Owner response — 2 November2026

Connected design explicitly approved for implementation. After asking what “locks after15min” meant, the Owner explicitly rejected automatic inactivity locking. Do not hide records, sign out or require unlocking solely because interaction stopped, and do not propose another idle duration as an accepted fallback. Other device/field/local-read-expiry/key/retention choices remain pending; current server authorization is unchanged. The persistent-local pattern is intended across suitable modules, not only the initial directory/month proof. [Exact scoped responses and approved artifact hash](../../design/local-data-preview/evidence/owner-design-approval.json). EX-10 remains current for exact remaining policy readiness; app/hosted/working-feature/security acceptance is unchanged.

## Review now

- [Plain-language exact policy/design packet](../06-delivery/local-data-read-pilot-decision-design.md).
- [Connected proposed preview and instructions](../../design/local-data-preview/README.md), served at `http://127.0.0.1:3235/design/local-data-preview/index.html` by `node scripts/design/serve_local_data_preview.mjs`. The server serves this generated preview only, binds loopback, prohibits external connections and does not expose the repository.
- [Generated single-file HTML](../../design/local-data-preview/index.html), [source fingerprint manifest](../../design/local-data-preview/manifest.json), [coverage map](../../design/local-data-preview/coverage.csv), [verification receipt](../../design/local-data-preview/evidence/checks.json).

Persistent cross-visit data is already the requested direction. The first slice proposes an Owner personal device, exact directory/month summary fields, optional local-unlock read access for24hours and replica cleanup after30days without successful verification. **Those remaining exact device/access/key/field/retention choices are pending; the connected design is approved and automatic inactivity locking is rejected.** The approved-hash HTML’s old15minute caption is historical proposal copy, not a current requirement; its source has no active automatic idle timer. These decisions are separate from the superseded v1 memory/30second/5minute proposal. No offline write queue or sensitive-domain scope is inferred.

## What was built and verified

The generated preview has real synthetic IndexedDB rows, name/day indexes, metadata, atomic page+checkpoint and delta+revision transactions. A paused import resumes; completed records survive a Chromium process restart. A second scope never displays the first scope’s records. Web Locks coordinate a finite bootstrap across two tabs, with scope-only BroadcastChannel hints. Original synthetic-operation IDs use a separate object store and survive replica removal. The simulated source/sign-in/lease/denial/receipt never call the working app.

The initial page and working note render independently of the remainder’s progress. Useful prepared data stays during a failed check. Background refresh changes the data regions while retaining the focused input node, text and selection. Native dirty/clear/detail dialogs and the phone drawer restore focus and support Escape. EN/AR copy, dark/light and320/360/390/768/1280/1440px layouts were checked.

**26 connected browser checks and24 layout combinations passed**, on Node24.14.0 and Chromium156.0.8078.4 using a disposable persistent profile. Checks include interrupted pages, true process restart, unchanged checks, covered search/navigation, four sparse changes/removals, transaction rollback, original save identity, two-tab duplication budget, missing versus complete-empty, simulated denial/clock/expiry, disconnected already-open reads, Arabic indexing, dirty text/focus, dialogs, unavailable storage, console health and external-request prohibition. See the exact HTML hash and all assertions in the receipt.

| Fixture path | Observed synthetic source work | What it establishes / does not establish |
|---|---|---|
| Pause after first50-session page, refresh, complete |3 version/manifest exchanges across the interrupted visit;8 total snapshot pages;64,273 UTF-8 fixture JSON bytes;192 stored rows | Original committed page reused; directory/month completed. Not an app bandwidth or Supabase query measurement. |
| Close Chromium process, relaunch same profile, unlock/check unchanged |2 manifest exchanges;0 snapshot/change pages;249 fixture JSON bytes | Real disk persistence and unchanged fixture suppression. Real authentication/key/envelope/API work is absent and must be counted in implementation. |
| Covered directory/calendar/filter/inspect |0 additional fixture exchanges | Bounded local queries serve prepared data; does not prove actual app navigation or speed. |
| Two tabs bootstrap after replica removal |8 combined snapshot pages, the same finite bootstrap budget as one tab | Basic leader contention/invalidation works. Leader death, version upgrade and production authority remain unproven. |
| Sparse changes |Changed player name, player removal, moved session, session removal; revisions installed transactionally | Real local synthetic transaction application, not a deployed server change feed or snapshot/delta retention contract. |

The test uses explicit500ms/450ms fixture delays to make asynchronous states reviewable; it does not compare that artificial speed with staging. Raw local-query samples are in the receipt, not a p75/p95 app-performance pass. No requests reached Supabase, Clerk, Redis, Vercel, mail or any operating API. Browser asset-serving requests are not confused with operating service requests.

Browser-path classification: the Browser plugin/`browser` skill are not listed, so the frontend-testing skill’s regular Playwright path was used. Four settled full-page captures were visually inspected: EN desktop overview and filtered People/inspector; AR phone calendar; AR tablet light calendar. Screenshots are temporary files outside the repository at the path in the receipt.24 layout combinations check document overflow; representative body/actions exceed4.5:1 contrast in both modes. This is not exhaustive contrast/assistive-technology or physical-device acceptance.

During development, tests caught a focus reset and an unprepared-metadata rendering error after cursor expiry; both were fixed without changing expected outcomes or weakening assertions. Test sequencing was corrected to await actual completed work rather than treating an unlocked header as completion. Initial captures caught transient theme-transition frames and retained English status text after changing locale; settled captures and translated status now match the reviewed states. Mechanical design detector returned no findings at its limited scope. A fresh AI finish review found misleading full-reset copy and lost result-button focus; both were fixed, all-scope reset and retained/removed-control regressions passed, and the same reviewer scored both resolved. This is an artifact-quality review, not independent human/security approval. The [review receipt](../../design/local-data-preview/evidence/finish-review.json) records that boundary.

## Source/reference and trust-boundary record

Read current AcademyOS scope: `people-workspace.tsx`/people request definitions, `experience-projections.ts` calendar summary/bounds, signed no-store gateway contract, the LF-v2 architecture and prior route-owned/recovery evidence. No app component, API, schema, package, configuration, role or operating writer changed. Existing 18-player/40-date actual-component/SQL/hosted evidence is retained, not re-run or overwritten by this prototype.

Rechecked PYSA’s `lib/query/query-client.ts` (stale0, memory gc5min, reconnect refresh) and scheduling/offline audit entries WF-0004/0005 still PARTIALLY_REVIEWED. Useful patterns are connected list/calendar/selection and explicit pending/conflict states. Query memory/legacy offline helpers are not sufficient durable-store or hosted-reconciliation proof. PYSA remains unchanged. The correct Shift staging worktree and source hashes remain those in the [deep reference review](../04-engineering/shift-ios-local-data-reference-review.md): native encrypted completion/checkpoint/version/replay patterns inspired the demonstration; native personal-access/key/lease/timer policies were not copied.

Canonical joins: IMP-J01-A01, IMP-J06-A01/A02 and IMP-J09-A01; L01/L04/L05/L06/L07; SEC-J01/J06/J09; AO/AT associations and WB/WD coverage are in the packet/map. Current NR/G findings and all50 planned/future WD cases retain their statuses. A fictional test does not close a real-app case or a cross-app finding.

## What remains explicitly open

- Product acceptance of the remaining exact scoped policy. Connected lifecycle design is approved; automatic inactivity locking is rejected. Remaining proposed numbers are not hidden defaults.
- Private adapter/key derivation/wrapping/online key access, passphrase recovery, local lease threat model, clock limitations, account cleanup, quotas/corruption/migration/eviction and cold offline shell.
- Real versioned manifest/snapshot/change/removal contracts and SQL/bytes/limiter/provider cost, server-side discovery after locator loss, access epochs and late replies at actual boundaries.
- Trainer/Guardian scoped local fields, original domain writes/concurrency/unknown-result regressions, leader-crash failover, active-scope freshness cadence, Safari/iOS/Android/physical and assistive technology, hosted working-day/Owner acceptance and independent human/security review.

No new access grant/restoration, real data, service upgrade, production release or staged app promotion is included. Actual sign-in/unlock/lease/denial/receipt in the preview are simulated; rows are unencrypted fiction, and the preview is not a reusable security adapter. Native dialogs, local storage and passing Chromium checks cannot establish privacy approval. A browser tab cannot guarantee continued execution when closed/suspended.

## Continuation

EX-10 remains `current`. Resolve only the remaining exact policy choices, honoring the rejection of inactivity locking and existing design approval. Do not re-ask those settled choices, repeat the source-reconciliation task or ask whether the Owner meant persistent data. Record accepted and changed choices separately. Then advance only the scoped ready output toward EX-02’s stable workspace seam, followed by EX-06 storage/key implementation and EX-04 real bounded transport, with EX-03 recovery and supporting EX-05/08/09 evidence alongside them.

The loopback server whitelist/CSP/freshness and native dialog were also checked separately; see [serving checks](../../design/local-data-preview/evidence/serving-checks.json). Automatic opening in the user’s browser reports “Local browser use is disabled in Work settings”; the clickable local URL remains available, without changing user settings.

The tracker, canonical LF-v2 plan, master/redesign/execution pointers and generated continuation prompt are synchronized. The factual current-source HTML remains unchanged and is freshness-checked because no runtime source/canonical implementation status changed. Design, implemented review tool, local verification, app implementation, deployment, hosted verification, Owner acceptance and independent security remain separate.

## Git delivery and observed security notice

Review/tooling commit `af1463f` was pushed to `codex/onboarding-decision-design-packet`; the working tree was clean afterward. This does not establish an app rollout or hosted working-feature acceptance. The push reported one high dependency alert on the repository’s default branch: [Dependabot alert1](https://github.com/nahrplatform-rgb/academyos-web/security/dependabot/1). This checkpoint did not triage the advisory, determine staging applicability or change dependencies; retain it for the existing security gate. Do not describe it as a new preview dependency or a resolved vulnerability.
