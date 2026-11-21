# EX-11 hosted offline save and recording-window repair

4 November 2026. The existing Academy A Owner completed a two-player offline register on staging build `50a2ae1`. The browser reopened the encrypted register while disconnected, saved both marks together, then recorded the original save once after reconnecting. Preparing before the session exposed a recording-window defect. The repair is promoted and the existing register passed its signed-in offline retest. Follow the [execution tracker](../06-delivery/experience-execution.csv) into EX-13.

## Promotion and signed-in retest

The Owner promoted `cb00ab8`. On 5 November Cairo time, Vercel resolved the staging hostname to Ready deployment `dpl_GaKbABC9eyafobc72VNfCYjQ9UNu` at the same full commit as both passing Foundation runs. The public worker's SHA-256 matched Git, and the public startup returned HTTP 200 with its register shell marker. [Promoted deployment](https://vercel.com/academy-os2/academyos-web/GaKbABC9eyafobc72VNfCYjQ9UNu) · [Push checks](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/41915930417) · [PR checks](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/41915942729).

In the existing signed-in Chrome profile, Check download refreshed the public offline code. The test tab then reopened and reloaded the register with DevTools Offline and Disable cache enabled. Both saved statuses appeared from the local store. The updated recording-window bundle came from the service worker. The full log showed 18 entries, 0 transferred bytes and 826 kB of resources, including a failed network-first fetch and a failed Sentry attempt. No operating API request appeared. Normal Chrome network and cache settings were restored, and the signed-in register was left open.

The database still showed one bound slot, two version-1 marks, two history rows, one original operation and one corresponding attendance audit. Casey's membership remained ended. The event was within its recording window. The hosted retest covers code replacement and cold offline reopening of the already-started event. Opening at the start boundary remains verified in the separate local test.

[Post-promotion receipt](evidence/offline-pilot-resumed-2026-11-04/promoted-retest.json) · [Offline screenshot](evidence/offline-pilot-resumed-2026-11-04/promoted-offline-reload.png) · [Network/accessibility extract](evidence/offline-pilot-resumed-2026-11-04/promoted-offline-reload.txt) · [Earlier preview receipt](evidence/offline-pilot-resumed-2026-11-04/release-candidate.json)

## Hosted journey

| Step | Observed result |
|---|---|
| Existing work | The earlier blocked publication job `51759d01-365d-44bc-a692-533887b9ab1c` was confirmed cancelled at version 3 with zero publication events. The second draft remained unpublished. |
| New session | The verified iCloud Owner in a separate Chrome profile created, planned and published Synthetic EX11 Offline Register 21:30 in Academy A with Casey and two existing fictional players. The session ran 21:30–22:30 Africa/Cairo. Plan version 1, one publication event, two roster rows. |
| Prepare and reopen | The Owner explicitly prepared the personal device before session start. The registered slot loaded 2/2 encrypted rows. In the test tab, DevTools Offline and Disable cache forced a cold reload of the public startup. The Network log showed 18 entries, 0 transferred bytes and 824 kB of resources, including the expected failed network-first fetch and a failed Sentry request. No operating API call appeared. Both English and Arabic displayed the prepared rows. |
| Storage boundary | IndexedDB showed two row envelopes. Cache Storage showed 17 entries for the public startup document and Next static assets. The inspection excluded key material and decrypted stored payloads. |
| Save locally | An explicit online Check download after start was required on this build. After disconnecting again, the Owner chose Absent for Synthetic Response Drop and Present for Synthetic Registration Demo. Review showed both choices. Save on this device produced one protected original, still present after another offline cold tab reload. The database had zero marks, operations and history entries at that point. |
| Interrupted sync | A dispatch attempt with the test tab offline showed “Outcome unknown · Check the original save”. A hosted read still showed zero committed operations. This verifies an interruption before commit. |
| Reconnect and confirm | The same original `045f09c7-1c3f-45d4-96f0-2642d3ba79f8` was sent after reconnecting. The app confirmed recording, and SQL verified two version-1 marks, two history rows, one operation and one attendance audit. Check download displayed both saved statuses. |
| End trial access | Casey was restored from version 17 to 18 for publication and ended at version 19 after preparation. One restore and one end audit were verified. The Owner recorded attendance after Trainer access ended. |

[Structured hosted result](evidence/offline-pilot-resumed-2026-11-04/phase.json) · [Offline reload](evidence/offline-pilot-resumed-2026-11-04/offline-reload.png) · [Pending after reload](evidence/offline-pilot-resumed-2026-11-04/pending-reopened.png) · [Server confirmation](evidence/offline-pilot-resumed-2026-11-04/server-confirmed.png)

## Changes in the promoted build

- Before the repair, the offline UI retained the download's closed flag after server time had reached session start. The device now uses elapsed local time since its last verified server-time sample to estimate the start and end of the capture window. A local timer and returning to the tab refresh the controls. Opening and closing require no network request, and unsaved choices remain visible when the window closes. Capture rechecks the window immediately before writing the protected original. The server continues to enforce current authority, versions and its recording deadline at dispatch.
- An explicit online preparation checks for updated public offline code. The worker retains the current build until the new public document and assets are complete. An unchanged document reuses the existing assets, and a failed update preserves the previous build. A normal offline reopen continues to read the prepared device store.
- The local working-day fixture now selects a supported timezone where its synthetic session can still be published on the current local day. This repairs the after-22:00 Cairo fixture failure while preserving the assertion that the session appears on Today.

The device estimate depends on the local clock and stored verification basis. A detected backwards clock requires online verification. Server validation remains authoritative when a clock moves forward.

## Verification and continuation

Local evidence covers the future-prepared start and close without requests, dirty choices at the deadline, public build replacement and failed-update recovery, typed storage, original dispatch and the connected working day. The latter verifies full Chromium restart, committed-response loss, deadline refusal and logout recovery in a disposable environment. Hosted evidence here uses a cold tab reload and interruption before commit. Physical browser restart, committed-response loss, extended conflict/deadline and logout/30-day recovery on staging, broader devices and measured provider costs remain open. Owner working acceptance is pending. Independent human review is deferred by Owner and remains unperformed.

The scoped EX-11 checkpoint passed. EX-13 starts with the permitted Players and selected-month datasets. Preserve the existing event, registered slot, root, original and audit history. Owner working acceptance and the wider device, recovery and performance evidence remain open.

[Local startup and window cases](evidence/owner-register-workspace-2026-11-04.json) · [Public worker cases](evidence/public-register-shell-2026-11-04.json) · [Working-day cases](evidence/owner-working-day-next-2026-11-04.json) · [Typed storage cases](evidence/local-register-repository-2026-11-03.json) · [Dispatch cases](evidence/offline-register-dispatch-2026-11-04.json)

Delegation used one `gpt-6.1-terra` worker at medium effort for an independent window diagnosis and the public-worker test and receipt. The coordinator reviewed the test diff and handled source integration, provider reads, the signed-in browser and release preparation. Peak helper count was one. Savings were unmeasured.
