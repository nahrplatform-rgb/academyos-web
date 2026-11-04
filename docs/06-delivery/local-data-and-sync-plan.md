# AcademyOS persistent local data and quiet synchronization plan

**3November connected-write checkpoint:** [Owner offline-register preview and traceability](offline-register-decision-design.md) now covers the accepted atomic/original-ID/current-check/retained-recovery rules. Connected write design is now approved; policy/read-design approvals remain. Follow the [runtime/key readiness packet](../04-engineering/offline-register-runtime-readiness.md) before private enablement. No private runtime is enabled.

**4 November scoped readiness.** The [gated Owner workspace and startup checkpoint](../07-handoff/owner-register-workspace-checkpoint.md) passed local integration and account-wide sign-out checks for the [approved one-register scope](../04-engineering/owner-register-private-readiness.md). It uses the EX-04 transfer, EX-06 storage and EX-03 original dispatch. Prepare synthetic hosted validation and the independent security handoff before any private activation. Broader datasets and roles have separate gates.

2 November2026, revision LF-v3. **Owner-directed persistent reads and offline-edit target; not implemented, deployed, independently security-approved or a blanket command policy.** The Owner clarified that player pages, monthly schedules and later monthly finances should be prepared in bounded sequences, retained on the device between visits and synchronized in the background. This replaces the mistaken assumption that the goal was either an entire-database preload or a30second memory-only summary cache.

This is the canonical current local-data design/policy-preparation record. It supersedes the unaccepted WB-P01–WB-P04 recommendations in the [v1 packet](../04-engineering/working-day-pilot-architecture.md), including its summary-only scope, intent-only preparation,30second/5minute limits and same-tab-only end goal. Those values were never accepted; do not ask for approval of that old bundle. Existing production/staging boundaries, operating rules, functional approvals and previously measured navigation fixes remain unchanged.

Use the [Shift source review](../04-engineering/shift-ios-local-data-reference-review.md), [working-behaviour contract](../03-design/academy-working-behavior-contract.md), [execution tracker](experience-execution.csv), [request standard](request-hygiene-and-offline-standard.md), [loading matrix](../03-design/screen-data-loading-matrix.csv), [acceptance cases](academy-working-day-cases.csv), [security review](../04-engineering/journey-security-review.md) and [service-impact evidence](../04-engineering/request-service-impact.md). No new app capability or private storage policy is inferred from a generated prompt, simulated view or dependency default.

Current EX-10 review: [plain-language device/fields/access recommendations](local-data-read-pilot-decision-design.md) and [connected synthetic local-data preview](../../design/local-data-preview/README.md). The connected design is approved for implementation. The Owner rejected automatic inactivity locking; do not hide records or require unlocking solely because the person stopped interacting. Other exact device/field/local-access/key/retention choices and private runtime enablement remain separate and pending. A rejected idle timer must not be reintroduced under a different duration.

## Latest Owner choices — LF-v3,2November2026

**Latest3November device direction:** ordinary email/password sign-in should be sufficient; do not require passkey enrollment, a separate local secret or local reopening prompts in the normal journey. [Exact response and revised automatic-protection/key-recovery work](../04-engineering/offline-register-device-key-contract.md). Earlier passkey research produced a positive Owner Chrome sample result, retained as historical evidence. It is not a product prerequisite or permission to weaken private encryption, same-account pending recovery or current server authority.

**3November update:** the Owner accepted the first Owner-register offline-save policy **for design**, retaining atomic selected marks/original operation IDs and current server access/version/deadline checks. Conflicting/refused uploads keep local work as Needs review; no timestamp overwrite. Protected pending edits survive logout/30day replica cleanup for the same verified account only. The [offline-edit packet](../04-engineering/offline-edit-and-conflict-contract.md) records the exact scope. The connected offline-register design is now approved for implementation3November; private storage/key/security implementation remains pending; do not re-ask the settled policy or pending-work choice.

The Owner clarified month or three-month preparation, local reading of retained data and durable new edits that synchronize when connection returns. The proposed24hour read cutoff is not selected; automatic inactivity locking is explicitly rejected. Read replicas may be removed on explicit logout or the next execution after30days without successful online verification. Known-denial/Remove downloads handling stays distinct; unresolved original operations and unsent offline edits must not be silently erased as disposable replicas.

The [exact responses](../07-handoff/evidence/local-first-owner-direction-2026-11-02.json) and [offline-edit/conflict contract](../04-engineering/offline-edit-and-conflict-contract.md) supersede the earlier online-writes-only *target*. Current app writes still operate online until a domain's offline rules, encryption/recovery and connected changed-state design are implemented and verified. The Owner suggested timestamps; engineering recommends base server revisions and immutable operation IDs too, with retained conflicts rather than automatic device-clock last-write-wins. This recommendation and per-domain deadline/conflict/logout choices need a concrete review, not an invented new permission.

One or three months is a finite coverage selection, not one giant response. Existing42day/50summary response limits and resumable pages remain; a three-month preparation walks multiple valid windows and all their pages. Persist all *permitted, selected fields* in that scope, not every database table/private field. This direction applies progressively across suitable modules and roles. Device/key/exact sensitive-field choices remain open; do not re-ask the settled durable-data, no-idle-lock, no24hour-cutoff or30day/logout decisions.

## 1. The experience being built

**First permitted use:** authenticate/choose workspace → open the requested task with its essential current data → start a visible, resumable preparation of the allowed dataset in bounded pages → save completed coverage locally → let the person work while remaining approved sets are prepared.

**A later opening:** unlock/verify the permitted same-account local workspace according to its accepted access policy → open the requested view from locally stored records and coverage → run a small current-access/change check in parallel where permitted → apply only eligible changes → update affected views quietly. An expired/incompatible/locked store explains the needed verification; it must not masquerade as an empty academy.

**Normal navigation:** select/filter/change month from the local repository where coverage exists. No per-component network fetch just because a route mounted. A genuinely missing month/page needs a bounded download and honest progress. A freshly installed device, explicit reset, evicted storage or revoked scope is not a normal warm launch and may need bootstrap again.

Persistent local storage, network query caching, code prefetch and offline command queues are distinct. The target includes durable local read datasets; it includes the requested offline-edit target, but does not silently authorize every attendance, publishing, payment or role-change command offline. Until a capability gets its approved queue/authority design, current writes stay online and existing server receipts/atomicity stay canonical.

## 2. Scope of each dataset

**App-wide direction, staged delivery:** the persistent repository and quiet synchronization pattern are intended for all suitable implemented modules and role-specific workspaces, not just this first player/month demonstration. Adopt them progressively for permitted directory, schedule, roster/attendance, Guardian and development projections, with future finance following when its real functionality and policies exist. Each domain still defines its readable fields, periods and authority; the direction is not permission to download the whole database, every private field or another role’s records. Offline operational writes remain a separate decision.

“All players” means **all currently permitted player-directory summary rows in a declared academy/branch scope**, downloaded page by page to a declared complete revision. It does not mean all profiles/contact fields/medical records/history, or every academy's children. Large supported directories can be complete on disk while the UI loads only a bounded indexed page. Capacity limits must stop/resume clearly, not silently truncate or evict accepted durable records.

“Monthly schedule” means the permitted dated summaries for the selected branch-timezone month and its explicitly needed calendar-grid spillover. It may span several≤50-row responses; existing per-response42day/byte bounds remain. A40-date program is a test fixture, not a hard limit for a month. The preparation planner can then move to chosen adjacent periods and additional agreed sets without blocking current work.

“Monthly finances” means the permitted month snapshot/ledger projections once finance is actually implemented. The current app has no such working finance dataset. It is future schema/policy/design work, with separate family finance, trainer compensation and platform commerce authority; no placeholder totals or invented financial calculations.

| Dataset class | Target local content / coverage | Proposed preparation order and write boundary |
|---|---|---|
| LD-01 access/context | Minimal verified identity/workspace labels, permitted field/scope policy reference and local-access metadata | Critical small online scope check or accepted local-access lease; never a cached server permission grant. Roles/invitations/security changes online-only. |
| LD-02 people directory | Minimal permitted name/ID/branch summary plus row revision and searchable/sortable protected index | Requested page first, remaining permitted pages sequentially; profile/contact/history separate opt-in capability. Registration/duplicate review stays current online. |
| LD-03 calendar/program summary | Dated permitted program/session/branch/sport/time/state/capacity summary with revision and coverage period | Requested month first; selected adjacent periods next; all pages for the agreed month checked before complete. Planning/publication/move/cancel stay online. |
| LD-04 register | Only explicitly allowed assigned session roster/status fields, event/version/recording-window metadata | Current session if accepted per role; not silently part of directory preparation. Local reading is separate from offline capture; current recording/correction/QR gates retained. |
| LD-05 Guardian data | Approved linked-child training/current attendance/published feedback projection | Only allowed active-link published fields, separate key/index/lease; no other child or private staff reason. Ending a link invalidates its local scope at the next known denial/check. |
| LD-06 development/reviews | Permitted published feedback or staff draft/review fields under separate policy | Sensitive text and staff reasons excluded unless explicitly selected. Domain drafts/commands never become disposable cache rows. |
| LD-07 finance | Separate future monthly family/compensation/platform projections and original financial snapshots | Future-only; unlock/retention/ledger semantics reviewed before storage. Never treat pending transaction as a final paid balance or recalculate an immutable saved statement. |
| LD-08 reference/preferences | Approved catalog/rules/timezone/locale labels and presentation preferences | Versioned reference download; tenant configuration is not public merely because it changes rarely. |
| LD-09 original operations | Scoped durable operation identity and existing outcome receipt; requested per-domain drafts/outbox after exact review | Recovery foundation starts now in design; unknown writes never evicted/reissued. Offline mutation payload/outbox requires capability-specific approval, not this plan alone. |
| LD-10 media/export/support | Explicitly selected private artifact manifest and, only if approved, downloaded objects | Future/opt-in; expiring signed URL is not durable access. Do not automatically cache photos, support text or whole exported databases. |

Each matrix row must declare included/excluded fields, role/branch/link, initial priority, disk/memory size/work limits, retention and supported offline actions. No universal collection is appropriate for all roles. Platform Owner's admission list cannot warm tenant content; Manager/Player portals remain unbuilt future work.

## 3. Storage, read ownership and synchronization architecture

| Layer | Owns | Must not do |
|---|---|---|
| Identity / local unlock | Current Clerk identity lifecycle and accepted device-local access policy; lock/lease/session transitions | Treat locally decoded tokens or persisted membership as current server authority; silently extend offline expiry |
| Scoped repository | Typed local records/indexes/coverage, schema version, account/environment/academy/capability partition, local queries/subscriptions | Expose a raw global database to components or mix all roles into one unpartitioned cache |
| Durable storage adapter | Browser IndexedDB candidate for responsive web/PWA; transactional record+coverage/checkpoint updates; separate queue class | Promise native Keychain-equivalent protection, silently use plaintext localStorage or reset damaged/pending data |
| Synchronization coordinator | Active-scope scheduler, manifests/change cursors, resumable bootstrap, one compatible in-flight owner, backpressure/cancellation, cross-tab leader | Fetch every component separately, spin global polling, bypass gateway or claim a browser abort stopped SQL |
| Query/presentation layer | Small in-memory working sets, local subscriptions, stable shell/inspector, freshness/coverage/pending status | Make TanStack/SWR TTL the durable store, evict local authoritative/pending records as a query-cache cleanup, or blank useful allowed content on each check |
| Domain command/recovery | Existing exact intent/review/version/idempotency/receipt and immutable audit; approved future outbox | Report server Saved after only local disk commit; automatically retry unknown command with new ID |
| Server/gateway/DB | Current scope/field checks, bounded projections, snapshot/change contract, atomic commands and receipts | Trust a local access lease for server writes; publicly cache private projection or use privileged keys to accelerate replication |

Proposed disk namespace: environment + subject + academy + capability/branch-or-link + projection/field-policy version. Indexed records additionally include entity ID, authoritative revision, coverage collection/window and tombstone status. Persist only reviewed scope metadata; tokens, bearer cards, secret keys, private diagnostics and reusable credentials are not dataset fields.

Use indexed reads for a visible period/page instead of decoding every record at startup. Protected search indexes are data too. Materialize Home from compatible local projections when sufficient; a separately scoped authoritative total remains necessary when the source is incomplete or the count has different semantics. Do not add loaded-page counts or sum overlapping pages as scope totals.

### Read-library decision revised

The v1 recommendation of a query library for summary reuse is insufficient for this target. Query libraries may coordinate transient reads/UI subscriptions, but cannot provide the durable database, coverage, access lifecycle, migration or replica synchronization contract. EX-06 must compare native IndexedDB versus one focused wrapper for transactions/indexing and choose one repository architecture; measure compatibility, bundle size and failure handling before dependencies. A query library is optional above it, not a competing durable store. Do not add both an independent query persistence plugin and a second outbox/database.

The current server already has signed per-projection APIs. Do not replace all reads with server seed/bootstrap just to hide a network wait; a second hydration fetch would duplicate work. Current source ownership mapping in the v1 packet remains useful baseline, while its proposed scope/defaults are superseded.

## 4. Bootstrap and coverage contract

1. Resolve current permitted scope or an accepted local-unlock lease; request a minimal version/available-coverage manifest. Do not download unauthorized data to filter it locally.
2. Prioritize the requested task/current period. Prepare additional approved datasets in a declared sequence, not one giant response or a full-sidebar sweep. Initial engineering candidate: one background page at a time; interactive work preempts it. This is a scheduler candidate, not an accepted quota or product cap.
3. Bind every page to collection, field-policy/scope epoch, snapshot/revision, stable order, cursor and range. A cursor without a revision fence is not enough while rows are inserted/deleted or permissions change.
4. Persist downloaded rows plus checkpoint atomically. Partial staged generation may be shown only as explicit partial coverage if policy permits; it must not replace the last complete generation as if complete. Empty-complete must be recorded, so empty periods do not download repeatedly.
5. On interruption resume from a compatible saved checkpoint. If the server snapshot/cursor expired, restart only the affected collection/range and keep prior usable complete data. Reject foreign/duplicate/reordered/missing/incompatible pages.
6. Validate final snapshot/count/hash and all required bounds; atomically activate the completed generation and completion watermark. A manifest alone or the last page's200 status is not complete proof.
7. Keep download state separate from mutation state: `notDownloaded`, `downloading`, `partial`, `completeAsOf`, `needsCheck`, `updating`, `unavailable`, `locked/denied`, `capacityBlocked`. Local Saved/pending/conflict/server-confirmed have separate meanings.

Normal navigation reads the repository. It must not independently invoke a full bootstrap, walk every remaining page or refetch a complete directory per component mount. Approved background preparation may intentionally walk **all pages of one finite permitted dataset** across resumable requests; this is not the prohibited unbounded whole-app preload. Long tasks show their own progress and yield to current work.

## 5. Quiet change synchronization

Proposed versioned contract family—not deployed endpoints:

| Operation | Required current-boundary behaviour |
|---|---|
| `local_manifest_v1` | Current caller/academy/capability resolution; field-policy/scope epoch, supported collection/range definitions, opaque revision/completion markers; permitted counts only; finite response/SQL work. Shared server scope helper may reduce duplicate internal work but never remove checks. |
| `local_snapshot_page_v1` | Exact collection/window/snapshot/cursor; canonical projected fields, stable row revisions, continuation and checked total/completion proof. Transactionally coherent generation or explicit bounded restart. |
| `local_changes_v1` | Since-watermark with stable total ordering, safe upserts, removals/tombstones and new watermark. Changes atomically applied with that watermark. No updated_at-only race or deletion omission. |
| Existing commands / original outcome | Current signed domain operation, expected versions, all-or-nothing contract and audit/receipt unchanged. Locally stored view never creates a server action entitlement. |

The implementation may extend current exact-action POST APIs with reviewed versioned actions rather than add a parallel public REST surface. Preserve same-origin/body/rate limits, target-bound caller proof, current DB scope, pagination and output limits. No backend contract here is claimed to exist. A true delta feed requires reviewed schema/change retention, privacy/deletion handling, indexes and migration/recovery evidence; a naive all-row hash scan or post-hoc JSON diff may increase database work.

**Unchanged case:** current-scope manifest version matches local complete coverage → keep local dataset, no dataset-page download. Authentication and manifest calls still exist and must be counted. **Changed case:** fetch bounded permitted changes; keep unrelated records/views. **No delta support yet:** explicitly versioned bounded collection/range replacement with resume and coherent completion; measure bytes/CPU and call it replacement, not incremental sync. Target deltas where changes are sparse and cost justifies them; no claim that a change check alone solves bandwidth.

Removal is as important as addition. Scope change/withdrawal/ending link may require immediate local invalidation and a new scoped snapshot rather than exposing former rows' tombstones to a new capability. Cursor compaction/retention expiry requires a bounded rebase. Do not delete unknown/pending command state because a read cursor expired. Detail of change-feed retention is LF-P03/P05 pending; no silent new retention period.

Triggers: foreground launch/resume, successful relevant commit, explicit Sync, active connection recovery and declared lifecycle change; coalesce identical work. Default design does not copy Shift's15/60/300second loops or add Realtime. A periodic check or Realtime invalidation hint requires measured need, finite budget and its own scope review. Browser/OS background synchronization is best effort: closed/suspended tabs are not guaranteed to run. Active-tab work plus reconnect must be sufficient for correctness.

For multiple tabs: one bounded per-scope sync leader with failover, transactional compare-and-swap of watermark, obsolete-generation rejection; nonprivate invalidation hints only. No duplicate full downloads per tab or private broadcast payload. The leader lock is coordination, not authority. Different devices synchronize through server revisions; client clocks never win an access/financial conflict.

## 6. Access, privacy and key lifecycle — exact review still required

The Owner has explicitly selected persistent local datasets and quiet synchronization **as the design direction**. Do not re-ask whether data should survive reopening. The following are narrower unresolved decisions needed before runtime stores private records; explain them through concrete user scenarios rather than a dense TTL bundle:

| Decision | Proposed direction to prepare for review | Still must be specified / not inferred |
|---|---|---|
| LF-P01 device and local access | Explicit trusted-personal-device enablement for private datasets; shared/public device stays online/no retained private dataset unless separately managed. Owner rejected automatic inactivity locking. | Which roles/devices; unlock method; local unlock/access lifecycle without the rejected24hour cutoff; clock rollback; known denial/purge; what is readable before current network check; expired account behaviour. No lock/hide/re-unlock solely for inactivity. Shift7days is not an AcademyOS recommendation or accepted duration. |
| LF-P02 fields and collection scope | Begin with approved Owner directory summaries and selected-month schedule; design assigned Trainer/linked Guardian scope separately, not forever exclude them | Exact columns/indexes/contacts/reasons/media; branch/child rules; finite history/adjacent month coverage; large-academy limit. “All players” authorizes design of the permitted directory, not unbounded personal profiles. |
| LF-P03 disk lifecycle and confidentiality | Retain completed approved datasets across normal refresh/relaunch; distinguish explicit logout/reset, manual lock, role loss and separately agreed expiry. Inactivity alone must not lock/hide private views. Sensitive stores protected at rest under reviewed key management. | Read-replica30day-without-verification/logout cleanup and protected same-account pending recovery selected; exact wrapping/unlock/key lifetime, storage availability/eviction, revocation/deletion across offline devices, backup/export, account logout pending quarantine. No5minute eviction of persistent datasets or device-only hardware protection claim for web keys. |
| LF-P04 recovery versus offline writes | Durable original online-operation identity and terminal outcome discovery; no unsafe replacement after restart | Minimal identifier versus confidential payload; server discovery after browser eviction, locator removal rules, blocked storage writes. First Owner-register policy and connected design are approved; encrypted recovery/runtime readiness is still required before changing current online writers. Other per-operation D-011/D-012 policies and designs remain separate. |
| LF-P05 synchronization/completeness | Finite page bootstrap with resume and manifest; review versioned changes/tombstones or honest bounded replacement; foreground preemption | Manifest/change-query cost, cadence, cursor lifetime, coherent snapshot, mixed versions, active subscription, cross-tab leader, metrics. Values chosen from representative measurements, not copied from Shift. |
| LF-P06 future sensitive domains | Separate finance/payroll/medical/media/feedback local views and unlock requirements when those capabilities exist | No financial implementation/queue/approval, child data import, real data, notifications or native release authorized by this plan. |

No disconnected client can learn instant server revocation or be guaranteed remotely erased. The selected retained-read direction has no proposed24hour cutoff;30day-without-verification replica cleanup and the reviewed same-account device/key lifecycle bound its exposure; server commands still check current authority. Known denial/scope change hides/invalidate immediately and cancels late data; local cleanup failure locks the namespace and provides recovery rather than pretending cleanup succeeded. Offline reopen never extends an issued access expiry. A failed renewal must not silently transform unauthorized data into an allowed offline store.

For browser storage, encryption at rest can help some threats but same-origin script/XSS with an available key can still read it. Protect CSP/dependencies, minimize fields/indexes, lock key access, prohibit private logging, and independently review key derivation/wrapping/unlock. Do not promise personal iPhone Keychain guarantees or claim localStorage/IndexedDB itself is encryption. Do not repurpose Clerk session tokens as encryption keys or persist credentials in the data store.

## 7. Persistent reading and requested offline editing are separate delivery gates

**Read-first tranche:** approved datasets persist and reopen locally; network sync updates them. Missing ranges stay unavailable; existing online commands refuse disconnected submission. App shell/public assets must also be available for an actual offline cold launch; having IndexedDB rows alone does not prove that a force-dynamic authenticated route can boot disconnected.

**Requested write tranche:** the Owner wants offline edits, not a permanently read-only local app. Prepare the first domain packet under the [offline-edit contract](../04-engineering/offline-edit-and-conflict-contract.md); only an explicitly settled domain may journal an encrypted local draft/operation and say Saved on this device. A locally captured mark is not server-recorded attendance. Preserve deadlines/authority/publication snapshots, exact packet IDs/hash/base version, queue dependencies, rejection/conflict UI and immutable receipt/audit. Publishing, grants, security changes, payment and approval never join a generic offline queue. The broad offline-edit direction does not settle each command’s deadline, conflict or reviewer authority. Local timestamps cannot silently replace expected server versions.

Service worker/PWA scope is separately reviewed: cache versioned public shell/assets, never blanket-cache authenticated HTML, API responses, private files or bearer URLs. Define upgrade/rollback, logout/account switch and offline deep link behaviour. Native iOS/Android/macOS/Windows remain optional later platforms; web can implement durable local read/sync and some approved offline workflows without them. Background execution guarantees remain platform-specific.

Official references checked2November2026: [IndexedDB transactions and upgrades](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB), [storage quota/eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria), [offline/background limits](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation), [Web Crypto cautions](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API). Browser storage can be cleared/evicted and persistence requests are not universal guarantees; test declared browsers/devices. These references are capability guidance, not AcademyOS runtime proof.

## 8. Request/cost and usability budgets

Declare a profile: dataset/coverage, initial versus reopened store, app/store schema, role, browser/device/network/region, concurrent tabs and cold auth. Count local queries, API calls, RPC/SQL work, rows/bytes, limiter evaluations, failures/retries, queue work and sync waste separately. Cached pixels, local records and server-confirmed values are different observations.

For a dataset of N rows with permitted page P: first preparation costs manifest + ceil(N/P) snapshot pages + completion checks, plus essential task/auth reads unless legitimately shared. A completed unchanged revisit should cost local reads + bounded current-access/manifest checks, **zero dataset pages**, not zero total requests. A delta costs bounded changed pages; a replacement can cost all collection pages and must disclose that. Actual P and completion overhead follow existing/new reviewed contract, not these symbolic formulas.

Keep existing useful-task p75≤3seconds, local feedback p75≤200ms, ordinary online read p95<800ms and CLS≤0.1 as targets on declared profiles. Add separate cold IndexedDB-open, unlock, local-query and resumed-import timings; local-first is not passed from a zero-request trace that exposes stale/forbidden data or loses input. No achieved percentages or native→web timing equivalence are claimed. Do not remove rate limiting/security or quietly add paid services to meet budgets.

## 9. Execution route and exit evidence

| Existing work | Revised bounded output |
|---|---|
| EX-10 current | Shift source/evidence review; this reconciled target; entity/device/access/sync policy packet and updated connected local-first changed-state design. Old v1 not awaiting approval. Record exact accepted scopes, never repeat the misunderstood summary-only question. |
| EX-02 | Stable scoped workspace/repository boundary and navigation; retain dirty/unknown guards, current source API behaviour and root identity integration. No hidden mounted copy of every page. |
| EX-06 | One typed local repository + durable adapter/key/unlock lifecycle + local subscriptions and exact compatible read/sync owner. Review storage/migration/leader failure before private runtime enablement. Query memory alone does not complete this row. |
| EX-04 | Requested task first; resumable permitted directory/month bootstrap; scope/version/completion manifest and measured changes/replacement transport. Preserve deployed Owner current-calendar1read and signed domain contracts. |
| EX-03 | Durable online-operation identity, storage-full/cleared/crash/account-switch recovery and original outcome; no offline write queue unless separately accepted. Develop recovery with the storage architecture, not after data loss. |
| EX-11 |18-player/40-date connected Owner run plus reopen/restart, unchanged/changed sync, multi-page permitted directory/month, offline read lease and denial, cross-tab/scope/deletion/migration/storage failure. Repeat role-specific coverage before broad acceptance. |
| EX-07 | Continue approved Charcoal workflow parity on the accepted data/lifecycle pattern. Existing functional and visual approvals retained. |
| EX-05/08/09 supporting | Query/manifest/change-feed/cost measurements, physical/browser/source/hosted evidence, and current-pilot privacy/device/retention choices alongside implementation. Private local persistence is now core target, not deferred wholesale behind future native/offline writes. |

Repository documentation is updated now; private runtime implementation awaits exact dependent policy/design/architecture readiness. No need to reopen every business rule or redo the entire approved visual design. The current app remains online/no-private-dataset-persistence until implemented and verified. Old narrow fixes are useful, retained and incomplete evidence, not wasted work.

## 10. Required acceptance before claiming this model works

- No full directory/month download on ordinary compatible reopen when server versions are unchanged; show the same data with bounded auth/manifest overhead measured.
- Complete permitted directory and month achieved across pages with continuation; local index can browse/search covered rows without networking; incomplete range never says no records.
- Interrupted page import/restart resumes compatible checkpoints; snapshot mismatch preserves prior complete generation; deletions/withdrawals/scope losses propagate safely.
- Atomic local rows+coverage+watermark; crash before/after transaction, quota eviction, corruption, missing/wrong keys, migration/versionchange-blocked tab and rollback tested.
- Same-account unlock and logout/scope switch policies enforced; known-denied local store cannot repopulate via late reply; cross-academy/role/child fields and indexes isolated.
- Current online write rules, exact signed reviews, expected versions, all-or-nothing program/register saves, stale/concurrent rejection and unknown operation fences preserved; local read test cannot waive them.
- Current input/scroll/focus/modal remain stable under sync; quiet failures show last-synced/coverage state without fabricated success or blocking unrelated useful work.
- Active background tasks yield/cancel/coalesce; multi-tab leadership loss/reconnect and expired change cursors work; continuous closed-app execution not promised.
- EN/AR/RTL,320/360/390/tablet/desktop/200percent zoom and physical offline cold/warm resume matrix recorded separately from emulation/synthetic failures.
- Separate design approved, implemented, locally tested, deployed, hosted verified, Owner accepted and independent security. Current review creates no new runtime/hosted pass.

The [reconciliation handoff](../07-handoff/local-data-sync-reconciliation.md) and generated continuation prompt route the next checkpoint. Persistent memory is not changed by this task; repository documents remain authoritative.
