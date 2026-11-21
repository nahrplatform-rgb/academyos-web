# Attendance, corrections and offline recovery

## Current register and installed integration — 6 November 2026

The accepted Owner one-register policy/design now has [scoped hosted pilot evidence](../07-handoff/owner-register-window-and-hosted-checkpoint-2026-11-04.md). Current EX-07 [normal Attendance integration](../07-handoff/ex07-normal-attendance-integration-2026-11-05.md) reuses that mechanism in the ordinary task. Earlier dated online-only/inactive descriptions below retain their historical scope; they do not reset that delivered subset or approve other offline commands.

The [PWA contract](../06-delivery/pwa-delivery-and-readiness.md) carries the same atomic durable save,original ID,current server access/version/deadline checks and retained conflict/recovery into installed contexts. Keep Saved on this device separate from Synced; no universal queue or freshest-device-time overwrite. Installation does not create Trainer offline authority or cover unprepared registers. Installed launch/update/storage/concurrency cases remain planned and distinct from the existing register/browser checks; app-managed cleanup protects pending work,while destruction of its only local copy cannot be promised recoverable.

## Retained first offline policy/design checkpoint —3November2026

The Owner accepted the first Owner/personal-device register policy and approved its connected design: selected new marks save locally together, upload together under the original ID, retain current access/version/publication/deadline checks, and keep conflicts/refusals as Needs review. Protected pending work survives30day/logout read-copy cleanup for the same verified account. No inactivity lock or24hour read cutoff. [Accepted policy](../04-engineering/offline-edit-and-conflict-contract.md), [approved design](../06-delivery/offline-register-decision-design.md), [remaining runtime/key dependencies](../04-engineering/offline-register-runtime-readiness.md). At that3November checkpoint, app commands were online and private implementation/runtime evidence was pending; use the later current-status receipt above for subsequent delivery. Earlier general future examples below do not supersede this accepted narrow slice.

## Persistent local data and synchronization — LF-v2,2November2026

Persistent local reading/reopening of a permitted register is separate from offline capture. Current marks/corrections/QR remain online authoritative until an exact D-011/D-012 queue rule is accepted. A downloaded roster cannot grant marking authority; local pending is never server recorded. See [local-data and sync plan](../06-delivery/local-data-and-sync-plan.md). Existing implemented and future boundaries are unchanged.

Requirements: AO-035–046. Attendance windows, grace periods, checkout, correction authority and offline policy are D-011/D-012. The proposed first pilot is online attendance; offline is enabled only after its separate acceptance gate.

## Online attendance contract

An assigned trainer or authorized operator opens a dated session and sees an eligible roster, current saved attendance and the session's capture window. A scan or manual mark submits session, player/staff target, attendance intent, client event ID, expected version and captured time. The server derives actor and academy, validates current assignment, roster, archive status and policy, and records server-received time separately from the claimed client time.

Attendance states and transitions must be configured explicitly: for example unmarked, present, absent, late and excused, with checkout if selected. These examples do not approve lateness calculations or absence billing. A person has one canonical attendance record per target/session; subsequent events form an audit history rather than duplicate rows.

Only show unqualified server “Saved” after receiving a committed server receipt. The accepted offline slice separately says “Saved on this device · Awaiting sync” after an actual durable local commit; it must never imply server recording. A timeout means outcome unknown. Query the operation before retrying with the same key. Invalid QR, wrong session, archived player, closed window and revoked trainer assignment produce actionable, non-success states. Manual entry must enforce the same constraints as scanning.

## Corrections

A correction request records target attendance ID, old value/version, proposed value, reason, requester and evidence reference if permitted. An approver must hold the specific correction capability and applicable scope. The approval transaction changes the attendance record and correction state together, with both actors in the audit record.

Reject a stale correction when the underlying attendance changed. Deny foreign-academy evidence/targets. A failed attendance update cannot leave an “approved” correction with unchanged attendance. Rejection records a reason and preserves the original event. Downstream payroll or billing recalculation is an explicit event with its own reconciliation status; previously posted money is adjusted, not silently rewritten.

## Offline eligibility and local data

Before private offline enablement, finish the exact remaining device/unlock/key/data-class rules. First Owner-register conflict and protected-pending cleanup choices are already accepted; do not invent a lease or pending-expiry period. A previously authenticated, permitted trainer may prepare a minimal roster for selected sessions. Offline access is a limited local convenience, not a new server authorization. Final replay always uses current server permissions and policy.

Store identity, academy, session, operation ID, payload version, payload hash, captured time and local sequence on every queued event. Cache only necessary display/roster data. Exclude financial records, identity documents, unrestricted medical information and private exports. IndexedDB durability and browser eviction must be disclosed; browser storage is not equivalent to a native secure vault. Encryption alone does not protect data from code running in a compromised signed-in browser.

## Durable queue and truthful UI

Queue states: draft → writing locally → queued → sending → acknowledged; branches: retryable failure, conflict, denied, expired or needs review. Show “Queued on this device” only after the IndexedDB transaction completes successfully. A storage quota error, unsupported database version or failed write leaves an explicit unsaved state.

The service worker and page use a shared versioned queue schema with a migration path. A new release cannot strand an old queue by opening an obsolete database version. Queue upgrade tests begin with real previous-schema data. Closing/reopening the browser and switching between old/new tabs must not corrupt events.

Batch replay returns one result per operation ID, with committed receipt/version or a precise failure code. Match acknowledgments by ID and payload hash, not array order or overall HTTP status. Remove a local item only after a matching committed receipt has been durably recorded. A missing, duplicated or unknown acknowledgment preserves the item and raises a reconciliation issue.

## Reconnect and conflict handling

Reauthenticate if needed, verify the original identity and academy, then replay with bounded batches and retries. Separate independent commands do not silently discard one another. The accepted register is one atomic command: one failed selected mark refuses that whole register upload, retaining every selected choice for review. If the membership was revoked, keep the local result available only under the approved retention/recovery policy; never submit it using another person's session.

Conflicting online/offline edits show the local intent and authoritative current value to an authorized reviewer. Do not apply “last client timestamp wins” to attendance. Device clocks may be incorrect. A committed duplicate returns the earlier receipt without creating a new attendance event. A lost response followed by another retry remains exactly one business effect.

The tray displays queued, syncing, saved, conflicted and failed counts, last confirmed sync and a retry action. It explains that a device-only record is not yet visible to the academy. The trainer can navigate without a full-screen blocker, but unresolved records remain discoverable.

## Acceptance gate

Test actual browser/device offline mode, airplane mode on supported phones, app/tab closure after local acknowledgment, storage exhaustion, expired login, removed assignment, mixed batch outcomes, altered acknowledgment ordering, duplicate submission and interrupted schema migration. Browser automation that merely mocks a failed request is useful but does not prove physical offline recovery. Keep that evidence separate.

Recovery must demonstrate no silent lost marks, no cross-account replay, no unauthorized accepted mutation and a human-resolvable conflict. Until these pass on the declared device/browser matrix, label offline capture unavailable rather than promising it from a cached screen.
