# EX-13B normal Owner Players and Calendar

This checkpoint connects the existing Owner Players and Calendar screens to the protected device repository. It follows the [dataset contract](../04-engineering/owner-workspace-dataset-contract.md) and the [device lifecycle checkpoint](ex13b-workspace-lifecycle-checkpoint-2026-11-05.md). The exact starting fields are player IDs, names and branches, plus permitted schedule summaries in the current and adjacent month grids. The existing current-authority profile, registration and planning paths still apply.

| Journey | Implementation |
|---|---|
| Players · IMP-J06-A01/A02 · L05 | The existing directory opens before first preparation. A complete device projection serves the same search, paging and selection. Choosing a prepared row shows its summary. Opening the full profile requires a current online read. Registration, duplicate review and original-operation recovery keep their current server boundary. |
| Calendar · IMP-J09-A01 · L07 | The current requested period can read directly from complete compatible coverage. Week and Month preserve the selected session when it remains visible. The schedule distinguishes uncovered offline periods from checked empty periods. Planning still uses the existing server path. |
| Personal device · L04/L05/L07 | After a verified Owner chooses to use the device, the active route gets priority. The progress control reflects checked complete collections. A background pass yields after 12 dataset pages and continues from its verified checkpoint. An unchanged manifest renews compatible coverage without replacing rows. |
| Offline entry | A public, bounded HTML/CSS/JS cache reconstructs the exact supported normal URL and reads scoped data from the protected repository. No operating response is cached by the worker. A failed network navigation may use the public shell. An HTTP denial is returned as received. |
| Recovery and scope | Online access denial retires the workspace slot. Logout removes workspace downloads while retaining the attendance register's original-operation recovery rules. A cold offline entry reloads its exact protected URL on reconnect to restore normal sign-in and server authorization. An already-open regular route retains in-memory form state across connection changes. |

The [normal-route browser test](../../scripts/workspace-download/normal_workspace.mjs) uses the actual built Next.js public shell and assets, the product worker, real Players/Calendar components and the signed transfer boundary against disposable PostgreSQL. The existing online Players/Calendar reads, Clerk identity, Redis and PostgREST wire use local fixtures. This separates the actual storage and transfer paths from hosted provider evidence.

## Verified locally

| Check | Result |
|---|---|
| First-use Players directory | One ordinary directory read makes the initial view useful while the device prepares in the background. |
| Covered search and selection | Zero service requests for a prepared name search and summary selection. Opening the full profile issues one current read. |
| Covered Calendar | Zero service requests when changing a covered Arabic Week to Month. The selected session remains selected. An unchanged check uses one manifest request and downloads zero dataset pages. |
| Browser process restart | EN Players and AR Calendar reopen at their exact normal URLs. An unprepared month shows its own state. Zero operating API requests and zero Next route-payload requests in this disconnected sequence. |
| Reconnect and cleanup | The normal route picks up a changed player after reconnect. The shared logout path removes the downloaded data. A subsequent current Owner denial retires the re-prepared coverage. The worker returns the fixture's online HTTP denial. |

All 31 [transport and browser checks](evidence/ex13b-workspace-transfer/transport.json) passed. The existing [eight working-day checks](evidence/owner-working-day-next-2026-11-04.json) and [eight Attendance startup and original-recovery checks](evidence/owner-register-workspace-2026-11-04.json) also passed. The default real Next navigation harness passed its EN/AR, dirty guard and Back/Forward checks. The [refresh baseline](refresh-root-causes-2026-11-05.md) records the earlier Calendar mode-switch read and the same-document return rechecks. These are counts for declared actions and fixtures. Provider cost and latency percentiles remain open. WD-59–62, WD-66 and WD-70 link to this scoped evidence with their unexecuted acceptance cases retained.

## Verified staging source

Read-only Vercel lookup resolves the staging alias to Ready deployment `dpl_GaKbABC9eyafobc72VNfCYjQ9UNu`, commit `cb00ab8`. The Supabase migration registry contains the four register migrations and has no Owner workspace transfer entry. The earlier `3cd1960` passed both exact-source CI runs. The expanded normal-route implementation is verified locally. [Current Vercel deployment](https://vercel.com/academy-os2/academyos-web/dpl_GaKbABC9eyafobc72VNfCYjQ9UNu)

## Remaining release work

- Verify the exact checked closed build separately. Workspace route and transfer gates default closed, and the x21 schema and workspace key settings need their own staging readiness evidence before wider use. Rehearse scope-specific rollback and cleanup of an already-prepared workspace when the gate closes, including coexistence with the Attendance pilot. The Owner controls promotion.
- Exercise deployed signed-in normal routes with isolated Owner, Platform and denied scopes, physical devices and representative network loss. Record provider counts, payloads and latency separately from local browser checks. EX-13 stays current.
- Cold reconnect re-enters the verified route. Calendar restores matching navigation context, while a Players search and its selected summary currently live in the page and reset on a cold document reopen. Capture the remaining app-wide continuity, held response, uncovered online calendar and full-device cases against WD-58–71.
- Preserve normal Attendance integration and the rest of the full-app local-first adoption map under EX-07. Owner acceptance remains pending and independent review remains deferred by Owner.

One `gpt-6.1-terra` helper at medium effort implemented the public worker and browser registration client. The coordinator verified and adjusted that diff, integrated the scoped repository and UI, and ran browser, database and navigation checks. Peak one helper. Usage savings were unmeasured.
