# Automatic local key readiness and existing workspace checkpoint

3November2026. Current continuation uses the single [tracker](../06-delivery/experience-execution.csv); this is a **scoped engineering handoff**, not a whole-app completion/security/release receipt.

## What actually changed

Added an isolated no-extra-credential encryption/recovery mechanism and browser harness under `scripts/local-data`. Its [source-bound receipt](evidence/automatic-local-key-2026-11-03.json) records16passing actual browser cases,18fictional roster players/17selected marks, browser-process restart, atomic writes, wrong-account/key/device denial, cleanup/recovery and late-response fencing.30covered reads made zero fixture key exchanges. [Architecture, measured profile, fixes and limitations](../04-engineering/automatic-local-key-readiness.md).

The device key and encrypted pending envelope use real WebCrypto/IndexedDB. The HTTP identity/key server is **fictional**, with in-memory key custody; this is not the app's Clerk or a deployed key-release endpoint. The mechanism uses no WebAuthn credential, local password or user interaction for reopening. It is not imported into any product route.

Rechecked the existing EX-02 workspace rather than adding another unused provider. [Actual Next and unit evidence](evidence/automatic-local-workspace-2026-11-03.json): EN/AR Home→Calendar→date→Back retains one layout read-owner/one initial document through4current reads; identity uncertainty masks private rows and disposes the owner; a changed subject mounts a new owner and current read. Two simultaneous same-resource consumers share one transport;12source unit cases preserve partition, abort, denial and write exclusion. Existing actual Next dirty-cancel, selection and Back/Forward checks also pass. These use fictional identity/API adapters; the separate earlier hosted source proof remains in [EX-02](request-remediation-ex02-read-owner.md).

## Scoped routing decision

- **EX-10 checkpoint passed:** selected login-only UX, approved register/read designs, minimum field/key/transport architecture,16actual crypto mechanism cases and15earlier disposable SQL cases now supply a concrete basis for an inactive typed adapter. Remaining real key custody, authority binding, time/cleanup and independent security are explicit enablement gates, not silently completed work.
- **EX-02 compatibility checkpoint passed:** the existing principal/academy layout lifetime is sufficient as the Owner slice's integration point. Its fresh tests and prior release evidence support reuse. Route chrome/all-role/navigation findings remain partial. No additional parent provider or current authority cache was added.
- **EX-06 is next:** implement the typed encrypted **Owner register** repository/journal with fictional data first, separate from the current in-flight read owner. Keep app opening/private activation closed until the real authenticated key-release/custody, field and security gates are met. EX-04/03 then supply coherent roster bootstrap and original command/receipt transport. EX-11 still requires a real connected working day.

This advancement follows the execution guide's scoped-checkpoint rule; it does not close NR01–NR17, promote any WD case, retire the wider local-first/redesign scope or imply private enablement from a library. The57WD cases remain planned until their declared runtime layers are exercised.

## Delivery states

| Gate | Status |
|---|---|
| User experience / existing policy | Normal email/password sign-in, no mandatory passkey/extra secret/idle prompt; approved register/read designs retained |
| Implemented | Isolated mechanism/harness and CI step only; existing product code unchanged |
| Locally tested |16crypto mechanism cases;12read-owner units; actual Next EN/AR navigation/identity/dirty/return checks; source-specific receipts |
| Deployed / hosted verified | No new offline app release or hosted run; current-online staging evidence retained separately |
| Owner accepted | Prior policy/design acceptance only; no new working private feature presented for acceptance |
| Independent security | Open; same-origin unlocked-key risk, real key custody/account binding and private lifecycle remain |

Previous `b9f54ee90412993a2cd189d606b541ace4e0ff6a` passed both exact-source Foundation runs: [41618072065](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/41618072065), [41618060736](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/41618060736). This checkpoint's new CI is separate after its own push. No promotion is needed for these isolated research/docs/verification changes; future promotions remain Owner-controlled.

Reproduce using Node24: `node scripts/local-data/test_automatic_key.mjs`, `node scripts/local-data/test_automatic_key.mjs --check`, `node_modules/.bin/tsx --test apps/web/src/lib/workspace-read-owner.test.ts`, and `EX02_READ_OWNER_MEASURE=1 node scripts/navigation/test_next.mjs`. Re-running browser measurements produces a new local receipt; do not mistake changed timings for a hosted performance claim.
