# Normal-workspace local data, synchronization and installed delivery

This specification connects the full product to the existing [local-data/sync plan](../local-data-and-sync-plan.md), [Owner dataset contract](../../04-engineering/owner-workspace-dataset-contract.md), [offline-edit/conflict contract](../../04-engineering/offline-edit-and-conflict-contract.md), [device-key contract](../../04-engineering/offline-register-device-key-contract.md) and [PWA readiness contract](../pwa-delivery-and-readiness.md). Reuse them; this is not a second cache/queue application or approval to enable every data class.

## Settled experience and important distinctions

The normal permitted Players, Calendar, Attendance and future module screens use compatible local data while online/offline. Device preparation is automatic on accepted prepared paths; useful task content comes first, bounded adjacent datasets follow. Repeated visits reopen compatible retained data and check/apply changes without clearing the whole view. The first Owner directory/month and one-register scopes are delivery slices, not permanent full-product exclusions.

Normal email/password sign-in is sufficient. Do not require passkey enrollment, a separate local secret, per-page unlock or inactivity locking. There is no proposed24-hour offline-read cutoff. **This does not remove the accepted attendance recording deadline of24 hours after session end.** Read-replica logout/30-day-without-verification cleanup and protected same-account pending recovery remain distinct. Current personal-device/shared-device and exact field/capability boundaries remain applicable; no password/token becomes an encryption key.

Do not promise access-revocation detection while a device is disconnected, guaranteed durable browser storage or continuous execution while closed. Known current denial/account change must fence affected data; expired authentication needs ordinary provider-session restoration and is not proof of ended membership. State real platform limits in the relevant task rather than adding confusing extra user rituals.

## Ownership architecture

| Layer | Owns | Boundary |
|---|---|---|
| Identity/authority | Current Clerk session, server-verified membership/capability, accepted local-access policy | Global/local identity and domain authority are distinct;401 is not403 |
| Typed local repositories | Protected records/indexes, account/environment/academy/field scope, schema and complete collection generations | No raw global store access or plaintext private localStorage |
| Storage/key lifecycle | Existing key/slot/custody/recovery, transactions, compatible migrations and quota/eviction detection | No extra passkey/secret; do not clear old slots/originals to bypass binding conflicts |
| Sync coordinator | Task-first preparation, one compatible in-flight owner, revision-bound transfer/checkpoint, changed/removal handling, tab leadership | No component-level duplicate full bootstrap or unbounded whole-app preload |
| Presentation | Small working sets, local subscriptions, context, focused loading, top-bar sync state | Query-library TTL is not a durable data/authority/command contract |
| Domain command/outbox | Approved intent, versions, original ID, atomic local acknowledgement, canonical server send/reconcile and audit | No universal arbitrary write queue, fake server Saved or new ID after unknown outcome |
| Server/API/database | Current scope, bounded read, coherent revision, domain transactions and terminal receipt | Local presence/key never bypasses canonical permission, window or version checks |

Current source anchors: `local-workspace-repository.ts`, `local-workspace-codec.ts`, `workspace-device.ts`, `workspace-device-slots.ts`, `workspace-client-transport.ts`, register repository/dispatch modules, normal Attendance/People/Experience components and their exact APIs. Inspect their tested seams before adding a library or new coordinator. [Source manifest](academy-source-inventory.json).

## Preparation and freshness by data class

The table specifies target behavior and integration gates, not blanket current implementation. Reuse the canonical LD-01–LD-10 field classes and exact current contracts.

| Data | Preparation/read target | Freshness and command boundary |
|---|---|---|
| Context/settings/catalog | Minimal permitted context first; versioned approved settings/sports/labels next | Server authority current for consequential operations; configuration revisions invalidate affected projections |
| Player directory | Requested page/query first; finite permitted directory pages sequentially with complete searchable indexes | Known additions/edits/archive removals refresh the collection; loaded-page search labelled when coverage incomplete |
| Rich profile/relationships | Requested permitted sections; wider preparation only under exact reviewed field scope | Directory summary does not imply contact/medical/identity/Guardian rights or full-profile offline availability |
| Calendar/program summaries | Requested current period first, then approved next/previous months; foreground selection preempts background work | Existing per-response42-day/50-summary bounds; checked complete month generations, not one huge three-month response |
| Register | Accepted prepared roster/session/marks/versions/window fields | Approved Owner offline atomic save and original sender; Trainer/Manager expansion is a separate capability contract |
| Development | Published family projection versus staff draft/review as separate classes | Submitted/published revisions and private reasons protected; scoped drafts/commands require their exact lifecycle |
| Finance/compensation/platform | Permitted monthly summaries and immutable statement sources when their real ledgers exist | Pending local work never means settled/paid/approved; financial operations retain canonical authority and reviewed offline command rules |
| Messages/support/media/export | Permitted manifests/drafts and explicitly selected artifacts | Signed URL expiry is not durable offline access; sending/uploading/approval has current domain gates |
| Preferences | Safe presentation preferences can persist independently | No private record payload, credential or role authority in route/preference storage |
| Originals/unsent work | Durable exact intent and recovery identity across navigation/restart | Not disposable read cache; protected retention/recovery distinct from replica cleanup |

First bootstrap progress derives from checked finite work. Record complete empty collections so repeat visits do not redownload them. A first page, setup revision, timestamp or increasing loaded count is not proof of a coherent complete directory/month. Persist rows plus generation/checkpoint atomically and activate only with validated scope/revision/count/completion. Hold/change/transfer tests must accompany every writer that changes the projection's revision.

## Quiet synchronization and request budgets

On compatible unchanged coverage, avoid dataset-page downloads; scope/auth/check requests still exist and must be counted. On changes, use a real bounded revision/change feed with deletions when implemented, or an honestly declared bounded collection replacement. Do not call key release or an expensive all-row digest a zero-cost delta. Measure query work, bytes, transfer pages and cursor expiry on the declared dataset.

Coalesce launch/resume/online/focus triggers, avoid duplicate mount reads and prevent parallel full transfers across tabs. Foreground task requests preempt optional background work. After a confirmed relevant mutation, invalidate/update only its actual projections and counts, preserving dirty input and unrelated views. A failed panel is unavailable, not zero. An obsolete response cannot update a new account/academy/task. Realtime can supply scoped invalidation where measured need justifies it; no blanket polling/subscription or new service is implied.

Per affected action record first entry, warm return, local click/search, focus/reconnect, save/unknown/reconcile and changed-scope budgets. Keep document transitions separate from API/RPC/SQL/Redis/provider work. Use [request findings](../../04-engineering/request-findings-register.md), [impact model](../../04-engineering/request-service-impact.md) and G01–G09. Existing models are estimates unless measured; reducing a visual flash does not itself prove query/egress savings. Recheck official plan limits and actual configured meters when a new cost decision needs them; do not copy old free-tier numbers into a claim of current capacity.

## Saves, conflicts and timestamps

For supported offline work, commit data and the exact original outbox intent in one local transaction before showing Saved on this device. Reopen/reconnect sends the same original through current signed canonical operations, validates the receipt and then shows Synced. Network success without a matching receipt is unknown. Preserve the original through timeout, process exit, provider-session restoration and lost reply; reconcile before replacement.

Record UTC capture time, server receipt/commit time and expected server version separately. Capture time may be estimated if offline device time is uncertain. Timestamps alone cannot establish causality, safe financial ordering or permission and must not silently overwrite contradictory attendance/ledger/history. Recognize identical results and safe nonconflicting merges automatically where the specific domain contract permits. Genuine stale/conflicting/refused work stays protected with a focused per-record decision; accepted register saves remain all-or-nothing. No user notification is needed for every ordinary quiet sync.

Classify writes explicitly: supported durable offline command; local draft only; current online operation; unavailable/unbuilt. Invitations/access grants/publication/financial settlement cannot become queued arbitrary writes merely because the UI has a Save button. New domain commands need accepted deadline/conflict/retention and exact response contracts. Do not re-ask the already settled overall local-first direction.

## Updates, PWA and device coverage

The current workspace worker owns root scope and the register worker its narrower scope. Inspect both and preserve public-only code shells, protected IndexedDB stores and the original sender. No competing root worker/caching plugin, private HTML/API cache or second offline database. Document code/worker/local-schema/command-envelope compatibility; update safely with dirty forms, pending originals and older active tabs. Never force a reload or reset caches to make an update succeed.

EX-14 delivers manifest/icons/stable permitted launch/install guidance alongside current domain work; EX-15 covers worker/update/storage lifecycle; EX-16 verifies actual installed combinations after relevant slices. Browser and installed containers may have separate sessions, keys and data. Desktop web/PWA, iOS browser/installed and Android browser/installed need declared results. Future native clients reuse versioned domain contracts; they do not justify reimplementing money/authority/sync rules or promising guaranteed background execution.

Required installed checks include normal sign-in, direct/deep launch, preparation, offline restart, reconnect/original outcome, mixed-version update, eviction/quota/storage permission, account/logout/known denial, camera/QR, EN/AR, virtual keyboards, accessibility and actual OS launch. Source emulation or a worker registration does not pass physical/installed cases. Preserve PW-01–09 and WD-72–86 planned/evidenced states.

## Working-day acceptance

An Owner opens Today quickly; browses prepared Players and Calendar; opens the correct register; switches away and returns to the same task; loses network during supported attendance; saves once locally; closes/reopens; reconnects and sees one canonical outcome. Another academy or account cannot see/send that work. A genuine conflict is explained on the affected record. An online-only action explains its connection requirement there. Repeat for the declared role, sport, data volume and device/container coverage rather than claiming whole-app offline from this one day.
