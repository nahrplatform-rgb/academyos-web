# EX-11 connected Owner working-day fixture

4 November 2026. The existing Owner Home, Calendar and dated planning components now lead to a working offline-register fixture in a disposable Next.js build. This is a source-bound local test of the approved attendance sequence. The existing staging app still serves its online register. [Fixture contract](../04-engineering/owner-working-day-fixture-contract.md) · [Executable browser proof](../../scripts/working-day/test_owner_next.mjs) · [Source-bound receipt](evidence/owner-working-day-next-2026-11-04.json).

## What the run proved

| Task | Observed result |
|---|---|
| Start the working day | Actual Owner Home → Calendar → published date → Back → reopen → attendance, with the period and selected date preserved in one document. The five task entries made one authorized read apiece. |
| Prepare one register | First prepare made one fictional key exchange and three authorized requests for manifest, 18-row page and completion. The unchanged check made one manifest request and transferred no roster page. |
| Work disconnected | A reload restored the encrypted 18-row register. Cancelled navigation retained all unsaved choices. Escape returned focus from review. Saving all 18 marks together used zero API requests and produced no server write. |
| Close and reopen | A full Chromium process restart reused the same profile while offline. A service-worker response supplied the public fixture document. The encrypted register and exact pending original reopened with zero API requests. |
| Reconnect and recover | After the canonical database commit, the browser reply was dropped. The UI showed an unknown outcome. Explicit retry sent byte-identical input. Database checks found one operation, 18 marks, 18 history rows and one audit event. |
| Refresh the affected view | The receipt marked the prepared roster as requiring a check. A bounded refresh used three requests and reported 18 recorded marks. |
| Handle a refused upload | An Arabic 390px RTL register prepared 18 players with no horizontal overflow. The server refused one offline edit after a deliberately expired window. The fixture showed Needs review and retained it without creating an attendance operation or mark. |
| End and recover scope | Fixture logout removed the read copy across reload. A different fictional account was refused recovery. The original account reopened the one refused mark without bringing back the read copy or dispatching again. |

The fixture seeds two published test events in an actual 40-date program and retimes the two disposable events to exercise the current recording window. It uses PG17 and the canonical schema, signed gateway checks, transfer/dispatch routes and browser repository. Clerk identity, release of the recovery key, the Redis responses and the PostgREST link are replaced by local adapters. The service worker keeps only an explicit allowlist of four fictional register documents and versioned static assets. No API result or roster is in the worker's cache. The public fixture shell is intentionally separate from the hosted app's authentication and offline startup.

## Measurements and status

Single headless Chromium 156 run on macOS ARM64, Node 24, unthrottled loopback, EN 1440px and AR 390px. Useful Home appeared in 214ms, Calendar in 123ms and the actionable date in 158ms. First prepare took 187ms and offline process reopen took 184ms. The entire test, including refusals and replay, logged 22 POST requests, 18 signed database RPCs and 36 logical limiter checks. JSON bodies totalled 9,329 request bytes and 37,612 response bytes. Counts exclude documents, assets and fixture seeding. Limiter checks are test-adapter calls, with no measured provider command costs. The receipt is the source for these sample values. They establish neither performance percentiles nor hosted savings.

- **Design:** earlier Owner local-read and offline-register approvals retained.
- **Implementation and local tests:** temporary fixture and eight connected checks. Scope covers component and journey evidence for parts of WD-02/04/05/12, WD-33/47 and Owner analogues of WD-52/54–56. The 57-case acceptance register retains its broader statuses. This run leaves People/reviews, directory/month/three-month replicas, actual sign-in, full phone/accessibility, storage and clock failures and other roles open.
- **Deployment and hosted verification:** fixture only. Existing staging behavior and closed private flags are unchanged.
- **Owner working acceptance and independent security:** pending. [EX-09 release choices](../04-engineering/owner-register-private-readiness.md) specify the remaining device, key custody, exact fields, verification time and recovery authority before private enablement.

Run `node scripts/working-day/test_owner_next.mjs` with Node 24, Playwright Chromium and PG17. `--check` verifies the retained source fingerprint. `--record` replaces the measured receipt after a successful run. The Foundation workflow checks both source freshness and the executable journey.
