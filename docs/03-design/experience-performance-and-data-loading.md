# AcademyOS experience, performance and data-loading plan

Updated 22 October 2026. Status: **owner-requested planning direction; proposed budgets and implementation defaults await first-slice measurement and review.** No new caching, telemetry, database policy, provider plan or application behavior is implemented by this document.

## One product design problem

Usability, loading, retrieval, correctness, operating cost and recovery must be designed together. The experience goal is useful work quickly, with clear authority and trustworthy outcomes. A beautiful dashboard that fetches unnecessary data, shows misleading cached totals or loses work is not complete.

Use this plan with the [experience blueprint](experience-blueprint-and-journey-governance.md), [journey register](journey-register.csv), [screen/data matrix](screen-data-loading-matrix.csv), [architecture](../04-engineering/architecture.md), [cost model](../06-delivery/cost-capacity-and-operations.md) and [acceptance strategy](../06-delivery/test-strategy-and-acceptance.md). These add delivery constraints across existing scope; they do not remove later modules or settle unresolved business policies.

AcademyOS should feel calm and continuous: the workspace appears without unnecessary shifts, the role's next useful task is prioritized, unrelated panels do not block it, and progress survives ordinary interruptions where permitted. Data retrieval should follow the person's task rather than the database's table structure.

## Five quality questions — required for each journey

| Dimension | Design question | Required evidence / guardrail |
|---|---|---|
| Usability | Can the intended person finish without help and explain the result? | Task walkthrough; decisions/entries/wrong turns; EN/AR and accessible states; record assistance honestly |
| Speed | How soon can useful work begin and how quickly do actions respond? | Cold/warm navigation, first useful task, interaction and save measurements on declared device/network; distinguish acknowledgement from commit |
| Correctness | Is information current enough, permitted and consistent for this action? | Freshness class, resource scope, authoritative revalidation, concurrency and revocation tests; unavailable is not zero |
| Cost | What resources does completing the journey consume? | Requests, bytes, query work, cache operations, job/retry amplification and provider meters; actual bill separate from estimate |
| Recovery | What happens before/after a failed or uncertain operation? | Lost response, partial load, stale edit, interrupted flow, duplicate request and safe resume/correction tests |

Do not turn these into one averaged score that hides a privacy or integrity failure behind fast loading. Each dimension has its own gate. A known unauthorized read or duplicated financial operation blocks acceptance regardless of visual quality or speed.

## Role priorities and loading shape

| Person | First useful content | Secondary content | Important consequence |
|---|---|---|---|
| Platform Owner | Urgent incidents, affected capabilities and pending platform decisions | Historical usage/cost charts and recovery detail | App availability cannot depend on provider billing APIs; show observation age and unknown collectors |
| Academy Owner | Today's exceptions, setup/approval tasks and next sessions | Period summaries, trend comparisons and drill-down | Summary definitions and freshness visible; a failed widget cannot become a zero balance |
| Manager | Assigned branches, today's coverage and operational exceptions | Other permitted dates and directories | Avoid loading owner-only finance/compensation even when hidden in the UI |
| Trainer | Next assigned dated session and a way to open its roster | Player details, historic evaluations and permitted earnings | Read only assigned fields; never preload all academy players, finance or years of attendance |
| Guardian | Authorized child context, next session and necessary action | History, detailed bills, progress and media | Payer and guardian scope differ; check changed links before retrieving additional child information |
| Player | Personal next session and published goals | Permitted history and detail | Age/consent/authority policy controls access; child-safe copy is not an authorization substitute |

For multiple children/academies, show a lightweight authorized chooser; do not fetch every profile and history to build it. On first use display saved setup progress. Returning users should resume useful work. Deep links and notification actions must validate current context rather than replay a stale permission assumption.

## App startup and navigation sequence

1. **Public assets:** load only the route's necessary shell, fonts and code. Keep static visual assets cacheable separately from private responses. A cached shell must not imply a valid session.
2. **Identity and context:** verify the session and resolve current membership/capabilities for the selected academy. Show a bounded loading state until private access is established. Avoid redirect loops; distinguish no membership from a failed lookup.
3. **Critical task data:** retrieve a minimal authorized projection for the route's first useful action. Where safe, fetch independent critical reads concurrently after authority is resolved; do not serialize unrelated requests.
4. **Progressive content:** reveal independently ready regions in an intentional order with reserved geometry. Keep navigation usable. Secondary charts must not delay a roster, approval or next-session card.
5. **On-demand detail:** retrieve history, attachments, full profiles and heavy editors when opened. Prefetch only measured, likely destinations within current authority; do not prefetch the entire sidebar or high-cost reports.
6. **Controlled refresh:** invalidate affected views after committed changes, refresh stale data according to its class and cancel obsolete searches. Avoid refresh storms on tab focus, reconnect or context switch.
7. **Background work:** report queued/processing/completed separately for exports, notifications and other jobs. Opening a page must not start expensive business work merely as a side effect of rendering.

“First useful” means the person can perform the intended task, not just see a logo, skeleton or blank shell. The time includes identity/context resolution and necessary data. Record separate timings so an apparently fast shell cannot hide a slow usable screen.

## Retrieval contracts

Every matrix row must become a reviewed retrieval contract before its journey is built. Specify actor and capability; academy/branch/resource; fields; filters/date window; stable sort; maximum rows/page and response bytes; critical versus deferred requests; freshness; cancellation; cache key/invalidation; retry budget; error behavior; expected database work and evidence.

Initial proposals: people/search pages 25 rows, selectable 50 with a server-enforced ceiling; recent family history one bounded date window; calendar requests a visible date window and selected branches. These are starting points, not implemented limits. Never fetch every record and filter unauthorized or unneeded data in the browser. Exact totals can be expensive: use them only where the task needs them, otherwise provide truthful “more available” navigation.

Large attendance rosters require special treatment: the operator must know whether the whole roster is loaded. If paging/virtualization is necessary, retain search and remaining/incomplete counts with a clearly defined source; never mark a session complete based only on visible rows. Browser virtualization reduces rendering work but does not by itself reduce database or network cost.

Use stable pagination with a tie-breaker and defined behavior under concurrent inserts; choose cursor versus offset based on the actual query and need for page jumping. Reports/export use an explicit snapshot/as-of boundary, complete scope and server operation; a paged list is not a complete export.

Bound database work as well as payload size: inspect representative query plans, relationship fan-out, per-row lookups, permission joins, sort/index alignment and pool contention. One large endpoint can be more expensive than several small ones. Do not change indexes or denormalize without measured query evidence and write/recovery tradeoffs.

## Freshness classes and cache authority

| Class | Examples | Proposed behavior |
|---|---|---|
| A — authoritative action | Membership/approval checks, capacity at enrollment, payment/refund, ownership changes | Server checks current authority and relevant state at commit; client cache never authorizes a write |
| B — operational read | Today roster, next session, current assignment | Short-lived scoped reuse may be acceptable; refresh after related changes and on appropriate resume; state age/refreshing when consequential |
| C — derived summary | Attendance rate, period totals, historical trends | Cached/materialized projection only with definition/version/as-of time and monitored rebuild lag; drill down to reconciled source |
| D — reference/configuration | Sport labels, selected locale, versioned display metadata | Longer reuse where safe; invalidate on version/config change; distinguish global reference from tenant-private configuration |
| E — provider observation | Service health, usage, costs and backup receipts | Independent collectors with bounded cadence; last-known values labelled stale; collector failure is not proof of service outage |

Each data set receives an explicit freshness allowance and owner before implementation; avoid one global TTL. Display-only staleness never permits stale authorization. Future scope must define the maximum tolerated revocation delay; new server reads/actions recheck authority. Already delivered data cannot be remotely recalled, so minimize client storage and define purge behavior.

Cache keys include environment, academy, resource/branch scope, subject or reviewed authorization-equivalence scope, projection version and relevant filters. Locale/timezone/currency enter the key when they alter the result. Private responses must not enter shared public caches. A privileged server cache must not bypass caller authorization on retrieval. Signed file URLs are bearer access, not harmless cache metadata.

Deduplicate identical in-flight reads where the authority context matches. Consider request-local memoization before an external cache. Use a shared Redis data cache only when measured reuse exceeds its added latency, commands, invalidation complexity and privacy risk; existing Redis throttling does not establish permission for general business caching.

On logout/context switch/revocation, cancel requests and clear incompatible memory, persisted state and late responses. Do not render an old academy response after the switch. Persist sensitive browser data only for an explicit reviewed need, with account scope, expiry and secure recovery rules. Offline attendance remains its own approved contract; general caching does not make the app safely offline.

## Save behavior, responsiveness and safe optimism

A control should acknowledge interaction promptly, prevent accidental repeat submission and explain pending work. “Saving” is not “Saved.” For low-risk reversible preferences, optimistic updates may be suitable if rollback is clear. Financial, access, attendance approval and other consequential transitions must use their declared commit/operation receipt and unknown-result lookup rather than inventing success.

After a lost response, query the same durable operation before submitting a replacement; keep the idempotency key and original payload contract. Update only affected projections after confirmed commit. Cross-view invalidation must cover family/staff screens without exposing unauthorized event payloads.

Prefer targeted refresh to persistent polling. Realtime is a specific subscription design decision, not a global default: identify the need, scope connections, payload projection, authorization, reconnect/backfill and fallback. Live updates can add cost and create conflicts while a person edits; notify or reconcile based on action semantics.

## Loading, failure and interruption design

Use skeletons that match the actual content geometry, stable dimensions for images and section-level error/retry controls. Avoid full-page spinners for independent panel refreshes, endless animated loaders or shifting buttons. Announce meaningful changes accessibly without moving keyboard focus unexpectedly. A chart failure must not remove a usable session list.

Set request timeouts and bounded retry rules per operation. Retry transient safe reads with backoff/jitter and respect server throttling; cancel obsolete queries; do not retry forbidden/validation outcomes. Mutations require operation-specific idempotency before retry. Resume in a way that preserves valid input without silently restoring outdated authority.

If a dependency fails, explain what remains possible, whether data may be old, and what the user should do next. Optional summaries may degrade; permission validation and financial integrity must fail closed. Planned cost controls may pause optional exports/media processing, but never silently discard attendance or treat an uncertain payment as failed and charge again.

## Proposed performance budgets — not measured results

Existing roadmap targets are retained. These supplement them and require measurement against a declared workload before acceptance. Use percentiles with sample size, not one ideal laptop run.

| Measure | Initial proposed target / interpretation |
|---|---|
| First useful role home or roster | p75 within 3 seconds on the agreed representative mobile/network profile, including required auth/context; record cold and warm separately |
| Core interaction response | p75 within 200 ms for visible local feedback; this is not a promise that remote work commits in 200 ms |
| Ordinary authorized read | p95 server time under 800 ms at declared pilot load; network and rendering reported separately |
| Online attendance commit | p95 under 1 second on the selected regional staging setup under declared burst; show pending until confirmed |
| Visual stability | Proposed CLS at or below 0.1 for measured key routes; verify both initial load and interactions |
| Long operations | Immediate understandable acknowledgement, durable progress/status and safe revisit; operation-specific completion budget before build |
| Request/payload/query budgets | Set per matrix contract after a baseline; no universal arbitrary request count or zero-byte claim |

Record first useful task metrics alongside applicable browser vitals; ordinary page metrics alone do not establish authenticated workflow usability. Collect cold/warm and successful/failed runs; report slow cases and timeout rates, not just successful medians. Metrics collection remains planned: no new analytics provider, paid tracing or personal event capture is authorized here.

For each test declare browser/version, physical device or emulation, network round-trip/bandwidth/loss, region, cache/session state, dataset and concurrent workload. Slow-network and ordinary lower-end Android/iOS testing profiles must be chosen and documented; do not present simulated “4G” as a universally representative connection. Physical interruption/reopen tests are separately required where offline behavior is claimed.

## Retrieval cost and scale model

Estimate resource consumption per completed journey, including abandoned/retried navigation. Track request count, database query count/work duration/rows examined where available, returned rows, compressed transfer bytes, object/thumbnail bytes, cache reads/writes, job executions/retries, recipient sends and telemetry. Database queries are not automatically billed per query; map observations to the actual provider meters such as compute, storage, egress and commands.

A simple scenario model is:

- Read demand = active users × task visits per user × retrievals per visit × refresh/retry factor.
- Object transfer = views × objects per view × delivered derivative bytes; include originals, re-downloads and cache misses separately.
- Job demand = committed business events × eligible downstream operations × measured delivery/retry factor.
- Infrastructure cost = fixed plans + meter consumption at dated provider rates/tiers + storage/retention + environments/backups/CI + applicable taxes. Include overages and shared-account allocation assumptions.

Use three documented scenarios: small pilot, expected operating scale and busy-day/stress. Inputs must come from owner assumptions and later measured pilot activity; do not invent a growth forecast or price quote. Model synchronized session starts and family notification bursts, not only monthly averages. Include tenant size skew so one large academy is not hidden by an average.

Caching reduces cost only if avoided work outweighs cache operations and invalidation/rebuild effort. Thumbnails, bounded history, deferred charts and eliminating duplicate requests can help, but must be measured. Privacy/access checks and integrity are not optional cost optimizations. Keep actual provider charges, estimated monthly run rate, marginal cost per task and allocated cost per academy separately labelled.

## Services & Operations feedback loop

The [Platform Owner operations vision](platform-owner-services-and-operations.md) should eventually show journey speed/error trends, retrieval/bytes drivers, usage versus limits, affected capabilities and dated cost estimates. Do not display fabricated live figures when a provider has no API or collection failed. Attribute data to environment/time window and show measurement coverage.

Operational collection is asynchronous, minimally privileged and cached independently of the user request. Avoid a provider-API request for every dashboard visitor. Fixed safe metric dimensions can include journey ID, release, environment, outcome and device/language class; avoid email, child names, raw paths/queries, tokens, signed URLs or uncontrolled tenant/user IDs. High-cardinality or tenant-level diagnostics require explicit justification and access policy.

First use controlled synthetic measurements. Later field measurement needs a documented privacy/retention policy and supported collection path; existing privacy-disabled tracing/replay/log settings remain unchanged. Failure of telemetry must not break ordinary work. Independent uptime/backup monitoring remains necessary when the application itself is unavailable.

## Delivery order and review gates

1. **Inventory:** prioritize frequent and consequential tasks per role using the journey register; map entry points and cross-person handoffs.
2. **Contracts:** expand upcoming matrix rows into bounded queries, freshness, authority, cache/invalidation and recovery contracts. Resolve dependent business policy.
3. **Prototype:** connect the first journey's screens with loading, empty, pending, partial and failure states in EN/AR phone/desktop layouts; owner review records design decisions.
4. **Baseline slice:** build controlled synthetic academy creation → owner acceptance → initial workspace; measure both creator and recipient flows without premature general caches.
5. **Operational slice:** extend through people → session → trainer roster/attendance → guardian visibility. Test representative data, two tenants, role changes and concurrent attendance bursts.
6. **Improve with evidence:** address actual slow query/code/network/rendering work; add narrowly scoped optimizations; rerun correctness/recovery checks affected by the change.
7. **Scale and acceptance:** compare measurements to budgets and declared scenarios, record cost model assumptions, get role/owner acceptance and keep release limits explicit.

The build-ready checklist for every slice is: all five quality questions answered; retrieval/mutation contract reviewed; state prototype reviewed; test workload and budget declared; instrumentation privacy defined; unresolved policy visible. The accepted checklist adds observed results, cross-tenant/cache tests, recovery evidence and owner sign-off. “Planned,” “implemented,” “measured” and “accepted” remain separate statuses.

## Standard evidence record

```text
Journey/action and matrix IDs; requirements; actor/context:
Design and policy decisions; screens; prototype review:
Critical/deferred data; retrieval bounds; freshness/cache/invalidation:
Workload; device/network/region; cold/warm state; source commit:
Usability observations and assistance:
First useful view; interaction; server read/commit latency; sample count/percentiles:
Requests; returned bytes; database work; cache/jobs/retry amplification:
Correctness: permissions/revocation/staleness/concurrency results:
Recovery: loss/partial/unknown/reconnect results:
Estimated costs with dated rate source versus actual charges:
Privacy/retention; limitations; regressions; reviewer; acceptance status:
```

No checklist or document proves universal speed, zero defects or production capacity. Use the first measured slice to establish a sustainable AcademyOS pattern and revise budgets openly rather than weakening acceptance to match an attractive demonstration.

## Engineering and security accountability

The [engineering charter](../00-governance/engineering-charter.md) and [journey security gates](../04-engineering/journey-security-review.md) govern implementation of this plan. Caching, prefetch, exports, query optimization and telemetry changes require relevant isolation/revocation/field/privacy checks. Faster loading or cheaper retrieval cannot compensate for a failed security boundary.
