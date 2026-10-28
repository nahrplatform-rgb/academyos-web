# I5a — development feedback preview

[Accepted policy for design](../../docs/06-delivery/i5a-development-feedback-decisions.md), [connected contract](../../docs/06-delivery/i5a-development-feedback-design-contract.md). **Separate design approval pending.**

Open http://127.0.0.1:3225/. Build with `node scripts/design/build_i5a_review.mjs`, serve with `python3 scripts/design/serve_i5a_review.py`, verify with `node scripts/design/test_i5a_review.mjs` using the existing Node24 dependencies.

This is an in-memory fictional simulation. No login, API, database, email, account changes or hosted persistence. Reload/reset clears it. The actor/scenario controls above the app are review tools, not product permission controls. The example session has ended under the labeled fixed demo clock.

Try Alex Demo → Write feedback → fill the three public fields and optional private staff note → Review submission → Submit → Finish simulated response. Switch the review actor to Academy Owner → Alex → Request changes and enter a reason, or Review publication → Confirm → Finish response. Switch to Guardian to read Alex's published feedback only. Switch back to Trainer to propose an amendment; until its publication, Guardian keeps seeing the old version. Owner can withdraw the current publication and reopen retained internal submissions/publications in history.

Try failed/empty/loading, not-ended, ended assignment, same-account reviewer, revoked/foreign access, concurrent draft, rejected save, lost replies and confirmed-save/read-failure. Choose a scenario before starting the action; Finish simulated response and original-operation recovery are review tools. EN/AR preserves draft text. On phones, open a player then use Back to return to the list.

[Checks](evidence/checks.json) cover presentation and simulated transitions only. Screenshots include Trainer authoring and Owner review in EN/AR at360/1440px and Guardian at360px. Source hashes identify shared shell/panes/controls/global styles used. Actual authorization, database snapshots, concurrency, hosted recovery, physical devices, performance and cost are unverified by this preview.
