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

Pending execution. Preserve successful/failed counts and unavailable layers separately; no budget may be marked met from an insufficient sample or a direct-SQL-only result.


## Prepared access-revocation check — authorization pending

M1-T03 can be checked using the already confirmed account and its one existing owner membership in **AcademyOS M1 Synthetic Academy**, without another account or owner appointment. Prepared permission-restricted operator transactions under the owner configuration directory: `test-membership-suspend.sql` changes only that exact membership active→suspended after subject/academy/role/status guards; `test-membership-restore.sql` requires the matching suspension audit and restores suspended→active with the same guards. Both record operator/reason/before/after and a shared test reference. No role, academy data, platform grant, invitation or other membership changes.

Procedure after explicit authorization: open existing setup view; suspend; verify the next read/write is denied and private setup projection is cleared; run restoration even if the browser assertion fails; verify the original one-owner state and saved setup intact. Restore files are prepared before suspension. Any unexpected target state stops for review. Restoring active owner access is why the user's privileged-grant restriction requires separate authorization. These transactions have not executed.
