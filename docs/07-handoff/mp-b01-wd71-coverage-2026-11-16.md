# WD-71 coverage audit and remaining connected review

16 November 2026 · EX-07 / MP-B01 remains primary/current · WB-09/10/11/12/20/24 · VAL-01/03/05/09. This checkpoint continues the [finite closure sequence](mp-b01-feedback-lifecycle-2026-11-16.md#continuation). It does not close whole-app WD-71 or MP-B01.

## Demonstrated repairs and current proof

- Canonical online Attendance distinguishes **Save confirmed. Loading the current register…** from an actual failed result read. The real component matrix executes register and Owner direct correction, EN1440/AR390, held write/read, success/read503/lost reply/current403, in both React modes: 32 cases. The before-source control detects 16 premature failure messages. Exact reviewed versions/targets/reason, opaque original across reload, same-original reconciliation, read-only retry, one fictional effect, denial masking and complete request sequences are asserted.
- Onboarding and initial setup distinguish a known operation from waiting for confirmation while the follow-up read runs or fails. The 128-case matrix covers create/revoke/reissue/retry/accept/branch/sport/complete in EN1440/AR390 and both modes. The before-source 64 cases detect the ambiguity. Invitation generation/setup version, original locator, held requests, read-only retry and current denial are asserted; no command or rule changes.
- Trainer/Guardian delivery retry now selects the exact invitation before opening review, making its intended recipient visible. Expanded appoint/end/accept/revoke/retry matrices run 160 cases across both components/modes; each before-source retry control detects eight missing-recipient cases. Appointment, recipient, generation/version and reason assertions remain fictional HTTP/component evidence; no email, invitation or account change is performed.
- Private program-planning now exercises create, roster edit, bounded prepare, activate and cancel: 100 cases across both modes. Confirmed private creation followed by a failed read previously left the creation form without saved-result recovery. The command now selects the acknowledged proposal and enters review before rereading. Two before-source EN/AR cases reproduce the missing recovery; both pass after repair. Exact versions, original IDs, held requests, read-only retry, reload/reconciliation and current denial are asserted.
- Publication/withdrawal now exercises private create plus activate/cancel: 120 cases across both modes. Successful create includes its existing bounded automatic preparation, with exactly two fictional effects (create and prepare); failure cases preserve the one existing private proposal. No publication product repair was required. Cancellation/private preparation is never represented as effective plan/visibility activation.

[Curated receipts, source fingerprints and incremental patches](evidence/mp-b01-wd71-coverage/checkpoint.json). Each JSON lists its actual assertions/requests and its evidence boundary. The five `*-repair.patch` files compare the pre-checkpoint dirty source with current source; they are reviewable incremental changes, not patches certified to apply to clean HEAD. Preserve earlier source work on the same files.

A verification integration error was caught during the audit: Attendance imported its new helper without invoking it. Earlier broad suite passes did not establish the new matrix. The runner now invokes it, writes the receipt and accepts the initial locale through its fixture URL. The actual new run also exposed incorrect harness assumptions about the removed pending confirm control, a custom select and the two Arabic Review controls; the helper now asserts the real disabled recovery control and scopes the actual form. These were test-harness corrections, not waived runtime cases. The fresh 16/16 before-source detections and final 16-case production/development receipts supersede the unsupported earlier matrix claim.

## Finite accepted-command matrix

“Covered” below means only the named local assertions, with original retained timestamps. It never means every state cross-product, full security, hosted rollout or Owner acceptance. [Retained product-input audit](evidence/mp-b01-wd71-coverage/retained-input-audit.json) checks listed component/migration hashes against current source. Review-tool drift alone does not invalidate or redate unchanged product behavior. The program-planning component is superseded by this checkpoint’s later private-create repair and five-command matrix. The correction component differs from its earlier Owner-review checkpoint; the later Trainer-submission checkpoint has the matching current product fingerprint.

| Accepted command / route family | Exact evidence and applicable assertion | State / remaining limitation |
| --- | --- | --- |
| Player registration / original reconciliation | [Empty prepared directory](mp-b01-empty-prepared-continuity-2026-11-08.md), [runtime focus repair](local-runtime-reliability-2026-11-15.md); refreshed signed People/PG transport verifies EN/AR duplicate review, one distinct save/original/audit, normal directory/count and saved-profile return | Covered named registration cases. Prior connected write retains its 15 November timestamp. No rich Player edit/archive/import claim. |
| Academy admission/invitation create/revoke/reissue/retry/accept; initial branch/sport/complete | Current onboarding production/development and baseline JSONs in this evidence folder | Covered 128 component cases; API adapters separate; no new hosted/email/DB onboarding roundtrip. |
| Trainer / Guardian appoint/end/accept/revoke/retry | Current trainers/guardians production/development and retry-baseline JSONs | Covered 160 component cases, including exact retry recipient. Delivery-provider and SQL semantics retain their own evidence. |
| Draft program create/prepare/finalize | [Program creation](mp-b01-program-create-followup-2026-11-16.md), unchanged product fingerprint; real-component 16 held cases and existing bounded four-window creation checks | Covered declared lifecycle. Preparation is progress, not final save. |
| Dated plan save / reconcile | [Dated planning](mp-b01-planning-save-followup-2026-11-16.md), unchanged product fingerprint | Covered 12 declared held/read-failure/original cases. |
| Program-wide activation / cancellation | Current program-planning production/development JSONs, retained [activation repair](mp-b01-program-save-followup-2026-11-16.md) | Covered within the 100-case five-command matrix. |
| Program-wide private create / roster edit / bounded prepare | Current program-planning production/development and private-create baseline JSONs; base pause/stale/blocked checks retained | Covered within 100 cases: held acknowledgement/read, read failure, lost original/reload/reconciliation, denied read and context failure. Create-failure recovery repaired with two before-source detections. |
| Publication / withdrawal activation and private cancel | Current publication production/development JSONs; retained [visibility repair](mp-b01-publication-save-followup-2026-11-16.md) | Covered within the 120-case create/activate/cancel matrix, preserving unchanged dates and publication audience semantics. |
| Publication private create / bounded prepare | Current publication production/development JSONs; base 25/15 checks, pause, lost prepare and blocked/stale retained | Covered within 120 cases, including publish/withdraw create success/read failure/lost original/current denial/context failure. Automatic preparation success waits for its second effect and current version. No new activation or audience rule. |
| Session move / cancel / reconcile | [Session-change checkpoint](mp-b01-session-change-followup-2026-11-16.md), unchanged product fingerprint | Covered 32 declared component cases; SQL authority/atomicity is separately recorded. |
| Canonical online Attendance register / Owner direct mark | Current attendance production/development/baseline JSONs | Covered 32 component cases; not protected local-save transaction proof. |
| Protected local Attendance save / dispatch / reconcile | Refreshed normal Attendance28, additive4, startup8 and transport73 actual signed-route/SDK/disposable-PG/Next/IndexedDB checks | Covered named local atomic save/cold reload/original/reconnect/denial/account cases, including 18-player synthetic fixtures. Real provider/browser/installed context remains separate. |
| Correction submit / approve / reject | [Owner review](mp-b01-review-save-followup-2026-11-16.md), superseding [Trainer submission](mp-b01-trainer-submission-2026-11-16.md), current actual-component captures | Covered named Owner and Trainer cases; earlier correction fingerprint superseded, not silently treated as unchanged. |
| Feedback draft / submit / publish / return | [Trainer submission](mp-b01-trainer-submission-2026-11-16.md) and retained Owner review matrices | Covered declared states. |
| Feedback amend / withdraw | [Lifecycle checkpoint](mp-b01-feedback-lifecycle-2026-11-16.md), unchanged product fingerprint | Covered 40 cases starting from published state. Successor-draft/submitted withdrawal and withdrawn-state amendment are not newly exercised. |
| QR card issue / replace / revoke / capture; academy/session recording windows | [QR checkpoint](mp-b01-qr-followup-2026-11-16.md), unchanged product fingerprint | Covered 96 component cases; physical camera/provider/device combinations remain separate. |
| Guardian training, Home, Calendar, own staff reads | Existing real-component/read/current-denial suites and connected subset below | Read-only families; no invented consequential command. |
| Rich Player fields/edit/archive/import; finance and future modules | [MP-Q01 decisions](mp-b01-player-decisions-2026-11-14.md), canonical batch/domain contracts | Explicitly gated/unbuilt. Not missing tests for implemented commands; no silent scope retirement. |

## Consolidated verification and evidence layers

The current managed production build is `k6SQlx9qZmqX6unm2i8Di`, instance `92ca3f5c-a154-4a85-a242-7053bfafcae6`, at localhost:3100. Node24.14.0/npm11.19.1. This build includes the additional private-proposal repair; subsequent edits were harness/evidence only. Protected archives were recovered into server memory by the existing launcher; no replacement root or private configuration was emitted.

119 units, typecheck and lint pass. Changed-domain actual API checks pass: onboarding15 entry cases; Attendance15, Trainer30, Guardian30 budget refusals plus applicable invalid-body/origin checks. Every read-only `--check` command actually declared in the current Foundation workflow passes (14), including compiled assets and owning receipts. Stale signed fixtures were refreshed through their actual runners, not hand-edited: Owner-next, startup8, normal28, additive4, transport73. Their assertions and artifacts retain their own environment boundaries. The refreshed full 16-family actual-component collection and eight entry variants produce 1807 frames/2611 transitions, zero capture gaps; factual review build/tool/freshness pass. These counts are not an acceptance percentage.

Earlier pre-repair verification remains historical. The latest Program/publication API checks pass 21/27 budget refusals, three invalid bodies each and cross-origin refusal. The latest 119 units/typecheck/lint pass. One compiled-source transfer receipt was stale after the new build; its owning 73-check runtime rerun and freshness check passed. Other declared read-only checks passed unchanged; no receipt hashes were hand-edited.

The first capture run failed onboarding because a concurrent standalone test held fixed port3194; its serial recapture passed. Attendance capture attempts made before the harness correction failed and are superseded by the final executed helper/capture. Logs remain in ignored `test-results/wd71-closure/`; curated receipts hold only synthetic data. The Arabic phone appointment failed-read capture was visually inspected: status/retry are legible and private content remains masked. No new geometry/type/palette redesign or whole-app visual-parity claim.

## Connected browser subset and remaining acceptance

Own browse sessions use exact localhost and the existing Clerk SDK origins, leaving other sessions/tabs untouched. The initial five-player/closed two-player subset remains historical in the sanitized receipt. A visible Nahr session subsequently verified the intended Academy Owner primary email through normal Account → Manage account. The dialog was closed without changing the account. Current server Academy Owner authority and the selected identity are now both verified; earlier support-panel uncertainty is superseded.

Under SDR-06, normal registration added 13 fictional players without contact/invitation data, making the directory 18. The first private program (`e85b2f9f-9ad5-477e-92df-c7dcf3943ef9`, 19:00–20:00 Cairo) correctly refused publication and a later move because its occurrence had started. It is preserved with no attendance changes. A second future program (`5d2e763b-eae2-4138-8751-41b161b8fa95`, 20:00–20:30 Cairo) was created/prepared/finalized, planned for all 18 with the existing eligible synthetic Trainer and published successfully through normal review: “All reviewed visibility changes committed together.” Its event is `f62395d1-11b0-4df3-b063-1ea6968c08a4`.

Today and Calendar show the new session; Calendar → dated plan → Attendance displays 18. EN/AR Player profile returns preserve the initiating row focus using the actual keyboard action. Arabic Attendance → Back to calendar also retains the selected session/week. Personal-device preparation reports “Ready for offline reopening”; before 20:00, all 18 are Unmarked and marking correctly remains disabled. At the real 20:00 boundary marking enabled automatically. The normal offline review/save recorded one Present and one Absent, with 16 Unmarked. Database read-back while disconnected remained zero. After cold recovery and reconnect, one dispatch returned200 automatically, with no manual retry/replacement save; the server confirmed two marks, two history rows, one operation (`eb7b4293-da87-44bc-a838-77785b9e15e9`) and one audit. A second read-back retained that same single original. Arabic counts and actual keyboard return to Today, then normal Attendance reentry, preserved the result. These are local-production/shared synthetic-service observations, not deployed-domain or installed-device acceptance. No role, account, Trainer appointment, provider or key configuration was changed. The earlier background Programs read returned429 then200 with UI ambiguity; this visible session loaded and completed the normal workflow, while that background cause remains unisolated. [Sanitized connected receipt](evidence/mp-b01-wd71-coverage/connected.json).

The first tab-offline reload and first blank-document reopen stalled at provider sign-in. After confirming the local listener had stopped, disabling only this tab’s HTTP cache allowed the pending 18-row register to cold reopen. A later Arabic cold reopen with the listener stopped and normal cache restored also passed. This demonstrates protected persistence/recovery, but does not close the initially failed ordinary reload; its cause remains unisolated. The first launcher stop helper timed out although later inspection found no listener/leases; the next stop succeeded. The same checked build is running again, latest instance `6a03165c-7fdf-4de8-b68a-663acffd8df6`. Network/cache settings were restored, CDP detached, and only the task’s own browse session deleted. No browser restart/installed or live byte-equivalence claim is made.

## Reviewable work and continuation

The five incremental repair patches and [candidate manifest](evidence/mp-b01-wd71-coverage/candidate.json) make this checkpoint reviewable without bulk-staging the large inherited tree. HEAD remains `780225b51360a63153f6fc09d47431cd5b654047`, branch `codex/onboarding-decision-design-packet`; the index and prior edits are preserved. This is a scoped working candidate, not a clean-base release commit or passed CI/preview. One coordinator, zero helpers; exact model/usage unavailable. No commit/push/promotion; Owner-only release controls remain. Independent human review remains deferred, not passed.

A [focused startup diagnostic](evidence/mp-b01-wd71-coverage/startup-diagnostic.json) now reproduces a test-boundary difference with the actual worker and a deliberately cacheable fictional document. Tab-only CDP Offline can return the old provider document from HTTP cache even with the listener unavailable. Cache-disabled or whole-context offline entry returns the public shell. An in-memory no-store experiment avoids that HTTP-cache reuse when the server is unavailable, but tab-only offline still allows worker networking when the server is reachable. No product patch was made: this is not yet proof of a current Next header defect. After task-session cleanup, a new named browse session failed because the relay could not start; status confirmed it unreachable at localhost:19988. No protected browser/provider configuration was changed.

## Browser recovery and completed startup comparison

The [startup recovery receipt](evidence/mp-b01-wd71-coverage/startup-recovery.json) supersedes the browser blocker. Starting the existing foreground relay restored all paired browser connections. The loaded MCP server reported a version mismatch, but the installed current browse CLI operated successfully. Its current API uses a named task group plus explicit tab ID and origin allowlist; the removed session API was not fabricated. No provider/profile/MCP configuration was edited.

The intended Academy Owner email was reverified through normal Manage account. The actual authenticated Attendance document returned200 with `private, no-cache, no-store, max-age=0, must-revalidate`. With the exact local server stopped, normal browser caching enabled and no network emulation, both ordinary English reload and Arabic cold entry through a blank document reached the actual public workspace shell: 18 roster rows, one Present, one Absent, sixteen Unmarked. The same checked build was restored (instance `37c94adc-0dda-4afc-8760-d9c0f7880bfb`); the ordinary Arabic online read retained that result. No new save/setup or product patch was needed. This closes the local origin-unavailable startup comparison, not whole-device airplane-mode, installed launch or all-role acceptance. The earlier tab-CDP mixed run remains diagnostic/emulation evidence, not an established application defect.

Next permitted work is the coherent source/dependency candidate review and exact CI/preview preparation. Preserve the successful identity, setup/publication, save/sync, startup and EN/AR evidence; do not repeat those cases without changed inputs or a named concern. The ignored inventory records 414 changed/untracked paths for review; it is not a staged candidate or proof every path was reviewed. Rich Player MP-Q01, wider role/installed/Owner acceptance and Owner-only promotion remain separate. MP-B01 remains current and incomplete.

## Coherent candidate publication review

[Publication review](evidence/mp-b01-wd71-coverage/publication-review.json) records the connected source/tooling/evidence selection, all14 current workflow freshness checks,23 local tooling/build tests and six private archive tests, all passed. Targeted review retained original-operation, denial/account fences, legacy register compatibility and local process/key custody. The official checksum-verified Gitleaks8.30.1 selected-tree scan reported24 matches:22 SHA-256 metadata values and two prose/status matches, no confirmed credential. This bounded scan does not certify image pixels/compressed packs or independent security. Ignored settings, builds, keys and raw connected traces remain outside the selected publication tree. The orientation drafts now omit an inferred library and an unsupported local archive inventory.

The complete dependency set will be committed explicitly on the existing branch, preserving the historical ahead commit780225b. Exact candidate CI and automatic Preview are the next evidence layers; this review itself grants no promotion and closes no installed/whole-app acceptance. Source/evidence fingerprints are retained in the reviewed path manifest; the manifest omits its own hash and generated tracking files to avoid self-reference.

## Published candidate

The explicit418-file candidate is committed and pushed as **13219597762c2f6e9c536e6f7f7633c88586ad4a**, with the historical780225b handoff commit retained. [Foundation43949715959](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/43949715959), attempt1, is running under the single exact-candidate waiter. The matching automatic Preview is `dpl_DgRrCEmAkVmjhETzogsfvABPuj1s` in project `prj_QDy8WrfhTAAp2lyu2wtKowd2nVyx`, target null; initial exact-source read was BUILDING. [Release receipt](evidence/mp-b01-wd71-coverage/release.json). No promotion or live alias change was performed.

The initial full staged whitespace check surfaced preserved unified-patch blank context and retained Next progress-log whitespace. A product/tooling/document check excluding exact `.patch`/`.log` evidence passed; those evidence bytes remain unchanged. These are artifact whitespace findings, not a passing full-diff claim.

## First CI result and bounded repair

Exact1321959 [Foundation attempt1](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/43949715959) failed at **Verify backup safety with pinned runtime dependencies** after13 successful steps. The unchanged backup rehearsal test asserted five matching migrations; the reviewed additive scope migration makes six. The one-line test correction retains the explicit ordered list and all operator-SQL/missing/duplicate/reverse-order refusal assertions. All14 backup tests pass in an isolated environment using existing hash-pinned dependencies. The first default-Python attempt lacked botocore and is not a pass. No backup operator/runtime behavior changed.

The first candidate’s exact automatic Preview is independently READY in the expected project, target null. Canonical staging remains `aedb3adcf58b083f3463b4b2b652f720dff6604a` / `dpl_CMpqkpPt232K3opknzzmsL3L4e8t`, READY; no agent promotion. Publish the bounded test correction and retained release evidence as a successor candidate, then execute full CI again. The failed first run remains historical evidence.

## Checked successor and Owner release checkpoint

**bdd9740872af61b6ee32dc05008d1b215203ff32** is committed/pushed. Exact [Foundation43950874524](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/43950874524), attempt1, completed successfully: 55 successful steps of 55 reported steps. The full remote run exercised its named source, unit, build, structural, disposable database/storage, original recovery and actual-component/router assertions; it is not complete security or installed-device acceptance. The historical1321959 failure remains recorded.

The automatic [checked Preview](https://vercel.com/academy-os2/academyos-web/2E7zKpnH9MParNtHpkUm1aeg4wpW) is independently READY in `prj_QDy8WrfhTAAp2lyu2wtKowd2nVyx`, exactbdd9740, target null, URL `https://academyos-mljyihw6u-academy-os2.vercel.app`. The Owner may promote this checked source to existing `staging.academy.nahr.dev`; the agent did not promote, create a production-target deployment or change its alias. Staging's last independent read remains aedb3ad. After Owner-reported promotion, first verify resulting source, then targeted signed-in EN/AR journeys and original-save recovery. Do not repeat unchanged local acceptance as a substitute.

The single EX-07 priority remains current. MP-Q01 richer Player policy choices and wider role/installed/Owner acceptance remain open. This is a checked release candidate for the delivered connected checkpoint, not completion of MP-B01 or whole-app offline. Final result/tracker bookkeeping is a separate local commit; checked product candidate remainsbdd9740. One coordinator, zero helpers; no provider/profile/model/MCP change.

## Owner promotion and targeted hosted verification

The Owner reported promotion. Independent deployment inspection confirms canonical `staging.academy.nahr.dev` is READY on exact **bdd9740872af61b6ee32dc05008d1b215203ff32**, deployment `dpl_AVGbpJ3uriGhGXWF1yVXgeCAsbNn`, expected AcademyOS project. The agent performed no promotion or alias operation. This supersedes the pending-promotion routing above. [Sanitized hosted assertions](evidence/mp-b01-wd71-coverage/hosted-promotion.json) and [updated release record](evidence/mp-b01-wd71-coverage/release.json).

The selected signed-in Academy Owner was verified through normal Manage account. Actual normal Attendance retained 18 players, one Present, one Absent and sixteen Unmarked. English Today → register → Today keyboard return restored the original session link focus. Calendar → actual dated planning → Attendance → Arabic Calendar retained the selected published session and week, with details-heading focus. Both Arabic and English saved Player profiles loaded, and keyboard Back restored the original Player06 row focus with all18 directory entries. The dock English switch rendered English on the existing /ar Player route; this is locale behavior evidence, not separate English direct-entry proof. No save, preparation, account/role or provider change occurred. Only the task-owned browser tab was closed.

Hosted readback of the original result does not establish a fresh staging dispatch or pending-original reconciliation. Local production/shared-service save/sync and cache-enabled startup evidence retains its original timestamp and boundary. Staging cold offline, provider expiry, installed/phone/wider-role checks, full Operations parity and Owner acceptance remain separate. Rich Player MP-Q01 A/B/C are still proposals. One coordinator, zero helpers.

Next permitted work: reconcile remaining MP-B01 working-day/Operations cases with current exact-source receipts, then select an independent implemented-journey gap. Do not repeat unchanged passing cases or infer new Player policy decisions. The current release needs no further promotion; final evidence bookkeeping is separate from checked application source. MP-B01 remains incomplete.

## 17 November role workflow and actual Mac installation

Active continuation: broaden role and installed-device evidence while keeping Owner acceptance separate. EX-07/MP-B01 remains primary/current; EX-14/16 support PW-01/02/07. IMP-J13-A01 uses accepted exact saved-mark/version, different-account Owner review and original/history rules. [Compact role/device receipt](evidence/mp-b01-wd71-coverage/role-installed-2026-11-17.json). Fresh metadata inspection still resolves staging to exactbdd9740 and the same READY deployment; no agent promotion.

The existing Dokkanni Outlook Trainer was verified through Manage account and the current Trainer chooser. Keyboard Home→actual normal register opened18 players with1Present/1Absent/16Unmarked. Arabic saved-player detail→Back restored the exact Details-button focus and clean18-row register. Valid read-only API actions for Platform administration and same-academy Owner directory each returned403 denied with no data. No role/access restoration was needed.

Under standing SDR-06 authority, the normal Arabic Trainer flow submitted one fictional Present→Absent correction for Player06, request `e0b23f7c-8c95-4ca9-91dc-0a9f684a2917`. Confirmed Pending retained Present/version1. The separate verified Nahr Academy Owner opened the exact actionable Today link by keyboard and rejected it with a synthetic-test reason through review/acknowledgement/keyboard confirmation. The real saved result and two request-history entries show Requested then Rejected, while Present/version1 remains. Back to Today shows zero pending corrections and focuses Needs your attention. Trainer reload→All retained→exact Rejected row by keyboard reopens the decision/reason in Arabic. Final Owner normal-register readback remains1/1/16 across18. This is actual hosted cross-account behavior, not new raw DB audit-count, concurrency or lost-reply proof. Only the request and rejection were written; attendance, memberships and protected local originals were preserved.

On macOS27.3/build26C5035r, Chrome157 (reported UA major) offered the actual AcademyOS Staging installation dialog. Next→Install completed successfully, and Open tab in app launched the observed native bundle `com.google.Chrome.app.akhpfabkglmchhjephhjdbpdinigcjml`. The manifest was served200 with stable `/en` id/start, root scope, standalone and staging identity. The real app reports display-mode standalone. Sign in from the public landing reused the existing provider session, opened the normal A/B Owner chooser and then actual Academy A Today. Manage account reverified the intended iCloud identity inside that app. Command-Q removed the app's task tab; launching the exact OS app reopened `/en`, and Sign in again restored the Owner chooser. The app remains installed. No credentials were copied or provider/profile configuration edited.

**Explicit remaining cases:** this Mac proves installation, online app opening and reusable-session return only. Repeat launch does not restore the previous academy/task/locale: it shows the public landing and needs the Sign in action. Clean-store sign-in, expired session, installed offline/preparation/sync/update/storage/QR, other OS/device targets and full accessibility remain open. The Hieu Platform sign-in handoff returned closed; no Platform/Guardian result is inferred. Owner acceptance has been requested for the concrete demonstrated workflow and remains pending until an actual response. The earlier PWA deployment inventory was stale; metadata/storage source is now included in promotedbdd9740, but that does not prove all lifecycle behaviors.

Next discriminating work: complete Platform verification after user sign-in; alongside it inspect the accepted PW-02/WD-73–76 launch-to-covered-route requirements against the real `/en` page and worker before changing startup. Preserve current worker ownership, account/authority fences and protected originals. Do not claim a new offline launch pass from standalone display or session reuse. One coordinator, zero helpers; product source unchanged in this checkpoint.

Source review of the launch gap: `apps/web/src/app/[locale]/page.tsx` always renders the public Sign in/preview surface. `prepared-workspace-worker.js` only recognizes validated EN/AR academy Players, Calendar and Attendance task paths; `/en` is outside its navigation fallback. Therefore the installed manifest start URL is not presently an implemented offline launch-to-covered-route chain. This is source/observed online evidence, not an executed installed-offline failure. Implementing that chain requires the existing safe identity/coverage/locale and empty-store cases, with no private HTML/API caching. Documentation/factual-review validators pass; existing product suites and captures are retained unchanged.

## 17 November explicit scoped Owner acceptance

The Owner answered **“Accept this scoped workflow checkpoint”** for staged Owner register entry/return, EN/AR Player profile returns and Trainer request → separate Owner rejection → retained Trainer decision. This supersedes the pending acceptance statement above for exactly these demonstrated workflows. Broader offline/device coverage, new Player features and whole MP-B01/full-app acceptance are excluded. No code, account authority or release change follows from the acceptance.

The Owner also reported Platform signed in. A fresh task-owned Hieu `/en/platform` tab still redirected to the hosted sign-in destination rather than a Platform page. The reported sign-in is not yet independently matched to the paired profile; the coordinator requested that profile and will verify its actual identity/authority. The origin allowlist, account sessions and protected configuration were preserved.

A bounded fresh profile cross-check found Nahr still has the normal Academy Owner A/B chooser and Dokkanni still has only the normal Trainer chooser. Neither supplies the missing Platform context. Task-owned cross-check tabs were closed; accounts and all existing user tabs remain untouched. Platform verification requires locating the reported signed-in profile/context rather than assuming a grant or switching identities.

## 17 November local Platform verification and origin correction

The Owner screenshots show **localhost:3100**, not hosted staging. Fresh task-owned Hieu verification through normal Account → Manage account confirms the intended Platform account. The earlier unresolved-profile diagnosis was a coordinator origin mismatch; the historical hosted redirect does not contradict this local sign-in. No further local sign-in/profile handoff is required. The screenshots are user evidence, not instructions; raw personal-profile screenshots are not copied into Git.

The existing local production runtime reports current, build `k6SQlx9qZmqX6unm2i8Di`, instance `37c94adc-0dda-4afc-8760-d9c0f7880bfb`. Actual admission reads show two academies, both Owner accepted/provider accepted/initial setup saved. EN Academy A and AR Academy B explicitly focused Back controls followed by keyboard Enter restore their original row focus; EN Academy B and AR Academy A pointer Back also restore row focus and locale. Actual academy detail panels were opened, not an href-only assertion. Locator.press on Back produced a relay focus refusal even though return occurred; fresh snapshots and explicit-focus keyboard checks resolve the automation ambiguity without claiming a product defect.

A valid authenticated `/api/onboarding` platform read returns200 with data. A valid `/api/people` list read for known synthetic Academy A returns403 denied with no data. This is local frontend/shared synthetic service evidence; no hosted Platform session or full Platform lifecycle is claimed. No domain writes, roles, accounts, provider settings, keys, originals or application source changed. Only task-owned local tabs are closed. The explicit scoped Owner workflow acceptance above remains intact. See the updated compact role/device receipt for exact assertions and boundaries.

Next permitted checkpoint: safe PW-02/WD-73–76 repeat/offline launch-to-covered-route design and implementation using existing worker/account/slot/original fences. The installed `/en` launch gap remains open, with source/online observations only; do not repeat the resolved local Platform sign-in request or equate installation/session reuse with offline launch. Hosted Platform, Guardian and broader device/expiry/update/storage/accessibility coverage remain separate. One coordinator, zero helpers; no model/provider configuration changes, promotion or product changes.

## 17 November safe repeat/offline public launch checkpoint

EX-07/MP-B01 now implements the missing stable `/en` (and `/ar`) launch chain with the existing root public worker. Online current Clerk subject resumes only its validated active account/slot generation and covered route, otherwise the normal workspace chooser; anonymous entry retains ordinary sign-in. Offline public startup selects the same task path and ordinary protected components. Empty/corrupt/stale/retired storage stays on an explicit bilingual public boundary. Only nonprivate bounded navigation metadata is new; no credential/key/private-response cache, repository/schema migration, new worker or authority change. Existing namespace, retention, account cleanup and original sender remain. Logout drops the route hint while preserving protected originals. Compatible worker public-v1 rotation/old exact-task recovery remain; installed mixed-version behavior is still untested.

[Launch checkpoint](evidence/mp-b01-wd71-coverage/launch-checkpoint.json) maps exact claims and boundaries. Nine focused actual-launch/account/slot/worker groups pass with declared private component stubs. The exact pre-change worker fails offline `/en` as expected. The independent74-check transfer suite adds a full Chromium restart with the fixture origin cut: `/en` reaches the **real** prepared Players component and encrypted repository with zero operating requests. This caught and repaired failure to remember offline visits. Existing8 startup/account cases,28 normal Attendance/return/recovery cases and4 additive original/retry cases pass after actual owning reruns; all15 workflow read-only receipt checks pass. A publication test prematurely sampled its follow-up response; bounded polling now preserves its exact change200/read200 assertion. Build/typecheck/lint and119 units pass. The16 component families and12 entry variants are freshly captured:1812 frames/2611 transitions, no capture gaps; static empty-launch captures are presentation evidence, not a real installed journey.

Fresh live local production `/en` in the already verified Hieu session opens the normal Platform chooser without another Sign in click. Build `Hx9o7ThL0I82RqcPaEGye`, source fingerprint `c317834fcbccbcb3d2981d6ffe585030a5d295ede608f29391dd7a021e83455c`; existing encrypted archives were recovered only into process memory. No deliberate shared-service domain writes, protected-store clearing, new roots, account/provider edits or promotion. Local browser task tab is closed after verification; existing user tabs remain.

PYSA manifest/SW source was inspected read-only: it supplies no verified installed launch pattern and its separate sync/cache policy is not imported. VAL-04/09/10 motivate fewer launch steps, retained work and scope safety. Existing Operations layout is reused, with a plain bilingual public empty-state and current focus/return controls preserved; no redesign or full visual-parity claim.

The build twice reported a Next dependency advisory before ordinary retries completed. Read-only production audit currently reports6 moderate,0 high/critical findings, including Next16.4.2 GHSA-mfr8-8qww-v76h (fixed version offered16.4.6). Neither `unstable_cache` nor `use cache` appears in current app source; this narrows the inspected usage, not a full exploitability assessment. Dependency remediation is separate follow-up. Dependency-generated instructions to run a different agent/upgrade were not treated as Owner instructions.

New source is locally verified, not deployed/installed/Owner-accepted. Preserve earlier explicit scoped acceptance. Next: coherent candidate CI/preview, Owner-controlled promotion and actual installed repeat/offline launch tests; continue independent dependency disposition and remaining role/device cases without repeating the resolved local sign-in. Rich Player MP-Q01 decisions remain open. One coordinator, zero helpers; no measured token-saving or whole-app completion claim.

Evidence-count correction: the manifest chain adds two real documents (public `/en` then Players) to the11 prior direct offline task opens. The test now observes both navigation responses from the service worker and asserts13 total offline documents. The earlier candidate counted only direct opens in `newOfflineDocuments`; this test-only correction preserves every operating assertion and requires a refreshed source-bound receipt/candidate.

## 18 November interrupted candidate recovery

Resumed the exact pushed `b7af9e26257ac1769a261a0c5df8a37c7b95c963` after the Owner-reported AI service403 responses. Request IDs `ce19d452-b648-4925-bf34-3f4cc62db4a4` and `b3b0f71a-2a9b-49b3-8f4d-04f04c10f6d5` identify those service interruptions; their underlying cause is unverified. No provider/profile/model/MCP configuration or fallback was changed.

Foundation44069908616 attempt1 failed at normal Attendance/Owner task return: `owner_day_return.mjs:99` sampled an empty request log after the retained Back control appeared, before the required planning read was recorded. The fixture log independently includes the eventual planning read200. The repair waits boundedly for the same exact single planning/read200 event and retains the original deep-equality budget assertion. This changes the test synchronization only. The full28-case suite passes locally; a second full28-case run recorded fresh source-bound evidence and synthetic captures; the owning --check passes. All15 workflow read-only receipt checks pass, including factual-review and compiled-build freshness. The earlier f37dc0a run44068480768 was cancelled by supersession, with no failed assertion. b7af9e2 preview `dpl_5HEDLyRFsBCkRXPzpuNAfmgBd9RR` is READY in the expected project, target null, exact SHA; it is not release-ready with failed Foundation. Existing staged bdd9740 and scoped Owner acceptance remain separate.

Repaired candidate `525dfc60fa310a1ab3cdcaa7f326ec4bf91c419c` is pushed. Foundation44270356265 attempt1 is the single watched run. Preview [academyos-bey0g5ec7-academy-os2.vercel.app](https://academyos-bey0g5ec7-academy-os2.vercel.app), deployment `dpl_HdeAaC3rSnMusdHrDkKSPktdwFAB`, is independently READY, exact SHA, expected project and target null. Staging remains `bdd9740` / `dpl_AVGbpJ3uriGhGXWF1yVXgeCAsbNn`; no release action performed. Selected fresh synthetic Calendar return capture visually retains the selected session, filter and detail panel. Remote outcome will be recorded before declaring this candidate release-ready.


## 18 November checked release handoff

Foundation44270356265 attempt1 passed55/55 for candidate `525dfc60fa310a1ab3cdcaa7f326ec4bf91c419c`. Its preview [academyos-bey0g5ec7-academy-os2.vercel.app](https://academyos-bey0g5ec7-academy-os2.vercel.app), deployment `dpl_HdeAaC3rSnMusdHrDkKSPktdwFAB`, is READY at exact SHA in the expected project with target null. Staging remains independently verified at `bdd9740` / `dpl_AVGbpJ3uriGhGXWF1yVXgeCAsbNn`. No promotion was performed. The checked candidate and exact staging destination are handed to the Owner for release. After promotion, run the actual installed `/en` launch, EN/AR, offline/uncovered, update and same-original reconnect cases; broader device/accessibility and dependency disposition remain separate.


## 18 November confirmed staging release and installed Calendar relaunch

Vercel resolves `staging.academy.nahr.dev` to READY deployment `dpl_CGBtg3irjxenx9xQXo6BNzbeXDbX` at exact **525dfc60fa310a1ab3cdcaa7f326ec4bf91c419c**. This confirms the Owner-reported promotion and supersedes the prior staging ID in the preliminary asset-only observation. The same-origin manifest starts at `/en`. The served worker matches the checked candidate by SHA-256. [Staging and launch receipt](evidence/mp-b01-wd71-coverage/launch-checkpoint.json).

The existing AcademyOS Staging app on macOS 27.3 with Chrome 157 used the verified iCloud Academy Owner session in Nahr. The normal **Use this personal device** action prepared synthetic Players and Calendar. The app reported persistent storage granted. After quitting and relaunching the installed bundle, it returned directly to English Players with 18 rows. A second OS relaunch opened `/en` and restored Arabic Calendar without sign-in, but reset the selected week from **25 November–1 December** to **18–24 November**. The stored Calendar path lacked a date. The app remains open on English Players.

A separate task-owned Chrome tab used staging with tab-level offline emulation. The prepared 18 November week showed five sessions. The uncovered 16 August 2027 date showed the preparation notice and zero rows without an empty-result claim. Returning to the prepared week restored all five sessions. The first chooser alert resolved on later successful reads. The scoped emulation was switched off before closing the tab.

The local repair records a Calendar date and locale only when the prepared reader returns the displayed period. Reopening a fresh `/en` tab on the checked local production build restored the Arabic 25 November route and its four sessions. A second fresh `/en` entry passed with the verified port 3100 listener stopped, using the cached public shell and making zero operating API requests. An uncovered date kept the prepared week available for the next launch. The same build returned online with the chosen week intact. All nine focused launch groups and 74 workspace transport checks passed. The EN/AR Calendar test checks the remembered date after a date change and on returning to the previous week, with zero operating reads or transfers. The affected 8 startup, 28 normal Attendance and 4 additive reconnect cases passed with the same original IDs and one committed result per event in the disposable signed fixtures. All 119 unit tests, lint, typecheck and the production build passed. Both local servers report current. The refreshed factual review passed its checks with 1,812 captured states and no capture gaps.

Remaining installed cases are the actual cold offline launch, empty and uncovered stores, an installed update while protected work is pending, and reconnecting the same original on an eligible synthetic register. The existing app works across the promotion and uses an active worker. No pending-work update path was exercised. Today showed zero registers needing marks. The Calendar repair is local source and has not been released. MP-B01 stays current. Keep the existing scoped Owner acceptance, MP-Q01 choices and Owner promotion rules.

The Next dependency advisory remains open. The checked package is 16.4.2 and the [upstream advisory](https://github.com/advisories/GHSA-mfr8-8qww-v76h) lists 16.4.5 as patched. The first local build paused at the warning. A retry of the existing build passed. Track a patched-version dependency review separately from this device checkpoint.

## 18 November Calendar repair candidate preflight

The repair's recorded source fingerprints match the working tree exactly: `experience-workspace.tsx` `e44b2bc`, `workspace-launch.ts` `cfcdf09`, `calendar_controls.mjs` `77939ec` and the launch fixture `bf04e1c`. The recorded local production verification therefore still describes current source; its timestamp and boundaries are unchanged.

The preflight ran every read-only `--check` command currently declared in `.github/workflows/verify.yml`, not only receipts found by filename. Fourteen passed unchanged. One was genuinely stale: `scripts/working-day/test_owner_next.mjs --check` rejected its retained `experience-workspace.tsx` hash because the Calendar repair modified that component. The owning suite was rerun under Node 24.14.0 against its disposable Next/Chromium/PG17 stack with `--record`; its eight checks passed and the receipt now matches current source. No assertion, tolerance, expected result or receipt hash was hand-edited, and all 15 commands now pass. This is receipt freshness only and adds no new product claim.

An inherited formatting defect was also corrected: the earlier release-handoff paragraph had been saved with literal `\n` escapes instead of paragraph breaks. The text is unchanged in substance.

## 18 November Calendar repair checked candidate

The repair is committed and pushed as **f35c9adf3eb9a71d64f5a3120d21a3d5b9364a75**. Foundation [44378881128](https://github.com/nahrplatform-rgb/academyos-web/actions/runs/44378881128) attempt 1 passed 55/55. The first bounded waiter call returned `unverified` after a 20-second GitHub read timeout without any partial verdict; the same run id was re-watched once and produced that result.

The commit's Vercel status names deployment `D4ZXh3EEFXTeK4zj2AQZyRyBQuCk`, but **the preview's project, target, READY state and hostname are unverified here**. The local Vercel CLI is signed in only to the personal Hobby scope `moamenghareebs-projects`; `academy-os2` is absent from `vercel teams ls` and inspection is refused under that context. No provider credential was added, replaced or changed, and a coarse commit status is not treated as preview proof. An earlier statement that the CLI was unauthenticated was wrong and is corrected here: the CLI is authenticated, just to the wrong scope.

Staging remains independently verified at `525dfc6` / `dpl_CGBtg3irjxenx9xQXo6BNzbeXDbX`. This candidate is not deployed or promoted. Owner-controlled promotion of `f35c9ad` is the next release action; afterwards the selected Arabic week must be reproduced on the installed app, followed by the remaining EX-16 cold-offline, empty/uncovered, protected-update and same-original reconnect cases.

The Next advisory was refreshed read-only: `GHSA-mfr8-8qww-v76h` / CVE-2026-119790 affects `>= 16.3.0, <= 16.4.4` and is patched in `16.4.5`; the pinned `16.4.2` is affected, and `16.4.5`/`16.4.6` are published. The advisory's precondition — a `'use cache'` function called through `unstable_cache()` while reading a root param — is absent from inspected application source and Next configuration. Dependencies were not exhaustively audited for such calls, so this narrows rather than eliminates the risk. The upgrade was deliberately not folded into this repair because it changes compiled output and needs its own build, regression, exact-candidate CI and preview.

## 18 November promotion of f35c9ad verified

The Owner reported promoting `f35c9ad` and supplied a team-scoped, read-only Vercel token, stored at `~/.config/academyos/vercel-read-token` with mode `600`. The value is never printed, copied into Git or reproduced here; only the path is recorded.

Read-only API reads then verified both layers exactly:

- **Preview** `dpl_D4ZXh3EEFXTeK4zj2AQZyRyBQuCk` is `READY`, `target: null`, SHA `f35c9adf3eb9a71d64f5a3120d21a3d5b9364a75`, project `academyos-web` (`prj_QDy8WrfhTAAp2lyu2wtKowd2nVyx`), URL `academyos-pgucmm8rc-academy-os2.vercel.app`. This supersedes the earlier unverified commit-status reading.
- **Promotion** `dpl_3yuuqW86QN5PnDXqzPK365GWq66v` is `READY`, `target: production`, SHA `f35c9ad…`, branch `codex/onboarding-decision-design-packet`, and its alias list includes `staging.academy.nahr.dev`. The agent performed no promotion or alias operation.

Public surface agrees: `/en` returns 200 with the unchanged `/en` manifest identity, the served page chunk `3dmlh_s5394h9.js` carries the new `rememberWorkspaceLaunch` calendar branch (`en`/`ar` guard, civil-day check, `calendar?anchor=` path) that the pre-repair bundle lacks, and `/prepared-workspace-worker.js` matches the repository SHA-256. Team tokens carry no user identity, so user-level CLI commands such as `teams ls` reject them; the read-only API v6/v13 calls with the team slug are the supported path used here.

## 18 November Calendar relaunch retest on promoted staging

The 401 recorded earlier was the relay's unauthenticated HTTP surface, not its state: `browse status --json` reports the relay connected with three paired browsers (`hieu` signed out, `nahr` and `dokkanni` signed in as Academy Owner). Driving the relay's CLI directly, in the Owner's real `nahr` Chrome profile, produced the first behavioural evidence for this repair on the promoted source `f35c9ad` / `dpl_3yuuqW86QN5PnDXqzPK365GWq66v`. Reads were limited to the non-private launch path in `academyos.workspace-launch.v1`, page snapshots and rendered counts; no credential, cookie, player or register data was copied.

| Case | Observed |
|---|---|
| Calendar opened with **no** anchor in the URL | showed `١٨–٢٤ نوفمبر ٢٠٢٦`; the key became `/ar/workspace/<academy>/calendar?anchor=2026-11-18` |
| `الفترة التالية` clicked | showed `٢٥ نوفمبر – ١ ديسمبر ٢٠٢٦`, `٤ تدريبات`; the key became `anchor=2026-11-25` |
| Fresh `/en` entry (A) | replaced to the Arabic `anchor=2026-11-25` week, `٤ تدريبات`, `dir=rtl` |
| Back to the prior period, then fresh `/en` (B) | key became `anchor=2026-11-18`; the new tab replaced to that same Arabic week, `٥ تدريبات` |

Case B is the control: the restored week tracked the remembered value rather than a fixed route. One protocol point mattered — with several calendar tabs open, each re-recorded its own displayed week into the single key and reads became ambiguous; the sequence above was deterministic only with one calendar tab.

**The installed app is still open, and now for a measured reason.** Parking the app on the non-remembered `/trainer` route and terminating it returned to `/trainer` on relaunch, and parking on `/en` returned to `/en/workspace`: relaunch there is Chrome session restore, not the launch memory. That profile is not one of the three paired browse profiles and holds no active register account, which `rememberWorkspaceLaunch` requires, so no launch key was written in it. No installed-app relaunch assertion is claimed.

An intermediate reading in this pass said December weeks did not move the anchor. That was my own measurement error, not product behaviour: several calendar tabs were open, and each re-recorded its own displayed week into the one key. With a single calendar tab, `الفترة التالية` twice moved `١٨–٢٤ نوفمبر` → `٢٥ نوفمبر – ١ ديسمبر` (`٤ تدريبات`, `anchor=2026-11-25`) → `٢–٨ ديسمبر` (`٤ تدريبات`, `anchor=2026-12-02`), and a fresh `/en` tab restored `٢–٨ ديسمبر ٢٠٢٦` with `٤ تدريبات` and `dir=rtl`. The earlier claim is withdrawn rather than left open. A `2029-03-05` write seen in the same multi-tab phase was not reproduced under the single-tab protocol and counts as no evidence.

Still not exercised: click-based date-picker entry, month view, cold offline launch, empty store, protected update with pending work and same-original reconnect. Chrome-level JavaScript from Apple Events and macOS accessibility/screen capture are unavailable to this client, so nothing here reads the installed app's DOM or pixels.

## 19 November installed-app cases, and a correction to the relaunch claim

The macOS capability this pass previously reported as unavailable is now granted. The Owner enabled `OpenCode.app` under **Privacy & Security → Device Control and Data Access** (macOS 27.3 consolidates the former Accessibility, Screen Recording and Automation lists into one per-app switch). Measured after the grant: `UI elements enabled` = `true`, System Events can read Chrome window titles, keystrokes are accepted, and `screencapture` returns real pixels. The earlier instruction pointing at a separate "Accessibility" pane was wrong for this OS version.

**The installed app's profile is `nahr`.** A relay probe tab opened into the same Chrome window that held the staging workspace, and that window's avatar is the `Nahr` profile. Its device storage was empty at that point (only Clerk keys, no `academyos.register-account.v1`), which is why no launch key had ever been written there and why the earlier session restore reading was inconclusive. The app's own **Device → Use this personal device** control was used on the calendar route; the register account then became `active`, a workspace slot appeared and the launch key was written.

### Warm relaunch is Chrome window restore; the stored week applies on a cold start

Two relaunches under different starting states do not agree, and the difference is meaningful:

| Starting state | Stored key at quit | Result |
|---|---|---|
| App window at `/en/…/calendar?anchor=2026-11-19` | `/ar/…/calendar?anchor=2026-11-26` | relaunched to **`/ar/…/anchor=2026-11-26`** — followed the key |
| App window at `/ar/…/calendar?anchor=2026-11-26` | `/en/…/calendar?anchor=2026-12-09` | relaunched to **`/ar/…/anchor=2026-11-26`** — followed the window, ignoring the key |

So the correct claim is narrower than the one recorded on 18 November: when the app starts at its `start_url` the remembered week is applied, and when Chrome restores the previous app window that window's URL wins. The manifest is served with `start_url: /en`, `scope: /`, `display: standalone`, matching `apps/web/src/app/manifest.ts`. The cold-start path was verified twice at application level — a fresh `/en` entry replaced to the anchored week (`2026-11-25`, later `2026-12-09`) rather than staying on the shell route.

Pixel evidence for the restored window: the app window titled `AcademyOS Staging`, `dir=rtl`, heading `٢٦ نوفمبر – ٢ ديسمبر ٢٠٢٦`, `٤ تدريبات`, date field `26/11/2026`, footer `تم التحقق في ٤:١٨ م · من البيانات المحضرة على جهازك.` and the `متصل` device badge. This is a real window capture, not an inferred URL.

### Month view and click-based date entry

| Case | Observed |
|---|---|
| `Month` view on November | heading `November 2026`, full period rendered from `Sun 1 Nov`; the key kept `anchor=2026-11-19` because month view records `displayedFrom` (the day), not the grid start — expected, not a regression |
| Typed `2026-12-09` into *Go to date* and pressed Enter | heading became `December 2026`; key became `…?anchor=2026-12-09` |
| Fresh `/en` after that entry | replaced to `9 – 15 Dec 2026` (week view) at `anchor=2026-12-09` |

### A crash I caused, and its recovery

Isolating the app window for a screenshot by minimising the other Chrome windows and restoring them killed Chrome at 03:55:07 (`~/Library/Logs/DiagnosticReports/Google Chrome-2026-11-19-035507.ips`; the restore call then returned `-609 connection is invalid`). Chrome restarted to the profile picker with no windows. `--restore-last-session` returned an empty window, and the recoverable state was the **Restore pages?** bubble in the `Nahr` profile. The Owner clicked Restore; all four windows came back, including the app window. Window capture now avoids this entirely by reading window IDs through CoreGraphics rather than moving or minimising windows.

### Still not exercised

Cold offline launch, empty store, protected update with pending work and same-original reconnect remain open. They need a prepared store plus a controlled offline transition on the installed app; nothing in this pass should be read as covering them.

The 19 November record itself is documentation only (checkpoint section, structured receipt, tracker next action and regenerated continuation). Its Foundation run `44443618633` attempt 1 passed 55/55 on `fd7a962e4a5f53ceec3c0d54dfdad0370ccbb30f`; no product source changed, so that run adds no runtime or hosted assertion.

One contradiction is recorded rather than smoothed over: the 18 November entry says Players and Calendar were prepared in this same `nahr` profile, yet on 19 November that origin held only Clerk keys — no register account, no slot, no launch key. The preparation was absent by then and was redone. What removed it was not determined, and no cause is claimed; the two dated observations stand separately. The receipt headline now reads `checked_release_ready_installed_cases_partial` so a later reader is not told the installed cases are complete.

## 19 November installed-device offline cases — cold launch fails, empty store is blank

A controlled offline transition is possible without touching the machine's network: the relay's `emulate` applies CDP network conditions to one tab, so the Owner's connection and this agent's own session are unaffected. The boundary that matters is that this drives a **normal Chrome tab** in the same profile and origin — same service worker, same caches, same IndexedDB, same session — not the installed app window, which the relay cannot address. Installed-app offline behaviour at OS level therefore remains unmeasured.

### Cold offline launch, prepared device (`nahr`)

| Step | Observed |
|---|---|
| Baseline online | calendar rendered `19 – 25 Nov 2026`; `navigator.serviceWorker.controller` present |
| Tab set offline | `navigator.onLine` false |
| Navigate to start_url `/en` | redirected to `/en/workspace/<academy>/calendar?anchor=2026-11-19` |
| Settled result | public shell with **`Sign-in unavailable. Retry.`** — no prepared calendar, no sessions |
| Local identity at that moment | `academyos.register-account.v1` mode `active` with subject and generation; workspace slot present; IndexedDB `academyos-owner-workspace-v1` present |
| Caches | `academyos-workspace-public-v1:index` (1) and `…:<uuid>` (26) — the public shell only |
| Control: same URL back online | full calendar, `19 – 25 Nov 2026`, Academy Owner |

**This case fails.** The prepared store is never consulted offline. The structural cause is visible in source: `apps/web/src/components/experience-workspace.tsx:31` returns the public workspace while `useUser().isLoaded` is false, and line 32 returns the sign-in link when there is no `session.user`; both run before `ExperienceJourney` and therefore before `useOwnerWorkspaceDevice` can read prepared data. Offline, Clerk cannot resolve, so after 15 s the page reports `Sign-in unavailable. Retry.`

No repair was attempted. Making prepared data reachable while Clerk is unresolved is an authority-gating change, and the accepted contracts forbid weakening authority or exposing private data to satisfy a test. It needs an explicit decision and a design that keeps denial, revocation and account-fencing checks intact.

### Empty store (`dokkanni`, no register account and no launch key)

| Step | Observed |
|---|---|
| Online calendar | rendered normally as Academy Owner; `academyos.register-account.v1` and launch key both absent |
| Offline `/en` | `about:blank` — blank document, no shell, no error panel, no stale data |
| Why | the profile had no service worker for this origin at that point; after one online `/en` visit two registrations appear (`/prepared-register`, `/`) and both `academyos-prepared-public-v1:*` (17 each) and `academyos-workspace-public-v1:*` (26 each) caches fill |

The blank is therefore about never having loaded the shell in that profile, not about prepared data leaking or failing. It is recorded as measured, with that boundary, and is not claimed as evidence about a device that has visited `/en` once.

### Not attempted

Protected update with pending work and same-original reconnect. Both need a controllable worker version change and an eligible session with a markable register; neither was staged in this pass.

### Why the offline gate cannot resolve: the auth bundle is third-party and uncached

The failure above is not a missing prop or a transient Clerk hiccup. The page loads Clerk's browser client from a third-party origin:

```
https://immune-grizzly-7875.clerk.accounts.dev/npm/@clerk/clerk-js@6/dist/clerk.browser.js
```

Offline that request cannot succeed, `window.Clerk` stays `undefined`, so `useUser().isLoaded` never becomes true and `experience-workspace.tsx:31` keeps returning the public workspace. Measured at the same moment: the origin's two caches hold **27 entries, 0 of them from the Clerk origin** (`academyos-workspace-public-v1`, `academyos-prepared-public-v1` only). Nothing in the app's own worker could serve that script.

A second, related gap: `publicOffline` is threaded through `useOwnerWorkspaceDevice` and `ExperienceJourney` (it renders without the account control, skips prefetch and allows `/players` and `/calendar` navigation), but **no route passes it**. The only `prepared` wiring is `ownerWorkspaceEnabled(process.env)` on the calendar and players pages. The offline-rendering affordance therefore exists in the component and is unreachable in the product.

So cold offline launch fails for an architectural reason: a protected route mounts Clerk, Clerk is a runtime third-party dependency, and the prepared store sits behind that gate. This is a decision about where authority metadata may come from at cold start, not a one-line repair.
