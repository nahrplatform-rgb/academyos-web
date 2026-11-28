# EX-15 storage diagnostics checkpoint

13 November 2026 · EX-15 / PW-06 · supporting MP-B01 work

**Latest review: lifecycle proof executed 13 November.** The [active corrective resume packet](mp-b01-corrective-resume-2026-11-13.md) records the executed batch. The detached persistence ordering is now behaviorally proven by the real hook and the real storage utility, including the old-ordering negative control; installed-device, OS-quota and eviction evidence remain open.

## Outcome

The existing approved personal-device preparation path starts advisory storage capability diagnostics without awaiting persistence before its operational transition, and the detached ordering is now proven by the real hook lifecycle cases. Worker ownership, local repositories, keys, authority and sync contracts remain.

- `apps/web/src/lib/workspace-storage.ts` feature-detects `navigator.storage`, records `persisted()` status and reads advisory `usage`/`quota` estimates.
- Device approval requests persistence when the browser exposes `persist()` through a detached promise; the later real-hook cases below now cover operational preparation/sync under controlled refusal, unavailable and delayed replies. Actual browser permission remains device evidence.
- Existing device tools show the truthful status: granted, not granted, unsupported or unavailable, with advisory KB usage/quota when present.
- No private payload, credential, token, local key or pending operation is stored by the diagnostic.
- No worker, cache prefix, schema, eviction policy, offline command or background-sync promise changed.

## Evidence and limits

- OpenCode reported `npm test --workspace @academyos/web` — 112 tests passed, including storage utility classification, delayed utility resolution, throwing APIs and absent `persist()`. These are utility cases, not executed component lifecycle scenarios.
- `npm run typecheck` — passed.
- `npm run lint` — passed.

The utility tests use injected fictional `StorageManager` implementations. They cover utility outputs, not operational preparation, phase ordering or stale-component behavior. The subsequent hook integration below supplies its own local proof. Neither layer establishes actual OS quota, browser persistence permission, installed-container lifecycle or eviction. Those cases remain EX-16; existing repository/original recovery and worker ownership are unchanged. The earlier documentation repair itself reran no product suites.

## Corrective batch amendment — 13 November 2026

**Finding 4 — closed locally 13 November:** `scripts/working-day/test_device_lifecycle.mjs` (new; registered in `.github/workflows/verify.yml`) mounts the real `useOwnerWorkspaceDevice` hook and the real `workspace-storage` utility with fictional slot/account/sync doubles and a controllable `navigator.storage`. It asserts: the operational phase reaches Ready while persistence is still pending; the late granted reply updates advisory storage and keeps Ready (the Finding 4 core ordering); rejection → `unavailable` status with Ready kept; refusal (`persist()` resolves false) → `not-granted`; unsupported StorageManager → `unsupported`; denied sync → `denied` phase; account change while persistence is pending — the new mount owns its own inspect result and the released stale reply does not update it; unmount while pending — the late reply produces no runtime errors; and a disposable old awaited-ordering variant (`globalThis.__oldAwaitPersistence`, build-time injection) reproduces the Ready→Preparing overwrite, proving the regression is detected rather than hypothesized.

The later Node 24 refinement adds explicit **academy-change remount** under the same subject/academy key strategy used by the signed-in product wrappers; the old academy's released reply does not alter the new visible state. The earlier suggestion of a reachable same-mounted account/academy defect was unsupported. **Unmount is limited to no captured page errors**; callback attempts are not instrumented. [Current lifecycle receipt](evidence/mp-b01-device-lifecycle/receipt.json) · [workflow execution and hashes](local-first-workflow-2026-11-13.md).

Limits: no OS quota, browser permission dialog, eviction, mixed-version or installed-container proof. The three `workspace-storage.test.ts` scenarios keep their correct utility-only classification (their "integration-level" label is corrected by this execution; they remain useful utility coverage).
