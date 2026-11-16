# WD-71 · QR credential, capture and Attendance settings follow-up

16 November 2026 · EX-07 / MP-B01 · J06 credential association; J12-A01/A02/A03 / IMP-J12-A01 · S18/S28 · L05/L08 · SEC-J06/SEC-J12 · WB-09/10/11/12/20/24 · VAL-01/05/09. Preserve the [appointment checkpoint](mp-b01-appointment-followup-2026-11-16.md) and prior working-day evidence.

The QR component now distinguishes a confirmed operation with a current read still loading from a failed read. A second reproduced gap affected reconciled scan/settings originals: a failed current-context read offered no saved-result recovery. The component marks the result read pending before every branch, so those failures now offer read-only **Load saved result**. Existing original commands, card secrets, permissions, server versions, camera rules and schemas remain unchanged.

## Authorized scope and retained rules

The living continuation selected remaining WD-71 QR card issue/replace/revoke, exact-scope Present capture and academy/session scanning-window settings. The [accepted design](../06-delivery/i4d-qr-attendance-design-contract.md), [decisions](../06-delivery/i4d-qr-attendance-decisions.md), [implementation](i4d-qr-attendance-implementation.md) and security packet retain current Owner credential/settings authority, assigned scanner scope, exact selected sessions, ambiguity selection, immutable attendance/history, one opaque original and current-server permission checks. No new offline QR command, fee, role or business policy is introduced. The user value is clear recovery for the Owner/assigned operator without another reviewed save or new required field, step, read or background request; time savings are not measured.

| Before | After | Why |
| --- | --- | --- |
| Card reads could show failure wording while still loading; scanner could say ready before the follow-up settled. | Known result shows “Operation confirmed. Loading current saved data…” until the current read settles. | Acknowledgement is separate from current data readiness. |
| Reconciled scan/settings context-read failure did not set the recovery view. | Every same-view confirmed result starts a current-read state and exposes read-only result recovery on failure. | Recovery retains the known receipt without another write. |
| Generic error advised checking the original even after confirmed commit. | Confirmed/read-failed copy names the failed read. | Avoid conflicting recovery advice. |

No geometry, typography, colour or control layout change. The Arabic390px failed-read state was visually inspected: known result, failed current read, keyboard-accessible recovery and no private card name/code in the error detail. Existing Operations layout remains; no full visual-parity claim. React uses existing state/locks and derived rendering, with no new effect/listener/dependency. During a held result read the existing camera stays mounted and paused; error/denial still stops it. The first implementation accidentally unmounted it and failed the existing stationary-card regression; that was corrected before passing verification.

## Executed acceptance and evidence layer

[Checkpoint and source hashes](evidence/mp-b01-qr-followup/checkpoint.json) · [production](evidence/mp-b01-qr-followup/production.json) · [development](evidence/mp-b01-qr-followup/development.json) · [negative control](evidence/mp-b01-qr-followup/negative-control.json) · [helper](../../scripts/qr-attendance/save_followup.mjs).

**96 cases**: six actions × EN1440/AR390 × success/read503/lost reply/current403 × production/development React. The same final helper executes against the exact before-source in explicit reference/baseline mode: **48 cases detect54 gaps**, comprising48 missing held-read confirmation states and6 missing read-only recovery actions after reconciled scan/academy/session originals. The reverse patch and before-source hash retain the actual negative control; ordinary runs require zero gaps.

The original confirmation uses focus+Enter. A held write retains an opaque original, disables checking and produces zero fictional effects. Card/settings commands bind exact target/version7 and settings45/30; capture binds the exact selected two-session scope and code. Capture has no optimistic-version field and this test invents none. Only context/kind/op/target persist in recovery storage; the raw code does not. A lost reply survives the same-path reload, with no current bootstrap read while unknown. Explicit reconciliation uses the same original. Acknowledgement/reconciliation clears storage, then the held read shows known loading; focus/online/visibility adds zero requests. Read503 recovery reads only, without another command. Current403 clears private name/branch and subsequent client checks retain one original command; this case does not assert every denied-screen control or prove database refusal. Each case observes one fictional effect and the expected resulting version8.

Exact protocol is asserted through intercepted actions, including failed reads: card uses `card_change → card`; settings uses `window_change → context → sessions`; scan uses `resolve → capture → context → sessions`. Lost replies insert `reconcile` before the follow-up; read failures stop at the first read and read-only retry repeats the applicable read sequence. These are client-protocol counters, not SQL atomicity/audit/idempotency or session-override propagation proof.

The existing15-case QR suite passes in both React modes, preserving duplicate/Absent/ambiguity, malformed/lost/dropped originals, real SVG download, memory-only raw credential, cross-view navigation request, current denial, camera stream/stationary frame, responsive and keyboard/pointer coverage. A recorded router destination in that fixture remains narrower than a real destination-and-return journey.

## Verification and remaining boundaries

Actual API adapter checks pass24 budget refusals, three invalid bodies and cross-origin denial using fictional session/limiter adapters.119 units, typecheck, lint, managed production rebuild/restart and compiled-source/assets check pass with Node24.14.0. Local dev3000 and production3100 processes are current; this is process readiness, not signed-in readiness. The existing normal Attendance28-check source receipt passes `--check` at its original timestamp; it was not rerun. Existing domain/SQL receipts remain historical because canonical writers did not change.

All16 component families and eight static captures were refreshed. The factual review contains1650 frames and1971 transitions with zero capture gaps; review-tool and source-freshness checks pass. These are captured states, not exhaustive journey acceptance. Master/continuation generation, execution validation (including20 continuation tests), implementation-register validation and diff whitespace checks pass.

Read-only PYSA `components/attendance/qr-scanner.tsx` and the existing QR source/audit decision review supplied session-selection, processing/duplicate and camera-recovery patterns. Its recently-scanned memory guard is not server duplicate protection. Its general/offline scanner and role assumptions are not AcademyOS policy; PYSA source and historical synthetic SQL do not prove hosted behavior. PYSA remains unchanged.

One coordinator, zero helpers; exact backend model/usage unavailable. No live staging writes, account/provider/configuration/key changes, commit, push, promotion, physical-camera/installed-device or hosted proof, Owner acceptance or independent human security review. External review remains deferred, not passed. WD-71 remains evidence-linked across its broader role/device/hosted scope.

Next permitted connected scope: Trainer correction-request and development-feedback submission WD-71 held writes, acknowledgement, lost-original recovery and delayed/failed current reads. Reconcile existing real components and exact current-authority/version tests; add EN/AR held-response proof and repair only reproduced defects. MP-Q01 A/B/C Player choices still gate only their dependent new capabilities.
