# EX-11 Owner workspace and offline startup checkpoint

4 November 2026. The approved single-register pilot is connected to the real attendance components and signed transport behind a closed staging flag. The existing online path remains available. The [workspace contract](../04-engineering/owner-register-workspace-contract.md) records the authorized scope and acceptance boundaries. [Local browser receipt](evidence/owner-register-workspace-2026-11-04.json) · [Earlier registered transport and lifecycle evidence](owner-register-lifecycle-checkpoint.md).

## Behavior demonstrated locally

- The attendance route requires a verified session. The personal-device option also requires matching route and Clerk identities plus current academy Owner access to the published roster. Choosing online only starts no key release, download or worker preparation.
- After explicit preparation, the [public startup page](../../apps/web/src/app/prepared-register/page.tsx) can reopen the latest prepared register while offline. Its document contains no account, academy, event or roster. The scoped worker accepts only that fixed page and its versioned public scripts/styles, capped at 48 assets and 8 MiB per preparation. It fetches those assets without credentials. Prepared records and pending saves remain in the protected store.
- An already-open offline register keeps unsaved selections when the connection returns. A fresh online visit to the public page shows a link back to the workspace without opening local rows. Use the signed-in attendance route to verify access and sync the original save.
- Known account departure and in-app sign-out mask prepared views across tabs. Cleanup removes read copies and reusable keys across that account's academy slots before calling Clerk sign-out. A cleanup error keeps the view masked and can be retried. The same verified, still-authorized Owner can recover pending work through the normal signed-in route. Recovery alone does not download a fresh roster.
- Local marks use the existing protected journal and exact original-operation recovery. Server access, current versions and the recording deadline still govern sync. Approved recording and correction rules are unchanged.

## Evidence and limits

Seven connected cases passed using the real product components, Next routes, signed gateway, disposable PostgreSQL 17, Chromium, IndexedDB and service worker. Clerk session changes, rate limits and PostgREST HTTP are fixture adapters. The run checked a mismatched principal, a cold Arabic reopen, unsaved choices surviving reconnect and sign-out masking in a second tab. An injected cleanup failure kept the mock session signed in until retry cleared both replicas. A normal same-account sign-in recovered both pending originals without restoring either roster.

On the original register-only source, each first preparation made four signed application requests. The worker cached 11 public entries. A full Chromium restart reopened the Arabic register in 124 ms from the test navigation start to the ready register, with zero application API calls. These are individual local samples, separate from hosted latency percentiles, bandwidth and provider-cost measurements. An offline browser cannot observe an external logout or revocation until it reconnects and checks current access. Offline entry depends on an available public shell, browser storage and a prepared record that still meets the existing verification rules.

Run `node scripts/working-day/test_owner_startup.mjs` with Node 24, Chromium and PostgreSQL 17. `--check` validates source fingerprints. `--record` records a successful run. The factual experience review retains the default app captures. This gated candidate has its own runtime receipt.

## Next release gate

Use the [combined staging and independent security handoff](owner-register-staging-handoff.md) for the current release evidence and next steps. It preserves the active Owner Operations source, verifies the staging migration baseline and separates closed staging smoke from authorized synthetic activation.
