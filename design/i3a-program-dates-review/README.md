# I3a connected draft-program design review

25 October2026. [Accepted policy](../../docs/06-delivery/i3a-program-dates-decisions.md) authorizes this design preparation only. **Design approval pending; no product program/session source, database migration or deployment.**

Open `http://127.0.0.1:3207/` while the local server is running. Rebuild with `node scripts/design/build_i3a_review.mjs`; serve this folder with a loopback-only HTTP server. No new dependency installed. Original reference unchanged.

## PYSA reference follow-up

Moamen requested a full PYSA scheduling review before proceeding with this design. See the [source and workflow comparison](../../docs/03-design/pysa-scheduling-reference-review.md). The current preview covers draft generation only; it is not the complete scheduling vision. Policy remains accepted; connected design approval remains pending. Recommended next design work retains the bounded policy and makes the program/date workspace connection clearer.

## Review the connected outcome

1. Empty draft-program directory → New program.
2. Review visible fictional branch/sport and saved Africa/Cairo timezone. Edit name, inclusive date range, weekdays and separate same-day start/end times for each selected weekday.
3. Preview every generated date. Local dates/times and timezone are visible; exact UTC instants expand on demand. Changing details invalidates the preview.
4. Continue to confirmation → affirm all dates/timezone reviewed → Save draft program.
5. Pending disables resubmission. The simulated receipt opens the saved draft. Back to directory → reopen the same simulated program. All dates remain Owner-only drafts; no publish, roster, assignment or financial effect.
6. Switch EN/AR; test phone and desktop. Desktop keeps sidebar/center/inspector; phone uses central list/form/date preview then full detail/review with Back. No imitation OS controls or decorative unavailable product actions.

Top review controls are **outside the product** and labelled simulation. Scenarios: normal, directory loading, preview unavailable, daylight-saving rejection example, changed context, committed-response-loss, did-not-commit cancellation, confirmed-save/read-failure, directory-read failure and denied authority. Use Check original operation only for unknown writes; a confirmed save with failed read offers read retry only. Scenario changes/reset/reload erase the demonstration. All simulated records exist in React memory; no sessionStorage/database persistence.

## Evidence and limits

[Automated design-model/browser receipt](evidence/verification.json), screenshots in `evidence/`, [source hashes](source-manifest.json). `node scripts/design/test_i3a_review.mjs` tests real compiled preview UI, complete date counts, input bounds, DST ambiguity/gap using runtime timezone data, edit/review/pending/recovery paths, read-denial presentation, EN/AR320/360/926/1440 reflow and no external requests/page errors. It is **not** a permission, transaction, current server timezone, production performance, accessibility or hosted-persistence test. Design-only date conversion must not be transplanted as database authority. Runtime table sampling is only for this example; server implementation requires its own deterministic conversion tests.

Browser control in this chat returned disabled when opening the preview; local headless rendering and screenshots were inspected. `open_in_codex` queued the local preview for the user. No claim of an interactive owner review or acceptance until explicitly received.

## Traceability and remaining gates

J09-A01 / IMP-J09-A01; S22/S23/S25; L07; SEC-J09; related AO-021/022/029 and AT equivalents are partial context, not completed edit/history/conflict requirements. Full action/security/loading preparation: [I3a engineering packet](../../docs/04-engineering/i3a-program-dates-preparation.md). Related recurrence editing, Trainer assignments, roster/capacity, publication, family access, attendance and financial consequences remain separate. No new recipient/grant or hosted effect occurs here.

## PYSA-informed connected refinement — 25 October 2026

Owner requested starting the recommended continuation. Local design now explains the program/dated-session relationship; an empty planning state leads to the editor, live recurrence summary, complete date preview, confirmation and saved detail. Saved programs can be browsed as Programs or Draft dates; each derived date opens its source draft and Back retains the chosen view. No calendar, assignments, roster, attendance, publication or financial operation is implied. These are simulated reads of the same in-memory records, not additional database operations.

Desktop uses the existing contextual inspector for the live summary; phone/medium uses an expandable summary with the proposed count always visible in its heading. Weekdays use a stable grid, steps identify the current task, and the inline saved branch/timezone avoids an extra context-opening step. The initial28-day/20-date bounds and all failure/recovery scenarios remain.

Rebuilt and checked with standalone TypeScript and the existing model/browser suite plus new live-count, date-view, Back-retention and Arabic-phone-summary assertions. Retained screenshots include `evidence/10-draft-dates-en-1440.png` and `evidence/11-live-summary-ar-360.png`. Browser control still returned disabled; screenshots/headless interaction were inspected, with no claim of live Owner interaction or physical-device verification. Final test receipt remains [verification.json](evidence/verification.json).

Design review remains pending. This refinement changes no product source, schema, provider, account, grant or staging deployment. Prior accepted journey/business decisions remain intact.

## Weekday-specific time revision — 25 October 2026

Owner requested different times within the same program rather than approving the preceding design. Each selected weekday now has its own start/end controls, live summary row, generated times and saved definition. Fictional seed: Sunday17:00–18:00, Tuesday19:00–20:00, Thursday18:00–19:00; these are design examples, not product defaults. Changing a weekday time invalidates any previous preview. No common time pair is imposed across the program. The inclusive28-day date range and20-date bound remain unchanged and the range error explains the distinction.

Standalone TypeScript and local model/browser tests passed, including weekday-specific generation/edit/reopen and existing EN/AR320/360/926/1440, DST and recovery cases. Inspected the updated desktop and Arabic-phone screenshots. Database/API implementation, hosted deployment, physical-device proof and connected design approval remain pending. Reload the local preview to use this revision; reset/reload clears simulation records.

## Longer-period revision — 25 October 2026

Owner agreed to removing the whole-program28-day/20-date cap and separating duration from work windows. Choose the full period; live summary gives its total, then review dates in28-day windows. Previous/Next show each inclusive window range, confirmation remains blocked until every window passes validation, and saved program/date views remain paged. Weekday-specific times are preserved. Example verified:1Nov2026–31Jan2027 produces40 dates across4 windows. A DST error in a later window cannot be skipped to save.

The revised [engineering proposal](../../docs/04-engineering/i3a-program-dates-preparation.md) supersedes the original all-dates-in-one-transaction approach for long periods. This simulation holds reviewed rows in memory; it does not implement durable generation, job quotas, server validation, progress or hosted recovery. Those must be reviewed before product implementation; no unlimited production duration claim is made. Earlier28-day/20-date whole-program statements above describe superseded revisions.

Current evidence includes `evidence/12-long-program-last-window-en-360.png` and `evidence/13-long-program-saved-ar-1440.png`. Connected design review remains pending, including the changed long-period save/recovery contract. Product/schema/deployment status remains unchanged.

## Open-tab discrepancy and verification — 26 October 2026

Moamen supplied a screenshot showing the superseded28-day error and questioned the earlier40-date test claim. Existing saved test receipt and a fresh complete local Chromium rerun passed the92-day/40-date/four-window case. Inspection found no listener on3207; restarted with `python3 scripts/design/serve_i3a_review.py`. Build now versions JS/CSS asset URLs; this dedicated loopback server sends no-store. HTTP readback confirmed served bytes match disk. The older tab was observed with the old error; this does not conclusively distinguish cached assets from an already-loaded older document.

Reloaded the actual existing IAB tab and restored the visible screenshot inputs via native UI:1Nov2026–1Feb2027, Sunday/Tuesday/Wednesday/Thursday/Friday with their visible weekday times. Summary showed66 proposed dates; all4 windows opened, last window6 rows, and final confirmation showed66 dates. Left at review, unchecked and unsaved. [Serving/browser receipt](evidence/serving-verification-2026-10-26.json), [actual-tab review screenshot](evidence/15-user-tab-66-date-review-2026-10-26.png). Locator date fill did not reliably update React state in this IAB; native setValue plus blur did. Do not label that a product date-input defect from automation alone. No database/provider/product deployment or owner acceptance resulted.

The earlier40-date claim refers to three weekdays through31Jan; the screenshot's five weekdays through1Feb is a different66-date example. Earlier statements did not establish that the user's open document had loaded the revision. Future preview reports must distinguish source build, isolated test server, served asset readback and actual open-tab proof.

## Preparation/recovery design completion — 26 October 2026

[Current action contract](../../docs/06-delivery/i3a-program-preparation-design-contract.md). Save now first acknowledges one program, then simulates sequential window preparation and a separate final check. Only a ready record exposes saved dates. Pause/Back/reopen/resume, failed-window retry, incomplete-original reconciliation, failed final check and access-ended-before-resume scenarios are available. Ready and preparing directory rows differ; partial dates are excluded from ready-date browsing. All transitions remain in memory; reset/reload still clears the simulation, with no real job or reload durability.

New focused tests cover one original record through pause/reopen/resume; retry preserving exact40 dates; unknown receipt finding incomplete work without fake success; failed final check not ready at4/4; manual timer pause; denied resume clearing private projection; EN/AR preparation reflow. Early test runs failed on a table-cell text selector and attempting a language switch before pending acknowledgement had finished; assertions were corrected to the intended exact cell/current paused state, not weakened. Current test receipt records running/failed/passed explicitly to avoid reusing a stale successful receipt after failure. Review that receipt for final status.

Connected design approval remains pending. Source simulation, local tests, actual-tab proof, product implementation, hosted deployment and owner acceptance remain separate. No invitations, memberships or production effects are created.

### Final served and actual-tab proof — 26 October 2026

[Final serving/actual IAB receipt](evidence/preparation-design-serving-2026-10-26.json): served JS/CSS match disk; actual existing tab shows reviewed program definition centrally and paused preparation alongside it,12/40 dates and1/4 windows, not ready, Resume original program visible. [Actual-tab screenshot](evidence/18-user-tab-preparation-paused-2026-10-26.png) retains surrounding context and crops unused lower viewport space. Left open at paused simulation for Owner review. Native popup selection was needed: locator selectOption could change the displayed scenario without reliably committing React state in this IAB; an initial normal-ready run was not counted as pause proof. Final Chromium model/browser suite and standalone TypeScript passed after the central-pane refinement; link/register validation passed. No product deployment or design acceptance inferred.

## Connected-design approval — 26 October 2026

Moamen explicitly selected “Approve completed draft-program design for implementation”: full-period Owner-only drafts, weekday-specific times, bounded reviewed date windows, preparation progress, pause/reopen/resume, failure/reconciliation and ready-only saved dates. This supersedes pending connected-design status above for this bounded slice. It authorizes product implementation, not assignments, publication, access grants, real data or production launch. Working-feature acceptance, hosted verification and independent security review remain separate.
