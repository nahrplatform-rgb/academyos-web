# EX-01 — navigation, resume and task continuity

31 October 2026. Owner authorized execution after the whole-app diagnosis. Bounded first batch; not closure of all NR01–03 occurrences or full redesign. Source baseline7a6be974, prior analysis/evidence documentation preserved. [Single tracker](../06-delivery/experience-execution.csv).

## Outcome / joins / boundaries

Owner Home → Calendar → dated task → return uses client navigation. Returning to the tab coalesces paired lifecycle events and restores selection only from newly authorized results. Preserve nonprivate calendar controls and safe period/filter/selected identifiers while private results are masked during revalidation; no stale-private cache or TTL. Existing scoped navigation storage now also remembers a validated program/day identifier, never a private session payload.

Joins: IMP-J01-A01/J01-A01, S03/L01/AO-002/003/004/009/AT-002/003/004/009; IMP-J09-A01/J09-A01, S22/S23/S25, L04/L07, AO-021/022/027/029 and matching AT cases. Parent requirements remain open. Security: existing SEC-J01/SEC-J09 and journey security gate; server/gateway/query untouched. Trust changes are browser navigation/lifecycle and safe context only. No schema, API authority, signed receipt, idempotency, telemetry, private store or provider change.

PYSA read-only reference: current `pysa-platform/components/shared/loading-link.tsx` uses Next Link, respects modifier actions and separates intent from completion; useful navigation continuity. It also uses a global loading provider and a protected-prefetch policy whose assumptions are not copied. The saved scheduling review and behavior ledger retain translation, timezone, subset/search and false-success cautions. No hosted PYSA proof.

## Implementation / verification plan

Use existing Next routing rather than new framework/dependency. Keep dated-task busy/unknown/dirty/review guards and exact internal return targets. Use one domain-owned resume lifecycle, suppress paired focus/visibility starts and join active reads; never delay authority with a broad TTL. During recheck, mask private payload, keep nonprivate task orientation, restore selected occurrence only if returned and permitted; denial clears identifiers/private state. Do not persist rosters or session payloads.

Tests: actual Next document-vs-client navigation (synthetic identity/data explicitly), EN/AR, dirty cancellation, unknown fence, real native Back/Forward where available, synchronous/40ms-separated/in-flight resume, revoked/foreign actor and removed occurrence, saved filter/period, no stale payload during blocked read, selected task restore and read failure. Existing production React/regression, lint/type/build/foundation checks and affected factual captures/freshness must pass. No weakening of old assertions.

Rollback: presentation-only code rollback; existing operation IDs/versions remain canonical. No data migration/reversal required. New helper state is ephemeral. Unavailable hosted browser/source evidence is recorded rather than guessed; no access restoration or operating writes.

## Local implementation and evidence

Experience task destinations now use existing Next Link. Dated-task return/menu destinations use existing Next router while retaining explicit dirty-cancel, review Back, busy and unknown fences; modifier/middle clicks preserve browser semantics. The scoped experience navigation entry stores only period/view/filter and selected program/day identifiers. Revalidation clears private results, retains nonprivate calendar controls and an access-checking inspector, then restores selection only if the new permitted page still contains it. Denial clears selected identity; a removed occurrence cannot leave an actionable inspector.

A small visibility listener pairs visible/focus returns without a TTL. The Experience request owner joins active reads rather than abort/restart on every focus. No current-authority API, gateway, SQL, grant, signed preview, writer or operation identity changed. Other domains' lifecycle occurrences stay open under EX-02. No general stale-while-revalidate private cache or offline capability was added.

[Local evidence](evidence/request-remediation-ex01-2026-10-31/verification.json) records checks and input hashes. The real Next production routing fixture uses actual product components and framework routing, with fictional identity and read-only API responses: EN/AR Home→Calendar→date→dirty cancel/confirmed return→clean browser Back/Forward adds **zero document requests**; middle-click opens a separate tab; the selected occurrence returns from a fresh permitted projection. This is not hosted permission proof. The component test adds delayed-read privacy masking, separated/in-flight resume=one read, safe identifier-only persistence, removed selection and denial clearing.

Local lint/typecheck, production build,75 unit tests,17 foundation E2E and16 actual-component capture suites passed during this batch; final capture freshness and CI are recorded separately below. Node26 was the available local runtime; CI is pinned to24. An attempt to obtain a temporary Node24 runtime exited unsuccessfully; no dependency/lockfile changed. Passing on26 is not substituted for the24 CI result.

## Remaining scope and release status

No whole finding is closed across the app. Program/People/Guardian/Development routing and lifecycle adoption, crash-recovery storage guarantees, query optimization and the remaining redesign are EX-02 onward. Browser Back/Forward here was tested on clean tasks; native history/unload during dirty or unknown operating states remains a specific G01/EX-02 case, not a passed guard claim. Private stale display, private persistence/offline writes and broader role/device/performance gates remain open.

Deployment, current-alias hosted verification and Owner acceptance are pending until the exact checked source is pushed and verified. No account restoration, operating write or provider configuration change is part of this batch.

