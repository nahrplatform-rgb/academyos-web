# Attendance register redesign — implementation receipt

29 October 2026. Owner accepted Charcoal spectrum/dark default, then all-or-nothing new-register policy for design, then the connected attendance design for implementation. This receipt does not replace previous I4a/I4c/I4d working approvals. [Accepted contract/change packet](../06-delivery/attendance-refresh-design-contract.md), [security review](../04-engineering/attendance-refresh-security-review.md), [prior QR evidence](i4d-qr-attendance-implementation.md).

## Actual scope and status

Implemented: J12 / IMP-J12-A01, S28 register plus unchanged S29/J13 correction link/history. Select Present/Absent directly for multiple unmarked players; load more/search/filter retains selections; exact-set review then one canonical batch save. Saved marks remain correction-only, with existing required reason and Trainer request/different-account Owner review. Charcoal/dark starts on attendance, with optional in-visit light view; this is the first redesigned module, not completion of platform-wide theme rollout. Current shared components and existing source-authorized role navigation are reused.

Unknown reply blocks replacement and hides the roster until the original operation is reconciled; absent commit is fenced before replacement. Confirmed commit/read failure offers reading again. Stale choices remain until the user loads the latest register and explicitly removes choices belonging to newer saved marks. Denial clears private data. No names/draft persisted locally; only the existing principal/academy/occurrence-scoped pending operation ID is stored. Existing QR and correction routes remain connected.

`a10_register_v1` validates the complete unique version0 selection before writes and uses existing academy/operation locks and current authority. One transaction saves marks, immutable histories, audit and compact count/event/operation receipt; failures or final server-deadline crossing roll back everything. Existing individual correction endpoints remain compatible. Request bound128KiB for up to1000 marks (existing session-size bound); other attendance requests remain8KiB and all responses32KiB. No limiter increase, new dependency, email, account restoration or Guardian expansion.

## Verification obtained

-8 actual disposable PostgreSQL17 batch cases passed, including1000 marks, duplicate/replay/fence, mixed stale/new zero-effects, wrong role/tenant/branch, revoked membership, history/receipt/audit rollback, concurrent existing mark and batch ordering, concurrent replay and deadline crossing. [Database receipt](evidence/attendance-refresh-local-2026-10-29/database.json).
-7 existing actual attendance SQL cases passed in24.267s, including correction/withdrawal races and1000-player byte-aware roster/history checks. [Current regression metric receipt](evidence/attendance-refresh-local-2026-10-29/existing-roster-regression.json). These timings exclude hosted HTTP/load/cost.
-71 app units; actual API15 limiter failure cases plus invalid/cross-origin denial; actual React production/development recovery tests; lint/typecheck/build;17 foundation E2E passed. [React receipt](evidence/attendance-refresh-local-2026-10-29/ui-development.json). Test adapters simulate identity/HTTP only; SQL and hosted evidence remain distinct.
- EN/AR320/360/926/1440px overflow/focus/review tests and actual-component screenshots. Screenshots were visually inspected; this does not establish screen-reader or physical-device acceptance.
- Current-experience HTML regenerated from actual source:816 recorded frames,830 transitions,51 source files;14 workflow harnesses plus8 welcome-route captures passed; review-tool and freshness checks passed. Proposed design remains separate.

## Staging schema and recovery

Fresh trusted-main backup run40814796768 completed encrypted upload/download verification. Digest`7251b8737c41464590bb91c2916adb0e9ed93590244c6c269b7738cc898ff279`,717160 bytes, zero Storage objects matched the trusted job log and downloaded artifact. Decryption/payload checksums passed; disposable restore plus the new migration passed membership boundary and58 private RLS tables. This is database restoration, not a hosted Storage/service restore. Initial recovery used an incompatible default PostgreSQL client; rerun with pinned PG17 succeeded.

Additive hosted migration version20261029035928 applied to `academyos-staging` only; CLI-prepared filename aligned to the returned hosted version. All51 non-secret preexisting domain table fingerprints unchanged. No domain rows or memberships changed. [Schema/fingerprint/advisor receipt](evidence/attendance-refresh-local-2026-10-29/staging-schema.json). Advisors retain58 RLS/no-policy INFO and3 existing anonymous-definer warnings; authenticated-definer warnings90→91 reflect the one explicitly authenticated, gateway/current-authority-checked RPC. These warnings are recorded, not a zero-finding security review.

App promotion and signed-in hosted register verification are pending at this checkpoint. Working redesigned-feature acceptance, independent human security, wider device/accessibility, direct-API/hosted adversarial races and measured HTTP/load/WAL/cost gates remain open. Temporary Trainer/Guardian test access remains ended. No production launch or real data.
