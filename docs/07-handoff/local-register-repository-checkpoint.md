# EX-06 typed Owner register repository checkpoint

3 November 2026. **Implemented and locally tested, inactive in the product.** [Contract and security boundaries](../04-engineering/local-register-repository-contract.md), [source-bound browser receipt](evidence/local-register-repository-2026-11-03.json), [single execution tracker](../06-delivery/experience-execution.csv). This completes the declared fictional-data storage checkpoint, not full local-first delivery or private enablement.

## Delivered behavior

The new [typed repository](../../apps/web/src/lib/local-register-repository.ts) and [domain codec](../../apps/web/src/lib/local-register-codec.ts) use the existing register validator and count-only receipt. Actual browser storage now supports encrypted indexed roster pages, resumable staged imports, complete-generation activation, exact immutable local save/selected-row overlay, indexed original discovery, Unknown dispatch, retained Needs review, atomic receipt settlement and current-read invalidation. The command packet/selected marks are the local overlay; server rows/totals are never changed optimistically.

It reuses the [shared crypto primitives](../../apps/web/src/lib/local-register-crypto.ts) with the prior isolated automatic-key research. Key material never enters a general query cache, URL, log, password derivation or credential API. Scope binds environment, subject, academy, Owner-register capability, device, epoch and opaque namespace. Local labels are not authorization; the key authority in tests is fictional HTTP, not Clerk/current database authority or protected server key custody.

Logout/invoked30-day cleanup removes replicas/read keys/cached recovery keys but retains separately wrapped originals. Cleaning is durable before removal; failed cleanup remains blocked across reload. The remaining device key can open only the outer wrapping layer, not recover the pending data key. Original-account recovery requires the right server recovery material. No passkey, extra password, idle lock or24-hour cutoff is added.

Every acknowledged write awaits a supported strict-durability transaction commit. Crypto happens outside transactions, with compare-and-swap/fence checks before the short commit. One unsettled original per event is enforced across storage connections. A scope ending immediately after disk commit suppresses the obsolete acknowledgement but retains discoverable work. Incomplete imports never replace the previous complete generation; a local command transition also fences an older import. Missing/corrupt keys/metadata refuse resetting existing work.

## Local evidence

- **38 actual Chromium cases**, including18players/17new marks,1000Unicode players/1000marks in20server-shaped pages, at most50rows per local page, long Arabic names, process restart and30covered offline reads with zero key/operating requests.
- Real transaction aborts at import/capture/settlement/cleanup, competing captures, immutable original replay, exact receipt count/event/op checks, two separately activated fictional academy/account namespaces, wrong device/subject/epoch, cryptographic wrong-key/tamper refusal, late activation/decryption/commit acknowledgement, strict-durability refusal and version-change/downgrade fencing.
- The prior **16automatic-key mechanism cases** were rerun after extracting shared crypto, with their assertions retained. The mechanism fixture/harness is bundled rather than importing test authority into the app.
- Existing **91app unit tests**, production build/type checking and lint passed; final structural/generated/factual review results are recorded with this checkpoint. Exact-source CI is recorded separately after push. The previous `f266aab` passed both [41623694335](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/41623694335) and [41623686209](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/41623686209).

The test initially expected the existing validator's exception class name, but that class reports a generic Error. The adapter now maps that exact validator refusal to a stable `invalid_register` code; malformed input remains rejected. A schema test initially referenced a handle cleared by an earlier page reload; it now explicitly reopens that handle before verifying actual version-change disposal. Neither issue changed accepted business results or weakened an assertion. Review also added first-ever activation fencing, stale-import-versus-receipt checks and separate local/API byte bounds; their new regression assertions pass. No deployed bug was changed by this inactive checkpoint.

Measurements are in the exact JSON, on Chromium156.0.8078.4/Node24.14.0/macOS arm64, isolated headless loopback. They include Playwright round trips. The38-case run measures initial prepare/capture,30local reads,1000-player preparation/mark capture, encrypted envelope bytes, wire bytes and fixture key-response bytes. These are neither app useful-content/provider percentiles nor physical database file size, quota savings or hosted load evidence. The bundle measured is the test bundle, not an added product bundle.

## Current versus target

| Gate | Status / limit |
|---|---|
| Design/policy | Existing read/register designs and login-only UX retained; no reapproval requested |
| Implemented | Inactive typed encrypted repository/codec/shared crypto + test/CI tooling; no product caller |
| Locally tested |38typed browser cases,16shared mechanism cases,91existing units,build/type/lint; source-bound receipts |
| Deployed/hosted | Not enabled or hosted verified; current online app/permissions/API/SQL unchanged; no promotion needed |
| Owner working acceptance | Not requested for an unconnected private runtime |
| Independent security | Open; same-origin available-key exposure, actual key custody/current authority/fields/lifecycle remain |

**EX-06 scoped checkpoint passed; EX-04 is next.** Inspect current roster APIs and design/verify a bounded coherent snapshot/manifest/resume contract before adapting actual private bootstrap. Current roster pages carry individual mark versions but no global snapshot receipt. Repository `complete` means transfer coverage and explicitly reports `coherence: per-row-only`; it cannot establish a simultaneous server snapshot. Do not integrate it into working private UI by skipping that gap.

EX-09 supports real authenticated key release/custody, exact personal-device fields/indexes, trusted verification time/30-day trigger and same-account recovery. EX-03 must wire current-authority original replay and receipt settlement; the existing cancelling reconcile endpoint is never a passive retry lookup. Current online saves stay canonical. No extra credential or generic queue. No real account grant, provider secret, infrastructure purchase, production launch or agent promotion.

Actual forward migrations, real quota exhaustion/eviction/key-loss outcome discovery, closed-app service-worker boot, cross-device sync/leadership, physical/browser coverage and provider costs remain untested here. Known denial/cleanup cannot guarantee instant revocation or erasure on a disconnected device. No WD case or cross-app finding is closed from isolated storage proof. Preserve all57planned working-day cases and prior functional/redesign approvals.

Reproduce with Node24: `node scripts/local-data/test_register_repository.mjs`, then `--check`; `node scripts/local-data/test_automatic_key.mjs --check` verifies the separately rerun shared primitive receipt. Source rollback removes the inactive caller-free adapter/harness; never delete retained originals as a migration or rollback shortcut.
