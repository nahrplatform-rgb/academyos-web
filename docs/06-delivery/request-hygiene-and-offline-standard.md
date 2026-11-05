# Request hygiene, persistent local data and explicit offline support

**Full-app creation rule — 5 November:** follow the [domain adoption map](local-data-and-sync-plan.md#full-app-adoption--5-november-2026). New settings, finance and future modules include normal-route local coverage, permitted offline behavior, automatic bounded preparation/quiet sync, cleanup and original recovery in their creation scope. Do not call a module complete from an online screen/endpoint or make first-slice summary exclusions permanent. [EX-13A contract/evidence](../07-handoff/ex13a-baseline-and-dataset-checkpoint-2026-11-05.md) supplies the first engineering slice without claiming a runtime fix.

**Latest Owner review/role direction — 4 November 2026:** [Current staging policy](../00-governance/staging-delivery-and-review-policy.md) defers independent human/external security review without blocking any currently authorized synthetic staging work, including otherwise-authorized private offline activation. Keep actual engineering checks, access/configuration authority and separate acceptance. Follow [the dedicated-role plan](staging-role-separation-plan.md): distinct Platform Owner and Academy Owner accounts/journeys first, controlled cleanup preserving history; no account/data mutation is authorized or executed by this documentation update. Earlier external-review prerequisites below are superseded, not marked passed.

**3November device UX:** normal email/password sign-in, without mandatory passkey enrollment or a separate local secret. Follow the [automatic protection/recovery contract](../04-engineering/offline-register-device-key-contract.md). Key provisioning/recovery must not add one request/prompt per navigation; current server checks and protected same-account recovery remain. This is the selected experience, not completed private runtime/security evidence.

## Latest local-first direction — LF-v3,2November2026

Owner now requests retained permitted month/three-month datasets **and locally saved offline edits with reconnect synchronization**. No inactivity lock or proposed24hour read cutoff. Read-replica cleanup after30days without successful online verification or explicit logout is selected; pending operations/unsent edits are a separate recovery class. Read [the canonical plan](local-data-and-sync-plan.md) and [offline-edit/conflict contract](../04-engineering/offline-edit-and-conflict-contract.md). Exact device/key/field and per-command deadline/conflict/logout design remain gated; timestamps alone cannot decide competing edits. Current online commands and prior business/security evidence remain unchanged until each accepted slice is implemented. Historical online-only-target statements below are superseded at the direction layer, not retroactively changed runtime facts.


## Current direction — LF-v2,2November2026

The Owner clarified durable local datasets across visits and progressive background preparation/change synchronization. Read the [canonical local-data plan](local-data-and-sync-plan.md), [Shift iOS reference review](../04-engineering/shift-ios-local-data-reference-review.md), [working-behaviour contract](../03-design/academy-working-behavior-contract.md), [working-day acceptance](academy-working-day-acceptance.md), [planned cases](academy-working-day-cases.csv), [execution guide](experience-execution.md) and [tracker](experience-execution.csv).

This replaces the unaccepted summary-only/30second/5minute/intent-only pilot recommendation. Persistent private data is now a core **target**, not wholesale future work postponed until native apps. Exact trusted-device/access/fields/retention/key/sync choices remain LF-P01–LF-P06 review gates; no runtime store, offline authority, generic write queue or telemetry is enabled by this standard. Current source still uses signed no-store APIs. Historical31October findings/costs and previous scoped fixes remain evidence; no parent finding is closed here.

## Authority and boundary

Preserve current server authority, tenant/field/relationship isolation, bounded retrieval, signed complete preview chains, all-or-nothing commands, immutable audit, idempotency and original-operation reconciliation. Existing deadline/payment/publication/recipient/card checks remain canonical. A local replica never authorizes a command or invents a membership. Finance, Manager/Player, media, real-data and production scope are not inferred from this direction.

Local read reuse, durable record replication, local drafts and offline mutation queues are separate capabilities. Known denial locks/discards incompatible views and late responses under policy. A disconnected device cannot learn instant server revocation or be guaranteed remotely erased; an accepted local-read lease is an explicit privacy trade-off.

## One owner per layer

| Layer | Responsibility | Prohibited shortcut |
|---|---|---|
| Identity/local unlock | Current identity/session plus reviewed same-account device access | Decode a cached token as new authority, reuse another role's store, extend offline expiry on reopen |
| Workspace/router | Stable shared frame, orientation, safe Back/Forward/focus/scroll and dirty/unknown guards | Full document navigation for routine tasks; remount identity provider as a guessed fix |
| Scoped local repository | Indexed visible-range reads, protected durable records, schema/field-policy/scope epochs, transactional coverage | Global private store, full-history decode for one view, plaintext private localStorage |
| Read/sync coordinator | In-flight/refcount ownership, bootstrap/checkpoint/completion, manifest/change pages, task priority and multi-tab coordination | Per-component full downloads, overlapping listeners, unbounded retry/polling, falsely complete partial import |
| Domain command/recovery | Exact intent/version/review/operation identity, receipt and unknown fence; separately approved future outbox | Generic mutation retry or replacing an unknown operation after route restart |
| API/gateway/DB | Origin/body/rate/caller proof, whitelist, current resource/field authority, bounded queries, atomic result/audit | Public private-response cache, privileged bypass, client role/TTL as permission, ignored SQL scans |
| Jobs/providers | Explicit durable side-effect jobs | Navigation-driven emails, billing, backups or provider calls |

Scope keys include environment, subject, academy, capability/branch/link, projection/field policy/schema, resource/collection/window/filter/cursor and authoritative revision where applicable. Labels partition; the server authorizes. Key rotation/migration must not strand outcome discovery. No tokens, private payloads or signed URLs in diagnostics.

## Bootstrap, local reads and quiet synchronization

1. Establish permitted scope/local unlock. First use downloads essentials first and prepares remaining approved pages in finite sequences. Later use opens compatible covered records locally, then performs bounded access/version checks under accepted policy.
2. One compatible owner handles initial/repeated/returning consumers. Same-key in-flight work coalesces; a departing subscriber cannot abort another's required read. Client abort does not prove backend cancellation.
3. Selection/filter/language over covered local data needs no operating request. Distinguish not downloaded, complete-empty and filtered-empty. Query TTL is not durable retention or authorization.
4. Approved complete directory/month replication may walk every finite page, with bounded requests/rows/bytes/concurrency, progress and checkpoints. This is not unlimited whole-app preloading. Do not decode every disk record into React memory for search.
5. Persist page/checkpoint atomically; validate snapshot/order/count/cursor; activate complete generation after final proof. Failures preserve prior valid data; complete-empty avoids repeated downloads.
6. Compare bounded manifest versions; unchanged complete datasets do not redownload. Changed data uses reviewed deltas/tombstones or honest bounded replacement. Changes/watermark commit together. Same-timestamp, deletion, scope-epoch and expired-cursor cases are required.
7. Refresh is nonblocking where local access permits. Preserve input/focus/modal/scroll; lock/key/denial overrides reuse. Sync cannot overwrite dirty basis or unresolved intent.
8. Own commits apply only validated full projection/receipt or precise invalidation. Receipt-only responses/loaded-page lengths cannot invent full records/totals. Home/Calendar/People/register joins must be explicit.
9. Coalesce foreground/visibility/reconnect/manual work. Bound backoff/retries; no guarantee while suspended/closed. Do not copy Shift's15/60/300second loops.
10. A per-scope tab leader, transactional generations and nonprivate hints prevent duplicate downloads; leadership is not authority. Clear incompatible work and reject late replies on scope change.

Keep current≤42day/50summary Calendar responses and domain bounds until reviewed versioned changes. A busy month can require several pages; completeness is not capped at its first50 rows.

## Architecture choices

| Option | Engineering stance | Required proof |
|---|---|---|
| IndexedDB repository | Candidate web/PWA record/index/coverage adapter; compare native API versus one wrapper | Transactions/quota/key/unlock/migration/multi-tab/browser behaviour; measured local-query/bundle cost |
| TanStack/SWR | Optional transient coordination above repository, not durable replica itself | Configured lifecycle/retries; no competing query-persistence/outbox store |
| Public service-worker shell | Separate offline-boot capability | No blanket authenticated HTML/API/signed URL caching; deep-link/logout/upgrade/rollback checks |
| Memory working set | Small safely disposable indexed result cache | Field/access/freshness invalidation; no5minute eviction of durable/pending records |
| Shared Next/CDN/Redis cache | Genuinely public/versioned data unless separately reviewed | Caller isolation and real request/query benefit; no private RPC output in public cache |
| Request-local server reuse | Remove duplicate internal context/aggregate work with unchanged authority | Equivalent scope/count/fields and measured query plans/work |
| Realtime/polling | Neither added by default | Need, scoped subscription/backfill/expiry/conflicts and cost |
| Durable local writes | Separate per-domain gate; existing writes online | Exact ID/payload/base version, local acknowledgement, replay/receipt/rejection/conflict lifecycle; no optimistic server Saved |

Shift's native Keychain/file protection, personal7day lease and complete personal baseline do not establish safe browser storage for multi-tenant child data. Review key custody, XSS, indexes and shared-device risks independently. Encryption/library use alone is not security approval.

## Per-entity freshness and persistence

The single current table is LD-01–LD-10 in [the local-data plan](local-data-and-sync-plan.md), with LF-P policy fields. The [loading matrix](../03-design/screen-data-loading-matrix.csv) joins each L row while preserving current source bounds/evidence. Do not maintain competing accepted TTL tables.

Separate current-authority freshness, local access expiry, dataset watermark/coverage, memory lifetime, disk retention, pending-operation lifetime and change-cursor lifetime. Last sync time proves none of the others. Unknown history/unbuilt finance is unavailable, not zero. Current source/earlier receipts are not durable-storage proof.

## Original-operation safety and offline capability

Durable reads do not solve a lost write reply. Persist the reviewed original-operation reference/payload before dispatch where required; verify storage before claiming durability; reconcile the original ID after restart under current authority. Unknown operations cannot expire into replacement because a query cache/access lease expired. Same-account recovery, foreign-account isolation, storage-loss discovery and immutable receipts need tests.

Attendance, corrections, grants, invitations, publication, money, security and approvals have different rules; none joins a generic queue. Later approved offline capture must distinguish Saved on this device / Awaiting sync / Conflict / Rejected / Server recorded. No automatic Unmarked→Absent.

On corruption/full/eviction/missing key, retain current input/recoverable pending evidence, fence unsafe writes and explain unsupported recovery. Do not destructively reset or evict pending journal work as disposable cache. Migration/older-tab/downgrade must preserve discovery or fence writes.

## Findings and execution

All 17 findings and G01–G09 remain tracked. The [current tracker](experience-execution.csv) selects EX-13A. The scoped EX-11 pilot passed. EX-13B proves normal Owner Players/Calendar and EX-07 applies the standard across remaining implemented journeys. EX-05/08 measurements and EX-09 custody/current-access work accompany affected stages. The [refresh baseline](../07-handoff/refresh-root-causes-2026-11-05.md) separates document navigation, route mounts, in-view masking and post-write reads.

Earlier navigation/visible-return/cold Calendar fixes remain useful but do not implement this model. Historical effort estimates/memory-only recommendations are not current routing or renewed delivery promises.

## Definition of Done

- For every affected implemented page and common action, record cold entry, warm Back/Forward, return/reconnect, routine local click and confirmed/unknown save where applicable. Count document transitions separately from API work and record blank intervals, visible feedback, focus, scroll, selection and input continuity. An online-only journey has the same stable-view obligation.
- Exercise held responses with the [working-day cases](academy-working-day-cases.csv) for navigation, return, local versus server-backed controls and post-save updates (WD-68–WD-71). Preserve dirty/unknown guards and distinguish required authority masking, revalidation and first loading. Check that an obsolete response cannot replace the current view.
- On approved prepared-device paths, prove normal-route reopening online and offline without repeated preparation or sync controls. Confirm zero operating requests for covered local interactions, zero dataset pages on unchanged compatible reopening, and one coalesced scoped check when policy requires one. Demonstrate progressive preparation and one changed/removal transfer separately.
- For supported edits, verify a durable local acknowledgement, automatic reconnect or next-launch replay, original-ID recovery and a validated server outcome. Keep uncertainty or a real conflict on the affected task. Track the pending count separately from connectivity.
- Declare IMP/J/S/AO/AT/L/security joins, dataset/field/scope/local-policy/coverage/bounds and source/PYSA/Shift reference before build.
- Prove first finite bootstrap, interrupted/resumed pages, unchanged reopen with0dataset pages, changed upserts/tombstones or honest replacement, expired cursors and source changes during import.
- Keep input/focus/scroll/modal/Back/history stable under sync; EN/AR320/360/390/tablet/desktop/200percent zoom and long names.
- Test two academies/accounts, wrong role, ended link, revoked assignment, expired invitation/lease, late replies and known-denied purge/lock including indexes.
- Test atomic rows+checkpoint/watermark, leader loss/concurrent tabs, corruption/missing key/blocked upgrade/downgrade/quota/eviction and original-operation discovery after restart.
- Preserve atomic/idempotent commands, signed reviews, versions/receipts/audit and unknown fence. No weakened assertions or fake local/server success.
- Measure local unlock/open/query versus network checks, API/RPC/SQL rows/bytes, limiter/provider costs and retry/waste.≤3s useful p75/≤200ms local p75/<800ms online-read p95/CLS≤0.1 are declared-profile targets, not passed results.
- Prefer existing redacted diagnostics/isolated counters; no new telemetry sampling/retention or private payload logging without review.
- Keep design, implementation, local, deployed, hosted, Owner acceptance and independent security separate. Shift tests cannot pass AcademyOS operating cases.
- Update tracker/generated prompt, canonical joins/matrices, factual actual-component review where affected and reconciliation map. Deployment/document publication alone closes no finding.


3November scoped implementation reference: [coherent register transfer](../07-handoff/register-download-checkpoint.md) demonstrates why page counts alone do not prove coverage: signed cursor/digest, bounded final server check, staged-row re-hash and atomic activation are required for this contract. First preparation and unchanged checks have distinct measured costs. Reuse the pattern only within its exact field/authority/size gates; no global preload or private activation is approved by library proof.
