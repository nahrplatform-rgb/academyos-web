# EX-04 bounded coherent Owner-register download

**Current staging review policy — 4 November 2026:** [SDR-01](../00-governance/staging-delivery-and-review-policy.md) defers independent human/external security review; it is not a prerequisite for currently authorized synthetic staging work or otherwise-authorized private activation. Keep actual engineering checks, custody/configuration, explicit activation/access authority and unexecuted evidence separate. Earlier reviewer/disposition waits below are historical and superseded; no review is marked passed.

3 November 2026. Authorized outcome: extend the [inactive typed register repository](local-register-repository-contract.md) with a read-only server transfer contract and actual disposable-database/browser proof. Existing Owner register/read designs govern; no new product workflow, access grant, key enrollment, recording rule or private enablement is approved here. Current Calendar1-read work and all online attendance writers remain unchanged.

Joins: IMP-J12-A01 / J12-A01–A03 / S28 / AO/AT-035,036,042,045 / L08 / SEC-J12; cross-cutting WB-06/09/10/12/14/15/17/18/23/24; NR05/06/07/14, G03/G08/G09. The [local-data plan](../06-delivery/local-data-and-sync-plan.md), [request standard](../06-delivery/request-hygiene-and-offline-standard.md), [offline-edit contract](offline-edit-and-conflict-contract.md) and [security gates](journey-security-review.md) remain authoritative.

## Current gap and chosen mechanism

`a10_roster_v1` returns at most50players/32KiB and per-player mark versions. Separate calls can observe different committed states. A completed local page counter does not establish a coherent roster. Current public RPCs use short academy locks and current subject/membership/publication checks; do not hold a database transaction across network requests.

Choose a stateless signed chain, reusing the existing gateway/current authority and reviewed-window signing pattern with a distinct purpose. A manifest hashes one event's bounded header/rows; pages extend a signed cursor/count/row-digest chain; completion compares both that chain and a fresh bounded server fingerprint. A changed row already transferred, a later row change, withdrawal, wrong role or revocation prevents activation. Changes after completion are ordinary subsequent synchronization, not an instant-revocation guarantee.

Avoid a whole-roster hash on every page, persistent server snapshot copies, new revision triggers/counters, Realtime and a generic cache. This first contract uses bounded replacement, **not deltas**. A manifest still scans/hashes at most1000rows and must be measured; it is not O(1) SQL just because its response is small.

## Interface and bounds

- New versioned read RPC `x17_register_download_v1`: `manifest`, `page`, `complete`. Exact request parser; no client actor/role/branch authority. The new API is closed by default and has no product caller. No hosted schema or environment changes in this checkpoint.
- Current verified Owner and current published occurrence are checked on every request, before releasing data or accepting a cursor. Preserve issuer/method/path/caller HMAC, private-table ACL/RLS, same-origin/no-store, streamed input/output bounds and fail-closed rate controls. The established private-schema RPC entry needs a constrained SECURITY DEFINER with empty search_path and explicit ACLs; it is not a permission-error workaround. Helpers are invoker/private and uncallable by ordinary users.
- One event, at most1000rows, ascending UUID cursor; pages≤50rows with byte trimming; total response<32768UTF-8 bytes. Only the existing minimal Owner roster header and player ID/name/status/version are transferred. No private notes, history, contacts or unbuilt fields.
- Explicit UTF-8 length-framed header/row hashing avoids JSON whitespace/key-order differences. Signature binds subject, academy, event, revision, header digest, rolling digest, exact counts/cursor and phase. Its key is the existing domain-separated signing secret, never a device encryption/recovery key.
- Transfer receipts have a600second protocol validity; this is **not a local-read cutoff or data retention timer**. Expired receipts keep staged rows and previous complete coverage. A fresh current manifest can issue a checked prefix cursor for the same revision; a changed revision requires bounded replacement. No new login/unlock prompt.
- A compatible complete local revision uses one current manifest and zero data pages when unchanged. A fresh nonempty download uses one manifest + bounded pages + one completion. Resume uses one manifest/prefix verification + remaining pages + completion. No automatic endless restart/retry or periodic polling. Closed-browser execution is not promised.

## Repository/coordination boundary

Stage rows, cursor and receipt together. Even the final page stays staged until server completion and local exact header/rolling-root/count checks pass; then switch the active head atomically. Empty coverage also needs completion. Preserve the prior complete generation, selected local original intent and dirty input on failure. The receipt is encrypted metadata, not a public URL or an authority cache.

One scoped coordinator coalesces the same event within its owner lifetime and uses scope cancellation plus repository fences. Compare-and-swap prevents competing connections from silently replacing another transfer; cross-tab scheduling/leader adoption remains a separate integration gate. Reconcile original writes separately; never call the cancelling attendance `reconcile` endpoint during download recovery.

## Required evidence and remaining gates

Prove actual PG17 authorization/signature/expiry/pagination/coherence and real browser encrypted staging/reopen/resume/atomic activation, using only fictional identities/data. Test changes before/after transferred rows, same-count corrections, malformed/mixed/foreign receipts, wrong roles/academies/current revocation, publication changes, corrupted storage/commit abort, empty/1000Unicode rows, repeated unchanged checks and interruption/cancellation. Measure page/manifest/query/row/byte work; app/provider/physical timings remain separate.

Read-only references rechecked: Shift staging `PersonalScheduleDownload.download` stages bounded pages and checks the final snapshot/access before publishing a baseline; PYSA EV-0041/EV-0116 show why request success and local queue helpers are insufficient proof. Retain the workflow idea, not native Keychain, personal leases, deleted legacy-store behavior or fixture claims as hosted evidence.

Primary docs checked3November: [PostgreSQL snapshot semantics](https://www.postgresql.org/docs/17/transaction-iso.html), [Supabase function authority/ACLs](https://supabase.com/docs/guides/database/functions), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security). Supabase changelog index and database breaking-change notice were consulted; no platform/engine upgrade is part of this work. The plain disposable PostgreSQL harness does not establish hosted advisors/Clerk/PostgREST/runtime behavior.

Real authenticated key custody/registered device/field epoch, exact fields/index and confirmed-payload lifecycle, trusted30-day cleanup, live original transport, actual UI adoption, hosted/device/load and independent security remain gates. No private app activation or agent promotion. [Implementation/evidence and exact limits](../07-handoff/register-download-checkpoint.md) are now recorded; scoped completion cannot close all EX-04 collections/roles or the57working-day cases.
