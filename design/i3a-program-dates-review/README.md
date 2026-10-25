# I3a connected draft-program design review

25 October2026. [Accepted policy](../../docs/06-delivery/i3a-program-dates-decisions.md) authorizes this design preparation only. **Design approval pending; no product program/session source, database migration or deployment.**

Open `http://127.0.0.1:3207/` while the local server is running. Rebuild with `node scripts/design/build_i3a_review.mjs`; serve this folder with a loopback-only HTTP server. No new dependency installed. Original reference unchanged.

## Review the connected outcome

1. Empty draft-program directory → New program.
2. Review visible fictional branch/sport and saved Africa/Cairo timezone. Edit name, inclusive date range, weekdays and same-day times.
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
