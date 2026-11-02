# EX-02 — denial investigation and measured scroll clamp

2 November 2026. Continuation of [local controls](request-remediation-ex02-local-controls.md). Authorized existing Home → Calendar → dated task → Back continuity; J01-A01/IMP-J01-A01 and J09-A01/IMP-J09-A01, S03/S22/S23/S25, L01/L04/L07, SEC-J01/SEC-J09; prior AO/AT joins retained. NR03/NR04/G01 remain partial.

## Before implementation

Current source c1f604b; clean tree before this diagnostic. Native existing Owner Calendar/dates reads succeeded. English and Arabic dirty-exit Cancel retained the disposable unsaved capacity edit; explicit departure returned to the previous Calendar filter/selection. No review/save or access change. A native dialog focus return caused a read; seven app rows in the bounded inspection contained six200 results and one canceled read. Recorded durations are opportunistic browser elapsed times, not percentiles or SQL timings. Previous denial did not recur. An earlier Clerk token-endpoint connection reset was visible, but no causal link to the denial is established. No credentials, cookies, token URLs, private response bodies or HAR retained. Built-in browser disabled; native DevTools used read-only and closed. Denial cause remains open.

The independent geometric probe uses actual production Experience/shell/panes/CSS with fictional40-row data, held reads and EN/AR at1440/1024/390px. All six cases reproduced temporary scroll clamping to0 while the **same** center DOM node survived. Desktop/tablet center scroll600→0, phone document scroll600→0. Returning the same40 rows did not restore position. This proves a content-height collapse in the fixture, not a universal shell remount or hosted-auth cause. [Before receipt](evidence/request-remediation-ex02-denial-geometry-2026-11-02/before/receipt.json).

Bounded fix: reserve only the measured result-region height while its current-authority read is pending; clear private rows as before. Release the space on success/failure/denial, including genuinely shorter current results. No private stale display, response caching, persistent dimensions, TTL, new read, authentication retry, schema or write change. Numeric in-memory geometry belongs to the existing keyed identity/academy/role component. Initial loading has no invented height. Rollback is a presentation-only revert.

Acceptance: same-node scroll preserved during and after a same-size held revalidation, private rows absent while pending; smaller authoritative results may naturally clamp after completion; denied/unavailable results release reserved space and reveal no stale private rows. EN/AR desktop/tablet/phone; existing Home/Calendar identity/role/read-budget and actual Next dirty/unknown guards retained. Hosted denial still needs a failing request/status before any remedy is selected.

PYSA reference rechecked: Player schedule client keeps local search/filter orientation with supplied sessions; historical EV-0025 shows why visible success is not persistence evidence. Scheduling reference review remains authoritative context. Neither legacy source nor this synthetic fixture proves hosted behavior; no PYSA modifications.

## Denial boundary trace (source evidence, not an incident diagnosis)

| Boundary | Actual source | Distinguishing result |
|---|---|---|
| Request origin/environment/type | `apps/web/src/app/api/experience/route.ts:13`, `apps/web/src/app/api/planning/route.ts:13` |403 denied before session/RPC |
| Current sign-in/session token | `apps/web/src/lib/onboarding-server.ts:28` |No user or token →401 denied; thrown provider failure →route503 unavailable |
| Gateway whitelist/caller proof | `apps/web/src/lib/onboarding-gateway.ts:11` and current SQL identity/proof checks |Refused route/proof can yield403 denied; limiter429 is distinct |
| Database permission | `apps/web/src/lib/onboarding-server.ts:35`, `apps/web/src/lib/onboarding.ts:32` |SQL42501 →403 denied; other provider/network codes default503 unavailable |
| Private UI clearing | Experience read catch and dated `fail()` |denied clears private results; dated denial also clears intent/recovery reference under existing behavior; this checkpoint changes neither rule |

The UI text cannot select among these causes. Neither an identity-network reset nor an aborted browser request proves membership loss or backend cancellation. The next failing case needs endpoint template, response status/safe error code, request ordering and provider timing without credentials/private payload. No new persistent telemetry or retries were enabled. Existing API budget/invalid-body/cross-origin suites passed for both routes; these adapters do not exercise live Clerk or SQL authority.

## Measured implementation result

[After receipt](evidence/request-remediation-ex02-denial-geometry-2026-11-02/after/receipt.json), [hosted observations on the prior release](evidence/request-remediation-ex02-denial-geometry-2026-11-02/hosted-observations.json). The active desktop/tablet center or phone document scroll stayed600 during and after the same-size result in all six Calendar fixtures; no private rows while pending. One visible loading status stays within the viewport. Shorter results and503/403 release the reservation, with no automatic retries or extra reads. Numeric geometry only, in component memory. This is not a claim of zero layout shift: header/summary copy still moves29–116px in these fixtures, and filter/sort/period changes, selected-inspector geometry and cross-route restoration need their own measurements.

The new diagnostic/regression command is `node scripts/navigation/measure_geometry.mjs`; it is added to foundation CI. Default mode asserts continuity, private masking, visible status, release on shorter/denied/unavailable results and exact deliberate read counts. The optional baseline switch records the old behavior without claiming it passed the new continuity contract. No test assertion or business rule weakened. Source changes are limited to the Experience result wrapper and measuring its in-memory height before existing masks; no shared shell rewrite.

Local verification: actual Next production EN/AR navigation/dirty/history/local controls passed;77units,17foundationE2E,Experience/planning API checks,build/type/lint passed. Final16actual-component capture suites plus8welcome frames,offline review/freshness and33theme snapshots passed. Inventory1047frames/1053transitions/65sourcefiles/6857literals remains scoped capture evidence, not exhaustive device/security proof. Local Node26.9.0 and CI Node24 remain separate. New geometry rollout/hosted/Owner gates pending before this commit.
