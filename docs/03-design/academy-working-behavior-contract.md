# Academy working-behaviour and data-lifecycle contract

2 November2026. Current execution direction authorized by the Owner's request to update the plans after reviewing the working-day approach. **This is a detailed engineering/design contract and decision-preparation record, not proof of implemented behaviour or acceptance of private caching.** No app, API, schema, provider, access, private-storage or telemetry change is made by this documentation checkpoint.

## Authority and purpose

The product must support a continuous academy working day: start useful work, move between tasks, save accurately, handle interruptions and return without reconstructing the task. Fewer requests, a mounted shell, a fast skeleton or a Ready deployment alone do not establish that outcome.

Keep the accepted Charcoal design and previous functional approvals. This contract adds behavioural specificity; it does not reopen the whole visual design, authorize a framework rewrite or grant a new role. Here **academy operator** means a person running the academy; the first live pilot uses existing approved Academy Owner capabilities. Delegated Manager/Player operations, finance, communications, media and other unbuilt capabilities remain future scope.

Authority order remains explicit current Owner instructions and accepted business decisions, the charter, accepted journey contracts, this execution direction and its bounded change packets. A report, library default, prototype, cached membership or written recommendation cannot approve private-data exposure or a privileged operation.

Use this with:

- [Execution guide](../06-delivery/experience-execution.md), [single tracker](../06-delivery/experience-execution.csv) and [generated continuation instruction](../06-delivery/continue-academyos.md).
- [Experience/performance standard](experience-performance-and-data-loading.md), [request/loading/offline standard](../06-delivery/request-hygiene-and-offline-standard.md), [findings](../04-engineering/request-findings-register.md) and [service impact](../04-engineering/request-service-impact.md).
- [Approved redesign](../06-delivery/full-experience-redesign.md), [canonical actions](../06-delivery/app-implementation-action-matrix.csv), [loading matrix](screen-data-loading-matrix.csv) and [security review](../04-engineering/journey-security-review.md).
- [Working-day acceptance specification](../06-delivery/academy-working-day-acceptance.md) and [planned case register](../06-delivery/academy-working-day-cases.csv).

WB identifiers below are behavioural clauses for execution traceability. They do not renumber J/IMP/S/AO/AT/L/SEC records or claim new implemented business features. Canonical requirements and acceptance joins remain in the action matrix.

## The operating model

**Establish the correct workspace → deliver the current task's essentials → reveal independent secondary content → prepare a bounded likely destination where permitted → reuse/refresh by an explicit freshness contract → update affected views after a confirmed change.**

Load the task the person requested. Normal workspace entry can lead to the appropriate existing home after context selection; a valid deep link opens its permitted task directly. Do not force Home first merely to discover information that belongs in a minimal destination read. Keep academy, role, current branch/player/session and branch timezone understandable.

Code/assets, private server projections, authority, navigation preferences and unfinished input are different resources. Preparing route code does not automatically prepare the POST/API data fetched by a client component. A browser refresh also has different guarantees from an in-app route return. Define each explicitly.

Do not preload the entire academy, every sidebar destination, all player profiles or every historical date. Useful preparation is selected by actual next-task likelihood and measured cost. Prefetch must not delay the current task, trigger operating writes, create a role grant or imply that a partial list is complete.

## Behaviour clauses

| ID | Event | Required experience and engineering boundary |
|---|---|---|
| WB-01 | First sign-in / context entry | Resolve identity and current permitted contexts. Distinguish no membership from an unavailable lookup. Keep explicit context selection where existing policy requires it; do not silently select a privileged role. |
| WB-02 | Initial role home | Deliver today's useful sessions/actions before optional summaries. A logo, shell or skeleton is not first useful content. Independent panel failure must not be labelled zero or prevent an unrelated ready task. |
| WB-03 | Direct link | Validate the requested academy/resource/current authority; open the destination or a safe reason-specific recovery. Avoid Home→destination bootstrap when a reviewed minimal destination read can supply context. |
| WB-04 | First navigation to a task | Acknowledge navigation promptly, preserve the shared workspace where appropriate and show the destination's own progress. Fetch minimal critical data; defer history/attachments until needed. A shell mount count alone is not a diagnosis of identity network work. |
| WB-05 | Repeat visit / Back / Forward | Restore the exact safe period, filter, selected ID and return position. Reuse private information only under accepted freshness rules. An accepted cache hit is still scoped by account, academy, capability and projection. |
| WB-06 | Browser refresh / reopen | Preserve supported navigation preferences and original-operation discovery. Do not promise restoration of in-memory private drafts, session storage after every kind of crash, or unapproved offline payloads. Document each supported boundary. |
| WB-07 | Tab return / reconnect | Treat related browser signals as one coordinated event. Do not issue duplicate reads, clear typed input or restart a multi-step operation. If current-authority checking masks data, retain safe structure and geometry. |
| WB-08 | Local selection / language / loaded-page filter | Respond without an operating request when the task is local. Keep focus and inputs usable during unrelated reads. EN/AR switching must not replay an operation or change its identity. |
| WB-09 | Confirmed save | Show local pending feedback immediately; say Saved only after authoritative confirmation. Apply a validated returned projection or invalidate/refetch precisely affected views. Calendar, detail, counts and Home must not silently disagree. |
| WB-10 | Unknown save | Keep the original operation identity and intent relationship. Distinguish confirmed commit with failed follow-up read from unknown commit. Reconcile before replacement; never announce success from optimistic UI or send a new operation merely because a reply was lost. |
| WB-11 | Dirty task / navigation | Keep entered choices separate from retrieved server data. Preserve existing dirty/busy/unknown guards and exact-change review. Clean navigation, scope changes, forced sign-out and tab closure need distinct tested outcomes. |
| WB-12 | Concurrent change | Revalidate expected versions at consequential action. Refresh a clean view according to its contract; show comparison/conflict for dirty work. Never silently overwrite either server history or a person's unsaved choices. |
| WB-13 | Another tab/device | Local successful writes update the current workspace's affected views. Define how another tab learns of changes; do not assume one tab's memory updates every device. Any cross-tab hint must be scoped and carry no private projection/token. External changes require a reviewed refresh/subscription strategy. |
| WB-14 | Academy / role / child change | Cancel incompatible reads, partition or discard results, ignore late replies and establish new current authority. Retain only approved scope-safe navigation. Do not leak a previous academy's title, roster or feedback during the transition. |
| WB-15 | Logout / identity expiry / denial | Clear incompatible private results, caches and pending speculative work under the approved policy. Reauthentication must not turn an uncertain save into a new operation. A disconnected device cannot be remotely erased or immediately learn revocation. |
| WB-16 | Weak connection / offline | Show connection/read/save state honestly. Existing operating writes stay online-only. Do not add a write queue or display cached private information offline without a separate policy. Browser online status is only a hint; real request failures remain possible. |
| WB-17 | Partial failure / empty / filtered empty | Keep Unavailable, no permitted records, no records in this period and no matches on this loaded page distinct. Retry the failed resource at the proper scope. No automatic indefinite retry or zero-valued failed widget. |
| WB-18 | Lists / search / pagination | Keep existing row/byte/window bounds and authoritative totals. Declare loaded-page versus complete-scope search. Preserve sort/filter/cursor provenance; do not scan all pages in the background to make navigation appear prepared. |
| WB-19 | Calendar / timezone / day rollover | Use persisted instants and the branch's authoritative IANA timezone. Retain requested civil period on return; define Today/rollover separately. Do not use host timezone to resolve academy authority or silently move the user's selected period. |
| WB-20 | Inspector / dialog / focused task | Selection updates relevant details without losing the list. Keep short dialogs focused and complex work in its task workspace. Native semantics, focus restoration, Escape and dirty-state guards remain; unrelated controls must not be disabled without reason. |
| WB-21 | Device / zoom / RTL | EN/AR, 320/360/390px, tablet/desktop and200%zoom remain usable. Open keyboard, long Arabic text and scroll-container changes must not conceal the primary action or lose work. |
| WB-22 | Large real workflow | Exercise18-player registers and40-date programs as complete tasks. Show loaded scope and pending/confirmed outcomes; do not substitute one small row for the agreed task volumes. |
| WB-23 | New app / contract version | Define compatibility and invalidation for persisted navigation/recovery references and in-memory projection versions. A release must not replay obsolete operations or mix incompatible cache shapes. Do not introduce service-worker interception as a styling/loading shortcut. |
| WB-24 | Background resource use | Give current work priority over speculative queries. Bound concurrency, response bytes, query keys, retained memory and retries. Hidden tabs, failures and repeated hover/focus events must not create unbounded work. |

## Data-lifecycle ownership

| Layer | Owns | Explicit exclusions |
|---|---|---|
| Identity/session integration | Current identity lifecycle, account transitions and reviewed session handoff | Cached business membership as authority; resetting authentication on each component mount without evidence |
| Scoped workspace boundary | Stable navigation, account/academy/role orientation, layout and route-level context | One global unpartitioned academy store; hiding a role as the only access control |
| Domain read coordinator | Exact scoped key, in-flight deduplication, initial/read/revalidation state, approved memory reuse, cancellation generations and invalidation | Shared public caching of private projections; storing unsaved fields inside a server-result cache |
| Server/API + signed gateway + database | Current authorization, minimal projections, exact target/method proof, limits, authoritative counts and write validation | Client role/TTL as permission; bypassing current checks to meet a time target |
| Draft task state | Current form choices, dirty state, review/version relationships and pending confirmation | Silent mutation by background refresh; automatic persistence of private text |
| Operation recovery | Original operation identity, outcome discovery and replacement fence | Generic retry of a new save; claiming memory survives browser/process loss |
| Presentation | Local feedback, meaningful state, focus/scroll, scope/freshness labels and targeted failures | Inferring Saved/Present/complete/zero from a spinner, cache or failed read |
| Browser persistence | Already approved navigation fields; explicitly reviewed recovery references only where accepted | Tokens, QR bearer values, roster/profile/feedback payloads and arbitrary query-cache persistence |

Inspect current boundaries before introducing another provider/store/library. The architecture packet must name where each ownership sits in the current React/Next structure, how it survives ordinary navigation, and how it resets across identity/academy/capability changes. It must compare keeping the existing coordinator primitives with a single focused query library. The engineer chooses the mechanism from measured fit, compatibility, bundle/runtime cost, recovery semantics and maintenance; the Owner decides user-visible/privacy trade-offs rather than implementation syntax.

The first-paint design must compare a minimal server-delivered authorized projection with coordinated client loading and any safe seed handoff. Do not unconditionally move every read into a root layout or replace an empty client read with a new duplicate hydration fetch. A shared layout is not the sole authorization boundary. Preserve source-proven authority even when the visual shell stays mounted.

## Request ownership and preparation rules

Every pilot resource needs a row in the implementation packet with: owner; subject/academy/capability/branch-or-link/resource; projection version; normalized window/filter/cursor; optional locale/timezone representation; critical/deferred/on-demand/prepared classification; initial/repeat/return/commit/failed budgets; invalidation; and policy/evidence reference.

Required invariants:

1. Identical compatible in-flight work is coordinated. Component subscribers cannot independently refetch the same resource or cancel another required subscriber's read.
2. Only independent queries run concurrently. Signed preview/context/complete-definition dependencies remain real dependencies.
3. A prepared result uses the same key and consumes the same projection as navigation. Do not prefetch a directory, then refetch the identical directory on mount because ownership changed.
4. Background preparation never mints a grant, invokes a mutation/reconciliation fence or captures a QR mark. Reconciliation reads with side effects retain their existing classification.
5. Query bounds remain the existing contract: Calendar≤42days/50summaries per response with byte limit/continuation, applicable directory pages, bounded histories and existing generation windows. Preparation does not mean downloading the whole resource family.
6. Define a finite preparation budget before enabling it. Initial recommendation for review: one speculative data read at a time after the current task is usable, or on explicit navigation intent; cancel obsolete intent and suppress speculative work during failures/hidden activity/critical saves. This number and its triggers are proposed, not configured or policy-approved here.
7. Route-code preparation and private-data preparation are reviewed separately. Turning all Link prefetch flags on is not the shared data architecture.
8. Do not use global polling or add Realtime by default. Decide per resource whether current-task entry, related commit, visible resume, manual refresh or an explicitly scoped subscription is needed.

## Freshness and privacy decision packet — unresolved details

The Owner authorized preparing this approach and updating execution documents. That is **not** acceptance of the following private-data rules. Existing current reads/no-store responses, denial clearing and permitted navigation storage remain until a dependent choice is explicitly accepted. Continue policy-independent coordination/navigation work while decisions are pending; do not wait for an entire future offline product.

| Decision | Concrete recommendation to review | Alternative / consequence | Boundary |
|---|---|---|---|
| WB-P01: in-session private display reuse | Pilot short-lived scoped memory reuse for selected Owner operational summaries;30s is an initial candidate to measure, not an accepted TTL. Show age/checking where meaningful, invalidate after relevant commits and clear on denial/scope changes. Review stricter Guardian/Trainer fields separately within this one packet. | Retain current-authority read before redisplay on every entry; less stale exposure, with a visible network wait. There is no promise of instant private warm navigation under this choice. | Decide permitted data/role, maximum displayed age, resume rules, outage behaviour and revocation-exposure consequence. Cached data never authorizes a command. |
| WB-P02: bounded preparation | Start with intent-driven preparation for a likely task; evaluate one idle background read only after useful content and cost measurements. | No private data prefetch; prepare code only and fetch on demand. Broad automatic preloading is excluded. | Owner accepts any changed private exposure/freshness. Engineering documents rate/byte/concurrency/waste budgets and cancellation limits. |
| WB-P03: memory retention versus persistence | Separate reusable-display age from inactive memory lifetime;5min inactive eviction is a candidate for review, with immediate incompatible-scope clearing. Keep private projection persistence and offline writes disabled. | No cross-route private-result reuse, or a separately reviewed shorter memory lifetime. | An in-memory cache, browser refresh recovery, durable storage and offline display are distinct capabilities.30s/5min are not enabled by this document. |
| WB-P04: crash/unknown-operation discovery | Prepare a minimal caller/academy/resource-scoped opaque locator or bounded authoritative discovery flow for EX-03. Persist no private draft fields. Reconcile the original command and fence replacement under the current authority. | Memory-only recovery remains limited to the current visit. A server discovery design may avoid relying on client retention but requires a reviewed bounded contract. | Decide supported refresh/process/browser-loss cases, reference lifetime and removal, storage failure, account transitions and expired discovery. No receipt-retention or offline-queue period is invented. |

Keep exact decisions in this table/change packet with Owner reply, scope/date and impact. Copy only a pointer to the decision register; do not maintain a competing accepted TTL list in several plans. Additional role/field exceptions must be explicit, not silent defaults inherited from the Owner pilot.

## Per-resource defaults and decision boundaries

| Resource | Current/safe engineering direction | New decision or proof needed |
|---|---|---|
| Public code/assets/versioned catalog labels | Cache/version public assets separately from private responses; avoid unnecessary code delivery. | Prove actual cache/resource behaviour; do not classify tenant configuration as public. |
| Identity/current membership/capability | Preserve current SDK/server authority and exact write checks. A persistent visual workspace can display identity context without treating it as a grant. | Measure actual provider calls before changing lifecycle. No cached permission decision is introduced. |
| Home/Calendar summaries | Minimal current projections and exact scoped in-flight coordination; retain safe navigation/geometry. Owner cold Calendar already uses one current-period read. | WB-P01/P02/P03 before private warm reuse/preparation; cross-view invalidation and bounds tests. |
| People directory/profile | Existing bounded/search/duplicate-review semantics; local selections remain distinct from confirmed records. | WB-P01/P03 for cached payload; defined invalidation after registration; no auto-merge or full-directory background scan. |
| Session plan/roster/publication | Current versions/eligibility/conflicts and signed complete-review receipts remain canonical. | Display reuse cannot reuse approval; dirty/concurrent/publication invalidation tests. |
| Attendance and correction | Immediate local selections, atomic canonical save, current deadline/version/assignment checks and immutable correction history. | No optimistic Saved, automatic absence or offline queue. WB-P04 governs additional durable discovery only after review. |
| Guardian training/published feedback | Current active approved link and enabled view remain required. Private staff reasons/other players stay excluded. | Separate field-level freshness/withdrawal/revocation analysis before reuse; Owner-only TTL is not inherited. |
| QR card/resolve/capture | Existing current card/roster/window validation and duplicate protection; do not log/persist bearer card values. | No offline validity, speculative capture or cache-derived Present. |
| History/large detail | Defer until requested and use existing cursor/field bounds. Preserve authoritative original results. | Cache/version/retention rules if later needed; histories are not fetched to satisfy a Home skeleton. |
| Future finance/media/communications/Manager/Player | Apply the same ownership/state/security checklist when their accepted business slice exists. | Not delivered by this working-day pilot; do not invent those roles' data or rules now. |

## Confirmed changes and view consistency

Each consequential action needs an **affected-view map** before implementation. Example categories, to be matched to actual contracts:

- A confirmed session plan affects its dated detail and relevant Calendar/program/Home projections. Invalidate only keys that actually depend on the changed fields.
- Attendance affects that register and applicable incomplete-attendance/current-mark displays; correction requests and canonical correction results are different transitions.
- A published/withdrawn session or development publication affects only permitted audiences; ending an appointment/link invalidates its compatible views and denies subsequent authority checks.
- Player registration affects the scoped directory and new profile; duplicate comparison is a reviewed operation state, not a cached automatic merge.

Reuse validated mutation response data when sufficient; otherwise reread the affected projection. Do not guess a success count, increment an authoritative total from an incomplete page, or refresh every module to avoid defining dependencies.

Keep unchanged views usable. A read/panel failure cannot undo a known committed write. An uncertain write cannot be converted to a failed write just because a subsequent read also failed. Surface these states in plain EN/AR with optional diagnostics kept separate.

## Multi-user, multi-tab and interrupted work

Classify current active task, clean inactive view, dirty editor and uncertain operation separately. A background change can update a clean compatible projection; a dirty editor needs explicit version comparison at the correct point. An unknown operation must resolve before replacement. The current recording/correction/publication rules do not change.

Start external-change handling from defined current-entry/resume/commit refresh and measured need. A broadcast hint is not proof of remote commit and is never authority. If a cross-tab channel is added, partition by current account/environment/academy/capability, send minimal non-sensitive invalidation hints, reject stale scopes, deduplicate events and test logout/account switches. Adding Realtime, timers or a global connection monitor requires its own bounded contract and measured cost.

Weak-connection and app-upgrade cases must include storage denied/full/corrupt, failure before/after commit, response lost, committed/read unavailable, duplicate and concurrent commands, delayed old replies after a scope switch, and a stored locator from an older client version. Preserve existing behaviour until the replacement is proven; do not discard a recovery fence to make a route feel faster.

## Architecture and design readiness — EX-10

Required bounded outputs before dependent runtime work:

1. Actual-source ownership inventory for the first pilot: root/session/workspace boundaries, route loaders, read owners, draft state, request keys, invalidation and recovery references. Cite files/hooks/API/RPC where relevant; mark unmeasured provider/backend behaviour.
2. A state-transition and request-budget table for cold entry, warm entry, return, focus/reconnect, period/filter change, confirmed save, unknown save, denial and account switch. Record baseline observations that can be reused rather than rerunning completed cases.
3. One consolidated WB-P01–P04 recommendation with exact pending choices and a targeted EN/AR walkthrough of changed states. Existing visual/functional approvals survive; new private reuse/persistence/interaction changes still need their dependent review.
4. One concrete pilot architecture/implementation packet: reuse existing primitives or a justified mechanism, define where ownership persists and what resets, versioned server changes only where necessary, authority/current-state checks, tests, reversible rollout and clear exit criteria.

This documentation checkpoint supplies the contract and planned acceptance cases; it does not complete the actual-source inventory, policy review or pilot architecture implementation. Current work is EX-10 in the tracker. Shared ownership/coordination design is brought forward; do not wait for all of EX-04 or future offline decisions to complete before preparing it.

## Acceptance and evolution

The [working-day specification](../06-delivery/academy-working-day-acceptance.md) defines the first Owner pilot and later role-equivalent checks. Measure useful task readiness, local feedback, blank/blocked intervals, lost input/context, source/API/database results and requests/bytes/costs separately. Reuse existing budgets on declared profiles; do not report synthetic delay comparisons as hosted percentiles.

After pilot implementation, use EX-11 as the explicit working-day acceptance gate before broad adoption. A scoped Owner pass is not full-role completion. EX-05 database/cost and EX-08 measurement accompany every batch; EX-09 supplies only the decisions needed for that capability. Preserve all unresolved findings and future scope. Update source contracts, matrices, captures, tracker and generated prompt after each checkpoint, with separate local/deployed/hosted/Owner/security status.

## Engineering references and documentation checkpoint

Use current framework guidance with the actual locked versions when preparing the implementation packet: [Next navigation/prefetch/streaming](https://nextjs.org/docs/app/getting-started/linking-and-navigating), [authorization near the data boundary](https://nextjs.org/docs/app/guides/authentication), and [query lifecycle defaults](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults). These are technical references, not a requirement to add a library, permission to cache authority or acceptance of library defaults.

[Documentation/routing checkpoint](../07-handoff/working-day-execution-update.md) records what was updated and structurally checked. It does not execute this operating contract or close EX-10/EX-11.
