# Whole-app findings and coverage register

**EX-13A/B expansion — 5 November:** [15-family measurement and dataset specification](../07-handoff/ex13a-baseline-and-dataset-checkpoint-2026-11-05.md) retain controlled baseline traces and exact source/tool hashes. The [normal Players/Calendar checkpoint](../07-handoff/ex13b-normal-workspace-checkpoint-2026-11-05.md) now joins the protected repository, automatic bounded synchronization and actual normal offline routes locally. The subsequent [readiness packet](../07-handoff/owner-workspace-staging-activation-2026-11-05.md) verifies expired-context deletion and capability-specific rollback preserving the live register/originals. It also retains the failed89e7536 CI evidence, stronger disconnected-worker fixture and actual public-startup early-reconnect repair. Exact staged expansion, signed-in hosted and physical/cross-app evidence remain; EX-07 applies continuity to the remaining journeys. No whole finding closes from these scoped local checks or deployment alone.

**5 November refresh evidence:** Signed-in staging confirmed a full document load from the Setup → Players shortcut and same-document rechecks on Calendar and Players. Local controlled runs verified route screen mounts, response-time masking and the attendance receipt-to-reread path. The [refresh baseline](../07-handoff/refresh-root-causes-2026-11-05.md) maps source triggers to WD-58 and WD-68–WD-71. EX-13A continues the remaining route/action measurements and exact dataset contracts. EX-13B and EX-07 verify the fixes in their scoped order. Earlier results and open findings retain their evidence boundaries.

**Latest Owner review/role direction — 4 November 2026:** [Current staging policy](../00-governance/staging-delivery-and-review-policy.md) defers independent human/external security review without blocking any currently authorized synthetic staging work, including otherwise-authorized private offline activation. Keep actual engineering checks, access/configuration authority and separate acceptance. Follow [the dedicated-role plan](../06-delivery/staging-role-separation-plan.md): distinct Platform Owner and Academy Owner accounts/journeys first, controlled cleanup preserving history; no account/data mutation is authorized or executed by this documentation update. Earlier external-review prerequisites below are superseded, not marked passed.

## Persistent local data and synchronization — LF-v2,2November2026

Current remediation target is persistent scoped local data and quiet sync under [local-data and sync plan](../06-delivery/local-data-and-sync-plan.md), not only memory summary reuse. Existing NR01–NR17 diagnoses and scoped fixes remain; none is closed by plan reconciliation. New replica/coverage/lease/key/migration cases are planned in the working-day register; do not rewrite historical source/hosted findings as new runtime facts.

## Current execution overlay —2November2026

The [working-behaviour contract](../03-design/academy-working-behavior-contract.md), [working-day acceptance gate](../06-delivery/academy-working-day-acceptance.md) and [single tracker](../06-delivery/experience-execution.csv) now join the17 findings to a connected operating pilot. EX-10 prepares architecture/states/decisions; EX-11 tests useful work, return/save/interruption and resource costs together. These new gates do not introduce new confirmed source defects, reset delivered fixes or close any finding. WB-P proposals remain pending. The original investigation and subsequent scoped runtime receipts below retain their stated provenance and limitations.

31 October2026; extends [B0 investigation](navigation-refresh-investigation.md). See [service impact/model](request-service-impact.md) and [fix/architecture handoff](../06-delivery/request-hygiene-and-offline-standard.md). All records refer to source7a6be974 and unchanged product tree. IDs NR01–NR17 are investigation IDs, not new business actions. Severity columns are **UX / latency / request-load**, H=high, M=medium, L=low, relative priority rather than measured incident severity. Effort is an engineering-day estimate excluding approvals, workload setup and release. Confidence: explicit source mechanisms high; cost/scale and unobserved runtime conditional. Findings described as hypothesis or preserved behavior are not confirmed defects.

## Findings

### NR01 — Internal document navigation

- Priority: H/H/M; effort 1–2d. Source references relative to `apps/web/src/components`: `experience-workspace.tsx`, `date-planning-workspace.tsx`, `program-workspace.tsx`.
- Mechanism / expected difference: Plain href task links and guarded location.assign cause document transitions; shell already uses Next Link.
- Evidence: H1/H3/H4 document rows; H5 RSC contrast.
- Safe reproduction / next measurement: Use H1/H3/H4 read-only steps in original baseline; compare actual document/RSC counters.
- Recommendation and safety boundary: Reuse client routing while retaining dirty/unknown/busy and allowed destination guards. Routing alone saves no assumed RPC.

### NR02 — Resume-event read duplication

- Priority: H/M/H; effort 2–4d. Source references relative to `apps/web/src/components`: `experience-workspace.tsx:34–38`, `program-workspace.tsx:53`, `people-workspace.tsx:278`, `development-workspace.tsx:42`.
- Mechanism / expected difference: Experience has independent focus/visible triggers. Other microtask coalescers cover only a same-task burst.
- Evidence: Actual-component probe twice: synchronous1 start,40ms-separated2 starts. Hosted event frequency unknown.
- Safe reproduction / next measurement: Dispatch simultaneous then40ms-separated focus/visible in same exact scope; also native tab away/return.
- Recommendation and safety boundary: Scoped in-flight coordination; no long permission debounce; stale-response generation guard remains.

### NR03 — Task erasure during revalidation

4 November scoped Platform result: [Operations admission checkpoint](../07-handoff/operations-admission-checkpoint.md) compares actual baseline/current components and fixes selected-academy loss after recheck, retaining new loaded-data search/filter and focus without private payload reuse. Required recheck remains1 read and retains its existing checking replacement. This does not close other routes, continuous-content, scroll, hosted or full NR03 coverage.

- Priority: H/M/L; effort 2–4d. Source references relative to `apps/web/src/components`: `experience-workspace.tsx:35,48`, `guardian-training-workspace.tsx:98`, `program-workspace.tsx:40–54`.
- Mechanism / expected difference: Experience nulls Home/data/selection; Guardian training invalidates link-picker on resume; list/detail loaders replace content.
- Evidence: H2/H6/H7 observed Owner reset EN/AR; other families source/local only.
- Safe reproduction / next measurement: Select a date then Week→Month or native tab return. Check selection/scroll/focus during and after load.
- Recommendation and safety boundary: Stable shell/geometry and safe identifiers; private stale visibility needs explicit allowance, denial clears private state.

### NR04 — Shell and identity placeholder remount hypothesis

- Priority: M/M/M; effort measure0.5–1d; fix only after proof. Source references relative to `apps/web/src/components`: `workspace-shell.tsx`, `experience-workspace.tsx:17–21`, `app/layout.tsx`.
- Mechanism / expected difference: Shell lives inside domain components; useUser unavailable renders PublicWorkspace. Root ClerkProvider exists.
- Evidence: Source risk; no mount counters and no proof every route refetches profile.
- Safe reproduction / next measurement: Instrument isolated actual Next app to count mounts and FAPI calls on cold/warm client navigation.
- Recommendation and safety boundary: Do not begin with authenticated-layout rewrite or cache membership as authority.

### NR05 — Cancellation does not guarantee saved backend work

- Priority: L/M/H; effort 1–3d plus runtime proof. Source references relative to `apps/web/src/components`: `../lib/onboarding-server.ts:12–25`, `../lib/onboarding-gateway.ts:25–33`.
- Mechanism / expected difference: Browser controllers and generations protect UI; downstream transports replace signals with independent timeouts.
- Evidence: Source-confirmed; hosted cancellation/SQL completion correlation unmeasured.
- Safe reproduction / next measurement: Controlled slow read locally: abort route caller and count limiter/RPC starts/completions; never infer from browser Cancelled alone.
- Recommendation and safety boundary: Combine signals where safe for reads; preserve canonical write unknown-result recovery.

### NR06 — Cold Calendar obtains a full Home first

- Priority: M/H/M; effort 1–3d. Source references relative to `apps/web/src/components`: `experience-workspace.tsx:40–64`, `../../../../supabase/migrations/20261029194029_experience_home_calendar_reads.sql`.
- Mechanism / expected difference: Without saved from, Home obtains branch-local today then Calendar runs; Guardian first needs approved links. Home includes unrelated panels.
- Evidence: Source-confirmed dependency; exact hosted cold sequence not chronologically captured.
- Safe reproduction / next measurement: Clear only synthetic navigation preferences in isolated harness; open role Calendar and count links/Home/Calendar.
- Recommendation and safety boundary: Reviewed minimal anchor/context or default-window calendar contract; do not use browser timezone as branch authority.

### NR07 — Selected-detail and bootstrap waterfalls

- Priority: M/H/M; effort 1–3d per contract. Source references relative to `apps/web/src/components`: `development-workspace.tsx:28–42`, `correction-workspace.tsx:27–36`, `qr-workspace.tsx`, `date-planning-workspace.tsx`.
- Mechanism / expected difference: Development context→listing→detail and selected detail→listing refresh; corrections reload selected then list; QR context→sessions. Dated planning already runs independent reads concurrently.
- Evidence: Source and local functional suites; no all-role hosted timing attribution.
- Safe reproduction / next measurement: Count reads and dependency timestamps for open/refresh with selected item, not just initial list.
- Recommendation and safety boundary: Parallelize only independent work, or add minimal combined projection; do not parallelize signed preview receipt chains.

### NR08 — Prefetch and no-store require measurement

- Priority: L/M/M; effort 1–2d. Source references relative to `apps/web/src/components`: `workspace-shell.tsx`, `../lib/onboarding-server.ts`, `app/[locale]`.
- Mechanism / expected difference: Shell uses default Next Link prefetch. Protected page wrappers mainly construct components; APIs no-store.
- Evidence: RSC prefetch seen in native table; DB work per prefetch not established.
- Safe reproduction / next measurement: Compare focused navigation and visible-link prefetch in actual Next production build; separate RSC and /api POST.
- Recommendation and safety boundary: Tune only measured expensive prefetch. Never count each route prefetch as DB call or cache private POST publicly.

### NR09 — Every extra read multiplies limiter work

- Priority: L/M/H; effort measure1d; policy review before limiter change. Source references relative to `apps/web/src/components`: `../lib/rate-limit.ts:5–30`, `../lib/onboarding-gateway.ts`, `app/api/experience/route.ts`.
- Mechanism / expected difference: Outer and inner external sliding-window limits; analytics and ephemeral cache disabled; no SDK retry.
- Evidence: Source-confirmed two evaluations; official regional costs8–10 commands, effective region/replication/usage unknown.
- Safe reproduction / next measurement: One successful single-RPC read in isolated counters, then compare authorized dashboard command delta over bounded sample.
- Recommendation and safety boundary: Eliminate redundant reads first. Two controls protect distinct boundaries; removing one is a security redesign.

### NR10 — Home counts and task aggregation repeat work

- Priority: M/M/H; effort 2–5d with scale evidence. Source references relative to `apps/web/src/components`: `../../../../supabase/migrations/20261029194029_experience_home_calendar_reads.sql`.
- Mechanism / expected difference: x15_home repeats count and top-task selection over programs/plans/reviews; c12_state and live eligibility can be called per candidate, including repeated count/task passes.
- Evidence: Live function definitions and cumulative stats support mechanism; tiny data not scale benchmark.
- Safe reproduction / next measurement: Local skewed fixtures and equivalent scoped counts/tasks; measure rows/loops/buffers and shared work.
- Recommendation and safety boundary: Request-local relational factoring with exact authorization and authoritative totals; not global definer cache.

### NR11 — Bounded response still has whole-window query work

- Priority: L/M/H; effort 2–4d after plans. Source references relative to `apps/web/src/components`: `../../../../supabase/migrations/20261029194029_experience_home_calendar_reads.sql`.
- Mechanism / expected difference: x15_calendar materializes scoped matches for count and page; Home builds today Calendar up to50 then takes5.42day and byte bounds constrain response, not candidate density.
- Evidence: Live source and catalog; Owner surrogate plain EXPLAIN; no scale execution.
- Safe reproduction / next measurement: Local dense42day fixtures, counts, first/next pages; ensure page truncation remains explicit.
- Recommendation and safety boundary: Separate small Home projection and optimize scoped counting; never derive total from loaded page.
- 5 November scoped follow-up: the new closed EX-13B Calendar transport bounds eligible date candidates before display joins; its 12,040-date profile visits 51 source rows for the tested page. First-page counts remain additional work. Existing x15/Home queries and whole-finding closure are unchanged. [Local backend evidence](../07-handoff/ex13b-workspace-transfer-checkpoint-2026-11-05.md).

### NR12 — Computed local-day predicates and FK suggestions

- Priority: L/M/M; effort 1–3d measurement; change conditional. Source references relative to `apps/web/src/components`: `../../../../supabase/migrations/20261029194029_experience_home_calendar_reads.sql`.
- Mechanism / expected difference: Trainer/family publication reads filter branch-local date from starts_at/timezone; existing Trainer/time and family/time indexes exist; advisor44 FK/21 unused hints.
- Evidence: Live catalog, function hashes and family surrogate plan. Tiny seqscan is not defect proof.
- Safe reproduction / next measurement: Local representative branch/DST/density plan; test conservative UTC bound plus exact local-day predicate.
- Recommendation and safety boundary: No index changes from hints alone; assess write/storage/WAL and query selectivity. Preserve timezone/tenant/field checks.

### NR13 — Development operation lost across document/crash

- Priority: H/L/L; effort 1–3d + recovery tests. Source references relative to `apps/web/src/components`: `development-workspace.tsx:13,43–47`.
- Mechanism / expected difference: Pending contains operation identity in React state; beforeunload protects ordinary leave, but no persistent recovery locator. In-visit reconcile exists.
- Evidence: Source-confirmed; crash/remount outcome not reproduced. No proven duplicate commit.
- Safe reproduction / next measurement: Isolated synthetic submit with response lost→unmount→remount; attempt lookup using original opaque ID.
- Recommendation and safety boundary: Retain minimum validated opaque operation locator, not private feedback text; no automatic replacement/replay.

### NR14 — Independent fetch implementations and defaults

- Priority: M/M/M; effort 2–4d pilot;3–6d adoption. Source references relative to `apps/web/src/components`: `experience-workspace.tsx`, `people-workspace.tsx`, `development-workspace.tsx`, `guardian-training-workspace.tsx`.
- Mechanism / expected difference: Timeouts/controllers/generation guards are domain-local; no shared scoped query cache/deduper. Attendance/corrections already lock resume around dirty/unknown work.
- Evidence: Source inventory, existing suites. Duplication of code alone is not a runtime duplicate.
- Safe reproduction / next measurement: Pilot exactly one scoped projection with instrumentation then cross-role/tenant/version cases.
- Recommendation and safety boundary: Choose narrow coordinator before new library; never generic retries on writes, never parallel independent authority state.

### NR15 — Offline capability is absent, not silently safe

Later5November: Owner-promoted `86d7fac` now has scoped normal EN/AR offline and reconnect evidence. The [continuity follow-up](../07-handoff/ex13b-workspace-continuity-2026-11-05.md) retains the remaining context,device,negative-case and full-app limits;49 local cases are not a whole NR15 closure.

5 November execution update: the bullets below retain the original no-offline baseline. The scoped EX-11 register now has hosted evidence. EX-13B on Owner-promoted `7ddc6f1` successfully prepared an Owner key/data, but its public worker rejected SPA entry because `WindowClient.url` still reported sign-in. A normal-document reload isolated the cause; it is not the delivered workflow. The focused before/after regression and repaired 44-check local suite are linked from [the live packet](../07-handoff/owner-workspace-staging-activation-2026-11-05.md). Repaired-source CI/promotion and the remaining signed-in matrix are separate; NR15 is not closed app-wide.

- Priority: M/L/L; effort decision first. Source references relative to `apps/web/src/components`: `../lib/onboarding-server.ts`, `development-workspace.tsx`, `workspace-layout.tsx`.
- Mechanism / expected difference: No app IndexedDB/service worker/query persistence. Existing browser storage is preferences/navigation/recovery locators, not a general private offline cache.
- Evidence: Source scan; no offline supported capability demonstration.
- Safe reproduction / next measurement: Disconnect while reading/editing and resume in isolated harness; separately physical device when offline policy exists.
- Recommendation and safety boundary: Declare online-only writes and honest unavailable/pending. Private persistence/queues need retention, shared-device and conflict decisions.

### NR16 — Existing safe batching/bounds should be retained

- Priority: L/L/L; effort regression gate. Source references relative to `apps/web/src/components`: `attendance-workspace.tsx`, `program-workspace.tsx`, `people-workspace.tsx`, `qr-workspace.tsx`.
- Mechanism / expected difference: Explicit saves; atomic selected register; signed sequential preview/preparation; paged minimal projections; People300ms search debounce; QR frame decoding local. No setInterval business polling/Realtime subscription found.
- Evidence: 16 families of local regression coverage across baseline+extension; mocks not hosted DB proof.
- Safe reproduction / next measurement: Rerun relevant existing assertions and count18-player register/40-date preview/scan pathways.
- Recommendation and safety boundary: Do not turn saves into per-keystroke autosave, skip receipts or replace absent polling with subscriptions.

### NR17 — Recovery-storage failure is handled inconsistently

- Priority: H/L/L (UX / latency / request-load); effort1–3d after recovery contract review. Source: `onboarding-workspace.tsx:101`, `program-workspace.tsx:31`, `date-planning-workspace.tsx:15`, `program-planning-workspace.tsx:13` catch sessionStorage failures without blocking the command; `attendance-workspace.tsx:49–50`, `correction-workspace.tsx:41` and `qr-workspace.tsx:278–284` instead fail before writing when recovery storage is unavailable.
- Evidence: source-confirmed difference. An in-memory operation identity still exists in the tolerant paths; no demonstrated duplicate commit or loss of server history. Different operations have different discoverability/status paths, so identical handling cannot be assumed necessary.
- Safe reproduction / next measurement: isolated storage.setItem throwing → lost reply → document/crash/remount → attempt original-outcome discovery, per command. Extend G09; no hosted operating write.
- Recommendation: declare reload/crash recovery guarantees per operation and test denied/full storage. Decide a durable discoverable server operation list versus a validated opaque locator or explicit pre-write block. Never persist private form payloads or silently start a replacement command. Recovery support should be consistent in guarantee, not merely in catch syntax.

## End-to-end family coverage

Each row traces component→API→RPC family→rendered outcome. All endpoints use the caller-bound gateway described in the impact report; server identity is authority. Screens/action/AO/AT IDs are joined exactly in [coverage.csv](../07-handoff/evidence/navigation-refresh-2026-10-31/coverage.csv); this scoped join does not complete whole canonical requirements. Source links below are current evidence, not evidence a hosted case passed.

| Family / source | Read and lifecycle path / visible result | Findings / verified boundary |
|---|---|---|
| Identity, workspace and setup / [onboarding](../../apps/web/src/components/onboarding-workspace.tsx) | UI→onboarding API→m1 context/setup/platform/operation; accepted status and persisted setup; recipient proof uses Clerk BAPI only where needed | NR04/05/09/16. Original-operation fencing retained; local onboarding suite passes. Hosted this extension no acceptance writes |
| Platform directory/admission | Same onboarding source, bounded current page and contextual invitation detail→m1 platform projection; focused inspection may use existing row without new read | NR01/09/16. No tenant-content inference, delivery accepted≠inbox |
| Owner/Trainer/Guardian homes and calendars / [Experience](../../apps/web/src/components/experience-workspace.tsx) | links for Guardian→experience API→x15 home/calendar→summary/page/inspector; first cold Calendar uses Home to obtain today | NR01–06/08–12/14. B0 Owner native EN/AR, synthetic all-role Experience; current live Trainer/Guardian unavailable |
| People/profiles/duplicates / [People](../../apps/web/src/components/people-workspace.tsx) |300ms search→people API→p2 list/profile/duplicate/operation; bounded directory, comparison and confirm | NR01/02/09/14/16. Dirty text stays, stale review invalidates; local tests pass; new hosted return trace missing |
| Guardian appointments / [Guardian](../../apps/web/src/components/guardian-workspace.tsx) and [Trainer](../../apps/web/src/components/trainer-workspace.tsx) | guarded client routing, scoped request locks→guardians/trainers API→g3/t4 current invite/link/staff projections and operations | NR04/05/09/16. Scope/expiry/current recipient on server; local tests pass, no restored access |
| Program creation / [Programs](../../apps/web/src/components/program-workspace.tsx) |programs API→p5 list/context→sequential signed preview windows→preparation/status/finalize;40-date example4 preview windows+1context read | NR01/02/03/09/16. Automatic bounded preparation is intentional work, not background polling. No skipping receipts |
| Individual/date plans / [date planning](../../apps/web/src/components/date-planning-workspace.tsx) |planning API→read+dates via Promise.allSettled, candidates deferred, server versions and atomic final write | NR01/05/07/09. Two independent initial reads already concurrent; denial fences dependent results |
| Whole-program plans / [program planning](../../apps/web/src/components/program-planning-workspace.tsx) |program-planning API→r7 bounded candidate/review/preparation/operation→all-or-nothing activation | NR01/05/09/16. Existing individual exceptions and unknown-operation identity protected; UI suite passes |
| Publication / [publication](../../apps/web/src/components/publication-workspace.tsx) |publication API→s8 review/step/status/confirm/withdraw; current audience and atomic final commit | NR01/05/09/16. Bounded auto-preparation not timed read polling; no audience-cache authority |
| Move/cancel / [session changes](../../apps/web/src/components/session-change-workspace.tsx) |session-change API→t9 current/history/command/operation; before/after and retained outcome | NR01/05/09/16. Withdraw-first and attended-session protection preserved; local suite passes |
| Attendance / [attendance](../../apps/web/src/components/attendance-workspace.tsx) |attendance API→a10 roster/mark/batch/operation; direct local selection and one atomic save; commit then reread | NR05/09/14/16. focus/online blocked while dirty/unknown/locked;18-player flow synthetic, not new hosted write |
| Corrections / [corrections](../../apps/web/src/components/correction-workspace.tsx) |attendance API→c12 context/list/detail/submit/decide/operation; saved status and immutable history | NR07/09/16. Selected refresh detail→list; current actor/deadline/version checks; same-account review forbidden |
| QR / [QR](../../apps/web/src/components/qr-workspace.tsx) |QR API→q13 context/sessions/card/resolve/capture; local camera decoding then matching/outcome | NR07/09/16. Resolve+capture intentional; no call per camera frame. Camera lifecycle covered locally, no fresh physical scan |
| Guardian training / [training](../../apps/web/src/components/guardian-training-workspace.tsx) |guardian-training API→b11 links/schedule/detail; current active link and published attendance projection | NR02/03/07/14/15. Private list invalidates on resume; source/local only for positive access |
| Development / [development](../../apps/web/src/components/development-workspace.tsx) |development API→e14 context/list/detail/command/operation/family publication; author→Owner review→family snapshot | NR02/05/07/13–16. Pending command in memory only; private drafts not persisted by recommendation. Local suite passes |

Source filenames in this table are checked during documentation validation. Root provider/layout remount and exact hosted query/status/cancellation sequences outside B0 remain G01–G09; unmeasured does not mean zero requests. Source route/dependency review and the [124-file scan](../07-handoff/evidence/navigation-refresh-2026-10-31/source-scan.json) cover current API/lifecycle/storage call sites, not hypothetical Manager/Player, finance or media functions.

## Evidence environment and acceptance boundaries

Baseline B0 has native Chrome/macOS Owner/synthetic academyA, EN/AR, uncalibrated full-window desktop; viewport not inferred from image pixels. Local production-React suites use fictional identity/transport and their declared viewports/scenarios; [13 added suite outcomes](../07-handoff/evidence/navigation-refresh-2026-10-31/whole-app-ui-suites.json) plus existing Experience/People/planning receipts cover16 named suites. All13 passed; earlier3 remain current-source evidence. Harness instrumentation only redirects output; assertions/product unchanged. Logs show scenario details. Tests passing do not validate actual Next navigation when Link is shimmed, provider latency, database permission performance or live revocation.

PYSA comparison retained in the original report and [preservation ledger](../03-design/pysa-behavior-preservation.md): connected role/list/calendar/detail and explicit loading links are useful; historical private offline-cache design is not authorization to copy it. Translation, subset search, timezone and false-success defects remain cautionary evidence. No PYSA changes or fresh hosted testing.

No unseen browser trace is claimed. Raw provider URLs/headers, tokens, private bodies and account credentials are excluded. Function definitions, counts, hashes and surrogate plans are technical metadata; retain evidence privately in the repository's existing access boundary.

## Execution continuation — 31 October 2026

Owner authorized [integrated execution](../06-delivery/experience-execution.md). [EX-01](../07-handoff/request-remediation-ex01.md) implements a bounded Home/Calendar/dated-return subset of NR01–03; remaining occurrences and G01–G09 stay in the [single tracker](../06-delivery/experience-execution.csv). Diagnosis/source evidence above refers to7a6be974 and is preserved as history, not a claim that the affected code is still unchanged after remediation.

EX-02 Programs checkpoint31October2026: [bounded implementation/evidence](../07-handoff/request-remediation-ex02.md) extends NR01/02/08/14 adoption; measured synthetic visible-return reads2→1 and real Next Programs dated navigation documents1→0 EN/AR. Remaining occurrences, private loading continuity, native dirty history and shell hypothesis remain open. Deployment/hosted/Owner statuses are in the tracker, not inferred from these counts.

EX-02 whole-program planning1November2026: [scope/results](../07-handoff/request-remediation-ex02-planning.md) adds real Next EN/AR clean/dirty-confirmed return documents1→0 and visible-only saved-review revalidation0→1, paired focus total1. It preserves dirty staged choices and unknown fences. Remaining domains, native dirty history, G01 and shell hypothesis stay open. This is partial adoption, not a global request/latency claim.

EX-02 People1November2026: [scoped visible-return adoption](../07-handoff/request-remediation-ex02-people.md) measured directory/profile reads2→1 and review follow-up1→0 locally. Existing current-authority, duplicate and unknown-save contracts retained. Other domains and hosted timing remain open; no cross-app finding closed.

## Scoped execution continuation — 1 November 2026

[EX-02/EX-04 Owner task wait packet](../07-handoff/request-remediation-ex02-task-continuity.md): known branch-day Home entry can avoid full Home bootstrap before Calendar; explicit Home/Calendar dated tasks no longer need a hidden date directory before planning. Controlled before/after proves request dependency and action readiness, not all-role hosted speed. Unhinted cold Calendar, private-content clearing, remaining shell/native-history, cancellation/query measurements and whole NR03/NR06/NR07 coverage stay open. Read the single tracker for exact delivery/acceptance status.

EX-02 long-list2November2026: [Calendar task return position](../07-handoff/request-remediation-ex02-return-position.md) distinguishes restored selection from actual scroll orientation. Exact-source CI caught and corrected pre-unmount router scroll ordering; remaining role/shell/freshness and hosted measurement gaps stay open in the execution tracker.

EX-02 individual-date2November2026: [visible-return pairing](../07-handoff/request-remediation-ex02-dated-resume.md) measures the remaining dated detail/dirty visibility→focus pair2→1 reads using the shared helper, preserving immediate distinct returns and original-operation guards. Wider event/role/hosted and shell/performance gaps stay open; no global NR02/NR03 closure.

NR04 measurement2November2026: [shell/identity packet](../07-handoff/request-remediation-ex02-shell-identity.md) confirms route-local shell remount in actual Next EN/AR fixtures while focus/local locale retain it; one document throughout. Forced identity pending proves placeholder branch mechanism only. No real Clerk refetch causality, harmful remount latency or hosted provider counts established; no product shell rewrite. Prior evidence is historical; G01 and wider-role cases remain open.

EX-04 cold-entry checkpoint2November2026: [actual Next EN/AR diagnostic and next read contract](../07-handoff/request-remediation-ex04-cold-calendar.md) confirms unhinted/invalid-hint cold entry still reads Home → Calendar; valid/restored periods read Calendar once. Failure recovery repeats the dependency. Product unchanged; NR06 remains open. Controlled250ms transport samples are not hosted percentiles or backend-cost/cancellation proof. Continue the tracker’s scoped authoritative current-period implementation next.

EX-04 Owner cold fix2November2026: [implementation and local/schema evidence](../07-handoff/request-remediation-ex04-current-calendar.md) removes full-Home bootstrap for cold Owner Calendar through a named signed/current-authority read.79units/10PG/18ENAR cases and recovery passed; schema applied, app rollout/hosted checks pending at source checkpoint. NR06 remains partial: Trainer/Guardian and broader query/cancellation measurements are open.

EX-04 delivery update2November2026: [Owner current-period fix](../07-handoff/request-remediation-ex04-current-calendar.md) is staging10bbda7 with both exact CI passes; fresh EN/AR Calendar each1current200, other academy/retry403. Owner occurrence implemented and hosted checked; whole NR06 remains partial and broader service/cancellation/role evidence is not inferred.


EX-04 scoped3November: [coherent register transfer](../07-handoff/register-download-checkpoint.md) resolves the inactive Owner-register per-row coherence gap with signed bounded pages/final source+disk checks. NR05/06/07 remain partial across collections/roles; first/repeat request/byte samples are local fixtures, not hosted useful-content or provider savings. No finding is closed.

4 November EX-03 evidence: [Owner register original dispatch](../07-handoff/offline-register-dispatch-checkpoint.md) preserves the exact save through interruption, transaction failure and restart in a fictional scope. NR13 and NR17 retain their broader affected paths and G09 retains connected/hosted measurement gaps.
