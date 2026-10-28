# I4b — Guardian published training and own attendance

28October2026. Moamen explicitly accepted policy for design, including retained published sessions before link acceptance, then approved the connected design for implementation. [Policy/PYSA review](../06-delivery/i4b-guardian-training-decisions.md), [design](../06-delivery/i4b-guardian-training-design-contract.md), [security preparation](../04-engineering/i4b-guardian-training-preparation.md).

## Implemented locally

J15 / IMP-J15-A01 / S46 / L09 / SEC-J15; partial AO-014/015/016. Authenticated Guardian route `/[locale]/workspace/[academy]/guardian/training` connects linked-player chooser, bounded published session list/week calendar, next actual session, contextual detail and own current Present/Absent/Unmarked mark. EN/AR/RTL and shared phone Back/desktop panes are reused. No new dependency, OS imitation chrome or capture/history controls.

Private signed same-origin read API and three authenticated-only RPCs recheck current verified subject, active Guardian membership, exact active accepted player link, same academy and current publication head/own published-roster entry. Session field allowlist excludes other players/counts, Trainer contacts, internal history/reasons/actors and finances. Current canonical correction indicator/update are returned; Unmarked never means Absent. Retained pre-link sessions have no acceptance-date filter, as explicitly accepted. Withdrawn selection denies. Capture/correction authorization is unchanged.

**Closed rollout gate:** a new private RLS table `guardian_training_access` permits only individually authorized links. Migration seeds zero opt-ins; prior name/branch-only links do not gain new fields. No generic client table grants or new identity/membership. Existing ended iCloud link stays ended. [Prepared hosted test](i4b-hosted-guardian-test.md) requires separate explicit exact-link restoration/additional-view authority before execution.

Links25+sentinel with cursor/byte bound; selected schedule seven-day windows25+sentinel with stable `(starts_at,event_id)` cursor, selected detail one own event; no history/program duration cap. Page-aware weekly calendar explicitly labels that it covers the loaded page, with session paging for complete coverage. Next session independently queries canonical future occurrences. SQL/HTTP payload caps32KiB. No-store; abort/generation fences; child/period/account changes clear old views, focus/visibility/reconnect revalidate, loading/error/empty/denial differ. No routine polling or permanent manual refresh. SQL uses existing lifecycle/Guardian locks before checking access and publication; read-only operations have no domain write/audit side effect.

## Verification in progress

Actual focused disposable PostgreSQL cases verify own correction/minimal fields, cross-academy/role/sibling/ended/suspended/opt-in denial, withdrawal and observed lock interleavings.1,001 same-time published occurrences page without omissions/duplicates under32KiB;40 warm SQL reads met300ms target (see [scale receipt](evidence/i4b-local-2026-10-28/sql-scale.json)). These are synthetic administrator fixtures, not product write or hosted workload proof.

Actual React production/development with synthetic identity/HTTP checks paging, corrected/unmarked state, delayed fetch after child switch, failed reads/scoped retry, EN/AR320/360/926/1440, denial clearing and account remount. API adapter cases enforce rate-limit failure/timeout/outage before RPC, exact bodies/stream byte cap and cross-origin denial.57 units,13 foundation E2E, lint/typecheck/build progressed; exact final checks and inherited regression results are appended after completion.

Fresh trusted-main encrypted backup40686564537, sourcea475dadda5294510e43c7a64c14f29603bfa8748, run5f59cfc4-cf5b-4634-ab0f-ec44ed143acb: SHA256c53407de69387ecb8b61a2361c5bf53bfa0989781be2c042208a3834588b13e5,553288bytes,0objects. Download matches trusted receipt. Actual private PG17 restoration/membership tests and migration rehearsal passed; recovered2identities/2academies/4memberships. [Recovery receipt](evidence/i4b-local-2026-10-28/backup-restore-rehearsal.json). No hosted restore proof. Plaintext is temporary/private and removed after rehearsal.

## Status and limits

Design approved; real local implementation and focused checks present. Staging schema/app/recipient test not yet verified. Working-feature acceptance pending. Independent human security, physical devices/accessibility, stable-network HTTP/cold p95, load/cost/WAL and remaining I4a active-Trainer replacement gates stay open. Proposed HTTP/useful-view budgets are not inferred from local SQL speed. No real family evidence/retention policy, player login, exports, notifications, fees or progress scope retired.

Rollback/repair: keep every link opt-in closed, revert app to earlier serving source if needed, preserve canonical marks/history. Additive function/index/table changes introduce no seeded access or domain rows. Prefer reviewed forward repair over rewriting an applied migration. Never enable links to work around a test failure.

## Final local and schema checkpoint —28October2026

All **91 actual disposable PostgreSQL cases passed in256.502s**, including85 inherited and6 new family groups. The first combined run failed an inherited global-empty-table assertion because the new workload fixture ran first. Moved the new cases after the inherited suite; retained the original assertion and all business checks. [First failed run](evidence/i4b-local-2026-10-28/inherited-first-run-order-failure.txt), [final passing run](evidence/i4b-local-2026-10-28/sql-tests.txt). Historical evidence files regenerated by inherited tests were copied under I4b and their original tracked contents restored.

Actual React production/development passed after final behavior/layout changes;57 units,14 foundation E2E, API budget/body/origin/response-cap checks, lint/typecheck/build passed. Local warm SQL scale receipt remains distinct from HTTP/device/cost budgets. React review preserves shared components, scoped request fencing, sign-in timeout, language-switch context and no cross-child cache/fan-out.

Staging migration **20261028122658_i4b_guardian_training** applied successfully. It is byte-identical to the rehearsed preliminary20261028120747 file; local filename/test reference reconciled to actual provider history, with no fabricated history row or edited applied SQL. Counts/fingerprints match pre-apply exactly:61dates/43plans/2heads/1mark/2history/4memberships; link/member/mark fingerprints unchanged. Zero training opt-ins, new table RLS enabled, authenticated table SELECT and anon INSERT denied. [Hosted schema receipt](evidence/i4b-local-2026-10-28/hosted-migration.json).

Security advisors:44 private RLS/no-policy information entries,3 pre-existing signed-delivery anon-definer warnings and64 authenticated-definer warnings (61pre-existing+3new allowlisted signed/current-authority reads). These are intentionally narrow RPC architecture observations, not zero findings or independent review. No broad client table policy was added to suppress warnings. App rollout and signed-in family projection/working acceptance remain pending at this checkpoint. Encrypted recovery artifacts retained temporarily; recovered plaintext removed.
