# MP-B01 Players search continuity

9 November 2026. EX-07 / MP-B01, VAL-02/09, IMP-J06-A01, S16–S18, L05/L06, SEC-J06, WD-69/70/71. Continue the accepted Owner Players journey at `5a7bebc`. Its signed-in synthetic Academy B directory shows the original pending behavior while a valid query runs. [Verified staging baseline](mp-b01-directory-return-2026-11-09.md#owner-promotion-and-signed-in-check)

## Change packet

While a different valid query or Clear is pending, keep the current checked rows in place with a local progress label that identifies them as previous results. Keep search and Clear usable. Pause row actions and paging until the current result arrives. A single-character query shows the minimum-length hint immediately, with no list read when the current scope is already checked. The newest query owns the result, and current authority failures remove protected rows. The current first-page, prepared-data and exact-operation contracts govern the work. [L05/L06](../03-design/screen-data-loading-matrix.csv) · [Registration and search contract](../06-delivery/i2a-registration-design-contract.md)

The Operations reference keeps search and results together. The earlier PYSA comparison supports scoped finding and profile inspection while deferring richer filters and new permissions to their own contracts. Keep the progress near the results and retain existing keyboard, phone and RTL interactions. Compare a held read, a newer query, short input, Clear and current denial at equivalent widths and fixtures in both React modes. Record request counts and hosted proof separately. [Operations reference](../03-design/operations-design-reference.md) · [PYSA/source comparison](evidence/mp-b01-profile-continuity/reference-review.md)

## Before and after

The actual People component ran in Chromium with three synthetic rows and a held `/api/people` response. The English desktop and Arabic 360 CSS px views used the same accepted controls, palette and data. [Before-and-after receipt](evidence/mp-b01-players-search/comparison.json)

| Interaction | Before at `5a7bebc` | Working result |
|---|---|---|
| Change to a valid online query | All three checked rows disappeared. The page showed Loading players, and Clear was disabled. | All three original row elements stay mounted under a previous-results label, with row actions paused and no current-result count. Clear and input stay usable. One request in each version. |
| Replace the query or clear while held | The entire table presented as loading and Clear waited for the read. | Superseded reads abort when the query changes. A late refusal cannot replace the latest matching row or cleared list. Clear requests the first page with one blank-query read. |
| Type one character | Loading appeared during the debounce and an empty page summary followed. The checked scope sent zero requests. | The minimum-length hint appears immediately, without a loading message, count or request. Equivalent normalized input leaves the current results and request count stable. |
| Current scope returns `403` | Authority handling masked the directory. | Current refusal still removes protected rows. The separate profile-recovery and registration checks retain their own expected counts and original-operation behavior. |

Both React modes passed the new cases and the existing People suite, including four simulated creates, the post-save/authentication sequence and same-query page return. Search from a profile preserves input focus. EN desktop and AR 360 screenshots show the scoped status, focused field and readable previous rows with the existing Operations spacing. The local hold establishes the UI state and request counts, with hosted latency and physical-device observations separate.

The first implementation also removed the prepared search's result-summary element while its indexed read ran. The existing transport assertion caught that change. Device searches now keep their summary and resolve in place. The scoped online status applies only when the search is online or the local read needs an authorized online fallback.

One configured `gpt-6.1-terra` helper at medium effort authored the isolated component fixture. Peak helper count was one. The coordinator tightened the held-response settlement and focus assertions, integrated the capture inputs, reproduced the baseline and owned the product, authority and release checks. Token savings are unmeasured.

## Local checkpoint

The final Node 24 build, types, lint and 103 unit tests passed. The 70-check workspace transport suite passed against the current compiled shell, actual signed handlers and disposable PostgreSQL 17. Its protected search made zero operating requests and retained the original result-summary element. Eight Owner working-day and 23 normal Attendance checks refreshed the receipts affected by the shared stylesheet fingerprint. [Workspace transport](evidence/ex13b-workspace-transfer/transport.json) · [Owner day](evidence/owner-working-day-next-2026-11-04.json) · [Attendance](evidence/ex07-normal-attendance/runtime.json)

The living review refreshed 16 real-component groups and eight entry captures. Its source and dependency fingerprints include the changed-query fixture. Review-tool, execution, implementation and continuation checks passed. [Current experience review](../../design/app-experience-review/AcademyOS-experience-review.html)

The signed-in baseline belongs to `5a7bebc`. Exact CI, preview, Owner promotion and signed-in checks for the new search candidate are separate. The next development check covers the connected Today → Calendar → session → Attendance → exact return journey. [Living continuation](../06-delivery/continue-academyos.md)
