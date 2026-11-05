# Whole-app request and service impact — 31 October 2026

**5 November EX-13B measurement:** the [closed backend receipt](../07-handoff/ex13b-workspace-transfer-checkpoint-2026-11-05.md) records five actual handler/SDK/gateway/PG phases for a 56-player directory, 3,305 outbound RPC body bytes and 15,442 database-response bytes in that local fixture. Ten logical limiter checks are not regional Redis commands; real Clerk/Redis/hosting cost and whole-session traffic remain unmeasured. The new Calendar page bounds display joins after an indexed candidate slice. No normal-screen caller or live request saving is delivered yet. Local advisor output has zero WARN/ERROR and 164 INFO; four new-object notices are dispositioned, with legacy FK/index workload measurement retained under EX-05. This disposable schema is not a refreshed hosted catalog or independent review.

**Latest Owner review/role direction — 4 November 2026:** [Current staging policy](../00-governance/staging-delivery-and-review-policy.md) defers independent human/external security review without blocking any currently authorized synthetic staging work, including otherwise-authorized private offline activation. Keep actual engineering checks, access/configuration authority and separate acceptance. Follow [the dedicated-role plan](../06-delivery/staging-role-separation-plan.md): distinct Platform Owner and Academy Owner accounts/journeys first, controlled cleanup preserving history; no account/data mutation is authorized or executed by this documentation update. Earlier external-review prerequisites below are superseded, not marked passed.

3November isolated measurement: [EX-06 typed repository evidence](../07-handoff/evidence/local-register-repository-2026-11-03.json) records30actual covered local reads with zero key/operating requests,1000players/20server-shaped fixture pages,≤50local rows, exact original wire/cipher bytes and fixture key exchanges. [Scope/limits](../07-handoff/local-register-repository-checkpoint.md). The product does not import this adapter: **before/after product provider traffic is unchanged**, not an achieved quota saving. Physical disk usage, real provider costs, full working-day percentiles and hosted private authority remain unmeasured; no historical provider limit is refreshed by these tests.

## Persistent local data and synchronization — LF-v2,2November2026

Current target [local-data and sync plan](../06-delivery/local-data-and-sync-plan.md) adds separate first-download, unchanged-manifest, changed-page/replacement, local-query, multi-tab, restart/eviction and failure budgets. Manifest/hash SQL and limiter work still count; persistent local reads can avoid repeated dataset transfer only after implementation/evidence. The dated provider limits/models below are historical observations, not newly verified pricing or measured local-sync savings.

## Working-day execution follow-up —2November2026

Use the [behaviour contract](../03-design/academy-working-behavior-contract.md), [pilot measurement protocol](../06-delivery/academy-working-day-acceptance.md), [case register](../06-delivery/academy-working-day-cases.csv) and [tracker](../06-delivery/experience-execution.csv). EX-05/EX-08 evidence accompanies every affected batch. Measure whole declared visits: critical/deferred/on-demand/prepared reads, return/resume, confirmed-save invalidation, reconciliation, retries, used/wasted preparation, bytes and available query/provider work. Faster local transport samples and fewer app calls do not establish SQL/Redis/Auth/egress savings or hosted percentiles. G01–G09, current-plan verification and private-cache/telemetry decisions remain explicit. No pricing/billing/limits were newly checked or changed by this documentation update.

Analysis/documentation only. Source base: `7a6be974eaf9826f33d9ecfce4accf0e568b3a0c`. Product files unchanged; existing uncommitted focused report/evidence and builder link preserved. This extends [the navigation baseline](navigation-refresh-investigation.md); it does not replace its limited runtime observations. [Findings and coverage](request-findings-register.md), [build standard and fix handoff](../06-delivery/request-hygiene-and-offline-standard.md), [evidence index](../07-handoff/evidence/navigation-refresh-2026-10-31/index.json).

## Executive summary

The refresh complaint has three proven causes: internal document navigation, refreshes that erase the current task, and lifecycle events that can start overlapping reads. Source review extends these patterns across implemented journeys. The source also shows sequential context/detail reads and repeated database aggregate/eligibility work. These mechanisms can increase latency, hosting work, database load and Redis commands. Their total monthly share is **not measured**.

Top five remediation priorities:

1. Replace the demonstrated internal document transitions with guard-preserving client navigation. Keep external identity exits and terminal recovery reloads deliberate.
2. Coordinate identical scoped reads and resume events; cancellation and stale-response guards alone do not deduplicate backend work.
3. Preserve nonprivate structure, filters, focus and a selected identifier during revalidation. Recheck permission before redisplaying private results; proposed stale-private display is a separate decision.
4. Remove unnecessary full-Home bootstrap from a cold Calendar visit and profile/detail refresh waterfalls where a reviewed minimal contract can do so safely.
5. Measure and reduce Home aggregate/per-row work before adding indexes or cross-request caches. Preserve authoritative counts and caller-bound checks.

An additional recovery finding needs a bounded fix: Development keeps an uncertain operation identity in React memory only. Normal in-visit reconciliation exists, but a crash/document loss does not retain that identity. This is not proof of duplicate commits; version/idempotency protections still apply.

**Analysis coverage is complete at the declared classification level, with assigned measurement gaps. Whole-app authenticated runtime/performance validation remains incomplete.** No hosted Trainer/Guardian access was restored. No production fix, telemetry, deployment, access change or hosted operating write occurred.

## Real service architecture

Ordinary protected data path: component POST → Next route staging/origin/body/identity checks and outer limiter → caller-bound Supabase client → RPC whitelist, inner limiter and signed gateway proof → reviewed database function → bounded private JSON. Auth is Clerk, not a Supabase email/password flow. The token is supplied as external accessToken; browser session persistence/auto token refresh are disabled on this server Supabase client. A read's SQL statements are not separate billable HTTP calls.

| Service | Actual purpose / callers and trust boundary | Verified configuration / plan | Usage and unknowns |
|---|---|---|---|
| Vercel / Next | Route rendering, `/api/*`, static assets, delivery/webhook handlers; caller identity and gateway enforcement | Native dashboard shows AcademyOS **Hobby**, existing academyos-web project. Connector lists no projects despite native access; no configuration change | Last-30-days dashboard Sep30 4pm–Oct30 5pm: 148.39MB Fast Data Transfer, 105.83MB Fast Origin Transfer, 27K CDN requests, 16s CDN request CPU, 223 ISR reads; AX also exposed rounded 42K function invocations. Timezone unspecified. [Capture](../07-handoff/evidence/navigation-refresh-2026-10-31/vercel-usage.png). Includes tests/deployments and all project activity; not a per-user benchmark. Current alias/source not freshly reconciled by this analysis |
| Clerk | `auth()` / `getToken()`, browser identity/session SDK; `users.getUser` recipient verification in onboarding server; OTP webhook delivery path | accounts.dev development issuer/source. Configured billing plan not verified | Auth SDK may reuse token/session state. No evidence every auth() call invokes BAPI. Current MRU, BAPI/FAPI traffic and OTP delivery totals unavailable |
| Supabase | PostgREST RPC, caller JWT plus gateway proof, current identity/membership/relationship checks inside definer functions | Project academyos-staging, eu-west-1, PG17.11, healthy; organization API says **Free**. 58 academy tables, all58 RLS enabled, authenticated direct SELECT grants0. No academy/public/storage policies returned; deliberate direct-table denial, not proof authorization is absent | DB16,209,587 bytes (~16.2MB decimal); estimated62 training dates,44 date plans,43 roster rows,4 players. Storage objects0; Edge Functions list empty. No current billing egress/third-party MAU totals retrieved |
| Upstash Redis | Outer per-subject route limiter and inner signed-gateway limiter, sliding window; no generic business cache | analytics:false, ephemeralCache:false, SDK retries0. Configured database region/replication/plan not verified | Two limiter evaluations per successful single-RPC read. Regional official algorithm estimate8–10 Redis commands total; actual dashboard commands/latency unknown |
| Upstash QStash | Durable explicit invitation/delivery jobs, not ordinary reads | Source EU endpoint and reviewed signed delivery handling; current plan unknown | Sends/retries/dead-letter counts not retrieved |
| Resend | Explicit invitations and configured verification-email delivery; provider acceptance differs from inbox delivery | Current plan unknown | No emails on ordinary Home/Calendar reads. Email totals/delivery retries not retrieved |
| Cloudflare | Recorded DNS-only staging routing and R2 scheduled backup objects | DNS-only/R2 configuration is historical handoff evidence, not freshly verified provider state. No application Worker/runtime call found | Daily backup workflow independent of navigation. Current R2 size/operations/plan unknown; never multiply backups by clicks |
| Sentry | Sanitized error reporting; server/client instrumentation config | Source disables tracing/replay, breadcrumbs and private logs; current billing plan unknown | No current performance percentile telemetry can be inferred. Current error-event quota/usage not verified |
| GitHub Actions | Build/check and daily staging DB backup to R2 | Existing workflows; no changes | Build minutes/artifacts/backup transfer independent of normal navigation; account usage not retrieved |

### Database evidence and limits

Read-only catalogs, function definitions/hashes, existing pg_stat_statements, performance advisor and **plain EXPLAIN**, without executing analyzed queries, are in the evidence index. No statistics reset, cache flush, extension, EXPLAIN ANALYZE or operating writes.

- Snapshot:146 academy indexes; performance advisor reports44 unindexed-FK and21 unused-index suggestions, all informational. Suggestions are hypotheses for workload review, not permission to add/drop indexes. Small relation sequential scans can be cheaper than indexes.
- Owner surrogate EXPLAIN uses training_programs_cursor with a tiny training_dates sequential scan; training_dates_effective_window already exists. Family surrogate EXPLAIN uses a tiny publication_events scan with a computed branch-local date filter. Neither plan is a complete authenticated RPC execution plan or runtime benchmark.
- Cumulative RPC statistics: x15_owner_home_v1 58calls /66.918ms mean database execution; x15_owner_calendar_v1 58calls /27.076ms mean. m1_setup412calls /6.26ms; m1_context93 /18.659ms; q13_context64 /17.212ms. Statements selected by total execution time, not complete traffic. The stats reset date is October2 and cannot be equated to the dashboard billing window; administrative/test traffic included.
- Native app reads in B0 took724–1230ms in mixed contexts. Those browser samples and cumulative SQL means are different populations; subtracting them does not measure Redis, Clerk, network or rendering latency.
- Existing indexes cover identity subject, active membership, academy/date/program and publication Trainer/time and family/time. Candidate query rewrites must preserve branch timezone/DST, publication snapshot and live membership/link checks. No demonstrated production missing-index outage.
- pg_stat_user_tables counts are estimates; connections13 is one snapshot, not capacity or concurrent end-users. track_functions is none; function_stats absent. No claim of measured WAL/cost per operation.

## Published allowances versus configured plans

Official pages checked31October2026. Limits below are service allowances, not app capacity. Recheck before implementation/purchase; shared account/environment usage can consume them. Price examples exclude taxes and are not a forecast.

| Official meter | Published reference | Application interpretation |
|---|---|---|
| Supabase Free | Unlimited API requests;500MB database/project, shared CPU/500MB RAM;5GB egress and separate5GB cached egress;1GB Storage;50K third-party MAU/month;200 peak Realtime connections /2M messages/month;500K Edge invocations/month | Configured Free confirmed. Unlimited API calls does not mean unlimited compute, connections or bytes. Direct DB RPC egress cannot be assumed to use cached-egress allowance. [Pricing](https://supabase.com/pricing) |
| Supabase third-party identity | Unique users accessing through third-party identity count in billing cycle, not each request | Clerk users may count in this separate meter; repeated requests do not multiply MAU. This is distinct from native Supabase Auth MAU. [Third-party MAU](https://supabase.com/docs/guides/platform/manage-your-usage/monthly-active-users-third-party), [Clerk integration](https://supabase.com/docs/guides/auth/third-party/clerk) |
| Vercel Hobby |1M function invocations/month,1M CDN requests,100GB Fast Data Transfer,10GB Fast Origin Transfer,4 active CPU hours,360GB memory-hours | Confirmed Hobby. Incoming function requests count even when rejected; network wait differs from active CPU but can retain memory. RSC/prefetch/cache behavior changes exact totals. [Hobby](https://vercel.com/docs/plans/hobby), [Functions meters](https://vercel.com/docs/functions/usage-and-pricing) |
| Redis | Free500K commands/month,250MB storage,10GB bandwidth; Pay-as-you-go$0.20/100K commands | Actual plan unknown. Sliding-window allowed evaluations use5first/4intermediate commands, rejected3; global replication can increase work; analytics would add1 but is disabled here. HTTP script evaluations are not the same as billed commands. [Pricing](https://upstash.com/pricing/redis), [algorithm costs](https://upstash.com/docs/redis/sdks/ratelimit-ts/costs) |
| Clerk | Hobby50K MRU/app; BAPI development100requests/10s per instance, production1000/10s | Actual plan unknown. MRU means returning users (return at least24h after signup), not request count. FAPI has separate endpoint/IP/user limits. Do not apply one BAPI rate to every auth() call. [Pricing](https://clerk.com/pricing), [system limits](https://clerk.com/docs/guides/how-clerk-works/system-limits) |
| QStash | Free1000messages/day; Pay-as-you-go$1/100K messages | Plan and retry/delivery billing mix unknown. Invitation events, not page reads, drive demand. [Pricing](https://upstash.com/pricing/qstash) |
| Resend | Free3000emails/month,100/day | Plan unknown; invites/OTP and explicit delivery attempts drive usage. [Pricing](https://resend.com/pricing) |
| Cloudflare R2 Standard | Free10GB-month,1M ClassA and10M ClassB/month; internet egress free | Not a statement about current bill. Backup retention/versions influence storage; Infrequent Access differs. [Pricing](https://developers.cloudflare.com/r2/pricing/) |
| Sentry / GitHub | Effective plan-specific meters not verified | No invented Sentry allowance or assumption an old trial is still active. Read current dashboard/billing before assigning a limit |

Supabase Realtime/Storage/Edge allowances are included for completeness, not evidence the app consumes them on navigation. No application `.channel`/subscription, Storage object flow, Edge Function, timed business polling or service worker found in inspected source. A publication named supabase_realtime exists; this does not establish an active app subscription. Provider-level ISR223 does not prove private APIs use ISR.

## Transparent demand model

This is an adjustable **scenario**, not measured user behavior or a growth forecast. N means distinct monthly active modeled users, each using40 sessions/month (2/day over20days);20 successful single-RPC app reads/session;6 internal navigations and3 resume bursts/session. Reads include required and potentially redundant reads. QR scans, staged write preparation, emails, assets, errors, bots, backups and deployment traffic require additional separate budgets.

Baseline:800N read API calls and RPCs/month. Assume5000 response bytes/RPC purely for modeling:4,000,000N bytes/month; actual observed examples and32768-byte RPC cap differ, and meter overhead/compression needs measurement. Regional Redis estimate6400N–8000N commands/month. See [machine-readable model](../07-handoff/evidence/navigation-refresh-2026-10-31/service-model.csv).

| Finding / assumed trigger | Work or extra per session |100 users/month |1000 users/month |10,000 users/month | Risk / speed / confidence |
|---|---|---|---|---|---|
| Total modeled20reads |20 API +20 RPC +160–200 Redis commands |80K API/RPC;640–800K commands;0.4GB payload |800K API/RPC;6.4–8M commands;4GB |8M API/RPC;64–80M commands;40GB | At100 users Redis would exceed Free500K **if that is its plan**. At1000 Vercel modeled reads alone use80% of1M function allowance; at10K exceed it.5GB Supabase egress crossed between1000/10K under assumed bytes. High mechanism / low frequency confidence |
| NR02 resume burst:0–1 avoidable read each ×3 |0–3 extra API/RPC;0–24/30 commands |0–12K extra API;0–96/120K commands |0–120K API;0–0.96/1.2M commands |0–1.2M API;0–9.6/12M commands | Overlap depends event timing; max represents15% of baseline reads, not measured savings. Less repeated rate/network/SQL work; no delayed authority |
| NR01 six document transitions |6 documents; destination read still normally needed |24K documents |240K documents |2.4M documents | DB savings from routing alone **0 assumed**; HTML/RSC/auth/assets difference unmeasured. High UX evidence; backend difference uncertain |
| NR06 cold Calendar twice/session |2 avoidable full-Home bootstrap reads if lightweight anchor replaces them |8K API/RPC;64–80K commands |80K API/RPC;640–800K commands |800K API/RPC;6.4–8M commands |10% of modeled baseline; not additive to overlapping opportunities. Contract must preserve branch-local today/authority |
| NR07 selected detail refresh twice/session |2 detail/list reads may become parallel or narrower; elimination0–2 |0–8K saved reads |0–80K |0–800K | Parallelism can cut latency without cutting calls; no savings until contract proven |
| NR10–12 SQL repeated aggregates/row eligibility |No extra HTTP; internal work grows with matching records |Unknown CPU/rows |Unknown |Unknown | Materialized totals and per-row checks need representative plans. Larger academy skew matters more than user count alone |
| QR valid unambiguous scan |2 intentional app calls: resolve then authoritative capture |Depends scans, not all navigation |Same |Same |18-scans burst36calls,288–360 regional limiter commands. Do not collapse away authoritative capture/duplicate checks |
| Ordinary reads → other services |0 email/QStash jobs/R2 backups/Realtime messages/Storage-object/Edge calls attributable |0 from this path |0 |0 | Not zero whole-account usage. Clerk SDK token activity and error reporting may occur; unmeasured |

Never sum overlapping saving rows. At assumed10% users online and20% of those acting simultaneously,100/1000/10K monthly users imply2/20/200 concurrent read starts; not a tested load. Each successful one-RPC start adds two limiter evaluations and one RPC; SQL internal statements/connection wait differ. Arrival distribution, cold starts, service regions, academy size, retries and queue time remain missing inputs.10K monthly users need not be10K concurrent connections.

## Latency, requests and correctness

No evidence that current navigation universally feels instant, nor that adding a cache would guarantee it. Document loads and task erasure visibly harm continuity; serial network dependencies delay useful content. Regional/service distance, backend limiter time, query execution and client rendering need separate timing. Deleting required auth checks to reduce calls is unacceptable.

Client aborts suppress obsolete UI responses but cannot be counted as avoided RPCs. Both onboarding-server and gateway replace the downstream fetch signal with their own10s timeout; Next request disconnection is not propagated end-to-end. Any future read cancellation change needs runtime proof, and writes must reconcile original identities even when disconnected.

## Monitoring and remaining measurements

Use existing dashboards and read-only SQL first. Before/after the same bounded synthetic journey, record source, duration/window, cold/warm, role/locale/device/network, read starts/completions/aborts, document versus RSC, payload bytes, rate-limit outcomes and operation outcome. Compare normalized *per completed task* rather than overall account counts. Capture no credentials, headers, raw HAR, private bodies or player identifiers.

Proposed future sampled fields: fixed journey/action ID, release, role class, route template, request class, status class, monotonic duration bucket, payload-size bucket, cache/coalescer outcome and cancellation phase. No emails, subject/academy/player IDs, free-text reasons, tokens, full URL or signed links. Suggested cap32 event types, at most16 bounded attribute values each,1% successful reads / bounded failures,7day raw retention and30day aggregate; these are **proposals requiring privacy/implementation review**, not enabled instrumentation. In-memory test counters and developer-run sanitized capture can establish budgets first. Telemetry must not block work.

| Gap | Reason / next measurement | Responsible role |
|---|---|---|
| G01 full chronological hosted request waterfall, shell mount, auth/BAPI/token counts | B0 UI table is partial; add safe controlled trace/mount counters in isolated harness, then authorized Owner runtime; don't export cookies/HAR | Implementer/test engineer |
| G02 positive Trainer/Guardian live resume/denial | Ended memberships/links; source and fictional local tests only. Use a separately authorized future test, never restore implicitly | Owner authorizes; tester executes |
| G03 first useful p75/ordinary-read p95/CLS and local200ms feedback | Opportunistic4 browser timings insufficient; declared physical device/network and enough repeated samples needed; no hosted load authorization | Performance tester with Owner-approved workload |
| G04 real DB work at scale and connection/WAL pressure | Tiny staging and cumulative mixed stats; prepare local representative skewed fixtures and EXPLAIN ANALYZE SELECT in local DB; separately approve bounded hosted workload | Database engineer |
| G05 Redis region/plan/command & latency, Clerk/Resend/QStash/Sentry/GitHub/R2 effective usage | No verified current dashboard meter. Read authorized plan/usage, record period and normalize; no purchases or settings changes | Platform operator |
| G06 exact staging source/alias current receipt | Prior receipt plus native project access, not new alias→SHA reconciliation; verify current deployment fingerprint before fixes | Release operator |
| G07 physical mobile/zoom/accessibility/offline and browser Back/Forward | Desktop native B0 plus synthetic suites don't prove them; repeat EN/AR320/360/390/tablet/200% and actual keyboard/device tests | UX/accessibility tester |
| G08 private stale-display duration, offline text/cache/retention and queues | Not accepted by existing functional approvals; explicit decision packet before implementation | Product Owner + privacy/security reviewer |
| G09 crash/unknown operation and storage failure | Development memory-only identity and inconsistent recovery-storage failure handling (NR17); add isolated actual-component storage-denied/crash/remount test and server operation lookup before changing recovery | Implementer + security reviewer |

Existing budgets remain targets, not passed results. No permanent monitoring enabled. Independent security, physical-device, load/cost and redesign acceptance gates remain open. All listed gaps have an owner and next measurement; they are part of the completed diagnosis, not concealed as test passes.

## Documentation verification receipt

[Recorded checks](../07-handoff/evidence/navigation-refresh-2026-10-31/documentation-checks.json): implementation register validator, factual-review fingerprint freshness, offline review-tool test, local Markdown targets, CSV shape/model formulas and unchanged product/schema/dependency diff passed. No factual UI recapture required: this task changes no UI, wording or route.13 additional actual-component suites passed with synthetic transports, alongside retained3 baseline receipts. No commit/push or release.

## Execution follow-up: observability distinction

EX-01's Vercel staging rebuild displayed an existing Sentry build-plugin telemetry notice. The runtime sampling/replay configuration described above does not prove SDK build tooling telemetry is disabled. G05 includes checking that separate configuration/meter against current source/provider evidence; no monitoring setting was changed by the analysis or EX-01. [Current release and limits](../07-handoff/request-remediation-ex01.md).

G01 scoped2November2026: [shell versus identity measurement](../07-handoff/request-remediation-ex02-shell-identity.md) supplies isolated actual-router shell counters; it does not measure the real root Clerk provider, FAPI/BAPI/token/Redis/SQL counts. Hosted correlation attempt was inconclusive due focus-triggered checks. Do not convert React mounts into provider charges or infer quotas from these counts.


3November EX-04 local evidence: [register transfer measurements and limits](../07-handoff/register-download-checkpoint.md) compare20old roster pages with22first coherent-transfer requests and1unchanged manifest. Initial verification deliberately adds work; the manifest scans/hashes up to1000rows. Provider Redis/egress/real-role concurrency and performance percentiles remain unmeasured; no service-limit or production-cost conclusion follows.

4 November EX-03 measurement: [Owner original dispatch](../07-handoff/offline-register-dispatch-checkpoint.md) observes one POST and at most one signed write RPC per explicit attempt. Lost-reply recovery uses the same payload, with no application retry loop or roster reread. Actual provider work, end-to-end timings and concurrency remain open.

4 November EX-11 measurement: the [connected fictional Owner run](../07-handoff/owner-working-day-fixture.md) records the request cost of first prepare, unchanged check, offline restart, replay and scoped refresh. Offline reopen/capture/restart sent zero POSTs. Redis and Clerk were fixture adapters, so there is no measured hosted cost or savings claim.
