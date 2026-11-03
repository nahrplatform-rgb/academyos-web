# EX-04 coherent register download checkpoint

3 November 2026. **Implemented and locally tested; inactive in the app.** [Contract](../04-engineering/register-download-contract.md), [database receipt](evidence/register-download-database.json), [browser/API receipt](evidence/register-download-browser.json), [execution tracker](../06-delivery/experience-execution.csv). This passes one declared Owner-register transfer checkpoint, not all EX-04 collections/roles, private enablement or working-day acceptance. The earlier [Owner Calendar1-read release](request-remediation-ex04-current-calendar.md) and its distinct hosted limits are retained.

**Delivery recorded:** implementation `a105479`, deterministic-test follow-up `ac485f6` pushed. Both exact-source Foundation runs [41694194844](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/41694194844) and [41694223560](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/41694223560) passed, including actual PG17/Chromium tests on CI. [Delivery receipt](evidence/register-download-delivery-2026-11-03.json) separates GitHub's Vercel build-success report from independent provider/live-alias proof: connector403 and CLI scope failure prevented that inspection. No promotion, hosted migration or private activation occurred. The existing withdrawn development-dependency alert was rechecked without dismissal or dependency change; it is no security waiver.

## Delivered behavior

The new `x17_register_download_v1` read contract checks current verified Owner, academy and published occurrence on **each** manifest/page/completion call. A signed rolling receipt binds the exact header, ascending cursor, counts and row-version digest. Completion recomputes the bounded source fingerprint. No server snapshot table, revision trigger, operating write, audit mutation or key-release endpoint was added. The source migration is **not applied to hosted staging**.

The [API](../../apps/web/src/app/api/register-download/route.ts) is closed unless `LOCAL_REGISTER_TRANSFER_ENABLED=true`; it has no product caller. Preserve that closed default until private-runtime readiness. Same origin, staged environment, streamed4KiB input bound, current identity, exact signed read target, no-store and both existing fail-closed request budgets remain. The added gateway allowlist entry cannot select a write budget. A database receipt is not local access authority.

The [typed protocol](../../apps/web/src/lib/register-download.ts), [repository](../../apps/web/src/lib/local-register-repository.ts) and [scoped coordinator](../../apps/web/src/lib/register-download-coordinator.ts) now stage ciphertext, cursor and receipt together. The final page does **not** activate coverage. Only a server completion plus bounded re-read/hash/count validation of the actual encrypted rows permits an atomic head switch. An empty roster also needs completion. The previous complete generation and pending/unknown originals survive failures. Legacy fixture imports remain explicitly `per-row-only`; the new completed path reports `verified-transfer`.

Each explicit prepare starts with a current manifest. A compatible complete unchanged revision costs one manifest and no pages; an interrupted same-revision import obtains a newly checked prefix and continues. The600second transfer-receipt lifetime is not a local-read cutoff. A changed in-progress source remains a visible `download_changed` failure with staged evidence retained; abandoning only that staged generation is an explicit later task. No automatic reset, write reconciliation, endless retry, timer, polling, credential enrollment or per-page unlock.

The coordinator coalesces same-event work within one scoped owner and rejects late results after cancellation. Repository compare-and-swap rejects competing actual-tab imports and a new local register fences an earlier transfer. This proves storage contention behavior, **not** the future background scheduler/leader, actual Clerk/device key custody or cross-device synchronization. A generic403 is not automatically global membership revocation: the actual authority/lifecycle integration must distinguish a withdrawn occurrence from loss of Owner authority, invalidate the appropriate read scope and retain protected originals. The coordinator deliberately does not perform global cleanup from a network error.

## Evidence and before/after cost

**11 actual disposable PG17 tests** cover manifest/page/completion, unchanged version, wrong Owner/Trainer/Guardian/Manager/Player/Platform role, two academies, revoked membership, unsigned caller/direct helper ACLs, forged/missing/foreign receipts, early completion, changes before/after pages, same-count correction, withdrawal,600second expiry/checked resume, empty/1000Unicode rosters, byte-trimmed long names, source bounds and observed writer/completion locking. [PG/browser UTF-8 vectors](evidence/register-download-vectors.json) compare exact framing across Arabic, CJK, emoji, combining and escape/delimiter input.

**20 actual Chromium cases** run the actual route/protocol/coordinator, disposable PG functions and real IndexedDB/WebCrypto together. Identity, rate backend, server recovery-key custody and PostgREST transport are explicitly test adapters. Cases include final-page staging, unchanged/coalesced reads, failed final transaction/retry, refresh with a50-row checkpoint, changed-source refusal, current revocation plus explicit lifecycle quarantine, missing staged rows, scope cancellation, two actual tabs, a concurrent local original, empty coverage and1000players. Raw metadata contains neither names nor signed receipt/attendance payloads; credential APIs and external browser requests are zero. This does not establish real provider authentication or security approval.

The final local sample uses macOS arm64, Node24.14.0 and headless Chromium156.0.8078.4, loopback with a new psql process/connection per RPC. No network throttling; synthetic data. Values include fixture/Playwright round trips and are **not** hosted percentiles or app useful-content timing:

| Observed1000-player operation | Requests | JSON response bytes | Local elapsed |
|---|---:|---:|---:|
| Existing Owner roster, all pages |20|213,861|565ms; direct fixture RPC only, no API/crypto; per-row coherence |
| New first coherent preparation |22: manifest+20pages+completion|228,525; largest11,320|865ms including route/PG/encryption/final local re-check |
| New unchanged complete revision |1manifest|1,179|41ms including route/PG; no data-page transfer |
| Read all1000 from prepared encrypted store |0network;20local bounded page reads|No transport|77ms including Playwright round trips |

First preparation deliberately adds two verification requests and about6.8%JSON bytes; the old path did not prove a coherent source snapshot. An unchanged repeat sends95%fewer requests and about99.4%fewer bytes than a full old-page reread. These are this declared operation's savings, not whole-app/provider quota measurements or comparable UI speed claims.

An actual warm `EXPLAIN(ANALYZE,BUFFERS)` of one1000-row manifest measured17.449ms execution,2160shared buffer hits and zero shared reads/writes. This outer function plan does not count nested SQL statements or prove an index/throughput improvement. Manifest/completion each scan/hash up to1000rows; pages hash only their bounded rows. Fresh preparation has roughly3Nserver row-hash operations (manifest/pages/completion); unchanged has N. No O(1)version/delta claim. Each application request still spends the entry and gateway budgets; real Redis commands/egress/hosted load remain EX-05/08 evidence. Multi-event preparation must respect shared budgets; this is a one-event contract.

The existing **38 storage/recovery cases** and **92 unit tests** pass; build, type checking and lint pass. The shared16-key-mechanism receipt remains separate. Documentation/CSV joins, generated continuation, factual inventory/freshness/review-tool checks and actual Next EN/AR navigation/dirty/selection/Back-Forward regression passed. Exact-source CI delivery is recorded separately, not inferred from these counts.

The [advisor attempt](evidence/register-download-advisors.json) is **unavailable**, not green: CLI2.90.0 insisted on TLS against the explicit disposable loopback PG server, including a second attempt declaring local-only `sslmode=disable`. No linked/hosted database was contacted and TLS was not weakened on any real service. Plain-harness/hosted Supabase advisor and independent review remain open.

## Gates, rollback and continuation

| Status | This checkpoint |
|---|---|
| Design | Existing accepted Owner read/register designs retained; no new business policy |
| Implementation | Read-only source migration, closed API, typed receipt/receiver/coordinator and reproducible CI tooling |
| Local verification |11PG+20connected browser cases;38retained storage cases;92units/build/type/lint; source-bound receipts |
| Deployment / hosted | New schema not applied; flag unset; no private product caller or hosted offline proof; retain earlier Calendar1read release |
| Owner acceptance | No working private runtime review requested; existing approvals retained |
| Independent security | Open, including actual key custody/current authority/fields/lifecycle and provider boundaries |

**EX-04 scoped checkpoint passed; next is EX-03**, the immutable original-operation transport and response/restart recovery seam. Reuse this tested contract rather than repeat storage/hash research. Preserve canonical `a10_register_v1`, original operation ID/captured time and exact count-only settlement. Never use the cancelling `a10_operation_v1` reconciliation as a passive lookup before resend. The new read path must not post a write, optimistically change server Saved, overwrite pending work or reset an incompatible generation.

EX-09 still gates real authenticated recovery-key custody, current Owner/device/field epoch, exact fields/index/lifecycle, trusted verification time/30day cleanup and same-account recovery. EX-11 still needs actual UI adoption, connected18-player/40-date working-day, local subscription/invalidation, finite directory/month contracts, withdrawals/removals, leader/eviction/migration/physical/hosted/load and security evidence. All57working-day cases remain planned; no cross-app finding is closed here.

Reproduce with Node24 and an explicit PG17 runtime: `python3 scripts/register-download/test_boundary.py`, then `node scripts/register-download/test_browser.mjs`, then `--check`. The existing local PG harness defaults to the verified Mac binary; CI declares `M1_POSTGRES_BIN=/usr/lib/postgresql/17/bin`. CI pins Ubuntu24.04 and installs only a disposable PG17 test runtime; no hosted infrastructure is rebuilt. Source freshness checks precede regenerated CI receipts. The two-tab test deliberately holds a staged import open, preventing scheduler speed from turning a contention test into two valid sequential preparations; no assertion or business outcome was weakened. Do not run the two disposable PG suites concurrently because they share the test port.

Rollback remains source-only while inactive; do not reset stores or delete pending originals. No operating writers, private app enablement, service upgrades, real account grants or agent-controlled promotion occurred. If a later release needs promotion, the Owner alone performs it.
