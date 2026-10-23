# M1 verification continuation — 22 October 2026

Scope: J01-A01, J02-A01, J03-A01/A02 and J04-A01–A03; AO-002–009/011/019 and relevant AO-117–130; M1-T06/T08/T10/T12/T13. Continue the [accepted packet](../06-delivery/onboarding-m1-decision-design-packet.md) and [current staging receipt](onboarding-m1-staging.md). No new admission, role, ownership, timezone or commercial policy.

## Measurement change before implementation

The existing request deadline and code-only failure logs do not distinguish identity lookup, rate limiting and database operation time. Add bounded request-local `Server-Timing` durations for request validation, session resolution, rate limiter, operation and total. Names are fixed; values are numeric milliseconds; no subject, academy ID, request fields, secret, provider message or new telemetry collector. Responses remain no-store. Timing headers measure server phases, not database-only execution. Database query plans and browser transfer/paint/task timing are separate evidence. No permissions, grants, SQL operations, retries or caching change.

Reuse the current API response and phase boundaries. Verify an actual API denial still has its original status and a bounded numeric-only timing header. Existing UI/database security tests remain unchanged. Deploy to existing protected staging only after relevant checks. Recovery: remove timing headers if needed; no schema/data rollback.

## Workload and limits

Use the existing authorized synthetic academy/current account. Browser measurements collect numeric timings, status, body sizes and origin/resource counts, never response bodies, cookies, raw URLs or form/account data. Save sanitized samples separately from raw browser state. Maintain existing caller rate limits; do not remove them to make load tests pass. An HTTP 429 is a failed sample and must be recorded. No extra message sends or privileged grants for performance runs.

The dedicated Chrome DevTools MCP required by the web-perf skill is unavailable. Its full trace/Lighthouse workflow is not executed. Scoped browser CDP measurements may proceed separately; do not claim a complete Core Web Vitals audit or real-device acceptance from them.

Full accepted workload remains two small academies/one skewed tenant, 30 memberships, 60 branch/sport records, 20 readers and 10 conflicting writers, with 50 successful samples per route/profile and 20 failure runs per recovery case. Current-account measurements do not establish all of that workload or multi-persona isolation. Additional durable privileged personas require exact owner authorization before provisioning.

## Results

Executed scoped results are below. Preserve successful/failed counts and unavailable layers separately; no budget may be marked met from an insufficient sample or a direct-SQL-only result.


## Access-revocation procedure — authorized and executed

M1-T03 can be checked using the already confirmed account and its one existing owner membership in **AcademyOS M1 Synthetic Academy**, without another account or owner appointment. Prepared permission-restricted operator transactions under the owner configuration directory: `test-membership-suspend.sql` changes only that exact membership active→suspended after subject/academy/role/status guards; `test-membership-restore.sql` requires the matching suspension audit and restores suspended→active with the same guards. Both record operator/reason/before/after and a shared test reference. No role, academy data, platform grant, invitation or other membership changes.

Procedure after explicit authorization: open existing setup view; suspend; verify the next read/write is denied and private setup projection is cleared; run restoration even if the browser assertion fails; verify the original one-owner state and saved setup intact. Restore files are prepared before suspension. Any unexpected target state stops for review. Restoring active owner access is why the user's privileged-grant restriction requires separate authorization. Execution is recorded below; do not rerun this one-time suspension without a new scoped instruction.


## Authorized revocation result

Moamen explicitly authorized the prepared suspension/restoration on 22 October 2026. Exact existing synthetic owner membership changed active→suspended with operator/reason audit. The already-open signed-in setup view's next refresh returned HTTP 403. Browser assertions found zero private branch labels and zero edit controls after denial. Restoration ran immediately after the assertion and returned the same membership to active/owner; both `test.membership.suspend` and `test.membership.restore` receipts were confirmed. The next signed-in refresh again displayed Initial setup saved. No account, platform grant, role or new membership was added. Postcheck: setup version 9, completion true and Cairo timezone. This closes the focused hosted open-page read revocation case; it does not prove every concurrent write/revocation or multi-persona boundary.

The timing build is deployed as commit `549de6d3227cac653fb5106a170f6ff85f507add`, READY `dpl_HvqWcKskiiBpkGjCAsWoiTKfU1N7`. Local lint/build and all four production-build browser tests passed, including unchanged denial and no-store assertions plus the numeric timing header. The browser received the deployed phase header during the actual 403 revocation request (server total 243.4 ms, operation phase 158.5 ms). No full performance conclusion follows from this single request.

Early browser instrumentation attempts could not access the required paint APIs; a longer collection call hit the tool deadline and reset its session. Those attempts yield no usable statistical dataset. The supported collector now persists each numeric-only network sample immediately and uses smaller bounded batches. Wall-clock UI refresh observations include automation overhead and are upper bounds, not exact local feedback/first-paint measurements.


## Reproducible numeric evidence and budget disposition

Source build: `549de6d3227cac653fb5106a170f6ff85f507add`. Both GitHub checks passed: [39799396612](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/39799396612) and [39799408454](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/39799408454). Protected staging remained protected. The browser received Server-Timing from this release; no new metric collector/service was added.

Samples: [100 setup-read observations](evidence/onboarding-m1-timing-samples.jsonl), [20 offline recovery observations](evidence/onboarding-m1-read-recovery.jsonl), and [aggregate results with source hashes](evidence/onboarding-m1-measurement-summary.json). The JSONL files were validated to contain only fixed profile labels, numeric durations/status/transfer counts and recovery booleans. They contain no cookies, subjects, academy IDs, response bodies, tokens or raw URLs. A sample consists of a real signed-in click on Refresh saved state, waiting for the saved heading, then matching the single onboarding response and finished-transfer event by request reference. Request references were used in memory only and are not in these files. Percentiles use the nearest-rank method.

| Setup refresh profile | Successful samples / failures | p95 server total | p95 operation phase | p95 response wire bytes |
|---|---|---|---|---|
| EN desktop, unthrottled (viewport caveat below) | 50 / 0 | 658.9 ms | 574.4 ms | 532 |
| AR phone, 390×844, 150 ms RTT / 1.6 Mbps down / 750 Kbps up / 4× CPU | 50 / 0 | 492.4 ms | 409.4 ms | 526 |

The desktop viewport was requested at 1440×900 before the collector session reset and was not re-observed in each retained sample. Treat exact desktop-dimension comparison as unverified. The phone viewport was explicitly observed at width 390 with no horizontal overflow after its configuration.

Both measured **warm setup read** profiles meet p95 server handling <800 ms on the current small synthetic academy. This is not all routes/profiles, a cold-navigation result, database-only execution time or production capacity evidence. The phone figure being lower does not establish that throttling improves performance: server timings exclude the browser's imposed latency/CPU, and the sets were sequential with changing server/database warmth. Per-phase p95s do not add to the total p95 because their slow samples differ.

Each successful sample had exactly **one app request**. Response wire-byte measurements include transport/header encoding and vary; they are not uncompressed JSON-size or total-page-transfer budgets. The app path has one bounded RPC and one rate-limiter call; actual billable Redis command count, provider metering/cost and abandonment cost were not independently measured. No message was sent by this benchmark. No zero-cost/monthly-cost claim.

A separate hosted `EXPLAIN (ANALYZE, BUFFERS)` of the setup RPC under simulated current-subject claims took **5.652 ms**, one result row, no physical shared-block reads. It proves one small-fixture function execution, not nested-query plans or a skewed/large tenant. Current warm timing data do not justify speculative schema/index changes.

All **20/20** Arabic phone-profile offline-refresh cycles showed an explicit read error, retained the previously saved setup rather than presenting empty data, and recovered after reconnection. No save request was issued by this fault test. It does not prove offline authorization, offline writes, physical airplane-mode behavior or commit/provider-outcome recovery. Browser network/CPU/viewport overrides were cleared afterward.

Actual render-ready wall-clock observations include browser-automation overhead (p75 upper bounds 2830 ms desktop and 2786 ms phone); do **not** use them as exact first-useful-task, local feedback, LCP or INP metrics. The browser interface does not expose the required paint APIs to this collector, and raw new-document instrumentation was unsupported. First-useful task ≤3 s, feedback ≤200 ms, CLS ≤0.1, Core Web Vitals and cold/warm full navigation budgets remain **unverified**. The full Chrome DevTools audit and physical devices remain unavailable layers, not passes.

Remaining security gates: multi-persona authenticated HTTP/browser two-academy coverage (same-account lower-role checks now recorded separately), revocation/write races, recipient/expiry/reissue/provider-failure layers, and independent review. Existing local/rollback SQL checks stay valid at their stated layers; this packet does not promote them to browser evidence or full milestone acceptance. Additional durable privileged personas still require exact owner authorization. Current owner access was restored and audited before completion of this packet.


Final postcheck after measurements: one academy, one active owner membership, setup version 9/completion true/Cairo timezone, one invitation delivery attempt, exactly two authorized revocation-test audit events, and no manual 40001 exception remaining in M1 functions. The canonical staging alias was verified against `dpl_HvqWcKskiiBpkGjCAsWoiTKfU1N7`; project SSO protection remained enabled for all deployments. A restored-access screenshot stays in the restricted local evidence directory. CSV references/statuses now point to these scoped results; all 180 requirement IDs and original acceptance scenarios were retained.


## Further HTTP checks and authorized role results

Read [authenticated HTTP boundary checks](onboarding-m1-http-boundary.md) for seven staged origin/input/unknown-resource/worker denial cases and normal-refresh recovery, plus four separately authorized same-account lower-role read/save denials and audited owner restorations. These add focused HTTP evidence without closing populated-tenant isolation, separate-persona context, billing-meter or independent-review gates.


For deterministic local save-versus-suspension ordering in both directions, read [write/revocation results](onboarding-m1-write-revocation.md). All 14 database groups passed; the hosted concurrent HTTP layer remains open.

## B-session bounded burst continuation — 23 October 2026

Plan before execution: J04-A01–A03/M1-T06/T08/T12, within the existing small synthetic B academy and its verified current Owner session. Execute one burst of 20 own-setup reads, then ten concurrent replays of B's already committed completion operation using its exact original version/step/fields/key. The operation's stored request was read and confirmed before replay. Do not generate replacement operations or change any saved field, role, membership, provider setting or rate limit. Reconcile B's existing operation and pre/post version/operation/audit/membership counts. Stop on an unexpected payload/authority/state result; retain throttled, failed and unknown outcomes honestly.

Collect only status, current-authority/shape checks, response JSON byte count and numeric server/wall timings; no body, subject, credentials or provider content. Native Safari console tests make same-origin requests in B's existing session without extracting credentials. Do not call this multiple-persona throughput, a conflicting/new-write benchmark or a full navigation/device/performance pass. Existing budgets remain p95 server read <800 ms and ordinary transaction <=1 second; these small sample/replay observations cannot close the full 50-sample/profile and skewed-dataset workload. Return the inspector/UI to the own saved workspace after testing. No application implementation/deployment is required for this measurement.

Executed on canonical staging source `f5e8e29133cbd50498172fce882d20f17c35cfee`, deployment `dpl_4uf1e3PeKSKo6fw7dzodC53DmWXy`, in the existing native Safari desktop B session. No network/CPU/viewport emulation was applied. Exact viewport, connection RTT/bandwidth, cache warmth, browser user-agent version and physical-device performance characteristics were not captured; the visible own workspace was already loaded. This is a small-fixture concurrent API observation, not the declared repeatable full-navigation profile.

| Burst | Valid / total; statuses | Timing samples | p95 server total | p95 browser request wall time | Maximum JSON bytes |
|---|---|---|---|---|---|
| Own setup reads, launched concurrently | 20/20; HTTP 200 x20 | 20 | 555.2 ms | 2923 ms | 334 |
| Exact committed completion replay, launched concurrently | 10/10; HTTP 200 x10 | 10 | 527.5 ms | 994 ms | 334 |

All responses were no-store and matched B's own academy/version 3/completed state. No timeout, rate-limit, network or invalid-shape result occurred. Percentiles use nearest rank; for ten samples p95 is the maximum. Server time is the existing numeric Server-Timing total, including identity/rate limiting/operation, not database-only execution. Browser wall time includes connection scheduling/queuing/network and response parsing. JSON bytes are decoded response-body bytes measured with TextEncoder, not total transport/page bytes. Only aggregates were retained, so raw samples/per-phase distributions cannot be independently recomputed from these artifacts. [Numeric aggregate evidence](evidence/onboarding-m1-burst-summary.jsonl) preserves the observed counts and results.

The server read p95 is below the 800 ms target in this one 20-request burst. The ten calls are replays, so their timing does not validate the ordinary new-transaction budget. Neither dataset satisfies the required 50 successful samples per route/profile or the larger/skewed/multi-actor workload. Browser wall time must not be promoted to first useful task, LCP, INP or local-feedback measurements.

Database postchecks confirmed no change to either academy's version/completion, operation/audit totals or active membership; each original invitation still has one delivery attempt. B's ordinary UI refresh displayed its saved branch/timezone/sport after the inspector was closed. Thirty app API calls were issued by these bursts; no notification send or new business operation resulted. Actual billable Redis commands, provider usage meters and cost were not measured; no zero-cost or capacity claim. Full navigation, real devices, new/conflicting-write performance, hosted write/revocation/context races and independent security/full acceptance remain open.
