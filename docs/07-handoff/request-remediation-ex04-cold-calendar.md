# EX-04 — cold Calendar dependency checkpoint

2 November 2026. Continue from [shell/identity measurement](request-remediation-ex02-shell-identity.md) and the [living execution tracker](../06-delivery/experience-execution.csv). Authorized scope: measure the next bounded Owner navigation/loading dependency, then define its safe replacement. Existing J01-A01/IMP-J01-A01 and J09-A01/IMP-J09-A01, S03/S22/S23/S25, L01/L04/L07 and SEC-J01/SEC-J09 joins remain. NR06 is confirmed more precisely, **not closed**. Related NR05/NR07, real identity causality and all-role coverage remain open.

## Evidence and method

Product/API/schema/permissions are unchanged. Extended `scripts/navigation/test_next.mjs` with opt-in `EX04_COLD_MEASURE=1`; the ordinary actual Next regression still runs afterward. The diagnostic is not a newly enforced default CI gate. No telemetry, cache, private persistence, dependency, invitation, grant or service configuration was added.

Run:

```sh
EX04_COLD_MEASURE=1 UI_EVIDENCE_DIR=/tmp/academyos-ex04-cold node scripts/navigation/test_next.mjs
```

Each locale/scenario uses a separate browser context. Actual production-built Next routes, current components and styles run over fictional Owner identity and read-only API fixtures. Each experience request has a controlled 250ms transport delay. We wait for the actual Calendar row and enabled period navigation; failure cases wait for domain-specific unavailable text, never merely the Next route announcer's `role=alert`.

The first two exploratory runs failed the recovery locator: Next's route announcer satisfied the generic alert check before the domain failure arrived. This prematurely disabled the fixture failure. Corrected semantic synchronization, without changing product behavior or weakening recovery assertions. The final 18-case diagnostic and remaining ordinary navigation/dirty/history suite passed. Final receipts, failure-state captures and input fingerprints are in [the evidence index](evidence/request-remediation-ex04-cold-calendar-2026-11-02/index.json).

## Results

Sequences were identical in EN/AR. Times below are **single controlled local samples**, including initial document entry; they are not hosted latency, percentiles or a promised saving.

| Entry | Calls | EN / AR usable ms |
|---|---|---:|
| Fresh Calendar, no hint/preferences | Home → Calendar | 929 / 913 |
| Valid branch-day hint | Calendar | 380 / 405 |
| Invalid date hint | Home → Calendar | 872 / 927 |
| Restored valid period | Calendar | 355 / 407 |
| Month view, no stored date | Home → Calendar | 867 / 894 |

The second call starts at least250ms after the first, establishing the serial transport dependency under this fixture. Both week and month request the expected bounded period; restored8November starts8November, without a Home lookup. The fixture's branch day is1November2026. It is not the Mac's current date.

Failure/recovery results:

- Home failure: no Calendar call or private rows; explicit current-period recovery repeats Home → Calendar.
- Calendar failure: Home → Calendar fails; explicit current-period recovery repeats Home → Calendar. No empty result is presented as success.
- Setup required: one Home call, resumable setup offered, no Calendar call or session rows.
- Leave while Home is held: no Calendar starts after departure and release of the held fixture response. This proves a frontend lifecycle boundary only. It **does not prove** SQL, gateway or upstream HTTP cancellation, nor saved backend work.

Source explains the mechanism: `ExperienceJourney` in `apps/web/src/components/experience-workspace.tsx` reads `${role}_home` when Calendar has no `from`, obtains `h.context.today`, then sets `from`; the effect reruns `${role}_calendar`. `apps/web/src/lib/experience-projections.ts` requires explicit dates for current Calendar actions. The API dispatches one selected RPC per successful request through the existing signed gateway. `academy.x15_home` in `supabase/migrations/20261029194029_experience_home_calendar_reads.sql` computes today's Calendar and additional role panels; it is more than a date lookup. `academy.x15_context` supplies the database-clock branch-local day. Existing bounds/total/cursor logic lives in `academy.x15_calendar`.

## Next bounded implementation contract

This is engineering preparation under the accepted Calendar experience, not new business policy, product acceptance or a deployed interface. Continue implementation directly from this packet; do not repeat measurement or request approval of unchanged role rules.

1. Add a named **Owner-only current-period Calendar read**, with only academy and `week|month` mode accepted. The API and signed gateway must use a fixed allowlisted read target; the client role string grants no authority. Keep existing explicit-period/cursor actions for navigation and subsequent pages.
2. Resolve current Owner/academy/setup context and the branch-local civil day at the database boundary. Return the bounded Calendar projection in the same request. A week retains current behavior: today through today+6. Month retains Sunday-start month grid,42days. Never replace this with browser-local date/time guessing.
3. Reuse current `x15_context` and bounded `x15_calendar` where practical. Do not duplicate Home panels or relational query implementations. Resolve setup-required as an explicit resumable state, not an empty Calendar. Keep finite civil-date validation, authoritative totals,50-row/byte bounds, period-bound cursor and current-authority checks.
4. Frontend cold entry owns **one** initial Calendar request. Installing the returned period must not trigger an immediate duplicate effect/read. A safe stored/hinted period still owns one explicit-period request. No public/private stale display, cached authority, new persistent payload or dirty/unknown write behavior is introduced.
5. Keep denial/unavailable/setup distinct. Clear private rows on denial and ignore obsolete replies. Recovery is explicit and current; no global retry loop or replacement write. Additive migration must follow local database rehearsal/backup/ACL/proof verification before hosted application, with prior table data unchanged. SQL must be deployed before a dependent app build is promoted.

Acceptance cases: actual PostgreSQL signed-target/current Owner positive; wrong role, unrelated academy, suspended membership, anonymous/direct invocation/proof mismatch negative; timezone rollover and week/month bounds; setup-required; pagination/byte bound/cursor reuse; no operating-data writes. API origin/body/budget/no-store tests remain. Actual Next EN/AR cold2→1, valid/restored1→1, month, invalid hint, failure/recovery, departure, focus/return and period persistence must pass while existing dirty/history/unknown safeguards remain. Update API fixture behavior honestly; it must not substitute for database authority tests.

The new request budget is a target, not an achieved result. Avoid one-time skip flags that accidentally suppress a real period/role/resume change. Review effect ownership and returned anchor application explicitly.

## Cost, reference and delivery boundaries

Eliminating a successful Home round trip should remove one app/API/gateway/RPC traversal for this scoped cold path. It does not establish a50% reduction in all queries or monthly service usage. Home's internal aggregate work, limiter amplification, Clerk behavior, hosted cancellation and actual payload/query costs still need their assigned measurements. Existing timeouts, fail-closed budgets and proof checks must stay intact. No index or cache is justified solely by this local transport test.

Revisited [PYSA scheduling review](../03-design/pysa-scheduling-reference-review.md) and read-only `pysa-platform/components/player/schedule/player-schedule-client.tsx`: list/calendar orientation, explicit visible period and academy timezone are useful references. Its supplied-session client does not establish AcademyOS's permission/cold-query contract. Preserve the ledger's known recurrence/subset-search/recovery defects; no PYSA changes or fresh hosted claims.

Supabase database-function guidance was consulted for the proposed authoritative boundary; functions and execution privileges require explicit handling ([official documentation](https://supabase.com/docs/guides/database/functions)). The markdown changelog fetch was unsupported by the browsing tool; no claim of a complete current changelog review is made. This checkpoint adds no SQL and does not rely on that fetch for implementation safety.

| Gate | Status |
|---|---|
| Experience design | Existing approved Calendar retained; no new design approval inferred |
| Product implementation | Prior fixes retained; cold Home dependency still present |
| Local verification |18 diagnostic cases plus ordinary actual Next regression passed |
| Factual review | Inventory-only rebuild from unchanged real-component capture pack |
| Deployment | Tooling/docs checkpoint only; no new app promotion |
| Hosted verification | Not performed for cold entry; prior127352b remains last checked app source |
| Owner acceptance | Not requested for an unimplemented fix |
| Independent security | Open |

Continue with the implementation contract above. EX-02 role/history and provider-causality gaps, EX-03 recovery, EX-05 query/cost, private-policy decisions and full redesign parity remain tracked rather than silently retired.
