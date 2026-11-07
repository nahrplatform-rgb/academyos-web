# Navigation and refresh — source review and runtime baseline

## Current execution pointer —2November2026

This dated baseline remains historical evidence. Current priority follows [the execution tracker](../06-delivery/experience-execution.csv), [working-behaviour contract](../03-design/academy-working-behavior-contract.md) and [working-day acceptance](../06-delivery/academy-working-day-acceptance.md). The EX-10/EX-11 gates make shared loading/coordination and connected operating proof explicit; this pointer is not a fresh investigation, product fix or hosted result.

31 October 2026. **Analysis only. No product fix, rollout or working acceptance.**

## Outcome and provenance

The Owner authorized completing the missing read-only baseline before fixes. Local HEAD is `7a6be974eaf9826f33d9ecfce4accf0e568b3a0c`; the working tree was clean before evidence/document creation. The downloaded source investigation was checked against that checkout. Its source diagnosis is useful; its zero-runtime-sample limitation remains historical and is supplemented below, not silently erased. Original artifact SHA-256 and current observations are in [baseline.json](../07-handoff/evidence/navigation-refresh-2026-10-31/baseline.json).

Existing staging Owner session, synthetic academy A only. Native Google Chrome on macOS; Network panel had No throttling and Disable cache unchecked. Network timings below are visible request durations, not a calibrated benchmark. Screenshots are full-window native captures, not Stage Manager thumbnails; they do not establish CSS viewport dimensions or phone parity. The prior deployment receipt identifies source e950b41/deployment CRx3e9GiTdPuWLCWNaPH4QhLRRQ3; provider alias/source was not freshly checked in this baseline. Local product source matches the examined source report. The built-in browser connector reported disabled both before and after the Owner's enable reply; native browser UI remained usable. No remote-debugging workaround, credential export or provider changes.

## Conclusion

There are at least three demonstrated problems, not one universal refresh bug:

1. **Inconsistent internal navigation.** Home's Open calendar, Calendar's Open this date and dated-task Back to calendar produced Network rows of type **document**. Sidebar Today instead exposed a Next route `home?_rsc=…` fetch on transition. The source matches: plain anchors/guarded `location.assign` in domain flows versus Next Link in the shell. This comparison is targeted UI evidence, not a complete HAR or proof that every sidebar route is smooth.
2. **Destructive revalidation.** An already-focused Week→Month change remained on the same calendar URL, but replaced the task with Loading your current tasks. A fresh read is appropriate; removing the useful interface is a separate presentation choice.
3. **Real tab-return loses session context.** Select the 1 November Synthetic I3a occurrence, open a blank tab, close it to return: loading replaces the calendar and the selected inspector resets. This reproduced in EN and AR. It is not solely a DevTools focus artifact. Month remained selected; the selection did not.

The local repeated probe sharpens the duplicate-trigger diagnosis: synchronous focus+visibility produced one read start in both trials; the same triggers 40ms apart produced two starts in both trials. It is incorrect to claim two requests always occur. The actual hosted OS event count remains unmeasured.

**Do first:** guarded internal routing, then scoped resume coordination and stable revalidation presentation. Do not begin with a wholesale authenticated-layout rewrite. Measure remaining shell remount/flicker after those smaller fixes; moving authority/context into a shared layout is higher risk and has not yet been shown necessary.

## Scope and trust boundaries

Journey anchors: IMP-J01-A01/J01-A01 context/navigation, IMP-J09-A01/J09-A01 scheduling, existing dated-planning, People and Guardian read/recovery joins. AO/AT and screen/loading/security joins remain in the [canonical matrix](../06-delivery/app-implementation-action-matrix.csv). No parent requirement is closed.

Boundary inspected: browser navigation and local presentation → existing identity → bounded POST reads → canonical scoped gateway → displayed projection. The [experience route](../../apps/web/src/app/api/experience/route.ts) checks staging/origin/content type, identity, body bounds and rate limits; it returns no-store and Server-Timing. That server timing was not measured here. This source check is not a new database/RLS audit. No role supplied by the client may become authority.

## Hosted observations

| Case | Steps and result | Evidence limit |
|---|---|---|
| H1 Home task navigation | With page focused, Open calendar produced a document request row for Calendar. The first attempt while leaving DevTools triggered a Home data refresh and did not navigate. | The first attempt is diagnostic focus interference; do not count it as a normal failed click. |
| H2 view change | Already-focused Week→Month: same Calendar URL, loading placeholder, additional experience fetch; Month selected afterward. | One hosted view-switch sample; not a latency distribution. |
| H3 dated task | Select Synthetic I3a 1 November → Open this date: document row for dated task with fixed return=calendar. | Safe read only; no editing or save. |
| H4 return | Back to calendar: document row; Month restored; selected task absent. | Does not measure browser Back/Forward cache behavior. |
| H5 sidebar contrast | Calendar sidebar Today: visible home?_rsc fetch and Home rendered. | Not an exhaustive trace or measured stable-shell assertion. |
| H6 resume EN | Select occurrence → blank tab → close blank tab: Loading your current tasks, then unselected calendar. | Actual browser tab lifecycle through native control; no event timestamps/count. |
| H7 resume AR | Switch language → select same occurrence → repeat tab-away/return: Arabic loading and unselected details. | Same Owner scope; not another role or device. |

[Selected session before return](../07-handoff/evidence/navigation-refresh-2026-10-31/hosted-selected-calendar.png), [EN cleared selection after return](../07-handoff/evidence/navigation-refresh-2026-10-31/hosted-return-cleared-calendar.png), [AR cleared selection](../07-handoff/evidence/navigation-refresh-2026-10-31/hosted-ar-return-cleared.png).

[Sanitized Network observations](../07-handoff/evidence/navigation-refresh-2026-10-31/native-network-observations.json) include only visible app paths, status, type, size and duration; rows not currently exposed by the virtualized table are absent. An empty rows array means capture unavailable, not zero requests. Immediate document-row observations H1/H3/H4 above were read from AX updates; no raw network/header/body export was saved. Cumulative request totals include script loads, identity work and route prefetch; they cannot be assigned to one action.

Visible app-read durations across the diagnostic sequence were 730ms, 724ms, 1.23s and 864ms. Home response example was about 0.7kB transferred/1.0kB resource; calendar examples about 0.8–1.0kB transferred/2.9–4.1kB resource. These are mixed-context opportunistic observations, not independent benchmark samples, server-only timings, p75/p95 or action-to-ready. Some exceed the ordinary-read target, but a target violation rate is not established. No CLS, first-useful-task, input-response or query/billing/WAL measurement. Avoid claiming performance budgets passed or failed globally.

## Local repeated diagnostic and regression checks

Temporary actual-component diagnostic used current Experience component, synthetic identity/read adapters and a deliberate 250ms response delay. No hosted requests or database writes. It retains the existing harness's Next Link shim, so it cannot prove Next routing or shell persistence. The [probe](../07-handoff/evidence/navigation-refresh-2026-10-31/component-probe.mjs) and [results](../07-handoff/evidence/navigation-refresh-2026-10-31/component-diagnostic.json) are separate evidence tooling, not product behavior.

| Diagnostic | Trial 1 | Trial 2 |
|---|---|---|
| focus after selecting calendar session | 1 read; rows 0 during load; selected task 0 during/after | same |
| focus and visible event in same JS task | 1 read start | 1 read start |
| focus then visible event 40ms later | 2 read starts | 2 read starts |

These dispatched events establish component event-order sensitivity; they do not establish normal OS event frequency. Cancellation of the previous request is not proof the server stopped all work.

Existing unchanged production-React suites freshly passed with evidence directed to /private/tmp, then selected sanitized receipts retained:

- [Home/calendar](../07-handoff/evidence/navigation-refresh-2026-10-31/experience-ui.json): Owner/Trainer/Guardian fictional projections, paging, EN/AR320/390/768/1440, unavailable, revoked and account change. This suite did not detect the visual-reset defect; it is a regression boundary, not smoothness proof.
- [Dated planning](../07-handoff/evidence/navigation-refresh-2026-10-31/planning-ui.json): dirty return guard, denial clearing, stale intent, unknown original-operation recovery and confirmed-save/read-failure. Five saves in the receipt are synthetic transport operations, not staging writes.
- [People](../07-handoff/evidence/navigation-refresh-2026-10-31/people-ui.json): typed intent retained/review invalidated on resume, actor/revocation clearing and lost-result reconciliation. Three creates are fictional local adapters only.

No existing assertion or product code changed. Reproduce probe from repository root with Node24:

```sh
UI_EVIDENCE_DIR=/private/tmp/academyos-navigation-baseline/reprobe node docs/07-handoff/evidence/navigation-refresh-2026-10-31/component-probe.mjs
```

## Source mechanism and limits

- [Experience](../../apps/web/src/components/experience-workspace.tsx): focus/visible refresh aborts reads and clears home/data/selected; the main read effect also clears those values. Calendar controls stay under loaded Home state, causing content disappearance. Plain internal task anchors differ from shared-shell Next links.
- [Dated planning](../../apps/web/src/components/date-planning-workspace.tsx): guarded location.assign for return/navigation; pending/unknown and dirty guards must survive replacement.
- [Shell](../../apps/web/src/components/workspace-shell.tsx): Next Link is already available. It is rendered inside domain components, not a persistent authenticated nested layout. Source supports possible remount/identity-placeholder flicker, but no shell mount counter or route-wide runtime proof was collected.
- [People](../../apps/web/src/components/people-workspace.tsx): resume intentionally invalidates duplicate review while preserving typed intent. Smoothness fixes must not reuse obsolete approval.
- [Guardian training](../../apps/web/src/components/guardian-training-workspace.tsx): link-picker invalidation on resume remains source-confirmed; no positive hosted Guardian check because the test link is ended.

PYSA re-inspected read-only: owner-sidebar and shared/loading-link, calendar-grid, checkpoint35 audit, plus the [saved scheduling review](../03-design/pysa-scheduling-reference-review.md). Its LoadingLink already expresses navigation intent through Next Link and reviews prefetch cost; useful continuity does not require copying a global loader. Its scope/false-success/timezone defects remain cautions. No direct PYSA browser or permission verification.

## Remediation handoff — proposed, not implemented

1. **Guard-preserving internal routing.** Reuse Next Link/default event handling and reviewed imperative routing. Do not replace external identity exits, explicit terminal Retry or arbitrary URL handling globally. Preserve current academy/locale allowlists, review Back, unsaved cancellation and unknown/busy fencing. Test modifier/new-tab clicks, browser Back/Forward and protected unload. New test must exercise actual Next navigation, not only anchor shims. Demonstrate document requests disappear on H1/H3/H4 before declaring success.
2. **Scoped resume coordinator.** Define one visible-resume burst and in-flight policy per actor/academy/role/link and read class. Use the measured event-order finding; no arbitrary large debounce that silently delays authority. Ignore obsolete responses; purge on identity/scope change or denial; never run replacement writes. Compare read starts/aborts before and after under synchronous and separated triggers, plus native tab return.
3. **Stable revalidation presentation.** Separate first access, same-context revalidation, changed query, unavailable and denied. Keep nonprivate structure stable. Define explicitly whether same-scope previous private results may remain visible, for how long, and which actions are disabled; current source/report does not authorize a general stale-private-data cache. On denial/account/academy/role/link change immediately clear incompatible content. Keep unknown-operation reconciliation distinct from ordinary reload. Test selection retention only against a newly permitted projection.
4. **Return context and domain adoption.** After 1–3, implement safe selected ID/page/scroll anchors and focus restoration, without persisting private payloads. Preserve current Month/period/filter behavior. Apply domain-specific rules to review/form/pending states. Only then decide whether a shared authenticated layout is necessary; prove shell remount before/after if migrating it.

For every batch: exact changed trust boundaries, current meaningful negative tests, actual Next routing test where affected, EN/AR responsive/focus checks, refreshed factual captures, exact-source CI, bounded staging verification and separate Owner acceptance. Code-only rollback must preserve old operation identifiers and tolerate presentation-cache key changes. No schema/service/provider rebuild is proposed.

## Coverage still open

This completes a **focused Owner Home/Calendar B0 baseline**, not the full cross-app investigation or a security/performance audit. Missing: authenticated Trainer/Guardian runtime; hosted mobile/zoom/screen-reader; complete chronological network/document counters; current provider/source proof; shell mount measurements; cold/warm useful-task and CLS distributions; real dirty-form focus during a pending operation; hosted denial/revocation; program review lifecycle; People runtime return; QR camera lifecycle and Development runtime. Local regression evidence covers some safety outcomes but cannot substitute for those hosted cases. No privileged access restoration is implied.

Next implementation can begin with the proven guarded navigation causes once explicitly requested. Stable-layout/stale-display decisions and uncovered domains remain bounded follow-ups. No need to redo the confirmed source diagnosis, but do not call the whole redesign or extensive all-role runtime investigation complete.

## Exact changes

Only this packet, sanitized diagnostics/captures and a builder-handoff link were added. No app/schema/API/permission/test-suite behavior changed; no staging operating writes, invitations, grants, provider settings, deployment, commit or push. Product tests executed locally with fictional adapters. Documentation validation/freshness results are recorded in baseline.json after checking.

## Whole-app extension — 31 October2026

The earlier “coverage still open” section describes B0 at capture time. The [whole-app findings register](request-findings-register.md) now adds source/API/gateway/query coverage across implemented families,13 further production-React synthetic suites and live database catalogs/plain plans/statistics. [Service impact](request-service-impact.md) includes verified plan/usage boundaries, official dated quotas and a transparent100/1000/10K-user scenario. [Original-plan addendum](../06-delivery/request-hygiene-and-offline-standard.md) supplies architecture/freshness/offline decisions, DoD and prioritized implementation handoff. [Evidence index](../07-handoff/evidence/navigation-refresh-2026-10-31/index.json) preserves imported/B0/new evidence separately.

Every declared area now has a diagnosis or assigned next measurement (G01–G09). This completes the analysis at that explicit coverage level; it does not complete all-role hosted investigation, performance percentiles, offline policy or the redesign. Original B0 observations/limits remain valid and unchanged. No product fixes, schema/provider/account changes, operating writes, deployment, commit or push.
