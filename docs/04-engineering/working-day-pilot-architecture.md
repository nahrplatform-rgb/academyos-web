# EX-10 — connected Owner working-day architecture and decision packet

## LF-v2 supersession notice —2November2026

**Superseded proposal, not awaiting approval.** The Owner clarified persistent local datasets across visits and progressive synchronization, rather than this v1 summary-only memory pilot. Read [local-data and sync plan](../06-delivery/local-data-and-sync-plan.md). Earlier source inventories and synthetic storyboard receipts remain historical evidence; no approval, private runtime store or operating pass is inferred. Do not use the old30second/5minute/intent-only bundle as current defaults.

2 November 2026. Source inspected at `da24885ec77e31870b76b5c169cb6d3bb616c460`. **Prepared, not implemented or Owner-approved.** This checkpoint changes documentation and a fictional changed-state walkthrough only. No new hosted reads, writes, migrations, provider changes, access grants or app rollout establish this packet.

## Authorized outcome and joins

Continue the current EX-10 instruction: map actual ownership, define bounded pilot architecture and prepare one consolidated freshness/recovery review before dependent implementation. Preserve the accepted Charcoal experience and operating rules. The pilot is existing Academy Owner Home → Calendar → dated planning/register → Back → People/profile, including interruptions. Trainer, Guardian and Platform Owner retain their current, stricter reads; their adoption is separate.

Canonical joins: IMP-J01-A01, IMP-J06-A01, IMP-J09-A01, IMP-J10-A01 and their existing action-matrix J/S/AO/AT/security associations; L01/L04–L07. Behaviour WB-01–WB-24 and planned WD-01–WD-32 remain in the [working-day case register](../06-delivery/academy-working-day-cases.csv). Findings NR03/04/06/07/08/13/14/15/16/17 and G01/G08/G09 are affected; none is closed here. Full action families are not implemented merely because their pilot subset participates.

Read with the [behaviour contract](../03-design/academy-working-behavior-contract.md), [acceptance specification](../06-delivery/academy-working-day-acceptance.md), [findings](request-findings-register.md), [service impact](request-service-impact.md) and [execution tracker](../06-delivery/experience-execution.csv). Source anchors and hashes are in [the source inventory](../07-handoff/evidence/working-day-pilot-2026-11-02/source-inventory.csv). Anchors below describe functions, not newly measured runtime results.

## Current source: what actually owns the work

| Resource/state | Current owner and evidence | Observed source consequence / boundary |
|---|---|---|
| Identity | `apps/web/src/app/layout.tsx::Layout` wraps root children in ClerkProvider; each protected page still calls auth.protect; `experience-workspace.tsx::ExperienceWorkspace` waits for useUser | Root provider already exists. Repeated page checks/mounts do not prove repeated Clerk network calls. Do not move/recreate identity to fix a presentation shell. |
| Locale | `[locale]/layout.tsx` sets lang/dir; domain components also own local locale controls | A local language change can be UI-only today; route language changes have different remount behaviour. Cached raw data must not mix translated server projections. |
| Visual shell/layout | `workspace-shell.tsx::WorkspaceShell` constructs WorkspaceLayoutProvider for each rendered domain shell; `workspace-layout.tsx` stores only layout preferences in localStorage | Presentation shell is route-owned. Hoisting it requires extracting domain navigation/actions without nesting duplicate shells; geometry fixes are useful retained evidence, not shared data ownership. |
| Home / Calendar | `experience-workspace.tsx::ExperienceJourney` owns home/data/busy/error/revision, AbortControllers and generation; navigation coordinates in scoped sessionStorage | Owner cold Calendar already has one `owner_current_calendar` read. Explicit period uses `owner_calendar`. Resume clears home/data/selection and performs a current read; route-return restores coordinates, not private projections. |
| Visible return | `lib/visible-resume.ts::listenForVisibleResume` pairs focus/visibility without a freshness lease; Experience/People/date planning adopt it | Useful primitive; still one listener per subscriber/component. Attendance has its own focus/online effect. A shared coordinator must replace conflicting ownership, not layer another listener over it. |
| Dated plan | `date-planning-workspace.tsx::bootstrap/read/review/save/recover` owns plan, intent, stage, pending UUID and locks | Explicit Home/Calendar return omits dates directory; other entry can issue independent plan/directory reads. Save is followed by a detail read. `remember` catches storage failure and can still issue the write; refresh recovery needs EX-03. |
| Register | `attendance-workspace.tsx::read/saveRegister/reconcile` owns roster, unsaved marks, review dialog and pending UUID | 18-player fixture fits one 50-row page. Read can replay already loaded pages up to its existing 1000-player bound; no assumption every register costs one read. Storage failure blocks a new save. Confirmed receipt precedes roster refresh; failed refresh must not become unknown commit. |
| People | `people-workspace.tsx::loadDirectory/openProfile/reviewCandidates/save/reconcile` owns list/profile/search/draft/operation ref | Search debounce is 300ms; one normalized character does not read. Directory/profile/candidate reads are distinct. Save catches locator-storage failure and proceeds; unknown remains recoverable only while identity survives in memory. A profile follow-up must not be counted as a second create. |
| Authoritative boundary | `app/api/experience/route.ts::POST`, `lib/onboarding-server.ts::onboardingSession/rpc`, `lib/onboarding-gateway.ts::gatewayFetch` | API validates staging origin/body/identity, applies outer limiter, signed gateway/inner limiter and caller-bound RPC. Responses no-store. Current membership/role/link and write versions remain server-enforced. Client cache keys are isolation aids, never authority. |
| Downstream cancellation | gatewayFetch replaces signal with its own 10-second timeout | UI abort/generation can prevent late display; it does not establish that SQL/Redis work stopped. Do not book backend request savings from aborted browser work. |

This inspection confirms the ownership problem, not a new all-role performance run. Existing hosted Owner current-calendar receipt is retained at [EX-04](../07-handoff/request-remediation-ex04-current-calendar.md); there is no new alias-to-source verification in this packet.

## PYSA reference inspected for this checkpoint

Read-only reference: `pysa-platform/lib/query/query-client.ts`, `components/manager/schedule/schedule-calendar.tsx` around scheduleQuery/programsQuery, `platform-description/PYSA-current-surface-reference.md`, and `engineering-audit/01-audit-coverage/workflows-reviewed.md`. The [scheduling reference review](../03-design/pysa-scheduling-reference-review.md) remains the fuller reference.

Useful patterns: weekly/monthly window key, separate program query enabled only for the active tab, route-to-session continuity and previous-data presentation. Current local PYSA query-client source sets staleTime 0, gcTime 5 minutes, one read retry, no mutation retry and focus refetch false; Schedule overrides staleTime to 10 seconds and uses keepPreviousData. These are PYSA implementation choices, **not accepted AcademyOS policies**. Schedule mutations shown in that file invalidate a tenant prefix, which is broader than the proposed affected-resource map below. Audit WF-0012 retains partial correction/concurrency proof and WF-0002 records stale principal/preview concerns. Neither a query library nor previous-data UI resolves authority or recovery by itself. No PYSA runtime or private data was accessed, source changed or successful hosted behaviour inferred.

## Proposed architecture — ready to implement in bounded stages after scoped review

### Workspace lifetime and first paint

EX-02 introduces one client workspace boundary under the existing locale/academy route, with an explicit principal and capability scope. Keep root ClerkProvider. The boundary owns shared navigation/lifecycle and the resource registry; it does not fetch membership as a redundant second bootstrap or authorize a page. Protected pages and API/DB checks remain. Public/Platform/Guardian/Trainer paths cannot inherit Owner data from a URL role string. On scope uncertainty, hide/discard private records and establish current authority before rendering them.

Refactor the shell into frame and task content incrementally. Home/Calendar first; keep a compatibility adapter for unmigrated domain shells, never two visible frames. Domain actions/dirty guards remain registered by the mounted task, with cleanup. No hidden mounted copies of every page. Local task input stays task-owned; memory result reuse never promises to retain an unmounted private draft.

Compare first-paint strategies:

| Option | Fit / decision |
|---|---|
| Existing coordinated client projection | **Pilot starting point.** Keep existing no-store signed API path and Owner one-read current Calendar; share its actual response owner across pilot routes. Does not add a new auth transport or duplicate read. Loading still exists on first entry. |
| Minimal server-seeded private projection | Possible later measured experiment. Must invoke the same reviewed current-authority/gateway contract server-side, pass the exact projection/version/receipt time and suppress duplicate client mount fetch. Forwarding arbitrary Origin or using privileged RPC is prohibited. Current route handlers use request-bound origin checks, so copying them into a root layout is not a ready solution. |
| Entire academy/root data bootstrap | Rejected: competes with requested work, expands private exposure, duplicates deep-link reads and cannot bound dataset size. |

No server-seed latency/bundle claim is measured here. First EX-02 baseline records navigation shell, identity network activity where available and useful destination readiness separately. Preserving a frame alone does not make private content instant.

### One resource owner, not one global business store

Proposed read key:

`[projectionVersion, subject, academy, capabilityClass, resourceKind, branchOrLinkScope, normalizedParameters]`

Parameters include exact program/day/event/player as applicable, period/view/cursor/search, schedule/version constraints when part of the projection, and locale only where server output differs. Never serialize tokens, signed URLs or private display text into diagnostics. Missing authoritative branch/link scope cannot be guessed from an unrelated result. Maintain separate keys for Home summary, current Calendar and explicit Calendar; use a validated canonical period alias after the current response resolves, without triggering another read. Home's today items are not a complete Calendar page or register seed.

Read states: `idle`, `initialPending`, `readyCurrent`, `readyReusable` (accepted scope/age only), `checkingMasked`, `unavailable`, `denied`. A commit state machine is separate: `editing → reviewing → submitting → confirmed` OR `unknown → reconciling → confirmed/notCommitted`; a read failure after confirmed commit stays confirmed. Clear denial across incompatible registry results, consumers and speculative work; late old-generation replies cannot repopulate it.

Shared reads have subscriber ownership/refcounts; one consumer leaving must not abort another consumer's required work. Terminal read failure has no automatic retry loop. Explicit Retry uses the same resource owner; relevant resume events coalesce into one in-flight request, including just-finished focus/visibility pairing. Dirty/unknown tasks may defer refreshed display; consequential commands always validate current server versions/authority. Last-read success cannot authorize a write.

### Mechanism comparison and selected engineering direction

| Mechanism | Benefits | Cost/risk / decision |
|---|---|---|
| Extend existing refs + visible-resume + external scoped registry | Small initial payload; no dependency; preserves existing transports | Current primitives are page-local, not a cache. Building subscription ownership, key eviction, invalidation and race-safe async state is substantial new code. Use existing guards/transports, not many competing custom caches. |
| One TanStack Query v5 read coordinator | Explicit keys/subscriptions/invalidation/cancellation and future bounded prefetch; fits several real pilot domains | **Recommended for EX-06**, subject to pinned-version React19/Next16 compatibility, bundle and contract spike before installation. One scoped QueryClient; no persistence plugins/devtools in product; disable implicit focus/reconnect retries and register one reviewed lifecycle owner. Default retry/stale/GC values do not establish policy. Keep writes/recovery in existing domain adapters initially. |
| SWR or mixed query libraries | Also provides read reuse | No second competing library; no proven project advantage justifies parallel stores. |

This is an engineering recommendation, not an Owner choice of package syntax. EX-06 must record exact lockfile/version/bundle delta and compare a small two-subscriber/two-route spike before a dependency is committed. Defaults must explicitly set no automatic query retry, no mutation retry/offline queue, no background polling, no private persistence and policy-driven display gates. A library's staleTime cannot substitute for mask-on-resume/denial behaviour. Directly seeding Calendar from a narrower Home item is forbidden.

Official guidance consulted2November2026: [Next layouts](https://nextjs.org/docs/app/getting-started/layouts-and-pages), [Query defaults](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults), [cancellation](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation). Layouts can preserve state across navigation; query defaults include stale/refetch/retention behaviour that must be configured. An AbortSignal is useful only if transport consumes it. These guides support mechanism options, not a passed AcademyOS integration. Supabase changelog markdown fetch was unavailable through the web reader; no Supabase SDK/schema change is proposed by this packet.

## Pilot resource/request contract

Counts below are **proposed acceptance ceilings for the declared first page**, not new measurements or whole-pilot totals. API/RPC counts exclude document/RSC/assets/identity; instrument those separately. Each successful one-RPC read retains outer/inner limiter work. Existing caps and contracts prevail. Rows beyond the first page add one explicit bounded page read each; there is no automatic drain of every directory.

| Resource and owner | Key-specific inputs / current transport | Initial / repeated / return / refresh budget | On demand / after confirmed change |
|---|---|---|---|
| Owner Home summary | Owner scope + home projection; `/api/experience owner_home` | 1; repeat ≤30s 0 only if P01/P03 accepted and not invalidated; >30s 1; visible resume1 even if younger | Exact own-commit dependencies dirty Home. Revalidate when visible, not every hidden panel. Home's optional SQL panels are already one RPC response; don't claim streamed network independence. |
| Current Owner Calendar | scope + view; `owner_current_calendar` | 1 on unknown branch day; canonical response must not trigger second read | Keep existing setup/timezone result. If Today becomes uncertain at branch rollover, current read1; explicit selected period need not jump. |
| Explicit Calendar page | scope + normalized from/to/cursor; `owner_calendar` | 1 per requested page/window; repeated eligible result0; otherwise1; refresh/resume1 per visible page | Max42days/50summaries/page and existing JSON cap. Filter/select already-loaded page0. First-page total never implies all rows loaded. |
| Individual dated plan | scope + program/day/page; `/api/planning read` | 1 direct Home/Calendar entry; other entry existing independent dates read adds1 only if directory is visible/useful; all repeat entries1 until separately approved | Candidate search1/page on explicit search; review1; save1; follow-up read1 if receipt not full projection. No auto cached writable plan. |
| Register | scope + event/roster cursor; `/api/attendance roster` | 18-player first page1; repeat1 (names excluded from reuse); refresh visible loaded pages by explicit tested policy | Local status/filter/query0; register save1; authoritative follow-up1 for first page; history1 per requested player/page. Unknown reconciliation is a command/fence, not generic query prefetch. |
| People directory/profile | scope + normalized search/cursor OR player; `/api/people list/profile` | 1 per requested page/profile, repeat1 (names/contact excluded from reusable cache); debounce300ms retained; one-character query0 | Duplicate candidates1/page on explicit review; create1; profile follow-up1; no auto-merge or bulk directory preload. |

The proposed reuse scope is deliberately small: only Owner Home/Calendar responses, including their currently permitted session/program/task summary text, counts, branch/sport/timezone and permitted destinations. **Exclude player/guardian contacts, roster/player names, profile bodies, attendance rows, feedback/reasons, invitation bearer/QR values, signed review payloads and operation responses from cross-route reusable private cache.** A current mounted task can still hold its existing authorized data and input under current rules; that is not permission to persist it or display it after incompatible scope.

Without P01/P03 acceptance, shared in-flight work may still deduplicate compatible simultaneous reads, but every settled private route entry checks current data before redisplay. Do not promise zero loading under that alternative. A prepared query also obeys a display policy; approval of prefetch alone cannot waive P01.

### Affected-view invalidation and response use

| Confirmed operation | Immediately invalidate / refresh when active | Do not do |
|---|---|---|
| Dated plan save | exact plan+roster/candidates impacted by versions; program/date summary; intersecting Calendar windows; Owner Home work counters | Guess occupancy or invalidate every player/profile; erase another dirty task |
| Register save / correction | event roster/history and correction list as applicable; Home incomplete-attendance count; session summaries carrying saved counts | Mark unselected players Absent; derive scope counts from loaded18 rows; call register again after read failure |
| Player registration | directory/candidate sets in that academy/branch; exact returned profile; authoritative totals where present | Auto-merge; treat a directory page as full academy; generic cross-tenant invalidation |
| Publish/withdraw/move/cancel | exact occurrence/program; intersecting calendars; role home projections and relevant published schedule resources | Broaden visibility; retain withdrawn private rows just because memory TTL remains |
| Membership/link/access change or denial | clear affected subject/capability registry, cancel pending work, suppress late replies and request current context on allowed recovery | Infer restoration from previous metadata, carry Owner data into Trainer/Guardian |

Write receipt validation and idempotency remain in existing domain functions. Receipt-only responses may invalidate but cannot seed a full projection. No cross-tab private payload broadcasting. First pilot uses current-task resume/current reads for other-device changes; no polling/Realtime is added. A later scoped nonprivate invalidation hint still requires a separate implementation/security review.

## Consolidated WB-P01–P04 recommendations — Owner review pending

| ID | Recommended exact pilot choice | User-visible consequence / honest limit |
|---|---|---|
| WB-P01 | Owner Home/Calendar summaries only: at most30seconds since last successful authoritative response may redisplay on same visible-tab internal return, provided no related invalidation/scope change occurred. Above30seconds, on focus/visible return/reconnect, on identity uncertainty, or failed network/read: mask private summaries and make one current read; no offline private display. This is a maximum age at internal redisplay, not a remote-revocation guarantee for an already mounted idle page. Mounted pages retain current lifecycle/manual/action checks; no periodic polling is added. Do not restart a command. | Warm return can be immediate. A return may reuse a result up to30seconds old. Already mounted idle pages may remain unchanged until their next lifecycle/manual/action check; there is no30second global revocation guarantee. A successful action still checks current authority. Cannot promise remote erasure or instant revocation on a disconnected device. Trainer/Guardian/player/roster/profile/feedback projections excluded. |
| WB-P02 | Intent-only preparation of one Owner Calendar first-page read after usable Home; explicit pointer/focus intent on Calendar, not sidebar visibility or boot-time sweep. One speculative request at a time, no automatic retry; no additional data read if a valid same-key result/in-flight read exists. Suppress when hidden/offline/error/dirty/unknown/critical-save; never prefetch a mutation. No idle speculative data reads initially. | Likely next Calendar can be ready; unused intent can spend at most one bounded read per distinct intent/key until invalidation/expiry, not one read per pointer event. New intent cycles after expiry remain user-dependent cost; measure waste. Keyboard focus preparation follows same bound. |
| WB-P03 | Only above Owner summaries in tab memory: remove inactive results after5minutes or earlier capacity eviction, and discard incompatible scope immediately. Cap at8 result keys/256KiB serialized projection size for pilot; don't evict an actively used dirty task. Display lifetime remains30seconds, never5minutes. No browser/private query persistence or offline queue. | Refresh loses reusable results; a new current read is expected. No guaranteed cache hit after resource pressure. Discard expired inactive entries lazily and on lifecycle events; display-age eligibility is checked before reuse, not extended by reading the entry. Memory-size target is a software cap, not a measured heap guarantee. |
| WB-P04 | Strengthen existing per-tab sessionStorage operation UUIDs: same principal/academy/resource/operation type and contract version; persist and verify locator before sending a new pilot consequential write; if storage unavailable, block submission and retain input. Retain locator while outcome unknown, remove after validated terminal result; same-tab refresh recovery requires current authentication and original reconciliation. Existing backend records/lifetimes unchanged. No locator contains name, status choices, reasons or credentials. | Supports same-tab reload while browser retains its sessionStorage; no promise after closed tab, cleared storage, process/session restore failure or different device. Unknown must never silently expire into replacement. A future bounded server discovery contract is required to promise storage-loss recovery and remains open, not implicitly approved. Scope switch blocks dirty/unknown departure; forced logout removes private UI while same-subject locator handling requires explicit account-isolation tests. |

P04 does **not** authorize indefinite new server retention or arbitrary browser persistence. An opaque locator still reveals resource relationship metadata; it remains subject-scoped and not authority. If current server outcome is no longer discoverable, present unresolved recovery and block replacement; do not erase the fence. Implementation must document logout/return-to-same-account and expired-operation handling before pilot writes are accepted. Current operation UUID/key storage already exists, but uniform fail-closed behaviour/versioning is a change requiring this review.

Alternative bundle: no private summary reuse or preparation; preserve exact shell/navigation while checking data on each route entry; block writes without supported recovery identity. This cuts duplicate in-flight work and layout disruption but retains private-data wait. Approving the recommended bundle would accept these scoped policy trade-offs only, not working-feature/security acceptance, new accounts or privileged access.

## Changed-state walkthrough and review

Open [the bilingual targeted walkthrough](../../design/working-day-pilot/index.html). It is a labelled **fictional behaviour storyboard**, not the current factual HTML, actual API counters, approved new design or performance test. It demonstrates cold entry, proposed warm return, over-age checking, failed network, dirty input, unknown write, confirmed-save/read failure, denial and storage failure. Review both the fast-return benefit and the privacy/recovery limits. It intentionally avoids redoing the approved whole-app visual design. The [factual review](../../design/app-experience-review/AcademyOS-experience-review.html) remains current-source evidence, unchanged by the storyboard.

## Bounded implementation sequence and proof

1. **EX-10 current:** review this packet and changed states; record exact P01–P04 reply. Independent source/compatibility work may proceed without enabling pending behaviours. No runtime policy or design acceptance is inferred from this packet's existence.
2. **EX-02:** stable scoped workspace/navigation frame, shared lifecycle seam and task guard registration for Owner Home/Calendar first. Keep APIs/no-store/current-authority checks. Compare mounted shell, focus/local input, scope denial and route readiness; don't wait for query caching to prove this step.
3. **EX-06:** two-route read-owner spike and mechanism receipt; if accepted, bounded summary reuse/intent preparation; subscriber cancellation, key isolation, denial/expiry clearing, no duplicate seed/mount, caps and targeted invalidation. Keep unaccepted capabilities off.
4. **EX-04:** remaining measured first-use/date/register dependency work; preserve deployed Owner current-calendar1read. Do not parallelize signed receipt dependencies or report UI aborts as stopped SQL.
5. **EX-03 prepared concurrently:** People/date-plan storage-denied and refresh identity tests; reconcile original commit/noncommit; classify read-after-confirm failure; block unsafe replacement. No private draft persistence.
6. **EX-11:** declared Owner connected working day18players/40dates, EN/AR desktop/phone/zoom, real lower-layer source/API/DB proof where changed, and separately authorized hosted subset. Measure before/after successful tasks and failures, request counts, bytes/limiter work, blank intervals and local response. Existing≤3s useful p75/≤200ms local p75/<800ms reads p95/CLS≤0.1 remain targets, not current results.

Each step can roll back its own coordinator/frame adoption to existing no-store per-route reads without replacing the original operation ID. Do not remove old recovery until successor tests pass. A persisted unknown locator version cannot be ignored on rollback; retain a compatible discovery adapter or stop writes. No schema needed for the read-owner/frame pilot; new server discovery would need its own versioned contract and backup/release gate.

## Evidence status

- Design/policy: packet and fictional walkthrough prepared; consolidated Owner review pending.
- Implementation: no product/coordinator/cache/dependency/API/schema change in this checkpoint.
- Local: source anchors/hashes, documentation/canonical routing and storyboard checks recorded in [checkpoint receipt](../07-handoff/evidence/working-day-pilot-2026-11-02/checks.json); no new operating workload/latency proof.
- Deployment/hosted: not newly performed; earlier scoped releases retained. Documentation push is not a pilot app release.
- Owner working acceptance, independent security, physical-device and provider-cost/load proof: open.
