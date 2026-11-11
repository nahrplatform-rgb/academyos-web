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

## App release checkpoint —28October2026

Implementation source **ac7ed0a643842d8a768e779e5a514d7275735288** committed/pushed. Exact-source GitHub push40688075587 and PR40688081089 both completed successfully. Vercel preview **dpl_3Wxf4qRm7fYVGBGi3znNYdqcUgBP**,46s Ready. MCP403 and explicitly scoped CLI scope-not-found prevented those accounts inspecting this project; the existing Nahr Chrome session provides the correct AcademyOS team/project.

Promotion dialog verified the exact source and existing aliases `staging.academy.nahr.dev` / `academyos-web.vercel.app`. Vercel calls this slot Production; it remains the established synthetic staging environment. Promotion requested Vercel reauthentication; the existing nahrplatform-rgb Apple Passwords passkey is selected and awaits the Owner's Touch ID. **App promotion is not verified complete.** Prior serving attendance source remains the last confirmed app release until Ready/source/aliases are observed. No protection, email, environment setting, account grant or Guardian link was changed.

The separately scoped temporary Guardian-link restoration/new-view/ending authorization is requested and pending. Its exact compare-and-lock restoration/closing fallback are prepared, not executed. Hosted own-attendance walkthrough, working acceptance and independent/device/load gates remain open. Resume after Touch ID by observing the existing Chrome promotion; do not start another deployment or confuse later docs-only previews with the checked implementation source.


## Authorized hosted journey —28October2026

Owner completed the passkey check; staging serving **ac7ed0a** at **dpl_9zz8dnGPBNaaym8CHvVnXb9MAXFG** Ready62s. The separately authorized temporary iCloud Guardian test ran: minimal own corrected attendance EN/AR, functional calendar/Back/empty day, wrong-role/other-academy route denials, real Owner ending and next-request private-view clearing. [Full test and exact limits](i4b-hosted-guardian-test.md). Link is ended/version5 and its opt-in false; all memberships/marks/history/other links unchanged. No actual grant remains open.

Hosted walkthrough found stale permission-scope wording in the inherited link profile/ending confirmation. Routine EN/AR copy follow-up explains the separate training-view approval and ending impact across any approved access. No SQL/permission/API/state changes. Actual Guardian React production/development tests and revised ending-impact assertion pass; lint/typecheck/build run for this follow-up. Working-feature acceptance, raw hosted API/extended interleavings, physical devices/accessibility, cold/stable-network HTTP and cost/load plus independent human security remain open.


## Final wording deployment —28October2026

Source **4d514c4b4b211f6dbd43d298d9aebb18f1d9d18a**, exact push40692594972/PR40692601916 both successful. Preview **dpl_4Yp2UK6K9TnRqoJwsnpzTEFyyhGM** Ready28s. Promoted through the existing authenticated Chrome session, with no further account check needed; final **dpl_DgZEoKU7ZHe38SzGErJ3HosW3BjZ** Ready56s serves the established staging alias. Source/team/project/aliases observed before and after promotion; no environment or protection setting changed. [Final release receipt](evidence/i4b-hosted-2026-10-28/release-receipt.json).

Reloaded the actual Owner appointment screen, opened the already-ended link and verified revised EN/AR profile wording that training/current-own-attendance requires separate approval. [EN](evidence/i4b-hosted-2026-10-28/deployed-scope-en.png), [AR](evidence/i4b-hosted-2026-10-28/deployed-scope-ar.png). The ending-impact confirmation is covered by actual local Owner React tests; it was not rerun against hosted access after ending, and no second restoration occurred. Current DB confirms zero enabled training links and the test link ended. Scope/permission/canonical attendance behavior is unchanged from the separately recorded hosted ac7ed0a test.

Working-feature feedback is requested and pending. Independent human security, direct signed hosted API/extended races, physical devices/accessibility, stable-network/cold performance/load/cost and earlier I4a active-Trainer replacement case remain open. No claim of full family-stage or security completion.


## Owner working-feature acceptance —28October2026

Moamen explicitly stated: “Accept the working Guardian training journey.” This records acceptance of the scoped deployed EN/AR wording/usability: select the actively linked player → published dated sessions and own current attendance → Owner ends the link → next request removes the view. Policy/design approvals, implementation, local checks and hosted evidence retain their separate receipts.

This does not authorize restoring the ended test link or enabling any new training-view opt-in. Independent human security, direct signed hosted API/extended races, physical-device/accessibility, controlled-network/cold performance/load/cost and the earlier I4a active-Trainer replacement case remain open. No full family-stage or security acceptance is inferred.
